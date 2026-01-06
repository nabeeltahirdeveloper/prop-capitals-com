import { Controller, Get } from '@nestjs/common';

import { AdminDashboardService } from './admin-dashboard.service';

@Controller('admin/dashboard')

export class AdminDashboardController {

  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('overview')

  getOverview() {

    return this.dashboardService.getOverview();

  }

  @Get('recent-accounts')

  getRecentAccounts() {

    return this.dashboardService.getRecentAccounts();

  }

  @Get('recent-violations')

  getRecentViolations() {

    return this.dashboardService.getRecentViolations();

  }

  @Get('revenue-chart')

  getRevenueChart() {

    return this.dashboardService.getRevenueChart();

  }

  @Get('registrations-chart')

  getRegistrationsChart() {

    return this.dashboardService.getRegistrationsChart();

  }

}

