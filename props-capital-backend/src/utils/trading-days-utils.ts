// Helper function to calculate trading days metrics
// This can be imported and used across services

export interface TradingDaysMetrics {
  tradingDaysCompleted: number;
  tradedToday: boolean;
  daysRemaining: number;
  uniqueTradeDates: string[]; // For debugging
}

export function calculateTradingDaysMetrics(
  trades: Array<{ openedAt: Date | string }>,
  minTradingDays: number
): TradingDaysMetrics {
  // Extract unique dates from trades
  const uniqueDates = new Set<string>();
  
  trades.forEach((trade) => {
    if (trade.openedAt) {
      const dateString = typeof trade.openedAt === 'string'
        ? new Date(trade.openedAt).toISOString().substring(0, 10)
        : trade.openedAt.toISOString().substring(0, 10);
      
      uniqueDates.add(dateString);
    }
  });

  const tradingDaysCompleted = uniqueDates.size;

  // Check if user traded today
  const today = new Date().toISOString().substring(0, 10);
  const tradedToday = uniqueDates.has(today);

  // Calculate days remaining
  const daysRemaining = Math.max(0, minTradingDays - tradingDaysCompleted);

  return {
    tradingDaysCompleted,
    tradedToday,
    daysRemaining,
    uniqueTradeDates: Array.from(uniqueDates).sort(),
  };
}

/**
 * Format trading days display for UI
 * @param metrics - Trading days metrics from calculateTradingDaysMetrics
 * @returns Formatted string for display
 */
export function formatTradingDaysDisplay(metrics: TradingDaysMetrics): string {
  const { tradingDaysCompleted, tradedToday, daysRemaining } = metrics;
  
  let display = `${tradingDaysCompleted} trading days completed`;
  
  if (tradedToday) {
    display += ' (including today)';
  }
  
  if (daysRemaining > 0) {
    display += ` - ${daysRemaining} days remaining`;
  } else {
    display += ' - requirement met!';
  }
  
  return display;
}