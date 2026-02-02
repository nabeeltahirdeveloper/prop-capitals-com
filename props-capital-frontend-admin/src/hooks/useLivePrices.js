import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentPrice } from '@/api/market-data';

/**
 * Unified price store hook - single source of truth for all prices
 * Stores prices as: { [symbol]: { bid, ask, last, timestamp } }
 * Implements jump detection to prevent wild price swings
 */
export function useLivePrices(activeSymbols = []) {
  const [prices, setPrices] = useState({});
  const lastPriceRef = useRef({}); // Track last price per symbol for jump detection
  const lastUpdateTimeRef = useRef({}); // Track last update time per symbol
  const pollingIntervalRef = useRef(null);

  /**
   * Update price with jump detection
   * Rejects updates that differ by >5% within 1 second
   */
  const updatePrice = useCallback((symbol, bid, ask, timestamp) => {
    if (!symbol || typeof bid !== 'number' || typeof ask !== 'number' || isNaN(bid) || isNaN(ask)) {
      return false; // Invalid price data
    }

    const now = Date.now();
    const lastPrice = lastPriceRef.current[symbol];
    const lastUpdateTime = lastUpdateTimeRef.current[symbol];

    // Jump detection: if price changed by >5% within 1 second, reject or smooth
    if (lastPrice && lastUpdateTime && (now - lastUpdateTime) < 1000) {
      const oldBid = lastPrice.bid;
      const bidChangePercent = Math.abs((bid - oldBid) / oldBid) * 100;
      
      if (bidChangePercent > 5) {
        console.warn(`⚠️ Price jump detected for ${symbol}: ${oldBid} → ${bid} (${bidChangePercent.toFixed(2)}% change within ${now - lastUpdateTime}ms). Rejecting update.`);
        return false; // Reject suspicious update
      }
    }

    // Update price
    setPrices(prev => ({
      ...prev,
      [symbol]: {
        bid,
        ask,
        last: bid, // Use bid as last price (standard convention)
        timestamp: timestamp || now,
      }
    }));

    // Track for jump detection
    lastPriceRef.current[symbol] = { bid, ask };
    lastUpdateTimeRef.current[symbol] = now;

    return true;
  }, []);

  /**
   * Get price for a symbol and side
   * @param {string} symbol - Symbol name (e.g., 'BTC/USD')
   * @param {'bid'|'ask'|'mid'} side - Price side to retrieve
   * @returns {number|null} - Price value or null if not available
   */
  const getPrice = useCallback((symbol, side = 'bid') => {
    const priceData = prices[symbol];
    if (!priceData) return null;

    switch (side) {
      case 'bid':
        return priceData.bid;
      case 'ask':
        return priceData.ask;
      case 'mid':
        return (priceData.bid + priceData.ask) / 2;
      default:
        return priceData.bid;
    }
  }, [prices]);

  /**
   * Fetch prices for active symbols
   */
  const fetchPrices = useCallback(async (symbols) => {
    if (!symbols || symbols.length === 0) return;

    try {
      const pricePromises = symbols.map(async (symbol) => {
        try {
          const priceData = await getCurrentPrice(symbol);
          if (priceData && (priceData.bid !== undefined || priceData.price !== undefined)) {
            const bid = priceData.bid !== undefined ? priceData.bid : priceData.price;
            const ask = priceData.ask !== undefined ? priceData.ask : (bid + (priceData.spread || (symbol.includes('JPY') ? 0.02 : symbol.includes('BTC') || symbol.includes('ETH') ? bid * 0.001 : 0.00015)));
            const timestamp = priceData.timestamp ? new Date(priceData.timestamp).getTime() : Date.now();
            
            return { symbol, bid, ask, timestamp };
          }
        } catch (error) {
          console.error(`Failed to fetch price for ${symbol}:`, error.message);
        }
        return null;
      });

      const results = await Promise.all(pricePromises);
      results.forEach(result => {
        if (result) {
          updatePrice(result.symbol, result.bid, result.ask, result.timestamp);
        }
      });
    } catch (error) {
      console.error('Failed to fetch prices:', error);
    }
  }, [updatePrice]);

  /**
   * Start polling for prices
   */
  useEffect(() => {
    if (activeSymbols.length === 0) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchPrices(activeSymbols);

    // Determine polling interval based on symbol types
    // Backend caching (2s TTL) handles rate limits, so we can poll every 2 seconds
    const pollInterval = 2000; // 2 seconds for both crypto and forex

    // Set up polling
    pollingIntervalRef.current = setInterval(() => {
      fetchPrices(activeSymbols);
    }, pollInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [activeSymbols.join(','), fetchPrices]);

  return {
    prices,
    getPrice,
    updatePrice,
    fetchPrices,
  };
}

