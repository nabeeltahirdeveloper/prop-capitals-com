import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { validateEnvironment } from './config/env.validation';
import { Server } from 'socket.io';
import { TradingEventsGateway } from './websocket/trading-events.gateway';
import { CandlesGateway } from './websocket/candles.gateway';

async function bootstrap() {
  // Validate environment BEFORE creating app
  validateEnvironment();

  const app = await NestFactory.create(AppModule);

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Enable CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // Create Socket.IO server manually and attach it to the HTTP server BEFORE
  // app.listen(). This is required because @nestjs/core (in root node_modules)
  // cannot find @nestjs/websockets (in props-capital-backend/node_modules) due
  // to Node.js module resolution — so NestJS's internal SocketModule.register()
  // never runs, leaving all gateways disconnected. We bypass that entirely.
  const httpServer = app.getHttpServer();
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ['polling', 'websocket'],
  });
  console.log('[Socket.IO] Server created and attached to http.Server');

  const port = process.env.PORT || 5101;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);

  // Get gateway instances from DI container and wire them to Socket.IO
  const tradingGateway = app.get(TradingEventsGateway);
  const candlesGateway = app.get(CandlesGateway);

  // Wire /trading namespace
  const tradingNamespace = io.of('/trading');
  // Set @WebSocketServer() property (NestJS uses duck-typing, Namespace works as Server)
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

  // Wire root namespace (/) for candle streaming
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

  console.log('[Socket.IO] Gateways wired — /trading and / (candles) ready');
}
bootstrap();
