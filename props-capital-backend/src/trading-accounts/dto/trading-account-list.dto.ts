export interface TradingAccountListDto {
  id: string;
  userId: string;
  challengeId: string;
  phase: string;
  status: string;
  balance: number;
  equity: number;
  brokerLogin?: string;
  brokerPassword?: string;
  brokerServerId?: string;
  initialBalance: number;
  createdAt: string;
  updatedAt: string;
  challenge?: {
    id: string;
    name: string;
    accountSize: number;
    platform: string;
    phase1TargetPercent: number;
    phase2TargetPercent: number;
    dailyDrawdownPercent: number;
    overallDrawdownPercent: number;
    minTradingDays: number;
  };
  tradingDaysCount: number;
  lastViolationMessage: string | null;
}

