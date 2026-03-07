import { Controller, Get, Post, Param, Patch, Body, Query, UseGuards, Req } from '@nestjs/common';
import { AdminSupportService } from './admin-support.service';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';
import { TicketStatus } from '@prisma/client';

@Controller('admin/support')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminSupportController {
  constructor(private readonly service: AdminSupportService) {}

  @Get('tickets')
  async getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : NaN;
    const limitNum = limit ? parseInt(limit, 10) : NaN;

    const p = Math.max(1, Number.isNaN(pageNum) ? 1 : pageNum);
    const l = Math.min(100, Math.max(1, Number.isNaN(limitNum) ? 20 : limitNum));

    const validStatus = status && Object.values(TicketStatus).includes(status.toUpperCase() as TicketStatus)
      ? (status.toUpperCase() as TicketStatus)
      : undefined;

    return this.service.getAll(p, l, search?.trim(), validStatus);
  }

  @Get('tickets/statistics')
  async getStatistics() {
    return this.service.getStatistics();
  }

  @Get('tickets/:id')
  async getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @Get('tickets/:id/messages')
  async getMessages(@Param('id') id: string) {
    return this.service.getMessages(id);
  }

  @Post('tickets/:id/messages')
  async addMessage(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: AddMessageDto,
  ) {
    const adminId = req.user?.userId || req.user?.sub;
    return this.service.addAdminMessage(id, adminId, body.message.trim());
  }

  @Patch('tickets/:id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: UpdateTicketStatusDto,
  ) {
    const adminId = req.user?.userId || req.user?.sub;
    return this.service.updateStatus(id, body.status, body.adminReply, adminId);
  }
}
