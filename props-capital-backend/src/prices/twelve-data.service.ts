import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';
import { ResilientHttpService, CircuitState } from '../common/resilient-http.service';

export interface Candlestick {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

@Injectable()
export class TwelveDataService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TwelveDataService.name);
  private ws: WebSocket | null = null;
  private readonly apiKey: string;
  private readonly REST_BASE = 'https://api.twelvedata.com';
  
  private readonly symbols = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD',
    'USD/CAD', 'USD/CHF', 'NZD/USD', 'EUR/GBP'
  ];
  
  // Real-time cache
  private priceCache = new Map<string, { bid: number; ask: number; timestamp: number }>();
  
  // Connection Management
  private reconnectTimeout: NodeJS.Timeout;
  private pingInterval: NodeJS.Timeout;
  private restFallbackInterval: NodeJS.Timeout;
  private useRestFallback = false;

  // Track consecutive failures to reduce log spam
  private consecutiveFailures = 0;
  private readonly MAX_LOG_FAILURES = 3;

  constructor(
    private configService: ConfigService,
    private httpService: ResilientHttpService, // Inject resilient HTTP service
  ) {
    const key = this.configService.get<string>('TWELVE_DATA_API_KEY');
    this.apiKey = key ? key.trim() : '';
  }

  onModuleInit() {
    if (!this.apiKey) {
      this.logger.error('❌ TWELVE_DATA_API_KEY missing! Forex data will fail.');
      return;
    }
    this.connectWebSocket();
  }

  onModuleDestroy() {
    this.disconnect();
    this.stopRestFallback();
  }

  // --- WEBSOCKET CONNECTION ---

  private connectWebSocket() {
    if (this.useRestFallback) return; 

    const url = `wss://ws.twelvedata.com/v1/quotes?apikey=${this.apiKey}`;
    
    try {
        this.logger.log(`🔌 Connecting to Twelve Data WS...`);
        this.ws = new WebSocket(url);

        this.ws.on('open', () => {
          this.logger.log('✅ Twelve Data WebSocket Connected');
          this.subscribe();
          this.startHeartbeat();
        });

        this.ws.on('message', (data) => {
          try {
            const response = JSON.parse(data.toString());
            
            if (response.event === 'price') {
              this.updatePriceCache(response.symbol, parseFloat(response.price), response.timestamp);
            }
            
            if (response.event === 'error') {
              this.logger.warn(`WS Error Response: ${JSON.stringify(response)}`);
            }
          } catch (e) { /* Ignore */ }
        });

        this.ws.on('close', (code) => {
          this.stopHeartbeat();
          this.logger.warn(`⚠️ Twelve Data WS Closed (Code: ${code}). Retrying in 5s...`);
          this.reconnectTimeout = setTimeout(() => this.connectWebSocket(), 5000);
        });

        this.ws.on('error', (err) => {
          this.logger.error(`Twelve Data WS Error: ${err.message}`);
          
          if (err.message.includes('404') || err.message.includes('400') || err.message.includes('401') || err.message.includes('403')) {
             this.logger.warn('🚨 WebSocket rejected. Switching to REST Polling Mode (Safe Mode).');
             this.useRestFallback = true;
             if (this.ws) { this.ws.close(); this.ws = null; }
             this.startRestFallback();
          }
        });

    } catch (error) {
        this.logger.error(`Failed to init WS: ${error.message}`);
        this.useRestFallback = true;
        this.startRestFallback();
    }
  }

  private subscribe() {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    const msg = { action: 'subscribe', params: { symbols: this.symbols.join(',') } };
    this.ws.send(JSON.stringify(msg));
  }

  // --- REST FALLBACK (Using Resilient HTTP) ---

  private startRestFallback() {
    if (this.restFallbackInterval) clearInterval(this.restFallbackInterval);
    
    this.logger.log('🔄 Starting REST Polling for Forex (3s Interval)...');
    
    this.pollRestPrices();
    this.restFallbackInterval = setInterval(() => this.pollRestPrices(), 3000);
  }

  private stopRestFallback() {
    if (this.restFallbackInterval) clearInterval(this.restFallbackInterval);
  }

  /**
   * Poll REST API with resilient HTTP (timeout, retry, circuit breaker)
   */
  private async pollRestPrices() {
    const symbolsStr = this.symbols.join(',');
    const url = `${this.REST_BASE}/price?symbol=${symbolsStr}&apikey=${this.apiKey}`;
    
    // Use resilient HTTP service instead of raw fetch
    const result = await this.httpService.get<Record<string, { price: string }>>(url, {
      timeout: 5000,           // 5 second timeout for polling
      retries: 1,              // Only 1 retry for polling (we'll try again in 3s anyway)
      retryDelay: 500,
      circuitName: 'twelvedata-rest',
    });

    if (result.success && result.data) {
      // Reset failure counter on success
      this.consecutiveFailures = 0;

      for (const [symbol, val] of Object.entries(result.data)) {
        if (val?.price) {
          this.updatePriceCache(symbol, parseFloat(val.price), Date.now() / 1000);
        }
      }
    } else {
      // Only log first few failures to reduce spam
      this.consecutiveFailures++;
      if (this.consecutiveFailures <= this.MAX_LOG_FAILURES) {
        this.logger.warn(`REST Polling failed (${this.consecutiveFailures}): ${result.error}`);
      } else if (this.consecutiveFailures === this.MAX_LOG_FAILURES + 1) {
        this.logger.warn(`REST Polling continues to fail. Suppressing further logs until recovery.`);
      }

      // If circuit is open, we could switch back to trying WebSocket
      if (result.errorCode === 'CIRCUIT_OPEN') {
        this.logger.warn('Circuit open for TwelveData REST. Consider trying WebSocket again.');
      }
    }
  }

  /**
   * Get historical candles with resilient HTTP
   */
  async getHistory(symbol: string, timeframe: string, limit: number = 50): Promise<Candlestick[]> {
    if (!this.apiKey) return [];

    const intervalMap: { [key: string]: string } = {
      'M1': '1min', 'M5': '5min', 'M15': '15min', 'M30': '30min',
      'H1': '1h', 'H4': '4h', 'D1': '1day'
    };
    const interval = intervalMap[timeframe] || '1h';

    const url = `${this.REST_BASE}/time_series?apikey=${this.apiKey}&symbol=${symbol}&interval=${interval}&outputsize=${limit}`;

    // Use resilient HTTP service
    const result = await this.httpService.get<{
      status?: string;
      message?: string;
      values?: Array<{
        datetime: string;
        open: string;
        high: string;
        low: string;
        close: string;
        volume?: string;
      }>;
    }>(url, {
      timeout: 15000,          // 15 second timeout for history (larger response)
      retries: 2,              // 2 retries for history requests
      retryDelay: 1000,
      circuitName: 'twelvedata-rest',
    });

    if (!result.success) {
      this.logger.warn(`History fetch failed for ${symbol}: ${result.error}`);
      return [];
    }

    const data = result.data;

    if (data?.status === 'error') {
      this.logger.warn(`History Error for ${symbol}: ${data.message}`);
      return [];
    }

    if (!data?.values) return [];

    return data.values.map((item) => ({
      time: new Date(item.datetime).getTime(),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseInt(item.volume || '0'),
    })).reverse();
  }

  // --- UTILS ---

  private updatePriceCache(symbol: string, price: number, timestamp: number) {
    const spread = 0.00015; // 1.5 pips
    this.priceCache.set(symbol, {
      bid: price - (spread / 2),
      ask: price + (spread / 2),
      timestamp: timestamp * 1000 
    });
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ action: 'heartbeat' }));
      }
    }, 10000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) clearInterval(this.pingInterval);
  }

  private disconnect() {
    this.stopHeartbeat();
    clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
  }

  // --- PUBLIC API ---

  getPrice(symbol: string) {
    return this.priceCache.get(symbol);
  }

  /**
   * Get circuit breaker status for monitoring
   */
  getCircuitStatus(): CircuitState {
    const status = this.httpService.getCircuitStatus('twelvedata-rest');
    return status['twelvedata-rest']?.state || 'CLOSED';
  }
}