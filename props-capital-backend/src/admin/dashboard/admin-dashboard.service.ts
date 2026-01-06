import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()

export class AdminDashboardService {

  constructor(private prisma: PrismaService) {}

  async getOverview() {

    const totalUsers = await this.prisma.user.count();

    // Calculate total revenue (sum of all succeeded payments)
    const totalRevenue = await this.prisma.payment.aggregate({

      _sum: { amount: true },

      where: { status: 'succeeded' },

    });

    // Calculate revenue for current month and last month (for percentage change)
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthRevenue = await this.prisma.payment.aggregate({

      _sum: { amount: true },

      where: { 
        status: 'succeeded',
        createdAt: { gte: currentMonthStart },
      },

    });

    const lastMonthRevenue = await this.prisma.payment.aggregate({

      _sum: { amount: true },

      where: { 
        status: 'succeeded',
        createdAt: { gte: lastMonthStart, lt: currentMonthStart },
      },

    });

    const revenueChangePercent = lastMonthRevenue._sum.amount && lastMonthRevenue._sum.amount > 0
      ? ((Number(currentMonthRevenue._sum.amount || 0) - Number(lastMonthRevenue._sum.amount)) / Number(lastMonthRevenue._sum.amount)) * 100
      : 0;

    // Count users for current month and last month (for percentage change)
    const currentMonthUsers = await this.prisma.user.count({

      where: { createdAt: { gte: currentMonthStart } },

    });

    const lastMonthUsers = await this.prisma.user.count({

      where: { 
        createdAt: { gte: lastMonthStart, lt: currentMonthStart },
      },

    });

    const usersChangePercent = lastMonthUsers > 0
      ? ((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100
      : 0;

    const activeAccounts = await this.prisma.tradingAccount.count({

      where: { status: 'ACTIVE' },

    });

    // Count funded accounts
    const fundedAccounts = await this.prisma.tradingAccount.count({

      where: { phase: 'FUNDED' },

    });

    // Sum of pending payout amounts (not count)
    const pendingPayoutsAmount = await this.prisma.payout.aggregate({

      _sum: { amount: true },

      where: { status: 'PENDING' },

    });

    // Count violations created today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const violationsToday = await this.prisma.violation.count({

      where: { createdAt: { gte: todayStart } },

    });

    return {

      totalUsers,

      totalRevenue: Number(totalRevenue._sum.amount || 0),

      revenueChangePercent: Math.round(revenueChangePercent * 10) / 10, // Round to 1 decimal

      usersChangePercent: Math.round(usersChangePercent * 10) / 10,

      activeAccounts,

      fundedAccounts,

      pendingPayoutsAmount: Number(pendingPayoutsAmount._sum.amount || 0),

      violationsToday,

    };

  }

  getRecentAccounts() {

    return this.prisma.tradingAccount.findMany({

      orderBy: { createdAt: 'desc' },

      take: 5,

      include: {

        user: true,

        challenge: true,

      },

    });

  }

  getRecentViolations() {

    return this.prisma.violation.findMany({

      orderBy: { createdAt: 'desc' },

      take: 10,

      include: {

        tradingAccount: {

          include: { user: true, challenge: true },

        },

      },

    });

  }

  async getRevenueChart() {

    // Get last 30 days of revenue and payouts data (daily aggregation)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Get all payments from last 30 days and group by date in memory (more reliable than raw SQL)
    const payments = await this.prisma.payment.findMany({

      where: {

        status: 'succeeded',

        createdAt: { gte: thirtyDaysAgo },

      },

      select: {

        amount: true,

        createdAt: true,

      },

    });

    // Get all payouts from last 30 days
    const payouts = await this.prisma.payout.findMany({

      where: {

        status: 'PAID',

        createdAt: { gte: thirtyDaysAgo },

      },

      select: {

        amount: true,

        createdAt: true,

      },

    });

    // Group by date
    const revenueMap = new Map<string, number>();
    payments.forEach((p) => {

      const dateKey = p.createdAt.toISOString().substring(0, 10);

      revenueMap.set(dateKey, (revenueMap.get(dateKey) || 0) + Number(p.amount));

    });

    const payoutMap = new Map<string, number>();
    payouts.forEach((p) => {

      const dateKey = p.createdAt.toISOString().substring(0, 10);

      payoutMap.set(dateKey, (payoutMap.get(dateKey) || 0) + Number(p.amount));

    });

    // Generate array for last 30 days with revenue and payouts
    const result: { date: string; revenue: number; payouts: number }[] = [];
    for (let i = 29; i >= 0; i--) {

      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const dateKey = date.toISOString().substring(0, 10);

      result.push({

        date: dateKey,

        revenue: revenueMap.get(dateKey) || 0,

        payouts: payoutMap.get(dateKey) || 0,

      });

    }

    return result;

  }

  async getRegistrationsChart() {

    const rows: any[] = await this.prisma.$queryRaw`

      SELECT 

        DATE_TRUNC('month', "createdAt") AS month,

        COUNT(*)::bigint AS total

      FROM "User"

      GROUP BY month

      ORDER BY month;

    `;

    return rows.map((r) => ({

      month: r.month,

      total: Number(r.total), // convert BigInt → number

    }));

  }

}

