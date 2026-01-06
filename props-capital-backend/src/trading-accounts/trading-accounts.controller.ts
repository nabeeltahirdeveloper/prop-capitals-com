import { Controller, Post, Body, Get, Param, Query, BadRequestException } from '@nestjs/common';

import { TradingAccountsService } from './trading-accounts.service';

@Controller('trading-accounts')

export class TradingAccountsController {

  constructor(private readonly service: TradingAccountsService) {}

  @Post()

  create(@Body() body: { userId: string; challengeId: string }) {

    return this.service.createAccount(body.userId, body.challengeId);

  }

  @Get('user/:userId')

  getUserAccounts(@Param('userId') userId: string) {

    return this.service.getUserAccounts(userId);

  }

  // Get analytics for user (single account or aggregated)
  // This must come BEFORE :id route to avoid route conflicts
  @Get('analytics')

  async getAnalytics(
    @Query('userId') userId: string,
    @Query('accountId') accountId?: string,
  ) {

    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.service.getAnalytics(userId, accountId);

  }

  @Get(':id')

  getAccountById(@Param('id') id: string) {

    return this.service.getAccountById(id);

  }

  // 🔥 Rule compliance endpoint for frontend ChallengeRulesPanel

  @Get(':id/rules')

  getRuleCompliance(@Param('id') id: string) {

    return this.service.getRuleCompliance(id);

  }

  @Get(':id/summary')

  async getAccountSummary(@Param('id') id: string) {

    return this.service.getAccountSummary(id);

  }

  // Get phase transition history
  @Get(':id/phase-transitions')

  async getPhaseTransitions(@Param('id') id: string) {

    return this.service.getPhaseTransitions(id);

  }

  // Get daily compliance history
  @Get(':id/compliance-history')

  async getDailyComplianceHistory(
    @Param('id') id: string,
    @Query('days') days?: string,
  ) {

    const daysNum = days ? parseInt(days, 10) : 7;

    return this.service.getDailyComplianceHistory(id, daysNum);

  }

  // Real-time evaluation endpoint (for frontend to check violations with current equity)
  @Post(':id/evaluate-real-time')
  async evaluateRealTime(
    @Param('id') id: string,
    @Body() body: { currentEquity: number },
  ) {
    return this.service.evaluateRealTime(id, body.currentEquity);
  }

  // Event-driven price tick endpoint (called when frontend receives price update)
  @Post(':id/price-tick')
  async processPriceTick(
    @Param('id') id: string,
    @Body() body: { symbol: string; bid: number; ask: number; ts: number },
  ) {
    if (!body.symbol || body.bid === undefined || body.ask === undefined) {
      throw new BadRequestException('symbol, bid, and ask are required');
    }
    return this.service.processPriceTick(id, body.symbol, body.bid, body.ask, body.ts || Date.now());
  }

}
