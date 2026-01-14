import { Injectable, Logger } from '@nestjs/common';

interface CachedPrice {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

export interface ForexRates {
  [key: string]: number;
}

interface CryptoPrice {
  usd: number;
  usd_24h_change?: number;
}

export interface CryptoPrices {
  [coinId: string]: CryptoPrice;
}

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);

  // Cache storage
  private forexCache: CachedPrice | null = null;
  private cryptoCache: CachedPrice | null = null;

  // Rate limiting protection
  private cryptoRateLimitUntil: number = 0; // Timestamp when we can retry after rate limit

  // Cache TTL (Time To Live) in milliseconds
  // Optimized for real-time trading - prices update every 1 second
  private readonly FOREX_CACHE_TTL = 100000; // 1 second for forex (real-time updates)
  private readonly CRYPTO_CACHE_TTL = 100000; // 1 second for crypto (real-time updates with WebSocket support)

  // API endpoints
  private readonly FRANKFURTER_API = 'https://api.frankfurter.app/latest?from=USD';
  private readonly COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
  private readonly BINANCE_API = 'https://api.binance.com/api/v3';

  // Crypto coin IDs mapping (for CoinGecko - deprecated, keeping for fallback)
  private readonly CRYPTO_COIN_IDS = [
    'bitcoin',
    'ethereum',
    'ripple',
    'solana',
    'cardano',
    'dogecoin',
  ];

  // Symbol mapping: frontend format -> Binance format
  private readonly BINANCE_SYMBOL_MAP: { [key: string]: string } = {
    'BTC/USD': 'BTCUSDT',
    'ETH/USD': 'ETHUSDT',
    'XRP/USD': 'XRPUSDT',
    'SOL/USD': 'SOLUSDT',
    'ADA/USD': 'ADAUSDT',
    'DOGE/USD': 'DOGEUSDT',
  };

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(cache: CachedPrice | null): boolean {
    if (!cache) return false;
    const now = Date.now();
    return now - cache.timestamp < cache.ttl;
  }

  /**
   * Fetch forex rates from Frankfurter API with timeout and retry
   */
  private async fetchForexRates(): Promise<ForexRates> {
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 5000; // 5 second timeout
    const BASE_DELAY_MS = 1000; // Start with 1 second

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

        const response = await fetch(this.FRANKFURTER_API, {
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Frankfurter API error: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Only log on first successful fetch after error
        if (attempt > 0) {
          this.logger.log(`✅ Forex API recovered after ${attempt} retries`);
        }
        
        return data.rates || {};
      } catch (error) {
        const isLastAttempt = attempt === MAX_RETRIES - 1;
        
        // Log only on first failure and last attempt (reduce spam)
        if (attempt === 0 || isLastAttempt) {
          this.logger.warn(
            `Forex API attempt ${attempt + 1}/${MAX_RETRIES} failed: ${error.message}`
          );
        }
        
        if (isLastAttempt) {
          // Return cached data if available, otherwise throw
          if (this.forexCache) {
            this.logger.warn('⚠️ Using stale forex cache due to API failure');
            return this.forexCache.data;
          }
          throw new Error(`Forex API failed after ${MAX_RETRIES} attempts: ${error.message}`);
        }
        
        // Exponential backoff: 1s, 2s, 4s
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    // Should never reach here, but TypeScript wants a return
    throw new Error('Forex API failed unexpectedly');
  }

  /**
   * Fetch crypto prices from Binance API with timeout and retry
   */
  private async fetchCryptoPrices(): Promise<CryptoPrices> {
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 5000;
    const BASE_DELAY_MS = 1000;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        
        const url = `${this.BINANCE_API}/ticker/24hr`;
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`Binance API error: ${response.statusText}`);
        }
        
        const allTickers: any[] = await response.json();
        
        // Map Binance tickers to CoinGecko-like format for compatibility
        const cryptoPrices: CryptoPrices = {};
        const coinIdMap: { [binanceSymbol: string]: string } = {
          'BTCUSDT': 'bitcoin',
          'ETHUSDT': 'ethereum',
          'XRPUSDT': 'ripple',
          'SOLUSDT': 'solana',
          'ADAUSDT': 'cardano',
          'DOGEUSDT': 'dogecoin',
        };
        
        for (const ticker of allTickers) {
          const coinId = coinIdMap[ticker.symbol];
          if (coinId) {
            cryptoPrices[coinId] = {
              usd: parseFloat(ticker.lastPrice || '0'),
              usd_24h_change: parseFloat(ticker.priceChangePercent || '0'),
            };
          }
        }
        
        if (attempt > 0) {
          this.logger.log(`✅ Binance API recovered after ${attempt} retries`);
        }
        
        this.logger.log(`Fetched crypto prices from Binance for ${Object.keys(cryptoPrices).length} coins`);
        return cryptoPrices;
      } catch (error) {
        const isLastAttempt = attempt === MAX_RETRIES - 1;
        
        if (attempt === 0 || isLastAttempt) {
          this.logger.warn(
            `Binance API attempt ${attempt + 1}/${MAX_RETRIES} failed: ${error.message}`
          );
        }
        
        if (isLastAttempt) {
          // Return cached data if available
          if (this.cryptoCache) {
            this.logger.warn('⚠️ Using stale crypto cache due to Binance API failure');
            return this.cryptoCache.data;
          }
          throw new Error(`Binance API failed after ${MAX_RETRIES} attempts: ${error.message}`);
        }
        
        const delayMs = BASE_DELAY_MS * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    
    throw new Error('Binance API failed unexpectedly');
  }

  /**
   * Get forex rates (with caching)
   */
  async getForexRates(): Promise<ForexRates> {
    // Check cache first
    if (this.forexCache && this.isCacheValid(this.forexCache)) {
      // Cache hit - return silently (no logging to reduce noise)
      return this.forexCache.data;
    }

    // Fetch fresh data
    this.logger.log('Fetching fresh forex rates from API');
    const rates = await this.fetchForexRates();

    // Update cache
    this.forexCache = {
      data: rates,
      timestamp: Date.now(),
      ttl: this.FOREX_CACHE_TTL,
    };

    return rates;
  }

  /**
   * Get crypto prices (with caching and graceful degradation)
   */
  async getCryptoPrices(): Promise<CryptoPrices> {
    // Check cache first
    if (this.cryptoCache && this.isCacheValid(this.cryptoCache)) {
      // Cache hit - return silently (no logging to reduce noise)
      return this.cryptoCache.data;
    }

    // If we have stale cache and are rate limited, return stale data (even if expired)
    if (this.cryptoCache && Date.now() < this.cryptoRateLimitUntil) {
      this.logger.warn('Returning stale crypto cache due to rate limiting');
      return this.cryptoCache.data;
    }

    // If we have ANY cache (even expired) and we're about to hit rate limit, use it
    if (this.cryptoCache && this.cryptoRateLimitUntil > 0) {
      this.logger.warn('Using expired cache to avoid rate limit');
      return this.cryptoCache.data;
    }

    // Fetch fresh data
    try {
      this.logger.log('Fetching fresh crypto prices from API');
      const prices = await this.fetchCryptoPrices();

      // Update cache
      this.cryptoCache = {
        data: prices,
        timestamp: Date.now(),
        ttl: this.CRYPTO_CACHE_TTL,
      };

      return prices;
    } catch (error) {
      // If fetch fails and we have ANY cache (even expired), return it
      if (this.cryptoCache) {
        this.logger.warn('API fetch failed, returning stale crypto cache');
        return this.cryptoCache.data;
      }
      // No cache available, throw error
      throw error;
    }
  }

  /**
   * Get all market prices (forex + crypto) formatted for frontend
   */
  async getAllPrices() {
    try {
      // Fetch both in parallel, but handle errors gracefully
      const [forexRates, cryptoPrices] = await Promise.allSettled([
        this.getForexRates(),
        this.getCryptoPrices(),
      ]);

      // Extract results or use empty objects on failure
      const rates = forexRates.status === 'fulfilled' ? forexRates.value : {};
      const prices = cryptoPrices.status === 'fulfilled' ? cryptoPrices.value : {};

      // Log if crypto failed but continue with forex
      if (cryptoPrices.status === 'rejected') {
        this.logger.warn(`Crypto prices fetch failed, continuing with forex only: ${cryptoPrices.reason?.message}`);
      }

      // Format forex prices
      const forexSymbols = [
        { symbol: 'EUR/USD', base: 'eur', quote: 'usd' },
        { symbol: 'GBP/USD', base: 'gbp', quote: 'usd' },
        { symbol: 'USD/JPY', base: 'usd', quote: 'jpy' },
        { symbol: 'AUD/USD', base: 'aud', quote: 'usd' },
        { symbol: 'USD/CAD', base: 'usd', quote: 'cad' },
        { symbol: 'USD/CHF', base: 'usd', quote: 'chf' },
        { symbol: 'NZD/USD', base: 'nzd', quote: 'usd' },
        { symbol: 'EUR/GBP', base: 'eur', quote: 'gbp' },
      ];

      const formattedForex = forexSymbols.map((s) => {
        let rate = 0;

        // Calculate rate based on base/quote currencies
        if (s.base === 'usd') {
          rate = rates[s.quote.toUpperCase()] || 0;
        } else if (s.quote === 'usd') {
          rate = 1 / (rates[s.base.toUpperCase()] || 1);
        } else {
          const baseToUsd = 1 / (rates[s.base.toUpperCase()] || 1);
          const usdToQuote = rates[s.quote.toUpperCase()] || 1;
          rate = baseToUsd * usdToQuote;
        }

        const spread = s.symbol.includes('JPY') ? 0.02 : 0.00015;

        return {
          symbol: s.symbol,
          category: 'forex',
          base: s.base,
          quote: s.quote,
          bid: rate,
          ask: rate + spread,
          spread: s.symbol.includes('JPY') ? 2.0 : 1.5,
          change: 0, // Will be calculated on frontend if needed
        };
      });

      // Format crypto prices
      const cryptoSymbols = [
        { symbol: 'BTC/USD', coinId: 'bitcoin' },
        { symbol: 'ETH/USD', coinId: 'ethereum' },
        { symbol: 'XRP/USD', coinId: 'ripple' },
        { symbol: 'SOL/USD', coinId: 'solana' },
        { symbol: 'ADA/USD', coinId: 'cardano' },
        { symbol: 'DOGE/USD', coinId: 'dogecoin' },
      ];

      // For crypto, use Binance API to get real bid/ask prices
      const binanceSymbols = cryptoSymbols.map(s => this.BINANCE_SYMBOL_MAP[s.symbol]).filter(Boolean);
      
      // Fetch Binance tickers for accurate bid/ask
      let binanceQuotes: Array<{ symbol: string; bidPrice: string; askPrice: string; lastPrice: string; priceChangePercent: string }> = [];
      try {
        const binanceUrl = `${this.BINANCE_API}/ticker/24hr`;
        const binanceResponse = await fetch(binanceUrl);
        if (binanceResponse.ok) {
          const allTickers: any[] = await binanceResponse.json();
          binanceQuotes = allTickers.filter((t: any) => binanceSymbols.includes(t.symbol));
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch Binance quotes, using fallback: ${error.message}`);
      }

      const formattedCrypto = cryptoSymbols
        .map((s) => {
          const binanceSymbol = this.BINANCE_SYMBOL_MAP[s.symbol];
          const binanceQuote = binanceQuotes.find(q => q.symbol === binanceSymbol);
          
          // Use Binance data if available, otherwise fall back to cached CoinGecko-like data
          if (binanceQuote) {
            const bid = parseFloat(binanceQuote.bidPrice || binanceQuote.lastPrice || '0');
            const ask = parseFloat(binanceQuote.askPrice || binanceQuote.lastPrice || '0');
            const lastPrice = parseFloat(binanceQuote.lastPrice || '0');
            const change24h = parseFloat(binanceQuote.priceChangePercent || '0');
            const spread = ask - bid;
            
            return {
              symbol: s.symbol,
              category: 'crypto',
              coinId: s.coinId,
              bid: bid || lastPrice,
              ask: ask || lastPrice,
              spread: spread > 0 ? parseFloat((spread / lastPrice * 10000).toFixed(1)) : 10,
              change: change24h,
            };
          }
          
          // Fallback to cached data if Binance fails
          const priceData = cryptoPrices[s.coinId];
          if (!priceData) {
            return null;
          }
          
          const price = priceData.usd;
          const change24h = priceData.usd_24h_change || 0;
          const spread = price * 0.001; // 0.1% spread for crypto

          return {
            symbol: s.symbol,
            category: 'crypto',
            coinId: s.coinId,
            bid: price,
            ask: price + spread,
            spread: parseFloat((spread / price * 10000).toFixed(1)),
            change: change24h,
          };
        })
        .filter(s => s !== null) as Array<{
          symbol: string;
          category: string;
          coinId: string;
          bid: number;
          ask: number;
          spread: number;
          change: number;
        }>;

      return {
        forex: formattedForex,
        crypto: formattedCrypto,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to get all prices: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get price for a specific symbol
   */
  async getSymbolPrice(symbol: string): Promise<number | null> {
    try {
      const allPrices = await this.getAllPrices();
      const allSymbols = [...allPrices.forex, ...allPrices.crypto];
      const symbolData = allSymbols.find((s) => s.symbol === symbol);
      return symbolData ? symbolData.bid : null;
    } catch (error) {
      this.logger.error(`Failed to get price for ${symbol}: ${error.message}`);
      return null;
    }
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.forexCache = null;
    this.cryptoCache = null;
    this.logger.log('Price cache cleared');
  }
}
