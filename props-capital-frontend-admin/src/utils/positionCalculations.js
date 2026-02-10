


// src/utils/positionCalculations.js
import { isForex, isCrypto } from './instrumentType';   // apna path adjust karna

/**
 * Positions array ko current prices ke saath enrich karta hai
 * PnL, duration, currentPrice, priceChange waghera calculate karta hai
 */
export function calculatePositionsWithPnL(positions = [], currentPrices = {}) {
  return positions.map((pos) => {
    const priceData = currentPrices[pos.symbol];
    let currentPrice;

    if (priceData && typeof priceData === 'object') {
      currentPrice =
        pos.type?.toLowerCase() === 'buy' ? priceData.bid : priceData.ask;
    } else if (typeof priceData === 'number') {
      currentPrice = priceData;
    } else {
      currentPrice = pos.entryPrice; // fallback
    }

    // Invalid price handling
    if (typeof currentPrice !== 'number' || isNaN(currentPrice) || currentPrice <= 0) {
      currentPrice = pos.entryPrice;
    }

    const priceDiff =
      pos.type?.toLowerCase() === 'buy'
        ? currentPrice - pos.entryPrice
        : pos.entryPrice - currentPrice;

    let pnl;
    let priceChange = null;

    const posIsCrypto = isCrypto(pos.symbol);
    const posIsForex = isForex(pos.symbol);

    if (posIsCrypto) {
      pnl = priceDiff * pos.lotSize;
      priceChange = pos.entryPrice > 0 ? (priceDiff / pos.entryPrice) * 100 : 0;
    } else {
      const contractSize = 100000;
      pnl = priceDiff * pos.lotSize * contractSize;
      priceChange = priceDiff;
    }

    return {
      ...pos,
      currentPrice,
      priceChange: priceChange !== null ? parseFloat(priceChange.toFixed(2)) : null,
      pnl: parseFloat(pnl.toFixed(2)),
      isCrypto: posIsCrypto,
      isForex: posIsForex,
    };
  });
}

/**
 * Duration string banane ka helper (reuse ke liye)
 */
export function getPositionDuration(openTime) {
  const ms = Date.now() - new Date(openTime).getTime();
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}