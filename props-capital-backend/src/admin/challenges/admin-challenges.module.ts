import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';

import { AdminChallengesController } from './admin-challenges.controller';

import { AdminChallengesService } from './admin-challenges.service';

@Module({

  imports: [PrismaModule, NotificationsModule],

  controllers: [AdminChallengesController],

  providers: [AdminChallengesService],

})

export class AdminChallengesModule {}

