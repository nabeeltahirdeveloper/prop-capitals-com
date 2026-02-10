import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

import { ChallengePlatform, NotificationType, NotificationCategory, UserRole } from '@prisma/client';

@Injectable()

export class AdminChallengesService {

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // Get all challenges

  getAll() {

    return this.prisma.challenge.findMany({

      orderBy: { createdAt: 'desc' },

    });

  }

  // Get one challenge

  async getOne(id: string) {

    const challenge = await this.prisma.challenge.findUnique({ where: { id } });

    if (!challenge) throw new NotFoundException('Challenge not found');

    return challenge;

  }

  // Create a challenge

  async create(data: any) {
    // Map frontend snake_case to backend camelCase and handle required fields
    const accountSize = data.accountSize || data.account_size;
    const price = data.price;

    // Validate required fields
    if (!data.name && !data.challengeName) {
      throw new BadRequestException('Challenge name is required');
    }
    if (!accountSize) {
      throw new BadRequestException('Account size is required');
    }
    if (!price) {
      throw new BadRequestException('Price is required');
    }

    const challengeData: any = {
      name: data.name || data.challengeName,
      description: data.description || null,
      accountSize: parseInt(String(accountSize)),
      price: parseInt(String(price)),
      platform: (data.platform && ['MT5', 'MT4', 'CTRADER', 'DXTRADE', 'BYBIT', 'PT5', 'TRADELOCKER'].includes(data.platform.toUpperCase()) 
        ? data.platform.toUpperCase() 
        : 'MT5') as ChallengePlatform, // Validate and normalize platform value
      challengeType: data.challengeType || data.challenge_type || 'two_phase',
      phase1TargetPercent: data.phase1TargetPercent || data.phase1_profit_target || 8.0,
      phase2TargetPercent: data.phase2TargetPercent || data.phase2_profit_target || 5.0,
      dailyDrawdownPercent: data.dailyDrawdownPercent || data.max_daily_drawdown || 5.0,
      overallDrawdownPercent: data.overallDrawdownPercent || data.max_overall_drawdown || 10.0,
      minTradingDays: data.minTradingDays || data.min_trading_days || 5,
      maxTradingDays: data.maxTradingDays || data.max_trading_days ? parseInt(String(data.maxTradingDays || data.max_trading_days)) : null,
      profitSplit: data.profitSplit !== undefined || data.profit_split !== undefined ? parseFloat(String(data.profitSplit || data.profit_split)) : 80.0,
      isActive: data.isActive !== undefined || data.is_active !== undefined ? Boolean(data.isActive !== undefined ? data.isActive : data.is_active) : true,
      newsTradingAllowed: data.newsTradingAllowed !== undefined || data.news_trading_allowed !== undefined ? Boolean(data.newsTradingAllowed !== undefined ? data.newsTradingAllowed : data.news_trading_allowed) : true,
      weekendHoldingAllowed: data.weekendHoldingAllowed !== undefined || data.weekend_holding_allowed !== undefined ? Boolean(data.weekendHoldingAllowed !== undefined ? data.weekendHoldingAllowed : data.weekend_holding_allowed) : true,
      eaAllowed: data.eaAllowed !== undefined || data.ea_allowed !== undefined ? Boolean(data.eaAllowed !== undefined ? data.eaAllowed : data.ea_allowed) : true,
      scalingEnabled: data.scalingEnabled !== undefined || data.scaling_enabled !== undefined ? Boolean(data.scalingEnabled !== undefined ? data.scalingEnabled : data.scaling_enabled) : false,
    };

    const challenge = await this.prisma.challenge.create({
      data: challengeData,
    });

    // Send notification to all traders about the new challenge
    // Only send if challenge is active
    if (challenge.isActive) {
      const traders = await this.prisma.user.findMany({
        where: {
          role: UserRole.TRADER,
        },
        select: {
          id: true,
        },
      });

      // Create notification for each trader
      const notificationPromises = traders.map(trader =>
        this.notificationsService.create(
          trader.id,
          'New Challenge Available',
          `Check out our new ${challenge.name} challenge - ${challenge.accountSize.toLocaleString()} account size on ${challenge.platform}! Get started now.`,
          NotificationType.INFO,
          NotificationCategory.SYSTEM,
        )
      );

      // Send notifications in parallel (don't wait for all to complete)
      Promise.all(notificationPromises).catch(error => {
        console.error('Error sending new challenge notifications:', error);
        // Don't throw - challenge creation should succeed even if notifications fail
      });
    }

    return challenge;
  }

  // Update a challenge

  async update(id: string, data: any) {
    await this.getOne(id); // ensures exists

    // Map frontend snake_case to backend camelCase
    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.accountSize !== undefined || data.account_size !== undefined) {
      updateData.accountSize = parseInt(data.accountSize || data.account_size);
    }
    if (data.price !== undefined) {
      updateData.price = parseInt(data.price);
    }
    if (data.platform !== undefined) {
      // Validate and normalize platform value
      const normalizedPlatform = data.platform && ['MT5', 'MT4', 'CTRADER', 'DXTRADE', 'BYBIT', 'PT5', 'TRADELOCKER'].includes(data.platform.toUpperCase())
        ? data.platform.toUpperCase()
        : 'MT5';
      updateData.platform = normalizedPlatform as ChallengePlatform;
    }
    if (data.phase1TargetPercent !== undefined || data.phase1_profit_target !== undefined) {
      updateData.phase1TargetPercent = parseFloat(data.phase1TargetPercent || data.phase1_profit_target);
    }
    if (data.phase2TargetPercent !== undefined || data.phase2_profit_target !== undefined) {
      updateData.phase2TargetPercent = parseFloat(data.phase2TargetPercent || data.phase2_profit_target);
    }
    if (data.dailyDrawdownPercent !== undefined || data.max_daily_drawdown !== undefined) {
      updateData.dailyDrawdownPercent = parseFloat(data.dailyDrawdownPercent || data.max_daily_drawdown);
    }
    if (data.overallDrawdownPercent !== undefined || data.max_overall_drawdown !== undefined) {
      updateData.overallDrawdownPercent = parseFloat(data.overallDrawdownPercent || data.max_overall_drawdown);
    }
    if (data.minTradingDays !== undefined || data.min_trading_days !== undefined) {
      updateData.minTradingDays = parseInt(data.minTradingDays || data.min_trading_days);
    }
    if (data.maxTradingDays !== undefined || data.max_trading_days !== undefined) {
      updateData.maxTradingDays = data.maxTradingDays || data.max_trading_days ? parseInt(data.maxTradingDays || data.max_trading_days) : null;
    }
    if (data.challengeType !== undefined || data.challenge_type !== undefined) {
      updateData.challengeType = data.challengeType || data.challenge_type;
    }
    if (data.profitSplit !== undefined || data.profit_split !== undefined) {
      updateData.profitSplit = parseFloat(String(data.profitSplit || data.profit_split));
    }
    if (data.isActive !== undefined || data.is_active !== undefined) {
      updateData.isActive = Boolean(data.isActive !== undefined ? data.isActive : data.is_active);
    }
    if (data.newsTradingAllowed !== undefined || data.news_trading_allowed !== undefined) {
      updateData.newsTradingAllowed = Boolean(data.newsTradingAllowed !== undefined ? data.newsTradingAllowed : data.news_trading_allowed);
    }
    if (data.weekendHoldingAllowed !== undefined || data.weekend_holding_allowed !== undefined) {
      updateData.weekendHoldingAllowed = Boolean(data.weekendHoldingAllowed !== undefined ? data.weekendHoldingAllowed : data.weekend_holding_allowed);
    }
    if (data.eaAllowed !== undefined || data.ea_allowed !== undefined) {
      updateData.eaAllowed = Boolean(data.eaAllowed !== undefined ? data.eaAllowed : data.ea_allowed);
    }
    if (data.scalingEnabled !== undefined || data.scaling_enabled !== undefined) {
      updateData.scalingEnabled = Boolean(data.scalingEnabled !== undefined ? data.scalingEnabled : data.scaling_enabled);
    }

    return this.prisma.challenge.update({
      where: { id },
      data: updateData,
    });
  }

  // Delete a challenge

  async delete(id: string) {

    const linkedAccounts = await this.prisma.tradingAccount.count({

      where: { challengeId: id },

    });

    if (linkedAccounts > 0) {

      throw new BadRequestException(

        'Challenge cannot be deleted because it is linked to existing trading accounts.'

      );

    }

    return this.prisma.challenge.delete({ where: { id } });

  }

}

