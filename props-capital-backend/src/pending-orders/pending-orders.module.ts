import { Module } from '@nestjs/common';
import { PendingOrdersService } from './pending-orders.service';
import { PendingOrdersController } from './pending-orders.controller';
import { TradesModule } from '../trades/trades.module';

@Module({
  controllers: [PendingOrdersController],
  providers: [PendingOrdersService],
  imports: [TradesModule],
})
export class PendingOrdersModule {}
