import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';

import { AdminPaymentsService } from './admin-payments.service';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminPaymentsController {

  constructor(private readonly service: AdminPaymentsService) {}

  @Get()

  async getAll() {

    return this.service.getAll();

  }

  @Get('statistics')

  async getStatistics() {

    return this.service.getStatistics();

  }

  @Patch(':id/refund')

  async refundPayment(@Param('id') id: string, @Body() body: { reason?: string }) {

    return this.service.refundPayment(id, body.reason);

  }

}

