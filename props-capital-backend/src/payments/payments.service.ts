import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

import { TradingPhase, TradingAccountStatus, NotificationType, NotificationCategory } from '@prisma/client';

@Injectable()

export class PaymentsService {

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) { }

  async purchaseChallenge(data: any) {

    console.log("PURCHASE DATA:", data);

    const { userId, challengeId, platform, tradingPlatform, trading_platform, brokerPlatform } = data;

    if (!userId || !challengeId) {

      throw new BadRequestException("Missing required fields: userId, challengeId");

    }

    // 1. Validate challenge

    const challenge = await this.prisma.challenge.findUnique({

      where: { id: challengeId },

    });

    if (!challenge) {

      throw new NotFoundException("Challenge not found");

    }

    // Final price

    const finalPrice = challenge.price;

    // 2. Create payment

    const payment = await this.prisma.payment.create({

      data: {

        user: { connect: { id: userId } },

        amount: finalPrice,

        provider: "internal",

        status: "succeeded",

        reference: null,

      },

    });

    // 3. Create trading account (NO brokerServerId needed)

    const initial = challenge.accountSize;

    // Determine the platform to use - check multiple field names sent from frontend
    const selectedPlatform = platform || tradingPlatform || trading_platform || brokerPlatform || challenge.platform;

    // Map frontend platform names to database enum values
    const platformMap = {
      'MT4': 'MT4',
      'MT5': 'MT5',
      'cTrader': 'CTRADER',
      'DXTrade': 'DXTRADE',
      'CTRADER': 'CTRADER',
      'DXTRADE': 'DXTRADE',
    };

    const normalizedPlatform = platformMap[selectedPlatform] || selectedPlatform;

    console.log('🔍 Platform Debug:', {
      received_platform: platform,
      received_tradingPlatform: tradingPlatform,
      received_trading_platform: trading_platform,
      received_brokerPlatform: brokerPlatform,
      challenge_platform: challenge.platform,
      selectedPlatform: selectedPlatform,
      normalizedPlatform: normalizedPlatform
    });

    const account = await this.prisma.tradingAccount.create({

      data: {

        userId,

        challengeId,

        platform: normalizedPlatform, // Save normalized platform enum value

        // brokerServerId: null,

        phase: TradingPhase.PHASE1,

        status: TradingAccountStatus.ACTIVE,

        initialBalance: initial,

        balance: initial,

        equity: initial,

        maxEquityToDate: initial, // CRITICAL: Initialize to starting balance (peak equity starts here)

        brokerLogin: null,

        brokerPassword: null,

      },

    });

    console.log('✅ Account created with platform:', account.platform, 'Account ID:', account.id);

    // Create notification for challenge purchase
    await this.notificationsService.create(
      userId,
      'Challenge Purchased',
      `Your ${challenge.name} challenge has been purchased successfully. Your trading account #${account.id.substring(0, 8)} is now active with a starting balance of $${initial.toLocaleString()}.`,
      NotificationType.SUCCESS,
      NotificationCategory.CHALLENGE,
    );

    return {

      message: "Challenge purchased successfully",

      payment,

      account,

    };

  }

}
