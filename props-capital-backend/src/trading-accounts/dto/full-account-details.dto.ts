export interface FullAccountDetailsDto {
  // Basic account fields
  id: string;
  phase: string;
  status: string;
  balance: number;
  equity: number;
  initialBalance: number;
  brokerLogin?: string;
  brokerPassword?: string;
  brokerServerId?: string;
  createdAt: string;
  updatedAt: string;

  // Challenge details
  challenge: {
    id: string;
    name: string;
    description?: string | null;
    accountSize: number;
    price: number;
    platform: string;
    phase1TargetPercent: number;
    phase2TargetPercent: number;
    dailyDrawdownPercent: number;
    overallDrawdownPercent: number;
    minTradingDays: number;
    maxTradingDays?: number | null;
  };

  // Metrics
  tradingDaysCount: number;
  lastViolationMessage: string | null;
  profitPercent: number;
  overallDrawdownPercent: number;
  dailyDrawdownPercent: number;
  remainingDailyDD: number;
  remainingOverallDD: number;
  marginUsed: number;
  freeMargin: number;
  daysRemaining: number;

  // Related data arrays
  violations: Array<{
    id: string;
    type: string;
    message: string;
    createdAt: string;
  }>;
  phaseHistory: Array<{
    id: string;
    fromPhase: string;
    toPhase: string;
    timestamp: string;
  }>;
  equityShots: Array<{
    id: string;
    equity: number;
    balance: number;
    timestamp: string;
  }>;
}

