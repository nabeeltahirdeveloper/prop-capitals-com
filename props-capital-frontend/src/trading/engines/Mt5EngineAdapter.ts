import { mt5Engine } from "./mt5Engine";
import {
  resolvePriceGeneric,
  computeTotalFloatingPnLShared,
  computeEquityShared,
  computeComplianceBarsShared,
} from "./sharedComputations";
import type {
  TradingEngine,
  PriceData,
  Trade,
  TradeWithPnL,
  EquityInput,
  EquityResult,
  ComplianceInput,
  ComplianceResult,
  ContractSpec,
  PnLParams,
  MarginParams,
  VolumeParams,
  VolumeDisplayParams,
} from "./types";

// ─── Extended methods (not on mt5Engine) ───

const formatPrice = (price: number): string => {
  if (!price || price === 0) return "--";
  if (price >= 1000)
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
};

const resolvePrice = (
  symbol: string,
  prices: Record<string, PriceData>,
): PriceData | null => {
  return resolvePriceGeneric(symbol, prices);
};

const getExitPrice = (
  trade: Trade,
  prices: Record<string, PriceData>,
): number => {
  const pd = resolvePrice(trade.symbol, prices);
  if (!pd) return trade.openPrice;
  return trade.type === "BUY" ? pd.bid : pd.ask;
};

const computePositionsPnL = (
  positions: Trade[],
  prices: Record<string, PriceData>,
): TradeWithPnL[] => {
  return positions.map((trade) => {
    const pd = resolvePrice(trade.symbol, prices);
    if (!pd)
      return { ...trade, livePnL: trade.profit || 0, currentPrice: null };
    const exitPrice = trade.type === "BUY" ? pd.bid : pd.ask;
    const livePnL = mt5Engine.calculatePnL({
      symbol: trade.symbol,
      type: String(trade.type || "BUY").toUpperCase(),
      volume: Number(trade.volume),
      openPrice: Number(trade.openPrice),
      currentPrice: Number(exitPrice),
    });
    return { ...trade, livePnL, currentPrice: exitPrice };
  });
};

const computeMarginUsage = (positions: Trade[]): number => {
  return positions.reduce((sum, position) => {
    return (
      sum +
      mt5Engine.calculateRequiredMargin({
        symbol: position.symbol,
        volume: Number(position.volume),
        price: Number(position.openPrice),
        leverage: Number(position.leverage) || 100,
      })
    );
  }, 0);
};

// ─── Assembled adapter ───

export const mt5EngineAdapter: TradingEngine = {
  id: mt5Engine.id,

  // Pass-through to original mt5Engine
  getContractSpec: mt5Engine.getContractSpec as (symbol: string) => ContractSpec,
  calculatePnL: mt5Engine.calculatePnL as (params: PnLParams) => number,
  calculateRequiredMargin: mt5Engine.calculateRequiredMargin as (
    params: MarginParams,
  ) => number,
  calculateVolumeUnits: mt5Engine.calculateVolumeUnits as (
    params: VolumeParams,
  ) => number,
  formatVolumeDisplay: mt5Engine.formatVolumeDisplay as (
    params: VolumeDisplayParams,
  ) => string,

  // Extended methods
  formatPrice,
  resolvePrice,
  getExitPrice,
  computePositionsPnL,
  computeTotalFloatingPnL: computeTotalFloatingPnLShared,
  computeMarginUsage,
  computeEquity: computeEquityShared,
  computeComplianceBars: computeComplianceBarsShared,
};
