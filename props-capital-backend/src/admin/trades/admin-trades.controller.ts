import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt.guard';
import { AdminRoleGuard } from '../../auth/admin-role.guard';

import { AdminTradesService } from './admin-trades.service';

@Controller('admin/trades')
@UseGuards(JwtAuthGuard, AdminRoleGuard)
export class AdminTradesController {

  constructor(private readonly adminTradesService: AdminTradesService) {}

  @Get()

  getAllTrades() {

    return this.adminTradesService.getAllTrades();

  }

  @Get('user/:userId')

  getTradesByUser(@Param('userId') userId: string) {

    return this.adminTradesService.getTradesByUser(userId);

  }

  @Get('account/:accountId')

  getTradesByAccount(@Param('accountId') accountId: string) {

    return this.adminTradesService.getTradesByAccount(accountId);

  }

  @Get(':tradeId')

  getTradeById(@Param('tradeId') tradeId: string) {

    return this.adminTradesService.getTradeById(tradeId);

  }

}

