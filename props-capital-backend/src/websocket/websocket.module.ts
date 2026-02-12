import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TradingEventsGateway } from './trading-events.gateway';
import { CandlesGateway } from './candles.gateway';
import { PricesModule } from '../prices/prices.module';
import { MarketDataModule } from '../market-data/market-data.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-here',
      signOptions: { expiresIn: '7d' },
    }),
    forwardRef(() => PricesModule), // Import PricesModule for WebSocket services
    forwardRef(() => MarketDataModule), // Import MarketDataModule for candle data
  ],
  providers: [TradingEventsGateway, CandlesGateway],
  exports: [TradingEventsGateway, CandlesGateway],
})
export class WebsocketModule {}






