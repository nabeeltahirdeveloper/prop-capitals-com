import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TradesService } from '../trades/trades.service';

@Injectable()
export class PendingOrdersService {
  constructor(
    private prisma: PrismaService,
    private tradesService: TradesService,
  ) {}

  /**
   * Create a new pending order (limit/stop order)
   */
  private static readonly SPOT_SYMBOLS = [
    'BTCUSDT','ETHUSDT','SOLUSDT','XRPUSDT','DOGEUSDT',
    'BNBUSDT','ADAUSDT','AVAXUSDT','DOTUSDT','MATICUSDT','LINKUSDT',
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
  }) {
    // Verify trading account exists
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: data.tradingAccountId },
    });

    if (!account) {
      throw new NotFoundException('Trading account not found');
    }

    const positionType = data.positionType === 'SPOT' ? 'SPOT' : 'CFD';

    // Spot-specific validation
    if (positionType === 'SPOT') {
      const sym = String(data.symbol || '').toUpperCase().replace('/', '');
      if (!PendingOrdersService.SPOT_SYMBOLS.includes(sym)) {
        throw new BadRequestException(`Symbol ${data.symbol} is not available for spot trading.`);
      }
    }

    // Block pending order creation when account is locked/disqualified/inactive
    if (account.status === ('DAILY_LOCKED' as any)) {
      throw new BadRequestException('Daily loss limit reached. Trading locked until tomorrow.');
    }
    if (account.status === ('DISQUALIFIED' as any)) {
      throw new BadRequestException('Challenge disqualified. Trading is no longer allowed.');
    }
    if (account.status === ('CLOSED' as any) || account.status === ('PAUSED' as any)) {
      throw new BadRequestException('Account is not active for trading.');
    }

    // Create the pending order
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
      } as any,
    });

    return pendingOrder;
  }

  /**
   * Get all pending orders for a trading account
   */
  async getPendingOrders(accountId: string) {
    // Verify account exists
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new NotFoundException('Trading account not found');
    }

    // Get all pending orders for this account
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
    // Get the pending order
    const pendingOrder = await this.prisma.pendingOrder.findUnique({
      where: { id: orderId },
    });

    if (!pendingOrder) {
      throw new NotFoundException('Pending order not found');
    }

    // Re-check account status before execution
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

    // Check if order is already cancelled or filled
    if (pendingOrder.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot cancel order with status: ${pendingOrder.status}`,
      );
    }

    // Update order status to cancelled
    const cancelledOrder = await this.prisma.pendingOrder.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
    });

    return cancelledOrder;
  }

  /**
   * Execute a pending order - convert it to a trade when price hits
   */
  async executePendingOrder(orderId: string, executionPrice?: number) {
    // Get the pending order
    const pendingOrder = await this.prisma.pendingOrder.findUnique({
      where: { id: orderId },
      include: { tradingAccount: true },
    });

    if (!pendingOrder) {
      throw new NotFoundException('Pending order not found');
    }

    // Check if order is still pending
    if (pendingOrder.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot execute order with status: ${pendingOrder.status}`,
      );
    }

    // Use execution price if provided, otherwise use the order price
    const finalPrice = executionPrice ?? pendingOrder.price;

    // Create a trade from the pending order
    const tradeData = {
      accountId: pendingOrder.tradingAccountId,
      symbol: pendingOrder.symbol,
      type: pendingOrder.type,
      volume: pendingOrder.volume,
      openPrice: finalPrice,
      closePrice: null, // Open trade
      profit: 0, // No profit until closed
      stopLoss: pendingOrder.stopLoss ?? undefined,
      takeProfit: pendingOrder.takeProfit ?? undefined,
    };

    // Create the trade using TradesService (this will handle balance updates and evaluation)
    const tradeResult = await this.tradesService.createTrade(tradeData);

    // Update the pending order status to FILLED
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
  }
}
