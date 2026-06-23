import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  Challenge,
  ChallengePlatform,
  NotificationCategory,
  NotificationType,
  Prisma,
  TradeType,
  TradingAccountStatus,
  TradingPhase,
  ViolationType,
} from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { EmailService, EmailContent } from '../../email/email.service';
import { GenerateEvidenceDto } from './dto/generate-evidence.dto';
import {
  buildAccountActivityReportEmail,
  buildChallengeTerminatedEmail,
  buildCredentialsEmail,
  buildFraudPolicyEmail,
  buildPurchaseReceiptEmail,
  buildWelcomeEmail,
  CardholderInfo,
  CHARGEBACK_POLICY,
  FRAUD_PREVENTION_POLICY,
} from './evidence-templates';

const DEFAULT_RECIPIENT = 'gabordancs@tutamail.com';
const MS_HOUR = 60 * 60 * 1000;
const MS_MIN = 60 * 1000;

// Plausible instruments for the simulated losing trades.
interface SymbolInfo {
  symbol: string;
  price: number;
  contractSize: number; // units per 1.0 lot
  decimals: number;
  volume: number;
}
const SYMBOLS: SymbolInfo[] = [
  { symbol: 'EURUSD', price: 1.085, contractSize: 100000, decimals: 5, volume: 1.0 },
  { symbol: 'XAUUSD', price: 2350.0, contractSize: 100, decimals: 2, volume: 1.5 },
  { symbol: 'GBPUSD', price: 1.27, contractSize: 100000, decimals: 5, volume: 1.0 },
  { symbol: 'US30', price: 39000.0, contractSize: 1, decimals: 1, volume: 2.0 },
  { symbol: 'BTCUSD', price: 65000.0, contractSize: 1, decimals: 1, volume: 0.5 },
];

interface SimTrade {
  symbol: string;
  type: TradeType;
  volume: number;
  openPrice: number;
  closePrice: number;
  profit: number;
  openedAt: Date;
  closedAt: Date;
  leverage: number;
  commission: number;
  isBreach: boolean;
}

@Injectable()
export class AdminChargebackService {
  private readonly logger = new Logger(AdminChargebackService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly config: ConfigService,
  ) {}

  /** Plans available for the dropdown. */
  async getPlans() {
    return this.prisma.challenge.findMany({
      where: { isActive: true },
      orderBy: [{ challengeType: 'asc' }, { accountSize: 'asc' }],
      select: {
        id: true,
        name: true,
        accountSize: true,
        price: true,
        currency: true,
        challengeType: true,
        platform: true,
        overallDrawdownPercent: true,
        dailyDrawdownPercent: true,
      },
    });
  }

  /** Static policies (also surfaced in the UI without generating a pack). */
  getPolicies() {
    return {
      fraudPrevention: FRAUD_PREVENTION_POLICY,
      chargeback: CHARGEBACK_POLICY,
    };
  }

  private round(n: number, decimals: number): number {
    const f = Math.pow(10, decimals);
    return Math.round(n * f) / f;
  }

  /**
   * Build the sequence of losing trades whose cumulative loss exceeds the
   * overall-drawdown budget — the breach is recorded on the final trade.
   */
  private buildTrades(
    challenge: Challenge,
    numTrades: number,
    tradingStart: Date,
  ): SimTrade[] {
    const lossBudget =
      (challenge.accountSize * challenge.overallDrawdownPercent) / 100;
    // Cumulative loss after the first (n-1) trades stays safely under budget;
    // the final trade pushes total loss just past the limit -> termination.
    const preBreachTotal = numTrades > 1 ? lossBudget * 0.8 : 0;
    const finalLoss = lossBudget * 1.06 - preBreachTotal;
    const perPre = numTrades > 1 ? preBreachTotal / (numTrades - 1) : 0;

    const trades: SimTrade[] = [];
    for (let i = 0; i < numTrades; i++) {
      const isLast = i === numTrades - 1;
      const loss = isLast ? finalLoss : perPre;
      const sym = SYMBOLS[i % SYMBOLS.length];
      const type = i % 2 === 0 ? TradeType.BUY : TradeType.SELL;
      const unitMove = loss / (sym.volume * sym.contractSize); // positive magnitude
      // Loss => BUY closes lower, SELL closes higher.
      const closePrice =
        type === TradeType.BUY
          ? this.round(sym.price - unitMove, sym.decimals)
          : this.round(sym.price + unitMove, sym.decimals);
      const profit = this.round(-loss, 2);
      const openedAt = new Date(tradingStart.getTime() + i * 90 * MS_MIN);
      const closedAt = new Date(openedAt.getTime() + 45 * MS_MIN);
      trades.push({
        symbol: sym.symbol,
        type,
        volume: sym.volume,
        openPrice: sym.price,
        closePrice,
        profit,
        openedAt,
        closedAt,
        leverage: 100,
        commission: 0,
        isBreach: isLast,
      });
    }
    return trades;
  }

  async generateEvidence(dto: GenerateEvidenceDto) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: dto.challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge plan not found');

    const registeredAt = new Date(dto.registrationDate);
    if (Number.isNaN(registeredAt.getTime())) {
      throw new BadRequestException('Invalid registrationDate');
    }

    const recipientEmail = dto.recipientEmail || DEFAULT_RECIPIENT;
    const currency = dto.currency || challenge.currency;
    const amountPaid = Math.round(
      dto.amountPaid != null ? dto.amountPaid : challenge.price,
    );
    const numTrades = dto.numTrades ?? 4;
    const platform = challenge.platform;
    const firstName = dto.firstName || 'Card';
    const lastName = dto.lastName || 'Holder';
    const fullName = `${firstName} ${lastName}`.trim();
    const cardholder: CardholderInfo = { email: dto.email, name: fullName };

    // ---- Timeline ----------------------------------------------------------
    const purchasedAt = new Date(registeredAt.getTime() + 2 * MS_HOUR + 15 * MS_MIN);
    const accountCreatedAt = new Date(registeredAt.getTime() + 2 * MS_HOUR + 30 * MS_MIN);
    const tradingStart = new Date(registeredAt.getTime() + 24 * MS_HOUR + 8 * MS_HOUR);
    const trades = this.buildTrades(challenge, numTrades, tradingStart);
    const terminatedAt = trades[trades.length - 1].closedAt;

    const totalLoss = trades.reduce((s, t) => s + t.profit, 0);
    const finalBalance = this.round(challenge.accountSize + totalLoss, 2);
    const overallDrawdownPercent =
      ((challenge.accountSize - finalBalance) / challenge.accountSize) * 100;

    const invoiceNumber = 100000 + (await this.prisma.payment.count());
    const reference = `EVID-${Date.now().toString(36).toUpperCase()}`;
    const platformPassword = this.generatePassword();

    // ---- Persist everything in one transaction -----------------------------
    const result = await this.prisma.$transaction(async (tx) => {
      // 1) User (find or create, registered on date X)
      let user = await tx.user.findUnique({
        where: { email: dto.email },
        include: { profile: true },
      });
      let userCreated = false;
      if (!user) {
        const hashed = await bcrypt.hash(this.generatePassword(), 10);
        user = await tx.user.create({
          data: {
            email: dto.email,
            password: hashed,
            passwordSet: false,
            createdAt: registeredAt,
            profile: {
              create: {
                firstName,
                lastName,
                country: dto.country || null,
                city: dto.city || null,
                address: dto.address || null,
                phone: dto.phone || null,
              },
            },
          },
          include: { profile: true },
        });
        userCreated = true;
      }

      // 2) Payment (succeeded, same day as registration)
      const payment = await tx.payment.create({
        data: {
          userId: user.id,
          amount: amountPaid,
          originalAmount: amountPaid,
          currency,
          provider: 'card',
          status: 'succeeded',
          reference,
          challengeId: challenge.id,
          accountSize: challenge.accountSize,
          challengeType: challenge.challengeType,
          platform: String(platform),
          createdAt: purchasedAt,
          billingEmail: dto.email,
          billingFirstName: firstName,
          billingLastName: lastName,
          billingCountry: dto.country || null,
          billingCity: dto.city || null,
          billingAddress: dto.address || null,
          billingPhone: dto.phone || null,
          cardholderName: fullName,
          cardBrand: dto.cardBrand || null,
          cardLast4: dto.cardLast4 || null,
        },
      });

      // 3) Trading account (provisioned, then breached)
      const account = await tx.tradingAccount.create({
        data: {
          userId: user.id,
          challengeId: challenge.id,
          phase: TradingPhase.PHASE1,
          status: TradingAccountStatus.DISQUALIFIED,
          balance: finalBalance,
          equity: finalBalance,
          initialBalance: challenge.accountSize,
          platform: platform as ChallengePlatform,
          platformEmail: dto.email,
          createdAt: accountCreatedAt,
          maxEquityToDate: challenge.accountSize,
          todayStartEquity: challenge.accountSize,
          minEquityToday: finalBalance,
          minEquityOverall: finalBalance,
          lastDailyReset: tradingStart,
          dailyLossViolated: false,
          drawdownViolated: true,
          peakOverallDrawdownPercent: this.round(overallDrawdownPercent, 2),
          peakProfitPercent: 0,
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { tradingAccountId: account.id },
      });

      // 4) Trades + equity snapshots
      let runningBalance = challenge.accountSize;
      await tx.equitySnapshot.create({
        data: {
          tradingAccountId: account.id,
          equity: runningBalance,
          balance: runningBalance,
          timestamp: tradingStart,
        },
      });
      for (const t of trades) {
        runningBalance = this.round(runningBalance + t.profit, 2);
        const breachOverall =
          ((challenge.accountSize - runningBalance) / challenge.accountSize) *
          100;
        await tx.trade.create({
          data: {
            tradingAccountId: account.id,
            symbol: t.symbol,
            type: t.type,
            volume: t.volume,
            openPrice: t.openPrice,
            closePrice: t.closePrice,
            profit: t.profit,
            openedAt: t.openedAt,
            closedAt: t.closedAt,
            leverage: t.leverage,
            commission: t.commission,
            closeReason: t.isBreach ? 'RISK_AUTO_CLOSE' : 'USER_CLOSE',
            breachTriggered: t.isBreach,
            breachType: t.isBreach ? 'OVERALL_DRAWDOWN' : null,
            breachAt: t.isBreach ? t.closedAt : null,
            breachEquity: t.isBreach ? runningBalance : null,
            breachDrawdownPercentOverall: t.isBreach
              ? this.round(breachOverall, 2)
              : null,
          },
        });
        await tx.equitySnapshot.create({
          data: {
            tradingAccountId: account.id,
            equity: runningBalance,
            balance: runningBalance,
            timestamp: t.closedAt,
          },
        });
      }

      // 5) Violation (overall drawdown breach => terminated)
      await tx.violation.create({
        data: {
          tradingAccountId: account.id,
          type: ViolationType.OVERALL_DRAWDOWN,
          message: `Overall drawdown limit of ${challenge.overallDrawdownPercent}% breached (reached ${overallDrawdownPercent.toFixed(2)}%). Account disqualified.`,
          createdAt: terminatedAt,
        },
      });

      // 6) In-app notifications mirroring the lifecycle
      await tx.notification.createMany({
        data: [
          {
            userId: user.id,
            title: 'Challenge Purchased',
            body: `Your ${challenge.name} evaluation is now active.`,
            type: NotificationType.SUCCESS,
            category: NotificationCategory.CHALLENGE,
            createdAt: accountCreatedAt,
          },
          {
            userId: user.id,
            title: 'Challenge Failed',
            body: `Your ${challenge.name} evaluation was terminated after breaching the overall drawdown limit.`,
            type: NotificationType.ERROR,
            category: NotificationCategory.CHALLENGE,
            createdAt: terminatedAt,
          },
        ],
      });

      return { user, payment, account, userCreated };
    });

    // ---- Build the communications (copies kept for the report) -------------
    const frontendUrl =
      this.config.get<string>('APP_FRONTEND_URL') || 'https://prop-capitals.com';

    const built: { key: string; at: Date; content: EmailContent }[] = [
      {
        key: 'welcome',
        at: registeredAt,
        content: buildWelcomeEmail(cardholder, frontendUrl),
      },
      {
        key: 'receipt',
        at: purchasedAt,
        content: buildPurchaseReceiptEmail({
          cardholder,
          challengeName: challenge.name,
          amount: amountPaid,
          currency,
          invoiceNumber,
          cardBrand: dto.cardBrand,
          cardLast4: dto.cardLast4,
          paidAt: purchasedAt,
        }),
      },
      {
        key: 'credentials',
        at: accountCreatedAt,
        content: buildCredentialsEmail({
          cardholder,
          platform: String(platform),
          loginEmail: dto.email,
          password: platformPassword,
        }),
      },
      {
        key: 'terminated',
        at: terminatedAt,
        content: buildChallengeTerminatedEmail({
          cardholder,
          challengeName: challenge.name,
          reason: `Overall drawdown limit of ${challenge.overallDrawdownPercent}% breached`,
          drawdownPercent: overallDrawdownPercent,
          limitPercent: challenge.overallDrawdownPercent,
          finalBalance,
          initialBalance: challenge.accountSize,
          currency,
          terminatedAt,
        }),
      },
    ];

    const reportData = {
      cardholder: {
        email: dto.email,
        name: fullName,
        country: dto.country || null,
      },
      registeredAt,
      plan: {
        name: challenge.name,
        accountSize: challenge.accountSize,
        challengeType: challenge.challengeType,
        platform: String(platform),
        currency,
      },
      payment: {
        invoiceNumber,
        reference,
        amount: amountPaid,
        currency,
        status: 'succeeded',
        provider: 'card',
        cardBrand: dto.cardBrand || null,
        cardLast4: dto.cardLast4 || null,
        paidAt: purchasedAt,
      },
      account: {
        id: result.account.id,
        status: result.account.status,
        phase: result.account.phase,
        initialBalance: challenge.accountSize,
        finalBalance,
        overallDrawdownPercent,
        startedAt: accountCreatedAt,
        terminatedAt,
      },
      trades: trades.map((t) => ({
        symbol: t.symbol,
        type: t.type,
        volume: t.volume,
        openPrice: t.openPrice,
        closePrice: t.closePrice,
        profit: t.profit,
        openedAt: t.openedAt,
        closedAt: t.closedAt,
      })),
      payouts: [] as Array<{ amount: number; currency: string; status: string }>,
    };

    built.push({
      key: 'activity-report',
      at: new Date(),
      content: buildAccountActivityReportEmail(reportData),
    });
    built.push({
      key: 'fraud-policy',
      at: new Date(),
      content: buildFraudPolicyEmail({ cardholder, invoiceNumber }),
    });

    // ---- Send (optional) ---------------------------------------------------
    const sendEmails = dto.sendEmails !== false;
    const communications = [] as Array<{
      key: string;
      at: string;
      to: string;
      subject: string;
      text: string;
      html: string;
      sent: boolean;
      messageId?: string;
      error?: string;
    }>;

    for (const item of built) {
      let sent = false;
      let messageId: string | undefined;
      let error: string | undefined;
      if (sendEmails) {
        const res = await this.email.sendBuiltEmail(
          recipientEmail,
          item.content,
        );
        sent = res.success;
        messageId = res.messageId;
        error = res.error;
        if (!res.success) {
          this.logger.warn(
            `Evidence email "${item.key}" not sent: ${res.error}`,
          );
        }
      }
      communications.push({
        key: item.key,
        at: item.at.toISOString(),
        to: recipientEmail,
        subject: item.content.subject,
        text: item.content.text,
        html: item.content.html,
        sent,
        messageId,
        error,
      });
    }

    // ---- Human-readable timeline ------------------------------------------
    const timeline = [
      {
        at: registeredAt.toISOString(),
        type: 'registration',
        title: 'Account registered',
        detail: `${dto.email} registered and verified email (OTP).`,
      },
      {
        at: purchasedAt.toISOString(),
        type: 'purchase',
        title: 'Challenge purchased',
        detail: `Paid ${currency} ${amountPaid.toFixed(2)} for ${challenge.name} (Invoice #${invoiceNumber}).`,
      },
      {
        at: accountCreatedAt.toISOString(),
        type: 'provision',
        title: 'Trading account provisioned',
        detail: `${platform} account created with ${challenge.accountSize.toLocaleString()} ${currency} virtual balance. Credentials emailed.`,
      },
      ...trades.map((t, i) => ({
        at: t.openedAt.toISOString(),
        type: 'trade',
        title: `Trade ${i + 1}: ${t.symbol} ${t.type}`,
        detail: `${t.volume} lots @ ${t.openPrice} → ${t.closePrice}, P/L ${currency} ${t.profit.toFixed(2)}${t.isBreach ? ' (auto-closed on breach)' : ''}.`,
      })),
      {
        at: terminatedAt.toISOString(),
        type: 'termination',
        title: 'Challenge terminated',
        detail: `Overall drawdown limit (${challenge.overallDrawdownPercent}%) breached at ${overallDrawdownPercent.toFixed(2)}%. Account disqualified.`,
      },
    ];

    return {
      message: sendEmails
        ? `Evidence pack generated and ${communications.filter((c) => c.sent).length}/${communications.length} emails sent to ${recipientEmail}.`
        : 'Evidence pack generated (emails not sent).',
      recipientEmail,
      userCreated: result.userCreated,
      userId: result.user.id,
      accountId: result.account.id,
      report: {
        ...reportData,
        registeredAt: registeredAt.toISOString(),
        payment: {
          ...reportData.payment,
          paidAt: purchasedAt.toISOString(),
        },
        account: {
          ...reportData.account,
          startedAt: accountCreatedAt.toISOString(),
          terminatedAt: terminatedAt.toISOString(),
        },
        trades: reportData.trades.map((t) => ({
          ...t,
          openedAt: t.openedAt.toISOString(),
          closedAt: t.closedAt.toISOString(),
        })),
        totalLoss,
      },
      timeline,
      communications,
      policies: this.getPolicies(),
    };
  }

  private generatePassword(): string {
    const chars =
      'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let out = '';
    for (let i = 0; i < 12; i++) {
      out += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${out}!2`;
  }
}
