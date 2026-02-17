import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { Candlestick } from './market-data.service';
import { BinanceWebSocketService } from '../prices/binance-websocket.service';
import { MassiveWebSocketService } from '../prices/massive-websocket.service';

@Controller('market-data')
export class MarketDataController {
  constructor(
    private readonly marketDataService: MarketDataService,
    private readonly binanceWebSocketService: BinanceWebSocketService,
    private readonly massiveWebSocketService: MassiveWebSocketService,
  ) {}

  /**
   * Test endpoint to verify controller is working
   * GET /market-data/test
   */
  @Get('test')
  test() {
    return {
      message: 'Market data controller is working',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get WebSocket connection status for both crypto and forex
   * GET /market-data/ws-status
   */
  @Get('ws-status')
  getWSStatus() {
    const cryptoPrices = Array.from(
      this.binanceWebSocketService.getAllPrices().entries(),
    ).map(([symbol, price]) => ({
      symbol,
      bid: price.bid,
      ask: price.ask,
      timestamp: price.timestamp,
    }));

    const forexPrices = Array.from(
      this.massiveWebSocketService.getAllPrices().entries(),
    ).map(([symbol, price]) => ({
      symbol,
      bid: price.bid,
      ask: price.ask,
      timestamp: price.timestamp,
    }));

    return {
      crypto: {
        connected: this.binanceWebSocketService.isWSConnected(),
        uptime: this.binanceWebSocketService.getConnectionUptime(),
        prices: cryptoPrices,
      },
      forex: {
        connected: this.massiveWebSocketService.isWSConnected(),
        status: this.massiveWebSocketService.getStatus(),
        prices: forexPrices,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Debug endpoint for circuit breaker and synthetic data status
   * GET /market-data/debug
   */
  @Get('debug')
  getDebugStatus() {
    return {
      circuitBreaker: this.marketDataService.getCircuitBreakerStatus(),
      forexStatus: this.massiveWebSocketService.getStatus(),
      cryptoStatus: {
        connected: this.binanceWebSocketService.isWSConnected(),
        uptime: this.binanceWebSocketService.getConnectionUptime(),
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get historical candlestick data for a symbol
   * GET /market-data/history?symbol=EUR/USD&timeframe=M5&limit=100
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
    
    const limitNum = Math.min(parseInt(limit, 10) || 100, 5000); // Cap at 5000
    const validTimeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1', 'MN'];
    const tf = validTimeframes.includes(timeframe) ? timeframe : 'M5';
    
    return this.marketDataService.getHistory(symbol, tf, limitNum);
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
   * Get crypto candles from Binance
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
    const limitNum = Math.min(parseInt(limit, 10) || 500, 1000);
    return this.marketDataService.getCryptoCandles(symbol, timeframe, limitNum);
  }

  /**
   * Get crypto quotes for multiple symbols
   * GET /market-data/crypto/quote?symbols=BTC/USD,ETH/USD
   */
  @Get('crypto/quote')
  async getCryptoQuotes(@Query('symbols') symbols: string) {
    if (!symbols) {
      throw new BadRequestException(
        'Symbols parameter is required (comma-separated)',
      );
    }
    const symbolList = symbols.split(',').map((s) => s.trim());
    return this.marketDataService.getCryptoQuotes(symbolList);
  }

  /**
   * Unified price endpoint - returns all prices with WebSocket priority
   * GET /market-data/prices?symbols=BTC/USD,EUR/USD,ETH/USD
   */
  @Get('prices')
  async getUnifiedPrices(@Query('symbols') symbols?: string) {
    const symbolList = symbols ? symbols.split(',').map((s) => s.trim()) : [];

    const prices = await this.marketDataService.getUnifiedPrices(symbolList);

    return {
      prices,
      source: {
        crypto: this.binanceWebSocketService.isWSConnected() ? 'websocket' : 'rest',
        forex: this.massiveWebSocketService.isWSConnected() ? 'websocket' : 'mock',
      },
      timestamp: Date.now(),
    };
  }
}