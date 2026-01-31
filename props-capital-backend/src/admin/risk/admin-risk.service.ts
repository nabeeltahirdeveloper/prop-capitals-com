import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminRiskService {
  constructor(private prisma: PrismaService) {}

  async getRiskOverview() {
    const accounts = await this.prisma.tradingAccount.findMany({
      where: { status: 'ACTIVE' },

      include: {
        user: true,

        challenge: true,

        equityShots: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },

        violations: true,
      },
    });

    return accounts.map((acc) => {
      // Calculate daily drawdown percentage
      const todayStartEquity = acc.todayStartEquity || acc.initialBalance;
      const currentEquity = acc.equity || acc.balance;
      const dailyLoss = todayStartEquity - currentEquity;
      const dailyDrawdownPercent =
        todayStartEquity > 0
          ? Math.max(0, (dailyLoss / todayStartEquity) * 100)
          : 0;

      // Calculate overall drawdown percentage
      const maxEquity = acc.maxEquityToDate || acc.initialBalance;
      const overallLoss = maxEquity - currentEquity;
      const overallDrawdownPercent =
        maxEquity > 0 ? Math.max(0, (overallLoss / maxEquity) * 100) : 0;

      return {
        id: acc.id,
        account_number: acc.brokerLogin || acc.id.substring(0, 8),
        trader_id: acc.userId,
        trader_email: acc.user.email,
        challenge_name: acc.challenge.name,
        status: acc.status,
        platform: acc.platform || acc.challenge.platform,
        current_phase: acc.phase,
        initial_balance: acc.initialBalance,
        current_balance: acc.balance,
        current_equity: acc.equity,
        daily_drawdown_percent: Number(dailyDrawdownPercent.toFixed(2)),
        overall_drawdown_percent: Number(overallDrawdownPercent.toFixed(2)),
        daily_drawdown_limit: acc.challenge.dailyDrawdownPercent,
        overall_drawdown_limit: acc.challenge.overallDrawdownPercent,
        total_violations: acc.violations.length,
        last_updated: acc.updatedAt,
      };
    });
  }

  async getAccountRisk(accountId: string) {
    return this.prisma.tradingAccount.findUnique({
      where: { id: accountId },

      include: {
        user: true,

        challenge: true,

        equityShots: {
          orderBy: { timestamp: 'desc' },

          take: 30,
        },

        violations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getAllViolations(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [violations, total, fatalCount, todayCount] = await Promise.all([
      this.prisma.violation.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          tradingAccount: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                },
              },
              challenge: true,
            },
          },
        },
      }),
      this.prisma.violation.count(),
      this.prisma.violation.count({
        where: {
          type: { in: ['DAILY_DRAWDOWN', 'OVERALL_DRAWDOWN', 'CONSISTENCY'] },
        },
      }),
      this.prisma.violation.count({
        where: {
          createdAt: { gte: todayStart },
        },
      }),
    ]);

    return {
      data: violations,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      stats: {
        fatal: fatalCount,
        warnings: total - fatalCount,
        today: todayCount,
      },
    };
  }

  async getViolation(id: string) {
    return this.prisma.violation.findUnique({
      where: { id },

      include: {
        tradingAccount: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
            challenge: true,
          },
        },
      },
    });
  }
}
