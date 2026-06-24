import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { AdminChargebackService } from './admin-chargeback.service';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';
import { GenerateEvidenceDto } from './dto/generate-evidence.dto';

@Controller('admin/chargeback-evidence')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminChargebackController {
  constructor(private readonly service: AdminChargebackService) {}

  // Plans available for the dropdown
  @Get('plans')
  async getPlans() {
    return this.service.getPlans();
  }

  // Fraud-prevention & chargeback policies (static)
  @Get('policies')
  getPolicies() {
    return this.service.getPolicies();
  }

  // Generate the evidence pack: provision the account, simulate the lifecycle,
  // send the communications copy, and return the full report.
  @Post('generate')
  async generate(@Body() body: GenerateEvidenceDto) {
    return this.service.generateEvidence(body);
  }
}
