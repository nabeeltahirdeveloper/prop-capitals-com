import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { PayoutStatus, TradingPhase } from '@prisma/client';

const MINIMUM_PAYOUT_AMOUNT = 50;

@Injectable()
export class PayoutsService {
  constructor(private prisma: PrismaService) {}

  async requestPayout(
    userId: string,
    tradingAccountId: string,
    paymentMethod?: string,
    paymentDetails?: string,
  ) {
    // Verify account exists
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: tradingAccountId },
      include: {
        trades: true,
        challenge: true,
        payouts: true,
      },
    });

    if (!account) throw new NotFoundException('Trading account not found');

    // Check ownership
    if (account.userId !== userId) {
      throw new ForbiddenException('You do not own this trading account');
    }

    // Verify account is in FUNDED phase
    if (account.phase !== TradingPhase.FUNDED) {
      throw new BadRequestException(
        'Payouts are only available for funded accounts',
      );
    }

    // Check for existing pending/approved payout
    const existingPendingPayout = account.payouts.find(
      (p) =>
        p.status === PayoutStatus.PENDING || p.status === PayoutStatus.APPROVED,
    );
    if (existingPendingPayout) {
      throw new BadRequestException(
        'You already have a pending payout request for this account',
      );
    }

    // Sum all profits from trades
    const totalProfit = account.trades.reduce(
      (sum, t) => sum + (t.profit || 0),
      0,
    );

    // Calculate previously paid/requested payout amounts
    const previousPayoutAmount = account.payouts
      .filter(
        (p) =>
          p.status === PayoutStatus.PAID ||
          p.status === PayoutStatus.PENDING ||
          p.status === PayoutStatus.APPROVED,
      )
      .reduce((sum, p) => sum + p.amount, 0);

    // Use challenge's profit split or default to 80%
    const profitSplit = account.challenge?.profitSplit || 80;

    // Calculate available profit (total profit minus already requested/paid amounts)
    const availableProfit = Math.max(0, totalProfit - previousPayoutAmount);

    // Apply payout split based on account tier
    const payoutAmount = Math.floor(availableProfit * (profitSplit / 100));

    // Validate minimum payout amount
    if (payoutAmount < MINIMUM_PAYOUT_AMOUNT) {
      throw new BadRequestException(
        `Minimum payout amount is $${MINIMUM_PAYOUT_AMOUNT}. Your available payout is $${payoutAmount}`,
      );
    }

    // Create payout record
    const data: any = {
      userId,
      tradingAccountId,
      amount: payoutAmount,
      status: PayoutStatus.PENDING,
    };

    if (paymentMethod) {
      data.paymentMethod = paymentMethod;
    }
    if (paymentDetails) {
      data.paymentDetails = paymentDetails;
    }

    return this.prisma.payout.create({ data });
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

  async getAvailablePayoutAmount(userId: string, tradingAccountId: string) {
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: tradingAccountId },
      include: {
        trades: true,
        challenge: true,
        payouts: true,
      },
    });

    if (!account) throw new NotFoundException('Trading account not found');

    if (account.userId !== userId) {
      throw new ForbiddenException('You do not own this trading account');
    }

    // Sum all profits from trades
    const totalProfit = account.trades.reduce(
      (sum, t) => sum + (t.profit || 0),
      0,
    );

    // Calculate previously paid/requested payout amounts
    const previousPayoutAmount = account.payouts
      .filter(
        (p) =>
          p.status === PayoutStatus.PAID ||
          p.status === PayoutStatus.PENDING ||
          p.status === PayoutStatus.APPROVED,
      )
      .reduce((sum, p) => sum + p.amount, 0);

    // Use challenge's profit split or default to 80%
    const profitSplit = account.challenge?.profitSplit || 80;

    // Calculate available profit
    const availableProfit = Math.max(0, totalProfit - previousPayoutAmount);

    // Apply payout split
    const availablePayoutAmount = Math.floor(
      availableProfit * (profitSplit / 100),
    );

    // Check for existing pending payout
    const hasPendingPayout = account.payouts.some(
      (p) =>
        p.status === PayoutStatus.PENDING || p.status === PayoutStatus.APPROVED,
    );

    return {
      totalProfit,
      previousPayoutAmount,
      availableProfit,
      profitSplit,
      availablePayoutAmount,
      minimumPayoutAmount: MINIMUM_PAYOUT_AMOUNT,
      canRequestPayout:
        availablePayoutAmount >= MINIMUM_PAYOUT_AMOUNT &&
        !hasPendingPayout &&
        account.phase === TradingPhase.FUNDED,
      hasPendingPayout,
      isFunded: account.phase === TradingPhase.FUNDED,
    };
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
    const paidPayouts = payouts.filter((p) => p.status === PayoutStatus.PAID);
    const pendingPayouts = payouts.filter(
      (p) =>
        p.status === PayoutStatus.PENDING || p.status === PayoutStatus.APPROVED,
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
        {
          id: 'bank_transfer',
          name: 'Bank Transfer',
          processingTime: '3-5 business days',
        },
        {
          id: 'crypto',
          name: 'Cryptocurrency',
          processingTime: '1-2 business days',
        },
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
