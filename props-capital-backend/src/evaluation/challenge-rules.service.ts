import { Injectable } from '@nestjs/common';

export interface RuleInputs {
  startingBalance: number;
  currentBalance: number;
  currentEquity: number; // balance + unrealizedPnL
  todayStartEquity: number;
  maxEquityToDate: number;
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
      challenge,
    } = inputs;

    // 1. Profit Target calculation
    // Profit % = (equity - startingBalance) / startingBalance * 100
    const profitPercent =
      startingBalance > 0
        ? ((currentEquity - startingBalance) / startingBalance) * 100
        : 0;

    // Profit progress (0-100) - clamp to prevent >100% display issues
    const profitProgress = Math.max(0, Math.min(100, profitPercent));

    // 2. Daily Loss calculation
    // Daily Loss % = (todayStartEquity - equity) / todayStartEquity * 100
    // Only calculated if equity < todayStartEquity (loss)
    const dailyLossPercent =
      todayStartEquity > 0 && currentEquity < todayStartEquity
        ? ((todayStartEquity - currentEquity) / todayStartEquity) * 100
        : 0;

    const dailyLossProgress = Math.min(
      100,
      (dailyLossPercent / challenge.dailyDrawdownPercent) * 100,
    );
    const dailyViolated = dailyLossPercent >= challenge.dailyDrawdownPercent;

    // 3. Overall Drawdown calculation
    // Drawdown % = (maxEquityToDate - equity) / maxEquityToDate * 100
    // Only calculated if equity < maxEquityToDate (drawdown from peak)
    const drawdownPercent =
      maxEquityToDate > 0 && currentEquity < maxEquityToDate
        ? ((maxEquityToDate - currentEquity) / maxEquityToDate) * 100
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

