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
import * as fs from 'fs';
import * as path from 'path';

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
    origin: true, // Allow all origins in development
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

  // Track OHLC state per symbol+timeframe so WS candles have real bodies
  private candleStateMap = new Map<string, { open: number; high: number; low: number; candleTime: number }>();

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
    // #region agent log
    const logPath = path.join(process.cwd(), 'debug-d59405.log');
    const payload = { sessionId: 'd59405', runId: 'run1', hypothesisId: 'H2', location: 'candles.gateway.ts:afterInit', message: 'CandlesGateway initialized (root namespace)', data: {}, timestamp: Date.now() };
    try { fs.appendFileSync(logPath, JSON.stringify(payload) + '\n'); } catch (_) {}
    fetch('http://127.0.0.1:7718/ingest/4d92c47f-44a6-4394-954a-da3f7a6d4e37', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd59405' }, body: JSON.stringify(payload) }).catch(() => {});
    // #endregion
    this.logger.log('🔌 Candles WebSocket Gateway initialized');
    this.logger.log(`📡 Server namespace: root (/)`);
    this.startCandleEmitter();
  }

  async handleConnection(client: Socket, ...args: any[]) {
    // #region agent log
    const token = client.handshake.auth?.token || client.handshake.query?.token;
    const logPath = path.join(process.cwd(), 'debug-d59405.log');
    const connPayload = { sessionId: 'd59405', runId: 'run1', hypothesisId: 'H2,H3', location: 'candles.gateway.ts:handleConnection', message: 'CandlesGateway connection attempt', data: { clientId: client.id, hasToken: !!token, tokenLength: token ? String(token).length : 0 }, timestamp: Date.now() };
    try { fs.appendFileSync(logPath, JSON.stringify(connPayload) + '\n'); } catch (_) {}
    fetch('http://127.0.0.1:7718/ingest/4d92c47f-44a6-4394-954a-da3f7a6d4e37', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd59405' }, body: JSON.stringify(connPayload) }).catch(() => {});
    // #endregion
    try {
      if (!token) {
        this.logger.warn(`❌ Client ${client.id} connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);

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

      // #region agent log
      const successPayload = { sessionId: 'd59405', runId: 'run1', hypothesisId: 'H3,H5', location: 'candles.gateway.ts:handleConnection', message: 'CandlesGateway auth success', data: { clientId: client.id }, timestamp: Date.now() };
      try { fs.appendFileSync(path.join(process.cwd(), 'debug-d59405.log'), JSON.stringify(successPayload) + '\n'); } catch (_) {}
      fetch('http://127.0.0.1:7718/ingest/4d92c47f-44a6-4394-954a-da3f7a6d4e37', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd59405' }, body: JSON.stringify(successPayload) }).catch(() => {});
      // #endregion
      this.logger.log(`✅ Client connected: ${client.id} (User: ${payload.email})`);
    } catch (error) {
      // #region agent log
      const errPayload = { sessionId: 'd59405', runId: 'run1', hypothesisId: 'H5', location: 'candles.gateway.ts:handleConnection', message: 'CandlesGateway connection error', data: { clientId: client.id, errorMessage: error?.message }, timestamp: Date.now() };
      try { fs.appendFileSync(path.join(process.cwd(), 'debug-d59405.log'), JSON.stringify(errPayload) + '\n'); } catch (_) {}
      fetch('http://127.0.0.1:7718/ingest/4d92c47f-44a6-4394-954a-da3f7a6d4e37', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd59405' }, body: JSON.stringify(errPayload) }).catch(() => {});
      // #endregion
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

        // Build fresh candle from current prices instead of using getHistory
        // This ensures we always emit candles with current/future timestamps
        const promise = Promise.resolve()
          .then(() => {
            const candle = this.buildCandleFromPrice(symbol, timeframe, allPrices);
            
            if (candle) {
              // Emit candle update to this client
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

    // Wait for all candle updates to complete
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

      // Calculate the current candle's start time based on timeframe
      const candleTime = this.getCandleStartTime(now, timeframe);

      // Track OHLC state so candles have real bodies instead of flat dashes
      const key = `${symbol}_${timeframe}`;
      const existing = this.candleStateMap.get(key);
      if (!existing || existing.candleTime !== candleTime) {
        // New candle period — reset state
        this.candleStateMap.set(key, { open: price, high: price, low: price, candleTime });
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
      this.logger.error(`❌ Error building candle from price for ${symbol}: ${error.message}`);
      return null;
    }
  }

  /**
   * Get the start time of the current candle based on timeframe
   */
  private getCandleStartTime(timestamp: number, timeframe: string): number {
    const intervals = {
      'M1': 60000,        // 1 minute
      'M5': 300000,       // 5 minutes
      'M15': 900000,      // 15 minutes
      'M30': 1800000,     // 30 minutes
      'H1': 3600000,      // 1 hour
      'H4': 14400000,     // 4 hours
      'D1': 86400000,     // 1 day
      'W1': 604800000,    // 1 week
      'MN': 2592000000,   // 30 days (approximate month)
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
