import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';
import { TwelveDataService } from './twelve-data.service';
import { BinanceWebSocketService } from './binance-websocket.service'; // <--- Added

@Module({
  controllers: [PricesController],
  providers: [PricesService, TwelveDataService, BinanceWebSocketService], // <--- Added
  exports: [PricesService, TwelveDataService, BinanceWebSocketService], // <--- Exported
})
export class PricesModule {}
