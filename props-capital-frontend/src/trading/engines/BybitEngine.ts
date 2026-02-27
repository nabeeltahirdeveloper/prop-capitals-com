import {
  computeTotalFloatingPnLShared,
  computeEquityShared,
  computeComplianceBarsShared,
} from "./sharedComputations";
import type {
  TradingEngine,
  PriceData,
  Trade,
  TradeWithPnL,
  ContractSpec,
  PnLParams,
  MarginParams,
  VolumeParams,
  VolumeDisplayParams,
} from "./types";

// ─── Bybit-specific helpers ───

const normalizeSymbol = (symbol: string): string =>
  String(symbol || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

/**
 * Bybit linear perpetuals: all contracts have contractSize = 1.
 * Volume is denominated in base currency units (e.g., 0.5 BTC).
 */
const getContractSpec = (_symbol: string): ContractSpec => {
  return {
    contractSize: 1,
    minVolume: 0.001,
    volumeStep: 0.001,
    volumePrecision: 3,
  };
};

/**
 * Bybit linear perpetual PnL:
 * PnL = (exitPrice - entryPrice) * volume * direction
 * No contractSize multiplier — volume IS in base currency.
 */
const calculatePnL = ({
  symbol: _symbol,
  type,
  volume,
  openPrice,
  currentPrice,
}: PnLParams): number => {
  if (
    !Number.isFinite(volume) ||
    volume <= 0 ||
    !Number.isFinite(openPrice) ||
    openPrice <= 0 ||
    !Number.isFinite(currentPrice) ||
    currentPrice <= 0
  ) {
    return 0;
  }
  const direction = type === "BUY" ? 1 : -1;
  return (currentPrice - openPrice) * direction * volume;
};

/**
 * Bybit linear perpetual margin:
 * margin = (volume * price) / leverage
 */
const calculateRequiredMargin = ({
  symbol: _symbol,
  volume,
  price,
  leverage = 100,
}: MarginParams): number => {
  if (
    !Number.isFinite(volume) ||
    volume <= 0 ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return 0;
  }
  const lev = Number(leverage) > 0 ? Number(leverage) : 100;
  return (volume * price) / lev;
};

const calculateVolumeUnits = ({ symbol: _symbol, volume }: VolumeParams): number => {
  if (!Number.isFinite(volume) || volume <= 0) return 0;
  // Bybit: volume is already in base currency units
  return volume;
};

const formatVolumeDisplay = ({
  symbol,
  volume,
  locale = "en-US",
}: VolumeDisplayParams): string => {
  const units = calculateVolumeUnits({ symbol, volume });
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(units);
  return `${formatted} ${normalizeSymbol(symbol)}`;
};

/**
 * Crypto price formatting:
 * >= 1000 → 2 decimal places
 * >= 1    → 4 decimal places
 * < 1     → 6 decimal places
 */
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

/**
 * Bybit symbol resolution — USDT-suffix focused.
 * Handles BTCUSDT, BTC/USDT, BTCUSD variations.
 */
const resolvePrice = (
  symbol: string,
  prices: Record<string, PriceData>,
): PriceData | null => {
  if (!symbol || !prices) return null;
  const raw = String(symbol).trim();
  const upper = raw.toUpperCase();
  const compact = upper.replace(/[^A-Z0-9]/g, "");

  // Ensure USDT suffix for Bybit
  const withUsdt = compact.endsWith("USDT")
    ? compact
    : compact.endsWith("USD")
      ? compact.replace(/USD$/, "USDT")
      : compact + "USDT";
  const withoutSuffix = compact.endsWith("USDT")
    ? compact.slice(0, -4)
    : compact.endsWith("USD")
      ? compact.slice(0, -3)
      : compact;

  const candidates = [
    raw,
    upper,
    compact,
    withUsdt,
    `${withoutSuffix}/USDT`,
    `${withoutSuffix}/USD`,
    `${withoutSuffix}USD`,
  ];

  for (const key of candidates) {
    const pd = prices[key];
    if (pd && pd.bid !== undefined && pd.ask !== undefined) return pd;
  }
  return null;
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
    const livePnL = calculatePnL({
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
      calculateRequiredMargin({
        symbol: position.symbol,
        volume: Number(position.volume),
        price: Number(position.openPrice),
        leverage: Number(position.leverage) || 100,
      })
    );
  }, 0);
};

// ─── Assembled engine ───

export const bybitEngine: TradingEngine = {
  id: "bybit",
  getContractSpec,
  calculatePnL,
  calculateRequiredMargin,
  calculateVolumeUnits,
  formatVolumeDisplay,
  formatPrice,
  resolvePrice,
  getExitPrice,
  computePositionsPnL,
  computeTotalFloatingPnL: computeTotalFloatingPnLShared,
  computeMarginUsage,
  computeEquity: computeEquityShared,
  computeComplianceBars: computeComplianceBarsShared,
};
