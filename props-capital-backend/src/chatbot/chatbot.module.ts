import { Module } from '@nestjs/common';
import { ChatbotController } from './chatbot.controller';
import { ChatbotService } from './chatbot.service';
import { KnowledgeBaseService } from './knowledge-base.service';

@Module({
  controllers: [ChatbotController],
  providers: [ChatbotService, KnowledgeBaseService],
  exports: [ChatbotService],
})
export class ChatbotModule { }