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
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  // No namespace specified = root namespace (/)
  // This is the default behavior for Socket.IO
})
export class CandlesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleDestroy
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(CandlesGateway.name);

  // Track subscriptions per client: clientId -> Map<symbol_timeframe, subscription>
  private subscriptions = new Map<string, Map<string, CandleSubscription>>();

  // Candle update interval (1 second for real-time updates)
  private candleUpdateInterval: NodeJS.Timeout | null = null;

  constructor(
    private jwtService: JwtService,
    @Inject(forwardRef(() => MarketDataService))
    private marketDataService: MarketDataService,
    @Inject(forwardRef(() => PricesService))
    private pricesService: PricesService,
  ) {
    this.logger.log('🔧 CandlesGateway constructor called');
    if (!this.marketDataService) {
      this.logger.error('❌ MarketDataService is null! Dependency injection failed!');
    } else {
      this.logger.log('✅ MarketDataService injected successfully');
    }
    if (!this.pricesService) {
      this.logger.error('❌ PricesService is null! Dependency injection failed!');
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
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`❌ Client ${client.id} connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key-here',
      });

      const userId = payload.sub || payload.userId;
      if (!payload || !userId) {
        this.logger.warn(`❌ Client ${client.id} connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      client.data.userId = userId;
      client.data.email = payload.email;

      // Initialize subscriptions map for this client
      this.subscriptions.set(client.id, new Map());

      this.logger.log(`✅ Client connected: ${client.id} (User: ${payload.email})`);
    } catch (error) {
      this.logger.error(`❌ Client ${client.id} connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    this.logger.log(`🔌 Client disconnected: ${client.id} (User: ${userId || 'unknown'})`);

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

    this.logger.log(`📡 [CANDLES] subscribeCandles received from ${client.id}:`, {
      symbol,
      timeframe,
      payload,
    });

    if (!symbol || !timeframe) {
      this.logger.warn(`⚠️ Client ${client.id} attempted to subscribe without symbol/timeframe`);
      return;
    }

    let clientSubs = this.subscriptions.get(client.id);
    if (!clientSubs) {
      this.logger.warn(`⚠️ Client ${client.id} subscriptions map not found - initializing...`);
      // Initialize if missing (shouldn't happen, but safety check)
      clientSubs = new Map();
      this.subscriptions.set(client.id, clientSubs);
    }

    const key = `${symbol}_${timeframe}`;
    clientSubs.set(key, {
      symbol,
      timeframe,
    });

    this.logger.log(`✅ [CANDLES] Client ${client.id} subscribed to candles: ${symbol}@${timeframe}`);

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

    this.logger.log(`📡 Client ${client.id} unsubscribed from candles: ${symbol}@${timeframe}`);
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
  private async emitCandleUpdates() {
    if (this.subscriptions.size === 0) {
      return; // No subscriptions, skip
    }

    // Get all prices from PricesService (uses existing /prices API data)
    // This is the API that's already being called every second!
    let allPrices: any;
    try {
      allPrices = await this.pricesService.getAllPrices();
      this.logger.debug(`📊 Got prices from /prices API: ${Object.keys(allPrices.forex || {}).length} forex, ${Object.keys(allPrices.crypto || {}).length} crypto`);
    } catch (error) {
      this.logger.error(`❌ Error getting prices: ${error.message}`);
      return;
    }

    // Iterate through all client subscriptions
    const promises: Promise<void>[] = [];

    this.subscriptions.forEach((clientSubs, clientId) => {
      clientSubs.forEach((subscription, key) => {
        const { symbol, timeframe } = subscription;

        // OPTIMIZED: Use getHistory which internally uses synthetic candles built from /prices API
        // This is much faster than external API calls
        const promise = this.marketDataService
          .getHistory(symbol, timeframe, 1)
          .then((candles) => {
            if (!candles || candles.length === 0) {
              // Fallback: Build candle directly from /prices API data
              this.logger.debug(`⚠️ No history for ${symbol}@${timeframe}, building from /prices API`);
              return this.buildCandleFromPrice(symbol, timeframe, allPrices);
            }

            // Get the latest (last) candle
            const latestCandle = candles[candles.length - 1];
            return latestCandle;
          })
          .then((candle) => {
            if (candle) {
              // Emit candle update to this client
              this.emitCandleUpdate(clientId, symbol, timeframe, candle);
            } else {
              this.logger.debug(`⚠️ No candle data for ${symbol}@${timeframe}`);
            }
          })
          .catch((error) => {
            this.logger.error(
              `❌ Error getting candles for ${symbol}@${timeframe}: ${error.message}`,
            );
          });

        promises.push(promise);
      });
    });

    // Wait for all candle fetches to complete
    await Promise.allSettled(promises);
  }

  /**
   * Build candle from current price (fallback when no history available)
   */
  private buildCandleFromPrice(symbol: string, timeframe: string, allPrices: any): any {
    try {
      // Find price in forex or crypto arrays
      const forexPrice = allPrices.forex?.find((f: any) => f.symbol === symbol);
      const cryptoPrice = allPrices.crypto?.find((c: any) => c.symbol === symbol);
      const priceData = forexPrice || cryptoPrice;

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

      // Create a simple candle from current price
      return {
        time: now,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 0,
      };
    } catch (error) {
      this.logger.error(`❌ Error building candle from price for ${symbol}: ${error.message}`);
      return null;
    }
  }

  /**
   * Emit candle update to specific client
   */
  private emitCandleUpdate(
    clientId: string,
    symbol: string,
    timeframe: string,
    candle: { time: number; open: number; high: number; low: number; close: number; volume: number },
  ) {
    const client = this.server.sockets.sockets.get(clientId);
    if (!client || !client.connected) {
      this.logger.debug(`⚠️ Client ${clientId} not connected, skipping candle emit`);
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
    this.logger.log(`📤 [CANDLES] Emitting candleUpdate to ${clientId}: ${symbol}@${timeframe}`, {
      time: candle.time,
      close: candle.close,
      high: candle.high,
      low: candle.low,
    });

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
