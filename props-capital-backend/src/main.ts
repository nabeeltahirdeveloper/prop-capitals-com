import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { validateEnvironment } from './config/env.validation';
import { SocketIoAdapter } from './websocket/socket-io.adapter';

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

  // Use the SocketIoAdapter so all @WebSocketGateway decorators share
  // a single Socket.IO server instance — prevents handleUpgrade() conflicts.
  app.useWebSocketAdapter(new SocketIoAdapter(app));

  const port = process.env.PORT || 5101;
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}
bootstrap();