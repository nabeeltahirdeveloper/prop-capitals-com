/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable no-irregular-whitespace */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
  Logger,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

import { PrismaService } from '../prisma/prisma.service';
import { MarketDataService } from '../market-data/market-data.service';
import { TradesService } from '../trades/trades.service';
import {
  ChallengeRulesService,
  RuleInputs,
  RuleOutputs,
} from './challenge-rules.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TradingEventsGateway } from '../websocket/trading-events.gateway';

import {
  TradingPhase,
  TradingAccountStatus,
  ViolationType,
  NotificationType,
  NotificationCategory,
} from '@prisma/client';

@Injectable()
export class EvaluationService {
  private readonly logger = new Logger(EvaluationService.name);

  // In-memory price cache: accountId -> symbol -> { bid, ask, timestamp }
  private priceCache: Map<
    string,
    Map<string, { bid: number; ask: number; timestamp: number }>
  > = new Map();

  // Track warnings sent today to avoid spamming: accountId -> { dailyWarningSent: boolean, overallWarningSent: boolean, lastWarningDate: string }
  private warningCache: Map<
    string,
    {
      dailyWarningSent: boolean;
      overallWarningSent: boolean;
      lastWarningDate: string;
    }
  > = new Map();

  // Track trading days milestones sent: accountId -> Set<number> (milestone days)
  private tradingDaysMilestones: Map<string, Set<number>> = new Map();

  constructor(
    private prisma: PrismaService,
    private marketDataService: MarketDataService,
    @Inject(forwardRef(() => TradesService))
    private tradesService: TradesService,
    private challengeRulesService: ChallengeRulesService,
    private notificationsService: NotificationsService,
    private tradingEventsGateway: TradingEventsGateway,
  ) {}

  /**
   * Clean stale prices from cache (older than 30 seconds)
   * This prevents using outdated prices for position evaluation
   */
  private cleanStalePrices(accountId: string, currentTimestamp: number): void {
    const accountPriceCache = this.priceCache.get(accountId);
    if (!accountPriceCache) return;

    const PRICE_EXPIRY_MS = 30000; // 30 seconds
    let cleanedCount = 0;

    for (const [symbol, priceData] of accountPriceCache.entries()) {
      if (currentTimestamp - priceData.timestamp > PRICE_EXPIRY_MS) {
        accountPriceCache.delete(symbol);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      this.logger.debug(
        `[Price Cache] Cleaned ${cleanedCount} stale prices for account ${accountId}`,
      );
    }
  }

  /**
   * Process price tick - event-driven evaluation
   * Called when frontend receives a price update
   */
  async processPriceTick(
    accountId: string,
    symbol: string,
    bid: number,
    ask: number,
    timestamp: number,
  ): Promise<{
    statusChanged: boolean;
    positionsClosed: number;
    accountStatus: string;
    violationType?: string;
    violationDailyDrawdown?: number;
    violationOverallDrawdown?: number;
    // ✅ Real-time metrics for frontend display
    equity?: number;
    dailyDrawdownPercent?: number;
    overallDrawdownPercent?: number;
    profitPercent?: number;
  }> {
    // Store price in cache and clean stale prices
    if (!this.priceCache.has(accountId)) {
      this.priceCache.set(accountId, new Map());
    }
    const accountPriceCache = this.priceCache.get(accountId)!;
    accountPriceCache.set(symbol, { bid, ask, timestamp });

    // Clean stale prices (older than 30 seconds)
    this.cleanStalePrices(accountId, timestamp);
    // Get account with open positions
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
      include: {
        challenge: true,
        trades: {
          where: { closePrice: null }, // Only open positions
        },
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!account) {
      throw new NotFoundException('Trading account not found');
    }

    // Skip if already locked/disqualified
    const drawdownViolated = (account as any).drawdownViolated ?? false;
    const dailyLossViolated = (account as any).dailyLossViolated ?? false;

    if (
      drawdownViolated ||
      account.status === ('DISQUALIFIED' as TradingAccountStatus)
    ) {
      const positionsClosed =
        account.trades.length > 0
          ? await this.autoCloseAllPositionsWithPrices(
              accountId,
              account.trades,
              accountPriceCache,
              'Max Drawdown Violated',
            )
          : 0;
      return {
        statusChanged: false,
        positionsClosed,
        accountStatus: 'DISQUALIFIED',
      };
    }

    if (
      dailyLossViolated ||
      account.status === ('DAILY_LOCKED' as TradingAccountStatus)
    ) {
      const positionsClosed =
        account.trades.length > 0
          ? await this.autoCloseAllPositionsWithPrices(
              accountId,
              account.trades,
              accountPriceCache,
              'Daily Loss Limit Violated',
            )
          : 0;
      return {
        statusChanged: false,
        positionsClosed,
        accountStatus: 'DAILY_LOCKED',
      };
    }

    // Calculate unrealized PnL for all open positions using cached prices
    let totalUnrealizedPnL = 0;
    const { challenge } = account;
    const initialBalance = account.initialBalance || challenge.accountSize;
    for (const trade of account.trades) {
      const tradePrice = accountPriceCache.get(trade.symbol);
      if (!tradePrice) continue; // Skip if we don't have price for this symbol yet

      // Use correct price side: BID for BUY (selling to close), ASK for SELL (buying to close)
      const currentPrice =
        trade.type === 'BUY' ? tradePrice.bid : tradePrice.ask;

      // Calculate PnL using correct contract sizes per instrument
      const isCrypto = /BTC|ETH|SOL|XRP|ADA|DOGE|BNB|AVAX|DOT|LINK/.test(
        trade.symbol,
      );
      const isXAU = /XAU/i.test(trade.symbol);
      const isXAG = /XAG/i.test(trade.symbol);
      const contractSize = isXAU ? 100 : isXAG ? 5000 : isCrypto ? 1 : 100000;
      const priceDiff =
        trade.type === 'BUY'
          ? currentPrice - trade.openPrice
          : trade.openPrice - currentPrice;
      const positionPnL = priceDiff * trade.volume * contractSize;

      totalUnrealizedPnL += positionPnL;
    }
    // Calculate equity = balance + unrealized PnL
    const balance = account.balance ?? initialBalance;
    const equity = balance + totalUnrealizedPnL;

    // Use stored tracking values
    // CRITICAL: Fallback to initialBalance (not equity) for todayStartEquity and minEquityToday
    // Using current equity as fallback is WRONG because it already includes losses,
    // which would make drawdown calculations start from the wrong base
    const todayStartEquity =
      (account as any).todayStartEquity ?? initialBalance;
    let maxEquityToDate = (account as any).maxEquityToDate ?? initialBalance;
    let minEquityToday = (account as any).minEquityToday ?? initialBalance;
    let minEquityOverall = (account as any).minEquityOverall ?? initialBalance;

    // Check if we need to reset daily metrics (new day)
    const today = new Date().toISOString().substring(0, 10);
    const lastReset = (account as any).lastDailyReset;
    const lastResetDate = lastReset
      ? new Date(lastReset).toISOString().substring(0, 10)
      : null;
    let dailyReset = false;

    if (lastResetDate !== today) {
      // New day - reset daily metrics
      minEquityToday = equity;
      dailyReset = true;
      this.logger.debug(
        `[processPriceTick] Reset daily metrics for new day. minEquityToday=${equity}`,
      );
    }

    // Track what changed so we can do a SINGLE atomic DB write
    let maxEquityChanged = false;
    let minTodayChanged = false;
    let minOverallChanged = false;

    // CRITICAL: Update maxEquityToDate if current equity is higher (industry standard)
    if (equity > maxEquityToDate) {
      maxEquityToDate = equity;
      maxEquityChanged = true;
    }

    // CRITICAL: Update minEquityToday if current equity is lower (tracks worst point today)
    if (equity < minEquityToday) {
      minEquityToday = equity;
      minTodayChanged = true;
    }

    // CRITICAL: Update minEquityOverall if current equity is lower (tracks worst point ever)
    if (equity < minEquityOverall) {
      minEquityOverall = equity;
      minOverallChanged = true;
    }

    // SINGLE ATOMIC DB WRITE - ALWAYS update equity + any changed tracking fields
    // Equity must always be written so the DB reflects the latest known equity
    // This ensures page reloads and account syncs show current values
    const updateData: any = { equity };
    if (dailyReset) {
      updateData.minEquityToday = minEquityToday;
      updateData.lastDailyReset = new Date();
    }
    if (maxEquityChanged) updateData.maxEquityToDate = maxEquityToDate;
    if (minTodayChanged) updateData.minEquityToday = minEquityToday;
    if (minOverallChanged) updateData.minEquityOverall = minEquityOverall;

    await this.prisma.tradingAccount.update({
      where: { id: accountId },
      data: updateData,
    });

    // Note: account.trades already filtered to only open trades (closePrice: null) in the query above
    const openTrades = account.trades;

    // Evaluate rules immediately
    const ruleInputs: RuleInputs = {
      startingBalance: initialBalance,
      currentBalance: balance,
      currentEquity: equity,
      todayStartEquity,
      maxEquityToDate,
      minEquityToday,
      minEquityOverall,
      challenge: {
        dailyDrawdownPercent: challenge.dailyDrawdownPercent,
        overallDrawdownPercent: challenge.overallDrawdownPercent,
        phase1TargetPercent: challenge.phase1TargetPercent,
        phase2TargetPercent: challenge.phase2TargetPercent,
      },
    };

    const ruleOutputs = this.challengeRulesService.calculateRules(ruleInputs);

    // Check for drawdown warnings (80% threshold) - only if not already violated
    // Note: 'today' variable already declared above
    const warningCacheKey = accountId;
    let warningCache = this.warningCache.get(warningCacheKey);

    // Reset warning cache if it's a new day
    if (!warningCache || warningCache.lastWarningDate !== today) {
      warningCache = {
        dailyWarningSent: false,
        overallWarningSent: false,
        lastWarningDate: today,
      };
      this.warningCache.set(warningCacheKey, warningCache);
    }

    // Daily drawdown warning (80% of limit, e.g., 4% when limit is 5%)
    if (
      account.status === TradingAccountStatus.ACTIVE &&
      !dailyLossViolated &&
      !ruleOutputs.dailyViolated &&
      ruleOutputs.dailyLossPercent > 0 &&
      ruleOutputs.dailyLossPercent >= challenge.dailyDrawdownPercent * 0.8 &&
      !warningCache.dailyWarningSent
    ) {
      if (account.userId) {
        await this.notificationsService.create(
          account.userId,
          'Drawdown Warning',
          `Your daily drawdown has reached ${ruleOutputs.dailyLossPercent.toFixed(2)}% on account #${account.brokerLogin || accountId.substring(0, 8)}. Maximum allowed is ${challenge.dailyDrawdownPercent}%. Please manage your risk carefully.`,
          NotificationType.WARNING,
          NotificationCategory.ACCOUNT,
        );
        warningCache.dailyWarningSent = true;
      }
    }

    // Overall drawdown warning (80% of limit, e.g., 8% when limit is 10%)
    if (
      account.status === TradingAccountStatus.ACTIVE &&
      !drawdownViolated &&
      !ruleOutputs.drawdownViolated &&
      ruleOutputs.drawdownPercent > 0 &&
      ruleOutputs.drawdownPercent >= challenge.overallDrawdownPercent * 0.8 &&
      !warningCache.overallWarningSent
    ) {
      if (account.userId) {
        await this.notificationsService.create(
          account.userId,
          'Drawdown Warning',
          `Your overall drawdown has reached ${ruleOutputs.drawdownPercent.toFixed(2)}% on account #${account.brokerLogin || accountId.substring(0, 8)}. Maximum allowed is ${challenge.overallDrawdownPercent}%. Please manage your risk carefully.`,
          NotificationType.WARNING,
          NotificationCategory.ACCOUNT,
        );
        warningCache.overallWarningSent = true;
      }
    }

    // Check violations and auto-close if needed
    let statusChanged = false;
    let positionsClosed = 0;
    let violationType: string | undefined;
    let violationDailyDrawdown: number | undefined;
    let violationOverallDrawdown: number | undefined;

    if (account.status === TradingAccountStatus.ACTIVE) {
      if (ruleOutputs.dailyViolated && !dailyLossViolated) {
        // Store violation drawdown values BEFORE closing positions
        violationDailyDrawdown = ruleOutputs.dailyLossPercent;
        violationOverallDrawdown = ruleOutputs.drawdownPercent;

        this.logger.log(
          `[processPriceTick] ðŸš¨ Daily violation detected! dailyLossPercent=${ruleOutputs.dailyLossPercent.toFixed(2)}%, drawdownPercent=${ruleOutputs.drawdownPercent.toFixed(2)}%, openTrades=${openTrades.length}`,
        );

        // CRITICAL: Capture breach snapshot BEFORE auto-closing positions
        // This ensures we capture the worst moment even if price rebounds during close
        if (openTrades.length > 0) {
          this.logger.log(
            `[processPriceTick] ðŸ“¸ Capturing breach snapshot for ${openTrades.length} trades before auto-close...`,
          );
          await this.captureBreachSnapshot(
            accountId,
            openTrades,
            accountPriceCache,
            'DAILY_LOSS',
            equity,
            ruleOutputs.dailyLossPercent,
            ruleOutputs.drawdownPercent,
            todayStartEquity,
            maxEquityToDate,
          );
          this.logger.log(
            `[processPriceTick] âœ… Breach snapshot captured, now closing positions...`,
          );
        } else {
          this.logger.warn(
            `[processPriceTick] âš ï¸ Daily violation detected but no open trades to capture snapshot for!`,
          );
        }

        // Daily violation - auto-close with prices from cache
        positionsClosed = await this.autoCloseAllPositionsWithPrices(
          accountId,
          openTrades,
          accountPriceCache,
          'Daily Loss Limit Violated',
        );

        const nextMidnight = new Date();
        nextMidnight.setDate(nextMidnight.getDate() + 1);
        nextMidnight.setHours(0, 0, 0, 0);

        await this.recordViolationAndLock(
          accountId,
          ViolationType.DAILY_DRAWDOWN,
          `Daily drawdown exceeded: ${ruleOutputs.dailyLossPercent.toFixed(2)}% > ${challenge.dailyDrawdownPercent}%`,
          'DAILY_LOCKED' as TradingAccountStatus,
          nextMidnight,
          true, // dailyLossViolated
          false, // drawdownViolated
        );

        // Create notification for daily drawdown violation
        if (account.userId) {
          await this.notificationsService.create(
            account.userId,
            'Account Violation',
            `Your daily drawdown has reached ${ruleOutputs.dailyLossPercent.toFixed(2)}% on account #${account.brokerLogin || accountId.substring(0, 8)}. Maximum allowed is ${challenge.dailyDrawdownPercent}%. Trading is locked until tomorrow.`,
            NotificationType.ERROR,
            NotificationCategory.ACCOUNT,
          );
        }

        statusChanged = true;
        violationType = 'DAILY_LOCKED';
      } else if (ruleOutputs.drawdownViolated && !drawdownViolated) {
        // Store violation drawdown values BEFORE closing positions
        violationDailyDrawdown = ruleOutputs.dailyLossPercent;
        violationOverallDrawdown = ruleOutputs.drawdownPercent;

        this.logger.log(
          `[processPriceTick] ðŸš¨ Overall drawdown violation detected! drawdownPercent=${ruleOutputs.drawdownPercent.toFixed(2)}%, dailyLossPercent=${ruleOutputs.dailyLossPercent.toFixed(2)}%, openTrades=${openTrades.length}`,
        );

        // CRITICAL: Capture breach snapshot BEFORE auto-closing positions
        // This ensures we capture the worst moment even if price rebounds during close
        if (openTrades.length > 0) {
          this.logger.log(
            `[processPriceTick] ðŸ“¸ Capturing breach snapshot for ${openTrades.length} trades before auto-close...`,
          );
          await this.captureBreachSnapshot(
            accountId,
            openTrades,
            accountPriceCache,
            'OVERALL_DD',
            equity,
            ruleOutputs.dailyLossPercent,
            ruleOutputs.drawdownPercent,
            todayStartEquity,
            maxEquityToDate,
          );
          this.logger.log(
            `[processPriceTick] âœ… Breach snapshot captured, now closing positions...`,
          );
        } else {
          this.logger.warn(
            `[processPriceTick] âš ï¸ Overall drawdown violation detected but no open trades to capture snapshot for!`,
          );
        }

        // Overall drawdown violation - auto-close with prices from cache
        positionsClosed = await this.autoCloseAllPositionsWithPrices(
          accountId,
          openTrades,
          accountPriceCache,
          'Max Drawdown Violated',
        );

        await this.recordViolationAndLock(
          accountId,
          ViolationType.OVERALL_DRAWDOWN,
          `Overall drawdown exceeded: ${ruleOutputs.drawdownPercent.toFixed(2)}% > ${challenge.overallDrawdownPercent}%`,
          'DISQUALIFIED' as TradingAccountStatus,
          null,
          false, // dailyLossViolated
          true, // drawdownViolated
        );

        // Create notification for overall drawdown violation
        if (account.userId) {
          await this.notificationsService.create(
            account.userId,
            'Account Violation',
            `Your overall drawdown has reached ${ruleOutputs.drawdownPercent.toFixed(2)}% on account #${account.brokerLogin || accountId.substring(0, 8)}. Maximum allowed is ${challenge.overallDrawdownPercent}%. Challenge disqualified.`,
            NotificationType.ERROR,
            NotificationCategory.ACCOUNT,
          );
        }

        statusChanged = true;
        violationType = 'DISQUALIFIED';
      }
    }

    // Phase progression from PEAK profit should also work on live ticks.
    // This allows maxEquityToDate reached intra-trade to count immediately.
    if (
      account.status === TradingAccountStatus.ACTIVE &&
      !statusChanged &&
      maxEquityChanged
    ) {
      const tradingDaysTrades = await this.prisma.trade.findMany({
        where: { tradingAccountId: accountId },
        select: { openedAt: true },
      });
      const tradingDaysCompleted = new Set(
        tradingDaysTrades
          .filter((t) => t.openedAt)
          .map((t) => t.openedAt.toISOString().substring(0, 10)),
      ).size;

      if (
        account.phase === TradingPhase.PHASE1 &&
        ruleOutputs.profitPercent >= challenge.phase1TargetPercent &&
        tradingDaysCompleted >= challenge.minTradingDays
      ) {
        await this.prisma.tradingAccount.update({
          where: { id: accountId },
          data: { phase: TradingPhase.PHASE2 },
        });

        await this.prisma.phaseTransition.create({
          data: {
            tradingAccountId: accountId,
            fromPhase: TradingPhase.PHASE1,
            toPhase: TradingPhase.PHASE2,
          },
        });

        if (account.userId) {
          await this.notificationsService.create(
            account.userId,
            'Phase 1 Completed!',
            `Congratulations! You have successfully completed Phase 1 of your $${challenge.accountSize.toLocaleString()} challenge. Proceed to Phase 2 to continue.`,
            NotificationType.SUCCESS,
            NotificationCategory.CHALLENGE,
          );
        }
      } else if (
        account.phase === TradingPhase.PHASE2 &&
        ruleOutputs.profitPercent >= challenge.phase2TargetPercent &&
        tradingDaysCompleted >= challenge.minTradingDays
      ) {
        await this.prisma.tradingAccount.update({
          where: { id: accountId },
          data: { phase: TradingPhase.FUNDED },
        });

        await this.prisma.phaseTransition.create({
          data: {
            tradingAccountId: accountId,
            fromPhase: TradingPhase.PHASE2,
            toPhase: TradingPhase.FUNDED,
          },
        });

        if (account.userId) {
          await this.notificationsService.create(
            account.userId,
            'Phase 2 Completed!',
            `Congratulations! You have successfully completed Phase 2 of your $${challenge.accountSize.toLocaleString()} challenge. Your account is now funded!`,
            NotificationType.SUCCESS,
            NotificationCategory.CHALLENGE,
          );
        }
      }
    }

    // Get updated account status
    const updatedAccount = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
      select: { status: true },
    });

    return {
      statusChanged,
      positionsClosed,
      accountStatus: updatedAccount?.status || account.status,
      violationType,
      violationDailyDrawdown,
      violationOverallDrawdown,
      // ✅ Return real-time metrics for frontend display
      equity,
      dailyDrawdownPercent: ruleOutputs.dailyLossPercent,
      overallDrawdownPercent: ruleOutputs.drawdownPercent,
      profitPercent: ruleOutputs.profitPercent,
    };
  }

  /**
   * Capture breach snapshot for all open positions BEFORE auto-closing
   * This ensures we preserve the worst moment even if price rebounds during close
   */
  private async captureBreachSnapshot(
    accountId: string,
    openTrades: Array<{
      id: string;
      symbol: string;
      type: string;
      openPrice: number;
      volume: number;
    }>,
    priceCache: Map<string, { bid: number; ask: number; timestamp: number }>,
    breachType: 'DAILY_LOSS' | 'OVERALL_DD',
    breachEquity: number,
    breachDrawdownPercentDaily: number,
    breachDrawdownPercentOverall: number,
    _todayStartEquity: number,
    _maxEquityToDate: number,
  ): Promise<void> {
    if (openTrades.length === 0) {
      return;
    }

    this.logger.log(
      `[Breach Snapshot] Capturing breach snapshot for ${openTrades.length} positions (${breachType})`,
    );

    const breachAt = new Date();

    // Capture breach snapshot for each open position
    await Promise.all(
      openTrades.map(async (trade) => {
        try {
          let tradePrice = priceCache.get(trade.symbol);
          if (!tradePrice) {
            this.logger.warn(
              `[Breach Snapshot] No price cache for ${trade.symbol}, using open price as fallback`,
            );
            // Fallback: use open price (not ideal but better than nothing)
            tradePrice = {
              bid: trade.openPrice,
              ask: trade.openPrice,
              timestamp: Date.now(),
            };
          }

          // Use correct price side: BID for BUY, ASK for SELL
          const breachPrice =
            trade.type === 'BUY' ? tradePrice.bid : tradePrice.ask;

          // Calculate unrealized PnL at breach moment using correct contract sizes
          const isCrypto = /BTC|ETH|SOL|XRP|ADA|DOGE|BNB|AVAX|DOT|LINK/.test(
            trade.symbol,
          );
          const isXAU = /XAU/i.test(trade.symbol);
          const isXAG = /XAG/i.test(trade.symbol);
          const contractSize = isXAU
            ? 100
            : isXAG
              ? 5000
              : isCrypto
                ? 1
                : 100000;
          const priceDiff =
            trade.type === 'BUY'
              ? breachPrice - trade.openPrice
              : trade.openPrice - breachPrice;
          const breachUnrealizedPnl = priceDiff * trade.volume * contractSize;

          // Update trade with breach snapshot
          await this.prisma.trade.update({
            where: { id: trade.id },
            data: {
              breachTriggered: true,
              breachType: breachType,
              breachAt: breachAt,
              breachEquity: breachEquity,
              breachUnrealizedPnl: breachUnrealizedPnl,
              breachPrice: breachPrice,
              breachDrawdownPercentDaily: breachDrawdownPercentDaily,
              breachDrawdownPercentOverall: breachDrawdownPercentOverall,
              closeReason: 'RISK_AUTO_CLOSE',
            } as any,
          });

          this.logger.debug(
            `[Breach Snapshot] Captured snapshot for trade ${trade.id}: PnL=${breachUnrealizedPnl.toFixed(2)}, DD Daily=${breachDrawdownPercentDaily.toFixed(2)}%, DD Overall=${breachDrawdownPercentOverall.toFixed(2)}%`,
          );
        } catch (error) {
          this.logger.error(
            `[Breach Snapshot] Failed to capture snapshot for trade ${trade.id}:`,
            error,
          );
        }
      }),
    );

    this.logger.log(
      `[Breach Snapshot] Completed capturing breach snapshots for ${openTrades.length} positions`,
    );
  }

  /**
   * Auto-close positions using prices from cache (no need to fetch from market data)
   */
  private async autoCloseAllPositionsWithPrices(
    accountId: string,
    openTrades: Array<{
      id: string;
      symbol: string;
      type: string;
      openPrice: number;
      volume: number;
    }>,
    priceCache: Map<string, { bid: number; ask: number; timestamp: number }>,
    reason: string,
  ): Promise<number> {
    if (openTrades.length === 0) {
      return 0;
    }

    this.logger.log(
      `[Price-Tick Auto-Close] Closing ${openTrades.length} positions immediately due to: ${reason}`,
    );

    let closedCount = 0;

    // Close all positions in PARALLEL for maximum speed
    await Promise.all(
      openTrades.map(async (trade) => {
        try {
          let tradePrice = priceCache.get(trade.symbol);
          if (!tradePrice) {
            this.logger.warn(
              `[Price-Tick Auto-Close] No price cache for ${trade.symbol}, fetching from market`,
            );
            // Fallback: fetch from market data service
            const priceData = await this.marketDataService.getCurrentPrice(
              trade.symbol,
            );
            tradePrice = {
              bid: priceData.bid,
              ask: priceData.ask,
              timestamp: Date.now(),
            };
          }

          // Use correct price side: BID for BUY, ASK for SELL
          const closePrice =
            trade.type === 'BUY' ? tradePrice.bid : tradePrice.ask;

          // Calculate PnL using correct contract sizes per instrument
          const isCrypto = /BTC|ETH|SOL|XRP|ADA|DOGE|BNB|AVAX|DOT|LINK/.test(
            trade.symbol,
          );
          const isXAU = /XAU/i.test(trade.symbol);
          const isXAG = /XAG/i.test(trade.symbol);
          const contractSize = isXAU
            ? 100
            : isXAG
              ? 5000
              : isCrypto
                ? 1
                : 100000;
          const priceDiff =
            trade.type === 'BUY'
              ? closePrice - trade.openPrice
              : trade.openPrice - closePrice;
          const profit = priceDiff * trade.volume * contractSize;

          // Update trade with close price and realized profit
          // NOTE: Breach snapshot was already captured before auto-close, so we preserve it
          // CRITICAL: Check if breach snapshot exists before closing
          const existingTrade = await this.prisma.trade.findUnique({
            where: { id: trade.id },
            select: { breachTriggered: true, closeReason: true },
          });

          if (!existingTrade?.breachTriggered) {
            this.logger.warn(
              `[Price-Tick Auto-Close] Trade ${trade.id} is being closed but breach snapshot was not captured! This should not happen.`,
            );
          }

          await this.tradesService.updateTrade(trade.id, {
            closePrice,
            profit,
            closedAt: new Date(),
            // Only set closeReason if breach snapshot didn't already set it
            closeReason: existingTrade?.closeReason || 'RISK_AUTO_CLOSE',
          });

          closedCount++;
          this.logger.debug(
            `[Price-Tick Auto-Close] Successfully closed trade ${trade.id} (${trade.symbol})`,
          );
        } catch (error) {
          this.logger.error(
            `[Price-Tick Auto-Close] Failed to close trade ${trade.id}:`,
            error,
          );
        }
      }),
    );

    // CRITICAL: After all trades are closed, update maxEquityToDate based on final balance
    // This ensures overall drawdown is calculated correctly from peak equity
    try {
      const finalAccount = await this.prisma.tradingAccount.findUnique({
        where: { id: accountId },
        select: {
          balance: true,
          equity: true,
          maxEquityToDate: true,
          initialBalance: true,
        },
      });

      if (finalAccount) {
        const finalEquity =
          finalAccount.equity ??
          finalAccount.balance ??
          finalAccount.initialBalance ??
          0;
        const currentMaxEquity =
          (finalAccount as any).maxEquityToDate ??
          finalAccount.initialBalance ??
          0;

        if (finalEquity > currentMaxEquity) {
          await this.prisma.tradingAccount.update({
            where: { id: accountId },
            data: { maxEquityToDate: finalEquity } as any,
          });
          this.logger.debug(
            `[Price-Tick Auto-Close] Updated maxEquityToDate to ${finalEquity} after closing all positions`,
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `[Price-Tick Auto-Close] Failed to update maxEquityToDate after closing positions:`,
        error,
      );
    }

    this.logger.log(
      `[Price-Tick Auto-Close] Completed closing ${closedCount} positions`,
    );
    return closedCount;
  }

  /**
   * Called after each trade to:
   * - snapshot equity
   * - compute daily & overall drawdown
   * - compute profit %
   * - check rule violations
   * - check phase progression
   * - auto-close positions if violations detected
   */
  async evaluateAccountAfterTrade(accountId: string) {
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
      include: {
        challenge: true,
        trades: true,
        equityShots: true,
        violations: true,
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!account) throw new NotFoundException('Trading account not found');

    const { challenge } = account;
    const initialBalance = account.initialBalance || challenge.accountSize;
    const balance = account.balance ?? initialBalance;
    const equity = account.equity ?? balance;

    // Check if we need to reset daily metrics (new day)
    const today = new Date().toISOString().substring(0, 10);
    const lastReset = (account as any).lastDailyReset;
    const lastResetDate = lastReset
      ? new Date(lastReset).toISOString().substring(0, 10)
      : null;

    // ✅ Initialize or reset daily metrics
    let todayStartEquity = (account as any).todayStartEquity;
    let minEquityToday = (account as any).minEquityToday ?? equity;

    // Only reset on NEW DAY, not when todayStartEquity is missing
    const isNewDay = lastResetDate !== today;

    if (isNewDay) {
      // New day - reset daily metrics
      todayStartEquity = equity;
      minEquityToday = equity;
      await this.prisma.tradingAccount.update({
        where: { id: accountId },
        data: {
          todayStartEquity: equity,
          minEquityToday: equity,
          lastDailyReset: new Date(),
        } as any,
      });
      this.logger.debug(
        `[evaluateAccountAfterTrade] New day detected - reset daily metrics. todayStartEquity=${equity}, minEquityToday=${equity}`,
      );
    } else if (!todayStartEquity) {
      // First trade of the day - initialize todayStartEquity but preserve minEquityToday
      todayStartEquity = equity;
      await this.prisma.tradingAccount.update({
        where: { id: accountId },
        data: {
          todayStartEquity: equity,
        } as any,
      });
      this.logger.debug(
        `[evaluateAccountAfterTrade] Initialized todayStartEquity=${equity}, preserving minEquityToday=${minEquityToday}`,
      );
    }

    let maxEquityToDate = (account as any).maxEquityToDate ?? initialBalance;
    let minEquityOverall = (account as any).minEquityOverall ?? initialBalance;

    if (equity > maxEquityToDate) {
      maxEquityToDate = equity;
      await this.prisma.tradingAccount.update({
        where: { id: accountId },
        data: { maxEquityToDate: equity } as any,
      });
    }

    // Update minEquityToday if current equity is lower
    if (equity < minEquityToday) {
      minEquityToday = equity;
      await this.prisma.tradingAccount.update({
        where: { id: accountId },
        data: { minEquityToday: equity } as any,
      });
      this.logger.debug(
        `[evaluateAccountAfterTrade] Updated minEquityToday to ${equity}`,
      );
    }

    // Update minEquityOverall if current equity is lower
    if (equity < minEquityOverall) {
      minEquityOverall = equity;
      await this.prisma.tradingAccount.update({
        where: { id: accountId },
        data: { minEquityOverall: equity } as any,
      });
      this.logger.debug(
        `[evaluateAccountAfterTrade] Updated minEquityOverall to ${equity}`,
      );
    }

    //  Snapshot equity for today
    await this.prisma.equitySnapshot.create({
      data: {
        tradingAccountId: account.id,
        equity,
        balance,
      },
    });

    // Use ChallengeRulesService for calculations
    const ruleInputs: RuleInputs = {
      startingBalance: initialBalance,
      currentBalance: balance,
      currentEquity: equity,
      todayStartEquity: todayStartEquity || equity,
      maxEquityToDate: maxEquityToDate,
      minEquityToday: minEquityToday,
      minEquityOverall: minEquityOverall,
      challenge: {
        dailyDrawdownPercent: challenge.dailyDrawdownPercent,
        overallDrawdownPercent: challenge.overallDrawdownPercent,
        phase1TargetPercent: challenge.phase1TargetPercent,
        phase2TargetPercent: challenge.phase2TargetPercent,
      },
    };

    const ruleOutputs = this.challengeRulesService.calculateRules(ruleInputs);

    // Check violation flags first - if already violated, skip evaluation
    const drawdownViolatedFlag = (account as any).drawdownViolated ?? false;
    const dailyLossViolatedFlag = (account as any).dailyLossViolated ?? false;

    // Check violations and auto-close if needed
    if (account.status === TradingAccountStatus.ACTIVE) {
      // Check daily violation first (higher priority for detection)
      if (ruleOutputs.dailyViolated && !dailyLossViolatedFlag) {
        // First time daily violation detected - auto-close all positions and lock account
        await this.autoCloseAllPositions(
          accountId,
          'Daily Loss Limit Violated',
        );

        // Set next midnight as dailyLockedUntil
        const nextMidnight = new Date();
        nextMidnight.setDate(nextMidnight.getDate() + 1);
        nextMidnight.setHours(0, 0, 0, 0);

        await this.recordViolationAndLock(
          accountId,
          ViolationType.DAILY_DRAWDOWN,
          `Daily drawdown exceeded: ${ruleOutputs.dailyLossPercent.toFixed(2)}% > ${challenge.dailyDrawdownPercent}%`,
          'DAILY_LOCKED' as TradingAccountStatus,
          nextMidnight,
          true, // dailyLossViolated
          false, // drawdownViolated (not set)
        );

        // Create notification for daily drawdown violation
        if (account.userId) {
          await this.notificationsService.create(
            account.userId,
            'Account Violation',
            `Your daily drawdown has reached ${ruleOutputs.dailyLossPercent.toFixed(2)}% on account #${account.brokerLogin || accountId.substring(0, 8)}. Maximum allowed is ${challenge.dailyDrawdownPercent}%. Trading is locked until tomorrow.`,
            NotificationType.ERROR,
            NotificationCategory.ACCOUNT,
          );
        }
      } else if (ruleOutputs.drawdownViolated && !drawdownViolatedFlag) {
        // First time overall drawdown violation detected - auto-close all positions and disqualify
        await this.autoCloseAllPositions(accountId, 'Max Drawdown Violated');

        await this.recordViolationAndLock(
          accountId,
          ViolationType.OVERALL_DRAWDOWN,
          `Overall drawdown exceeded: ${ruleOutputs.drawdownPercent.toFixed(2)}% > ${challenge.overallDrawdownPercent}%`,
          'DISQUALIFIED' as TradingAccountStatus,
          null,
          false, // dailyLossViolated (not set)
          true, // drawdownViolated
        );

        // Create notification for overall drawdown violation
        if (account.userId) {
          await this.notificationsService.create(
            account.userId,
            'Account Violation',
            `Your overall drawdown has reached ${ruleOutputs.drawdownPercent.toFixed(2)}% on account #${account.brokerLogin || accountId.substring(0, 8)}. Maximum allowed is ${challenge.overallDrawdownPercent}%. Challenge disqualified.`,
            NotificationType.ERROR,
            NotificationCategory.ACCOUNT,
          );
        }
      }
    }

    // Trading days (distinct trade dates)
    const tradingDaysCompleted = new Set(
      account.trades
        .filter((t) => t.openedAt)
        .map((t) => t.openedAt.toISOString().substring(0, 10)),
    ).size;

    // Check for trading days milestones
    if (account.userId && tradingDaysCompleted > 0) {
      let milestones = this.tradingDaysMilestones.get(accountId);
      if (!milestones) {
        milestones = new Set();
        this.tradingDaysMilestones.set(accountId, milestones);
      }

      // Check if minimum trading days requirement is met
      if (
        tradingDaysCompleted >= challenge.minTradingDays &&
        !milestones.has(challenge.minTradingDays)
      ) {
        await this.notificationsService.create(
          account.userId,
          'Trading Days Milestone',
          `You have completed ${tradingDaysCompleted} trading days on account #${account.brokerLogin || accountId.substring(0, 8)}. Minimum trading days requirement met!`,
          NotificationType.INFO,
          NotificationCategory.CHALLENGE,
        );
        milestones.add(challenge.minTradingDays);
      }

      // Check for other milestone days (5, 10, 15, 20, 25, 30)
      const milestoneDays = [5, 10, 15, 20, 25, 30];
      for (const milestoneDay of milestoneDays) {
        if (
          tradingDaysCompleted >= milestoneDay &&
          !milestones.has(milestoneDay)
        ) {
          await this.notificationsService.create(
            account.userId,
            'Trading Days Milestone',
            `You have completed ${tradingDaysCompleted} trading days on account #${account.brokerLogin || accountId.substring(0, 8)}. Keep up the great work!`,
            NotificationType.INFO,
            NotificationCategory.CHALLENGE,
          );
          milestones.add(milestoneDay);
        }
      }
    }

    // Phase progression
    const currentPhaseTarget =
      account.phase === TradingPhase.PHASE1
        ? challenge.phase1TargetPercent
        : challenge.phase2TargetPercent;

    const phasePassed = ruleOutputs.profitPercent >= currentPhaseTarget;

    if (
      phasePassed &&
      account.status === TradingAccountStatus.ACTIVE &&
      account.phase === TradingPhase.PHASE1 &&
      tradingDaysCompleted >= challenge.minTradingDays
    ) {
      // Transition to Phase 2
      await this.prisma.tradingAccount.update({
        where: { id: accountId },
        data: { phase: TradingPhase.PHASE2 },
      });

      await this.prisma.phaseTransition.create({
        data: {
          tradingAccountId: accountId,
          fromPhase: TradingPhase.PHASE1,
          toPhase: TradingPhase.PHASE2,
        },
      });

      // Create notification for Phase 1 completion
      if (account.userId) {
        await this.notificationsService.create(
          account.userId,
          'Phase 1 Completed!',
          `Congratulations! You have successfully completed Phase 1 of your $${challenge.accountSize.toLocaleString()} challenge. Proceed to Phase 2 to continue.`,
          NotificationType.SUCCESS,
          NotificationCategory.CHALLENGE,
        );
      }
    }

    // Check for Phase 2 completion (transition to FUNDED)
    if (
      account.phase === TradingPhase.PHASE2 &&
      account.status === TradingAccountStatus.ACTIVE &&
      ruleOutputs.profitPercent >= challenge.phase2TargetPercent &&
      tradingDaysCompleted >= challenge.minTradingDays
    ) {
      // Transition to FUNDED
      await this.prisma.tradingAccount.update({
        where: { id: accountId },
        data: { phase: TradingPhase.FUNDED },
      });

      await this.prisma.phaseTransition.create({
        data: {
          tradingAccountId: accountId,
          fromPhase: TradingPhase.PHASE2,
          toPhase: TradingPhase.FUNDED,
        },
      });

      // Create notification for Phase 2 completion (FUNDED)
      if (account.userId) {
        await this.notificationsService.create(
          account.userId,
          'Phase 2 Completed!',
          `Congratulations! You have successfully completed Phase 2 of your $${challenge.accountSize.toLocaleString()} challenge. Your account is now funded!`,
          NotificationType.SUCCESS,
          NotificationCategory.CHALLENGE,
        );
      }
    }

    return ruleOutputs;
  }

  async evaluateAccountRealTime(
    accountId: string,
    currentEquity: number,
  ): Promise<RuleOutputs & { statusChanged: boolean }> {
    const account = await this.prisma.tradingAccount.findUnique({
      where: { id: accountId },
      include: {
        challenge: true,
        trades: {
          where: { closePrice: null }, // Only open positions
        },
      },
    });

    if (!account) throw new NotFoundException('Trading account not found');

    // Check violation flags first - if already violated, skip evaluation
    const drawdownViolated = (account as any).drawdownViolated ?? false;
    const dailyLossViolated = (account as any).dailyLossViolated ?? false;

    // If already disqualified, skip evaluation entirely
    if (
      drawdownViolated ||
      account.status === ('DISQUALIFIED' as TradingAccountStatus)
    ) {
      if (account.trades.length > 0) {
        await this.autoCloseAllPositions(accountId, 'Max Drawdown Violated');
      }
      // Return default outputs indicating violation
      return {
        profitPercent: 0,
        profitProgress: 0,
        dailyLossPercent: 0,
        dailyLossProgress: 100,
        dailyViolated: true,
        drawdownPercent: 0,
        drawdownProgress: 100,
        drawdownViolated: true,
        tradingAllowed: false,
        tradingBlockReason: 'DISQUALIFIED',
        statusChanged: false,
      };
    }

    // If already daily locked, skip evaluation
    if (
      dailyLossViolated ||
      account.status === ('DAILY_LOCKED' as TradingAccountStatus)
    ) {
      if (account.trades.length > 0) {
        await this.autoCloseAllPositions(
          accountId,
          'Daily Loss Limit Violated',
        );
      }
      // Return default outputs indicating daily violation
      return {
        profitPercent: 0,
        profitProgress: 0,
        dailyLossPercent: 0,
        dailyLossProgress: 100,
        dailyViolated: true,
        drawdownPercent: 0,
        drawdownProgress: 0,
        drawdownViolated: false,
        tradingAllowed: false,
        tradingBlockReason: 'DAILY_LOCKED',
        statusChanged: false,
      };
    }

    const { challenge } = account;
    const initialBalance = account.initialBalance || challenge.accountSize;
    const balance = account.balance ?? initialBalance;
    const equity = currentEquity;

    // Use stored tracking values or defaults
    const todayStartEquity = (account as any).todayStartEquity ?? equity;
    const maxEquityToDate = (account as any).maxEquityToDate ?? initialBalance;
    const minEquityToday = (account as any).minEquityToday ?? equity;
    const minEquityOverall =
      (account as any).minEquityOverall ?? initialBalance;

    // Calculate rules with current equity
    const ruleInputs: RuleInputs = {
      startingBalance: initialBalance,
      currentBalance: balance,
      currentEquity: equity,
      todayStartEquity,
      maxEquityToDate,
      minEquityToday,
      minEquityOverall,
      challenge: {
        dailyDrawdownPercent: challenge.dailyDrawdownPercent,
        overallDrawdownPercent: challenge.overallDrawdownPercent,
        phase1TargetPercent: challenge.phase1TargetPercent,
        phase2TargetPercent: challenge.phase2TargetPercent,
      },
    };

    const ruleOutputs = this.challengeRulesService.calculateRules(ruleInputs);

    // Check if violations detected and account is still ACTIVE
    let statusChanged = false;
    if (account.status === TradingAccountStatus.ACTIVE) {
      // Check daily violation first (higher priority for detection, but overall drawdown is more severe)
      if (ruleOutputs.dailyViolated && !dailyLossViolated) {
        // First time daily violation detected - auto-close all positions and lock account
        await this.autoCloseAllPositions(
          accountId,
          'Daily Loss Limit Violated',
        );

        const nextMidnight = new Date();
        nextMidnight.setDate(nextMidnight.getDate() + 1);
        nextMidnight.setHours(0, 0, 0, 0);

        await this.recordViolationAndLock(
          accountId,
          ViolationType.DAILY_DRAWDOWN,
          `Daily drawdown exceeded: ${ruleOutputs.dailyLossPercent.toFixed(2)}% > ${challenge.dailyDrawdownPercent}%`,
          'DAILY_LOCKED' as TradingAccountStatus,
          nextMidnight,
          true, // dailyLossViolated
          false, // drawdownViolated (not set)
        );
        statusChanged = true;

        // Return immediately - don't check drawdown after daily violation
        return {
          ...ruleOutputs,
          statusChanged,
        };
      }

      // Check overall drawdown violation
      if (ruleOutputs.drawdownViolated && !drawdownViolated) {
        // First time overall drawdown violation detected - auto-close all positions and disqualify
        await this.autoCloseAllPositions(accountId, 'Max Drawdown Violated');

        await this.recordViolationAndLock(
          accountId,
          ViolationType.OVERALL_DRAWDOWN,
          `Overall drawdown exceeded: ${ruleOutputs.drawdownPercent.toFixed(2)}% > ${challenge.overallDrawdownPercent}%`,
          'DISQUALIFIED' as TradingAccountStatus,
          null,
          false, // dailyLossViolated (not set)
          true, // drawdownViolated
        );
        statusChanged = true;
      }
    }

    return {
      ...ruleOutputs,
      statusChanged,
    };
  }

  /**
   * Auto-close all open positions for an account
   */
  private async autoCloseAllPositions(
    accountId: string,
    reason: string,
  ): Promise<void> {
    // Get all open trades (closePrice is null)
    const openTrades = await this.prisma.trade.findMany({
      where: {
        tradingAccountId: accountId,
        closePrice: null,
      },
    });

    if (openTrades.length === 0) {
      return; // No positions to close
    }

    this.logger.log(
      `[Auto-Close] Closing ${openTrades.length} positions immediately due to: ${reason}`,
    );

    // Close all positions in PARALLEL for maximum speed (within 0.1 seconds)
    // This ensures all positions are closed simultaneously, not sequentially
    await Promise.all(
      openTrades.map(async (trade) => {
        try {
          // Get current market price
          const priceData = await this.marketDataService.getCurrentPrice(
            trade.symbol,
          );
          // Use correct price side: BID for BUY (selling to close), ASK for SELL (buying to close)
          const closePrice =
            trade.type === 'BUY' ? priceData.bid : priceData.ask;

          // Calculate PnL using correct contract sizes per instrument
          const isCrypto = /BTC|ETH|SOL|XRP|ADA|DOGE|BNB|AVAX|DOT|LINK/.test(
            trade.symbol,
          );
          const isXAU = /XAU/i.test(trade.symbol);
          const isXAG = /XAG/i.test(trade.symbol);
          const contractSize = isXAU
            ? 100
            : isXAG
              ? 5000
              : isCrypto
                ? 1
                : 100000;
          const priceDiff =
            trade.type === 'BUY'
              ? closePrice - trade.openPrice
              : trade.openPrice - closePrice;
          const profit = priceDiff * trade.volume * contractSize;

          this.logger.debug(
            `[Backend PnL] ${trade.symbol} ${trade.type}: entry=${trade.openPrice}, close=${closePrice}, diff=${priceDiff}, vol=${trade.volume}, cs=${contractSize}, pnl=$${profit.toFixed(2)}`,
          );

          // Update trade via TradesService
          await this.tradesService.updateTrade(trade.id, {
            closePrice,
            profit,
            closedAt: new Date(),
          });

          this.logger.debug(
            `[Auto-Close] Successfully closed trade ${trade.id} (${trade.symbol})`,
          );
        } catch (error) {
          this.logger.error(
            `[Auto-Close] Failed to auto-close trade ${trade.id}:`,
            error,
          );
          // Fallback: force-close at openPrice to guarantee risk lock consistency
          try {
            await this.tradesService.updateTrade(trade.id, {
              closePrice: trade.openPrice,
              profit: 0,
              closedAt: new Date(),
              closeReason: 'RISK_AUTO_CLOSE_FALLBACK',
            });
            this.logger.warn(
              `[Auto-Close] Fallback close applied for trade ${trade.id} (${trade.symbol}) at open price`,
            );
          } catch (fallbackError) {
            this.logger.error(
              `[Auto-Close] Fallback close also failed for trade ${trade.id}:`,
              fallbackError,
            );
          }
        }
      }),
    );

    this.logger.log(
      `[Auto-Close] Completed closing ${openTrades.length} positions`,
    );
  }

  /**
   * Record violation and update account status
   */
  private async recordViolationAndLock(
    accountId: string,
    type: ViolationType,
    message: string,
    status: TradingAccountStatus,
    dailyLockedUntil: Date | null,
    dailyLossViolated?: boolean,
    drawdownViolated?: boolean,
  ) {
    await this.prisma.violation.create({
      data: {
        tradingAccountId: accountId,
        type,
        message,
      },
    });

    const updateData: any = {
      status,
    };

    if (dailyLockedUntil) {
      updateData.dailyLockedUntil = dailyLockedUntil;
    }

    if (dailyLossViolated !== undefined) {
      updateData.dailyLossViolated = dailyLossViolated;
    }

    if (drawdownViolated !== undefined) {
      updateData.drawdownViolated = drawdownViolated;
    }

    await this.prisma.tradingAccount.update({
      where: { id: accountId },
      data: updateData,
    });
  }

  /**
   * Reset daily tracking at midnight (cron job)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyTracking() {
    this.logger.log('[Cron] Resetting daily tracking for all accounts');

    // Reset dailyLossViolated flag and unlock accounts that were daily locked
    await this.prisma.tradingAccount.updateMany({
      where: {
        dailyLossViolated: true,
        status: 'DAILY_LOCKED' as TradingAccountStatus,
      } as any,
      data: {
        dailyLossViolated: false,
        status: 'ACTIVE' as TradingAccountStatus,
        dailyLockedUntil: null,
      } as any,
    });

    // Update todayStartEquity, minEquityToday, and lastDailyReset for all active accounts
    // This ensures daily drawdown starts fresh each day
    const activeAccounts = await this.prisma.tradingAccount.findMany({
      where: {
        status: 'ACTIVE' as TradingAccountStatus,
      },
    });

    for (const account of activeAccounts) {
      const equity =
        account.equity ?? account.balance ?? account.initialBalance;
      await this.prisma.tradingAccount.update({
        where: { id: account.id },
        data: {
          todayStartEquity: equity, // Reset daily starting point
          minEquityToday: equity, // Reset daily minimum equity tracking
          lastDailyReset: new Date(), // Update timestamp
        } as any,
      });
    }

    this.logger.log(
      `[Cron] Reset daily tracking for ${activeAccounts.length} accounts (todayStartEquity, minEquityToday, lastDailyReset)`,
    );
  }
}
