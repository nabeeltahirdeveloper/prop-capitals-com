import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SocketIoAdapter } from './websocket/socket-io.adapter';
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

  // Use custom SocketIoAdapter (configures CORS, allowEIO3, transports)
  // Must be registered BEFORE enableCors so socket.io uses its own CORS
  app.useWebSocketAdapter(new SocketIoAdapter(app));

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });
  const port = process.env.PORT || 5002;
  await app.listen(port);
  console.log(`✅ Server running on http://localhost:${port}`);
}
bootstrap();
