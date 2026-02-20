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
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }

  async getStatistics() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [openCount, inProgressCount, resolvedCount, closedCount, todayCount] =
      await Promise.all([
        this.prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
        this.prisma.supportTicket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
        this.prisma.supportTicket.count({ where: { status: TicketStatus.RESOLVED } }),
        this.prisma.supportTicket.count({ where: { status: TicketStatus.CLOSED } }),
        this.prisma.supportTicket.count({ where: { createdAt: { gte: todayStart } } }),
      ]);

    return { openCount, inProgressCount, resolvedCount, closedCount, todayCount };
  }

  async updateStatus(id: string, status: string, adminReply?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    const updateData: any = { status: status as TicketStatus };

    if (adminReply !== undefined && adminReply !== null) {
      updateData.adminReply = adminReply;
      updateData.repliedAt = new Date();
    }

    return this.prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
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
            profile: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }
}
