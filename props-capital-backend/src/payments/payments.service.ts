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

  // Accepts "25K", "100K", "5M", "25000", or a number. Returns integer dollars.
  private parseAccountSize(raw: any): number {
    if (raw == null) return 0;
    if (typeof raw === 'number') return Math.round(raw);
    const s = String(raw).trim().toUpperCase();
    const m = s.match(/^(\d+(?:\.\d+)?)([KMB])?$/);
    if (m) {
      const n = parseFloat(m[1]);
      const unit = m[2];
      if (unit === 'K') return Math.round(n * 1_000);
      if (unit === 'M') return Math.round(n * 1_000_000);
      if (unit === 'B') return Math.round(n * 1_000_000_000);
      return Math.round(n);
    }
    const parsed = parseInt(s, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  // ─── Guest user resolution (shared by guest checkout flows) ────────
  // Finds a user by email, or creates one with a random password and a
  // profile. Existing profile fields are never overwritten.

  private async resolveOrCreateGuestUser(input: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    country?: string;
    address?: string;
    city?: string;
  }) {
    const { firstName, lastName, phone, country, address, city } = input;

    if (!input.email || typeof input.email !== 'string') {
      throw new BadRequestException('Missing required field: email');
    }
    if (!firstName || !lastName) {
      throw new BadRequestException('Missing required name fields');
    }

    const normalizedEmail = input.email.trim().toLowerCase();

    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      const randomPassword = generatePassword(20);
      const hashed = await bcrypt.hash(randomPassword, 10);
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashed,
          passwordSet: false,
          profile: {
            create: {
              firstName,
              lastName,
              phone: phone || null,
              country: country || null,
              address: address || null,
              city: city || null,
            },
          },
        } as any,
      });
      this.logger.log(`[GuestCheckout] Created user ${user.id} (${normalizedEmail})`);
    } else {
      const existingProfile = await this.prisma.userProfile.findUnique({
        where: { userId: user.id },
      });
      if (!existingProfile) {
        await this.prisma.userProfile.create({
          data: {
            userId: user.id,
            firstName,
            lastName,
            phone: phone || null,
            country: country || null,
            address: address || null,
            city: city || null,
          } as any,
        });
      } else {
        await this.prisma.userProfile.update({
          where: { userId: user.id },
          data: {
            firstName: existingProfile.firstName ?? firstName,
            lastName: existingProfile.lastName ?? lastName,
            phone: existingProfile.phone ?? (phone || null),
            country: existingProfile.country ?? (country || null),
            address: existingProfile.address ?? (address || null),
            city: existingProfile.city ?? (city || null),
          } as any,
        });
      }
    }

    return user;
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

  // ─── Xoala: Create checkout session ────────────────────────────

  async createXoalaCheckoutSession(data: any) {
    const {
      slug,
      challengeId,
      accountSize,
      challengeType,
      platform,
      tradingPlatform,
      trading_platform,
      brokerPlatform,
      firstName,
      lastName,
      email,
      phone,
      country,
      address,
      city,
      brandSlug,
      linkSlug,
    } = data || {};

    if (!slug && !challengeId && !accountSize) {
      throw new BadRequestException(
        'Missing required field: slug, challengeId, or accountSize',
      );
    }

    // Resolve the challenge from id → slug → DirectPurchaseLink slug →
    // accountSize+challengeType, capturing brand attribution along the way.
    let challenge: any = null;
    let brandLink: any = null;

    if (challengeId && typeof challengeId === 'string') {
      challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
    }
    if (!challenge && slug && typeof slug === 'string') {
      challenge = await (this.prisma.challenge as any).findUnique({ where: { slug } });
      if (!challenge) {
        brandLink = await (this.prisma as any).directPurchaseLink.findUnique({
          where: { slug },
          include: { brand: true, challenge: true },
        });
        if (brandLink?.active) {
          challenge = brandLink.challenge;
        }
      }
    }
    if (!challenge && accountSize) {
      const sizeNumber = this.parseAccountSize(accountSize);
      const typeMap: Record<string, string> = {
        '1-step': 'one_phase',
        'one-step': 'one_phase',
        'one_step': 'one_phase',
        'one-phase': 'one_phase',
        'one_phase': 'one_phase',
        '2-step': 'two_phase',
        'two-step': 'two_phase',
        'two_step': 'two_phase',
        'two-phase': 'two_phase',
        'two_phase': 'two_phase',
      };
      const mappedType =
        typeMap[String(challengeType || '').toLowerCase()] ||
        challengeType ||
        'two_phase';
      challenge = await this.prisma.challenge.findFirst({
        where: { accountSize: sizeNumber, challengeType: mappedType, isActive: true },
      });
    }

    // Explicit brand attribution from /checkout?brand=...&link=... params.
    if (!brandLink && linkSlug && typeof linkSlug === 'string') {
      brandLink = await (this.prisma as any).directPurchaseLink.findUnique({
        where: { slug: linkSlug },
        include: { brand: true, challenge: true },
      });
    }
    if (!brandLink && brandSlug && typeof brandSlug === 'string') {
      const brand = await (this.prisma as any).brand.findUnique({
        where: { slug: brandSlug },
      });
      if (brand) {
        brandLink = { brandId: brand.id, brand, id: null, slug: null, active: true };
      }
    }
    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found');
    }

    const user = await this.resolveOrCreateGuestUser({
      email,
      firstName,
      lastName,
      phone,
      country,
      address,
      city,
    });

    const amountCents = challenge.price * 100;

    const selectedPlatform =
      platform ||
      tradingPlatform ||
      trading_platform ||
      brokerPlatform ||
      challenge.platform;

    const normalizedPlatform = this.normalizePlatform(selectedPlatform);

    const orderNumber = `XOALA-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // Xoala "Standard Checkout" (POST {base}/transaction/Checkout).
    // Account-specific values come from the Xoala merchant dashboard.
    const baseUrl = this.configService.get<string>('XOALA_BASE_URL');
    const memberId = this.configService.get<string>('XOALA_MEMBER_ID');
    const secureKey = this.configService.get<string>('XOALA_SECURE_KEY');
    const totype = this.configService.get<string>('XOALA_TOTYPE');
    const frontendUrl = this.configService.get<string>('APP_FRONTEND_URL');
    const terminalId = this.configService.get<string>('XOALA_TERMINAL_ID');
    const paymentMode = this.configService.get<string>('XOALA_PAYMENT_MODE');
    const notificationUrl = this.configService.get<string>('XOALA_NOTIFICATION_URL');

    if (!baseUrl || !memberId || !secureKey || !totype || !frontendUrl) {
      this.logger.error('Missing Xoala env vars', {
        baseUrl: !!baseUrl,
        memberId: !!memberId,
        secureKey: !!secureKey,
        totype: !!totype,
        frontendUrl: !!frontendUrl,
      });

      throw new BadRequestException('Xoala environment variables not configured');
    }

    // Standard Checkout uses a SINGLE return URL; Xoala appends the status.
    // The return page polls payment status (truth = the server-to-server
    // notification webhook) and renders succeeded/failed/pending itself.
    const merchantRedirectUrl = `${frontendUrl}/pay/success?reference=${orderNumber}`;
    const orderCurrency = (challenge.currency || 'USD').toUpperCase();
    // amount format per spec: [0-9]{1,8}\.[0-9]{2}
    const amount = (amountCents / 100).toFixed(2);
    const orderDescription = `${challenge.name} ${challenge.accountSize} Account`;

    // Request checksum (per Standard Checkout spec):
    //   MD5( memberId | totype | amount | merchantTransactionId | merchantRedirectUrl | secureKey )
    // Values are joined raw with '|' (the browser url-encodes form fields in
    // transit; Xoala validates the checksum against the decoded values).
    const checksumSource = [
      memberId,
      totype,
      amount,
      orderNumber,
      merchantRedirectUrl,
      secureKey,
    ].join('|');
    const checksum = crypto
      .createHash('md5')
      .update(checksumSource)
      .digest('hex');

    // Form fields posted to {base}/transaction/Checkout by the browser.
    const fields: Record<string, string> = {
      memberId,
      totype,
      amount,
      currency: orderCurrency,
      merchantTransactionId: orderNumber,
      merchantRedirectUrl,
      orderDescription,
      checksum,
    };
    if (notificationUrl) fields.notificationUrl = notificationUrl;
    if (terminalId) fields.terminalid = terminalId;
    if (paymentMode) fields.paymentMode = paymentMode;
    if (user.email) fields.email = user.email;
    if (firstName) fields.firstName = firstName;
    if (lastName) fields.lastName = lastName;
    if (country) fields.country = country;
    if (city) fields.city = city;

    this.logger.log(
      `[Xoala Checkout] Building Standard Checkout for user=${user.id}, challenge=${challenge.id}, ref=${orderNumber}, amount=${amount} ${orderCurrency}`,
    );

    const brandIdAttribution: string | null = brandLink?.brandId ?? null;
    const brandCommissionRate: number = brandLink?.brand?.commissionRate ?? 0;
    const brandCommissionCents: number = brandIdAttribution
      ? Math.round((amountCents * brandCommissionRate) / 100)
      : 0;

    const payment = await (this.prisma.payment as any).create({
      data: {
        user: { connect: { id: user.id } },
        challenge: { connect: { id: challenge.id } },
        ...(brandIdAttribution
          ? { brand: { connect: { id: brandIdAttribution } } }
          : {}),
        brandCommission: brandCommissionCents,
        amount: amountCents,
        originalAmount: amountCents,
        discountAmount: 0,
        couponCode: null,
        currency: orderCurrency,
        provider: 'xoala',
        status: 'pending',
        reference: orderNumber,
        metadata: {
          platform: normalizedPlatform,
          challengeId: challenge.id,
          challengeName: challenge.name,
          accountSize: challenge.accountSize,
          challengeType: challenge.challengeType,
          brandLinkId: brandLink?.id || null,
          brandLinkSlug: brandLink?.slug || null,
          isGuestCheckout: true,
          billingDetails: {
            firstName,
            lastName,
            phone: phone || null,
            country: country || null,
            address: address || null,
            city: city || null,
          },
        },
        sessionPayload: fields,
      },
    });

    this.logger.log(
      `[Xoala Checkout] Payment record created: id=${payment.id}, ref=${orderNumber}`,
    );

    // Standard Checkout is POST-only and the response IS the hosted payment
    // page (HTML), so the customer's browser must POST the form directly.
    // We return the action URL + fields; the frontend auto-submits a form.
    // Strip any trailing slashes from baseUrl so we don't produce
    // "https://host//transaction/Checkout" (which Xoala 404s on).
    const checkoutUrl = `${baseUrl.replace(/\/+$/, '')}/transaction/Checkout`;

    this.logger.log(
      `[Xoala Checkout] Session ready: ref=${orderNumber}, checkoutUrl=${checkoutUrl}`,
    );

    return {
      message: 'Xoala checkout session created',
      reference: orderNumber,
      paymentId: payment.id,
      checkoutUrl,
      method: 'POST',
      fields,
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

    // 7. Set-password email for guest-created users who haven't set their own password yet
    await this.sendSetPasswordEmailIfNeeded(user).catch((err) => {
      this.logger.error(`Set-password email failed for user ${user.id}: ${err?.message}`, err?.stack);
    });

    return account;
  }

  // ─── Set-password token issuance for guest-created users ───────────

  private async sendSetPasswordEmailIfNeeded(user: any) {
    if (user.passwordSet === true || user.passwordSet === undefined) {
      return;
    }

    const frontendUrl = this.configService.get<string>('APP_FRONTEND_URL');
    if (!frontendUrl) {
      this.logger.error('APP_FRONTEND_URL not set — cannot build set-password link');
      return;
    }

    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await (this.prisma.user as any).update({
      where: { id: user.id },
      data: {
        setPasswordTokenHash: tokenHash,
        setPasswordTokenExpiry: expiry,
      },
    });

    const profile = await this.prisma.userProfile.findUnique({ where: { userId: user.id } });
    const firstName = profile?.firstName || undefined;
    const setPasswordUrl = `${frontendUrl}/set-password?token=${plainToken}`;

    await this.emailService.sendSetPasswordEmail(user.email, setPasswordUrl, firstName);
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

  // ─── User transactions list (for dashboard) ────────────────────────

  async getUserPayments(userId: string) {
    if (!userId) {
      throw new BadRequestException('Missing userId');
    }

    const payments = await (this.prisma.payment as any).findMany({
      where: { userId },
      select: {
        id: true,
        reference: true,
        amount: true,
        originalAmount: true,
        discountAmount: true,
        couponCode: true,
        currency: true,
        provider: true,
        status: true,
        orderStatus: true,
        tradingAccountId: true,
        failureReason: true,
        createdAt: true,
        updatedAt: true,
        challenge: {
          select: {
            id: true,
            name: true,
            accountSize: true,
            challengeType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments;
  }

}
