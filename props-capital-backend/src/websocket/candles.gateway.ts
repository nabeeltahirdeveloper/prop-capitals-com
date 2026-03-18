import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger, Inject, forwardRef, OnModuleDestroy } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { MarketDataService } from '../market-data/market-data.service';
import { PricesService } from '../prices/prices.service';

interface CandleSubscription {
  symbol: string;
  timeframe: string;
}

/**
 * Candles WebSocket Gateway
 * Handles real-time candle updates for SDK
 * Root namespace (default - no namespace specified = root namespace)
 */
@WebSocketGateway(0, {
  // port 0 = attach to the same HTTP server (port 5002), not a standalone server on port 80
  cors: {
    origin: true,
    credentials: false, // false because client uses JWT in auth payload, not cookies
  },
  // No namespace = root namespace (/)
})
export class CandlesGateway
  implements
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CandlesGateway.name);

  // Track subscriptions per client: clientId -> Map<symbol_timeframe, subscription>
  private subscriptions = new Map<string, Map<string, CandleSubscription>>();

  // Candle update interval (1 second for real-time updates)
  private candleUpdateInterval: NodeJS.Timeout | null = null;

  // Track OHLC state per symbol+timeframe so WS candles have real bodies
  private candleStateMap = new Map<
    string,
    { open: number; high: number; low: number; candleTime: number }
  >();

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => MarketDataService))
    private marketDataService: MarketDataService,
    @Inject(forwardRef(() => PricesService))
    private pricesService: PricesService,
  ) {
    this.logger.log('🔧 CandlesGateway constructor called');
    if (!this.marketDataService) {
      this.logger.error(
        '❌ MarketDataService is null! Dependency injection failed!',
      );
    } else {
      this.logger.log('✅ MarketDataService injected successfully');
    }
    if (!this.pricesService) {
      this.logger.error(
        '❌ PricesService is null! Dependency injection failed!',
      );
    } else {
      this.logger.log('✅ PricesService injected successfully');
    }
  }

  afterInit(server: Server) {
    this.logger.log('🔌 Candles WebSocket Gateway initialized');
    this.logger.log(`📡 Server namespace: root (/)`);
    this.startCandleEmitter();
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(
          `❌ Client ${client.id} connection rejected: No token provided`,
        );
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);

      const userId = payload.sub || payload.userId;
      if (!payload || !userId) {
        this.logger.warn(
          `❌ Client ${client.id} connection rejected: Invalid token`,
        );
        client.disconnect();
        return;
      }

      client.data.userId = userId;
      client.data.email = payload.email;

      // Initialize subscriptions map for this client
      this.subscriptions.set(client.id, new Map());

      this.logger.log(
        `✅ Client connected: ${client.id} (User: ${payload.email})`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Client ${client.id} connection error: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    this.logger.log(
      `🔌 Client disconnected: ${client.id} (User: ${userId || 'unknown'})`,
    );

    // Clean up subscriptions
    this.subscriptions.delete(client.id);
  }

  /**
   * Subscribe to candle updates for a symbol/timeframe
   */
  @SubscribeMessage('subscribeCandles')
  handleSubscribeCandles(
    client: Socket,
    payload: { symbol: string; timeframe: string },
  ) {
    const { symbol, timeframe } = payload;

    this.logger.log(
      `📡 [CANDLES] subscribeCandles received from ${client.id}:`,
      {
        symbol,
        timeframe,
        payload,
      },
    );

    if (!symbol || !timeframe) {
      this.logger.warn(
        `⚠️ Client ${client.id} attempted to subscribe without symbol/timeframe`,
      );
      return;
    }

    let clientSubs = this.subscriptions.get(client.id);
    if (!clientSubs) {
      this.logger.warn(
        `⚠️ Client ${client.id} subscriptions map not found - initializing...`,
      );
      // Initialize if missing (shouldn't happen, but safety check)
      clientSubs = new Map();
      this.subscriptions.set(client.id, clientSubs);
    }

    const key = `${symbol}_${timeframe}`;
    clientSubs.set(key, {
      symbol,
      timeframe,
    });

    this.logger.log(
      `✅ [CANDLES] Client ${client.id} subscribed to candles: ${symbol}@${timeframe}`,
    );

    // Send confirmation
    client.emit('subscription:confirmed', {
      type: 'candles',
      symbol,
      timeframe,
    });
  }

  /**
   * Unsubscribe from candle updates
   */
  @SubscribeMessage('unsubscribeCandles')
  handleUnsubscribeCandles(
    client: Socket,
    payload: { symbol: string; timeframe: string },
  ) {
    const { symbol, timeframe } = payload;

    if (!symbol || !timeframe) {
      return;
    }

    const clientSubs = this.subscriptions.get(client.id);
    if (!clientSubs) {
      return;
    }

    const key = `${symbol}_${timeframe}`;
    clientSubs.delete(key);

    this.logger.log(
      `📡 Client ${client.id} unsubscribed from candles: ${symbol}@${timeframe}`,
    );
  }

  /**
   * Start emitting candle updates every 1 second
   */
  private startCandleEmitter() {
    if (this.candleUpdateInterval) {
      clearInterval(this.candleUpdateInterval);
    }

    this.candleUpdateInterval = setInterval(() => {
      this.emitCandleUpdates();
    }, 1000); // Emit every 1 second for real-time updates

    this.logger.log('📊 Candle emitter started (1s interval)');
  }

  /**
   * Emit candle updates to all subscribed clients
   * Uses /prices API (already being called every second) to build candles
   */
  // private async emitCandleUpdates() {
  //   if (this.subscriptions.size === 0) {
  //     return; // No subscriptions, skip
  //   }

  //   // Get all prices from PricesService (uses existing /prices API data)
  //   // This is the API that's already being called every second!
  //   let allPrices: any;
  //   try {
  //     allPrices = await this.pricesService.getAllPrices();
  //     this.logger.debug(
  //       `📊 Got prices from /prices API: ${(allPrices.forex || []).length} forex, ${(allPrices.crypto || []).length} crypto, ${(allPrices.metals || []).length} metals`,
  //     );
  //   } catch (error) {
  //     this.logger.error(`❌ Error getting prices: ${error.message}`);
  //     return;
  //   }

  //   // Iterate through all client subscriptions
  //   const promises: Promise<void>[] = [];

  //   this.subscriptions.forEach((clientSubs, clientId) => {
  //     clientSubs.forEach((subscription, key) => {
  //       const { symbol, timeframe } = subscription;

  //       // Build fresh candle from current prices instead of using getHistory
  //       // This ensures we always emit candles with current/future timestamps
  //      const promise = Promise.resolve()
  // .then(async () => {
  //   const candle = this.buildCandleFromPrice(
  //     symbol,
  //     timeframe,
  //     allPrices,
  //   );

  //   if (candle) {
  //     await this.marketDataService.processPendingOrdersForSymbol(symbol);

  //     this.emitCandleUpdate(clientId, symbol, timeframe, candle);
  //   } else {
  //     this.logger.debug(`⚠️ No candle data for ${symbol}@${timeframe}`);
  //   }
  // })
  // .catch((error) => {
  //   this.logger.error(
  //     `❌ Error building candle for ${symbol}@${timeframe}: ${error.message}`,
  //   );
  // });

  //       promises.push(promise);
  //     });
  //   });

  //   // Wait for all candle updates to complete
  //   await Promise.allSettled(promises);
  // }
  private async emitCandleUpdates() {
  if (this.subscriptions.size === 0) {
    return;
  }

  let allPrices: any;
  try {
    allPrices = await this.pricesService.getAllPrices();
    this.logger.debug(
      `📊 Got prices from /prices API: ${(allPrices.forex || []).length} forex, ${(allPrices.crypto || []).length} crypto, ${(allPrices.metals || []).length} metals`,
    );
  } catch (error) {
    this.logger.error(`❌ Error getting prices: ${error.message}`);
    return;
  }

  // Step 1: collect unique symbols from all subscriptions
  const uniqueSymbols = new Set<string>();

  this.subscriptions.forEach((clientSubs) => {
    clientSubs.forEach((subscription) => {
      uniqueSymbols.add(subscription.symbol);
    });
  });

  // Step 2: process pending orders once per symbol
  for (const symbol of uniqueSymbols) {
    try {
      await this.marketDataService.processPendingOrdersForSymbol(symbol);
    } catch (error) {
      this.logger.warn(
        `Failed processing pending orders for ${symbol}: ${error.message}`,
      );
    }
  }

  // Step 3: emit candle updates to subscribed clients
  const promises: Promise<void>[] = [];

  this.subscriptions.forEach((clientSubs, clientId) => {
    clientSubs.forEach((subscription) => {
      const { symbol, timeframe } = subscription;

      const promise = Promise.resolve()
        .then(() => {
          const candle = this.buildCandleFromPrice(symbol, timeframe, allPrices);

          if (candle) {
            this.emitCandleUpdate(clientId, symbol, timeframe, candle);
          } else {
            this.logger.debug(`⚠️ No candle data for ${symbol}@${timeframe}`);
          }
        })
        .catch((error) => {
          this.logger.error(
            `❌ Error building candle for ${symbol}@${timeframe}: ${error.message}`,
          );
        });

      promises.push(promise);
    });
  });

  await Promise.allSettled(promises);
}

  /**
   * Build candle from current price (fallback when no history available)
   */
  private buildCandleFromPrice(
    symbol: string,
    timeframe: string,
    allPrices: any,
  ): any {
    try {
      // Find price in forex, crypto, or metals arrays
      const forexPrice = allPrices.forex?.find((f: any) => f.symbol === symbol);
      const cryptoPrice = allPrices.crypto?.find(
        (c: any) => c.symbol === symbol,
      );
      const metalPrice = allPrices.metals?.find(
        (m: any) => m.symbol === symbol,
      );
      const priceData = forexPrice || cryptoPrice || metalPrice;

      if (!priceData) {
        this.logger.debug(`⚠️ No price data found for ${symbol} in prices API`);
        return null;
      }

      const now = Date.now();
      const price = priceData.bid || priceData.price;

      if (!price) {
        this.logger.debug(`⚠️ No bid/price found for ${symbol}`);
        return null;
      }

      // Calculate the current candle's start time based on timeframe
      const candleTime = this.getCandleStartTime(now, timeframe);

      // Track OHLC state so candles have real bodies instead of flat dashes
      const key = `${symbol}_${timeframe}`;
      const existing = this.candleStateMap.get(key);
      if (!existing || existing.candleTime !== candleTime) {
        // New candle period — reset state
        this.candleStateMap.set(key, {
          open: price,
          high: price,
          low: price,
          candleTime,
        });
      } else {
        // Same candle period — expand high/low
        existing.high = Math.max(existing.high, price);
        existing.low = Math.min(existing.low, price);
      }
      const state = this.candleStateMap.get(key)!;

      return {
        time: candleTime,
        open: state.open,
        high: state.high,
        low: state.low,
        close: price,
        volume: 0,
      };
    } catch (error) {
      this.logger.error(
        `❌ Error building candle from price for ${symbol}: ${error.message}`,
      );
      return null;
    }
  }

  /**
   * Get the start time of the current candle based on timeframe
   */
  private getCandleStartTime(timestamp: number, timeframe: string): number {
    const intervals = {
      M1: 60000, // 1 minute
      M5: 300000, // 5 minutes
      M15: 900000, // 15 minutes
      M30: 1800000, // 30 minutes
      H1: 3600000, // 1 hour
      H4: 14400000, // 4 hours
      D1: 86400000, // 1 day
      W1: 604800000, // 1 week
      MN: 2592000000, // 30 days (approximate month)
    };

    const interval = intervals[timeframe] || intervals['M1'];
    return Math.floor(timestamp / interval) * interval;
  }

  /**
   * Emit candle update to specific client
   */
  private emitCandleUpdate(
    clientId: string,
    symbol: string,
    timeframe: string,
    candle: {
      time: number;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: number;
    },
  ) {
    const client = this.server.sockets.sockets.get(clientId);
    if (!client || !client.connected) {
      this.logger.debug(
        `⚠️ Client ${clientId} not connected, skipping candle emit`,
      );
      return;
    }

    const candleData = {
      symbol,
      timeframe,
      candle: {
        time: candle.time, // Milliseconds (SDK's normalizeTime will auto-detect)
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume,
      },
    };

    // Log every emit for debugging (can be reduced later)
    this.logger.log(
      `📤 [CANDLES] Emitting candleUpdate to ${clientId}: ${symbol}@${timeframe}`,
      {
        time: candle.time,
        close: candle.close,
        high: candle.high,
        low: candle.low,
      },
    );

    client.emit('candleUpdate', candleData);
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy() {
    if (this.candleUpdateInterval) {
      clearInterval(this.candleUpdateInterval);
      this.candleUpdateInterval = null;
    }
  }
}
