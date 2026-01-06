import { Module } from '@nestjs/common';

import { AdminTradesController } from './admin-trades.controller';

import { AdminTradesService } from './admin-trades.service';

import { PrismaModule } from '../../prisma/prisma.module';

@Module({

  imports: [PrismaModule],

  controllers: [AdminTradesController],

  providers: [AdminTradesService],

})

export class AdminTradesModule {}

