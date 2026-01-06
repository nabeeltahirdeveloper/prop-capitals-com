import { Module } from '@nestjs/common';
import { MarketDataService } from './market-data.service';
import { MarketDataController } from './market-data.controller';
import { BinanceMarketService } from './binance-market.service';
import { BinanceWebSocketService } from './binance-websocket.service';
import { PricesModule } from '../prices/prices.module';

@Module({
  controllers: [MarketDataController],
  providers: [MarketDataService, BinanceMarketService, BinanceWebSocketService],
  imports: [PricesModule],
  exports: [MarketDataService, BinanceWebSocketService],
})
export class MarketDataModule {}
