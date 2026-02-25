import type {
  TradeWithPnL,
  EquityInput,
  EquityResult,
  ComplianceInput,
  ComplianceResult,
  PriceData,
} from "./types";

/**
 * Generic symbol resolution — generates multiple candidate keys and
 * returns the first match from the prices dictionary.
 * Handles USDT/USD suffix, slash notation, and compact formats.
 */
export const resolvePriceGeneric = (
  symbol: string,
  prices: Record<string, PriceData>,
): PriceData | null => {
  if (!symbol || !prices) return null;
  const raw = String(symbol).trim();
  const upper = raw.toUpperCase();
  const compact = upper.replace(/[^A-Z0-9]/g, "");
  const compactUsd = compact.replace(/USDT$/, "USD");
  const compactUsdt = compact.endsWith("USD")
    ? compact.replace(/USD$/, "USDT")
    : compact;
  const slashFromCompact =
    compact.length === 6
      ? `${compact.slice(0, 3)}/${compact.slice(3)}`
      : null;
  const slashFromCompactUsd =
    compactUsd.length === 6
      ? `${compactUsd.slice(0, 3)}/${compactUsd.slice(3)}`
      : null;
  const slashFromCompactUsdt =
    compactUsdt.length === 7
      ? `${compactUsdt.slice(0, 3)}/${compactUsdt.slice(3)}`
      : null;
  const candidates = [
    raw,
    upper,
    compact,
    compactUsd,
    compactUsdt,
    slashFromCompact,
    slashFromCompactUsd,
    slashFromCompactUsdt,
    compact.endsWith("USDT") ? `${compact.slice(0, -4)}/USDT` : null,
    compact.endsWith("USDT") ? `${compact.slice(0, -4)}/USD` : null,
    compact.endsWith("USD") ? `${compact.slice(0, -3)}/USDT` : null,
    compact.endsWith("USD") ? `${compact.slice(0, -3)}USDT` : null,
    compact.endsWith("USDT") ? `${compact.slice(0, -4)}USD` : null,
  ].filter(Boolean) as string[];
  for (const key of candidates) {
    const pd = prices[key];
    if (pd && pd.bid !== undefined && pd.ask !== undefined) return pd;
  }
  return null;
};

/**
 * Sum of livePnL across all positions.
 */
export const computeTotalFloatingPnLShared = (
  positionsWithPnL: TradeWithPnL[],
): number => {
  return positionsWithPnL.reduce((sum, pos) => sum + pos.livePnL, 0);
};

/**
 * Computes equity-related values from balance, floating PnL, and margin.
 * Extracted from CommonTerminalWrapper lines 897-918.
 */
export const computeEquityShared = (input: EquityInput): EquityResult => {
  const {
    balance,
    totalFloatingPnL,
    totalReservedMargin,
    hasOpenPositions,
    baselineEquity,
    summaryEquity,
    challengeEquity,
  } = input;

  const availableBalance = Math.max(0, balance - totalReservedMargin);
  const activeEquity = balance + totalFloatingPnL;
  const equity = hasOpenPositions
    ? activeEquity
    : Number.isFinite(summaryEquity)
      ? summaryEquity!
      : challengeEquity ?? balance;
  const activeProfitPercent =
    hasOpenPositions && baselineEquity > 0
      ? ((activeEquity - baselineEquity) / baselineEquity) * 100
      : 0;
  const activeDrawdownPercent =
    hasOpenPositions && baselineEquity > 0
      ? Math.max(
          0,
          ((baselineEquity - activeEquity) / baselineEquity) * 100,
        )
      : 0;

  return {
    balance,
    availableBalance,
    activeEquity,
    equity,
    activeProfitPercent,
    activeDrawdownPercent,
  };
};

/**
 * Computes compliance bar values (profit target, daily loss, total drawdown)
 * with peak tracking. Extracted from CommonTerminalWrapper lines 948-1071.
 */
export const computeComplianceBarsShared = (
  input: ComplianceInput,
): ComplianceResult => {
  const {
    baseCompliance,
    rules,
    summaryMetrics,
    liveMetrics,
    activeProfitPercent,
    activeDrawdownPercent,
    hasTradeHistory,
  } = input;

  // Clone mutable peak values
  let profitBarPeak = input.profitBarPeak;
  let overallDrawdownBarPeak = input.overallDrawdownBarPeak;
  let dailyDrawdownBarPeak = { ...input.dailyDrawdownBarPeak };

  if (!baseCompliance) {
    return {
      compliance: baseCompliance,
      profitBarPeak,
      overallDrawdownBarPeak,
      dailyDrawdownBarPeak,
    };
  }

  const result = { ...baseCompliance };
  const target = rules.profitTarget;
  const dailyLimit = rules.maxDailyLoss;
  const overallLimit = rules.maxTotalDrawdown;

  const currentDate = new Date().toISOString().substring(0, 10);
  if (dailyDrawdownBarPeak.date !== currentDate) {
    dailyDrawdownBarPeak = {
      date: currentDate,
      value: Math.max(
        0,
        Number(summaryMetrics?.dailyDrawdownPercent) || 0,
      ),
    };
  }

  const profitSeed = Math.max(
    0,
    Number(summaryMetrics?.profitPercent) || 0,
  );
  const overallSeed = Math.max(
    0,
    Number(summaryMetrics?.overallDrawdownPercent) || 0,
  );
  const dailySeed = Math.max(
    0,
    Number(summaryMetrics?.dailyDrawdownPercent) || 0,
  );

  const profitCurrentRaw = Math.max(
    0,
    Number(
      liveMetrics?.profitPercent ?? summaryMetrics?.profitPercent,
    ) || 0,
    activeProfitPercent,
  );
  const dailyCurrentRaw = Math.max(
    0,
    Number(
      liveMetrics?.dailyDrawdownPercent ??
        summaryMetrics?.dailyDrawdownPercent,
    ) || 0,
    activeDrawdownPercent,
  );
  const overallCurrentRaw = Math.max(
    0,
    Number(
      liveMetrics?.overallDrawdownPercent ??
        summaryMetrics?.overallDrawdownPercent,
    ) || 0,
    activeDrawdownPercent,
  );

  // For brand-new accounts with no executed trades, metrics must stay at 0.
  if (!hasTradeHistory) {
    profitBarPeak = 0;
    overallDrawdownBarPeak = 0;
    dailyDrawdownBarPeak.value = 0;

    result.profitTarget = {
      ...result.profitTarget,
      current: 0,
      percentage: 0,
      status: "in-progress",
    };
    result.dailyLoss = {
      ...result.dailyLoss,
      current: 0,
      percentage: 0,
      status: "safe",
    };
    result.totalDrawdown = {
      ...result.totalDrawdown,
      current: 0,
      percentage: 0,
      status: "safe",
    };
    return {
      compliance: result,
      profitBarPeak,
      overallDrawdownBarPeak,
      dailyDrawdownBarPeak,
    };
  }

  profitBarPeak = Math.max(profitBarPeak, profitSeed, profitCurrentRaw);
  overallDrawdownBarPeak = Math.max(
    overallDrawdownBarPeak,
    overallSeed,
    overallCurrentRaw,
  );
  dailyDrawdownBarPeak.value = Math.max(
    dailyDrawdownBarPeak.value,
    dailySeed,
    dailyCurrentRaw,
  );

  const profitCurrent = profitBarPeak;
  result.profitTarget = {
    ...result.profitTarget,
    current: profitCurrent,
    percentage:
      target > 0 ? Math.min((profitCurrent / target) * 100, 100) : 0,
    status: profitCurrent >= target ? "passed" : "in-progress",
  };

  const dailyCurrent = dailyDrawdownBarPeak.value;
  const overallCurrent = overallDrawdownBarPeak;
  result.dailyLoss = {
    ...result.dailyLoss,
    current: dailyCurrent,
    percentage: dailyLimit > 0 ? (dailyCurrent / dailyLimit) * 100 : 0,
    status:
      dailyCurrent >= dailyLimit
        ? "violated"
        : dailyCurrent >= dailyLimit * 0.8
          ? "warning"
          : "safe",
  };
  result.totalDrawdown = {
    ...result.totalDrawdown,
    current: overallCurrent,
    percentage:
      overallLimit > 0 ? (overallCurrent / overallLimit) * 100 : 0,
    status:
      overallCurrent >= overallLimit
        ? "violated"
        : overallCurrent >= overallLimit * 0.8
          ? "warning"
          : "safe",
  };

  return {
    compliance: result,
    profitBarPeak,
    overallDrawdownBarPeak,
    dailyDrawdownBarPeak,
  };
};
