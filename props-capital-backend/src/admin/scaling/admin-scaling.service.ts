import { Injectable } from '@nestjs/common';

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

    if (!request) throw new Error('Scaling request not found');

    // Update trading account balance

    await this.prisma.tradingAccount.update({

      where: { id: request.tradingAccountId },

      data: {

        balance: request.newBalance,

        initialBalance: request.newBalance, // OPTIONAL but common in scaling

      },

    });

    // Mark request as approved

    const updatedRequest = await this.prisma.scalingRequest.update({

      where: { id },

      data: {

        status: 'APPROVED',

        approvedAt: new Date(),

      },

    });

    // Create notification for scaling approval
    if (request.tradingAccount?.user?.id) {
      const accountNumber = request.tradingAccount.brokerLogin || request.tradingAccountId.substring(0, 8);
      const oldBalance = (Number(request.oldBalance) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const newBalance = (Number(request.newBalance) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      await this.notificationsService.create(
        request.tradingAccount.user.id,
        'Account Scaling Approved',
        `Your scaling request for account #${accountNumber} has been approved. Account balance increased from $${oldBalance} to $${newBalance}.`,
        NotificationType.SUCCESS,
        NotificationCategory.ACCOUNT,
      );
    }

    return updatedRequest;

  }

  async rejectRequest(id: string) {

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

    if (!request) throw new Error('Scaling request not found');

    const updatedRequest = await this.prisma.scalingRequest.update({

      where: { id },

      data: {

        status: 'REJECTED',

        approvedAt: new Date(),

      },

    });

    // Create notification for scaling rejection
    if (request.tradingAccount?.user?.id) {
      const accountNumber = request.tradingAccount.brokerLogin || request.tradingAccountId.substring(0, 8);
      
      await this.notificationsService.create(
        request.tradingAccount.user.id,
        'Account Scaling Rejected',
        `Your scaling request for account #${accountNumber} has been rejected. Please contact support for more information.`,
        NotificationType.WARNING,
        NotificationCategory.ACCOUNT,
      );
    }

    return updatedRequest;

  }

}

