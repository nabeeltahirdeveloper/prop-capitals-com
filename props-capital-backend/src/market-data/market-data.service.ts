import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PricesService } from '../prices/prices.service';
import { BinanceMarketService } from './binance-market.service';
import { BinanceWebSocketService } from './binance-websocket.service';

export interface Candlestick {
  time: number; // Unix timestamp in milliseconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface ForexHistoricalData {
  rates: {
    [date: string]: {
      [currency: string]: number;
    };
  };
}

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

  // API endpoints
  private readonly FRANKFURTER_API = 'https://api.frankfurter.app';

  // Symbol mappings
  private readonly FOREX_SYMBOLS = [
    'EUR/USD',
    'GBP/USD',
    'USD/JPY',
    'AUD/USD',
    'USD/CAD',
    'USD/CHF',
    'NZD/USD',
    'EUR/GBP',
  ];

  private readonly CRYPTO_SYMBOLS: { [symbol: string]: string } = {
    'BTC/USD': 'bitcoin',
    'ETH/USD': 'ethereum',
    'XRP/USD': 'ripple',
    'SOL/USD': 'solana',
    'ADA/USD': 'cardano',
    'DOGE/USD': 'dogecoin',
  };

  constructor(
    private readonly pricesService: PricesService,
    private readonly binanceMarketService: BinanceMarketService,
    private readonly binanceWebSocketService: BinanceWebSocketService,
  ) {}

  /**
   * Check if symbol is forex or crypto
   */
  private isForexSymbol(symbol: string): boolean {
    return this.FOREX_SYMBOLS.includes(symbol);
  }

  private isCryptoSymbol(symbol: string): boolean {
    return symbol in this.CRYPTO_SYMBOLS;
  }

  /**
   * Parse symbol to base and quote currencies
   */
  private parseForexSymbol(symbol: string): { base: string; quote: string } | null {
    const parts = symbol.split('/');
    if (parts.length !== 2) return null;
    return { base: parts[0].toLowerCase(), quote: parts[1].toLowerCase() };
  }

  /**
   * Get crypto coin ID from symbol
   */
  private getCoinId(symbol: string): string | null {
    return this.CRYPTO_SYMBOLS[symbol] || null;
  }

  /**
   * Convert timeframe to days for API calls
   * For crypto, we need more days to generate enough intraday candles
   * since CoinGecko free API only returns daily data
   */
  private timeframeToDays(timeframe: string, isCrypto: boolean = false): number {
    if (isCrypto) {
      // For crypto, use proper timeframe->days mapping
      // CoinGecko OHLC endpoint supports: 1, 7, 14, 30, 90, 180, 365 days
      // For market_chart: 1 day = 5-min data, 1-90 days = hourly data
      const tfMap: { [key: string]: number } = {
        M1: 1,   // 1 day for M1 (OHLC or 5-min data)
        M5: 7,   // 7 days for M5 (OHLC preferred, or hourly data)
        M15: 7,  // 7 days for M15 (OHLC preferred, or hourly data)
        M30: 7,  // 7 days for M30 (OHLC preferred, or hourly data)
        H1: 30,  // 30 days for H1 (OHLC preferred, or hourly data)
        H4: 30,  // 30 days for H4 (OHLC preferred, or hourly data)
        D1: 365, // 365 days (1 year) for D1
      };
      return tfMap[timeframe] || 30;
    }
    
    // For forex, use original mapping
    const tfMap: { [key: string]: number } = {
      M1: 1, // 1 day for M1
      M5: 1,
      M15: 7, // 1 week
      M30: 7,
      H1: 30, // 1 month
      H4: 90, // 3 months
      D1: 365, // 1 year
    };
    return tfMap[timeframe] || 30;
  }

  /**
   * Convert timeframe to interval in minutes
   */
  private timeframeToMinutes(timeframe: string): number {
    const tfMap: { [key: string]: number } = {
      M1: 1,
      M5: 5,
      M15: 15,
      M30: 30,
      H1: 60,
      H4: 240,
      D1: 1440,
    };
    return tfMap[timeframe] || 5;
  }

  /**
   * Fetch historical forex data from Frankfurter API
   */
  private async fetchForexHistory(
    symbol: string,
    days: number,
  ): Promise<Candlestick[]> {
    try {
      const parsed = this.parseForexSymbol(symbol);
      if (!parsed) {
        throw new Error(`Invalid forex symbol format: ${symbol}`);
      }

      const { base, quote } = parsed;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Format dates as YYYY-MM-DD
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // Frankfurter API: https://api.frankfurter.app/{start_date}..{end_date}
      const url = `${this.FRANKFURTER_API}/${startDateStr}..${endDateStr}?from=${base.toUpperCase()}&to=${quote.toUpperCase()}`;

      this.logger.debug(`Fetching forex history from: ${url}`);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Frankfurter API error: ${response.statusText}`);
      }

      const data: ForexHistoricalData = await response.json();

      // Convert to candlestick format
      const dailyCandles: Candlestick[] = [];
      const dates = Object.keys(data.rates).sort();

      dates.forEach((date, index) => {
        const rate = data.rates[date][quote.toUpperCase()];
        if (rate) {
          // For forex, we'll use the rate as close price
          // Since Frankfurter doesn't provide OHLC, we'll simulate it
          const close = rate;
          const volatility = 0.0001; // Small volatility for forex
          const open = index > 0 ? dailyCandles[index - 1].close : close;
          const high = close * (1 + Math.random() * volatility);
          const low = close * (1 - Math.random() * volatility);

          dailyCandles.push({
            time: new Date(date).getTime(),
            open,
            high: Math.max(open, close, high),
            low: Math.min(open, close, low),
            close,
            volume: Math.floor(Math.random() * 1000) + 100,
          });
        }
      });

      // Generate intraday candles from daily data
      // This creates multiple candles per day (288 candles for 5-minute intervals)
      const intradayCandles: Candlestick[] = [];
      const candlesPerDay = 288; // 5-minute candles per day (24 hours * 60 minutes / 5)

      dailyCandles.forEach((dailyCandle, dayIndex) => {
        const dayStart = dailyCandle.time;
        const dayEnd = dayStart + (24 * 60 * 60 * 1000); // Full day in milliseconds
        
        const priceRange = dailyCandle.high - dailyCandle.low;
        const priceTrend = dailyCandle.close - dailyCandle.open;

        for (let i = 0; i < candlesPerDay; i++) {
          const progress = i / candlesPerDay;
          const candleTime = dayStart + (progress * (dayEnd - dayStart));
          
          // Simulate price movement throughout the day
          const basePrice = dailyCandle.open + (priceTrend * progress);
          const volatility = Math.max(priceRange * 0.15, 0.0001); // 15% of daily range, min 0.0001
          const randomWalk = (Math.random() - 0.5) * 2 * volatility;
          
          const open = i === 0 ? dailyCandle.open : intradayCandles[intradayCandles.length - 1].close;
          const close = basePrice + randomWalk;
          const high = Math.max(open, close) + Math.random() * volatility * 0.3;
          const low = Math.min(open, close) - Math.random() * volatility * 0.3;

          intradayCandles.push({
            time: candleTime,
            open,
            high: Math.max(open, close, high),
            low: Math.min(open, close, low),
            close,
            volume: Math.floor(Math.random() * 500) + 50,
          });
        }
      });

      return intradayCandles;
    } catch (error) {
      this.logger.error(`Failed to fetch forex history: ${error.message}`);
      throw error;
    }
  }


  /**
   * Get crypto candles from Binance (real candles, no aggregation)
   * This is the main method for fetching crypto chart data
   */
  async getCryptoCandles(
    symbol: string,
    timeframe: string = 'M5',
    limit: number = 500,
  ): Promise<Candlestick[]> {
    if (!this.isCryptoSymbol(symbol)) {
      throw new NotFoundException(`Unknown crypto symbol: ${symbol}`);
    }

    this.logger.debug(`[MarketData] Getting crypto candles for ${symbol} ${timeframe} (limit: ${limit})`);
    
    // Use Binance service to get real candles
    const candles = await this.binanceMarketService.getCryptoCandles(symbol, timeframe, limit);
    
    this.logger.log(`[MarketData] Retrieved ${candles.length} real candles for ${symbol} ${timeframe}`);
    
    return candles;
  }


  /**
   * Remove duplicate timestamps and ensure strictly ascending order
   */
  private removeDuplicateTimestamps(candles: Candlestick[]): Candlestick[] {
    if (candles.length === 0) return candles;

    // Sort by time
    candles.sort((a, b) => a.time - b.time);

    // Remove duplicates
    const unique: Candlestick[] = [];
    let lastTime = -1;

    for (const candle of candles) {
      if (candle.time > lastTime) {
        unique.push(candle);
        lastTime = candle.time;
      }
    }

    return unique;
  }

  /**
   * Get crypto quotes for multiple symbols (for watchlist)
   * Uses Binance API for real-time bid/ask and change%
   */
  async getCryptoQuotes(symbols: string[]): Promise<Array<{ 
    symbol: string; 
    bid: number; 
    ask: number; 
    price: number;
    priceChangePercent: number;
  }>> {
    try {
      // Use Binance service to get real-time quotes
      const binanceQuotes = await this.binanceMarketService.getCryptoQuotes(symbols);
      
      return binanceQuotes.map(quote => ({
        symbol: quote.symbol,
        bid: quote.bid,
        ask: quote.ask,
        price: quote.lastPrice || quote.bid,
        priceChangePercent: quote.priceChangePercent,
      }));
    } catch (error) {
      this.logger.error(`Failed to get crypto quotes from Binance: ${error.message}`);
      // Return empty array instead of throwing to prevent watchlist from breaking
      return [];
    }
  }

  /**
   * Get historical candlestick data for a symbol
   */
  async getHistory(
    symbol: string,
    timeframe: string = 'M5',
    limit: number = 100,
  ): Promise<Candlestick[]> {
    if (!this.isForexSymbol(symbol) && !this.isCryptoSymbol(symbol)) {
      throw new NotFoundException(`Symbol not supported: ${symbol}`);
    }

    const isCrypto = this.isCryptoSymbol(symbol);
    const days = this.timeframeToDays(timeframe, isCrypto);
    const intervalMinutes = this.timeframeToMinutes(timeframe);
    let candles: Candlestick[] = [];

    try {
      if (this.isForexSymbol(symbol)) {
        candles = await this.fetchForexHistory(symbol, days);
        // Resample candles to match the requested timeframe
        candles = this.resampleCandles(candles, intervalMinutes);
      } else if (isCrypto) {
        // For crypto, use Binance API for real candles (no aggregation needed)
        candles = await this.getCryptoCandles(symbol, timeframe, limit);
      }

      // Ensure candles are sorted by time first
      candles.sort((a, b) => a.time - b.time);

      // Remove duplicate timestamps and ensure strictly ascending order
      const uniqueCandles: Candlestick[] = [];
      let lastTime = -1;
      
      for (const candle of candles) {
        // If timestamp is duplicate or not strictly ascending, skip it
        if (candle.time <= lastTime) {
          continue;
        }
        lastTime = candle.time;
        uniqueCandles.push(candle);
      }

      // Limit the number of candles (take the most recent ones)
      // For crypto, we need more candles to show proper chart, so increase limit
      const effectiveLimit = isCrypto ? Math.max(limit, 500) : limit;
      if (uniqueCandles.length > effectiveLimit) {
        return uniqueCandles.slice(-effectiveLimit);
      }

      return uniqueCandles;
    } catch (error) {
      // If it's a rate limit error, return empty array instead of throwing
      if (error.message?.includes('Too Many Requests') || error.message?.includes('rate limit')) {
        this.logger.warn(`Rate limited for ${symbol} history. Returning empty data.`);
        return [];
      }
      this.logger.error(`Failed to get history for ${symbol}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Resample candles to match the requested timeframe
   */
  private resampleCandles(candles: Candlestick[], intervalMinutes: number): Candlestick[] {
    if (candles.length === 0) return candles;

    const resampled: Candlestick[] = [];
    const intervalMs = intervalMinutes * 60 * 1000;

    // Group candles by time intervals
    let currentIntervalStart = Math.floor(candles[0].time / intervalMs) * intervalMs;
    let currentCandles: Candlestick[] = [];

    candles.forEach((candle) => {
      const candleInterval = Math.floor(candle.time / intervalMs) * intervalMs;

      if (candleInterval === currentIntervalStart) {
        currentCandles.push(candle);
      } else {
        // Create a new candle from the accumulated candles
        if (currentCandles.length > 0) {
          const open = currentCandles[0].open;
          const close = currentCandles[currentCandles.length - 1].close;
          const high = Math.max(...currentCandles.map(c => c.high));
          const low = Math.min(...currentCandles.map(c => c.low));
          const volume = currentCandles.reduce((sum, c) => sum + (c.volume || 0), 0);

          resampled.push({
            time: currentIntervalStart,
            open,
            high,
            low,
            close,
            volume,
          });
        }

        // Start new interval
        currentIntervalStart = candleInterval;
        currentCandles = [candle];
      }
    });

    // Don't forget the last interval
    if (currentCandles.length > 0) {
      const open = currentCandles[0].open;
      const close = currentCandles[currentCandles.length - 1].close;
      const high = Math.max(...currentCandles.map(c => c.high));
      const low = Math.min(...currentCandles.map(c => c.low));
      const volume = currentCandles.reduce((sum, c) => sum + (c.volume || 0), 0);

      resampled.push({
        time: currentIntervalStart,
        open,
        high,
        low,
        close,
        volume,
      });
    }

    return resampled;
  }

  /**
   * Get current price for a symbol
   */
  async getCurrentPrice(symbol: string): Promise<{
    symbol: string;
    price: number;
    bid: number;
    ask: number;
    timestamp: string;
  }> {
    try {
      // Optimize: For forex symbols, only fetch forex rates (not crypto)
      if (this.isForexSymbol(symbol)) {
        const forexRates = await this.pricesService.getForexRates();
        const parsed = this.parseForexSymbol(symbol);
        if (!parsed) {
          throw new NotFoundException(`Invalid symbol format: ${symbol}`);
        }

        const { base, quote } = parsed;
        let rate = 0;

        if (base === 'usd') {
          rate = forexRates[quote.toUpperCase()] || 0;
        } else if (quote === 'usd') {
          rate = 1 / (forexRates[base.toUpperCase()] || 1);
        } else {
          const baseToUsd = 1 / (forexRates[base.toUpperCase()] || 1);
          const usdToQuote = forexRates[quote.toUpperCase()] || 1;
          rate = baseToUsd * usdToQuote;
        }

        const spread = symbol.includes('JPY') ? 0.02 : 0.00015;
        
        // Add small random variation to simulate real-time price movement
        // This makes the trading experience more realistic even with cached data
        // Variation: ±0.0001 for EUR/USD (1 pip), ±0.01 for JPY pairs
        const variationRange = symbol.includes('JPY') ? 0.01 : 0.0001;
        const variation = (Math.random() - 0.5) * 2 * variationRange; // Random between -range and +range
        const variedRate = rate + variation;

        return {
          symbol,
          price: variedRate,
          bid: variedRate,
          ask: variedRate + spread,
          timestamp: new Date().toISOString(),
        };
      }

      // For crypto symbols, use Binance API for real bid/ask prices (matches quote panel)
      try {
        // Get quotes from Binance (this will get real bid/ask for the symbol, uses cache if rate limited)
        const quotes = await this.binanceMarketService.getCryptoQuotes([symbol]);
        
        if (!quotes || quotes.length === 0) {
          // Fall back to PricesService cached data if Binance fails
          this.logger.warn(`No Binance quotes for ${symbol}, falling back to PricesService cache`);
          try {
            const cryptoPrices = await this.pricesService.getCryptoPrices();
            const coinId = this.getCoinId(symbol);
            if (coinId && cryptoPrices[coinId]) {
              const priceData = cryptoPrices[coinId];
              const price = priceData.usd;
              const spread = price * 0.001;
              return {
                symbol,
                price: price,
                bid: price,
                ask: price + spread,
                timestamp: new Date().toISOString(),
              };
            }
          } catch (fallbackError) {
            this.logger.warn(`Fallback to PricesService also failed for ${symbol}`);
          }
          throw new NotFoundException(`Price data not available for ${symbol} from Binance.`);
        }
        
        const quote = quotes[0];
        const bid = quote.bid;
        const ask = quote.ask;
        const lastPrice = quote.lastPrice || bid;

        return {
          symbol,
          price: lastPrice,
          bid: bid,
          ask: ask,
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        // If it's a NotFoundException and we have cached data, try fallback
        if (error instanceof NotFoundException) {
          // Try fallback to PricesService cached data
          try {
            const cryptoPrices = await this.pricesService.getCryptoPrices();
            const coinId = this.getCoinId(symbol);
            if (coinId && cryptoPrices[coinId]) {
              const priceData = cryptoPrices[coinId];
              const price = priceData.usd;
              const spread = price * 0.001;
              this.logger.warn(`Using fallback cached price for ${symbol} due to Binance error`);
              return {
                symbol,
                price: price,
                bid: price,
                ask: price + spread,
                timestamp: new Date().toISOString(),
              };
            }
          } catch (fallbackError) {
            // If fallback also fails, throw original error
          }
          throw error;
        }
        // For other errors (rate limit, etc.), try fallback before throwing
        try {
          const cryptoPrices = await this.pricesService.getCryptoPrices();
          const coinId = this.getCoinId(symbol);
          if (coinId && cryptoPrices[coinId]) {
            const priceData = cryptoPrices[coinId];
            const price = priceData.usd;
            const spread = price * 0.001;
            this.logger.warn(`Using fallback cached price for ${symbol} due to error: ${error.message}`);
            return {
              symbol,
              price: price,
              bid: price,
              ask: price + spread,
              timestamp: new Date().toISOString(),
            };
          }
        } catch (fallbackError) {
          // Ignore fallback error
        }
        // Otherwise, log and throw a more user-friendly error
        this.logger.error(`Failed to get crypto price from Binance for ${symbol}: ${error.message}`);
        throw new NotFoundException(`Symbol not found: ${symbol}. ${error.message}`);
      }
    } catch (error) {
      this.logger.error(`Failed to get current price for ${symbol}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get unified prices for multiple symbols (crypto + forex)
   * Uses WebSocket data when available, falls back to REST
   * @param symbolList Optional list of symbols to fetch. If empty, returns all available symbols
   */
  async getUnifiedPrices(symbolList: string[] = []): Promise<Array<{
    symbol: string;
    bid: number;
    ask: number;
    price: number;
    timestamp: number;
  }>> {
    const allSymbols = symbolList.length > 0 
      ? symbolList 
      : [...this.FOREX_SYMBOLS, ...Object.keys(this.CRYPTO_SYMBOLS)];

    const prices: Array<{
      symbol: string;
      bid: number;
      ask: number;
      price: number;
      timestamp: number;
    }> = [];

    // Separate crypto and forex symbols
    const cryptoSymbols = allSymbols.filter(s => this.isCryptoSymbol(s));
    const forexSymbols = allSymbols.filter(s => this.isForexSymbol(s));

    // Get crypto prices from WebSocket (if available) or REST
    // First, check WebSocket for all symbols
    const wsPrices: Array<{ symbol: string; price: any }> = [];
    const symbolsNeedingREST: string[] = [];
    
    for (const symbol of cryptoSymbols) {
      const wsPrice = this.binanceWebSocketService.getPrice(symbol);
      
      if (wsPrice && this.binanceWebSocketService.isWSConnected()) {
        // Use WebSocket data (most recent)
        wsPrices.push({ symbol, price: wsPrice });
      } else {
        // Need to fetch from REST
        symbolsNeedingREST.push(symbol);
      }
    }
    
    // Add WebSocket prices
    wsPrices.forEach(({ symbol, price }) => {
      prices.push({
        symbol,
        bid: price.bid,
        ask: price.ask,
        price: price.bid,
        timestamp: price.timestamp,
      });
    });
    
    // Batch fetch remaining symbols from REST (much faster than individual calls)
    if (symbolsNeedingREST.length > 0) {
      try {
        // Use batch crypto quotes endpoint for faster fetching
        const restQuotes = await this.binanceMarketService.getCryptoQuotes(symbolsNeedingREST);
        restQuotes.forEach(quote => {
          prices.push({
            symbol: quote.symbol,
            bid: quote.bid,
            ask: quote.ask,
            price: quote.lastPrice || quote.bid,
            timestamp: Date.now(),
          });
        });
      } catch (error) {
        this.logger.warn(`Failed to batch fetch crypto prices: ${error.message}`);
        // Fallback to individual calls if batch fails
        for (const symbol of symbolsNeedingREST) {
          try {
            const restPrice = await this.getCurrentPrice(symbol);
            prices.push({
              symbol,
              bid: restPrice.bid,
              ask: restPrice.ask,
              price: restPrice.price || restPrice.bid,
              timestamp: Date.now(),
            });
          } catch (err) {
            this.logger.warn(`Failed to get price for ${symbol}: ${err.message}`);
          }
        }
      }
    }

    // Get forex prices from REST (forex doesn't have WebSocket)
    for (const symbol of forexSymbols) {
      try {
        const restPrice = await this.getCurrentPrice(symbol);
        prices.push({
          symbol,
          bid: restPrice.bid,
          ask: restPrice.ask,
          price: restPrice.price || restPrice.bid,
          timestamp: Date.now(),
        });
      } catch (error) {
        this.logger.warn(`Failed to get forex price for ${symbol}: ${error.message}`);
        // Skip this symbol if fetch fails
      }
    }

    return prices;
  }
}
