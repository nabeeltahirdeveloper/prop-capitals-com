import { Controller, Get, Param } from '@nestjs/common';

import { AdminTradesService } from './admin-trades.service';

@Controller('admin/trades')

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

