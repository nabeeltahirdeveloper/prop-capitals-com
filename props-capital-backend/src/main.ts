import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { validateEnvironment } from './config/env.validation';

class SocketIoAdapter extends IoAdapter {
  createIOServer(port: number, options: any = {}) {
    return super.createIOServer(port, {
      path: '/socket.io',
      cors: {
        origin: true,
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      ...options,
    });
  }
}

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
  app.useWebSocketAdapter(new SocketIoAdapter(app));

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });
  const port = Number(process.env.PORT || 5101);
  console.log(`Server is running on port ${port}`);
  await app.listen(port);
}
bootstrap();
