import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import WebSocket from 'ws';

@Injectable()
export class BinanceWebSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BinanceWebSocketService.name);
  private ws: WebSocket | null = null;
  private isConnected = false;
  private connectTime: number = 0;
  private reconnectTimeout: NodeJS.Timeout;

  // Map<symbol, { bid, ask, timestamp }>
  // Key format: 'BTC/USD'
  private priceCache = new Map<string, { bid: number; ask: number; timestamp: number }>();

  // Streams to subscribe
  private readonly BINANCE_STREAMS = [
    'btcusdt@bookTicker',
    'ethusdt@bookTicker',
    'xrpusdt@bookTicker',
    'solusdt@bookTicker',
    'adausdt@bookTicker',
    'dogeusdt@bookTicker',
  ];

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  private connect() {
    const streamUrl = `wss://stream.binance.com:9443/stream?streams=${this.BINANCE_STREAMS.join('/')}`;
    this.logger.log(`[Binance WS] Connecting...`);
    
    try {
        this.ws = new WebSocket(streamUrl);

        this.ws.on('open', () => {
          this.logger.log(`[Binance WS] ✅ Connected successfully`);
          this.isConnected = true;
          this.connectTime = Date.now();
        });

        this.ws.on('message', (data) => {
          try {
            const payload = JSON.parse(data.toString());
            // Payload: { stream: '...', data: { s: 'BTCUSDT', b: '...', a: '...' } }
            if (payload.data) {
                this.handleMessage(payload.data);
            }
          } catch(e) {}
        });

        this.ws.on('close', () => {
            this.logger.warn(`[Binance WS] Disconnected. Reconnecting...`);
            this.isConnected = false;
            this.reconnectTimeout = setTimeout(() => this.connect(), 5000);
        });
        
        this.ws.on('error', (err) => {
            this.logger.error(`[Binance WS] Error: ${err.message}`);
        });
    } catch (error) {
        this.logger.error(`[Binance WS] Init Failed: ${error.message}`);
        this.reconnectTimeout = setTimeout(() => this.connect(), 5000);
    }
  }

  private disconnect() {
      if (this.ws) {
          this.ws.removeAllListeners();
          this.ws.close();
      }
      clearTimeout(this.reconnectTimeout);
  }

  private handleMessage(data: any) {
      // Map Binance 's' (Symbol) to our System Symbol
      const symbolMap: { [key: string]: string } = {
          'BTCUSDT': 'BTC/USD',
          'ETHUSDT': 'ETH/USD',
          'XRPUSDT': 'XRP/USD',
          'SOLUSDT': 'SOL/USD',
          'ADAUSDT': 'ADA/USD',
          'DOGEUSDT': 'DOGE/USD'
      };
      
      const symbol = symbolMap[data.s];
      if (symbol) {
          this.priceCache.set(symbol, {
              bid: parseFloat(data.b),
              ask: parseFloat(data.a),
              timestamp: Date.now()
          });
      }
  }

  // --- PUBLIC API ---

  isWSConnected() { return this.isConnected; }
  
  getConnectionUptime() {
      return this.isConnected ? Date.now() - this.connectTime : 0;
  }

  getPrice(symbol: string) {
      return this.priceCache.get(symbol);
  }

  getAllPrices() {
      return this.priceCache;
  }
}