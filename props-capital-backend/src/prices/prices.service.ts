import { Injectable, Logger } from '@nestjs/common';
import { MassiveWebSocketService } from './massive-websocket.service'; // ADD
import { BinanceWebSocketService } from './binance-websocket.service';
import { ResilientHttpService } from 'src/common/resilient-http.service';

export interface ForexRates {
  [key: string]: number;
}

export interface CryptoPrices {
  [coinId: string]: { usd: number; usd_24h_change?: number };
}

@Injectable()
export class PricesService {
  private readonly logger = new Logger(PricesService.name);

  // Fallback cache if WebSocket is cold
  private cryptoCache: { data: CryptoPrices; timestamp: number } | null = null;
  private activeCryptoRequest: Promise<CryptoPrices> | null = null;

  // Live metals (gold) cache. The Massive WS plan does not stream metal quotes,
  // so we proxy spot gold via Binance PAX Gold (PAXG ≈ 1 troy oz). This avoids a
  // stale hardcoded price and yields a real 24h change — no extra credentials.
  private metalCache: {
    data: Record<string, { bid: number; change: number }>;
    timestamp: number;
  } | null = null;
  private activeMetalRequest: Promise<
    Record<string, { bid: number; change: number }>
  > | null = null;

  // Daily change baseline cache, keyed per symbol.
  //   day       — the UTC calendar day the baseline belongs to (YYYY-MM-DD)
  //   prevClose — the previous UTC day's closing price (last bid seen before rollover)
  //   lastPrice — the most recent bid seen today (becomes tomorrow's prevClose)
  // Daily % change is measured against the PREVIOUS day's close and resets at UTC
  // midnight — NOT against the first bid seen when the server happened to boot.
  private readonly dailyChangeState = new Map<
    string,
    { day: string; prevClose: number; lastPrice: number }
  >();

  /**
   * Returns the daily % change measured from the previous UTC day's close:
   *   ((currentBid - previousDayClose) / previousDayClose) * 100
   * The baseline rolls over automatically at UTC midnight. On the very first
   * observation of a symbol (no prior close yet) it returns 0 and seeds state,
   * self-correcting on the next day rollover.
   */
  getChangePercent(symbol: string, currentBid: number): number {
    if (!currentBid || currentBid <= 0) return 0;
    const today = new Date().toISOString().slice(0, 10); // UTC YYYY-MM-DD
    const state = this.dailyChangeState.get(symbol);

    if (!state) {
      this.dailyChangeState.set(symbol, {
        day: today,
        prevClose: currentBid,
        lastPrice: currentBid,
      });
      return 0;
    }

    if (state.day !== today) {
      // UTC day rolled over: yesterday's last observed price is its close.
      state.prevClose = state.lastPrice;
      state.day = today;
    }
    state.lastPrice = currentBid;

    const base = state.prevClose;
    if (!base || base <= 0) return 0;
    return parseFloat((((currentBid - base) / base) * 100).toFixed(2));
  }

  private readonly BINANCE_API = 'https://api.binance.com/api/v3';

  constructor(
    private readonly massiveWebSocketService: MassiveWebSocketService, // CHANGED
    private readonly binanceWebSocketService: BinanceWebSocketService, // <--- Injected
    private readonly httpService: ResilientHttpService,
  ) {}

  /**
   * ✅ GET FOREX RATES (Twelve Data WS)
   */
  getForexRates(): Promise<ForexRates> {
    const rates: ForexRates = {};
    const pairs = [
      { symbol: 'EUR/USD', base: 'EUR', inverse: false },
      { symbol: 'GBP/USD', base: 'GBP', inverse: false },
      { symbol: 'AUD/USD', base: 'AUD', inverse: false },
      { symbol: 'NZD/USD', base: 'NZD', inverse: false },
      { symbol: 'USD/JPY', base: 'JPY', inverse: true },
      { symbol: 'USD/CAD', base: 'CAD', inverse: true },
      { symbol: 'USD/CHF', base: 'CHF', inverse: true },
    ];

    for (const p of pairs) {
      const quote = this.massiveWebSocketService.getPrice(p.symbol);
      if (quote) {
        rates[p.base] = p.inverse ? 1 / quote.bid : quote.bid;
      } else {
        // Startup fallbacks
        if (p.symbol === 'EUR/USD') rates['EUR'] = 1.08;
      }
    }
    rates['USD'] = 1;
    return Promise.resolve(rates);
  }

  /**
   * ✅ GET CRYPTO PRICES (Binance WS Priority -> REST Fallback)
   */
  async getCryptoPrices(): Promise<CryptoPrices> {
    // 1. Try WebSocket First (Real-Time)
    if (this.binanceWebSocketService.isWSConnected()) {
      const wsData = this.binanceWebSocketService.getAllPrices();
      if (wsData.size > 0) {
        const prices: CryptoPrices = {};
        // Map System Symbols back to Coin IDs for internal compatibility
        const coinMap: { [key: string]: string } = {
          'BTC/USD': 'bitcoin',
          'ETH/USD': 'ethereum',
          'XRP/USD': 'ripple',
          'SOL/USD': 'solana',
          'ADA/USD': 'cardano',
          'DOGE/USD': 'dogecoin',
        };

        wsData.forEach((val, key) => {
          const coinId = coinMap[key];
          if (coinId) {
            prices[coinId] = { usd: val.bid, usd_24h_change: undefined }; // change calculated via sessionOpenCache
          }
        });
        return prices;
      }
    }

    // 2. Fallback to REST (Deduplicated)
    if (this.activeCryptoRequest) return this.activeCryptoRequest;
    if (this.cryptoCache && Date.now() - this.cryptoCache.timestamp < 3000) {
      return this.cryptoCache.data;
    }

    this.activeCryptoRequest = this.fetchBinanceCrypto()
      .then((data) => {
        this.cryptoCache = { data, timestamp: Date.now() };
        return data;
      })
      .catch(() => this.cryptoCache?.data || {})
      .finally(() => (this.activeCryptoRequest = null));

    return this.activeCryptoRequest;
  }

  private async fetchBinanceCrypto(): Promise<CryptoPrices> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.BINANCE_API}/ticker/24hr`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) throw new Error('Binance error');
      const data = await res.json();

      const prices: CryptoPrices = {};
      const map: { [key: string]: string } = {
        BTCUSDT: 'bitcoin',
        ETHUSDT: 'ethereum',
        XRPUSDT: 'ripple',
        SOLUSDT: 'solana',
        ADAUSDT: 'cardano',
        DOGEUSDT: 'dogecoin',
      };

      for (const t of data) {
        const coinId = map[t.symbol];
        if (coinId) {
          prices[coinId] = {
            usd: parseFloat(t.lastPrice),
            usd_24h_change: parseFloat(t.priceChangePercent),
          };
        }
      }
      return prices;
    } catch {
      return {};
    }
  }

  /**
   * Live spot-gold proxy via Binance PAX Gold (PAXG/USDT ≈ 1 troy oz of gold).
   * Cached ~3s and deduplicated, mirroring the crypto fetch. Falls back to the
   * last cached value (then the caller's hardcoded fallback) on any error.
   */
  private async getMetalPrices(): Promise<
    Record<string, { bid: number; change: number }>
  > {
    if (this.metalCache && Date.now() - this.metalCache.timestamp < 3000) {
      return this.metalCache.data;
    }
    if (this.activeMetalRequest) return this.activeMetalRequest;

    this.activeMetalRequest = (async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(
          `${this.BINANCE_API}/ticker/24hr?symbol=PAXGUSDT`,
          { signal: controller.signal },
        );
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('Binance metals error');
        const t = await res.json();
        const bid = parseFloat(t.lastPrice);
        const change = parseFloat(t.priceChangePercent);
        const data: Record<string, { bid: number; change: number }> = {};
        if (Number.isFinite(bid) && bid > 0) {
          data['XAU/USD'] = {
            bid,
            change: Number.isFinite(change) ? change : 0,
          };
        }
        this.metalCache = { data, timestamp: Date.now() };
        return data;
      } catch {
        return this.metalCache?.data || {};
      } finally {
        this.activeMetalRequest = null;
      }
    })();

    return this.activeMetalRequest;
  }

  /**
   * ✅ GET ALL PRICES (Unified)
   */
  async getAllPrices() {
    const [forexRates, cryptoPrices, metalPrices] = await Promise.all([
      this.getForexRates(),
      this.getCryptoPrices(),
      this.getMetalPrices(),
    ]);

    // Forex Formatting
    const forexSymbols = [
      { symbol: 'EUR/USD', base: 'EUR', quote: 'USD' },
      { symbol: 'GBP/USD', base: 'GBP', quote: 'USD' },
      { symbol: 'USD/JPY', base: 'USD', quote: 'JPY' },
      { symbol: 'AUD/USD', base: 'AUD', quote: 'USD' },
      { symbol: 'USD/CAD', base: 'USD', quote: 'CAD' },
      { symbol: 'USD/CHF', base: 'USD', quote: 'CHF' },
      { symbol: 'NZD/USD', base: 'NZD', quote: 'USD' },
      { symbol: 'EUR/GBP', base: 'EUR', quote: 'GBP' },
    ];

    const formattedForex = forexSymbols.map((s) => {
      const directQuote = this.massiveWebSocketService.getPrice(s.symbol);
      if (directQuote) {
        return {
          symbol: s.symbol,
          category: 'forex',
          bid: directQuote.bid,
          ask: directQuote.ask,
          spread: 1.5,
          change: this.getChangePercent(s.symbol, directQuote.bid),
        };
      }
      // Fallback Cross Rate
      const baseRate = forexRates[s.base] || 1;
      const quoteRate = forexRates[s.quote] || 1;
      const price = baseRate / quoteRate;
      const spread = s.symbol.includes('JPY') ? 0.02 : 0.00015;

      return {
        symbol: s.symbol,
        category: 'forex',
        bid: price,
        ask: price + spread,
        spread: s.symbol.includes('JPY') ? 2.0 : 1.5,
        change: this.getChangePercent(s.symbol, price),
      };
    });
    // Crypto Formatting
    const formattedCrypto = Object.entries(cryptoPrices)
      .map(([key, val]) => {
        const symbolMap: { [key: string]: string } = {
          bitcoin: 'BTC/USD',
          ethereum: 'ETH/USD',
          ripple: 'XRP/USD',
          solana: 'SOL/USD',
          cardano: 'ADA/USD',
          dogecoin: 'DOGE/USD',
        };
        return {
          symbol: symbolMap[key],
          category: 'crypto',
          coinId: key,
          bid: val.usd,
          ask: val.usd * 1.001,
          spread: 10,
          change:
            val.usd_24h_change != null
              ? parseFloat(val.usd_24h_change.toFixed(2))
              : this.getChangePercent(symbolMap[key], val.usd),
        };
      })
      .filter((x) => x.symbol);

    // Metal Formatting (XAU/USD, XAG/USD)
    // Price source priority: Massive WS quote → live Binance PAXG proxy (gold only)
    // → hardcoded fallback (last resort, stale). XAG has no live proxy yet.
    const metalSymbols = [
      { symbol: 'XAU/USD', spread: 0.5, fallbackBid: 2870.0 },
      { symbol: 'XAG/USD', spread: 0.03, fallbackBid: 32.5 },
    ];

    const formattedMetals = metalSymbols.map((s) => {
      const quote = this.massiveWebSocketService.getPrice(s.symbol);
      const live = metalPrices[s.symbol];
      const bid = quote?.bid ?? live?.bid ?? s.fallbackBid;
      const ask = quote?.ask ?? bid + s.spread;
      // Prefer the provider's real 24h change when we have a live quote; otherwise
      // fall back to the previous-day-close baseline tracker.
      const change =
        live?.change != null
          ? parseFloat(live.change.toFixed(2))
          : this.getChangePercent(s.symbol, bid);
      return {
        symbol: s.symbol,
        category: 'metal',
        bid,
        ask,
        spread: s.spread,
        change,
      };
    });

    return {
      forex: formattedForex,
      crypto: formattedCrypto,
      metals: formattedMetals,
      timestamp: new Date().toISOString(),
    };
  }

  async getSymbolPrice(symbol: string): Promise<number | null> {
    // 1. Check Forex WS
    const wsPrice = this.massiveWebSocketService.getPrice(symbol);
    if (wsPrice) return wsPrice.bid;

    // 2. Check Crypto WS
    const cryptoWS = this.binanceWebSocketService.getPrice(symbol);
    if (cryptoWS) return cryptoWS.bid;

    // 3. Fallback
    try {
      const all = await this.getAllPrices();
      const found = [...all.forex, ...all.crypto, ...(all.metals || [])].find(
        (x) => x.symbol === symbol,
      );
      return found ? found.bid : null;
    } catch {
      return null;
    }
  }

  clearCache() {
    this.cryptoCache = null;
    this.logger.log('Price cache cleared');
  }
}
