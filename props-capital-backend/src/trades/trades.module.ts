import { Module, forwardRef } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { TradesService } from './trades.service';

import { TradesController } from './trades.controller';

import { EvaluationModule } from '../evaluation/evaluation.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { TpSlMonitorService } from './tp-sl-monitor.service';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({

  imports: [
    PrismaModule, 
    forwardRef(() => EvaluationModule),
    MarketDataModule,
    WebsocketModule,
  ],

  controllers: [TradesController],

  providers: [TradesService, TpSlMonitorService],

  exports: [TradesService],

})

export class TradesModule {}
