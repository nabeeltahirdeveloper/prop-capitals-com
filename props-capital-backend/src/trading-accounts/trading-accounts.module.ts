import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EvaluationModule } from '../evaluation/evaluation.module';
import { TradingAccountsService } from './trading-accounts.service';
import { TradingAccountsController } from './trading-accounts.controller';

@Module({
  imports: [PrismaModule, forwardRef(() => EvaluationModule)],
  providers: [TradingAccountsService],
  controllers: [TradingAccountsController],
  exports: [TradingAccountsService],
})
export class TradingAccountsModule {}
