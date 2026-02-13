// import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
// import { createChart } from "lightweight-charts";
// // import { useTrading } from "../../contexts/TradingContext";
// // import BuySellPanel from "./BuySellPanel";
// // import MarketExecutionModal from "./MarketExecutionModal";
// import { getMarketHistory } from "@/api/market-data";
// import socket from "@/lib/socket";
// // TradingView/MT5-Style Professional Engines
// import { normalizeTime, alignToTimeframe } from "../../utils/timeEngine";
// import { processCandles, processSingleCandle, timeframeToSeconds } from "../../utils/candleEngine";
// import { isForexSymbol, isCryptoSymbol } from "../../config/symbolConfig";
// import { useTrading } from "@/contexts/TradingContext";
// // import { getMarketHistory, getCurrentPrice } from "@/api/market-data";
// import { usePrices } from "@/contexts/PriceContext";
// // import html2canvas from "html2canvas";

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


// const prepareCandlesForSetData = (candles, selectedTimeframe) => {
//   const tfSec = timeframeToSeconds(selectedTimeframe);

//   const aligned = (Array.isArray(candles) ? candles : [])
//     .map(c => {
//       const t = normalizeTime(c.time); // handles sec/ms + null safety
//       return {
//         ...c,
//         time: t != null ? alignToTimeframe(Number(t), tfSec) : null,
//       };
//     })
//     .filter(c => c.time != null);

//   aligned.sort((a, b) => a.time - b.time);

//   // last-wins (after alignment)
//   const map = new Map();
//   for (const c of aligned) map.set(c.time, c);

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
//     const key = getZoomKey(selectedSymbolStr, selectedTimeframe);
//     return zoomStateMapRef.current.get(key) || null;
//   };

//   const saveZoomState = (visibleRange) => {
//     if (!visibleRange) return;
//     const key = getZoomKey(selectedSymbolStr, selectedTimeframe);
//     zoomStateMapRef.current.set(key, visibleRange);
//   };

//   const { getPrice: getUnifiedPrice } = usePrices();
//   const {
//     activeTool,
//     setActiveTool,
//     showGrid,
//     // snapToGrid,
//     chartObjects,
//     setChartObjects,
//     orders,
//     selectedSymbol,
//     selectedTimeframe,
//     drawingsVisible,
//     chartType,
//     chartLocked,
//     isDark,
//   } = useTrading();


//   const selectedSymbolStr = typeof selectedSymbol === "string" ? selectedSymbol : (selectedSymbol?.symbol ?? "");

//   const orderPriceLinesRef = useRef([]);
//   // const [isModalOpen, setIsModalOpen] = useState(false);
//   // const [modalOrderType, setModalOrderType] = useState(null);
//   const [candles, setCandles] = useState([]);
//   const [candlesLoading, setCandlesLoading] = useState(true);
//   // const socketRef = useRef(null);
//   const candlesMapRef = useRef(new Map()); // Store candles by time for quick updates
//   const candleUpdateTimeoutRef = useRef(null); // (reserved) For debouncing candle updates
//   const lastCandleRenderRef = useRef(0); // Throttle visual candle updates (MT5-like smoothness)
//   const lastHistTimeRef = useRef(0); // Last historical candle time (from API) - block future-jump in polling

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
//       const bgColor = isDark === "light" ? "#ffffff" : "#0F1720";
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
//   }), [selectedSymbol, selectedTimeframe, isDark]);

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

//   // const handleBuyClick = (orderData) => {
//   //   // Order data contains: volume, stopLoss, takeProfit, comment, price
//   //   console.log('Buy Order:', orderData);
//   //   // If parent provides handler, use it; otherwise use local modal
//   //   if (onBuyClickProp) {
//   //     onBuyClickProp('BUY');
//   //   } else {
//   //     setModalOrderType('BUY');
//   //     setIsModalOpen(true);
//   //   }
//   // };

//   // const handleSellClick = (orderData) => {
//   //   // Order data contains: volume, stopLoss, takeProfit, comment, price
//   //   console.log('Sell Order:', orderData);
//   //   // If parent provides handler, use it; otherwise use local modal
//   //   if (onSellClickProp) {
//   //     onSellClickProp('SELL');
//   //   } else {
//   //     setModalOrderType('SELL');
//   //     setIsModalOpen(true);
//   //   }
//   // };

//   // const handleCloseModal = () => {
//   //   setIsModalOpen(false);
//   //   setModalOrderType(null);
//   // };

//   // Initialize chart
//   useEffect(() => {
//     const container = containerRef.current;
//     if (!container) {
//       return;
//     }

//     // Get container dimensions (fallback if layout not ready yet)
//     const rect = container.getBoundingClientRect();
//     const w = Math.max(rect.width || container.clientWidth || 0, 400);
//     const h = Math.max(rect.height || container.clientHeight || 0, 320);

//     // Price labels: never show minus sign (trading prices are positive; library default can show minus)
//     const priceFormatter = (price) => {
//       const n = Math.abs(Number(price));
//       if (!Number.isFinite(n)) return '0';
//       if (n >= 1000) return n.toFixed(2);
//       if (n >= 1) return n.toFixed(4);
//       return n.toFixed(5);
//     };

//     const isDark = isDark === "light";

//     const chart = createChart(container, {
//       width: w,
//       height: h,
//       autoSize: true,
//       localization: {
//         priceFormatter,
//       },
//       layout: {
//         background: { color: isDark ? "#FFFFFF" : "#0F1720" },
//         textColor: isDark ? "#020617" : "#fff",
//         fontSize: 12,
//       },
//       grid: {
//         vertLines: {
//           visible: showGrid,
//           color: showGrid
//             ? isDark
//               ? "rgba(100, 116, 139, 0.25)"
//               : "rgba(148, 163, 184, 0.2)"
//             : "transparent",
//           style: showGrid ? 0 : 0,
//         },
//         horzLines: {
//           visible: showGrid,
//           color: showGrid
//             ? isDark
//               ? "rgba(100, 116, 139, 0.25)"
//               : "rgba(148, 163, 184, 0.2)"
//             : "transparent",
//           style: showGrid ? 0 : 0,
//         },
//       },
//       rightPriceScale: {
//         borderColor: isDark ? "#e5e7eb" : "#1e293b",
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
//         borderColor: isDark ? "#e5e7eb" : "#1e293b",
//         timeVisible: true,
//         secondsVisible: false,
//         rightOffset: 10,
//         barSpacing: 3,
//         tickMarkFormatter: (time, tickMarkType, locale) => {
//           const d = new Date((typeof time === 'number' ? time : time) * 1000);
//           const pad = (n) => String(n).padStart(2, '0');
//           const h = d.getUTCHours();
//           const m = d.getUTCMinutes();
//           if (tickMarkType === 2) return `${pad(d.getUTCDate())} ${d.toLocaleDateString(locale || 'en', { month: 'short' })}`;
//           if (tickMarkType === 1) return `${pad(h)}:${pad(m)}`;
//           return `${pad(h)}:${pad(m)}`;
//       }},



//       // timeScale: {
//       //   borderColor: isDark ? "#e5e7eb" : "#1e293b",
//       //   timeVisible: true,
//       //   secondsVisible: false,
//       //   rightOffset: 10,
//       //   barSpacing: 3, // Increase spacing between candles for better visibility
//       //   minBarSpacing: 2,
//       //   shiftVisibleRangeOnNewBar: false, // We handle auto-scroll manually for better control
//       //   fixLeftEdge: false, // Allow scrolling to latest
//       //   fixRightEdge: false, // Allow scrolling to latest
//       // },

//       crosshair: {
//         mode: activeTool === 1 ? 1 : 0, // 0 = Hidden, 1 = Normal (shows on hover), 2 = Magnet
//         vertLine: {
//           width: 1,
//           color: isDark ? "#94a3b8" : "#64748b", // adjust for isDark
//           style: 0, // Solid line (0 = solid, 1 = dotted, 2 = dashed)
//           labelBackgroundColor: isDark ? "#e5e7eb" : "#1e293b",
//         },
//         horzLine: {
//           width: 1,
//           color: isDark ? "#94a3b8" : "#64748b",
//           style: 0, // Solid line
//           labelBackgroundColor: isDark ? "#e5e7eb" : "#1e293b",
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

//   // Apply isDark (light/dark) to chart when isDark changes
//   // useEffect(() => {
//   //   const chart = chartRef.current;
//   //   if (!chart) return;
//   //   const isLight = isDark === "light";
//   //   chart.applyOptions({
//   //     layout: {
//   //       background: { color: isLight ? "#FFFFFF" : "#0F1720" },
//   //       textColor: isLight ? "#020617" : "#fff",
//   //     },
//   //     grid: {
//   //       vertLines: {
//   //         color: showGrid ? (isLight ? "rgba(100, 116, 139, 0.25)" : "rgba(148, 163, 184, 0.2)") : "transparent",
//   //       },
//   //       horzLines: {
//   //         color: showGrid ? (isLight ? "rgba(100, 116, 139, 0.25)" : "rgba(148, 163, 184, 0.2)") : "transparent",
//   //       },
//   //     },
//   //     rightPriceScale: { borderColor: isLight ? "#e5e7eb" : "#1e293b" },
//   //     timeScale: { borderColor: isLight ? "#e5e7eb" : "#1e293b" },
//   //     crosshair: {
//   //       vertLine: { color: isLight ? "#94a3b8" : "#64748b", labelBackgroundColor: isLight ? "#e5e7eb" : "#1e293b" },
//   //       horzLine: { color: isLight ? "#94a3b8" : "#64748b", labelBackgroundColor: isLight ? "#e5e7eb" : "#1e293b" },
//   //     },
//   //   });
//   // }, [isDark, showGrid]);

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
//           color: isDark === "light" ? "#94a3b8" : "#64748b",
//           style: 0, // Solid line
//           labelBackgroundColor: isDark === "light" ? "#e5e7eb" : "#1e293b",
//         },
//         horzLine: {
//           visible: activeTool === 1,
//           width: 1,
//           color: isDark === "light" ? "#94a3b8" : "#64748b",
//           style: 0, // Solid line
//           labelBackgroundColor: isDark === "light" ? "#e5e7eb" : "#1e293b",
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
//       if (!selectedSymbolStr || !selectedTimeframe) {
//         setCandles([])
//         lastHistTimeRef.current = 0
//         hasInitializedRef.current = false // Reset on symbol change
//         return
//       }

//       try {
//         setCandlesLoading(true)
//         // CRITICAL: Reset candles to empty array FIRST when symbol changes
//         // This ensures chart data init effect knows we're waiting for new data
//         setCandles([])
//         lastHistTimeRef.current = 0
//         hasInitializedRef.current = false // Reset initialization flag for new symbol

//         // CRITICAL: Clear chart immediately to prevent old/new data mixing (MT5/TradingView style)
//         if (seriesRef.current) {
//           try {
//             seriesRef.current.setData([]); // Clear immediately
//           } catch (e) {
//             // ignore errors
//           }
//         }

//         console.log(`📊 Fetching candles for ${selectedSymbolStr} @ ${selectedTimeframe}`)

//         // MT5/TradingView-style: request history range by timeframe so higher TFs get enough candles
//         const daysBack = getDaysBackForTimeframe(selectedTimeframe)
//         // Request enough bars for the range (e.g. M15 14 days = 1344 bars; M30 30 days = 1440 bars)
//         const limit = getLimitForTimeframe(selectedTimeframe, daysBack)









//         // Fetch candles from project API (backend on 5002: market-data/history or crypto/candles)
//         const rawCandles = await getMarketHistory(selectedSymbolStr, selectedTimeframe, limit);

//         if (rawCandles && rawCandles.length > 0) {
//           console.log(`✅ Loaded ${rawCandles.length} raw candles from server`)

//           // Diagnostic logging to identify misaligned symbols
//           if (import.meta.env?.DEV) {
//             console.log("RAW", selectedSymbolStr, rawCandles.slice(0, 5));
//             console.log("RAW last", selectedSymbolStr, rawCandles.slice(-5));
//             console.log("MOD60", selectedSymbolStr, rawCandles.slice(0, 5).map(c => normalizeTime(c.time) % 60));
//           }

//           // PROFESSIONAL: TradingView/MT5-style candle processing
//           // This handles: time normalization, validation, deduplication, outlier detection, timeframe alignment
//           const { candles: processedCandles, stats } = processCandles(
//             rawCandles,
//             selectedSymbolStr,
//             selectedTimeframe
//           );

//           if (processedCandles.length > 0) {
//             setCandles(processedCandles)
//             lastHistTimeRef.current = processedCandles.at(-1)?.time || 0

//             // Build candles map for quick updates
//             candlesMapRef.current = new Map()
//             processedCandles.forEach(c => {
//               candlesMapRef.current.set(c.time, c)
//             })
//           } else {
//             console.warn(`⚠️ No valid candles after processing for ${selectedSymbolStr}`)
//             setCandles([])
//             lastHistTimeRef.current = 0
//           }
//         } else {
//           console.warn(`⚠️ No candle data returned for ${selectedSymbolStr}`)
//           // CRITICAL: Set empty candles - let chart data init effect handle initialization
//           // Don't set hasInitializedRef here - let the effect initialize with empty data
//           setCandles([])
//           lastHistTimeRef.current = 0
//         }
//       } catch (error) {
//         console.error(`❌ Error fetching ${selectedSymbolStr}:`, error.message)
//         setCandles([]) // No fallback - show empty chart
//         lastHistTimeRef.current = 0
//       } finally {
//         setCandlesLoading(false)
//       }
//     }

//     // Immediate fetch (no debounce for professional instant loading like Binance)
//     fetchCandles()
//   }, [selectedSymbolStr, selectedTimeframe]) // Removed bidPrice - not needed

//   // // Chart connected to same WebSocket as watchlist (lib/socket → /trading). Real-time via priceUpdate from backend.
//   // useEffect(() => {
//   //   if (!socketRef.current) socketRef.current = socket;
//   //   const sock = socketRef.current;
//   //   if (!sock) return;

//   //   let currentSymbol = selectedSymbolStr
//   //   let currentTimeframe = selectedTimeframe

//   //   // Handle connection events (only once)
//   //   const handleConnect = () => {
//   //     console.log('✅ Chart WebSocket connected')
//   //     // Subscribe immediately on connect
//   //     subscribeToCandles()
//   //   }

//   //   const handleDisconnect = () => {
//   //     console.log('⚠️ Chart WebSocket disconnected - will auto-reconnect')
//   //   }

//   //   const handleError = (error) => {
//   //     console.error('❌ Chart WebSocket connection error:', error)
//   //   }

//   //   sock.on('connect', handleConnect)
//   //   sock.on('disconnect', handleDisconnect)
//   //   sock.on('connect_error', handleError)

//   //   // Subscribe function (uses selectedSymbol - always current)
//   //   // PROFESSIONAL: Use symbol config for crypto detection
//   //   const subscribeToCandles = () => {
//   //     const isCrypto = isCryptoSymbol(selectedSymbolStr);

//   //     if (isCrypto && selectedSymbolStr && selectedTimeframe && sock.connected) {
//   //       console.log(`Subscribing to real-time candles: ${selectedSymbolStr}@${selectedTimeframe}`)
//   //       sock.emit('subscribeCandles', { symbol: selectedSymbolStr, timeframe: selectedTimeframe })
//   //     } else if (!isCrypto && selectedSymbolStr) {
//   //       console.log(`⚠️ Symbol ${selectedSymbolStr} is not a crypto symbol, skipping candle subscription`)
//   //     }
//   //   }














//   //   // Listen for real-time candle updates
//   //   // NOTE: We THROTTLE visual updates so candles don't "shake" too fast (more like MT5)
//   //   const handleCandleUpdate = (data) => {
//   //     // Quick validation
//   //     if (!data || !data.candle || !data.symbol) return

//   //     // Match symbol (case-insensitive) - use selectedSymbol (always current)
//   //     if (data.symbol.toUpperCase() !== selectedSymbolStr.toUpperCase()) {
//   //       return // Not for this symbol
//   //     }

//   //     const { candle } = data

//   //     // PROFESSIONAL: Process single candle through engine (TradingView style)
//   //     // Pass timeframe to ensure proper alignment
//   //     const processedCandle = processSingleCandle(candle, selectedSymbolStr, selectedTimeframe);
//   //     if (!processedCandle) {
//   //       if (import.meta.env?.DEV) {
//   //         console.warn(`⚠️ Rejected realtime candle (invalid):`, { symbol: data.symbol, candle });
//   //       }
//   //       return; // Invalid candle, skip
//   //     }

//   //     // Throttle chart updates: at most once every 250ms per tab
//   //     // This keeps movement smooth but not "hyper-fast" compared to MT5
//   //     const now = Date.now()
//   //     if (now - lastCandleRenderRef.current < 200) {
//   //       return
//   //     }
//   //     lastCandleRenderRef.current = now

//   //     const timeScale = chartRef.current?.timeScale()
//   //     const currentVisibleRange = timeScale?.getVisibleRange()
//   //     const s = seriesRef.current
//   //     const c = chartRef.current

//   //     if (!s || !c || !hasInitializedRef.current) {
//   //       return // Chart not ready
//   //     }

//   //     // Update candle immediately (NO setData - preserves zoom, avoids React re-render loops)
//   //     try {
//   //       // Use processed candle (already normalized and validated)
//   //       if (chartType === 'line' || chartType === 'area') {
//   //         s.update({ time: processedCandle.time, value: processedCandle.close })
//   //       } else {
//   //         s.update({
//   //           time: processedCandle.time,
//   //           open: processedCandle.open,
//   //           high: processedCandle.high,
//   //           low: processedCandle.low,
//   //           close: processedCandle.close
//   //         })
//   //       }

//   //       // Update candles map for consistency
//   //       candlesMapRef.current.set(processedCandle.time, processedCandle);

//   //       // Preserve user's zoom and position
//   //       if (timeScale && currentVisibleRange) {
//   //         saveZoomState(currentVisibleRange);
//   //       }
//   //     } catch (e) {
//   //       console.error('❌ Error updating candle:', e)
//   //     }
//   //   }

//   //   // Real-time: same WebSocket that updates watchlist bid/ask – update chart last candle
//   //   const handlePriceUpdate = (updatedSymbol) => {
//   //     if (!updatedSymbol?.symbol || updatedSymbol.symbol.replace("/", "") !== selectedSymbolStr.replace("/", "")) return;
//   //     const s = seriesRef.current;
//   //     const c = chartRef.current;
//   //     if (!s || !c || !hasInitializedRef.current || candlesMapRef.current.size === 0) return;
//   //     const now = Date.now();
//   //     if (now - lastCandleRenderRef.current < 150) return;
//   //     lastCandleRenderRef.current = now;
//   //     const price = (parseFloat(updatedSymbol.bid) + parseFloat(updatedSymbol.ask || updatedSymbol.bid)) / 2;
//   //     if (!Number.isFinite(price)) return;
//   //     const tfSec = timeframeToSeconds(selectedTimeframe);
//   //     const barTime = alignToTimeframe(Math.floor(Date.now() / 1000), tfSec);


//   //     const existing = candlesMapRef.current.get(barTime);
//   //     const open = existing ? existing.open : price;
//   //     const high = existing ? Math.max(existing.high, price) : price;
//   //     const low = existing ? Math.min(existing.low, price) : price;
//   //     try {
//   //       if (chartType === 'line' || chartType === 'area') {
//   //         s.update({ time: barTime, value: price });
//   //       } else {
//   //         s.update({ time: barTime, open, high, low, close: price });
//   //       }
//   //       candlesMapRef.current.set(barTime, { time: barTime, open, high, low, close: price });
//   //     } catch (e) { /* ignore */ }
//   //   };

//   //   sock.on('candleUpdate', handleCandleUpdate)
//   //   sock.on('priceUpdate', handlePriceUpdate)

//   //   if (sock.connected) subscribeToCandles();

//   //   return () => {
//   //     sock.off('candleUpdate', handleCandleUpdate)
//   //     sock.off('priceUpdate', handlePriceUpdate)
//   //     sock.off('connect', handleConnect)
//   //     sock.off('disconnect', handleDisconnect)
//   //     sock.off('connect_error', handleError)
//   //     if (selectedSymbolStr && selectedTimeframe && sock.connected) {
//   //       const isCrypto = isCryptoSymbol(selectedSymbolStr);
//   //       if (isCrypto) {
//   //         console.log(`🔌 Unsubscribing from: ${selectedSymbolStr}@${selectedTimeframe}`)
//   //         sock.emit('unsubscribeCandles', { symbol: selectedSymbolStr, timeframe: selectedTimeframe })
//   //       }
//   //     }
//   //   }
//   // }, [selectedSymbolStr, selectedTimeframe, chartType]) // Re-run on symbol/timeframe change






//     // Real-time via polling (same as upper chart): every 800ms update last candle from PriceContext
//   useEffect(() => {
//     if (!selectedSymbolStr || !selectedTimeframe) return;

//     const POLL_INTERVAL_MS = 800;
//     const THROTTLE_MS = 150;

//     const intervalId = setInterval(() => {
//       const s = seriesRef.current;
//       const c = chartRef.current;
//       if (!s || !c || !hasInitializedRef.current || candlesMapRef.current.size === 0) return;

//       const bid = getUnifiedPrice(selectedSymbolStr, "bid");
//       const ask = getUnifiedPrice(selectedSymbolStr, "ask");
//       const bidNum = typeof bid === "number" && !isNaN(bid) ? bid : parseFloat(bid);
//       const askNum = typeof ask === "number" && !isNaN(ask) ? ask : parseFloat(ask);
//       const price = (Number.isFinite(bidNum) && Number.isFinite(askNum))
//         ? (bidNum + askNum) / 2
//         : (Number.isFinite(bidNum) ? bidNum : Number.isFinite(askNum) ? askNum : null);
//       if (price == null || !Number.isFinite(price)) return;

//       const now = Date.now();
//       if (now - lastCandleRenderRef.current < THROTTLE_MS) return;
//       lastCandleRenderRef.current = now;
//       const tfSec = timeframeToSeconds(selectedTimeframe);
//       const nowAligned = alignToTimeframe(Math.floor(Date.now() / 1000), tfSec);
//       const lastHist = lastHistTimeRef.current || 0;
//       if (lastHist && (nowAligned - lastHist) > tfSec * 5) return;
//       const barTime = nowAligned;
//       const existing = candlesMapRef.current.get(barTime);
//       const open = existing ? existing.open : price;
//       const high = existing ? Math.max(existing.high, price) : price;
//       const low = existing ? Math.min(existing.low, price) : price;

//       try {
//         if (chartType === "line" || chartType === "area") {
//           s.update({ time: barTime, value: price });
//         } else {
//           s.update({ time: barTime, open, high, low, close: price });
//         }
//         candlesMapRef.current.set(barTime, { time: barTime, open, high, low, close: price });
//       } catch (e) { /* ignore */ }
//     }, POLL_INTERVAL_MS);

//     return () => clearInterval(intervalId);
//   }, [selectedSymbolStr, selectedTimeframe, chartType, getUnifiedPrice]);









//   // Initialize data when candles first load (PROFESSIONAL - Instant chart display like Binance)
//   useEffect(() => {
//     const s = seriesRef.current;
//     const c = chartRef.current;

//     if (!s || !c) {
//       return;
//     }

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
//       const timeScale = c.timeScale();
//       s.setData([]); // Set empty data
//       timeScale.fitContent();
//       return; // Done initializing empty chart
//     }

//     // Only setData on initial load (when hasInitializedRef is false)
//     // This prevents resetting zoom on every real-time update
//     if (!hasInitializedRef.current) {
//       const timeScale = c.timeScale();
//       const currentKey = getZoomKey(selectedSymbolStr, selectedTimeframe);
//       const symbolTimeframeChanged = lastSymbolTimeframeRef.current !== currentKey;

//       // Update tracking AFTER checking for change
//       lastSymbolTimeframeRef.current = currentKey;


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
//         // For candlestick charts: align + dedupe via single helper
//         const finalCandles = prepareCandlesForSetData(candles, selectedTimeframe);
//         if (finalCandles.length > 0) {
//           if (import.meta.env?.DEV && finalCandles.length >= 2) {
//             console.log(
//               "SETDATA first/last",
//               finalCandles[0]?.time,
//               finalCandles.at(-1)?.time,
//               "Δ",
//               finalCandles.at(-1)?.time - finalCandles.at(-2)?.time
//             );
//           }
//           s.setData(finalCandles);
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
//       const sortedCandles = prepareCandlesForSetData(candles, selectedTimeframe);
//       if (sortedCandles.length > 0) newSeries.setData(sortedCandles);
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

//     else if (chartType === "volume ticks" || chartType === "volume") {
//       // ✅ 1) Main candles ALWAYS on RIGHT price scale
//       newSeries = chart.addCandlestickSeries({
//         upColor: "#26A69A",
//         downColor: "#EF5350",
//         wickUpColor: "#26A69A",
//         wickDownColor: "#EF5350",
//         borderVisible: false,
//         priceScaleId: "right", // ✅ FIX: lock candles to right price scale
//       });

//       const sortedCandles = prepareCandlesForSetData(candles, selectedTimeframe);
//       if (sortedCandles.length > 0) newSeries.setData(sortedCandles);

//       // ✅ 2) Create separate scale for volume (so it doesn't crush price candles)
//       // const volumeSeries = chart.addHistogramSeries({
//       //   priceFormat: { type: "volume" },
//       //   priceScaleId: "vol", // ✅ FIX: separate scale
//       //   base: 0,             // ✅ FIX: start volume from bottom (0)
//       //   priceLineVisible: false,
//       //   lastValueVisible: false,
//       // });
//       const volumeSeries = chart.addHistogramSeries({
//         priceFormat: { type: "volume" },
//         priceScaleId: "vol",
//         base: 0,
//         priceLineVisible: false,
//         lastValueVisible: false,

//         // ✅ Dim / subtle volume like TradingView
//         color: "rgba(38,166,154,0.15)", // default green (dim)
//       });


//       // ✅ 3) Set margins on each scale (pro style)
//       chart.priceScale("right").applyOptions({
//         scaleMargins: { top: 0.05, bottom: 0.30 }, // candles top/bottom space
//       });

//       chart.priceScale("vol").applyOptions({
//         scaleMargins: { top: 0.75, bottom: 0.00 }, // volume at bottom
//         visible: false, // ✅ hide volume axis like TradingView
//       });

//       // ✅ 4) Volume data
//       // const volumeData = sortedCandles.map((candle) => ({
//       //   time: candle.time,
//       //   value: candle.volume || 0,
//       //   color: candle.close >= candle.open ? "#26a69a" : "#ef5350",
//       // }));
//       const volumeData = sortedCandles.map((candle) => ({
//         time: candle.time,
//         value: candle.volume || 0,
//         color: candle.close >= candle.open
//           ? "rgba(38,166,154,0.25)"
//           : "rgba(239,83,80,0.25)",
//       }));


//       if (volumeData.length > 0) volumeSeries.setData(volumeData);

//       volumeSeriesRef.current = volumeSeries;
//     }



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
//       const sortedCandles = prepareCandlesForSetData(candles, selectedTimeframe);
//       if (sortedCandles.length > 0) newSeries.setData(sortedCandles);
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

//     const sortedCandles = prepareCandlesForSetData(candles, selectedTimeframe);

//     const volumeData = sortedCandles.map(candle => ({
//       time: candle.time,
//       value: candle.volume || 0,
//       color: candle.close >= candle.open
//         ? "rgba(38,166,154,0.25)"
//         : "rgba(239,83,80,0.25)",

//       // color: candle.close >= candle.open ? '#26a69a' : '#ef5350', // Green for up, red for down
//     }));

//     if (volumeData.length > 0) {
//       volumeSeries.setData(volumeData);
//     }
//   }, [candles, chartType, selectedTimeframe]); // Update when candles, chartType or timeframe changes

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
//       (order) => order.symbol === selectedSymbolStr
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
//   }, [orders, selectedSymbolStr]);

//   return (
//     <div className={`flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden ${isDark === 'light' ? 'bg-white' : 'bg-primary'}`}>
//       {/* Chart container: take all available height so chart is not tiny */}
//       <div
//         ref={containerRef}
//         className="flex-1 w-full min-h-[320px] relative"
//         style={{
//           cursor: activeTool === 1 ? "crosshair" : (activeTool !== null ? "crosshair" : "default"),
//           minHeight: 320,
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
//         {/* {showBuySellPanel && (
//           <div className="absolute top-3 left-3 z-30">
//             <BuySellPanel
//               bidPrice={bidPrice}
//               askPrice={askPrice}
//               onBuyClick={handleBuyClick}
//               onSellClick={handleSellClick}
//             />
//           </div>
//         )} */}

//         {/* Market Execution Panel – floats over chart from the left, similar to MT5 */}
//         {/* <MarketExecutionModal
//           isOpen={isModalOpen}
//           onClose={handleCloseModal}
//           orderType={modalOrderType}
//           bidPrice={bidPrice}
//           askPrice={askPrice}
//         /> */}

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



// import React, { useState, useEffect, useRef, useCallback } from "react";
// import {
//   createChart,
//   ColorType,
//   CandlestickSeries,
//   LineSeries,
//   HistogramSeries,
// } from "lightweight-charts";
// import { Card } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { BarChart2, Clock, LineChart as LineChartIcon } from "lucide-react";
// import { useTranslation } from "../../contexts/LanguageContext";
// import { getMarketHistory, getCurrentPrice } from "@/api/market-data";
// import { usePrices } from "@/contexts/PriceContext";

// // Timeframe to milliseconds mapping
// const timeframeToMs = {
//   M1: 60000,
//   M5: 60000 * 5,
//   M15: 60000 * 15,
//   M30: 60000 * 30,
//   H1: 60000 * 60,
//   H4: 60000 * 60 * 4,
//   D1: 60000 * 60 * 24,
// };

// export default function TradingChart({
//   symbol,
//   openPositions = [],
//   onPriceUpdate,
// }) {
//   const { t } = useTranslation();
//   const { getPrice: getUnifiedPrice } = usePrices();
//   const [timeframe, setTimeframe] = useState("M5");
//   const [chartType, setChartType] = useState("candle"); // 'candle' or 'line'
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);
//   const chartContainerRef = useRef(null);
//   const chartRef = useRef(null);
//   const candlestickSeriesRef = useRef(null);
//   const lineSeriesRef = useRef(null);
//   const volumeSeriesRef = useRef(null);
//   const positionMarkersRef = useRef([]);
//   const currentPriceLineRef = useRef(null);
//   const lastUpdateTimeRef = useRef(Date.now());
//   const currentPriceRef = useRef(symbol?.bid || 1.08542);
//   const priceUpdateIntervalRef = useRef(null);
//   const currentVolumeRef = useRef(0); // Track current candle volume for aggregation
//   const seriesReadyRef = useRef(false); // Track if series are initialized
//   const fetchAbortControllerRef = useRef(null); // Track and cancel pending requests
//   const debounceTimerRef = useRef(null); // Debounce symbol changes
//   const startPollingTimerRef = useRef(null); // Track price polling start timer

//   const timeframes = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];

//   // Get price format configuration based on symbol type (for chart series)
//   const getPriceFormatConfig = useCallback(() => {
//     if (!symbol?.symbol) {
//       return { precision: 5, minMove: 0.00001 };
//     }

//     const symbolUpper = symbol.symbol.toUpperCase();

//     // Forex pairs - 5 decimals, minMove 0.00001
//     if (
//       symbolUpper.includes("EUR") ||
//       symbolUpper.includes("AUD") ||
//       symbolUpper.includes("GBP") ||
//       symbolUpper.includes("NZD") ||
//       symbolUpper.includes("CAD") ||
//       symbolUpper.includes("CHF")
//     ) {
//       return { precision: 5, minMove: 0.00001 };
//     }

//     // JPY pairs - 3 decimals, minMove 0.001
//     if (symbolUpper.includes("JPY")) {
//       return { precision: 3, minMove: 0.001 };
//     }

//     // Crypto - 2 decimals, minMove 0.01
//     if (
//       symbolUpper.includes("BTC") ||
//       symbolUpper.includes("ETH") ||
//       symbolUpper.includes("SOL")
//     ) {
//       return { precision: 2, minMove: 0.01 };
//     }

//     // Other crypto - 4 decimals, minMove 0.0001
//     if (
//       symbolUpper.includes("XRP") ||
//       symbolUpper.includes("ADA") ||
//       symbolUpper.includes("DOGE")
//     ) {
//       return { precision: 4, minMove: 0.0001 };
//     }

//     // Default for forex - 5 decimals
//     return { precision: 5, minMove: 0.00001 };
//   }, [symbol?.symbol]);

//   // Format price for display (UI)
//   const formatPrice = useCallback(
//     (price) => {
//       if (!price) return "";
//       const config = getPriceFormatConfig();
//       return price.toFixed(config.precision);
//     },
//     [getPriceFormatConfig],
//   );

//   // Convert timestamp to UTCTimestamp (lightweight-charts expects seconds since epoch)
//   const toUTCTimestamp = (timestamp) => {
//     if (!timestamp || isNaN(timestamp) || timestamp <= 0) {
//       return Math.floor(Date.now() / 1000);
//     }
//     // If timestamp is already in seconds (less than year 2000 in milliseconds), use as is
//     if (timestamp < 946684800000) {
//       // Year 2000 in milliseconds
//       const seconds = Math.floor(timestamp);
//       // Ensure it's a valid timestamp (after 1970)
//       if (seconds < 0) {
//         return Math.floor(Date.now() / 1000);
//       }
//       return seconds;
//     }
//     // Otherwise convert from milliseconds to seconds
//     const seconds = Math.floor(timestamp / 1000);
//     // Ensure it's a valid timestamp
//     if (seconds < 0 || isNaN(seconds)) {
//       return Math.floor(Date.now() / 1000);
//     }
//     return seconds;
//   };

//   // Initialize chart
//   useEffect(() => {
//     if (!chartContainerRef.current) return;

//     const container = chartContainerRef.current;
//     let resizeObserver;
//     let dimensionCheckInterval;

//     const checkAndInitialize = () => {
//       const width = container.clientWidth || container.offsetWidth;
//       const height = container.clientHeight || container.offsetHeight;

//       if (width > 0 && height > 0 && !chartRef.current) {
//         console.log("Container ready, initializing chart...", {
//           width,
//           height,
//         });
//         initializeChart();
//         if (dimensionCheckInterval) {
//           clearInterval(dimensionCheckInterval);
//         }
//         if (resizeObserver) {
//           resizeObserver.disconnect();
//         }
//       }
//     };

//     // Check immediately
//     checkAndInitialize();

//     // If not ready, set up observers
//     if (!chartRef.current) {
//       // Use ResizeObserver if available
//       if (window.ResizeObserver) {
//         resizeObserver = new ResizeObserver(checkAndInitialize);
//         resizeObserver.observe(container);
//       } else {
//         // Fallback to interval checking
//         dimensionCheckInterval = setInterval(checkAndInitialize, 100);
//       }
//     }

//     function initializeChart() {
//       if (!container || chartRef.current) return;

//       // Reset series ready flag when initializing new chart
//       seriesReadyRef.current = false;

//       // Ensure container has valid dimensions
//       const width = container.clientWidth || container.offsetWidth || 800;
//       const height = container.clientHeight || container.offsetHeight || 400;

//       if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
//         console.error("Invalid container dimensions:", {
//           width,
//           height,
//           clientWidth: container.clientWidth,
//           clientHeight: container.clientHeight,
//         });
//         return;
//       }

//       // Mobile: use narrower price scale and tighter spacing so chart fits without clipping
//       const isNarrow = width < 420;
//       const rightScaleMinWidth = isNarrow ? 44 : 92;
//       const barSpacing = isNarrow ? 8 : 14;
//       const rightOffset = isNarrow ? 4 : 9;

//       console.log("Creating chart with dimensions:", { width, height, isNarrow: isNarrow });

//       // Create chart with TradingView-like styling
//       // Use autoSize if dimensions are invalid, otherwise use explicit dimensions
//       let chart;
//       try {
//         const chartOptions = {
//           layout: {
//             background: { type: ColorType.Solid, color: "#131722" },
//             textColor: "#d1d4dc",
//           },
//           grid: {
//             vertLines: { color: "rgba(42, 46, 57, 0.035)", style: 0 },
//             horzLines: { color: "rgba(42, 46, 57, 0.035)", style: 0 },
//           },
//           crosshair: {
//             mode: 2,
//             vertLine: {
//               color: "rgba(117, 134, 150, 0.5)",
//               width: 1,
//               style: 2,
//               labelBackgroundColor: "#131722",
//             },
//             horzLine: {
//               color: "rgba(117, 134, 150, 0.5)",
//               width: 1,
//               style: 2,
//               labelBackgroundColor: "#131722",
//             },
//           },
//           rightPriceScale: {
//             borderColor: "#2a2e39",
//             autoScale: true, // important to prevent vertical drag
//             minimumWidth: rightScaleMinWidth,
//             scaleMargins: { top: 0.22, bottom: 0.22 },
//           },
//           timeScale: {
//             borderColor: "#2a2e39",
//             timeVisible: true,
//             secondsVisible: false,
//             barSpacing: barSpacing,
//             rightOffset: rightOffset,
//             fixLeftEdge: true,
//             fixRightEdge: true,
//           },
//           handleScroll: true, // enable scrolling
//           handleScale: true, // enable zoom
//           axisPressedMouseMove: true, // allow dragging
//           pinchZoom: true, // enable touch pinch zoom
//           handleScrollOptions: {
//             vertTouchDrag: false, // disables vertical movement
//           },
//         };

//         // Only set width/height if they're valid, otherwise let chart auto-size
//         if (width > 0 && height > 0 && !isNaN(width) && !isNaN(height)) {
//           chartOptions.width = width;
//           chartOptions.height = height;
//         } else {
//           console.warn("Invalid dimensions, using autoSize");
//           chartOptions.autoSize = true;
//         }

//         chart = createChart(container, chartOptions);
//       } catch (err) {
//         console.error("Failed to create chart:", err);
//         setError("Failed to initialize chart. Please refresh the page.");
//         return;
//       }

//       chartRef.current = chart;

//       // Wait a moment to ensure chart is fully initialized before adding series
//       // Use requestAnimationFrame to ensure chart is rendered
//       requestAnimationFrame(() => {
//         setTimeout(() => {
//           if (!chartRef.current) {
//             console.warn("Chart ref is null, cannot add series");
//             return;
//           }

//           const chart = chartRef.current;

//           // Verify chart is valid
//           if (!chart || typeof chart.addSeries !== "function") {
//             console.error("Chart is not valid or addSeries is not a function");
//             setError("Chart initialization failed. Please refresh.");
//             return;
//           }

//           // Get price format for the symbol (call the function to get current config)
//           const priceFormatConfig = (() => {
//             if (!symbol?.symbol) {
//               return { precision: 5, minMove: 0.00001 };
//             }

//             const symbolUpper = symbol.symbol.toUpperCase();

//             // Forex pairs - 5 decimals, minMove 0.00001
//             if (
//               symbolUpper.includes("EUR") ||
//               symbolUpper.includes("AUD") ||
//               symbolUpper.includes("GBP") ||
//               symbolUpper.includes("NZD") ||
//               symbolUpper.includes("CAD") ||
//               symbolUpper.includes("CHF")
//             ) {
//               return { precision: 5, minMove: 0.00001 };
//             }

//             // JPY pairs - 3 decimals, minMove 0.001
//             if (symbolUpper.includes("JPY")) {
//               return { precision: 3, minMove: 0.001 };
//             }

//             // Crypto - 2 decimals, minMove 0.01
//             if (
//               symbolUpper.includes("BTC") ||
//               symbolUpper.includes("ETH") ||
//               symbolUpper.includes("SOL")
//             ) {
//               return { precision: 2, minMove: 0.01 };
//             }

//             // Other crypto - 4 decimals, minMove 0.0001
//             if (
//               symbolUpper.includes("XRP") ||
//               symbolUpper.includes("ADA") ||
//               symbolUpper.includes("DOGE")
//             ) {
//               return { precision: 4, minMove: 0.0001 };
//             }

//             // Default for forex - 5 decimals
//             return { precision: 5, minMove: 0.00001 };
//           })();

//           // Create candlestick series with TradingView colors (v5 API)
//           try {
//             console.log("Adding candlestick series...", {
//               chartWidth: width,
//               chartHeight: height,
//               priceFormat: priceFormatConfig,
//             });

//             // Use the imported CandlestickSeries class (v5 API)
//             const candlestickSeries = chart.addSeries(CandlestickSeries, {
//               upColor: "#26a69a",
//               downColor: "#ef5350",
//               borderVisible: false, // TradingView style - no borders
//               wickUpColor: "#26a69a",
//               wickDownColor: "#ef5350",
//               priceLineVisible: true, // Show price line
//               lastValueVisible: true, // Show last value
//               priceFormat: {
//                 type: "price",
//                 precision: priceFormatConfig.precision,
//                 minMove: priceFormatConfig.minMove,
//               },
//             });
//             console.log("Candlestick series created successfully");

//             candlestickSeriesRef.current = candlestickSeries;
//           } catch (err) {
//             console.error("Failed to create candlestick series:", err);
//             console.error("Error details:", {
//               name: err.name,
//               message: err.message,
//               stack: err.stack,
//             });
//             setError(
//               `Failed to create chart series: ${err.message || "Unknown error"}`,
//             );
//             return;
//           }

//           // Create line series (for line chart mode) (v5 API)
//           try {
//             console.log("Adding line series...");
//             const lineSeries = chart.addSeries(LineSeries, {
//               color: "#2962ff",
//               lineWidth: 2,
//               lastValueVisible: true,
//               priceLineVisible: true,
//               priceFormat: {
//                 type: "price",
//                 precision: priceFormatConfig.precision,
//                 minMove: priceFormatConfig.minMove,
//               },
//             });
//             lineSeriesRef.current = lineSeries;
//             console.log("Line series created successfully");
//           } catch (err) {
//             console.error("Failed to create line series:", err);
//             setError("Failed to create line series. Please refresh.");
//             return;
//           }

//           // Create volume series (will be updated with colors per bar) (v5 API)
//           // Volume series uses its own price scale and stays at bottom 15-20%
//           try {
//             console.log("Adding volume series...");
//             const volumeSeries = chart.addSeries(HistogramSeries, {
//               priceScaleId: "", // Empty string for separate volume scale (overlay)
//               lastValueVisible: false, // Hide volume last value label on price scale
//               scaleMargins: {
//                 top: 0.9, // Volume occupies bottom 10% - fades into background (1 - 0.90 = 0.10)
//                 bottom: 0.0,
//               },
//             });
//             volumeSeriesRef.current = volumeSeries;
//             console.log("Volume series created successfully");
//           } catch (err) {
//             console.warn(
//               "Failed to create volume series, continuing without it:",
//               err,
//             );
//             volumeSeriesRef.current = null;
//           }

//           // Mark series as ready
//           if (candlestickSeriesRef.current && lineSeriesRef.current) {
//             seriesReadyRef.current = true;
//             console.log("All series initialized and ready");
//           }
//         }, 200); // Increased delay to ensure chart is fully ready
//       });

//       // Handle resize with ResizeObserver for better performance
//       let resizeObserver;
//       if (window.ResizeObserver && container) {
//         resizeObserver = new ResizeObserver((entries) => {
//           for (const entry of entries) {
//             const { width, height } = entry.contentRect;
//             if (chartRef.current && width > 0 && height > 0) {
//               const isNarrowNow = width < 420;
//               chartRef.current.applyOptions({
//                 width: width,
//                 height: height,
//                 rightPriceScale: {
//                   minimumWidth: isNarrowNow ? 44 : 92,
//                 },
//                 timeScale: {
//                   barSpacing: isNarrowNow ? 8 : 14,
//                   rightOffset: isNarrowNow ? 4 : 9,
//                 },
//               });
//             }
//           }
//         });
//         resizeObserver.observe(container);
//       } else {
//         // Fallback to window resize event
//         const handleResize = () => {
//           if (container && chartRef.current) {
//             const width = container.clientWidth || 800;
//             const height = container.clientHeight || 400;
//             if (width > 0 && height > 0) {
//               chartRef.current.applyOptions({
//                 width: width,
//                 height: height,
//               });
//             }
//           }
//         };
//         window.addEventListener("resize", handleResize);
//       }

//       return () => {
//         if (resizeObserver) {
//           resizeObserver.disconnect();
//         }
//         if (dimensionCheckInterval) {
//           clearInterval(dimensionCheckInterval);
//         }
//         if (chartRef.current) {
//           chartRef.current.remove();
//           chartRef.current = null;
//         }
//         // Reset series ready flag when chart is removed
//         seriesReadyRef.current = false;
//         candlestickSeriesRef.current = null;
//         lineSeriesRef.current = null;
//         volumeSeriesRef.current = null;

//         // Cancel any pending requests
//         if (fetchAbortControllerRef.current) {
//           fetchAbortControllerRef.current.abort();
//           fetchAbortControllerRef.current = null;
//         }
//         if (debounceTimerRef.current) {
//           clearTimeout(debounceTimerRef.current);
//           debounceTimerRef.current = null;
//         }
//         if (startPollingTimerRef.current) {
//           clearTimeout(startPollingTimerRef.current);
//           startPollingTimerRef.current = null;
//         }
//         if (priceUpdateIntervalRef.current) {
//           clearInterval(priceUpdateIntervalRef.current);
//           priceUpdateIntervalRef.current = null;
//         }
//       };
//     }
//   }, []);

//   // Fetch historical data
//   const fetchHistory = useCallback(
//     async (symbolName, tf) => {
//       if (
//         !symbolName ||
//         !chartRef.current ||
//         !candlestickSeriesRef.current ||
//         !lineSeriesRef.current
//       ) {
//         console.log("Chart not ready, waiting...", {
//           hasChart: !!chartRef.current,
//           hasCandleSeries: !!candlestickSeriesRef.current,
//           hasLineSeries: !!lineSeriesRef.current,
//         });
//         return;
//       }

//       // Cancel any pending request
//       if (fetchAbortControllerRef.current) {
//         fetchAbortControllerRef.current.abort();
//       }
//       fetchAbortControllerRef.current = new AbortController();

//       setIsLoading(true);
//       setError(null);

//       // Clear existing chart data when switching symbols to prevent visual glitches
//       if (candlestickSeriesRef.current) {
//         try {
//           candlestickSeriesRef.current.setData([]);
//         } catch (e) {
//           // Ignore errors when clearing
//         }
//       }
//       if (lineSeriesRef.current) {
//         try {
//           lineSeriesRef.current.setData([]);
//         } catch (e) {
//           // Ignore errors when clearing
//         }
//       }
//       if (volumeSeriesRef.current) {
//         try {
//           volumeSeriesRef.current.setData([]);
//         } catch (e) {
//           // Ignore errors when clearing
//         }
//       }

//       try {
//         const historyData = await getMarketHistory(symbolName, tf, 500); // Get more candles for better view

//         // Check if request was aborted
//         if (fetchAbortControllerRef.current?.signal.aborted) {
//           console.log("Request aborted for:", symbolName);
//           return;
//         }

//         // Handle empty data (e.g., rate-limited crypto)
//         if (
//           !historyData ||
//           (Array.isArray(historyData) && historyData.length === 0)
//         ) {
//           setError(
//             "No data available. The API may be rate-limited. Please wait a moment and try again.",
//           );
//           setIsLoading(false);
//           return;
//         }

//         if (Array.isArray(historyData) && historyData.length > 0) {
//           // Debug: Log received data
//           console.log(
//             `[TradingChart] Received ${historyData.length} candles for ${symbolName} ${tf}`,
//           );
//           if (historyData.length > 0) {
//             const first = historyData[0];
//             const last = historyData[historyData.length - 1];
//             console.log(
//               `[TradingChart] First candle time: ${first.time} (${new Date(
//                 first.time * 1000,
//               ).toISOString()})`,
//             );
//             console.log(
//               `[TradingChart] Last candle time: ${last.time} (${new Date(
//                 last.time * 1000,
//               ).toISOString()})`,
//             );
//           }

//           // Convert to lightweight-charts format with validation
//           const candles = historyData
//             .map((candle) => {
//               // Validate and convert time
//               // Backend returns time in seconds (UNIX timestamp)
//               let timeValue;
//               if (candle.time) {
//                 // If time is already in seconds (small number < year 2000 in ms), use as-is
//                 // Otherwise, assume it's in milliseconds and convert
//                 if (typeof candle.time === "number") {
//                   // If less than year 2000 in milliseconds (946684800000), it's likely already in seconds
//                   timeValue =
//                     candle.time < 946684800000
//                       ? candle.time
//                       : Math.floor(candle.time / 1000);
//                 } else {
//                   timeValue = Math.floor(
//                     new Date(candle.time).getTime() / 1000,
//                   );
//                 }
//               } else if (candle.timestamp) {
//                 if (typeof candle.timestamp === "number") {
//                   timeValue =
//                     candle.timestamp < 946684800000
//                       ? candle.timestamp
//                       : Math.floor(candle.timestamp / 1000);
//                 } else {
//                   timeValue = Math.floor(
//                     new Date(candle.timestamp).getTime() / 1000,
//                   );
//                 }
//               } else {
//                 timeValue = Math.floor(Date.now() / 1000);
//               }

//               // Validate prices - ensure they are valid numbers
//               const open =
//                 typeof candle.open === "number" && !isNaN(candle.open)
//                   ? candle.open
//                   : candle.close || 0;
//               const high =
//                 typeof candle.high === "number" && !isNaN(candle.high)
//                   ? candle.high
//                   : candle.close || open;
//               const low =
//                 typeof candle.low === "number" && !isNaN(candle.low)
//                   ? candle.low
//                   : candle.close || open;
//               const close =
//                 typeof candle.close === "number" && !isNaN(candle.close)
//                   ? candle.close
//                   : open;

//               // Ensure all prices are positive and valid
//               if (
//                 open <= 0 ||
//                 high <= 0 ||
//                 low <= 0 ||
//                 close <= 0 ||
//                 isNaN(open) ||
//                 isNaN(high) ||
//                 isNaN(low) ||
//                 isNaN(close)
//               ) {
//                 return null; // Skip invalid candles
//               }

//               // Ensure high >= max(open, close) and low <= min(open, close)
//               const validHigh = Math.max(high, open, close);
//               const validLow = Math.min(low, open, close);

//               return {
//                 time: toUTCTimestamp(timeValue),
//                 open: open,
//                 high: validHigh,
//                 low: validLow,
//                 close: close,
//               };
//             })
//             .filter((candle) => candle !== null) // Remove invalid candles
//             .sort((a, b) => a.time - b.time);

//           // Remove duplicate timestamps (keep the last one)
//           const uniqueCandles = [];
//           const seenTimes = new Set();
//           for (let i = candles.length - 1; i >= 0; i--) {
//             const candle = candles[i];
//             if (!seenTimes.has(candle.time)) {
//               seenTimes.add(candle.time);
//               uniqueCandles.unshift(candle); // Add to beginning to maintain order
//             }
//           }

//           // Only proceed if we have valid candles
//           if (uniqueCandles.length === 0) {
//             setError("No valid candle data received");
//             setIsLoading(false);
//             return;
//           }

//           const lineData = uniqueCandles.map((c) => ({
//             time: c.time,
//             value: c.close,
//           }));

//           // Create volume data matching the unique candles by time
//           const candleTimeMap = new Map(candles.map((c) => [c.time, c]));
//           const volumeData = [];
//           for (const candle of historyData) {
//             let timeValue;
//             if (candle.time) {
//               // Backend returns time in seconds
//               if (typeof candle.time === "number") {
//                 timeValue =
//                   candle.time < 946684800000
//                     ? candle.time
//                     : Math.floor(candle.time / 1000);
//               } else {
//                 timeValue = Math.floor(new Date(candle.time).getTime() / 1000);
//               }
//             } else if (candle.timestamp) {
//               if (typeof candle.timestamp === "number") {
//                 timeValue =
//                   candle.timestamp < 946684800000
//                     ? candle.timestamp
//                     : Math.floor(candle.timestamp / 1000);
//               } else {
//                 timeValue = Math.floor(
//                   new Date(candle.timestamp).getTime() / 1000,
//                 );
//               }
//             } else {
//               continue; // Skip if no time
//             }

//             const utcTime = toUTCTimestamp(timeValue);
//             const matchingCandle = candleTimeMap.get(utcTime);

//             if (matchingCandle) {
//               const volume =
//                 typeof candle.volume === "number" && !isNaN(candle.volume)
//                   ? candle.volume
//                   : 0;
//               const isUp = matchingCandle.close >= matchingCandle.open;

//               // Use rgba with ~0.24 opacity for volume bars that fade into background (TradingView parity)
//               volumeData.push({
//                 time: utcTime,
//                 value: volume,
//                 color: isUp
//                   ? "rgba(38, 166, 154, 0.24)"
//                   : "rgba(239, 83, 80, 0.24)", // Reduced opacity for visual calm
//               });
//             }
//           }

//           // Sort volume data by time
//           volumeData.sort((a, b) => a.time - b.time);

//           // Filter and validate volume data (needed outside updateChart function)
//           const validVolumeData = volumeData.filter(
//             (v) =>
//               v &&
//               typeof v.time === "number" &&
//               typeof v.value === "number" &&
//               !isNaN(v.time) &&
//               !isNaN(v.value) &&
//               v.time > 0,
//           );
//           if (validVolumeData.length > 0) {
//             // Ensure volume data is also sorted
//             validVolumeData.sort((a, b) => a.time - b.time);
//           }

//           // Final validation: ensure data is strictly sorted and has no duplicates
//           const finalCandles = [];
//           let lastTime = null;
//           for (const candle of uniqueCandles) {
//             if (candle.time > (lastTime || -1)) {
//               finalCandles.push(candle);
//               lastTime = candle.time;
//             }
//           }

//           if (finalCandles.length === 0) {
//             setError("No valid candle data after processing");
//             setIsLoading(false);
//             return;
//           }

//           const finalLineData = finalCandles.map((c) => ({
//             time: c.time,
//             value: c.close,
//           }));

//           // Update series based on chart type with error handling
//           // Wait a tiny bit to ensure chart is fully initialized
//           const updateChart = () => {
//             try {
//               if (
//                 !chartRef.current ||
//                 !candlestickSeriesRef.current ||
//                 !lineSeriesRef.current
//               ) {
//                 console.warn("Chart or series not initialized, retrying...");
//                 setTimeout(updateChart, 100);
//                 return;
//               }

//               if (
//                 chartType === "candle" &&
//                 candlestickSeriesRef.current &&
//                 finalCandles.length > 0
//               ) {
//                 console.log(
//                   `[TradingChart] Setting candlestick data for ${symbol?.symbol} ${tf}: ${finalCandles.length} candles`,
//                 );

//                 // Frontend validation: Log last 5 candles to check structure
//                 const last5 = finalCandles.slice(-5);
//                 console.log(
//                   "[TradingChart] Last 5 candles structure:",
//                   last5.map((c) => ({
//                     time: c.time,
//                     open: c.open,
//                     high: c.high,
//                     low: c.low,
//                     close: c.close,
//                     hasValue: "value" in c, // Should NOT have 'value' field
//                     allNumeric:
//                       typeof c.open === "number" &&
//                       typeof c.high === "number" &&
//                       typeof c.low === "number" &&
//                       typeof c.close === "number",
//                     isFlat:
//                       c.open === c.high &&
//                       c.high === c.low &&
//                       c.low === c.close,
//                   })),
//                 );

//                 // Verify first candle is valid
//                 const firstCandle = finalCandles[0];
//                 if (
//                   firstCandle &&
//                   typeof firstCandle.time === "number" &&
//                   firstCandle.time > 0
//                 ) {
//                   // Ensure we're passing the correct structure (not line data)
//                   const validCandles = finalCandles
//                     .map((c) => {
//                       // If it has 'value' instead of OHLC, skip it
//                       if ("value" in c && !("open" in c)) {
//                         console.warn(
//                           "[TradingChart] Invalid candle structure (has value, missing OHLC):",
//                           c,
//                         );
//                         return null;
//                       }
//                       // Ensure all OHLC fields are numeric
//                       if (
//                         typeof c.open !== "number" ||
//                         typeof c.high !== "number" ||
//                         typeof c.low !== "number" ||
//                         typeof c.close !== "number"
//                       ) {
//                         console.warn(
//                           "[TradingChart] Invalid candle structure (non-numeric OHLC):",
//                           c,
//                         );
//                         return null;
//                       }
//                       return {
//                         time: c.time,
//                         open: c.open,
//                         high: c.high,
//                         low: c.low,
//                         close: c.close,
//                       };
//                     })
//                     .filter((c) => c !== null);

//                   if (validCandles.length > 0) {
//                     candlestickSeriesRef.current.setData(validCandles);
//                   } else {
//                     console.error(
//                       "[TradingChart] No valid candles after validation",
//                     );
//                   }
//                 } else {
//                   console.error("Invalid first candle:", firstCandle);
//                 }
//               } else if (
//                 chartType === "line" &&
//                 lineSeriesRef.current &&
//                 finalLineData.length > 0
//               ) {
//                 console.log(
//                   "Setting line data:",
//                   finalLineData.length,
//                   "points",
//                 );
//                 // Verify first point is valid
//                 const firstPoint = finalLineData[0];
//                 if (
//                   firstPoint &&
//                   typeof firstPoint.time === "number" &&
//                   firstPoint.time > 0
//                 ) {
//                   lineSeriesRef.current.setData(finalLineData);
//                 } else {
//                   console.error("Invalid first point:", firstPoint);
//                 }
//               }

//               // Update volume (only if we have valid data)
//               if (volumeSeriesRef.current && validVolumeData.length > 0) {
//                 volumeSeriesRef.current.setData(validVolumeData);
//               }
//             } catch (err) {
//               console.error("Error setting chart data:", err);
//               console.error("Error name:", err.name);
//               console.error("Error message:", err.message);
//               console.error(
//                 "Candles data sample (first 3):",
//                 finalCandles.slice(0, 3),
//               );
//               console.error("First candle details:", finalCandles[0]);
//               setError(
//                 `Failed to render chart: ${err.message || "Unknown error"}`,
//               );
//             }
//           };

//           // Try immediately, then retry if needed
//           updateChart();

//           // Professional standard: fit all data in view (no zoomed-in view on load/symbol change)
//           requestAnimationFrame(() => {
//             try {
//               if (chartRef.current && typeof chartRef.current.timeScale === "function") {
//                 chartRef.current.timeScale().fitContent();
//               }
//             } catch (e) {
//               // ignore if API not available
//             }
//           });

//           // Update current price reference and reset volume tracking
//           if (finalCandles.length > 0) {
//             const lastCandle = finalCandles[finalCandles.length - 1];
//             currentPriceRef.current = lastCandle.close;
//             lastUpdateTimeRef.current = Date.now();

//             // Reset volume tracking for the current/last candle
//             const lastVolume =
//               validVolumeData.length > 0
//                 ? validVolumeData[validVolumeData.length - 1]?.value || 0
//                 : 0;
//             currentVolumeRef.current = lastVolume;
//           }

//           // Notify parent of price update
//           if (onPriceUpdate && finalCandles.length > 0) {
//             const lastCandle = finalCandles[finalCandles.length - 1];
//             let decimals = 5;
//             if (symbolName.includes("JPY")) decimals = 3;
//             else if (
//               symbolName.includes("BTC") ||
//               symbolName.includes("ETH") ||
//               symbolName.includes("SOL")
//             )
//               decimals = 2;
//             else if (
//               symbolName.includes("XRP") ||
//               symbolName.includes("ADA") ||
//               symbolName.includes("DOGE")
//             )
//               decimals = 4;

//             const formattedPrice = parseFloat(
//               lastCandle.close.toFixed(decimals),
//             );
//             onPriceUpdate(symbolName, formattedPrice);
//           }
//         } else {
//           // No data received - clear series
//           if (candlestickSeriesRef.current) {
//             candlestickSeriesRef.current.setData([]);
//           }
//           if (lineSeriesRef.current) {
//             lineSeriesRef.current.setData([]);
//           }
//           if (volumeSeriesRef.current) {
//             volumeSeriesRef.current.setData([]);
//           }
//         }
//       } catch (err) {
//         // Don't show error if request was aborted
//         if (fetchAbortControllerRef.current?.signal.aborted) {
//           console.log("Request aborted, ignoring error");
//           return;
//         }

//         console.error("Failed to fetch market history:", err);

//         // Handle rate limit errors gracefully
//         if (
//           err?.message?.includes("Too Many Requests") ||
//           err?.message?.includes("rate limit")
//         ) {
//           setError("Rate limit reached. Please wait a moment and try again.");
//         } else if (err?.message?.includes("Symbol not found")) {
//           setError(
//             `Symbol ${symbolName} not found. Please check the symbol name.`,
//           );
//         } else {
//           setError(err?.message || "Failed to load chart data");
//         }
//       } finally {
//         // Only clear loading if request wasn't aborted
//         if (!fetchAbortControllerRef.current?.signal.aborted) {
//           setIsLoading(false);
//         }
//         fetchAbortControllerRef.current = null;
//       }
//     },
//     [chartType, onPriceUpdate],
//   );

//   // Fetch historical data when symbol or timeframe changes (with debouncing)
//   useEffect(() => {
//     // Clear any pending debounce timer
//     if (debounceTimerRef.current) {
//       clearTimeout(debounceTimerRef.current);
//     }

//     // Cancel any pending request
//     if (fetchAbortControllerRef.current) {
//       fetchAbortControllerRef.current.abort();
//     }

//     if (
//       symbol?.symbol &&
//       chartRef.current &&
//       candlestickSeriesRef.current &&
//       lineSeriesRef.current &&
//       seriesReadyRef.current
//     ) {
//       // Debounce to prevent rapid symbol changes from causing multiple requests
//       debounceTimerRef.current = setTimeout(() => {
//         fetchHistory(symbol.symbol, timeframe);
//       }, 300); // 300ms debounce

//       return () => {
//         if (debounceTimerRef.current) {
//           clearTimeout(debounceTimerRef.current);
//         }
//       };
//     } else if (symbol?.symbol && chartRef.current && !seriesReadyRef.current) {
//       // If symbol exists but series aren't ready yet, wait a bit and retry
//       debounceTimerRef.current = setTimeout(() => {
//         if (
//           candlestickSeriesRef.current &&
//           lineSeriesRef.current &&
//           seriesReadyRef.current
//         ) {
//           fetchHistory(symbol.symbol, timeframe);
//         }
//       }, 500);

//       return () => {
//         if (debounceTimerRef.current) {
//           clearTimeout(debounceTimerRef.current);
//         }
//       };
//     }
//   }, [symbol?.symbol, timeframe, fetchHistory]);

//   // Update chart type (only re-fetch if chart type changes, not on symbol change)
//   useEffect(() => {
//     if (!chartRef.current || !symbol?.symbol || !seriesReadyRef.current) return;

//     // Debounce chart type changes too
//     const timer = setTimeout(() => {
//       fetchHistory(symbol.symbol, timeframe);
//     }, 200);

//     return () => clearTimeout(timer);
//   }, [chartType]); // Only depend on chartType, not symbol or timeframe

//   // Update current price line
//   const updateCurrentPriceLine = useCallback(
//     (price) => {
//       if (!chartRef.current) return;

//       // Remove existing price line
//       if (currentPriceLineRef.current) {
//         if (chartType === "candle" && candlestickSeriesRef.current) {
//           candlestickSeriesRef.current.removePriceLine(
//             currentPriceLineRef.current,
//           );
//         } else if (chartType === "line" && lineSeriesRef.current) {
//           lineSeriesRef.current.removePriceLine(currentPriceLineRef.current);
//         }
//       }

//       // Add new price line (TradingView style - subtle and dotted)
//       const priceLine = {
//         price: price,
//         color: "rgba(41, 98, 255, 0.6)", // Subtle blue with transparency for TradingView parity
//         lineWidth: 1,
//         lineStyle: 2, // Dashed (dotted appearance)
//         axisLabelVisible: true,
//         title: formatPrice(price),
//       };

//       if (chartType === "candle" && candlestickSeriesRef.current) {
//         currentPriceLineRef.current =
//           candlestickSeriesRef.current.createPriceLine(priceLine);
//       } else if (chartType === "line" && lineSeriesRef.current) {
//         currentPriceLineRef.current =
//           lineSeriesRef.current.createPriceLine(priceLine);
//       }
//     },
//     [chartType, formatPrice],
//   );

//   // Use unified price context for real-time updates (updates every 800ms)
//   useEffect(() => {
//     if (!symbol?.symbol || !chartRef.current) return;

//     // Wait for series to be ready
//     const checkAndStartUpdates = () => {
//       if (
//         !seriesReadyRef.current ||
//         !candlestickSeriesRef.current ||
//         !lineSeriesRef.current
//       ) {
//         startPollingTimerRef.current = setTimeout(checkAndStartUpdates, 200);
//         return;
//       }

//       // Series are ready, use unified price context
//       // Prices update every 800ms automatically from PriceContext
//       const updateChartFromUnifiedPrices = () => {
//         const priceData = getUnifiedPrice(symbol.symbol, "bid");

//         if (
//           priceData !== null &&
//           priceData !== undefined &&
//           !isNaN(priceData) &&
//           priceData > 0
//         ) {
//           const newPrice = priceData;
//           const now = Date.now();
//           const tfMs = timeframeToMs[timeframe] || 60000 * 5;
//           const currentTime = toUTCTimestamp(now);

//           // Get current data
//           const currentCandles = candlestickSeriesRef.current?.data() || [];
//           const currentLineData = lineSeriesRef.current?.data() || [];

//           // Always update the price line
//           currentPriceRef.current = newPrice;
//           lastUpdateTimeRef.current = now;
//           updateCurrentPriceLine(newPrice);

//           // Notify parent of price update
//           if (onPriceUpdate) {
//             let decimals = 5;
//             if (symbol.symbol.includes("JPY")) decimals = 3;
//             else if (
//               symbol.symbol.includes("BTC") ||
//               symbol.symbol.includes("ETH") ||
//               symbol.symbol.includes("SOL")
//             )
//               decimals = 2;
//             else if (
//               symbol.symbol.includes("XRP") ||
//               symbol.symbol.includes("ADA") ||
//               symbol.symbol.includes("DOGE")
//             )
//               decimals = 4;

//             const formattedPrice = parseFloat(newPrice.toFixed(decimals));
//             onPriceUpdate(symbol.symbol, formattedPrice);
//           }

//           // Update candles/line if we have existing data
//           if (currentCandles.length > 0 || currentLineData.length > 0) {
//             const lastCandleTime =
//               currentCandles.length > 0
//                 ? currentCandles[currentCandles.length - 1].time
//                 : currentLineData[currentLineData.length - 1].time;

//             if (typeof lastCandleTime !== "number" || isNaN(lastCandleTime)) {
//               console.warn("Invalid last candle time, skipping update");
//               return;
//             }

//             // Check if we need a new candle (timeframe period has passed)
//             if (currentTime - lastCandleTime >= tfMs / 1000) {
//               const openPrice =
//                 currentPriceRef.current > 0
//                   ? currentPriceRef.current
//                   : newPrice;
//               const newCandle = {
//                 time: currentTime,
//                 open: openPrice,
//                 close: newPrice,
//                 high: Math.max(openPrice, newPrice),
//                 low: Math.min(openPrice, newPrice),
//               };

//               const newLineData = {
//                 time: currentTime,
//                 value: newPrice,
//               };

//               currentVolumeRef.current = 0;

//               const newVolumePoint = {
//                 time: currentTime,
//                 value: 0,
//                 color:
//                   newPrice >= openPrice
//                     ? "rgba(38, 166, 154, 0.24)"
//                     : "rgba(239, 83, 80, 0.24)",
//               };

//               try {
//                 if (chartType === "candle" && candlestickSeriesRef.current) {
//                   candlestickSeriesRef.current.update(newCandle);
//                 } else if (chartType === "line" && lineSeriesRef.current) {
//                   lineSeriesRef.current.update(newLineData);
//                 }

//                 if (volumeSeriesRef.current) {
//                   volumeSeriesRef.current.update(newVolumePoint);
//                 }
//               } catch (err) {
//                 console.error(
//                   `[Chart] Error updating chart for ${symbol.symbol}:`,
//                   err,
//                 );
//               }
//             } else {
//               // Aggregate tick into current candle
//               const lastCandle =
//                 currentCandles.length > 0
//                   ? currentCandles[currentCandles.length - 1]
//                   : null;

//               if (
//                 lastCandle &&
//                 typeof lastCandle.time === "number" &&
//                 !isNaN(lastCandle.time)
//               ) {
//                 const lastHigh =
//                   typeof lastCandle.high === "number" && !isNaN(lastCandle.high)
//                     ? lastCandle.high
//                     : newPrice;
//                 const lastLow =
//                   typeof lastCandle.low === "number" && !isNaN(lastCandle.low)
//                     ? lastCandle.low
//                     : newPrice;
//                 const lastOpen =
//                   typeof lastCandle.open === "number" && !isNaN(lastCandle.open)
//                     ? lastCandle.open
//                     : newPrice;

//                 const updatedCandle = {
//                   time: lastCandle.time,
//                   open: lastOpen,
//                   close: newPrice,
//                   high: Math.max(lastHigh, newPrice),
//                   low: Math.min(lastLow, newPrice),
//                 };

//                 const updatedLineData = {
//                   time: lastCandle.time,
//                   value: newPrice,
//                 };

//                 currentVolumeRef.current += 1;

//                 const updatedVolumePoint = {
//                   time: lastCandle.time,
//                   value: currentVolumeRef.current,
//                   color:
//                     newPrice >= lastOpen
//                       ? "rgba(38, 166, 154, 0.24)"
//                       : "rgba(239, 83, 80, 0.24)",
//                 };

//                 try {
//                   if (chartType === "candle" && candlestickSeriesRef.current) {
//                     candlestickSeriesRef.current.update(updatedCandle);
//                   } else if (chartType === "line" && lineSeriesRef.current) {
//                     lineSeriesRef.current.update(updatedLineData);
//                   }

//                   if (volumeSeriesRef.current) {
//                     volumeSeriesRef.current.update(updatedVolumePoint);
//                   }
//                 } catch (err) {
//                   console.error(
//                     `[Chart] Error updating existing candle/line for ${symbol.symbol}:`,
//                     err,
//                   );
//                 }
//               }
//             }
//           } else {
//             // FIX: If no existing data, create initial candle/line point
//             // This ensures the chart updates even when data is being fetched
//             // Use setData() for initial point, then update() for subsequent updates
//             const initialCandle = {
//               time: currentTime,
//               open: newPrice,
//               close: newPrice,
//               high: newPrice,
//               low: newPrice,
//             };

//             const initialLineData = {
//               time: currentTime,
//               value: newPrice,
//             };

//             const initialVolumePoint = {
//               time: currentTime,
//               value: 1,
//               color: "rgba(38, 166, 154, 0.24)",
//             };

//             try {
//               // Use setData() for initial point when series is empty
//               if (chartType === "candle" && candlestickSeriesRef.current) {
//                 candlestickSeriesRef.current.setData([initialCandle]);
//               } else if (chartType === "line" && lineSeriesRef.current) {
//                 lineSeriesRef.current.setData([initialLineData]);
//               }

//               if (volumeSeriesRef.current) {
//                 volumeSeriesRef.current.setData([initialVolumePoint]);
//               }

//               // Update volume tracking
//               currentVolumeRef.current = 1;
//             } catch (err) {
//               // If setData fails, the series might not be initialized yet - that's okay
//               // The fetchHistory will populate it soon
//               console.log(
//                 `[Chart] Cannot initialize empty chart yet for ${symbol.symbol}, waiting for data...`,
//               );
//             }
//           }
//         }
//       };

//       // Subscribe to unified price updates (updates every 800ms)
//       // Use a small interval to check for price updates from unified context
//       const updateInterval = setInterval(() => {
//         updateChartFromUnifiedPrices();
//       }, 800); // Match unified price update interval

//       priceUpdateIntervalRef.current = updateInterval;
//     };

//     // Start checking for series readiness
//     checkAndStartUpdates();

//     return () => {
//       if (startPollingTimerRef.current) {
//         clearTimeout(startPollingTimerRef.current);
//         startPollingTimerRef.current = null;
//       }
//       if (priceUpdateIntervalRef.current) {
//         clearInterval(priceUpdateIntervalRef.current);
//         priceUpdateIntervalRef.current = null;
//       }
//     };
//   }, [
//     symbol?.symbol,
//     timeframe,
//     chartType,
//     onPriceUpdate,
//     updateCurrentPriceLine,
//     getUnifiedPrice,
//   ]);

//   // Update position markers
//   useEffect(() => {
//     if (!chartRef.current || !symbol?.symbol) return;

//     // Remove existing markers
//     positionMarkersRef.current.forEach((marker) => {
//       if (chartType === "candle" && candlestickSeriesRef.current) {
//         candlestickSeriesRef.current.removePriceLine(marker);
//       } else if (chartType === "line" && lineSeriesRef.current) {
//         lineSeriesRef.current.removePriceLine(marker);
//       }
//     });
//     positionMarkersRef.current = [];

//     // Add markers for positions matching current symbol
//     const relevantPositions = openPositions.filter(
//       (p) => p.symbol === symbol.symbol,
//     );

//     relevantPositions.forEach((pos) => {
//       const color = pos.type === "buy" ? "#26a69a" : "#ef5350"; // TradingView colors
//       const priceLine = {
//         price: pos.entryPrice,
//         color: color,
//         lineWidth: 1,
//         lineStyle: 2, // Dashed
//         axisLabelVisible: true,
//         title: `${pos.type.toUpperCase()} ${pos.lotSize}`,
//       };

//       let marker;
//       if (chartType === "candle" && candlestickSeriesRef.current) {
//         marker = candlestickSeriesRef.current.createPriceLine(priceLine);
//       } else if (chartType === "line" && lineSeriesRef.current) {
//         marker = lineSeriesRef.current.createPriceLine(priceLine);
//       }

//       if (marker) {
//         positionMarkersRef.current.push(marker);
//       }
//     });
//   }, [openPositions, symbol?.symbol, chartType]);

//   // Calculate price change
//   const getPriceChange = useCallback(() => {
//     if (!chartRef.current) return { change: 0, percent: 0, lastPrice: 0 };

//     const data =
//       chartType === "candle"
//         ? candlestickSeriesRef.current?.data() || []
//         : lineSeriesRef.current?.data() || [];

//     if (data.length < 2)
//       return { change: 0, percent: 0, lastPrice: currentPriceRef.current };

//     const first = data[0];
//     const last = data[data.length - 1];
//     const firstPrice = "close" in first ? first.close : first.value;
//     const lastPrice = "close" in last ? last.close : last.value;

//     const change = lastPrice - firstPrice;
//     const percent = firstPrice > 0 ? (change / firstPrice) * 100 : 0;

//     return { change, percent, lastPrice };
//   }, [chartType]);

//   const priceInfo = getPriceChange();

//   return (
//     <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4 h-full flex flex-col min-w-0 overflow-hidden">
//       {/* Chart Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
//         <div>
//           <h3 className="text-base sm:text-lg font-bold text-white">
//             {symbol?.symbol || "EUR/USD"}
//           </h3>
//           <span
//             className={`text-xs sm:text-sm font-mono ${
//               priceInfo.percent >= 0 ? "text-emerald-400" : "text-red-400"
//             }`}
//           >
//             {formatPrice(priceInfo.lastPrice)}
//             <span className="ml-2">
//               {priceInfo.percent >= 0 ? "+" : ""}
//               {priceInfo.percent.toFixed(2)}%
//             </span>
//           </span>
//         </div>

//         <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
//           {/* Timeframe Selection */}
//           <div className="flex bg-slate-800 rounded-lg p-0.5">
//             {timeframes.map((tf) => (
//               <Button
//                 key={tf}
//                 size="sm"
//                 variant={timeframe === tf ? "default" : "ghost"}
//                 onClick={() => setTimeframe(tf)}
//                 className={`h-6 px-1.5 sm:px-2 text-xs ${
//                   timeframe === tf
//                     ? "bg-emerald-500/20 text-emerald-200 hover:text-white"
//                     : "text-slate-400 "
//                 }`}
//               >
//                 {tf}
//               </Button>
//             ))}
//           </div>

//           {/* Chart Type Toggle */}
//           <Button
//             size="sm"
//             variant="ghost"
//             onClick={() =>
//               setChartType(chartType === "candle" ? "line" : "candle")
//             }
//             className={`h-6 w-6 p-0 ${
//               chartType === "candle"
//                 ? "text-emerald-400 bg-emerald-500/20 "
//                 : "text-slate-400 hover:text-white"
//             }`}
//             title={
//               chartType === "candle"
//                 ? t("terminal.chart.switchToLineChart")
//                 : t("terminal.chart.switchToCandlestickChart")
//             }
//           >
//             <div className="group cursor-pointer">
//               {chartType === "candle" ? (
//                 <BarChart2 className="w-4 h-4 text-gray-500 group-hover:text-black transition-colors" />
//               ) : (
//                 <LineChartIcon className="w-4 h-4 text-gray-500 group-hover:text-black transition-colors" />
//               )}
//             </div>
//           </Button>
//         </div>
//       </div>

//       {/* Chart Area - min-w-0 so flex doesn't prevent chart from fitting on mobile */}
//       <div className="flex-1 relative bg-[#131722] rounded-lg overflow-hidden min-h-[300px] min-w-0">
//         {isLoading && (
//           <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#131722]/80">
//             <div className="text-[#d1d4dc] text-sm">
//               {t("terminal.chart.loadingData")}
//             </div>
//           </div>
//         )}

//         {error && (
//           <div className="absolute inset-0 flex items-center justify-center z-10 bg-[#131722]/80">
//             <div className="text-red-400 text-sm">{error}</div>
//           </div>
//         )}

//         <div ref={chartContainerRef} className="w-full h-full min-w-0 min-h-0" />
//       </div>

//       {/* Chart Footer - Minimal */}
//       <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
//         <div className="flex items-center gap-1">
//           <Clock className="w-2.5 h-2.5" />
//           <span>
//             {new Date(lastUpdateTimeRef.current).toLocaleTimeString()}
//           </span>
//         </div>
//         <span>{timeframe}</span>
//       </div>
//     </Card>
//   );
// }


































































import React, { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { createChart } from "lightweight-charts";
// import { useTrading } from "../../contexts/TradingContext";
// import BuySellPanel from "./BuySellPanel";
// import MarketExecutionModal from "./MarketExecutionModal";
import { getMarketHistory } from "@/api/market-data";
import socket from "@/lib/socket";
// TradingView/MT5-Style Professional Engines
import { normalizeTime, alignToTimeframe } from "../../utils/timeEngine";
import { processCandles, processSingleCandle, timeframeToSeconds } from "../../utils/candleEngine";
import { isForexSymbol, isCryptoSymbol } from "../../config/symbolConfig";
import { useTrading } from "@/contexts/TradingContext";
// import { getMarketHistory, getCurrentPrice } from "@/api/market-data";
import { usePrices } from "@/contexts/PriceContext";
import {  useTraderTheme } from "../trader/TraderPanelLayout";
import BuySellPanel from "../trader/BuySellPanel";
import MarketExecutionModal from "../trader/MarketExecutionModal";

// import html2canvas from "html2canvas";

// MT5/TradingView-style: default history (days) per timeframe for dynamic range
const TIMEFRAME_DEFAULT_DAYS = {
  M1: 3,
  M5: 7,
  M15: 14,
  M30: 30,
  H1: 90,
  H4: 180,
  D1: 1095,   // 3 years
  W1: 1825,   // 5 years
  MN: 3650,   // 10 years
}

function getDaysBackForTimeframe(timeframe) {
  if (!timeframe) return 7
  const key = String(timeframe).toUpperCase()
  return TIMEFRAME_DEFAULT_DAYS[key] ?? 7
}

// Min bars to request so M15/M30 get full history (API limit caps response)
function getLimitForTimeframe(timeframe, daysBack) {
  const key = String(timeframe || '').toUpperCase()
  const days = daysBack || getDaysBackForTimeframe(timeframe)
  const barsPerDay = { M1: 1440, M5: 288, M15: 96, M30: 48, H1: 24, H4: 6, D1: 1, W1: 1 / 7, MN: 1 / 30 }[key] || 96
  const needed = Math.ceil(days * (typeof barsPerDay === 'number' ? barsPerDay : 96))
  return Math.min(Math.max(needed, 500), 5000)
}

// Professional Data Validation Utility
// Ensures array is strictly ascending by time with unique times
// Uses last-wins merge (forex: latest close should win)
const ensureAscendingTimeOrder = (data) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  // Normalize all times to integers
  const normalized = data.map(item => ({
    ...item,
    time: normalizeTime(item.time)
  })).filter(item => item.time != null);

  // Sort by time (ascending)
  normalized.sort((a, b) => a.time - b.time);

  // Last-wins merge (forex: latest close should win)
  const map = new Map();
  for (const item of normalized) {
    map.set(item.time, item); // Last occurrence overwrites
  }

  return Array.from(map.values()).sort((a, b) => a.time - b.time);
};


const prepareCandlesForSetData = (candles, selectedTimeframe) => {
  const tfSec = timeframeToSeconds(selectedTimeframe);

  const aligned = (Array.isArray(candles) ? candles : [])
    .map(c => {
      const t = normalizeTime(c.time); // handles sec/ms + null safety
      return {
        ...c,
        time: t != null ? alignToTimeframe(Number(t), tfSec) : null,
      };
    })
    .filter(c => c.time != null);

  aligned.sort((a, b) => a.time - b.time);

  // last-wins (after alignment)
  const map = new Map();
  for (const c of aligned) map.set(c.time, c);

  return Array.from(map.values()).sort((a, b) => a.time - b.time);
};


// Distance from point (px, py) to line segment (x1,y1)-(x2,y2)
function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / (len * len);
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx, projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}


// Parallel channel: base line p1–p2, offset point p3. Returns two points for the parallel line (same time range as base).
function computeParallelLineFromThreePoints(chart, series, p1, p2, p3) {
  if (!p1 || !p2 || !p3) return null;
  const t1 = p1.time, t2 = p2.time, dt = t2 - t1;
  const pr1 = p1.price, pr2 = p2.price, pr3 = p3.price;
  if (Math.abs(dt) < 1e-9) {
    // Vertical base line: parallel line at t3, same price offset
    const offset = pr3 - pr1;
    return [
      { time: t1, price: pr1 + offset },
      { time: t2 + 1, price: pr2 + offset },
    ];
  }
  const slope = (pr2 - pr1) / dt;
  const priceAtT1 = pr3 + slope * (t1 - p3.time);
  const priceAtT2 = pr3 + slope * (t2 - p3.time);
  return [
    { time: t1, price: priceAtT1 },
    { time: t2, price: priceAtT2 },
  ];
}




// Generate sample OHLC candles (fallback for non-Binance symbols)
function generateCandles(count = 200, startPrice = 113.638) {
  const candles = [];
  let price = startPrice;

  const start = Math.floor(Date.now() / 1000) - count * 60;

  for (let i = 0; i < count; i++) {
    const time = start + i * 60;
    const open = price;
    const change = (Math.random() - 0.5) * 0.08;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 0.04;
    const low = Math.min(open, close) - Math.random() * 0.04;

    candles.push({
      time,
      open: +open.toFixed(5),
      high: +high.toFixed(5),
      low: +low.toFixed(5),
      close: +close.toFixed(5),
    });

    price = close;
  }

  return candles;
}

const ChartArea = forwardRef(function ChartArea({
  bidPrice = "113.638",
  askPrice = "113.649",
  showBuySellPanel = true,
  onBuyClick: onBuyClickProp,
  onSellClick: onSellClickProp,
}, ref) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const drawingObjectsRef = useRef([]);
  const isDrawingRef = useRef(false);
  const startPointRef = useRef(null);
  const endPointRef = useRef(null);
  const currentDrawingRef = useRef(null);
  const trendLineFirstPointRef = useRef(null); // null = no first point; { time, price } = waiting for second click
  const parallelChannelPointsRef = useRef([]); // 3-click parallel channel: [p1, p2] then p3
  const [selectedChartObject, setSelectedChartObject] = useState(null); // selected trend line for resize/move
  const [handlePositions, setHandlePositions] = useState([]); // [{x,y},{x,y}] for selected trend line handles
  const dragModeRef = useRef(null); // null | "handle1" | "handle2" | "line"
  const dragStartRef = useRef(null); // { x, y, point1, point2 } for move
  const selectedChartObjectRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const [isModalOpen, setIsModalOpen] = useState(false);








  useEffect(() => {
    selectedChartObjectRef.current = selectedChartObject;
  }, [selectedChartObject]);
  // Store zoom state per symbol+timeframe (MT5/TradingView style)
  // Key format: "SYMBOL_TIMEFRAME" (e.g., "GBPJPY_M1")
  const zoomStateMapRef = useRef(new Map());
  // Track last symbol+timeframe for stale detection
  const lastSymbolTimeframeRef = useRef(null);

  // Helper to get zoom state key
  const getZoomKey = (symbol, timeframe) => `${symbol}_${timeframe}`;

  // Helper to get/save zoom state for current symbol+timeframe
  const getZoomState = () => {
    const key = getZoomKey(selectedSymbolStr, selectedTimeframe);
    return zoomStateMapRef.current.get(key) || null;
  };

  const saveZoomState = (visibleRange) => {
    if (!visibleRange) return;
    const key = getZoomKey(selectedSymbolStr, selectedTimeframe);
    zoomStateMapRef.current.set(key, visibleRange);
  };

  const { getPrice: getUnifiedPrice } = usePrices();
  const {
    activeTool,
    setActiveTool,
    showGrid,
    // snapToGrid,
    chartObjects,
    setChartObjects,
    orders,
    selectedSymbol,
    selectedTimeframe,
    drawingsVisible,
    chartType,
    chartLocked,
  } = useTrading();
  const { isDark } = useTraderTheme();


  const selectedSymbolStr = typeof selectedSymbol === "string" ? selectedSymbol : (selectedSymbol?.symbol ?? "");

  const orderPriceLinesRef = useRef([]);
  // const [isModalOpen, setIsModalOpen] = useState(false);
  // const [modalOrderType, setModalOrderType] = useState(null);
  const [candles, setCandles] = useState([]);
  const [candlesLoading, setCandlesLoading] = useState(true);
  const [modalOrderType, setModalOrderType] = useState(null);
  // const socketRef = useRef(null);
  const candlesMapRef = useRef(new Map()); // Store candles by time for quick updates
  const candleUpdateTimeoutRef = useRef(null); // (reserved) For debouncing candle updates
  const lastCandleRenderRef = useRef(0); // Throttle visual candle updates (MT5-like smoothness)
  const lastHistTimeRef = useRef(0); // Last historical candle time (from API) - block future-jump in polling

  // Expose zoom functions to parent component
  useImperativeHandle(ref, () => ({
    zoomIn: () => {
      const timeScale = chartRef.current?.timeScale();
      if (!timeScale) return;

      const visibleRange = timeScale.getVisibleRange();
      if (!visibleRange || !visibleRange.from || !visibleRange.to) return;

      const range = visibleRange.to - visibleRange.from;
      const center = (visibleRange.from + visibleRange.to) / 2;
      const newRange = range * 0.8; // Zoom in by 20%

      try {
        timeScale.setVisibleRange({
          from: center - newRange / 2,
          to: center + newRange / 2,
        });
        saveZoomState(timeScale.getVisibleRange());
      } catch (e) {
        // Ignore if range becomes invalid
      }
    },
    zoomOut: () => {
      const timeScale = chartRef.current?.timeScale();
      if (!timeScale) return;

      const visibleRange = timeScale.getVisibleRange();
      if (!visibleRange || !visibleRange.from || !visibleRange.to) return;

      const range = visibleRange.to - visibleRange.from;
      const center = (visibleRange.from + visibleRange.to) / 2;
      const newRange = range * 1.25; // Zoom out by 25%

      try {
        timeScale.setVisibleRange({
          from: center - newRange / 2,
          to: center + newRange / 2,
        });
        saveZoomState(timeScale.getVisibleRange());
      } catch (e) {
        // Ignore if range becomes invalid
      }
    },
    downloadChartAsPNG: () => {
      const container = containerRef.current;
      if (!container) {
        if (typeof window.notify === "function") window.notify("Chart not ready", "error");
        return;
      }
      const canvases = container.querySelectorAll("canvas");
      const bgColor = isDark === "light" ? "#ffffff" : "#0F1720";
      // Use largest canvas (main chart) or first valid one
      let chartCanvas = null;
      let maxArea = 0;
      canvases.forEach((c) => {
        if (c.width > 0 && c.height > 0) {
          const area = c.width * c.height;
          if (area > maxArea) {
            maxArea = area;
            chartCanvas = c;
          }
        }
      });
      if (chartCanvas) {
        try {
          const off = document.createElement("canvas");
          off.width = chartCanvas.width;
          off.height = chartCanvas.height;
          const ctx = off.getContext("2d");
          ctx.fillStyle = bgColor;
          ctx.fillRect(0, 0, off.width, off.height);
          ctx.drawImage(chartCanvas, 0, 0);
          const link = document.createElement("a");
          link.download = `chart-${selectedSymbol}-${selectedTimeframe}-${Date.now()}.png`;
          link.href = off.toDataURL("image/png");
          link.click();
          if (typeof window.notify === "function") window.notify("Chart saved as PNG", "success");
          return;
        } catch (e) {
          console.warn("Canvas export failed, trying html2canvas", e);
        }
      }
      html2canvas(container, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: bgColor,
        scale: 2,
        logging: false,
      })
        .then((canvas) => {
          const link = document.createElement("a");
          link.download = `chart-${selectedSymbol}-${selectedTimeframe}-${Date.now()}.png`;
          link.href = canvas.toDataURL("image/png");
          link.click();
          if (typeof window.notify === "function") window.notify("Chart saved as PNG", "success");
        })
        .catch((err) => {
          console.error("Chart screenshot failed", err);
          if (typeof window.notify === "function") window.notify("Screenshot failed. Try again.", "error");
        });
    },
  }), [selectedSymbol, selectedTimeframe, isDark]);

  // Convert candles to line/area format (use close price as value)
  const lineAreaData = useMemo(() => {
    if (candles.length === 0) return []
    if (chartType === "line" || chartType === "area") {
      return candles.map((candle) => ({
        time: candle.time,
        value: candle.close,
      }));
    }
    return candles;
  }, [candles, chartType]);

  const handleBuyClick = (orderData) => {
    // If parent provides handler (e.g. MT5 opens shared modal), use it; otherwise use chart's local modal
    if (onBuyClickProp) {
      onBuyClickProp('BUY');
    } else {
      setModalOrderType('BUY');
      setIsModalOpen(true);
    }
  };

  const handleSellClick = (orderData) => {
    if (onSellClickProp) {
      onSellClickProp('SELL');
    } else {
      setModalOrderType('SELL');
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalOrderType(null);
  };

  // Initialize chart
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    // Price labels: never show minus sign (trading prices are positive; library default can show minus)
    const priceFormatter = (price) => {
      const n = Math.abs(Number(price));
      if (!Number.isFinite(n)) return '0';
      if (n >= 1000) return n.toFixed(2);
      if (n >= 1) return n.toFixed(4);
      return n.toFixed(5);
    };


    const chart = createChart(container, {
      autoSize: true,
      localization: {
        priceFormatter,
      },
      layout: {
        background: { color: isDark ? "#0F1720" : "#FFFFFF" },
        textColor: isDark ? "#fff" : "#020617",
        fontSize: 12,
      },
      grid: {
        vertLines: {
          visible: showGrid,
          color: showGrid
            ? isDark
              ? "rgba(148, 163, 184, 0.2)"
              : "rgba(100, 116, 139, 0.25)"
            : "transparent",
          style: showGrid ? 0 : 0,
        },
        horzLines: {
          visible: showGrid,
          color: showGrid
            ? isDark
              ? "rgba(148, 163, 184, 0.2)"
              : "rgba(100, 116, 139, 0.25)"
            : "transparent",
          style: showGrid ? 0 : 0,
        },
      },
      rightPriceScale: {
        borderColor: isDark ? "#1e293b" : "#e5e7eb",
        autoScale: true,
        scaleMargins: {
          top: 0.1,
          bottom: 0.1,
        },
        ticksVisible: true,
        ensureEdgeTickMarksVisible: true,
      },
      leftPriceScale: {
        visible: false,
      },

      timeScale: {
        borderColor: isDark ? "#1e293b" : "#e5e7eb",
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 10,
        barSpacing: 3,
        tickMarkFormatter: (time, tickMarkType, locale) => {
          const d = new Date((typeof time === 'number' ? time : time) * 1000);
          const pad = (n) => String(n).padStart(2, '0');
          const h = d.getUTCHours();
          const m = d.getUTCMinutes();
          if (tickMarkType === 2) return `${pad(d.getUTCDate())} ${d.toLocaleDateString(locale || 'en', { month: 'short' })}`;
          if (tickMarkType === 1) return `${pad(h)}:${pad(m)}`;
          return `${pad(h)}:${pad(m)}`;
        }
      },



      // timeScale: {
      //   borderColor: isDark ? "#e5e7eb" : "#1e293b",
      //   timeVisible: true,
      //   secondsVisible: false,
      //   rightOffset: 10,
      //   barSpacing: 3, // Increase spacing between candles for better visibility
      //   minBarSpacing: 2,
      //   shiftVisibleRangeOnNewBar: false, // We handle auto-scroll manually for better control
      //   fixLeftEdge: false, // Allow scrolling to latest
      //   fixRightEdge: false, // Allow scrolling to latest
      // },

      crosshair: {
        mode: activeTool === 1 ? 1 : 0, // 0 = Hidden, 1 = Normal (shows on hover), 2 = Magnet
        vertLine: {
          width: 1,
          color: isDark ? "#94a3b8" : "#64748b",
          style: 0, // Solid line (0 = solid, 1 = dotted, 2 = dashed)
          labelBackgroundColor: isDark ? "#1e293b" : "#e5e7eb",
        },
        horzLine: {
          width: 1,
          color: isDark ? "#94a3b8" : "#64748b",
          style: 0, // Solid line
          labelBackgroundColor: isDark ? "#1e293b" : "#e5e7eb",
        },
        // Professional crosshair settings
        vertLineVisible: activeTool === 1,
        horzLineVisible: activeTool === 1,
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: activeTool == null || activeTool === 1,
        horzTouchDrag: true,
        vertTouchDrag: true,
      },
      handleScale: {
        axisPressedMouseMove: {
          time: true,
          price: true,
        },
        axisDoubleClickReset: {
          time: true,
          price: true,
        },
        axisTouch: {
          time: true,
          price: true,
        },
        mouseWheel: true,
        pinch: true,
      },
    });

    // Default series: we start with candlesticks but will swap based on chartType
    const candleSeries = chart.addCandlestickSeries({
      upColor: "#26A69A",
      downColor: "#EF5350",
      wickUpColor: "#26A69A",
      wickDownColor: "#EF5350",
      borderVisible: false,
    });

    chartRef.current = chart;
    seriesRef.current = candleSeries;

    // Save zoom state when user manually scrolls/zooms
    const timeScale = chart.timeScale();
    const handleVisibleRangeChange = () => {
      // Only save if chart is initialized and has candles
      // This prevents saving zoom during initial load
      if (hasInitializedRef.current && candles.length > 0) {
        const visibleRange = timeScale.getVisibleRange();
        if (visibleRange) {
          saveZoomState(visibleRange);
        }
      }
    };

    // Subscribe to visible range changes
    timeScale.subscribeVisibleTimeRangeChange(handleVisibleRangeChange);

    // Proper resize observer - autoSize handles the resize, we just preserve zoom
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0 && chart) {
          // Save zoom state (autoSize handles the actual resize)
          const currentRange = timeScale.getVisibleRange();
          // Restore zoom after resize if we had one
          if (currentRange) {
            setTimeout(() => {
              try {
                timeScale.setVisibleRange(currentRange);
              } catch (e) {
                // Ignore if range becomes invalid
              }
            }, 0);
          }
        }
      }
    });
    ro.observe(container);

    return () => {
      timeScale.unsubscribeVisibleTimeRangeChange(handleVisibleRangeChange);
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
      volumeSeriesRef.current = null;
      drawingObjectsRef.current = [];
    };
  }, []);

  // Apply dark/light theme when isDark changes (chart already created with initial theme)
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    chart.applyOptions({
      layout: {
        background: { color: isDark ? "#0F1720" : "#FFFFFF" },
        textColor: isDark ? "#fff" : "#020617",
      },
      grid: {
        vertLines: {
          visible: showGrid,
          color: showGrid ? (isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(100, 116, 139, 0.25)") : "transparent",
          style: showGrid ? 0 : 0,
        },
        horzLines: {
          visible: showGrid,
          color: showGrid ? (isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(100, 116, 139, 0.25)") : "transparent",
          style: showGrid ? 0 : 0,
        },
      },
      rightPriceScale: { borderColor: isDark ? "#1e293b" : "#e5e7eb" },
      timeScale: { borderColor: isDark ? "#1e293b" : "#e5e7eb" },
      crosshair: {
        vertLine: { color: isDark ? "#94a3b8" : "#64748b", labelBackgroundColor: isDark ? "#1e293b" : "#e5e7eb" },
        horzLine: { color: isDark ? "#94a3b8" : "#64748b", labelBackgroundColor: isDark ? "#1e293b" : "#e5e7eb" },
      },
    });
  }, [isDark, showGrid]);

  // Update grid visibility
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      grid: {
        vertLines: {
          visible: showGrid,
          color: showGrid ? (isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(100, 116, 139, 0.25)") : "transparent",
          style: showGrid ? 0 : 0,
        },
        horzLines: {
          visible: showGrid,
          color: showGrid ? (isDark ? "rgba(148, 163, 184, 0.2)" : "rgba(100, 116, 139, 0.25)") : "transparent",
          style: showGrid ? 0 : 0,
        },
      },
    });
  }, [showGrid, isDark]);

  // Apply isDark (light/dark) to chart when isDark changes
  // useEffect(() => {
  //   const chart = chartRef.current;
  //   if (!chart) return;
  //   const isLight = isDark === "light";
  //   chart.applyOptions({
  //     layout: {
  //       background: { color: isLight ? "#FFFFFF" : "#0F1720" },
  //       textColor: isLight ? "#020617" : "#fff",
  //     },
  //     grid: {
  //       vertLines: {
  //         color: showGrid ? (isLight ? "rgba(100, 116, 139, 0.25)" : "rgba(148, 163, 184, 0.2)") : "transparent",
  //       },
  //       horzLines: {
  //         color: showGrid ? (isLight ? "rgba(100, 116, 139, 0.25)" : "rgba(148, 163, 184, 0.2)") : "transparent",
  //       },
  //     },
  //     rightPriceScale: { borderColor: isLight ? "#e5e7eb" : "#1e293b" },
  //     timeScale: { borderColor: isLight ? "#e5e7eb" : "#1e293b" },
  //     crosshair: {
  //       vertLine: { color: isLight ? "#94a3b8" : "#64748b", labelBackgroundColor: isLight ? "#e5e7eb" : "#1e293b" },
  //       horzLine: { color: isLight ? "#94a3b8" : "#64748b", labelBackgroundColor: isLight ? "#e5e7eb" : "#1e293b" },
  //     },
  //   });
  // }, [isDark, showGrid]);

  // Update crosshair mode and chart lock (Professional Trading Terminal - Enhanced visibility)
  useEffect(() => {
    if (!chartRef.current) return;

    // Disable chart panning when drawing tools are active (trendline, rectangle, fibonacci, parallellines, etc.)
    // Treat null/undefined as "no tool" so drag/pan works when context doesn't set activeTool
    const isDrawingTool = activeTool != null && activeTool !== 1 && activeTool !== 0;
    // When chart is locked, disable all pan and zoom (treat undefined as unlocked)
    const panAllowed = chartLocked !== true && !isDrawingTool;
    const zoomAllowed = chartLocked !== true;

    chartRef.current.applyOptions({
      crosshair: {
        mode: activeTool === 1 ? 1 : 0, // 1 = Normal (always visible when tool active), 0 = Hidden
        vertLine: {
          visible: activeTool === 1,
          width: 1,
          color: isDark === "light" ? "#94a3b8" : "#64748b",
          style: 0, // Solid line
          labelBackgroundColor: isDark === "light" ? "#e5e7eb" : "#1e293b",
        },
        horzLine: {
          visible: activeTool === 1,
          width: 1,
          color: isDark === "light" ? "#94a3b8" : "#64748b",
          style: 0, // Solid line
          labelBackgroundColor: isDark === "light" ? "#e5e7eb" : "#1e293b",
        },
      },
      handleScroll: {
        mouseWheel: zoomAllowed,
        pressedMouseMove: panAllowed,
        horzTouchDrag: panAllowed,
        vertTouchDrag: panAllowed,
      },
      handleScale: {
        axisPressedMouseMove: {
          time: panAllowed,
          price: panAllowed,
        },
        axisDoubleClickReset: {
          time: zoomAllowed,
          price: zoomAllowed,
        },
        axisTouch: {
          time: panAllowed,
          price: panAllowed,
        },
        mouseWheel: zoomAllowed,
        pinch: zoomAllowed,
      },
    });
  }, [activeTool, chartLocked]);

  // Fetch historical candles when symbol or timeframe changes (PROFESSIONAL - Instant load like Binance)
  useEffect(() => {
    const fetchCandles = async () => {
      if (!selectedSymbolStr || !selectedTimeframe) {
        setCandles([])
        lastHistTimeRef.current = 0
        hasInitializedRef.current = false // Reset on symbol change
        return
      }

      try {
        setCandlesLoading(true)
        // CRITICAL: Reset candles to empty array FIRST when symbol changes
        // This ensures chart data init effect knows we're waiting for new data
        setCandles([])
        lastHistTimeRef.current = 0
        hasInitializedRef.current = false // Reset initialization flag for new symbol

        // CRITICAL: Clear chart immediately to prevent old/new data mixing (MT5/TradingView style)
        if (seriesRef.current) {
          try {
            seriesRef.current.setData([]); // Clear immediately
          } catch (e) {
            // ignore errors
          }
        }

        console.log(`📊 Fetching candles for ${selectedSymbolStr} @ ${selectedTimeframe}`)

        // MT5/TradingView-style: request history range by timeframe so higher TFs get enough candles
        const daysBack = getDaysBackForTimeframe(selectedTimeframe)
        // Request enough bars for the range (e.g. M15 14 days = 1344 bars; M30 30 days = 1440 bars)
        const limit = getLimitForTimeframe(selectedTimeframe, daysBack)









        // Fetch candles from project API (backend on 5002: market-data/history or crypto/candles)
        const rawCandles = await getMarketHistory(selectedSymbolStr, selectedTimeframe, limit);

        if (rawCandles && rawCandles.length > 0) {
          console.log(`✅ Loaded ${rawCandles.length} raw candles from server`)

          // Diagnostic logging to identify misaligned symbols
          if (import.meta.env?.DEV) {
            console.log("RAW", selectedSymbolStr, rawCandles.slice(0, 5));
            console.log("RAW last", selectedSymbolStr, rawCandles.slice(-5));
            console.log("MOD60", selectedSymbolStr, rawCandles.slice(0, 5).map(c => normalizeTime(c.time) % 60));
          }

          // PROFESSIONAL: TradingView/MT5-style candle processing
          // This handles: time normalization, validation, deduplication, outlier detection, timeframe alignment
          const { candles: processedCandles, stats } = processCandles(
            rawCandles,
            selectedSymbolStr,
            selectedTimeframe
          );

          if (processedCandles.length > 0) {
            setCandles(processedCandles)
            lastHistTimeRef.current = processedCandles.at(-1)?.time || 0

            // Build candles map for quick updates
            candlesMapRef.current = new Map()
            processedCandles.forEach(c => {
              candlesMapRef.current.set(c.time, c)
            })
          } else {
            console.warn(`⚠️ No valid candles after processing for ${selectedSymbolStr}`)
            setCandles([])
            lastHistTimeRef.current = 0
          }
        } else {
          console.warn(`⚠️ No candle data returned for ${selectedSymbolStr}`)
          // CRITICAL: Set empty candles - let chart data init effect handle initialization
          // Don't set hasInitializedRef here - let the effect initialize with empty data
          setCandles([])
          lastHistTimeRef.current = 0
        }
      } catch (error) {
        console.error(`❌ Error fetching ${selectedSymbolStr}:`, error.message)
        setCandles([]) // No fallback - show empty chart
        lastHistTimeRef.current = 0
      } finally {
        setCandlesLoading(false)
      }
    }

    // Immediate fetch (no debounce for professional instant loading like Binance)
    fetchCandles()
  }, [selectedSymbolStr, selectedTimeframe]) // Removed bidPrice - not needed

  // // Chart connected to same WebSocket as watchlist (lib/socket → /trading). Real-time via priceUpdate from backend.
  // useEffect(() => {
  //   if (!socketRef.current) socketRef.current = socket;
  //   const sock = socketRef.current;
  //   if (!sock) return;

  //   let currentSymbol = selectedSymbolStr
  //   let currentTimeframe = selectedTimeframe

  //   // Handle connection events (only once)
  //   const handleConnect = () => {
  //     console.log('✅ Chart WebSocket connected')
  //     // Subscribe immediately on connect
  //     subscribeToCandles()
  //   }

  //   const handleDisconnect = () => {
  //     console.log('⚠️ Chart WebSocket disconnected - will auto-reconnect')
  //   }

  //   const handleError = (error) => {
  //     console.error('❌ Chart WebSocket connection error:', error)
  //   }

  //   sock.on('connect', handleConnect)
  //   sock.on('disconnect', handleDisconnect)
  //   sock.on('connect_error', handleError)

  //   // Subscribe function (uses selectedSymbol - always current)
  //   // PROFESSIONAL: Use symbol config for crypto detection
  //   const subscribeToCandles = () => {
  //     const isCrypto = isCryptoSymbol(selectedSymbolStr);

  //     if (isCrypto && selectedSymbolStr && selectedTimeframe && sock.connected) {
  //       console.log(`Subscribing to real-time candles: ${selectedSymbolStr}@${selectedTimeframe}`)
  //       sock.emit('subscribeCandles', { symbol: selectedSymbolStr, timeframe: selectedTimeframe })
  //     } else if (!isCrypto && selectedSymbolStr) {
  //       console.log(`⚠️ Symbol ${selectedSymbolStr} is not a crypto symbol, skipping candle subscription`)
  //     }
  //   }














  //   // Listen for real-time candle updates
  //   // NOTE: We THROTTLE visual updates so candles don't "shake" too fast (more like MT5)
  //   const handleCandleUpdate = (data) => {
  //     // Quick validation
  //     if (!data || !data.candle || !data.symbol) return

  //     // Match symbol (case-insensitive) - use selectedSymbol (always current)
  //     if (data.symbol.toUpperCase() !== selectedSymbolStr.toUpperCase()) {
  //       return // Not for this symbol
  //     }

  //     const { candle } = data

  //     // PROFESSIONAL: Process single candle through engine (TradingView style)
  //     // Pass timeframe to ensure proper alignment
  //     const processedCandle = processSingleCandle(candle, selectedSymbolStr, selectedTimeframe);
  //     if (!processedCandle) {
  //       if (import.meta.env?.DEV) {
  //         console.warn(`⚠️ Rejected realtime candle (invalid):`, { symbol: data.symbol, candle });
  //       }
  //       return; // Invalid candle, skip
  //     }

  //     // Throttle chart updates: at most once every 250ms per tab
  //     // This keeps movement smooth but not "hyper-fast" compared to MT5
  //     const now = Date.now()
  //     if (now - lastCandleRenderRef.current < 200) {
  //       return
  //     }
  //     lastCandleRenderRef.current = now

  //     const timeScale = chartRef.current?.timeScale()
  //     const currentVisibleRange = timeScale?.getVisibleRange()
  //     const s = seriesRef.current
  //     const c = chartRef.current

  //     if (!s || !c || !hasInitializedRef.current) {
  //       return // Chart not ready
  //     }

  //     // Update candle immediately (NO setData - preserves zoom, avoids React re-render loops)
  //     try {
  //       // Use processed candle (already normalized and validated)
  //       if (chartType === 'line' || chartType === 'area') {
  //         s.update({ time: processedCandle.time, value: processedCandle.close })
  //       } else {
  //         s.update({
  //           time: processedCandle.time,
  //           open: processedCandle.open,
  //           high: processedCandle.high,
  //           low: processedCandle.low,
  //           close: processedCandle.close
  //         })
  //       }

  //       // Update candles map for consistency
  //       candlesMapRef.current.set(processedCandle.time, processedCandle);

  //       // Preserve user's zoom and position
  //       if (timeScale && currentVisibleRange) {
  //         saveZoomState(currentVisibleRange);
  //       }
  //     } catch (e) {
  //       console.error('❌ Error updating candle:', e)
  //     }
  //   }

  //   // Real-time: same WebSocket that updates watchlist bid/ask – update chart last candle
  //   const handlePriceUpdate = (updatedSymbol) => {
  //     if (!updatedSymbol?.symbol || updatedSymbol.symbol.replace("/", "") !== selectedSymbolStr.replace("/", "")) return;
  //     const s = seriesRef.current;
  //     const c = chartRef.current;
  //     if (!s || !c || !hasInitializedRef.current || candlesMapRef.current.size === 0) return;
  //     const now = Date.now();
  //     if (now - lastCandleRenderRef.current < 150) return;
  //     lastCandleRenderRef.current = now;
  //     const price = (parseFloat(updatedSymbol.bid) + parseFloat(updatedSymbol.ask || updatedSymbol.bid)) / 2;
  //     if (!Number.isFinite(price)) return;
  //     const tfSec = timeframeToSeconds(selectedTimeframe);
  //     const barTime = alignToTimeframe(Math.floor(Date.now() / 1000), tfSec);


  //     const existing = candlesMapRef.current.get(barTime);
  //     const open = existing ? existing.open : price;
  //     const high = existing ? Math.max(existing.high, price) : price;
  //     const low = existing ? Math.min(existing.low, price) : price;
  //     try {
  //       if (chartType === 'line' || chartType === 'area') {
  //         s.update({ time: barTime, value: price });
  //       } else {
  //         s.update({ time: barTime, open, high, low, close: price });
  //       }
  //       candlesMapRef.current.set(barTime, { time: barTime, open, high, low, close: price });
  //     } catch (e) { /* ignore */ }
  //   };

  //   sock.on('candleUpdate', handleCandleUpdate)
  //   sock.on('priceUpdate', handlePriceUpdate)

  //   if (sock.connected) subscribeToCandles();

  //   return () => {
  //     sock.off('candleUpdate', handleCandleUpdate)
  //     sock.off('priceUpdate', handlePriceUpdate)
  //     sock.off('connect', handleConnect)
  //     sock.off('disconnect', handleDisconnect)
  //     sock.off('connect_error', handleError)
  //     if (selectedSymbolStr && selectedTimeframe && sock.connected) {
  //       const isCrypto = isCryptoSymbol(selectedSymbolStr);
  //       if (isCrypto) {
  //         console.log(`🔌 Unsubscribing from: ${selectedSymbolStr}@${selectedTimeframe}`)
  //         sock.emit('unsubscribeCandles', { symbol: selectedSymbolStr, timeframe: selectedTimeframe })
  //       }
  //     }
  //   }
  // }, [selectedSymbolStr, selectedTimeframe, chartType]) // Re-run on symbol/timeframe change






  // Real-time via polling (same as upper chart): every 800ms update last candle from PriceContext
  useEffect(() => {
    if (!selectedSymbolStr || !selectedTimeframe) return;

    const POLL_INTERVAL_MS = 250;
    const THROTTLE_MS = 120;

    const intervalId = setInterval(() => {
      const s = seriesRef.current;
      const c = chartRef.current;
      if (!s || !c || !hasInitializedRef.current || candlesMapRef.current.size === 0) return;

      const bid = getUnifiedPrice(selectedSymbolStr, "bid");
      const ask = getUnifiedPrice(selectedSymbolStr, "ask");
      const bidNum = typeof bid === "number" && !isNaN(bid) ? bid : parseFloat(bid);
      const askNum = typeof ask === "number" && !isNaN(ask) ? ask : parseFloat(ask);
      const price = (Number.isFinite(bidNum) && Number.isFinite(askNum))
        ? (bidNum + askNum) / 2
        : (Number.isFinite(bidNum) ? bidNum : Number.isFinite(askNum) ? askNum : null);
      if (price == null || !Number.isFinite(price)) return;

      const now = Date.now();
      if (now - lastCandleRenderRef.current < THROTTLE_MS) return;
      lastCandleRenderRef.current = now;
      const tfSec = timeframeToSeconds(selectedTimeframe);
      const nowAligned = alignToTimeframe(Math.floor(Date.now() / 1000), tfSec);
      const lastHist = lastHistTimeRef.current || 0;
      // Don't hard-stop updates if history is stale; keep chart responsive with live ticks.
      // This is especially important for forex feeds where initial history and live stream
      // timestamps may temporarily drift.
      if (lastHist && (nowAligned - lastHist) > tfSec * 5) {
        // keep going with the aligned current time
      }
      const barTime = nowAligned;
      const existing = candlesMapRef.current.get(barTime);
      const open = existing ? existing.open : price;
      const high = existing ? Math.max(existing.high, price) : price;
      const low = existing ? Math.min(existing.low, price) : price;

      try {
        if (chartType === "line" || chartType === "area") {
          s.update({ time: barTime, value: price });
        } else {
          s.update({ time: barTime, open, high, low, close: price });
        }
        candlesMapRef.current.set(barTime, { time: barTime, open, high, low, close: price });
      } catch (e) { /* ignore */ }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [selectedSymbolStr, selectedTimeframe, chartType, getUnifiedPrice]);









  // Initialize data when candles first load (PROFESSIONAL - Instant chart display like Binance)
  useEffect(() => {
    const s = seriesRef.current;
    const c = chartRef.current;

    if (!s || !c) {
      return;
    }

    if (candles.length === 0 && hasInitializedRef.current) {
      return;
    }

    // If no candles yet but not initialized, wait (effect will re-run when candles arrive)
    // BUT: If candlesLoading is false, it means fetch completed with no data - don't wait forever
    if (candles.length === 0 && !hasInitializedRef.current) {
      // Only wait if candles are still loading, otherwise initialize with empty data
      if (candlesLoading) {
        return; // Still loading, wait for data
      }
      const timeScale = c.timeScale();
      s.setData([]); // Set empty data
      timeScale.fitContent();
      return; // Done initializing empty chart
    }

    // Only setData on initial load (when hasInitializedRef is false)
    // This prevents resetting zoom on every real-time update
    if (!hasInitializedRef.current) {
      const timeScale = c.timeScale();
      const currentKey = getZoomKey(selectedSymbolStr, selectedTimeframe);
      const symbolTimeframeChanged = lastSymbolTimeframeRef.current !== currentKey;

      // Update tracking AFTER checking for change
      lastSymbolTimeframeRef.current = currentKey;


      if (chartType === 'line' || chartType === 'area') {
        // For line/area charts, extract close prices from already-processed candles
        const lineAreaData = candles.map(c => ({
          time: c.time, // Already normalized and aligned
          value: c.close
        })).filter(c => c.time != null);

        // Ensure sorted (should already be sorted, but safety check)
        const sortedData = [...lineAreaData].sort((a, b) => a.time - b.time);
        if (sortedData.length > 0) {

          s.setData(sortedData);
        }
      } else {
        // For candlestick charts: align + dedupe via single helper
        const finalCandles = prepareCandlesForSetData(candles, selectedTimeframe);
        if (finalCandles.length > 0) {
          if (import.meta.env?.DEV && finalCandles.length >= 2) {
            console.log(
              "SETDATA first/last",
              finalCandles[0]?.time,
              finalCandles.at(-1)?.time,
              "Δ",
              finalCandles.at(-1)?.time - finalCandles.at(-2)?.time
            );
          }
          s.setData(finalCandles);
        }
      }

      // MT5/TradingView style: Always fitContent on initial load
      // This ensures all candles (including gap-filled ones) are visible
      // Don't restore zoom state until user manually zooms
      timeScale.fitContent();

      // Nudge right price scale so horizontal grid lines (tied to price ticks) recompute
      try {
        c.priceScale('right').applyOptions({
          borderColor: isDark ? '#1e293b' : '#e5e7eb',
          autoScale: true,
          scaleMargins: { top: 0.1, bottom: 0.1 },
          ticksVisible: true,
          ensureEdgeTickMarksVisible: true,
        });
      } catch (_) { /* ignore */ }

      hasInitializedRef.current = true;
      saveZoomState(timeScale.getVisibleRange());
    }
  }, [candles.length, chartType, selectedSymbol, selectedTimeframe, isDark]);

  // Switch chart type (bars, candles, line, area) - preserve zoom
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart || !hasInitializedRef.current || candles.length === 0) return;

    // Only run when chartType actually changes, not on every candle update
    const timeScale = chart.timeScale();
    const visibleRange = timeScale.getVisibleRange() || getZoomState();

    // Remove old series if exists
    if (seriesRef.current) {
      try {
        chart.removeSeries(seriesRef.current);
      } catch (e) {
        // ignore
      }
    }

    // Remove old volume series if exists
    if (volumeSeriesRef.current) {
      try {
        chart.removeSeries(volumeSeriesRef.current);
        volumeSeriesRef.current = null;
      } catch (e) {
        // ignore
      }
    }

    let newSeries;

    if (chartType === "bars") {
      newSeries = chart.addBarSeries({
        upColor: "#26A69A", // Green
        downColor: "#EF5350", // Red
        borderUpColor: "#26A69A",
        borderDownColor: "#EF5350",
        // priceScaleId: 'right', // Use default price scale
        scaleMargins: {
          top: 0.1,
          bottom: 0.1, // Normal margins when no volume
        },
      });
      const sortedCandles = prepareCandlesForSetData(candles, selectedTimeframe);
      if (sortedCandles.length > 0) newSeries.setData(sortedCandles);
    } else if (chartType === "line") {
      newSeries = chart.addLineSeries({
        color: "#38bdf8",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        // priceScaleId: 'right', // Use default price scale
        scaleMargins: {
          top: 0.1,
          bottom: 0.1, // Normal margins when no volume
        },
      });
      const validatedLineData = ensureAscendingTimeOrder(lineAreaData);
      if (validatedLineData.length > 0) {
        newSeries.setData(validatedLineData);
      }
    } else if (chartType === "area") {
      newSeries = chart.addAreaSeries({
        lineColor: "#38bdf8",
        topColor: "rgba(56,189,248,0.4)",
        bottomColor: "rgba(56,189,248,0.0)",
        lineWidth: 2,
        priceLineVisible: false,
        lastValueVisible: true,
        // priceScaleId: '', // Use default price scale
        scaleMargins: {
          top: 0.1,
          bottom: 0.1, // Normal margins when no volume
        },
      });
      const validatedAreaData = ensureAscendingTimeOrder(lineAreaData);
      if (validatedAreaData.length > 0) {
        newSeries.setData(validatedAreaData);
      }
    }

    else if (chartType === "volume ticks" || chartType === "volume") {
      // ✅ 1) Main candles ALWAYS on RIGHT price scale
      newSeries = chart.addCandlestickSeries({
        upColor: "#26A69A",
        downColor: "#EF5350",
        wickUpColor: "#26A69A",
        wickDownColor: "#EF5350",
        borderVisible: false,
        priceScaleId: "right", // ✅ FIX: lock candles to right price scale
      });

      const sortedCandles = prepareCandlesForSetData(candles, selectedTimeframe);
      if (sortedCandles.length > 0) newSeries.setData(sortedCandles);

      // ✅ 2) Create separate scale for volume (so it doesn't crush price candles)
      // const volumeSeries = chart.addHistogramSeries({
      //   priceFormat: { type: "volume" },
      //   priceScaleId: "vol", // ✅ FIX: separate scale
      //   base: 0,             // ✅ FIX: start volume from bottom (0)
      //   priceLineVisible: false,
      //   lastValueVisible: false,
      // });
      const volumeSeries = chart.addHistogramSeries({
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
        base: 0,
        priceLineVisible: false,
        lastValueVisible: false,

        // ✅ Dim / subtle volume like TradingView
        color: "rgba(38,166,154,0.15)", // default green (dim)
      });


      // ✅ 3) Set margins on each scale (pro style)
      chart.priceScale("right").applyOptions({
        scaleMargins: { top: 0.05, bottom: 0.30 }, // candles top/bottom space
      });

      chart.priceScale("vol").applyOptions({
        scaleMargins: { top: 0.75, bottom: 0.00 }, // volume at bottom
        visible: false, // ✅ hide volume axis like TradingView
      });

      // ✅ 4) Volume data
      // const volumeData = sortedCandles.map((candle) => ({
      //   time: candle.time,
      //   value: candle.volume || 0,
      //   color: candle.close >= candle.open ? "#26a69a" : "#ef5350",
      // }));
      const volumeData = sortedCandles.map((candle) => ({
        time: candle.time,
        value: candle.volume || 0,
        color: candle.close >= candle.open
          ? "rgba(38,166,154,0.25)"
          : "rgba(239,83,80,0.25)",
      }));


      if (volumeData.length > 0) volumeSeries.setData(volumeData);

      volumeSeriesRef.current = volumeSeries;
    }



    else {
      // default: candlesticks
      newSeries = chart.addCandlestickSeries({
        upColor: "#26A69A", // Green
        downColor: "#EF5350", // Red
        wickUpColor: "#26A69A",
        wickDownColor: "#EF5350",
        borderVisible: false,
        // priceScaleId: '', // Use default price scale
        scaleMargins: {
          top: 0.1,
          bottom: 0.1, // Normal margins when no volume
        },
      });
      const sortedCandles = prepareCandlesForSetData(candles, selectedTimeframe);
      if (sortedCandles.length > 0) newSeries.setData(sortedCandles);
    }
    seriesRef.current = newSeries;

    // Restore zoom state after series change
    if (visibleRange && hasInitializedRef.current) {
      // Use setTimeout to ensure series is fully initialized before restoring zoom
      setTimeout(() => {
        try {
          timeScale.setVisibleRange(visibleRange);
          saveZoomState(visibleRange);
        } catch (e) {
          // If restoration fails, try to maintain reasonable visible range
          if (candles.length > 0) {
            try {
              const lastCandleTime = candles[candles.length - 1].time;
              const firstVisibleTime = lastCandleTime - (100 * 60); // Show last 100 candles
              timeScale.setVisibleRange({ from: firstVisibleTime, to: lastCandleTime });
              saveZoomState(timeScale.getVisibleRange());
            } catch (e2) {
              // Fallback: fit content
              timeScale.fitContent();
              saveZoomState(timeScale.getVisibleRange());
            }
          }
        }
        // Nudge right price scale so horizontal grid lines recompute after series/data change
        try {
          chart.priceScale('right').applyOptions({
            borderColor: isDark ? '#1e293b' : '#e5e7eb',
            autoScale: true,
            scaleMargins: { top: 0.1, bottom: 0.1 },
            ticksVisible: true,
            ensureEdgeTickMarksVisible: true,
          });
        } catch (_) { /* ignore */ }
      }, 0);
    } else if (!hasInitializedRef.current) {
      timeScale.fitContent();
      try {
        chart.priceScale('right').applyOptions({
          borderColor: isDark ? '#1e293b' : '#e5e7eb',
          autoScale: true,
          scaleMargins: { top: 0.1, bottom: 0.1 },
          ticksVisible: true,
          ensureEdgeTickMarksVisible: true,
        });
      } catch (_) { /* ignore */ }
      hasInitializedRef.current = true;
      saveZoomState(timeScale.getVisibleRange());
    }
  }, [chartType, candles.length, lineAreaData.length]); // Only depend on lengths to avoid re-running on every candle update

  // Update volume series when candles change (for volume and volume ticks chart types)
  useEffect(() => {
    const chart = chartRef.current;
    const volumeSeries = volumeSeriesRef.current;
    if (!chart || !volumeSeries || !hasInitializedRef.current || candles.length === 0) return;
    if (chartType !== "volume" && chartType !== "volume ticks") return;

    const sortedCandles = prepareCandlesForSetData(candles, selectedTimeframe);

    const volumeData = sortedCandles.map(candle => ({
      time: candle.time,
      value: candle.volume || 0,
      color: candle.close >= candle.open
        ? "rgba(38,166,154,0.25)"
        : "rgba(239,83,80,0.25)",

      // color: candle.close >= candle.open ? '#26a69a' : '#ef5350', // Green for up, red for down
    }));

    if (volumeData.length > 0) {
      volumeSeries.setData(volumeData);
    }
  }, [candles, chartType, selectedTimeframe]); // Update when candles, chartType or timeframe changes

  // Drawing functionality (drag-based: mousedown → mousemove → mouseup)
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const container = containerRef.current;
    if (!chart || !series || !container) return;

    const tools = [
      null, // 0: Menu
      null, // 1: Crosshair (handled above)
      "trendline", // 2: Trend Line
      "parallellines", // 3: Parallel Lines
      "fibonacci", // 4: Fibonacci Retracement
      "rectangle", // 5: Rectangle
      "pricelevel", // 6: Price Levels
      "text", // 7: Text (later)
      null, // 8: Visibility
      null, // 9: Lock
      null, // 10: Magnet
      null, // 11: Delete
      null, // 12: Settings
      null, // 13: Object Tree
      null, // 14: Grid
      null, // 15: History
      null, // 16: Layout
    ];

    const toolType = activeTool !== null ? tools[activeTool] : null;

    // Reset draft when no tool selected
    if (!toolType) {
      isDrawingRef.current = false;
      startPointRef.current = null;
      endPointRef.current = null;
      trendLineFirstPointRef.current = null;
      if (currentDrawingRef.current?.series) {
        try {
          chart.removeSeries(currentDrawingRef.current.series);
        } catch (e) { }
      }
      currentDrawingRef.current = null;
      return;
    }

    // Price Level: single click
    if (toolType === "pricelevel") {
      const handlePriceLevelClick = (e) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const time = chart.timeScale().coordinateToTime(x);
        const price = series.coordinateToPrice(y);

        if (time == null || price == null) return;

        const priceLine = series.createPriceLine({
          price,
          color: "#3b82f6",
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: price.toFixed(5),
        });

        const newObject = { type: "pricelevel", priceLine, price };
        setChartObjects((prev) => [...prev, newObject]);
        drawingObjectsRef.current.push(newObject);
      };

      container.addEventListener("click", handlePriceLevelClick);
      return () => {
        container.removeEventListener("click", handlePriceLevelClick);
      };
    }

    // Trend Line: two-click flow (first click = start, mousemove = preview, second click = end; then deselect)
    if (toolType === "trendline") {
      const handleTrendLineClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let time = chart.timeScale().coordinateToTime(x);
        const price = series.coordinateToPrice(y);
        if (time == null || price == null) return;

        time = normalizeTime(time);
        if (time == null) return;

        if (trendLineFirstPointRef.current === null) {
          // First click: set start point and create preview series
          trendLineFirstPointRef.current = { time, price };
          const lineSeries = chart.addLineSeries({
            color: "#22c55e",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          currentDrawingRef.current = { type: "trendline", series: lineSeries };
          lineSeries.setData([{ time, value: price }]);
        } else {
          // Second click: finalize line and deselect tool
          const firstPoint = trendLineFirstPointRef.current;
          const endPoint = { time, price };

          const minTimeDiff = 1;
          const minPriceDiff = 0.00001;
          const timeDiff = Math.abs(endPoint.time - firstPoint.time);
          const priceDiff = Math.abs(endPoint.price - firstPoint.price);
          if (timeDiff < minTimeDiff && priceDiff < minPriceDiff) {
            try {
              chart.removeSeries(currentDrawingRef.current.series);
            } catch (err) { }
            trendLineFirstPointRef.current = null;
            currentDrawingRef.current = null;
            return;
          }

          const point1 = { time: firstPoint.time, price: firstPoint.price };
          const point2 = { time: endPoint.time, price: endPoint.price };
          const lineData = ensureAscendingTimeOrder([
            { time: point1.time, value: point1.price },
            { time: point2.time, value: point2.price },
          ]);
          if (lineData.length > 0) {
            currentDrawingRef.current.series.setData(lineData);
            const trendLineObj = {
              type: "trendline",
              series: currentDrawingRef.current.series,
              point1,
              point2,
            };
            setChartObjects((prev) => [...prev, trendLineObj]);
            drawingObjectsRef.current.push(trendLineObj);
          }

          setActiveTool(null);
          trendLineFirstPointRef.current = null;
          currentDrawingRef.current = null;
        }
      };

      const handleTrendLineMouseMove = (e) => {
        if (trendLineFirstPointRef.current === null || currentDrawingRef.current?.type !== "trendline") return;
        e.preventDefault();
        e.stopPropagation();

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let time = chart.timeScale().coordinateToTime(x);
        const price = series.coordinateToPrice(y);
        if (time == null || price == null) return;

        time = normalizeTime(time);
        if (time == null) return;

        const firstPoint = trendLineFirstPointRef.current;
        const lineData = ensureAscendingTimeOrder([
          { time: firstPoint.time, value: firstPoint.price },
          { time, value: price },
        ]);
        if (lineData.length > 0) {
          currentDrawingRef.current.series.setData(lineData);
        }
      };

      const handleMouseMovePreventPan = (e) => {
        e.stopPropagation();
      };

      const options = { capture: true, passive: false };
      container.addEventListener("click", handleTrendLineClick, options);
      container.addEventListener("mousemove", handleTrendLineMouseMove, options);
      container.addEventListener("mousemove", handleMouseMovePreventPan, options);

      return () => {
        trendLineFirstPointRef.current = null;
        if (currentDrawingRef.current?.type === "trendline" && currentDrawingRef.current?.series) {
          try {
            chart.removeSeries(currentDrawingRef.current.series);
          } catch (err) { }
          currentDrawingRef.current = null;
        }
        container.removeEventListener("click", handleTrendLineClick, options);
        container.removeEventListener("mousemove", handleTrendLineMouseMove, options);
        container.removeEventListener("mousemove", handleMouseMovePreventPan, options);
      };
    }

    // Parallel Channel: 3-click flow (base line p1–p2, then p3 for offset; draw-only, no edit)
    if (toolType === "parallellines") {
      const options = { capture: true, passive: false };
      const handleParallelChannelClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let time = chart.timeScale().coordinateToTime(x);
        const price = series.coordinateToPrice(y);
        if (time == null || price == null) return;

        time = normalizeTime(time);
        if (time == null) return;

        const point = { time, price };
        const pts = parallelChannelPointsRef.current;

        if (pts.length === 0) {
          parallelChannelPointsRef.current = [point];
          const lineSeries = chart.addLineSeries({
            color: "#8b5cf6",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          lineSeries.setData([{ time, value: price }]);
          currentDrawingRef.current = { type: "parallellines", series: lineSeries, previewLine: null };
        } else if (pts.length === 1) {
          parallelChannelPointsRef.current = [pts[0], point];
          const lineData = ensureAscendingTimeOrder([
            { time: pts[0].time, value: pts[0].price },
            { time, value: price },
          ]);
          if (lineData.length > 0) currentDrawingRef.current.series.setData(lineData);
          currentDrawingRef.current.previewLine = chart.addLineSeries({
            color: "#8b5cf6",
            lineWidth: 2,
            lineStyle: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          const parPreview = computeParallelLineFromThreePoints(chart, series, pts[0], point, point);
          if (parPreview) {
            currentDrawingRef.current.previewLine.setData(ensureAscendingTimeOrder([
              { time: parPreview[0].time, value: parPreview[0].price },
              { time: parPreview[1].time, value: parPreview[1].price },
            ]));
          }
        } else {
          const [p1, p2] = pts;
          const p3 = point;
          if (currentDrawingRef.current?.previewLine) {
            try { chart.removeSeries(currentDrawingRef.current.previewLine); } catch (err) { }
            currentDrawingRef.current.previewLine = null;
          }
          const baseLine = currentDrawingRef.current?.series;
          if (!baseLine) return;
          const parPoints = computeParallelLineFromThreePoints(chart, series, p1, p2, p3);
          if (!parPoints) return;
          const parallelLine = chart.addLineSeries({
            color: "#8b5cf6",
            lineWidth: 2,
            priceLineVisible: false,
            lastValueVisible: false,
          });
          baseLine.setData(ensureAscendingTimeOrder([
            { time: p1.time, value: p1.price },
            { time: p2.time, value: p2.price },
          ]));
          parallelLine.setData(ensureAscendingTimeOrder([
            { time: parPoints[0].time, value: parPoints[0].price },
            { time: parPoints[1].time, value: parPoints[1].price },
          ]));
          const parallelChannelObject = {
            type: "parallellines",
            point1: p1,
            point2: p2,
            point3: p3,
            baseLine,
            parallelLine,
          };
          setChartObjects((prev) => [...prev, parallelChannelObject]);
          drawingObjectsRef.current.push(parallelChannelObject);
          setActiveTool(null);
          parallelChannelPointsRef.current = [];
          currentDrawingRef.current = null;
        }
      };

      const handleParallelChannelMouseMove = (e) => {
        const pts = parallelChannelPointsRef.current;
        if (pts.length !== 1 || !currentDrawingRef.current?.series) return;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        let time = chart.timeScale().coordinateToTime(x);
        const price = series.coordinateToPrice(y);
        if (time == null || price == null) return;
        time = normalizeTime(time);
        if (time == null) return;
        const lineData = ensureAscendingTimeOrder([
          { time: pts[0].time, value: pts[0].price },
          { time, value: price },
        ]);
        if (lineData.length > 0) currentDrawingRef.current.series.setData(lineData);
      };

      const handleParallelChannelMouseMoveTwo = (e) => {
        const pts = parallelChannelPointsRef.current;
        if (pts.length !== 2 || !currentDrawingRef.current?.previewLine) return;
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        let time = chart.timeScale().coordinateToTime(x);
        const price = series.coordinateToPrice(y);
        if (time == null || price == null) return;
        time = normalizeTime(time);
        if (time == null) return;
        const p3 = { time, price };
        const parPreview = computeParallelLineFromThreePoints(chart, series, pts[0], pts[1], p3);
        if (parPreview) {
          currentDrawingRef.current.previewLine.setData(ensureAscendingTimeOrder([
            { time: parPreview[0].time, value: parPreview[0].price },
            { time: parPreview[1].time, value: parPreview[1].price },
          ]));
        }
      };

      const onMove = (e) => {
        handleParallelChannelMouseMove(e);
        handleParallelChannelMouseMoveTwo(e);
      };

      const handleMouseMovePreventPan = (e) => {
        e.stopPropagation();
      };

      container.addEventListener("click", handleParallelChannelClick, options);
      container.addEventListener("mousemove", onMove, options);
      container.addEventListener("mousemove", handleMouseMovePreventPan, options);

      return () => {
        parallelChannelPointsRef.current = [];
        if (currentDrawingRef.current?.type === "parallellines") {
          try {
            if (currentDrawingRef.current.series) chart.removeSeries(currentDrawingRef.current.series);
            if (currentDrawingRef.current.previewLine) chart.removeSeries(currentDrawingRef.current.previewLine);
          } catch (err) { }
          currentDrawingRef.current = null;
        }
        container.removeEventListener("click", handleParallelChannelClick, options);
        container.removeEventListener("mousemove", onMove, options);
        container.removeEventListener("mousemove", handleMouseMovePreventPan, options);
      };
    }

    // Rectangle, Fibonacci: drag-based (mousedown → mousemove → mouseup). Parallel lines use 3-click above.
    // Clear trend line state when using drag tools (user switched from trendline)
    trendLineFirstPointRef.current = null;
    if (currentDrawingRef.current?.type === "trendline" && currentDrawingRef.current?.series) {
      try {
        chart.removeSeries(currentDrawingRef.current.series);
      } catch (err) { }
      currentDrawingRef.current = null;
    }

    const handleMouseDown = (e) => {
      // CRITICAL: Prevent default and stop propagation to prevent chart panning
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      if (toolType === "trendline" || toolType === "parallellines") return;
      if (toolType !== "rectangle" && toolType !== "fibonacci") return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Get time and price at EXACT click position (before any chart pan)
      let time = chart.timeScale().coordinateToTime(x);
      const price = series.coordinateToPrice(y);

      if (time == null || price == null) return;

      // Professional: Normalize time to integer UTC timestamp
      time = normalizeTime(time);
      if (time == null) return;

      // Set drawing state and capture start point EXACTLY where user clicked
      isDrawingRef.current = true;
      startPointRef.current = { time, price };
      endPointRef.current = null; // Reset end point

      if (toolType === "rectangle") {
        // Rectangle: single BaselineSeries (fill between top and bottom over time range)
        const rectSeries = chart.addBaselineSeries({
          baseValue: { type: "price", price: price },
          topLineColor: "#2563eb",
          bottomLineColor: "#2563eb",
          topFillColor1: "rgba(59, 130, 246, 0.38)",
          topFillColor2: "rgba(59, 130, 246, 0.22)",
          bottomFillColor1: "rgba(59, 130, 246, 0.22)",
          bottomFillColor2: "rgba(59, 130, 246, 0.38)",
          priceLineVisible: false,
          lastValueVisible: false,
          lineWidth: 2,
          lineStyle: 0,
        });
        currentDrawingRef.current = {
          type: "rectangle",
          series: rectSeries,
        };
      }

      if (toolType === "fibonacci") {
        // For Fibonacci, we'll show a preview line while dragging
        const fibLineSeries = chart.addLineSeries({
          color: "#f59e0b",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        currentDrawingRef.current = {
          type: "fibonacci",
          series: fibLineSeries,
          priceLines: [], // Will store Fibonacci level price lines
        };
      }

      if (toolType === "parallellines") {
        // Parallel Lines: First line (like trendline), then second parallel line
        const lineSeries = chart.addLineSeries({
          color: "#8b5cf6",
          lineWidth: 2,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        currentDrawingRef.current = {
          type: "parallellines",
          series: lineSeries,
          firstLine: null, // Will store first line data
          secondLine: null, // Will store second line series
        };
      }

    };

    const handleMouseMove = (e) => {
      if (!isDrawingRef.current || !startPointRef.current || !currentDrawingRef.current) return;

      // CRITICAL: Prevent default and stop propagation to prevent chart panning during drag
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Get current mouse position coordinates
      let time = chart.timeScale().coordinateToTime(x);
      const price = series.coordinateToPrice(y);

      if (time == null || price == null) return;

      // Professional: Normalize time to integer UTC timestamp
      time = normalizeTime(time);
      if (time == null) return;

      // Update end point for all tools
      endPointRef.current = { time, price };

      const start = startPointRef.current;

      if (currentDrawingRef.current.type === "rectangle") {
        const topPrice = Math.max(start.price, price);
        const bottomPrice = Math.min(start.price, price);
        const leftTime = normalizeTime(Math.min(start.time, time));
        const rightTime = normalizeTime(Math.max(start.time, time));
        if (leftTime == null || rightTime == null) return;
        if (Math.abs(rightTime - leftTime) < 1 || Math.abs(topPrice - bottomPrice) < 0.00001) return;
        const rectSeries = currentDrawingRef.current.series;
        rectSeries.setData(
          ensureAscendingTimeOrder([
            { time: leftTime, value: topPrice },
            { time: rightTime, value: topPrice },
          ])
        );
        rectSeries.applyOptions({ baseValue: { type: "price", price: bottomPrice } });
      }

      if (currentDrawingRef.current.type === "fibonacci") {
        // Show preview line while dragging
        const fibData = [
          { time: start.time, value: start.price },
          { time, value: price },
        ];
        const validatedData = ensureAscendingTimeOrder(fibData);
        if (validatedData.length > 0) {
          currentDrawingRef.current.series.setData(validatedData);
        }

        // Track end point for Fibonacci calculation
        endPointRef.current = { time, price };

        // Clear previous Fibonacci levels during drag
        if (currentDrawingRef.current.priceLines) {
          currentDrawingRef.current.priceLines.forEach(pl => {
            try {
              series.removePriceLine(pl);
            } catch (e) { }
          });
          currentDrawingRef.current.priceLines = [];
        }
      }

      if (currentDrawingRef.current.type === "parallellines") {
        // If first line is already drawn, draw second parallel line
        if (currentDrawingRef.current.firstLine) {
          const firstLine = currentDrawingRef.current.firstLine;
          // Calculate slope of first line
          const timeDiff = firstLine.endTime - firstLine.startTime;
          const priceDiff = firstLine.endPrice - firstLine.startPrice;

          // Calculate parallel line: same slope, different starting point
          const parallelStartPrice = price;
          const parallelEndPrice = parallelStartPrice + priceDiff;

          // Update second line
          if (currentDrawingRef.current.secondLine) {
            currentDrawingRef.current.secondLine.setData([
              { time: start.time, value: parallelStartPrice },
              { time, value: parallelEndPrice },
            ]);
          } else {
            // Create second line series
            const secondLineSeries = chart.addLineSeries({
              color: "#8b5cf6",
              lineWidth: 2,
              priceLineVisible: false,
              lastValueVisible: false,
            });
            secondLineSeries.setData([
              { time: start.time, value: parallelStartPrice },
              { time, value: parallelEndPrice },
            ]);
            currentDrawingRef.current.secondLine = secondLineSeries;
          }
        } else {
          // Drawing first line (like trendline)
          currentDrawingRef.current.series.setData([
            { time: start.time, value: start.price },
            { time, value: price },
          ]);
        }
      }
    };

    const handleMouseUp = (e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (!isDrawingRef.current || !currentDrawingRef.current || !startPointRef.current) return;

      const start = startPointRef.current;
      const end = endPointRef.current || start;

      // For Parallel Lines: handle first and second line
      if (currentDrawingRef.current.type === "parallellines") {
        // If first line not drawn yet, save it
        if (!currentDrawingRef.current.firstLine) {
          currentDrawingRef.current.firstLine = {
            startTime: start.time,
            startPrice: start.price,
            endTime: end.time,
            endPrice: end.price,
          };
          // Keep drawing mode active for second line
          isDrawingRef.current = false;
          startPointRef.current = null;
          endPointRef.current = null;
          return; // Don't finalize yet, wait for second line
        } else {
          // Second line is drawn, finalize the parallel lines object
          const parallelLinesObject = {
            type: "parallellines",
            firstLine: currentDrawingRef.current.series,
            secondLine: currentDrawingRef.current.secondLine,
            firstLineData: currentDrawingRef.current.firstLine,
          };
          setChartObjects((prev) => [...prev, parallelLinesObject]);
          drawingObjectsRef.current.push(parallelLinesObject);
          setActiveTool(null);

          // Reset for next parallel lines drawing
          currentDrawingRef.current = null;
          isDrawingRef.current = false;
          startPointRef.current = null;
          endPointRef.current = null;
          return;
        }
      }

      // For Fibonacci retracement: calculate levels
      if (currentDrawingRef.current.type === "fibonacci") {
        // Use end point from mousemove, or fallback to start point (for click-only case)
        const end = endPointRef.current || start;
        const endPrice = end.price;

        // If no movement (just click), don't draw Fibonacci
        if (Math.abs(start.price - endPrice) < 0.0001) {
          try {
            chart.removeSeries(currentDrawingRef.current.series);
          } catch (e) { }
          isDrawingRef.current = false;
          startPointRef.current = null;
          endPointRef.current = null;
          currentDrawingRef.current = null;
          return;
        }

        // Determine high and low based on drag direction
        // First point (start) is "from", second point (end) is "to"
        const high = Math.max(start.price, endPrice);
        const low = Math.min(start.price, endPrice);
        const diff = high - low;

        // Fibonacci retracement levels (standard trading levels)
        const fibLevels = [
          { level: 0, label: "0.0%" },
          { level: 0.236, label: "23.6%" },
          { level: 0.382, label: "38.2%" },
          { level: 0.5, label: "50.0%" },
          { level: 0.618, label: "61.8%" },
          { level: 0.786, label: "78.6%" },
          { level: 1.0, label: "100.0%" },
        ];

        const priceLines = [];
        const fibSeries = currentDrawingRef.current.series;

        // Remove preview line
        try {
          chart.removeSeries(fibSeries);
        } catch (e) { }

        // Create horizontal price lines for each Fibonacci level
        fibLevels.forEach(({ level, label }) => {
          // Calculate price at this Fibonacci level (from high to low)
          const fibPrice = high - (diff * level);

          const priceLine = series.createPriceLine({
            price: fibPrice,
            color: level === 0 || level === 1.0 ? "#f59e0b" : "#fbbf24",
            lineWidth: level === 0 || level === 1.0 ? 2 : 1,
            lineStyle: level === 0 || level === 1.0 ? 0 : 2, // Solid for 0% and 100%, dashed for others
            axisLabelVisible: true,
            title: `${label} (${fibPrice.toFixed(5)})`,
            textColor: level === 0 || level === 1.0 ? "#f59e0b" : "#fbbf24",
          });

          priceLines.push(priceLine);
        });

        const fibonacciObject = {
          type: "fibonacci",
          priceLines,
          startPrice: start.price,
          endPrice: endPrice,
          high,
          low,
        };

        setChartObjects((prev) => [...prev, fibonacciObject]);
        drawingObjectsRef.current.push(fibonacciObject);
        setActiveTool(null);
      }

      if (currentDrawingRef.current.type === "rectangle") {
        const start = startPointRef.current;
        const end = endPointRef.current || start;
        const topPrice = Math.max(start.price, end.price);
        const bottomPrice = Math.min(start.price, end.price);
        const leftTime = normalizeTime(Math.min(start.time, end.time));
        const rightTime = normalizeTime(Math.max(start.time, end.time));
        if (leftTime != null && rightTime != null && Math.abs(rightTime - leftTime) >= 1 && Math.abs(topPrice - bottomPrice) >= 0.00001) {
          const rectSeries = currentDrawingRef.current.series;
          rectSeries.setData(
            ensureAscendingTimeOrder([
              { time: leftTime, value: topPrice },
              { time: rightTime, value: topPrice },
            ])
          );
          rectSeries.applyOptions({ baseValue: { type: "price", price: bottomPrice } });
          const rectangleObject = {
            type: "rectangle",
            timeStart: leftTime,
            timeEnd: rightTime,
            priceTop: topPrice,
            priceBottom: bottomPrice,
            series: rectSeries,
          };
          setChartObjects((prev) => [...prev, rectangleObject]);
          drawingObjectsRef.current.push(rectangleObject);
          setActiveTool(null);
        } else {
          try {
            chart.removeSeries(currentDrawingRef.current.series);
          } catch (e) { }
        }
      }

      isDrawingRef.current = false;
      startPointRef.current = null;
      endPointRef.current = null;
      currentDrawingRef.current = null;
    };

    if (toolType === "rectangle" || toolType === "fibonacci" || toolType === "parallellines") {
      // CRITICAL: Use capture phase with stopImmediatePropagation to prevent chart from handling events
      // This ensures chart panning is completely disabled when drawing tools are active
      const options = { capture: true, passive: false };

      // Prevent mouse move from panning chart when tool is active (even before click)
      const handleMouseMovePreventPan = (e) => {
        if (!isDrawingRef.current) {
          // Only prevent panning if tool is active, allow normal mouse move for hover
          e.stopPropagation();
        }
      };

      container.addEventListener("mousedown", handleMouseDown, options);
      container.addEventListener("mousemove", handleMouseMove, options);
      container.addEventListener("mousemove", handleMouseMovePreventPan, options); // Prevent chart pan on mouse move
      container.addEventListener("mouseup", handleMouseUp, options);

      return () => {
        container.removeEventListener("mousedown", handleMouseDown, options);
        container.removeEventListener("mousemove", handleMouseMove, options);
        container.removeEventListener("mousemove", handleMouseMovePreventPan, options);
        container.removeEventListener("mouseup", handleMouseUp, options);
      };
    }
  }, [activeTool, setChartObjects, setActiveTool]);

  // Trend line selection, resize (drag handles), and move (drag line body) - when Crosshair or no tool
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    const container = containerRef.current;
    const isSelectionAllowed = activeTool == null || activeTool === 1;
    if (!isSelectionAllowed || !chart || !series || !container) {
      if (!isSelectionAllowed) {
        setSelectedChartObject(null);
        setHandlePositions([]);
      }
      return;
    }

    const HANDLE_RADIUS = 10;
    const LINE_THRESHOLD = 8;

    function hitTestTrendLines(clickX, clickY) {
      const trendLines = chartObjects.filter(
        (o) => o.type === "trendline" && o.point1 && o.point2
      );
      for (let i = trendLines.length - 1; i >= 0; i--) {
        const obj = trendLines[i];
        const x1 = chart.timeScale().timeToCoordinate(obj.point1.time);
        const y1 = series.priceToCoordinate(obj.point1.price);
        const x2 = chart.timeScale().timeToCoordinate(obj.point2.time);
        const y2 = series.priceToCoordinate(obj.point2.price);
        if (x1 == null || y1 == null || x2 == null || y2 == null) continue;

        const d1 = Math.hypot(clickX - x1, clickY - y1);
        const d2 = Math.hypot(clickX - x2, clickY - y2);
        if (d1 < HANDLE_RADIUS) return { object: obj, mode: "handle1" };
        if (d2 < HANDLE_RADIUS) return { object: obj, mode: "handle2" };
        const dLine = distanceToSegment(clickX, clickY, x1, y1, x2, y2);
        if (dLine < LINE_THRESHOLD) return { object: obj, mode: "line" };
      }
      return null;
    }

    const handleSelectionMouseDown = (e) => {
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const hit = hitTestTrendLines(x, y);
      if (hit) {
        e.preventDefault();
        e.stopPropagation();
        setSelectedChartObject(hit.object);
        dragModeRef.current = hit.mode;
        if (hit.mode === "line") {
          dragStartRef.current = {
            x,
            y,
            point1: { ...hit.object.point1 },
            point2: { ...hit.object.point2 },
          };
        }
      } else {
        setSelectedChartObject(null);
        dragModeRef.current = null;
        // Don't preventDefault/stopPropagation so chart can receive events for pan (left/right) and price axis drag (up/down)
      }
    };

    const handleSelectionMouseMove = (e) => {
      if (!dragModeRef.current) return;
      const obj = selectedChartObjectRef.current;
      if (!obj || !obj.point1 || !obj.point2) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      let time = chart.timeScale().coordinateToTime(x);
      const price = series.coordinateToPrice(y);
      if (time == null || price == null) return;
      time = normalizeTime(time);
      if (time == null) return;

      if (dragModeRef.current === "handle1") {
        const newPoint1 = { time, price };
        const lineData = ensureAscendingTimeOrder([
          { time: newPoint1.time, value: newPoint1.price },
          { time: obj.point2.time, value: obj.point2.price },
        ]);
        if (lineData.length > 0) {
          obj.series.setData(lineData);
        }
        const updated = { ...obj, point1: newPoint1 };
        setChartObjects((prev) => {
          const next = prev.map((o) => (o === obj ? updated : o));
          drawingObjectsRef.current = next;
          return next;
        });
        setSelectedChartObject(updated);
        selectedChartObjectRef.current = updated;
      } else if (dragModeRef.current === "handle2") {
        const newPoint2 = { time, price };
        const lineData = ensureAscendingTimeOrder([
          { time: obj.point1.time, value: obj.point1.price },
          { time: newPoint2.time, value: newPoint2.price },
        ]);
        if (lineData.length > 0) {
          obj.series.setData(lineData);
        }
        const updated = { ...obj, point2: newPoint2 };
        setChartObjects((prev) => {
          const next = prev.map((o) => (o === obj ? updated : o));
          drawingObjectsRef.current = next;
          return next;
        });
        setSelectedChartObject(updated);
        selectedChartObjectRef.current = updated;
      } else if (dragModeRef.current === "line") {
        const start = dragStartRef.current;
        if (!start) return;
        const startTime = chart.timeScale().coordinateToTime(start.x);
        const startPrice = series.coordinateToPrice(start.y);
        if (startTime == null || startPrice == null) return;
        const deltaTime = time - startTime;
        const deltaPrice = price - startPrice;
        const newPoint1 = {
          time: normalizeTime(start.point1.time + deltaTime),
          price: start.point1.price + deltaPrice,
        };
        const newPoint2 = {
          time: normalizeTime(start.point2.time + deltaTime),
          price: start.point2.price + deltaPrice,
        };
        const lineData = ensureAscendingTimeOrder([
          { time: newPoint1.time, value: newPoint1.price },
          { time: newPoint2.time, value: newPoint2.price },
        ]);
        if (lineData.length > 0) {
          obj.series.setData(lineData);
        }
        const updated = { ...obj, point1: newPoint1, point2: newPoint2 };
        setChartObjects((prev) => {
          const next = prev.map((o) => (o === obj ? updated : o));
          drawingObjectsRef.current = next;
          return next;
        });
        setSelectedChartObject(updated);
        selectedChartObjectRef.current = updated;
      }
    };

    const handleSelectionMouseUp = () => {
      dragModeRef.current = null;
      dragStartRef.current = null;
    };

    const options = { capture: true, passive: false };
    container.addEventListener("mousedown", handleSelectionMouseDown, options);
    container.addEventListener("mousemove", handleSelectionMouseMove, options);
    container.addEventListener("mouseup", handleSelectionMouseUp, options);

    return () => {
      container.removeEventListener("mousedown", handleSelectionMouseDown, options);
      container.removeEventListener("mousemove", handleSelectionMouseMove, options);
      container.removeEventListener("mouseup", handleSelectionMouseUp, options);
    };
  }, [activeTool, chartObjects, setChartObjects]);

  // Compute handle positions for selected trend line; update on zoom/scroll
  useEffect(() => {
    const chart = chartRef.current;
    const series = seriesRef.current;
    if (!chart || !series) return;

    const updateHandlePositions = () => {
      const sel = selectedChartObject;
      if (!sel || sel.type !== "trendline" || !sel.point1 || !sel.point2) {
        setHandlePositions([]);
        return;
      }
      const timeScale = chart.timeScale();
      const x1 = timeScale.timeToCoordinate(sel.point1.time);
      const y1 = series.priceToCoordinate(sel.point1.price);
      const x2 = timeScale.timeToCoordinate(sel.point2.time);
      const y2 = series.priceToCoordinate(sel.point2.price);
      if (x1 != null && y1 != null && x2 != null && y2 != null) {
        setHandlePositions([{ x: x1, y: y1 }, { x: x2, y: y2 }]);
      } else {
        setHandlePositions([]);
      }
    };

    updateHandlePositions();
    const timeScale = chart.timeScale();
    timeScale.subscribeVisibleTimeRangeChange(updateHandlePositions);
    return () => {
      timeScale.unsubscribeVisibleTimeRangeChange(updateHandlePositions);
    };
  }, [selectedChartObject]);

  // Toggle visibility of all drawn objects when eye icon is used
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;

    drawingObjectsRef.current.forEach((obj) => {
      if (obj.series) {
        obj.series.applyOptions({ visible: drawingsVisible });
      }
      if (obj.priceLine) {
        obj.priceLine.applyOptions(
          drawingsVisible
            ? {
              color: "#3b82f6",
              axisLabelVisible: true,
              title:
                typeof obj.price === "number"
                  ? obj.price.toFixed(5)
                  : "",
            }
            : {
              color: "rgba(0,0,0,0)",
              axisLabelVisible: false,
              title: "",
            }
        );
      }
      // Handle Fibonacci price lines – use lineVisible so lines restore correctly when unhiding
      if (obj.type === "fibonacci" && obj.priceLines) {
        obj.priceLines.forEach((pl) => {
          try {
            pl.applyOptions({
              lineVisible: drawingsVisible,
              axisLabelVisible: drawingsVisible,
            });
          } catch (e) {
            // Ignore errors
          }
        });
      }
      // Handle Rectangle
      if (obj.type === "rectangle" && obj.series) {
        obj.series.applyOptions({ visible: drawingsVisible });
      }
      // Handle Parallel Lines – 3-click channel (baseLine, parallelLine) or drag (firstLine, secondLine)
      if (obj.type === "parallellines") {
        if (obj.baseLine) obj.baseLine.applyOptions({ visible: drawingsVisible });
        if (obj.parallelLine) obj.parallelLine.applyOptions({ visible: drawingsVisible });
        if (obj.firstLine) obj.firstLine.applyOptions({ visible: drawingsVisible });
        if (obj.secondLine) obj.secondLine.applyOptions({ visible: drawingsVisible });
      }
    });
  }, [drawingsVisible, chartObjects]);

  // Deselect when drawings are hidden
  useEffect(() => {
    if (!drawingsVisible && selectedChartObject) {
      setSelectedChartObject(null);
      setHandlePositions([]);
    }
  }, [drawingsVisible, selectedChartObject]);

  // Clean up drawing objects when deleted
  useEffect(() => {
    if (drawingObjectsRef.current.length > chartObjects.length) {
      // Object was deleted, remove from chart
      const removed = drawingObjectsRef.current.filter(
        (obj, idx) => !chartObjects.includes(obj)
      );
      if (selectedChartObject && removed.some((obj) => obj === selectedChartObject)) {
        setSelectedChartObject(null);
        setHandlePositions([]);
      }
      removed.forEach((obj) => {
        if (obj.series) {
          chartRef.current?.removeSeries(obj.series);
        }
        if (obj.priceLine) {
          seriesRef.current?.removePriceLine(obj.priceLine);
        }
        // Handle Fibonacci price lines deletion
        if (obj.type === "fibonacci" && obj.priceLines) {
          obj.priceLines.forEach((pl) => {
            try {
              seriesRef.current?.removePriceLine(pl);
            } catch (e) {
              // Ignore errors
            }
          });
        }
        // Handle Rectangle deletion
        if (obj.type === "rectangle" && obj.series) {
          try {
            chartRef.current?.removeSeries(obj.series);
          } catch (e) {
            // Ignore errors
          }
        }
        // Handle Parallel Lines deletion (3-click: baseLine/parallelLine; drag: firstLine/secondLine)
        if (obj.type === "parallellines") {
          try {
            if (obj.baseLine) chartRef.current?.removeSeries(obj.baseLine);
            if (obj.parallelLine) chartRef.current?.removeSeries(obj.parallelLine);
            if (obj.firstLine) chartRef.current?.removeSeries(obj.firstLine);
            if (obj.secondLine) chartRef.current?.removeSeries(obj.secondLine);
          } catch (e) {
            // Ignore errors
          }
        }
      });
      drawingObjectsRef.current = chartObjects;
    }
  }, [chartObjects, selectedChartObject]);

  // Display orders on chart (left side - price scale)
  useEffect(() => {
    const series = seriesRef.current;
    if (!series) return;

    // Remove old order price lines
    orderPriceLinesRef.current.forEach((priceLine) => {
      try {
        series.removePriceLine(priceLine);
      } catch (e) {
        // Ignore errors if already removed
      }
    });
    orderPriceLinesRef.current = [];

    // Filter orders for current symbol
    const currentSymbolOrders = orders.filter(
      (order) => order.symbol === selectedSymbolStr
    );

    // Add price lines for each order
    currentSymbolOrders.forEach((order) => {
      const price = parseFloat(order.price);
      if (isNaN(price)) return;

      const isBuy = order.type === "BUY";
      const color = isBuy ? "#26A69A" : "#EF5350"; // Green for BUY, Red for SELL

      const priceLine = series.createPriceLine({
        price: price,
        color: color,
        lineWidth: 2,
        lineStyle: 0, // Solid line
        axisLabelVisible: true,
        title: `${order.type} ${order.volume} @ ${order.price}`,
        textColor: color,
      });

      orderPriceLinesRef.current.push(priceLine);
    });

    // Cleanup function
    return () => {
      orderPriceLinesRef.current.forEach((priceLine) => {
        try {
          series.removePriceLine(priceLine);
        } catch (e) {
          // Ignore errors
        }
      });
      orderPriceLinesRef.current = [];
    };
  }, [orders, selectedSymbolStr]);

  return (
    <div className={`flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden ${isDark ? 'bg-[#0d1117] border-white/10' : 'bg-white border-slate-200'}`}>
      {/* Chart container: fill all available height */}
      <div
        ref={containerRef}
        className="flex-1 w-full min-h-[320px] relative"
        style={{
          cursor: activeTool === 1 ? "crosshair" : (activeTool !== null ? "crosshair" : "default"),
          minHeight: 320,
          minWidth: 0,
        }}
        onDoubleClick={(e) => {
          // Double click reset zoom (only if not drawing)
          if (chartRef.current && !isDrawingRef.current) {
            e.preventDefault();
            e.stopPropagation();
            chartRef.current.timeScale().fitContent();
            saveZoomState(chartRef.current.timeScale().getVisibleRange());
          }
        }}
      >





        {/* Floating Buy/Sell buttons over chart (top-left) */}
        {showBuySellPanel && (
          <div className="absolute top-3 left-3 z-30">
            <BuySellPanel
              bidPrice={bidPrice}
              askPrice={askPrice}
              onBuyClick={handleBuyClick}
              onSellClick={handleSellClick}
            />
          </div>
        )} 

        {/* Market Execution Panel – floats over chart from the left, similar to MT5 */}
         <MarketExecutionModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          orderType={modalOrderType}
          bidPrice={bidPrice}
          askPrice={askPrice}
        />

        {/* Handles overlay for selected trend line (resize/move) – pointer-events none so hit-test on container */}
        {drawingsVisible &&
          selectedChartObject?.type === "trendline" &&
          selectedChartObject?.point1 &&
          selectedChartObject?.point2 &&
          handlePositions.length === 2 && (
            <div
              className="absolute inset-0 z-20 pointer-events-none"
              aria-hidden
            >
              {handlePositions.map((pos, i) => (
                <div
                  key={i}
                  className="absolute w-[10px] h-[10px] rounded-full border-2 border-white bg-[#22c55e] shadow"
                  style={{
                    left: pos.x - 5,
                    top: pos.y - 5,
                  }}
                />
              ))}
            </div>
          )}
      </div>
    </div>
  );
});

export default ChartArea;
