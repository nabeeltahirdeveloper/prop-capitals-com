import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `You are the Prop Capitals AI assistant — a helpful, professional, and friendly chatbot for the Prop Capitals proprietary trading firm website.

**Your role:** Answer questions ONLY about Prop Capitals, its services, trading challenges, rules, payouts, platforms, and general prop trading topics relevant to Prop Capitals.

**About Prop Capitals:**
- Prop Capitals is a proprietary trading firm that provides funded trading accounts to traders worldwide.
- 18,500+ active traders globally with $15.2M+ total paid out.
- Payout processing time: under 90 minutes on average.
- Trustpilot rating: 4.8/5 with 2,340+ reviews.

**Challenge Programs:**
1. **1-Step Challenge (Most Popular):**
   - Profit Target: 10%
   - Daily Drawdown: 4%
   - Max Drawdown: 8%
   - Profit Split: 85%
   - Leverage: 1:30
   - Prices: $5K ($55), $10K ($99), $25K ($189), $50K ($299), $100K ($499), $200K ($949)

2. **2-Step Challenge (Best Split):**
   - Phase 1 Profit Target: 8%, Phase 2: 5%
   - Daily Drawdown: 5%
   - Max Drawdown: 10%
   - Profit Split: up to 90%
   - Leverage: 1:50
   - Prices: $5K ($45), $10K ($79), $25K ($159), $50K ($249), $100K ($449), $200K ($849)

**All programs include:** No time limit, all strategies allowed, 100% fee refund on first payout, free education included. Currently 70% OFF all challenges.

**Trading Rules:**
- Allowed: All trading styles, news trading, weekend holding, Expert Advisors (EAs), hedging, all instruments, any lot size, copy trading, scalping.
- Prohibited: Latency arbitrage, tick scalping, account management by third parties, prop firm copying, toxic flow strategies, high-frequency trading (HFT).
- Daily drawdown limit: 5% (based on starting balance of the day).
- Maximum drawdown: 10% (based on initial account balance).
- Minimum trading days: varies by phase.

**Scaling Plan:**
- Account can grow up to $5,000,000.
- Every 10% profit milestone increases account size by 25%.
- Profit split increases from 80% up to 90% as you scale.

**Trading Platforms:** MetaTrader 5 (MT5), TradeLocker, MatchTrader, cTrader.

**Trading Instruments:** 50+ Forex pairs, Metals (Gold, Silver), Indices (US30, NAS100, SPX500), Cryptocurrencies (BTC, ETH). Spreads from 0.0 pips, commissions from $2/lot.

**Payouts:** Processed in under 90 minutes. Supported methods: bank transfer, crypto, e-wallets. 100% challenge fee refund with first payout.

**Support:** 24/7 live chat and email support. Average response time under 60 seconds. Email: support@prop-capitals.com

**STRICT RULES FOR YOU:**
1. ONLY answer questions related to Prop Capitals, its services, trading challenges, rules, payouts, platforms, pricing, and general prop trading concepts.
2. If someone asks about anything NOT related to Prop Capitals or prop trading (e.g., coding, recipes, weather, politics, general knowledge, personal advice, other companies), politely decline and redirect them. Say something like: "I'm specifically designed to help with Prop Capitals-related questions. I can help you with information about our challenges, trading rules, payouts, platforms, and more! What would you like to know?"
3. Be concise, professional, and friendly. Use short paragraphs.
4. When relevant, suggest the user visit specific pages (e.g., /challenges, /rules, /payouts, /faq, /contact).
5. If someone asks to speak to a human, let them know they can use the "Human Support" button or email support@prop-capitals.com.
6. Never make up information. If you're unsure about something specific, direct them to contact support.
7. Never provide financial advice. You can explain rules and programs but cannot recommend trading strategies or guarantee profits.`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private openai: OpenAI;
  private conversations: Map<string, ConversationMessage[]> = new Map();

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    } else {
      this.logger.warn(
        'OPENAI_API_KEY not configured. Chat AI will use fallback responses.',
      );
    }
  }

  async chat(
    sessionId: string,
    message: string,
  ): Promise<{ response: string; transfer_to_human: boolean }> {
    if (!this.openai) {
      return {
        response:
          'Our AI assistant is currently being configured. Please contact support@prop-capitals.com or use the Human Support button below for immediate assistance.',
        transfer_to_human: true,
      };
    }

    const history = this.conversations.get(sessionId) || [];
    history.push({ role: 'user', content: message });

    const recentHistory = history.slice(-20);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...recentHistory,
        ],
        max_tokens: 500,
        temperature: 0.7,
      });

      const assistantMessage =
        completion.choices[0]?.message?.content ||
        "I'm sorry, I couldn't process that. Please try again or contact support@prop-capitals.com.";

      history.push({ role: 'assistant', content: assistantMessage });
      this.conversations.set(sessionId, history);

      const wantsHuman =
        message.toLowerCase().includes('speak to human') ||
        message.toLowerCase().includes('talk to human') ||
        message.toLowerCase().includes('real person') ||
        message.toLowerCase().includes('human agent') ||
        message.toLowerCase().includes('live agent');

      return {
        response: assistantMessage,
        transfer_to_human: wantsHuman,
      };
    } catch (error) {
      this.logger.error('OpenAI API error:', error);
      return {
        response:
          "I'm having trouble connecting right now. Please try again in a moment or contact support@prop-capitals.com for immediate help.",
        transfer_to_human: false,
      };
    }
  }

  humanSupport(
    sessionId: string,
    name: string,
    email: string,
    message: string,
  ): { success: boolean } {
    this.logger.log(
      `Human support request from ${name} (${email}), session: ${sessionId}, message: ${message}`,
    );
    return { success: true };
  }

  cleanupOldSessions(): void {
    const maxSessions = 1000;
    if (this.conversations.size > maxSessions) {
      const keysToDelete = Array.from(this.conversations.keys()).slice(
        0,
        this.conversations.size - maxSessions,
      );
      for (const key of keysToDelete) {
        this.conversations.delete(key);
      }
      this.logger.log(`Cleaned up ${keysToDelete.length} old chat sessions`);
    }
  }
}
