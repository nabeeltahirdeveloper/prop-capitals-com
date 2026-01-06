import { Controller, Get, Param, Query, BadRequestException } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { Candlestick } from './market-data.service';
import { BinanceWebSocketService } from './binance-websocket.service';

@Controller('market-data')
export class MarketDataController {
  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly binanceWebSocketService: BinanceWebSocketService,
  ) {}

  /**
   * Test endpoint to verify controller is working
   * GET /market-data/test
   */
  @Get('test')
  test() {
    return { message: 'Market data controller is working', timestamp: new Date().toISOString() };
  }

  /**
   * Get WebSocket connection status
   * GET /market-data/ws-status
   */
  @Get('ws-status')
  getWSStatus() {
    return {
      connected: this.binanceWebSocketService.isWSConnected(),
      uptime: this.binanceWebSocketService.getConnectionUptime(),
      prices: Array.from(this.binanceWebSocketService.getAllPrices().entries()).map(([symbol, price]) => ({
        symbol,
        bid: price.bid,
        ask: price.ask,
        timestamp: price.timestamp,
      })),
    };
  }

  /**
   * Get historical candlestick data for a symbol
   * GET /market-data/history?symbol=EUR/USD&timeframe=M5&limit=100
   * Query params: symbol, timeframe (M1, M5, M15, M30, H1, H4, D1), limit (number of candles)
   */
  @Get('history')
  async getHistory(
    @Query('symbol') symbol: string,
    @Query('timeframe') timeframe: string = 'M5',
    @Query('limit') limit: string = '100',
  ): Promise<Candlestick[]> {
    if (!symbol) {
      throw new BadRequestException('Symbol parameter is required');
    }
    const limitNum = parseInt(limit, 10) || 100;
    return this.marketDataService.getHistory(symbol, timeframe, limitNum);
  }

  /**
   * Get current price for a symbol
   * GET /market-data/current?symbol=EUR/USD
   */
  @Get('current')
  async getCurrentPrice(@Query('symbol') symbol: string) {
    if (!symbol) {
      throw new BadRequestException('Symbol parameter is required');
    }
    return this.marketDataService.getCurrentPrice(symbol);
  }

  /**
   * Get crypto candles from Binance (real candles, no aggregation)
   * GET /market-data/crypto/candles?symbol=BTC/USD&timeframe=M5&limit=500
   */
  @Get('crypto/candles')
  async getCryptoCandles(
    @Query('symbol') symbol: string,
    @Query('timeframe') timeframe: string = 'M5',
    @Query('limit') limit: string = '500',
  ): Promise<Candlestick[]> {
    if (!symbol) {
      throw new BadRequestException('Symbol parameter is required');
    }
    const limitNum = parseInt(limit, 10) || 500;
    return this.marketDataService.getCryptoCandles(symbol, timeframe, limitNum);
  }

  /**
   * Get crypto quotes for multiple symbols (for watchlist)
   * GET /market-data/crypto/quote?symbols=BTC/USD,ETH/USD
   */
  @Get('crypto/quote')
  async getCryptoQuotes(@Query('symbols') symbols: string) {
    if (!symbols) {
      throw new BadRequestException('Symbols parameter is required (comma-separated)');
    }
    const symbolList = symbols.split(',').map(s => s.trim());
    return this.marketDataService.getCryptoQuotes(symbolList);
  }

  /**
   * Unified price endpoint - returns all prices (crypto + forex) with WebSocket priority
   * GET /market-data/prices?symbols=BTC/USD,EUR/USD,ETH/USD
   * If no symbols provided, returns all available symbols
   */
  @Get('prices')
  async getUnifiedPrices(@Query('symbols') symbols?: string) {
    const symbolList = symbols ? symbols.split(',').map(s => s.trim()) : [];
    
    // Get prices from WebSocket (if available) and REST (fallback)
    const prices = await this.marketDataService.getUnifiedPrices(symbolList);
    
    return {
      prices,
      source: this.binanceWebSocketService.isWSConnected() ? 'websocket' : 'rest',
      timestamp: Date.now(),
    };
  }
}
