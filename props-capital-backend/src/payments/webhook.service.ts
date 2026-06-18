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
import { TradingAccountStatus } from '@prisma/client';
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

  // Post-payment reversal events Xoala may push to the same callback URL:
  // a chargeback (card-network dispute) or a refund/reversal. These arrive
  // AFTER a payment already succeeded, so they must be allowed to override
  // an already-`succeeded` payment (see handleReversal). Returns the terminal
  // status to set, or null for a normal forward payment result.
  private reversalStatus(raw: string): 'chargedback' | 'refunded' | null {
    const s = String(raw || '')
      .trim()
      .toLowerCase();
    if (['chargeback', 'chargedback', 'charge_back'].includes(s))
      return 'chargedback';
    if (['refund', 'refunded', 'reversal', 'reversed'].includes(s))
      return 'refunded';
    return null;
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

    // A chargeback/refund arrives after the original payment, so it may carry
    // a partial (refund) or full (chargeback) amount — don't enforce strict
    // equality for those, only for forward payment results.
    const reversal = this.reversalStatus(statusRaw);

    const callbackAmountCents = Math.round(Number(amountRaw) * 100);
    if (Number.isNaN(callbackAmountCents)) {
      throw new BadRequestException('Invalid amount');
    }
    if (!reversal && payment.amount !== callbackAmountCents) {
      this.logger.warn(
        `Amount mismatch: stored=${payment.amount}c, callback=${callbackAmountCents}c (raw="${amountRaw}")`,
      );
      throw new BadRequestException('Payment amount mismatch');
    }

    // Chargeback / refund: override the payment status even if it was already
    // `succeeded`, and disable the provisioned challenge account.
    if (reversal) {
      return this.handleReversal(
        payment,
        reversal,
        statusRaw,
        providerPaymentId,
        payload,
      );
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

  // Handles a chargeback/refund callback. Unlike a normal result, this is
  // allowed to override an already-`succeeded` payment and revokes the
  // provisioned challenge account so the customer can't keep an account they
  // charged back / had refunded.
  private async handleReversal(
    payment: any,
    reversal: 'chargedback' | 'refunded',
    statusRaw: string,
    providerPaymentId: string,
    payload: any,
  ) {
    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId,
        orderStatus: statusRaw,
        callbackPayload: payload,
        failureReason: payload.resultDescription
          ? String(payload.resultDescription)
          : `Payment ${reversal} (status="${statusRaw}")`,
        status: reversal,
      },
    });

    this.logger.warn(
      `Xoala ${reversal} callback: ref=${updatedPayment.reference}, payment marked "${reversal}"`,
    );

    // Disable the provisioned trading account, if any.
    if (payment.tradingAccountId) {
      try {
        await this.prisma.tradingAccount.update({
          where: { id: payment.tradingAccountId },
          data: { status: TradingAccountStatus.DISQUALIFIED },
        });
        this.logger.warn(
          `Disabled trading account ${payment.tradingAccountId} due to ${reversal} on ref=${updatedPayment.reference}`,
        );
      } catch (err: any) {
        this.logger.error(
          `Failed to disable trading account ${payment.tradingAccountId} for ${reversal} ref=${updatedPayment.reference}: ${err?.message}`,
          err?.stack,
        );
      }
    } else {
      this.logger.warn(
        `No trading account linked to ref=${updatedPayment.reference}; nothing to disable for ${reversal}`,
      );
    }

    return {
      ok: true,
      message: `Payment ${reversal}; account disabled`,
      paymentStatus: updatedPayment.status,
    };
  }
}
