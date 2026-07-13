import {
    Injectable,
    Logger,
    BadRequestException,
    NotFoundException,
    InternalServerErrorException,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { PaymentsService } from './payments.service';
import { generatePassword } from 'src/utils/generate-password.util';

export interface PaytechChargeInput {
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

    // Trusted internal overrides (QuickLink / DirectPurchaseLink). Never set
    // from the public controller — it strips these before calling the service.
    amountOverride?: number;

    currency?: string; // 'EUR' | 'GBP'
    card?: {
        number: string;
        expiryMonth: string | number;
        expiryYear: string | number;
        cvv: string | number;
        holder?: string;
    };
    payerIp?: string;
}

@Injectable()
export class PaytechService {
    private readonly logger = new Logger(PaytechService.name);

    // Mirror CurrencyContext.jsx#formatFee — keep in sync with the other gateways.
    private static readonly EUR_TO_GBP_RATE = 0.85;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        // PaymentsService <-> PaytechService is a cycle (QuickLink routing) → forwardRef.
        @Inject(forwardRef(() => PaymentsService))
        private readonly paymentsService: PaymentsService,
    ) { }

    // ─── Shared helpers (self-contained, mirrors WorldCardService) ──────

    private detectCardBrand(rawNumber: string): 'VISA' | 'MC' | null {
        const digits = String(rawNumber || '').replace(/\D/g, '');
        if (/^4\d{12,18}$/.test(digits)) return 'VISA';
        if (/^(5[1-5]\d{14}|2(2[2-9]\d|[3-6]\d{2}|7([01]\d|20))\d{12})$/.test(digits))
            return 'MC';
        return null;
    }

    private readonly platformMap: Record<string, string> = {
        MT5: 'MT5', BYBIT: 'BYBIT', PT5: 'PT5',
        TRADELOCKER: 'TRADELOCKER',
    };
    private normalizePlatform(raw: string | undefined): string {
        if (!raw) return 'MT5';
        return this.platformMap[raw] || raw;
    }

    // PayTech validates customer.phone against /^\d+ \d+$/ — it wants the number
    // as "<countryCode> <nationalNumber>": digits only, a single space, no '+',
    // brackets or dashes. We collect free-form input (e.g. "+1 (674) 682-5376"),
    // so normalize it. Country calling codes are 1–3 digits; we split using a
    // known-codes lookup for a correct boundary and fall back to a 1-digit code
    // (still format-valid). If the value can't be a real number we omit it —
    // phone is optional, so that beats sending something PayTech rejects.
    private static readonly CALLING_CODES = new Set([
        '1', '7', '20', '27', '30', '31', '32', '33', '34', '36', '39', '40',
        '41', '43', '44', '45', '46', '47', '48', '49', '51', '52', '53', '54',
        '55', '56', '57', '58', '60', '61', '62', '63', '64', '65', '66', '81',
        '82', '84', '86', '90', '91', '92', '93', '94', '95', '98', '212', '213',
        '216', '218', '220', '221', '233', '234', '254', '255', '256', '351',
        '352', '353', '354', '355', '356', '357', '358', '359', '380', '381',
        '385', '386', '420', '421', '852', '853', '855', '856', '880', '886',
        '961', '962', '963', '964', '965', '966', '967', '968', '970', '971',
        '972', '973', '974', '975', '976', '977', '992', '993', '994', '995',
        '996', '998',
    ]);

    private formatPaytechPhone(raw?: string | null): string | undefined {
        if (!raw) return undefined;
        const digits = String(raw).replace(/\D/g, '');
        if (digits.length < 6) return undefined; // too short to be a real number
        for (const len of [3, 2, 1]) {
            const cc = digits.slice(0, len);
            if (
                PaytechService.CALLING_CODES.has(cc) &&
                digits.length - len >= 4
            ) {
                return `${cc} ${digits.slice(len)}`;
            }
        }
        // Unknown code — a 1-digit split still satisfies PayTech's /^\d+ \d+$/.
        return `${digits.slice(0, 1)} ${digits.slice(1)}`;
    }

    // Trim to a max length per FlowaPay's Customer/BillingAddress schema,
    // returning undefined for empty so we omit the field rather than send "".
    private cap(value: any, max: number): string | undefined {
        const v = String(value ?? '').trim();
        return v ? v.slice(0, max) : undefined;
    }

    // FlowaPay billingAddress.countryCode is strictly [A-Z]{2}. Anything else
    // is dropped (the field is optional) so we don't trip request validation.
    private normalizeCountryCode(raw: any): string | undefined {
        const cc = String(raw ?? '').trim().toUpperCase();
        return /^[A-Z]{2}$/.test(cc) ? cc : undefined;
    }

    // card.expiryYear must be exactly 4 chars; accept a 2-digit "30" too.
    private normalizeExpiryYear(raw: any): string {
        const y = String(raw ?? '').replace(/\D/g, '');
        return y.length === 2 ? `20${y}` : y.slice(0, 4);
    }

    private parseAccountSize(raw: any): number {
        if (raw == null) return 0;
        if (typeof raw === 'number') return Math.round(raw);
        const s = String(raw).trim().toUpperCase();
        const m = s.match(/^(\d+(?:\.\d+)?)([KMB])?$/);
        if (m) {
            const n = parseFloat(m[1]);
            const u = m[2];
            if (u === 'K') return Math.round(n * 1_000);
            if (u === 'M') return Math.round(n * 1_000_000);
            if (u === 'B') return Math.round(n * 1_000_000_000);
            return Math.round(n);
        }
        const p = parseInt(s, 10);
        return Number.isFinite(p) ? p : 0;
    }

    private computeChargeAmount(
        challenge: { price: number; currency: string | null },
        requestedCurrency: 'EUR' | 'GBP',
    ): { amount: string; amountCents: number } {
        const cc = (challenge.currency || 'EUR').toUpperCase();
        const priceEur =
            cc === 'GBP' ? challenge.price / PaytechService.EUR_TO_GBP_RATE : challenge.price;
        const converted =
            requestedCurrency === 'GBP'
                ? priceEur * PaytechService.EUR_TO_GBP_RATE
                : priceEur;
        const finalPrice = Math.round(converted);
        return { amount: finalPrice.toFixed(2), amountCents: finalPrice * 100 };
    }

    private async resolveCheckoutUser(data: PaytechChargeInput) {
        if (data.authUserId) {
            const user = await (this.prisma.user as any).findUnique({
                where: { id: data.authUserId },
                include: { profile: true },
            });
            if (!user) throw new NotFoundException('Authenticated user not found');
            return { user, wasCreated: false, isGuestCheckout: false };
        }
        const email = String(data.email || '').trim().toLowerCase();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
            throw new BadRequestException('Enter a valid email address');
        }
        const existing = await (this.prisma.user as any).findUnique({
            where: { email },
            include: { profile: true },
        });
        if (existing) return { user: existing, wasCreated: false, isGuestCheckout: true };

        const hashed = await bcrypt.hash(generatePassword(20), 10);
        try {
            const user = await (this.prisma.user as any).create({
                data: {
                    email,
                    password: hashed,
                    passwordSet: false,
                    profile: {
                        create: {
                            firstName: data.firstName?.trim() || undefined,
                            lastName: data.lastName?.trim() || undefined,
                            phone: data.phone?.trim() || undefined,
                            country: data.country || undefined,
                            address: data.address?.trim() || undefined,
                            city: data.city?.trim() || undefined,
                        },
                    },
                },
                include: { profile: true },
            });
            return { user, wasCreated: true, isGuestCheckout: true };
        } catch (err: any) {
            if (err?.code === 'P2002') {
                const user = await (this.prisma.user as any).findUnique({
                    where: { email },
                    include: { profile: true },
                });
                if (user) return { user, wasCreated: false, isGuestCheckout: true };
            }
            throw err;
        }
    }

    // Resolve challenge + brand attribution + trusted price override.
    private async resolveChallenge(data: PaytechChargeInput) {
        const { slug, challengeId, accountSize, challengeType, brandSlug, linkSlug } = data;
        let challenge: any = null;
        let brandLink: any = null;

        if (challengeId) {
            challenge = await this.prisma.challenge.findUnique({ where: { id: challengeId } });
        }
        if (!challenge && slug) {
            challenge = await (this.prisma.challenge as any).findUnique({ where: { slug } });
            if (!challenge) {
                brandLink = await (this.prisma as any).directPurchaseLink.findUnique({
                    where: { slug },
                    include: { brand: true, challenge: true },
                });
                if (brandLink?.active) challenge = brandLink.challenge;
            }
        }
        if (!challenge && accountSize) {
            const typeMap: Record<string, string> = {
                '1-step': 'one_phase', one_phase: 'one_phase',
                '2-step': 'two_phase', two_phase: 'two_phase',
            };
            const mappedType =
                typeMap[String(challengeType || '').toLowerCase()] || challengeType || 'two_phase';
            challenge = await this.prisma.challenge.findFirst({
                where: {
                    accountSize: this.parseAccountSize(accountSize),
                    challengeType: mappedType,
                    isActive: true,
                },
            });
        }
        if (!brandLink && linkSlug) {
            brandLink = await (this.prisma as any).directPurchaseLink.findUnique({
                where: { slug: linkSlug },
                include: { brand: true, challenge: true },
            });
        }
        if (!brandLink && brandSlug) {
            const brand = await (this.prisma as any).brand.findUnique({ where: { slug: brandSlug } });
            if (brand) brandLink = { brandId: brand.id, brand, id: null, slug: null, active: true };
        }

        // Enforce link-level provider lock. Accept both PAYTECH and its
        // FlowaPay alias.
        if (
            brandLink?.provider &&
            !['PAYTECH', 'FLOWAPAY'].includes(String(brandLink.provider).toUpperCase())
        ) {
            throw new BadRequestException(
                'This link is configured to use a different payment gateway.',
            );
        }

        const linkPriceOverride =
            brandLink?.active && brandLink?.amount != null && Number(brandLink.amount) > 0
                ? Number(brandLink.amount)
                : null;
        const quickLinkPriceOverride =
            data.amountOverride != null && Number(data.amountOverride) > 0
                ? Number(data.amountOverride)
                : null;

        if (!challenge && brandLink?.active && linkPriceOverride != null) {
            const fallbackSize =
                brandLink.challenge?.accountSize ??
                (accountSize ? this.parseAccountSize(accountSize) : 0);
            const fallbackType =
                brandLink.challenge?.challengeType ?? challengeType ?? 'one_phase';
            const matched = await this.prisma.challenge.findFirst({
                where: { accountSize: fallbackSize, challengeType: fallbackType, isActive: true },
            });
            if (matched) challenge = matched;
        }
        if (!challenge || !challenge.isActive) throw new NotFoundException('Challenge not found');

        return { challenge, brandLink, linkPriceOverride, quickLinkPriceOverride };
    }

    // ─── Main entry: StS BASIC_CARD charge ──────────────────────────────
    // FlowaPay Server-to-Server: the card is collected on our /pay page and
    // sent in the create request (paymentMethod BASIC_CARD). We then execute
    // the deposit via PATCH /payments/{id} with the customer IP. A 3DS channel
    // returns a redirectUrl for the ACS challenge; the webhook finalizes.

    async createCharge(data: PaytechChargeInput) {
        const card = data.card;
        if (!card?.number || !card?.expiryMonth || !card?.expiryYear || !card?.cvv) {
            throw new BadRequestException(
                'Card details (number, expiryMonth, expiryYear, cvv) are required',
            );
        }

        const requestedCurrency = String(data.currency || '').toUpperCase();
        if (requestedCurrency !== 'EUR' && requestedCurrency !== 'GBP') {
            throw new BadRequestException('Unsupported currency. Only EUR and GBP are accepted.');
        }

        // Never trust a client-sent brand — detect from the PAN.
        const sanitizedCardNumber = String(card.number).replace(/\D/g, '');
        const detectedBrand = this.detectCardBrand(sanitizedCardNumber);
        if (!detectedBrand) {
            throw new BadRequestException('We only accept Visa and Mastercard.');
        }

        // The card terminal requires the payer phone (a blank one is a hard
        // acquirer decline: "payer_phone: This value should not be blank").
        // Fail fast with a clear message instead of surfacing that decline.
        // FlowaPay: customer.phone must be ≤ 18 chars, no '+', space between the
        // dialing code and the local number.
        const formattedPhone = this.formatPaytechPhone(data.phone);
        if (!formattedPhone) {
            throw new BadRequestException('A valid phone number is required.');
        }
        if (formattedPhone.length > 18) {
            throw new BadRequestException('Phone number is too long.');
        }

        const { challenge, brandLink, linkPriceOverride, quickLinkPriceOverride } =
            await this.resolveChallenge(data);

        const billingFirstName = String(data.firstName || '').trim();
        const billingLastName = String(data.lastName || '').trim();
        if (!data.authUserId && (!billingFirstName || !billingLastName)) {
            throw new BadRequestException('Missing required name fields');
        }

        const { user, wasCreated, isGuestCheckout } = await this.resolveCheckoutUser(data);

        const { amount, amountCents } = this.computeChargeAmount(
            quickLinkPriceOverride != null
                ? { price: quickLinkPriceOverride, currency: requestedCurrency }
                : linkPriceOverride != null
                    ? { price: linkPriceOverride, currency: brandLink?.currency ?? challenge.currency }
                    : challenge,
            requestedCurrency as 'EUR' | 'GBP',
        );

        const selectedPlatform =
            brandLink?.platform || data.platform || data.tradingPlatform ||
            data.trading_platform || data.brokerPlatform || challenge.platform;
        const normalizedPlatform = this.normalizePlatform(selectedPlatform);

        const orderNumber = `PAYTECH-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // ── Config ──
        const apiBaseUrl =
            this.config.get<string>('PAYTECH_API_URL')
        const apiKey =
            this.config.get<string>('PAYTECH_API_KEY')
        const backendUrl = this.config.get<string>('APP_BACKEND_URL');
        if (!apiBaseUrl || !apiKey || !backendUrl) {
            this.logger.error('Missing Paytech env vars', {
                apiBaseUrl: !!apiBaseUrl,
                apiKey: !!apiKey,
                backendUrl: !!backendUrl,
            });
            throw new InternalServerErrorException('Paytech environment variables not configured');
        }
        // NOTE: FlowaPay's create-payment API (POST /api/v1/payments) has NO
        // terminalId field. The terminal/channel is selected server-side by
        // FlowaPay from the Shop API Key + the shop's routing rules (payment
        // method, currency, card brand, country). Sending a terminalId does
        // nothing. "Terminal not Found (code 1.05)" means the shop for this API
        // key has no ACTIVE terminal able to process this transaction — that is
        // enabled on the FlowaPay side, not via this request body.
        const returnUrl = `${backendUrl}/payments/paytech/return?reference=${orderNumber}`;

        // Brand commission attribution (same maths as Xoala/WorldCard).
        const brandIdAttribution: string | null = brandLink?.brandId ?? null;
        const brandCommissionRate: number = brandLink?.brand?.commissionRate ?? 0;
        const brandCommissionCents = brandIdAttribution
            ? Math.round((amountCents * brandCommissionRate) / 100)
            : 0;

        // PCI-safe snapshot — NEVER PAN, NEVER CVV.
        const safePayload = {
            amount,
            currency: requestedCurrency,
            merchantReference: orderNumber,
            returnUrl,
            customer: {
                referenceId: user.id,
                email: user.email,
                firstName: billingFirstName,
                lastName: billingLastName,
                phone: data.phone || null,
                country: data.country || null,
                city: data.city || null,
                state: data.state || null,
                postalCode: data.postalCode || null,
            },
            card: {
                brand: detectedBrand,
                expiryMonth: card.expiryMonth,
                expiryYear: card.expiryYear,
                holder: card.holder || null,
            },
        };

        const payment = await (this.prisma.payment as any).create({
            data: {
                user: { connect: { id: user.id } },
                challenge: { connect: { id: challenge.id } },
                ...(brandIdAttribution ? { brand: { connect: { id: brandIdAttribution } } } : {}),
                brandCommission: brandCommissionCents,
                amount: amountCents,
                originalAmount: amountCents,
                discountAmount: 0,
                couponCode: null,
                currency: requestedCurrency,
                provider: 'paytech',
                status: 'pending',
                reference: orderNumber,
                billingFirstName,
                billingLastName,
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
                brandSlug: brandLink?.brand?.slug || data.brandSlug || null,
                linkSlug: brandLink?.slug || data.linkSlug || null,
                metadata: {
                    platform: normalizedPlatform,
                    challengeId: challenge.id,
                    challengeName: challenge.name,
                    accountSize: challenge.accountSize,
                    challengeType: challenge.challengeType,
                    brandLinkId: brandLink?.id || null,
                    isGuestCheckout,
                    userCreatedForCheckout: wasCreated,
                    flow: 's2s',
                },
                sessionPayload: safePayload,
            },
        });

        this.logger.log(
            `[Paytech] Payment row created id=${payment.id} ref=${orderNumber} amount=${amount} ${requestedCurrency}`,
        );

        // ── Step 1: create the payment on Paytech (POST /api/v1/payments) ──
        // Body matches FlowaPay's documented PaymentRequest schema. Required:
        // paymentType + currency. There is intentionally NO terminalId — see the
        // note above; FlowaPay routes to a terminal by the Shop API Key.
        const createBody: any = {
            paymentType: 'DEPOSIT',
            paymentMethod: 'BASIC_CARD',
            amount: Number(amount), // spec: numeric, major units (e.g. 129.0)
            currency: requestedCurrency,
            referenceId: orderNumber,
            customer: {
                referenceId: this.cap(user.id, 128),
                email: this.cap(user.email, 256),
                firstName: this.cap(billingFirstName, 128),
                lastName: this.cap(billingLastName, 128),
                // Spec: ≤18 chars, no '+', space between dialing code and local
                // number (e.g. "357 123123123").
                phone: formattedPhone,
            },
            billingAddress: {
                countryCode: this.normalizeCountryCode(data.country),
                city: this.cap(data.city, 50),
                addressLine1: this.cap(data.address, 300),
                postalCode: this.cap(data.postalCode, 12),
                state: this.cap(data.state, 40),
            },
            card: {
                cardNumber: sanitizedCardNumber,
                // expiryMonth: exactly 2 chars; expiryYear: exactly 4.
                expiryMonth: String(card.expiryMonth).replace(/\D/g, '').padStart(2, '0').slice(0, 2),
                expiryYear: this.normalizeExpiryYear(card.expiryYear),
                cardSecurityCode: this.cap(card.cvv, 4),
                cardholderName: this.cap(card.holder, 128),
            },
            returnUrl,
            webhookUrl: `${backendUrl}/payments/paytech/callback`,
        };

        this.logger.log(
            `[Paytech] POST ${apiBaseUrl}/payments body=` +
            JSON.stringify({
                paymentType: createBody.paymentType,
                paymentMethod: createBody.paymentMethod,
                amount: createBody.amount,
                currency: createBody.currency,
                referenceId: createBody.referenceId,
                customerReferenceId: createBody.customer?.referenceId,
                cardBrand: detectedBrand,
                hasCardNumber: Boolean(createBody.card?.cardNumber),
                hasCvv: Boolean(createBody.card?.cardSecurityCode),
            }),
        );

        let createRes: any;
        try {
            const res = await axios.post(`${apiBaseUrl}/payments`, createBody, {
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                timeout: 60_000,
            });
            createRes = res.data;
        } catch (err: any) {
            return this.markFailed(payment.id, orderNumber, err?.response?.data, this.errMsg(err));
        }

        const providerPaymentId = createRes?.result?.id ? String(createRes.result.id) : null;
        if (!providerPaymentId) {
            return this.markFailed(payment.id, orderNumber, createRes, 'Paytech did not return a payment id');
        }

        // ── Step 2: execute the deposit (PATCH /payments/{id}) ──
        let execRes: any;
        try {
            const res = await axios.patch(
                `${apiBaseUrl}/payments/${providerPaymentId}`,
                { customerIp: data.payerIp },
                {
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                    timeout: 60_000,
                },
            );
            execRes = res.data;
        } catch (err: any) {
            return this.markFailed(payment.id, orderNumber, err?.response?.data, this.errMsg(err), providerPaymentId);
        }

        // Standard (single-phase) deposit: we do NOT send preAuth, so FlowaPay
        // takes the funds automatically — PENDING → COMPLETED (confirmed here or
        // by the async webhook). There is intentionally NO capture step: capture
        // only applies to a pre-auth (two-phase) flow where the payment reaches
        // AUTHORIZED first, and calling it here fails with "payment state must be
        // AUTHORIZED". See PaytechWebhookService.capture for the pre-auth path.
        const result = execRes?.result ?? execRes ?? {};
        const state = String(result.state || '').toUpperCase();

        const redirectUrl = result.redirectUrl || null;
        const pmd = result.paymentMethodDetails || {};
        const cardSummary = {
            bin: pmd.cardBin || pmd.bin || null,
            last4: pmd.cardLast4 || pmd.last4 || null,
            brand: pmd.cardBrand || detectedBrand,
        };
        const SUCCESS = ['COMPLETED', 'AUTHORIZED'];
        const FAILED = ['DECLINED', 'CANCELLED'];

        // 3DS challenge — cardholder must visit the ACS redirectUrl.
        if (redirectUrl && !SUCCESS.includes(state)) {
            await (this.prisma.payment as any).update({
                where: { id: payment.id },
                data: {
                    providerPaymentId,
                    orderStatus: state || 'CHECKOUT',
                    callbackPayload: execRes,
                    cardBin: cardSummary.bin,
                    cardLast4: cardSummary.last4,
                    cardBrand: cardSummary.brand,
                },
            });
            return { status: 'requires_action', reference: orderNumber, paymentId: payment.id, redirectUrl };
        }

        // Approved / completed.
        if (SUCCESS.includes(state)) {
            await (this.prisma.payment as any).update({
                where: { id: payment.id },
                data: {
                    status: 'succeeded',
                    providerPaymentId,
                    orderStatus: state,
                    callbackPayload: execRes,
                    cardBin: cardSummary.bin,
                    cardLast4: cardSummary.last4,
                    cardBrand: cardSummary.brand,
                },
            });
            try {
                const account = await this.paymentsService.provisionChallengeAfterPaymentSuccess(payment.id);
                return { status: 'succeeded', reference: orderNumber, paymentId: payment.id, tradingAccountId: account?.id };
            } catch (err: any) {
                this.logger.error(`[Paytech] Inline provisioning failed ref=${orderNumber} (webhook will retry): ${err?.message}`);
                return { status: 'succeeded', reference: orderNumber, paymentId: payment.id };
            }
        }

        // Still processing (no redirect, not terminal yet) — webhook finalizes.
        if (!FAILED.includes(state) && state) {
            await (this.prisma.payment as any).update({
                where: { id: payment.id },
                data: {
                    providerPaymentId,
                    orderStatus: state,
                    callbackPayload: execRes,
                    cardBin: cardSummary.bin,
                    cardLast4: cardSummary.last4,
                    cardBrand: cardSummary.brand,
                },
            });
            return { status: 'pending', reference: orderNumber, paymentId: payment.id };
        }

        // Declined / cancelled — surface FlowaPay's real reason to the user.
        const msg = this.paytechError(result);
        return this.markFailed(payment.id, orderNumber, execRes, msg, providerPaymentId, cardSummary);
    }


    // Human-readable failure reason from a PaymentResult (errorMessage/errorCode).
    private paytechError(result: any): string {
        const validation = this.validationMessages(result);
        if (validation) return validation;
        const m = result?.errorMessage || result?.message || result?.description;
        const code = result?.errorCode;
        if (m && code) return `${m} (code ${code})`;
        return m || 'Payment declined';
    }

    private errMsg(err: any): string {
        const b = err?.response?.data;
        return (
            this.validationMessages(b) ||
            b?.result?.errorMessage || b?.result?.message || b?.message || b?.error ||
            err?.message || 'Paytech request failed'
        );
    }

    private validationMessages(body: any): string {
        const messages: string[] = [];
        const visit = (value: any) => {
            if (!value) return;
            if (Array.isArray(value)) {
                value.forEach(visit);
                return;
            }
            if (typeof value !== 'object') return;
            const msg = value.defaultMessage || value.message;
            if (typeof msg === 'string' && msg.trim()) {
                const field = typeof value.field === 'string' ? value.field.trim() : '';
                messages.push(field ? `${field}: ${msg.trim()}` : msg.trim());
            }
            visit(value.errors);
            visit(value.fieldErrors);
            visit(value.result);
        };
        visit(body?.errors);
        visit(body?.fieldErrors);
        visit(body?.result?.errors);
        visit(body?.result?.fieldErrors);
        return [...new Set(messages)].join(', ');
    }

    private async markFailed(
        paymentId: string, reference: string, respBody: any,
        message: string, providerPaymentId?: string | null, card?: any,
    ) {
        this.logger.error(`[Paytech] Failed ref=${reference}: ${message}`);
        const data: any = {
            status: 'failed',
            failureReason: message,
            callbackPayload: respBody ?? { error: message },
            ...(card ? { cardBin: card.bin, cardLast4: card.last4, cardBrand: card.brand } : {}),
        };
        try {
            await (this.prisma.payment as any).update({
                where: { id: paymentId },
                data: providerPaymentId ? { ...data, providerPaymentId } : data,
            });
        } catch (err: any) {
            if (err?.code === 'P2002') {
                await (this.prisma.payment as any).update({ where: { id: paymentId }, data });
            } else {
                this.logger.error(`[Paytech] Could not persist failure ref=${reference}: ${err?.message}`);
            }
        }
        return { status: 'failed', reference, paymentId, message };
    }
}

// ─── Async webhook (truth). Mirrors XoalaWebhookService. ──────────────
@Injectable()
export class PaytechWebhookService {
    private readonly logger = new Logger(PaytechWebhookService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        @Inject(forwardRef(() => PaymentsService))
        private readonly paymentsService: PaymentsService,
    ) { }

    async handleCallback(payload: any): Promise<{ ok: true }> {
        this.verifySignature(payload);

        // Webhook body is a PaymentResponse — the payment sits under `result`.
        let result = payload?.result ?? payload ?? {};
        const reference = String(result.referenceId || payload?.reference || '').trim();
        if (!reference) throw new BadRequestException('Missing reference');

        const payment = await (this.prisma.payment as any).findUnique({ where: { reference } });
        if (!payment) throw new NotFoundException(`Payment not found: ${reference}`);

        // Idempotent: already terminal → ack and stop.
        if (payment.status === 'succeeded' && payment.tradingAccountId) return { ok: true };

        let state = String(result.state || '').toUpperCase();

        // The async PENDING → AUTHORIZED transition lands here. AUTHORIZED means
        // the funds are held but not yet taken, so this is the point to capture
        // (the synchronous /createCharge path returned before authorization
        // completed). Capture, then continue with the post-capture state.
        if (state === 'AUTHORIZED') {
            const providerPaymentId =
                (result.id ? String(result.id) : null) || payment.providerPaymentId || null;
            if (providerPaymentId) {
                try {
                    const capRes = await this.capture(providerPaymentId);
                    result = capRes?.result ?? capRes ?? result;
                    state = String(result.state || '').toUpperCase() || state;
                } catch (err: any) {
                    this.logger.error(
                        `[Paytech] Webhook capture failed ref=${reference}: ${this.errMsg(err)}`,
                    );
                    // Leave the payment pending; FlowaPay will re-deliver or a
                    // later webhook (COMPLETED/DECLINED) will finalize it.
                    await (this.prisma.payment as any).update({
                        where: { id: payment.id },
                        data: { orderStatus: state, callbackPayload: payload },
                    });
                    return { ok: true };
                }
            }
        }

        const succeeded = ['COMPLETED', 'AUTHORIZED'].includes(state);
        const failed = ['DECLINED', 'CANCELLED'].includes(state);

        // Non-terminal states (CHECKOUT/PENDING/AWAITING_APPROVAL) — record and wait.
        if (!succeeded && !failed) {
            await (this.prisma.payment as any).update({
                where: { id: payment.id },
                data: { orderStatus: state, callbackPayload: payload },
            });
            return { ok: true };
        }

        await (this.prisma.payment as any).update({
            where: { id: payment.id },
            data: {
                status: succeeded ? 'succeeded' : 'failed',
                orderStatus: state,
                callbackPayload: payload,
                ...(succeeded
                    ? {}
                    : {
                        failureReason:
                            result.errorMessage ||
                            (result.errorCode ? `Declined (code ${result.errorCode})` : 'Payment declined'),
                    }),
            },
        });

        if (succeeded) {
            await this.paymentsService.provisionChallengeAfterPaymentSuccess(payment.id);
        }
        return { ok: true };
    }

    // POST /payments/{id}/capture — takes the held funds on an AUTHORIZED
    // payment. Empty body = full capture. Returns the PaymentResponse so the
    // caller can read the post-capture state.
    private async capture(providerPaymentId: string): Promise<any> {
        const apiBaseUrl = this.config.get<string>('PAYTECH_API_URL');
        const apiKey = this.config.get<string>('PAYTECH_API_KEY');
        if (!apiBaseUrl || !apiKey) {
            throw new InternalServerErrorException('Paytech environment variables not configured');
        }
        const res = await axios.post(
            `${apiBaseUrl}/payments/${providerPaymentId}/capture`,
            {},
            {
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
                timeout: 60_000,
            },
        );
        return res.data;
    }

    private errMsg(err: any): string {
        const b = err?.response?.data;
        return (
            b?.result?.errorMessage || b?.result?.message || b?.message || b?.error ||
            err?.message || 'Paytech capture failed'
        );
    }

    // flowapay signs webhooks with SignatureAuth: HMAC-SHA256 of the raw JSON
    // body using the Shop Signing Key, sent in the `Signature` header.
    // NOTE: correct verification needs the RAW request body (byte-exact), which
    // requires enabling rawBody on the Nest app and reading req.headers.signature.
    // Until that's wired, we log and proceed so sandbox testing isn't blocked —
    // this MUST be enforced before production. See PAYTECH_SIGNING_KEY.
    private verifySignature(_payload: any): void {
        const key = this.config.get<string>('PAYTECH_SIGNING_KEY');
        if (!key) {
            this.logger.warn('[Paytech] PAYTECH_SIGNING_KEY not set — webhook signature NOT verified');
            return;
        }
        // TODO(prod): compute crypto.createHmac('sha256', key).update(rawBody)
        // .digest('hex') and compare (timing-safe) to the `Signature` header.
        this.logger.warn('[Paytech] Webhook signature check is a stub — enforce before production');
    }
}
