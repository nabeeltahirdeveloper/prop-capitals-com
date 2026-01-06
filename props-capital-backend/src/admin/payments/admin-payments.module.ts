import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';

import { AdminPaymentsService } from './admin-payments.service';

import { AdminPaymentsController } from './admin-payments.controller';

@Module({

  imports: [PrismaModule],

  controllers: [AdminPaymentsController],

  providers: [AdminPaymentsService],

})

export class AdminPaymentsModule {}

