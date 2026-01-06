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

        equityShots: true,

        violations: true,

      },

    });

    return accounts.map((acc) => ({

      accountId: acc.id,

      userEmail: acc.user.email,

      challengeName: acc.challenge.name,

      balance: acc.balance,

      equity: acc.equity,

      phase: acc.phase,

      totalViolations: acc.violations.length,

      lastEquity: acc.equityShots.at(-1)?.equity || acc.equity,

      lastUpdated: acc.updatedAt,

    }));

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

  async getAllViolations() {

    return this.prisma.violation.findMany({

      orderBy: { createdAt: 'desc' },

      include: {

        tradingAccount: {

          include: {

            user: true,

            challenge: true,

          },

        },

      },

    });

  }

  async getViolation(id: string) {

    return this.prisma.violation.findUnique({

      where: { id },

      include: {

        tradingAccount: {

          include: {

            user: true,

            challenge: true,

          },

        },

      },

    });

  }

}

