import { apiGet } from '@/lib/api';

/**
 * Get historical candlestick data for a symbol
 * @param {string} symbol - Symbol (e.g., 'EUR/USD', 'BTC/USD')
 * @param {string} timeframe - Timeframe (M1, M5, M15, M30, H1, H4, D1)
 * @param {number} limit - Number of candles to return (default: 100)
 */
export const getMarketHistory = async (symbol, timeframe = 'M5', limit = 100) => {
  // For crypto symbols, use Binance API endpoint (real candles, no aggregation)
  const isCrypto = symbol.includes('BTC') || symbol.includes('ETH') || 
                   symbol.includes('SOL') || symbol.includes('XRP') ||
                   symbol.includes('ADA') || symbol.includes('DOGE');
  
  if (isCrypto) {
    return apiGet('/market-data/crypto/candles', {
      params: { symbol, timeframe, limit },
    });
  }
  
  // For forex, use the standard endpoint (Frankfurter API)
  return apiGet('/market-data/history', {
    params: { symbol, timeframe, limit },
  });
};

/**
 * Get current price for a symbol
 * @param {string} symbol - Symbol (e.g., 'EUR/USD', 'BTC/USD')
 */
export const getCurrentPrice = async (symbol) => {
  return apiGet('/market-data/current', {
    params: { symbol },
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

