import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import { MassiveWebSocketService } from '../prices/massive-websocket.service';
import { BinanceWebSocketService } from '../prices/binance-websocket.service';

interface PriceTick {
  symbol: string;
  bid: number;
  ask: number;
  ts: number;
}

interface PositionClosedEvent {
  tradeId: string;
  symbol: string;
  type: string;
  closePrice: number;
  profit: number;
  closeReason: 'TP_HIT' | 'SL_HIT' | 'USER_CLOSE' | 'RISK_AUTO_CLOSE';
  timestamp: string;
}

interface AccountUpdateEvent {
  tradingDaysCount?: number;
  tradedToday?: boolean;
  daysRemaining?: number;
  balance?: number;
  equity?: number;
  profitPercent?: number;
  dailyDrawdownPercent?: number;
  overallDrawdownPercent?: number;
  lastTradeId?: string;
  timestamp?: string;
}

@WebSocketGateway(0, {
  // port 0 = attach to the same HTTP server (port 5002), not a standalone server on port 80
  cors: {
    origin: true,
    credentials: false, // false because client uses JWT in auth payload, not cookies
  },
  namespace: '/trading',
})
export class TradingEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TradingEventsGateway.name);

  constructor(
    private jwtService: JwtService,
    private massiveWS: MassiveWebSocketService,
    private binanceWS: BinanceWebSocketService,
  ) {}

  /**
   * Look up a current price snapshot from whichever feed has it.
   * Returns null if the symbol is unknown to both feeds.
   */
  private getPriceSnapshot(symbol: string): PriceTick | null {
    const massive = this.massiveWS.getPrice(symbol);
    if (massive) {
      return { symbol, bid: massive.bid, ask: massive.ask, ts: massive.timestamp };
    }
    const binance = this.binanceWS.getPrice(symbol);
    if (binance) {
      return { symbol, bid: binance.bid, ask: binance.ask, ts: binance.timestamp };
    }
    return null;
  }

  afterInit(server: Server) {
    this.logger.log('🔌 Trading WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket, ...args: any[]) {
    try {
      // Extract token from handshake auth or query
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`❌ Client ${client.id} connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token (uses same JWT_SECRET as AuthModule via WebsocketModule)
      const payload = await this.jwtService.verifyAsync(token);

      // JWT payload uses 'sub' for user ID (standard JWT claim)
      const userId = payload.sub || payload.userId;
      if (!payload || !userId) {
        this.logger.warn(`❌ Client ${client.id} connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      // Store user info in socket data
      client.data.userId = userId;
      client.data.email = payload.email;

      this.logger.log(`✅ Client connected: ${client.id} (User: ${payload.email})`);
    } catch (error) {
      this.logger.error(`❌ Client ${client.id} connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    this.logger.log(`🔌 Client disconnected: ${client.id} (User: ${userId || 'unknown'})`);
  }

  /**
   * Subscribe client to account-specific events
   */
  @SubscribeMessage('subscribe:account')
  handleSubscribeToAccount(client: Socket, payload: { accountId: string }) {
    const { accountId } = payload;
    
    if (!accountId) {
      this.logger.warn(`⚠️ Client ${client.id} attempted to subscribe without accountId`);
      return;
    }

    const roomName = `account:${accountId}`;
    client.join(roomName);
    
    this.logger.log(`📡 Client ${client.id} subscribed to ${roomName}`);
    
    // Send confirmation to client
    client.emit('subscription:confirmed', { accountId, room: roomName });
  }

  /**
   * Unsubscribe client from account-specific events
   */
  @SubscribeMessage('unsubscribe:account')
  handleUnsubscribeFromAccount(client: Socket, payload: { accountId: string }) {
    const { accountId } = payload;
    
    if (!accountId) {
      return;
    }

    const roomName = `account:${accountId}`;
    client.leave(roomName);
    
    this.logger.log(`📡 Client ${client.id} unsubscribed from ${roomName}`);
  }

  /**
   * Emit position closed event to all clients subscribed to this account
   */
  emitPositionClosed(accountId: string, event: PositionClosedEvent) {
    const roomName = `account:${accountId}`;
    
    this.logger.log(
      `📤 Emitting position:closed to ${roomName} - ${event.symbol} ${event.type} (${event.closeReason})`,
    );

    this.server.to(roomName).emit('position:closed', event);
  }

  /**
   * Emit account status change event
   */
  emitAccountStatusChange(
    accountId: string,
    event: { status: string; reason?: string; timestamp: string },
  ) {
    const roomName = `account:${accountId}`;
    
    this.logger.log(
      `📤 Emitting account:status-changed to ${roomName} - Status: ${event.status}`,
    );

    this.server.to(roomName).emit('account:status-changed', event);
  }

  /**
   * Emit trade execution event (for real-time trade confirmations)
   */
  emitTradeExecuted(
    accountId: string,
    event: {
      tradeId: string;
      symbol: string;
      type: string;
      volume: number;
      openPrice: number;
      timestamp: string;
    },
  ) {
    const roomName = `account:${accountId}`;
    
    this.logger.log(
      `📤 Emitting trade:executed to ${roomName} - ${event.symbol} ${event.type}`,
    );

    this.server.to(roomName).emit('trade:executed', event);
  }

  /**
   * 🔥 NEW: Emit account metrics update (for real-time trading days, equity, balance, etc.)
   * This is crucial for updating the trading days counter in real-time
   */
  emitAccountUpdate(accountId: string, event: AccountUpdateEvent) {
    const roomName = `account:${accountId}`;
    
    this.logger.log(
      `📤 Emitting account:update to ${roomName} - Trading Days: ${event.tradingDaysCount ?? 'N/A'}`,
    );

    this.server.to(roomName).emit('account:update', {
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });
  }

  // ============================================================
  // PRICE STREAMING — per-symbol rooms, server-authoritative ticks
  // ============================================================

  /**
   * Client requests live ticks for a set of symbols.
   * Joins the client to per-symbol rooms (one frame per tick fanned out by socket.io).
   * Immediately replies with a snapshot for each symbol that has cached data.
   */
  @SubscribeMessage('subscribe:prices')
  handleSubscribePrices(client: Socket, payload: { symbols: string[] }) {
    const symbols = Array.isArray(payload?.symbols) ? payload.symbols : [];
    if (symbols.length === 0) {
      this.logger.warn(`⚠️ Client ${client.id} sent subscribe:prices with no symbols`);
      return;
    }

    const snapshot: PriceTick[] = [];
    for (const symbol of symbols) {
      client.join(`price:${symbol}`);
      const tick = this.getPriceSnapshot(symbol);
      if (tick) snapshot.push(tick);
    }

    client.emit('price:snapshot', snapshot);
    this.logger.log(
      `📡 Client ${client.id} subscribed to prices: [${symbols.join(', ')}] (snapshot: ${snapshot.length})`,
    );
  }

  @SubscribeMessage('unsubscribe:prices')
  handleUnsubscribePrices(client: Socket, payload: { symbols: string[] }) {
    const symbols = Array.isArray(payload?.symbols) ? payload.symbols : [];
    for (const symbol of symbols) {
      client.leave(`price:${symbol}`);
    }
    if (symbols.length > 0) {
      this.logger.log(
        `📡 Client ${client.id} unsubscribed from prices: [${symbols.join(', ')}]`,
      );
    }
  }

  /**
   * Internal listener: a price feed (Massive/Binance) updated its cache.
   * Fan out to every client subscribed to this symbol's room.
   * Note: socket.io performs O(1) room broadcast — one frame is multiplexed
   * to all subscribers, so cost scales with symbols, not users.
   */
  @OnEvent('price.tick')
  handlePriceTick(tick: PriceTick) {
    this.server.to(`price:${tick.symbol}`).emit('price:update', tick);
  }
}