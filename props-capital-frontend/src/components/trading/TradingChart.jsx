import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
  HistogramSeries,
} from "lightweight-charts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Clock, LineChart as LineChartIcon } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import { getMarketHistory, getCurrentPrice } from "@/api/market-data";
import { usePrices } from "@/contexts/PriceContext";

// Timeframe to milliseconds mapping
const timeframeToMs = {
  M1: 60000,
  M5: 60000 * 5,
  M15: 60000 * 15,
  M30: 60000 * 30,
  H1: 60000 * 60,
  H4: 60000 * 60 * 4,
  D1: 60000 * 60 * 24,
};

export default function TradingChart({
  symbol,
  openPositions = [],
  onPriceUpdate,
}) {
  const { t } = useTranslation();
  const { getPrice: getUnifiedPrice } = usePrices();
  const [timeframe, setTimeframe] = useState("M5");
  const [chartType, setChartType] = useState("candle"); // 'candle' or 'line'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const lineSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const positionMarkersRef = useRef([]);
  const currentPriceLineRef = useRef(null);
  const lastUpdateTimeRef = useRef(Date.now());
  const currentPriceRef = useRef(symbol?.bid || 1.08542);
  const priceUpdateIntervalRef = useRef(null);
  const currentVolumeRef = useRef(0); // Track current candle volume for aggregation
  const seriesReadyRef = useRef(false); // Track if series are initialized
  const fetchAbortControllerRef = useRef(null); // Track and cancel pending requests
  const debounceTimerRef = useRef(null); // Debounce symbol changes
  const startPollingTimerRef = useRef(null); // Track price polling start timer

  const timeframes = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];

  // Get price format configuration based on symbol type (for chart series)
  const getPriceFormatConfig = useCallback(() => {
    if (!symbol?.symbol) {
      return { precision: 5, minMove: 0.00001 };
    }

    const symbolUpper = symbol.symbol.toUpperCase();

    // Forex pairs - 5 decimals, minMove 0.00001
    if (
      symbolUpper.includes("EUR") ||
      symbolUpper.includes("AUD") ||
      symbolUpper.includes("GBP") ||
      symbolUpper.includes("NZD") ||
      symbolUpper.includes("CAD") ||
      symbolUpper.includes("CHF")
    ) {
      return { precision: 5, minMove: 0.00001 };
    }

    // JPY pairs - 3 decimals, minMove 0.001
    if (symbolUpper.includes("JPY")) {
      return { precision: 3, minMove: 0.001 };
    }

    // Crypto - 2 decimals, minMove 0.01
    if (
      symbolUpper.includes("BTC") ||
      symbolUpper.includes("ETH") ||
      symbolUpper.includes("SOL")
    ) {
      return { precision: 2, minMove: 0.01 };
    }

    // Other crypto - 4 decimals, minMove 0.0001
    if (
      symbolUpper.includes("XRP") ||
      symbolUpper.includes("ADA") ||
      symbolUpper.includes("DOGE")
    ) {
      return { precision: 4, minMove: 0.0001 };
    }

    // Default for forex - 5 decimals
    return { precision: 5, minMove: 0.00001 };
  }, [symbol?.symbol]);

  // Format price for display (UI)
  const formatPrice = useCallback(
    (price) => {
      if (!price) return "";
      const config = getPriceFormatConfig();
      return price.toFixed(config.precision);
    },
    [getPriceFormatConfig],
  );

  // Convert timestamp to UTCTimestamp (lightweight-charts expects seconds since epoch)
  const toUTCTimestamp = (timestamp) => {
    if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
      return Math.floor(Date.now() / 1000);
    }
    // If timestamp is already in seconds (less than year 2000 in milliseconds), use as is
    if (timestamp < 946684800000) {
      // Year 2000 in milliseconds
      const seconds = Math.floor(timestamp);
      // Ensure it's a valid timestamp (after 1970)
      if (seconds < 0) {
        return Math.floor(Date.now() / 1000);
      }
      return seconds;
    }
    // Otherwise convert from milliseconds to seconds
    const seconds = Math.floor(timestamp / 1000);
    // Ensure it's a valid timestamp
    if (seconds < 0 || isNaN(seconds)) {
      return Math.floor(Date.now() / 1000);
    }
    return seconds;
  };

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    let resizeObserver;
    let dimensionCheckInterval;

    const checkAndInitialize = () => {
      const width = container.clientWidth || container.offsetWidth;
      const height = container.clientHeight || container.offsetHeight;

      if (width > 0 && height > 0 && !chartRef.current) {
        console.log("Container ready, initializing chart...", {
          width,
          height,
        });
        initializeChart();
        if (dimensionCheckInterval) {
          clearInterval(dimensionCheckInterval);
        }
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      }
    };

    // Check immediately
    checkAndInitialize();

    // If not ready, set up observers
    if (!chartRef.current) {
      // Use ResizeObserver if available
      if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(checkAndInitialize);
        resizeObserver.observe(container);
      } else {
        // Fallback to interval checking
        dimensionCheckInterval = setInterval(checkAndInitialize, 100);
      }
    }

    function initializeChart() {
      if (!container || chartRef.current) return;

      // Reset series ready flag when initializing new chart
      seriesReadyRef.current = false;

      // Ensure container has valid dimensions
      const width = container.clientWidth || container.offsetWidth || 800;
      const height = container.clientHeight || container.offsetHeight || 400;

      if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
        console.error("Invalid container dimensions:", {
          width,
          height,
          clientWidth: container.clientWidth,
          clientHeight: container.clientHeight,
        });
        return;
      }

      // Mobile: use narrower price scale and tighter spacing so chart fits without clipping
      const isNarrow = width < 420;
      const rightScaleMinWidth = isNarrow ? 44 : 92;
      const barSpacing = isNarrow ? 8 : 14;
      const rightOffset = isNarrow ? 4 : 9;

      console.log("Creating chart with dimensions:", { width, height, isNarrow: isNarrow });

      // Create chart with TradingView-like styling
      // Use autoSize if dimensions are invalid, otherwise use explicit dimensions
      let chart;
      try {
        const chartOptions = {
          layout: {
            background: { type: ColorType.Solid, color: "#131722" },
            textColor: "#d1d4dc",
          },
          grid: {
            vertLines: { color: "rgba(42, 46, 57, 0.035)", style: 0 },
            horzLines: { color: "rgba(42, 46, 57, 0.035)", style: 0 },
          },
          crosshair: {
            mode: 2,
            vertLine: {
              color: "rgba(117, 134, 150, 0.5)",
              width: 1,
              style: 2,
              labelBackgroundColor: "#131722",
            },
            horzLine: {
              color: "rgba(117, 134, 150, 0.5)",
              width: 1,
              style: 2,
              labelBackgroundColor: "#131722",
            },
          },
          rightPriceScale: {
            borderColor: "#2a2e39",
            autoScale: true, // important to prevent vertical drag
            minimumWidth: rightScaleMinWidth,
            scaleMargins: { top: 0.22, bottom: 0.22 },
          },
          timeScale: {
            borderColor: "#2a2e39",
            timeVisible: true,
            secondsVisible: false,
            barSpacing: barSpacing,
            rightOffset: rightOffset,
            fixLeftEdge: true,
            fixRightEdge: true,
          },
          handleScroll: true, // enable scrolling
          handleScale: true, // enable zoom
          axisPressedMouseMove: true, // allow dragging
          pinchZoom: true, // enable touch pinch zoom
          handleScrollOptions: {
            vertTouchDrag: false, // disables vertical movement
          },
        };

        // Only set width/height if they're valid, otherwise let chart auto-size
        if (width > 0 && height > 0 && !isNaN(width) && !isNaN(height)) {
          chartOptions.width = width;
          chartOptions.height = height;
        } else {
          console.warn("Invalid dimensions, using autoSize");
          chartOptions.autoSize = true;
        }

        chart = createChart(container, chartOptions);
      } catch (err) {
        console.error("Failed to create chart:", err);
        setError("Failed to initialize chart. Please refresh the page.");
        return;
      }

      chartRef.current = chart;

      // Wait a moment to ensure chart is fully initialized before adding series
      // Use requestAnimationFrame to ensure chart is rendered
      requestAnimationFrame(() => {
        setTimeout(() => {
          if (!chartRef.current) {
            console.warn("Chart ref is null, cannot add series");
            return;
          }

          const chart = chartRef.current;

          // Verify chart is valid
          if (!chart || typeof chart.addSeries !== "function") {
            console.error("Chart is not valid or addSeries is not a function");
            setError("Chart initialization failed. Please refresh.");
            return;
          }

          // Get price format for the symbol (call the function to get current config)
          const priceFormatConfig = (() => {
            if (!symbol?.symbol) {
              return { precision: 5, minMove: 0.00001 };
            }

            const symbolUpper = symbol.symbol.toUpperCase();

            // Forex pairs - 5 decimals, minMove 0.00001
            if (
              symbolUpper.includes("EUR") ||
              symbolUpper.includes("AUD") ||
              symbolUpper.includes("GBP") ||
              symbolUpper.includes("NZD") ||
              symbolUpper.includes("CAD") ||
              symbolUpper.includes("CHF")
            ) {
              return { precision: 5, minMove: 0.00001 };
            }

            // JPY pairs - 3 decimals, minMove 0.001
            if (symbolUpper.includes("JPY")) {
              return { precision: 3, minMove: 0.001 };
            }

            // Crypto - 2 decimals, minMove 0.01
            if (
              symbolUpper.includes("BTC") ||
              symbolUpper.includes("ETH") ||
              symbolUpper.includes("SOL")
            ) {
              return { precision: 2, minMove: 0.01 };
            }

            // Other crypto - 4 decimals, minMove 0.0001
            if (
              symbolUpper.includes("XRP") ||
              symbolUpper.includes("ADA") ||
              symbolUpper.includes("DOGE")
            ) {
              return { precision: 4, minMove: 0.0001 };
            }

            // Default for forex - 5 decimals
            return { precision: 5, minMove: 0.00001 };
          })();

          // Create candlestick series with TradingView colors (v5 API)
          try {
            console.log("Adding candlestick series...", {
              chartWidth: width,
              chartHeight: height,
              priceFormat: priceFormatConfig,
            });

            // Use the imported CandlestickSeries class (v5 API)
            const candlestickSeries = chart.addSeries(CandlestickSeries, {
              upColor: "#26a69a",
              downColor: "#ef5350",
              borderVisible: false, // TradingView style - no borders
              wickUpColor: "#26a69a",
              wickDownColor: "#ef5350",
              priceLineVisible: true, // Show price line
              lastValueVisible: true, // Show last value
              priceFormat: {
                type: "price",
                precision: priceFormatConfig.precision,
                minMove: priceFormatConfig.minMove,
              },
            });
            console.log("Candlestick series created successfully");

            candlestickSeriesRef.current = candlestickSeries;
          } catch (err) {
            console.error("Failed to create candlestick series:", err);
            console.error("Error details:", {
              name: err.name,
              message: err.message,
              stack: err.stack,
            });
            setError(
              `Failed to create chart series: ${err.message || "Unknown error"}`,
            );
            return;
          }

          // Create line series (for line chart mode) (v5 API)
          try {
            console.log("Adding line series...");
            const lineSeries = chart.addSeries(LineSeries, {
              color: "#2962ff",
              lineWidth: 2,
              lastValueVisible: true,
              priceLineVisible: true,
              priceFormat: {
                type: "price",
                precision: priceFormatConfig.precision,
                minMove: priceFormatConfig.minMove,
              },
            });
            lineSeriesRef.current = lineSeries;
            console.log("Line series created successfully");
          } catch (err) {
            console.error("Failed to create line series:", err);
            setError("Failed to create line series. Please refresh.");
            return;
          }

          // Create volume series (will be updated with colors per bar) (v5 API)
          // Volume series uses its own price scale and stays at bottom 15-20%
          try {
            console.log("Adding volume series...");
            const volumeSeries = chart.addSeries(HistogramSeries, {
              priceScaleId: "", // Empty string for separate volume scale (overlay)
              lastValueVisible: false, // Hide volume last value label on price scale
              scaleMargins: {
                top: 0.9, // Volume occupies bottom 10% - fades into background (1 - 0.90 = 0.10)
                bottom: 0.0,
              },
            });
            volumeSeriesRef.current = volumeSeries;
            console.log("Volume series created successfully");
          } catch (err) {
            console.warn(
              "Failed to create volume series, continuing without it:",
              err,
            );
            volumeSeriesRef.current = null;
          }

          // Mark series as ready
          if (candlestickSeriesRef.current && lineSeriesRef.current) {
            seriesReadyRef.current = true;
            console.log("All series initialized and ready");
          }
        }, 200); // Increased delay to ensure chart is fully ready
      });

      // Handle resize with ResizeObserver for better performance
      let resizeObserver;
      if (window.ResizeObserver && container) {
        resizeObserver = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            if (chartRef.current && width > 0 && height > 0) {
              const isNarrowNow = width < 420;
              chartRef.current.applyOptions({
                width: width,
                height: height,
                rightPriceScale: {
                  minimumWidth: isNarrowNow ? 44 : 92,
                },
                timeScale: {
                  barSpacing: isNarrowNow ? 8 : 14,
                  rightOffset: isNarrowNow ? 4 : 9,
                },
              });
            }
          }
        });
        resizeObserver.observe(container);
      } else {
        // Fallback to window resize event
        const handleResize = () => {
          if (container && chartRef.current) {
            const width = container.clientWidth || 800;
            const height = container.clientHeight || 400;
            if (width > 0 && height > 0) {
              chartRef.current.applyOptions({
                width: width,
                height: height,
              });
            }
          }
        };
        window.addEventListener("resize", handleResize);
      }

      return () => {
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
        if (dimensionCheckInterval) {
          clearInterval(dimensionCheckInterval);
        }
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
        }
        // Reset series ready flag when chart is removed
        seriesReadyRef.current = false;
        candlestickSeriesRef.current = null;
        lineSeriesRef.current = null;
        volumeSeriesRef.current = null;

        // Cancel any pending requests
        if (fetchAbortControllerRef.current) {
          fetchAbortControllerRef.current.abort();
          fetchAbortControllerRef.current = null;
        }
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }
        if (startPollingTimerRef.current) {
          clearTimeout(startPollingTimerRef.current);
          startPollingTimerRef.current = null;
        }
        if (priceUpdateIntervalRef.current) {
          clearInterval(priceUpdateIntervalRef.current);
          priceUpdateIntervalRef.current = null;
        }
      };
    }
  }, []);

  // Fetch historical data
  const fetchHistory = useCallback(
    async (symbolName, tf) => {
      if (
        !symbolName ||
        !chartRef.current ||
        !candlestickSeriesRef.current ||
        !lineSeriesRef.current
      ) {
        console.log("Chart not ready, waiting...", {
          hasChart: !!chartRef.current,
          hasCandleSeries: !!candlestickSeriesRef.current,
          hasLineSeries: !!lineSeriesRef.current,
        });
        return;
      }

      // Cancel any pending request
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }
      fetchAbortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      // Clear existing chart data when switching symbols to prevent visual glitches
      if (candlestickSeriesRef.current) {
        try {
          candlestickSeriesRef.current.setData([]);
        } catch (e) {
          // Ignore errors when clearing
        }
      }
      if (lineSeriesRef.current) {
        try {
          lineSeriesRef.current.setData([]);
        } catch (e) {
          // Ignore errors when clearing
        }
      }
      if (volumeSeriesRef.current) {
        try {
          volumeSeriesRef.current.setData([]);
        } catch (e) {
          // Ignore errors when clearing
        }
      }

      try {
        const historyData = await getMarketHistory(symbolName, tf, 500); // Get more candles for better view

        // Check if request was aborted
        if (fetchAbortControllerRef.current?.signal.aborted) {
          console.log("Request aborted for:", symbolName);
          return;
        }

        // Handle empty data (e.g., rate-limited crypto)
        if (
          !historyData ||
          (Array.isArray(historyData) && historyData.length === 0)
        ) {
          setError(
            "No data available. The API may be rate-limited. Please wait a moment and try again.",
          );
          setIsLoading(false);
          return;
        }

        if (Array.isArray(historyData) && historyData.length > 0) {
          // Debug: Log received data
          console.log(
            `[TradingChart] Received ${historyData.length} candles for ${symbolName} ${tf}`,
          );
          if (historyData.length > 0) {
            const first = historyData[0];
            const last = historyData[historyData.length - 1];
            console.log(
              `[TradingChart] First candle time: ${first.time} (${new Date(
                first.time * 1000,
              ).toISOString()})`,
            );
            console.log(
              `[TradingChart] Last candle time: ${last.time} (${new Date(
                last.time * 1000,
              ).toISOString()})`,
            );
          }

          // Convert to lightweight-charts format with validation
          const candles = historyData
            .map((candle) => {
              // Validate and convert time
              // Backend returns time in seconds (UNIX timestamp)
              let timeValue;
              if (candle.time) {
                // If time is already in seconds (small number < year 2000 in ms), use as-is
                // Otherwise, assume it's in milliseconds and convert
                if (typeof candle.time === "number") {
                  // If less than year 2000 in milliseconds (946684800000), it's likely already in seconds
                  timeValue =
                    candle.time < 946684800000
                      ? candle.time
                      : Math.floor(candle.time / 1000);
                } else {
                  timeValue = Math.floor(
                    new Date(candle.time).getTime() / 1000,
                  );
                }
              } else if (candle.timestamp) {
                if (typeof candle.timestamp === "number") {
                  timeValue =
                    candle.timestamp < 946684800000
                      ? candle.timestamp
                      : Math.floor(candle.timestamp / 1000);
                } else {
                  timeValue = Math.floor(
                    new Date(candle.timestamp).getTime() / 1000,
                  );
                }
              } else {
                timeValue = Math.floor(Date.now() / 1000);
              }

              // Validate prices - ensure they are valid numbers
              const open =
                typeof candle.open === "number" && !isNaN(candle.open)
                  ? candle.open
                  : candle.close || 0;
              const high =
                typeof candle.high === "number" && !isNaN(candle.high)
                  ? candle.high
                  : candle.close || open;
              const low =
                typeof candle.low === "number" && !isNaN(candle.low)
                  ? candle.low
                  : candle.close || open;
              const close =
                typeof candle.close === "number" && !isNaN(candle.close)
                  ? candle.close
                  : open;

              // Ensure all prices are positive and valid
              if (
                open <= 0 ||
                high <= 0 ||
                low <= 0 ||
                close <= 0 ||
                isNaN(open) ||
                isNaN(high) ||
                isNaN(low) ||
                isNaN(close)
              ) {
                return null; // Skip invalid candles
              }

              // Ensure high >= max(open, close) and low <= min(open, close)
              const validHigh = Math.max(high, open, close);
              const validLow = Math.min(low, open, close);

              return {
                time: toUTCTimestamp(timeValue),
                open: open,
                high: validHigh,
                low: validLow,
                close: close,
              };
            })
            .filter((candle) => candle !== null) // Remove invalid candles
            .sort((a, b) => a.time - b.time);

          // Remove duplicate timestamps (keep the last one)
          const uniqueCandles = [];
          const seenTimes = new Set();
          for (let i = candles.length - 1; i >= 0; i--) {
            const candle = candles[i];
            if (!seenTimes.has(candle.time)) {
              seenTimes.add(candle.time);
              uniqueCandles.unshift(candle); // Add to beginning to maintain order
            }
          }

          // Only proceed if we have valid candles
          if (uniqueCandles.length === 0) {
            setError("No valid candle data received");
            setIsLoading(false);
            return;
          }

          const lineData = uniqueCandles.map((c) => ({
            time: c.time,
            value: c.close,
          }));

          // Create volume data matching the unique candles by time
          const candleTimeMap = new Map(candles.map((c) => [c.time, c]));
          const volumeData = [];
          for (const candle of historyData) {
            let timeValue;
            if (candle.time) {
              // Backend returns time in seconds
              if (typeof candle.time === "number") {
                timeValue =
                  candle.time < 946684800000
                    ? candle.time
                    : Math.floor(candle.time / 1000);
              } else {
                timeValue = Math.floor(new Date(candle.time).getTime() / 1000);
              }
            } else if (candle.timestamp) {
              if (typeof candle.timestamp === "number") {
                timeValue =
                  candle.timestamp < 946684800000
                    ? candle.timestamp
                    : Math.floor(candle.timestamp / 1000);
              } else {
                timeValue = Math.floor(
                  new Date(candle.timestamp).getTime() / 1000,
                );
              }
            } else {
              continue; // Skip if no time
            }

            const utcTime = toUTCTimestamp(timeValue);
            const matchingCandle = candleTimeMap.get(utcTime);

            if (matchingCandle) {
              const volume =
                typeof candle.volume === "number" && !isNaN(candle.volume)
                  ? candle.volume
                  : 0;
              const isUp = matchingCandle.close >= matchingCandle.open;

              // Use rgba with ~0.24 opacity for volume bars that fade into background (TradingView parity)
              volumeData.push({
                time: utcTime,
                value: volume,
                color: isUp
                  ? "rgba(38, 166, 154, 0.24)"
                  : "rgba(239, 83, 80, 0.24)", // Reduced opacity for visual calm
              });
            }
          }

          // Sort volume data by time
          volumeData.sort((a, b) => a.time - b.time);

          // Filter and validate volume data (needed outside updateChart function)
          const validVolumeData = volumeData.filter(
            (v) =>
              v &&
              typeof v.time === "number" &&
              typeof v.value === "number" &&
              !isNaN(v.time) &&
              !isNaN(v.value) &&
              v.time > 0,
          );
          if (validVolumeData.length > 0) {
            // Ensure volume data is also sorted
            validVolumeData.sort((a, b) => a.time - b.time);
          }

          // Final validation: ensure data is strictly sorted and has no duplicates
          const finalCandles = [];
          let lastTime = null;
          for (const candle of uniqueCandles) {
            if (candle.time > (lastTime || -1)) {
              finalCandles.push(candle);
              lastTime = candle.time;
            }
          }

          if (finalCandles.length === 0) {
            setError("No valid candle data after processing");
            setIsLoading(false);
            return;
          }

          const finalLineData = finalCandles.map((c) => ({
            time: c.time,
            value: c.close,
          }));

          // Update series based on chart type with error handling
          // Wait a tiny bit to ensure chart is fully initialized
          const updateChart = () => {
            try {
              if (
                !chartRef.current ||
                !candlestickSeriesRef.current ||
                !lineSeriesRef.current
              ) {
                console.warn("Chart or series not initialized, retrying...");
                setTimeout(updateChart, 100);
                return;
              }

              if (
                chartType === "candle" &&
                candlestickSeriesRef.current &&
                finalCandles.length > 0
              ) {
                console.log(
                  `[TradingChart] Setting candlestick data for ${symbol?.symbol} ${tf}: ${finalCandles.length} candles`,
                );

                // Frontend validation: Log last 5 candles to check structure
                const last5 = finalCandles.slice(-5);
                console.log(
                  "[TradingChart] Last 5 candles structure:",
                  last5.map((c) => ({
                    time: c.time,
                    open: c.open,
                    high: c.high,
                    low: c.low,
                    close: c.close,
                    hasValue: "value" in c, // Should NOT have 'value' field
                    allNumeric:
                      typeof c.open === "number" &&
                      typeof c.high === "number" &&
                      typeof c.low === "number" &&
                      typeof c.close === "number",
                    isFlat:
                      c.open === c.high &&
                      c.high === c.low &&
                      c.low === c.close,
                  })),
                );

                // Verify first candle is valid
                const firstCandle = finalCandles[0];
                if (
                  firstCandle &&
                  typeof firstCandle.time === "number" &&
                  firstCandle.time > 0
                ) {
                  // Ensure we're passing the correct structure (not line data)
                  const validCandles = finalCandles
                    .map((c) => {
                      // If it has 'value' instead of OHLC, skip it
                      if ("value" in c && !("open" in c)) {
                        console.warn(
                          "[TradingChart] Invalid candle structure (has value, missing OHLC):",
                          c,
                        );
                        return null;
                      }
                      // Ensure all OHLC fields are numeric
                      if (
                        typeof c.open !== "number" ||
                        typeof c.high !== "number" ||
                        typeof c.low !== "number" ||
                        typeof c.close !== "number"
                      ) {
                        console.warn(
                          "[TradingChart] Invalid candle structure (non-numeric OHLC):",
                          c,
                        );
                        return null;
                      }
                      return {
                        time: c.time,
                        open: c.open,
                        high: c.high,
                        low: c.low,
                        close: c.close,
                      };
                    })
                    .filter((c) => c !== null);

                  if (validCandles.length > 0) {
                    candlestickSeriesRef.current.setData(validCandles);
                  } else {
                    console.error(
                      "[TradingChart] No valid candles after validation",
                    );
                  }
                } else {
                  console.error("Invalid first candle:", firstCandle);
                }
              } else if (
                chartType === "line" &&
                lineSeriesRef.current &&
                finalLineData.length > 0
              ) {
                console.log(
                  "Setting line data:",
                  finalLineData.length,
                  "points",
                );
                // Verify first point is valid
                const firstPoint = finalLineData[0];
                if (
                  firstPoint &&
                  typeof firstPoint.time === "number" &&
                  firstPoint.time > 0
                ) {
                  lineSeriesRef.current.setData(finalLineData);
                } else {
                  console.error("Invalid first point:", firstPoint);
                }
              }

              // Update volume (only if we have valid data)
              if (volumeSeriesRef.current && validVolumeData.length > 0) {
                volumeSeriesRef.current.setData(validVolumeData);
              }
            } catch (err) {
              console.error("Error setting chart data:", err);
              console.error("Error name:", err.name);
              console.error("Error message:", err.message);
              console.error(
                "Candles data sample (first 3):",
                finalCandles.slice(0, 3),
              );
              console.error("First candle details:", finalCandles[0]);
              setError(
                `Failed to render chart: ${err.message || "Unknown error"}`,
              );
            }
          };

          // Try immediately, then retry if needed
          updateChart();

          // Update current price reference and reset volume tracking
          if (finalCandles.length > 0) {
            const lastCandle = finalCandles[finalCandles.length - 1];
            currentPriceRef.current = lastCandle.close;
            lastUpdateTimeRef.current = Date.now();

            // Reset volume tracking for the current/last candle
            const lastVolume =
              validVolumeData.length > 0
                ? validVolumeData[validVolumeData.length - 1]?.value || 0
                : 0;
            currentVolumeRef.current = lastVolume;
          }

          // Notify parent of price update
          if (onPriceUpdate && finalCandles.length > 0) {
            const lastCandle = finalCandles[finalCandles.length - 1];
            let decimals = 5;
            if (symbolName.includes("JPY")) decimals = 3;
            else if (
              symbolName.includes("BTC") ||
              symbolName.includes("ETH") ||
              symbolName.includes("SOL")
            )
              decimals = 2;
            else if (
              symbolName.includes("XRP") ||
              symbolName.includes("ADA") ||
              symbolName.includes("DOGE")
            )
              decimals = 4;

            const formattedPrice = parseFloat(
              lastCandle.close.toFixed(decimals),
            );
            onPriceUpdate(symbolName, formattedPrice);
          }
        } else {
          // No data received - clear series
          if (candlestickSeriesRef.current) {
            candlestickSeriesRef.current.setData([]);
          }
          if (lineSeriesRef.current) {
            lineSeriesRef.current.setData([]);
          }
          if (volumeSeriesRef.current) {
            volumeSeriesRef.current.setData([]);
          }
        }
      } catch (err) {
        // Don't show error if request was aborted
        if (fetchAbortControllerRef.current?.signal.aborted) {
          console.log("Request aborted, ignoring error");
          return;
        }

        console.error("Failed to fetch market history:", err);

        // Handle rate limit errors gracefully
        if (
          err?.message?.includes("Too Many Requests") ||
          err?.message?.includes("rate limit")
        ) {
          setError("Rate limit reached. Please wait a moment and try again.");
        } else if (err?.message?.includes("Symbol not found")) {
          setError(
            `Symbol ${symbolName} not found. Please check the symbol name.`,
          );
        } else {
          setError(err?.message || "Failed to load chart data");
        }
      } finally {
        // Only clear loading if request wasn't aborted
        if (!fetchAbortControllerRef.current?.signal.aborted) {
          setIsLoading(false);
        }
        fetchAbortControllerRef.current = null;
      }
    },
    [chartType, onPriceUpdate],
  );

  // Fetch historical data when symbol or timeframe changes (with debouncing)
  useEffect(() => {
    // Clear any pending debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Cancel any pending request
    if (fetchAbortControllerRef.current) {
      fetchAbortControllerRef.current.abort();
    }

    if (
      symbol?.symbol &&
      chartRef.current &&
      candlestickSeriesRef.current &&
      lineSeriesRef.current &&
      seriesReadyRef.current
    ) {
      // Debounce to prevent rapid symbol changes from causing multiple requests
      debounceTimerRef.current = setTimeout(() => {
        fetchHistory(symbol.symbol, timeframe);
      }, 300); // 300ms debounce

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    } else if (symbol?.symbol && chartRef.current && !seriesReadyRef.current) {
      // If symbol exists but series aren't ready yet, wait a bit and retry
      debounceTimerRef.current = setTimeout(() => {
        if (
          candlestickSeriesRef.current &&
          lineSeriesRef.current &&
          seriesReadyRef.current
        ) {
          fetchHistory(symbol.symbol, timeframe);
        }
      }, 500);

      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }
  }, [symbol?.symbol, timeframe, fetchHistory]);

  // Update chart type (only re-fetch if chart type changes, not on symbol change)
  useEffect(() => {
    if (!chartRef.current || !symbol?.symbol || !seriesReadyRef.current) return;

    // Debounce chart type changes too
    const timer = setTimeout(() => {
      fetchHistory(symbol.symbol, timeframe);
    }, 200);

    return () => clearTimeout(timer);
  }, [chartType]); // Only depend on chartType, not symbol or timeframe

  // Update current price line
  const updateCurrentPriceLine = useCallback(
    (price) => {
      if (!chartRef.current) return;

      // Remove existing price line
      if (currentPriceLineRef.current) {
        if (chartType === "candle" && candlestickSeriesRef.current) {
          candlestickSeriesRef.current.removePriceLine(
            currentPriceLineRef.current,
          );
        } else if (chartType === "line" && lineSeriesRef.current) {
          lineSeriesRef.current.removePriceLine(currentPriceLineRef.current);
        }
      }

      // Add new price line (TradingView style - subtle and dotted)
      const priceLine = {
        price: price,
        color: "rgba(41, 98, 255, 0.6)", // Subtle blue with transparency for TradingView parity
        lineWidth: 1,
        lineStyle: 2, // Dashed (dotted appearance)
        axisLabelVisible: true,
        title: formatPrice(price),
      };

      if (chartType === "candle" && candlestickSeriesRef.current) {
        currentPriceLineRef.current =
          candlestickSeriesRef.current.createPriceLine(priceLine);
      } else if (chartType === "line" && lineSeriesRef.current) {
        currentPriceLineRef.current =
          lineSeriesRef.current.createPriceLine(priceLine);
      }
    },
    [chartType, formatPrice],
  );

  // Use unified price context for real-time updates (updates every 800ms)
  useEffect(() => {
    if (!symbol?.symbol || !chartRef.current) return;

    // Wait for series to be ready
    const checkAndStartUpdates = () => {
      if (
        !seriesReadyRef.current ||
        !candlestickSeriesRef.current ||
        !lineSeriesRef.current
      ) {
        startPollingTimerRef.current = setTimeout(checkAndStartUpdates, 200);
        return;
      }

      // Series are ready, use unified price context
      // Prices update every 800ms automatically from PriceContext
      const updateChartFromUnifiedPrices = () => {
        const priceData = getUnifiedPrice(symbol.symbol, "bid");

        if (
          priceData !== null &&
          priceData !== undefined &&
          !isNaN(priceData) &&
          priceData > 0
        ) {
          const newPrice = priceData;
          const now = Date.now();
          const tfMs = timeframeToMs[timeframe] || 60000 * 5;
          const currentTime = toUTCTimestamp(now);

          // Get current data
          const currentCandles = candlestickSeriesRef.current?.data() || [];
          const currentLineData = lineSeriesRef.current?.data() || [];

          // Always update the price line
          currentPriceRef.current = newPrice;
          lastUpdateTimeRef.current = now;
          updateCurrentPriceLine(newPrice);

          // Notify parent of price update
          if (onPriceUpdate) {
            let decimals = 5;
            if (symbol.symbol.includes("JPY")) decimals = 3;
            else if (
              symbol.symbol.includes("BTC") ||
              symbol.symbol.includes("ETH") ||
              symbol.symbol.includes("SOL")
            )
              decimals = 2;
            else if (
              symbol.symbol.includes("XRP") ||
              symbol.symbol.includes("ADA") ||
              symbol.symbol.includes("DOGE")
            )
              decimals = 4;

            const formattedPrice = parseFloat(newPrice.toFixed(decimals));
            onPriceUpdate(symbol.symbol, formattedPrice);
          }

          // Update candles/line if we have existing data
          if (currentCandles.length > 0 || currentLineData.length > 0) {
            const lastCandleTime =
              currentCandles.length > 0
                ? currentCandles[currentCandles.length - 1].time
                : currentLineData[currentLineData.length - 1].time;

            if (typeof lastCandleTime !== "number" || isNaN(lastCandleTime)) {
              console.warn("Invalid last candle time, skipping update");
              return;
            }

            // Check if we need a new candle (timeframe period has passed)
            if (currentTime - lastCandleTime >= tfMs / 1000) {
              const openPrice =
                currentPriceRef.current > 0
                  ? currentPriceRef.current
                  : newPrice;
              const newCandle = {
                time: currentTime,
                open: openPrice,
                close: newPrice,
                high: Math.max(openPrice, newPrice),
                low: Math.min(openPrice, newPrice),
              };

              const newLineData = {
                time: currentTime,
                value: newPrice,
              };

              currentVolumeRef.current = 0;

              const newVolumePoint = {
                time: currentTime,
                value: 0,
                color:
                  newPrice >= openPrice
                    ? "rgba(38, 166, 154, 0.24)"
                    : "rgba(239, 83, 80, 0.24)",
              };

              try {
                if (chartType === "candle" && candlestickSeriesRef.current) {
                  candlestickSeriesRef.current.update(newCandle);
                } else if (chartType === "line" && lineSeriesRef.current) {
                  lineSeriesRef.current.update(newLineData);
                }

                if (volumeSeriesRef.current) {
                  volumeSeriesRef.current.update(newVolumePoint);
                }
              } catch (err) {
                console.error(
                  `[Chart] Error updating chart for ${symbol.symbol}:`,
                  err,
                );
              }
            } else {
              // Aggregate tick into current candle
              const lastCandle =
                currentCandles.length > 0
                  ? currentCandles[currentCandles.length - 1]
                  : null;

              if (
                lastCandle &&
                typeof lastCandle.time === "number" &&
                !isNaN(lastCandle.time)
              ) {
                const lastHigh =
                  typeof lastCandle.high === "number" && !isNaN(lastCandle.high)
                    ? lastCandle.high
                    : newPrice;
                const lastLow =
                  typeof lastCandle.low === "number" && !isNaN(lastCandle.low)
                    ? lastCandle.low
                    : newPrice;
                const lastOpen =
                  typeof lastCandle.open === "number" && !isNaN(lastCandle.open)
                    ? lastCandle.open
                    : newPrice;

                const updatedCandle = {
                  time: lastCandle.time,
                  open: lastOpen,
                  close: newPrice,
                  high: Math.max(lastHigh, newPrice),
                  low: Math.min(lastLow, newPrice),
                };

                const updatedLineData = {
                  time: lastCandle.time,
                  value: newPrice,
                };

                currentVolumeRef.current += 1;

                const updatedVolumePoint = {
                  time: lastCandle.time,
                  value: currentVolumeRef.current,
                  color:
                    newPrice >= lastOpen
                      ? "rgba(38, 166, 154, 0.24)"
                      : "rgba(239, 83, 80, 0.24)",
                };

                try {
                  if (chartType === "candle" && candlestickSeriesRef.current) {
                    candlestickSeriesRef.current.update(updatedCandle);
                  } else if (chartType === "line" && lineSeriesRef.current) {
                    lineSeriesRef.current.update(updatedLineData);
                  }

                  if (volumeSeriesRef.current) {
                    volumeSeriesRef.current.update(updatedVolumePoint);
                  }
                } catch (err) {
                  console.error(
                    `[Chart] Error updating existing candle/line for ${symbol.symbol}:`,
                    err,
                  );
                }
              }
            }
          } else {
            // FIX: If no existing data, create initial candle/line point
            // This ensures the chart updates even when data is being fetched
            // Use setData() for initial point, then update() for subsequent updates
            const initialCandle = {
              time: currentTime,
              open: newPrice,
              close: newPrice,
              high: newPrice,
              low: newPrice,
            };

            const initialLineData = {
              time: currentTime,
              value: newPrice,
            };

            const initialVolumePoint = {
              time: currentTime,
              value: 1,
              color: "rgba(38, 166, 154, 0.24)",
            };

            try {
              // Use setData() for initial point when series is empty
              if (chartType === "candle" && candlestickSeriesRef.current) {
                candlestickSeriesRef.current.setData([initialCandle]);
              } else if (chartType === "line" && lineSeriesRef.current) {
                lineSeriesRef.current.setData([initialLineData]);
              }

              if (volumeSeriesRef.current) {
                volumeSeriesRef.current.setData([initialVolumePoint]);
              }

              // Update volume tracking
              currentVolumeRef.current = 1;
            } catch (err) {
              // If setData fails, the series might not be initialized yet - that's okay
              // The fetchHistory will populate it soon
              console.log(
                `[Chart] Cannot initialize empty chart yet for ${symbol.symbol}, waiting for data...`,
              );
            }
          }
        }
      };

      // Subscribe to unified price updates (updates every 800ms)
      // Use a small interval to check for price updates from unified context
      const updateInterval = setInterval(() => {
        updateChartFromUnifiedPrices();
      }, 800); // Match unified price update interval

      priceUpdateIntervalRef.current = updateInterval;
    };

    // Start checking for series readiness
    checkAndStartUpdates();

    return () => {
      if (startPollingTimerRef.current) {
        clearTimeout(startPollingTimerRef.current);
        startPollingTimerRef.current = null;
      }
      if (priceUpdateIntervalRef.current) {
        clearInterval(priceUpdateIntervalRef.current);
        priceUpdateIntervalRef.current = null;
      }
    };
  }, [
    symbol?.symbol,
    timeframe,
    chartType,
    onPriceUpdate,
    updateCurrentPriceLine,
    getUnifiedPrice,
  ]);

  // Update position markers
  useEffect(() => {
    if (!chartRef.current || !symbol?.symbol) return;

    // Remove existing markers
    positionMarkersRef.current.forEach((marker) => {
      if (chartType === "candle" && candlestickSeriesRef.current) {
        candlestickSeriesRef.current.removePriceLine(marker);
      } else if (chartType === "line" && lineSeriesRef.current) {
        lineSeriesRef.current.removePriceLine(marker);
      }
    });
    positionMarkersRef.current = [];

    // Add markers for positions matching current symbol
    const relevantPositions = openPositions.filter(
      (p) => p.symbol === symbol.symbol,
    );

    relevantPositions.forEach((pos) => {
      const color = pos.type === "buy" ? "#26a69a" : "#ef5350"; // TradingView colors
      const priceLine = {
        price: pos.entryPrice,
        color: color,
        lineWidth: 1,
        lineStyle: 2, // Dashed
        axisLabelVisible: true,
        title: `${pos.type.toUpperCase()} ${pos.lotSize}`,
      };

      let marker;
      if (chartType === "candle" && candlestickSeriesRef.current) {
        marker = candlestickSeriesRef.current.createPriceLine(priceLine);
      } else if (chartType === "line" && lineSeriesRef.current) {
        marker = lineSeriesRef.current.createPriceLine(priceLine);
      }

      if (marker) {
        positionMarkersRef.current.push(marker);
      }
    });
  }, [openPositions, symbol?.symbol, chartType]);

  // Calculate price change
  const getPriceChange = useCallback(() => {
    if (!chartRef.current) return { change: 0, percent: 0, lastPrice: 0 };

    const data =
      chartType === "candle"
        ? candlestickSeriesRef.current?.data() || []
        : lineSeriesRef.current?.data() || [];

    if (data.length < 2)
      return { change: 0, percent: 0, lastPrice: currentPriceRef.current };

    const first = data[0];
    const last = data[data.length - 1];
    const firstPrice = "close" in first ? first.close : first.value;
    const lastPrice = "close" in last ? last.close : last.value;

    const change = lastPrice - firstPrice;
    const percent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

    return { change, percent, lastPrice };
  }, [chartType]);

  const priceInfo = getPriceChange();

  return (
    <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4 h-full flex flex-col min-w-0 overflow-hidden">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white">
            {symbol?.symbol || "EUR/USD"}
          </h3>
          <span
            className={`text-xs sm:text-sm font-mono ${
              priceInfo.percent >= 0 ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {formatPrice(priceInfo.lastPrice)}
            <span className="ml-2">
              {priceInfo.percent >= 0 ? "+" : ""}
              {priceInfo.percent.toFixed(2)}%
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
          {/* Timeframe Selection */}
          <div className="flex bg-slate-800 rounded-lg p-0.5">
            {timeframes.map((tf) => (
              <Button
                key={tf}
                size="sm"
                variant={timeframe === tf ? "default" : "ghost"}
                onClick={() => setTimeframe(tf)}
                className={`h-6 px-1.5 sm:px-2 text-xs ${
                  timeframe === tf
                    ? "bg-emerald-500/20 text-emerald-200 hover:text-white"
                    : "text-slate-400 "
                }`}
              >
                {tf}
              </Button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              setChartType(chartType === "candle" ? "line" : "candle")
            }
            className={`h-6 w-6 p-0 ${
              chartType === "candle"
                ? "text-emerald-400 bg-emerald-500/20 "
                : "text-slate-400 hover:text-white"
            }`}
            title={
              chartType === "candle"
                ? "Switch to Line Chart"
                : "Switch to Candlestick Chart"
            }
          >
            <div className="group cursor-pointer">
              {chartType === "candle" ? (
                <BarChart2 className="w-4 h-4 text-gray-500 group-hover:text-black transition-colors" />
              ) : (
                <LineChartIcon className="w-4 h-4 text-gray-500 group-hover:text-black transition-colors" />
              )}
            </div>
          </Button>
        </div>
      </div>

      {/* Chart Area - min-w-0 so flex doesn't prevent chart from fitting on mobile */}
      <div className="flex-1 relative bg-[#131722] rounded-lg overflow-hidden min-h-[300px] min-w-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#131722]/80">
            <div className="text-[#d1d4dc] text-sm">
              {t("terminal.chart.loadingData")}
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#131722]/80">
            <div className="text-red-400 text-sm">{error}</div>
          </div>
        )}

        <div ref={chartContainerRef} className="w-full h-full min-w-0 min-h-0" />
      </div>

      {/* Chart Footer - Minimal */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
        <div className="flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          <span>
            {new Date(lastUpdateTimeRef.current).toLocaleTimeString()}
          </span>
        </div>
        <span>{timeframe}</span>
      </div>
    </Card>
  );
}
