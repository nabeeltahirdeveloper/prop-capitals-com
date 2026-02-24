import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
// import { useTrading } from '@/contexts/TradingContext';
import { usePrices } from "@/contexts/PriceContext";
import { alignToTimeframe } from "@/utils/timeEngine";
import { timeframeToSeconds } from "@/utils/candleEngine";
import { io } from "socket.io-client";
// import TopBar from '../trading/Topbar';
// import LeftSidebar from '../trading/LeftSidebar';
// import MarketExecutionModal from './MarketExecutionModal';
import TradingPanel from "../trading/TradingPanel";
import { Card } from "../ui/card";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "../ui/use-toast";
import {
  Chart,
  useTrading,
  TopBar,
  LeftSidebar,
  MarketExecutionModal,
  MarketWatch,
  BuySellPanel,
  AccountPanel,
} from "@nabeeltahirdeveloper/chart-sdk";
import MT5Login from "./MT5Login";
import { usePlatformTokensStore } from "@/lib/stores/platform-tokens.store";
import { processPlatformLogin, resetPlatformPassword } from "@/api/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccountSummary, getUserAccounts } from "@/api/accounts";
import { getAccountTrades, updateTrade, modifyPosition } from "@/api/trades";
import { mt5Engine } from "@/trading/engines/mt5Engine";
import { useAuth } from "@/contexts/AuthContext";

const MT5TradingArea = ({
  selectedChallenge,
  positions: positionsFromParent = [],
  onExecuteTrade,
  tradingEngine,
  showBuySellPanel: showBuySellPanelProp,
  setShowBuySellPanel: setShowBuySellPanelProp,
  accountBalance: accountBalanceFromParent,
  selectedAccountId: selectedAccountIdFromParent,
  account: accountFromParent,
  // selectedSymbol: selectedSymbolFromParent,
  // setSelectedSymbol: setSelectedSymbolFromParent,
}) => {
  const {
    selectedSymbol,
    setSelectedSymbol,
    selectedTimeframe,
    setSelectedTimeframe,
    symbols,
    setSymbols,
    symbolsLoading,
    setOrders,
    currentSymbolData,
    chartType,
    setChartType,
    theme,
  } = useTrading();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const accountId = selectedChallenge?.id;

  /* ── Own data queries (self-contained, no dependency on CommonTerminalWrapper props) ── */
  const { data: accountSummaryData } = useQuery({
    queryKey: ["accountSummary", accountId],
    queryFn: () => getAccountSummary(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });

  const { data: tradesData } = useQuery({
    queryKey: ["trades", accountId],
    queryFn: () => getAccountTrades(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });

  /* ── Close trade mutation ── */
  const closePositionMutation = useMutation({
    mutationFn: ({ tradeId, closePrice }) =>
      updateTrade(tradeId, { closePrice }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
      queryClient.invalidateQueries({
        queryKey: ["accountSummary", accountId],
      });
      toast({ title: "Position closed" });
    },
    onError: (e) =>
      toast({
        title: "Close failed",
        description: e?.response?.data?.message || e.message,
        variant: "destructive",
      }),
  });

  /* ── Modify TP/SL mutation ── */
  const modifyTPSLMutation = useMutation({
    mutationFn: ({ tradeId, stopLoss, takeProfit }) =>
      modifyPosition(tradeId, { stopLoss, takeProfit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
      toast({ title: "Position modified" });
    },
    onError: (e) =>
      toast({
        title: "Modify failed",
        description: e?.response?.data?.message || e.message,
        variant: "destructive",
      }),
  });

  /* ── Modify TP/SL dialog state ── */
  const [modifyTPSLTrade, setModifyTPSLTrade] = useState(null);
  const [modifyTP, setModifyTP] = useState("");
  const [modifySL, setModifySL] = useState("");

  const balance = Number.isFinite(accountSummaryData?.account?.balance)
    ? accountSummaryData.account.balance
    : selectedChallenge?.currentBalance || 0;

  // WebSocket connection for real-time candle updates
  const candlesSocketRef = useRef(null);

  const { data: userAccounts } = useQuery({
    queryKey: ["userAccounts", user?.userId],
    queryFn: async () => getUserAccounts(user?.userId),
    enabled: !!user?.userId,
  });

  // console.log("MT5", userAccounts)
  // console.log("USER:", user);
  // console.log("USER ID:", user?.id);
  // console.log("ACCOUNTS:", userAccounts);

  //move on Ecnomic calendar page

  const onMove = () => {
    navigate("/traderdashboard/calendar");
  };

  // Platform authentication state
  // const accountId = selectedChallenge?.id;
  const getPlatformToken = usePlatformTokensStore(
    (state) => state.getPlatfromToken,
  );
  const setPlatformToken = usePlatformTokensStore(
    (state) => state.setPlatfromToken,
  );
  const platformToken = getPlatformToken(accountId);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  // Handle MT5 platform login
  const handlePlatformLogin = async (email, password) => {
    if (!accountId) {
      toast({ title: "No account selected", variant: "destructive" });
      return;
    }
    setIsLoggingIn(true);
    try {
      const response = await processPlatformLogin(accountId, email, password);
      if (response?.platformToken) {
        setPlatformToken(accountId, response.platformToken);
        console.log(accountId, response);
        toast({ title: "Successfully connected to MT5" });
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!accountId) {
      toast({ title: "No account selected", variant: "destructive" });
      return;
    }
    setIsResettingPassword(true);
    try {
      await resetPlatformPassword(accountId);
      toast({ title: "Password reset email sent" });
    } catch (error) {
      toast({
        title: "Reset failed",
        description: error.response?.data?.message || error.message,
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // All hooks must be declared before any early return (Rules of Hooks)
  const [showBuySellPanelLocal, setShowBuySellPanelLocal] = useState(false);
  const showBuySellPanel =
    setShowBuySellPanelProp !== undefined
      ? showBuySellPanelProp
      : showBuySellPanelLocal;
  const setShowBuySellPanel =
    setShowBuySellPanelProp !== undefined
      ? setShowBuySellPanelProp
      : setShowBuySellPanelLocal;
  const [selectedSymbolLocal, setSelectedSymbolLocal] = useState(null);
  const [modalInitialOrderType, setModalInitialOrderType] = useState(null); // 'buy' | 'sell' | null when opening from chart/topbar
  const pricesRef = useRef({});

  // Chart Buy/Sell should open our modal (connected to handleExecuteTrade), not the chart's internal modal
  const handleChartBuyClick = useCallback(() => {
    setModalInitialOrderType("BUY");
    setShowBuySellPanel(true);
  }, [setShowBuySellPanel]);
  const handleChartSellClick = useCallback(() => {
    setModalInitialOrderType("SELL");
    setShowBuySellPanel(true);
  }, [setShowBuySellPanel]);

  const { prices: unifiedPrices, getPrice: getUnifiedPrice } = usePrices();
  const [showMarketWatch, setShowMarketWatch] = useState(true);

  const normalizeType = useCallback(
    (value) =>
      String(value || "BUY").toUpperCase() === "SELL" ? "SELL" : "BUY",
    [],
  );

  /* ── Own open positions from own query (fallback: positionsFromParent) ── */
  const ownOpenPositions = useMemo(() => {
    const raw = Array.isArray(tradesData) ? tradesData : [];
    return raw.filter((t) => !t.closedAt && t.closePrice === null);
  }, [tradesData]);

  /* Source: prefer own query, fallback to parent prop */
  const activePositionsSource =
    ownOpenPositions.length > 0 ? ownOpenPositions : positionsFromParent || [];

  const sdkOrdersFromBackend = useMemo(() => {
    return activePositionsSource.map((position) => {
      const symbol = position?.symbol;
      const type = normalizeType(position?.type);
      const openPrice = Number(position?.openPrice ?? position?.price ?? 0);
      const volume = Number(position?.volume ?? 0);
      const live = symbol ? unifiedPrices?.[symbol] : null;
      const exitPrice = type === "BUY" ? Number(live?.bid) : Number(live?.ask);
      // Use mt5Engine directly for correct XAU/XAG/Forex contract sizes
      const liveProfit =
        Number.isFinite(exitPrice) && exitPrice > 0
          ? mt5Engine.calculatePnL({
              symbol,
              type,
              volume,
              openPrice,
              currentPrice: exitPrice,
            })
          : Number(position?.profit || 0);

      return {
        id: position?.id,
        ticket: String(position?.id || "").substring(0, 8),
        symbol,
        type,
        volume,
        price: openPrice,
        openPrice,
        stopLoss: position?.stopLoss ?? null,
        takeProfit: position?.takeProfit ?? null,
        comment: position?.comment || "",
        status: "OPEN",
        swap: Number(position?.swap || 0),
        profit: Number.isFinite(liveProfit) ? liveProfit : 0,
        livePnL: Number.isFinite(liveProfit) ? liveProfit : 0,
        currentPrice:
          Number.isFinite(exitPrice) && exitPrice > 0 ? exitPrice : null,
        profitCurrency: "USD",
        time: new Date(
          position?.openedAt ||
            position?.openAt ||
            position?.createdAt ||
            Date.now(),
        ).toLocaleTimeString(),
        openAt:
          position?.openedAt || position?.openAt || position?.createdAt || null,
        closeAt: null,
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePositionsSource, normalizeType, unifiedPrices]);

  const lastSyncSignatureRef = useRef("");
  useEffect(() => {
    if (!setOrders) return;
    const signature = JSON.stringify(
      sdkOrdersFromBackend.map((o) => [
        o.id,
        o.symbol,
        o.type,
        o.volume,
        o.price,
        o.stopLoss,
        o.takeProfit,
        o.profit,
      ]),
    );
    if (signature === lastSyncSignatureRef.current) return;
    lastSyncSignatureRef.current = signature;

    setOrders((prev) => {
      const optimistic = (prev || []).filter((o) =>
        String(o?.id || "").startsWith("temp_"),
      );
      if (optimistic.length === 0) return sdkOrdersFromBackend;
      return [...sdkOrdersFromBackend, ...optimistic];
    });
  }, [sdkOrdersFromBackend, setOrders]);

  // Bridge: MT5 live prices → SDK TradingContext symbols update
  // Jab MT5 PriceContext se live prices aayen, SDK ke symbols mein update karo
  // IMPORTANT: Dependency array sirf unifiedPrices + setSymbols par rakho
  // warna infinite re-render / "Maximum update depth exceeded" error aata hai.
  useEffect(() => {
    if (!unifiedPrices || Object.keys(unifiedPrices).length === 0) return;

    // Update SDK symbols with live prices from MT5 PriceContext
    setSymbols((prev) =>
      prev.map((s) => {
        const livePrice = unifiedPrices[s.symbol];
        if (!livePrice) return s;

        const next = {
          ...s,
          bid: livePrice.bid ?? s.bid,
          ask: livePrice.ask ?? s.ask,
          // change field maintain karo (agar MT5 se nahi aata)
          change: s.change ?? 0,
        };

        return next;
      }),
    );
  }, [unifiedPrices, setSymbols]);

  // Real-time candle updates for SDK Chart
  // SDK Chart receives bidPrice/askPrice props, but candles need to be updated through SDK's context
  // Since SDK Chart is a black box, we ensure prices are updating frequently to trigger SDK's internal candle updates
  const [realTimeBidPrice, setRealTimeBidPrice] = useState(null);
  const [realTimeAskPrice, setRealTimeAskPrice] = useState(null);

  // Derive real-time bid/ask reactively from PriceContext (no polling loop)
  useEffect(() => {
    const symbolStr =
      typeof selectedSymbol === "object"
        ? selectedSymbol?.symbol
        : selectedSymbol;
    if (!symbolStr) return;

    const live = unifiedPrices[symbolStr];
    if (!live) return;

    const bidNum = parseFloat(live.bid);
    const askNum = parseFloat(live.ask);

    if (Number.isFinite(bidNum) && bidNum > 0) setRealTimeBidPrice(bidNum);
    if (Number.isFinite(askNum) && askNum > 0) setRealTimeAskPrice(askNum);
  }, [unifiedPrices, selectedSymbol]);

  // WebSocket connection for real-time candle updates from backend
  useEffect(() => {
    if (!selectedSymbol || !selectedTimeframe) return;

    const WEBSOCKET_URL =
      import.meta.env.VITE_WEBSOCKET_URL || "https://api-dev.prop-capitals.com";
    const symbolStr = selectedSymbol.symbol || selectedSymbol;
    const timeframeStr = selectedTimeframe || "M1";

    const getAuthToken = () =>
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt_token");

    const socket = io(WS_URL, {
      auth: (cb) => cb({ token: getAuthToken() }),
      // polling-first: works through nginx proxies and Windows firewall
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    candlesSocketRef.current = socket;

    socket.on("connect", () => {
      // Subscribe to real-time candle updates for this symbol/timeframe
      socket.emit("subscribeCandles", { symbol: symbolStr, timeframe: timeframeStr });
    });

      console.log("[MT5TradingArea] ✅ Connected to candles WebSocket");
      // Subscribe to candle updates for the current symbol/timeframe
      socket.emit("subscribeCandles", { symbol: symbolStr, timeframe: timeframeStr });
      console.log(`[MT5TradingArea] 📡 Subscribed to candles: ${symbolStr}@${timeframeStr}`);
    });

    // If already connected, subscribe immediately (symbol/timeframe change without reconnect)
    if (socket.connected) {
      socket.emit("subscribeCandles", { symbol: symbolStr, timeframe: timeframeStr });
    }

    socket.on("disconnect", (reason) => {
      console.log(
        "[MT5TradingArea] ❌ Candles WebSocket disconnected:",
        reason,
      );
    });
    
    socket.on("connect_error", (error) => {
      console.warn("[MT5] Candles WebSocket error:", error.message);
    });

    socket.on("candleUpdate", (data) => {
      if (!data?.candle || !data?.symbol || !data?.timeframe) return;

      const normalizedSymbol = (data.symbol || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const currentSymbolNormalized = (symbolStr || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (normalizedSymbol !== currentSymbolNormalized || data.timeframe !== timeframeStr) return;

      // Update bid price from latest candle close for real-time accuracy
      const close = data.candle.close;
      if (close > 0) {
        setRealTimeBidPrice(close);
      }
    });

    return () => {
      socket.disconnect();
      candlesSocketRef.current = null;
    };
  }, [selectedSymbol, selectedTimeframe]);

  // Enrich selected symbol with real-time price data
  const enrichedSelectedSymbol =
    selectedSymbol && unifiedPrices[selectedSymbol.symbol]
      ? {
          ...selectedSymbol,
          bid: unifiedPrices[selectedSymbol.symbol].bid,
          ask: unifiedPrices[selectedSymbol.symbol].ask,
        }
      : selectedSymbol;

  const handlePriceUpdate = useCallback((symbolName, price) => {
    pricesRef.current[symbolName] = price;
  }, []);

  const handleNewOrder = () => setShowBuySellPanel(true);
  const handleToggleBuySell = () => setShowBuySellPanel((prev) => !prev);

  const handleZoomIn = () => {
    chartAreaRef.current?.zoomIn?.();
  };

  const handleZoomOut = () => {
    chartAreaRef.current?.zoomOut?.();
  };

  const handleDownloadChartPNG = () => {
    chartAreaRef.current?.downloadChartAsPNG?.();
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const isLight = theme === "light";
  const [marketWatchWidth, setMarketWatchWidth] = useState(500); // Right symbols panel width (default: thoda sa left/chhota)
  const [isResizing, setIsResizing] = useState(false);
  const resizeRef = useRef(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(200);

  const [isBottomResizing, setIsBottomResizing] = useState(false);
  const [bottomPanelHeight, setBottomPanelHeight] = useState(200);
  const bottomResizeRef = useRef(null);
  const chartAreaRef = useRef(null);

  /* ── Close position handler (passed to AccountPanel) ── */
  const handleClosePosition = useCallback(
    (tradeId) => {
      const pos = sdkOrdersFromBackend.find((p) => p.id === tradeId);
      if (!pos) return;
      const symbolStr = pos.symbol;
      const live = unifiedPrices?.[symbolStr];
      const closePrice =
        pos.type === "BUY"
          ? Number(live?.bid || pos.currentPrice || pos.openPrice)
          : Number(live?.ask || pos.currentPrice || pos.openPrice);
      if (!closePrice || closePrice <= 0) {
        toast({ title: "No price available to close", variant: "destructive" });
        return;
      }
      closePositionMutation.mutate({ tradeId, closePrice });
    },
    [sdkOrdersFromBackend, unifiedPrices, closePositionMutation, toast],
  );

  /* ── Modify TP/SL submit handler ── */
  const handleModifyTPSLSubmit = useCallback(() => {
    if (!modifyTPSLTrade) return;
    const sl = modifySL !== "" ? parseFloat(modifySL) : null;
    const tp = modifyTP !== "" ? parseFloat(modifyTP) : null;
    modifyTPSLMutation.mutate(
      { tradeId: modifyTPSLTrade.id, stopLoss: sl, takeProfit: tp },
      { onSuccess: () => setModifyTPSLTrade(null) },
    );
  }, [modifyTPSLTrade, modifySL, modifyTP, modifyTPSLMutation]);

  // Market Execution Modal state (Professional Trading Terminal - Side Panel)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [orderType, setOrderType] = useState("BUY");
  const [modalInitialVolume, setModalInitialVolume] = useState(null);

  const handleBuyClick = (orderData) => {
    setOrderType("BUY");
    setModalInitialVolume(orderData?.volume ?? null);
    setIsOrderModalOpen(true);
  };

  const handleSellClick = (orderData) => {
    setOrderType("SELL");
    setModalInitialVolume(orderData?.volume ?? null);
    setIsOrderModalOpen(true);
  };

  // Handle right sidebar (Market Watch) horizontal resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      // Calculate delta from start position
      const deltaX = resizeStartX.current - e.clientX; // Negative when dragging left (making panel smaller)
      const newWidth = resizeStartWidth.current + deltaX;

      // Min width: 120px, Max width: 600px
      const clampedWidth = Math.min(Math.max(newWidth, 120), 600);
      setMarketWatchWidth(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      resizeStartX.current = 0;
      resizeStartWidth.current = marketWatchWidth;
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, marketWatchWidth]);

  // Handle bottom panel (Account & Orders) vertical resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isBottomResizing) return;

      const container = bottomResizeRef.current?.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const newHeight = containerRect.bottom - e.clientY;

      // Min height: 120px, Max height: 400px
      const clampedHeight = Math.min(Math.max(newHeight, 120), 400);
      setBottomPanelHeight(clampedHeight);
    };

    const handleMouseUp = () => {
      setIsBottomResizing(false);
    };

    if (isBottomResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isBottomResizing]);

  // If no platform token, show login screen (after all hooks)
  if (!platformToken) {
    return (
      <MT5Login
        onPlatformLogin={handlePlatformLogin}
        onPasswordReset={handlePasswordReset}
        isSubmitting={isLoggingIn}
        isResetting={isResettingPassword}
        userEmail={user?.email}
      />
    );
  }

  return (
    <>
      <div
        className={`h-screen flex flex-col overflow-hidden relative ${isLight ? "bg-slate-100 text-slate-900" : "bg-slate-950 text-slate-100"}`}
      >
        {/* Left Sidebar - Tools (overlaps header, full height, highest z-index) */}
        <div className="absolute left-0 top-0 bottom-0 z-50">
          <LeftSidebar
            AccountId={accountId}
            UserName={
              selectedChallenge?.platform === "MT5"
                ? selectedChallenge?.platformEmail
                : undefined
            }
            UserId={user?.userId}
          />
        </div>

        {/* Top Bar - Starts after sidebar */}
        <div className="pl-12">
          <TopBar
            selectedSymbol={selectedSymbol}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            chartType={chartType}
            onChartTypeChange={setChartType}
            onNewOrder={handleNewOrder}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onDownloadChartPNG={handleDownloadChartPNG}
            onToggleFullscreen={handleToggleFullscreen}
            marketWatchOpen={showMarketWatch}
            onToggleMarketWatch={() => setShowMarketWatch((prev) => !prev)}
            onToggleBuySell={handleToggleBuySell}
            buySellPanelOpen={showBuySellPanel}
            onMove={onMove}
          />
        </div>

        {/* Main Content Area – tools bar full-height, chart + market watch + bottom panel on right */}
        <div className="flex-1 flex overflow-hidden pl-12">
          {/* Right side: chart + market watch + bottom account panel */}
          <div className="flex-1 flex flex-col relative">
            {/* Center row: chart + market watch */}
            <div className="flex-1 flex overflow-hidden relative">
              {/* Center - Chart Area */}
              <Chart
                ref={chartAreaRef}
                bidPrice={realTimeBidPrice ?? currentSymbolData.bid}
                askPrice={realTimeAskPrice ?? currentSymbolData.ask}
                showBuySellPanel={false}
                onBuyClick={handleBuyClick}
                onSellClick={handleSellClick}
              />

              {/* Resize Handle + Market Watch: only when open */}
              {showMarketWatch && (
                <>
                  <div
                    ref={resizeRef}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      resizeStartX.current = e.clientX;
                      resizeStartWidth.current = marketWatchWidth;
                      setIsResizing(true);
                    }}
                    className={`w-1 ${isLight ? "bg-gray-300" : "bg-[#101821]"} hover:bg-sky-700 cursor-col-resize transition-colors relative group`}
                  >
                    <div className="absolute inset-y-0 left-1/2  group-hover:bg-white" />
                  </div>
                  <MarketWatch
                    width={marketWatchWidth}
                    symbols={symbols}
                    selectedSymbol={selectedSymbol}
                    onSymbolSelect={setSelectedSymbol}
                    symbolsLoading={symbolsLoading}
                  />
                </>
              )}

              {/* BuySellPanel — floats at top-left of chart canvas, always above modal */}
              {showBuySellPanel && (
                <div className="absolute top-6 left-4 z-[99] pointer-events-auto">
                  <BuySellPanel
                    bidPrice={realTimeBidPrice ?? currentSymbolData.bid}
                    askPrice={realTimeAskPrice ?? currentSymbolData.ask}
                    onBuyClick={handleBuyClick}
                    onSellClick={handleSellClick}
                  />
                </div>
              )}
            </div>
            {/* end flex-1 flex overflow-hidden relative (chart row) */}

            {/* Bottom Resize Handle */}
            <div
              ref={bottomResizeRef}
              onMouseDown={(e) => {
                e.preventDefault();
                setIsBottomResizing(true);
              }}
              className={`h-1 ${isLight ? "bg-gray-300" : "bg-[#101821]"} hover:bg-sky-700 cursor-row-resize transition-colors relative group`}
            >
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 group-hover:bg-sky-500/20" />
            </div>

            {/* MT5 Bottom Panel — Positions + Account Summary */}
            <AccountPanel
              height={bottomPanelHeight}
              accountSummary={{
                balance,
                equity:
                  balance +
                  sdkOrdersFromBackend.reduce(
                    (s, p) => s + (p.livePnL || 0),
                    0,
                  ),
                margin: sdkOrdersFromBackend.reduce(
                  (s, p) =>
                    s +
                    mt5Engine.calculateRequiredMargin({
                      symbol: p.symbol,
                      volume: p.volume,
                      price: p.openPrice,
                    }),
                  0,
                ),
                freeMargin:
                  balance +
                  sdkOrdersFromBackend.reduce(
                    (s, p) => s + (p.livePnL || 0),
                    0,
                  ) -
                  sdkOrdersFromBackend.reduce(
                    (s, p) =>
                      s +
                      mt5Engine.calculateRequiredMargin({
                        symbol: p.symbol,
                        volume: p.volume,
                        price: p.openPrice,
                      }),
                    0,
                  ),
              }}
              orders={sdkOrdersFromBackend}
              onClose={handleClosePosition}
              onModify={(trade) => {
                setModifyTPSLTrade(trade);
                setModifyTP(trade.takeProfit ? String(trade.takeProfit) : "");
                setModifySL(trade.stopLoss ? String(trade.stopLoss) : "");
              }}
            />

            {/* Market Execution Modal — at COLUMN level so z-[998] beats LeftSidebar z-50 */}
            <div
              className="absolute top-0 left-0 w-80 z-[99] pointer-events-none h-full"
              style={{
                transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isOrderModalOpen
                  ? "translateX(0)"
                  : "translateX(-110%)",
              }}
            >
              <div
                className="pointer-events-auto h-full"
                onClick={(e) => e.stopPropagation()}
              >
                <MarketExecutionModal
                  isOpen={isOrderModalOpen}
                  onClose={() => {
                    setIsOrderModalOpen(false);
                    setModalInitialVolume(null);
                  }}
                  orderType={orderType}
                  bidPrice={realTimeBidPrice ?? currentSymbolData.bid}
                  askPrice={realTimeAskPrice ?? currentSymbolData.ask}
                  onExecuteTrade={onExecuteTrade}
                  userAccountId={accountId}
                  initialVolume={modalInitialVolume}
                  disableOptimistic={true}
                  forceParentExecution={true}
                  tradingEngine={tradingEngine}
                />
              </div>
            </div>
          </div>
          {/* end flex-1 flex flex-col relative (column) */}
        </div>
        {/* end flex-1 flex overflow-hidden pl-12 (main content) */}
      </div>
      {/* end h-screen flex flex-col root */}

      {/* Modify TP/SL Dialog */}
      {modifyTPSLTrade && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60">
          <div
            className={`rounded-lg p-6 w-80 shadow-xl ${isLight ? "bg-white" : "bg-[#1a2332] border border-[#2a3a4a]"}`}
          >
            <h3
              className={`text-sm font-semibold mb-4 ${isLight ? "text-slate-800" : "text-slate-100"}`}
            >
              Modify {modifyTPSLTrade.symbol} {modifyTPSLTrade.type}
            </h3>
            <div className="space-y-3">
              <div>
                <label
                  className={`text-xs mb-1 block ${isLight ? "text-slate-500" : "text-slate-400"}`}
                >
                  Stop Loss
                </label>
                <input
                  type="number"
                  value={modifySL}
                  onChange={(e) => setModifySL(e.target.value)}
                  placeholder="0.00000"
                  className={`w-full px-3 py-2 rounded text-sm font-mono ${isLight ? "bg-slate-100 border border-slate-300 text-slate-800" : "bg-[#0f172a] border border-[#2a3a4a] text-slate-200"}`}
                />
              </div>
              <div>
                <label
                  className={`text-xs mb-1 block ${isLight ? "text-slate-500" : "text-slate-400"}`}
                >
                  Take Profit
                </label>
                <input
                  type="number"
                  value={modifyTP}
                  onChange={(e) => setModifyTP(e.target.value)}
                  placeholder="0.00000"
                  className={`w-full px-3 py-2 rounded text-sm font-mono ${isLight ? "bg-slate-100 border border-slate-300 text-slate-800" : "bg-[#0f172a] border border-[#2a3a4a] text-slate-200"}`}
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleModifyTPSLSubmit}
                disabled={modifyTPSLMutation.isPending}
                className="flex-1 py-2 rounded text-sm font-semibold bg-sky-600 hover:bg-sky-500 text-white disabled:opacity-50"
              >
                {modifyTPSLMutation.isPending ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => setModifyTPSLTrade(null)}
                className={`flex-1 py-2 rounded text-sm font-semibold ${isLight ? "bg-slate-200 hover:bg-slate-300 text-slate-700" : "bg-[#2a3a4a] hover:bg-[#3a4a5a] text-slate-200"}`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MT5TradingArea;
