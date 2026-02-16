import { apiGet } from '@/lib/api';

/**
 * Normalize symbol to backend format (with slash)
 * BTCUSDT → BTC/USD, EURUSD → EUR/USD, BTC/USD → BTC/USD (passthrough)
 */
const toBackendSymbol = (symbol) => {
  if (!symbol) return symbol;
  // Already has slash — passthrough
  if (symbol.includes('/')) return symbol;
  // Crypto: BTCUSDT → BTC/USD
  if (symbol.endsWith('USDT')) {
    return `${symbol.replace(/USDT$/, '')}/USD`;
  }
  // Forex/metals: EURUSD → EUR/USD (insert slash after first 3 chars)
  if (symbol.length >= 6 && /^[A-Z]+$/.test(symbol)) {
    return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
  }
  return symbol;
};

/**
 * Normalize timeframe to backend format
 * 1m → M1, 5m → M5, 1h → H1, 4h → H4, 1d → D1, 1w → W1 (passthrough if already M1/M5/etc.)
 */
const toBackendTimeframe = (tf) => {
  if (!tf) return 'M5';
  // Already in backend format (M1, M5, H1, H4, D1, W1)
  if (/^[MHDW]\d+$/i.test(tf) && tf[0].match(/[MHDW]/i)) return tf.toUpperCase();
  // Display format: 1m, 5m, 15m, 30m, 1h, 4h, 1d, 1w
  const map = { '1m': 'M1', '5m': 'M5', '15m': 'M15', '30m': 'M30', '1h': 'H1', '4h': 'H4', '1d': 'D1', '1w': 'W1' };
  return map[tf.toLowerCase()] || tf;
};

/**
 * Get historical candlestick data for a symbol
 * @param {string} symbol - Symbol (e.g., 'EUR/USD', 'BTC/USD', 'BTCUSDT', 'EURUSD')
 * @param {string} timeframe - Timeframe (M1, M5, M15, M30, H1, H4, D1 or 1m, 5m, etc.)
 * @param {number} limit - Number of candles to return (default: 100)
 */
export const getMarketHistory = async (symbol, timeframe = 'M5', limit = 100) => {
  const normalized = toBackendSymbol(symbol);
  const tf = toBackendTimeframe(timeframe);
  // For crypto symbols, use Binance API endpoint (real candles, no aggregation)
  const isCrypto = normalized.includes('BTC') || normalized.includes('ETH') ||
                   normalized.includes('SOL') || normalized.includes('XRP') ||
                   normalized.includes('ADA') || normalized.includes('DOGE') ||
                   normalized.includes('BNB') || normalized.includes('AVAX') ||
                   normalized.includes('DOT') ||
                   // normalized.includes('MATIC') ||
                   normalized.includes('LINK');

  if (isCrypto) {
    return apiGet('/market-data/crypto/candles', {
      params: { symbol: normalized, timeframe: tf, limit },
    });
  }

  // For forex, use the standard endpoint (Frankfurter API)
  return apiGet('/market-data/history', {
    params: { symbol: normalized, timeframe: tf, limit },
  });
};

/**
 * Get current price for a symbol
 * @param {string} symbol - Symbol (e.g., 'EUR/USD', 'BTC/USD', 'BTCUSDT', 'EURUSD')
 */
export const getCurrentPrice = async (symbol) => {
  return apiGet('/market-data/current', {
    params: { symbol: toBackendSymbol(symbol) },
  });
};

/**
 * Get all market prices (forex + crypto)
 * This is used by MarketWatchlist to get all prices at once
 */
export const getAllPrices = async () => {
  return apiGet('/prices');
};

/**
 * Get unified prices for all symbols (crypto + forex)
 * Uses WebSocket when available, falls back to REST
 * @param {string[]} symbols - Optional array of symbols to fetch. If empty, returns all available symbols
 */
export const getUnifiedPrices = async (symbols = []) => {
  const symbolsParam = symbols.length > 0 ? `?symbols=${symbols.join(',')}` : '';
  return apiGet(`/market-data/prices${symbolsParam}`);
};

/**
 * Get crypto quotes for multiple symbols (optimized for watchlist)
 * @param {string[]} symbols - Array of crypto symbols
 */
export const getCryptoQuotes = async (symbols) => {
  if (!symbols || symbols.length === 0) {
    return [];
  }
  return apiGet('/market-data/crypto/quote', {
    params: { symbols: symbols.join(',') },
  });
};
