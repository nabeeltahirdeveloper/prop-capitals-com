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
import { PrismaService } from '../prisma/prisma.service';

export interface SupportMessagePayload {
  id: string;
  ticketId: string;
  senderType: string;
  senderId: string | null;
  message: string;
  createdAt: string | Date;
}

@WebSocketGateway(0, {
  cors: { origin: true, credentials: false },
  namespace: '/support',
})
export class SupportEventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SupportEventsGateway.name);

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('Support WebSocket Gateway initialized — namespace /support');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(
          `Client ${client.id} rejected: No token`,
        );
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET || 'your-secret-key-here',
      });

      const userId = payload.sub || payload.userId;
      if (!userId) {
        this.logger.warn(
          `Client ${client.id} rejected: Invalid token`,
        );
        client.disconnect();
        return;
      }

      client.data.userId = userId;
      client.data.role = payload.role || 'TRADER';
      client.data.email = payload.email;

      this.logger.log(
        `Client connected: ${client.id} (User: ${payload.email}, Role: ${client.data.role})`,
      );
    } catch (error) {
      this.logger.error(
        `Client ${client.id} connection error: ${error.message}`,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(
      `Client disconnected: ${client.id} (User: ${client.data?.userId || 'unknown'})`,
    );
  }

  @SubscribeMessage('subscribe:ticket')
  async handleSubscribeTicket(
    client: Socket,
    payload: { ticketId: string },
  ) {
    const { ticketId } = payload;
    if (!ticketId) {
      this.logger.warn(
        `Client ${client.id} subscribe:ticket without ticketId`,
      );
      return;
    }

    if (client.data.role !== 'ADMIN') {
      const ticket = await this.prisma.supportTicket.findUnique({
        where: { id: ticketId },
        select: { userId: true },
      });

      if (!ticket || ticket.userId !== client.data.userId) {
        this.logger.warn(
          `Client ${client.id} denied access to ticket ${ticketId}`,
        );
        client.emit('subscription:error', {
          ticketId,
          error: 'Access denied',
        });
        return;
      }
    }

    const roomName = `ticket:${ticketId}`;
    client.join(roomName);
    this.logger.log(`Client ${client.id} subscribed to ${roomName}`);
    client.emit('subscription:confirmed', { ticketId, room: roomName });
  }

  @SubscribeMessage('unsubscribe:ticket')
  handleUnsubscribeTicket(
    client: Socket,
    payload: { ticketId: string },
  ) {
    const { ticketId } = payload;
    if (!ticketId) return;

    const roomName = `ticket:${ticketId}`;
    client.leave(roomName);
    this.logger.log(`Client ${client.id} unsubscribed from ${roomName}`);
  }

  emitNewMessage(ticketId: string, message: SupportMessagePayload) {
    const roomName = `ticket:${ticketId}`;
    this.logger.log(
      `Emitting ticket:newMessage to ${roomName} (msgId: ${message.id})`,
    );
    this.server.to(roomName).emit('ticket:newMessage', {
      id: message.id,
      ticketId: message.ticketId,
      senderType: message.senderType,
      senderId: message.senderId,
      message: message.message,
      createdAt: message.createdAt,
    });
  }

  emitStatusChanged(ticketId: string, status: string) {
    const roomName = `ticket:${ticketId}`;
    this.logger.log(
      `Emitting ticket:statusChanged to ${roomName} (status: ${status})`,
    );
    this.server
      .to(roomName)
      .emit('ticket:statusChanged', { ticketId, status });
  }
}
