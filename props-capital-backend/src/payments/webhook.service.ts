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

// Handles the Xoala "Standard Checkout" notification/callback
// (POST {base}/transaction/Checkout flow). Xoala POSTs the result to the
// notificationUrl configured in the merchant dashboard.
@Injectable()
export class WorldCardWebhookService {
  private readonly logger = new Logger(WorldCardWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) { }

  private requireString(value: any, field: string): string {
    if (value === undefined || value === null || `${value}`.trim() === '') {
      throw new BadRequestException(`Missing or invalid field: ${field}`);
    }
    return `${value}`.trim();
  }

  // Response/callback checksum (Standard Checkout spec):
  //   MD5( paymentId | merchantTransactionId | amount | status | secureKey )
  private verifyChecksum(payload: any, paymentId: string): void {
    const secureKey = this.configService.get<string>('XOALA_SECURE_KEY');
    if (!secureKey) {
      throw new BadRequestException('Missing XOALA_SECURE_KEY in env');
    }

    const incoming = this.requireString(payload.checksum, 'checksum');
    const source = [
      paymentId,
      this.requireString(payload.merchantTransactionId, 'merchantTransactionId'),
      this.requireString(payload.amount, 'amount'),
      this.requireString(payload.status, 'status'),
      secureKey,
    ].join('|');
    const expected = crypto.createHash('md5').update(source).digest('hex');

    if (incoming.toLowerCase() !== expected.toLowerCase()) {
      this.logger.warn(
        `Xoala checksum mismatch for merchantTransactionId=${payload?.merchantTransactionId}`,
      );
      throw new BadRequestException('Invalid callback checksum');
    }
  }

  private normalizeStatus(raw: string): 'pending' | 'failed' | 'succeeded' {
    const s = raw.trim().toUpperCase();
    if (s === 'SUCCESS' || s === 'Y') return 'succeeded';
    if (s === 'FAILED' || s === 'FAIL' || s === 'N' || s === 'C') return 'failed';
    return 'pending'; // P, 3D, PENDING, anything else
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
