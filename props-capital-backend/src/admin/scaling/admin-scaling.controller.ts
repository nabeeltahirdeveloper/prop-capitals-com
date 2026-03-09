import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';
import { AdminScalingService } from './admin-scaling.service';
import { RejectScalingDto } from './dto/reject-scaling.dto';

@Controller('admin/scaling')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminScalingController {
  constructor(private readonly scalingService: AdminScalingService) {}

  @Get('requests')
  getAllRequests() {
    return this.scalingService.getAllRequests();
  }

  @Get('requests/:id')
  getRequestById(@Param('id') id: string) {
    return this.scalingService.getRequestById(id);
  }

  @Post('approve/:id')
  approveRequest(@Param('id') id: string) {
    return this.scalingService.approveRequest(id);
  }

  @Post('process/:id')
  processRequest(@Param('id') id: string) {
    return this.scalingService.processRequest(id);
  }

  @Post('reject/:id')
  rejectRequest(@Param('id') id: string, @Body() body: RejectScalingDto) {
    return this.scalingService.rejectRequest(id, body.reason);
  }
}
