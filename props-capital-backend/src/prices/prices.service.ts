import { Injectable, Logger } from '@nestjs/common';
import { TwelveDataService } from './twelve-data.service';
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

  private readonly BINANCE_API = 'https://api.binance.com/api/v3';

  constructor(
    private readonly twelveDataService: TwelveDataService,
    private readonly binanceWebSocketService: BinanceWebSocketService, // <--- Injected
    private readonly httpService: ResilientHttpService,
  ) {}

  /**
   * ✅ GET FOREX RATES (Twelve Data WS)
   */
  async getForexRates(): Promise<ForexRates> {
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
      const quote = this.twelveDataService.getPrice(p.symbol);
      if (quote) {
        rates[p.base] = p.inverse ? 1 / quote.bid : quote.bid;
      } else {
        // Startup fallbacks
        if (p.symbol === 'EUR/USD') rates['EUR'] = 1.08;
      }
    }
    rates['USD'] = 1;
    return rates;
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
            prices[coinId] = { usd: val.bid, usd_24h_change: 0 }; // WS doesn't give 24h change, handled elsewhere or ignored
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
    } catch (e) {
      return {};
    }
  }

  /**
   * ✅ GET ALL PRICES (Unified)
   */
  async getAllPrices() {
    const [forexRates, cryptoPrices] = await Promise.all([
      this.getForexRates(),
      this.getCryptoPrices(),
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
      const directQuote = this.twelveDataService.getPrice(s.symbol);
      if (directQuote) {
        return {
          symbol: s.symbol,
          category: 'forex',
          bid: directQuote.bid,
          ask: directQuote.ask,
          spread: 1.5,
          change: 0,
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
        change: 0,
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
          change: val.usd_24h_change || 0,
        };
      })
      .filter((x) => x.symbol);

    return {
      forex: formattedForex,
      crypto: formattedCrypto,
      timestamp: new Date().toISOString(),
    };
  }

  async getSymbolPrice(symbol: string): Promise<number | null> {
    // 1. Check Forex WS
    const wsPrice = this.twelveDataService.getPrice(symbol);
    if (wsPrice) return wsPrice.bid;

    // 2. Check Crypto WS
    const cryptoWS = this.binanceWebSocketService.getPrice(symbol);
    if (cryptoWS) return cryptoWS.bid;

    // 3. Fallback
    try {
      const all = await this.getAllPrices();
      const found = [...all.forex, ...all.crypto].find(
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
