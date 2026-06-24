import { Module } from '@nestjs/common';

import { AdminChargebackController } from './admin-chargeback.controller';
import { AdminChargebackService } from './admin-chargeback.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../../email/email.module';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [AdminChargebackController],
  providers: [AdminChargebackService],
})
export class AdminChargebackModule {}
