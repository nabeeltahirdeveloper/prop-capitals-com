// ─── Parameter types ───

export interface PnLParams {
  symbol: string;
  type: string; // "BUY" | "SELL"
  volume: number;
  openPrice: number;
  currentPrice: number;
}

export interface MarginParams {
  symbol: string;
  volume: number;
  price: number;
  leverage?: number;
}

export interface VolumeParams {
  symbol: string;
  volume: number;
}

export interface VolumeDisplayParams {
  symbol: string;
  volume: number;
  locale?: string;
}

export interface ContractSpec {
  contractSize: number;
  minVolume: number;
  volumeStep: number;
  volumePrecision: number;
}

export interface PriceData {
  bid: number;
  ask: number;
  timestamp?: number;
  [key: string]: any;
}

export interface Trade {
  symbol: string;
  type: string; // "BUY" | "SELL"
  volume: number;
  openPrice: number;
  leverage?: number;
  profit?: number;
  [key: string]: any;
}

export interface TradeWithPnL extends Trade {
  livePnL: number;
  currentPrice: number | null;
}

export interface EquityInput {
  balance: number;
  totalFloatingPnL: number;
  totalReservedMargin: number;
  hasOpenPositions: boolean;
  baselineEquity: number;
  summaryEquity?: number;
  challengeEquity?: number;
}

export interface EquityResult {
  balance: number;
  availableBalance: number;
  activeEquity: number;
  equity: number;
  activeProfitPercent: number;
  activeDrawdownPercent: number;
}

export interface ComplianceInput {
  baseCompliance: any;
  rules: {
    profitTarget: number;
    maxDailyLoss: number;
    maxTotalDrawdown: number;
  };
  summaryMetrics: any;
  liveMetrics: {
    profitPercent?: number | null;
    dailyDrawdownPercent?: number | null;
    overallDrawdownPercent?: number | null;
  };
  activeProfitPercent: number;
  activeDrawdownPercent: number;
  hasTradeHistory: boolean;
  profitBarPeak: number;
  overallDrawdownBarPeak: number;
  dailyDrawdownBarPeak: { date: string | null; value: number };
}

export interface ComplianceResult {
  compliance: any;
  profitBarPeak: number;
  overallDrawdownBarPeak: number;
  dailyDrawdownBarPeak: { date: string | null; value: number };
}

// ─── Unified engine interface ───

export interface TradingEngine {
  id: string;

  // Core calculations
  getContractSpec(symbol: string): ContractSpec;
  calculatePnL(params: PnLParams): number;
  calculateRequiredMargin(params: MarginParams): number;
  calculateVolumeUnits(params: VolumeParams): number;
  formatVolumeDisplay(params: VolumeDisplayParams): string;

  // Extended methods (extracted from CommonTerminalWrapper)
  formatPrice(price: number): string;
  resolvePrice(
    symbol: string,
    prices: Record<string, PriceData>,
  ): PriceData | null;
  getExitPrice(trade: Trade, prices: Record<string, PriceData>): number;
  computePositionsPnL(
    positions: Trade[],
    prices: Record<string, PriceData>,
  ): TradeWithPnL[];
  computeTotalFloatingPnL(positionsWithPnL: TradeWithPnL[]): number;
  computeMarginUsage(positions: Trade[]): number;
  computeEquity(input: EquityInput): EquityResult;
  computeComplianceBars(input: ComplianceInput): ComplianceResult;
}
