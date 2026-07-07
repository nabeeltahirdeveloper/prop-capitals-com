import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  ServiceUnavailableException,
  HttpException,
  HttpStatus,
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
      // Don't let a slow/hung OpenAI request hold a chat connection open for the
      // SDK default (10 min). Retry transient failures (timeouts, 429, 5xx) a
      // few times with the SDK's built-in exponential backoff before giving up.
      timeout: parseInt(
        this.configService.get('CHATBOT_TIMEOUT_MS', '30000'),
        10,
      ),
      maxRetries: parseInt(
        this.configService.get('CHATBOT_MAX_RETRIES', '3'),
        10,
      ),
    });

    this.model = this.configService.get('CHATBOT_MODEL', 'gpt-4o-mini');
    this.maxTokens = parseInt(
      this.configService.get('CHATBOT_MAX_TOKENS', '500'),
      10,
    );
  }

  async sendMessage(
    userId: string | null,
    dto: SendMessageDto,
  ): Promise<SendMessageResponseDto> {
    // Anonymous (not logged in): answer general FAQ-type questions statelessly.
    // No session is persisted because there is no user to attach it to.
    if (!userId) {
      return this.answerStateless(dto.message, dto.language);
    }

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

    const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] =
      orderedMessages.map((m) => ({
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
          { role: 'system', content: this.buildSystemPrompt(dto.language) },
          ...chatMessages,
        ],
      });

      reply =
        response.choices[0]?.message?.content ??
        'I could not generate a response. Please try again.';
      tokensUsed = response.usage?.total_tokens ?? 0;
    } catch (error) {
      throw this.toClientError(error);
    }

    await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: reply,
        tokensUsed,
      },
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
  async getSessionMessages(
    sessionId: string,
    userId: string,
  ): Promise<ChatSessionDto> {
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

  /**
   * Stateless single-turn answer for anonymous users. Uses the same knowledge-base
   * system prompt as the authenticated flow, but persists nothing and returns a
   * null sessionId. Account-specific queries are naturally declined because the
   * system prompt only knows the public knowledge base.
   */
  private async answerStateless(
    message: string,
    language?: string,
  ): Promise<SendMessageResponseDto> {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        max_tokens: this.maxTokens,
        messages: [
          { role: 'system', content: this.buildSystemPrompt(language) },
          { role: 'user', content: message },
        ],
      });

      const reply =
        response.choices[0]?.message?.content ??
        'I could not generate a response. Please try again.';
      const tokensUsed = response.usage?.total_tokens ?? 0;

      return { reply, sessionId: null, tokensUsed };
    } catch (error) {
      throw this.toClientError(error);
    }
  }

  /**
   * Translate an OpenAI failure into the right HTTP response so the widget can
   * tell a transient "try again" hiccup (rate limit / upstream outage / timeout)
   * apart from a misconfiguration that won't fix itself on retry.
   */
  private toClientError(error: unknown): HttpException {
    this.logger.error(
      'OpenAI API error',
      error instanceof Error ? error.stack : String(error),
    );

    if (error instanceof OpenAI.APIError) {
      const status = error.status;
      if (status === 429) {
        return new HttpException(
          'The assistant is busy right now. Please try again in a moment.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
      if (status === 401 || status === 403) {
        // Bad/expired API key or quota disabled — retrying won't help.
        return new InternalServerErrorException(
          'The AI assistant is misconfigured. Please contact support@prop-capitals.com.',
        );
      }
      if (typeof status === 'number' && status >= 500) {
        return new ServiceUnavailableException(
          'The AI service is temporarily unavailable. Please try again shortly.',
        );
      }
    }

    // Network errors, timeouts (APIConnectionTimeoutError) and anything else are
    // treated as transient.
    return new ServiceUnavailableException(
      'The AI service is temporarily unavailable. Please try again shortly.',
    );
  }

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
  // Maps the UI language code to a name the model understands. English is the
  // knowledge-base language, so it is intentionally absent (no override needed).
  private readonly languageNames: Record<string, string> = {
    tr: 'Turkish',
    fr: 'French',
    es: 'Spanish',
    ru: 'Russian',
    ja: 'Japanese',
    kr: 'Korean',
    ko: 'Korean',
    th: 'Thai',
    kk: 'Kazakh',
  };

  private buildSystemPrompt(language?: string): string {
    const kb = this.knowledgeBaseService.getContent();

    // The knowledge base is written in English. When the user's UI language is
    // non-English, instruct the model to answer in that language (it translates
    // the KB content on the fly, including the "not covered" fallback in rule 3).
    const langName = language
      ? this.languageNames[language.toLowerCase()]
      : undefined;
    const languageRule = langName
      ? `

      ## Language
      The user's selected language is ${langName}. Respond ONLY in ${langName}, even though the knowledge base below is written in English — translate any information you use into ${langName}. Keep brand and product names (Prop Capitals, Bybit, MT5, TradeLocker, Challenge) unchanged.`
      : '';

    return `You are a professional, friendly support assistant for Prop Capitals — a proprietary trading firm that provides funded trading accounts.

      ## Your Rules
      1. Answer ONLY using the knowledge base provided below. Do not use outside knowledge.
      2. Be concise and clear. Use bullet points for lists of 3 or more items.
      3. If a question is not covered in the knowledge base, tell the user (in your response language) that you do not have that information and that they should please contact the support team.
      4. Never invent numbers, percentages, prices, or policies.
      5. Never discuss competitors.
      6. If a user seems frustrated, acknowledge their concern and suggest they contact support.${languageRule}

      ## Tone
      Professional but approachable. You represent a trusted financial firm.

      ## Knowledge Base
      ${kb}`;
  }
}
