import { Module } from '@nestjs/common';
import { MarketDataController } from './market-data.controller';
import { MarketDataService } from './market-data.service';
import { PricesModule } from '../prices/prices.module';
import { BinanceMarketService } from './binance-market.service';
import { PendingOrdersModule} from "../pending-orders/pending-orders.module"
// BinanceWebSocketService is now provided by PricesModule

@Module({
  imports: [PricesModule , PendingOrdersModule],
  controllers: [MarketDataController],
  providers: [MarketDataService, BinanceMarketService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
