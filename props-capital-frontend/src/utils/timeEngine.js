/**
 * TradingView/MT5-Style Professional Time Engine
 * Handles strict time normalization, UTC conversion, gap detection, and validation
 */

/**
 * Strict time normalization (TradingView style)
 * Always returns UTC seconds (lightweight-charts format)
 *
 * @param {number|string|Object} t - Time input (seconds, milliseconds, ISO string, or BusinessDay)
 * @returns {number|null} UTC seconds since epoch, or null if invalid
 */
export function normalizeTime(t) {
  if (t == null) return null;

  // UTCTimestamp (number): seconds or milliseconds
  if (typeof t === "number") {
    if (Number.isNaN(t) || !Number.isFinite(t)) return null;

    // CRITICAL: Robust detection for seconds vs milliseconds
    // Epoch seconds today (2026): ~1.7 * 10^9
    // Epoch milliseconds today: ~1.7 * 10^12
    // Threshold: 10^10 (10 billion) - anything larger is milliseconds
    let seconds;
    if (t > 1e10) {
      // Definitely milliseconds
      seconds = t / 1000;
    } else if (t < 1e9) {
      // Too small to be valid timestamp (before 2001) - might be wrong unit
      // But we'll still try to use it as seconds (could be relative time)
      seconds = t;
    } else {
      // Likely seconds (between 1e9 and 1e10)
      seconds = t;
    }

    const normalized = Math.floor(seconds);

    // Validation: ensure reasonable timestamp (not before 2000, not too far future)
    const minTime = 946684800; // Jan 1, 2000 UTC
    const maxTime = 4102444800; // Jan 1, 2100 UTC
    if (normalized < minTime || normalized > maxTime) {
      if (import.meta.env?.DEV) {
        console.warn(
          `⚠️ Suspicious timestamp rejected: ${normalized} (${new Date(normalized * 1000).toISOString()})`,
        );
      }
      return null; // Reject invalid timestamps
    }

    return normalized;
  }

  // String: try to parse as date/time (ISO format)
  if (typeof t === "string") {
    const parsed = Date.parse(t);
    if (Number.isNaN(parsed)) return null;
    return Math.floor(parsed / 1000);
  }

  // BusinessDay object: { year, month, day }
  if (typeof t === "object" && "year" in t && "month" in t && "day" in t) {
    const d = new Date(Date.UTC(t.year, t.month - 1, t.day));
    const ts = d.getTime();
    if (Number.isNaN(ts)) return null;
    return Math.floor(ts / 1000);
  }

  return null;
}

/**
 * Detect time gaps in candle data
 * Useful for identifying weekend gaps (forex) or session gaps
 *
 * @param {Array} candles - Array of candles with time property
 * @param {number} timeframeSeconds - Timeframe in seconds (e.g., 300 for 5m)
 * @returns {Array} Array of gap objects { from, to, gapHours }
 */
export function detectGaps(candles, timeframeSeconds) {
  if (!candles || candles.length < 2) return [];

  const gaps = [];
  const maxGapMultiplier = 2; // Gap > 2x timeframe is significant

  for (let i = 1; i < candles.length; i++) {
    const prevTime = candles[i - 1].time;
    const currTime = candles[i].time;
    const gap = currTime - prevTime;

    // If gap is more than 2x the timeframe, it's significant
    if (gap > timeframeSeconds * maxGapMultiplier) {
      gaps.push({
        from: prevTime,
        to: currTime,
        gapSeconds: gap,
        gapHours: (gap / 3600).toFixed(1),
        fromDate: new Date(prevTime * 1000).toISOString(),
        toDate: new Date(currTime * 1000).toISOString(),
      });
    }
  }

  return gaps;
}

/**
 * Check if timestamp is within trading session (forex)
 * Forex: Monday 17:00 NY → Friday 17:00 NY
 *
 * @param {number} timeSeconds - UTC seconds
 * @param {string} sessionTZ - Session timezone (e.g., 'America/New_York')
 * @returns {boolean} True if within trading session
 */
export function isWithinTradingSession(
  timeSeconds,
  sessionTZ = "America/New_York",
) {
  const date = new Date(timeSeconds * 1000);

  // Convert to session timezone
  // Note: Native Date API doesn't handle timezones perfectly, but works for basic checks
  // For production, consider using date-fns-tz or luxon
  const sessionDate = new Date(
    date.toLocaleString("en-US", { timeZone: sessionTZ }),
  );
  const dayOfWeek = sessionDate.getDay(); // 0 = Sunday, 5 = Friday

  // Forex: Monday (1) to Friday (5), 17:00 NY close
  // Weekend: Saturday (6) and Sunday (0) are closed
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false; // Weekend
  }

  // Check if it's Friday after 17:00 NY (market closed)
  if (dayOfWeek === 5) {
    const hours = sessionDate.getHours();
    if (hours >= 17) {
      return false; // Friday after close
    }
  }

  return true;
}

/**
 * Normalize array of candles - apply time normalization to all
 *
 * @param {Array} candles - Array of candle objects
 * @returns {Array} Array with normalized times
 */
export function normalizeCandleTimes(candles) {
  if (!Array.isArray(candles)) return [];

  return candles
    .map((candle) => ({
      ...candle,
      time: normalizeTime(candle.time),
    }))
    .filter((candle) => candle.time != null);
}

/**
 * Validate time ordering - ensure strictly ascending
 *
 * @param {Array} candles - Array of candles with time property
 * @returns {boolean} True if times are strictly ascending
 */
export function validateTimeOrdering(candles) {
  if (!candles || candles.length < 2) return true;

  for (let i = 1; i < candles.length; i++) {
    if (candles[i].time <= candles[i - 1].time) {
      return false;
    }
  }

  return true;
}

/**
 * Aligns timestamp to timeframe bucket (MT5/TradingView style)
 * For 1m candles: aligns to :00 seconds
 * For 5m candles: aligns to :00, :05, :10, etc.
 * @param {number} timeSec - Time in seconds
 * @param {number} tfSec - Timeframe in seconds (e.g., 60 for 1m, 300 for 5m)
 * @returns {number} Aligned time in seconds
 */
export function alignToTimeframe(timeSec, tfSec) {
  if (!Number.isFinite(timeSec) || !Number.isFinite(tfSec) || tfSec <= 0) {
    return timeSec; // Return as-is if invalid
  }
  return Math.floor(timeSec / tfSec) * tfSec;
}
