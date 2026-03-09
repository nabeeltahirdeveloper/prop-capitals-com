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

    // Run all aggregate queries in parallel
    const [
      succeededAgg,
      refundedAgg,
      pendingAgg,
      currentMonthRevenue,
      lastMonthRevenue,
    ] = await Promise.all([
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: 'succeeded' },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'refunded' },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'pending' },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'succeeded',
          createdAt: { gte: currentMonthStart },
        },
      }),
      this.prisma.payment.aggregate({
        _sum: { amount: true },
        where: {
          status: 'succeeded',
          createdAt: { gte: lastMonthStart, lt: currentMonthStart },
        },
      }),
    ]);

    // Calculate percentage change
    const revenueChangePercent = lastMonthRevenue._sum.amount && lastMonthRevenue._sum.amount > 0
      ? ((Number(currentMonthRevenue._sum.amount || 0) - Number(lastMonthRevenue._sum.amount)) / Number(lastMonthRevenue._sum.amount)) * 100
      : 0;

    return {

      totalRevenue: Number(succeededAgg._sum.amount || 0),

      revenueChangePercent: Math.round(revenueChangePercent * 10) / 10,

      completedCount: succeededAgg._count,

      pendingAmount: Number(pendingAgg._sum.amount || 0),

      refundedAmount: Number(refundedAgg._sum.amount || 0),

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

