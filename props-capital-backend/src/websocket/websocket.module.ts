import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TradingEventsGateway } from './trading-events.gateway';
import { CandlesGateway } from './candles.gateway';
import { SupportEventsGateway } from './support-events.gateway';
import { PricesModule } from '../prices/prices.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is not set (required by WebsocketModule)');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
          } as any,
        };
      },
      inject: [ConfigService],
    }),
    forwardRef(() => PricesModule),
    forwardRef(() => MarketDataModule),
    PrismaModule,
  ],
  providers: [TradingEventsGateway, CandlesGateway, SupportEventsGateway],
  exports: [TradingEventsGateway, CandlesGateway, SupportEventsGateway],
})
export class WebsocketModule {}
