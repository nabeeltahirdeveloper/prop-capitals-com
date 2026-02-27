import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PricesService } from '../prices/prices.service';
import { BinanceMarketService } from './binance-market.service';
import { BinanceWebSocketService } from '../prices/binance-websocket.service';
import { Candlestick } from '../prices/twelve-data.service';
import { ResilientHttpService } from 'src/common/resilient-http.service';
import { MassiveWebSocketService } from '../prices/massive-websocket.service';

interface CandleCache {
  candles: Candlestick[];
  timestamp: number;
  symbol: string;
  timeframe: string;
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  // Candle cache to reduce API calls
  private readonly candleCache = new Map<string, CandleCache>();
  private readonly CANDLE_CACHE_TTL = 60000; // 1 minute cache

  // Circuit breaker for historical API
  private historicalApiFailures = 0;
  private historicalApiLastFailure = 0;
  private readonly CIRCUIT_BREAKER_THRESHOLD = 3;
  private readonly CIRCUIT_BREAKER_RESET_MS = 300000; // 5 minutes

  // Synthetic candle storage (built from real-time data)
  private syntheticCandles = new Map<string, Candlestick[]>();
  private lastSyntheticUpdate = new Map<string, number>();

  private readonly FOREX_SYMBOLS = [
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

  private readonly CRYPTO_SYMBOLS: { [symbol: string]: string } = {
    'BTC/USD': 'bitcoin',
    'ETH/USD': 'ethereum',
    'XRP/USD': 'ripple',
    'SOL/USD': 'solana',
    'ADA/USD': 'cardano',
    'DOGE/USD': 'dogecoin',
    'BNB/USD': 'binancecoin',
    'AVAX/USD': 'avalanche-2',
    'DOT/USD': 'polkadot',
  //  'MATIC/USD': 'matic-network',
    'LINK/USD': 'chainlink',
  };

  constructor(
    private readonly pricesService: PricesService,
    private readonly binanceMarketService: BinanceMarketService,
    private readonly binanceWebSocketService: BinanceWebSocketService,
    private readonly massiveWebSocketService: MassiveWebSocketService,
    private readonly httpService: ResilientHttpService,
  ) {
    // Start synthetic candle builder for forex
    this.startSyntheticCandleBuilder();
  }

  private isForexSymbol(symbol: string): boolean {
    return this.FOREX_SYMBOLS.includes(symbol);
  }

  private isCryptoSymbol(symbol: string): boolean {
    return symbol in this.CRYPTO_SYMBOLS;
  }

  private normalizeSymbol(symbol: string): string {
    if (!symbol) return symbol;
    const s = String(symbol).toUpperCase();
    if (s.includes('/')) return s;
    if (s.endsWith('USDT')) return `${s.replace(/USDT$/, '')}/USD`;
    if (s.length >= 6 && /^[A-Z]+$/.test(s)) return `${s.slice(0, 3)}/${s.slice(3)}`;
    return s;
  }

  private getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  /**
   * Get Current Price (WebSocket Optimized)
   */
  async getCurrentPrice(symbol: string) {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    try {
      // 1. FOREX (Massive WS)
      if (this.isForexSymbol(normalizedSymbol)) {
        const wsPrice = this.massiveWebSocketService.getPrice(normalizedSymbol);
        if (wsPrice) {
          return {
            symbol: normalizedSymbol,
            price: wsPrice.bid,
            bid: wsPrice.bid,
            ask: wsPrice.ask,
            change: this.pricesService.getChangePercent(normalizedSymbol, wsPrice.bid),
            timestamp: new Date(wsPrice.timestamp).toISOString(),
          };
        }
        // Fallback to PricesService (Cached REST) if WS is warming up
        const all = await this.pricesService.getAllPrices();
        const data = all.forex.find((f) => f.symbol === normalizedSymbol);
        if (data) return { ...data, price: data.bid, timestamp: all.timestamp };
      }

      // 2. CRYPTO (Binance WS)
      if (this.isCryptoSymbol(normalizedSymbol)) {
        const wsPrice = this.binanceWebSocketService.getPrice(normalizedSymbol);
        if (wsPrice && this.binanceWebSocketService.isWSConnected()) {
          return {
            symbol: normalizedSymbol,
            price: wsPrice.bid,
            bid: wsPrice.bid,
            ask: wsPrice.ask,
            change: this.pricesService.getChangePercent(normalizedSymbol, wsPrice.bid),
            timestamp: new Date(wsPrice.timestamp).toISOString(),
          };
        }
        const all = await this.pricesService.getAllPrices();
        const data = all.crypto.find((c) => c.symbol === normalizedSymbol);
        if (data) return { ...data, price: data.bid, timestamp: all.timestamp };
      }

      throw new NotFoundException(`Symbol ${normalizedSymbol} not available`);
    } catch (e) {
      this.logger.warn(`Price fetch failed for ${normalizedSymbol}: ${this.getErrorMessage(e)}`);
      throw e;
    }
  }

  /**
   * Check if circuit breaker is open (API is failing too much)
   */
  private isCircuitBreakerOpen(): boolean {
    if (this.historicalApiFailures < this.CIRCUIT_BREAKER_THRESHOLD) {
      return false;
    }
    // Check if enough time has passed to reset
    if (Date.now() - this.historicalApiLastFailure > this.CIRCUIT_BREAKER_RESET_MS) {
      this.historicalApiFailures = 0;
      this.logger.log('📊 Historical API circuit breaker reset');
      return false;
    }
    return true;
  }

  /**
   * Record API failure for circuit breaker
   */
  private recordApiFailure(): void {
    this.historicalApiFailures++;
    this.historicalApiLastFailure = Date.now();
    if (this.historicalApiFailures >= this.CIRCUIT_BREAKER_THRESHOLD) {
      this.logger.warn(
        `⚠️ Historical API circuit breaker OPEN after ${this.historicalApiFailures} failures. ` +
        `Using synthetic data for ${this.CIRCUIT_BREAKER_RESET_MS / 1000}s`
      );
    }
  }

  /**
   * Record API success for circuit breaker
   */
  private recordApiSuccess(): void {
    if (this.historicalApiFailures > 0) {
      this.logger.log('✅ Historical API recovered');
    }
    this.historicalApiFailures = 0;
  }

  /**
   * Get Real History with Fallback to Synthetic Data
   */
  async getHistory(
    symbol: string,
    timeframe: string = 'M5',
    limit: number = 100,
  ): Promise<Candlestick[]> {
    const normalizedSymbol = this.normalizeSymbol(symbol);
    try {
      // Check cache first
      const cacheKey = `${normalizedSymbol}:${timeframe}:${limit}`;
      const cached = this.candleCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.CANDLE_CACHE_TTL) {
        return cached.candles;
      }

      if (this.isForexSymbol(normalizedSymbol)) {
        // Check circuit breaker
        if (this.isCircuitBreakerOpen()) {
          this.logger.debug(`Circuit breaker open, using synthetic data for ${normalizedSymbol}`);
          return this.getSyntheticCandles(normalizedSymbol, timeframe, limit);
        }

        // Try to fetch real historical data
        try {
          const candles = await this.massiveWebSocketService.getHistory(
            normalizedSymbol,
            timeframe,
            limit,
          );

          if (candles && candles.length > 0) {
            this.recordApiSuccess();
            // Cache the result
            this.candleCache.set(cacheKey, {
              candles,
              timestamp: Date.now(),
              symbol,
              timeframe,
            });
            return candles;
          }

          // API returned empty - use synthetic fallback
          this.logger.debug(`No historical data for ${symbol}, using synthetic fallback`);
          this.recordApiFailure();
          return this.getSyntheticCandles(normalizedSymbol, timeframe, limit);

        } catch (apiError) {
          this.logger.warn(`Historical API error for ${normalizedSymbol}: ${this.getErrorMessage(apiError)}`);
          this.recordApiFailure();
          return this.getSyntheticCandles(normalizedSymbol, timeframe, limit);
        }
      }

      if (this.isCryptoSymbol(normalizedSymbol)) {
        // ✅ Binance Real History (more reliable)
        const candles = await this.binanceMarketService.getCryptoCandles(
          normalizedSymbol,
          timeframe,
          limit,
        );
        return candles as unknown as Candlestick[];
      }

      return [];
    } catch (error) {
      this.logger.error(`History failed for ${normalizedSymbol}: ${this.getErrorMessage(error)}`);
      // Last resort: return synthetic candles
      if (this.isForexSymbol(normalizedSymbol)) {
        return this.getSyntheticCandles(normalizedSymbol, timeframe, limit);
      }
      return [];
    }
  }

  /**
   * Start background process to build synthetic candles from real-time data
   */
  private startSyntheticCandleBuilder(): void {
    // Update synthetic candles every 5 seconds
    setInterval(() => {
      this.buildSyntheticCandles();
    }, 5000);

    this.logger.log('📊 Synthetic candle builder started');
  }

  /**
   * Build synthetic candles from real-time WebSocket data
   * Creates M1 candles that can be aggregated to larger timeframes
   */
  private buildSyntheticCandles(): void {
    const now = Date.now();
    const candleInterval = 60000; // 1 minute candles (M1)

    this.FOREX_SYMBOLS.forEach((symbol) => {
      const price = this.massiveWebSocketService.getPrice(symbol);
      if (!price) return;

      const currentPrice = price.bid;
      const currentMinute = Math.floor(now / candleInterval) * candleInterval;

      let candles = this.syntheticCandles.get(symbol) || [];
      const lastUpdate = this.lastSyntheticUpdate.get(symbol) || 0;

      // Check if we need to start a new candle
      if (candles.length === 0 || currentMinute > candles[candles.length - 1].time) {
        // Start new candle
        candles.push({
          time: currentMinute,
          open: currentPrice,
          high: currentPrice,
          low: currentPrice,
          close: currentPrice,
          volume: 0,
        });
      } else {
        // Update current candle
        const currentCandle = candles[candles.length - 1];
        currentCandle.high = Math.max(currentCandle.high, currentPrice);
        currentCandle.low = Math.min(currentCandle.low, currentPrice);
        currentCandle.close = currentPrice;
      }

      // Keep only last 500 M1 candles (about 8 hours)
      if (candles.length > 500) {
        candles = candles.slice(-500);
      }

      this.syntheticCandles.set(symbol, candles);
      this.lastSyntheticUpdate.set(symbol, now);
    });
  }

  /**
   * Get synthetic candles for a symbol with timeframe aggregation
   */
  private getSyntheticCandles(
    symbol: string,
    timeframe: string,
    limit: number,
  ): Candlestick[] {
    const m1Candles = this.syntheticCandles.get(symbol) || [];

    if (m1Candles.length === 0) {
      // Generate minimal candles from current price
      return this.generateMinimalCandles(symbol, limit);
    }

    // Aggregate M1 candles to requested timeframe
    const aggregated = this.aggregateCandles(m1Candles, timeframe);
    return aggregated.slice(-limit);
  }

  /**
   * Generate minimal candles from current price when no history available
   */
  private generateMinimalCandles(symbol: string, limit: number): Candlestick[] {
    const price = this.massiveWebSocketService.getPrice(symbol);
    if (!price) return [];

    const currentPrice = price.bid;
    const now = Date.now();
    const interval = 300000; // 5 minutes
    const candles: Candlestick[] = [];

    // Generate candles going back in time
    for (let i = limit - 1; i >= 0; i--) {
      const time = now - i * interval;
      // Add small random variation for realism
      const variation = (Math.random() - 0.5) * 0.001 * currentPrice;
      const candlePrice = currentPrice + variation;
      const spread = symbol === 'USD/JPY' ? 0.02 : 0.0002;

      candles.push({
        time,
        open: candlePrice - spread / 2,
        high: candlePrice + spread,
        low: candlePrice - spread,
        close: candlePrice + spread / 2,
        volume: 0,
      });
    }

    // Make sure last candle matches current price
    if (candles.length > 0) {
      const lastCandle = candles[candles.length - 1];
      lastCandle.close = currentPrice;
      lastCandle.time = now;
    }

    return candles;
  }

  /**
   * Aggregate M1 candles to larger timeframes
   */
  private aggregateCandles(m1Candles: Candlestick[], timeframe: string): Candlestick[] {
    const multipliers: { [key: string]: number } = {
      M1: 1,
      M5: 5,
      M15: 15,
      M30: 30,
      H1: 60,
      H4: 240,
      D1: 1440,
    };

    const multiplier = multipliers[timeframe] || 5;
    if (multiplier === 1) return m1Candles;

    const aggregated: Candlestick[] = [];
    const intervalMs = multiplier * 60000;

    for (let i = 0; i < m1Candles.length; i += multiplier) {
      const batch = m1Candles.slice(i, i + multiplier);
      if (batch.length === 0) continue;

      const aggregatedCandle: Candlestick = {
        time: Math.floor(batch[0].time / intervalMs) * intervalMs,
        open: batch[0].open,
        high: Math.max(...batch.map((c) => c.high)),
        low: Math.min(...batch.map((c) => c.low)),
        close: batch[batch.length - 1].close,
        volume: batch.reduce((sum, c) => sum + c.volume, 0),
      };

      aggregated.push(aggregatedCandle);
    }

    return aggregated;
  }

  /**
   * Get Unified Prices for Watchlist
   */
  async getUnifiedPrices(symbolList: string[] = []) {
    const targetSymbols =
      symbolList.length > 0
        ? symbolList.map((s) => this.normalizeSymbol(s))
        : [...this.FOREX_SYMBOLS, ...Object.keys(this.CRYPTO_SYMBOLS)];

    const promises = targetSymbols.map(async (symbol) => {
      try {
        const priceData = await this.getCurrentPrice(symbol);
        return {
          symbol: priceData.symbol,
          bid: priceData.bid,
          ask: priceData.ask,
          price: priceData.price,
          change: priceData.change ?? 0,
          timestamp: new Date(priceData.timestamp).getTime(),
        };
      } catch (e) {
        return null;
      }
    });

    const prices = await Promise.all(promises);
    return prices.filter((p) => p !== null);
  }

  /**
   * Get Crypto Quotes
   */
  async getCryptoQuotes(symbols: string[]) {
    const data = await this.getUnifiedPrices(symbols);
    return data.map((p) => ({
      symbol: p.symbol,
      bid: p.bid,
      ask: p.ask,
      price: p.price,
      priceChangePercent: 0,
    }));
  }

  // Keep compatibility for other services
  async getCryptoCandles(symbol: string, timeframe: string, limit: number) {
    return this.binanceMarketService.getCryptoCandles(symbol, timeframe, limit);
  }

  /**
   * Get circuit breaker status (for debugging/monitoring)
   */
  getCircuitBreakerStatus() {
    return {
      failures: this.historicalApiFailures,
      isOpen: this.isCircuitBreakerOpen(),
      lastFailure: this.historicalApiLastFailure
        ? new Date(this.historicalApiLastFailure).toISOString()
        : null,
      syntheticCandlesCounts: Object.fromEntries(
        Array.from(this.syntheticCandles.entries()).map(([k, v]) => [k, v.length])
      ),
    };
  }
}

export type { Candlestick };
