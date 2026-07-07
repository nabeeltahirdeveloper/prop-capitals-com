// src/chatbot/dto/chat.dto.ts

import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  // The user's active UI language (e.g. 'tr'); the bot replies in this language.
  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}

export class SendMessageResponseDto {
  reply: string;
  // null for anonymous (not-logged-in) users — their chat is stateless and not persisted.
  sessionId: string | null;
  tokensUsed: number;
}

export class ChatMessageDto {
  id: string;
  role: string;
  content: string;
  tokensUsed?: number | null;
  createdAt: Date;
}

export class ChatSessionDto {
  id: string;
  createdAt: Date;
  messages: ChatMessageDto[];
}
