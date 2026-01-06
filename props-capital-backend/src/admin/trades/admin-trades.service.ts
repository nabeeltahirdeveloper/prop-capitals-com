import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()

export class AdminTradesService {

  constructor(private prisma: PrismaService) {}

  getAllTrades() {

    return this.prisma.trade.findMany({

      orderBy: { openedAt: 'desc' },

      include: {

        tradingAccount: {

          include: { user: true, challenge: true }

        }

      }

    });

  }

  getTradesByUser(userId: string) {

    return this.prisma.trade.findMany({

      where: { tradingAccount: { userId } },

      include: {

        tradingAccount: {

          include: { user: true, challenge: true }

        }

      },

      orderBy: { openedAt: 'desc' }

    });

  }

  getTradesByAccount(accountId: string) {

    return this.prisma.trade.findMany({

      where: { tradingAccountId: accountId },

      include: {

        tradingAccount: {

          include: { user: true, challenge: true }

        }

      },

      orderBy: { openedAt: 'desc' }

    });

  }

  getTradeById(tradeId: string) {

    return this.prisma.trade.findUnique({

      where: { id: tradeId },

      include: {

        tradingAccount: {

          include: { user: true, challenge: true }

        }

      }

    });

  }

}

