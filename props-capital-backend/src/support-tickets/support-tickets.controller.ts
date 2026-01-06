import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';

import { SupportTicketsService } from './support-tickets.service';

import { CreateSupportTicketDto } from './dto/create-support-ticket.dto';

@Controller('support-tickets')

export class SupportTicketsController {

  constructor(private readonly supportTicketsService: SupportTicketsService) {}

  @Post()

  async create(@Body() dto: CreateSupportTicketDto) {

    return this.supportTicketsService.create(dto);

  }

  @Get('user/:userId')

  async getUserTickets(@Param('userId') userId: string) {

    return this.supportTicketsService.getUserTickets(userId);

  }

  @Get(':id')

  async getOne(@Param('id') id: string) {

    return this.supportTicketsService.getOne(id);

  }

  @Patch(':id/status')

  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {

    return this.supportTicketsService.updateStatus(id, body.status);

  }

}
