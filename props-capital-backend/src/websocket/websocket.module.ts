import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TradingEventsGateway } from './trading-events.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-here',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  providers: [TradingEventsGateway],
  exports: [TradingEventsGateway],
})
export class WebsocketModule {}






