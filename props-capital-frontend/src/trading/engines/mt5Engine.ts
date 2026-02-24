const DEFAULT_SPEC = {
  contractSize: 100000,
  minVolume: 0.01,
  volumeStep: 0.01,
  volumePrecision: 2,
};

const normalizeSymbol = (symbol: string) =>
  String(symbol || "")
    .toUpperCase()
    .replace(/[^A-Z0-9/]/g, "");

const isCrypto = (s: string) =>
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

// XAU (Gold): 1 lot = 100 oz, so 0.01 lot = 1 oz
const isXAU = (s: string) => s.includes("XAU");
// XAG (Silver): 1 lot = 5000 oz, so 0.01 lot = 50 oz
const isXAG = (s: string) => s.includes("XAG");
const isMetal = (s: string) => isXAU(s) || isXAG(s);

const isForex = (s: string) => {
  if (s.includes("/")) return true;
  const compact = s.replace("/", "");
  return /^[A-Z]{6}$/.test(compact);
};

const getContractSpec = (symbol: string) => {
  const s = normalizeSymbol(symbol);
  if (!s) return DEFAULT_SPEC;

  if (isCrypto(s)) {
    return {
      contractSize: 1, // 1 BTC/ETH/etc per lot (spot/perp — NOT MT5 CFD)
      minVolume: 0.01,
      volumeStep: 0.01,
      volumePrecision: 2,
    };
  }
  if (isXAU(s)) {
    return {
      contractSize: 100,
      minVolume: 0.01,
      volumeStep: 0.01,
      volumePrecision: 2,
    };
  }
  if (isXAG(s)) {
    return {
      contractSize: 5000,
      minVolume: 0.01,
      volumeStep: 0.01,
      volumePrecision: 2,
    };
  }
  if (isForex(s)) {
    return {
      contractSize: 100000,
      minVolume: 0.01,
      volumeStep: 0.01,
      volumePrecision: 2,
    };
  }

  return DEFAULT_SPEC;
};

interface PnLParams {
  symbol: string;
  type: string;
  volume: number;
  openPrice: number;
  currentPrice: number;
}

const calculatePnL = ({ symbol, type, volume, openPrice, currentPrice }: PnLParams) => {
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

interface MarginParams {
  symbol: string;
  volume: number;
  price: number;
  leverage?: number;
}

const calculateRequiredMargin = ({ symbol, volume, price, leverage = 100 }: MarginParams) => {
  if (
    !Number.isFinite(volume) ||
    volume <= 0 ||
    !Number.isFinite(price) ||
    price <= 0
  ) {
    return 0;
  }
  const { contractSize } = getContractSpec(symbol);
  const lev = Number(leverage) > 0 ? Number(leverage) : 1;
  return (volume * contractSize * price) / lev;
};

interface VolumeParams {
  symbol: string;
  volume: number;
}

const calculateVolumeUnits = ({ symbol, volume }: VolumeParams) => {
  if (!Number.isFinite(volume) || volume <= 0) return 0;
  const { contractSize } = getContractSpec(symbol);
  return volume * contractSize;
};

interface VolumeDisplayParams {
  symbol: string;
  volume: number;
  locale?: string;
}

const formatVolumeDisplay = ({ symbol, volume, locale = "en-US" }: VolumeDisplayParams) => {
  const units = calculateVolumeUnits({ symbol, volume });
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(units);
  return `${formatted} ${normalizeSymbol(symbol)}`;
};

export const mt5Engine = {
  id: "mt5",
  getContractSpec,
  calculatePnL,
  calculateRequiredMargin,
  calculateVolumeUnits,
  formatVolumeDisplay,
};
