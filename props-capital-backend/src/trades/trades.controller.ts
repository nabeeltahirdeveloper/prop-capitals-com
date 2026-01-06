import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';

import { TradesService } from './trades.service';

@Controller('trades')

export class TradesController {

  constructor(private readonly service: TradesService) {}

  @Post()

  create(@Body() body: any) {

    return this.service.createTrade(body);

  }

  @Get('account/:accountId')

  async getTradesForAccount(@Param('accountId') accountId: string) {

    return this.service.getTradesForAccount(accountId);

  }

  @Patch(':id')

  async updateTrade(@Param('id') id: string, @Body() body: any) {

    return this.service.updateTrade(id, body);

  }

  @Patch(':id/modify')

  async modifyPosition(@Param('id') id: string, @Body() body: { stopLoss?: number; takeProfit?: number }) {

    return this.service.modifyPosition(id, body);

  }

}
