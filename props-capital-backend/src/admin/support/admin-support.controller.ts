import { Controller, Get, Post, Param, Patch, Body, Query, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AdminSupportService } from './admin-support.service';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';

@Controller('admin/support')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminSupportController {
  constructor(private readonly service: AdminSupportService) {}

  @Get('tickets')
  async getAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : NaN;
    const limitNum = limit ? parseInt(limit, 10) : NaN;

    const p = Math.max(1, Number.isNaN(pageNum) ? 1 : pageNum);
    const l = Math.min(100, Math.max(1, Number.isNaN(limitNum) ? 20 : limitNum));
    return this.service.getAll(p, l);
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
    @Body() body: { message: string },
  ) {
    const adminId = req.user?.userId || req.user?.sub;
    if (!body.message?.trim()) {
      throw new BadRequestException('Message is required');
    }
    return this.service.addAdminMessage(id, adminId, body.message.trim());
  }

  @Patch('tickets/:id/status')
  async updateStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { status: string; adminReply?: string },
  ) {
    const adminId = req.user?.userId || req.user?.sub;
    return this.service.updateStatus(id, body.status, body.adminReply, adminId);
  }
}
