import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable Socket.IO adapter for WebSocket support
  app.useWebSocketAdapter(new IoAdapter(app));
  
  // Enable CORS
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });
  
  await app.listen(4000);
}
bootstrap();
