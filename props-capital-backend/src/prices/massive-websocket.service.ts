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

/**
 * Massive.com WebSocket Service for Forex Real-Time Prices
 * Based on: https://massive.com/docs/websocket/forex/quotes
 * 
 * Message format for quotes (ev: "C"):
 * {
 *   ev: "C",        // Event type: Quote
 *   p: "EUR-USD",   // Pair (with dash)
 *   x: 48,          // Exchange ID
 *   a: 1.0852,      // Ask price
 *   b: 1.0850,      // Bid price
 *   t: 1705435200000 // Timestamp in Unix MS
 * }
 * 
 * Subscription format: "C.{ticker}" where ticker is "EUR-USD"
 */
@Injectable()
export class MassiveWebSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MassiveWebSocketService.name);
  private ws: WebSocket | null = null;
  private readonly apiKey: string;
  private readonly wsUrl = 'wss://socket.massive.com/forex'; // PAID: Real-time forex endpoint
  
  // Forex pairs in Massive.com format (dash-separated)
  private readonly massivePairs = [
    'EUR-USD', 'GBP-USD', 'USD-JPY', 'AUD-USD',
    'USD-CAD', 'USD-CHF', 'NZD-USD', 'EUR-GBP'
  ];
  
  // Map for conversion: "EUR/USD" -> "EUR-USD"
  private readonly normalizedSymbols = [
    'EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD',
    'USD/CAD', 'USD/CHF', 'NZD/USD', 'EUR/GBP'
  ];
  
  // Real-time cache (using normalized symbols like "EUR/USD")
  private priceCache = new Map<string, { bid: number; ask: number; timestamp: number }>();
  
  private reconnectTimeout: NodeJS.Timeout;
  private isConnected = false;
  private authenticated = false;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('MASSIVE_API_KEY') || '';
  }

  onModuleInit() {
    if (!this.apiKey) {
      this.logger.error('❌ MASSIVE_API_KEY missing! Get your key from: https://massive.com/dashboard/keys');
      return;
    }
    this.logger.log('🚀 Starting Massive.com Forex WebSocket (PAID subscription)...');
    this.connect();
  }

  onModuleDestroy() {
    this.disconnect();
  }

  private connect() {
    try {
      this.logger.log(`🔌 Connecting to Massive.com WebSocket (Forex)...`);
      
      // Connect to forex-specific endpoint
      this.ws = new WebSocket(this.wsUrl);

      this.ws.on('open', () => {
        this.logger.log('✅ Massive.com WebSocket Connected - Authenticating...');
        this.isConnected = true;
        this.authenticate();
      });

      this.ws.on('message', (data) => {
        try {
          const messages = JSON.parse(data.toString());
          
          // DEBUG: Log raw messages to understand format
          this.logger.debug(`[Massive WS] Received: ${JSON.stringify(messages).substring(0, 200)}`);
          
          // Massive sends array of messages
          const msgArray = Array.isArray(messages) ? messages : [messages];
          
          msgArray.forEach((msg) => {
            // Handle status messages
            if (msg.ev === 'status') {
              this.logger.log(`📡 Massive.com Status: ${msg.status} - ${msg.message || ''}`);
              
              if (msg.status === 'connected') {
                return;
              }
              
              if (msg.status === 'auth_success') {
                this.logger.log('🔐 Massive.com: Authenticated successfully');
                this.authenticated = true;
                this.subscribe();
                return;
              }
              
              if (msg.status === 'auth_failed') {
                this.logger.error('❌ Massive.com: Authentication failed - Check your API key');
                this.logger.error('Get valid key from: https://massive.com/dashboard/keys');
                this.authenticated = false;
                return;
              }
              
              return;
            }
            
            // Handle quote messages (ev: "C")
            if (msg.ev === 'C' && msg.p && msg.a && msg.b) {
              this.updatePriceCache(msg.p, msg.b, msg.a, msg.t);
            }
          });
          
        } catch (e) {
          this.logger.warn(`Failed to parse message: ${e.message}`);
        }
      });

      this.ws.on('close', (code) => {
        this.isConnected = false;
        this.authenticated = false;
        this.logger.warn(`⚠️ Massive.com WS Closed (Code: ${code}). Reconnecting in 5s...`);
        this.reconnectTimeout = setTimeout(() => this.connect(), 5000);
      });

      this.ws.on('error', (err) => {
        this.logger.error(`Massive.com WS Error: ${err.message}`);
      });

    } catch (error) {
      this.logger.error(`Failed to connect to Massive.com: ${error.message}`);
      this.reconnectTimeout = setTimeout(() => this.connect(), 5000);
    }
  }

  private authenticate() {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    
    // Send authentication message as per Massive.com docs
    const authMsg = {
      action: 'auth',
      params: this.apiKey
    };
    
    this.ws.send(JSON.stringify(authMsg));
    this.logger.log('🔑 Sent authentication...');
  }

  private subscribe() {
    if (!this.authenticated || this.ws?.readyState !== WebSocket.OPEN) return;
    
    // Subscribe to Quote feed (C) for each forex pair
    // Format: "C.EUR-USD" for EUR/USD quotes
    const subscriptions = this.massivePairs.map(pair => `C.${pair}`);
    
    const subscribeMsg = {
      action: 'subscribe',
      params: subscriptions.join(',')
    };
    
    this.ws.send(JSON.stringify(subscribeMsg));
    this.logger.log(`📊 Subscribed to ${this.massivePairs.length} forex quote feeds`);
  }

  private updatePriceCache(massivePair: string, bid: number, ask: number, timestamp: number) {
    // Convert "EUR-USD" to "EUR/USD" for internal consistency
    const normalizedSymbol = massivePair.replace('-', '/');
    
    this.priceCache.set(normalizedSymbol, {
      bid,
      ask,
      timestamp: timestamp || Date.now()
    });
  }

  private disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.authenticated = false;
  }

  /**
   * EMERGENCY MOCK PRICES FOR DEMO
   * Generates realistic fluctuating forex prices
   */
  private startMockPrices() {
    const basePrices: Record<string, number> = {
      'EUR/USD': 1.0850,
      'GBP/USD': 1.2650,
      'USD/JPY': 150.25,
      'AUD/USD': 0.6550,
      'USD/CAD': 1.3950,
      'USD/CHF': 0.9050,
      'NZD/USD': 0.6050,
      'EUR/GBP': 0.8580,
    };

    // Initialize with base prices
    this.normalizedSymbols.forEach(symbol => {
      const basePrice = basePrices[symbol];
      const spread = symbol === 'USD/JPY' ? 0.02 : 0.0002;
      this.priceCache.set(symbol, {
        bid: basePrice,
        ask: basePrice + spread,
        timestamp: Date.now()
      });
    });

    // Update prices every second with realistic movement
    setInterval(() => {
      this.normalizedSymbols.forEach(symbol => {
        const current = this.priceCache.get(symbol);
        if (current) {
          // Random walk: +/- 0.05% movement
          const changePercent = (Math.random() - 0.5) * 0.001; // 0.1% max change
          const newBid = current.bid * (1 + changePercent);
          const spread = symbol === 'USD/JPY' ? 0.02 : 0.0002;
          
          this.priceCache.set(symbol, {
            bid: newBid,
            ask: newBid + spread,
            timestamp: Date.now()
          });
        }
      });
    }, 1000);

    this.logger.log('📊 Mock forex prices initialized and updating every 1 second');
  }

  // Public API (matches TwelveDataService interface)
  
  getPrice(symbol: string) {
    return this.priceCache.get(symbol);
  }

  isWSConnected(): boolean {
    return this.isConnected && this.authenticated && this.priceCache.size > 0;
  }

  getAllPrices(): Map<string, { bid: number; ask: number; timestamp: number }> {
    return this.priceCache;
  }

  /**
   * Historical data via REST API
   * Fetches OHLC candles from Massive.com REST endpoint
   * 
   * API Format: /v2/aggs/ticker/C:EURUSD/range/{multiplier}/{timespan}/{from}/{to}
   * Example: /v2/aggs/ticker/C:EURUSD/range/5/minute/2026-01-15/2026-01-16
   */
  async getHistory(symbol: string, timeframe: string, limit: number = 50): Promise<Candlestick[]> {
    if (!this.apiKey) {
      this.logger.warn('Cannot fetch history: MASSIVE_API_KEY not configured');
      return [];
    }

    try {
      // Convert symbol format: "EUR/USD" -> "C:EURUSD"
      const massiveTicker = this.convertToMassiveTicker(symbol);
      
      // Convert timeframe: "M5" -> multiplier=5, timespan="minute"
      const { multiplier, timespan } = this.convertTimeframe(timeframe);
      
      // Calculate date range based on limit
      const { from, to } = this.calculateDateRange(limit, multiplier, timespan);
      
      // Build API URL
      const url = `https://api.massive.com/v2/aggs/ticker/${massiveTicker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=${limit}`;
      
      this.logger.debug(`[Massive REST] Fetching history: ${url}`);
      
      // Make request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`[Massive REST] HTTP ${response.status}: ${errorText}`);
        return [];
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        this.logger.warn(`[Massive REST] No data returned for ${symbol}`);
        return [];
      }
      
      // Convert to Candlestick format
      const candles: Candlestick[] = data.results.map((bar: any) => ({
        time: bar.t, // Unix millisecond timestamp
        open: bar.o,
        high: bar.h,
        low: bar.l,
        close: bar.c,
        volume: bar.v || 0,
      }));
      
      this.logger.log(`[Massive REST] Fetched ${candles.length} candles for ${symbol} ${timeframe}`);
      return candles;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        this.logger.error(`[Massive REST] Request timeout for ${symbol}`);
      } else {
        this.logger.error(`[Massive REST] Error fetching history: ${error.message}`);
      }
      return [];
    }
  }

  /**
   * Convert symbol format: "EUR/USD" -> "C:EURUSD"
   */
  private convertToMassiveTicker(symbol: string): string {
    return 'C:' + symbol.replace('/', '');
  }

  /**
   * Convert timeframe: "M5" -> {multiplier: 5, timespan: "minute"}
   */
  private convertTimeframe(timeframe: string): { multiplier: number; timespan: string } {
    const timeframeMap: Record<string, { multiplier: number; timespan: string }> = {
      'M1': { multiplier: 1, timespan: 'minute' },
      'M5': { multiplier: 5, timespan: 'minute' },
      'M15': { multiplier: 15, timespan: 'minute' },
      'M30': { multiplier: 30, timespan: 'minute' },
      'H1': { multiplier: 1, timespan: 'hour' },
      'H4': { multiplier: 4, timespan: 'hour' },
      'D1': { multiplier: 1, timespan: 'day' },
    };

    return timeframeMap[timeframe] || { multiplier: 5, timespan: 'minute' };
  }

  /**
   * Calculate date range for fetching candles
   * Goes back in time based on limit and timeframe
   */
  private calculateDateRange(
    limit: number,
    multiplier: number,
    timespan: string,
  ): { from: string; to: string } {
    const now = new Date();
    const to = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Calculate how many days back to fetch
    let daysBack: number;
    
    switch (timespan) {
      case 'minute':
        // For minute candles, go back enough days to get the limit
        // Forex market is open 24/5, so roughly 1440 minutes per day
        daysBack = Math.ceil((limit * multiplier) / 1440) + 1;
        break;
      case 'hour':
        // 24 hours per day
        daysBack = Math.ceil((limit * multiplier) / 24) + 1;
        break;
      case 'day':
        daysBack = limit * multiplier + 1;
        break;
      default:
        daysBack = 7; // Default to 1 week
    }
    
    // Cap at reasonable limits
    if (daysBack > 365) daysBack = 365; // Max 1 year back
    
    const fromDate = new Date(now);
    fromDate.setDate(fromDate.getDate() - daysBack);
    const from = fromDate.toISOString().split('T')[0];
    
    return { from, to };
  }
}