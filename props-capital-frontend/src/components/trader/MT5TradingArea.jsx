import React, { useState, useRef, useCallback, useEffect } from 'react';
// import { useTrading } from '@/contexts/TradingContext';
import { usePrices } from '@/contexts/PriceContext';
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


  return (
    <>
      {/* Demo WebTrader - Trading Terminal (single SDK context from TradingTerminal’s TradingProvider) */}
      {/* <div className={cardClass + ' overflow-hidden max-h-[85vh] flex flex-col'}>
        <div className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              flexWrap: 'wrap',
            }}>
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
              /> */}
      {/* <CoinSelector />
              <TimeframeSelector />
              <ChartTypeSelector /> */}
      {/* </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full">
          <div className="hidden lg:flex lg:w-12 lg:shrink-0 flex-col min-h-0 overflow-hidden">
          </div>

          <div className="flex-1 min-w-0 flex flex-col min-h-0 order-first lg:order-none">
            <div className="flex-1 min-h-[200px] flex flex-col relative min-w-0">
              <div */}
      {/* style={{ width: '60vw', height: '100vh', display: 'flex', flexDirection: 'column' }} */}
      {/* > */}
      {/* <Chart
                  selectedSymbol={selectedSymbol}
                  onBuyClick={handleBuyClick}
                  onSellClick={handleSellClick}
                  /> */}
      {/* <Chart
                  ref={chartAreaRef}
                  bidPrice={currentSymbolData.bid}
                  askPrice={currentSymbolData.ask}
                  showBuySellPanel={showBuySellPanel}
                  onBuyClick={handleBuyClick}
                  onSellClick={handleSellClick}
                />
                <LeftSidebar /> */}

      {/* </div> */}
      {/* <MarketExecutionModal
                isOpen={showBuySellPanel}
                onClose={() => setShowBuySellPanel(false)}
                selectedSymbol={enrichedSelectedSymbol}
                accountBalance={accountBalance}
                onExecuteTrade={handleExecuteTrade}
                chartPrice={enrichedSelectedSymbol?.bid || null}
                orderType={modalInitialOrderType}
              /> */}
      {/* <MarketExecutionModal
                isOpen={isOrderModalOpen}
                onClose={() => setIsOrderModalOpen(false)}
                orderType={orderType}
                bidPrice={currentSymbolData.bid}
                askPrice={currentSymbolData.ask}
              /> */}
      {/* </div>

          </div>
          <div className={`flex w-full lg:w-72 shrink-0 p-3 border-l flex-col min-h-[160px] min-w-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <MarketWatchlist
              onSymbolSelect={(item) => setSelectedSymbol(item)}
              selectedSymbol={selectedSymbol} />
          </div>
        </div>
      </div> */}

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
                bidPrice={currentSymbolData.bid}
                askPrice={currentSymbolData.ask}
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
                bidPrice={currentSymbolData.bid}
                askPrice={currentSymbolData.ask}
              />
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default MT5TradingArea;
