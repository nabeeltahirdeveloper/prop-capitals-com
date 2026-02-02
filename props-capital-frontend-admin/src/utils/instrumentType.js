/**
 * Determine instrument type from symbol
 * @param {string} symbol - Trading symbol (e.g., 'EUR/USD', 'BTC/USD', 'XAU/USD')
 * @returns {'FOREX' | 'CRYPTO' | 'METAL' | 'INDEX' | 'OTHER'}
 */
export function getInstrumentType(symbol) {
  if (!symbol) return 'OTHER';
  
  const upperSymbol = symbol.toUpperCase();
  
  // Crypto symbols
  const cryptoSymbols = ['BTC', 'ETH', 'XRP', 'SOL', 'ADA', 'DOGE', 'BNB', 'MATIC', 'DOT', 'LINK', 'AVAX', 'UNI', 'ATOM', 'LTC', 'BCH', 'XLM', 'ALGO', 'VET', 'FIL', 'TRX', 'ETC', 'THETA', 'EOS', 'AAVE', 'MKR', 'COMP', 'SUSHI', 'SNX', 'YFI', 'CRV'];
  const isCrypto = cryptoSymbols.some(crypto => upperSymbol.includes(crypto));
  if (isCrypto) return 'CRYPTO';
  
  // Metal symbols (Gold, Silver, etc.)
  const metalSymbols = ['XAU', 'GOLD', 'XAG', 'SILVER', 'XPT', 'PLATINUM', 'XPD', 'PALLADIUM'];
  const isMetal = metalSymbols.some(metal => upperSymbol.includes(metal));
  if (isMetal) return 'METAL';
  
  // Index symbols
  const indexSymbols = ['SPX', 'NAS', 'DOW', 'DAX', 'FTSE', 'NIKKEI', 'ASX', 'CAC', 'IBEX', 'SMI'];
  const isIndex = indexSymbols.some(index => upperSymbol.includes(index));
  if (isIndex) return 'INDEX';
  
  // Forex pairs (major, minor, exotic)
  // Common forex pairs contain currency codes separated by / or no separator
  const forexPattern = /^(EUR|GBP|USD|JPY|AUD|CAD|CHF|NZD|SGD|HKD|NOK|SEK|ZAR|MXN|TRY|PLN|CZK|HUF|DKK|CNH|RUB)\/(EUR|GBP|USD|JPY|AUD|CAD|CHF|NZD|SGD|HKD|NOK|SEK|ZAR|MXN|TRY|PLN|CZK|HUF|DKK|CNH|RUB)$/i;
  const forexPatternNoSlash = /^(EUR|GBP|USD|JPY|AUD|CAD|CHF|NZD|SGD|HKD|NOK|SEK|ZAR|MXN|TRY|PLN|CZK|HUF|DKK|CNH|RUB)(EUR|GBP|USD|JPY|AUD|CAD|CHF|NZD|SGD|HKD|NOK|SEK|ZAR|MXN|TRY|PLN|CZK|HUF|DKK|CNH|RUB)$/i;
  
  if (forexPattern.test(symbol) || forexPatternNoSlash.test(symbol)) {
    return 'FOREX';
  }
  
  return 'OTHER';
}

/**
 * Check if symbol is FOREX
 */
export function isForex(symbol) {
  return getInstrumentType(symbol) === 'FOREX';
}

/**
 * Check if symbol is CRYPTO
 */
export function isCrypto(symbol) {
  return getInstrumentType(symbol) === 'CRYPTO';
}

