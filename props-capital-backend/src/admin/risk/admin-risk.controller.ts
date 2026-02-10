import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';

import { AdminRiskService } from './admin-risk.service';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';

@Controller('admin/risk')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminRiskController {
  constructor(private readonly riskService: AdminRiskService) {}

  @Get('overview')
  getRiskOverview() {
    return this.riskService.getRiskOverview();
  }

  @Get('account/:id')
  getAccountRisk(@Param('id') id: string) {
    return this.riskService.getAccountRisk(id);
  }

  @Get('violations')
  getAllViolations(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.riskService.getAllViolations(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('violations/:id')
  getViolation(@Param('id') id: string) {
    return this.riskService.getViolation(id);
  }
}
