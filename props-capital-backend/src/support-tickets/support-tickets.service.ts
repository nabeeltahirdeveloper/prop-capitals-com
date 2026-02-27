import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupportEventsGateway } from '../websocket/support-events.gateway';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import { CreatePublicTicketDto } from './dto/create-public-ticket.dto';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  SenderType,
  UserRole,
} from '@prisma/client';

@Injectable()
export class SupportTicketsService {
  constructor(
    private prisma: PrismaService,
    private supportGateway: SupportEventsGateway,
  ) {}

  async create(userId: string, dto: CreateSupportTicketDto) {
    const { ticket, msg } = await this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          userId,
          subject: dto.subject,
          message: dto.message,
          category: dto.category || TicketCategory.OTHER,
          priority: dto.priority || TicketPriority.MEDIUM,
          status: TicketStatus.WAITING_FOR_ADMIN,
        },
      });
      const msg = await tx.supportTicketMessage.create({
        data: {
          ticketId: ticket.id,
          senderType: SenderType.TRADER,
          senderId: userId,
          message: dto.message,
        },
      });
      return { ticket, msg };
    });

    this.supportGateway.emitNewMessage(ticket.id, msg);
    return ticket;
  }

  async createPublic(userId: string | null, dto: CreatePublicTicketDto) {
    const category = dto.category || TicketCategory.OTHER;
    const categoryLabel =
      category.charAt(0) + category.slice(1).toLowerCase();
    const subject = `Support Request - ${categoryLabel}`;

    if (!userId && !dto.email) {
      throw new BadRequestException('Email is required for guest submissions');
    }

    const { ticket, msg } = await this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          userId: userId || null,
          guestName: userId ? null : dto.name || null,
          guestEmail: userId ? null : dto.email || null,
          subject,
          message: dto.message,
          category,
          priority: dto.priority || TicketPriority.MEDIUM,
          status: TicketStatus.WAITING_FOR_ADMIN,
        },
      });
      const msg = await tx.supportTicketMessage.create({
        data: {
          ticketId: ticket.id,
          senderType: SenderType.TRADER,
          senderId: userId || null,
          message: dto.message,
        },
      });
      return { ticket, msg };
    });

    this.supportGateway.emitNewMessage(ticket.id, msg);

    return {
      ticketId: ticket.id,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      createdAt: ticket.createdAt,
    };
  }

  async getUserTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { messages: true } },
      },
    });
  }

  async getOne(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        _count: { select: { messages: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }

  async getOneForUser(id: string, requesterUserId: string, requesterRole: UserRole) {
    const where =
      requesterRole === UserRole.ADMIN
        ? { id }
        : { id, userId: requesterUserId };

    const ticket = await this.prisma.supportTicket.findFirst({
      where,
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
        _count: { select: { messages: true } },
      },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }

  async getMessages(ticketId: string, userId: string, role: UserRole) {
    const where =
      role === UserRole.ADMIN
        ? { id: ticketId }
        : { id: ticketId, userId };

    const ticket = await this.prisma.supportTicket.findFirst({ where });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    return this.prisma.supportTicketMessage.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addTraderMessage(ticketId: string, userId: string, message: string) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: { id: ticketId, userId },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    if (ticket.status === TicketStatus.CLOSED) {
      throw new BadRequestException('Cannot reply to a closed ticket');
    }

    const msg = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supportTicketMessage.create({
        data: {
          ticketId,
          senderType: SenderType.TRADER,
          senderId: userId,
          message,
        },
      });
      await tx.supportTicket.update({
        where: { id: ticketId },
        data: { status: TicketStatus.WAITING_FOR_ADMIN },
      });
      return created;
    });

    this.supportGateway.emitNewMessage(ticketId, msg);
    this.supportGateway.emitStatusChanged(ticketId, TicketStatus.WAITING_FOR_ADMIN);
    return msg;
  }

  async updateStatus(id: string, status: string) {
    const validStatuses = Object.values(TicketStatus);
    const upperStatus = status?.toUpperCase();

    if (!validStatuses.includes(upperStatus as TicketStatus)) {
      throw new BadRequestException(
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');

    return this.prisma.supportTicket.update({
      where: { id },
      data: { status: upperStatus as TicketStatus },
    });
  }
}
