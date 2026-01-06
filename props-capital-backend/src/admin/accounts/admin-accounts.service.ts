import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

import { TradingAccountStatus, TradingPhase, NotificationType, NotificationCategory } from '@prisma/client';

@Injectable()

export class AdminAccountsService {

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // List all trading accounts

  async getAll() {

    return this.prisma.tradingAccount.findMany({

      orderBy: { createdAt: 'desc' },

      include: {

        user: true,

        challenge: true,

        trades: true,

        violations: true,

      },

    });

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

      throw new Error('Invalid status');

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

      throw new Error('Invalid phase');

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

