import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SupportEventsGateway } from '../../websocket/support-events.gateway';
import { TicketStatus, SenderType } from '@prisma/client';

const USER_SELECT = {
  id: true,
  email: true,
  profile: { select: { firstName: true, lastName: true } },
} as const;

@Injectable()
export class AdminSupportService {
  constructor(
    private prisma: PrismaService,
    private supportGateway: SupportEventsGateway,
  ) {}

  async getAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.supportTicket.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: USER_SELECT },
          messages: { orderBy: { createdAt: 'desc' }, take: 1 },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.supportTicket.count(),
    ]);

    return { data, total, page, limit };
  }

  async getStatistics() {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [
      openCount,
      inProgressCount,
      resolvedCount,
      closedCount,
      waitingForAdminCount,
      waitingForTraderCount,
      todayCount,
    ] = await Promise.all([
      this.prisma.supportTicket.count({ where: { status: TicketStatus.OPEN } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.RESOLVED } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.CLOSED } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.WAITING_FOR_ADMIN } }),
      this.prisma.supportTicket.count({ where: { status: TicketStatus.WAITING_FOR_TRADER } }),
      this.prisma.supportTicket.count({ where: { createdAt: { gte: todayStart } } }),
    ]);

    return {
      openCount,
      inProgressCount,
      resolvedCount,
      closedCount,
      waitingForAdminCount,
      waitingForTraderCount,
      todayCount,
    };
  }

  async updateStatus(id: string, status: string, adminReply?: string, adminId?: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    const normalizedStatus = status?.toUpperCase();
    if (!Object.values(TicketStatus).includes(normalizedStatus as TicketStatus)) {
      throw new BadRequestException('Invalid ticket status');
    }

    const updateData: any = { status: normalizedStatus as TicketStatus };

    if (adminReply !== undefined && adminReply !== null) {
      const trimmedReply = adminReply.trim();
      if (trimmedReply) {
        updateData.adminReply = trimmedReply;
        updateData.repliedAt = new Date();
        updateData.status = TicketStatus.WAITING_FOR_TRADER;

        const result = await this.prisma.$transaction(async (tx) => {
          const msg = await tx.supportTicketMessage.create({
            data: {
              ticketId: id,
              senderType: SenderType.ADMIN,
              senderId: adminId || null,
              message: trimmedReply,
            },
          });
          const updated = await tx.supportTicket.update({
            where: { id },
            data: updateData,
            include: { user: { select: USER_SELECT } },
          });
          return { msg, updated };
        });

        this.supportGateway.emitNewMessage(id, result.msg);
        this.supportGateway.emitStatusChanged(id, TicketStatus.WAITING_FOR_TRADER);
        return result.updated;
      }
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id },
      data: updateData,
      include: { user: { select: USER_SELECT } },
    });

    this.supportGateway.emitStatusChanged(id, normalizedStatus);
    return updated;
  }

  async getOne(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: { select: USER_SELECT },
        messages: { orderBy: { createdAt: 'asc' } },
        _count: { select: { messages: true } },
      },
    });

    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }

  async getMessages(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    return this.prisma.supportTicketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addAdminMessage(ticketId: string, adminId: string, message: string) {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    const msg = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supportTicketMessage.create({
        data: {
          ticketId,
          senderType: SenderType.ADMIN,
          senderId: adminId,
          message,
        },
      });
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: {
          status: TicketStatus.WAITING_FOR_TRADER,
          adminReply: message,
          repliedAt: new Date(),
        },
      });
      return created;
    });

    this.supportGateway.emitNewMessage(ticketId, msg);
    this.supportGateway.emitStatusChanged(ticketId, TicketStatus.WAITING_FOR_TRADER);
    return msg;
  }
}
