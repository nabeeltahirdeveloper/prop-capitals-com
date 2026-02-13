import React, { useState, useRef, useCallback, useEffect } from 'react';
// import { useTrading } from '@/contexts/TradingContext';
import { usePrices } from '@/contexts/PriceContext';
import { alignToTimeframe } from '@/utils/timeEngine';
import { timeframeToSeconds } from '@/utils/candleEngine';
import { io } from 'socket.io-client';
// import TopBar from '../trading/Topbar';
// import LeftSidebar from '../trading/LeftSidebar';
// import MarketExecutionModal from './MarketExecutionModal';
import TradingPanel from '../trading/TradingPanel';
import { Card } from '../ui/card';
import { useTranslation } from "../../contexts/LanguageContext";
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../ui/use-toast';
import {
  Chart,
  CoinSelector,
  VolumeControl,
  StopLoss,
  TakeProfit,
  DrawingTools,
  TimeframeSelector,
  ChartTypeSelector,
  useTrading,
  TopBar,
  LeftSidebar,
  MarketExecutionModal,
  MarketWatch
} from '@nabeeltahirdeveloper/chart-sdk'
import MT5Login from './MT5Login';
import { usePlatformTokensStore } from '@/lib/stores/platform-tokens.store';
import { processPlatformLogin, resetPlatformPassword } from '@/api/auth';
import { QueryClient, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createTrade } from '@/api/trades';
import { getAccountSummary } from '@/api/accounts';
import { createPendingOrder } from '@/api/pending-orders';


const MT5TradingArea = ({
  selectedChallenge,
  positions: positionsFromParent = [],
  onExecuteTrade,
  showBuySellPanel: showBuySellPanelProp,
  setShowBuySellPanel: setShowBuySellPanelProp,
  accountBalance: accountBalanceFromParent,
  selectedAccountId: selectedAccountIdFromParent,
  account: accountFromParent,
  // selectedSymbol: selectedSymbolFromParent,
  // setSelectedSymbol: setSelectedSymbolFromParent,
}) => {
  // const {
    //   selectedSymbol: tradingSelectedSymbol,
    //   setSelectedSymbol: setTradingSelectedSymbol,
  //   selectedTimeframe,
  //   setSelectedTimeframe,
  //   chartType,
  //   setChartType,
  // } = useTrading();
  // const [selectedAccountId, setSelectedAccountId] = useState(accountId || "");
  const {
    selectedSymbol,
    setSelectedSymbol,
    selectedTimeframe,
    setSelectedTimeframe,
    symbols,
    setSymbols,
    symbolsLoading,
    accountSummary,
    orders,
    currentSymbolData,
    chartType,
    setChartType,
    theme
  } = useTrading()
  const { t } = useTranslation();
  const { toast } = useToast();



  const accountId = selectedChallenge?.id;
  const accountStatus = selectedChallenge?.status;
  const normalizedAccountStatus = String(accountStatus || '').toLowerCase();
  const isAccountLocked =
    normalizedAccountStatus === 'failed' ||
    normalizedAccountStatus === 'inactive' ||
    normalizedAccountStatus === 'daily_locked' ||
    normalizedAccountStatus === 'disqualified' ||
    normalizedAccountStatus === 'closed' ||
    normalizedAccountStatus === 'paused';
  const { data: accountSummaryData } = useQuery({
    queryKey: ['accountSummary', accountId],
    queryFn: () => getAccountSummary(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });
  const balance = Number.isFinite(accountSummaryData?.account?.balance)
    ? accountSummaryData.account.balance
    : (selectedChallenge?.currentBalance || 0);

  // WebSocket connection for real-time candle updates
  const candlesSocketRef = useRef(null);
  const queryClient = useQueryClient();

  // Platform authentication state
  // const accountId = selectedChallenge?.id;
  const getPlatformToken = usePlatformTokensStore((state) => state.getPlatfromToken);
  const setPlatformToken = usePlatformTokensStore((state) => state.setPlatfromToken);
  const platformToken = getPlatformToken(accountId);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [slPrice, setSlPrice] = useState()
  const [tpPrice, setTpPrice] = useState()
  // Handle MT5 platform login
  const handlePlatformLogin = async (email, password) => {
    if (!accountId) {
      toast({ title: 'No account selected', variant: 'destructive' });
      return;
    }
    setIsLoggingIn(true);
    try {
      const response = await processPlatformLogin(accountId, email, password);
      if (response?.platformToken) {
        setPlatformToken(accountId, response.platformToken);
        toast({ title: 'Successfully connected to MT5' });
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error.response?.data?.message || error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    if (!accountId) {
      toast({ title: 'No account selected', variant: 'destructive' });
      return;
    }
    setIsResettingPassword(true);
    try {
      await resetPlatformPassword(accountId);
      toast({ title: 'Password reset email sent' });
    } catch (error) {
      toast({
        title: 'Reset failed',
        description: error.response?.data?.message || error.message,
        variant: 'destructive'
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  // If no platform token, show login screen
  if (!platformToken) {
    return (
      <MT5Login
        onPlatformLogin={handlePlatformLogin}
        onPasswordReset={handlePasswordReset}
        isSubmitting={isLoggingIn}
        isResetting={isResettingPassword}
      />
    );
  }

  // Use trade flow from parent (CommonTerminalWrapper / same as pages/TradingTerminal) when provided
  const positions = positionsFromParent;
  // const handleExecuteTrade = onExecuteTrade || (() => {
  //   toast({ title: t("terminal.tradeFailed"), description: "Trade flow not connected.", variant: "destructive" });
  // });
  const [showBuySellPanelLocal, setShowBuySellPanelLocal] = useState(false);
  const showBuySellPanel = setShowBuySellPanelProp !== undefined ? showBuySellPanelProp : showBuySellPanelLocal;
  const setShowBuySellPanel = setShowBuySellPanelProp !== undefined ? setShowBuySellPanelProp : setShowBuySellPanelLocal;
  const accountBalance = accountBalanceFromParent ?? selectedChallenge?.currentBalance ?? 100000;

  const [selectedSymbolLocal, setSelectedSymbolLocal] = useState(null);
  const [modalInitialOrderType, setModalInitialOrderType] = useState(null); // 'buy' | 'sell' | null when opening from chart/topbar
  const showMarketWatch = true;
  const pricesRef = useRef({});
  
  // Chart Buy/Sell should open our modal (connected to handleExecuteTrade), not the chart's internal modal
  const handleChartBuyClick = useCallback(() => {
    setModalInitialOrderType('buy');
    setShowBuySellPanel(true);
  }, [setShowBuySellPanel]);
  const handleChartSellClick = useCallback(() => {
    setModalInitialOrderType('sell');
    setShowBuySellPanel(true);
  }, [setShowBuySellPanel]);

  const { prices: unifiedPrices, getPrice: getUnifiedPrice } = usePrices();

  // Bridge: MT5 live prices → SDK TradingContext symbols update
  // Jab MT5 PriceContext se live prices aayen, SDK ke symbols mein update karo
  // IMPORTANT: Dependency array sirf unifiedPrices + setSymbols par rakho
  // warna infinite re-render / "Maximum update depth exceeded" error aata hai.
  useEffect(() => {
    if (!unifiedPrices || Object.keys(unifiedPrices).length === 0) return;

    // Update SDK symbols with live prices from MT5 PriceContext
    setSymbols(prev =>
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
      })
    );
  }, [unifiedPrices, setSymbols]);

  // Real-time candle updates for SDK Chart
  // SDK Chart receives bidPrice/askPrice props, but candles need to be updated through SDK's context
  // Since SDK Chart is a black box, we ensure prices are updating frequently to trigger SDK's internal candle updates
  const [realTimeBidPrice, setRealTimeBidPrice] = useState(null);
  const [realTimeAskPrice, setRealTimeAskPrice] = useState(null);
  const lastCandleUpdateRef = useRef(0);

  useEffect(() => {
    if (!selectedSymbol || !selectedTimeframe) return;

    const POLL_INTERVAL_MS = 250; // Same as TradingChart.jsx for consistency
    const THROTTLE_MS = 120; // Throttle updates to avoid excessive re-renders

    const intervalId = setInterval(() => {
      const symbolStr = selectedSymbol.symbol || selectedSymbol;
      if (!symbolStr) return;

      // Get real-time prices from PriceContext
      const bid = getUnifiedPrice(symbolStr, "bid");
      const ask = getUnifiedPrice(symbolStr, "ask");

      const bidNum = typeof bid === "number" && !isNaN(bid) ? bid : parseFloat(bid);
      const askNum = typeof ask === "number" && !isNaN(ask) ? ask : parseFloat(ask);

      if (!Number.isFinite(bidNum) || !Number.isFinite(askNum)) return;

      // Throttle updates to avoid excessive re-renders
      const now = Date.now();
      if (now - lastCandleUpdateRef.current < THROTTLE_MS) return;
      lastCandleUpdateRef.current = now;

      // Update real-time prices - this will trigger SDK Chart to update candles internally
      // SDK Chart should handle candle updates when bidPrice/askPrice props change
      setRealTimeBidPrice(bidNum);
      setRealTimeAskPrice(askNum);

      // Also update SDK symbols with latest prices to ensure SDK context is in sync
      setSymbols(prev =>
        prev.map((s) => {
          if (s.symbol === symbolStr) {
            return {
              ...s,
              bid: bidNum,
              ask: askNum,
            };
          }
          return s;
        })
      );
    }, POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [selectedSymbol, selectedTimeframe, getUnifiedPrice, setSymbols]);

  // WebSocket listener for real-time candle updates from backend
  useEffect(() => {
    if (!selectedSymbol || !selectedTimeframe) return;

    const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:5002';
    const symbolStr = selectedSymbol.symbol || selectedSymbol;
    const timeframeStr = selectedTimeframe || 'M1';

    // Get auth token
    const getAuthToken = () => {
      return (
        localStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('jwt_token')
      );
    };

    // Connect to candles WebSocket (root namespace)
    const socket = io(WEBSOCKET_URL, {
      auth: (cb) => cb({ token: getAuthToken() }),
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
    });

    candlesSocketRef.current = socket;

    socket.on('connect', () => {
      console.log('[MT5TradingArea] ✅ Connected to candles WebSocket');
      // Subscribe to candle updates for current symbol/timeframe
      // Backend automatically sends updates based on client subscriptions
    });

    socket.on('disconnect', (reason) => {
      console.log('[MT5TradingArea] ❌ Candles WebSocket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('[MT5TradingArea] 🔌 Candles WebSocket connection error:', error.message);
    });

    // Listen for candleUpdate events from backend
    socket.on('candleUpdate', (data) => {
      try {
        // Backend sends: { symbol, timeframe, candle: { time, open, high, low, close, volume } }
        if (!data || !data.candle || !data.symbol || !data.timeframe) {
          console.warn('[MT5TradingArea] Invalid candleUpdate data:', data);
          return;
        }

        // Check if this update is for current symbol/timeframe
        const normalizedSymbol = (data.symbol || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const currentSymbolNormalized = (symbolStr || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

        if (normalizedSymbol !== currentSymbolNormalized || data.timeframe !== timeframeStr) {
          // Not for current symbol/timeframe, ignore
          return;
        }

        const candle = data.candle;

        // Convert time from milliseconds to seconds if needed (lightweight-charts uses seconds)
        let candleTime = candle.time;
        if (candleTime > 1e10) {
          // Time is in milliseconds, convert to seconds
          candleTime = Math.floor(candleTime / 1000);
        }

        // Update SDK Chart component with new candle
        // Since SDK Chart is a black box, we need to check if SDK provides a method to update candles
        // For now, we'll try to update through SDK's context if available
        // If SDK Chart component has a ref method to update candles, we can use that

        // Note: SDK Chart component should automatically update when candles are updated in SDK's context
        // If SDK doesn't support this, we may need to manually update the chart through ref methods

        console.log('[MT5TradingArea] 📊 Received candleUpdate:', {
          symbol: data.symbol,
          timeframe: data.timeframe,
          candle: {
            time: candleTime,
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
          },
        });

        // TODO: Update SDK Chart component with this candle
        // This depends on SDK's API - check SDK documentation for updateCandle or similar method
        // For now, we'll log it and let SDK Chart handle it if it listens to WebSocket internally

      } catch (error) {
        console.error('[MT5TradingArea] Error processing candleUpdate:', error);
      }
    });

    return () => {
      if (socket && socket.connected) {
        socket.disconnect();
      }
      candlesSocketRef.current = null;
    };
  }, [selectedSymbol, selectedTimeframe]);

  // Enrich selected symbol with real-time price data
  const enrichedSelectedSymbol = selectedSymbol && unifiedPrices[selectedSymbol.symbol]
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
    console.log('Zoom in');
  };

  const handleZoomOut = () => {
    console.log('Zoom out');
  };

  const handleDownloadChartPNG = () => {
    console.log('Download chart');
  };

  const handleToggleFullscreen = () => {
    console.log('Toggle fullscreen');
  };

  const isLight = theme === 'light'
  const [marketWatchWidth, setMarketWatchWidth] = useState(500) // Right symbols panel width (default: thoda sa left/chhota)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef(null)
  const resizeStartX = useRef(0)
  const resizeStartWidth = useRef(200)

  const [bottomPanelHeight, setBottomPanelHeight] = useState(180) // Bottom orders panel height (default: thoda sa neeche/chhota)
  const [isBottomResizing, setIsBottomResizing] = useState(false)
  const bottomResizeRef = useRef(null)
  const chartAreaRef = useRef(null)

  // Market Execution Modal state (Professional Trading Terminal - Side Panel)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)
  const [orderType, setOrderType] = useState('BUY')




  const handleBuyClick = (orderType) => {
    console.log('🟢 Buy clicked, opening panel...', orderType)
    setOrderType('BUY')
    setIsOrderModalOpen(true)
  }

  const handleSellClick = (orderType) => {
    console.log('🔴 Sell clicked, opening panel...', orderType)
    setOrderType('SELL')
    setIsOrderModalOpen(true)
  }

  // Handle right sidebar (Market Watch) horizontal resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return

      // Calculate delta from start position
      const deltaX = resizeStartX.current - e.clientX // Negative when dragging left (making panel smaller)
      const newWidth = resizeStartWidth.current + deltaX

      // Min width: 120px, Max width: 600px
      const clampedWidth = Math.min(Math.max(newWidth, 120), 600)
      setMarketWatchWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      resizeStartX.current = 0
      resizeStartWidth.current = marketWatchWidth
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, marketWatchWidth])






  // Handle bottom panel (Account & Orders) vertical resize
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isBottomResizing) return

      const container = bottomResizeRef.current?.parentElement
      if (!container) return

      const containerRect = container.getBoundingClientRect()
      const newHeight = containerRect.bottom - e.clientY

      // Min height: 120px, Max height: 400px
      const clampedHeight = Math.min(Math.max(newHeight, 120), 400)
      setBottomPanelHeight(clampedHeight)
    }

    const handleMouseUp = () => {
      setIsBottomResizing(false)
    }

    if (isBottomResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'row-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isBottomResizing])

  //data for Trade Hndler

 
  /* ── Queries ── */
  const { data: tradesData } = useQuery({
    queryKey: ['trades', accountId],
    queryFn: () => getAccountTrades(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });




 const createTradeMutation = useMutation({
   mutationFn: createTrade,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trades', accountId] }); queryClient.invalidateQueries({ queryKey: ['accountSummary', accountId] }); toast({ title: 'Order Placed' }); setQuantity(''); setLimitPrice(''); setTpPrice(''); setSlPrice(''); setSliderPct(0); },
    onError: (e) => { toast({ title: 'Order Failed', description: e?.response?.data?.message || e.message || 'Failed', variant: 'destructive' }); },
  });
  const createPendingOrderMutation = useMutation({
    mutationFn: createPendingOrder,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pendingOrders', accountId] }); queryClient.invalidateQueries({ queryKey: ['accountSummary', accountId] }); toast({ title: 'Pending Order Created' }); setQuantity(''); setLimitPrice(''); setTpPrice(''); setSlPrice(''); setSliderPct(0); },
    onError: (e) => { toast({ title: 'Order Failed', description: e?.response?.data?.message || e.message || 'Failed', variant: 'destructive' }); },
  });



  const handlePlaceOrder = async () => {
    console.log("handlePlaceOrder:")
    if (isAccountLocked) { toast({ title: 'Account Locked', variant: 'destructive' }); return; }
    console.log("handlePlaceOrder:1")
    if (!accountId || !selectedSymbol) { toast({ title: 'Select a symbol', variant: 'destructive' }); return; }
    console.log("handlePlaceOrder:2")
    // if (!quantity || parseFloat(quantity) <= 0) { toast({ title: 'Enter valid quantity', variant: 'destructive' }); return; }
    console.log("handlePlaceOrder:3")
    if ((orderType === 'limit' || orderType === 'tp/sl') && (!limitPrice || parseFloat(limitPrice) <= 0)) { toast({ title: 'Enter valid price', variant: 'destructive' }); return; }
    console.log("handlePlaceOrder:4")
    setIsPlacingOrder(true);
    console.log("handlePlaceOrder:5")
    try {
      console.log("handlePlaceOrder:6", orderType)
      if (orderType === 'BUY') {
        console.log("handlePlaceOrder:7")
        const openPrice = realTimeAskPrice;
        console.log("handlePlaceOrder:8")
        if (!openPrice) { toast({ title: 'No price available', variant: 'destructive' }); return; }
        console.log("handlePlaceOrder:9")
        await createTradeMutation.mutateAsync({ accountId, symbol: selectedSymbol, type: "BUY", volume: 0.02, openPrice, stopLoss: slPrice ? parseFloat(slPrice) : null, takeProfit: tpPrice ? parseFloat(tpPrice) : null });
        console.log("handlePlaceOrder:10")
      } else {
        console.log("handlePlaceOrder:11")
        await createPendingOrderMutation.mutateAsync({ tradingAccountId: accountId, symbol: selectedSymbol, type: "BUY", orderType: orderType === 'tp/sl' ? 'STOP' : 'LIMIT', volume: parseFloat(0.02), price: parseFloat(""), stopLoss: slPrice ? parseFloat(slPrice) : null, takeProfit: tpPrice ? parseFloat(tpPrice) : null });
        console.log("handlePlaceOrder:12")
      }
    } catch (e) {
      console.error('[BybitTerminal] Place order failed:', e);
    } finally { setIsPlacingOrder(false); }
  };




  return (
    <>

      <div className={`h-screen flex flex-col overflow-hidden relative ${isLight ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
        {/* Left Sidebar - Tools (overlaps header, full height, highest z-index) */}
        <div className='absolute left-0 top-0 bottom-0 z-50'>
          <LeftSidebar />
        </div>

        {/* Top Bar - Starts after sidebar */}
        <div className='pl-12'>
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
            onToggleMarketWatch={() => setShowMarketWatch(prev => !prev)}
            onToggleBuySell={handleToggleBuySell}
            buySellPanelOpen={showBuySellPanel}
          />
        </div>

        {/* Main Content Area – tools bar full-height, chart + market watch + bottom panel on right */}
        <div className='flex-1 flex overflow-hidden pl-12'>

          {/* Right side: chart + market watch + bottom account panel */}
          <div className='flex-1 flex flex-col overflow-hidden'>
            {/* Center row: chart + market watch */}
            <div className='flex-1 flex overflow-hidden'>
              {/* Center - Chart Area */}
              <Chart
                ref={chartAreaRef}
                bidPrice={realTimeBidPrice ?? currentSymbolData.bid}
                askPrice={realTimeAskPrice ?? currentSymbolData.ask}
                showBuySellPanel={showBuySellPanel}
                onBuyClick={handleBuyClick}
                onSellClick={handleSellClick}
              />

              {/* Resize Handle + Market Watch: only when open */}
              {showMarketWatch && (
                <>
                  <div
                    ref={resizeRef}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      resizeStartX.current = e.clientX
                      resizeStartWidth.current = marketWatchWidth
                      setIsResizing(true)
                    }}
                    className={`w-1 ${isLight ? 'bg-gray-300' : 'bg-[#101821]'} hover:bg-sky-700 cursor-col-resize transition-colors relative group`}
                  >
                    <div className='absolute inset-y-0 left-1/2  group-hover:bg-white' />
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
            </div>

            {/* Bottom Resize Handle */}
            <div
              ref={bottomResizeRef}
              onMouseDown={(e) => {
                e.preventDefault()
                setIsBottomResizing(true)
              }}
              className={`h-1  ${isLight ? 'bg-gray-300' : 'bg-[#101821]'} hover:bg-sky-700 cursor-row-resize transition-colors relative group`}
            >
              <div className='absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 group-hover:bg-sky-500/20' />
            </div>

              <button onClick={handlePlaceOrder}>
                call function
              </button>
            {/* Bottom Panel - Account & Orders */}
            {/* <AccountPanel
              accountSummary={accountSummary}
              orders={orders}
              height={bottomPanelHeight}
            /> */}
          </div>
        </div>

        {/* Market Execution Side Panel - Slides from behind left sidebar, overlaps chart */}
        {isOrderModalOpen && (
          <>
            {/* Overlay backdrop when panel is open - behind panel but over chart */}
            <div
              className='fixed inset-0  z-30'
              onClick={() => setIsOrderModalOpen(false)}
            />

            {/* Panel - Fully interactive, not blocked by backdrop */}
            <div
              className='fixed left-65 top-10 w-96 max-w-sm z-40 transition-transform duration-300 ease-in-out pointer-events-auto'
              onClick={(e) => e.stopPropagation()}
            >
              <MarketExecutionModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                orderType={orderType}
                bidPrice={realTimeBidPrice ?? currentSymbolData.bid}
                askPrice={realTimeAskPrice ?? currentSymbolData.ask}
                onExecuteTrade={handlePlaceOrder}
                userAccountId={accountId}
              />

            </div>
          </>
        )}
      </div>
    </>
  );
};

export default MT5TradingArea;
