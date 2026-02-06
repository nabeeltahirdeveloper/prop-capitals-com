import { Injectable } from '@nestjs/common';

export interface RuleInputs {
  startingBalance: number;
  currentBalance: number;
  currentEquity: number; // balance + unrealizedPnL
  todayStartEquity: number;
  maxEquityToDate: number;
  minEquityToday: number; // Lowest equity reached today (for max daily drawdown)
  minEquityOverall: number; // Lowest equity ever reached (for max overall drawdown)
  challenge: {
    dailyDrawdownPercent: number;
    overallDrawdownPercent: number;
    phase1TargetPercent?: number;
    phase2TargetPercent?: number;
  };
}

export interface RuleOutputs {
  profitPercent: number;
  profitProgress: number; // 0-100 for progress bar

  dailyLossPercent: number;
  dailyLossProgress: number; // 0-100
  dailyViolated: boolean;

  drawdownPercent: number;
  drawdownProgress: number; // 0-100
  drawdownViolated: boolean;

  tradingAllowed: boolean;
  tradingBlockReason?: 'DAILY_LOCKED' | 'DISQUALIFIED' | null;
}

@Injectable()
export class ChallengeRulesService {
  /**
   * Calculate all challenge rule metrics based on current account state
   * Single source of truth for rule calculations
   */
  calculateRules(inputs: RuleInputs): RuleOutputs {
    const {
      startingBalance,
      currentBalance,
      currentEquity,
      todayStartEquity,
      maxEquityToDate,
      minEquityToday,
      minEquityOverall,
      challenge,
    } = inputs;

    // 1. Profit Target calculation
    // ✅ Use maxEquityToDate for monotonic profit (MAXIMUM profit achieved, never decreases)
    // This is standard for trading challenges - profit tracks the peak achieved
    // Profit % = (maxEquity - startingBalance) / startingBalance * 100
    const profitPercent =
      startingBalance > 0
        ? ((maxEquityToDate - startingBalance) / startingBalance) * 100
        : 0;

    // Profit progress (0-100) - clamp to prevent >100% display issues
    const profitProgress = Math.max(0, Math.min(100, profitPercent));

    // 2. Daily Loss calculation (MAXIMUM drawdown for the day)
    // ✅ Use minEquityToday to track the worst point reached today
    // This ensures drawdown NEVER decreases during the day (monotonic)
    // Daily Loss % = (todayStartEquity - minEquityToday) / todayStartEquity * 100
    const dailyLossPercent =
      todayStartEquity > 0 && minEquityToday < todayStartEquity
        ? ((todayStartEquity - minEquityToday) / todayStartEquity) * 100
        : 0;

    const dailyLossProgress = Math.min(
      100,
      (dailyLossPercent / challenge.dailyDrawdownPercent) * 100,
    );
    const dailyViolated = dailyLossPercent >= challenge.dailyDrawdownPercent;

    // 3. Overall Drawdown calculation (MAXIMUM drawdown from peak)
    // ✅ Use minEquityOverall to track the worst point ever reached
    // This ensures overall drawdown NEVER decreases (monotonic)
    // Drawdown % = (maxEquityToDate - minEquityOverall) / maxEquityToDate * 100
    const drawdownPercent =
      maxEquityToDate > 0 && minEquityOverall < maxEquityToDate
        ? ((maxEquityToDate - minEquityOverall) / maxEquityToDate) * 100
        : 0;

    const drawdownProgress = Math.min(
      100,
      (drawdownPercent / challenge.overallDrawdownPercent) * 100,
    );
    const drawdownViolated =
      drawdownPercent >= challenge.overallDrawdownPercent;

    // 4. Trading allowed logic
    // Trading is blocked if daily loss or drawdown violated
    const tradingAllowed = !dailyViolated && !drawdownViolated;
    const tradingBlockReason = dailyViolated
      ? 'DAILY_LOCKED'
      : drawdownViolated
        ? 'DISQUALIFIED'
        : null;

    return {
      profitPercent,
      profitProgress,
      dailyLossPercent,
      dailyLossProgress,
      dailyViolated,
      drawdownPercent,
      drawdownProgress,
      drawdownViolated,
      tradingAllowed,
      tradingBlockReason,
    };
  }
}

