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
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`Missing or invalid field: ${field}`);
    }
    return value.trim();
  }

  private generateHash(payload: any, merchantPass: string): string {
    const id = this.requireString(payload.id, 'id');
    const orderNumber = this.requireString(payload.order_number, 'order_number');
    const orderAmount = this.requireString(payload.order_amount, 'order_amount');
    const orderCurrency = this.requireString(payload.order_currency, 'order_currency');
    const orderDescription = this.requireString(
      payload.order_description,
      'order_description',
    );

    const source =
      id +
      orderNumber +
      orderAmount +
      orderCurrency +
      orderDescription +
      merchantPass.trim();

    const upperSource = source.toUpperCase();
    const md5 = crypto.createHash('md5').update(upperSource).digest('hex');
    return crypto.createHash('sha1').update(md5).digest('hex');
  }

  private verifyHash(payload: any) {
    const merchantPass = this.configService.get<string>('WORLDCARD_MERCHANT_PASS');

    if (!merchantPass) {
      throw new BadRequestException('Missing WORLDCARD_MERCHANT_PASS in env');
    }

    const incomingHash = this.requireString(payload.hash, 'hash');
    const expectedHash = this.generateHash(payload, merchantPass);

    if (incomingHash.toLowerCase() !== expectedHash.toLowerCase()) {
      this.logger.warn(
        `WorldCard hash mismatch for order_number=${payload?.order_number}`,
      );
      throw new BadRequestException('Invalid callback hash');
    }
  }

  private normalizePaymentStatus(payload: any): 'pending' | 'failed' | 'succeeded' {
    const type = String(payload.type || '').toLowerCase();
    const status = String(payload.status || '').toLowerCase();
    const orderStatus = String(payload.order_status || '').toLowerCase();

    if (type === 'sale' && status === 'success' && orderStatus === 'settled') {
      return 'succeeded';
    }

    if (status === 'fail' || orderStatus === 'decline') {
      return 'failed';
    }

    return 'pending';
  }

  async handleCallback(payload: any) {
    this.logger.log(`WorldCard callback received: order_number=${payload?.order_number}, type=${payload?.type}, status=${payload?.status}, order_status=${payload?.order_status}`);
    console.log("🔥 CALLBACK RECEIVED:", payload);
    this.verifyHash(payload);

    const orderNumber = this.requireString(payload.order_number, 'order_number');
    console.log("order_number:", payload.order_number);
    const orderAmount = this.requireString(payload.order_amount, 'order_amount');
    const orderCurrency = this.requireString(payload.order_currency, 'order_currency');
    const providerPaymentId = this.requireString(payload.id, 'id');

    const payment = await this.prisma.payment.findUnique({
      where: { reference: orderNumber },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment not found for reference: ${orderNumber}`,
      );
    }

    // Compare amounts — payment.amount is stored as integer cents
    // WorldCard sends order_amount as string in dollars e.g. "499.00"
    const callbackAmountCents = Math.round(Number(orderAmount) * 100);

    if (Number.isNaN(callbackAmountCents)) {
      throw new BadRequestException('Invalid order_amount');
    }

    if (payment.amount !== callbackAmountCents) {
      this.logger.warn(
        `Amount mismatch: stored=${payment.amount}c, callback=${callbackAmountCents}c (raw="${orderAmount}")`,
      );
      throw new BadRequestException('Payment amount mismatch');
    }

    if (payment.currency.toUpperCase() !== orderCurrency.toUpperCase()) {
      throw new BadRequestException('Payment currency mismatch');
    }

    const nextStatus = this.normalizePaymentStatus(payload);

    // Never downgrade a succeeded payment — just update metadata
    if (payment.status === 'succeeded') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerPaymentId,
          orderStatus: String(payload.order_status || ''),
          operationType: String(payload.type || ''),
          callbackPayload: payload,
          failureReason: payload.reason ? String(payload.reason) : null,
        },
      });
      console.log("🔥 CALLBACK RECEIVED:", payload);
      console.log("REFERENCE:", payload.order_number);
      console.log("STATUS:", payload.status);
      console.log("TYPE:", payload.type);
      console.log("ORDER STATUS:", payload.order_status);
      return {
        ok: true,
        message: 'Payment already processed',
      };
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerPaymentId,
        orderStatus: String(payload.order_status || ''),
        operationType: String(payload.type || ''),
        callbackPayload: payload,
        failureReason: payload.reason ? String(payload.reason) : null,
        status: nextStatus,
      },
    });

    this.logger.log(
      `WorldCard callback processed: ref=${updatedPayment.reference}, status=${updatedPayment.status}`,
    );

    // Provision trading account exactly once on first success
    if (nextStatus === 'succeeded') {
      try {
        const account = await this.paymentsService.provisionChallengeAfterPaymentSuccess(payment.id);
        this.logger.log(`Provisioning completed: payment=${payment.id}, account=${account?.id}`);
      } catch (err: any) {
        this.logger.error(
          `Provisioning failed for payment ${payment.id}: ${err?.message}`,
          err?.stack,
        );
      }
    }

    return {
      ok: true,
      message: 'Callback processed successfully',
      paymentStatus: updatedPayment.status,
    };
  }
}
