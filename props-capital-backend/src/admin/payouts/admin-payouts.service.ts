import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

import { PayoutStatus, NotificationType, NotificationCategory } from '@prisma/client';

@Injectable()

export class AdminPayoutsService {

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getAll() {

    return this.prisma.payout.findMany({

      orderBy: { createdAt: 'desc' },

      include: {

        user: {

          select: {

            id: true,

            email: true,

          },

        },

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

  async getStatistics() {

    // Get all payouts for statistics
    const allPayouts = await this.prisma.payout.findMany({

      select: {

        amount: true,

        status: true,

      },

    });

    // Calculate statistics
    const pendingAmount = allPayouts
      .filter(p => p.status === PayoutStatus.PENDING)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const approvedAmount = allPayouts
      .filter(p => p.status === PayoutStatus.APPROVED)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const paidAmount = allPayouts
      .filter(p => p.status === PayoutStatus.PAID)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingCount = allPayouts.filter(p => p.status === PayoutStatus.PENDING).length;

    return {

      pendingAmount: Number(pendingAmount),

      approvedAmount: Number(approvedAmount),

      paidAmount: Number(paidAmount),

      pendingCount,

    };

  }

  async updateStatus(id: string, status: string) {

    const payout = await this.prisma.payout.findUnique({ 
      where: { id },
      include: {
        user: {
          select: {
            id: true,
          },
        },
        tradingAccount: {
          select: {
            brokerLogin: true,
          },
        },
      },
    });

    if (!payout) throw new NotFoundException('Payout not found');

    const updatedPayout = await this.prisma.payout.update({

      where: { id },

      data: { status: status as PayoutStatus },

    });

    // Create notification when payout status changes
    if (payout.userId) {
      const accountNumber = payout.tradingAccount?.brokerLogin || id.substring(0, 8);
      // Amount is stored in cents, convert to dollars
      const amount = (Number(payout.amount) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      if (status === PayoutStatus.APPROVED) {
        await this.notificationsService.create(
          payout.userId,
          'Payout Approved',
          `Your payout request of $${amount} has been approved. Funds will be transferred within 24-48 hours.`,
          NotificationType.SUCCESS,
          NotificationCategory.PAYOUT,
        );
      } else if (status === PayoutStatus.REJECTED) {
        await this.notificationsService.create(
          payout.userId,
          'Payout Rejected',
          `Your payout request of $${amount} has been rejected. Please contact support for more information.`,
          NotificationType.ERROR,
          NotificationCategory.PAYOUT,
        );
      }
    }

    return updatedPayout;

  }

  async markAsPaid(id: string) {

    const payout = await this.prisma.payout.findUnique({ 
      where: { id },
      include: {
        user: {
          select: {
            id: true,
          },
        },
        tradingAccount: {
          select: {
            brokerLogin: true,
          },
        },
      },
    });

    if (!payout) throw new NotFoundException('Payout not found');

    if (payout.status !== PayoutStatus.APPROVED) {

      throw new Error('Only approved payouts can be marked as paid');

    }

    const updatedPayout = await this.prisma.payout.update({

      where: { id },

      data: { status: PayoutStatus.PAID },

    });

    // Create notification when payout is marked as paid
    if (payout.userId) {
      const accountNumber = payout.tradingAccount?.brokerLogin || id.substring(0, 8);
      const amount = (Number(payout.amount) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      await this.notificationsService.create(
        payout.userId,
        'Payout Processed',
        `Your payout of $${amount} has been processed and transferred to your account.`,
        NotificationType.SUCCESS,
        NotificationCategory.PAYOUT,
      );
    }

    return updatedPayout;

  }

}

