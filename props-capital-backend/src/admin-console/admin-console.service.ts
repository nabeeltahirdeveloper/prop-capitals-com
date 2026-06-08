import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminConsoleService {
  constructor(private prisma: PrismaService) {}

  /* ---------- Dashboard / Analytics overview ---------- */

  async revenueChart(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const [payments, payouts] = await Promise.all([
      this.prisma.payment.findMany({
        where: { status: 'succeeded', createdAt: { gte: since } },
        select: { amount: true, createdAt: true },
      }),
      this.prisma.payout.findMany({
        where: {
          status: { in: ['PAID', 'APPROVED'] as any[] },
          createdAt: { gte: since },
        },
        select: { amount: true, createdAt: true },
      }),
    ]);

    const buckets = new Map<string, { revenue: number; payouts: number }>();
    // Pre-fill all days so the chart shows a continuous line
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { revenue: 0, payouts: 0 });
    }
    for (const p of payments) {
      const key = p.createdAt.toISOString().slice(0, 10);
      const cur = buckets.get(key) ?? { revenue: 0, payouts: 0 };
      cur.revenue += (p.amount ?? 0) / 100;
      buckets.set(key, cur);
    }
    for (const p of payouts) {
      const key = p.createdAt.toISOString().slice(0, 10);
      const cur = buckets.get(key) ?? { revenue: 0, payouts: 0 };
      cur.payouts += (p.amount ?? 0) / 100;
      buckets.set(key, cur);
    }

    return {
      days,
      series: Array.from(buckets.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, v]) => ({ date, revenue: v.revenue, payouts: v.payouts })),
    };
  }

  /**
   * Distribution of sales by package (Challenge) for the Advanced Analytics
   * page. Returns top N packages by revenue + count.
   */
  async packageDistribution(days = 30, limit = 10) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const grouped = await this.prisma.payment.groupBy({
      by: ['challengeId'],
      where: { status: 'succeeded', createdAt: { gte: since } },
      _sum: { amount: true },
      _count: true,
      orderBy: { _sum: { amount: 'desc' } },
      take: limit,
    });

    const challengeIds = grouped
      .map((g) => g.challengeId)
      .filter(Boolean) as string[];
    const challenges = challengeIds.length
      ? await this.prisma.challenge.findMany({
          where: { id: { in: challengeIds } },
          select: { id: true, name: true, accountSize: true, price: true },
        })
      : [];
    const cmap = new Map(challenges.map((c) => [c.id, c]));

    return {
      days,
      buckets: grouped.map((g) => {
        const c = g.challengeId ? cmap.get(g.challengeId) : null;
        return {
          challenge_id: g.challengeId,
          name: c?.name ?? '—',
          account_size: c?.accountSize ?? 0,
          orders: g._count,
          revenue: (g._sum.amount ?? 0) / 100,
        };
      }),
    };
  }

  async analyticsOverview() {
    const [
      revenueAgg,
      userCount,
      orderCount,
      recentPayments,
      recentChallenges,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'succeeded' },
      }),
      this.prisma.user.count(),
      this.prisma.payment.count(),
      this.prisma.payment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { email: true } },
          challenge: { select: { name: true } },
        },
      }),
      this.prisma.challenge.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          price: true,
          accountSize: true,
          isActive: true,
        },
      }),
    ]);

    return {
      totals: {
        revenue: (revenueAgg._sum.amount ?? 0) / 100,
        users: userCount,
        orders: orderCount,
        credits_used: 0,
        vpn_proxy_blocks: 0,
      },
      recent_orders: recentPayments.map((p) => ({
        order_id: p.id,
        email: p.user?.email ?? '-',
        total_amount: p.amount / 100,
        created_at: p.createdAt,
        package_name: p.challenge?.name ?? null,
        status: p.status,
      })),
      brand_breakdown: recentChallenges.map((c) => ({
        id: c.id,
        name: c.name,
        total_orders: 0,
        total_revenue: 0,
        total_commission: 0,
        final_payout_amount: 0,
      })),
    };
  }

  /* ---------- Users ---------- */

  async listUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { profile: true },
    });

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        full_name:
          [u.profile?.firstName, u.profile?.lastName]
            .filter(Boolean)
            .join(' ') || u.email.split('@')[0],
        role: u.role.toLowerCase(),
        plan: 'none',
        subscription_tier: 'none',
        status: 'active',
        country: u.profile?.country ?? null,
        created_at: u.createdAt,
        updated_at: u.updatedAt,
      })),
    };
  }

  async createUser(data: {
    email: string;
    full_name?: string;
    plan?: string;
    role?: string;
    password?: string;
  }) {
    const bcrypt = await import('bcrypt');
    const password = data.password ?? this.randomPassword();
    const hash = await bcrypt.hash(password, 10);

    const [firstName, ...rest] = (data.full_name ?? '').split(' ');
    const lastName = rest.join(' ') || null;

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        password: hash,
        role: (data.role ?? 'TRADER').toUpperCase() as any,
        profile: {
          create: {
            firstName: firstName || null,
            lastName,
          },
        },
      },
      include: { profile: true },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name:
          [user.profile?.firstName, user.profile?.lastName]
            .filter(Boolean)
            .join(' ') || user.email.split('@')[0],
        role: user.role.toLowerCase(),
        plan: data.plan ?? 'none',
        created_at: user.createdAt,
      },
    };
  }

  async updateUser(id: string, partial: Record<string, any>) {
    const data: any = {};
    if (partial.role) data.role = String(partial.role).toUpperCase();

    const profileUpdate: any = {};
    if (partial.full_name !== undefined) {
      const [firstName, ...rest] = String(partial.full_name).split(' ');
      profileUpdate.firstName = firstName || null;
      profileUpdate.lastName = rest.join(' ') || null;
    }
    if (Object.keys(profileUpdate).length > 0) {
      data.profile = {
        upsert: {
          create: profileUpdate,
          update: profileUpdate,
        },
      };
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { profile: true },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        full_name:
          [user.profile?.firstName, user.profile?.lastName]
            .filter(Boolean)
            .join(' ') || user.email.split('@')[0],
        role: user.role.toLowerCase(),
        plan: partial.plan ?? 'none',
        updated_at: user.updatedAt,
      },
    };
  }

  private randomPassword() {
    return (
      Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2)
    );
  }

  /* ---------- Packages (mapped to Challenge) ----------
   * Visionscope "package" concept maps to a sellable Challenge in prop-capitals.
   * Each Challenge has price, name, description, isActive, plus trading-specific
   * fields (drawdown, profit-split, account size, platform). We surface those as
   * the package's `features` list so the visionscope UI shows useful detail.
   */

  private mapChallengeToPackage(c: any) {
    const features: string[] = [];
    if (c.accountSize)
      features.push(`Account size: $${c.accountSize.toLocaleString()}`);
    if (c.profitSplit) features.push(`Profit split: ${c.profitSplit}%`);
    if (c.phase1TargetPercent)
      features.push(`Phase 1 target: ${c.phase1TargetPercent}%`);
    if (c.phase2TargetPercent && c.challengeType === 'two_phase')
      features.push(`Phase 2 target: ${c.phase2TargetPercent}%`);
    if (c.dailyDrawdownPercent)
      features.push(`Daily drawdown: ${c.dailyDrawdownPercent}%`);
    if (c.overallDrawdownPercent)
      features.push(`Overall drawdown: ${c.overallDrawdownPercent}%`);
    if (c.platform) features.push(`Platform: ${c.platform}`);
    if (c.eaAllowed) features.push('EAs allowed');
    if (c.weekendHoldingAllowed) features.push('Weekend holding');
    if (c.newsTradingAllowed) features.push('News trading');

    return {
      id: c.id,
      name: c.name,
      description: c.description ?? '',
      price: c.price,
      currency: c.currency === 'USD' ? '$' : c.currency,
      type: 'package',
      credits: null,
      features,
      popular: false,
      active: c.isActive,
      created_at: c.createdAt,
      updated_at: c.updatedAt,
    };
  }

  async listPackages() {
    const challenges = await this.prisma.challenge.findMany({
      orderBy: [{ isActive: 'desc' }, { price: 'asc' }],
    });
    return {
      packages: challenges.map((c) => this.mapChallengeToPackage(c)),
      creditPackages: [],
    };
  }

  async getPackage(id: string) {
    const c = await this.prisma.challenge.findUnique({ where: { id } });
    if (!c) return { package: null };
    return { package: this.mapChallengeToPackage(c) };
  }

  async createPackage(data: any) {
    const created = await this.prisma.challenge.create({
      data: {
        name: data.name ?? 'Untitled',
        description: data.description ?? null,
        price: Math.round(Number(data.price) || 0),
        currency: data.currency === '$' ? 'USD' : (data.currency ?? 'USD'),
        accountSize: Number(data.accountSize) || 10000,
        platform: data.platform ?? 'MT5',
        isActive: data.active !== false,
      },
    });
    return { package: this.mapChallengeToPackage(created) };
  }

  async updatePackage(id: string, data: any) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.price !== undefined)
      updateData.price = Math.round(Number(data.price));
    if (data.currency !== undefined)
      updateData.currency = data.currency === '$' ? 'USD' : data.currency;
    if (data.active !== undefined) updateData.isActive = !!data.active;

    const updated = await this.prisma.challenge.update({
      where: { id },
      data: updateData,
    });
    return { package: this.mapChallengeToPackage(updated) };
  }

  async deletePackage(id: string) {
    // Soft-delete by deactivation if there are sold payments referencing it
    const refCount = await this.prisma.payment.count({
      where: { challengeId: id },
    });
    if (refCount > 0) {
      await this.prisma.challenge.update({
        where: { id },
        data: { isActive: false },
      });
      return { success: true, deactivated: true };
    }
    await this.prisma.challenge.delete({ where: { id } });
    return { success: true };
  }

  /* ---------- Orders (mapped to Payment) ----------
   * Visionscope "order" maps to a Payment record. Amounts are stored in
   * cents (Int) on Payment, so we divide by 100 for the frontend.
   */

  private mapPaymentToOrder(p: any) {
    const meta = p.metadata && typeof p.metadata === 'object' ? p.metadata : {};
    const billing =
      meta.billingDetails && typeof meta.billingDetails === 'object'
        ? meta.billingDetails
        : {};
    const items = Array.isArray(meta.orderItems)
      ? meta.orderItems
      : p.challenge?.name
        ? [
            {
              type: 'package',
              id: p.challengeId,
              name: p.challenge.name,
              price: (p.amount ?? 0) / 100,
              quantity: 1,
              currency: p.currency === 'EUR' ? '€' : '$',
            },
          ]
        : [];
    const firstName =
      p.billingFirstName ?? p.user?.profile?.firstName ?? billing.firstName;
    const lastName =
      p.billingLastName ?? p.user?.profile?.lastName ?? billing.lastName;

    return {
      id: p.id,
      order_id: p.id,
      email: p.billingEmail ?? p.user?.email ?? billing.email ?? null,
      full_name: [firstName, lastName].filter(Boolean).join(' ') || null,
      total_amount: p.amount / 100,
      original_amount: p.originalAmount != null ? p.originalAmount / 100 : null,
      discount_amount: p.discountAmount != null ? p.discountAmount / 100 : 0,
      currency: p.currency,
      provider: p.provider,
      payment_method: p.provider,
      status: p.status,
      payment_status: p.status,
      order_status: p.orderStatus,
      reference: p.reference,
      package_name: p.challenge?.name ?? null,
      package_id: p.challengeId,
      items,
      brand_id: p.brandId ?? null,
      brand_name: p.brand?.name ?? null,
      brand_slug: p.brand?.slug ?? null,
      reseller_name: p.brand?.parentBrand?.name ?? null,
      brand_commission: (p.brandCommission ?? 0) / 100,
      brand_paid_out: !!p.brandPaidOut,
      coupon_code: p.couponCode,
      card_holder_name:
        p.cardholderName ??
        billing.cardHolderName ??
        ([firstName, lastName].filter(Boolean).join(' ') || null),
      phone: p.billingPhone ?? p.user?.profile?.phone ?? billing.phone ?? null,
      billing_country:
        p.billingCountry ?? p.user?.profile?.country ?? billing.country ?? null,
      payment_message: p.failureReason ?? null,
      created_at: p.createdAt,
      updated_at: p.updatedAt,
      refunded_at: p.refundedAt,
    };
  }

  private paymentInclude() {
    return {
      user: { include: { profile: true } },
      challenge: { select: { id: true, name: true } },
      brand: {
        select: {
          id: true,
          name: true,
          slug: true,
          commissionRate: true,
          parentBrand: { select: { id: true, name: true } },
        },
      },
    };
  }

  private normalizePaymentStatus(status: any): string | undefined {
    if (status === undefined || status === null || status === '') return undefined;
    const s = String(status).trim().toLowerCase();
    const aliases: Record<string, string> = {
      completed: 'succeeded',
      success: 'succeeded',
      successful: 'succeeded',
      approved: 'succeeded',
      cancelled: 'failed',
      canceled: 'failed',
      decline: 'failed',
      declined: 'failed',
      refund: 'refunded',
    };
    return aliases[s] ?? s;
  }

  private async calculateBrandCommissionCents(
    brandId: string | null | undefined,
    amountCents: number,
  ) {
    if (!brandId) return 0;
    const brand = await this.db.brand.findUnique({
      where: { id: brandId },
      select: { commissionRate: true },
    });
    if (!brand) throw new Error('Brand not found');
    return Math.round((amountCents * Number(brand.commissionRate ?? 0)) / 100);
  }

  async listOrders(params: {
    page?: number;
    pageSize?: number;
    limit?: number;
    search?: string;
    q?: string;
    status?: string;
    brand?: string;
    package?: string;
    from?: string;
    to?: string;
    sortBy?: string;
    sortDir?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(
      200,
      Math.max(1, Number(params.pageSize ?? params.limit) || 50),
    );
    const skip = (page - 1) * limit;
    const search = params.search ?? params.q;

    const where: any = {};
    if (params.status && params.status !== 'all') {
      where.status = this.normalizePaymentStatus(params.status);
    }
    if (params.brand && params.brand !== 'all') where.brandId = params.brand;
    if (params.package) where.challengeId = params.package;
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) where.createdAt.lte = new Date(params.to);
    }
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { reference: { contains: search, mode: 'insensitive' } },
        { provider: { contains: search, mode: 'insensitive' } },
        { currency: { contains: search, mode: 'insensitive' } },
        { failureReason: { contains: search, mode: 'insensitive' } },
        { billingEmail: { contains: search, mode: 'insensitive' } },
        { billingFirstName: { contains: search, mode: 'insensitive' } },
        { billingLastName: { contains: search, mode: 'insensitive' } },
        { billingPhone: { contains: search, mode: 'insensitive' } },
        { billingCountry: { contains: search, mode: 'insensitive' } },
        { cardholderName: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { challenge: { name: { contains: search, mode: 'insensitive' } } },
        { brand: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const sortMap: Record<string, any> = {
      order_id: { id: params.sortDir === 'asc' ? 'asc' : 'desc' },
      email: { billingEmail: params.sortDir === 'asc' ? 'asc' : 'desc' },
      total_amount: { amount: params.sortDir === 'asc' ? 'asc' : 'desc' },
      amount: { amount: params.sortDir === 'asc' ? 'asc' : 'desc' },
      status: { status: params.sortDir === 'asc' ? 'asc' : 'desc' },
      payment_status: { status: params.sortDir === 'asc' ? 'asc' : 'desc' },
      created_at: { createdAt: params.sortDir === 'asc' ? 'asc' : 'desc' },
      date: { createdAt: params.sortDir === 'asc' ? 'asc' : 'desc' },
      provider: { provider: params.sortDir === 'asc' ? 'asc' : 'desc' },
      currency: { currency: params.sortDir === 'asc' ? 'asc' : 'desc' },
    };
    const orderBy = sortMap[params.sortBy ?? 'created_at'] ?? {
      createdAt: 'desc',
    };

    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: this.paymentInclude(),
      }),
      this.prisma.payment.count({ where }),
    ]);

    const [succeeded, pending, failed, refunded] = await Promise.all([
      this.prisma.payment.count({ where: { ...where, status: 'succeeded' } }),
      this.prisma.payment.count({ where: { ...where, status: 'pending' } }),
      this.prisma.payment.count({ where: { ...where, status: 'failed' } }),
      this.prisma.payment.count({ where: { ...where, status: 'refunded' } }),
    ]);

    return {
      orders: data.map((p) => this.mapPaymentToOrder(p)),
      statusCounts: {
        approved: succeeded,
        succeeded,
        pending,
        unpaid: succeeded,
        declined: failed,
        failed,
        refunded,
      },
      meta: {
        total,
        page,
        pageSize: limit,
        pages: Math.max(1, Math.ceil(total / limit)),
      },
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrder(id: string) {
    const p = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        ...this.paymentInclude(),
      },
    });
    if (!p) return { order: null };
    return { order: this.mapPaymentToOrder(p) };
  }

  async createManualOrder(data: any) {
    const email = String(data.email ?? '').trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('A valid customer email is required');
    }

    const bcrypt = await import('bcrypt');
    const user = await this.db.user.upsert({
      where: { email },
      create: {
        email,
        password: await bcrypt.hash(crypto.randomBytes(24).toString('hex'), 10),
        passwordSet: false,
        role: 'TRADER',
      },
      update: {},
    });

    const amountCents = Math.round(Number(data.total_amount ?? 0) * 100);
    if (!Number.isFinite(amountCents) || amountCents < 0) {
      throw new Error('Invalid total_amount');
    }

    const brandId = data.brand_id || null;
    const brandCommission = await this.calculateBrandCommissionCents(
      brandId,
      amountCents,
    );

    const created = await this.db.payment.create({
      data: {
        userId: user.id,
        amount: amountCents,
        originalAmount: amountCents,
        currency: data.currency || 'USD',
        provider: data.payment_method || data.provider || 'manual',
        status: this.normalizePaymentStatus(data.payment_status) ?? 'pending',
        reference: `manual_${crypto.randomBytes(8).toString('hex')}`,
        brandId,
        brandCommission,
        billingEmail: email,
        billingFirstName: data.first_name ?? null,
        billingLastName: data.last_name ?? null,
        billingPhone: data.phone ?? null,
        billingCountry: data.billing_country ?? null,
        cardholderName: data.card_holder_name ?? null,
        failureReason: data.payment_message ?? null,
        metadata: {
          manual: true,
          orderItems: Array.isArray(data.items) ? data.items : [],
        },
        ...(data.created_at ? { createdAt: new Date(data.created_at) } : {}),
      },
      include: this.paymentInclude(),
    });

    return { order: this.mapPaymentToOrder(created) };
  }

  async updateOrder(id: string, body: any) {
    const existing = await this.db.payment.findUnique({ where: { id } });
    if (!existing) throw new Error('Order not found');

    const data: any = {};
    const nextAmountCents =
      body.total_amount !== undefined || body.amount !== undefined
        ? Math.round(Number(body.total_amount ?? body.amount) * 100)
        : existing.amount;

    if (!Number.isFinite(nextAmountCents) || nextAmountCents < 0) {
      throw new Error('Invalid total amount');
    }

    if (body.total_amount !== undefined || body.amount !== undefined) {
      data.amount = nextAmountCents;
    }
    if (body.payment_status !== undefined || body.status !== undefined) {
      const status = this.normalizePaymentStatus(
        body.payment_status ?? body.status,
      );
      if (status) data.status = status;
      if (status === 'refunded' && !existing.refundedAt) {
        data.refundedAt = new Date();
      }
    }
    if (body.payment_method !== undefined || body.provider !== undefined) {
      data.provider = String(body.payment_method ?? body.provider || 'manual');
    }
    if (body.email !== undefined) data.billingEmail = body.email || null;
    if (body.first_name !== undefined) data.billingFirstName = body.first_name || null;
    if (body.last_name !== undefined) data.billingLastName = body.last_name || null;
    if (body.phone !== undefined) data.billingPhone = body.phone || null;
    if (body.billing_country !== undefined)
      data.billingCountry = body.billing_country || null;
    if (body.card_holder_name !== undefined)
      data.cardholderName = body.card_holder_name || null;
    if (body.payment_message !== undefined)
      data.failureReason = body.payment_message || null;

    let nextBrandId = existing.brandId;
    if (body.brand_id !== undefined) {
      nextBrandId = body.brand_id || null;
      data.brandId = nextBrandId;
      data.brandPaidOut = false;
    }
    if (body.items !== undefined) {
      const metadata =
        existing.metadata && typeof existing.metadata === 'object'
          ? { ...(existing.metadata as Record<string, any>) }
          : {};
      metadata.orderItems = Array.isArray(body.items) ? body.items : [];
      data.metadata = metadata;
    }
    if (
      body.brand_id !== undefined ||
      body.total_amount !== undefined ||
      body.amount !== undefined
    ) {
      data.brandCommission = await this.calculateBrandCommissionCents(
        nextBrandId,
        nextAmountCents,
      );
    }

    const updated = await this.db.payment.update({
      where: { id },
      data,
      include: this.paymentInclude(),
    });

    return { order: this.mapPaymentToOrder(updated) };
  }

  async deleteOrder(id: string) {
    await this.prisma.payment.delete({ where: { id } });
    return { success: true };
  }

  /* ---------- All Transactions (Payment table, full-detail view) ---------- */

  async listAllTransactions(params: {
    from?: string;
    to?: string;
    status?: string;
    search?: string;
    brand?: string;
  }) {
    const where: any = {};
    if (params.status && params.status !== 'all') {
      where.status = this.normalizePaymentStatus(params.status);
    }
    if (params.brand && params.brand !== 'all') where.brandId = params.brand;
    if (params.from || params.to) {
      where.createdAt = {};
      if (params.from) where.createdAt.gte = new Date(params.from);
      if (params.to) where.createdAt.lte = new Date(params.to);
    }
    if (params.search) {
      where.OR = [
        { reference: { contains: params.search, mode: 'insensitive' } },
        { id: { contains: params.search, mode: 'insensitive' } },
        { billingEmail: { contains: params.search, mode: 'insensitive' } },
        { billingFirstName: { contains: params.search, mode: 'insensitive' } },
        { billingLastName: { contains: params.search, mode: 'insensitive' } },
        { user: { email: { contains: params.search, mode: 'insensitive' } } },
        { brand: { name: { contains: params.search, mode: 'insensitive' } } },
        { challenge: { name: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    let data: any[] = [];
    try {
      data = await (this.prisma as any).payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 1000,
        include: {
          user: { include: { profile: true } },
          challenge: { select: { id: true, name: true } },
          // Brand inverse — needed so the admin table can show the brand the
          // sale was attributed to instead of "Unknown Brand" everywhere.
          brand: {
            select: { id: true, name: true, slug: true, commissionRate: true },
          },
        },
      });
    } catch (err: any) {
      console.error('[AdminConsole] listAllTransactions failed:', err?.message);
      data = [];
    }

    const totalSum = data.reduce(
      (acc, p) => acc + (p.status === 'succeeded' ? (p.amount ?? 0) : 0),
      0,
    );

    return {
      transactions: data.map((p: any) => {
        const meta =
          p.metadata && typeof p.metadata === 'object' ? p.metadata : {};
        const billing =
          meta.billingDetails && typeof meta.billingDetails === 'object'
            ? meta.billingDetails
            : {};
        const firstName =
          p.billingFirstName ??
          p.user?.profile?.firstName ??
          billing.firstName ??
          null;
        const lastName =
          p.billingLastName ??
          p.user?.profile?.lastName ??
          billing.lastName ??
          null;
        const country =
          p.billingCountry ?? p.user?.profile?.country ?? billing.country ?? null;
        const amountDollars = (p.amount ?? 0) / 100;
        const items = Array.isArray(meta.orderItems)
          ? meta.orderItems
          : p.challenge?.name
            ? [
                {
                  type: 'package',
                  id: p.challengeId,
                  name: p.challenge.name,
                  price: amountDollars,
                  quantity: 1,
                  currency: p.currency === 'EUR' ? '€' : '$',
                },
              ]
            : [];

        return {
          id: p.id,
          order_id: p.reference ?? p.id,
          reference: p.reference,
          date: p.createdAt,
          created_at: p.createdAt,
          updated_at: p.updatedAt,
          // Brand attribution — surfaces real brand instead of "Unknown Brand"
          brand_id: p.brandId ?? null,
          brand_name: p.brand?.name ?? null,
          brand_slug: p.brand?.slug ?? null,
          // Customer
          first_name: firstName,
          last_name: lastName,
          customer_name:
            [firstName, lastName].filter(Boolean).join(' ') || null,
          cardholder_name:
            p.cardholderName ??
            billing.cardHolderName ??
            ([firstName, lastName].filter(Boolean).join(' ') || null),
          email: p.billingEmail ?? p.user?.email ?? billing.email ?? null,
          phone: p.billingPhone ?? p.user?.profile?.phone ?? billing.phone ?? null,
          // Geo
          country,
          billing_country: country,
          vpn_geo: null,
          user_ip: meta.userIp ?? meta.ip ?? null,
          // Money
          amount: amountDollars,
          total_amount: amountDollars,
          amount_original:
            p.originalAmount != null ? p.originalAmount / 100 : amountDollars,
          amount_usd: amountDollars,
          order_amount_usd: amountDollars,
          currency: p.currency || 'USD',
          // Commission
          commission: (p.brandCommission ?? 0) / 100,
          commission_amount: (p.brandCommission ?? 0) / 100,
          brand_commission: (p.brandCommission ?? 0) / 100,
          commission_rate: p.brand?.commissionRate ?? 0,
          brand_paid_out: !!p.brandPaidOut,
          // Status / payment method
          payment_method: p.provider,
          provider: p.provider,
          payment_status: p.status,
          status: p.status,
          payment_message: p.failureReason ?? null,
          // Package
          items,
          package_id: p.challengeId,
          package_name: p.challenge?.name ?? null,
          coupon_code: p.couponCode,
          discount_amount:
            p.discountAmount != null ? p.discountAmount / 100 : 0,
          refunded_at: p.refundedAt,
        };
      }),
      total: data.length,
      summary: {
        total_succeeded_usd: totalSum / 100,
      },
    };
  }

  /* ---------- Payouts ----------
   * Direct reuse — prop-capitals already has Payout per trading account.
   */

  private mapPayout(p: any) {
    return {
      id: p.id,
      brand_id: null,
      brand_name: null,
      user_id: p.userId,
      email: p.user?.email ?? null,
      full_name:
        [p.user?.profile?.firstName, p.user?.profile?.lastName]
          .filter(Boolean)
          .join(' ') || null,
      amount: p.amount / 100,
      currency: p.currency,
      status: p.status,
      payment_method: p.paymentMethod,
      payment_details: p.paymentDetails,
      trading_account_id: p.tradingAccountId,
      created_at: p.createdAt,
      processed_at: p.processedAt,
    };
  }

  async listPayouts(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status && params.status !== 'all')
      where.status = String(params.status).toUpperCase();

    const [data, total, totalPaid, totalPending] = await Promise.all([
      this.prisma.payout.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { include: { profile: true } } },
      }),
      this.prisma.payout.count({ where }),
      this.prisma.payout.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      this.prisma.payout.aggregate({
        _sum: { amount: true },
        where: { status: 'PENDING' },
      }),
    ]);

    return {
      payouts: data.map((p) => this.mapPayout(p)),
      summary: {
        total_paid: (totalPaid._sum.amount ?? 0) / 100,
        total_pending: (totalPending._sum.amount ?? 0) / 100,
        total_count: total,
      },
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markPayoutsPaid(body: { orderIds?: string[]; brandIds?: string[] }) {
    const ids = body.orderIds ?? [];
    if (ids.length === 0) return { success: true, updated: 0 };

    const result = await this.prisma.payout.updateMany({
      where: { id: { in: ids } },
      data: { status: 'PAID', processedAt: new Date() },
    });
    return { success: true, updated: result.count };
  }

  /* ============================================================================
   * The following methods use new Prisma models added in Phase 3 (Brand, Visit,
   * BlockedIp, IpWhitelist, AdminCurrency, etc.). They use `(this.prisma as any)`
   * casts because the user's running dev server may still hold the old generated
   * client. After a clean backend restart the casts can be removed for full
   * type-safety, but functionally they're correct as-is.
   * ========================================================================== */

  private get db(): any {
    return this.prisma;
  }

  /* ---------- Brands ---------- */

  private mapBrand(b: any) {
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      logo_url: b.logoUrl,
      website: b.website,
      primary_color: b.primaryColor,
      secondary_color: b.secondaryColor,
      description: b.description,
      status: b.status,
      approval_status: b.approvalStatus,
      commission_rate: b.commissionRate,
      reseller_commission: b.resellerCommission,
      email: b.email,
      username: b.username,
      account_type: b.accountType,
      parent_brand_id: b.parentBrandId,
      settlement_method: b.settlementMethod,
      settlement_crypto_wallet: b.settlementCryptoWallet,
      settlement_bank_holder: b.settlementBankHolder,
      settlement_bank_iban: b.settlementBankIban,
      settlement_bank_swift: b.settlementBankSwift,
      settlement_bank_name: b.settlementBankName,
      settlement_bank_address: b.settlementBankAddress,
      created_at: b.createdAt,
      updated_at: b.updatedAt,
    };
  }

  async listBrands(params: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(params.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { slug: { contains: params.q, mode: 'insensitive' } },
        { email: { contains: params.q, mode: 'insensitive' } },
      ];
    }
    if (params.status && params.status !== 'all')
      where.approvalStatus = params.status;

    const [data, total] = await Promise.all([
      this.db.brand.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.brand.count({ where }),
    ]);

    return {
      brands: data.map((b: any) => this.mapBrand(b)),
      meta: {
        page,
        pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getBrand(id: string) {
    const b = await this.db.brand.findUnique({ where: { id } });
    if (!b) return { brand: null };
    return { brand: this.mapBrand(b) };
  }

  async createBrand(data: any) {
    // Generate or use provided password. Username is required for login.
    const bcrypt = await import('bcrypt');
    const plaintextPassword = data.password ?? this.generateBrandPassword();
    const passwordHash = await bcrypt.hash(plaintextPassword, 10);

    const created = await this.db.brand.create({
      data: {
        name: data.name ?? 'Untitled Brand',
        slug: data.slug ?? null,
        logoUrl: data.logo_url ?? null,
        website: data.website ?? null,
        primaryColor: data.primary_color ?? null,
        secondaryColor: data.secondary_color ?? null,
        description: data.description ?? null,
        status: data.status ?? 'active',
        approvalStatus: data.approval_status ?? 'active',
        commissionRate: Number(data.commission_rate ?? 10),
        resellerCommission: Number(data.reseller_commission ?? 0),
        email: data.email ?? null,
        username: data.username ?? null,
        passwordHash,
        accountType: data.account_type ?? 'brand',
      },
    });

    // Auto-provision one DirectPurchaseLink per Challenge for this brand,
    // mirroring visionscope's behavior of pre-populating package links so the
    // brand has trackable referral URLs the moment they log in.
    const linkCount = await this.autoCreateBrandLinks(created.id, {
      mainLinkCustomUrl: data.main_link_custom_url ?? null,
      explicitLinks: Array.isArray(data.custom_links)
        ? data.custom_links
        : null,
    });

    return {
      brand: this.mapBrand(created),
      links_created: linkCount,
      // One-time response so the admin can copy and share the credentials with
      // the brand. Never persisted in plaintext, never returned again.
      generated_password: plaintextPassword,
    };
  }

  /**
   * Provision direct purchase links for a brand:
   *  - Always create a "main" referral link (entry point for the brand).
   *  - Create one per-challenge link if either:
   *      (a) the admin passed `custom_links` (manual selection from the modal), or
   *      (b) no `custom_links` provided — fall back to ALL active challenges.
   *
   * Links are idempotent per (brandId, challengeId): if one already exists for
   * a given pair we skip creation. Returns the number of links created.
   *
   * Public so the brand-portal service can self-heal when a brand created
   * before the auto-create logic landed hits its links page.
   */
  async autoCreateBrandLinks(
    brandId: string,
    opts: {
      mainLinkCustomUrl?: string | null;
      explicitLinks?: Array<{
        package_id?: string;
        name?: string;
        is_main_link?: boolean;
        custom_url?: string;
      }> | null;
    },
  ): Promise<number> {
    let created = 0;

    // Existing links for this brand — skip duplicates
    const existing = await this.db.directPurchaseLink.findMany({
      where: { brandId },
      select: { challengeId: true, name: true },
    });
    const existingChallengeIds = new Set(
      existing.map((l: any) => l.challengeId).filter(Boolean),
    );
    const existingNames = new Set(
      existing.map((l: any) => l.name).filter(Boolean),
    );

    // 1) Main link (always one per brand, regardless of explicit links)
    if (!existingNames.has('Main link')) {
      await this.db.directPurchaseLink.create({
        data: {
          slug: this.randomLinkSlug(),
          name: 'Main link',
          brandId,
          metadata: opts.mainLinkCustomUrl
            ? { custom_url: opts.mainLinkCustomUrl, is_main_link: true }
            : { is_main_link: true },
          active: true,
        },
      });
      created++;
    }

    // 2) Per-challenge links
    let challengeIdsToLink: string[] = [];
    if (opts.explicitLinks && opts.explicitLinks.length > 0) {
      challengeIdsToLink = opts.explicitLinks
        .filter((l) => l.package_id && !l.is_main_link)
        .map((l) => l.package_id as string);
    } else {
      const challenges = await this.prisma.challenge.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      challengeIdsToLink = challenges.map((c) => c.id);
    }

    if (challengeIdsToLink.length === 0) return created;

    const challengesData = await this.prisma.challenge.findMany({
      where: { id: { in: challengeIdsToLink } },
    });

    for (const ch of challengesData) {
      if (existingChallengeIds.has(ch.id)) continue;

      const explicit = opts.explicitLinks?.find((l) => l.package_id === ch.id);
      const linkName = explicit?.name ?? `${ch.name} ($${ch.price})`;
      const customUrl = explicit?.custom_url || null;

      await this.db.directPurchaseLink.create({
        data: {
          slug: this.randomLinkSlug(),
          name: linkName,
          brandId,
          challengeId: ch.id,
          // Challenge.price is already stored in whole dollars (unlike Payment.amount which is cents)
          amount: ch.price,
          currency: ch.currency,
          metadata: customUrl ? { custom_url: customUrl } : undefined,
          active: true,
        },
      });
      created++;
    }

    return created;
  }

  private randomLinkSlug() {
    return Math.random().toString(36).slice(2, 10);
  }

  // Professional slug used for admin-assisted QuickLink payment URLs.
  // Looks like a Stripe/PSP token — `qlk_` prefix makes the kind obvious.
  // Cryptographically random, 22 base62 chars (~131 bits of entropy).
  private quickLinkSlug(): string {
    const alphabet =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = crypto.randomBytes(22);
    let out = '';
    for (let i = 0; i < 22; i++) {
      out += alphabet[bytes[i] % alphabet.length];
    }
    return `qlk_${out}`;
  }

  // Look up a user by email, or create a minimal placeholder one (no
  // password set, no profile) so the QuickLink has a User to attach
  // payments to. Existing customers are reused.
  private async resolveQuickLinkUser(rawEmail: string): Promise<string> {
    const email = String(rawEmail).trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid customer email');
    }
    const existing = await this.db.user.findUnique({ where: { email } });
    if (existing) return existing.id;
    const bcrypt = await import('bcrypt');
    const randomPassword = crypto.randomBytes(24).toString('base64');
    const passwordHash = await bcrypt.hash(randomPassword, 10);
    const created = await this.db.user.create({
      data: {
        email,
        password: passwordHash,
        passwordSet: false,
        role: 'TRADER',
      },
    });
    return created.id;
  }

  async backfillBrandLinks() {
    let brands: any[] = [];
    try {
      brands = await this.db.brand.findMany({
        select: { id: true, name: true },
      });
    } catch (err: any) {
      console.error(
        '[AdminConsole] backfill: failed to load brands:',
        err?.message,
      );
      return {
        success: false,
        brands_processed: 0,
        total_links_created: 0,
        error: err?.message || 'Failed to load brands',
        details: [],
      };
    }

    let totalCreated = 0;
    const results: Array<{
      brandId: string;
      brandName: string;
      created: number;
      error?: string;
    }> = [];

    for (const b of brands) {
      try {
        const created = await this.autoCreateBrandLinks(b.id, {
          explicitLinks: null,
        });
        totalCreated += created;
        results.push({ brandId: b.id, brandName: b.name, created });
      } catch (err: any) {
        console.error(
          `[AdminConsole] backfill: failed for brand ${b.id} (${b.name}):`,
          err?.message,
        );
        results.push({
          brandId: b.id,
          brandName: b.name,
          created: 0,
          error: err?.message || 'unknown error',
        });
      }
    }

    return {
      success: true,
      brands_processed: brands.length,
      total_links_created: totalCreated,
      details: results,
    };
  }

  /**
   * Backfill links for one specific brand (e.g. after adding a new challenge).
   */
  async regenerateBrandLinks(brandId: string) {
    const created = await this.autoCreateBrandLinks(brandId, {
      explicitLinks: null,
    });
    return { success: true, links_created: created };
  }

  async resetBrandPassword(id: string) {
    const bcrypt = await import('bcrypt');
    const plaintextPassword = this.generateBrandPassword();
    const passwordHash = await bcrypt.hash(plaintextPassword, 10);
    const updated = await this.db.brand.update({
      where: { id },
      data: { passwordHash },
    });
    return {
      brand: this.mapBrand(updated),
      generated_password: plaintextPassword,
    };
  }

  private generateBrandPassword() {
    // 12 chars, upper + lower + digits — enough entropy and easy to type
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 12; i++) {
      out += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return out;
  }

  async updateBrand(id: string, data: any) {
    const updateData: any = {};
    const fieldMap: Record<string, string> = {
      name: 'name',
      slug: 'slug',
      logo_url: 'logoUrl',
      website: 'website',
      primary_color: 'primaryColor',
      secondary_color: 'secondaryColor',
      description: 'description',
      status: 'status',
      approval_status: 'approvalStatus',
      commission_rate: 'commissionRate',
      reseller_commission: 'resellerCommission',
      email: 'email',
      username: 'username',
      settlement_method: 'settlementMethod',
      settlement_crypto_wallet: 'settlementCryptoWallet',
      settlement_bank_holder: 'settlementBankHolder',
      settlement_bank_iban: 'settlementBankIban',
      settlement_bank_swift: 'settlementBankSwift',
      settlement_bank_name: 'settlementBankName',
      settlement_bank_address: 'settlementBankAddress',
    };
    for (const [src, dest] of Object.entries(fieldMap)) {
      if (data[src] !== undefined) updateData[dest] = data[src];
    }
    const updated = await this.db.brand.update({
      where: { id },
      data: updateData,
    });
    return { brand: this.mapBrand(updated) };
  }

  async deleteBrand(id: string) {
    await this.db.brand.delete({ where: { id } });
    return { success: true };
  }

  async bulkDeleteBrands(ids: string[]) {
    if (!ids?.length) return { success: true, deleted: 0 };
    const r = await this.db.brand.deleteMany({ where: { id: { in: ids } } });
    return { success: true, deleted: r.count };
  }

  async listPendingBrands(params: { page?: number; pageSize?: number }) {
    return this.listBrands({ ...params, status: 'pending' });
  }

  async approveBrand(id: string) {
    const updated = await this.db.brand.update({
      where: { id },
      data: { approvalStatus: 'active', status: 'active' },
    });
    return { brand: this.mapBrand(updated) };
  }

  async rejectBrand(id: string, reason?: string) {
    const updated = await this.db.brand.update({
      where: { id },
      data: { approvalStatus: 'rejected', status: 'inactive' },
    });
    return { brand: this.mapBrand(updated), reason };
  }

  async getBrandDashboard(id: string) {
    const brand = await this.db.brand.findUnique({ where: { id } });
    return {
      brand: brand ? this.mapBrand(brand) : null,
      totals: {
        revenue: 0,
        orders: 0,
        commissions: 0,
        pending_payout: 0,
      },
      recent_orders: [],
    };
  }

  /* ---------- Visits ---------- */

  async listVisits(params: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(params.limit) || 100));
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.db.visit.findMany({
        skip,
        take: limit,
        orderBy: { lastVisitAt: 'desc' },
      }),
      this.db.visit.count(),
    ]);

    return {
      visits: data.map((v: any) => ({
        id: String(v.id),
        ip: v.ip,
        visits_count: v.visitsCount,
        demo_tries: v.demoTries,
        first_visit_at: v.firstVisitAt,
        last_visit_at: v.lastVisitAt,
        country: v.country,
        country_code: v.countryCode,
        region: v.region,
        city: v.city,
        timezone: v.timezone,
        isp: v.isp,
        user_agent: v.userAgent,
        is_vpn: v.isVpn,
        is_proxy: v.isProxy,
      })),
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async visitsStats() {
    const total = await this.db.visit.count();
    const unique = total; // ip is unique per row
    const byCountry = await this.db.visit.groupBy({
      by: ['countryCode'],
      _count: true,
      orderBy: { _count: { countryCode: 'desc' } },
      take: 20,
    });
    return {
      total,
      unique,
      by_country: byCountry.map((b: any) => ({
        country_code: b.countryCode,
        count: b._count,
      })),
      by_day: [],
    };
  }

  /* ---------- IP whitelist ---------- */

  async listIpWhitelist() {
    const ips = await this.db.ipWhitelist.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return {
      ips: ips.map((i: any) => ({
        id: String(i.id),
        ip: i.ipAddress,
        ip_address: i.ipAddress,
        label: i.label,
        created_at: i.createdAt,
      })),
    };
  }

  async addIpWhitelist(body: { ip: string; label?: string }) {
    if (!body.ip) throw new Error('ip required');
    const ip = await this.db.ipWhitelist.create({
      data: { ipAddress: body.ip, label: body.label ?? null },
    });
    return {
      ip: {
        id: String(ip.id),
        ip: ip.ipAddress,
        ip_address: ip.ipAddress,
        label: ip.label,
        created_at: ip.createdAt,
      },
    };
  }

  async deleteIpWhitelist(id: string) {
    await this.db.ipWhitelist.delete({ where: { id: BigInt(id) } });
    return { success: true };
  }

  async getIpWhitelistSettings() {
    let settings = await this.db.ipWhitelistSettings.findUnique({
      where: { id: 1 },
    });
    if (!settings) {
      settings = await this.db.ipWhitelistSettings.upsert({
        where: { id: 1 },
        create: { id: 1 },
        update: {},
      });
    }
    return {
      enabled: settings.enabled,
      vpn_block_enabled: settings.vpnBlockEnabled,
      vpn_whitelist_exemption: settings.vpnWhitelistExemption,
      updated_at: settings.updatedAt,
    };
  }

  async updateIpWhitelistSettings(body: any) {
    const data: any = {};
    if (body.enabled !== undefined) data.enabled = !!body.enabled;
    if (body.vpn_block_enabled !== undefined)
      data.vpnBlockEnabled = !!body.vpn_block_enabled;
    if (body.vpn_whitelist_exemption !== undefined)
      data.vpnWhitelistExemption = !!body.vpn_whitelist_exemption;
    const updated = await this.db.ipWhitelistSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...data },
      update: data,
    });
    return {
      enabled: updated.enabled,
      vpn_block_enabled: updated.vpnBlockEnabled,
      vpn_whitelist_exemption: updated.vpnWhitelistExemption,
    };
  }

  /* ---------- Blocked IPs ---------- */

  private mapBlockedIp(b: any) {
    return {
      id: String(b.id),
      ip: b.ip,
      reason: b.reason,
      attempts_count: b.attemptsCount,
      first_attempt_at: b.firstAttemptAt,
      last_attempt_at: b.lastAttemptAt,
      blocked_at: b.blockedAt,
      unblocked_at: b.unblockedAt,
      status: b.status,
    };
  }

  async listBlockedIps(params: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.status && params.status !== 'all') where.status = params.status;

    const [data, total] = await Promise.all([
      this.db.blockedIp.findMany({
        where,
        skip,
        take: limit,
        orderBy: { blockedAt: 'desc' },
      }),
      this.db.blockedIp.count({ where }),
    ]);
    return {
      ips: data.map((b: any) => this.mapBlockedIp(b)),
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    };
  }

  async getBlockedIp(ip: string) {
    const b = await this.db.blockedIp.findUnique({ where: { ip } });
    if (!b) return { ip: null };
    return { ip: this.mapBlockedIp(b) };
  }

  async getBlockedIpAttempts(ip: string) {
    const b = await this.db.blockedIp.findUnique({
      where: { ip },
      include: { attempts: { orderBy: { attemptedAt: 'desc' }, take: 100 } },
    });
    if (!b) return { attempts: [] };
    return {
      attempts: (b.attempts || []).map((a: any) => ({
        id: String(a.id),
        ip: a.ip,
        endpoint: a.endpoint,
        user_agent: a.userAgent,
        attempted_at: a.attemptedAt,
      })),
    };
  }

  async updateBlockedIp(ip: string, action?: string) {
    const data: any = {};
    if (action === 'unblock') {
      data.status = 'unblocked';
      data.unblockedAt = new Date();
    } else if (action === 'block') {
      data.status = 'blocked';
      data.unblockedAt = null;
    }
    const updated = await this.db.blockedIp.update({ where: { ip }, data });
    return { ip: this.mapBlockedIp(updated) };
  }

  /* ---------- Currencies (admin) ---------- */

  async listCurrencies() {
    const data = await this.db.adminCurrency.findMany({
      orderBy: [{ isBase: 'desc' }, { code: 'asc' }],
    });
    return {
      currencies: data.map((c: any) => ({
        code: c.code,
        symbol: c.symbol,
        name: c.name,
        is_base: c.isBase,
        active: c.active,
        exchange_rate: c.exchangeRate,
        last_synced: c.lastSynced,
      })),
      conversion_fee: 0,
    };
  }

  async updateCurrency(code: string, data: any) {
    const updateData: any = {};
    if (data.symbol !== undefined) updateData.symbol = data.symbol;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.active !== undefined) updateData.active = !!data.active;
    if (data.exchange_rate !== undefined)
      updateData.exchangeRate = Number(data.exchange_rate);
    if (data.is_base !== undefined) updateData.isBase = !!data.is_base;
    const updated = await this.db.adminCurrency.update({
      where: { code },
      data: updateData,
    });
    return { success: true, currency: updated };
  }

  async deleteCurrency(code: string) {
    await this.db.adminCurrency.delete({ where: { code } });
    return { success: true };
  }

  /* ---------- Currency Geo Mappings ---------- */

  async listCurrencyGeoMappings() {
    const data = await this.db.currencyGeoMapping.findMany();
    return {
      mappings: data.map((m: any) => ({
        country_code: m.countryCode,
        currency_code: m.currencyCode,
      })),
    };
  }

  async createCurrencyGeoMapping(body: {
    country_code: string;
    currency_code: string;
  }) {
    const m = await this.db.currencyGeoMapping.upsert({
      where: { countryCode: body.country_code },
      create: {
        countryCode: body.country_code,
        currencyCode: body.currency_code,
      },
      update: { currencyCode: body.currency_code },
    });
    return {
      mapping: { country_code: m.countryCode, currency_code: m.currencyCode },
    };
  }

  async updateCurrencyGeoMapping(
    countryCode: string,
    body: { currency_code: string },
  ) {
    const m = await this.db.currencyGeoMapping.update({
      where: { countryCode },
      data: { currencyCode: body.currency_code },
    });
    return {
      mapping: { country_code: m.countryCode, currency_code: m.currencyCode },
    };
  }

  async deleteCurrencyGeoMapping(countryCode: string) {
    await this.db.currencyGeoMapping.delete({ where: { countryCode } });
    return { success: true };
  }

  /* ---------- Payment Gateway Mappings ---------- */

  async listPaymentGatewayMappings() {
    const data = await this.db.paymentGatewayMapping.findMany();
    return {
      mappings: data.map((m: any) => ({
        country_code: m.countryCode,
        gateway: m.gateway,
      })),
    };
  }

  async createPaymentGatewayMapping(body: {
    country_code: string;
    gateway: string;
  }) {
    const m = await this.db.paymentGatewayMapping.upsert({
      where: { countryCode: body.country_code },
      create: { countryCode: body.country_code, gateway: body.gateway },
      update: { gateway: body.gateway },
    });
    return { mapping: { country_code: m.countryCode, gateway: m.gateway } };
  }

  async updatePaymentGatewayMapping(
    countryCode: string,
    body: { gateway: string },
  ) {
    const m = await this.db.paymentGatewayMapping.update({
      where: { countryCode },
      data: { gateway: body.gateway },
    });
    return { mapping: { country_code: m.countryCode, gateway: m.gateway } };
  }

  async deletePaymentGatewayMapping(countryCode: string) {
    await this.db.paymentGatewayMapping.delete({ where: { countryCode } });
    return { success: true };
  }

  async bulkPaymentGatewayMappings(
    mappings: Array<{ country_code: string; gateway: string }>,
  ) {
    if (!mappings?.length) return { success: true, count: 0 };
    let count = 0;
    for (const m of mappings) {
      await this.db.paymentGatewayMapping.upsert({
        where: { countryCode: m.country_code },
        create: { countryCode: m.country_code, gateway: m.gateway },
        update: { gateway: m.gateway },
      });
      count++;
    }
    return { success: true, count };
  }

  /* ---------- Direct Purchase Links ---------- */

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
    const meta = l.metadata && typeof l.metadata === 'object' ? l.metadata : {};
    const baseUrl = this.getPublicSiteUrl();

    if (meta.custom_url) {
      return this.attachLinkSlugToUrl(meta.custom_url, l.slug);
    }

    const params = new URLSearchParams();
    if (l.brand?.slug) params.set('brand', l.brand.slug);
    if (l.slug) params.set('link', l.slug);

    if (l.challenge) {
      const type = l.challenge.challengeType ?? 'one_phase';
      const size = this.formatAccountSize(l.challenge.accountSize);
      params.set('type', type);
      if (size) params.set('size', size);
      // If the link overrides the challenge's default price (custom-amount
      // brand link), forward it so the order summary on /checkout and the
      // total on /pay/<slug> show what the customer will actually be
      // charged. The backend still enforces the link amount at charge time.
      const linkAmount = Number(l.amount ?? 0);
      const challengePrice = Number(l.challenge.price ?? 0);
      if (linkAmount > 0 && linkAmount !== challengePrice) {
        params.set('customPrice', String(linkAmount));
      }
      // Pinned-platform links skip the platform-picker step at /checkout.
      // The page reads this param and auto-advances to the billing form.
      if (l.platform) params.set('platform', String(l.platform));
      return `${baseUrl}/checkout?${params.toString()}`;
    }

    const qs = params.toString();
    return `${baseUrl}/Challenges${qs ? '?' + qs : ''}`;
  }

  private attachLinkSlugToUrl(
    rawUrl: string,
    slug: string | null | undefined,
  ): string {
    if (!slug) return rawUrl;
    try {
      const isAbsolute = /^https?:\/\//i.test(rawUrl);
      const u = new URL(rawUrl, this.getPublicSiteUrl());
      if (!u.searchParams.has('link')) u.searchParams.set('link', slug);
      return isAbsolute ? u.toString() : `${u.pathname}${u.search}${u.hash}`;
    } catch {
      const sep = rawUrl.includes('?') ? '&' : '?';
      return /[?&]link=/.test(rawUrl)
        ? rawUrl
        : `${rawUrl}${sep}link=${encodeURIComponent(slug)}`;
    }
  }

  private mapDirectPurchaseLink(l: any) {
    const total = Number(l.amount ?? 0);
    const conversionRate = l.clicks > 0 ? (l.conversions / l.clicks) * 100 : 0;
    const meta = l.metadata && typeof l.metadata === 'object' ? l.metadata : {};
    const isMainLink = meta?.is_main_link === true;
    const customUrl = meta?.custom_url ?? null;
    const destinationUrl = this.buildDestinationUrl(l);

    return {
      id: l.id,
      link_id: l.slug,
      slug: l.slug,
      name: l.name ?? l.slug,
      brand_id: l.brandId,
      brand_name: l.brand?.name ?? null,
      challenge_id: l.challengeId,
      package_id: l.challengeId ?? null,
      is_main_link: isMainLink,
      destination_url: destinationUrl,
      custom_url: customUrl,
      total_amount: total,
      package_price: total,
      credits_price: 0,
      credits_amount: 0,
      currency: l.currency,
      provider: l.provider ?? null,
      // Pinned trading platform (MT5 / MT4 / etc.) — null means "ask the
      // customer at checkout".
      platform: l.platform ?? null,
      metadata: l.metadata,
      is_active: l.active,
      visits_count: l.clicks,
      transactions_count: l.conversions,
      conversion_rate: conversionRate,
      created_at: l.createdAt,
      updated_at: l.updatedAt,
    };
  }

  async listDirectPurchaseLinks(params: {
    page?: number;
    limit?: number;
    brandId?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;
    const where: any = {};
    if (params.brandId) where.brandId = params.brandId;

    // Defensive: if the running NestJS dev server still holds an old Prisma
    // client (e.g. before the DirectPurchaseLink ↔ Challenge relation was
    // added), the include() call throws and the whole endpoint 500s. We try
    // the rich query first; if it fails, fall back to a plain query (no
    // include) so the admin page still renders.
    let data: any[] = [];
    let total = 0;
    try {
      [data, total] = await Promise.all([
        this.db.directPurchaseLink.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            brand: { select: { id: true, name: true, slug: true } },
            challenge: {
              select: {
                id: true,
                slug: true,
                name: true,
                challengeType: true,
                accountSize: true,
                price: true,
              },
            },
          },
        }),
        this.db.directPurchaseLink.count({ where }),
      ]);
    } catch (err: any) {
      console.error(
        '[AdminConsole] listDirectPurchaseLinks rich query failed, falling back:',
        err?.message,
      );
      try {
        [data, total] = await Promise.all([
          this.db.directPurchaseLink.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          }),
          this.db.directPurchaseLink.count({ where }),
        ]);
      } catch (err2: any) {
        console.error(
          '[AdminConsole] listDirectPurchaseLinks fallback query failed:',
          err2?.message,
        );
        data = [];
        total = 0;
      }
    }

    return {
      links: data.map((l: any) => this.mapDirectPurchaseLink(l)),
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    };
  }

  async listDirectPurchaseLinksByBrand(brandId: string) {
    const data = await this.db.directPurchaseLink.findMany({
      where: { brandId },
      orderBy: { createdAt: 'desc' },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        challenge: {
          select: {
            id: true,
            slug: true,
            name: true,
            challengeType: true,
            accountSize: true,
            price: true,
          },
        },
      },
    });
    return { links: data.map((l: any) => this.mapDirectPurchaseLink(l)) };
  }

  // Whitelist provider input — admins can only set a known gateway code,
  // or null/empty to clear the override and fall back to the 50/50 router.
  private normalizeProviderInput(raw: any): string | null | undefined {
    if (raw === undefined) return undefined;
    if (raw === null || raw === '') return null;
    const s = String(raw).trim().toUpperCase();
    if (s === 'XOALA') return 'XOALA';
    if (s === 'WORLDCARD' || s === 'WORLD-CARD' || s === 'WC')
      return 'WORLDCARD';
    return null;
  }

  private normalizeLinkPlatformInput(input: any): string | null {
    if (input === undefined || input === null || input === '') return null;
    const v = String(input).trim().toUpperCase();
    const allowed = ['MT5', 'MT4', 'BYBIT', 'PT5', 'TRADELOCKER'];
    return allowed.includes(v) ? v : null;
  }

  async findClosestChallengeForAmount(amount: number): Promise<any> {
    if (!Number.isFinite(amount) || amount <= 0) return null;
    const challenges = await this.db.challenge.findMany({
      where: { isActive: true },
      select: { id: true, price: true, challengeType: true, accountSize: true },
    });
    if (challenges.length === 0) return null;
    const scored = challenges.map((c: any) => ({
      c,
      diff: Math.abs(Number(c.price ?? 0) - amount),
      typeRank: c.challengeType === 'one_phase' ? 0 : 1,
      size: Number(c.accountSize ?? 0),
    }));
    scored.sort((a: any, b: any) =>
      a.diff !== b.diff
        ? a.diff - b.diff
        : a.typeRank !== b.typeRank
          ? a.typeRank - b.typeRank
          : a.size - b.size,
    );
    return scored[0].c;
  }

  async createDirectPurchaseLink(body: any) {
    if (!body?.brand_id) {
      throw new Error('brand_id is required');
    }

    const brand = await this.db.brand.findUnique({
      where: { id: body.brand_id },
    });
    if (!brand) throw new Error('Brand not found');

    let challengeId: string | null = null;
    let amount: number | null =
      body.amount != null && body.amount !== '' ? Number(body.amount) : null;

    if (body.challenge_id) {
      const ch = await this.db.challenge.findUnique({
        where: { id: body.challenge_id },
      });
      if (!ch) throw new Error('Challenge not found');
      challengeId = ch.id;
      if (amount == null) amount = ch.price ?? null;
    }

    const customUrl =
      typeof body.custom_url === 'string' && body.custom_url.trim()
        ? body.custom_url.trim()
        : null;

    if (!challengeId && !customUrl && amount && amount > 0) {
      const matched = await this.findClosestChallengeForAmount(amount);
      if (matched) challengeId = matched.id;
    }

    const metadata: any = {};
    if (customUrl) metadata.custom_url = customUrl;
    if (body.is_main_link === true) {
      metadata.is_main_link = true;
    }

    const providerInput = this.normalizeProviderInput(body.provider);
    const platformInput = this.normalizeLinkPlatformInput(body.platform);

    const link = await this.db.directPurchaseLink.create({
      data: {
        slug: body.slug || this.randomLinkSlug(),
        name: body.name?.trim() || null,
        brandId: brand.id,
        challengeId,
        amount,
        currency: body.currency || 'USD',
        ...(providerInput !== undefined ? { provider: providerInput } : {}),
        // Admin-pinned trading platform. When set, the customer skips the
        // platform-selection step at checkout and lands straight on the
        // billing form with this platform locked in.
        ...(platformInput !== null ? { platform: platformInput } : {}),
        metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
        active: body.active !== false,
      },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        challenge: {
          select: {
            id: true,
            slug: true,
            name: true,
            challengeType: true,
            accountSize: true,
            price: true,
          },
        },
      },
    });

    return { link: this.mapDirectPurchaseLink(link) };
  }

  async updateDirectPurchaseLink(id: string, body: any) {
    const existing = await this.db.directPurchaseLink.findUnique({
      where: { id },
    });
    if (!existing) throw new Error('Link not found');

    const data: any = {};
    if (body.name !== undefined) data.name = body.name?.trim() || null;
    if (body.amount !== undefined) {
      data.amount =
        body.amount === '' || body.amount == null ? null : Number(body.amount);
    }
    if (body.currency !== undefined) data.currency = body.currency || 'USD';
    if (body.active !== undefined) data.active = !!body.active;
    if (body.challenge_id !== undefined) {
      data.challengeId = body.challenge_id || null;
    }
    if (body.provider !== undefined) {
      data.provider = this.normalizeProviderInput(body.provider);
    }
    if (body.platform !== undefined) {
      // Empty string from the modal → null (clears the lock and restores the
      // legacy "let the customer pick" behaviour).
      data.platform = this.normalizeLinkPlatformInput(body.platform);
    }

    if (body.custom_url !== undefined) {
      const meta: any =
        existing.metadata && typeof existing.metadata === 'object'
          ? { ...existing.metadata }
          : {};
      const url =
        typeof body.custom_url === 'string' && body.custom_url.trim()
          ? body.custom_url.trim()
          : null;
      if (url) meta.custom_url = url;
      else delete meta.custom_url;
      data.metadata = Object.keys(meta).length > 0 ? meta : null;
    }

    const updated = await this.db.directPurchaseLink.update({
      where: { id },
      data,
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        challenge: {
          select: {
            id: true,
            slug: true,
            name: true,
            challengeType: true,
            accountSize: true,
            price: true,
          },
        },
      },
    });

    return { link: this.mapDirectPurchaseLink(updated) };
  }

  async deleteDirectPurchaseLink(id: string) {
    const existing = await this.db.directPurchaseLink.findUnique({
      where: { id },
    });
    if (!existing) throw new Error('Link not found');
    await this.db.directPurchaseLink.delete({ where: { id } });
    return { success: true };
  }

  /* ─────────────────────────────────────────────────────────────────────
   *  QuickLink — admin-assisted one-shot payment URLs
   *
   *  Admin enters EVERY field the gateway requires:
   *    brand_id, challenge_id, amount, currency, provider, platform,
   *    customer's first_name + last_name + email + phone + country +
   *    state + city + address + postal_code.
   *
   *  The customer-facing /q/<slug> page only collects card data; the
   *  service merges in the link's stored billing snapshot to build the
   *  Xoala SALE call, so the gateway never rejects on missing address.
   *  After the first successful charge the link auto-deactivates.
   *  ───────────────────────────────────────────────────────────────────── */

  private mapQuickLink(l: any) {
    const baseUrl = this.getPublicSiteUrl();
    const url = l.slug ? `${baseUrl}/q/${l.slug}` : null;
    const conversionRate = l.clicks > 0 ? (l.conversions / l.clicks) * 100 : 0;
    return {
      id: l.id,
      slug: l.slug,
      link_id: l.slug,
      name: l.name ?? null,
      brand_id: l.brandId ?? null,
      brand_name: l.brand?.name ?? null,
      challenge_id: l.challengeId ?? null,
      challenge_name: l.challenge?.name ?? null,
      amount: Number(l.amount ?? 0),
      currency: l.currency,
      provider: l.provider ?? null,
      platform: l.platform ?? null,
      // Customer snapshot — visible only to admins, never to the page.
      customer_email: l.customerEmail,
      customer_first_name: l.customerFirstName,
      customer_last_name: l.customerLastName,
      customer_phone: l.customerPhone ?? null,
      customer_country: l.customerCountry,
      customer_state: l.customerState ?? null,
      customer_city: l.customerCity,
      customer_address: l.customerAddress,
      customer_postal_code: l.customerPostalCode,
      is_active: l.active,
      destination_url: url,
      visits_count: l.clicks,
      transactions_count: l.conversions,
      conversion_rate: conversionRate,
      created_at: l.createdAt,
      updated_at: l.updatedAt,
    };
  }

  // Required-field guard for QuickLink create. The admin may choose an
  // existing challenge, or CUSTOM with a manual amount that we map to the
  // closest active challenge for provisioning after payment.
  private validateQuickLinkBody(body: any) {
    // Admin-supplied identity + commerce. Name + city + address + postal
    // are collected from the customer on the /q/<slug> page, so they're
    // NOT required here.
    const required: Array<[string, any]> = [
      ['brand_id', body.brand_id],
      ['customer_email', body.customer_email],
      ['customer_country', body.customer_country],
    ];
    const missing = required
      .filter(([, v]) => v == null || String(v).trim() === '')
      .map(([k]) => k);
    if (missing.length > 0) {
      throw new Error(`Missing required field(s): ${missing.join(', ')}`);
    }
    const email = String(body.customer_email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid customer_email');
    }
    return email;
  }

  async createQuickLink(body: any) {
    const customerEmail = this.validateQuickLinkBody(body);

    const brand = await this.db.brand.findUnique({
      where: { id: body.brand_id },
    });
    if (!brand) throw new Error('Brand not found');

    let challenge: any = null;
    const amount =
      body.amount != null && body.amount !== '' ? Number(body.amount) : null;
    if (amount != null && (!Number.isFinite(amount) || amount <= 0)) {
      throw new Error('Amount must be greater than 0');
    }

    if (body.challenge_id) {
      challenge = await this.db.challenge.findUnique({
        where: { id: body.challenge_id },
      });
      if (!challenge) throw new Error('Challenge not found');
    } else {
      if (amount == null) {
        throw new Error('Amount is required for CUSTOM quick links');
      }
      challenge = await this.findClosestChallengeForAmount(amount);
      if (!challenge) {
        throw new Error(
          'No active challenges available for CUSTOM quick links',
        );
      }
    }

    const providerInput = this.normalizeProviderInput(body.provider);
    const platformInput = this.normalizeLinkPlatformInput(body.platform);

    // Find-or-create the customer's User row up front so the eventual
    // Payment is bound to the same trader if they ever sign up later.
    const customerUserId = await this.resolveQuickLinkUser(customerEmail);

    const link = await this.db.quickLink.create({
      data: {
        slug: this.quickLinkSlug(),
        name: body.name?.trim() || null,
        brandId: brand.id,
        challengeId: challenge.id,
        amount: amount ?? challenge.price ?? 0,
        currency: (body.currency || challenge.currency || 'EUR').toUpperCase(),
        ...(providerInput !== undefined ? { provider: providerInput } : {}),
        ...(platformInput !== null ? { platform: platformInput } : {}),
        customerUserId,
        customerEmail,
        customerPhone: body.customer_phone?.trim() || null,
        customerCountry: String(body.customer_country).trim().toUpperCase(),
        // First/last name, city, state, address, postal — the customer
        // enters these on the /q/<slug> page, so we leave them null on
        // the link itself.
        active: body.active !== false,
      },
      include: {
        brand: { select: { id: true, name: true, slug: true } },
        challenge: {
          select: {
            id: true,
            slug: true,
            name: true,
            challengeType: true,
            accountSize: true,
            price: true,
          },
        },
      },
    });
    return { link: this.mapQuickLink(link) };
  }

  async listQuickLinks(params: { page?: number; limit?: number }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.db.quickLink.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          brand: { select: { id: true, name: true, slug: true } },
          challenge: {
            select: {
              id: true,
              slug: true,
              name: true,
              challengeType: true,
              accountSize: true,
              price: true,
            },
          },
        },
      }),
      this.db.quickLink.count(),
    ]);
    return {
      links: data.map((l: any) => this.mapQuickLink(l)),
      meta: { total, page, pages: Math.ceil(total / limit) },
    };
  }

  async deleteQuickLink(id: string) {
    const existing = await this.db.quickLink.findUnique({ where: { id } });
    if (!existing) throw new Error('Link not found');
    await this.db.quickLink.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Active challenges, in a shape the Create-Link modal can render in a dropdown.
   */
  async listChallengesForLinks() {
    const challenges = await this.db.challenge.findMany({
      where: { isActive: true },
      select: {
        id: true,
        slug: true,
        name: true,
        challengeType: true,
        accountSize: true,
        price: true,
        currency: true,
      },
      orderBy: { price: 'asc' },
    });
    return {
      challenges: challenges.map((c: any) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        challenge_type: c.challengeType,
        account_size: c.accountSize,
        price: c.price,
        currency: c.currency,
      })),
    };
  }

  /* ---------- Brand Wallets ----------
   * Returns all brands with settlement info — the visionscope UI calls this
   * "Settlement Wallets". Partitioned client-side by account_type.
   */

  async listBrandWallets(params: { q?: string }) {
    const where: any = {};
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: 'insensitive' } },
        { email: { contains: params.q, mode: 'insensitive' } },
        { username: { contains: params.q, mode: 'insensitive' } },
      ];
    }

    const brands = await this.db.brand.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return {
      brandWallets: brands.map((b: any) => ({
        id: b.id,
        name: b.name,
        email: b.email,
        username: b.username,
        account_type: b.accountType,
        settlement_method: b.settlementMethod,
        settlement_crypto_wallet: b.settlementCryptoWallet,
        settlement_bank_holder: b.settlementBankHolder,
        settlement_bank_iban: b.settlementBankIban,
        settlement_bank_swift: b.settlementBankSwift,
        settlement_bank_name: b.settlementBankName,
        settlement_bank_address: b.settlementBankAddress,
      })),
    };
  }

  /* ---------- Brands Unpaid Transactions ----------
   * Joins succeeded Payment rows to their associated Brand and lists those that
   * haven't been paid out yet (brandPaidOut = false).
   */

  async listBrandsUnpaidTransactions(params: {
    page?: number;
    limit?: number;
    brandId?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(params.limit) || 100));
    const skip = (page - 1) * limit;

    const where: any = {
      brandId: params.brandId ?? { not: null },
      brandPaidOut: false,
      status: 'succeeded',
    };

    const [data, total, unpaidSum] = await Promise.all([
      this.db.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { include: { profile: true } },
          challenge: { select: { name: true } },
          brand: { select: { id: true, name: true, commissionRate: true } },
        },
      }),
      this.db.payment.count({ where }),
      this.db.payment.aggregate({
        _sum: { amount: true, brandCommission: true },
        where,
      }),
    ]);

    return {
      transactions: data.map((p: any) => ({
        id: p.id,
        date: p.createdAt,
        brand_id: p.brandId,
        brand_name: p.brand?.name ?? null,
        commission_rate: p.brand?.commissionRate ?? 0,
        amount: p.amount / 100,
        commission: (p.brandCommission ?? 0) / 100,
        currency: p.currency,
        status: p.status,
        provider: p.provider,
        customer_email: p.user?.email ?? null,
        package_name: p.challenge?.name ?? null,
      })),
      summary: {
        total,
        total_amount: (unpaidSum._sum.amount ?? 0) / 100,
        total_commission: (unpaidSum._sum.brandCommission ?? 0) / 100,
      },
      pagination: { total, page, totalPages: Math.ceil(total / limit) },
    };
  }

  /* ---------- System Tools ---------- */

  fixUsdAmounts() {
    return {
      success: true,
      updated: 0,
      message:
        'Prop-capitals uses single-currency USD pricing — nothing to fix.',
    };
  }

  /* ---------- Visit tracking (called by public middleware) ---------- */

  async trackVisit(input: {
    ip: string;
    country?: string;
    countryCode?: string;
    region?: string;
    regionName?: string;
    city?: string;
    timezone?: string;
    isp?: string;
    org?: string;
    asn?: string;
    userAgent?: string;
  }) {
    if (!input.ip) return;
    try {
      await this.db.visit.upsert({
        where: { ip: input.ip },
        create: {
          ip: input.ip,
          visitsCount: 1,
          country: input.country,
          countryCode: input.countryCode,
          region: input.region,
          regionName: input.regionName,
          city: input.city,
          timezone: input.timezone,
          isp: input.isp,
          org: input.org,
          asn: input.asn,
          userAgent: input.userAgent,
        },
        update: {
          visitsCount: { increment: 1 },
          lastVisitAt: new Date(),
          ...(input.userAgent ? { userAgent: input.userAgent } : {}),
        },
      });
    } catch (err) {
      // never block the request on tracking failure

      console.error('[admin-console] failed to track visit', err);
    }
  }

  /* ---------- Admin Logs (live: AdminLog) ---------- */

  async listAdminLogs(params: {
    page?: number;
    limit?: number;
    level?: string;
    category?: string;
    action?: string;
    userEmail?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.level) where.logLevel = params.level;
    if (params.category) where.category = params.category;
    if (params.action) where.action = params.action;
    if (params.userEmail)
      where.userEmail = { contains: params.userEmail, mode: 'insensitive' };
    if (params.search) {
      where.OR = [
        { message: { contains: params.search, mode: 'insensitive' } },
        { route: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) where.timestamp.gte = new Date(params.startDate);
      if (params.endDate) where.timestamp.lte = new Date(params.endDate);
    }

    const [data, total, stats] = await Promise.all([
      this.db.adminLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.db.adminLog.count({ where }),
      this.db.adminLog.groupBy({
        by: ['logLevel'],
        where,
        _count: true,
      }),
    ]);

    return {
      logs: data.map((l: any) => ({
        id: String(l.id),
        timestamp: l.timestamp,
        log_level: l.logLevel,
        category: l.category,
        action: l.action,
        message: l.message,
        details: l.details,
        user_id: l.userId,
        user_email: l.userEmail,
        request_id: l.requestId,
        http_method: l.httpMethod,
        route: l.route,
        request_body: l.requestBody,
        response_body: l.responseBody,
        response_status: l.responseStatus,
        response_time_ms: l.responseTimeMs,
        query_params: l.queryParams,
      })),
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
      statistics: stats.map((s: any) => ({
        level: s.logLevel,
        count: s._count,
      })),
    };
  }

  async adminLogsMeta() {
    const [categories, actions] = await Promise.all([
      this.db.adminLog.findMany({
        select: { category: true },
        distinct: ['category'],
        take: 100,
      }),
      this.db.adminLog.findMany({
        select: { action: true },
        distinct: ['action'],
        take: 200,
      }),
    ]);
    return {
      categories: categories.map((c: any) => c.category).filter(Boolean),
      actions: actions.map((a: any) => a.action).filter(Boolean),
      levels: ['INFO', 'WARN', 'ERROR', 'CRITICAL'],
    };
  }

  async criticalAdminLogs() {
    const data = await this.db.adminLog.findMany({
      where: { logLevel: 'CRITICAL' },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    return {
      criticalLogs: data.map((l: any) => ({
        id: String(l.id),
        timestamp: l.timestamp,
        action: l.action,
        message: l.message,
        category: l.category,
      })),
    };
  }

  async cleanupAdminLogs(daysToKeep: number) {
    const cutoff = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    const r = await this.db.adminLog.deleteMany({
      where: { timestamp: { lt: cutoff } },
    });
    return { deletedCount: r.count };
  }

  async writeAdminLog(entry: {
    logLevel: string;
    category: string;
    action: string;
    message?: string;
    userId?: string;
    userEmail?: string;
    httpMethod?: string;
    route?: string;
    responseStatus?: number;
    responseTimeMs?: number;
    requestBody?: any;
    queryParams?: any;
    details?: any;
  }) {
    try {
      await this.db.adminLog.create({ data: entry });
    } catch (err) {
      // never let logging break the request

      console.error('[admin-console] failed to write admin log', err);
    }
  }

  /* ---------- Bot Logs (live: BotLog) ---------- */

  async listBotLogs(params: {
    page?: number;
    limit?: number;
    level?: string;
    category?: string;
  }) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(500, Math.max(1, Number(params.limit) || 50));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.level) where.level = params.level;
    if (params.category) where.category = params.category;

    const [data, total] = await Promise.all([
      this.db.botLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
      }),
      this.db.botLog.count({ where }),
    ]);

    return {
      logs: data.map((l: any) => ({
        id: String(l.id),
        timestamp: l.timestamp,
        level: l.level,
        category: l.category,
        source: l.source,
        message: l.message,
        details: l.details,
      })),
      pagination: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async botLogsFilters() {
    const [categories, levels] = await Promise.all([
      this.db.botLog.findMany({
        select: { category: true },
        distinct: ['category'],
        take: 100,
      }),
      this.db.botLog.findMany({
        select: { level: true },
        distinct: ['level'],
        take: 20,
      }),
    ]);
    return {
      categories: categories.map((c: any) => c.category).filter(Boolean),
      levels: levels.map((l: any) => l.level).filter(Boolean),
    };
  }

  async deleteBotLog(id: string) {
    await this.db.botLog.delete({ where: { id: BigInt(id) } });
    return { success: true };
  }

  async bulkDeleteBotLogs(beforeDate?: string) {
    const where: any = {};
    if (beforeDate) where.timestamp = { lt: new Date(beforeDate) };
    const r = await this.db.botLog.deleteMany({ where });
    return { deleted_count: r.count };
  }
}
