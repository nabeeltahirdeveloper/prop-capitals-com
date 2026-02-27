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

// ─── PT5/Forex-specific helpers ───

const DEFAULT_SPEC: ContractSpec = {
  contractSize: 100000,
  minVolume: 0.01,
  volumeStep: 0.01,
  volumePrecision: 2,
};

const normalizeSymbol = (symbol: string): string =>
  String(symbol || "")
    .toUpperCase()
    .replace(/[^A-Z0-9/]/g, "");

const isCrypto = (s: string): boolean =>
  s.includes("BTC") ||
  s.includes("ETH") ||
  s.includes("SOL") ||
  s.includes("XRP") ||
  s.includes("ADA") ||
  s.includes("DOGE") ||
  s.includes("BNB") ||
  s.includes("AVAX") ||
  s.includes("DOT") ||
  s.includes("LINK") ||
  s.endsWith("USDT");

const isXAU = (s: string): boolean => s.includes("XAU");
const isXAG = (s: string): boolean => s.includes("XAG");

/**
 * PT5 contract specs — forex lots, metals, and crypto fallback.
 */
const getContractSpec = (symbol: string): ContractSpec => {
  const s = normalizeSymbol(symbol);
  if (!s) return DEFAULT_SPEC;

  if (isCrypto(s)) {
    return {
      contractSize: 1,
      minVolume: 0.01,
      volumeStep: 0.01,
      volumePrecision: 2,
    };
  }
  if (isXAU(s)) {
    return {
      contractSize: 100, // 1 lot = 100 oz
      minVolume: 0.01,
      volumeStep: 0.01,
      volumePrecision: 2,
    };
  }
  if (isXAG(s)) {
    return {
      contractSize: 5000, // 1 lot = 5000 oz
      minVolume: 0.01,
      volumeStep: 0.01,
      volumePrecision: 2,
    };
  }

  // Standard forex: 1 lot = 100,000 units
  return DEFAULT_SPEC;
};

/**
 * PT5 PnL: priceDiff * volume * contractSize * direction
 */
const calculatePnL = ({
  symbol,
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
  const { contractSize } = getContractSpec(symbol);
  const direction = type === "BUY" ? 1 : -1;
  const priceDiff = (currentPrice - openPrice) * direction;
  return priceDiff * volume * contractSize;
};

/**
 * PT5 margin: (volume * contractSize * price) / leverage
 */
const calculateRequiredMargin = ({
  symbol,
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
  const { contractSize } = getContractSpec(symbol);
  const lev = Number(leverage) > 0 ? Number(leverage) : 100;
  return (volume * contractSize * price) / lev;
};

const calculateVolumeUnits = ({ symbol, volume }: VolumeParams): number => {
  if (!Number.isFinite(volume) || volume <= 0) return 0;
  const { contractSize } = getContractSpec(symbol);
  return volume * contractSize;
};

const formatVolumeDisplay = ({
  symbol,
  volume,
  locale = "en-US",
}: VolumeDisplayParams): string => {
  const units = calculateVolumeUnits({ symbol, volume });
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(units);
  return `${formatted} ${normalizeSymbol(symbol)}`;
};

/**
 * Forex price formatting:
 * >= 1000 → 2 decimal places (e.g., gold at 2300.50)
 * >= 1    → 5 decimal places (standard forex precision)
 * < 1     → 5 decimal places
 */
const formatPrice = (price: number): string => {
  if (!price || price === 0) return "--";
  if (price >= 1000)
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  return price.toFixed(5);
};

/**
 * PT5 symbol resolution — slash-notation focused (EUR/USD, GBP/USD).
 * Also handles compact formats and USDT suffix for mixed instruments.
 */
const resolvePrice = (
  symbol: string,
  prices: Record<string, PriceData>,
): PriceData | null => {
  if (!symbol || !prices) return null;
  const raw = String(symbol).trim();
  const upper = raw.toUpperCase();
  const compact = upper.replace(/[^A-Z0-9]/g, "");
  const compactUsd = compact.replace(/USDT$/, "USD");

  // Forex: try slash formats first
  const slashForm =
    compact.length === 6
      ? `${compact.slice(0, 3)}/${compact.slice(3)}`
      : null;
  const slashFormUsd =
    compactUsd.length === 6
      ? `${compactUsd.slice(0, 3)}/${compactUsd.slice(3)}`
      : null;

  // Handle USDT-suffixed symbols for PT5 crypto instruments
  const compactUsdt = compact.endsWith("USD")
    ? compact.replace(/USD$/, "USDT")
    : compact;
  const slashFormUsdt =
    compactUsdt.length === 7
      ? `${compactUsdt.slice(0, 3)}/${compactUsdt.slice(3)}`
      : null;

  const candidates = [
    raw,
    upper,
    compact,
    slashForm,
    slashFormUsd,
    compactUsd,
    compactUsdt,
    slashFormUsdt,
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

export const pt5Engine: TradingEngine = {
  id: "pt5",
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
