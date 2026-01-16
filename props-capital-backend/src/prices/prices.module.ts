import { Module } from '@nestjs/common';
import { PricesService } from './prices.service';
import { PricesController } from './prices.controller';
import { TwelveDataService } from './twelve-data.service';
import { BinanceWebSocketService } from './binance-websocket.service'; // <--- Added
import { MassiveWebSocketService } from './massive-websocket.service';  // NEW


@Module({
  controllers: [PricesController],
  providers: [PricesService, MassiveWebSocketService, BinanceWebSocketService], // <--- Added
  exports: [PricesService, MassiveWebSocketService, BinanceWebSocketService], // <--- Exported
})
export class PricesModule {}
