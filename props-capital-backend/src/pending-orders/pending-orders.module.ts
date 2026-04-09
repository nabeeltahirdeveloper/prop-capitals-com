import { Module, forwardRef } from '@nestjs/common';
import { PendingOrdersService } from './pending-orders.service';
import { PendingOrdersController } from './pending-orders.controller';
import { TradesModule } from '../trades/trades.module';
import { PendingOrderRegistryService } from './pending-order-registry.service';

@Module({
  controllers: [PendingOrdersController],
  providers: [PendingOrdersService, PendingOrderRegistryService],
  imports: [forwardRef(() => TradesModule)],
  exports: [PendingOrdersService, PendingOrderRegistryService],
})
export class PendingOrdersModule {}