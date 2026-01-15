import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import WebSocket from 'ws';

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
  private useRestFallback = false; // Flag to switch modes

  constructor(private configService: ConfigService) {
    // Trim to ensure no accidental spaces
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
    // Stop any existing fallback
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
            
            // Handle Price
            if (response.event === 'price') {
              this.updatePriceCache(response.symbol, parseFloat(response.price), response.timestamp);
            }
            
            // Handle Errors (Like 404/401)
            if (response.event === 'error') {
              this.logger.warn(`WS Error Response: ${JSON.stringify(response)}`);
            }
          } catch (e) { /* Ignore */ }
        });

        this.ws.on('close', (code) => {
          this.stopHeartbeat();
          // If 1006 (Abnormal) or 404 related, might switch to REST
          this.logger.warn(`⚠️ Twelve Data WS Closed (Code: ${code}). Retrying in 5s...`);
          this.reconnectTimeout = setTimeout(() => this.connectWebSocket(), 5000);
        });

        this.ws.on('error', (err) => {
          this.logger.error(`Twelve Data WS Error: ${err.message}`);
          
          // 🚨 CRITICAL: If 404 or Connection Refused, switch to REST Fallback immediately
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

  // --- REST FALLBACK (The Safety Net) ---

  private startRestFallback() {
    if (this.restFallbackInterval) clearInterval(this.restFallbackInterval);
    
    this.logger.log('🔄 Starting REST Polling for Forex (3s Interval)...');
    
    // Poll immediately then interval
    this.pollRestPrices();
    this.restFallbackInterval = setInterval(() => this.pollRestPrices(), 3000); // 3 seconds
  }

  private stopRestFallback() {
    if (this.restFallbackInterval) clearInterval(this.restFallbackInterval);
  }

  private async pollRestPrices() {
    try {
      const symbolsStr = this.symbols.join(',');
      const url = `${this.REST_BASE}/price?symbol=${symbolsStr}&apikey=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      // Data format: { "EUR/USD": { "price": "1.08" }, ... }
      for (const [symbol, val] of Object.entries(data)) {
        if ((val as any).price) {
           this.updatePriceCache(symbol, parseFloat((val as any).price), Date.now() / 1000);
        }
      }
    } catch (e) {
      this.logger.debug(`REST Polling Error: ${e.message}`);
    }
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

  async getHistory(symbol: string, timeframe: string, limit: number = 50): Promise<Candlestick[]> {
    if (!this.apiKey) return [];

    // Map timeframe
    const intervalMap: { [key: string]: string } = {
      'M1': '1min', 'M5': '5min', 'M15': '15min', 'M30': '30min',
      'H1': '1h', 'H4': '4h', 'D1': '1day'
    };
    const interval = intervalMap[timeframe] || '1h';

    // Matches your provided URL format exactly
    const url = `${this.REST_BASE}/time_series?apikey=${this.apiKey}&symbol=${symbol}&interval=${interval}&outputsize=${limit}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'error') {
        this.logger.warn(`History Error for ${symbol}: ${data.message}`);
        return [];
      }

      if (!data.values) return [];

      return data.values.map((item: any) => ({
        time: new Date(item.datetime).getTime(),
        open: parseFloat(item.open),
        high: parseFloat(item.high),
        low: parseFloat(item.low),
        close: parseFloat(item.close),
        volume: parseInt(item.volume || '0'),
      })).reverse();

    } catch (error) {
      this.logger.error(`History Fetch Failed: ${error.message}`);
      return [];
    }
  }
}