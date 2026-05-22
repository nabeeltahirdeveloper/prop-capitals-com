import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import axios from 'axios';
import { TradingPhase, TradingAccountStatus, NotificationType, NotificationCategory } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';

import { generatePassword } from 'src/utils/generate-password.util';
import { EmailService } from 'src/email/email.service';
import { XoalaAuthService } from './xoala-auth.service';
import { buildXoalaRequestChecksum } from './xoala-checksum.util';

@Injectable()

export class PaymentsService {

  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private readonly emailService: EmailService,
    private couponsService: CouponsService,
    private readonly configService: ConfigService,
    private readonly xoalaAuthService: XoalaAuthService,
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

  // ─── Card brand detection (server-side — never trust the client) ───
  // Visa: starts with 4. Mastercard: 51-55 or 2221-2720. Anything else is
  // unsupported for this merchant since we only have VISA + MC terminals.
  private detectCardBrand(rawNumber: string): 'VISA' | 'MC' | null {
    const digits = String(rawNumber || '').replace(/\D/g, '');
    if (/^4\d{12,18}$/.test(digits)) return 'VISA';
    if (/^(5[1-5]\d{14}|2(2[2-9]\d|[3-6]\d{2}|7([01]\d|20))\d{12})$/.test(digits)) {
      return 'MC';
    }
    return null;
  }

  // ─── Per-(currency, brand) terminal lookup ─────────────────────────
  // Bluehaven Management LTD has 4 terminals — one per currency × brand pair.
  // Configured via XOALA_TERMINAL_{EUR,GBP}_{VISA,MC} env vars.
  private resolveXoalaTerminalId(
    currency: 'EUR' | 'GBP',
    brand: 'VISA' | 'MC',
  ): string {
    const key = `XOALA_TERMINAL_${currency}_${brand}`;
    const terminalId = this.configService.get<string>(key);
    if (!terminalId) {
      this.logger.error(`Missing ${key} env var`);
      throw new InternalServerErrorException(
        `Xoala terminal not configured for ${currency} ${brand}`,
      );
    }
    return terminalId;
  }

  // EUR is the canonical currency stored in challenge.price (or challenge.currency
  // may be GBP). Frontend sends the user-selected display currency; we recompute
  // the amount server-side so a tampered client can't change what we charge.
  // Mirrors EUR_TO_GBP_RATE + Math.round in CurrencyContext.jsx#formatFee —
  // these must stay in sync or what the customer sees won't match the charge.
  private static readonly EUR_TO_GBP_RATE = 0.85;

  private computeChargeAmount(
    challenge: { price: number; currency: string | null },
    requestedCurrency: 'EUR' | 'GBP',
  ): { amount: string; amountCents: number } {
    const challengeCurrency = (challenge.currency || 'EUR').toUpperCase();
    let priceEur: number;
    if (challengeCurrency === 'GBP') {
      priceEur = challenge.price / PaymentsService.EUR_TO_GBP_RATE;
    } else {
      priceEur = challenge.price;
    }
    const converted =
      requestedCurrency === 'GBP'
        ? priceEur * PaymentsService.EUR_TO_GBP_RATE
        : priceEur;
    // Round to whole units to match formatFee()'s display in the UI — a
    // €2 challenge becomes "£2" on screen and £2.00 at the gateway, not £1.70.
    const finalPrice = Math.round(converted);
    const amountCents = finalPrice * 100;
    return { amount: finalPrice.toFixed(2), amountCents };
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

  // ─── Xoala: Server-to-Server card charge ───────────────────────
  async createXoalaCharge(data: any) {
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
      state,
      postalCode,
      brandSlug,
      linkSlug,
      card,
      currency: requestedCurrencyRaw,
    } = data || {};

    if (!slug && !challengeId && !accountSize) {
      throw new BadRequestException(
        'Missing required field: slug, challengeId, or accountSize',
      );
    }
    if (!card?.number || !card?.expiryMonth || !card?.expiryYear || !card?.cvv) {
      throw new BadRequestException(
        'Card details (number, expiryMonth, expiryYear, cvv) are required',
      );
    }

    // Currency must come from the request body (driven by the site-wide
    // EUR/GBP toggle); we only support these two and reject anything else.
    const requestedCurrency = String(requestedCurrencyRaw || '').toUpperCase();
    if (requestedCurrency !== 'EUR' && requestedCurrency !== 'GBP') {
      throw new BadRequestException(
        'Unsupported currency. Only EUR and GBP are accepted.',
      );
    }

    // Re-derive the card brand server-side. We never trust the brand the
    // client sends, since terminal selection depends on it. Only Visa and
    // Mastercard are supported by this merchant's terminals.
    const sanitizedCardNumber = String(card.number).replace(/\D/g, '');
    const detectedBrand = this.detectCardBrand(sanitizedCardNumber);
    if (!detectedBrand) {
      throw new BadRequestException(
        'We only accept Visa and Mastercard for EUR/GBP payments.',
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

    // Resolve user strictly — the email on the form must already match
    // an existing account. We do NOT create users on the fly anymore: if
    // the email is unknown we reject the charge before touching the
    // payment gateway, so card data is never sent for a non-customer.
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Missing required field: email');
    }
    if (!firstName || !lastName) {
      throw new BadRequestException('Missing required name fields');
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!user) {
      this.logger.warn(
        `[Xoala S2S] Rejected charge — no account for email=${normalizedEmail}`,
      );
      throw new NotFoundException(
        'No account found for this email. Please sign up before purchasing.',
      );
    }

    const { amount, amountCents } = this.computeChargeAmount(
      challenge,
      requestedCurrency,
    );
    const selectedPlatform =
      platform || tradingPlatform || trading_platform || brokerPlatform || challenge.platform;
    const normalizedPlatform = this.normalizePlatform(selectedPlatform);

    const orderNumber = `XOALA-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}`;

    // ── S2S config ──
    const s2sBaseUrl = this.configService.get<string>('XOALA_S2S_BASE_URL');
    const memberId = this.configService.get<string>('XOALA_MEMBER_ID');
    const secureKey = this.configService.get<string>('XOALA_SECURE_KEY');
    const frontendUrl = this.configService.get<string>('APP_FRONTEND_URL');
    const backendUrl = this.configService.get<string>('APP_BACKEND_URL');
    const terminalId = this.resolveXoalaTerminalId(requestedCurrency, detectedBrand);
    const notificationUrl = this.configService.get<string>('XOALA_NOTIFICATION_URL');

    if (!s2sBaseUrl || !memberId || !secureKey || !frontendUrl || !backendUrl) {
      this.logger.error('Missing Xoala S2S env vars', {
        s2sBaseUrl: !!s2sBaseUrl,
        memberId: !!memberId,
        secureKey: !!secureKey,
        frontendUrl: !!frontendUrl,
        backendUrl: !!backendUrl,
      });
      throw new BadRequestException('Xoala S2S environment variables not configured');
    }

    // Xoala submits a form POST to merchantRedirectUrl after 3DS. Vite (dev)
    // and most SPA hosts don't serve HTML on POST, so we route through a
    // backend endpoint that accepts POST and 302-redirects to the SPA.
    const merchantRedirectUrl = `${backendUrl}/payments/xoala/return?reference=${orderNumber}`;
    const orderCurrency = requestedCurrency;
    const orderDescription = `${challenge.name} ${challenge.accountSize} Account`;

    // S2S request checksum:  MD5( memberId | secureKey | merchantTxId | amount )
    const checksum = buildXoalaRequestChecksum({
      memberId, secureKey, merchantTransactionId: orderNumber, amount,
    });

    // PCI-safe payload to persist (NEVER PAN, NEVER CVV).
    const safePayload = {
      memberId,
      terminalId,
      amount,
      currency: orderCurrency,
      merchantTransactionId: orderNumber,
      merchantRedirectUrl,
      orderDescription,
      notificationUrl: notificationUrl || null,
      customer: {
        email: user.email,
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        country: country || null,
        city: city || null,
        state: state || null,
        postalCode: postalCode || null,
      },
      card: {
        brand: detectedBrand,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        holder: card.holder || null,
      },
    };

    this.logger.log(
      `[Xoala S2S] Charging user=${user.id}, challenge=${challenge.id}, ref=${orderNumber}, amount=${amount} ${orderCurrency}`,
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

        // Billing snapshot (mirrors PayLink.jsx fields)
        billingFirstName: firstName,
        billingLastName: lastName,
        billingEmail: user.email,
        billingPhone: phone || null,
        billingCountry: country || null,
        billingAddress: address || null,
        billingCity: city || null,
        billingState: state || null,
        billingPostalCode: postalCode || null,

        // Card metadata (bin/last4 are filled once the gateway responds)
        cardholderName: card.holder || null,
        cardBrand: detectedBrand,
        cardExpiryMonth: String(card.expiryMonth),
        cardExpiryYear: String(card.expiryYear),

        // Order context
        accountSize: challenge.accountSize,
        challengeType: challenge.challengeType,
        platform: normalizedPlatform,

        // Brand attribution
        brandSlug: brandLink?.brand?.slug || brandSlug || null,
        linkSlug: brandLink?.slug || linkSlug || null,

        metadata: {
          platform: normalizedPlatform,
          challengeId: challenge.id,
          challengeName: challenge.name,
          accountSize: challenge.accountSize,
          challengeType: challenge.challengeType,
          brandLinkId: brandLink?.id || null,
          brandLinkSlug: brandLink?.slug || null,
          isGuestCheckout: true,
          flow: 's2s',
          billingDetails: {
            firstName, lastName,
            phone: phone || null,
            country: country || null,
            address: address || null,
            city: city || null,
            state: state || null,
            postalCode: postalCode || null,
          },
        },
        sessionPayload: safePayload,
      },
    });

    this.logger.log(
      `[Xoala S2S] Payment row created: id=${payment.id}, ref=${orderNumber}`,
    );

    // ── Build form-urlencoded body for Xoala ──
    const params: Record<string, string> = {
      'authentication.memberId': memberId,
      'authentication.checksum': checksum,
      'merchantTransactionId': orderNumber,
      'amount': amount,
      'currency': orderCurrency,
      'orderDescriptor': orderDescription,
      'card.number': sanitizedCardNumber,
      'card.expiryMonth': String(card.expiryMonth),
      'card.expiryYear': String(card.expiryYear),
      'card.cvv': String(card.cvv),
      'paymentMode': 'CC',
      'paymentType': 'DB',
      'paymentBrand': detectedBrand,
      'authentication.terminalId': terminalId,
      'merchantRedirectUrl': merchantRedirectUrl,
      'customer.email': user.email,
      'customer.givenName': (firstName || '').trim(),
      'customer.surname': (lastName || '').trim(),
    };
    if (notificationUrl) params['notificationUrl'] = notificationUrl;
    if (card.holder) params['card.holder'] = String(card.holder);
    if (phone) params['customer.phone'] = String(phone);
    if (country) params['shipping.country'] = String(country);
    if (city) params['shipping.city'] = String(city);
    if (address) params['shipping.street1'] = String(address);
    if (state) params['shipping.state'] = String(state);
    if (postalCode) params['shipping.postcode'] = String(postalCode);

    const authToken = await this.xoalaAuthService.getAuthToken();
    const url = `${s2sBaseUrl}/transactionServices/REST/v1/payments`;

    let xoalaResponse: any;
    try {
      const httpRes = await axios.post(url, new URLSearchParams(params).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'AuthToken': authToken,
        },
        timeout: 60_000,
      });
      xoalaResponse = httpRes.data;
      this.logger.log(
        `[Xoala S2S] Response ref=${orderNumber} httpStatus=${httpRes.status} txStatus=${xoalaResponse?.transactionStatus} resultCode=${xoalaResponse?.result?.code}`,
      );
    } catch (err: any) {
      const httpStatus = err?.response?.status;
      const respBody = err?.response?.data;
      const message =
        respBody?.result?.description ||
        respBody?.message ||
        err?.message ||
        'Network error';

      // 401 → token was rejected; clear cache so next attempt re-fetches.
      if (httpStatus === 401) {
        this.xoalaAuthService.invalidate();
      }

      this.logger.error(
        `[Xoala S2S] HTTP error ref=${orderNumber} httpStatus=${httpStatus} body=${JSON.stringify(respBody).slice(0, 500)}`,
      );

      await (this.prisma.payment as any).update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failureReason: `S2S call failed: ${message}`,
          callbackPayload: respBody ?? { error: err?.message },
        },
      });
      return { status: 'failed', reference: orderNumber, paymentId: payment.id, message };
    }

    const resultCode = String(xoalaResponse?.result?.code ?? '');
    const transactionStatus = String(xoalaResponse?.transactionStatus ?? '').toUpperCase();
    const providerPaymentId = xoalaResponse?.paymentId
      ? String(xoalaResponse.paymentId)
      : null;
    const respCard = xoalaResponse?.card || {};
    const cardSummary = {
      bin: respCard.bin || null,
      last4: respCard.last4Digits || respCard.last4 || null,
      brand: xoalaResponse.paymentBrand || detectedBrand,
    };

    // ── Branch 1: 3DS required (cardholder must visit ACS) ──

    const redirect = xoalaResponse?.redirect;
    const redirectUrl: string | null =
      redirect?.url ||
      xoalaResponse?.redirectUrl ||
      xoalaResponse?.acsUrl ||
      null;
    if (redirectUrl && transactionStatus !== 'Y') {
      await (this.prisma.payment as any).update({
        where: { id: payment.id },
        data: {
          providerPaymentId,
          orderStatus: transactionStatus || '3D',
          callbackPayload: xoalaResponse,
          cardBin: cardSummary.bin,
          cardLast4: cardSummary.last4,
          cardBrand: cardSummary.brand || detectedBrand,
          metadata: {
            ...(payment.metadata as object || {}),
            card: cardSummary,
          },
        },
      });
      this.logger.log(`[Xoala S2S] 3DS required ref=${orderNumber}, redirecting to ACS`);
      return {
        status: 'requires_action',
        reference: orderNumber,
        paymentId: payment.id,
        redirectUrl,
        redirectMethod: (redirect?.method || 'GET').toUpperCase(),
        redirectParams: Array.isArray(redirect?.parameters)
          ? redirect.parameters
          : null,
      };
    }

    // ── Branch 2: Approved instantly (no 3DS) ──
    if (resultCode === '00001' && transactionStatus === 'Y') {
      await (this.prisma.payment as any).update({
        where: { id: payment.id },
        data: {
          status: 'succeeded',
          providerPaymentId,
          orderStatus: transactionStatus,
          callbackPayload: xoalaResponse,
          cardBin: cardSummary.bin,
          cardLast4: cardSummary.last4,
          cardBrand: cardSummary.brand || detectedBrand,
          metadata: {
            ...(payment.metadata as object || {}),
            card: cardSummary,
          },
        },
      });

      // Provision account immediately. The function is idempotent, so if the
      // notification webhook fires later it will detect tradingAccountId and
      // return the existing account without re-running side effects.
      try {
        const account = await this.provisionChallengeAfterPaymentSuccess(payment.id);
        return {
          status: 'succeeded',
          reference: orderNumber,
          paymentId: payment.id,
          tradingAccountId: account?.id,
        };
      } catch (err: any) {
        this.logger.error(
          `[Xoala S2S] Inline provisioning failed for ref=${orderNumber} (webhook will retry): ${err?.message}`,
        );
        // Payment did succeed — don't surface a failed status to the user.
        return { status: 'succeeded', reference: orderNumber, paymentId: payment.id };
      }
    }

    // ── Branch 3: Declined / failed ──
    const failMessage =
      xoalaResponse?.result?.description ||
      xoalaResponse?.remark ||
      'Payment declined';

    // Xoala can return the SAME paymentId across attempts for duplicate-

    const failData = {
      status: 'failed',
      orderStatus: transactionStatus,
      callbackPayload: xoalaResponse,
      failureReason: failMessage,
      cardBin: cardSummary.bin,
      cardLast4: cardSummary.last4,
      cardBrand: cardSummary.brand || detectedBrand,
      metadata: {
        ...(payment.metadata as object || {}),
        card: cardSummary,
      },
    };
    try {
      await (this.prisma.payment as any).update({
        where: { id: payment.id },
        data: { ...failData, providerPaymentId },
      });
    } catch (err: any) {
      if (err?.code === 'P2002') {
        this.logger.warn(
          `[Xoala S2S] providerPaymentId=${providerPaymentId} already exists; saving failure without it (ref=${orderNumber})`,
        );
        await (this.prisma.payment as any).update({
          where: { id: payment.id },
          data: failData,
        });
      } else {
        throw err;
      }
    }
    return {
      status: 'failed',
      reference: orderNumber,
      paymentId: payment.id,
      message: failMessage,
    };
  }


  // ─── Provision trading account after successful payment ───────────

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
