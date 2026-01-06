import { Controller, Get, Param, Patch } from '@nestjs/common';

import { AdminPayoutsService } from './admin-payouts.service';

@Controller('admin/payouts')

export class AdminPayoutsController {

  constructor(private readonly adminPayoutsService: AdminPayoutsService) {}

  @Get()

  async getAll() {

    return this.adminPayoutsService.getAll();

  }

  @Get('statistics')

  async getStatistics() {

    return this.adminPayoutsService.getStatistics();

  }

  @Patch(':id/approve')

  async approve(@Param('id') id: string) {

    return this.adminPayoutsService.updateStatus(id, 'APPROVED');

  }

  @Patch(':id/reject')

  async reject(@Param('id') id: string) {

    return this.adminPayoutsService.updateStatus(id, 'REJECTED');

  }

  @Patch(':id/mark-paid')

  async markAsPaid(@Param('id') id: string) {

    return this.adminPayoutsService.markAsPaid(id);

  }

}

