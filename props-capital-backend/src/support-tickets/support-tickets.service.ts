import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  UserRole,
} from '@prisma/client';

@Injectable()
export class SupportTicketsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateSupportTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        subject: dto.subject,
        message: dto.message,
        category: dto.category || TicketCategory.OTHER,
        priority: dto.priority || TicketPriority.MEDIUM,
        status: TicketStatus.OPEN,
      },
    });
  }

  async getUserTickets(userId: string) {
    return this.prisma.supportTicket.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOne(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
    });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
  }

  async getOneForUser(id: string, requesterUserId: string, requesterRole: UserRole) {
    const where =
      requesterRole === UserRole.ADMIN
        ? { id }
        : {
            id,
            userId: requesterUserId,
          };

    const ticket = await this.prisma.supportTicket.findFirst({ where });
    if (!ticket) throw new NotFoundException('Support ticket not found');
    return ticket;
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
