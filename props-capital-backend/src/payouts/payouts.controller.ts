import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';

import { PayoutsService } from './payouts.service';

@Controller('payouts')
export class PayoutsController {
  constructor(private readonly payoutsService: PayoutsService) {}

  @Post('request')
  async requestPayout(
    @Body()
    body: {
      userId: string;
      tradingAccountId: string;
      paymentMethod?: string;
      paymentDetails?: string;
    },
  ) {
    return this.payoutsService.requestPayout(
      body.userId,
      body.tradingAccountId,
      body.paymentMethod,
      body.paymentDetails,
    );
  }

  @Get('user/:userId')
  async getUserPayouts(
    @Param('userId') userId: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.payoutsService.getUserPayouts(userId, accountId);
  }

  @Get('user/:userId/statistics')
  async getPayoutStatistics(
    @Param('userId') userId: string,
    @Query('accountId') accountId?: string,
  ) {
    return this.payoutsService.getPayoutStatistics(userId, accountId);
  }

  @Get('user/:userId/available/:tradingAccountId')
  async getAvailablePayoutAmount(
    @Param('userId') userId: string,
    @Param('tradingAccountId') tradingAccountId: string,
  ) {
    return this.payoutsService.getAvailablePayoutAmount(
      userId,
      tradingAccountId,
    );
  }
}
