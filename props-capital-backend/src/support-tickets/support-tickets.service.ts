import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

import { TicketCategory, TicketPriority, TicketStatus } from '@prisma/client';

@Injectable()

export class SupportTicketsService {

  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSupportTicketDto) {

    return this.prisma.supportTicket.create({

      data: {

        userId: dto.userId,

        subject: dto.subject,

        message: dto.message,

        category: (dto.category?.toUpperCase() as TicketCategory) || TicketCategory.OTHER,

        priority: (dto.priority?.toUpperCase() as TicketPriority) || TicketPriority.MEDIUM,

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

  async updateStatus(id: string, status: string) {

    return this.prisma.supportTicket.update({

      where: { id },

      data: { status: status as TicketStatus },

    });

  }

}
