import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Candlestick } from './market-data.service';
import { ResilientHttpService } from 'src/common/resilient-http.service';

@Injectable()
export class BinanceMarketService {
  private readonly logger = new Logger(BinanceMarketService.name);
  private readonly BINANCE_API = 'https://api.binance.com/api/v3';

  constructor(private readonly httpService: ResilientHttpService) {}

  // Symbol mapping: frontend format -> Binance format
  private readonly SYMBOL_MAP: { [key: string]: string } = {
    'BTC/USD': 'BTCUSDT',
    'ETH/USD': 'ETHUSDT',
    'XRP/USD': 'XRPUSDT',
    'SOL/USD': 'SOLUSDT',
    'ADA/USD': 'ADAUSDT',
    'DOGE/USD': 'DOGEUSDT',
    'BNB/USD': 'BNBUSDT',
    'AVAX/USD': 'AVAXUSDT',
    'DOT/USD': 'DOTUSDT',
    // 'MATIC/USD': 'MATICUSDT',
    'LINK/USD': 'LINKUSDT',
  };

  // Timeframe mapping: our format -> Binance format
  private readonly TIMEFRAME_MAP: { [key: string]: string } = {
    'M1': '1m',
    'M5': '5m',
    'M15': '15m',
    'M30': '30m',
    'H1': '1h',
    'H4': '4h',
    'D1': '1d',
    'W1': '1w',
    'MN': '1M',
  };

  // Cache for candles: key = `binance:candles:{symbol}:{tf}`, value = { data, timestamp, ttl }
  private candlesCache: Map<
    string,
    { data: Candlestick[]; timestamp: number; ttl: number }
  > = new Map();

  // Cache for ticker quotes: key = `binance:quotes`, value = { data, timestamp, ttl }
  private quotesCache: { data: any[]; timestamp: number; ttl: number } | null =
    null;

  // Rate limit tracking
  private rateLimitUntil: number = 0;

  // Cache TTL based on timeframe (in milliseconds)
  private readonly CACHE_TTL: { [key: string]: number } = {
    M1: 30000, // 30 seconds
    M5: 30000, // 30 seconds
    M15: 60000, // 60 seconds
    M30: 60000, // 60 seconds
    H1: 120000, // 120 seconds
    H4: 120000, // 120 seconds
    D1: 120000, // 120 seconds
  };

  /**
   * Convert frontend symbol format to Binance symbol format
   */
  private convertSymbolToBinance(symbol: string): string {
    const binanceSymbol = this.SYMBOL_MAP[symbol];
    if (!binanceSymbol) {
      throw new NotFoundException(
        `Symbol ${symbol} is not supported for Binance candles`,
      );
    }
    return binanceSymbol;
  }

  /**
   * Convert timeframe to Binance interval
   */
  private convertTimeframeToBinance(timeframe: string): string {
    const binanceInterval = this.TIMEFRAME_MAP[timeframe];
    if (!binanceInterval) {
      throw new NotFoundException(`Timeframe ${timeframe} is not supported`);
    }
    return binanceInterval;
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(
    cache: { data: Candlestick[]; timestamp: number; ttl: number } | undefined,
  ): boolean {
    if (!cache) return false;
    const now = Date.now();
    return now - cache.timestamp < cache.ttl;
  }

  /**
   * Fetch candles from Binance API
   */
  private async fetchCandlesFromBinance(
    binanceSymbol: string,
    binanceInterval: string,
    limit: number = 500,
  ): Promise<Candlestick[]> {
    const url = `${this.BINANCE_API}/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`;

    this.logger.debug(`[Binance] Fetching candles: ${url}`);

    try {
      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(
          `[Binance] API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
        throw new Error(
          `Binance API error: ${response.statusText} (${response.status})`,
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error('Invalid response format from Binance API');
      }

      // Binance kline format: [openTime, open, high, low, close, volume, closeTime, ...]
      const candles: Candlestick[] = data.map((kline: any[]) => {
        const openTime = kline[0]; // milliseconds
        const open = parseFloat(kline[1]);
        const high = parseFloat(kline[2]);
        const low = parseFloat(kline[3]);
        const close = parseFloat(kline[4]);
        const volume = parseFloat(kline[5]);

        return {
          time: Math.floor(openTime / 1000), // Convert to seconds for lightweight-charts
          open,
          high,
          low,
          close,
          volume,
        };
      });

      this.logger.debug(
        `[Binance] Fetched ${candles.length} candles for ${binanceSymbol} ${binanceInterval}`,
      );

      // Validate candles (ensure no flat candles)
      const flatCandles = candles.filter(
        (c) => c.open === c.high && c.high === c.low && c.low === c.close,
      );
      if (flatCandles.length > 0) {
        this.logger.warn(
          `[Binance] WARNING: ${flatCandles.length} flat candles detected (this should not happen with real Binance data)`,
        );
      }

      return candles;
    } catch (error) {
      this.logger.error(`[Binance] Failed to fetch candles: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get crypto candles from Binance (with caching)
   */
  async getCryptoCandles(
    symbol: string,
    timeframe: string,
    limit: number = 500,
  ): Promise<Candlestick[]> {
    // Convert symbol and timeframe to Binance format
    const binanceSymbol = this.convertSymbolToBinance(symbol);
    const binanceInterval = this.convertTimeframeToBinance(timeframe);

    // Cache key
    const cacheKey = `binance:candles:${binanceSymbol}:${binanceInterval}`;
    const cacheTTL = this.CACHE_TTL[timeframe] || 60000;

    // Check cache
    const cached = this.candlesCache.get(cacheKey);
    if (cached && this.isCacheValid(cached)) {
      this.logger.debug(
        `[Binance] Cache hit for ${symbol} ${timeframe} (${cached.data.length} candles)`,
      );
      return cached.data.slice(-limit);
    }

    // Fetch from Binance
    this.logger.log(
      `[Binance] Fetching fresh candles for ${symbol} (${binanceSymbol}) ${timeframe} (${binanceInterval})`,
    );
    const candles = await this.fetchCandlesFromBinance(
      binanceSymbol,
      binanceInterval,
      limit,
    );

    // Validate we got real candles
    if (candles.length === 0) {
      this.logger.warn(
        `[Binance] No candles returned for ${symbol} ${timeframe}`,
      );
      // Return stale cache if available
      if (cached) {
        this.logger.warn(
          `[Binance] Returning stale cache (${cached.data.length} candles)`,
        );
        return cached.data.slice(-limit);
      }
      return [];
    }

    // Update cache
    this.candlesCache.set(cacheKey, {
      data: candles,
      timestamp: Date.now(),
      ttl: cacheTTL,
    });

    this.logger.log(
      `[Binance] Cached ${candles.length} candles for ${symbol} ${timeframe} (TTL: ${cacheTTL}ms)`,
    );

    return candles.slice(-limit);
  }

  /**
   * Get ticker/24hr stats for crypto symbols (for quote panel)
   * Returns bid, ask, priceChangePercent, lastPrice
   * Uses caching and rate limit protection
   */
  async getCryptoQuotes(symbols: string[]): Promise<
    Array<{
      symbol: string;
      binanceSymbol: string;
      bid: number;
      ask: number;
      lastPrice: number;
      priceChangePercent: number;
    }>
  > {
    try {
      // Convert frontend symbols to Binance symbols
      const binanceSymbols = symbols
        .map((s) => ({ frontend: s, binance: this.SYMBOL_MAP[s] }))
        .filter((s) => s.binance); // Only include supported symbols

      if (binanceSymbols.length === 0) {
        return [];
      }

      // Check rate limit
      const now = Date.now();
      if (now < this.rateLimitUntil) {
        const waitTime = Math.ceil((this.rateLimitUntil - now) / 1000);
        this.logger.warn(
          `[Binance] Rate limited, waiting ${waitTime} seconds. Using cached data if available.`,
        );

        // Return cached data if available
        if (
          this.quotesCache &&
          now - this.quotesCache.timestamp < this.quotesCache.ttl * 2
        ) {
          this.logger.debug(
            '[Binance] Returning stale cached quotes due to rate limit',
          );
          const allTickers = this.quotesCache.data;
          return this.mapTickersToQuotes(binanceSymbols, allTickers);
        }
        throw new Error(`Rate limited - please wait ${waitTime} seconds`);
      }

      // Check cache (5 second TTL for quotes)
      const CACHE_TTL = 5000; // 5 seconds
      if (this.quotesCache && now - this.quotesCache.timestamp < CACHE_TTL) {
        this.logger.debug('[Binance] Using cached quotes');
        return this.mapTickersToQuotes(binanceSymbols, this.quotesCache.data);
      }

      // Fetch all tickers in one call (more efficient)
      // Using /ticker/bookTicker endpoint (weight 1) for bid/ask, but we need 24hr for change%
      // Actually, we need /ticker/24hr for change%, so use that but cache aggressively
      const url = `${this.BINANCE_API}/ticker/24hr`;
      this.logger.debug(
        `[Binance] Fetching tickers for ${binanceSymbols.length} symbols`,
      );

      const response = await fetch(url);

      if (!response.ok) {
        const errorText = await response.text();
        const errorData = errorText ? JSON.parse(errorText) : {};

        // Handle rate limiting
        if (
          response.status === 418 ||
          response.status === 429 ||
          errorData.code === -1003
        ) {
          // Extract ban time from error message if available
          const banMatch = errorText.match(/banned until (\d+)/);
          if (banMatch) {
            this.rateLimitUntil = parseInt(banMatch[1]);
            const waitTime = Math.ceil((this.rateLimitUntil - now) / 1000);
            this.logger.warn(
              `[Binance] Rate limited until ${new Date(this.rateLimitUntil).toISOString()} (${waitTime} seconds). Using cached data.`,
            );
          } else {
            // Default ban time: 60 seconds
            this.rateLimitUntil = now + 60000;
            this.logger.warn(
              `[Binance] Rate limited, defaulting to 60 second ban. Using cached data.`,
            );
          }

          // Return cached data if available (even if stale)
          if (this.quotesCache) {
            this.logger.debug(
              '[Binance] Returning cached quotes due to rate limit',
            );
            return this.mapTickersToQuotes(
              binanceSymbols,
              this.quotesCache.data,
            );
          }

          throw new Error(`Binance rate limited - please wait`);
        }

        this.logger.error(
          `[Binance] Ticker API error: ${response.status} ${response.statusText} - ${errorText}`,
        );
        throw new Error(`Binance API error: ${response.statusText}`);
      }

      // Reset rate limit on successful fetch
      this.rateLimitUntil = 0;

      const allTickers: any[] = await response.json();

      // Update cache
      this.quotesCache = {
        data: allTickers,
        timestamp: Date.now(),
        ttl: CACHE_TTL,
      };

      return this.mapTickersToQuotes(binanceSymbols, allTickers);
    } catch (error) {
      // If we have cached data, return it even on error
      if (this.quotesCache) {
        this.logger.warn(
          `[Binance] Error fetching quotes, using cached data: ${error.message}`,
        );
        const binanceSymbols = symbols
          .map((s) => ({ frontend: s, binance: this.SYMBOL_MAP[s] }))
          .filter((s) => s.binance);
        return this.mapTickersToQuotes(binanceSymbols, this.quotesCache.data);
      }

      this.logger.error(
        `[Binance] Failed to fetch crypto quotes: ${error.message}`,
      );
      throw error;
    }
  }

  /**
   * Helper to map Binance tickers to our quote format
   */
  private mapTickersToQuotes(
    binanceSymbols: Array<{ frontend: string; binance: string }>,
    allTickers: any[],
  ): Array<{
    symbol: string;
    binanceSymbol: string;
    bid: number;
    ask: number;
    lastPrice: number;
    priceChangePercent: number;
  }> {
    const quotes = binanceSymbols
      .map(({ frontend, binance }) => {
        const ticker = allTickers.find((t: any) => t.symbol === binance);

        if (!ticker) {
          this.logger.warn(
            `[Binance] No ticker data found for ${frontend} (${binance})`,
          );
          return null;
        }

        // Extract data from Binance ticker
        // Binance ticker has: bidPrice, askPrice, lastPrice, priceChangePercent
        return {
          symbol: frontend,
          binanceSymbol: binance,
          bid: parseFloat(ticker.bidPrice || ticker.lastPrice || '0'),
          ask: parseFloat(ticker.askPrice || ticker.lastPrice || '0'),
          lastPrice: parseFloat(ticker.lastPrice || '0'),
          priceChangePercent: parseFloat(ticker.priceChangePercent || '0'),
        };
      })
      .filter((q) => q !== null) as Array<{
      symbol: string;
      binanceSymbol: string;
      bid: number;
      ask: number;
      lastPrice: number;
      priceChangePercent: number;
    }>;

    this.logger.debug(`[Binance] Mapped quotes for ${quotes.length} symbols`);
    return quotes;
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.candlesCache.clear();
    this.logger.log('[Binance] Cache cleared');
  }
}
