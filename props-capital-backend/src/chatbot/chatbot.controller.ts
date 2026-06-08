import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatbotService } from './chatbot.service';
import {
  SendMessageDto,
  SendMessageResponseDto,
  ChatSessionDto,
} from './dto/chat.dto';
import { JwtAuthGuard } from '../auth/jwt.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt.guard';

@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  // Public: anyone can ask general (FAQ-type) questions. Authenticated users
  // additionally get a persisted, multi-turn session. OptionalJwtAuthGuard
  // attaches req.user when a valid token is present, and null otherwise.
  @UseGuards(OptionalJwtAuthGuard)
  @Post('message')
  async sendMessage(
    @Req() req: any,
    @Body() dto: SendMessageDto,
  ): Promise<SendMessageResponseDto> {
    return this.chatbotService.sendMessage(req.user?.userId ?? null, dto);
  }

  // Session history/management remains strictly authenticated.
  @UseGuards(JwtAuthGuard)
  @Get('sessions')
  async getSessions(@Req() req: any): Promise<ChatSessionDto[]> {
    return this.chatbotService.getUserSessions(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('sessions/:sessionId')
  async getSession(
    @Req() req: any,
    @Param('sessionId') sessionId: string,
  ): Promise<ChatSessionDto> {
    return this.chatbotService.getSessionMessages(sessionId, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('sessions/:sessionId')
  async deleteSession(
    @Req() req: any,
    @Param('sessionId') sessionId: string,
  ): Promise<void> {
    return this.chatbotService.deleteSession(sessionId, req.user.userId);
  }
}
