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

  // QuickLink overrides — the link carries its own price/currency that
  // must win over the challenge default (the challenge is still used for
  // account size / platform / drawdown).
  amountOverride?: number | null;
  currency?: string;

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

  // Hash for the hosted Standard Checkout session API:
  //   SHA1( MD5( orderNumber + amount + currency + description + merchantPass ).toUpperCase() )
  private generateSessionHash(
    orderNumber: string,
    amount: string,
    currency: string,
    description: string,
    password: string,
  ): string {
    const source = orderNumber + amount + currency + description + password;
    const upperSource = source.toUpperCase();
    const md5 = crypto.createHash('md5').update(upperSource).digest('hex');
    return crypto.createHash('sha1').update(md5).digest('hex');
  }

  // Public: Hosted-page checkout session.
  // POSTs to {BASE_URL}/api/v1/session and gets back a redirect_url that
  // the customer's browser follows to enter card details on WorldCard's
  // own hosted page. Used when the merchant account doesn't have the
  // S2S APM protocol mapped (which is the default WorldCard setup).
  // No card data ever crosses our backend in this flow.
  async createHostedSession(data: WorldCardChargeInput) {
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
    } = data || {};

    if (!slug && !challengeId && !accountSize) {
      throw new BadRequestException(
        'Missing required field: slug, challengeId, or accountSize',
      );
    }

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
        if (brandLink?.active) challenge = brandLink.challenge;
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

    // QuickLink amount/currency win over the challenge default and the
    // DirectPurchaseLink override. This keeps the hosted page total in sync
    // with what the customer saw on the /q/ summary.
    const quickLinkOverride =
      data.amountOverride != null && Number(data.amountOverride) > 0
        ? Number(data.amountOverride)
        : null;
    const basePrice =
      quickLinkOverride != null
        ? quickLinkOverride
        : linkPriceOverride != null
          ? linkPriceOverride
          : challenge.price;
    const amountCents = Math.round(basePrice * 100);
    const orderCurrency = String(
      data.currency || brandLink?.currency || challenge.currency || 'USD',
    ).toUpperCase();
    const worldCardAmount = (amountCents / 100).toFixed(2);
    const orderDescription = `${challenge.name} ${challenge.accountSize} Account`;

    const selectedPlatform =
      platform ||
      tradingPlatform ||
      trading_platform ||
      brokerPlatform ||
      challenge.platform;
    const normalizedPlatform = this.normalizePlatform(selectedPlatform);

    // Accept both naming conventions: the documented *_MERCHANT_*/*_PAYMENT_URL
    // keys and the legacy *_CLIENT_KEY/*_PASSWORD/*_BASE_URL keys that exist in
    // the deployed .env. Whichever is set wins — no rename required.
    const merchantKey =
      this.configService.get<string>('WORLDCARD_MERCHANT_KEY') ||
      this.configService.get<string>('WORLDCARD_CLIENT_KEY');
    const merchantPass =
      this.configService.get<string>('WORLDCARD_MERCHANT_PASS') ||
      this.configService.get<string>('WORLDCARD_PASSWORD');
    const notificationUrl =
      this.configService.get<string>('WORLDCARD_NOTIFICATION_URL') ||
      this.configService.get<string>('WORLDCARD_CALLBACK_URL');
    // The session endpoint lives at {host}/api/v1/session. We strip any
    // trailing slash so WORLDCARD_PAYMENT_URL=https://pay.world-card.co
    // (with or without slash) builds the right URL.
    const baseUrl = (
      this.configService.get<string>('WORLDCARD_PAYMENT_URL') ||
      this.configService.get<string>('WORLDCARD_BASE_URL') ||
      ''
    ).replace(/\/+$/, '');
    const frontendUrl = this.configService.get<string>('APP_FRONTEND_URL');

    if (!merchantKey || !merchantPass || !baseUrl || !frontendUrl) {
      this.logger.error('Missing WorldCard env vars (hosted)', {
        merchantKey: !!merchantKey,
        merchantPass: !!merchantPass,
        baseUrl: !!baseUrl,
        frontendUrl: !!frontendUrl,
      });
      throw new InternalServerErrorException(
        'WorldCard environment variables not configured',
      );
    }

    const orderNumber = `WC-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const sessionHash = this.generateSessionHash(
      orderNumber,
      worldCardAmount,
      orderCurrency,
      orderDescription,
      merchantPass,
    );

    const successUrl = `${frontendUrl}/pay/success?reference=${orderNumber}`;
    const cancelUrl = `${frontendUrl}/pay/fail?reference=${orderNumber}`;
    const errorUrl = `${frontendUrl}/pay/fail?reference=${orderNumber}`;

    // WorldCard's hosted Checkout `customer` schema is { name, email,
    // birth_date } — a SINGLE `name` ("First Last"), NOT first_name/last_name,
    // and no phone/country/address/city. Sending undocumented fields can fail
    // validation. Name + the rest of the billing are collected by WorldCard
    // on its own page, so we only send what we reliably have.
    const customer: Record<string, any> = { email: user.email };
    const customerName = [billingFirstName, billingLastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (customerName.length >= 2) customer.name = customerName;

    // Per the docs "Methods" page the card flow is requested with
    // methods: ["card"], so that's our default. Override with
    // WORLDCARD_METHODS (comma-separated) if the account uses a different
    // connector identifier.
    const methodsCsv = this.configService.get<string>('WORLDCARD_METHODS');
    const methods = methodsCsv
      ? methodsCsv
          .split(',')
          .map((m) => m.trim())
          .filter(Boolean)
      : ['card'];

    const sessionPayload: Record<string, any> = {
      merchant_key: merchantKey,
      operation: 'purchase',
      ...(methods && methods.length ? { methods } : {}),
      hash: sessionHash,
      success_url: successUrl,
      cancel_url: cancelUrl,
      error_url: errorUrl,
      order: {
        number: orderNumber,
        amount: worldCardAmount,
        currency: orderCurrency,
        description: orderDescription,
      },
      customer,
      custom_data: {
        userId: user.id,
        challengeId: challenge.id,
        platform: normalizedPlatform,
      },
    };
    if (notificationUrl) sessionPayload.notification_url = notificationUrl;

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
        reference: orderNumber,

        billingFirstName: billingFirstName || null,
        billingLastName: billingLastName || null,
        billingEmail: user.email,
        billingPhone: data.phone || null,
        billingCountry: data.country || null,
        billingAddress: data.address || null,
        billingCity: data.city || null,

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
          flow: 'worldcard-hosted',
        },
        sessionPayload,
      },
    });

    this.logger.log(
      `[WorldCard Hosted] Payment row created: id=${payment.id}, ref=${orderNumber}, amount=${worldCardAmount} ${orderCurrency}`,
    );

    const apiUrl = `${baseUrl}/api/v1/session`;
    // Full request payload is safe to log for the hosted flow — it carries
    // NO card data (the customer enters that on WorldCard). This is the
    // exact body the gateway evaluated, useful evidence for support tickets.
    this.logger.log(
      `[WorldCard Hosted] POST ${apiUrl} ref=${orderNumber} payload=${JSON.stringify(sessionPayload)}`,
    );

    let sessionResponse: any;
    try {
      const httpRes = await axios.post(apiUrl, sessionPayload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 60_000,
        validateStatus: () => true,
      });
      sessionResponse = httpRes.data;
      this.logger.log(
        `[WorldCard Hosted] Response ref=${orderNumber} httpStatus=${httpRes.status} body=${JSON.stringify(sessionResponse)}`,
      );

      if (httpRes.status >= 400) {
        const failMessage =
          (sessionResponse &&
            (sessionResponse.error_message ||
              sessionResponse.decline_reason ||
              sessionResponse.message)) ||
          `Gateway returned HTTP ${httpRes.status}`;
        await (this.prisma.payment as any).update({
          where: { id: payment.id },
          data: {
            status: 'failed',
            failureReason: `Gateway HTTP ${httpRes.status}: ${failMessage}`,
            sessionResponse,
          },
        });
        return {
          provider: 'worldcard',
          status: 'failed',
          reference: orderNumber,
          paymentId: payment.id,
          message: `Payment gateway error (HTTP ${httpRes.status}). ${failMessage}`,
        };
      }
    } catch (err: any) {
      this.logger.error(
        `[WorldCard Hosted] Network error ref=${orderNumber} message=${err?.message}`,
        err?.stack,
      );
      await (this.prisma.payment as any).update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failureReason: `Network error contacting WorldCard: ${err?.message || 'unknown'}`,
        },
      });
      return {
        provider: 'worldcard',
        status: 'failed',
        reference: orderNumber,
        paymentId: payment.id,
        message: `Could not reach the payment gateway (${err?.message || 'network error'}).`,
      };
    }

    await (this.prisma.payment as any).update({
      where: { id: payment.id },
      data: {
        sessionResponse,
        providerSessionId:
          sessionResponse?.id || sessionResponse?.session_id || null,
      },
    });

    const redirectUrl =
      sessionResponse?.redirect_url || sessionResponse?.url || null;
    if (!redirectUrl) {
      this.logger.error(
        `[WorldCard Hosted] No redirect_url in response ref=${orderNumber}: ${JSON.stringify(sessionResponse)}`,
      );
      return {
        provider: 'worldcard',
        status: 'failed',
        reference: orderNumber,
        paymentId: payment.id,
        message: 'WorldCard did not return a checkout URL.',
      };
    }

    return {
      provider: 'worldcard',
      status: 'requires_action',
      reference: orderNumber,
      paymentId: payment.id,
      redirectUrl,
      redirectMethod: 'GET',
    };
  }

  // S2S CARD SALE hash (Appendix A, Formula 1):
  //   md5( strtoupper( strrev(email) + PASSWORD + strrev(first6 + last4) ) )
  // - first6 / last4 = first six and last four digits of the PAN.
  // - PASSWORD is NOT reversed; only the full concatenation is uppercased.
  private generateS2SCardSaleHash(input: {
    email: string;
    password: string;
    cardNumber: string;
  }): string {
    const reverse = (s: string) => s.split('').reverse().join('');
    const digits = String(input.cardNumber).replace(/\D/g, '');
    const first6 = digits.slice(0, 6);
    const last4 = digits.slice(-4);
    const part =
      reverse(input.email) + input.password + reverse(first6 + last4);
    return crypto.createHash('md5').update(part.toUpperCase()).digest('hex');
  }

  // ─── Public: S2S CARD SALE charge ────────────────────────────────────
  // Implements https://docs.world-card.co/docs/guides/s2s_card
  // Endpoint: ${WORLDCARD_PAYMENT_URL}/v2/post (v2 returns redirect_params
  // as an array of {name, value} entries, which is easier to forward to a
  // form for 3DS than the legacy key-value object).
  //
  // Request: application/x-www-form-urlencoded with top-level card_number /
  // card_exp_month / card_exp_year / card_cvv2 fields. Hash uses the email
  // + first6/last4 formula (see generateS2SCardSaleHash above).
  //
  // Response handling:
  //   - result=SUCCESS,  status=SETTLED      → succeeded inline
  //   - result=REDIRECT, status=3DS|REDIRECT → 3DS challenge, return
  //     redirectUrl + redirectParams so the browser POSTs/GETs the ACS
  //   - result=UNDEFINED                     → pending (callback finalizes)
  //   - result=DECLINED                      → failed with decline_reason
  //   - result=ERROR                         → failed with error_message
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

    // Server-side brand detection. We don't pass `brand` to WorldCard for
    // S2S CARD (the gateway routes by BIN) but we still need a brand to
    // reject anything we don't accept and to store for receipts.
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
        if (brandLink?.active) challenge = brandLink.challenge;
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

    // ── Env / credentials ───────────────────────────────────────────
    // Accept both naming conventions (see createHostedSession): documented
    // *_MERCHANT_*/*_PAYMENT_URL keys or the legacy *_CLIENT_KEY/*_PASSWORD/
    // *_BASE_URL keys present in the deployed .env.
    const clientKey =
      this.configService.get<string>('WORLDCARD_MERCHANT_KEY') ||
      this.configService.get<string>('WORLDCARD_CLIENT_KEY');
    const password =
      this.configService.get<string>('WORLDCARD_MERCHANT_PASS') ||
      this.configService.get<string>('WORLDCARD_PASSWORD');
    // Accept either the bare host or a full URL. We always append the
    // S2S CARD path (/v2/post by default; /post if WORLDCARD_S2S_PATH
    // is set to that).
    const baseUrl = (
      this.configService.get<string>('WORLDCARD_PAYMENT_URL') ||
      this.configService.get<string>('WORLDCARD_BASE_URL') ||
      ''
    ).replace(/\/+$/, '');
    const channelId =
      this.configService.get<string>('WORLDCARD_CHANNEL_ID') || '';
    const notificationUrl =
      this.configService.get<string>('WORLDCARD_NOTIFICATION_URL') ||
      this.configService.get<string>('WORLDCARD_CALLBACK_URL');
    const frontendUrl = this.configService.get<string>('APP_FRONTEND_URL');
    const backendUrl = this.configService.get<string>('APP_BACKEND_URL');
    // Default to /v2/post (redirect_params as an array of {name,value}).
    // The legacy /post endpoint returns redirect_params as a key-value
    // object — both protocols are otherwise identical.
    const s2sPath = (
      this.configService.get<string>('WORLDCARD_S2S_PATH') || '/v2/post'
    ).replace(/^\/?/, '/');

    if (!clientKey || !password || !baseUrl || !frontendUrl) {
      this.logger.error('Missing WorldCard env vars (S2S CARD)', {
        clientKey: !!clientKey,
        password: !!password,
        baseUrl: !!baseUrl,
        frontendUrl: !!frontendUrl,
      });
      throw new InternalServerErrorException(
        'WorldCard environment variables not configured',
      );
    }

    // 3DS return URL — Customer's browser is redirected here AFTER the
    // ACS challenge completes. Backend bounces to the SPA success page;
    // the real status comes from the notification webhook.
    const termUrl3ds = backendUrl
      ? `${backendUrl}/payments/worldcard/return?reference=${orderId}`
      : `${frontendUrl}/pay/success?reference=${orderId}`;

    const hash = this.generateS2SCardSaleHash({
      email: user.email,
      password,
      cardNumber: sanitizedCardNumber,
    });

    // First6 + last4 cached on the Payment row so the webhook can rebuild
    // the callback hash (which also includes first6/last4) without us
    // re-handling the PAN.
    const cardBin = sanitizedCardNumber.slice(0, 6);
    const cardLast4 = sanitizedCardNumber.slice(-4);

    // PCI-safe payload to persist (NEVER PAN, NEVER CVV).
    const safePayload: Record<string, any> = {
      action: 'SALE',
      client_key: clientKey,
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      order_description: orderDescription,
      payer_email: user.email,
      payer_first_name: billingFirstName || user.profile?.firstName || null,
      payer_last_name: billingLastName || user.profile?.lastName || null,
      payer_phone: data.phone || null,
      payer_country: data.country || null,
      payer_city: data.city || null,
      payer_state: data.state || null,
      payer_zip: data.postalCode || null,
      payer_address: data.address || null,
      payer_ip: payerIp || null,
      term_url_3ds: termUrl3ds,
      card: {
        brand: detectedBrand,
        bin: cardBin,
        last4: cardLast4,
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
        cardBin,
        cardLast4,
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
      `[WorldCard S2S CARD] Payment row created: id=${payment.id}, ref=${orderId}, amount=${orderAmount} ${orderCurrency}`,
    );

    // ── Build form-urlencoded body per S2S CARD spec ────────────────
    const expMonth = String(card.expiryMonth).padStart(2, '0');
    const expYearRaw = String(card.expiryYear);
    const expYear = expYearRaw.length === 2 ? `20${expYearRaw}` : expYearRaw;

    const params: Record<string, string> = {
      action: 'SALE',
      client_key: clientKey,
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: orderCurrency,
      order_description: orderDescription,
      card_number: sanitizedCardNumber,
      card_exp_month: expMonth,
      card_exp_year: expYear,
      card_cvv2: String(card.cvv),
      payer_first_name: billingFirstName,
      payer_last_name: billingLastName,
      payer_email: user.email,
      payer_phone: data.phone || '',
      payer_country: data.country || '',
      payer_city: data.city || '',
      payer_zip: data.postalCode || '',
      payer_address: data.address || '',
      payer_ip: payerIp || '',
      term_url_3ds: termUrl3ds,
      hash,
    };

    if (channelId) params.channel_id = channelId;
    if (data.state) params.payer_state = String(data.state);
    if (notificationUrl) params.notification_url = notificationUrl;

    // Echo a couple of fields back via custom_data so they appear on the
    // callback — useful for tracing brand attribution + platform pick.
    params['custom_data[challenge_id]'] = challenge.id;
    params['custom_data[platform]'] = normalizedPlatform;
    if (brandLink?.id) params['custom_data[brand_link_id]'] = brandLink.id;

    // PCI-safe redacted echo for diagnostics.
    const redactedParams: Record<string, string> = {};
    for (const [k, v] of Object.entries(params)) {
      if (k === 'card_number') {
        redactedParams[k] = v.length > 4 ? `****${v.slice(-4)}` : '****';
      } else if (k === 'card_cvv2') {
        redactedParams[k] = '***';
      } else {
        redactedParams[k] = v;
      }
    }
    const apiUrl = `${baseUrl}${s2sPath}`;
    this.logger.log(
      `[WorldCard S2S CARD] POST ${apiUrl} ref=${orderId} params=${JSON.stringify(redactedParams)}`,
    );

    let wcResponse: any;
    let rawResponseText: string | null = null;
    try {
      const httpRes = await axios.post(
        apiUrl,
        new URLSearchParams(params).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: 60_000,
          validateStatus: () => true,
          transformResponse: [(d) => d],
        },
      );
      rawResponseText =
        typeof httpRes.data === 'string'
          ? httpRes.data
          : JSON.stringify(httpRes.data);
      try {
        wcResponse = rawResponseText ? JSON.parse(rawResponseText) : {};
      } catch {
        wcResponse = { raw: rawResponseText };
      }
      this.logger.log(
        `[WorldCard S2S CARD] Response ref=${orderId} httpStatus=${httpRes.status} bodyPreview=${(rawResponseText || '').slice(0, 500)}`,
      );

      if (httpRes.status >= 400) {
        const failMessage =
          (wcResponse &&
            (wcResponse.error_message ||
              wcResponse.decline_reason ||
              wcResponse.message)) ||
          (rawResponseText && rawResponseText.slice(0, 300)) ||
          `Gateway returned HTTP ${httpRes.status}`;
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
      this.logger.error(
        `[WorldCard S2S CARD] Network error ref=${orderId} message=${err?.message}`,
        err?.stack,
      );
      await (this.prisma.payment as any).update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failureReason: `Network error contacting WorldCard: ${err?.message || 'unknown'}`,
        },
      });
      return {
        provider: 'worldcard',
        status: 'failed',
        reference: orderId,
        paymentId: payment.id,
        message: `Could not reach the payment gateway (${err?.message || 'network error'}).`,
      };
    }

    const result = String(wcResponse?.result ?? '').toUpperCase();
    const txStatus = String(wcResponse?.status ?? '').toUpperCase();
    const providerPaymentId = wcResponse?.trans_id
      ? String(wcResponse.trans_id)
      : null;

    // ── Branch 1: REDIRECT (3DS) ────────────────────────────────────
    if (result === 'REDIRECT' && wcResponse?.redirect_url) {
      await (this.prisma.payment as any).update({
        where: { id: payment.id },
        data: {
          providerPaymentId,
          orderStatus: txStatus || 'REDIRECT',
          callbackPayload: wcResponse,
        },
      });

      // /v2/post returns redirect_params as an array of {name,value}; the
      // legacy /post endpoint returns it as a key-value object. Normalise
      // to the array shape so the frontend submit-form handler works for
      // both endpoint variants.
      let redirectParams: any = null;
      if (Array.isArray(wcResponse.redirect_params)) {
        redirectParams = wcResponse.redirect_params;
      } else if (
        wcResponse.redirect_params &&
        typeof wcResponse.redirect_params === 'object'
      ) {
        redirectParams = Object.entries(wcResponse.redirect_params).map(
          ([name, value]) => ({ name, value }),
        );
      }

      this.logger.log(`[WorldCard S2S CARD] 3DS required ref=${orderId}`);
      return {
        provider: 'worldcard',
        status: 'requires_action',
        reference: orderId,
        paymentId: payment.id,
        redirectUrl: wcResponse.redirect_url,
        redirectMethod: String(
          wcResponse.redirect_method || 'GET',
        ).toUpperCase(),
        redirectParams,
      };
    }

    // ── Branch 2: SUCCESS / SETTLED ─────────────────────────────────
    if (
      result === 'SUCCESS' &&
      (txStatus === 'SETTLED' || txStatus === 'PENDING')
    ) {
      const succeeded = txStatus === 'SETTLED';
      await (this.prisma.payment as any).update({
        where: { id: payment.id },
        data: {
          status: succeeded ? 'succeeded' : 'pending',
          providerPaymentId,
          orderStatus: txStatus,
          callbackPayload: wcResponse,
        },
      });

      if (succeeded) {
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
            `[WorldCard S2S CARD] Inline provisioning failed for ref=${orderId} (webhook will retry): ${err?.message}`,
          );
          return {
            provider: 'worldcard',
            status: 'succeeded',
            reference: orderId,
            paymentId: payment.id,
          };
        }
      }
      return {
        provider: 'worldcard',
        status: 'pending',
        reference: orderId,
        paymentId: payment.id,
        message: 'Awaiting capture',
      };
    }

    // ── Branch 3: UNDEFINED / PREPARE — wait for webhook ────────────
    if (result === 'UNDEFINED' || txStatus === 'PREPARE') {
      await (this.prisma.payment as any).update({
        where: { id: payment.id },
        data: {
          providerPaymentId,
          orderStatus: txStatus || 'PREPARE',
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

  private reverseString(s: string): string {
    return String(s).split('').reverse().join('');
  }

  // Hosted-session (legacy / Standard Checkout) callback signature:
  // PHP array_walk_recursive(strrev) + ksort + implode + uppercase +
  // append PASSWORD.toUpperCase(), then MD5. Kept for back-compat with
  // payments created via /payments/worldcard/session (the hosted flow
  // we ship behind WORLDCARD_FLOW=hosted).
  private buildHostedCallbackSource(input: any): string {
    if (input === null || input === undefined) return '';
    if (Array.isArray(input)) {
      return input.map((v) => this.buildHostedCallbackSource(v)).join('');
    }
    if (typeof input === 'object') {
      const sortedKeys = Object.keys(input).sort();
      return sortedKeys
        .map((k) => this.buildHostedCallbackSource(input[k]))
        .join('');
    }
    return this.reverseString(String(input));
  }

  // S2S CARD callback signature (per docs Appendix A, Formula 2):
  //   md5( strtoupper( strrev(email) + PASSWORD + trans_id + strrev(first6 + last4) ) )
  // We rebuild first6/last4 from the stored Payment row (cardBin /
  // cardLast4) because the callback only ships the masked card.
  private computeS2SCardCallbackHash(input: {
    email: string;
    password: string;
    transId: string;
    cardBin: string;
    cardLast4: string;
  }): string {
    const bin = input.cardBin + input.cardLast4;
    const part =
      this.reverseString(input.email) +
      input.password +
      input.transId +
      this.reverseString(bin);
    return crypto.createHash('md5').update(part.toUpperCase()).digest('hex');
  }

  // Verify either the S2S CARD callback hash OR the legacy hosted-session
  // hash. We try the flow stored on the Payment row first; if that doesn't
  // match (e.g. early callbacks before metadata.flow is reliable, or
  // cross-flow edge cases) we fall back to the other formula before
  // rejecting. Logs every attempt so misconfig is easy to diagnose.
  private verifyCallbackHash(payload: any, payment: any): void {
    const password =
      this.configService.get<string>('WORLDCARD_MERCHANT_PASS') ||
      this.configService.get<string>('WORLDCARD_PASSWORD');
    if (!password) {
      throw new BadRequestException('Missing WORLDCARD_MERCHANT_PASS in env');
    }
    const incomingHash = this.requireString(payload.hash, 'hash');

    const flow = payment?.metadata?.flow ?? null;
    const candidates: Array<{ kind: string; hash: string }> = [];

    // Build S2S CARD candidate
    const transId = payload.trans_id ? String(payload.trans_id) : '';
    if (
      transId &&
      payment?.billingEmail &&
      payment?.cardBin &&
      payment?.cardLast4
    ) {
      candidates.push({
        kind: 's2s-card',
        hash: this.computeS2SCardCallbackHash({
          email: String(payment.billingEmail),
          password,
          transId,
          cardBin: String(payment.cardBin),
          cardLast4: String(payment.cardLast4),
        }),
      });
    }

    // Build hosted-session candidate
    const clone: any = { ...payload };
    delete clone.hash;
    const concat = this.buildHostedCallbackSource(clone);
    candidates.push({
      kind: 'hosted',
      hash: crypto
        .createHash('md5')
        .update((concat + password).toUpperCase())
        .digest('hex'),
    });

    // Prefer the candidate matching the stored flow first so logs read
    // intuitively, but try all candidates before failing.
    const ordered = [...candidates].sort((a) => {
      if (flow === 'worldcard-s2s' && a.kind === 's2s-card') return -1;
      if (flow === 'worldcard-hosted' && a.kind === 'hosted') return -1;
      return 1;
    });

    for (const c of ordered) {
      if (incomingHash.toLowerCase() === c.hash.toLowerCase()) {
        this.logger.log(
          `WorldCard callback hash verified via ${c.kind} formula for order_id=${payload?.order_id}`,
        );
        return;
      }
    }

    this.logger.warn(
      `WorldCard callback hash mismatch for order_id=${payload?.order_id}; tried ${ordered.map((c) => c.kind).join(', ')} (incoming=${incomingHash})`,
    );
    throw new BadRequestException('Invalid callback hash');
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

    // Look up the Payment row first — the S2S CARD callback hash needs
    // its stored email + card bin/last4 to verify. Refuse to mutate state
    // on a forged callback.
    const payment = await this.prisma.payment.findUnique({
      where: { reference: orderId },
    });
    if (!payment) {
      throw new NotFoundException(
        `Payment not found for reference: ${orderId}`,
      );
    }

    this.verifyCallbackHash(payload, payment);

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
