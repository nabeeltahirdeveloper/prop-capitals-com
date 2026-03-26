import { Controller, Get, Param, Patch, Body, UseGuards, Query, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';

import { AdminAccountsService } from './admin-accounts.service';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';
import { UpdateAccountStatusDto } from './dto/update-account-status.dto';
import { UpdateAccountPhaseDto } from './dto/update-account-phase.dto';

@Controller('admin/accounts')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminAccountsController {
  constructor(private readonly adminAccountsService: AdminAccountsService) {}

  // Get all accounts

  @Get()
  async getAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('phase') phase?: string,
  ) {
    return this.adminAccountsService.getAll({ page, limit, search, status, phase });
  }

  // Get one account

  @Get(':id')
  async getOne(@Param('id') id: string) {
    return this.adminAccountsService.getOne(id);
  }

  // Update account status

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: UpdateAccountStatusDto,
  ) {
    return this.adminAccountsService.updateStatus(id, body.status);
  }

  // Update account phase

  @Patch(':id/phase')
  async updatePhase(@Param('id') id: string, @Body() body: UpdateAccountPhaseDto) {
    return this.adminAccountsService.updatePhase(id, body.phase);
  }
}
