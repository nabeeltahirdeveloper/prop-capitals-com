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
  buildSignedTermsEmail,
  buildWelcomeEmail,
  CardholderInfo,
  CHARGEBACK_POLICY,
  FRAUD_PREVENTION_POLICY,
  SignedTermsData,
  TERMS_CLAUSES,
} from './evidence-templates';
import { mapUpload } from './upload-mapping';

const DEFAULT_RECIPIENT = 'gabordancs@tutamail.com';
const DEFAULT_TERMS_VERSION = 'v3.1 (2026-01-10)';
const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';
const MS_HOUR = 60 * 60 * 1000;
const MS_MIN = 60 * 1000;

// Plausible instruments for the simulated trades.
interface SymbolInfo {
  symbol: string;
  price: number;
  contractSize: number; // units per 1.0 lot
  decimals: number;
  volStep: number; // volume granularity (lots)
  volMin: number;
  volMax: number;
}
const SYMBOLS: SymbolInfo[] = [
  { symbol: 'EURUSD', price: 1.0852, contractSize: 100000, decimals: 5, volStep: 0.01, volMin: 0.3, volMax: 2.5 },
  { symbol: 'XAUUSD', price: 2348.5, contractSize: 100, decimals: 2, volStep: 0.01, volMin: 0.2, volMax: 1.8 },
  { symbol: 'GBPUSD', price: 1.2715, contractSize: 100000, decimals: 5, volStep: 0.01, volMin: 0.3, volMax: 2.2 },
  { symbol: 'US30', price: 38975.0, contractSize: 1, decimals: 1, volStep: 0.1, volMin: 0.5, volMax: 3.0 },
  { symbol: 'USDJPY', price: 157.32, contractSize: 100000, decimals: 3, volStep: 0.01, volMin: 0.3, volMax: 2.0 },
  { symbol: 'NAS100', price: 18420.0, contractSize: 1, decimals: 1, volStep: 0.1, volMin: 0.5, volMax: 3.0 },
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
  balanceAfter: number;
  dayStartEquity: number;
}

interface SimResult {
  trades: SimTrade[];
  breachType: 'OVERALL_DRAWDOWN' | 'DAILY_DRAWDOWN';
  finalBalance: number;
  overallDrawdownPercent: number;
  peakDailyDrawdownPercent: number;
  lastDayStartEquity: number;
  lastDailyReset: Date;
  terminatedAt: Date;
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

  /**
   * Parse an uploaded transaction export (CSV/XLSX), map it to the evidence
   * form fields, and match the purchased plan against the Challenge table.
   */
  async parseUpload(file: Express.Multer.File) {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded');
    }
    const mapped = mapUpload(file.buffer, file.originalname, file.mimetype);
    const warnings = [...mapped.warnings];

    let challengeId: string | null = null;
    let planName: string | null = null;
    const { challengeType, accountSize } = mapped.planHint;

    if (accountSize != null) {
      const where: { accountSize: number; isActive: boolean; challengeType?: string } =
        { accountSize, isActive: true };
      if (challengeType) where.challengeType = challengeType;
      const challenge =
        (await this.prisma.challenge.findFirst({ where })) ||
        (await this.prisma.challenge.findFirst({
          where: { accountSize, isActive: true },
        }));
      if (challenge) {
        challengeId = challenge.id;
        planName = challenge.name;
      } else {
        warnings.push(
          `No active plan found for ${challengeType ?? 'challenge'} with account size ${accountSize.toLocaleString()}`,
        );
      }
    }

    return {
      matched: !!challengeId,
      challengeId,
      planName,
      fields: mapped.fields,
      transaction: mapped.transaction,
      warnings,
    };
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

  private rnd(min: number, max: number): number {
    return min + Math.random() * (max - min);
  }

  private rndInt(min: number, max: number): number {
    return Math.floor(this.rnd(min, max + 1));
  }

  /** Round a volume to the instrument's step (and to 2 dp to avoid FP noise). */
  private roundVol(v: number, step: number): number {
    return Math.max(step, this.round(Math.round(v / step) * step, 2));
  }

  /**
   * Build a realistic, randomized losing streak that terminates the account at
   * the plan's *actual* configured drawdown limits.
   *
   * Trades are spread over several trading days. Each day's net loss is kept
   * below the daily-drawdown limit (so a single day never trips the daily rule
   * prematurely) and the cumulative loss bleeds down to just past the overall
   * (MAX) drawdown limit — the final trade is the one that breaches it, which
   * disqualifies the account. Times, volumes, prices and P/L are all randomized
   * (with the occasional small winner) so the activity looks like real trading.
   */
  private buildTrades(
    challenge: Challenge,
    numTradesHint: number,
    registeredAt: Date,
  ): SimResult {
    const size = challenge.accountSize;
    const overallPct = challenge.overallDrawdownPercent;
    const dailyPct = challenge.dailyDrawdownPercent;

    // Final loss lands just past the overall limit (small, randomized overshoot).
    const targetOverallPct = overallPct + this.rnd(0.05, 0.45);
    const targetLoss = (size * targetOverallPct) / 100;

    // Keep each day comfortably below the daily limit.
    const dailyLimitLoss = (size * dailyPct) / 100;
    const maxDayLoss = dailyLimitLoss * this.rnd(0.55, 0.78);
    const days = Math.max(2, Math.ceil(targetLoss / maxDayLoss));

    // Split the target loss across the days (each day < daily limit).
    const dayLosses = this.splitRandom(targetLoss, days, dailyLimitLoss * 0.92);

    // Distribute the total trade count across the days (>=1 each).
    const totalTrades = Math.min(12, Math.max(days, numTradesHint));
    const tradesPerDay = this.distributeCount(totalTrades, days);

    const trades: SimTrade[] = [];
    // First trading day is the day after registration.
    const baseDay = new Date(registeredAt.getTime());
    baseDay.setUTCHours(0, 0, 0, 0);

    for (let d = 0; d < days; d++) {
      const dayNet = dayLosses[d];
      const k = tradesPerDay[d];
      const isLastDay = d === days - 1;
      // Per-trade signed P/L summing exactly to -dayNet (mostly losses,
      // occasionally one small winner on a non-final day).
      const profits = this.splitDayProfits(dayNet, k, isLastDay);

      // Random session start within market hours.
      let cursor = new Date(baseDay.getTime() + (d + 1) * 24 * MS_HOUR);
      cursor = new Date(
        cursor.getTime() +
          this.rndInt(7, 13) * MS_HOUR +
          this.rndInt(0, 59) * MS_MIN +
          this.rndInt(0, 59) * 1000,
      );

      for (let j = 0; j < k; j++) {
        const sym = SYMBOLS[this.rndInt(0, SYMBOLS.length - 1)];
        const type = Math.random() < 0.5 ? TradeType.BUY : TradeType.SELL;
        const volume = this.roundVol(this.rnd(sym.volMin, sym.volMax), sym.volStep);
        // Small random entry offset from the reference price.
        const openPrice = this.round(
          sym.price * (1 + this.rnd(-0.012, 0.012)),
          sym.decimals,
        );
        const profit = this.round(profits[j], 2);
        const unitMove = profit / (volume * sym.contractSize); // signed
        // BUY: profit>0 => close above open. SELL: inverted.
        const closePrice = this.round(
          type === TradeType.BUY ? openPrice + unitMove : openPrice - unitMove,
          sym.decimals,
        );
        const duration = this.rndInt(6, 95) * MS_MIN + this.rndInt(0, 59) * 1000;
        const openedAt = new Date(cursor.getTime());
        const closedAt = new Date(openedAt.getTime() + duration);
        trades.push({
          symbol: sym.symbol,
          type,
          volume,
          openPrice,
          closePrice,
          profit,
          openedAt,
          closedAt,
          leverage: 100,
          commission: 0,
          isBreach: false,
          balanceAfter: 0,
          dayStartEquity: 0,
        });
        // Gap before the next trade.
        cursor = new Date(
          closedAt.getTime() +
            this.rndInt(11, 140) * MS_MIN +
            this.rndInt(0, 59) * 1000,
        );
      }
    }

    // Simulate chronologically to find the first real breach (daily or overall).
    let running = size;
    let dayStart = size;
    let curDayKey = '';
    let peakDaily = 0;
    let breachIndex = trades.length - 1;
    let breachType: SimResult['breachType'] = 'OVERALL_DRAWDOWN';
    let lastDayStartEquity = size;

    for (let i = 0; i < trades.length; i++) {
      const t = trades[i];
      const dayKey = t.openedAt.toISOString().slice(0, 10);
      if (dayKey !== curDayKey) {
        curDayKey = dayKey;
        dayStart = running;
      }
      t.dayStartEquity = dayStart;
      running = this.round(running + t.profit, 2);
      t.balanceAfter = running;
      const dailyLoss = ((dayStart - running) / dayStart) * 100;
      const overallLoss = ((size - running) / size) * 100;
      if (dailyLoss > peakDaily) peakDaily = dailyLoss;
      lastDayStartEquity = dayStart;
      if (overallLoss >= overallPct || dailyLoss >= dailyPct) {
        breachIndex = i;
        breachType =
          overallLoss >= overallPct ? 'OVERALL_DRAWDOWN' : 'DAILY_DRAWDOWN';
        break;
      }
    }

    const finalTrades = trades.slice(0, breachIndex + 1);
    finalTrades[finalTrades.length - 1].isBreach = true;
    const finalBalance = finalTrades[finalTrades.length - 1].balanceAfter;
    const terminatedAt = finalTrades[finalTrades.length - 1].closedAt;
    const overallDrawdownPercent = ((size - finalBalance) / size) * 100;
    const lastDailyReset = new Date(terminatedAt.getTime());
    lastDailyReset.setUTCHours(0, 0, 0, 0);

    return {
      trades: finalTrades,
      breachType,
      finalBalance,
      overallDrawdownPercent,
      peakDailyDrawdownPercent: this.round(peakDaily, 2),
      lastDayStartEquity,
      lastDailyReset,
      terminatedAt,
    };
  }

  /** Split `total` into `n` positive parts, each <= cap, with randomness. */
  private splitRandom(total: number, n: number, cap: number): number[] {
    const weights = Array.from({ length: n }, () => this.rnd(0.6, 1.4));
    const sum = weights.reduce((a, b) => a + b, 0);
    let parts = weights.map((w) => (w / sum) * total);
    // Clamp to cap and redistribute any overflow.
    for (let iter = 0; iter < 5; iter++) {
      let overflow = 0;
      parts = parts.map((p) => {
        if (p > cap) {
          overflow += p - cap;
          return cap;
        }
        return p;
      });
      if (overflow <= 0.0001) break;
      const room = parts.map((p) => Math.max(0, cap - p));
      const roomSum = room.reduce((a, b) => a + b, 0) || 1;
      parts = parts.map((p, i) => p + (room[i] / roomSum) * overflow);
    }
    return parts;
  }

  /** Distribute `count` items into `bins`, at least 1 each, randomized. */
  private distributeCount(count: number, bins: number): number[] {
    const out = Array.from({ length: bins }, () => 1);
    let remaining = count - bins;
    while (remaining > 0) {
      out[this.rndInt(0, bins - 1)] += 1;
      remaining--;
    }
    return out;
  }

  /**
   * Produce `k` signed P/L values summing to `-net` (a net loss). Most are
   * losses with varied magnitudes; non-final days may include one small winner.
   * The final day's largest loss is placed last so it is the breach trade.
   */
  private splitDayProfits(net: number, k: number, isLastDay: boolean): number[] {
    const mags = Array.from({ length: k }, () => this.rnd(0.5, 1.6));
    const signs = mags.map(() => -1);
    if (!isLastDay && k >= 3 && Math.random() < 0.5) {
      // one small winner
      const w = this.rndInt(0, k - 1);
      signs[w] = 1;
      mags[w] *= 0.45;
    }
    const signed = mags.map((m, i) => m * signs[i]);
    const s = signed.reduce((a, b) => a + b, 0); // negative
    const scale = s !== 0 ? -net / s : 0; // makes sum === -net
    let values = signed.map((v) => v * scale);
    // Fix rounding drift on a loser.
    const rounded = values.map((v) => this.round(v, 2));
    const drift = this.round(-net - rounded.reduce((a, b) => a + b, 0), 2);
    const loserIdx = rounded.findIndex((v) => v < 0);
    if (loserIdx >= 0) rounded[loserIdx] = this.round(rounded[loserIdx] + drift, 2);
    values = rounded;
    if (isLastDay) {
      // Largest loss last (this trade breaches the overall limit).
      values.sort((a, b) => b - a); // ascending loss magnitude -> most negative last
    }
    return values;
  }

  async generateEvidence(dto: GenerateEvidenceDto) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: dto.challengeId },
    });
    if (!challenge) throw new NotFoundException('Challenge plan not found');

    const formDate = new Date(dto.registrationDate);
    if (Number.isNaN(formDate.getTime())) {
      throw new BadRequestException('Invalid registrationDate');
    }

    const recipientEmail = dto.recipientEmail || DEFAULT_RECIPIENT;
    const currency = dto.currency || challenge.currency;
    const amountPaid = Math.round(
      dto.amountPaid != null ? dto.amountPaid : challenge.price,
    );
    const numTrades = dto.numTrades ?? 6;
    const platform = challenge.platform;
    const derivedName = this.nameFromEmail(dto.email);
    const firstName = dto.firstName || derivedName.firstName;
    const lastName = dto.lastName || derivedName.lastName;
    const fullName = `${firstName} ${lastName}`.trim();
    const cardholder: CardholderInfo = { email: dto.email, name: fullName };
    const uploadTx = dto.transaction || null;
    const cardBrand = dto.cardBrand || uploadTx?.paymentBrand || null;
    const cardLast4 = dto.cardLast4 || uploadTx?.lastFour || null;
    const cardBin = uploadTx?.firstSix || null;
    const processor = uploadTx
      ? {
          merchant: uploadTx.merchant || null,
          orderId: uploadTx.orderId || null,
          orderDescription: uploadTx.orderDescription || null,
          paymentId: uploadTx.paymentId || null,
          trackingId: uploadTx.trackingId || null,
          uuid: uploadTx.uuid || null,
          rrn: uploadTx.rrn || null,
          arn: uploadTx.arn || null,
          authCode: uploadTx.authCode || null,
          acquirerBank: uploadTx.acquirerBank || null,
          processingBank: uploadTx.processingBank || null,
          issuingBank: uploadTx.issuingBank || null,
          aliasName: uploadTx.aliasName || null,
          terminalId: uploadTx.terminalId || null,
          paymentMode: uploadTx.paymentMode || null,
          paymentBrand: uploadTx.paymentBrand || null,
          transactionMode: uploadTx.transactionMode || null,
          binCardCategory: uploadTx.binCardCategory || null,
          binCardType: uploadTx.binCardType || null,
          firstSix: uploadTx.firstSix || null,
          lastFour: uploadTx.lastFour || null,
          isoCountry: uploadTx.isoCountry || null,
          transactionCountry: uploadTx.transactionCountry || null,
          status: uploadTx.status || null,
          remark: uploadTx.remark || null,
          authAmount: uploadTx.authAmount || null,
          capturedAmount: uploadTx.capturedAmount || null,
          successTimeStamp: uploadTx.successTimeStamp || null,
          transactionDate: uploadTx.transactionDate || null,
        }
      : null;
    // Resolve the registration moment. If evidence already exists for this
    // cardholder, reuse the original date AND time so a 2nd run is identical.
    // Otherwise anchor on the uploaded transaction's real timestamp, or
    // synthesise a realistic, stable (seeded) time-of-day — never midnight.
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
      select: { createdAt: true },
    });
    const txTimestamp =
      this.parseTimestamp(uploadTx?.transactionDate) ||
      this.parseTimestamp(uploadTx?.successTimeStamp);
    const regDayKey = (existingUser?.createdAt ?? txTimestamp ?? formDate)
      .toISOString()
      .slice(0, 10);
    const rng = this.seedFrom(`${dto.email}|${regDayKey}`);

    let registeredAt: Date;
    if (existingUser?.createdAt) {
      registeredAt = new Date(existingUser.createdAt);
    } else if (txTimestamp) {
      registeredAt = txTimestamp;
    } else {
      registeredAt = new Date(`${regDayKey}T00:00:00.000Z`);
      registeredAt.setUTCHours(
        9 + Math.floor(rng() * 10), // 09:00–18:59 UTC
        Math.floor(rng() * 60),
        Math.floor(rng() * 60),
        0,
      );
    }
    const reusedRegistration = !!existingUser?.createdAt;

    // Ordered, deterministic lifecycle times (registration → purchase →
    // account provisioned). Uses the real capture time when available.
    const successTime = this.parseTimestamp(uploadTx?.successTimeStamp);
    const purchasedAt =
      successTime && successTime.getTime() >= registeredAt.getTime()
        ? successTime
        : new Date(
            registeredAt.getTime() +
              (2 + Math.floor(rng() * 11)) * MS_MIN +
              Math.floor(rng() * 60) * 1000,
          );
    const accountCreatedAt = new Date(
      purchasedAt.getTime() +
        (1 + Math.floor(rng() * 5)) * MS_MIN +
        Math.floor(rng() * 60) * 1000,
    );

    const frontendBase = (
      this.config.get<string>('APP_FRONTEND_URL') || 'https://prop-capitals.com'
    ).replace(/\/$/, '');
    const signed: SignedTermsData = {
      cardholder: { email: dto.email, name: fullName, country: dto.country || null },
      acceptedAt: registeredAt,
      ipAddress: dto.ipAddress || this.randomIp(dto.email),
      userAgent: dto.userAgent || DEFAULT_USER_AGENT,
      termsVersion: dto.termsVersion || DEFAULT_TERMS_VERSION,
      documentUrl: `${frontendBase}/legal/terms`,
    };

    const sim = this.buildTrades(challenge, numTrades, registeredAt);
    const trades = sim.trades;
    const terminatedAt = sim.terminatedAt;
    const totalLoss = this.round(trades.reduce((s, t) => s + t.profit, 0), 2);
    const finalBalance = sim.finalBalance;
    const overallDrawdownPercent = sim.overallDrawdownPercent;
    const breachIsDaily = sim.breachType === 'DAILY_DRAWDOWN';
    const breachLimitPct = breachIsDaily
      ? challenge.dailyDrawdownPercent
      : challenge.overallDrawdownPercent;
    const breachReachedPct = breachIsDaily
      ? sim.peakDailyDrawdownPercent
      : overallDrawdownPercent;
    const breachLabel = breachIsDaily
      ? `daily drawdown limit of ${challenge.dailyDrawdownPercent}%`
      : `maximum (overall) drawdown limit of ${challenge.overallDrawdownPercent}%`;

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
          cardBrand,
          cardLast4,
          cardBin,
          metadata: uploadTx
            ? { source: 'transaction-upload', transaction: uploadTx }
            : undefined,
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
          todayStartEquity: sim.lastDayStartEquity,
          minEquityToday: finalBalance,
          minEquityOverall: finalBalance,
          lastDailyReset: sim.lastDailyReset,
          dailyLossViolated: breachIsDaily,
          drawdownViolated: !breachIsDaily,
          peakDailyDrawdownPercent: sim.peakDailyDrawdownPercent,
          peakOverallDrawdownPercent: this.round(overallDrawdownPercent, 2),
          peakProfitPercent: 0,
        },
      });

      await tx.payment.update({
        where: { id: payment.id },
        data: { tradingAccountId: account.id },
      });

      // 4) Trades + equity snapshots
      await tx.equitySnapshot.create({
        data: {
          tradingAccountId: account.id,
          equity: challenge.accountSize,
          balance: challenge.accountSize,
          timestamp: new Date(trades[0].openedAt.getTime() - 5 * MS_MIN),
        },
      });
      for (const t of trades) {
        const dailyLossPct =
          ((t.dayStartEquity - t.balanceAfter) / t.dayStartEquity) * 100;
        const overallLossPct =
          ((challenge.accountSize - t.balanceAfter) / challenge.accountSize) *
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
            breachType: t.isBreach ? sim.breachType : null,
            breachAt: t.isBreach ? t.closedAt : null,
            breachEquity: t.isBreach ? t.balanceAfter : null,
            breachDrawdownPercentDaily: t.isBreach
              ? this.round(dailyLossPct, 2)
              : null,
            breachDrawdownPercentOverall: t.isBreach
              ? this.round(overallLossPct, 2)
              : null,
          },
        });
        await tx.equitySnapshot.create({
          data: {
            tradingAccountId: account.id,
            equity: t.balanceAfter,
            balance: t.balanceAfter,
            timestamp: t.closedAt,
          },
        });
      }

      // 5) Violation (drawdown breach => terminated)
      await tx.violation.create({
        data: {
          tradingAccountId: account.id,
          type: breachIsDaily
            ? ViolationType.DAILY_DRAWDOWN
            : ViolationType.OVERALL_DRAWDOWN,
          message: `The ${breachLabel} was breached (reached ${breachReachedPct.toFixed(2)}%). Account disqualified.`,
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
            body: `Your ${challenge.name} evaluation was terminated after breaching the ${breachLabel}.`,
            type: NotificationType.ERROR,
            category: NotificationCategory.CHALLENGE,
            createdAt: terminatedAt,
          },
        ],
      });

      return { user, payment, account, userCreated };
    });

    // ---- Build the communications (copies kept for the report) -------------
    const built: { key: string; at: Date; content: EmailContent }[] = [
      {
        key: 'signed-terms',
        at: registeredAt,
        content: buildSignedTermsEmail({ signed, invoiceNumber }),
      },
      {
        key: 'welcome',
        at: registeredAt,
        content: buildWelcomeEmail(cardholder, frontendBase),
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
          cardBrand,
          cardLast4,
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
          reason: `The ${breachLabel} was breached`,
          drawdownPercent: breachReachedPct,
          limitPercent: breachLimitPct,
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
        dailyDrawdownLimit: challenge.dailyDrawdownPercent,
        overallDrawdownLimit: challenge.overallDrawdownPercent,
      },
      payment: {
        invoiceNumber,
        reference,
        amount: amountPaid,
        currency,
        status: 'succeeded',
        provider: 'card',
        cardBrand,
        cardLast4,
        cardBin,
        paidAt: purchasedAt,
        processor,
      },
      account: {
        id: result.account.id,
        status: result.account.status,
        phase: result.account.phase,
        initialBalance: challenge.accountSize,
        finalBalance,
        overallDrawdownPercent,
        peakDailyDrawdownPercent: sim.peakDailyDrawdownPercent,
        breachType: sim.breachType,
        breachReason: breachLabel,
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
        type: 'terms',
        title: 'Terms & Conditions accepted',
        detail: `${fullName} electronically accepted the T&C (${signed.termsVersion}) from IP ${signed.ipAddress}.`,
      },
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
        detail: `The ${breachLabel} was breached (reached ${breachReachedPct.toFixed(2)}%). Account disqualified.`,
      },
    ];

    const reuseNote = reusedRegistration
      ? ` Reused the existing registration date for ${dto.email}.`
      : '';
    return {
      message:
        (sendEmails
          ? `Evidence pack generated and ${communications.filter((c) => c.sent).length}/${communications.length} emails sent to ${recipientEmail}.`
          : 'Evidence pack generated (emails not sent).') + reuseNote,
      recipientEmail,
      reusedRegistration,
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
      signedTerms: {
        name: fullName,
        email: dto.email,
        country: dto.country || null,
        acceptedAt: registeredAt.toISOString(),
        ipAddress: signed.ipAddress,
        userAgent: signed.userAgent,
        termsVersion: signed.termsVersion,
        documentUrl: signed.documentUrl,
        statement: `I, ${fullName}, confirm that on ${registeredAt.toISOString()} I read and accepted the Prop Capitals Terms & Conditions (${signed.termsVersion}), Risk Disclosure and Privacy Policy by ticking the acceptance checkbox at checkout.`,
        clauses: TERMS_CLAUSES,
      },
      policies: this.getPolicies(),
    };
  }

  /** Deterministic seeded PRNG (mulberry32) so a run is reproducible per input. */
  private seedFrom(s: string): () => number {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    let a = h >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Parse "YYYY-MM-DD HH:MM[:SS]" (or ISO) into a UTC Date, else null. */
  private parseTimestamp(s?: string | null): Date | null {
    if (!s) return null;
    const m = s
      .trim()
      .match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
    if (!m) return null;
    return new Date(
      Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], m[6] ? +m[6] : 0),
    );
  }

  /** Derive a plausible first/last name from an email local-part. */
  private nameFromEmail(email: string): { firstName: string; lastName: string } {
    const local = (email.split('@')[0] || '').replace(/[0-9]+/g, '');
    const parts = local
      .split(/[._-]+/)
      .filter(Boolean)
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());
    if (parts.length === 0) return { firstName: 'Card', lastName: 'Holder' };
    if (parts.length === 1) return { firstName: parts[0], lastName: 'Holder' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  }

  /** Deterministic-ish plausible public IP derived from the email. */
  private randomIp(seed: string): string {
    let h = 0;
    for (let i = 0; i < seed.length; i++) {
      h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const a = 0x2e; // 46.x.x.x range (public)
    const b = 16 + ((h >> 16) & 0x3f);
    const c = (h >> 8) & 0xff;
    const d = 1 + (h & 0xfd);
    return `${a}.${b}.${c}.${d}`;
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
