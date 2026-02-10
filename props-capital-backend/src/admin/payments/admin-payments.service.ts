import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()

export class AdminPaymentsService {

  constructor(private prisma: PrismaService) {}

  async getAll() {

    return this.prisma.payment.findMany({

      orderBy: { createdAt: 'desc' },

      include: {

        user: {

          select: {

            id: true,

            email: true,

          },

        },

      },

    });

  }

  async getStatistics() {

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Get all payments for statistics
    const allPayments = await this.prisma.payment.findMany({

      select: {

        amount: true,

        status: true,

        createdAt: true,

      },

    });

    // Calculate current month revenue
    const currentMonthRevenue = await this.prisma.payment.aggregate({

      _sum: { amount: true },

      where: {

        status: 'succeeded',

        createdAt: { gte: currentMonthStart },

      },

    });

    // Calculate last month revenue
    const lastMonthRevenue = await this.prisma.payment.aggregate({

      _sum: { amount: true },

      where: {

        status: 'succeeded',

        createdAt: { gte: lastMonthStart, lt: currentMonthStart },

      },

    });

    // Calculate percentage change
    const revenueChangePercent = lastMonthRevenue._sum.amount && lastMonthRevenue._sum.amount > 0
      ? ((Number(currentMonthRevenue._sum.amount || 0) - Number(lastMonthRevenue._sum.amount)) / Number(lastMonthRevenue._sum.amount)) * 100
      : 0;

    // Calculate statistics
    const totalRevenue = allPayments
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const refundedAmount = allPayments
      .filter(p => p.status === 'refunded')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingAmount = allPayments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const completedCount = allPayments.filter(p => p.status === 'succeeded').length;

    return {

      totalRevenue: Number(totalRevenue),

      revenueChangePercent: Math.round(revenueChangePercent * 10) / 10,

      completedCount,

      pendingAmount: Number(pendingAmount),

      refundedAmount: Number(refundedAmount),

    };

  }

  async refundPayment(id: string, reason?: string) {

    const payment = await this.prisma.payment.findUnique({

      where: { id },

    });

    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status !== 'succeeded') {

      throw new BadRequestException('Only succeeded payments can be refunded');

    }

    return this.prisma.payment.update({

      where: { id },

      data: {

        status: 'refunded',

        refundedAt: new Date(),

        refundReason: reason || null,

      },

    });

  }

}

