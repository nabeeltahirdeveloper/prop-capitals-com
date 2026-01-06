import { Module } from '@nestjs/common';

import { AdminRiskController } from './admin-risk.controller';

import { AdminRiskService } from './admin-risk.service';

import { PrismaModule } from '../../prisma/prisma.module';

@Module({

  imports: [PrismaModule],

  controllers: [AdminRiskController],

  providers: [AdminRiskService],

})

export class AdminRiskModule {}

