import { Controller, Get, Param, Patch, Body } from '@nestjs/common';

import { AdminAccountsService } from './admin-accounts.service';

@Controller('admin/accounts')

export class AdminAccountsController {

  constructor(private readonly adminAccountsService: AdminAccountsService) {}

  // Get all accounts

  @Get()

  async getAll() {

    return this.adminAccountsService.getAll();

  }

  // Get one account

  @Get(':id')

  async getOne(@Param('id') id: string) {

    return this.adminAccountsService.getOne(id);

  }

  // Update account status

  @Patch(':id/status')

  async updateStatus(@Param('id') id: string, @Body() body: { status: string }) {

    return this.adminAccountsService.updateStatus(id, body.status);

  }

  // Update account phase

  @Patch(':id/phase')

  async updatePhase(@Param('id') id: string, @Body() body: { phase: string }) {

    return this.adminAccountsService.updatePhase(id, body.phase);

  }

}

