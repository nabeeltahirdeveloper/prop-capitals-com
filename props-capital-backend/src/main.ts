import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { validateEnvironment } from './config/env.validation';

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

  // Enable Socket.IO adapter for WebSocket support
  app.useWebSocketAdapter(new IoAdapter(app));

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });

  // Custom adapter — fixes socket.io /socket.io/ 404 error
  // app.useWebSocketAdapter(new SocketIoAdapter(app));

  const port = process.env.PORT || 5002;
  await app.listen(port);
  console.log(`✅ Server running on http://localhost:${port}`);
  console.log(`✅ Socket.IO ready at ws://localhost:${port}`);
}
bootstrap();
