import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';
import { KnowledgeBaseService } from './knowledge-base.service';
import {
  SendMessageDto,
  SendMessageResponseDto,
  ChatSessionDto,
} from './dto/chat.dto';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private readonly openai: OpenAI;
  private readonly model: string;
  private readonly maxTokens: number;
  private readonly maxHistoryMessages = 10;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
  ) {

    this.openai = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
    });

    this.model = this.configService.get('CHATBOT_MODEL', 'gpt-4o-mini');
    this.maxTokens = parseInt(this.configService.get('CHATBOT_MAX_TOKENS', '500'), 10);
  }


  async sendMessage(
    userId: string,
    dto: SendMessageDto,
  ): Promise<SendMessageResponseDto> {

    const session = dto.sessionId
      ? await this.getExistingSession(dto.sessionId, userId)
      : await this.createSession(userId);

    await this.prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'user', content: dto.message },
    });

    const recentMessages = await this.prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: this.maxHistoryMessages,
    });

    const orderedMessages = recentMessages.reverse();

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = orderedMessages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    let reply: string;
    let tokensUsed: number;

    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          { role: 'system', content: this.buildSystemPrompt() },
          ...chatMessages,
        ],
      });

      reply = response.choices[0]?.message?.content ?? 'I could not generate a response. Please try again.';
      tokensUsed = (response.usage?.total_tokens) ?? 0;

    } catch (error) {
      this.logger.error('OpenAI API error', error);
      throw new InternalServerErrorException(
        'The AI service is temporarily unavailable. Please try again shortly.',
      );
    }

    await this.prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: reply, tokensUsed },
    });

    await this.prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    return { reply, sessionId: session.id, tokensUsed };
  }

  // -------------------------------------------------------
  // GET all sessions for a user
  // -------------------------------------------------------
  async getUserSessions(userId: string): Promise<ChatSessionDto[]> {
    const sessions = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    return sessions.map((s) => ({
      id: s.id,
      createdAt: s.createdAt,
      messages: s.messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        tokensUsed: m.tokensUsed,
        createdAt: m.createdAt,
      })),
    }));
  }

  // -------------------------------------------------------
  // GET a single session's messages
  // -------------------------------------------------------
  async getSessionMessages(sessionId: string, userId: string): Promise<ChatSessionDto> {
    const session = await this.getExistingSession(sessionId, userId);
    const messages = await this.prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    return {
      id: session.id,
      createdAt: session.createdAt,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        tokensUsed: m.tokensUsed,
        createdAt: m.createdAt,
      })),
    };
  }

  // -------------------------------------------------------
  // DELETE a session
  // -------------------------------------------------------
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    await this.getExistingSession(sessionId, userId);
    await this.prisma.chatSession.delete({ where: { id: sessionId } });
  }

  // -------------------------------------------------------
  // PRIVATE HELPERS
  // -------------------------------------------------------

  private async createSession(userId: string) {
    return this.prisma.chatSession.create({ data: { userId } });
  }

  private async getExistingSession(sessionId: string, userId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException(
        `Chat session "${sessionId}" not found or does not belong to this user.`,
      );
    }
    return session;
  }

  // -------------------------------------------------------
  // SYSTEM PROMPT — injected as the first message to OpenAI
  // -------------------------------------------------------
  private buildSystemPrompt(): string {
    const kb = this.knowledgeBaseService.getContent();

    return `You are a professional, friendly support assistant for Prop Capitals — a proprietary trading firm that provides funded trading accounts.

      ## Your Rules
      1. Answer ONLY using the knowledge base provided below. Do not use outside knowledge.
      2. Be concise and clear. Use bullet points for lists of 3 or more items.
      3. If a question is not covered in the knowledge base, say: "I don't have that information — please contact our support team."
      4. Never invent numbers, percentages, prices, or policies.
      5. Never discuss competitors.
      6. If a user seems frustrated, acknowledge their concern and suggest they contact support.

      ## Tone
      Professional but approachable. You represent a trusted financial firm.

      ## Knowledge Base
      ${kb}`;
  }
}