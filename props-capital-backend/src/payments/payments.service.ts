import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { TradingPhase, TradingAccountStatus, NotificationType, NotificationCategory } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';

import { generatePassword } from 'src/utils/generate-password.util';
import { EmailService } from 'src/email/email.service';

@Injectable()

export class PaymentsService {

  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private couponsService: CouponsService,
    private readonly configService: ConfigService,
  ) { }

  // ─── Platform normalization (shared) ───────────────────────────────

  private readonly platformMap: Record<string, string> = {
    'MT4': 'MT4',
    'MT5': 'MT5',
    'cTrader': 'CTRADER',
    'DXTrade': 'DXTRADE',
    'CTRADER': 'CTRADER',
    'DXTRADE': 'DXTRADE',
    'BYBIT': 'BYBIT',
    'PT5': 'PT5',
    'TRADELOCKER': 'TRADELOCKER',
  };

  private normalizePlatform(raw: string | undefined): string {
    if (!raw) return 'MT5';
    return this.platformMap[raw] || raw;
  }

  // ─── WorldCard session hash ────────────────────────────────────────
  // SHA1( MD5( order_number + order_amount + order_currency + order_description + merchant_pass ).toUpperCase() )

  private generateSessionHash(
    orderNumber: string,
    amount: string,
    currency: string,
    description: string,
    password: string,
  ): string {
    const crypto = require('crypto');

    const source =
      orderNumber +
      amount +
      currency +
      description +
      password;

    // 🔥 FIX IS HERE
    const upperSource = source.toUpperCase();

    const md5 = crypto.createHash('md5').update(upperSource).digest('hex');
    const sha1 = crypto.createHash('sha1').update(md5).digest('hex');

    return sha1;
  }

  // ─── Challenge resolution (shared) ─────────────────────────────────

  private async resolveChallenge(challengeId?: string, accountSize?: any, challengeType?: string) {
    let challenge: any = null;

    if (challengeId) {
      challenge = await this.prisma.challenge.findUnique({
        where: { id: challengeId },
      });
    }

    if (!challenge && accountSize) {
      const typeMap: Record<string, string> = {
        '1-step': 'one_phase',
        '2-step': 'two_phase',
        'one_phase': 'one_phase',
        'two_phase': 'two_phase',
      };
      const mappedType = typeMap[challengeType || ''] || challengeType || 'two_phase';
      challenge = await this.prisma.challenge.findFirst({
        where: {
          accountSize: typeof accountSize === 'string' ? parseInt(accountSize) : accountSize,
          challengeType: mappedType,
          isActive: true,
        },
      });
    }

    if (!challenge) {
      throw new NotFoundException("No matching challenge found for the selected configuration");
    }

    return challenge;
  }

  // ─── Coupon calculation (shared) ───────────────────────────────────

  private async calculatePriceWithCoupon(basePrice: number, couponCode?: string) {
    let finalPrice = basePrice;
    let appliedCoupon: { code: string; discountType: string; discountPct: number } | null = null;
    let discountAmount = 0;

    if (couponCode) {
      const couponValidation = await this.couponsService.validateCoupon(couponCode);

      if (!couponValidation.valid) {
        throw new BadRequestException(couponValidation.message);
      }

      if (couponValidation.coupon) {
        appliedCoupon = couponValidation.coupon;
        if (appliedCoupon.discountType === 'fixed') {
          discountAmount = Math.floor(appliedCoupon.discountPct);
        } else {
          discountAmount = Math.floor(
            basePrice * (appliedCoupon.discountPct / 100),
          );
        }
        if (discountAmount < 0) discountAmount = 0;
        if (discountAmount > basePrice) discountAmount = basePrice;
        finalPrice = basePrice - discountAmount;
      }
    }

    return { finalPrice, discountAmount, appliedCoupon };
  }

  // ─── Existing internal purchase flow (unchanged) ───────────────────

  async purchaseChallenge(data: any) {

    console.log("PURCHASE DATA:", data);

    const { userId, challengeId, platform, tradingPlatform, trading_platform, brokerPlatform, couponCode, paymentMethod, accountSize, challengeType } = data;

    if (!userId) {

      throw new BadRequestException("Missing required field: userId");

    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new BadRequestException('User not found');

    // 1. Validate challenge - find by ID or by accountSize + challengeType

    let challenge;

    if (challengeId) {
      challenge = await this.prisma.challenge.findUnique({
        where: { id: challengeId },
      });
    }

    if (!challenge && accountSize) {
      const typeMap = {
        '1-step': 'one_phase',
        '2-step': 'two_phase',
        'one_phase': 'one_phase',
        'two_phase': 'two_phase',
      };
      const mappedType = typeMap[challengeType] || challengeType || 'two_phase';
      challenge = await this.prisma.challenge.findFirst({
        where: {
          accountSize: typeof accountSize === 'string' ? parseInt(accountSize) : accountSize,
          challengeType: mappedType,
          isActive: true,
        },
      });
    }

    if (!challenge) {

      throw new NotFoundException("No matching challenge found for the selected configuration");

    }

    // 2. Validate and apply coupon if provided
    let finalPrice = challenge.price;
    let appliedCoupon:
      | { code: string; discountType: string; discountPct: number }
      | null = null;
    let discountAmount = 0;

    if (couponCode) {
      const couponValidation = await this.couponsService.validateCoupon(couponCode);

      if (!couponValidation.valid) {
        throw new BadRequestException(couponValidation.message);
      }

      if (couponValidation.coupon) {
        appliedCoupon = couponValidation.coupon;
        if (appliedCoupon.discountType === 'fixed') {
          discountAmount = Math.floor(appliedCoupon.discountPct);
        } else {
          discountAmount = Math.floor(
            challenge.price * (appliedCoupon.discountPct / 100),
          );
        }
        if (discountAmount < 0) discountAmount = 0;
        if (discountAmount > challenge.price) discountAmount = challenge.price;
        finalPrice = challenge.price - discountAmount;
      }
    }

    console.log('💰 Price calculation:', {
      originalPrice: challenge.price,
      couponCode: couponCode || 'none',
      discountType: appliedCoupon?.discountType || 'none',
      discountPct: appliedCoupon?.discountPct || 0,
      discountAmount,
      finalPrice,
      paymentMethod: paymentMethod || 'not specified'
    });

    // 2. Create payment

    const payment = await this.prisma.payment.create({

      data: {

        user: { connect: { id: userId } },

        amount: finalPrice,

        provider: "internal",

        status: "succeeded",

        reference: null,

      },

    });

    if (appliedCoupon?.code) {
      const coupon = await this.couponsService.getCouponByCode(appliedCoupon.code);
      if (coupon) {
        await this.prisma.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }
    }

    // 3. Create trading account (NO brokerServerId needed)

    const initial = challenge.accountSize;

    // Determine the platform to use - check multiple field names sent from frontend
    const selectedPlatform = platform || tradingPlatform || trading_platform || brokerPlatform || challenge.platform;

    // Map frontend platform names to database enum values
    const platformMap = {
      'MT4': 'MT4',
      'MT5': 'MT5',
      'cTrader': 'CTRADER',
      'DXTrade': 'DXTRADE',
      'CTRADER': 'CTRADER',
      'DXTRADE': 'DXTRADE',
      'BYBIT': 'BYBIT',
      'PT5': 'PT5',
      'TRADELOCKER': 'TRADELOCKER',
    };

    const normalizedPlatform = platformMap[selectedPlatform] || selectedPlatform;

    console.log('🔍 Platform Debug:', {
      received_platform: platform,
      received_tradingPlatform: tradingPlatform,
      received_trading_platform: trading_platform,
      received_brokerPlatform: brokerPlatform,
      challenge_platform: challenge.platform,
      selectedPlatform: selectedPlatform,
      normalizedPlatform: normalizedPlatform
    });

    const account = await this.prisma.tradingAccount.create({

      data: {

        userId,

        challengeId,

        platform: normalizedPlatform, // Save normalized platform enum value

        // brokerServerId: null,

        phase: TradingPhase.PHASE1,

        status: TradingAccountStatus.ACTIVE,

        initialBalance: initial,

        balance: initial,

        equity: initial,

        maxEquityToDate: initial, // CRITICAL: Initialize to starting balance (peak equity starts here)

        // ✅ Initialize min equity tracking for monotonic drawdowns
        minEquityOverall: initial, // Lowest equity ever - starts at initial balance
        minEquityToday: initial, // Lowest equity today - starts at initial balance
        todayStartEquity: initial, // Equity at start of trading day
        lastDailyReset: new Date(), // Track when daily metrics were last reset
        // ✅ Initialize peak tracking for monotonic progress bars
        peakDailyDrawdownPercent: 0,
        peakOverallDrawdownPercent: 0,
        peakProfitPercent: 0,

        brokerLogin: null,

        brokerPassword: null,
      } as any,
    });

    console.log(
      '✅ Account created with platform:',
      account.platform,
      'Account ID:',
      account.id,
    );

    // Adding platform credentials to the account for MT5

    if (account.platform === 'MT5') {
      const platformEmail =
        user.email.split('@')[0] +
        '-' +
        account.id.substring(0, 8) +
        '@prop-capitals.com';
      const platformPassword = generatePassword(20);
      const platformHashedPassword = await bcrypt.hash(platformPassword, 10);

      await this.prisma.tradingAccount.update({
        where: {
          id: account.id,
        },
        data: {
          platformEmail: platformEmail,
          platformHashedPassword: platformHashedPassword,
        },
      });

      await this.emailService.sendPlatformAccountCredentials(
        user.email,
        platformEmail,
        platformPassword,
        {
          id: account.id.substring(0, 8),
          platform: account.platform,
        },
        'setup',
      );
    }


    // Create notification for challenge purchase
    await this.notificationsService.create(
      userId,
      'Challenge Purchased',
      `Your ${challenge.name} challenge has been purchased successfully. Your trading account #${account.id.substring(0, 8)} is now active with a starting balance of $${initial.toLocaleString()}.`,
      NotificationType.SUCCESS,
      NotificationCategory.CHALLENGE,
    );

    return {

      message: "Challenge purchased successfully",

      payment,

      account,

    };

  }

  // ─── WorldCard: Create checkout session ────────────────────────────

  async createWorldCardSession(data: any) {
    const { userId, challengeId, platform, tradingPlatform, trading_platform, brokerPlatform, couponCode, accountSize, challengeType } = data;

    if (!userId) {
      throw new BadRequestException("Missing required field: userId");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new BadRequestException('User not found');

    // Resolve challenge (always uses challenge.id downstream, never raw challengeId)
    const challenge = await this.resolveChallenge(challengeId, accountSize, challengeType);

    // Calculate price with coupon — challenge.price is in whole dollars,
    // we convert everything to integer cents for DB storage
    const { finalPrice, discountAmount, appliedCoupon } = await this.calculatePriceWithCoupon(challenge.price, couponCode);

    const amountCents = finalPrice * 100;
    const originalAmountCents = challenge.price * 100;
    const discountAmountCents = discountAmount * 100;

    // Normalize platform
    const selectedPlatform = platform || tradingPlatform || trading_platform || brokerPlatform || challenge.platform;
    const normalizedPlatform = this.normalizePlatform(selectedPlatform);

    // Generate unique order reference
    const orderNumber = `WC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Read env vars early so we fail before creating the payment row
    // const merchantKey = "9f23ffa8-333c-11f1-9a91-2aaa1a84d930"
    // const merchantPass = "573d12e9ec6e71a20434afe3a058409e";
    // const notificationUrl = "https://herbivorous-tuberculoid-marcelene.ngrok-free.dev/payments/worldcard/callback";
    // const baseUrl = "https://pay.world-card.co";
    // const frontendUrl = "https://props-capital.com";
    const merchantKey = this.configService.get<string>('WORLDCARD_MERCHANT_KEY');
    const merchantPass = this.configService.get<string>('WORLDCARD_MERCHANT_PASS');
    const notificationUrl = this.configService.get<string>('WORLDCARD_NOTIFICATION_URL');
    const baseUrl = this.configService.get<string>('WORLDCARD_BASE_URL');
    const frontendUrl = this.configService.get<string>('APP_FRONTEND_URL');

    if (!merchantKey || !merchantPass || !notificationUrl || !baseUrl || !frontendUrl) {
      this.logger.error('Missing WorldCard env vars', {
        merchantKey: !!merchantKey,
        merchantPass: !!merchantPass,
        notificationUrl: !!notificationUrl,
        baseUrl: !!baseUrl,
        frontendUrl: !!frontendUrl,
      });
      throw new BadRequestException('WorldCard environment variables not configured');
    }

    // Build order fields — these exact strings are used in both payload and hash
    const worldCardAmount = (amountCents / 100).toFixed(2);
    const orderCurrency = 'USD';
    // const orderDescription = `${challenge.name} - $${challenge.accountSize.toLocaleString()} Account`;
    const orderDescription = `${challenge.name} ${challenge.accountSize} Account`;
    // Generate session hash: SHA1( MD5( number + amount + currency + description + password ).toUpperCase() )
    const sessionHash = this.generateSessionHash(
      orderNumber,
      worldCardAmount,
      orderCurrency,
      orderDescription,
      merchantPass,
    );

    // Build redirect URLs
    const successUrl = `${frontendUrl}/traderdashboard/checkout/success?reference=${orderNumber}`;
    const cancelUrl = `${frontendUrl}/traderdashboard/checkout/fail?reference=${orderNumber}`;
    const errorUrl = `${frontendUrl}/traderdashboard/checkout/fail?reference=${orderNumber}`;

    const sessionPayload = {
      merchant_key: merchantKey,
      operation: 'purchase',
      methods: ['card'],
      hash: sessionHash,
      success_url: successUrl,
      cancel_url: cancelUrl,
      error_url: errorUrl,
      notification_url: notificationUrl,
      order: {
        number: orderNumber,
        amount: worldCardAmount,
        currency: orderCurrency,
        description: orderDescription,
      },
      customer: {
        // name: user.email,
        email: user.email,
      },
      custom_data: {
        userId,
        challengeId: challenge.id,
        platform: normalizedPlatform,
      },
    };

    this.logger.log(`[WorldCard Session] Building request for user=${userId}, challenge=${challenge.id}`);
    this.logger.log(`[WorldCard Session] orderNumber=${orderNumber}, amount=${worldCardAmount}, currency=${orderCurrency}`);
    this.logger.log(`[WorldCard Session] description="${orderDescription}"`);
    this.logger.log(`[WorldCard Session] hash=${sessionHash}`);
    this.logger.log(`[WorldCard Session] successUrl=${successUrl}`);
    this.logger.log(`[WorldCard Session] cancelUrl=${cancelUrl}`);
    this.logger.log(`[WorldCard Session] notificationUrl=${notificationUrl}`);
    this.logger.debug(`[WorldCard Session] Full payload: ${JSON.stringify(sessionPayload, null, 2)}`);

    // Create pending payment row — includes sessionPayload upfront
    const payment = await (this.prisma.payment as any).create({
      data: {
        user: { connect: { id: userId } },
        challenge: { connect: { id: challenge.id } },
        amount: amountCents,
        originalAmount: originalAmountCents,
        discountAmount: discountAmountCents,
        couponCode: appliedCoupon?.code || null,
        currency: orderCurrency,
        provider: 'worldcard',
        status: 'pending',
        reference: orderNumber,
        metadata: {
          platform: normalizedPlatform,
          challengeId: challenge.id,
          challengeName: challenge.name,
          accountSize: challenge.accountSize,
          challengeType: challenge.challengeType,
          couponCode: appliedCoupon?.code || null,
          discountType: appliedCoupon?.discountType || null,
          discountPct: appliedCoupon?.discountPct || null,
        },
        sessionPayload: sessionPayload,
      },
    });

    this.logger.log(`[WorldCard Session] Payment record created: id=${payment.id}, ref=${orderNumber}`);

    // Call WorldCard API
    const apiUrl = `${baseUrl}/api/v1/session`;
    this.logger.log(`[WorldCard Session] POST ${apiUrl}`);

    let sessionResponse: any;
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionPayload),
      });

      this.logger.log(`[WorldCard Session] Response status: ${res.status} ${res.statusText}`);

      const rawText = await res.text();
      this.logger.log(`[WorldCard Session] Raw response: ${rawText}`);

      try {
        sessionResponse = JSON.parse(rawText);
      } catch {
        this.logger.warn(`[WorldCard Session] Response is not valid JSON, storing as string`);
        sessionResponse = { raw: rawText };
      }

      if (!res.ok) {
        this.logger.error(`[WorldCard Session] API error ${res.status}: ${JSON.stringify(sessionResponse)}`);
        throw new BadRequestException(`WorldCard session failed (${res.status}): ${sessionResponse?.message || rawText}`);
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error(`[WorldCard Session] Request threw: ${err?.message}`, err?.stack);
      throw new BadRequestException('Failed to connect to WorldCard payment gateway');
    }

    this.logger.log(`[WorldCard Session] Parsed response: ${JSON.stringify(sessionResponse)}`);

    // Save session response + provider session id
    await (this.prisma.payment as any).update({
      where: { id: payment.id },
      data: {
        sessionResponse: sessionResponse,
        providerSessionId: sessionResponse?.id || sessionResponse?.session_id || null,
      },
    });

    const redirectUrl = sessionResponse?.redirect_url || sessionResponse?.url || null;

    if (!redirectUrl) {
      this.logger.error(`[WorldCard Session] No redirect_url in response: ${JSON.stringify(sessionResponse)}`);
      throw new BadRequestException('WorldCard did not return a checkout URL');
    }

    this.logger.log(`[WorldCard Session] Success: ref=${orderNumber}, redirectUrl=${redirectUrl}`);

    return {
      message: 'WorldCard checkout session created',
      reference: orderNumber,
      paymentId: payment.id,
      redirectUrl,
    };
  }

  // ─── WorldCard: Provision trading account after successful payment ─

  async provisionChallengeAfterPaymentSuccess(paymentId: string) {
    // 1. Load payment with relations
    const payment: any = await (this.prisma.payment as any).findUnique({
      where: { id: paymentId },
      include: { user: true, challenge: true },
    });

    if (!payment) {
      throw new NotFoundException(`Payment not found: ${paymentId}`);
    }

    if (payment.status !== 'succeeded') {
      throw new BadRequestException(`Payment status is "${payment.status}", expected "succeeded"`);
    }

    // 2. Idempotency — if already provisioned, return existing account
    if (payment.tradingAccountId) {
      this.logger.log(`Already provisioned: payment=${paymentId}, account=${payment.tradingAccountId}`);
      const existingAccount = await this.prisma.tradingAccount.findUnique({
        where: { id: payment.tradingAccountId },
      });
      return existingAccount;
    }

    const user = payment.user;
    const challenge = payment.challenge;

    if (!user) {
      throw new NotFoundException(`User not found for payment ${paymentId}`);
    }
    if (!challenge) {
      throw new NotFoundException(`Challenge not found for payment ${paymentId}`);
    }

    // 3. Read platform from payment metadata, normalize to enum
    const metadata = (payment.metadata || {}) as any;
    const normalizedPlatform = this.normalizePlatform(metadata.platform || challenge.platform);
    const initial = challenge.accountSize;

    // 4. Prisma interactive transaction — creates account + links payment + increments coupon atomically
    const account = await this.prisma.$transaction(async (tx) => {
      // Double-check inside transaction to guard against concurrent callbacks
      const freshPayment: any = await (tx.payment as any).findUnique({
        where: { id: paymentId },
        select: { tradingAccountId: true },
      });

      if (freshPayment?.tradingAccountId) {
        this.logger.log(`Race guard: account already exists for payment ${paymentId}`);
        return tx.tradingAccount.findUnique({
          where: { id: freshPayment.tradingAccountId },
        });
      }

      // Create trading account — uses challenge.id, never raw request challengeId
      const newAccount = await tx.tradingAccount.create({
        data: {
          userId: user.id,
          challengeId: challenge.id,
          platform: normalizedPlatform,
          phase: TradingPhase.PHASE1,
          status: TradingAccountStatus.ACTIVE,
          initialBalance: initial,
          balance: initial,
          equity: initial,
          maxEquityToDate: initial,
          minEquityOverall: initial,
          minEquityToday: initial,
          todayStartEquity: initial,
          lastDailyReset: new Date(),
          peakDailyDrawdownPercent: 0,
          peakOverallDrawdownPercent: 0,
          peakProfitPercent: 0,
          brokerLogin: null,
          brokerPassword: null,
        } as any,
      });

      // Link trading account to payment
      await (tx.payment as any).update({
        where: { id: payment.id },
        data: { tradingAccountId: newAccount.id },
      });

      // Increment coupon usage (only once, inside the same transaction)
      if (payment.couponCode) {
        const coupon = await this.couponsService.getCouponByCode(payment.couponCode);
        if (coupon) {
          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      return newAccount;
    });

    if (!account) {
      throw new BadRequestException(`Failed to provision account for payment ${paymentId}`);
    }

    this.logger.log(`Account provisioned: ${account.id}, platform=${account.platform}, challenge=${challenge.id}`);

    // 5. MT5 platform credentials (outside transaction — side effects)
    if (account.platform === 'MT5') {
      const platformEmail =
        user.email.split('@')[0] +
        '-' +
        account.id.substring(0, 8) +
        '@prop-capitals.com';
      const platformPassword = generatePassword(20);
      const platformHashedPassword = await bcrypt.hash(platformPassword, 10);

      await this.prisma.tradingAccount.update({
        where: { id: account.id },
        data: {
          platformEmail: platformEmail,
          platformHashedPassword: platformHashedPassword,
        },
      });

      await this.emailService.sendPlatformAccountCredentials(
        user.email,
        platformEmail,
        platformPassword,
        {
          id: account.id.substring(0, 8),
          platform: account.platform,
        },
        'setup',
      );
    }

    // 6. Notification (outside transaction — non-critical)
    await this.notificationsService.create(
      user.id,
      'Challenge Purchased',
      `Your ${challenge.name} challenge has been purchased successfully. Your trading account #${account.id.substring(0, 8)} is now active with a starting balance of $${initial.toLocaleString()}.`,
      NotificationType.SUCCESS,
      NotificationCategory.CHALLENGE,
    );

    return account;
  }

  // ─── Payment status (for frontend polling) ─────────────────────────

  async getPaymentStatus(reference: string) {
    if (!reference || typeof reference !== 'string') {
      throw new BadRequestException('Missing or invalid reference');
    }

    const payment = await (this.prisma.payment as any).findUnique({
      where: { reference },
      select: {
        reference: true,
        status: true,
        orderStatus: true,
        provider: true,
        challengeId: true,
        tradingAccountId: true,
        providerPaymentId: true,
        updatedAt: true,
      },
    });

    if (!payment) {
      throw new NotFoundException(`Payment not found for reference: ${reference}`);
    }

    return payment;
  }

}
