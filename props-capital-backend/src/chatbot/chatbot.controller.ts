import { Controller, Post, Get, Delete, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import { SendMessageDto, SendMessageResponseDto, ChatSessionDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('chatbot')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
  ) { }

  @Post('message')
  async sendMessage(@Req() req: any, @Body() dto: SendMessageDto): Promise<SendMessageResponseDto> {
    return this.chatbotService.sendMessage(req.user.userId, dto);
  }

  @Get('sessions')
  async getSessions(@Req() req: any): Promise<ChatSessionDto[]> {
    return this.chatbotService.getUserSessions(req.user.userId);
  }

  @Get('sessions/:sessionId')
  async getSession(@Req() req: any, @Param('sessionId') sessionId: string): Promise<ChatSessionDto> {
    return this.chatbotService.getSessionMessages(sessionId, req.user.userId);
  }

  @Delete('sessions/:sessionId')
  async deleteSession(@Req() req: any, @Param('sessionId') sessionId: string): Promise<void> {
    return this.chatbotService.deleteSession(sessionId, req.user.userId);
  }
}