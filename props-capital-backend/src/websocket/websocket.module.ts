import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TradingEventsGateway } from './trading-events.gateway';
import { CandlesGateway } from './candles.gateway';
import { SupportEventsGateway } from './support-events.gateway';
import { PricesModule } from '../prices/prices.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key-here',
      signOptions: { expiresIn: '7d' },
    }),
    forwardRef(() => PricesModule),
    forwardRef(() => MarketDataModule),
    PrismaModule,
  ],
  providers: [TradingEventsGateway, CandlesGateway, SupportEventsGateway],
  exports: [TradingEventsGateway, CandlesGateway, SupportEventsGateway],
})
export class WebsocketModule {}






