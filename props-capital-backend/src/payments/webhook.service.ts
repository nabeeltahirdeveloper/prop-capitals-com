import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';
import * as crypto from 'crypto';

// Handles the Xoala server-to-server notification/callback.
// Xoala POSTs the final transaction result to the notificationUrl that
// was passed in the original /transactionServices/REST/v1/payments call.
@Injectable()
export class XoalaWebhookService {
  private readonly logger = new Logger(XoalaWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {}

  private requireString(value: any, field: string): string {
    if (value === undefined || value === null || `${value}`.trim() === '') {
      throw new BadRequestException(`Missing or invalid field: ${field}`);
    }
    return `${value}`.trim();
  }

  // Xoala sends descriptive statuses in the payload (e.g. "capturesuccess",
  // "capturefailed", "3DS", "captured"). Their docs document the SHORT status
  // (Y / N / C / P / 3D) and the checksum is usually computed against either
  // the raw payload status OR a normalized short code. We try both candidates
  // so the integration is resilient to either variant.
  private toShortStatus(raw: string): string | null {
    const s = String(raw || '')
      .trim()
      .toLowerCase();
    if (
      [
        'y',
        'success',
        'capturesuccess',
        'capture_success',
        'captured',
        'paid',
      ].includes(s)
    )
      return 'Y';
    if (
      [
        'n',
        'fail',
        'failed',
        'capturefail',
        'capturefailed',
        'capture_failed',
        'declined',
      ].includes(s)
    )
      return 'N';
    if (['c', 'cancelled', 'canceled', 'voided'].includes(s)) return 'C';
    if (['p', 'pending'].includes(s)) return 'P';
    if (['3d', '3ds', 'threeds'].includes(s)) return '3D';
    return null;
  }

  // Response/callback checksum (Standard Checkout spec):
  //   MD5( paymentId | merchantTransactionId | amount | status | secureKey )
  private verifyChecksum(payload: any, paymentId: string): void {
    const secureKey = this.configService.get<string>('XOALA_SECURE_KEY');
    if (!secureKey) {
      throw new BadRequestException('Missing XOALA_SECURE_KEY in env');
    }

    const incoming = this.requireString(payload.checksum, 'checksum');
    const merchantTransactionId = this.requireString(
      payload.merchantTransactionId,
      'merchantTransactionId',
    );
    const amount = this.requireString(payload.amount, 'amount');
    const rawStatus = this.requireString(payload.status, 'status');

    const candidates: string[] = [rawStatus];
    const short = this.toShortStatus(rawStatus);
    if (short && short !== rawStatus) candidates.push(short);

    for (const status of candidates) {
      const source = [
        paymentId,
        merchantTransactionId,
        amount,
        status,
        secureKey,
      ].join('|');
      const expected = crypto.createHash('md5').update(source).digest('hex');
      if (incoming.toLowerCase() === expected.toLowerCase()) {
        this.logger.log(
          `Xoala checksum matched for ref=${merchantTransactionId} using status="${status}"`,
        );
        return;
      }
    }

    this.logger.warn(
      `Xoala checksum mismatch ref=${merchantTransactionId} statuses_tried=[${candidates.join(',')}] incoming=${incoming}`,
    );
    throw new BadRequestException('Invalid callback checksum');
  }

  private normalizeStatus(raw: string): 'pending' | 'failed' | 'succeeded' {
    const short = this.toShortStatus(raw);
    if (short === 'Y') return 'succeeded';
    if (short === 'N' || short === 'C') return 'failed';
    return 'pending';
  }

  async handleCallback(payload: any) {
    const merchantTransactionId = this.requireString(
      payload.merchantTransactionId,
      'merchantTransactionId',
    );
    // Xoala sends the gateway transaction id as paymentId or trackingid.
    const providerPaymentId = this.requireString(
      payload.paymentId ?? payload.trackingid,
      'paymentId',
    );
    const amountRaw = this.requireString(payload.amount, 'amount');
    const statusRaw = this.requireString(payload.status, 'status');

    this.logger.log(
      `Xoala callback received: merchantTransactionId=${merchantTransactionId}, paymentId=${providerPaymentId}, status=${statusRaw}`,
    );
    // Full sanitized payload — useful for diagnosing checksum issues without
    // leaking secureKey (Xoala never sends it back anyway).
    this.logger.log(
      `Xoala callback payload: ${JSON.stringify(payload).slice(0, 1000)}`,
    );

    this.verifyChecksum(payload, providerPaymentId);

    const payment = await this.prisma.payment.findUnique({
      where: { reference: merchantTransactionId },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment not found for reference: ${merchantTransactionId}`,
      );
    }

    const callbackAmountCents = Math.round(Number(amountRaw) * 100);
    if (Number.isNaN(callbackAmountCents)) {
      throw new BadRequestException('Invalid amount');
    }
    if (payment.amount !== callbackAmountCents) {
      this.logger.warn(
        `Amount mismatch: stored=${payment.amount}c, callback=${callbackAmountCents}c (raw="${amountRaw}")`,
      );
      throw new BadRequestException('Payment amount mismatch');
    }

    const nextStatus = this.normalizeStatus(statusRaw);

    // Never downgrade a succeeded payment — just refresh metadata.
    if (payment.status === 'succeeded') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerPaymentId,
          orderStatus: statusRaw,
          callbackPayload: payload,
          failureReason: payload.resultDescription
            ? String(payload.resultDescription)
            : null,
        },
      });
      return { ok: true, message: 'Payment already processed' };
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId,
        orderStatus: statusRaw,
        callbackPayload: payload,
        failureReason: payload.resultDescription
          ? String(payload.resultDescription)
          : null,
        status: nextStatus,
      },
    });

    this.logger.log(
      `Xoala callback processed: ref=${updatedPayment.reference}, status=${updatedPayment.status}`,
    );

    if (nextStatus === 'succeeded') {
      try {
        const account =
          await this.paymentsService.provisionChallengeAfterPaymentSuccess(
            payment.id,
          );
        this.logger.log(
          `Provisioning completed: payment=${payment.id}, account=${account?.id}`,
        );
      } catch (err: any) {
        this.logger.error(
          `Provisioning failed for payment ${payment.id}: ${err?.message}`,
          err?.stack,
        );
      }

      const linkId = (updatedPayment.metadata as any)?.brandLinkId;
      if (linkId) {
        try {
          await (this.prisma as any).directPurchaseLink.update({
            where: { id: linkId },
            data: { conversions: { increment: 1 } },
          });
        } catch (err: any) {
          this.logger.warn(
            `Failed to increment conversions for link ${linkId}: ${err?.message}`,
          );
        }
      }
    }

    return {
      ok: true,
      message: 'Callback processed successfully',
      paymentStatus: updatedPayment.status,
    };
  }
}
