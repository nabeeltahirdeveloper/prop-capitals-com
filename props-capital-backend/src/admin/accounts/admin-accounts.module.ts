import { Module } from '@nestjs/common';

import { AdminAccountsController } from './admin-accounts.controller';

import { AdminAccountsService } from './admin-accounts.service';

import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../../notifications/notifications.module';

@Module({

  imports: [PrismaModule, NotificationsModule],

  controllers: [AdminAccountsController],

  providers: [AdminAccountsService],

})

export class AdminAccountsModule {}

