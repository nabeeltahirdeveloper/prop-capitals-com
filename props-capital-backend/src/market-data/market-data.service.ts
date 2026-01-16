import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PricesService } from '../prices/prices.service';
import { BinanceMarketService } from './binance-market.service';
import { BinanceWebSocketService } from '../prices/binance-websocket.service';
import { TwelveDataService, Candlestick } from '../prices/twelve-data.service';
import { ResilientHttpService } from 'src/common/resilient-http.service';

@Injectable()
export class MarketDataService {
  private readonly logger = new Logger(MarketDataService.name);

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
    private readonly twelveDataService: TwelveDataService,
    private readonly httpService: ResilientHttpService,
  ) {}

  private isForexSymbol(symbol: string): boolean {
    return this.FOREX_SYMBOLS.includes(symbol);
  }
  private isCryptoSymbol(symbol: string): boolean {
    return symbol in this.CRYPTO_SYMBOLS;
  }

  /**
   * Get Current Price (WebSocket Optimized)
   */
  async getCurrentPrice(symbol: string) {
    try {
      // 1. FOREX (Twelve Data WS)
      if (this.isForexSymbol(symbol)) {
        const wsPrice = this.twelveDataService.getPrice(symbol);
        if (wsPrice) {
          return {
            symbol,
            price: wsPrice.bid,
            bid: wsPrice.bid,
            ask: wsPrice.ask,
            timestamp: new Date(wsPrice.timestamp).toISOString(),
          };
        }
        // Fallback to PricesService (Cached REST) if WS is warming up
        const all = await this.pricesService.getAllPrices();
        const data = all.forex.find((f) => f.symbol === symbol);
        if (data) return { ...data, price: data.bid, timestamp: all.timestamp };
      }

      // 2. CRYPTO (Binance WS)
      if (this.isCryptoSymbol(symbol)) {
        const wsPrice = this.binanceWebSocketService.getPrice(symbol);
        if (wsPrice && this.binanceWebSocketService.isWSConnected()) {
          return {
            symbol,
            price: wsPrice.bid,
            bid: wsPrice.bid,
            ask: wsPrice.ask,
            timestamp: new Date(wsPrice.timestamp).toISOString(),
          };
        }
        const all = await this.pricesService.getAllPrices();
        const data = all.crypto.find((c) => c.symbol === symbol);
        if (data) return { ...data, price: data.bid, timestamp: all.timestamp };
      }

      throw new NotFoundException(`Symbol ${symbol} not available`);
    } catch (e) {
      this.logger.warn(`Price fetch failed for ${symbol}: ${e.message}`);
      throw e;
    }
  }

  /**
   * Get Real History (No Synthetic Data)
   */
  async getHistory(
    symbol: string,
    timeframe: string = 'M5',
    limit: number = 100,
  ): Promise<Candlestick[]> {
    try {
      if (this.isForexSymbol(symbol)) {
        // ✅ Twelve Data Real History
        return await this.twelveDataService.getHistory(
          symbol,
          timeframe,
          limit,
        );
      }

      if (this.isCryptoSymbol(symbol)) {
        // ✅ Binance Real History
        // Ensure Binance service returns compatible Candlestick format
        const candles = await this.binanceMarketService.getCryptoCandles(
          symbol,
          timeframe,
          limit,
        );
        // Map to shared Candlestick interface if needed, or assume compatibility
        return candles as unknown as Candlestick[];
      }

      return [];
    } catch (error) {
      this.logger.error(`History failed for ${symbol}: ${error.message}`);
      return [];
    }
  }

  /**
   * Get Unified Prices for Watchlist
   * Iterates through requested symbols and fetches current price
   */
  async getUnifiedPrices(symbolList: string[] = []) {
    const targetSymbols =
      symbolList.length > 0
        ? symbolList
        : [...this.FOREX_SYMBOLS, ...Object.keys(this.CRYPTO_SYMBOLS)];

    // We process these in parallel for speed
    const promises = targetSymbols.map(async (symbol) => {
      try {
        const priceData = await this.getCurrentPrice(symbol);
        return {
          symbol: priceData.symbol,
          bid: priceData.bid,
          ask: priceData.ask,
          price: priceData.price,
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
   * Get Crypto Quotes (specific format for some frontend components)
   */
  async getCryptoQuotes(symbols: string[]) {
    const data = await this.getUnifiedPrices(symbols);
    return data.map((p) => ({
      symbol: p.symbol,
      bid: p.bid,
      ask: p.ask,
      price: p.price,
      priceChangePercent: 0, // We can calculate 24h change later if needed
    }));
  }

  // Keep compatibility for any other services using this
  async getCryptoCandles(symbol: string, timeframe: string, limit: number) {
    return this.binanceMarketService.getCryptoCandles(symbol, timeframe, limit);
  }
}

export type { Candlestick };
