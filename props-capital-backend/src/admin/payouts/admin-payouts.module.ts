import { Module } from '@nestjs/common';

import { AdminPayoutsController } from './admin-payouts.controller';

import { AdminPayoutsService } from './admin-payouts.service';

import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({

  imports: [PrismaModule, NotificationsModule],

  controllers: [AdminPayoutsController],

  providers: [AdminPayoutsService],

})

export class AdminPayoutsModule {}

