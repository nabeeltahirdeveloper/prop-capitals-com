import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

import { TradingAccountStatus, TradingPhase, NotificationType, NotificationCategory } from '@prisma/client';

@Injectable()

export class AdminAccountsService {

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // List all trading accounts with pagination and filtering

  async getAll({ page, limit, search, status, phase }: { page: number; limit: number; search?: string; status?: string; phase?: string }) {
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { brokerLogin: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }
    if (status && status !== 'all') {
      where.status = status.toUpperCase() as TradingAccountStatus;
    }
    if (phase && phase !== 'all') {
      where.phase = phase.toUpperCase() as TradingPhase;
    }

    const isFundedView = phase === 'funded';

    const baseQueries: Promise<any>[] = [
      this.prisma.tradingAccount.findMany({
        skip,
        take: limit,
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, role: true } },
          challenge: true,
          _count: { select: { trades: true, violations: true } },
        },
      }),
      this.prisma.tradingAccount.count({ where }),
      this.prisma.tradingAccount.count({ where: { status: TradingAccountStatus.ACTIVE } }),
      this.prisma.tradingAccount.count({ where: { phase: TradingPhase.PHASE2 } }),
      this.prisma.tradingAccount.count({ where: { phase: TradingPhase.FUNDED } }),
      this.prisma.tradingAccount.count({ where: { phase: TradingPhase.FAILED } }),
    ];

    const [data, total, activeCount, phase2Count, fundedCount, failedCount] = await Promise.all(baseQueries);

    let fundedSummary: Record<string, number> = {};
    if (isFundedView) {
      const [activeFundedCount, balanceAgg, payoutAgg] = await Promise.all([
        this.prisma.tradingAccount.count({ where: { phase: TradingPhase.FUNDED, status: TradingAccountStatus.ACTIVE } }),
        this.prisma.tradingAccount.aggregate({ where: { phase: TradingPhase.FUNDED }, _sum: { initialBalance: true, balance: true } }),
        this.prisma.payout.aggregate({ where: { tradingAccount: { phase: TradingPhase.FUNDED }, status: 'PAID' as any }, _sum: { amount: true } }),
      ]);
      fundedSummary = {
        activeFunded: activeFundedCount,
        totalAllocatedCapital: balanceAgg._sum.initialBalance || 0,
        totalCurrentValue: balanceAgg._sum.balance || 0,
        totalPayouts: payoutAgg._sum.amount || 0,
      };
    }

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: { active: activeCount, phase2: phase2Count, funded: fundedCount, failed: failedCount, ...fundedSummary },
    };
  }

  // Get one account with details

  async getOne(id: string) {

    const account = await this.prisma.tradingAccount.findUnique({

      where: { id },

      include: {

        user: true,

        challenge: true,

        trades: true,

        violations: true,

        equityShots: true,

        phaseHistory: true,

      },

    });

    if (!account) throw new NotFoundException('Trading account not found');

    return account;

  }

  // Change account status

  async updateStatus(id: string, status: string) {

    if (!Object.values(TradingAccountStatus).includes(status as TradingAccountStatus)) {

      throw new BadRequestException('Invalid status');

    }

    // Get account before update to check previous status
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!account) throw new NotFoundException('Trading account not found');

    const previousStatus = account.status;
    const updatedAccount = await this.prisma.tradingAccount.update({

      where: { id },

      data: { status: status as TradingAccountStatus },

    });

    // Create notification for status changes
    if (account.userId && previousStatus !== status) {
      const accountNumber = account.brokerLogin || id.substring(0, 8);
      let title = '';
      let message = '';
      let notificationType: NotificationType = NotificationType.INFO;
      
      if (status === TradingAccountStatus.PAUSED) {
        title = 'Account Paused';
        message = `Your trading account #${accountNumber} has been paused. Trading is temporarily disabled.`;
        notificationType = NotificationType.WARNING;
      } else if (status === TradingAccountStatus.CLOSED) {
        title = 'Account Closed';
        message = `Your trading account #${accountNumber} has been closed.`;
        notificationType = NotificationType.INFO;
      } else if (status === TradingAccountStatus.ACTIVE && previousStatus === TradingAccountStatus.PAUSED) {
        title = 'Account Resumed';
        message = `Your trading account #${accountNumber} has been resumed. Trading is now active.`;
        notificationType = NotificationType.SUCCESS;
      }

      if (title && message) {
        await this.notificationsService.create(
          account.userId,
          title,
          message,
          notificationType,
          NotificationCategory.ACCOUNT,
        );
      }
    }

    return updatedAccount;

  }

  // Change account phase

  async updatePhase(id: string, phase: string) {

    if (!Object.values(TradingPhase).includes(phase as TradingPhase)) {

      throw new BadRequestException('Invalid phase');

    }

    // Get account before update
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
          },
        },
        challenge: {
          select: {
            accountSize: true,
          },
        },
      },
    });

    if (!account) throw new NotFoundException('Trading account not found');

    const previousPhase = account.phase;
    const updatedAccount = await this.prisma.tradingAccount.update({

      where: { id },

      data: { phase: phase as TradingPhase },

    });

    // Create notification for phase changes
    if (account.userId && previousPhase !== phase) {
      const accountNumber = account.brokerLogin || id.substring(0, 8);
      
      if (phase === TradingPhase.FUNDED && previousPhase !== TradingPhase.FUNDED) {
        // Phase 2 completion - Account is now funded
        await this.notificationsService.create(
          account.userId,
          'Phase 2 Completed!',
          `Congratulations! You have successfully completed Phase 2 of your $${account.challenge.accountSize.toLocaleString()} challenge. Your account is now funded!`,
          NotificationType.SUCCESS,
          NotificationCategory.CHALLENGE,
        );
      } else if (phase === TradingPhase.PHASE2 && previousPhase === TradingPhase.PHASE1) {
        // Phase 1 to Phase 2 transition (if done manually by admin)
        await this.notificationsService.create(
          account.userId,
          'Phase 1 Completed!',
          `Congratulations! You have successfully completed Phase 1 of your $${account.challenge.accountSize.toLocaleString()} challenge. Proceed to Phase 2 to continue.`,
          NotificationType.SUCCESS,
          NotificationCategory.CHALLENGE,
        );
      }
    }

    return updatedAccount;

  }

}

