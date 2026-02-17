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

    return this.supportTicketsService.create(req.user.userId, dto);

  }

  @Get('me')
  async getMyTickets(@Req() req: any) {
    return this.supportTicketsService.getUserTickets(req.user.userId);
  }

  @Get('user/:userId')

  async getUserTickets(@Req() req: any, @Param('userId') userId: string) {
    if (req.user.role !== UserRole.ADMIN && req.user.userId !== userId) {
      throw new ForbiddenException('You can only access your own support tickets');
    }

    return this.supportTicketsService.getUserTickets(userId);

  }

  @Get(':id')

  async getOne(@Req() req: any, @Param('id') id: string) {

    return this.supportTicketsService.getOneForUser(
      id,
      req.user.userId,
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
