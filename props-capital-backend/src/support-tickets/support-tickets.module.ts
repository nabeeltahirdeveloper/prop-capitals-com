import { Module } from '@nestjs/common';

import { SupportTicketsController } from './support-tickets.controller';
import { SupportTicketsPublicController } from './support-tickets-public.controller';

import { SupportTicketsService } from './support-tickets.service';

import { PrismaModule } from '../prisma/prisma.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({

  imports: [PrismaModule, WebsocketModule],

  controllers: [SupportTicketsController, SupportTicketsPublicController],

  providers: [SupportTicketsService],

})

export class SupportTicketsModule {}
