import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { HumanSupportDto } from './dto/human-support.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() dto: ChatMessageDto) {
    return this.chatService.chat(dto.session_id, dto.message);
  }

  @Post('human-support')
  humanSupport(@Body() dto: HumanSupportDto) {
    return this.chatService.humanSupport(
      dto.session_id,
      dto.name,
      dto.email,
      dto.message,
    );
  }
}
