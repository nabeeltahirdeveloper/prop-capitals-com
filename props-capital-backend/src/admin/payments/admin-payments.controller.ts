import { Controller, Get, Patch, Param, Body } from '@nestjs/common';

import { AdminPaymentsService } from './admin-payments.service';

@Controller('admin/payments')

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

