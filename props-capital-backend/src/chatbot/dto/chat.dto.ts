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
}

export class SendMessageResponseDto {
  reply: string;
  sessionId: string;
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