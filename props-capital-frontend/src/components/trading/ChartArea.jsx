// import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
// import { createChart } from "lightweight-charts";
// import { useTrading } from "../../context/TradingContext";
// import BuySellPanel from "./BuySellPanel";
// import MarketExecutionModal from "./MarketExecutionModal";
// import axios from "axios";
// import socketService from "../../services/socketService";
// // TradingView/MT5-Style Professional Engines
// import { normalizeTime, alignToTimeframe } from "../../utils/timeEngine";
// import { processCandles, processSingleCandle, timeframeToSeconds } from "../../utils/candleEngine";
// import { isForexSymbol, isCryptoSymbol } from "../../config/symbolConfig";
// import html2canvas from "html2canvas";

// const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:8000'

// // MT5/TradingView-style: default history (days) per timeframe for dynamic range
// const TIMEFRAME_DEFAULT_DAYS = {
//   M1: 3,
//   M5: 7,
//   M15: 14,
//   M30: 30,
//   H1: 90,
//   H4: 180,
//   D1: 1095,   // 3 years
//   W1: 1825,   // 5 years
//   MN: 3650,   // 10 years
// }

// function getDaysBackForTimeframe(timeframe) {
//   if (!timeframe) return 7
//   const key = String(timeframe).toUpperCase()
//   return TIMEFRAME_DEFAULT_DAYS[key] ?? 7
// }

// // Min bars to request so M15/M30 get full history (API limit caps response)
// function getLimitForTimeframe(timeframe, daysBack) {
//   const key = String(timeframe || '').toUpperCase()
//   const days = daysBack || getDaysBackForTimeframe(timeframe)
//   const barsPerDay = { M1: 1440, M5: 288, M15: 96, M30: 48, H1: 24, H4: 6, D1: 1, W1: 1 / 7, MN: 1 / 30 }[key] || 96
//   const needed = Math.ceil(days * (typeof barsPerDay === 'number' ? barsPerDay : 96))
//   return Math.min(Math.max(needed, 500), 5000)
// }

// // Professional Data Validation Utility
// // Ensures array is strictly ascending by time with unique times
// // Uses last-wins merge (forex: latest close should win)
// const ensureAscendingTimeOrder = (data) => {
//   if (!Array.isArray(data) || data.length === 0) return [];

//   // Normalize all times to integers
//   const normalized = data.map(item => ({
//     ...item,
//     time: normalizeTime(item.time)
//   })).filter(item => item.time != null);

//   // Sort by time (ascending)
//   normalized.sort((a, b) => a.time - b.time);

//   // Last-wins merge (forex: latest close should win)
//   const map = new Map();
//   for (const item of normalized) {
//     map.set(item.time, item); // Last occurrence overwrites
//   }

//   return Array.from(map.values()).sort((a, b) => a.time - b.time);
// };

// // Distance from point (px, py) to line segment (x1,y1)-(x2,y2)
// function distanceToSegment(px, py, x1, y1, x2, y2) {
//   const dx = x2 - x1, dy = y2 - y1;
//   const len = Math.sqrt(dx * dx + dy * dy);
//   if (len === 0) return Math.hypot(px - x1, py - y1);
//   let t = ((px - x1) * dx + (py - y1) * dy) / (len * len);
//   t = Math.max(0, Math.min(1, t));
//   const projX = x1 + t * dx, projY = y1 + t * dy;
//   return Math.hypot(px - projX, py - projY);
// }

// // Parallel channel: base line p1–p2, offset point p3. Returns two points for the parallel line (same time range as base).
// function computeParallelLineFromThreePoints(chart, series, p1, p2, p3) {
//   if (!p1 || !p2 || !p3) return null;
//   const t1 = p1.time, t2 = p2.time, dt = t2 - t1;
//   const pr1 = p1.price, pr2 = p2.price, pr3 = p3.price;
//   if (Math.abs(dt) < 1e-9) {
//     // Vertical base line: parallel line at t3, same price offset
//     const offset = pr3 - pr1;
//     return [
//       { time: t1, price: pr1 + offset },
//       { time: t2 + 1, price: pr2 + offset },
//     ];
//   }
//   const slope = (pr2 - pr1) / dt;
//   const priceAtT1 = pr3 + slope * (t1 - p3.time);
//   const priceAtT2 = pr3 + slope * (t2 - p3.time);
//   return [
//     { time: t1, price: priceAtT1 },
//     { time: t2, price: priceAtT2 },
//   ];
// }

// // Generate sample OHLC candles (fallback for non-Binance symbols)
// function generateCandles(count = 200, startPrice = 113.638) {
//   const candles = [];
//   let price = startPrice;

//   const start = Math.floor(Date.now() / 1000) - count * 60;

//   for (let i = 0; i < count; i++) {
//     const time = start + i * 60;
//     const open = price;
//     const change = (Math.random() - 0.5) * 0.08;
//     const close = open + change;
//     const high = Math.max(open, close) + Math.random() * 0.04;
//     const low = Math.min(open, close) - Math.random() * 0.04;

//     candles.push({
//       time,
//       open: +open.toFixed(5),
//       high: +high.toFixed(5),
//       low: +low.toFixed(5),
//       close: +close.toFixed(5),
//     });

//     price = close;
//   }

//   return candles;
// }

// const ChartArea = forwardRef(function ChartArea({
//   bidPrice = "113.638",
//   askPrice = "113.649",
//   showBuySellPanel = true,
//   onBuyClick: onBuyClickProp,
//   onSellClick: onSellClickProp,
// }, ref) {
//   const containerRef = useRef(null);
//   const chartRef = useRef(null);
//   const seriesRef = useRef(null);
//   const volumeSeriesRef = useRef(null);
//   const drawingObjectsRef = useRef([]);
//   const isDrawingRef = useRef(false);
//   const startPointRef = useRef(null);
//   const endPointRef = useRef(null);
//   const currentDrawingRef = useRef(null);
//   const trendLineFirstPointRef = useRef(null); // null = no first point; { time, price } = waiting for second click
//   const parallelChannelPointsRef = useRef([]); // 3-click parallel channel: [p1, p2] then p3
//   const [selectedChartObject, setSelectedChartObject] = useState(null); // selected trend line for resize/move
//   const [handlePositions, setHandlePositions] = useState([]); // [{x,y},{x,y}] for selected trend line handles
//   const dragModeRef = useRef(null); // null | "handle1" | "handle2" | "line"
//   const dragStartRef = useRef(null); // { x, y, point1, point2 } for move
//   const selectedChartObjectRef = useRef(null);
//   const hasInitializedRef = useRef(false);

//   useEffect(() => {
//     selectedChartObjectRef.current = selectedChartObject;
//   }, [selectedChartObject]);
//   // Store zoom state per symbol+timeframe (MT5/TradingView style)
//   // Key format: "SYMBOL_TIMEFRAME" (e.g., "GBPJPY_M1")
//   const zoomStateMapRef = useRef(new Map());
//   // Track last symbol+timeframe for stale detection
//   const lastSymbolTimeframeRef = useRef(null);

//   // Helper to get zoom state key
//   const getZoomKey = (symbol, timeframe) => `${symbol}_${timeframe}`;

//   // Helper to get/save zoom state for current symbol+timeframe
//   const getZoomState = () => {
//     const key = getZoomKey(selectedSymbol, selectedTimeframe);
//     return zoomStateMapRef.current.get(key) || null;
//   };

//   const saveZoomState = (visibleRange) => {
//     if (!visibleRange) return;
//     const key = getZoomKey(selectedSymbol, selectedTimeframe);
//     zoomStateMapRef.current.set(key, visibleRange);
//   };

//   const {
//     activeTool,
//     setActiveTool,
//     showGrid,
//     snapToGrid,
//     chartObjects,
//     setChartObjects,
//     orders,
//     selectedSymbol,
//     selectedTimeframe,
//     drawingsVisible,
//     chartType,
//     chartLocked,
//     theme,
//   } = useTrading();

//   const orderPriceLinesRef = useRef([]);
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [modalOrderType, setModalOrderType] = useState(null);
//   const [candles, setCandles] = useState([]);
//   const [candlesLoading, setCandlesLoading] = useState(true);
//   const socketRef = useRef(null);
//   const candlesMapRef = useRef(new Map()); // Store candles by time for quick updates
//   const candleUpdateTimeoutRef = useRef(null); // (reserved) For debouncing candle updates
//   const lastCandleRenderRef = useRef(0); // Throttle visual candle updates (MT5-like smoothness)

//   // Expose zoom functions to parent component
//   useImperativeHandle(ref, () => ({
//     zoomIn: () => {
//       const timeScale = chartRef.current?.timeScale();
//       if (!timeScale) return;

//       const visibleRange = timeScale.getVisibleRange();
//       if (!visibleRange || !visibleRange.from || !visibleRange.to) return;

//       const range = visibleRange.to - visibleRange.from;
//       const center = (visibleRange.from + visibleRange.to) / 2;
//       const newRange = range * 0.8; // Zoom in by 20%

//       try {
//         timeScale.setVisibleRange({
//           from: center - newRange / 2,
//           to: center + newRange / 2,
//         });
//         saveZoomState(timeScale.getVisibleRange());
//       } catch (e) {
//         // Ignore if range becomes invalid
//       }
//     },
//     zoomOut: () => {
//       const timeScale = chartRef.current?.timeScale();
//       if (!timeScale) return;

//       const visibleRange = timeScale.getVisibleRange();
//       if (!visibleRange || !visibleRange.from || !visibleRange.to) return;

//       const range = visibleRange.to - visibleRange.from;
//       const center = (visibleRange.from + visibleRange.to) / 2;
//       const newRange = range * 1.25; // Zoom out by 25%

//       try {
//         timeScale.setVisibleRange({
//           from: center - newRange / 2,
//           to: center + newRange / 2,
//         });
//         saveZoomState(timeScale.getVisibleRange());
//       } catch (e) {
//         // Ignore if range becomes invalid
//       }
//     },
//     downloadChartAsPNG: () => {
//       const container = containerRef.current;
//       if (!container) {
//         if (typeof window.notify === "function") window.notify("Chart not ready", "error");
//         return;
//       }
//       const canvases = container.querySelectorAll("canvas");
//       const bgColor = theme === "light" ? "#ffffff" : "#0F1720";
//       // Use largest canvas (main chart) or first valid one
//       let chartCanvas = null;
//       let maxArea = 0;
//       canvases.forEach((c) => {
//         if (c.width > 0 && c.height > 0) {
//           const area = c.width * c.height;
//           if (area > maxArea) {
//             maxArea = area;
//             chartCanvas = c;
//           }
//         }
//       });
//       if (chartCanvas) {
//         try {
//           const off = document.createElement("canvas");
//           off.width = chartCanvas.width;
//           off.height = chartCanvas.height;
//           const ctx = off.getContext("2d");
//           ctx.fillStyle = bgColor;
//           ctx.fillRect(0, 0, off.width, off.height);
//           ctx.drawImage(chartCanvas, 0, 0);
//           const link = document.createElement("a");
//           link.download = `chart-${selectedSymbol}-${selectedTimeframe}-${Date.now()}.png`;
//           link.href = off.toDataURL("image/png");
//           link.click();
//           if (typeof window.notify === "function") window.notify("Chart saved as PNG", "success");
//           return;
//         } catch (e) {
//           console.warn("Canvas export failed, trying html2canvas", e);
//         }
//       }
//       html2canvas(container, {
//         useCORS: true,
//         allowTaint: true,
//         backgroundColor: bgColor,
//         scale: 2,
//         logging: false,
//       })
//         .then((canvas) => {
//           const link = document.createElement("a");
//           link.download = `chart-${selectedSymbol}-${selectedTimeframe}-${Date.now()}.png`;
//           link.href = canvas.toDataURL("image/png");
//           link.click();
//           if (typeof window.notify === "function") window.notify("Chart saved as PNG", "success");
//         })
//         .catch((err) => {
//           console.error("Chart screenshot failed", err);
//           if (typeof window.notify === "function") window.notify("Screenshot failed. Try again.", "error");
//         });
//     },
//   }), [selectedSymbol, selectedTimeframe, theme]);

//   // Convert candles to line/area format (use close price as value)
//   const lineAreaData = useMemo(() => {
//     if (candles.length === 0) return []
//     if (chartType === "line" || chartType === "area") {
//       return candles.map((candle) => ({
//         time: candle.time,
//         value: candle.close,
//       }));
//     }
//     return candles;
//   }, [candles, chartType]);

//   const handleBuyClick = (orderData) => {
//     // Order data contains: volume, stopLoss, takeProfit, comment, price
//     console.log('Buy Order:', orderData);
//     // If parent provides handler, use it; otherwise use local modal
//     if (onBuyClickProp) {
//       onBuyClickProp('BUY');
//     } else {
//       setModalOrderType('BUY');
//       setIsModalOpen(true);
//     }
//   };

//   const handleSellClick = (orderData) => {
//     // Order data contains: volume, stopLoss, takeProfit, comment, price
//     console.log('Sell Order:', orderData);
//     // If parent provides handler, use it; otherwise use local modal
//     if (onSellClickProp) {
//       onSellClickProp('SELL');
//     } else {
//       setModalOrderType('SELL');
//       setIsModalOpen(true);
//     }
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setModalOrderType(null);
//   };

//   // Initialize chart
//   useEffect(() => {
//     const container = containerRef.current;
//     if (!container) {
//       return;
//     }

//     // Get container dimensions for fixed sizing
//     const rect = container.getBoundingClientRect();

//     // Price labels: never show minus sign (trading prices are positive; library default can show minus)
//     const priceFormatter = (price) => {
//       const n = Math.abs(Number(price));
//       if (!Number.isFinite(n)) return '0';
//       if (n >= 1000) return n.toFixed(2);
//       if (n >= 1) return n.toFixed(4);
//       return n.toFixed(5);
//     };

//     const isLightTheme = theme === "light";

//     const chart = createChart(container, {
//       width: rect.width || container.clientWidth,
//       height: rect.height || container.clientHeight,
//       autoSize: true,
//       localization: {
//         priceFormatter,
//       },
//       layout: {
//         background: { color: isLightTheme ? "#FFFFFF" : "#0F1720" },
//         textColor: isLightTheme ? "#020617" : "#fff",
//         fontSize: 12,
//       },
//       grid: {
//         vertLines: {
//           visible: showGrid,
//           color: showGrid
//             ? isLightTheme
//               ? "rgba(100, 116, 139, 0.25)"
//               : "rgba(148, 163, 184, 0.2)"
//             : "transparent",
//           style: showGrid ? 0 : 0,
//         },
//         horzLines: {
//           visible: showGrid,
//           color: showGrid
//             ? isLightTheme
//               ? "rgba(100, 116, 139, 0.25)"
//               : "rgba(148, 163, 184, 0.2)"
//             : "transparent",
//           style: showGrid ? 0 : 0,
//         },
//       },
//       rightPriceScale: {
//         borderColor: isLightTheme ? "#e5e7eb" : "#1e293b",
//         autoScale: true,
//         scaleMargins: {
//           top: 0.1,
//           bottom: 0.1,
//         },
//         ticksVisible: true,
//         ensureEdgeTickMarksVisible: true,
//       },
//       leftPriceScale: {
//         visible: false,
//       },
//       timeScale: {
//         borderColor: isLightTheme ? "#e5e7eb" : "#1e293b",
//         timeVisible: true,
//         secondsVisible: false,
//         rightOffset: 10,
//         barSpacing: 3, // Increase spacing between candles for better visibility
//         minBarSpacing: 2,
//         shiftVisibleRangeOnNewBar: false, // We handle auto-scroll manually for better control
//         fixLeftEdge: false, // Allow scrolling to latest
//         fixRightEdge: false, // Allow scrolling to latest
//       },
//       crosshair: {
//         mode: activeTool === 1 ? 1 : 0, // 0 = Hidden, 1 = Normal (shows on hover), 2 = Magnet
//         vertLine: {
//           width: 1,
//           color: isLightTheme ? "#94a3b8" : "#64748b", // adjust for theme
//           style: 0, // Solid line (0 = solid, 1 = dotted, 2 = dashed)
//           labelBackgroundColor: isLightTheme ? "#e5e7eb" : "#1e293b",
//         },
//         horzLine: {
//           width: 1,
//           color: isLightTheme ? "#94a3b8" : "#64748b",
//           style: 0, // Solid line
//           labelBackgroundColor: isLightTheme ? "#e5e7eb" : "#1e293b",
//         },
//         // Professional crosshair settings
//         vertLineVisible: activeTool === 1,
//         horzLineVisible: activeTool === 1,
//       },
//       handleScroll: {
//         mouseWheel: true,
//         pressedMouseMove: activeTool === null || activeTool === 1,
//         horzTouchDrag: true,
//         vertTouchDrag: true,
//       },
//       handleScale: {
//         axisPressedMouseMove: {
//           time: true,
//           price: true,
//         },
//         axisDoubleClickReset: {
//           time: true,
//           price: true,
//         },
//         axisTouch: {
//           time: true,
//           price: true,
//         },
//         mouseWheel: true,
//         pinch: true,
//       },
//     });

//     // Default series: we start with candlesticks but will swap based on chartType
//     const candleSeries = chart.addCandlestickSeries({
//       upColor: "#26A69A",
//       downColor: "#EF5350",
//       wickUpColor: "#26A69A",
//       wickDownColor: "#EF5350",
//       borderVisible: false,
//     });

//     chartRef.current = chart;
//     seriesRef.current = candleSeries;

//     // Save zoom state when user manually scrolls/zooms
//     const timeScale = chart.timeScale();
//     const handleVisibleRangeChange = () => {
//       // Only save if chart is initialized and has candles
//       // This prevents saving zoom during initial load
//       if (hasInitializedRef.current && candles.length > 0) {
//         const visibleRange = timeScale.getVisibleRange();
//         if (visibleRange) {
//           saveZoomState(visibleRange);
//         }
//       }
//     };

//     // Subscribe to visible range changes
//     timeScale.subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

//     // Proper resize observer that uses resize method
//     const ro = new ResizeObserver((entries) => {
//       for (const entry of entries) {
//         const { width, height } = entry.contentRect;
//         if (width > 0 && height > 0 && chart) {
//           // Save zoom before resize
//           const currentRange = timeScale.getVisibleRange();
//           chart.resize(width, height);
//           // Restore zoom after resize if we had one
//           if (currentRange) {
//             setTimeout(() => {
//               try {
//                 timeScale.setVisibleRange(currentRange);
//               } catch (e) {
//                 // Ignore if range becomes invalid
//               }
//             }, 0);
//           }
//         }
//       }
//     });
//     ro.observe(container);

//     return () => {
//       timeScale.unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
//       ro.disconnect();
//       chart.remove();
//       chartRef.current = null;
//       seriesRef.current = null;
//       volumeSeriesRef.current = null;
//       drawingObjectsRef.current = [];
//     };
//   }, []);

//   // Update grid visibility
//   useEffect(() => {
//     if (!chartRef.current) return;
//     chartRef.current.applyOptions({
//       grid: {
//         vertLines: {
//           visible: showGrid,
//           color: showGrid ? "rgba(148, 163, 184, 0.2)" : "transparent",
//           style: showGrid ? 0 : 0,
//         },
//         horzLines: {
//           visible: showGrid,
//           color: showGrid ? "rgba(148, 163, 184, 0.2)" : "transparent",
//           style: showGrid ? 0 : 0,
//         },
//       },
//     });
//   }, [showGrid]);

//   // Apply theme (light/dark) to chart when theme changes
//   useEffect(() => {
//     const chart = chartRef.current;
//     if (!chart) return;
//     const isLight = theme === "light";
//     chart.applyOptions({
//       layout: {
//         background: { color: isLight ? "#FFFFFF" : "#0F1720" },
//         textColor: isLight ? "#020617" : "#fff",
//       },
//       grid: {
//         vertLines: {
//           color: showGrid ? (isLight ? "rgba(100, 116, 139, 0.25)" : "rgba(148, 163, 184, 0.2)") : "transparent",
//         },
//         horzLines: {
//           color: showGrid ? (isLight ? "rgba(100, 116, 139, 0.25)" : "rgba(148, 163, 184, 0.2)") : "transparent",
//         },
//       },
//       rightPriceScale: { borderColor: isLight ? "#e5e7eb" : "#1e293b" },
//       timeScale: { borderColor: isLight ? "#e5e7eb" : "#1e293b" },
//       crosshair: {
//         vertLine: { color: isLight ? "#94a3b8" : "#64748b", labelBackgroundColor: isLight ? "#e5e7eb" : "#1e293b" },
//         horzLine: { color: isLight ? "#94a3b8" : "#64748b", labelBackgroundColor: isLight ? "#e5e7eb" : "#1e293b" },
//       },
//     });
//   }, [theme, showGrid]);

//   // Update crosshair mode and chart lock (Professional Trading Terminal - Enhanced visibility)
//   useEffect(() => {
//     if (!chartRef.current) return;

//     // Disable chart panning when drawing tools are active (trendline, rectangle, fibonacci, parallellines, etc.)
//     const isDrawingTool = activeTool !== null && activeTool !== 1 && activeTool !== 0;
//     // When chart is locked, disable all pan and zoom
//     const panAllowed = !chartLocked && !isDrawingTool;
//     const zoomAllowed = !chartLocked;

//     chartRef.current.applyOptions({
//       crosshair: {
//         mode: activeTool === 1 ? 1 : 0, // 1 = Normal (always visible when tool active), 0 = Hidden
//         vertLine: {
//           visible: activeTool === 1,
//           width: 1,
//           color: theme === "light" ? "#94a3b8" : "#64748b",
//           style: 0, // Solid line
//           labelBackgroundColor: theme === "light" ? "#e5e7eb" : "#1e293b",
//         },
//         horzLine: {
//           visible: activeTool === 1,
//           width: 1,
//           color: theme === "light" ? "#94a3b8" : "#64748b",
//           style: 0, // Solid line
//           labelBackgroundColor: theme === "light" ? "#e5e7eb" : "#1e293b",
//         },
//       },
//       handleScroll: {
//         mouseWheel: zoomAllowed,
//         pressedMouseMove: panAllowed,
//         horzTouchDrag: panAllowed,
//         vertTouchDrag: panAllowed,
//       },
//       handleScale: {
//         axisPressedMouseMove: {
//           time: panAllowed,
//           price: panAllowed,
//         },
//         axisDoubleClickReset: {
//           time: zoomAllowed,
//           price: zoomAllowed,
//         },
//         axisTouch: {
//           time: panAllowed,
//           price: panAllowed,
//         },
//         mouseWheel: zoomAllowed,
//         pinch: zoomAllowed,
//       },
//     });
//   }, [activeTool, chartLocked]);

//   // Fetch historical candles when symbol or timeframe changes (PROFESSIONAL - Instant load like Binance)
//   useEffect(() => {
//     const fetchCandles = async () => {
//       if (!selectedSymbol || !selectedTimeframe) {
//         setCandles([])
//         hasInitializedRef.current = false // Reset on symbol change
//         return
//       }

//       try {
//         setCandlesLoading(true)
//         // CRITICAL: Reset candles to empty array FIRST when symbol changes
//         // This ensures chart data init effect knows we're waiting for new data
//         setCandles([])
//         hasInitializedRef.current = false // Reset initialization flag for new symbol

//         // CRITICAL: Clear chart immediately to prevent old/new data mixing (MT5/TradingView style)
//         if (seriesRef.current) {
//           try {
//             seriesRef.current.setData([]); // Clear immediately
//           } catch (e) {
//             // ignore errors
//           }
//         }

//         console.log(`📊 Fetching candles for ${selectedSymbol} @ ${selectedTimeframe}`)

//         // MT5/TradingView-style: request history range by timeframe so higher TFs get enough candles
//         const daysBack = getDaysBackForTimeframe(selectedTimeframe)
//         // Request enough bars for the range (e.g. M15 14 days = 1344 bars; M30 30 days = 1440 bars)
//         const limit = getLimitForTimeframe(selectedTimeframe, daysBack)

//         // Fetch candles from backend (Binance for crypto, Massive for forex)
//         const response = await axios.get(`${baseUrl}/api/chart/candles`, {
//           params: {
//             symbol: selectedSymbol,
//             timeframe: selectedTimeframe,
//             limit,
//             daysBack
//           },
//           timeout: 10000 // 10 second timeout
//         })



//         if (response.data && response.data.data && response.data.data.length > 0) {
//           const rawCandles = response.data.data
//           console.log(`✅ Loaded ${rawCandles.length} raw candles from server`)

//           // Diagnostic logging to identify misaligned symbols
//           if (import.meta.env?.DEV) {
//             console.log("RAW", selectedSymbol, rawCandles.slice(0, 5));
//             console.log("RAW last", selectedSymbol, rawCandles.slice(-5));
//             console.log("MOD60", selectedSymbol, rawCandles.slice(0, 5).map(c => normalizeTime(c.time) % 60));
//           }

//           // PROFESSIONAL: TradingView/MT5-style candle processing
//           // This handles: time normalization, validation, deduplication, outlier detection, timeframe alignment
//           const { candles: processedCandles, stats } = processCandles(
//             rawCandles,
//             selectedSymbol,
//             selectedTimeframe
//           );

//           if (processedCandles.length > 0) {
//             setCandles(processedCandles)

//             // Build candles map for quick updates
//             candlesMapRef.current = new Map()
//             processedCandles.forEach(c => {
//               candlesMapRef.current.set(c.time, c)
//             })
//           } else {
//             console.warn(`⚠️ No valid candles after processing for ${selectedSymbol}`)
//             setCandles([])
//           }
//         } else {
//           console.warn(`⚠️ No candle data returned for ${selectedSymbol}`)
//           // CRITICAL: Set empty candles - let chart data init effect handle initialization
//           // Don't set hasInitializedRef here - let the effect initialize with empty data
//           setCandles([])
//         }
//       } catch (error) {
//         console.error(`❌ Error fetching ${selectedSymbol}:`, error.message)
//         setCandles([]) // No fallback - show empty chart
//       } finally {
//         setCandlesLoading(false)
//       }
//     }

//     // Immediate fetch (no debounce for professional instant loading like Binance)
//     fetchCandles()
//   }, [selectedSymbol, selectedTimeframe]) // Removed bidPrice - not needed

//   // Setup Socket.io for real-time candle updates (Professional level - like Binance)
//   useEffect(() => {
//     if (!socketRef.current) {
//       socketRef.current = socketService.getSocket();
//     }

//     const socket = socketRef.current
//     let currentSymbol = selectedSymbol
//     let currentTimeframe = selectedTimeframe

//     // Handle connection events (only once)
//     const handleConnect = () => {
//       console.log('✅ Chart WebSocket connected')
//       // Subscribe immediately on connect
//       subscribeToCandles()
//     }

//     const handleDisconnect = () => {
//       console.log('⚠️ Chart WebSocket disconnected - will auto-reconnect')
//     }

//     const handleError = (error) => {
//       console.error('❌ Chart WebSocket connection error:', error)
//     }

//     socket.on('connect', handleConnect)
//     socket.on('disconnect', handleDisconnect)
//     socket.on('connect_error', handleError)

//     // Subscribe function (uses selectedSymbol - always current)
//     // PROFESSIONAL: Use symbol config for crypto detection
//     const subscribeToCandles = () => {
//       const isCrypto = isCryptoSymbol(selectedSymbol);

//       if (isCrypto && selectedSymbol && selectedTimeframe && socket.connected) {
//         console.log(`Subscribing to real-time candles: ${selectedSymbol}@${selectedTimeframe}`)
//         socket.emit('subscribeCandles', { symbol: selectedSymbol, timeframe: selectedTimeframe })
//       } else if (!isCrypto && selectedSymbol) {
//         console.log(`⚠️ Symbol ${selectedSymbol} is not a crypto symbol, skipping candle subscription`)
//       }
//     }

//     // Listen for real-time candle updates
//     // NOTE: We THROTTLE visual updates so candles don't "shake" too fast (more like MT5)
//     const handleCandleUpdate = (data) => {
//       // Quick validation
//       if (!data || !data.candle || !data.symbol) return

//       // Match symbol (case-insensitive) - use selectedSymbol (always current)
//       if (data.symbol.toUpperCase() !== selectedSymbol?.toUpperCase()) {
//         return // Not for this symbol
//       }

//       const { candle } = data

//       // PROFESSIONAL: Process single candle through engine (TradingView style)
//       // Pass timeframe to ensure proper alignment
//       const processedCandle = processSingleCandle(candle, selectedSymbol, selectedTimeframe);
//       if (!processedCandle) {
//         if (import.meta.env?.DEV) {
//           console.warn(`⚠️ Rejected realtime candle (invalid):`, { symbol: data.symbol, candle });
//         }
//         return; // Invalid candle, skip
//       }

//       // Throttle chart updates: at most once every 250ms per tab
//       // This keeps movement smooth but not "hyper-fast" compared to MT5
//       const now = Date.now()
//       if (now - lastCandleRenderRef.current < 200) {
//         return
//       }
//       lastCandleRenderRef.current = now

//       const timeScale = chartRef.current?.timeScale()
//       const currentVisibleRange = timeScale?.getVisibleRange()
//       const s = seriesRef.current
//       const c = chartRef.current

//       if (!s || !c || !hasInitializedRef.current) {
//         return // Chart not ready
//       }

//       // Update candle immediately (NO setData - preserves zoom, avoids React re-render loops)
//       try {
//         // Use processed candle (already normalized and validated)
//         if (chartType === 'line' || chartType === 'area') {
//           s.update({ time: processedCandle.time, value: processedCandle.close })
//         } else {
//           s.update({
//             time: processedCandle.time,
//             open: processedCandle.open,
//             high: processedCandle.high,
//             low: processedCandle.low,
//             close: processedCandle.close
//           })
//         }

//         // Update candles map for consistency
//         candlesMapRef.current.set(processedCandle.time, processedCandle);

//         // Preserve user's zoom and position
//         if (timeScale && currentVisibleRange) {
//           saveZoomState(currentVisibleRange);
//         }
//       } catch (e) {
//         console.error('❌ Error updating candle:', e)
//       }
//     }

//     // Register listener FIRST
//     socket.on('candleUpdate', handleCandleUpdate)

//     // Subscribe immediately if connected, otherwise wait
//     if (socket.connected) {
//       subscribeToCandles()
//     }

//     // Cleanup on symbol/timeframe change
//     return () => {
//       // Remove listeners
//       socket.off('candleUpdate', handleCandleUpdate)
//       socket.off('connect', handleConnect)
//       socket.off('disconnect', handleDisconnect)
//       socket.off('connect_error', handleError)

//       // Unsubscribe from OLD symbol (before it changes to new one)
//       // PROFESSIONAL: Use symbol config for crypto detection
//       if (selectedSymbol && selectedTimeframe && socket.connected) {
//         const isCrypto = isCryptoSymbol(selectedSymbol);
//         if (isCrypto) {
//           console.log(`🔌 Unsubscribing from: ${selectedSymbol}@${selectedTimeframe}`)
//           socket.emit('unsubscribeCandles', { symbol: selectedSymbol, timeframe: selectedTimeframe })
//         }
//       }
//     }
//   }, [selectedSymbol, selectedTimeframe]) // Re-run on symbol/timeframe change

//   // Initialize data when candles first load (PROFESSIONAL - Instant chart display like Binance)
//   useEffect(() => {
//     const s = seriesRef.current;
//     const c = chartRef.current;

//     if (!s || !c) {
//       return;
//     }

//     // CRITICAL FIX: Only return early if candles are empty AND we're not waiting for initial load
//     // If hasInitialized is false, we should wait for candles to arrive (don't return early)
//     if (candles.length === 0 && hasInitializedRef.current) {
//       return;
//     }

//     // If no candles yet but not initialized, wait (effect will re-run when candles arrive)
//     // BUT: If candlesLoading is false, it means fetch completed with no data - don't wait forever
//     if (candles.length === 0 && !hasInitializedRef.current) {
//       // Only wait if candles are still loading, otherwise initialize with empty data
//       if (candlesLoading) {
//         return; // Still loading, wait for data
//       }
//       // Loading complete but no data - initialize empty chart (will show empty state)
//       // Initialize with empty data - chart will show empty state
//       const timeScale = c.timeScale();
//       s.setData([]); // Set empty data
//       timeScale.fitContent();
//       // DON'T set hasInitializedRef.current = true here
//       // Wait for actual candles to arrive before marking as initialized
//       return; // Done initializing empty chart
//     }

//     // Only setData on initial load (when hasInitializedRef is false)
//     // This prevents resetting zoom on every real-time update
//     if (!hasInitializedRef.current) {
//       const timeScale = c.timeScale();
//       const currentKey = getZoomKey(selectedSymbol, selectedTimeframe);
//       const symbolTimeframeChanged = lastSymbolTimeframeRef.current !== currentKey;

//       // Update tracking AFTER checking for change
//       lastSymbolTimeframeRef.current = currentKey;

//       // Candles from processCandles() are already fully processed:
//       // - Normalized times
//       // - Aligned to timeframe buckets
//       // - Deduplicated (last-wins)
//       // - Gap-filled with placeholder candles
//       // Use them directly without re-processing to preserve gap-filled structure

//       if (chartType === 'line' || chartType === 'area') {
//         // For line/area charts, extract close prices from already-processed candles
//         const lineAreaData = candles.map(c => ({
//           time: c.time, // Already normalized and aligned
//           value: c.close
//         })).filter(c => c.time != null);

//         // Ensure sorted (should already be sorted, but safety check)
//         const sortedData = [...lineAreaData].sort((a, b) => a.time - b.time);
//         if (sortedData.length > 0) {
//           s.setData(sortedData);
//         }
//       } else {
//         // For candlestick charts, use processed candles directly
//         // Only ensure sorted (should already be sorted, but safety check)
//         const sortedCandles = [...candles].sort((a, b) => a.time - b.time);
//         if (sortedCandles.length > 0) {
//           s.setData(sortedCandles);
//         }
//       }

//       // MT5/TradingView style: Always fitContent on initial load
//       // This ensures all candles (including gap-filled ones) are visible
//       // Don't restore zoom state until user manually zooms
//       timeScale.fitContent();

//       // Nudge right price scale so horizontal grid lines (tied to price ticks) recompute
//       try {
//         c.priceScale('right').applyOptions({
//           borderColor: '#1e293b',
//           autoScale: true,
//           scaleMargins: { top: 0.1, bottom: 0.1 },
//           ticksVisible: true,
//           ensureEdgeTickMarksVisible: true,
//         });
//       } catch (_) { /* ignore */ }

//       hasInitializedRef.current = true;
//       saveZoomState(timeScale.getVisibleRange());
//     }
//     // Real-time updates will use s.update() directly (handled in socket listener)
//     // }, [candles.length, chartType, selectedSymbol]); // Added selectedSymbol to reset on symbol change
//   }, [candles.length, chartType, selectedSymbol, selectedTimeframe]);

//   // Switch chart type (bars, candles, line, area) - preserve zoom
//   useEffect(() => {
//     const chart = chartRef.current;
//     if (!chart || !hasInitializedRef.current || candles.length === 0) return;

//     // Only run when chartType actually changes, not on every candle update
//     const timeScale = chart.timeScale();
//     const visibleRange = timeScale.getVisibleRange() || getZoomState();

//     // Remove old series if exists
//     if (seriesRef.current) {
//       try {
//         chart.removeSeries(seriesRef.current);
//       } catch (e) {
//         // ignore
//       }
//     }

//     // Remove old volume series if exists
//     if (volumeSeriesRef.current) {
//       try {
//         chart.removeSeries(volumeSeriesRef.current);
//         volumeSeriesRef.current = null;
//       } catch (e) {
//         // ignore
//       }
//     }

//     let newSeries;

//     if (chartType === "bars") {
//       newSeries = chart.addBarSeries({
//         upColor: "#26A69A", // Green
//         downColor: "#EF5350", // Red
//         borderUpColor: "#26A69A",
//         borderDownColor: "#EF5350",
//         // priceScaleId: 'right', // Use default price scale
//         scaleMargins: {
//           top: 0.1,
//           bottom: 0.1, // Normal margins when no volume
//         },
//       });
//       // Candles are already processed (normalized, aligned, deduplicated, gap-filled)
//       // Use them directly to preserve gap-filled structure
//       const sortedCandles = [...candles].sort((a, b) => a.time - b.time);
//       if (sortedCandles.length > 0) {
//         newSeries.setData(sortedCandles);
//       }
//     } else if (chartType === "line") {
//       newSeries = chart.addLineSeries({
//         color: "#38bdf8",
//         lineWidth: 2,
//         priceLineVisible: false,
//         lastValueVisible: true,
//         // priceScaleId: 'right', // Use default price scale
//         scaleMargins: {
//           top: 0.1,
//           bottom: 0.1, // Normal margins when no volume
//         },
//       });
//       const validatedLineData = ensureAscendingTimeOrder(lineAreaData);
//       if (validatedLineData.length > 0) {
//         newSeries.setData(validatedLineData);
//       }
//     } else if (chartType === "area") {
//       newSeries = chart.addAreaSeries({
//         lineColor: "#38bdf8",
//         topColor: "rgba(56,189,248,0.4)",
//         bottomColor: "rgba(56,189,248,0.0)",
//         lineWidth: 2,
//         priceLineVisible: false,
//         lastValueVisible: true,
//         // priceScaleId: '', // Use default price scale
//         scaleMargins: {
//           top: 0.1,
//           bottom: 0.1, // Normal margins when no volume
//         },
//       });
//       const validatedAreaData = ensureAscendingTimeOrder(lineAreaData);
//       if (validatedAreaData.length > 0) {
//         newSeries.setData(validatedAreaData);
//       }
//     }
    
//     // else if (chartType === "volume ticks" || chartType === "volume") {
//     //   // For volume types: show candlesticks as main chart
//     //   newSeries = chart.addCandlestickSeries({
//     //     upColor: "#26A69A", // Green
//     //     downColor: "#EF5350", // Red
//     //     wickUpColor: "#26A69A",
//     //     wickDownColor: "#EF5350",
//     //     borderVisible: false,
//     //     // priceScaleId: '', // Use default (left) price scale
//     //     scaleMargins: {
//     //       top: 0.1,
//     //       bottom: 0.3, // Leave 30% space at bottom for volume
//     //     },
//     //   });
//     //   // Candles are already processed (normalized, aligned, deduplicated, gap-filled)
//     //   // Use them directly to preserve gap-filled structure
//     //   const sortedCandles = [...candles].sort((a, b) => a.time - b.time);
//     //   if (sortedCandles.length > 0) {
//     //     newSeries.setData(sortedCandles);
//     //   }

//     //   // Add volume histogram series below the main chart
//     //   // Use right price scale with proper margins to push volume to bottom
//     //   const volumeSeries = chart.addHistogramSeries({
//     //     priceFormat: {
//     //       type: 'volume',
//     //     },
//     //     // priceScaleId: 'right', // Use right price scale for volume (separate from main chart)
//     //     scaleMargins: {
//     //       top: 0.7, // Start volume at 70% from top (30% space for volume at bottom)
//     //       bottom: 0.0, // Volume goes to the very bottom
//     //     },
//     //     color: "#26a69a",
//     //     lineWidth: 1,
//     //     priceLineVisible: false,
//     //     lastValueVisible: false,
//     //     baseLineVisible: false,
//     //   });

//     //   // Prepare volume data from candles
//     //   // const volumeData = deduplicatedCandles.map(candle => ({
//     //   //   time: candle.time,
//     //   //   value: candle.volume || 0,
//     //   //   color: candle.close >= candle.open ? '#26a69a' : '#ef5350', // Green for up, red for down
//     //   // }));
//     //   const volumeData = sortedCandles.map(candle => ({
//     //     time: candle.time,
//     //     value: candle.volume || 0,
//     //     color: candle.close >= candle.open ? '#26a69a' : '#ef5350',
//     //   }));


//     //   if (volumeData.length > 0) {
//     //     volumeSeries.setData(volumeData);
//     //   }

//     //   volumeSeriesRef.current = volumeSeries;
//     // }
//      else if (chartType === "volume ticks" || chartType === "volume") {
//   // ✅ 1) Main candles ALWAYS on RIGHT price scale
//   newSeries = chart.addCandlestickSeries({
//     upColor: "#26A69A",
//     downColor: "#EF5350",
//     wickUpColor: "#26A69A",
//     wickDownColor: "#EF5350",
//     borderVisible: false,
//     priceScaleId: "right", // ✅ FIX: lock candles to right price scale
//   });

//   const sortedCandles = [...candles].sort((a, b) => a.time - b.time);
//   if (sortedCandles.length > 0) newSeries.setData(sortedCandles);

//   // ✅ 2) Create separate scale for volume (so it doesn't crush price candles)
//   // const volumeSeries = chart.addHistogramSeries({
//   //   priceFormat: { type: "volume" },
//   //   priceScaleId: "vol", // ✅ FIX: separate scale
//   //   base: 0,             // ✅ FIX: start volume from bottom (0)
//   //   priceLineVisible: false,
//   //   lastValueVisible: false,
//   // });
//   const volumeSeries = chart.addHistogramSeries({
//   priceFormat: { type: "volume" },
//   priceScaleId: "vol",
//   base: 0,
//   priceLineVisible: false,
//   lastValueVisible: false,

//   // ✅ Dim / subtle volume like TradingView
//   color: "rgba(38,166,154,0.15)", // default green (dim)
// });


//   // ✅ 3) Set margins on each scale (pro style)
//   chart.priceScale("right").applyOptions({
//     scaleMargins: { top: 0.05, bottom: 0.30 }, // candles top/bottom space
//   });

//   chart.priceScale("vol").applyOptions({
//     scaleMargins: { top: 0.75, bottom: 0.00 }, // volume at bottom
//     visible: false, // ✅ hide volume axis like TradingView
//   });

//   // ✅ 4) Volume data
//   // const volumeData = sortedCandles.map((candle) => ({
//   //   time: candle.time,
//   //   value: candle.volume || 0,
//   //   color: candle.close >= candle.open ? "#26a69a" : "#ef5350",
//   // }));
//   const volumeData = sortedCandles.map((candle) => ({
//   time: candle.time,
//   value: candle.volume || 0,
//   color: candle.close >= candle.open
//     ? "rgba(38,166,154,0.25)"
//     : "rgba(239,83,80,0.25)",
// }));


//   if (volumeData.length > 0) volumeSeries.setData(volumeData);

//   volumeSeriesRef.current = volumeSeries;
// }

    
    
//     else {
//       // default: candlesticks
//       newSeries = chart.addCandlestickSeries({
//         upColor: "#26A69A", // Green
//         downColor: "#EF5350", // Red
//         wickUpColor: "#26A69A",
//         wickDownColor: "#EF5350",
//         borderVisible: false,
//         // priceScaleId: '', // Use default price scale
//         scaleMargins: {
//           top: 0.1,
//           bottom: 0.1, // Normal margins when no volume
//         },
//       });
//       // Candles are already processed (normalized, aligned, deduplicated, gap-filled)
//       // Use them directly to preserve gap-filled structure
//       const sortedCandles = [...candles].sort((a, b) => a.time - b.time);
//       if (sortedCandles.length > 0) {
//         newSeries.setData(sortedCandles);
//       }
//     }
//     seriesRef.current = newSeries;

//     // Restore zoom state after series change
//     if (visibleRange && hasInitializedRef.current) {
//       // Use setTimeout to ensure series is fully initialized before restoring zoom
//       setTimeout(() => {
//         try {
//           timeScale.setVisibleRange(visibleRange);
//           saveZoomState(visibleRange);
//         } catch (e) {
//           // If restoration fails, try to maintain reasonable visible range
//           if (candles.length > 0) {
//             try {
//               const lastCandleTime = candles[candles.length - 1].time;
//               const firstVisibleTime = lastCandleTime - (100 * 60); // Show last 100 candles
//               timeScale.setVisibleRange({ from: firstVisibleTime, to: lastCandleTime });
//               saveZoomState(timeScale.getVisibleRange());
//             } catch (e2) {
//               // Fallback: fit content
//               timeScale.fitContent();
//               saveZoomState(timeScale.getVisibleRange());
//             }
//           }
//         }
//         // Nudge right price scale so horizontal grid lines recompute after series/data change
//         try {
//           chart.priceScale('right').applyOptions({
//             borderColor: '#1e293b',
//             autoScale: true,
//             scaleMargins: { top: 0.1, bottom: 0.1 },
//             ticksVisible: true,
//             ensureEdgeTickMarksVisible: true,
//           });
//         } catch (_) { /* ignore */ }
//       }, 0);
//     } else if (!hasInitializedRef.current) {
//       timeScale.fitContent();
//       try {
//         chart.priceScale('right').applyOptions({
//           borderColor: '#1e293b',
//           autoScale: true,
//           scaleMargins: { top: 0.1, bottom: 0.1 },
//           ticksVisible: true,
//           ensureEdgeTickMarksVisible: true,
//         });
//       } catch (_) { /* ignore */ }
//       hasInitializedRef.current = true;
//       saveZoomState(timeScale.getVisibleRange());
//     }
//   }, [chartType, candles.length, lineAreaData.length]); // Only depend on lengths to avoid re-running on every candle update

//   // Update volume series when candles change (for volume and volume ticks chart types)
//   useEffect(() => {
//     const chart = chartRef.current;
//     const volumeSeries = volumeSeriesRef.current;
//     if (!chart || !volumeSeries || !hasInitializedRef.current || candles.length === 0) return;
//     if (chartType !== "volume" && chartType !== "volume ticks") return;

//     // Candles are already processed (normalized, aligned, deduplicated, gap-filled)
//     // Use them directly to preserve gap-filled structure
//     const sortedCandles = [...candles].sort((a, b) => a.time - b.time);

//     const volumeData = sortedCandles.map(candle => ({
//       time: candle.time,
//       value: candle.volume || 0,
//       color: candle.close >= candle.open
//   ? "rgba(38,166,154,0.25)"
//   : "rgba(239,83,80,0.25)",

//       // color: candle.close >= candle.open ? '#26a69a' : '#ef5350', // Green for up, red for down
//     }));

//     if (volumeData.length > 0) {
//       volumeSeries.setData(volumeData);
//     }
//   }, [candles, chartType]); // Update when candles or chartType changes

//   // Drawing functionality (drag-based: mousedown → mousemove → mouseup)
//   useEffect(() => {
//     const chart = chartRef.current;
//     const series = seriesRef.current;
//     const container = containerRef.current;
//     if (!chart || !series || !container) return;

//     const tools = [
//       null, // 0: Menu
//       null, // 1: Crosshair (handled above)
//       "trendline", // 2: Trend Line
//       "parallellines", // 3: Parallel Lines
//       "fibonacci", // 4: Fibonacci Retracement
//       "rectangle", // 5: Rectangle
//       "pricelevel", // 6: Price Levels
//       "text", // 7: Text (later)
//       null, // 8: Visibility
//       null, // 9: Lock
//       null, // 10: Magnet
//       null, // 11: Delete
//       null, // 12: Settings
//       null, // 13: Object Tree
//       null, // 14: Grid
//       null, // 15: History
//       null, // 16: Layout
//     ];

//     const toolType = activeTool !== null ? tools[activeTool] : null;

//     // Reset draft when no tool selected
//     if (!toolType) {
//       isDrawingRef.current = false;
//       startPointRef.current = null;
//       endPointRef.current = null;
//       trendLineFirstPointRef.current = null;
//       if (currentDrawingRef.current?.series) {
//         try {
//           chart.removeSeries(currentDrawingRef.current.series);
//         } catch (e) { }
//       }
//       currentDrawingRef.current = null;
//       return;
//     }

//     // Price Level: single click
//     if (toolType === "pricelevel") {
//       const handlePriceLevelClick = (e) => {
//         const rect = container.getBoundingClientRect();
//         const x = e.clientX - rect.left;
//         const y = e.clientY - rect.top;

//         const time = chart.timeScale().coordinateToTime(x);
//         const price = series.coordinateToPrice(y);

//         if (time == null || price == null) return;

//         const priceLine = series.createPriceLine({
//           price,
//           color: "#3b82f6",
//           lineWidth: 2,
//           lineStyle: 2,
//           axisLabelVisible: true,
//           title: price.toFixed(5),
//         });

//         const newObject = { type: "pricelevel", priceLine, price };
//         setChartObjects((prev) => [...prev, newObject]);
//         drawingObjectsRef.current.push(newObject);
//       };

//       container.addEventListener("click", handlePriceLevelClick);
//       return () => {
//         container.removeEventListener("click", handlePriceLevelClick);
//       };
//     }

//     // Trend Line: two-click flow (first click = start, mousemove = preview, second click = end; then deselect)
//     if (toolType === "trendline") {
//       const handleTrendLineClick = (e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         e.stopImmediatePropagation();

//         const rect = container.getBoundingClientRect();
//         const x = e.clientX - rect.left;
//         const y = e.clientY - rect.top;

//         let time = chart.timeScale().coordinateToTime(x);
//         const price = series.coordinateToPrice(y);
//         if (time == null || price == null) return;

//         time = normalizeTime(time);
//         if (time == null) return;

//         if (trendLineFirstPointRef.current === null) {
//           // First click: set start point and create preview series
//           trendLineFirstPointRef.current = { time, price };
//           const lineSeries = chart.addLineSeries({
//             color: "#22c55e",
//             lineWidth: 2,
//             priceLineVisible: false,
//             lastValueVisible: false,
//           });
//           currentDrawingRef.current = { type: "trendline", series: lineSeries };
//           lineSeries.setData([{ time, value: price }]);
//         } else {
//           // Second click: finalize line and deselect tool
//           const firstPoint = trendLineFirstPointRef.current;
//           const endPoint = { time, price };

//           const minTimeDiff = 1;
//           const minPriceDiff = 0.00001;
//           const timeDiff = Math.abs(endPoint.time - firstPoint.time);
//           const priceDiff = Math.abs(endPoint.price - firstPoint.price);
//           if (timeDiff < minTimeDiff && priceDiff < minPriceDiff) {
//             try {
//               chart.removeSeries(currentDrawingRef.current.series);
//             } catch (err) { }
//             trendLineFirstPointRef.current = null;
//             currentDrawingRef.current = null;
//             return;
//           }

//           const point1 = { time: firstPoint.time, price: firstPoint.price };
//           const point2 = { time: endPoint.time, price: endPoint.price };
//           const lineData = ensureAscendingTimeOrder([
//             { time: point1.time, value: point1.price },
//             { time: point2.time, value: point2.price },
//           ]);
//           if (lineData.length > 0) {
//             currentDrawingRef.current.series.setData(lineData);
//             const trendLineObj = {
//               type: "trendline",
//               series: currentDrawingRef.current.series,
//               point1,
//               point2,
//             };
//             setChartObjects((prev) => [...prev, trendLineObj]);
//             drawingObjectsRef.current.push(trendLineObj);
//           }

//           setActiveTool(null);
//           trendLineFirstPointRef.current = null;
//           currentDrawingRef.current = null;
//         }
//       };

//       const handleTrendLineMouseMove = (e) => {
//         if (trendLineFirstPointRef.current === null || currentDrawingRef.current?.type !== "trendline") return;
//         e.preventDefault();
//         e.stopPropagation();

//         const rect = container.getBoundingClientRect();
//         const x = e.clientX - rect.left;
//         const y = e.clientY - rect.top;

//         let time = chart.timeScale().coordinateToTime(x);
//         const price = series.coordinateToPrice(y);
//         if (time == null || price == null) return;

//         time = normalizeTime(time);
//         if (time == null) return;

//         const firstPoint = trendLineFirstPointRef.current;
//         const lineData = ensureAscendingTimeOrder([
//           { time: firstPoint.time, value: firstPoint.price },
//           { time, value: price },
//         ]);
//         if (lineData.length > 0) {
//           currentDrawingRef.current.series.setData(lineData);
//         }
//       };

//       const handleMouseMovePreventPan = (e) => {
//         e.stopPropagation();
//       };

//       const options = { capture: true, passive: false };
//       container.addEventListener("click", handleTrendLineClick, options);
//       container.addEventListener("mousemove", handleTrendLineMouseMove, options);
//       container.addEventListener("mousemove", handleMouseMovePreventPan, options);

//       return () => {
//         trendLineFirstPointRef.current = null;
//         if (currentDrawingRef.current?.type === "trendline" && currentDrawingRef.current?.series) {
//           try {
//             chart.removeSeries(currentDrawingRef.current.series);
//           } catch (err) { }
//           currentDrawingRef.current = null;
//         }
//         container.removeEventListener("click", handleTrendLineClick, options);
//         container.removeEventListener("mousemove", handleTrendLineMouseMove, options);
//         container.removeEventListener("mousemove", handleMouseMovePreventPan, options);
//       };
//     }

//     // Parallel Channel: 3-click flow (base line p1–p2, then p3 for offset; draw-only, no edit)
//     if (toolType === "parallellines") {
//       const options = { capture: true, passive: false };
//       const handleParallelChannelClick = (e) => {
//         e.preventDefault();
//         e.stopPropagation();
//         e.stopImmediatePropagation();

//         const rect = container.getBoundingClientRect();
//         const x = e.clientX - rect.left;
//         const y = e.clientY - rect.top;

//         let time = chart.timeScale().coordinateToTime(x);
//         const price = series.coordinateToPrice(y);
//         if (time == null || price == null) return;

//         time = normalizeTime(time);
//         if (time == null) return;

//         const point = { time, price };
//         const pts = parallelChannelPointsRef.current;

//         if (pts.length === 0) {
//           parallelChannelPointsRef.current = [point];
//           const lineSeries = chart.addLineSeries({
//             color: "#8b5cf6",
//             lineWidth: 2,
//             priceLineVisible: false,
//             lastValueVisible: false,
//           });
//           lineSeries.setData([{ time, value: price }]);
//           currentDrawingRef.current = { type: "parallellines", series: lineSeries, previewLine: null };
//         } else if (pts.length === 1) {
//           parallelChannelPointsRef.current = [pts[0], point];
//           const lineData = ensureAscendingTimeOrder([
//             { time: pts[0].time, value: pts[0].price },
//             { time, value: price },
//           ]);
//           if (lineData.length > 0) currentDrawingRef.current.series.setData(lineData);
//           currentDrawingRef.current.previewLine = chart.addLineSeries({
//             color: "#8b5cf6",
//             lineWidth: 2,
//             lineStyle: 2,
//             priceLineVisible: false,
//             lastValueVisible: false,
//           });
//           const parPreview = computeParallelLineFromThreePoints(chart, series, pts[0], point, point);
//           if (parPreview) {
//             currentDrawingRef.current.previewLine.setData(ensureAscendingTimeOrder([
//               { time: parPreview[0].time, value: parPreview[0].price },
//               { time: parPreview[1].time, value: parPreview[1].price },
//             ]));
//           }
//         } else {
//           const [p1, p2] = pts;
//           const p3 = point;
//           if (currentDrawingRef.current?.previewLine) {
//             try { chart.removeSeries(currentDrawingRef.current.previewLine); } catch (err) { }
//             currentDrawingRef.current.previewLine = null;
//           }
//           const baseLine = currentDrawingRef.current?.series;
//           if (!baseLine) return;
//           const parPoints = computeParallelLineFromThreePoints(chart, series, p1, p2, p3);
//           if (!parPoints) return;
//           const parallelLine = chart.addLineSeries({
//             color: "#8b5cf6",
//             lineWidth: 2,
//             priceLineVisible: false,
//             lastValueVisible: false,
//           });
//           baseLine.setData(ensureAscendingTimeOrder([
//             { time: p1.time, value: p1.price },
//             { time: p2.time, value: p2.price },
//           ]));
//           parallelLine.setData(ensureAscendingTimeOrder([
//             { time: parPoints[0].time, value: parPoints[0].price },
//             { time: parPoints[1].time, value: parPoints[1].price },
//           ]));
//           const parallelChannelObject = {
//             type: "parallellines",
//             point1: p1,
//             point2: p2,
//             point3: p3,
//             baseLine,
//             parallelLine,
//           };
//           setChartObjects((prev) => [...prev, parallelChannelObject]);
//           drawingObjectsRef.current.push(parallelChannelObject);
//           setActiveTool(null);
//           parallelChannelPointsRef.current = [];
//           currentDrawingRef.current = null;
//         }
//       };

//       const handleParallelChannelMouseMove = (e) => {
//         const pts = parallelChannelPointsRef.current;
//         if (pts.length !== 1 || !currentDrawingRef.current?.series) return;
//         const rect = container.getBoundingClientRect();
//         const x = e.clientX - rect.left;
//         const y = e.clientY - rect.top;
//         let time = chart.timeScale().coordinateToTime(x);
//         const price = series.coordinateToPrice(y);
//         if (time == null || price == null) return;
//         time = normalizeTime(time);
//         if (time == null) return;
//         const lineData = ensureAscendingTimeOrder([
//           { time: pts[0].time, value: pts[0].price },
//           { time, value: price },
//         ]);
//         if (lineData.length > 0) currentDrawingRef.current.series.setData(lineData);
//       };

//       const handleParallelChannelMouseMoveTwo = (e) => {
//         const pts = parallelChannelPointsRef.current;
//         if (pts.length !== 2 || !currentDrawingRef.current?.previewLine) return;
//         const rect = container.getBoundingClientRect();
//         const x = e.clientX - rect.left;
//         const y = e.clientY - rect.top;
//         let time = chart.timeScale().coordinateToTime(x);
//         const price = series.coordinateToPrice(y);
//         if (time == null || price == null) return;
//         time = normalizeTime(time);
//         if (time == null) return;
//         const p3 = { time, price };
//         const parPreview = computeParallelLineFromThreePoints(chart, series, pts[0], pts[1], p3);
//         if (parPreview) {
//           currentDrawingRef.current.previewLine.setData(ensureAscendingTimeOrder([
//             { time: parPreview[0].time, value: parPreview[0].price },
//             { time: parPreview[1].time, value: parPreview[1].price },
//           ]));
//         }
//       };

//       const onMove = (e) => {
//         handleParallelChannelMouseMove(e);
//         handleParallelChannelMouseMoveTwo(e);
//       };

//       const handleMouseMovePreventPan = (e) => {
//         e.stopPropagation();
//       };

//       container.addEventListener("click", handleParallelChannelClick, options);
//       container.addEventListener("mousemove", onMove, options);
//       container.addEventListener("mousemove", handleMouseMovePreventPan, options);

//       return () => {
//         parallelChannelPointsRef.current = [];
//         if (currentDrawingRef.current?.type === "parallellines") {
//           try {
//             if (currentDrawingRef.current.series) chart.removeSeries(currentDrawingRef.current.series);
//             if (currentDrawingRef.current.previewLine) chart.removeSeries(currentDrawingRef.current.previewLine);
//           } catch (err) { }
//           currentDrawingRef.current = null;
//         }
//         container.removeEventListener("click", handleParallelChannelClick, options);
//         container.removeEventListener("mousemove", onMove, options);
//         container.removeEventListener("mousemove", handleMouseMovePreventPan, options);
//       };
//     }

//     // Rectangle, Fibonacci: drag-based (mousedown → mousemove → mouseup). Parallel lines use 3-click above.
//     // Clear trend line state when using drag tools (user switched from trendline)
//     trendLineFirstPointRef.current = null;
//     if (currentDrawingRef.current?.type === "trendline" && currentDrawingRef.current?.series) {
//       try {
//         chart.removeSeries(currentDrawingRef.current.series);
//       } catch (err) { }
//       currentDrawingRef.current = null;
//     }

//     const handleMouseDown = (e) => {
//       // CRITICAL: Prevent default and stop propagation to prevent chart panning
//       e.preventDefault();
//       e.stopPropagation();
//       e.stopImmediatePropagation();

//       if (toolType === "trendline" || toolType === "parallellines") return;
//       if (toolType !== "rectangle" && toolType !== "fibonacci") return;

//       const rect = container.getBoundingClientRect();
//       const x = e.clientX - rect.left;
//       const y = e.clientY - rect.top;

//       // Get time and price at EXACT click position (before any chart pan)
//       let time = chart.timeScale().coordinateToTime(x);
//       const price = series.coordinateToPrice(y);

//       if (time == null || price == null) return;

//       // Professional: Normalize time to integer UTC timestamp
//       time = normalizeTime(time);
//       if (time == null) return;

//       // Set drawing state and capture start point EXACTLY where user clicked
//       isDrawingRef.current = true;
//       startPointRef.current = { time, price };
//       endPointRef.current = null; // Reset end point

//       if (toolType === "rectangle") {
//         // Rectangle: single BaselineSeries (fill between top and bottom over time range)
//         const rectSeries = chart.addBaselineSeries({
//           baseValue: { type: "price", price: price },
//           topLineColor: "#2563eb",
//           bottomLineColor: "#2563eb",
//           topFillColor1: "rgba(59, 130, 246, 0.38)",
//           topFillColor2: "rgba(59, 130, 246, 0.22)",
//           bottomFillColor1: "rgba(59, 130, 246, 0.22)",
//           bottomFillColor2: "rgba(59, 130, 246, 0.38)",
//           priceLineVisible: false,
//           lastValueVisible: false,
//           lineWidth: 2,
//           lineStyle: 0,
//         });
//         currentDrawingRef.current = {
//           type: "rectangle",
//           series: rectSeries,
//         };
//       }

//       if (toolType === "fibonacci") {
//         // For Fibonacci, we'll show a preview line while dragging
//         const fibLineSeries = chart.addLineSeries({
//           color: "#f59e0b",
//           lineWidth: 2,
//           priceLineVisible: false,
//           lastValueVisible: false,
//         });
//         currentDrawingRef.current = {
//           type: "fibonacci",
//           series: fibLineSeries,
//           priceLines: [], // Will store Fibonacci level price lines
//         };
//       }

//       if (toolType === "parallellines") {
//         // Parallel Lines: First line (like trendline), then second parallel line
//         const lineSeries = chart.addLineSeries({
//           color: "#8b5cf6",
//           lineWidth: 2,
//           priceLineVisible: false,
//           lastValueVisible: false,
//         });
//         currentDrawingRef.current = {
//           type: "parallellines",
//           series: lineSeries,
//           firstLine: null, // Will store first line data
//           secondLine: null, // Will store second line series
//         };
//       }

//     };

//     const handleMouseMove = (e) => {
//       if (!isDrawingRef.current || !startPointRef.current || !currentDrawingRef.current) return;

//       // CRITICAL: Prevent default and stop propagation to prevent chart panning during drag
//       e.preventDefault();
//       e.stopPropagation();
//       e.stopImmediatePropagation();

//       const rect = container.getBoundingClientRect();
//       const x = e.clientX - rect.left;
//       const y = e.clientY - rect.top;

//       // Get current mouse position coordinates
//       let time = chart.timeScale().coordinateToTime(x);
//       const price = series.coordinateToPrice(y);

//       if (time == null || price == null) return;

//       // Professional: Normalize time to integer UTC timestamp
//       time = normalizeTime(time);
//       if (time == null) return;

//       // Update end point for all tools
//       endPointRef.current = { time, price };

//       const start = startPointRef.current;

//       if (currentDrawingRef.current.type === "rectangle") {
//         const topPrice = Math.max(start.price, price);
//         const bottomPrice = Math.min(start.price, price);
//         const leftTime = normalizeTime(Math.min(start.time, time));
//         const rightTime = normalizeTime(Math.max(start.time, time));
//         if (leftTime == null || rightTime == null) return;
//         if (Math.abs(rightTime - leftTime) < 1 || Math.abs(topPrice - bottomPrice) < 0.00001) return;
//         const rectSeries = currentDrawingRef.current.series;
//         rectSeries.setData(
//           ensureAscendingTimeOrder([
//             { time: leftTime, value: topPrice },
//             { time: rightTime, value: topPrice },
//           ])
//         );
//         rectSeries.applyOptions({ baseValue: { type: "price", price: bottomPrice } });
//       }

//       if (currentDrawingRef.current.type === "fibonacci") {
//         // Show preview line while dragging
//         const fibData = [
//           { time: start.time, value: start.price },
//           { time, value: price },
//         ];
//         const validatedData = ensureAscendingTimeOrder(fibData);
//         if (validatedData.length > 0) {
//           currentDrawingRef.current.series.setData(validatedData);
//         }

//         // Track end point for Fibonacci calculation
//         endPointRef.current = { time, price };

//         // Clear previous Fibonacci levels during drag
//         if (currentDrawingRef.current.priceLines) {
//           currentDrawingRef.current.priceLines.forEach(pl => {
//             try {
//               series.removePriceLine(pl);
//             } catch (e) { }
//           });
//           currentDrawingRef.current.priceLines = [];
//         }
//       }

//       if (currentDrawingRef.current.type === "parallellines") {
//         // If first line is already drawn, draw second parallel line
//         if (currentDrawingRef.current.firstLine) {
//           const firstLine = currentDrawingRef.current.firstLine;
//           // Calculate slope of first line
//           const timeDiff = firstLine.endTime - firstLine.startTime;
//           const priceDiff = firstLine.endPrice - firstLine.startPrice;

//           // Calculate parallel line: same slope, different starting point
//           const parallelStartPrice = price;
//           const parallelEndPrice = parallelStartPrice + priceDiff;

//           // Update second line
//           if (currentDrawingRef.current.secondLine) {
//             currentDrawingRef.current.secondLine.setData([
//               { time: start.time, value: parallelStartPrice },
//               { time, value: parallelEndPrice },
//             ]);
//           } else {
//             // Create second line series
//             const secondLineSeries = chart.addLineSeries({
//               color: "#8b5cf6",
//               lineWidth: 2,
//               priceLineVisible: false,
//               lastValueVisible: false,
//             });
//             secondLineSeries.setData([
//               { time: start.time, value: parallelStartPrice },
//               { time, value: parallelEndPrice },
//             ]);
//             currentDrawingRef.current.secondLine = secondLineSeries;
//           }
//         } else {
//           // Drawing first line (like trendline)
//           currentDrawingRef.current.series.setData([
//             { time: start.time, value: start.price },
//             { time, value: price },
//           ]);
//         }
//       }
//     };

//     const handleMouseUp = (e) => {
//       if (e) {
//         e.preventDefault();
//         e.stopPropagation();
//       }

//       if (!isDrawingRef.current || !currentDrawingRef.current || !startPointRef.current) return;

//       const start = startPointRef.current;
//       const end = endPointRef.current || start;

//       // For Parallel Lines: handle first and second line
//       if (currentDrawingRef.current.type === "parallellines") {
//         // If first line not drawn yet, save it
//         if (!currentDrawingRef.current.firstLine) {
//           currentDrawingRef.current.firstLine = {
//             startTime: start.time,
//             startPrice: start.price,
//             endTime: end.time,
//             endPrice: end.price,
//           };
//           // Keep drawing mode active for second line
//           isDrawingRef.current = false;
//           startPointRef.current = null;
//           endPointRef.current = null;
//           return; // Don't finalize yet, wait for second line
//         } else {
//           // Second line is drawn, finalize the parallel lines object
//           const parallelLinesObject = {
//             type: "parallellines",
//             firstLine: currentDrawingRef.current.series,
//             secondLine: currentDrawingRef.current.secondLine,
//             firstLineData: currentDrawingRef.current.firstLine,
//           };
//           setChartObjects((prev) => [...prev, parallelLinesObject]);
//           drawingObjectsRef.current.push(parallelLinesObject);
//           setActiveTool(null);

//           // Reset for next parallel lines drawing
//           currentDrawingRef.current = null;
//           isDrawingRef.current = false;
//           startPointRef.current = null;
//           endPointRef.current = null;
//           return;
//         }
//       }

//       // For Fibonacci retracement: calculate levels
//       if (currentDrawingRef.current.type === "fibonacci") {
//         // Use end point from mousemove, or fallback to start point (for click-only case)
//         const end = endPointRef.current || start;
//         const endPrice = end.price;

//         // If no movement (just click), don't draw Fibonacci
//         if (Math.abs(start.price - endPrice) < 0.0001) {
//           try {
//             chart.removeSeries(currentDrawingRef.current.series);
//           } catch (e) { }
//           isDrawingRef.current = false;
//           startPointRef.current = null;
//           endPointRef.current = null;
//           currentDrawingRef.current = null;
//           return;
//         }

//         // Determine high and low based on drag direction
//         // First point (start) is "from", second point (end) is "to"
//         const high = Math.max(start.price, endPrice);
//         const low = Math.min(start.price, endPrice);
//         const diff = high - low;

//         // Fibonacci retracement levels (standard trading levels)
//         const fibLevels = [
//           { level: 0, label: "0.0%" },
//           { level: 0.236, label: "23.6%" },
//           { level: 0.382, label: "38.2%" },
//           { level: 0.5, label: "50.0%" },
//           { level: 0.618, label: "61.8%" },
//           { level: 0.786, label: "78.6%" },
//           { level: 1.0, label: "100.0%" },
//         ];

//         const priceLines = [];
//         const fibSeries = currentDrawingRef.current.series;

//         // Remove preview line
//         try {
//           chart.removeSeries(fibSeries);
//         } catch (e) { }

//         // Create horizontal price lines for each Fibonacci level
//         fibLevels.forEach(({ level, label }) => {
//           // Calculate price at this Fibonacci level (from high to low)
//           const fibPrice = high - (diff * level);

//           const priceLine = series.createPriceLine({
//             price: fibPrice,
//             color: level === 0 || level === 1.0 ? "#f59e0b" : "#fbbf24",
//             lineWidth: level === 0 || level === 1.0 ? 2 : 1,
//             lineStyle: level === 0 || level === 1.0 ? 0 : 2, // Solid for 0% and 100%, dashed for others
//             axisLabelVisible: true,
//             title: `${label} (${fibPrice.toFixed(5)})`,
//             textColor: level === 0 || level === 1.0 ? "#f59e0b" : "#fbbf24",
//           });

//           priceLines.push(priceLine);
//         });

//         const fibonacciObject = {
//           type: "fibonacci",
//           priceLines,
//           startPrice: start.price,
//           endPrice: endPrice,
//           high,
//           low,
//         };

//         setChartObjects((prev) => [...prev, fibonacciObject]);
//         drawingObjectsRef.current.push(fibonacciObject);
//         setActiveTool(null);
//       }

//       if (currentDrawingRef.current.type === "rectangle") {
//         const start = startPointRef.current;
//         const end = endPointRef.current || start;
//         const topPrice = Math.max(start.price, end.price);
//         const bottomPrice = Math.min(start.price, end.price);
//         const leftTime = normalizeTime(Math.min(start.time, end.time));
//         const rightTime = normalizeTime(Math.max(start.time, end.time));
//         if (leftTime != null && rightTime != null && Math.abs(rightTime - leftTime) >= 1 && Math.abs(topPrice - bottomPrice) >= 0.00001) {
//           const rectSeries = currentDrawingRef.current.series;
//           rectSeries.setData(
//             ensureAscendingTimeOrder([
//               { time: leftTime, value: topPrice },
//               { time: rightTime, value: topPrice },
//             ])
//           );
//           rectSeries.applyOptions({ baseValue: { type: "price", price: bottomPrice } });
//           const rectangleObject = {
//             type: "rectangle",
//             timeStart: leftTime,
//             timeEnd: rightTime,
//             priceTop: topPrice,
//             priceBottom: bottomPrice,
//             series: rectSeries,
//           };
//           setChartObjects((prev) => [...prev, rectangleObject]);
//           drawingObjectsRef.current.push(rectangleObject);
//           setActiveTool(null);
//         } else {
//           try {
//             chart.removeSeries(currentDrawingRef.current.series);
//           } catch (e) { }
//         }
//       }

//       isDrawingRef.current = false;
//       startPointRef.current = null;
//       endPointRef.current = null;
//       currentDrawingRef.current = null;
//     };

//     if (toolType === "rectangle" || toolType === "fibonacci" || toolType === "parallellines") {
//       // CRITICAL: Use capture phase with stopImmediatePropagation to prevent chart from handling events
//       // This ensures chart panning is completely disabled when drawing tools are active
//       const options = { capture: true, passive: false };

//       // Prevent mouse move from panning chart when tool is active (even before click)
//       const handleMouseMovePreventPan = (e) => {
//         if (!isDrawingRef.current) {
//           // Only prevent panning if tool is active, allow normal mouse move for hover
//           e.stopPropagation();
//         }
//       };

//       container.addEventListener("mousedown", handleMouseDown, options);
//       container.addEventListener("mousemove", handleMouseMove, options);
//       container.addEventListener("mousemove", handleMouseMovePreventPan, options); // Prevent chart pan on mouse move
//       container.addEventListener("mouseup", handleMouseUp, options);

//       return () => {
//         container.removeEventListener("mousedown", handleMouseDown, options);
//         container.removeEventListener("mousemove", handleMouseMove, options);
//         container.removeEventListener("mousemove", handleMouseMovePreventPan, options);
//         container.removeEventListener("mouseup", handleMouseUp, options);
//       };
//     }
//   }, [activeTool, setChartObjects, setActiveTool]);

//   // Trend line selection, resize (drag handles), and move (drag line body) - when Crosshair or no tool
//   useEffect(() => {
//     const chart = chartRef.current;
//     const series = seriesRef.current;
//     const container = containerRef.current;
//     const isSelectionAllowed = activeTool === null || activeTool === 1;
//     if (!isSelectionAllowed || !chart || !series || !container) {
//       if (!isSelectionAllowed) {
//         setSelectedChartObject(null);
//         setHandlePositions([]);
//       }
//       return;
//     }

//     const HANDLE_RADIUS = 10;
//     const LINE_THRESHOLD = 8;

//     function hitTestTrendLines(clickX, clickY) {
//       const trendLines = chartObjects.filter(
//         (o) => o.type === "trendline" && o.point1 && o.point2
//       );
//       for (let i = trendLines.length - 1; i >= 0; i--) {
//         const obj = trendLines[i];
//         const x1 = chart.timeScale().timeToCoordinate(obj.point1.time);
//         const y1 = series.priceToCoordinate(obj.point1.price);
//         const x2 = chart.timeScale().timeToCoordinate(obj.point2.time);
//         const y2 = series.priceToCoordinate(obj.point2.price);
//         if (x1 == null || y1 == null || x2 == null || y2 == null) continue;

//         const d1 = Math.hypot(clickX - x1, clickY - y1);
//         const d2 = Math.hypot(clickX - x2, clickY - y2);
//         if (d1 < HANDLE_RADIUS) return { object: obj, mode: "handle1" };
//         if (d2 < HANDLE_RADIUS) return { object: obj, mode: "handle2" };
//         const dLine = distanceToSegment(clickX, clickY, x1, y1, x2, y2);
//         if (dLine < LINE_THRESHOLD) return { object: obj, mode: "line" };
//       }
//       return null;
//     }

//     const handleSelectionMouseDown = (e) => {
//       e.preventDefault();
//       e.stopPropagation();
//       const rect = container.getBoundingClientRect();
//       const x = e.clientX - rect.left;
//       const y = e.clientY - rect.top;
//       const hit = hitTestTrendLines(x, y);
//       if (hit) {
//         setSelectedChartObject(hit.object);
//         dragModeRef.current = hit.mode;
//         if (hit.mode === "line") {
//           dragStartRef.current = {
//             x,
//             y,
//             point1: { ...hit.object.point1 },
//             point2: { ...hit.object.point2 },
//           };
//         }
//       } else {
//         setSelectedChartObject(null);
//         dragModeRef.current = null;
//       }
//     };

//     const handleSelectionMouseMove = (e) => {
//       if (!dragModeRef.current) return;
//       const obj = selectedChartObjectRef.current;
//       if (!obj || !obj.point1 || !obj.point2) return;

//       const rect = container.getBoundingClientRect();
//       const x = e.clientX - rect.left;
//       const y = e.clientY - rect.top;

//       let time = chart.timeScale().coordinateToTime(x);
//       const price = series.coordinateToPrice(y);
//       if (time == null || price == null) return;
//       time = normalizeTime(time);
//       if (time == null) return;

//       if (dragModeRef.current === "handle1") {
//         const newPoint1 = { time, price };
//         const lineData = ensureAscendingTimeOrder([
//           { time: newPoint1.time, value: newPoint1.price },
//           { time: obj.point2.time, value: obj.point2.price },
//         ]);
//         if (lineData.length > 0) {
//           obj.series.setData(lineData);
//         }
//         const updated = { ...obj, point1: newPoint1 };
//         setChartObjects((prev) => {
//           const next = prev.map((o) => (o === obj ? updated : o));
//           drawingObjectsRef.current = next;
//           return next;
//         });
//         setSelectedChartObject(updated);
//         selectedChartObjectRef.current = updated;
//       } else if (dragModeRef.current === "handle2") {
//         const newPoint2 = { time, price };
//         const lineData = ensureAscendingTimeOrder([
//           { time: obj.point1.time, value: obj.point1.price },
//           { time: newPoint2.time, value: newPoint2.price },
//         ]);
//         if (lineData.length > 0) {
//           obj.series.setData(lineData);
//         }
//         const updated = { ...obj, point2: newPoint2 };
//         setChartObjects((prev) => {
//           const next = prev.map((o) => (o === obj ? updated : o));
//           drawingObjectsRef.current = next;
//           return next;
//         });
//         setSelectedChartObject(updated);
//         selectedChartObjectRef.current = updated;
//       } else if (dragModeRef.current === "line") {
//         const start = dragStartRef.current;
//         if (!start) return;
//         const startTime = chart.timeScale().coordinateToTime(start.x);
//         const startPrice = series.coordinateToPrice(start.y);
//         if (startTime == null || startPrice == null) return;
//         const deltaTime = time - startTime;
//         const deltaPrice = price - startPrice;
//         const newPoint1 = {
//           time: normalizeTime(start.point1.time + deltaTime),
//           price: start.point1.price + deltaPrice,
//         };
//         const newPoint2 = {
//           time: normalizeTime(start.point2.time + deltaTime),
//           price: start.point2.price + deltaPrice,
//         };
//         const lineData = ensureAscendingTimeOrder([
//           { time: newPoint1.time, value: newPoint1.price },
//           { time: newPoint2.time, value: newPoint2.price },
//         ]);
//         if (lineData.length > 0) {
//           obj.series.setData(lineData);
//         }
//         const updated = { ...obj, point1: newPoint1, point2: newPoint2 };
//         setChartObjects((prev) => {
//           const next = prev.map((o) => (o === obj ? updated : o));
//           drawingObjectsRef.current = next;
//           return next;
//         });
//         setSelectedChartObject(updated);
//         selectedChartObjectRef.current = updated;
//       }
//     };

//     const handleSelectionMouseUp = () => {
//       dragModeRef.current = null;
//       dragStartRef.current = null;
//     };

//     const options = { capture: true, passive: false };
//     container.addEventListener("mousedown", handleSelectionMouseDown, options);
//     container.addEventListener("mousemove", handleSelectionMouseMove, options);
//     container.addEventListener("mouseup", handleSelectionMouseUp, options);

//     return () => {
//       container.removeEventListener("mousedown", handleSelectionMouseDown, options);
//       container.removeEventListener("mousemove", handleSelectionMouseMove, options);
//       container.removeEventListener("mouseup", handleSelectionMouseUp, options);
//     };
//   }, [activeTool, chartObjects, setChartObjects]);

//   // Compute handle positions for selected trend line; update on zoom/scroll
//   useEffect(() => {
//     const chart = chartRef.current;
//     const series = seriesRef.current;
//     if (!chart || !series) return;

//     const updateHandlePositions = () => {
//       const sel = selectedChartObject;
//       if (!sel || sel.type !== "trendline" || !sel.point1 || !sel.point2) {
//         setHandlePositions([]);
//         return;
//       }
//       const timeScale = chart.timeScale();
//       const x1 = timeScale.timeToCoordinate(sel.point1.time);
//       const y1 = series.priceToCoordinate(sel.point1.price);
//       const x2 = timeScale.timeToCoordinate(sel.point2.time);
//       const y2 = series.priceToCoordinate(sel.point2.price);
//       if (x1 != null && y1 != null && x2 != null && y2 != null) {
//         setHandlePositions([{ x: x1, y: y1 }, { x: x2, y: y2 }]);
//       } else {
//         setHandlePositions([]);
//       }
//     };

//     updateHandlePositions();
//     const timeScale = chart.timeScale();
//     timeScale.subscribeVisibleTimeRangeChange(updateHandlePositions);
//     return () => {
//       timeScale.unsubscribeVisibleTimeRangeChange(updateHandlePositions);
//     };
//   }, [selectedChartObject]);

//   // Toggle visibility of all drawn objects when eye icon is used
//   useEffect(() => {
//     if (!chartRef.current || !seriesRef.current) return;

//     drawingObjectsRef.current.forEach((obj) => {
//       if (obj.series) {
//         obj.series.applyOptions({ visible: drawingsVisible });
//       }
//       if (obj.priceLine) {
//         obj.priceLine.applyOptions(
//           drawingsVisible
//             ? {
//               color: "#3b82f6",
//               axisLabelVisible: true,
//               title:
//                 typeof obj.price === "number"
//                   ? obj.price.toFixed(5)
//                   : "",
//             }
//             : {
//               color: "rgba(0,0,0,0)",
//               axisLabelVisible: false,
//               title: "",
//             }
//         );
//       }
//       // Handle Fibonacci price lines – use lineVisible so lines restore correctly when unhiding
//       if (obj.type === "fibonacci" && obj.priceLines) {
//         obj.priceLines.forEach((pl) => {
//           try {
//             pl.applyOptions({
//               lineVisible: drawingsVisible,
//               axisLabelVisible: drawingsVisible,
//             });
//           } catch (e) {
//             // Ignore errors
//           }
//         });
//       }
//       // Handle Rectangle
//       if (obj.type === "rectangle" && obj.series) {
//         obj.series.applyOptions({ visible: drawingsVisible });
//       }
//       // Handle Parallel Lines – 3-click channel (baseLine, parallelLine) or drag (firstLine, secondLine)
//       if (obj.type === "parallellines") {
//         if (obj.baseLine) obj.baseLine.applyOptions({ visible: drawingsVisible });
//         if (obj.parallelLine) obj.parallelLine.applyOptions({ visible: drawingsVisible });
//         if (obj.firstLine) obj.firstLine.applyOptions({ visible: drawingsVisible });
//         if (obj.secondLine) obj.secondLine.applyOptions({ visible: drawingsVisible });
//       }
//     });
//   }, [drawingsVisible, chartObjects]);

//   // Deselect when drawings are hidden
//   useEffect(() => {
//     if (!drawingsVisible && selectedChartObject) {
//       setSelectedChartObject(null);
//       setHandlePositions([]);
//     }
//   }, [drawingsVisible, selectedChartObject]);

//   // Clean up drawing objects when deleted
//   useEffect(() => {
//     if (drawingObjectsRef.current.length > chartObjects.length) {
//       // Object was deleted, remove from chart
//       const removed = drawingObjectsRef.current.filter(
//         (obj, idx) => !chartObjects.includes(obj)
//       );
//       if (selectedChartObject && removed.some((obj) => obj === selectedChartObject)) {
//         setSelectedChartObject(null);
//         setHandlePositions([]);
//       }
//       removed.forEach((obj) => {
//         if (obj.series) {
//           chartRef.current?.removeSeries(obj.series);
//         }
//         if (obj.priceLine) {
//           seriesRef.current?.removePriceLine(obj.priceLine);
//         }
//         // Handle Fibonacci price lines deletion
//         if (obj.type === "fibonacci" && obj.priceLines) {
//           obj.priceLines.forEach((pl) => {
//             try {
//               seriesRef.current?.removePriceLine(pl);
//             } catch (e) {
//               // Ignore errors
//             }
//           });
//         }
//         // Handle Rectangle deletion
//         if (obj.type === "rectangle" && obj.series) {
//           try {
//             chartRef.current?.removeSeries(obj.series);
//           } catch (e) {
//             // Ignore errors
//           }
//         }
//         // Handle Parallel Lines deletion (3-click: baseLine/parallelLine; drag: firstLine/secondLine)
//         if (obj.type === "parallellines") {
//           try {
//             if (obj.baseLine) chartRef.current?.removeSeries(obj.baseLine);
//             if (obj.parallelLine) chartRef.current?.removeSeries(obj.parallelLine);
//             if (obj.firstLine) chartRef.current?.removeSeries(obj.firstLine);
//             if (obj.secondLine) chartRef.current?.removeSeries(obj.secondLine);
//           } catch (e) {
//             // Ignore errors
//           }
//         }
//       });
//       drawingObjectsRef.current = chartObjects;
//     }
//   }, [chartObjects, selectedChartObject]);

//   // Display orders on chart (left side - price scale)
//   useEffect(() => {
//     const series = seriesRef.current;
//     if (!series) return;

//     // Remove old order price lines
//     orderPriceLinesRef.current.forEach((priceLine) => {
//       try {
//         series.removePriceLine(priceLine);
//       } catch (e) {
//         // Ignore errors if already removed
//       }
//     });
//     orderPriceLinesRef.current = [];

//     // Filter orders for current symbol
//     const currentSymbolOrders = orders.filter(
//       (order) => order.symbol === selectedSymbol
//     );

//     // Add price lines for each order
//     currentSymbolOrders.forEach((order) => {
//       const price = parseFloat(order.price);
//       if (isNaN(price)) return;

//       const isBuy = order.type === "BUY";
//       const color = isBuy ? "#26A69A" : "#EF5350"; // Green for BUY, Red for SELL

//       const priceLine = series.createPriceLine({
//         price: price,
//         color: color,
//         lineWidth: 2,
//         lineStyle: 0, // Solid line
//         axisLabelVisible: true,
//         title: `${order.type} ${order.volume} @ ${order.price}`,
//         textColor: color,
//       });

//       orderPriceLinesRef.current.push(priceLine);
//     });

//     // Cleanup function
//     return () => {
//       orderPriceLinesRef.current.forEach((priceLine) => {
//         try {
//           series.removePriceLine(priceLine);
//         } catch (e) {
//           // Ignore errors
//         }
//       });
//       orderPriceLinesRef.current = [];
//     };
//   }, [orders, selectedSymbol]);

//   return (
//     <div className={`flex-1 flex flex-col min-w-0 overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-primary'}`}>
//       {/* klnioh */}
//       {/* Chart Container - Fixed size to prevent resizing issues */}
//       <div
//         ref={containerRef}
//         className="flex-1 w-full h-full relative"
//         style={{
//           cursor: activeTool === 1 ? "crosshair" : (activeTool !== null ? "crosshair" : "default"),
//           minHeight: 0,
//           minWidth: 0,
//         }}
//         onDoubleClick={(e) => {
//           // Double click reset zoom (only if not drawing)
//           if (chartRef.current && !isDrawingRef.current) {
//             e.preventDefault();
//             e.stopPropagation();
//             chartRef.current.timeScale().fitContent();
//             saveZoomState(chartRef.current.timeScale().getVisibleRange());
//           }
//         }}
//       >
//         {/* Floating Buy/Sell buttons over chart (top-left) */}
//         {showBuySellPanel && (
//           <div className="absolute top-3 left-3 z-30">
//             <BuySellPanel
//               bidPrice={bidPrice}
//               askPrice={askPrice}
//               onBuyClick={handleBuyClick}
//               onSellClick={handleSellClick}
//             />
//           </div>
//         )}

//         {/* Market Execution Panel – floats over chart from the left, similar to MT5 */}
//         <MarketExecutionModal
//           isOpen={isModalOpen}
//           onClose={handleCloseModal}
//           orderType={modalOrderType}
//           bidPrice={bidPrice}
//           askPrice={askPrice}
//         />

//         {/* Handles overlay for selected trend line (resize/move) – pointer-events none so hit-test on container */}
//         {drawingsVisible &&
//           selectedChartObject?.type === "trendline" &&
//           selectedChartObject?.point1 &&
//           selectedChartObject?.point2 &&
//           handlePositions.length === 2 && (
//             <div
//               className="absolute inset-0 z-20 pointer-events-none"
//               aria-hidden
//             >
//               {handlePositions.map((pos, i) => (
//                 <div
//                   key={i}
//                   className="absolute w-[10px] h-[10px] rounded-full border-2 border-white bg-[#22c55e] shadow"
//                   style={{
//                     left: pos.x - 5,
//                     top: pos.y - 5,
//                   }}
//                 />
//               ))}
//             </div>
//           )}
//       </div>
//     </div>
//   );
// });

// export default ChartArea;
