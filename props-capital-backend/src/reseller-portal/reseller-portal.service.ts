import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ResellerPortalService
 * A reseller is just a Brand row with accountType = 'reseller'. Resellers can
 * have child brands (parentBrandId points to them) and earn from the network's
 * sales.
 */
@Injectable()
export class ResellerPortalService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
  ) {}

  private get db(): any {
    return this.prisma;
  }

  /* ---------- Auth ---------- */

  async login(username: string, password: string) {
    if (!username || !password)
      throw new BadRequestException('username and password required');

    const reseller = await this.db.brand.findFirst({
      where: {
        AND: [
          { OR: [{ username }, { email: username }] },
          { accountType: 'reseller' },
        ],
      },
    });
    if (!reseller || !reseller.passwordHash)
      throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, reseller.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    if (reseller.approvalStatus !== 'active')
      throw new UnauthorizedException(
        `Reseller account not active (status: ${reseller.approvalStatus})`,
      );

    const token = this.jwt.sign({
      sub: reseller.id,
      username: reseller.username,
      kind: 'reseller',
    });

    return { token, reseller: this.publicProfile(reseller) };
  }

  async me(resellerId: string) {
    const r = await this.db.brand.findUnique({ where: { id: resellerId } });
    if (!r) throw new UnauthorizedException();
    return { reseller: this.publicProfile(r) };
  }

  async changePassword(
    resellerId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (!newPassword || newPassword.length < 8)
      throw new BadRequestException('Password too short');
    const r = await this.db.brand.findUnique({ where: { id: resellerId } });
    if (!r?.passwordHash) throw new UnauthorizedException();
    const ok = await bcrypt.compare(currentPassword, r.passwordHash);
    if (!ok) throw new UnauthorizedException('Current password incorrect');
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.db.brand.update({
      where: { id: resellerId },
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

  async updateProfile(resellerId: string, body: any) {
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
      where: { id: resellerId },
      data: updateData,
    });
    return { reseller: this.publicProfile(updated) };
  }

  /* ---------- Dashboard / network analytics ---------- */

  async dashboardStats(resellerId: string) {
    // Find all child brand IDs
    const children = await this.db.brand.findMany({
      where: { parentBrandId: resellerId },
      select: { id: true },
    });
    const childIds = children.map((c: any) => c.id);

    const networkPaymentsWhere = {
      brandId: { in: childIds.length ? childIds : ['__none__'] },
      status: 'succeeded',
    };

    const [
      networkAgg,
      networkCount,
      ownAgg,
      ownCount,
      paidAgg,
      unpaidAgg,
      reseller,
    ] = await Promise.all([
      this.db.payment.aggregate({
        _sum: { amount: true, brandCommission: true },
        where: networkPaymentsWhere,
      }),
      this.db.payment.count({ where: networkPaymentsWhere }),
      this.db.payment.aggregate({
        _sum: { amount: true, brandCommission: true },
        where: { brandId: resellerId, status: 'succeeded' },
      }),
      this.db.payment.count({
        where: { brandId: resellerId, status: 'succeeded' },
      }),
      this.db.payment.aggregate({
        _sum: { brandCommission: true },
        where: {
          brandId: { in: childIds.length ? childIds : ['__none__'] },
          status: 'succeeded',
          brandPaidOut: true,
        },
      }),
      this.db.payment.aggregate({
        _sum: { brandCommission: true },
        where: {
          brandId: { in: childIds.length ? childIds : ['__none__'] },
          status: 'succeeded',
          brandPaidOut: false,
        },
      }),
      this.db.brand.findUnique({ where: { id: resellerId } }),
    ]);

    const networkRevenue = (networkAgg._sum.amount ?? 0) / 100;
    const ownRevenue = (ownAgg._sum.amount ?? 0) / 100;
    const totalOrderAmount = networkRevenue + ownRevenue;
    const rollingReserve = totalOrderAmount * 0.1;
    const paidCommission = (paidAgg._sum.brandCommission ?? 0) / 100;
    const unpaidCommission = (unpaidAgg._sum.brandCommission ?? 0) / 100;

    return {
      totals: {
        own_revenue: ownRevenue,
        own_orders: ownCount,
        network_revenue: networkRevenue,
        network_orders: networkCount,
        network_brands: childIds.length,
      },
      stats: {
        total_orders: networkCount + ownCount,
        total_order_amount: totalOrderAmount,
        rolling_reserve: rollingReserve,
        final_payout_amount: totalOrderAmount - rollingReserve,
        paid_commission: paidCommission,
        unpaid_commission: unpaidCommission,
        commission_rate: reseller?.resellerCommission ?? 0,
        network_brands: childIds.length,
      },
    };
  }

  /* ---------- Visits ---------- */

  async listVisits(
    _resellerId: string,
    params: { page?: number; limit?: number },
  ) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;
    const data = await this.db.visit.findMany({
      skip,
      take: limit,
      orderBy: { lastVisitAt: 'desc' },
    });
    return {
      visits: data.map((v: any) => ({
        ip: v.ip,
        country: v.country,
        country_code: v.countryCode,
        city: v.city,
        last_visit_at: v.lastVisitAt,
      })),
    };
  }

  async visitsStats(_resellerId: string, days = 30) {
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [total, unique, recent] = await Promise.all([
      this.db.visit.aggregate({ _sum: { visitsCount: true } }),
      this.db.visit.count(),
      this.db.visit.findMany({
        where: { lastVisitAt: { gte: sinceDate } },
        select: { lastVisitAt: true, visitsCount: true },
      }),
    ]);

    const buckets = new Map<string, number>();
    for (const v of recent) {
      const day = (v.lastVisitAt as Date).toISOString().slice(0, 10);
      buckets.set(day, (buckets.get(day) ?? 0) + (v.visitsCount ?? 0));
    }
    const dailyStats = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, total_visits: count }));

    return {
      total_visits: total._sum.visitsCount ?? 0,
      unique_visitors: unique,
      period_days: days,
      daily_stats: dailyStats,
      total: total._sum.visitsCount ?? 0,
    };
  }

  /* ---------- Direct purchase links (own) ---------- */

  async listLinks(resellerId: string) {
    const links = await this.db.directPurchaseLink.findMany({
      where: { brandId: resellerId },
      orderBy: { createdAt: 'desc' },
    });
    return { links: links.map((l: any) => this.mapLink(l)) };
  }

  async listLinksByBrand(resellerId: string, brandId: string) {
    const child = await this.db.brand.findUnique({ where: { id: brandId } });
    if (!child || child.parentBrandId !== resellerId)
      throw new UnauthorizedException('Brand not in your network');
    const links = await this.db.directPurchaseLink.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
    });
    return { links: links.map((l: any) => this.mapLink(l)) };
  }

  async createLink(resellerId: string, body: any) {
    const link = await this.db.directPurchaseLink.create({
      data: {
        slug: body.slug ?? Math.random().toString(36).slice(2, 10),
        name: body.name ?? null,
        brandId: resellerId,
        challengeId: body.challenge_id ?? null,
        amount: body.amount != null ? Number(body.amount) : null,
        currency: body.currency ?? 'USD',
        active: body.active !== false,
      },
    });
    return { link: this.mapLink(link) };
  }

  async updateLink(resellerId: string, id: string, body: any) {
    const existing = await this.db.directPurchaseLink.findUnique({
      where: { id },
    });
    if (!existing || existing.brandId !== resellerId)
      throw new UnauthorizedException();
    const data: any = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.amount !== undefined) data.amount = Number(body.amount);
    if (body.active !== undefined) data.active = !!body.active;
    const updated = await this.db.directPurchaseLink.update({
      where: { id },
      data,
    });
    return { link: this.mapLink(updated) };
  }

  async deleteLink(resellerId: string, id: string) {
    const existing = await this.db.directPurchaseLink.findUnique({
      where: { id },
    });
    if (!existing || existing.brandId !== resellerId)
      throw new UnauthorizedException();
    await this.db.directPurchaseLink.delete({ where: { id } });
    return { success: true };
  }

  private mapLink(l: any) {
    return {
      id: l.id,
      link_id: l.slug,
      slug: l.slug,
      name: l.name ?? l.slug,
      total_amount: Number(l.amount ?? 0),
      currency: l.currency,
      is_active: l.active,
      visits_count: l.clicks,
      transactions_count: l.conversions,
      conversion_rate: l.clicks > 0 ? (l.conversions / l.clicks) * 100 : 0,
      created_at: l.createdAt,
    };
  }

  /* ---------- Orders ---------- */

  async listOrders(
    resellerId: string,
    params: { page?: number; limit?: number },
  ) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;
    const where = { brandId: resellerId, status: 'succeeded' };
    const [data, total] = await Promise.all([
      this.db.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
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
        status: p.status,
      })),
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ---------- Network (child brands) ---------- */

  async networkBrands(
    resellerId: string,
    params: { page?: number; limit?: number },
  ) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;
    const where = { parentBrandId: resellerId };
    const [data, total] = await Promise.all([
      this.db.brand.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.brand.count({ where }),
    ]);
    return {
      brands: data.map((b: any) => this.publicProfile(b)),
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    };
  }

  async networkTransactions(
    resellerId: string,
    params: { page?: number; limit?: number },
  ) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(params.limit) || 100));
    const skip = (page - 1) * limit;

    const children = await this.db.brand.findMany({
      where: { parentBrandId: resellerId },
      select: { id: true, name: true },
    });
    const childMap = new Map(children.map((c: any) => [c.id, c.name]));
    const childIds = children.map((c: any) => c.id);
    if (!childIds.length)
      return {
        transactions: [],
        pagination: { total: 0, page: 1, totalPages: 0 },
      };

    const where = { brandId: { in: childIds }, status: 'succeeded' };
    const [data, total] = await Promise.all([
      this.db.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true } } },
      }),
      this.db.payment.count({ where }),
    ]);
    return {
      transactions: data.map((p: any) => ({
        id: p.id,
        date: p.createdAt,
        amount: p.amount / 100,
        brand_id: p.brandId,
        brand_name: childMap.get(p.brandId) ?? null,
        email: p.user?.email,
        status: p.status,
      })),
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    };
  }

  async createBrandUnderReseller(resellerId: string, body: any) {
    if (!body.name || !body.username || !body.password)
      throw new BadRequestException('name, username, password required');

    const passwordHash = await bcrypt.hash(body.password, 10);
    const created = await this.db.brand.create({
      data: {
        name: body.name,
        username: body.username,
        email: body.email ?? null,
        passwordHash,
        accountType: 'brand',
        approvalStatus: body.approval_status ?? 'pending',
        commissionRate: Number(body.commission_rate ?? 10),
        parentBrandId: resellerId,
      },
    });
    return { brand: this.publicProfile(created) };
  }

  /* ---------- MIDs / aggregate stats / commission / payouts ---------- */

  listMids(resellerId: string) {
    // MIDs are looked up per reseller; none are configured yet so the list is
    // empty regardless of the reseller. `resellerId` is referenced to keep the
    // call-site contract while satisfying lint until real lookups are wired up.
    void resellerId;
    return { mids: [] };
  }

  async analytics(resellerId: string) {
    const stats = await this.dashboardStats(resellerId);
    return { ...stats, by_country: [] };
  }

  async commissionStats(resellerId: string) {
    // Reseller earns from their network's payments
    const children = await this.db.brand.findMany({
      where: { parentBrandId: resellerId },
      select: { id: true },
    });
    const childIds = children.map((c: any) => c.id);
    if (!childIds.length) return { total_paid: 0, total_unpaid: 0 };

    const [paid, unpaid] = await Promise.all([
      this.db.payment.aggregate({
        _sum: { brandCommission: true },
        where: {
          brandId: { in: childIds },
          status: 'succeeded',
          brandPaidOut: true,
        },
      }),
      this.db.payment.aggregate({
        _sum: { brandCommission: true },
        where: {
          brandId: { in: childIds },
          status: 'succeeded',
          brandPaidOut: false,
        },
      }),
    ]);
    return {
      total_paid: (paid._sum.brandCommission ?? 0) / 100,
      total_unpaid: (unpaid._sum.brandCommission ?? 0) / 100,
    };
  }

  async listPayouts(
    resellerId: string,
    params: { page?: number; limit?: number },
  ) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;
    const [data, total, paidAgg] = await Promise.all([
      this.db.brandPayout.findMany({
        where: { brandId: resellerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.brandPayout.count({ where: { brandId: resellerId } }),
      this.db.brandPayout.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { brandId: resellerId, status: 'paid' },
      }),
    ]);

    const totalPaid = paidAgg._sum.amount ?? 0;
    const paidCount = paidAgg._count ?? 0;
    const lastPaid = data.find((p: any) => p.status === 'paid');

    return {
      payouts: data.map((p: any) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        method: p.method,
        period_start: p.periodStart,
        period_end: p.periodEnd,
        paid_at: p.paidAt,
        created_at: p.createdAt,
      })),
      stats: {
        total_paid: totalPaid,
        total_payouts: paidCount,
        average_payout: paidCount > 0 ? totalPaid / paidCount : 0,
        last_payout: lastPaid
          ? {
              amount: lastPaid.amount,
              date: lastPaid.paidAt ?? lastPaid.createdAt,
            }
          : null,
      },
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    };
  }

  async listAllTransactions(resellerId: string) {
    // Reseller's "all transactions" = own payments + network (child brand)
    // payments combined, so the dashboard reflects total business volume.
    const children = await this.db.brand.findMany({
      where: { parentBrandId: resellerId },
      select: { id: true },
    });
    const childIds = children.map((c: any) => c.id);
    const ids = [resellerId, ...childIds];

    const data = await this.db.payment.findMany({
      where: { brandId: { in: ids } },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        user: { include: { profile: true } },
        challenge: { select: { name: true } },
      },
    });

    const succeeded = data.filter((p: any) => p.status === 'succeeded');
    const totalOrderAmount =
      succeeded.reduce((acc: number, p: any) => acc + (p.amount ?? 0), 0) / 100;
    const totalCommission =
      succeeded.reduce(
        (acc: number, p: any) => acc + (p.brandCommission ?? 0),
        0,
      ) / 100;
    const rollingReserve = totalOrderAmount * 0.1;
    const totalPaid =
      succeeded
        .filter((p: any) => p.brandPaidOut === true)
        .reduce((acc: number, p: any) => acc + (p.brandCommission ?? 0), 0) /
      100;

    return {
      transactions: data.map((p: any) => ({
        id: p.id,
        date: p.createdAt,
        amount: p.amount / 100,
        commission: (p.brandCommission ?? 0) / 100,
        status: p.status,
        email: p.user?.email,
        package_name: p.challenge?.name,
      })),
      total: data.length,
      stats: {
        total_order_amount: totalOrderAmount,
        rolling_reserve: rollingReserve,
        final_payout: totalOrderAmount - rollingReserve,
        final_payout_amount: totalOrderAmount - rollingReserve,
        total_paid: totalPaid,
        total_unpaid: totalCommission - totalPaid,
        total_unpaid_commission: totalCommission - totalPaid,
        total_commission: totalCommission,
        total_count: data.length,
        total_orders: succeeded.length,
      },
    };
  }
}
