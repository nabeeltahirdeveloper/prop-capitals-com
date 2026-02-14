import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns the spot wallet for a given trading account.
   * Aggregates all open SPOT trades into per-asset holdings.
   */
  async getWallet(accountId: string, userId?: string) {
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
      include: { challenge: true },
    });

    if (!account) {
      throw new NotFoundException('Trading account not found');
    }

    if (userId && account.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    // Fetch all open SPOT trades for this account
    const openSpotTrades = await (this.prisma.trade as any).findMany({
      where: {
        tradingAccountId: accountId,
        positionType: 'SPOT',
        closedAt: null,
      },
      orderBy: { openedAt: 'asc' },
    });

    // Fetch all open pending SPOT orders
    const pendingSpotOrders = await (this.prisma.pendingOrder as any).findMany({
      where: {
        tradingAccountId: accountId,
        positionType: 'SPOT',
        status: 'PENDING',
      },
      orderBy: { createdAt: 'asc' },
    });

    // Aggregate by base asset (e.g. BTCUSDT → BTC)
    const assetMap = new Map<string, {
      asset: string;
      symbol: string;
      totalQty: number;
      weightedCostSum: number;
      openTrades: any[];
    }>();

    for (const trade of openSpotTrades) {
      const asset = this.getBaseAsset(trade.symbol);
      if (!asset) continue;

      if (!assetMap.has(asset)) {
        assetMap.set(asset, {
          asset,
          symbol: trade.symbol,
          totalQty: 0,
          weightedCostSum: 0,
          openTrades: [],
        });
      }

      const entry = assetMap.get(asset)!;
      const qty = Number(trade.volume);
      entry.totalQty += qty;
      entry.weightedCostSum += qty * Number(trade.openPrice);
      entry.openTrades.push(trade);
    }

    const assets = Array.from(assetMap.values()).map((entry) => ({
      asset: entry.asset,
      symbol: entry.symbol,
      totalQty: entry.totalQty,
      avgCostUsd: entry.totalQty > 0 ? entry.weightedCostSum / entry.totalQty : 0,
      openTrades: entry.openTrades,
    }));

    return {
      accountId,
      balance: account.balance,
      equity: account.equity,
      initialBalance: account.initialBalance,
      assets,
      pendingSpotOrders,
    };
  }

  private getBaseAsset(symbol: string): string | null {
    const sym = (symbol || '').toUpperCase().replace('/', '');
    if (sym.endsWith('USDT')) return sym.replace('USDT', '');
    if (sym.endsWith('USD')) return sym.replace('USD', '');
    return null;
  }
}
