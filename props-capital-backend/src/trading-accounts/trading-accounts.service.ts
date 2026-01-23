import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { EvaluationService } from '../evaluation/evaluation.service';

import { TradingPhase } from '@prisma/client';

@Injectable()
export class TradingAccountsService {
  private readonly logger = new Logger(TradingAccountsService.name);

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EvaluationService))
    private evaluationService: EvaluationService,
  ) {}

  // Create trading account when user buys a challenge

  async createAccount(userId: string, challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // CRITICAL: Initialize maxEquityToDate to initialBalance (industry standard)
    // This is the peak equity ever reached - starts at account creation
    const initialBalance = challenge.accountSize;

    return this.prisma.tradingAccount.create({
      data: {
        userId,

        challengeId,

        phase: 'PHASE1',

        status: 'ACTIVE',

        initialBalance: initialBalance,

        balance: initialBalance,

        equity: initialBalance,

        maxEquityToDate: initialBalance, // Initialize to starting balance (peak equity starts here)
      } as any,
    });
  }

  // Get all accounts for a user

  async getUserAccounts(userId: string) {
    // Fetch all accounts for the user
    const accounts = await this.prisma.tradingAccount.findMany({
      where: { userId },

      include: {
        challenge: true,
      },

      orderBy: { createdAt: 'desc' },
    });

    // If no accounts, return empty array
    if (accounts.length === 0) {
      return [];
    }

    // Get all account IDs
    const accountIds = accounts.map((account) => account.id);

    // Query trades for all accounts to compute tradingDaysCount
    const trades = await this.prisma.trade.findMany({
      where: { tradingAccountId: { in: accountIds } },

      select: { tradingAccountId: true, openedAt: true },
    });

    // Build map: accountId -> Set of distinct dates
    const tradingDaysMap: Record<string, Set<string>> = {};

    accountIds.forEach((id) => {
      tradingDaysMap[id] = new Set();
    });

    trades.forEach((trade) => {
      const dateKey = trade.openedAt.toISOString().substring(0, 10);
      tradingDaysMap[trade.tradingAccountId]?.add(dateKey);
    });

    // Convert Set sizes to numbers
    const tradingDaysCountMap: Record<string, number> = {};

    Object.keys(tradingDaysMap).forEach((accountId) => {
      tradingDaysCountMap[accountId] = tradingDaysMap[accountId].size;
    });

    // Query violations for all accounts to get last violation message
    const violations = await this.prisma.violation.findMany({
      where: { tradingAccountId: { in: accountIds } },

      orderBy: { createdAt: 'desc' },

      select: { tradingAccountId: true, message: true },
    });

    // Build map: accountId -> most recent violation message
    const lastViolationMessageMap: Record<string, string> = {};

    violations.forEach((violation) => {
      // Only set if not already set (since violations are ordered desc, first occurrence is most recent)
      if (!lastViolationMessageMap[violation.tradingAccountId]) {
        lastViolationMessageMap[violation.tradingAccountId] = violation.message;
      }
    });

    // Map accounts to include computed fields
    return accounts.map((account) => ({
      ...account,

      tradingDaysCount: tradingDaysCountMap[account.id] || 0,

      lastViolationMessage: lastViolationMessageMap[account.id] || null,
    }));
  }

  // Get single trading account with full details

  async getAccountById(id: string) {
    // Fetch account with all relations
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id },

      include: {
        challenge: true,

        trades: true,

        violations: {
          orderBy: { createdAt: 'desc' },
        },

        phaseHistory: {
          orderBy: { timestamp: 'asc' },
        },

        equityShots: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Trading account not found');
    }

    const { challenge } = account;

    // Calculate tradingDaysCount
    const tradingDaysSet = new Set<string>();

    account.trades.forEach((trade) => {
      const dateKey = trade.openedAt.toISOString().substring(0, 10);

      tradingDaysSet.add(dateKey);
    });

    const tradingDaysCount = tradingDaysSet.size;

    // Get last violation message
    const lastViolationMessage =
      account.violations.length > 0 ? account.violations[0].message : null;

    // Calculate initial balance (fallback to challenge accountSize)
    const initialBalance = account.initialBalance || challenge.accountSize || 0;

    const equity = account.equity ?? initialBalance;

    const balance = account.balance ?? initialBalance;

    // Calculate profit percent
    const profitPercent =
      initialBalance > 0
        ? ((equity - initialBalance) / initialBalance) * 100
        : 0;

    // Calculate overall drawdown percent
    // Overall DD is calculated from maxEquityToDate (highest equity ever reached), not initialBalance
    // This matches ChallengeRulesService calculation: (maxEquityToDate - equity) / maxEquityToDate * 100
    const maxEquityToDate = (account as any).maxEquityToDate ?? initialBalance;
    const overallDrawdownPercent =
      maxEquityToDate > 0 && equity < maxEquityToDate
        ? ((maxEquityToDate - equity) / maxEquityToDate) * 100
        : 0;

    // Calculate daily drawdown percent
    // Daily DD is calculated from today's highest equity (using equity snapshots)
    // This is more accurate than the simple balance vs equity comparison
    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const todaySnapshots = account.equityShots.filter(
      (shot) => new Date(shot.timestamp) >= today,
    );

    // Find the highest equity today
    // If no snapshots for today, use the account's balance (start of day) or initial balance
    // This prevents using a lower equity as the "max" when account loads after a loss
    const maxEquityToday =
      todaySnapshots.length > 0
        ? Math.max(...todaySnapshots.map((s) => s.equity))
        : Math.max(balance, initialBalance); // Use balance (start of day) or initial balance, not current equity

    // Daily drawdown is from today's highest equity to current equity
    const dailyDrawdownPercent =
      maxEquityToday > 0 && equity < maxEquityToday
        ? ((maxEquityToday - equity) / maxEquityToday) * 100
        : 0;

    // Calculate remaining drawdown allowances
    const remainingDailyDD = Math.max(
      0,

      challenge.dailyDrawdownPercent - dailyDrawdownPercent,
    );

    const remainingOverallDD = Math.max(
      0,

      challenge.overallDrawdownPercent - overallDrawdownPercent,
    );

    // Calculate margin used and free margin from open positions
    // Get open trades (trades without closePrice)
    const openTrades = account.trades.filter(
      (trade) => trade.closePrice === null,
    );

    let marginUsed = 0;
    const leverage = 100; // Standard leverage for all positions

    for (const trade of openTrades) {
      // Check if symbol is crypto
      const isCrypto = /BTC|ETH|SOL|XRP|ADA|DOGE/.test(trade.symbol);
      const contractSize = isCrypto ? 1 : 100000; // Crypto uses 1, Forex uses 100000

      // Calculate margin: (lotSize * contractSize * entryPrice) / leverage
      // For crypto: volume is in units, so margin = (volume * entryPrice) / leverage
      // For forex: volume is in lots, so margin = (volume * contractSize * entryPrice) / leverage
      const positionMargin = isCrypto
        ? (trade.volume * trade.openPrice) / leverage
        : (trade.volume * contractSize * trade.openPrice) / leverage;

      marginUsed += positionMargin;
    }

    // Free margin = equity - margin used
    const freeMargin = Math.max(0, equity - marginUsed);

    // Calculate days remaining
    const daysRemaining = Math.max(
      0,
      challenge.minTradingDays - tradingDaysCount,
    );

    // Calculate analytics for this account
    const analytics = this.calculateAccountAnalytics(account);

    // Build response DTO
    return {
      // Basic fields
      id: account.id,

      phase: account.phase,

      status: account.status,

      balance,

      equity,

      initialBalance,

      brokerLogin: account.brokerLogin,

      brokerPassword: account.brokerPassword,

      brokerServerId: account.brokerServerId,

      createdAt: account.createdAt.toISOString(),

      updatedAt: account.updatedAt.toISOString(),

      // Platform - user's selected platform (MT4, MT5, CTRADER, DXTRADE)
      platform: account.platform,

      // Challenge details
      challenge: {
        id: challenge.id,

        name: challenge.name,

        description: challenge.description || null,

        accountSize: challenge.accountSize,

        price: challenge.price,

        platform: challenge.platform,

        phase1TargetPercent: challenge.phase1TargetPercent,

        phase2TargetPercent: challenge.phase2TargetPercent,

        dailyDrawdownPercent: challenge.dailyDrawdownPercent,

        overallDrawdownPercent: challenge.overallDrawdownPercent,

        minTradingDays: challenge.minTradingDays,

        maxTradingDays: challenge.maxTradingDays || null,

        newsTradingAllowed: challenge.newsTradingAllowed,

        eaAllowed: challenge.eaAllowed,

        weekendHoldingAllowed: challenge.weekendHoldingAllowed,

        profitSplit: challenge.profitSplit,
      },

      // Metrics
      tradingDaysCount,

      lastViolationMessage,

      profitPercent,

      overallDrawdownPercent,

      dailyDrawdownPercent,

      remainingDailyDD,

      remainingOverallDD,

      // Margin metrics
      marginUsed,

      freeMargin,

      // Trading days metrics
      daysRemaining,

      // Analytics data (Daily Performance & Stats)
      analytics: {
        statistics: analytics.statistics,
        dailyPnL: analytics.dailyPnL,
        equityCurve: analytics.equityCurve,
      },

      // Related arrays
      violations: account.violations.map((v) => ({
        id: v.id,

        type: v.type,

        message: v.message,

        createdAt: v.createdAt.toISOString(),
      })),

      phaseHistory: account.phaseHistory.map((ph) => ({
        id: ph.id,

        fromPhase: ph.fromPhase,

        toPhase: ph.toPhase,

        timestamp: ph.timestamp.toISOString(),
      })),

      equityShots: account.equityShots.map((es) => ({
        id: es.id,

        equity: es.equity,

        balance: es.balance,

        timestamp: es.timestamp.toISOString(),
      })),
    };
  }

  // 🔥 Rule compliance overview for a trading account

  async getRuleCompliance(accountId: string) {
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },

      include: {
        challenge: true,

        trades: true,

        violations: true,

        equityShots: {
          orderBy: { timestamp: 'asc' },
        },

        phaseHistory: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Trading account not found');
    }

    const { challenge } = account;

    // Validate challenge rule percentages - DO NOT default to 0, throw explicit error
    if (
      challenge.dailyDrawdownPercent === null ||
      challenge.dailyDrawdownPercent === undefined
    ) {
      this.logger.error(
        `[CHALLENGE_RULES_MISSING] Account ${accountId} has missing dailyDrawdownPercent. Challenge ID: ${challenge.id}`,
      );
      throw new InternalServerErrorException({
        code: 'CHALLENGE_RULES_MISSING',
        message: `Challenge rules are incomplete. Missing dailyDrawdownPercent for account ${accountId} (challenge ${challenge.id})`,
        accountId,
        challengeId: challenge.id,
        missingField: 'dailyDrawdownPercent',
      });
    }
    if (
      challenge.overallDrawdownPercent === null ||
      challenge.overallDrawdownPercent === undefined
    ) {
      this.logger.error(
        `[CHALLENGE_RULES_MISSING] Account ${accountId} has missing overallDrawdownPercent. Challenge ID: ${challenge.id}`,
      );
      throw new InternalServerErrorException({
        code: 'CHALLENGE_RULES_MISSING',
        message: `Challenge rules are incomplete. Missing overallDrawdownPercent for account ${accountId} (challenge ${challenge.id})`,
        accountId,
        challengeId: challenge.id,
        missingField: 'overallDrawdownPercent',
      });
    }
    if (
      challenge.phase1TargetPercent === null ||
      challenge.phase1TargetPercent === undefined
    ) {
      this.logger.error(
        `[CHALLENGE_RULES_MISSING] Account ${accountId} has missing phase1TargetPercent. Challenge ID: ${challenge.id}`,
      );
      throw new InternalServerErrorException({
        code: 'CHALLENGE_RULES_MISSING',
        message: `Challenge rules are incomplete. Missing phase1TargetPercent for account ${accountId} (challenge ${challenge.id})`,
        accountId,
        challengeId: challenge.id,
        missingField: 'phase1TargetPercent',
      });
    }
    if (
      challenge.phase2TargetPercent === null ||
      challenge.phase2TargetPercent === undefined
    ) {
      this.logger.error(
        `[CHALLENGE_RULES_MISSING] Account ${accountId} has missing phase2TargetPercent. Challenge ID: ${challenge.id}`,
      );
      throw new InternalServerErrorException({
        code: 'CHALLENGE_RULES_MISSING',
        message: `Challenge rules are incomplete. Missing phase2TargetPercent for account ${accountId} (challenge ${challenge.id})`,
        accountId,
        challengeId: challenge.id,
        missingField: 'phase2TargetPercent',
      });
    }

    // initial balance: if not set, fallback to challenge accountSize

    const initialBalance = account.initialBalance || challenge.accountSize;

    const equity = account.equity ?? initialBalance;

    const balance = account.balance ?? initialBalance;

    // Profit %

    const profitPercent =
      initialBalance > 0
        ? ((equity - initialBalance) / initialBalance) * 100
        : 0;

    // Overall DD % - Calculate from maxEquityToDate (highest equity ever reached)
    // This matches ChallengeRulesService calculation: (maxEquityToDate - equity) / maxEquityToDate * 100
    const maxEquityToDate = (account as any).maxEquityToDate ?? initialBalance;
    const overallDrawdownPercent =
      maxEquityToDate > 0 && equity < maxEquityToDate
        ? ((maxEquityToDate - equity) / maxEquityToDate) * 100
        : 0;

    // Daily DD % — Calculate from today's highest equity (using equity snapshots)
    // This is more accurate than the simple balance vs equity comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's equity snapshots to find the highest equity today
    const todaySnapshots = account.equityShots.filter(
      (shot) => new Date(shot.timestamp) >= today,
    );

    // Find the highest equity today
    // If no snapshots for today, use the account's balance (start of day) or initial balance
    // This prevents using a lower equity as the "max" when account loads after a loss
    const maxEquityToday =
      todaySnapshots.length > 0
        ? Math.max(...todaySnapshots.map((s) => s.equity))
        : Math.max(balance, initialBalance); // Use balance (start of day) or initial balance, not current equity

    // Daily drawdown is from today's highest equity to current equity
    const dailyDrawdownPercent =
      maxEquityToday > 0 && equity < maxEquityToday
        ? ((maxEquityToday - equity) / maxEquityToday) * 100
        : 0;

    // Trading days based on distinct trade dates
    const tradeDates = account.trades.map((t) =>
      t.openedAt.toISOString().substring(0, 10),
    );
    const tradingDaysCompleted = new Set(tradeDates).size;

    // Phase-specific target

    let currentPhaseTarget: number | null = null;

    if (account.phase === TradingPhase.PHASE1) {
      currentPhaseTarget = challenge.phase1TargetPercent;
    } else if (account.phase === TradingPhase.PHASE2) {
      currentPhaseTarget = challenge.phase2TargetPercent;
    }

    const phasePassed =
      currentPhaseTarget !== null ? profitPercent >= currentPhaseTarget : false;

    // Determine phase statuses
    const phase1Passed = account.phaseHistory.some(
      (t) =>
        t.fromPhase === TradingPhase.PHASE1 &&
        t.toPhase === TradingPhase.PHASE2,
    );
    const phase2Passed = account.phaseHistory.some(
      (t) =>
        t.fromPhase === TradingPhase.PHASE2 &&
        t.toPhase === TradingPhase.FUNDED,
    );

    return {
      account: {
        id: account.id,

        status: account.status,

        phase: account.phase,

        balance,

        equity,

        createdAt: account.createdAt,
      },

      challengeRules: {
        dailyDrawdownPercent: challenge.dailyDrawdownPercent,

        overallDrawdownPercent: challenge.overallDrawdownPercent,

        phase1TargetPercent: challenge.phase1TargetPercent,

        phase2TargetPercent: challenge.phase2TargetPercent,

        minTradingDays: challenge.minTradingDays,

        maxTradingDays: challenge.maxTradingDays,
      },

      metrics: {
        profitPercent,

        dailyDrawdownPercent,

        overallDrawdownPercent,

        tradingDaysCompleted,

        minTradingDays: challenge.minTradingDays,

        daysRemaining: Math.max(
          0,
          challenge.minTradingDays - tradingDaysCompleted,
        ),

        phasePassed,
      },

      violations: account.violations,

      phaseHistory: account.phaseHistory.map((t) => ({
        id: t.id,

        fromPhase: t.fromPhase,

        toPhase: t.toPhase,

        timestamp: t.timestamp,
      })),

      phaseStatus: {
        phase1Passed,

        phase2Passed,

        currentPhase: account.phase,
      },
    };
  }

  // Get phase transition history for an account
  async getPhaseTransitions(accountId: string) {
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
      include: {
        phaseHistory: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Trading account not found');
    }

    return account.phaseHistory.map((transition) => ({
      id: transition.id,
      fromPhase: transition.fromPhase,
      toPhase: transition.toPhase,
      timestamp: transition.timestamp,
    }));
  }

  // Get daily compliance history for an account
  async getDailyComplianceHistory(accountId: string, days: number = 7) {
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
      include: {
        challenge: true,
        equityShots: {
          orderBy: { timestamp: 'desc' },
        },
        violations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Trading account not found');
    }

    const { challenge } = account;
    const initialBalance = account.initialBalance || challenge.accountSize;

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Group equity snapshots by date
    const snapshotsByDate: Record<string, any[]> = {};
    account.equityShots.forEach((snapshot) => {
      const date = new Date(snapshot.timestamp);
      if (date >= startDate && date <= endDate) {
        const dateKey = date.toISOString().substring(0, 10);
        if (!snapshotsByDate[dateKey]) {
          snapshotsByDate[dateKey] = [];
        }
        snapshotsByDate[dateKey].push(snapshot);
      }
    });

    // Group violations by date
    const violationsByDate: Record<string, any[]> = {};
    account.violations.forEach((violation) => {
      const date = new Date(violation.createdAt);
      if (date >= startDate && date <= endDate) {
        const dateKey = date.toISOString().substring(0, 10);
        if (!violationsByDate[dateKey]) {
          violationsByDate[dateKey] = [];
        }
        violationsByDate[dateKey].push(violation);
      }
    });

    // Generate daily history
    const dailyHistory: Array<{
      date: string;
      dailyDrawdown: number;
      overallDrawdown: number;
      profitPercent: number;
      violations: Array<{
        id: string;
        type: any;
        message: string;
        createdAt: Date;
      }>;
    }> = [];
    const accountCreatedAt = new Date(account.createdAt);
    accountCreatedAt.setHours(0, 0, 0, 0);

    for (let i = 0; i < days; i++) {
      const date = new Date(endDate);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      // Only include history for days since the account was created
      if (date < accountCreatedAt) {
        continue;
      }

      const dateKey = date.toISOString().substring(0, 10);

      const daySnapshots = snapshotsByDate[dateKey] || [];
      const dayViolations = violationsByDate[dateKey] || [];

      // Calculate daily metrics
      let dailyDrawdown = 0;
      let overallDrawdown = 0;
      let profitPercent = 0;

      if (daySnapshots.length > 0) {
        const maxEquity = Math.max(...daySnapshots.map((s) => s.equity));
        const minEquity = Math.min(...daySnapshots.map((s) => s.equity));
        const lastEquity = daySnapshots[daySnapshots.length - 1].equity;

        // Daily drawdown: from max equity of the day to last equity of the day
        if (maxEquity > 0 && lastEquity < maxEquity) {
          dailyDrawdown = ((maxEquity - lastEquity) / maxEquity) * 100;
        }

        // Overall drawdown: from maxEquityToDate (peak equity) to last equity of the day
        // CRITICAL: Use maxEquityToDate, NOT initialBalance (industry standard)
        // For historical data, calculate peak equity from all snapshots up to and including this date
        // This ensures we use the actual peak equity reached up to that point in time
        const allSnapshotsUpToDate = account.equityShots.filter((snapshot) => {
          const snapshotDate = new Date(snapshot.timestamp);
          return snapshotDate <= date && snapshotDate >= startDate;
        });
        const peakEquity =
          allSnapshotsUpToDate.length > 0
            ? Math.max(
                initialBalance,
                ...allSnapshotsUpToDate.map((s) => s.equity),
              )
            : initialBalance; // Fallback to initialBalance if no snapshots

        if (peakEquity > 0 && lastEquity < peakEquity) {
          overallDrawdown = ((peakEquity - lastEquity) / peakEquity) * 100;
        }

        // Profit percent
        if (initialBalance > 0) {
          profitPercent =
            ((lastEquity - initialBalance) / initialBalance) * 100;
        }
      }

      // Only push if there is actual activity on this day
      if (daySnapshots.length > 0 || dayViolations.length > 0) {
        dailyHistory.push({
          date: dateKey,
          dailyDrawdown: parseFloat(dailyDrawdown.toFixed(2)),
          overallDrawdown: parseFloat(overallDrawdown.toFixed(2)),
          profitPercent: parseFloat(profitPercent.toFixed(2)),
          violations: dayViolations.map((v) => ({
            id: v.id,
            type: v.type,
            message: v.message,
            createdAt: v.createdAt,
          })),
        });
      }
    }

    // Sort by date descending (most recent first)
    return dailyHistory.reverse();
  }

  // Unified summary for dashboard

  async getAccountSummary(id: string) {
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id },

      include: {
        challenge: true,

        trades: {
          orderBy: { openedAt: 'desc' },

          take: 10,
        },

        violations: true,

        equityShots: {
          orderBy: { timestamp: 'asc' },
        },
      },
    });

    if (!account) throw new NotFoundException('Account not found');

    // Validate challenge rules before proceeding
    const { challenge } = account;
    if (!challenge) {
      this.logger.error(
        `[CHALLENGE_RULES_MISSING] Account ${id} has no challenge associated`,
      );
      throw new InternalServerErrorException({
        code: 'CHALLENGE_RULES_MISSING',
        message: `Account ${id} has no challenge associated`,
        accountId: id,
        challengeId: null,
      });
    }

    // Validate challenge rule percentages - DO NOT default to 0, throw explicit error
    if (
      challenge.dailyDrawdownPercent === null ||
      challenge.dailyDrawdownPercent === undefined
    ) {
      this.logger.error(
        `[CHALLENGE_RULES_MISSING] Account ${id} has missing dailyDrawdownPercent. Challenge ID: ${challenge.id}`,
      );
      throw new InternalServerErrorException({
        code: 'CHALLENGE_RULES_MISSING',
        message: `Challenge rules are incomplete. Missing dailyDrawdownPercent for account ${id} (challenge ${challenge.id})`,
        accountId: id,
        challengeId: challenge.id,
        missingField: 'dailyDrawdownPercent',
      });
    }
    if (
      challenge.overallDrawdownPercent === null ||
      challenge.overallDrawdownPercent === undefined
    ) {
      this.logger.error(
        `[CHALLENGE_RULES_MISSING] Account ${id} has missing overallDrawdownPercent. Challenge ID: ${challenge.id}`,
      );
      throw new InternalServerErrorException({
        code: 'CHALLENGE_RULES_MISSING',
        message: `Challenge rules are incomplete. Missing overallDrawdownPercent for account ${id} (challenge ${challenge.id})`,
        accountId: id,
        challengeId: challenge.id,
        missingField: 'overallDrawdownPercent',
      });
    }
    if (
      challenge.phase1TargetPercent === null ||
      challenge.phase1TargetPercent === undefined
    ) {
      this.logger.error(
        `[CHALLENGE_RULES_MISSING] Account ${id} has missing phase1TargetPercent. Challenge ID: ${challenge.id}`,
      );
      throw new InternalServerErrorException({
        code: 'CHALLENGE_RULES_MISSING',
        message: `Challenge rules are incomplete. Missing phase1TargetPercent for account ${id} (challenge ${challenge.id})`,
        accountId: id,
        challengeId: challenge.id,
        missingField: 'phase1TargetPercent',
      });
    }

    // reuse metrics from the rule compliance logic

    const rules = await this.getRuleCompliance(id);

    return {
      account: {
        id: account.id,

        status: account.status,

        phase: account.phase,

        balance: account.balance,

        equity: account.equity,

        initialBalance: account.initialBalance,

        todayStartEquity: (account as any).todayStartEquity,

        maxEquityToDate: (account as any).maxEquityToDate,

        createdAt: account.createdAt,
      },

      challengeRules: rules.challengeRules,

      metrics: rules.metrics,

      recentTrades: account.trades,

      violations: account.violations,

      equityHistory: account.equityShots,
    };
  }

  // Get analytics for a user (single account or aggregated for all accounts)
  async getAnalytics(userId: string, accountId?: string) {
    if (accountId) {
      // Single account analytics
      const account = await this.prisma.tradingAccount.findUnique({
        where: { id: accountId },
        include: {
          trades: {
            orderBy: { openedAt: 'desc' },
          },
          equityShots: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });

      if (!account || account.userId !== userId) {
        throw new NotFoundException('Trading account not found');
      }

      return this.calculateAccountAnalytics(account);
    } else {
      // Aggregated analytics for all user accounts
      const accounts = await this.prisma.tradingAccount.findMany({
        where: { userId },
        include: {
          trades: {
            orderBy: { openedAt: 'desc' },
          },
          equityShots: {
            orderBy: { timestamp: 'asc' },
          },
        },
      });

      if (accounts.length === 0) {
        return this.getEmptyAnalytics();
      }

      return this.calculateAggregatedAnalytics(accounts);
    }
  }

  // Calculate analytics for a single account
  private calculateAccountAnalytics(account: any) {
    const trades = account.trades || [];
    const closedTrades = trades.filter(
      (t: any) => t.closePrice !== null && t.closePrice !== undefined,
    );

    // Calculate statistics
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter((t: any) => (t.profit || 0) > 0);
    const losingTrades = closedTrades.filter((t: any) => (t.profit || 0) < 0);
    const winRate =
      totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

    const totalProfit = closedTrades.reduce(
      (sum: number, t: any) => sum + (t.profit || 0),
      0,
    );
    const avgWin =
      winningTrades.length > 0
        ? winningTrades.reduce(
            (sum: number, t: any) => sum + (t.profit || 0),
            0,
          ) / winningTrades.length
        : 0;
    const avgLoss =
      losingTrades.length > 0
        ? Math.abs(
            losingTrades.reduce(
              (sum: number, t: any) => sum + (t.profit || 0),
              0,
            ) / losingTrades.length,
          )
        : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    const profits = closedTrades.map((t: any) => t.profit || 0);
    const bestTrade = profits.length > 0 ? Math.max(...profits) : 0;
    const worstTrade = profits.length > 0 ? Math.min(...profits) : 0;

    // Symbol distribution
    const symbolStats: Record<string, number> = {};
    closedTrades.forEach((trade: any) => {
      symbolStats[trade.symbol] = (symbolStats[trade.symbol] || 0) + 1;
    });
    const symbolDistribution = Object.entries(symbolStats).map(
      ([name, value]) => ({
        name,
        value,
      }),
    );

    // Equity curve
    const equityCurve = account.equityShots.map((shot: any) => {
      const date = new Date(shot.timestamp);
      return {
        date: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        equity: shot.equity,
        balance: shot.balance,
      };
    });

    // Daily P/L
    const dailyPnL: Array<{ date: string; pnl: number }> = [];
    account.equityShots.forEach((shot: any, index: number) => {
      const prevShot = index > 0 ? account.equityShots[index - 1] : null;
      const dailyPnLValue = prevShot ? shot.equity - prevShot.equity : 0;
      const date = new Date(shot.timestamp);
      if (dailyPnLValue !== 0 || index === 0) {
        dailyPnL.push({
          date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          pnl: dailyPnLValue,
        });
      }
    });

    return {
      statistics: {
        totalTrades,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: parseFloat(winRate.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        avgWin: parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        bestTrade: parseFloat(bestTrade.toFixed(2)),
        worstTrade: parseFloat(worstTrade.toFixed(2)),
      },
      symbolDistribution,
      equityCurve,
      dailyPnL,
      accountId: account.id,
    };
  }

  // Calculate aggregated analytics for all accounts
  private calculateAggregatedAnalytics(accounts: any[]) {
    // Aggregate all trades
    const allTrades = accounts.flatMap((acc) => acc.trades || []);
    const closedTrades = allTrades.filter(
      (t: any) => t.closePrice !== null && t.closePrice !== undefined,
    );

    // Calculate statistics (same as single account)
    const totalTrades = closedTrades.length;
    const winningTrades = closedTrades.filter((t: any) => (t.profit || 0) > 0);
    const losingTrades = closedTrades.filter((t: any) => (t.profit || 0) < 0);
    const winRate =
      totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

    const totalProfit = closedTrades.reduce(
      (sum: number, t: any) => sum + (t.profit || 0),
      0,
    );
    const avgWin =
      winningTrades.length > 0
        ? winningTrades.reduce(
            (sum: number, t: any) => sum + (t.profit || 0),
            0,
          ) / winningTrades.length
        : 0;
    const avgLoss =
      losingTrades.length > 0
        ? Math.abs(
            losingTrades.reduce(
              (sum: number, t: any) => sum + (t.profit || 0),
              0,
            ) / losingTrades.length,
          )
        : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : 0;

    const profits = closedTrades.map((t: any) => t.profit || 0);
    const bestTrade = profits.length > 0 ? Math.max(...profits) : 0;
    const worstTrade = profits.length > 0 ? Math.min(...profits) : 0;

    // Symbol distribution
    const symbolStats: Record<string, number> = {};
    closedTrades.forEach((trade: any) => {
      symbolStats[trade.symbol] = (symbolStats[trade.symbol] || 0) + 1;
    });
    const symbolDistribution = Object.entries(symbolStats).map(
      ([name, value]) => ({
        name,
        value,
      }),
    );

    // Aggregate equity curve from all accounts
    // Group equity snapshots by date and sum them
    const equityByDate: Record<
      string,
      { equity: number; balance: number; count: number }
    > = {};

    accounts.forEach((account) => {
      account.equityShots.forEach((shot: any) => {
        const date = new Date(shot.timestamp);
        const dateKey = date.toISOString().substring(0, 10);

        if (!equityByDate[dateKey]) {
          equityByDate[dateKey] = { equity: 0, balance: 0, count: 0 };
        }
        equityByDate[dateKey].equity += shot.equity;
        equityByDate[dateKey].balance += shot.balance;
        equityByDate[dateKey].count += 1;
      });
    });

    // Convert to array and format
    const equityCurve = Object.entries(equityByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, data]) => {
        const date = new Date(dateKey);
        return {
          date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          equity: data.equity,
          balance: data.balance,
        };
      });

    // Daily P/L from aggregated equity
    const dailyPnL: Array<{ date: string; pnl: number }> = [];
    const sortedEquity = Object.entries(equityByDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([dateKey, data]) => ({ dateKey, equity: data.equity }));

    sortedEquity.forEach((item, index) => {
      const prevItem = index > 0 ? sortedEquity[index - 1] : null;
      const dailyPnLValue = prevItem ? item.equity - prevItem.equity : 0;
      const date = new Date(item.dateKey);
      if (dailyPnLValue !== 0 || index === 0) {
        dailyPnL.push({
          date: date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
          pnl: dailyPnLValue,
        });
      }
    });

    return {
      statistics: {
        totalTrades,
        winningTrades: winningTrades.length,
        losingTrades: losingTrades.length,
        winRate: parseFloat(winRate.toFixed(2)),
        totalProfit: parseFloat(totalProfit.toFixed(2)),
        avgWin: parseFloat(avgWin.toFixed(2)),
        avgLoss: parseFloat(avgLoss.toFixed(2)),
        profitFactor: parseFloat(profitFactor.toFixed(2)),
        bestTrade: parseFloat(bestTrade.toFixed(2)),
        worstTrade: parseFloat(worstTrade.toFixed(2)),
      },
      symbolDistribution,
      equityCurve,
      dailyPnL,
    };
  }

  // Return empty analytics structure
  private getEmptyAnalytics() {
    return {
      statistics: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalProfit: 0,
        avgWin: 0,
        avgLoss: 0,
        profitFactor: 0,
        bestTrade: 0,
        worstTrade: 0,
      },
      symbolDistribution: [],
      equityCurve: [],
      dailyPnL: [],
    };
  }

  /**
   * Real-time evaluation with current equity (for frontend price updates)
   */
  async evaluateRealTime(accountId: string, currentEquity: number) {
    return this.evaluationService.evaluateAccountRealTime(
      accountId,
      currentEquity,
    );
  }

  /**
   * Process price tick - event-driven evaluation (called when frontend receives price update)
   */
  async processPriceTick(
    accountId: string,
    symbol: string,
    bid: number,
    ask: number,
    timestamp: number,
  ) {
    return this.evaluationService.processPriceTick(
      accountId,
      symbol,
      bid,
      ask,
      timestamp,
    );
  }
}
