import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TradesService } from './trades.service';
import { MarketDataService } from '../market-data/market-data.service';
import { TradingEventsGateway } from '../websocket/trading-events.gateway';

interface PositionToClose {
  tradeId: string;
  symbol: string;
  type: string;
  closePrice: number;
  profit: number;
  closeReason: 'TP_HIT' | 'SL_HIT';
  accountId: string;
}

@Injectable()
export class TpSlMonitorService {
  private readonly logger = new Logger(TpSlMonitorService.name);
  private isProcessing = false; // Prevent concurrent executions

  constructor(
    private readonly prisma: PrismaService,
    private readonly tradesService: TradesService,
    private readonly marketDataService: MarketDataService,
    private readonly tradingEventsGateway: TradingEventsGateway,
  ) {}

  /**
   * Check all open positions for TP/SL hits every 1 second
   * Runs: Every 1 second
   */
  @Cron(CronExpression.EVERY_SECOND)
  async checkAllPositions() {
    // Prevent concurrent executions
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      // 1. Get all open positions with TP or SL set
      const openPositions = await this.prisma.trade.findMany({
        where: {
          closePrice: null, // Only open positions
          OR: [
            { stopLoss: { not: null } },
            { takeProfit: { not: null } },
          ],
          tradingAccount: {
            status: 'ACTIVE', // Only active accounts
            NOT: {
              id: 'demo-account', // Skip demo accounts
            },
          },
        },
        include: {
          tradingAccount: {
            select: {
              id: true,
              status: true,
            },
          },
        },
      });

      if (openPositions.length === 0) {
        // No positions to check - silent return
        return;
      }

      // 2. Get unique symbols from all positions
      const symbols = [...new Set(openPositions.map(pos => pos.symbol))];

      // 3. Fetch current prices for all symbols (WebSocket-backed)
      const pricesData = await this.marketDataService.getUnifiedPrices(symbols);
      
      // Create a price map for quick lookup
      const priceMap = new Map(
        pricesData.map(p => [p.symbol, { bid: p.bid, ask: p.ask }])
      );

      // 4. Check each position for TP/SL hit
      const positionsToClose: PositionToClose[] = [];

      for (const position of openPositions) {
        const prices = priceMap.get(position.symbol);
        
        if (!prices) {
          // Price not available for this symbol - skip
          continue;
        }

        // Determine current price based on position type
        // BUY positions close at BID (selling)
        // SELL positions close at ASK (buying back)
        const currentPrice = position.type === 'BUY' ? prices.bid : prices.ask;

        let shouldClose = false;
        let closeReason: 'TP_HIT' | 'SL_HIT' | null = null;

        // Check Take Profit
        if (position.takeProfit !== null) {
          if (position.type === 'BUY' && currentPrice >= position.takeProfit) {
            shouldClose = true;
            closeReason = 'TP_HIT';
          } else if (position.type === 'SELL' && currentPrice <= position.takeProfit) {
            shouldClose = true;
            closeReason = 'TP_HIT';
          }
        }

        // Check Stop Loss (only if TP not hit)
        if (!shouldClose && position.stopLoss !== null) {
          if (position.type === 'BUY' && currentPrice <= position.stopLoss) {
            shouldClose = true;
            closeReason = 'SL_HIT';
          } else if (position.type === 'SELL' && currentPrice >= position.stopLoss) {
            shouldClose = true;
            closeReason = 'SL_HIT';
          }
        }

        if (shouldClose && closeReason) {
          // Calculate profit
          const priceDiff = position.type === 'BUY'
            ? currentPrice - position.openPrice
            : position.openPrice - currentPrice;

          // Check if crypto or forex
          const isCrypto = this.isCryptoSymbol(position.symbol);
          const contractSize = isCrypto ? 1 : 100000;
          const profit = priceDiff * position.volume * contractSize;

          positionsToClose.push({
            tradeId: position.id,
            symbol: position.symbol,
            type: position.type,
            closePrice: currentPrice,
            profit,
            closeReason,
            accountId: position.tradingAccount.id,
          });
        }
      }

      // 5. Close positions that hit TP/SL
      if (positionsToClose.length > 0) {
        this.logger.log(`🎯 Auto-closing ${positionsToClose.length} positions due to TP/SL hits`);

        for (const position of positionsToClose) {
          try {
            await this.tradesService.updateTrade(position.tradeId, {
              closePrice: position.closePrice,
              profit: position.profit,
              closeReason: position.closeReason,
            });

            this.logger.log(
              `✅ Position auto-closed: ${position.symbol} ${position.type} at ${position.closePrice} (${position.closeReason}) - P/L: ${position.profit >= 0 ? '+' : ''}${position.profit.toFixed(2)}`
            );

            // Emit WebSocket event to notify frontend in real-time
            this.tradingEventsGateway.emitPositionClosed(position.accountId, {
              tradeId: position.tradeId,
              symbol: position.symbol,
              type: position.type,
              closePrice: position.closePrice,
              profit: position.profit,
              closeReason: position.closeReason,
              timestamp: new Date().toISOString(),
            });
          } catch (error) {
            // Handle "already closed" gracefully (race condition with manual close)
            if (error.message?.includes('already closed')) {
              this.logger.warn(`⚠️ Position ${position.tradeId} already closed - race condition detected`);
            } else {
              this.logger.error(
                `❌ Failed to auto-close position ${position.tradeId}: ${error.message}`,
                error.stack
              );
            }
          }
        }
      }
    } catch (error) {
      this.logger.error(`❌ Error checking positions for TP/SL: ${error.message}`, error.stack);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Helper to check if symbol is crypto
   */
  private isCryptoSymbol(symbol: string): boolean {
    return symbol.includes('BTC') || 
           symbol.includes('ETH') || 
           symbol.includes('SOL') || 
           symbol.includes('XRP') ||
           symbol.includes('ADA') || 
           symbol.includes('DOGE');
  }
}


