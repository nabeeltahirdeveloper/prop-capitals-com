import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { AdminSupportService } from './admin-support.service';
import { JwtAuthGuard } from '../../auth/jwt.guard';

@Controller('admin/support')
@UseGuards(JwtAuthGuard)
export class AdminSupportController {
  constructor(private readonly service: AdminSupportService) {}

  @Get('tickets')
  async getAll() {
    return this.service.getAll();
  }

  @Get('tickets/statistics')
  async getStatistics() {
    return this.service.getStatistics();
  }

  @Get('tickets/:id')
  async getOne(@Param('id') id: string) {
    return this.service.getOne(id);
  }

  @Patch('tickets/:id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; adminReply?: string },
  ) {
    return this.service.updateStatus(id, body.status, body.adminReply);
  }
}
