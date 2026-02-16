import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

export interface Candlestick {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Massive.com WebSocket Service for Forex Real-Time Prices
 * Based on: https://massive.com/docs/websocket/forex/quotes
 *
 * Message format for quotes (ev: "C"):
 * {
 *   ev: "C",        // Event type: Quote
 *   p: "EUR/USD",   // Pair (with slash - actual format from API)
 *   x: 48,          // Exchange ID
 *   a: 1.0852,      // Ask price
 *   b: 1.0850,      // Bid price
 *   t: 1705435200000 // Timestamp in Unix MS
 * }
 */
@Injectable()
export class MassiveWebSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MassiveWebSocketService.name);
  private ws: WebSocket | null = null;
  private readonly apiKey: string;
  private readonly wsUrl = 'wss://socket.massive.com/forex'; // Real-time forex endpoint

  // Forex pairs (API actually uses slash format)
  private readonly massivePairs = [
    'EUR/USD',
    'GBP/USD',
    'USD/JPY',
    'AUD/USD',
    'USD/CAD',
    'USD/CHF',
    'NZD/USD',
    'EUR/GBP',
    'EUR/JPY',
    'GBP/JPY',
    'CAD/JPY',
    'XAU/USD',
    'XAG/USD',
  ];

  // Real-time cache
  private priceCache = new Map<
    string,
    { bid: number; ask: number; timestamp: number }
  >();

  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isConnected = false;
  private authenticated = false;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly BASE_RECONNECT_DELAY = 5000;

  // Historical API retry configuration
  private readonly HISTORY_TIMEOUT_MS = 10000;
  private readonly HISTORY_MAX_RETRIES = 2;
  private readonly HISTORY_RETRY_DELAY_MS = 1000;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('MASSIVE_API_KEY') || '';
  }

  onModuleInit() {
    if (!this.apiKey) {
      this.logger.error(
        '❌ MASSIVE_API_KEY missing! Get your key from: https://massive.com/dashboard/keys',
      );
      // Start mock prices as fallback
      this.startMockPrices();
      return;
    }
    this.logger.log('🚀 Starting Massive.com Forex WebSocket...');
    this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  private connect() {
    try {
      this.logger.log(
        `🔌 Connecting to Massive.com WebSocket (Forex)... Attempt ${this.reconnectAttempts + 1}`,
      );

      this.ws = new WebSocket(this.wsUrl);

      this.ws.on('open', () => {
        this.logger.log(
          '✅ Massive.com WebSocket Connected - Authenticating...',
        );
        this.isConnected = true;
        this.reconnectAttempts = 0; // Reset on successful connection
        this.authenticate();
      });

      this.ws.on('message', (data) => {
        try {
          const messages = JSON.parse(data.toString());

          // Massive sends array of messages
          const msgArray = Array.isArray(messages) ? messages : [messages];

          msgArray.forEach((msg) => {
            // Handle status messages
            if (msg.ev === 'status') {
              this.logger.log(
                `📡 Massive.com Status: ${msg.status} - ${msg.message || ''}`,
              );

              if (msg.status === 'connected') {
                return;
              }

              if (msg.status === 'auth_success') {
                this.logger.log('🔑 Massive.com: Authenticated successfully');
                this.authenticated = true;
                this.subscribe();
                return;
              }

              if (msg.status === 'auth_failed') {
                this.logger.error(
                  '❌ Massive.com: Authentication failed - Check your API key',
                );
                this.authenticated = false;
                // Fall back to mock prices
                this.startMockPrices();
                return;
              }

              return;
            }

            // Handle quote messages (ev: "C")
            // Note: API sends "EUR/USD" format directly (not "EUR-USD")
            if (
              msg.ev === 'C' &&
              msg.p &&
              msg.a !== undefined &&
              msg.b !== undefined
            ) {
              this.updatePriceCache(msg.p, msg.b, msg.a, msg.t);
            }
          });
        } catch (e) {
          // Only log occasionally to prevent spam
          if (Math.random() < 0.01) {
            this.logger.warn(`Failed to parse message: ${e.message}`);
          }
        }
      });

      this.ws.on('close', (code) => {
        this.isConnected = false;
        this.authenticated = false;

        // Calculate exponential backoff delay
        const delay = this.calculateReconnectDelay();

        if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
          this.logger.warn(
            `⚠️ Massive.com WS Closed (Code: ${code}). Reconnecting in ${delay / 1000}s...`,
          );
          this.reconnectAttempts++;
          this.reconnectTimeout = setTimeout(() => this.connect(), delay);
        } else {
          this.logger.error(
            `❌ Max reconnect attempts reached. Switching to mock prices.`,
          );
          this.startMockPrices();
        }
      });

      this.ws.on('error', (err) => {
        this.logger.error(`Massive.com WS Error: ${err.message}`);
      });
    } catch (error) {
      this.logger.error(`Failed to connect to Massive.com: ${error.message}`);

      const delay = this.calculateReconnectDelay();
      if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
        this.reconnectAttempts++;
        this.reconnectTimeout = setTimeout(() => this.connect(), delay);
      } else {
        this.startMockPrices();
      }
    }
  }

  /**
   * Calculate exponential backoff delay for reconnection
   */
  private calculateReconnectDelay(): number {
    const exponentialDelay =
      this.BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts);
    // Cap at 60 seconds
    return Math.min(exponentialDelay, 60000);
  }

  private authenticate() {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    const authMsg = {
      action: 'auth',
      params: this.apiKey,
    };

    this.ws.send(JSON.stringify(authMsg));
    this.logger.log('🔒 Sent authentication...');
  }

  private subscribe() {
    if (!this.authenticated || this.ws?.readyState !== WebSocket.OPEN) return;

    // Subscribe to Quote feed (C) for each forex pair
    // Format matches what API expects
    const subscriptions = this.massivePairs.map(
      (pair) => `C.${pair.replace('/', '-')}`,
    );

    const subscribeMsg = {
      action: 'subscribe',
      params: subscriptions.join(','),
    };

    this.ws.send(JSON.stringify(subscribeMsg));
    this.logger.log(
      `📊 Subscribed to ${this.massivePairs.length} forex quote feeds`,
    );
  }

  private updatePriceCache(
    symbol: string,
    bid: number,
    ask: number,
    timestamp: number,
  ) {
    // Symbol comes as "EUR/USD" from API - use directly
    this.priceCache.set(symbol, {
      bid,
      ask,
      timestamp: timestamp || Date.now(),
    });
  }

  private disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.authenticated = false;
  }

  /**
   * Mock prices for fallback when API is unavailable
   */
  private startMockPrices() {
    if (this.priceCache.size > 0) {
      this.logger.log(
        '📊 Price cache already populated, skipping mock initialization',
      );
      return;
    }

    const basePrices: Record<string, number> = {
      'EUR/USD': 1.16,
      'GBP/USD': 1.338,
      'USD/JPY': 158.06,
      'AUD/USD': 0.6681,
      'USD/CAD': 1.3912,
      'USD/CHF': 0.8025,
      'NZD/USD': 0.5748,
      'EUR/GBP': 0.8666,
      'EUR/JPY': 163.35,
      'GBP/JPY': 191.2,
      'CAD/JPY': 113.6,
      'XAU/USD': 2870.0,
      'XAG/USD': 32.5,
    };

    // Initialize with base prices
    this.massivePairs.forEach((symbol) => {
      const basePrice = basePrices[symbol] || 1.0;
      const spread = symbol.includes('JPY')
        ? 0.02
        : symbol.includes('XAU')
          ? 0.5
          : symbol.includes('XAG')
            ? 0.03
            : 0.0002;
      this.priceCache.set(symbol, {
        bid: basePrice,
        ask: basePrice + spread,
        timestamp: Date.now(),
      });
    });

    // Update prices every second with realistic movement
    setInterval(() => {
      this.massivePairs.forEach((symbol) => {
        const current = this.priceCache.get(symbol);
        if (current) {
          // Random walk: +/- 0.05% movement
          const changePercent = (Math.random() - 0.5) * 0.001;
          const newBid = current.bid * (1 + changePercent);
          const spread = symbol.includes('JPY')
            ? 0.02
            : symbol.includes('XAU')
              ? 0.5
              : symbol.includes('XAG')
                ? 0.03
                : 0.0002;

          this.priceCache.set(symbol, {
            bid: newBid,
            ask: newBid + spread,
            timestamp: Date.now(),
          });
        }
      });
    }, 1000);

    this.logger.log('📊 Mock forex prices initialized (API unavailable)');
  }

  // ============ PUBLIC API ============

  getPrice(symbol: string) {
    return this.priceCache.get(symbol);
  }

  isWSConnected(): boolean {
    return (this.isConnected && this.authenticated) || this.priceCache.size > 0;
  }

  getAllPrices(): Map<string, { bid: number; ask: number; timestamp: number }> {
    return this.priceCache;
  }

  /**
   * Historical data via REST API with retry logic
   */
  async getHistory(
    symbol: string,
    timeframe: string,
    limit: number = 50,
  ): Promise<Candlestick[]> {
    if (!this.apiKey) {
      this.logger.debug('Cannot fetch history: MASSIVE_API_KEY not configured');
      return [];
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.HISTORY_MAX_RETRIES; attempt++) {
      try {
        const result = await this.fetchHistoryOnce(symbol, timeframe, limit);
        if (result.length > 0) {
          return result;
        }
        // Empty result might be valid - don't retry
        return [];
      } catch (error) {
        lastError = error;

        if (attempt < this.HISTORY_MAX_RETRIES) {
          const delay = this.HISTORY_RETRY_DELAY_MS * Math.pow(2, attempt);
          this.logger.debug(
            `[Massive REST] Retry ${attempt + 1}/${this.HISTORY_MAX_RETRIES} for ${symbol} in ${delay}ms`,
          );
          await this.sleep(delay);
        }
      }
    }

    this.logger.warn(
      `[Massive REST] All retries failed for ${symbol}: ${lastError?.message || 'Unknown error'}`,
    );
    return [];
  }

  /**
   * Single attempt to fetch historical data
   */
  private async fetchHistoryOnce(
    symbol: string,
    timeframe: string,
    limit: number,
  ): Promise<Candlestick[]> {
    // Convert symbol format: "EUR/USD" -> "C:EURUSD"
    const massiveTicker = this.convertToMassiveTicker(symbol);

    // Convert timeframe: "M5" -> multiplier=5, timespan="minute"
    const { multiplier, timespan } = this.convertTimeframe(timeframe);

    // Calculate date range based on limit
    const { from, to } = this.calculateDateRange(limit, multiplier, timespan);

    // Build API URL
    const url = `https://api.massive.com/v2/aggs/ticker/${massiveTicker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=desc&limit=${limit}`;

    // Make request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      this.HISTORY_TIMEOUT_MS,
    );

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `HTTP ${response.status}: ${errorText.substring(0, 100)}`,
        );
      }

      const data = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        // This is a normal "no data" response, not an error
        return [];
      }

      // Convert to Candlestick format
      // const candles: Candlestick[] = data.results.map((bar: any) => ({
      //   time: bar.t,
      //   open: bar.o,
      //   high: bar.h,
      //   low: bar.l,
      //   close: bar.c,
      //   volume: bar.v || 0,
      // }));
      // API returns desc order (newest first) so we get today's candles within the limit
      // Reverse to ascending for the chart
      const candles: Candlestick[] = data.results
        .map((bar: any) => ({
          time: Math.floor(bar.t / 1000), // ✅ seconds (lightweight-charts standard)
          open: bar.o,
          high: bar.h,
          low: bar.l,
          close: bar.c,
          volume: bar.v || 0,
        }))
        .reverse();

      this.logger.debug(
        `[Massive REST] Fetched ${candles.length} candles for ${symbol} ${timeframe}`,
      );
      return candles;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`Request timeout for ${symbol}`);
      }
      throw error;
    }
  }

  /**
   * Convert symbol format: "EUR/USD" -> "C:EURUSD"
   */
  private convertToMassiveTicker(symbol: string): string {
    return 'C:' + symbol.replace('/', '');
  }

  /**
   * Convert timeframe: "M5" -> {multiplier: 5, timespan: "minute"}
   */
  private convertTimeframe(timeframe: string): {
    multiplier: number;
    timespan: string;
  } {
    const timeframeMap: Record<
      string,
      { multiplier: number; timespan: string }
    > = {
      M1: { multiplier: 1, timespan: 'minute' },
      M5: { multiplier: 5, timespan: 'minute' },
      M15: { multiplier: 15, timespan: 'minute' },
      M30: { multiplier: 30, timespan: 'minute' },
      H1: { multiplier: 1, timespan: 'hour' },
      H4: { multiplier: 4, timespan: 'hour' },
      D1: { multiplier: 1, timespan: 'day' },
    };

    return timeframeMap[timeframe] || { multiplier: 5, timespan: 'minute' };
  }

  /**
   * Calculate date range for fetching candles
   */
  private calculateDateRange(
    limit: number,
    multiplier: number,
    timespan: string,
  ): { from: string; to: string } {
    const now = new Date();
    const to = now.toISOString().split('T')[0];

    let daysBack: number;

    switch (timespan) {
      case 'minute':
        daysBack = Math.ceil((limit * multiplier) / 1440) + 2;
        break;
      case 'hour':
        daysBack = Math.ceil((limit * multiplier) / 24) + 2;
        break;
      case 'day':
        daysBack = limit * multiplier + 2;
        break;
      default:
        daysBack = 7;
    }

    // Cap at reasonable limits
    if (daysBack > 365) daysBack = 365;

    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - daysBack);
    const from = fromDate.toISOString().split('T')[0];

    return { from, to };
  }

  /**
   * Helper to sleep for a given duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Get service status for debugging
   */
  getStatus() {
    return {
      connected: this.isConnected,
      authenticated: this.authenticated,
      reconnectAttempts: this.reconnectAttempts,
      pricesCount: this.priceCache.size,
      hasApiKey: !!this.apiKey,
    };
  }
}
