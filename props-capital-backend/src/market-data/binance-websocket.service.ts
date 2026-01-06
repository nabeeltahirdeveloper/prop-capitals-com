import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as ws from 'ws';

interface PriceUpdate {
  symbol: string;
  bid: number;
  ask: number;
  timestamp: number;
}

@Injectable()
export class BinanceWebSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BinanceWebSocketService.name);
  private ws: ws.WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 5;
  private readonly RECONNECT_DELAY = 5000; // 5 seconds

  // Symbol mapping: frontend format -> Binance format
  private readonly SYMBOL_MAP: { [key: string]: string } = {
    'BTC/USD': 'btcusdt',
    'ETH/USD': 'ethusdt',
    'XRP/USD': 'xrpusdt',
    'SOL/USD': 'solusdt',
    'ADA/USD': 'adausdt',
    'DOGE/USD': 'dogeusdt',
  };

  // Reverse mapping: Binance format -> frontend format
  private readonly REVERSE_SYMBOL_MAP: { [key: string]: string } = {
    'btcusdt': 'BTC/USD',
    'ethusdt': 'ETH/USD',
    'xrpusdt': 'XRP/USD',
    'solusdt': 'SOL/USD',
    'adausdt': 'ADA/USD',
    'dogeusdt': 'DOGE/USD',
  };

  // Current prices cache (updated from WebSocket)
  private priceCache: Map<string, PriceUpdate> = new Map();

  // Subscribers: symbol -> Set of callbacks
  private subscribers: Map<string, Set<(price: PriceUpdate) => void>> = new Map();

  // Connection state
  private isConnected = false;
  private connectionStartTime = 0;

  onModuleInit() {
    this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  /**
   * Connect to Binance WebSocket stream
   */
  private connect() {
    try {
      // Build stream names for all crypto symbols
      const streams = Object.values(this.SYMBOL_MAP)
        .map(symbol => `${symbol}@bookTicker`) // bookTicker provides bid/ask prices
        .join('/');

      const wsUrl = `wss://stream.binance.com:9443/stream?streams=${streams}`;
      
      this.logger.log(`[Binance WS] Connecting to: ${wsUrl}`);
      this.connectionStartTime = Date.now();

      this.ws = new ws.WebSocket(wsUrl);

      if (!this.ws) {
        this.logger.error('[Binance WS] Failed to create WebSocket instance');
        this.scheduleReconnect();
        return;
      }

      this.ws.on('open', () => {
        this.logger.log('[Binance WS] ✅ Connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      });

      this.ws.on('message', (data: ws.Data) => {
        try {
          const message = JSON.parse(data.toString());
          
          if (message.stream && message.data) {
            this.handlePriceUpdate(message.stream, message.data);
          }
        } catch (error) {
          this.logger.error(`[Binance WS] Error parsing message: ${error.message}`);
        }
      });

      this.ws.on('error', (error) => {
        this.logger.error(`[Binance WS] Error: ${error.message}`);
        this.isConnected = false;
        this.scheduleReconnect();
      });

      this.ws.on('close', () => {
        this.logger.warn('[Binance WS] Connection closed');
        this.isConnected = false;
        this.scheduleReconnect();
      });

    } catch (error) {
      this.logger.error(`[Binance WS] Failed to connect: ${error.message}`);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle price update from WebSocket
   */
  private handlePriceUpdate(stream: string, data: any) {
    try {
      // Extract symbol from stream (e.g., "btcusdt@bookTicker" -> "btcusdt")
      const binanceSymbol = stream.split('@')[0].toLowerCase();
      const frontendSymbol = this.REVERSE_SYMBOL_MAP[binanceSymbol];

      if (!frontendSymbol) {
        return; // Unknown symbol, skip
      }

      // Extract bid and ask from bookTicker data
      const bid = parseFloat(data.b || data.bidPrice || '0');
      const ask = parseFloat(data.a || data.askPrice || '0');

      if (isNaN(bid) || isNaN(ask) || bid <= 0 || ask <= 0) {
        this.logger.warn(`[Binance WS] Invalid price data for ${frontendSymbol}: bid=${bid}, ask=${ask}`);
        return;
      }

      const priceUpdate: PriceUpdate = {
        symbol: frontendSymbol,
        bid,
        ask,
        timestamp: Date.now(),
      };

      // Update cache
      this.priceCache.set(frontendSymbol, priceUpdate);

      // Notify subscribers
      const symbolSubscribers = this.subscribers.get(frontendSymbol);
      if (symbolSubscribers) {
        symbolSubscribers.forEach(callback => {
          try {
            callback(priceUpdate);
          } catch (error) {
            this.logger.error(`[Binance WS] Error in subscriber callback: ${error.message}`);
          }
        });
      }

      // Also notify for "all" subscribers
      const allSubscribers = this.subscribers.get('*');
      if (allSubscribers) {
        allSubscribers.forEach(callback => {
          try {
            callback(priceUpdate);
          } catch (error) {
            this.logger.error(`[Binance WS] Error in all-subscriber callback: ${error.message}`);
          }
        });
      }

    } catch (error) {
      this.logger.error(`[Binance WS] Error handling price update: ${error.message}`);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect() {
    if (this.reconnectTimer) {
      return; // Already scheduled
    }

    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      this.logger.error('[Binance WS] Max reconnection attempts reached. Falling back to REST polling.');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.RECONNECT_DELAY * this.reconnectAttempts; // Exponential backoff

    this.logger.log(`[Binance WS] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Disconnect WebSocket
   */
  private disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.isConnected = false;
    this.logger.log('[Binance WS] Disconnected');
  }

  /**
   * Get current price for a symbol (from cache)
   */
  getPrice(symbol: string): PriceUpdate | null {
    return this.priceCache.get(symbol) || null;
  }

  /**
   * Get all current prices (from cache)
   */
  getAllPrices(): Map<string, PriceUpdate> {
    return new Map(this.priceCache);
  }

  /**
   * Subscribe to price updates for a symbol
   * @param symbol Symbol to subscribe to, or '*' for all symbols
   * @param callback Callback function to receive updates
   * @returns Unsubscribe function
   */
  subscribe(symbol: string, callback: (price: PriceUpdate) => void): () => void {
    if (!this.subscribers.has(symbol)) {
      this.subscribers.set(symbol, new Set());
    }

    this.subscribers.get(symbol)!.add(callback);

    // Immediately send current price if available
    if (symbol === '*') {
      this.priceCache.forEach(price => callback(price));
    } else {
      const currentPrice = this.priceCache.get(symbol);
      if (currentPrice) {
        callback(currentPrice);
      }
    }

    // Return unsubscribe function
    return () => {
      const symbolSubscribers = this.subscribers.get(symbol);
      if (symbolSubscribers) {
        symbolSubscribers.delete(callback);
        if (symbolSubscribers.size === 0) {
          this.subscribers.delete(symbol);
        }
      }
    };
  }

  /**
   * Check if WebSocket is connected
   */
  isWSConnected(): boolean {
    return this.isConnected && this.ws?.readyState === ws.WebSocket.OPEN;
  }

  /**
   * Get connection uptime
   */
  getConnectionUptime(): number {
    if (!this.isConnected || this.connectionStartTime === 0) {
      return 0;
    }
    return Date.now() - this.connectionStartTime;
  }
}

