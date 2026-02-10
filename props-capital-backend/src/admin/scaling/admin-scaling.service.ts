import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationCategory } from '@prisma/client';

@Injectable()
export class AdminScalingService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  getAllRequests() {
    return this.prisma.scalingRequest.findMany({
      orderBy: { requestedAt: 'desc' },
      include: {
        tradingAccount: {
          include: {
            user: true,
            challenge: true,
            payouts: true,
          },
        },
      },
    });
  }

  getRequestById(id: string) {
    return this.prisma.scalingRequest.findUnique({
      where: { id },
      include: {
        tradingAccount: {
          include: {
            user: true,
            challenge: true,
            payouts: true,
          },
        },
      },
    });
  }

  async approveRequest(id: string) {
    const request = await this.prisma.scalingRequest.findUnique({
      where: { id },
      include: {
        tradingAccount: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!request) throw new NotFoundException('Scaling request not found');

    // Mark request as approved (don't update balance yet - that happens on process)
    const updatedRequest = await this.prisma.scalingRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
      },
    });

    // Create notification for scaling approval
    if (request.tradingAccount?.user?.id) {
      const accountNumber =
        request.tradingAccount.brokerLogin ||
        request.tradingAccountId.substring(0, 8);
      const oldBalance = Number(request.oldBalance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      const newBalance = Number(request.newBalance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      await this.notificationsService.create(
        request.tradingAccount.user.id,
        'Account Scaling Approved',
        `Your scaling request for account #${accountNumber} has been approved. Account will be scaled from $${oldBalance} to $${newBalance}.`,
        NotificationType.SUCCESS,
        NotificationCategory.ACCOUNT,
      );
    }

    return updatedRequest;
  }

  async processRequest(id: string) {
    const request = await this.prisma.scalingRequest.findUnique({
      where: { id },
      include: {
        tradingAccount: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!request) throw new NotFoundException('Scaling request not found');

    if (request.status !== 'APPROVED') {
      throw new Error('Only approved requests can be processed');
    }

    // Update trading account balance
    await this.prisma.tradingAccount.update({
      where: { id: request.tradingAccountId },
      data: {
        balance: request.newBalance,
        initialBalance: request.newBalance,
      },
    });

    // Mark request as completed
    const updatedRequest = await this.prisma.scalingRequest.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Create notification for scaling completion
    if (request.tradingAccount?.user?.id) {
      const accountNumber =
        request.tradingAccount.brokerLogin ||
        request.tradingAccountId.substring(0, 8);
      const newBalance = Number(request.newBalance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      await this.notificationsService.create(
        request.tradingAccount.user.id,
        'Account Scaling Completed',
        `Your account #${accountNumber} has been successfully scaled to $${newBalance}. Happy trading!`,
        NotificationType.SUCCESS,
        NotificationCategory.ACCOUNT,
      );
    }

    return updatedRequest;
  }

  async rejectRequest(id: string, reason?: string) {
    const request = await this.prisma.scalingRequest.findUnique({
      where: { id },
      include: {
        tradingAccount: {
          include: {
            user: {
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!request) throw new NotFoundException('Scaling request not found');

    const updatedRequest = await this.prisma.scalingRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reason: reason || null,
        approvedAt: new Date(),
      },
    });

    // Create notification for scaling rejection
    if (request.tradingAccount?.user?.id) {
      const accountNumber =
        request.tradingAccount.brokerLogin ||
        request.tradingAccountId.substring(0, 8);
      const reasonText = reason
        ? ` Reason: ${reason}`
        : ' Please contact support for more information.';

      await this.notificationsService.create(
        request.tradingAccount.user.id,
        'Account Scaling Rejected',
        `Your scaling request for account #${accountNumber} has been rejected.${reasonText}`,
        NotificationType.WARNING,
        NotificationCategory.ACCOUNT,
      );
    }

    return updatedRequest;
  }
}
