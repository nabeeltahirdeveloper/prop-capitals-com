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

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this based on your frontend URL in production
    credentials: true,
  },
  namespace: '/trading',
})
export class TradingEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(TradingEventsGateway.name);

  constructor(private jwtService: JwtService) {}

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

      // Verify JWT token (auth module uses sub for user id)
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key-here',
      });

      const userId = payload?.sub || payload?.userId;
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
}