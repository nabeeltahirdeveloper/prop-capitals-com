import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import axios from 'axios';

import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';
import { generatePassword } from 'src/utils/generate-password.util';

// ─── WorldCard S2S APM integration ─────────────────────────────────────
// Reference: https://docs.world-card.co/docs/guides/s2s_apm/
//
// Server-to-server only — we collect the card on our /pay/<slug> page and
// POST it directly to the WorldCard Payment Platform URL. No hosted page
// redirect. The platform may respond with:
//   - SUCCESS / SETTLED — approved, provision the account.
//   - REDIRECT / REDIRECT — 3DS or APM challenge; bounce the customer.
//   - DECLINED — show the decline reason.
//   - UNDEFINED / PREPARE — async; final result arrives on the webhook.
//
// All requests are application/x-www-form-urlencoded. The brand identifier
// and the card parameter keys are env-overridable because the docs only
// document the SALE skeleton — the per-brand parameter naming lives in the
// merchant's Appendix B, which is account-specific.

interface WorldCardChargeInput {
  authUserId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;

  slug?: string;
  challengeId?: string;
  accountSize?: any;
  challengeType?: string;

  platform?: string;
  tradingPlatform?: string;
  trading_platform?: string;
  brokerPlatform?: string;

  brandSlug?: string;
  linkSlug?: string;

  // S2S only — required.
  card?: {
    number: string;
    expiryMonth: string | number;
    expiryYear: string | number;
    cvv: string;
    holder?: string;
    brand?: string;
  };

  // Cardholder IP — picked from req.ip when available, falls back to
  // X-Forwarded-For. Required by the gateway.
  payerIp?: string;
}

@Injectable()
export class WorldCardService {
  private readonly logger = new Logger(WorldCardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,
  ) {}

  // ─── Card brand detection ───────────────────────────────────────────
  // Visa: starts with 4. Mastercard: 51-55 or 2221-2720. Anything else
  // is unsupported by this merchant's terminals (matches Xoala flow).
  private detectCardBrand(rawNumber: string): 'VISA' | 'MC' | null {
    const digits = String(rawNumber || '').replace(/\D/g, '');
    if (/^4\d{12,18}$/.test(digits)) return 'VISA';
    if (
      /^(5[1-5]\d{14}|2(2[2-9]\d|[3-6]\d{2}|7([01]\d|20))\d{12})$/.test(digits)
    ) {
      return 'MC';
    }
    return null;
  }

  // The `brand` field WorldCard expects depends on the merchant's
  // Appendix B mapping. We try the env override first, then fall back to
  // common conventions.
  private resolveBrandIdentifier(detectedBrand: 'VISA' | 'MC'): string {
    if (detectedBrand === 'VISA') {
      return this.configService.get<string>('WORLDCARD_BRAND_VISA') || 'visa';
    }
    return this.configService.get<string>('WORLDCARD_BRAND_MC') || 'mastercard';
  }

  // ─── SALE request hash ──────────────────────────────────────────────
  // Per docs/Appendix A: md5(strtoupper(strrev(identifier + order_id +
  //                                            order_amount + order_currency
  //                                            + PASSWORD)))
  private generateSaleHash(input: {
    identifier: string;
    orderId: string;
    orderAmount: string;
    orderCurrency: string;
    password: string;
  }): string {
    const concat =
      input.identifier +
      input.orderId +
      input.orderAmount +
      input.orderCurrency +
      input.password;
    const reversed = concat.split('').reverse().join('');
    const upper = reversed.toUpperCase();
    return crypto.createHash('md5').update(upper).digest('hex');
  }

  // ─── Guest user resolution ──────────────────────────────────────────
  // Mirrors the Xoala S2S helper: looks up by authUserId / email, creates
  // a stub user with a random password if needed so they can later set
  // their own via the password-reset email.
  private async resolveCheckoutUser(input: WorldCardChargeInput) {
    if (input.authUserId) {
      const user = await (this.prisma.user as any).findUnique({
        where: { id: input.authUserId },
        include: { profile: true },
      });
      if (!user) throw new NotFoundException('Authenticated user not found');
      return { user, wasCreated: false, isGuestCheckout: false };
    }

    if (!input.email || typeof input.email !== 'string') {
      throw new BadRequestException('Missing required field: email');
    }
    if (!input.firstName || !input.lastName) {
      throw new BadRequestException('Missing required name fields');
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail)) {
      throw new BadRequestException('Enter a valid email address');
    }

    let user = await (this.prisma.user as any).findUnique({
      where: { email: normalizedEmail },
      include: { profile: true },
    });

    if (user) {
      const existingProfile = await this.prisma.userProfile.findUnique({
        where: { userId: user.id },
      });
      if (!existingProfile) {
        await this.prisma.userProfile.create({
          data: {
            userId: user.id,
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone || null,
            country: input.country || null,
            address: input.address || null,
            city: input.city || null,
          } as any,
        });
      }
      return { user, wasCreated: false, isGuestCheckout: true };
    }

    const randomPassword = generatePassword(20);
    const hashed = await bcrypt.hash(randomPassword, 10);
    user = await (this.prisma.user as any).create({
      data: {
        email: normalizedEmail,
        password: hashed,
        passwordSet: false,
        profile: {
          create: {
            firstName: input.firstName,
            lastName: input.lastName,
            phone: input.phone || null,
            country: input.country || null,
            address: input.address || null,
            city: input.city || null,
          },
        },
      } as any,
      include: { profile: true },
    });
    this.logger.log(
      `[WorldCard S2S] Created guest user ${user.id} (${normalizedEmail})`,
    );
    return { user, wasCreated: true, isGuestCheckout: true };
  }

  // Tiny duplicate of payments.service helpers so this file stays
  // standalone and doesn't drag in the full PaymentsService surface.
  private normalizePlatform(raw: string | undefined): string {
    if (!raw) return 'MT5';
    const map: Record<string, string> = {
      MT4: 'MT4',
      MT5: 'MT5',
      cTrader: 'CTRADER',
      DXTrade: 'DXTRADE',
      CTRADER: 'CTRADER',
      DXTRADE: 'DXTRADE',
      BYBIT: 'BYBIT',
      PT5: 'PT5',
      TRADELOCKER: 'TRADELOCKER',
    };
    return map[raw] || raw;
  }

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

  // Build the `parameters[xxx]` keys for card data. The exact key names
  // ("pan", "card_number", "cardNumber", etc) are merchant-specific per
  // Appendix B — we expose env overrides so the team can match what their
  // WorldCard account is configured for without redeploying code.
  private cardParamKeys() {
    return {
      number:
        this.configService.get<string>('WORLDCARD_PARAM_CARD_NUMBER') || 'pan',
      expMonth:
        this.configService.get<string>('WORLDCARD_PARAM_EXP_MONTH') ||
        'exp_month',
      expYear:
        this.configService.get<string>('WORLDCARD_PARAM_EXP_YEAR') ||
        'exp_year',
      cvv: this.configService.get<string>('WORLDCARD_PARAM_CVV') || 'cvv2',
      holder:
        this.configService.get<string>('WORLDCARD_PARAM_HOLDER') ||
        'card_holder',
    };
  }

  // ─── Public: S2S SALE charge ─────────────────────────────────────────
  async createCharge(data: WorldCardChargeInput) {
    const {
      slug,
      challengeId,
      accountSize,
      challengeType,
      platform,
      tradingPlatform,
      trading_platform,
      brokerPlatform,
      brandSlug,
      linkSlug,
      card,
      payerIp,
    } = data || {};

    if (!slug && !challengeId && !accountSize) {
      throw new BadRequestException(
        'Missing required field: slug, challengeId, or accountSize',
      );
    }
    if (
      !card?.number ||
      !card?.expiryMonth ||
      !card?.expiryYear ||
      !card?.cvv
    ) {
      throw new BadRequestException(
        'Card details (number, expiryMonth, expiryYear, cvv) are required',
      );
    }

    // Re-derive the card brand server-side — never trust the client.
    const sanitizedCardNumber = String(card.number).replace(/\D/g, '');
    const detectedBrand = this.detectCardBrand(sanitizedCardNumber);
    if (!detectedBrand) {
      throw new BadRequestException(
        'We only accept Visa and Mastercard payments.',
      );
    }

    // ── Challenge + brand attribution resolution ─────────────────────
    let challenge: any = null;
    let brandLink: any = null;

    if (challengeId && typeof challengeId === 'string') {
      challenge = await this.prisma.challenge.findUnique({
        where: { id: challengeId },
      });
    }
    if (!challenge && slug && typeof slug === 'string') {
      challenge = await (this.prisma.challenge as any).findUnique({
        where: { slug },
      });
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
        one_step: 'one_phase',
        'one-phase': 'one_phase',
        one_phase: 'one_phase',
        '2-step': 'two_phase',
        'two-step': 'two_phase',
        two_step: 'two_phase',
        'two-phase': 'two_phase',
        two_phase: 'two_phase',
      };
      const mappedType =
        typeMap[String(challengeType || '').toLowerCase()] ||
        challengeType ||
        'two_phase';
      challenge = await this.prisma.challenge.findFirst({
        where: {
          accountSize: sizeNumber,
          challengeType: mappedType,
          isActive: true,
        },
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
        brandLink = {
          brandId: brand.id,
          brand,
          id: null,
          slug: null,
          active: true,
        };
      }
    }
    // Provider lock: refuse if the brand admin pinned the link to a
    // different gateway. The router is supposed to keep customers in the
    // right flow but we double-check server-side.
    if (
      brandLink?.provider &&
      String(brandLink.provider).toUpperCase() !== 'WORLDCARD'
    ) {
      throw new BadRequestException(
        'This link is configured to use a different payment gateway.',
      );
    }

    const linkPriceOverride: number | null =
      brandLink?.active &&
      brandLink?.amount != null &&
      Number(brandLink.amount) > 0
        ? Number(brandLink.amount)
        : null;
    if (!challenge && brandLink?.active && linkPriceOverride != null) {
      const fallbackSize =
        brandLink.challenge?.accountSize ??
        (accountSize ? this.parseAccountSize(accountSize) : 0);
      const fallbackType =
        brandLink.challenge?.challengeType ?? challengeType ?? 'one_phase';
      const matched = await this.prisma.challenge.findFirst({
        where: {
          accountSize: fallbackSize,
          challengeType: fallbackType,
          isActive: true,
        },
      });
      if (matched) challenge = matched;
    }

    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found');
    }

    const billingFirstName =
      typeof data.firstName === 'string' ? data.firstName.trim() : '';
    const billingLastName =
      typeof data.lastName === 'string' ? data.lastName.trim() : '';
    if (!data.authUserId && (!billingFirstName || !billingLastName)) {
      throw new BadRequestException('Missing required name fields');
    }

    const { user, wasCreated, isGuestCheckout } =
      await this.resolveCheckoutUser(data);

    const basePrice =
      linkPriceOverride != null ? linkPriceOverride : challenge.price;
    const amountCents = Math.round(basePrice * 100);
    const orderCurrency = (
      brandLink?.currency ||
      challenge.currency ||
      'USD'
    ).toUpperCase();
    const orderAmount = (amountCents / 100).toFixed(2);
    const orderDescription = `${challenge.name} ${challenge.accountSize} Account`;

    const selectedPlatform =
      platform ||
      tradingPlatform ||
      trading_platform ||
      brokerPlatform ||
      challenge.platform;
    const normalizedPlatform = this.normalizePlatform(selectedPlatform);

    const orderId = `WC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    // identifier per docs must be unique per request; we reuse orderId
    // since the platform stores both side-by-side.
    const identifier = orderId;

    // ── Env / credentials ────────────────────────────────────────────
    const clientKey = this.configService.get<string>('WORLDCARD_MERCHANT_KEY');
    const password = this.configService.get<string>('WORLDCARD_MERCHANT_PASS');
    const paymentUrl = this.configService.get<string>('WORLDCARD_PAYMENT_URL');
    const notificationUrl = this.configService.get<string>(
      'WORLDCARD_NOTIFICATION_URL',
    );
    const frontendUrl = this.configService.get<string>('APP_FRONTEND_URL');
    const backendUrl = this.configService.get<string>('APP_BACKEND_URL');
    const channelId =
      this.configService.get<string>('WORLDCARD_CHANNEL_ID') || '';

    if (!clientKey || !password || !paymentUrl || !frontendUrl) {
      this.logger.error('Missing WorldCard env vars', {
        clientKey: !!clientKey,
        password: !!password,
        paymentUrl: !!paymentUrl,
        frontendUrl: !!frontendUrl,
      });
      throw new InternalServerErrorException(
        'WorldCard environment variables not configured',
      );
    }

    const brandIdentifier = this.resolveBrandIdentifier(detectedBrand);
    const hash = this.generateSaleHash({
      identifier,
      orderId,
      orderAmount,
      orderCurrency,
      password,
    });

    // Cardholder browser returns here after 3DS / APM redirect. We funnel
    // through a backend hop so SPA hosts that don't serve HTML on POST
    // still resolve the success page.
    const returnUrl = backendUrl
      ? `${backendUrl}/payments/worldcard/return?reference=${orderId}`
      : `${frontendUrl}/pay/success?reference=${orderId}`;

    // PCI-safe payload to persist (NEVER PAN, NEVER CVV).
    const safePayload: Record<string, any> = {
      action: 'SALE',
      client_key: clientKey,
      brand: brandIdentifier,
      order_id: orderId,
      identifier,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      order_description: orderDescription,
      return_url: returnUrl,
      payer_first_name: billingFirstName || user.profile?.firstName || null,
      payer_last_name: billingLastName || user.profile?.lastName || null,
      payer_email: user.email,
      payer_phone: data.phone || null,
      payer_country: data.country || null,
      payer_city: data.city || null,
      payer_state: data.state || null,
      payer_zip: data.postalCode || null,
      payer_address: data.address || null,
      payer_ip: payerIp || null,
      card: {
        brand: detectedBrand,
        expiryMonth: card.expiryMonth,
        expiryYear: card.expiryYear,
        holder: card.holder || null,
      },
    };

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
        provider: 'worldcard',
        status: 'pending',
        reference: orderId,

        billingFirstName: billingFirstName || null,
        billingLastName: billingLastName || null,
        billingEmail: user.email,
        billingPhone: data.phone || null,
        billingCountry: data.country || null,
        billingAddress: data.address || null,
        billingCity: data.city || null,
        billingState: data.state || null,
        billingPostalCode: data.postalCode || null,

        cardholderName: card.holder || null,
        cardBrand: detectedBrand,
        cardExpiryMonth: String(card.expiryMonth),
        cardExpiryYear: String(card.expiryYear),

        accountSize: challenge.accountSize,
        challengeType: challenge.challengeType,
        platform: normalizedPlatform,

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
          isGuestCheckout,
          userCreatedForCheckout: wasCreated,
          flow: 'worldcard-s2s',
        },
        sessionPayload: safePayload,
      },
    });

    this.logger.log(
      `[WorldCard S2S] Payment row created: id=${payment.id}, ref=${orderId}, amount=${orderAmount} ${orderCurrency}`,
    );

    // ── Build form-urlencoded body for WorldCard ─────────────────────
    const keys = this.cardParamKeys();
    const expMonth = String(card.expiryMonth).padStart(2, '0');
    // expiryYear may be sent as 4-digit (e.g. "2028") — that's the gateway
    // convention. Tolerate both YY and YYYY by normalizing here.
    const expYearRaw = String(card.expiryYear);
    const expYear = expYearRaw.length === 2 ? `20${expYearRaw}` : expYearRaw;

    const params: Record<string, string> = {
      action: 'SALE',
      client_key: clientKey,
      brand: brandIdentifier,
      order_id: orderId,
      identifier,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      order_description: orderDescription,
      return_url: returnUrl,
      hash,

      [`parameters[${keys.number}]`]: sanitizedCardNumber,
      [`parameters[${keys.expMonth}]`]: expMonth,
      [`parameters[${keys.expYear}]`]: expYear,
      [`parameters[${keys.cvv}]`]: String(card.cvv),
    };

    if (channelId) params['channel_id'] = channelId;
    if (notificationUrl) params['notification_url'] = notificationUrl;

    if (billingFirstName) params['payer_first_name'] = billingFirstName;
    if (billingLastName) params['payer_last_name'] = billingLastName;
    if (user.email) params['payer_email'] = user.email;
    if (data.phone) params['payer_phone'] = String(data.phone);
    if (data.country) params['payer_country'] = String(data.country);
    if (data.state) params['payer_state'] = String(data.state);
    if (data.city) params['payer_city'] = String(data.city);
    if (data.postalCode) params['payer_zip'] = String(data.postalCode);
    if (data.address) params['payer_address'] = String(data.address);
    if (payerIp) params['payer_ip'] = String(payerIp);
    if (card.holder) params[`parameters[${keys.holder}]`] = String(card.holder);

    // Echo a couple custom_data fields back so they appear on the
    // callback payload — useful for tracing brand attribution.
    params['custom_data[challenge_id]'] = challenge.id;
    params['custom_data[platform]'] = normalizedPlatform;
    if (brandLink?.id) params['custom_data[brand_link_id]'] = brandLink.id;

    // PCI-safe redacted echo of the form body for diagnostics. Card data
    // is masked; everything else is exactly what we POST so we can spot
    // hash/key/brand misconfig in logs without re-running the request.
    const redactedParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (k.endsWith('[pan]') || k.endsWith('[card_number]') || k.endsWith('[cardNumber]')) {
        redactedParams[k] = v.length > 4 ? `****${v.slice(-4)}` : '****';
      } else if (k.endsWith('[cvv]') || k.endsWith('[cvv2]')) {
        redactedParams[k] = '***';
      } else {
        redactedParams[k] = v;
      }
    }
    this.logger.log(
      `[WorldCard S2S] POST ${paymentUrl} ref=${orderId} params=${JSON.stringify(redactedParams)}`,
    );

    let wcResponse: any;
    let rawResponseText: string | null = null;
    let responseHttpStatus: number | null = null;
    try {
      const httpRes = await axios.post(
        paymentUrl,
        new URLSearchParams(params).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 60_000,
          // Treat 2xx as success but capture EVERYTHING else manually so
          // we can log + return the gateway's actual body instead of
          // swallowing it inside axios's thrown error.
          validateStatus: () => true,
          transformResponse: [(d) => d],
        },
      );
      responseHttpStatus = httpRes.status;
      rawResponseText = typeof httpRes.data === 'string' ? httpRes.data : JSON.stringify(httpRes.data);

      try {
        wcResponse = rawResponseText ? JSON.parse(rawResponseText) : {};
      } catch {
        wcResponse = { raw: rawResponseText };
      }

      this.logger.log(
        `[WorldCard S2S] Response ref=${orderId} httpStatus=${httpRes.status} bodyPreview=${(rawResponseText || '').slice(0, 500)}`,
      );

      if (httpRes.status >= 400) {
        // Gateway-side error — surface the raw body so we know whether
        // it's an IP-allowlist issue, missing protocol mapping, wrong
        // endpoint path, etc. WorldCard usually returns either a JSON
        // body with { error_message } or a plain text snippet.
        const failMessage =
          (wcResponse && (wcResponse.error_message || wcResponse.decline_reason || wcResponse.message)) ||
          (rawResponseText && rawResponseText.slice(0, 300)) ||
          `Gateway returned HTTP ${httpRes.status}`;

        this.logger.error(
          `[WorldCard S2S] Gateway error ref=${orderId} httpStatus=${httpRes.status} body=${(rawResponseText || '').slice(0, 1000)}`,
        );

        await (this.prisma.payment as any).update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            failureReason: `Gateway HTTP ${httpRes.status}: ${failMessage}`,
            callbackPayload: wcResponse ?? { error: rawResponseText },
          },
        });
        return {
          provider: 'worldcard',
          status: 'failed',
          reference: orderId,
          paymentId: payment.id,
          message: `Payment gateway error (HTTP ${httpRes.status}). ${failMessage}`,
        };
      }
    } catch (err: any) {
      // Only true network / timeout / DNS failures reach here because
      // validateStatus: () => true swallows HTTP errors above.
      const message = err?.message || 'Network error';
      this.logger.error(
        `[WorldCard S2S] Network error ref=${orderId} message=${message}`,
        err?.stack,
      );

      await (this.prisma.payment as any).update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failureReason: `Network error contacting WorldCard: ${message}`,
          callbackPayload: { error: message },
        },
      });
      return {
        provider: 'worldcard',
        status: 'failed',
        reference: orderId,
        paymentId: payment.id,
        message: `Could not reach the payment gateway (${message}). Please try again in a moment.`,
      };
    }

    const result = String(wcResponse?.result ?? '').toUpperCase();
    const txStatus = String(wcResponse?.status ?? '').toUpperCase();
    const providerPaymentId = wcResponse?.trans_id
      ? String(wcResponse.trans_id)
      : null;

    // ── Branch 1: REDIRECT (3DS or APM challenge) ───────────────────
    if (result === 'REDIRECT' && wcResponse?.redirect_url) {
      await (this.prisma.payment as any).update({
        where: { id: payment.id },
        data: {
          providerPaymentId,
          orderStatus: txStatus || 'REDIRECT',
          callbackPayload: wcResponse,
        },
      });
      this.logger.log(`[WorldCard S2S] Redirect required ref=${orderId}`);
      return {
        provider: 'worldcard',
        status: 'requires_action',
        reference: orderId,
        paymentId: payment.id,
        redirectUrl: wcResponse.redirect_url,
        redirectMethod: String(
          wcResponse.redirect_method || 'GET',
        ).toUpperCase(),
        redirectParams: Array.isArray(wcResponse.redirect_params)
          ? wcResponse.redirect_params
          : wcResponse.redirect_params &&
              typeof wcResponse.redirect_params === 'object'
            ? Object.entries(wcResponse.redirect_params).map(
                ([name, value]) => ({ name, value }),
              )
            : null,
      };
    }

    // ── Branch 2: SUCCESS / SETTLED ─────────────────────────────────
    if (result === 'SUCCESS' && txStatus === 'SETTLED') {
      await (this.prisma.payment as any).update({
        where: { id: payment.id },
        data: {
          status: 'succeeded',
          providerPaymentId,
          orderStatus: txStatus,
          callbackPayload: wcResponse,
        },
      });
      try {
        const account =
          await this.paymentsService.provisionChallengeAfterPaymentSuccess(
            payment.id,
          );
        return {
          provider: 'worldcard',
          status: 'succeeded',
          reference: orderId,
          paymentId: payment.id,
          tradingAccountId: account?.id,
        };
      } catch (err: any) {
        this.logger.error(
          `[WorldCard S2S] Inline provisioning failed for ref=${orderId} (webhook will retry): ${err?.message}`,
        );
        return {
          provider: 'worldcard',
          status: 'succeeded',
          reference: orderId,
          paymentId: payment.id,
        };
      }
    }

    // ── Branch 3: UNDEFINED / PREPARE — wait for webhook ────────────
    if (result === 'UNDEFINED' || txStatus === 'PREPARE' || result === 'INIT') {
      await (this.prisma.payment as any).update({
        where: { id: payment.id },
        data: {
          providerPaymentId,
          orderStatus: txStatus,
          callbackPayload: wcResponse,
        },
      });
      return {
        provider: 'worldcard',
        status: 'pending',
        reference: orderId,
        paymentId: payment.id,
        message: 'Awaiting final result',
      };
    }

    // ── Branch 4: DECLINED / ERROR ──────────────────────────────────
    const failMessage =
      wcResponse?.decline_reason ||
      wcResponse?.error_message ||
      'Payment declined';

    await (this.prisma.payment as any).update({
      where: { id: payment.id },
      data: {
        status: 'failed',
        providerPaymentId,
        orderStatus: txStatus || 'DECLINED',
        callbackPayload: wcResponse,
        failureReason: failMessage,
      },
    });
    return {
      provider: 'worldcard',
      status: 'failed',
      reference: orderId,
      paymentId: payment.id,
      message: failMessage,
    };
  }
}

// ─── Webhook (notification_url) handler ────────────────────────────────
// Verifies the WorldCard callback signature (Appendix A "Sale callback
// signature": sort params alphabetically, reverse each value, concat,
// uppercase, append PASSWORD uppercase, MD5) and updates the payment row.
@Injectable()
export class WorldCardWebhookService {
  private readonly logger = new Logger(WorldCardWebhookService.name);

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

  // Recursive helper: sort keys alphabetically and concatenate reversed
  // primitive values. Matches the PHP-style array_walk_recursive +
  // ksort + implode sequence from Appendix A.
  private buildCallbackSource(input: any): string {
    if (input === null || input === undefined) return '';
    if (Array.isArray(input)) {
      // PHP-style numeric-keyed arrays: walk in numeric order.
      return input.map((v) => this.buildCallbackSource(v)).join('');
    }
    if (typeof input === 'object') {
      const sortedKeys = Object.keys(input).sort();
      return sortedKeys.map((k) => this.buildCallbackSource(input[k])).join('');
    }
    const reversed = String(input).split('').reverse().join('');
    return reversed;
  }

  private verifyCallbackHash(payload: any): void {
    const password = this.configService.get<string>('WORLDCARD_MERCHANT_PASS');
    if (!password) {
      throw new BadRequestException('Missing WORLDCARD_MERCHANT_PASS in env');
    }

    const incomingHash = this.requireString(payload.hash, 'hash');

    // Build a clone without the hash itself (the spec excludes it).
    const clone: any = { ...payload };
    delete clone.hash;

    const concat = this.buildCallbackSource(clone);
    const upper = concat.toUpperCase();
    const withPassword = upper + password.toUpperCase();
    const expected = crypto
      .createHash('md5')
      .update(withPassword)
      .digest('hex');

    if (incomingHash.toLowerCase() !== expected.toLowerCase()) {
      this.logger.warn(
        `WorldCard callback hash mismatch for order_id=${payload?.order_id} (incoming=${incomingHash}, expected=${expected})`,
      );
      throw new BadRequestException('Invalid callback hash');
    }
  }

  private normalizeStatus(
    result: string,
    status: string,
  ): 'pending' | 'failed' | 'succeeded' {
    const r = String(result || '').toUpperCase();
    const s = String(status || '').toUpperCase();
    if (r === 'SUCCESS' && (s === 'SETTLED' || s === 'SUCCESS'))
      return 'succeeded';
    if (r === 'DECLINED' || r === 'FAIL' || r === 'FAILED' || r === 'ERROR')
      return 'failed';
    if (s === 'DECLINED' || s === 'FAIL') return 'failed';
    return 'pending';
  }

  async handleCallback(payload: any) {
    const orderId = this.requireString(payload.order_id, 'order_id');
    const result = this.requireString(payload.result, 'result');
    const status = String(payload.status || '').trim();

    this.logger.log(
      `WorldCard callback received: order_id=${orderId}, result=${result}, status=${status}, action=${payload?.action}`,
    );
    this.logger.log(
      `WorldCard callback payload: ${JSON.stringify(payload).slice(0, 1000)}`,
    );

    // Verify before doing anything else — refuse to mutate state on a
    // forged callback.
    this.verifyCallbackHash(payload);

    const payment = await this.prisma.payment.findUnique({
      where: { reference: orderId },
    });
    if (!payment) {
      throw new NotFoundException(
        `Payment not found for reference: ${orderId}`,
      );
    }

    if (payment.amount !== undefined && payload.amount !== undefined) {
      const callbackAmountCents = Math.round(Number(payload.amount) * 100);
      if (
        !Number.isNaN(callbackAmountCents) &&
        payment.amount !== callbackAmountCents
      ) {
        this.logger.warn(
          `WorldCard amount mismatch: stored=${payment.amount}c, callback=${callbackAmountCents}c (raw="${payload.amount}")`,
        );
        throw new BadRequestException('Payment amount mismatch');
      }
    }

    const providerPaymentId = payload.trans_id
      ? String(payload.trans_id)
      : null;
    const nextStatus = this.normalizeStatus(result, status);

    // Never downgrade a succeeded payment.
    if (payment.status === 'succeeded') {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          ...(providerPaymentId ? { providerPaymentId } : {}),
          orderStatus: status || result,
          callbackPayload: payload,
          failureReason: payload.decline_reason
            ? String(payload.decline_reason)
            : null,
        },
      });
      return 'OK';
    }

    const updatedPayment = await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        ...(providerPaymentId ? { providerPaymentId } : {}),
        orderStatus: status || result,
        callbackPayload: payload,
        failureReason: payload.decline_reason
          ? String(payload.decline_reason)
          : null,
        status: nextStatus,
      },
    });

    this.logger.log(
      `WorldCard callback processed: ref=${updatedPayment.reference}, status=${updatedPayment.status}`,
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

    // Per docs the callback URL must return the literal string "OK" so
    // the gateway considers the delivery acknowledged.
    return 'OK';
  }
}
