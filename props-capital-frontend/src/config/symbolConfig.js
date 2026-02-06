/**
 * TradingView/MT5-Style Symbol Configuration
 * Defines session times, timezones, and price modes for each symbol
 */

// Forex trading session: Monday 17:00 NY → Friday 17:00 NY (continuous)
// Weekend gap: Friday 17:00 → Sunday 17:00 (market closed)
const FOREX_SESSION = '17:00-17:00'; // NY close to NY close
const FOREX_TZ = 'America/New_York';

// Crypto: 24/7 trading
const CRYPTO_SESSION = '24x7';
const CRYPTO_TZ = 'UTC';

/**
 * Symbol configuration mapping
 * Each symbol defines:
 * - type: 'forex' | 'crypto'
 * - sessionTZ: Timezone for session times
 * - session: Trading session (forex: '17:00-17:00', crypto: '24x7')
 * - priceMode: 'mid' (forex bid/ask average) | 'last' (crypto last price)
 */
export const SYMBOL_CONFIG = {
  // Forex Major Pairs
  EURUSD: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  GBPUSD: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  USDJPY: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  USDCHF: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  AUDUSD: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  USDCAD: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  NZDUSD: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  
  // Forex Cross Pairs
  EURGBP: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  EURJPY: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  GBPJPY: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  CADJPY: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  // EURJPY: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  
  // Metals & Commodities (treated as forex for session handling)
  XAUUSD: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  XAGUSD: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  OILUSD: { type: 'forex', sessionTZ: FOREX_TZ, session: FOREX_SESSION, priceMode: 'mid' },
  
  // Crypto (24/7)
  BTCUSDT: { type: 'crypto', session: CRYPTO_SESSION, sessionTZ: CRYPTO_TZ, priceMode: 'last' },
  ETHUSDT: { type: 'crypto', session: CRYPTO_SESSION, sessionTZ: CRYPTO_TZ, priceMode: 'last' },
  BNBUSDT: { type: 'crypto', session: CRYPTO_SESSION, sessionTZ: CRYPTO_TZ, priceMode: 'last' },
  SOLUSDT: { type: 'crypto', session: CRYPTO_SESSION, sessionTZ: CRYPTO_TZ, priceMode: 'last' },
  ADAUSDT: { type: 'crypto', session: CRYPTO_SESSION, sessionTZ: CRYPTO_TZ, priceMode: 'last' },
  XRPUSDT: { type: 'crypto', session: CRYPTO_SESSION, sessionTZ: CRYPTO_TZ, priceMode: 'last' },
  DOGEUSDT: { type: 'crypto', session: CRYPTO_SESSION, sessionTZ: CRYPTO_TZ, priceMode: 'last' },
  DOTUSDT: { type: 'crypto', session: CRYPTO_SESSION, sessionTZ: CRYPTO_TZ, priceMode: 'last' },
  MATICUSDT: { type: 'crypto', session: CRYPTO_SESSION, sessionTZ: CRYPTO_TZ, priceMode: 'last' },
  LINKUSDT: { type: 'crypto', session: CRYPTO_SESSION, sessionTZ: CRYPTO_TZ, priceMode: 'last' },
};

/**
 * Default configuration for unknown symbols
 */
const DEFAULT_CONFIG = {
  type: 'forex', // Assume forex if unknown
  sessionTZ: FOREX_TZ,
  session: FOREX_SESSION,
  priceMode: 'mid',
};

/**
 * Get symbol configuration
 * @param {string} symbol - Symbol name (e.g., 'EURUSD', 'BTCUSDT')
 * @returns {Object} Symbol configuration
 */
export function getSymbolConfig(symbol) {
  if (!symbol) return DEFAULT_CONFIG;
  return SYMBOL_CONFIG[symbol.toUpperCase()] || DEFAULT_CONFIG;
}

/**
 * Check if symbol is forex
 * @param {string} symbol - Symbol name
 * @returns {boolean}
 */
export function isForexSymbol(symbol) {
  const config = getSymbolConfig(symbol);
  return config.type === 'forex';
}

/**
 * Check if symbol is crypto
 * @param {string} symbol - Symbol name
 * @returns {boolean}
 */
export function isCryptoSymbol(symbol) {
  const config = getSymbolConfig(symbol);
  return config.type === 'crypto';
}

/**
 * Check if symbol trades 24/7 (crypto)
 * @param {string} symbol - Symbol name
 * @returns {boolean}
 */
export function is24x7Symbol(symbol) {
  const config = getSymbolConfig(symbol);
  return config.session === '24x7';
}
