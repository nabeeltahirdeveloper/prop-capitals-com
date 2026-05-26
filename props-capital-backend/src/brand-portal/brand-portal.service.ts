import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AdminConsoleService } from '../admin-console/admin-console.service';

/**
 * BrandPortalService
 * Self-service brand portal — backs the visionscope-style
 * /brand-login + /brand-dashboard pages on the user-facing site.
 */
@Injectable()
export class BrandPortalService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private adminConsole: AdminConsoleService,
  ) {}

  private get db(): any {
    return this.prisma;
  }

  /* ---------- Auth ---------- */

  async login(username: string, password: string) {
    if (!username || !password)
      throw new BadRequestException('username and password required');

    const brand = await this.db.brand.findFirst({
      where: { OR: [{ username }, { email: username }] },
    });
    if (!brand || !brand.passwordHash)
      throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, brand.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    if (brand.approvalStatus !== 'active')
      throw new UnauthorizedException(
        `Brand account not active (status: ${brand.approvalStatus})`,
      );

    const token = this.jwt.sign({
      sub: brand.id,
      username: brand.username,
      kind: 'brand',
      accountType: brand.accountType,
    });

    return { token, brand: this.publicProfile(brand) };
  }

  async me(brandId: string) {
    const brand = await this.db.brand.findUnique({ where: { id: brandId } });
    if (!brand) throw new UnauthorizedException('Brand not found');
    return { brand: this.publicProfile(brand) };
  }

  async changePassword(
    brandId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!newPassword || newPassword.length < 8)
      throw new BadRequestException('New password must be at least 8 chars');

    const brand = await this.db.brand.findUnique({ where: { id: brandId } });
    if (!brand?.passwordHash) throw new UnauthorizedException();
    const ok = await bcrypt.compare(currentPassword, brand.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password incorrect');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.db.brand.update({
      where: { id: brandId },
      data: { passwordHash },
    });
    return { success: true };
  }

  private publicProfile(b: any) {
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      username: b.username,
      email: b.email,
      logo_url: b.logoUrl,
      website: b.website,
      description: b.description,
      account_type: b.accountType,
      approval_status: b.approvalStatus,
      commission_rate: b.commissionRate,
      reseller_commission: b.resellerCommission,
      settlement_method: b.settlementMethod,
      settlement_crypto_wallet: b.settlementCryptoWallet,
      settlement_bank_holder: b.settlementBankHolder,
      settlement_bank_iban: b.settlementBankIban,
      settlement_bank_swift: b.settlementBankSwift,
      settlement_bank_name: b.settlementBankName,
      settlement_bank_address: b.settlementBankAddress,
      created_at: b.createdAt,
    };
  }

  /* ---------- Profile ---------- */

  async updateProfile(brandId: string, body: any) {
    const updateData: any = {};
    const map: Record<string, string> = {
      name: 'name',
      logo_url: 'logoUrl',
      website: 'website',
      description: 'description',
      settlement_method: 'settlementMethod',
      settlement_crypto_wallet: 'settlementCryptoWallet',
      settlement_bank_holder: 'settlementBankHolder',
      settlement_bank_iban: 'settlementBankIban',
      settlement_bank_swift: 'settlementBankSwift',
      settlement_bank_name: 'settlementBankName',
      settlement_bank_address: 'settlementBankAddress',
    };
    for (const [src, dest] of Object.entries(map)) {
      if (body[src] !== undefined) updateData[dest] = body[src];
    }
    const updated = await this.db.brand.update({
      where: { id: brandId },
      data: updateData,
    });
    return { brand: this.publicProfile(updated) };
  }

  /* ---------- Dashboard ---------- */

  async dashboardStats(brandId: string) {
    const [revenueAgg, ordersCount, unpaidAgg, brand] = await Promise.all([
      this.db.payment.aggregate({
        _sum: { amount: true, brandCommission: true },
        where: { brandId, status: 'succeeded' },
      }),
      this.db.payment.count({ where: { brandId, status: 'succeeded' } }),
      this.db.payment.aggregate({
        _sum: { brandCommission: true },
        where: { brandId, status: 'succeeded', brandPaidOut: false },
      }),
      this.db.brand.findUnique({ where: { id: brandId } }),
    ]);

    const revenue = (revenueAgg._sum.amount ?? 0) / 100;
    const commission = (revenueAgg._sum.brandCommission ?? 0) / 100;
    const unpaid = (unpaidAgg._sum.brandCommission ?? 0) / 100;
    const rollingReserve = revenue * 0.1;

    return {
      // Provided as both `totals` (legacy) and flat keys so the
      // BrandDashboardSection can read whichever shape it wants.
      totals: {
        revenue,
        commission,
        orders: ordersCount,
        unpaid_commission: unpaid,
      },
      stats: {
        total_orders: ordersCount,
        total_order_amount: revenue,
        rolling_reserve: rollingReserve,
        final_payout_amount: revenue - rollingReserve,
        total_commission: commission,
        paid_commission: commission - unpaid,
        unpaid_commission: unpaid,
        pending_commission: unpaid,
        commission_rate: brand?.commissionRate ?? 10,
      },
    };
  }

  async dashboardRecent(brandId: string) {
    const recent = await this.db.payment.findMany({
      where: { brandId, status: 'succeeded' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: { select: { email: true } },
        challenge: { select: { name: true } },
      },
    });
    return {
      recent: recent.map((p: any) => ({
        id: p.id,
        date: p.createdAt,
        email: p.user?.email,
        amount: p.amount / 100,
        commission: (p.brandCommission ?? 0) / 100,
        package_name: p.challenge?.name,
      })),
    };
  }

  async dashboardDaily(brandId: string, days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.db.payment.findMany({
      where: { brandId, status: 'succeeded', createdAt: { gte: since } },
      select: { amount: true, brandCommission: true, createdAt: true },
    });
    const buckets = new Map<string, { revenue: number; commission: number; orders: number }>();
    for (const r of rows) {
      const day = (r.createdAt as Date).toISOString().slice(0, 10);
      const cur = buckets.get(day) ?? { revenue: 0, commission: 0, orders: 0 };
      cur.revenue += r.amount / 100;
      cur.commission += (r.brandCommission ?? 0) / 100;
      cur.orders += 1;
      buckets.set(day, cur);
    }
    return {
      daily: Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, ...v })),
    };
  }

  /* ---------- Visits ---------- */

  // Brand-portal visits read from this brand's DirectPurchaseLink.clicks,
  // NOT from the global Visit table. The global Visit feed has no brandId,
  // so every brand previously saw the same 48k-visit total. Scoping to the
  // brand's own tracked links means new brands start at 0 and only grow
  // when their tracking URLs are actually clicked.

  async listVisits(brandId: string, params: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;

    // A per-IP visit feed for a brand would require a separate
    // brand-scoped visit log (one click → one row), which the schema
    // doesn't model today. Return an empty feed plus zero meta so the
    // page renders cleanly until that table exists.
    void brandId;
    void skip;
    void limit;
    return {
      visits: [],
      meta: { total: 0, pages: 1 },
    };
  }

  async visitsStats(brandId: string, days = 30) {
    // Sum click counters from links owned by THIS brand. New brands with no
    // recorded clicks correctly return 0.
    const totalClicks = await this.db.directPurchaseLink.aggregate({
      where: { brandId },
      _sum: { clicks: true },
    });
    const totalVisits = totalClicks._sum.clicks ?? 0;

    // DirectPurchaseLink only stores a running counter (no per-day log),
    // so a per-day breakdown isn't derivable. Return an empty daily_stats
    // — the frontend chart hides itself when the array is empty.
    return {
      total_visits: totalVisits,
      unique_visitors: totalVisits,
      period_days: days,
      daily_stats: [],
    };
  }

  /* ---------- Direct purchase links ---------- */

  async listLinks(brandId: string) {
    const linkInclude = {
      brand: { select: { id: true, name: true, slug: true } },
      challenge: { select: { id: true, slug: true, name: true, challengeType: true, accountSize: true, price: true } },
    };

    let links = await this.db.directPurchaseLink.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      include: linkInclude,
    });

    // Self-heal: brands created before the auto-create logic landed (or
    // brands that had their links manually deleted) get their full link set
    // provisioned the first time they hit this endpoint.
    if (links.length === 0) {
      try {
        const created = await this.adminConsole.autoCreateBrandLinks(brandId, {
          explicitLinks: null,
        });
        if (created > 0) {
          links = await this.db.directPurchaseLink.findMany({
            where: { brandId },
            orderBy: { createdAt: 'desc' },
            include: linkInclude,
          });
        }
      } catch (_e) {
        // Never block the read on a provisioning failure
      }
    }

    return {
      links: links.map((l: any) => this.mapLink(l)),
    };
  }

  async createLink(brandId: string, body: any) {
    const slug = body.slug ?? this.randomSlug();
    const link = await this.db.directPurchaseLink.create({
      data: {
        slug,
        name: body.name ?? null,
        brandId,
        challengeId: body.challenge_id ?? null,
        amount: body.amount != null ? Number(body.amount) : null,
        currency: body.currency ?? 'USD',
        metadata: body.metadata ?? null,
        active: body.active !== false,
      },
    });
    return { link: this.mapLink(link) };
  }

  async updateLink(brandId: string, id: string, body: any) {
    const existing = await this.db.directPurchaseLink.findUnique({ where: { id } });
    if (!existing || existing.brandId !== brandId)
      throw new UnauthorizedException('Link not found');
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.amount !== undefined) data.amount = Number(body.amount);
    if (body.active !== undefined) data.active = !!body.active;
    if (body.metadata !== undefined) data.metadata = body.metadata;
    const updated = await this.db.directPurchaseLink.update({ where: { id }, data });
    return { link: this.mapLink(updated) };
  }

  async deleteLink(brandId: string, id: string) {
    const existing = await this.db.directPurchaseLink.findUnique({ where: { id } });
    if (!existing || existing.brandId !== brandId)
      throw new UnauthorizedException('Link not found');
    await this.db.directPurchaseLink.delete({ where: { id } });
    return { success: true };
  }

  private getPublicSiteUrl(): string {
    return (
      process.env.APP_FRONTEND_URL ||
      process.env.PUBLIC_SITE_URL ||
      'https://prop-capitals.com'
    );
  }

  private formatAccountSize(size: number): string {
    if (!size) return '';
    if (size >= 1_000_000) return `${size / 1_000_000}M`;
    if (size >= 1000) return `${size / 1000}K`;
    return String(size);
  }

  private buildDestinationUrl(l: any): string {
    const meta = (l.metadata && typeof l.metadata === 'object') ? l.metadata : {};
    if (meta.custom_url) return meta.custom_url;

    const baseUrl = this.getPublicSiteUrl();
    const params = new URLSearchParams();
    if (l.brand?.slug) params.set('brand', l.brand.slug);
    if (l.slug) params.set('link', l.slug);

    if (l.challenge) {
      // Per-challenge link: existing /checkout?type=...&size=... format,
      // augmented with brand+link query params for attribution.
      const type = l.challenge.challengeType ?? 'one_phase';
      const size = this.formatAccountSize(l.challenge.accountSize);
      params.set('type', type);
      if (size) params.set('size', size);
      return `${baseUrl}/checkout?${params.toString()}`;
    }

    // Main link: lands on the public challenges page so the customer can
    // pick which challenge to buy. Brand attribution is preserved via query.
    const qs = params.toString();
    return `${baseUrl}/Challenges${qs ? '?' + qs : ''}`;
  }

  private mapLink(l: any) {
    const total = Number(l.amount ?? 0);
    const meta = (l.metadata && typeof l.metadata === 'object') ? l.metadata : {};
    // No challengeId on this link → it's the brand's main entry-point link
    const isMainLink = !l.challengeId || meta?.is_main_link === true;
    const customUrl = meta?.custom_url ?? null;

    const destinationUrl = customUrl || this.buildDestinationUrl(l);

    return {
      id: l.id,
      link_id: l.slug,
      slug: l.slug,
      name: l.name ?? l.slug,
      // Fields the visionscope-ported frontend reads to filter / display links
      package_id: l.challengeId ?? null,
      challenge_id: l.challengeId ?? null,
      is_main_link: isMainLink,
      destination_url: destinationUrl,
      custom_url: customUrl,
      total_amount: total,
      package_price: total,
      credits_price: 0,
      credits_amount: 0,
      currency: l.currency,
      is_active: l.active,
      visits_count: l.clicks,
      transactions_count: l.conversions,
      conversion_rate: l.clicks > 0 ? (l.conversions / l.clicks) * 100 : 0,
      created_at: l.createdAt,
    };
  }

  private randomSlug() {
    return Math.random().toString(36).slice(2, 10);
  }

  /* ---------- Orders / Transactions ---------- */

  async listOrders(brandId: string, params: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;
    const where = { brandId, status: 'succeeded' };

    const [data, total] = await Promise.all([
      this.db.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } },
          challenge: { select: { name: true } },
        },
      }),
      this.db.payment.count({ where }),
    ]);

    return {
      orders: data.map((p: any) => ({
        id: p.id,
        date: p.createdAt,
        email: p.user?.email,
        amount: p.amount / 100,
        commission: (p.brandCommission ?? 0) / 100,
        package_name: p.challenge?.name,
        status: p.status,
      })),
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    };
  }

  async listAllTransactions(brandId: string) {
    // Defensive: if the running NestJS dev server still has the OLD Prisma
    // client (i.e. before `Payment.brandId` was added), querying with
    // `where: { brandId }` throws a PrismaClientValidationError. We catch and
    // degrade to an empty result so the UI doesn't get a 500 — the user just
    // needs a clean backend restart to load the regenerated client.
    let data: any[] = [];
    try {
      data = await this.db.payment.findMany({
        where: { brandId },
        orderBy: { createdAt: 'desc' },
        take: 500,
        include: {
          user: { include: { profile: true } },
          challenge: { select: { id: true, name: true } },
          brand: { select: { id: true, name: true, slug: true } },
        },
      });
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('[BrandPortal] listAllTransactions failed:', err?.message);
      data = [];
    }

    return {
      transactions: data.map((p: any) => this.mapTransaction(p)),
      total: data.length,
      stats: data.length > 0
        ? this.computeTransactionStats(data)
        : this.emptyTransactionsStats(),
    };
  }

  /**
   * Project a Payment row into the rich shape the visionscope-ported
   * AllTransactions / NetworkTransactions / ChildTransactions tables read.
   * Provides every field referenced (with safe fallbacks) so the table
   * renders First Name / Last Name / Email / Brand / GEO / Order Amount /
   * Payment Method / Date / Status correctly.
   */
  private mapTransaction(p: any) {
    const amountDollars = (p.amount ?? 0) / 100;
    const meta = (p.metadata && typeof p.metadata === 'object') ? p.metadata : {};
    const billing = (meta.billingDetails && typeof meta.billingDetails === 'object')
      ? meta.billingDetails
      : {};
    const firstName = p.user?.profile?.firstName ?? billing.firstName ?? null;
    const lastName = p.user?.profile?.lastName ?? billing.lastName ?? null;
    const country = p.user?.profile?.country ?? billing.country ?? null;
    const phone = p.user?.profile?.phone ?? billing.phone ?? null;

    return {
      id: p.id,
      order_id: p.reference ?? p.id,
      reference: p.reference,
      // Brand
      brand_id: p.brandId ?? null,
      brand_name: p.brand?.name ?? null,
      brand_slug: p.brand?.slug ?? null,
      // Customer
      first_name: firstName,
      last_name: lastName,
      cardholder_name:
        billing.cardHolderName ||
        [firstName, lastName].filter(Boolean).join(' ') ||
        null,
      email: p.user?.email ?? null,
      phone,
      // Geo
      billing_country: country,
      country,
      vpn_geo: null,
      user_ip: meta.userIp ?? meta.ip ?? null,
      // Money
      amount: amountDollars,
      total_amount: amountDollars,
      original_amount:
        p.originalAmount != null ? p.originalAmount / 100 : amountDollars,
      amount_usd: amountDollars,
      order_amount_usd: amountDollars,
      currency: p.currency || 'USD',
      // Commission
      commission: (p.brandCommission ?? 0) / 100,
      commission_amount: (p.brandCommission ?? 0) / 100,
      brand_commission: (p.brandCommission ?? 0) / 100,
      brand_paid_out: !!p.brandPaidOut,
      // Status / payment method
      status: p.status,
      payment_status: p.status,
      payment_method: p.provider,
      provider: p.provider,
      payment_message: p.failureReason ?? null,
      // Package / link metadata
      package_id: p.challengeId ?? null,
      package_name: p.challenge?.name ?? null,
      coupon_code: p.couponCode ?? null,
      discount_amount: p.discountAmount != null ? p.discountAmount / 100 : 0,
      // Timestamps — provided as both `date` and `created_at` because
      // different sections read different field names.
      date: p.createdAt,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
      refunded_at: p.refundedAt,
    };
  }

  private computeTransactionStats(payments: any[]) {
    const succeeded = payments.filter((p) => p.status === 'succeeded');
    const totalOrderAmount =
      succeeded.reduce((acc, p) => acc + (p.amount ?? 0), 0) / 100;
    const totalCommission =
      succeeded.reduce((acc, p) => acc + (p.brandCommission ?? 0), 0) / 100;
    // Conventions used by the visionscope UI:
    //  - rolling_reserve = 10% of total_order_amount, held for 120 days
    //  - final_payout    = total_order_amount − rolling_reserve − refunds
    //  - total_paid      = sum of payments where brandPaidOut = true
    const rollingReserve = totalOrderAmount * 0.1;
    const finalPayout = totalOrderAmount - rollingReserve;
    const totalPaid =
      succeeded
        .filter((p) => p.brandPaidOut === true)
        .reduce((acc, p) => acc + (p.brandCommission ?? 0), 0) / 100;
    const totalUnpaid = totalCommission - totalPaid;
    return {
      total_order_amount: totalOrderAmount,
      rolling_reserve: rollingReserve,
      final_payout: finalPayout,
      final_payout_amount: finalPayout,
      total_paid: totalPaid,
      total_unpaid: totalUnpaid,
      total_unpaid_commission: totalUnpaid,
      total_commission: totalCommission,
      total_count: payments.length,
      total_orders: succeeded.length,
      total_transactions: payments.length,
    };
  }

  async listChildTransactions(_brandId: string) {
    return {
      transactions: [],
      stats: this.emptyTransactionsStats(),
      child_brands: [],
    };
  }

  async listNetworkTransactions(_brandId: string) {
    // A plain Brand has no child brands (only Resellers do), so the network
    // view is empty. The shape still needs to include `stats` and `child_brands`
    // so the visionscope-ported section can destructure without crashing.
    return {
      transactions: [],
      stats: this.emptyTransactionsStats(),
      child_brands: [],
    };
  }

  private emptyTransactionsStats() {
    return {
      total_order_amount: 0,
      rolling_reserve: 0,
      final_payout: 0,
      final_payout_amount: 0,
      total_paid: 0,
      total_unpaid: 0,
      total_unpaid_commission: 0,
      total_commission: 0,
      total_refunded: 0,
      total_chargeback: 0,
      total_count: 0,
      total_orders: 0,
      total_transactions: 0,
    };
  }

  /* ---------- Network (child brands for resellers; for plain brands: empty) ---------- */

  async listNetwork(brandId: string) {
    const children = await this.db.brand.findMany({
      where: { parentBrandId: brandId },
      orderBy: { createdAt: 'desc' },
    });
    const activeCount = children.filter(
      (c: any) => c.approvalStatus === 'active' || c.status === 'active',
    ).length;
    return {
      partners: children.map((c: any) => this.publicProfile(c)),
      stats: {
        total_partners: children.length,
        active_partners: activeCount,
        pending_partners: children.length - activeCount,
      },
    };
  }

  /* ---------- Analytics ---------- */

  async analytics(brandId: string) {
    const [stats, byCountry] = await Promise.all([
      this.dashboardStats(brandId),
      Promise.resolve([]), // Would aggregate Payment x Visit by country if attribution existed
    ]);
    return { ...stats, by_country: byCountry };
  }

  /* ---------- Commission stats ---------- */

  async commissionStats(brandId: string) {
    const [paidAgg, unpaidAgg, totalAgg, totalOrders, brand] = await Promise.all([
      this.db.payment.aggregate({
        _sum: { brandCommission: true },
        where: { brandId, status: 'succeeded', brandPaidOut: true },
      }),
      this.db.payment.aggregate({
        _sum: { brandCommission: true },
        where: { brandId, status: 'succeeded', brandPaidOut: false },
      }),
      this.db.payment.aggregate({
        _sum: { brandCommission: true, amount: true },
        where: { brandId, status: 'succeeded' },
      }),
      this.db.payment.count({
        where: { brandId, status: 'succeeded' },
      }),
      this.db.brand.findUnique({ where: { id: brandId } }),
    ]);
    const paid = (paidAgg._sum.brandCommission ?? 0) / 100;
    const unpaid = (unpaidAgg._sum.brandCommission ?? 0) / 100;
    const total = (totalAgg._sum.brandCommission ?? 0) / 100;
    return {
      stats: {
        total_paid: paid,
        total_unpaid: unpaid,
        total_commission: total,
        paid_commission: paid,
        unpaid_commission: unpaid,
        pending_commission: unpaid,
        commission_rate: brand?.commissionRate ?? 10,
        total_orders: totalOrders,
        total_order_amount: (totalAgg._sum.amount ?? 0) / 100,
      },
      // Keep the flat fields too for backwards-compat with code that doesn't
      // unwrap stats.
      total_paid: paid,
      total_unpaid: unpaid,
    };
  }

  /* ---------- Payouts ---------- */

  async listPayouts(brandId: string, params: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;
    const [data, total, paidAgg] = await Promise.all([
      this.db.brandPayout.findMany({
        where: { brandId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.brandPayout.count({ where: { brandId } }),
      this.db.brandPayout.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { brandId, status: 'paid' },
      }),
    ]);

    const totalPaid = paidAgg._sum.amount ?? 0;
    const paidCount = paidAgg._count ?? 0;
    const lastPaid = data.find((p: any) => p.status === 'paid');

    return {
      payouts: data.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        period_start: p.periodStart,
        period_end: p.periodEnd,
        status: p.status,
        method: p.method,
        reference_id: p.referenceId,
        paid_at: p.paidAt,
        created_at: p.createdAt,
      })),
      stats: {
        total_paid: totalPaid,
        total_payouts: paidCount,
        average_payout: paidCount > 0 ? totalPaid / paidCount : 0,
        last_payout: lastPaid
          ? { amount: lastPaid.amount, date: lastPaid.paidAt ?? lastPaid.createdAt }
          : null,
      },
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    };
  }

  async listUnpaidPayouts(brandId: string) {
    return this.listPayouts(brandId, { page: 1, limit: 200 });
  }
}
