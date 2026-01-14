import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { validateEnvironment } from './config/env.validation';

async function bootstrap() {
  // Validate environment BEFORE creating app
  validateEnvironment();

  const app = await NestFactory.create(AppModule);

  // Enable Socket.IO adapter for WebSocket support
  app.useWebSocketAdapter(new IoAdapter(app));

  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });
  console.log('Server is running on port 5002');
  await app.listen(process.env.PORT || 5002);
}
bootstrap();
