import { Module } from '@nestjs/common';

import { AdminScalingController } from './admin-scaling.controller';

import { AdminScalingService } from './admin-scaling.service';

import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({

  imports: [PrismaModule, NotificationsModule],

  controllers: [AdminScalingController],

  providers: [AdminScalingService],

})

export class AdminScalingModule {}

