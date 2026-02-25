import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  UseGuards,
  Req,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt.guard';

import { SupportTicketsService } from './support-tickets.service';

import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@Controller('support-tickets')
@UseGuards(JwtAuthGuard)

export class SupportTicketsController {

  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @Post()

  async create(@Req() req: any, @Body() dto: CreateSupportTicketDto) {
    const userId = req.user?.userId || req.user?.sub || dto.userId;
    if (!userId) {
      throw new BadRequestException('Unable to identify user. Please sign in again.');
    }
    return this.supportTicketsService.create(userId, dto);

  }

  @Get('me')
  async getMyTickets(@Req() req: any) {
    const userId = req.user?.userId || req.user?.sub;
    if (!userId) {
      throw new BadRequestException('Unable to identify user. Please sign in again.');
    }
    return this.supportTicketsService.getUserTickets(userId);
  }

  @Get('user/:userId')

  async getUserTickets(@Req() req: any, @Param('userId') userId: string) {
    const requesterId = req.user?.userId || req.user?.sub;
    if (!requesterId) {
      throw new BadRequestException('Unable to identify user. Please sign in again.');
    }
    if (req.user.role !== UserRole.ADMIN && requesterId !== userId) {
      throw new ForbiddenException('You can only access your own support tickets');
    }

    return this.supportTicketsService.getUserTickets(userId);

  }

  @Get(':id')

  async getOne(@Req() req: any, @Param('id') id: string) {
    const requesterId = req.user?.userId || req.user?.sub;
    if (!requesterId) {
      throw new BadRequestException('Unable to identify user. Please sign in again.');
    }

    return this.supportTicketsService.getOneForUser(
      id,
      requesterId,
      req.user.role,
    );

  }

  @Patch(':id/status')

  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    if (req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin can update ticket status');
    }

    return this.supportTicketsService.updateStatus(id, body.status);

  }

}
