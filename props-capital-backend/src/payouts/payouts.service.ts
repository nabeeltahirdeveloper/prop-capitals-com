import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { PayoutStatus } from '@prisma/client';

@Injectable()

export class PayoutsService {

  constructor(private prisma: PrismaService) {}

  async requestPayout(userId: string, tradingAccountId: string) {

    // Verify account exists

    const account = await this.prisma.tradingAccount.findUnique({

      where: { id: tradingAccountId },

      include: { trades: true },

    });

    if (!account) throw new NotFoundException('Trading account not found');

    // Check ownership

    if (account.userId !== userId) {

      throw new ForbiddenException('You do not own this trading account');

    }

    // Sum all profits

    const totalProfit = account.trades.reduce((sum, t) => sum + (t.profit || 0), 0);

    // Apply payout split (80%)

    const payoutAmount = Math.floor(totalProfit * 0.8);

    // Create payout record

    return this.prisma.payout.create({

      data: {

        userId,

        tradingAccountId,

        amount: payoutAmount,

        status: PayoutStatus.PENDING,

      },

    });

  }

  async getUserPayouts(userId: string, accountId?: string) {

    const where: any = { userId };
    
    if (accountId) {
      where.tradingAccountId = accountId;
    }

    return this.prisma.payout.findMany({

      where,

      orderBy: { createdAt: 'desc' },

      include: {
        tradingAccount: {
          select: {
            id: true,
            brokerLogin: true,
            challenge: {
              select: {
                platform: true,
              },
            },
          },
        },
      },

    });

  }

  async getPayoutStatistics(userId: string, accountId?: string) {

    const where: any = { userId };
    
    if (accountId) {
      where.tradingAccountId = accountId;
    }

    // Get all payouts for statistics
    const payouts = await this.prisma.payout.findMany({

      where,

      orderBy: { createdAt: 'desc' },

    });

    // Calculate statistics
    const paidPayouts = payouts.filter(p => p.status === PayoutStatus.PAID);
    const pendingPayouts = payouts.filter(p => 
      p.status === PayoutStatus.PENDING || p.status === PayoutStatus.APPROVED
    );

    const totalEarnings = paidPayouts.reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = pendingPayouts.reduce((sum, p) => sum + p.amount, 0);
    const totalPayoutsCount = paidPayouts.length;

    // Calculate next payout date (bi-weekly, next occurrence)
    const today = new Date();
    const dayOfMonth = today.getDate();
    // Bi-weekly means every 14 days, starting from a specific day
    // For simplicity, calculate next occurrence as 14 days from today, rounded to next bi-weekly interval
    const daysUntilNext = 14 - (dayOfMonth % 14);
    const nextPayoutDate = new Date(today);
    nextPayoutDate.setDate(today.getDate() + daysUntilNext);

    // Payout settings (can be moved to config/database later)
    const settings = {

      profitSplit: {
        base: 80,
        withScaling: 90,
      },

      frequency: 'bi-weekly',

      processingTime: '2-5 business days',

      minimumAmount: 50,

      fees: 'free',

      availablePaymentMethods: [
        { id: 'bank_transfer', name: 'Bank Transfer', processingTime: '3-5 business days' },
        { id: 'crypto', name: 'Cryptocurrency', processingTime: '1-2 business days' },
        { id: 'paypal', name: 'PayPal', processingTime: '1-3 business days' },
        { id: 'wise', name: 'Wise', processingTime: '2-4 business days' },
      ],

    };

    return {

      statistics: {

        totalEarnings,

        pendingPayouts: pendingAmount,

        totalPayoutsCount,

        nextPayoutDate: nextPayoutDate.toISOString(),

      },

      settings,

    };

  }

}
