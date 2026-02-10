import React, { useState, useRef, useCallback } from 'react';
import { useTraderTheme } from './TraderPanelLayout';
// import { useTrading } from '@/contexts/TradingContext';
import { usePrices } from '@/contexts/PriceContext';
import TradingChart from '../trading/TradingChart';
import MarketWatchlist from '../trading/MarketWatchlist';
import TopBar from '../trading/Topbar';
import LeftSidebar from '../trading/LeftSidebar';
import MarketExecutionModal from './MarketExecutionModal';
import TradingPanel from '../trading/TradingPanel';
import { Card } from '../ui/card';
import { useTranslation } from "../../contexts/LanguageContext";
import { useSearchParams } from 'react-router-dom';
import { useToast } from '../ui/use-toast';
import {
  TradingProvider,
  Chart,
  CoinSelector,
  VolumeControl,
  StopLoss,
  TakeProfit,
  DrawingTools,
  TimeframeSelector,
  ChartTypeSelector,
  useTrading
} from '@nabeeltahirdeveloper/chart-sdk'


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
  const { isDark } = useTraderTheme();
  // const {
  //   selectedSymbol: tradingSelectedSymbol,
  //   setSelectedSymbol: setTradingSelectedSymbol,
  //   selectedTimeframe,
  //   setSelectedTimeframe,
  //   chartType,
  //   setChartType,
  // } = useTrading();
  const {
    selectedSymbol,
    setSelectedSymbol,
  } = useTrading()
  const { t } = useTranslation();
  const { toast } = useToast();

  // Use trade flow from parent (CommonTerminalWrapper / same as pages/TradingTerminal) when provided
  const positions = positionsFromParent;
  const handleExecuteTrade = onExecuteTrade || (() => {
    toast({ title: t("terminal.tradeFailed"), description: "Trade flow not connected.", variant: "destructive" });
  });
  const [showBuySellPanelLocal, setShowBuySellPanelLocal] = useState(false);
  const showBuySellPanel = setShowBuySellPanelProp !== undefined ? showBuySellPanelProp : showBuySellPanelLocal;
  const setShowBuySellPanel = setShowBuySellPanelProp !== undefined ? setShowBuySellPanelProp : setShowBuySellPanelLocal;
  const accountBalance = accountBalanceFromParent ?? selectedChallenge?.currentBalance ?? 100000;

  const [selectedSymbolLocal, setSelectedSymbolLocal] = useState(null);
  const [modalInitialOrderType, setModalInitialOrderType] = useState(null); // 'buy' | 'sell' | null when opening from chart/topbar
  const showMarketWatch = true;
  const chartAreaRef = useRef(null);
  const pricesRef = useRef({});
  // When parent provides symbol state, use it (flow from TradingTerminal); otherwise use local state
  // const selectedSymbol = setSelectedSymbolFromParent ? (selectedSymbolFromParent ?? selectedSymbolLocal) : selectedSymbolLocal;
  // const setSelectedSymbol = (sym) => {
  //   if (setSelectedSymbolFromParent) setSelectedSymbolFromParent(sym);
  //   setSelectedSymbolLocal(sym);
  //   setTradingSelectedSymbol(sym?.symbol ?? sym);
  // };

  // Chart Buy/Sell should open our modal (connected to handleExecuteTrade), not the chart's internal modal
  const handleChartBuyClick = useCallback(() => {
    setModalInitialOrderType('buy');
    setShowBuySellPanel(true);
  }, [setShowBuySellPanel]);
  const handleChartSellClick = useCallback(() => {
    setModalInitialOrderType('sell');
    setShowBuySellPanel(true);
  }, [setShowBuySellPanel]);

  const { prices: unifiedPrices } = usePrices();

  // // Enrich selected symbol with real-time price data
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

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;

  // const positions = []; // Would come from API

  // // Direct function - async to save to backend
  // async function handleExecuteTrade(trade) {
  //   console.log("=== TRADE EXECUTION ===");
  //   console.log("Trade data:", trade);
  //   console.log("Account status:", account.status);

  //   // Edge case: Prevent multiple simultaneous trade executions
  //   if (isExecutingTrade) {
  //     toast({
  //       title: t("terminal.tradeBlocked"),
  //       description: t("terminal.tradeInProgress"),
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   // ======== VALIDATION SECTION (all validations before setting flag) ========

  //   // Edge case: Account status validation - check account.status for locked/disqualified
  //   const statusUpper = String(account.status || "").toUpperCase();
  //   if (statusUpper.includes("DAILY")) {
  //     toast({
  //       title: t("terminal.tradeBlocked"),
  //       description: t("terminal.dailyLossLimitReached"),
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   if (statusUpper.includes("FAIL") || statusUpper.includes("DISQUAL")) {
  //     toast({
  //       title: t("terminal.tradeBlocked"),
  //       description: t("terminal.challengeDisqualified"),
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   if (account.status === "PAUSED" || account.status === "CLOSED") {
  //     toast({
  //       title: t("terminal.tradeBlocked"),
  //       description: t("terminal.accountStatusBlocked", {
  //         status: account.status,
  //       }),
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   // Validate trade object - be lenient with entryPrice
  //   if (!trade || !trade.symbol || !trade.type || !trade.lotSize) {
  //     console.error("Invalid trade - missing required fields:", trade);
  //     toast({
  //       title: t("terminal.invalidTrade"),
  //       description: t("terminal.missingFields"),
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   // Validate lot size
  //   if (trade.lotSize <= 0 || isNaN(trade.lotSize)) {
  //     toast({
  //       title: t("terminal.invalidTrade"),
  //       description: t("terminal.invalidLotSize"),
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   // Validate account is selected
  //   if (!selectedAccountId) {
  //     console.error("No account selected");
  //     toast({
  //       title: t("terminal.noAccount"),
  //       description: t("terminal.selectAccountMessage"),
  //       variant: "destructive",
  //     });
  //     return;
  //   }

  //   // ======== All validations passed - set execution flag ========
  //   // Set flag immediately AFTER validations to prevent race conditions from rapid clicks
  //   setIsExecutingTrade(true);

  //   // Edge case: Prevent duplicate trades (same symbol, type, price within 1 second)
  //   // Check both real positions and temporary optimistic positions
  //   const recentTrade = positions.find(
  //     (p) =>
  //       p.symbol === trade.symbol &&
  //       p.type === trade.type &&
  //       Math.abs(new Date(p.openTime).getTime() - Date.now()) < 1000,
  //   );
  //   if (recentTrade && trade.orderType !== "limit") {
  //     // If it's a temporary position, it means a trade is already in progress
  //     if (recentTrade.id && recentTrade.id.startsWith("temp_")) {
  //       toast({
  //         title: t("terminal.tradeBlocked"),
  //         description: t("terminal.tradeInProgress"),
  //         variant: "destructive",
  //       });
  //     } else {
  //       toast({
  //         title: t("terminal.duplicateTrade"),
  //         description: t("terminal.duplicateTradeMessage"),
  //         variant: "destructive",
  //       });
  //     }
  //     setIsExecutingTrade(false);
  //     return;
  //   }

  //   // Ensure we have an entry price
  //   // BUY: entryPrice should be ASK (you pay ask to buy)
  //   // SELL: entryPrice should be BID (you receive bid when selling)
  //   const entryPrice =
  //     trade.entryPrice ||
  //     (trade.type === "buy" ? selectedSymbol?.ask : selectedSymbol?.bid) ||
  //     (trade.type === "buy"
  //       ? unifiedPrices[trade.symbol]?.ask
  //       : unifiedPrices[trade.symbol]?.bid) ||
  //     (trade.type === "buy" ? 1.08557 : 1.08542); // Default: ask for BUY, bid for SELL
  //   console.log("Entry price:", entryPrice, "Type:", trade.type);

  //   // If it's a limit order with a limit price, add to pending orders
  //   if (trade.orderType === "limit" && trade.limitPrice) {
  //     console.log("Creating PENDING order...");

  //     // Initialize prevPricesRef for this symbol if it doesn't exist
  //     if (!prevPricesRef.current) {
  //       prevPricesRef.current = {};
  //     }
  //     // Set initial previous price to current price (or entry price if available)
  //     if (!prevPricesRef.current[trade.symbol]) {
  //       const priceData = unifiedPrices[trade.symbol];
  //       const currentBid =
  //         priceData && typeof priceData === "object"
  //           ? priceData.bid
  //           : priceData;
  //       prevPricesRef.current[trade.symbol] =
  //         entryPrice || selectedSymbol?.bid || currentBid || 1.08542;
  //     }

  //     // Handle demo account pending order
  //     if (selectedAccount?.isDemo) {
  //       const demoOrder = {
  //         id: `demo_order_${Date.now()}`,
  //         symbol: trade.symbol,
  //         type: trade.type.toLowerCase(),
  //         lotSize: trade.lotSize,
  //         limitPrice: trade.limitPrice,
  //         stopLoss: trade.stopLoss ?? null,
  //         takeProfit: trade.takeProfit ?? null,
  //         createdTime: new Date().toISOString(),
  //         status: "pending",
  //         isDemo: true,
  //       };

  //       setDemoPendingOrders((prev) => {
  //         const newOrders = [...prev, demoOrder];
  //         // Also save positions to demo storage
  //         saveDemoAccountTrades(
  //           positions,
  //           demoClosedTrades,
  //           newOrders,
  //           account.balance,
  //           account.equity,
  //         );
  //         return newOrders;
  //       });

  //       toast({
  //         title: t("terminal.orderPlaced"),
  //         description: t("terminal.pendingOrderDescription", {
  //           type: trade.type.toUpperCase(),
  //           symbol: trade.symbol,
  //         }),
  //       });
  //       setIsExecutingTrade(false);
  //       return;
  //     }

  //     // Save to backend first (for real accounts)
  //     try {
  //       const orderData = {
  //         tradingAccountId: selectedAccountId,
  //         symbol: trade.symbol,
  //         type: trade.type.toUpperCase(), // Backend expects BUY/SELL
  //         orderType: "LIMIT", // LIMIT, STOP, or STOP_LIMIT
  //         volume: trade.lotSize,
  //         price: trade.limitPrice,
  //         stopLoss: trade.stopLoss ?? null,
  //         takeProfit: trade.takeProfit ?? null,
  //       };

  //       const response = await createPendingOrder(orderData);
  //       console.log("✅ Pending order saved to backend:", response);

  //       if (response?.id) {
  //         // Map backend response to frontend format
  //         const pendingOrder = {
  //           id: response.id, // Use backend ID
  //           symbol: response.symbol,
  //           type: response.type.toLowerCase(),
  //           lotSize: response.volume,
  //           limitPrice: response.price,
  //           stopLoss: response.stopLoss ?? null,
  //           takeProfit: response.takeProfit ?? null,
  //           createdTime: new Date(response.createdAt).toISOString(),
  //           status: response.status.toLowerCase(),
  //         };

  //         // Add to local state
  //         setPendingOrders((prevOrders) => {
  //           console.log("Previous pending orders:", prevOrders.length);
  //           return [...prevOrders, pendingOrder];
  //         });

  //         // Invalidate query to refresh from backend
  //         queryClient.invalidateQueries({
  //           queryKey: ["pending-orders", selectedAccountId],
  //         });

  //         toast({
  //           title: t("terminal.orderPlaced"),
  //           description: t("terminal.pendingOrderDescription", {
  //             type: trade.type.toUpperCase(),
  //             symbol: trade.symbol,
  //           }),
  //         });
  //       } else {
  //         throw new Error("Backend did not return order ID");
  //       }
  //     } catch (error) {
  //       console.error("Failed to save pending order to backend:", error);
  //       toast({
  //         title: t("terminal.orderFailed"),
  //         description: error.message || "Failed to create pending order",
  //         variant: "destructive",
  //       });
  //     } finally {
  //       setIsExecutingTrade(false);
  //     }
  //     return;
  //   }

  //   // Market order - execute immediately with optimistic update
  //   console.log("🔄 Creating MARKET position with optimistic update...");

  //   // Edge case: Verify account hasn't changed during execution
  //   if (!selectedAccountId || selectedAccountId !== selectedAccount?.id) {
  //     toast({
  //       title: t("terminal.tradeFailed"),
  //       description: "Account changed during trade execution",
  //       variant: "destructive",
  //     });
  //     setIsExecutingTrade(false);
  //     return;
  //   }

  //   // Create temporary ID for optimistic update
  //   const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

  //   // OPTIMISTIC UPDATE: Add position immediately for instant UI feedback
  //   const optimisticPosition = {
  //     id: tempId, // Temporary ID - will be replaced with backend ID
  //     symbol: trade.symbol,
  //     type: trade.type,
  //     lotSize: trade.lotSize,
  //     entryPrice: entryPrice,
  //     stopLoss: trade.stopLoss,
  //     takeProfit: trade.takeProfit,
  //     openTime: new Date().toISOString(),
  //   };

  //   // Add position immediately (optimistic update)
  //   setPositions((prevPositions) => {
  //     console.log("⚡ Adding position optimistically with temp ID:", tempId);
  //     const newPositions = [...prevPositions, optimisticPosition];

  //     // If demo, also persist immediately
  //     if (selectedAccount?.isDemo) {
  //       saveDemoAccountTrades(
  //         newPositions,
  //         demoClosedTrades,
  //         demoPendingOrders,
  //         account.balance,
  //         account.equity,
  //       );
  //     }

  //     return newPositions;
  //   });

  //   // Update current prices - set both bid and ask
  //   // ...

  //   // Immediately fetch real-time price from API to replace the calculated one
  //   // ...

  //   // For demo account, we are done after the optimistic update
  //   if (selectedAccount?.isDemo) {
  //     toast({
  //       title: t("terminal.tradeExecuted"),
  //       description: `${trade.type.toUpperCase()} ${trade.lotSize} ${trade.symbol} @ ${entryPrice}`,
  //     });
  //     setIsExecutingTrade(false);
  //     return;
  //   }

  //   // Save to backend in the background (for real accounts)
  //   // Note: isExecutingTrade flag already set at line 3476
  //   try {
  //     console.log("💾 Saving trade to backend...");

  //     // IMPORTANT: volume represents LOTS for forex, UNITS for crypto
  //     // For forex: lotSize = 10 means 10 lots = 1,000,000 units
  //     // For crypto: lotSize = 0.5 means 0.5 BTC units
  //     const tradeData = {
  //       accountId: selectedAccountId,
  //       symbol: trade.symbol,
  //       type: trade.type.toUpperCase(), // Backend expects BUY/SELL
  //       volume: trade.lotSize, // lotSize for forex = lots, for crypto = units
  //       openPrice: entryPrice,
  //       closePrice: null, // Open trade, no close price yet
  //       profit: 0, // No profit until closed
  //       stopLoss: trade.stopLoss ?? null, // Optional: only include if provided
  //       takeProfit: trade.takeProfit ?? null, // Optional: only include if provided
  //     };

  //     // Debug logging (dev only)
  //     if (process.env.NODE_ENV !== "production") {
  //       const isCrypto = isCryptoSymbol(trade.symbol);
  //       console.log(
  //         `[Trade Creation Debug] ${trade.symbol} ${trade.type}: lotSize=${trade.lotSize} ${isCrypto ? "units" : "lots"}, entryPrice=${entryPrice}, volume sent to backend=${tradeData.volume}`,
  //       );
  //     }

  //     // Wait for backend response
  //     const response = await createTrade(tradeData);
  //     queryClient.invalidateQueries(["trading-account", selectedAccountId]);

  //     // Update trading days count after successful trade
  //     try {
  //       // Wait briefly for backend to persist the trade
  //       await new Promise((resolve) => setTimeout(resolve, 500));

  //       // Sync full account data from backend (updates account.tradingDays via metrics.tradingDaysCompleted)
  //       await syncAccountFromBackend(selectedAccountId, true, false); // Force refresh

  //       // Also fetch summary to update standalone tradingDaysCount state
  //       const summary = await getAccountSummary(selectedAccountId);

  //       if (summary?.metrics?.tradingDaysCompleted !== undefined) {
  //         setTradingDaysCount(summary.metrics.tradingDaysCompleted);
  //         // Also update the account state directly to ensure ChallengeRulesPanel gets the update
  //         setAccount((prev) => ({
  //           ...prev,
  //           tradingDays: summary.metrics.tradingDaysCompleted,
  //         }));
  //       }
  //       if (summary?.metrics?.daysRemaining !== undefined) {
  //         setDaysRemaining(summary.metrics.daysRemaining);
  //       }
  //     } catch (err) {
  //       console.error("Failed to update trading days:", err);
  //     }

  //     console.log("✅ Trade saved to backend:", response);

  //     // Verify we got a trade ID from backend
  //     if (!response?.trade?.id) {
  //       throw new Error("Backend did not return trade ID");
  //     }

  //     // Replace temporary position with real backend position
  //     // Use backend response values for SL/TP to ensure consistency
  //     const realPosition = {
  //       id: response.trade.id, // Use backend ID
  //       symbol: trade.symbol,
  //       type: trade.type,
  //       lotSize: trade.lotSize,
  //       entryPrice: entryPrice,
  //       stopLoss: response.trade.stopLoss ?? trade.stopLoss ?? null,
  //       takeProfit: response.trade.takeProfit ?? trade.takeProfit ?? null,
  //       openTime: response.trade.openedAt || new Date().toISOString(),
  //     };

  //     // Replace temp position with real one
  //     setPositions((prevPositions) => {
  //       // Remove temp position and add real one
  //       const filtered = prevPositions.filter((p) => p.id !== tempId);
  //       const exists = filtered.some((p) => p.id === response.trade.id);
  //       if (exists) {
  //         console.warn(
  //           "⚠️ Position already exists with ID:",
  //           response.trade.id,
  //         );
  //         return filtered;
  //       }
  //       console.log(
  //         "✅ Replacing temp position with backend ID:",
  //         response.trade.id,
  //       );
  //       return [...filtered, realPosition];
  //     });

  //     // Invalidate queries to refresh data
  //     queryClient.invalidateQueries({
  //       queryKey: ["trades", selectedAccountId],
  //     });
  //     const userId = lastValidUserIdRef.current || user?.userId;
  //     if (userId) {
  //       queryClient.invalidateQueries({
  //         queryKey: ["trading-accounts", userId],
  //       });
  //     }

  //     // Step 3: Sync account data from backend (single source of truth)
  //     await syncAccountFromBackend(selectedAccountId, false, false);

  //     toast({
  //       title: t("terminal.tradeExecuted"),
  //       description: `${trade.type.toUpperCase()} ${trade.lotSize} ${trade.symbol} @ ${entryPrice}`,
  //     });

  //     console.log("=== TRADE EXECUTION COMPLETE ===");
  //   } catch (error) {
  //     console.error("❌ Failed to save trade to backend:", error);

  //     // ROLLBACK: Remove optimistic position on error
  //     setPositions((prevPositions) => {
  //       console.log("🔄 Rolling back optimistic position:", tempId);
  //       return prevPositions.filter((p) => p.id !== tempId);
  //     });

  //     // Enhanced error handling with specific messages
  //     let errorMessage = t("terminal.saveError");

  //     if (error.response) {
  //       // Backend returned an error response
  //       const status = error.response.status;
  //       const data = error.response.data;

  //       if (status === 404) {
  //         errorMessage = t("terminal.accountNotFound");
  //       } else if (status === 400) {
  //         // Check for specific locked/disqualified messages
  //         const message = data?.message || "";
  //         if (
  //           message.includes("Daily loss limit") ||
  //           message.includes("locked until tomorrow")
  //         ) {
  //           errorMessage = t("terminal.dailyLossLimitReached");
  //         } else if (
  //           message.includes("disqualified") ||
  //           message.includes("no longer allowed")
  //         ) {
  //           errorMessage = t("terminal.challengeDisqualified");
  //         } else {
  //           errorMessage = message || t("terminal.invalidTradeData");
  //         }
  //         // Sync account status if locked/disqualified
  //         if (
  //           message.includes("Daily loss limit") ||
  //           message.includes("disqualified")
  //         ) {
  //           syncAccountFromBackend(selectedAccountId, true, false).catch(
  //             console.error,
  //           );
  //         }
  //       } else if (status === 403) {
  //         errorMessage = t("terminal.tradeNotAllowed");
  //       } else if (status === 500) {
  //         errorMessage = t("terminal.serverError");
  //       } else {
  //         errorMessage = data?.message || error.message || errorMessage;
  //       }
  //     } else if (error.request) {
  //       // Request was made but no response received (network error)
  //       if (!navigator.onLine) {
  //         errorMessage = t("terminal.networkOffline");
  //       } else {
  //         errorMessage = t("terminal.networkError");
  //       }
  //     } else {
  //       // Something else happened
  //       errorMessage = error.message || errorMessage;
  //     }

  //     toast({
  //       title: t("terminal.tradeFailed"),
  //       description: errorMessage,
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsExecutingTrade(false);
  //   }
  // }


  return (
    <>
      {/* Demo WebTrader - Trading Terminal */}
      <div className={cardClass + ' overflow-hidden max-h-[85vh] flex flex-col'}>
        <div className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          {/* <TopBar
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
          /> */}

          <TradingProvider baseUrl="https://api-chart-sdk.e-volvo.io">
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                flexWrap: 'wrap',
              }}>
                <CoinSelector />
                <TimeframeSelector />
                <ChartTypeSelector />


              </div>
            </div>
          </TradingProvider>

        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full">
          {/* Left sidebar */}
          <div className="hidden lg:flex lg:w-12 lg:shrink-0 flex-col min-h-0 overflow-hidden">
            <TradingProvider>
              <DrawingTools
                // style={{display:"flex" , flexDirection:"column"}}
                className="flex flex-col"
              />
            </TradingProvider>
          </div>

          {/* Chart Area - wrapper with relative so modal matches chart height */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 order-first lg:order-none">
            <div className="flex-1 min-h-[200px] flex flex-col relative min-w-0">
              {/* <TradingChart
                key={`chart-mobile-${selectedSymbol?.symbol}`}
                symbol={enrichedSelectedSymbol}
                openPositions={positions}
                onPriceUpdate={handlePriceUpdate}
                onBuyClick={handleChartBuyClick}
                onSellClick={handleChartSellClick}
              />*/}
              <TradingProvider baseUrl="https://api-chart-sdk.e-volvo.io">
                <div
                  style={{ width: '60vw', height: '100vh', display: 'flex', flexDirection: 'column' }}
                >
                  <Chart
                    selectedSymbol={setSelectedSymbol}
                  />
                </div>
              </TradingProvider>
              <MarketExecutionModal
                isOpen={showBuySellPanel}
                onClose={() => setShowBuySellPanel(false)}
                selectedSymbol={enrichedSelectedSymbol}
                accountBalance={accountBalance}
                onExecuteTrade={handleExecuteTrade}
                chartPrice={enrichedSelectedSymbol?.bid || null}
                orderType={modalInitialOrderType}
              />
            </div>
          </div>
          {/* Market Watch / Symbols */}
          <div className={`flex w-full lg:w-72 shrink-0 p-3 border-l flex-col min-h-[160px] min-w-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            {/* <MarketWatchlist
              onSymbolSelect={(symbol) => {
                setSelectedSymbol(symbol);
                setTradingSelectedSymbol(symbol?.symbol ?? symbol);
              }}
              selectedSymbol={selectedSymbol}
            /> */}

          </div>
        </div>
      </div>
    </>
  );
};

export default MT5TradingArea;
