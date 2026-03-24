import { Injectable, Inject, forwardRef, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TradesService } from '../trades/trades.service';
import { PendingOrderRegistryService } from './pending-order-registry.service';

@Injectable()
export class PendingOrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => TradesService))
    private tradesService: TradesService,
    private pendingOrderRegistryService: PendingOrderRegistryService,
  ) { }

  /**
   * Create a new pending order (limit/stop order)
   */
  private static readonly SPOT_SYMBOLS = [
    'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT',
    'BNBUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT',
    'LINKUSDT',
  ];

  async createPendingOrder(data: {
    tradingAccountId: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    orderType: 'LIMIT' | 'STOP' | 'STOP_LIMIT';
    volume: number;
    price: number;
    stopLoss?: number;
    takeProfit?: number;
    positionType?: string;
    leverage?: number;
  }) {
    if (data.orderType === 'STOP_LIMIT') {
      throw new BadRequestException('STOP_LIMIT is not supported yet in runtime registry');
    }

    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: data.tradingAccountId },
    });

    if (!account) {
      throw new NotFoundException('Trading account not found');
    }

    const positionType = data.positionType === 'SPOT' ? 'SPOT' : 'CFD';

    if (positionType === 'SPOT') {
      const sym = String(data.symbol || '').toUpperCase().replace('/', '');
      if (!PendingOrdersService.SPOT_SYMBOLS.includes(sym)) {
        throw new BadRequestException(`Symbol ${data.symbol} is not available for spot trading.`);
      }
    }

    const requestedLeverage = positionType === 'SPOT' ? 1 : Number(data.leverage);
    const effectiveLeverage =
      Number.isFinite(requestedLeverage) && requestedLeverage > 0
        ? requestedLeverage
        : 100;

    if (account.status === ('DAILY_LOCKED' as any)) {
      throw new BadRequestException('Daily loss limit reached. Trading locked until tomorrow.');
    }
    if (account.status === ('DISQUALIFIED' as any)) {
      throw new BadRequestException('Challenge disqualified. Trading is no longer allowed.');
    }
    if (account.status === ('CLOSED' as any) || account.status === ('PAUSED' as any)) {
      throw new BadRequestException('Account is not active for trading.');
    }

    const pendingOrder = await this.prisma.pendingOrder.create({
      data: {
        tradingAccountId: data.tradingAccountId,
        symbol: data.symbol,
        type: data.type,
        orderType: data.orderType,
        volume: data.volume,
        price: data.price,
        stopLoss: data.stopLoss ?? null,
        takeProfit: data.takeProfit ?? null,
        status: 'PENDING',
        positionType,
        leverage: effectiveLeverage,
      } as any,
    });

    this.pendingOrderRegistryService.registerOrder({
      id: pendingOrder.id,
      tradingAccountId: pendingOrder.tradingAccountId,
      symbol: pendingOrder.symbol,
      type: pendingOrder.type,
      orderType: pendingOrder.orderType,
      volume: pendingOrder.volume,
      price: pendingOrder.price,
      stopLoss: pendingOrder.stopLoss,
      takeProfit: pendingOrder.takeProfit,
      status: pendingOrder.status,
    });

    return pendingOrder;
  }

  /**
   * Get all pending orders for a trading account
   */
  async getPendingOrders(accountId: string) {
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Trading account not found');
    }

    const pendingOrders = await this.prisma.pendingOrder.findMany({
      where: {
        tradingAccountId: accountId,
        status: 'PENDING',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return pendingOrders;
  }

  /**
   * Cancel a pending order
   */
  async cancelPendingOrder(orderId: string) {
    const pendingOrder = await this.prisma.pendingOrder.findUnique({
      where: { id: orderId },
    });

    if (!pendingOrder) {
      throw new NotFoundException('Pending order not found');
    }

    const tradingAccount = await this.prisma.tradingAccount.findUnique({
      where: { id: pendingOrder.tradingAccountId },
    });

    const accountStatus = tradingAccount?.status;
    if (accountStatus === ('DAILY_LOCKED' as any)) {
      throw new BadRequestException('Daily loss limit reached. Trading locked until tomorrow.');
    }
    if (accountStatus === ('DISQUALIFIED' as any)) {
      throw new BadRequestException('Challenge disqualified. Trading is no longer allowed.');
    }
    if (accountStatus === ('CLOSED' as any) || accountStatus === ('PAUSED' as any)) {
      throw new BadRequestException('Account is not active for trading.');
    }

    if (pendingOrder.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot cancel order with status: ${pendingOrder.status}`,
      );
    }

    const cancelledOrder = await this.prisma.pendingOrder.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    this.pendingOrderRegistryService.removeOrder(orderId);

    return cancelledOrder;
  }

  /**
   * Execute a pending order - convert it to a trade when price hits
   */
  async executePendingOrder(orderId: string, executionPrice?: number) {
    // Step 1: atomically claim the order
    const claimResult = await this.prisma.pendingOrder.updateMany({
      where: {
        id: orderId,
        status: 'PENDING',
      },
      data: {
        status: 'TRIGGERED',
        triggeredAt: new Date(),
      },
    });

    if (claimResult.count === 0) {
      return null; // 🔥 THIS LINE IS CRITICAL
    }

  

    // Step 2: fetch the claimed order
    const pendingOrder = await this.prisma.pendingOrder.findUnique({
      where: { id: orderId },
      include: { tradingAccount: true },
    });

    if (!pendingOrder) {
      throw new NotFoundException('Pending order not found');
    }

    // Step 3: remove from in-memory registry
    this.pendingOrderRegistryService.removeOrder(orderId);

    const finalPrice = executionPrice ?? pendingOrder.price;

    const tradeData = {
      accountId: pendingOrder.tradingAccountId,
      symbol: pendingOrder.symbol,
      type: pendingOrder.type,
      volume: pendingOrder.volume,
      openPrice: finalPrice,
      closePrice: null,
      profit: 0,
      stopLoss: pendingOrder.stopLoss ?? undefined,
      takeProfit: pendingOrder.takeProfit ?? undefined,
      leverage: (pendingOrder as any).leverage ?? 100,
    };

    try {
      // Step 4: create trade
      const tradeResult = await this.tradesService.createTrade(tradeData);

      // Step 5: mark order as filled
      const filledOrder = await this.prisma.pendingOrder.update({
        where: { id: orderId },
        data: {
          status: 'FILLED',
          filledAt: new Date(),
        },
      });

      return {
        order: filledOrder,
        trade: tradeResult.trade,
        evaluation: tradeResult.evaluation,
      };
    } catch (error) {
      // Step 6: rollback order back to PENDING if trade creation failed
      await this.prisma.pendingOrder.update({
        where: { id: orderId },
        data: {
          status: 'PENDING',
          triggeredAt: null,
        },
      });

      this.pendingOrderRegistryService.registerOrder({
        id: pendingOrder.id,
        tradingAccountId: pendingOrder.tradingAccountId,
        symbol: pendingOrder.symbol,
        type: pendingOrder.type,
        orderType: pendingOrder.orderType,
        volume: pendingOrder.volume,
        price: pendingOrder.price,
        stopLoss: pendingOrder.stopLoss,
        takeProfit: pendingOrder.takeProfit,
        status: 'PENDING',
      });

      throw error;
    }
  }
}