import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { validateEnvironment } from './config/env.validation';
import { Server } from 'socket.io';
import { TradingEventsGateway } from './websocket/trading-events.gateway';
import { CandlesGateway } from './websocket/candles.gateway';
import { SupportEventsGateway } from './websocket/support-events.gateway';

async function bootstrap() {
  validateEnvironment();

  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Manual Socket.IO setup — bypasses NestJS's @WebSocketGateway scanner.
  // Required because in monorepo/workspace deployments, @nestjs/websockets
  // may not resolve correctly, causing NestJS to silently skip all gateways.
  const httpServer = app.getHttpServer();
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: false,
    },
    allowEIO3: true,
    transports: ['polling', 'websocket'],
  });
  console.log('[Socket.IO] Server created and attached to HTTP server');

  // Get gateway instances from NestJS DI container (they're still valid providers)
  const tradingGateway = app.get(TradingEventsGateway);
  const candlesGateway = app.get(CandlesGateway);
  const supportGateway = app.get(SupportEventsGateway);

  // ── Root namespace: Candles ──
  (candlesGateway as any).server = io;
  candlesGateway.afterInit(io);
  io.on('connection', async (socket) => {
    try {
      await candlesGateway.handleConnection(socket as any);
      socket.on('subscribeCandles', (payload) =>
        candlesGateway.handleSubscribeCandles(socket as any, payload),
      );
      socket.on('unsubscribeCandles', (payload) =>
        candlesGateway.handleUnsubscribeCandles(socket as any, payload),
      );
      socket.on('disconnect', () =>
        candlesGateway.handleDisconnect(socket as any),
      );
    } catch (e) {
      console.error('[Socket.IO] root (/) connection error:', e);
    }
  });

  // ── /trading namespace ──
  const tradingNamespace = io.of('/trading');
  (tradingGateway as any).server = tradingNamespace;
  tradingGateway.afterInit(tradingNamespace as any);
  tradingNamespace.on('connection', async (socket) => {
    try {
      await tradingGateway.handleConnection(socket as any);
      socket.on('subscribe:account', (payload) =>
        tradingGateway.handleSubscribeToAccount(socket as any, payload),
      );
      socket.on('unsubscribe:account', (payload) =>
        tradingGateway.handleUnsubscribeFromAccount(socket as any, payload),
      );
      socket.on('disconnect', () =>
        tradingGateway.handleDisconnect(socket as any),
      );
    } catch (e) {
      console.error('[Socket.IO] /trading connection error:', e);
    }
  });

  // ── /support namespace ──
  const supportNamespace = io.of('/support');
  (supportGateway as any).server = supportNamespace;
  supportGateway.afterInit(supportNamespace as any);
  supportNamespace.on('connection', async (socket) => {
    try {
      await supportGateway.handleConnection(socket as any);
      socket.on('subscribe:ticket', (payload) =>
        supportGateway.handleSubscribeTicket(socket as any, payload),
      );
      socket.on('unsubscribe:ticket', (payload) =>
        supportGateway.handleUnsubscribeTicket(socket as any, payload),
      );
      socket.on('disconnect', () =>
        supportGateway.handleDisconnect(socket as any),
      );
    } catch (e) {
      console.error('[Socket.IO] /support connection error:', e);
    }
  });

  console.log('[Socket.IO] Namespaces registered: / (candles), /trading, /support');

  const port = process.env.PORT || 5101;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}
bootstrap();
