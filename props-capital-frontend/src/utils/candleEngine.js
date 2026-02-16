/**
 * TradingView/MT5-Style Professional Candle Engine
 * Handles candle validation, normalization, deduplication, and outlier detection
 */

import {
  normalizeTime,
  normalizeCandleTimes,
  alignToTimeframe,
} from "./timeEngine";
import { getSymbolConfig } from "../config/symbolConfig";

/**
 * Validates a single candle object
 * @param {Object} candle - Candle object with {time, open, high, low, close, volume}
 * @returns {boolean} True if candle is valid
 */
function isValidCandle(candle) {
  if (!candle || typeof candle !== "object") return false;

  const { time, open, high, low, close, volume } = candle;

  // Time must be valid
  if (normalizeTime(time) == null) return false;

  // OHLC must be numbers
  if (typeof open !== "number" || !Number.isFinite(open)) return false;
  if (typeof high !== "number" || !Number.isFinite(high)) return false;
  if (typeof low !== "number" || !Number.isFinite(low)) return false;
  if (typeof close !== "number" || !Number.isFinite(close)) return false;

  // Volume must be non-negative number
  if (
    volume != null &&
    (typeof volume !== "number" || volume < 0 || !Number.isFinite(volume))
  ) {
    return false;
  }

  // OHLC relationships must be valid
  // High must be >= Open, Close, Low
  if (high < open || high < close || high < low) return false;
  // Low must be <= Open, Close, High
  if (low > open || low > close || low > high) return false;

  // Price values must be positive (trading prices)
  if (open <= 0 || high <= 0 || low <= 0 || close <= 0) return false;

  return true;
}

/**
 * Normalizes candle prices to 5 decimal places (professional precision)
 * Ensures OHLC relationships are maintained after rounding
 * @param {Object} candle - Candle object
 * @returns {Object} Normalized candle
 */
function normalizeCandlePrices(candle) {
  const round = (val) => Math.round(val * 100000) / 100000;

  let open = round(candle.open);
  let high = round(candle.high);
  let low = round(candle.low);
  let close = round(candle.close);

  // Ensure relationships are maintained after rounding
  // High must be >= all others
  high = Math.max(high, open, close, low);
  // Low must be <= all others
  low = Math.min(low, open, close, high);

  return {
    ...candle,
    open,
    high,
    low,
    close,
    volume: candle.volume != null ? Math.round(candle.volume) : candle.volume,
  };
}

/**
 * Merges duplicate candles (same time) by keeping latest OHLC and summing volume
 * @param {Array} candles - Array of candles
 * @returns {Array} Deduplicated candles
 */
function mergeDuplicateTimes(candles) {
  if (!Array.isArray(candles) || candles.length === 0) return [];

  const timeMap = new Map();

  candles.forEach((candle) => {
    const time = normalizeTime(candle.time);
    if (time == null) return;

    if (timeMap.has(time)) {
      // Merge: keep latest OHLC, sum volume
      const existing = timeMap.get(time);
      timeMap.set(time, {
        ...candle,
        time,
        open: candle.open, // Keep latest
        high: Math.max(existing.high, candle.high),
        low: Math.min(existing.low, candle.low),
        close: candle.close, // Keep latest
        volume: (existing.volume || 0) + (candle.volume || 0),
      });
    } else {
      timeMap.set(time, { ...candle, time });
    }
  });

  return Array.from(timeMap.values());
}

/**
 * Clamps outlier candles to preserve continuity (MT5/TradingView style)
 * Instead of removing outliers, merges them with previous candle
 * @param {Array} candles - Array of candles (must be sorted by time)
 * @param {string} method - 'percentile' or 'zscore'
 * @returns {Array} Candles with outliers clamped (no removals)
 */
function clampOutliers(candles, method = "percentile") {
  if (!Array.isArray(candles) || candles.length < 3) return candles;

  // Extract close prices for outlier detection
  const prices = candles.map((c) => c.close).filter((p) => Number.isFinite(p));
  if (prices.length < 3) return candles;

  // Calculate bounds (same as before)
  const sorted = [...prices].sort((a, b) => a - b);
  let lowerBound, upperBound;

  if (method === "percentile") {
    // IQR method: bounds for Q1 - 1.5*IQR to Q3 + 1.5*IQR
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    lowerBound = q1 - 1.5 * iqr;
    upperBound = q3 + 1.5 * iqr;
  } else {
    // Z-score method: bounds for |z| > 3
    const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
    const variance =
      prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return candles; // No variation
    lowerBound = mean - 3 * stdDev;
    upperBound = mean + 3 * stdDev;
  }

  // Clamp outliers instead of removing
  return candles.map((candle, index) => {
    const price = candle.close;

    // If outlier, clamp to previous close (preserve continuity)
    if (price < lowerBound || price > upperBound) {
      if (index === 0) {
        // First candle: can't use previous, return as-is
        return candle;
      }

      const prevClose = candles[index - 1].close;

      // Clamp OHLC to previous close, but preserve time continuity
      return {
        ...candle,
        open: prevClose, // Start from previous close
        high: Math.max(prevClose, candle.high), // Keep high if reasonable
        low: Math.min(prevClose, candle.low), // Keep low if reasonable
        close: prevClose, // End at previous close (flat candle)
      };
    }

    return candle; // Normal candle, return as-is
  });
}

/**
 * Fill gaps in candle data with placeholder candles (cover the gap - MT5/TradingView style)
 * This prevents chart from showing date labels and breaking on gaps
 * @param {Array} candles - Sorted candle array
 * @param {number} timeframeSeconds - Timeframe in seconds
 * @returns {Array} Candles with gaps filled
 */
function fillGaps(candles, timeframeSeconds) {
  if (!Array.isArray(candles) || candles.length === 0) return candles;

  const filled = [];
  // Fill gaps up to 7 days (covers weekends and holidays)
  // For M1: 60 * 10080 = 604,800 seconds (7 days)
  // For larger timeframes, use at least 7 days (604,800 seconds)
  const maxGapToFill = Math.max(timeframeSeconds * 10080, 604800); // 7 days minimum
  const maxPlaceholders = 10000; // Increased to handle large gaps (weekends can have ~10,000 minutes)

  for (let i = 0; i < candles.length; i++) {
    filled.push(candles[i]);

    // Check if there's a gap before next candle
    if (i < candles.length - 1) {
      const currentTime = candles[i].time;
      const nextTime = candles[i + 1].time;
      const gap = nextTime - currentTime;

      // Log if gap is too large to fill (for debugging)
      if (gap > maxGapToFill) {
        const gapHours = (gap / 3600).toFixed(1);
        const maxGapHours = (maxGapToFill / 3600).toFixed(1);
        if (import.meta.env?.DEV) {
          console.warn(
            `⚠️ Gap too large to fill: ${gapHours}h (${Math.round(gap / 60)} minutes) - max: ${maxGapHours}h. Gap from ${new Date(currentTime * 1000).toISOString()} to ${new Date(nextTime * 1000).toISOString()}`,
          );
        }
      }

      // If gap is more than 1 timeframe, fill it with placeholder candles
      if (gap > timeframeSeconds && gap <= maxGapToFill) {
        const lastCandle = candles[i];
        let fillTime = currentTime + timeframeSeconds;
        let placeholderCount = 0;

        // Ensure fillTime is aligned to timeframe bucket (validation)
        fillTime = alignToTimeframe(fillTime, timeframeSeconds);

        // Fill gap with placeholder candles (same OHLC as last candle, volume = 0)
        // This "covers the gap" and keeps time axis continuous (MT5/TradingView style)
        while (fillTime < nextTime && placeholderCount < maxPlaceholders) {
          // Validate: ensure placeholder time is properly aligned
          const alignedTime = alignToTimeframe(fillTime, timeframeSeconds);

          // Check for duplicate times (shouldn't happen, but safety check)
          const isDuplicate = filled.some((c) => c.time === alignedTime);
          if (!isDuplicate) {
            filled.push({
              time: alignedTime,
              open: lastCandle.close, // Start from last close
              high: lastCandle.close, // Flat candle
              low: lastCandle.close, // Flat candle
              close: lastCandle.close, // End at same price
              volume: 0, // No volume (placeholder)
            });
            placeholderCount++;
          }

          fillTime += timeframeSeconds;
        }

        // If we hit max placeholders, add one final placeholder at the gap end
        if (fillTime < nextTime && placeholderCount >= maxPlaceholders) {
          const finalTime = alignToTimeframe(
            nextTime - timeframeSeconds,
            timeframeSeconds,
          );
          const isDuplicate = filled.some((c) => c.time === finalTime);
          if (!isDuplicate) {
            filled.push({
              time: finalTime,
              open: lastCandle.close,
              high: lastCandle.close,
              low: lastCandle.close,
              close: lastCandle.close,
              volume: 0,
            });
          }
        }
      } else if (gap > maxGapToFill) {
        // Gap exceeds limit - log for debugging (already logged above)
        // Still add the next candle to maintain continuity
      }
    }
  }

  // Final validation: ensure all candles are sorted and no duplicates
  filled.sort((a, b) => a.time - b.time);
  const unique = [];
  const seenTimes = new Set();
  for (const candle of filled) {
    if (!seenTimes.has(candle.time)) {
      seenTimes.add(candle.time);
      unique.push(candle);
    }
  }

  return unique;
}

/**
 * Converts timeframe string to seconds
 * @param {string} timeframe - Timeframe (e.g., '1m', '5m', '1h', '1d', 'M1', 'M5', 'H1', 'D1', 'MN')
 * @returns {number} Seconds
 */
export function timeframeToSeconds(timeframe) {
  if (!timeframe || typeof timeframe !== "string") return 60; // Default 1 minute

  const upperTimeframe = timeframe.toUpperCase();

  // Special case: MN for month
  if (upperTimeframe === "MN") {
    return 2592000; // ~30 days
  }

  // Handle formats: "M1", "M5", "H1", "D1", "W1" (letter first, uppercase)
  let match = upperTimeframe.match(/^([MHDW])(\d+)$/);
  if (match) {
    const unit = match[1];
    const value = parseInt(match[2], 10);

    const multipliers = {
      M: 60, // minutes (M1 = 1 minute, M5 = 5 minutes)
      H: 3600, // hours (H1 = 1 hour, H4 = 4 hours)
      D: 86400, // days (D1 = 1 day)
      W: 604800, // weeks (W1 = 1 week)
    };

    return value * (multipliers[unit] || 60);
  }

  // Try digit-first format (1m, 5m, 1h, 1d)
  match = timeframe.match(/^(\d+)([mhdwy])$/i);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();

    const multipliers = {
      m: 60, // minutes
      h: 3600, // hours
      d: 86400, // days
      w: 604800, // weeks
      y: 31536000, // years
    };

    return value * (multipliers[unit] || 60);
  }

  return 60; // Default to 1 minute if format not recognized
}

/**
 * Main processing pipeline for historical candles (TradingView/MT5 style)
 * @param {Array} rawCandles - Raw candle data from API
 * @param {string} symbol - Trading symbol
 * @param {string} timeframe - Timeframe (e.g., '1m', '5m')
 * @returns {Object} { candles: Array, stats: Object }
 */
export function processCandles(rawCandles, symbol, timeframe) {
  if (!Array.isArray(rawCandles) || rawCandles.length === 0) {
    return {
      candles: [],
      stats: {
        original: 0,
        processed: 0,
        duplicates: 0,
        outliers: 0,
        gaps: [],
      },
    };
  }

  const symbolConfig = getSymbolConfig(symbol);
  const timeframeSeconds = timeframeToSeconds(timeframe);

  // Step 1: Normalize times and align to timeframe bucket
  const normalizedCandles = normalizeCandleTimes(rawCandles).map((candle) => ({
    ...candle,
    time: alignToTimeframe(candle.time, timeframeSeconds),
  }));

  // Step 2: Validate candles
  const validCandles = normalizedCandles.filter((c) => isValidCandle(c));

  // Step 3: Normalize prices (round to 5 decimals, maintain relationships)
  const priceNormalized = validCandles.map((c) => normalizeCandlePrices(c));

  // Step 4: Merge duplicates (same time)
  const deduplicated = mergeDuplicateTimes(priceNormalized);

  // Step 5: Sort by time
  deduplicated.sort((a, b) => a.time - b.time);

  // Step 6: Validate time ordering (filter out any out-of-order candles)
  const ordered = deduplicated.filter((candle, index) => {
    if (index === 0) return true;
    return candle.time > deduplicated[index - 1].time;
  });

  // Step 7: Clamp outliers instead of removing (preserve continuity - MT5/TradingView style)
  const clamped =
    ordered.length > 10 ? clampOutliers(ordered, "percentile") : ordered;

  // Step 8: Final deduplication check (safety)
  const finalCandles = mergeDuplicateTimes(clamped);
  finalCandles.sort((a, b) => a.time - b.time);

  // Step 9: Fill gaps with placeholder candles (cover the gap - MT5/TradingView style)
  // Forex should keep real market-closed gaps (weekends) so the frontend can compress rendering without fake candles.
  const shouldFillGaps = symbolConfig.type !== "forex";
  const filledCandles = shouldFillGaps
    ? fillGaps(finalCandles, timeframeSeconds)
    : finalCandles;

  // Step 10: Detect significant gaps (> 2x timeframe) for logging
  const gaps = [];
  for (let i = 1; i < filledCandles.length; i++) {
    const gap = filledCandles[i].time - filledCandles[i - 1].time;
    if (gap > timeframeSeconds * 2) {
      gaps.push({
        from: filledCandles[i - 1].time,
        to: filledCandles[i].time,
        gapSeconds: gap,
        gapMinutes: Math.round(gap / 60),
        fromDate: new Date(filledCandles[i - 1].time * 1000).toISOString(),
        toDate: new Date(filledCandles[i].time * 1000).toISOString(),
      });
    }
  }

  // Calculate clamped outlier count (candles that were clamped)
  const outlierClampedCount = clamped.filter((c, i) => {
    if (i === 0) return false;
    return c.close === clamped[i - 1].close && c.open === clamped[i - 1].close;
  }).length;

  // Calculate stats
  const stats = {
    original: rawCandles.length,
    processed: filledCandles.length,
    duplicates: rawCandles.length - deduplicated.length,
    outliers: outlierClampedCount, // Changed: now shows clamped count, not removed count
    gaps: gaps,
    filledGaps: filledCandles.length - finalCandles.length,
    symbolConfig,
  };

  // Logging (dev only)
  if (import.meta.env?.DEV) {
    console.log(`✅ Processed candles for ${symbol}@${timeframe}:`, stats);
    if (filledCandles.length > 0) {
      const first = filledCandles[0];
      const last = filledCandles[filledCandles.length - 1];
      console.log(`📊 First candle:`, {
        time: first.time,
        date: new Date(first.time * 1000).toISOString(),
        OHLC: {
          open: first.open,
          high: first.high,
          low: first.low,
          close: first.close,
        },
      });
      console.log(`📊 Last candle:`, {
        time: last.time,
        date: new Date(last.time * 1000).toISOString(),
        OHLC: {
          open: last.open,
          high: last.high,
          low: last.low,
          close: last.close,
        },
      });
    }

    // Log gap information
    if (stats.filledGaps > 0) {
      console.log(
        `✅ Filled ${stats.filledGaps} placeholder candles to cover gaps in ${symbol}@${timeframe}`,
      );
    }
    if (gaps.length > 0) {
      console.log(
        `⚠️ Remaining gaps detected in ${symbol}@${timeframe} (after filling):`,
        gaps,
      );
      const maxGap = gaps.reduce(
        (max, g) => (g.gapSeconds > max.gapSeconds ? g : max),
        gaps[0],
      );
      console.log(
        `📊 Max remaining gap: ${maxGap.gapMinutes} minutes at ${maxGap.fromDate} → ${maxGap.toDate}`,
      );
    }
  }

  return { candles: filledCandles, stats };
}

/**
 * Compress forex candle time to sequential logical indices (1..N) for chart rendering.
 * Real timestamps are preserved in returned maps for formatting/tooltips.
 * @param {Array} candles - Array of candles with real epoch seconds in `time`
 * @returns {Object} { compressedCandles, indexToRealTimeMap, realTimeToIndexMap, lastIndex }
 */
export function compressForexCandles(candles) {
  const sorted = Array.isArray(candles)
    ? [...candles]
        .filter((c) => normalizeTime(c?.time) != null)
        .sort((a, b) => normalizeTime(a.time) - normalizeTime(b.time))
    : [];

  const compressedCandles = [];
  const indexToRealTimeMap = new Map();
  const realTimeToIndexMap = new Map();
  let lastIndex = 0;

  for (const candle of sorted) {
    const realTime = normalizeTime(candle.time);
    if (realTime == null) continue;

    const existingIndex = realTimeToIndexMap.get(realTime);
    const logicalIndex = existingIndex ?? lastIndex + 1;

    if (existingIndex == null) {
      lastIndex = logicalIndex;
      realTimeToIndexMap.set(realTime, logicalIndex);
      indexToRealTimeMap.set(logicalIndex, realTime);
    }

    compressedCandles.push({
      ...candle,
      time: logicalIndex,
    });
  }

  return {
    compressedCandles,
    indexToRealTimeMap,
    realTimeToIndexMap,
    lastIndex,
  };
}

/**
 * Format compressed logical time index to display string using real timestamp map.
 * Falls back to index string if map entry is missing.
 * @param {number|Object} indexOrTime - Logical index or BusinessDay-like object
 * @param {Map<number, number>} indexToRealTimeMap - logical index -> real epoch seconds
 * @param {number} tickMarkType - Lightweight-charts tick mark type
 * @param {string} locale - Locale
 * @returns {string}
 */
export function formatCompressedTime(
  indexOrTime,
  indexToRealTimeMap,
  tickMarkType = 1,
  locale = "en",
) {
  let logicalIndex = null;
  if (typeof indexOrTime === "number" && Number.isFinite(indexOrTime)) {
    logicalIndex = Math.floor(indexOrTime);
  } else if (
    indexOrTime &&
    typeof indexOrTime === "object" &&
    "year" in indexOrTime &&
    "month" in indexOrTime &&
    "day" in indexOrTime
  ) {
    const d = new Date(
      Date.UTC(indexOrTime.year, indexOrTime.month - 1, indexOrTime.day),
    );
    logicalIndex = Number.isFinite(d.getTime())
      ? Math.floor(d.getTime() / 1000)
      : null;
  }

  if (logicalIndex == null) return "";

  const realTime = indexToRealTimeMap?.get(logicalIndex);
  if (realTime == null) return String(logicalIndex);

  const d = new Date(realTime * 1000);
  if (Number.isNaN(d.getTime())) return String(logicalIndex);

  const pad = (n) => String(n).padStart(2, "0");
  const h = d.getUTCHours();
  const m = d.getUTCMinutes();
  if (tickMarkType === 2)
    return `${pad(d.getUTCDate())} ${d.toLocaleDateString(locale || "en", { month: "short" })}`;
  if (tickMarkType === 1) return `${pad(h)}:${pad(m)}`;
  return `${pad(h)}:${pad(m)}`;
}

/**
 * Process a single real-time candle update
 * @param {Object} candle - Single candle object
 * @param {string} symbol - Trading symbol
 * @param {string} timeframe - Timeframe (e.g., '1m', '5m') - defaults to '1m' if not provided
 * @returns {Object|null} Processed candle or null if invalid
 */
export function processSingleCandle(candle, symbol, timeframe = "1m") {
  if (!candle || !symbol) return null;

  // Validate candle
  if (!isValidCandle(candle)) return null;

  // Normalize time
  const normalizedTime = normalizeTime(candle.time);
  if (normalizedTime == null) return null;

  // Align to timeframe bucket
  const tfSec = timeframeToSeconds(timeframe);
  const alignedTime = alignToTimeframe(normalizedTime, tfSec);

  // Normalize prices
  const normalized = normalizeCandlePrices({
    ...candle,
    time: alignedTime,
  });

  return normalized;
}
