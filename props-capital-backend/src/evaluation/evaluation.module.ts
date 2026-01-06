import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MarketDataModule } from '../market-data/market-data.module';
import { TradesModule } from '../trades/trades.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { EvaluationService } from './evaluation.service';
import { ChallengeRulesService } from './challenge-rules.service';

@Module({
  imports: [
    PrismaModule, 
    MarketDataModule, 
    forwardRef(() => TradesModule), 
    NotificationsModule,
    WebsocketModule,
  ],
  providers: [EvaluationService, ChallengeRulesService],
  exports: [EvaluationService, ChallengeRulesService],
})
export class EvaluationModule {}

