import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { TicketStatus } from '@prisma/client';

@Injectable()

export class AdminSupportService {

  constructor(private prisma: PrismaService) {}

  async getAll() {

    return this.prisma.supportTicket.findMany({

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

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const openCount = await this.prisma.supportTicket.count({

      where: { status: TicketStatus.OPEN },

    });

    const inProgressCount = await this.prisma.supportTicket.count({

      where: { status: TicketStatus.IN_PROGRESS },

    });

    const resolvedCount = await this.prisma.supportTicket.count({

      where: { status: TicketStatus.RESOLVED },

    });

    const todayCount = await this.prisma.supportTicket.count({

      where: { createdAt: { gte: todayStart } },

    });

    return {

      openCount,

      inProgressCount,

      resolvedCount,

      todayCount,

    };

  }

  async updateStatus(id: string, status: string) {

    const ticket = await this.prisma.supportTicket.findUnique({

      where: { id },

    });

    if (!ticket) throw new NotFoundException('Support ticket not found');

    return this.prisma.supportTicket.update({

      where: { id },

      data: { status: status as TicketStatus },

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

  async getOne(id: string) {

    const ticket = await this.prisma.supportTicket.findUnique({

      where: { id },

      include: {

        user: {

          select: {

            id: true,

            email: true,

          },

        },

      },

    });

    if (!ticket) throw new NotFoundException('Support ticket not found');

    return ticket;

  }

}

