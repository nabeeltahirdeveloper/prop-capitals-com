import { Module } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';
import { WebsocketModule } from '../../websocket/websocket.module';

import { AdminSupportService } from './admin-support.service';

import { AdminSupportController } from './admin-support.controller';

@Module({

  imports: [PrismaModule, WebsocketModule],

  controllers: [AdminSupportController],

  providers: [AdminSupportService],

})

export class AdminSupportModule {}

