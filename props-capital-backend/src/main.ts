import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { validateEnvironment } from './config/env.validation';
import * as fs from 'fs';
import * as path from 'path';

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
  const port = process.env.PORT || 5101;
  await app.listen(port);
  // #region agent log
  const logLine = JSON.stringify({ sessionId: 'd59405', runId: 'run1', hypothesisId: 'H1', location: 'main.ts:bootstrap', message: 'Server listening', data: { port: Number(port), envPort: process.env.PORT }, timestamp: Date.now() }) + '\n';
  const logPath = path.join(process.cwd(), 'debug-d59405.log');
  try { fs.appendFileSync(logPath, logLine); } catch (_) {}
  fetch('http://127.0.0.1:7718/ingest/4d92c47f-44a6-4394-954a-da3f7a6d4e37', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd59405' }, body: JSON.stringify({ sessionId: 'd59405', runId: 'run1', hypothesisId: 'H1', location: 'main.ts:bootstrap', message: 'Server listening', data: { port: Number(port), envPort: process.env.PORT }, timestamp: Date.now() }) }).catch(() => {});
  // #endregion
  console.log('Server is running on port', port);
}
bootstrap();
