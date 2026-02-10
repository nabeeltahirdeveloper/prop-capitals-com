import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { AdminScalingService } from './admin-scaling.service';

@Controller('admin/scaling')
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
  rejectRequest(@Param('id') id: string, @Body('reason') reason?: string) {
    return this.scalingService.rejectRequest(id, reason);
  }
}
