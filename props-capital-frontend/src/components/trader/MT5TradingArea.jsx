import React, { useState, useRef, useCallback } from 'react';
import { useTraderTheme } from './TraderPanelLayout';
import { useTrading } from '@/contexts/TradingContext';
import { usePrices } from '@/contexts/PriceContext';
import TradingChart from '../trading/TradingChart';
import MarketWatchlist from '../trading/MarketWatchlist';
import TopBar from '../trading/Topbar';
import LeftSidebar from '../trading/LeftSidebar';
import MarketExecutionModal from './MarketExecutionModal';

const MT5TradingArea = ({ selectedChallenge }) => {
  const { isDark } = useTraderTheme();
  const {
    selectedSymbol: tradingSelectedSymbol,
    setSelectedSymbol: setTradingSelectedSymbol,
    selectedTimeframe,
    setSelectedTimeframe,
    chartType,
    setChartType,
  } = useTrading();

  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [showMarketWatch, setShowMarketWatch] = useState(true);
  const [showBuySellPanel, setShowBuySellPanel] = useState(false);
  const chartAreaRef = useRef(null);
  const pricesRef = useRef({});

  const { prices: unifiedPrices } = usePrices();

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

  const handleNewOrder = () => {
    setShowBuySellPanel(true);
  };

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

  const handleToggleBuySell = () => {
    setShowBuySellPanel(prev => !prev);
  };

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;

  const positions = []; // Would come from API

  return (
    <>
      {/* Demo WebTrader - Trading Terminal */}
      <div className={cardClass + ' overflow-hidden max-h-[85vh] flex flex-col'}>
        <div className={`p-4 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
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

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full">
          {/* Left sidebar */}
          <div className="hidden lg:flex lg:w-12 lg:shrink-0 flex-col min-h-0 overflow-hidden">
            <LeftSidebar />
          </div>

          {/* Chart Area */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 order-first lg:order-none">
            <div className="flex-1 min-h-[200px] flex flex-col">
              <TradingChart
                key={`chart-mobile-${selectedSymbol?.symbol}`}
                symbol={enrichedSelectedSymbol}
                openPositions={positions}
                onPriceUpdate={handlePriceUpdate}
              />
            </div>
          </div>

          {/* Market Watch / Symbols */}
          <div className={`flex w-full lg:w-72 shrink-0 p-3 border-l flex-col min-h-[160px] min-w-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
            <MarketWatchlist
              onSymbolSelect={(symbol) => {
                setSelectedSymbol(symbol);
                setTradingSelectedSymbol(symbol?.symbol ?? symbol);
              }}
              selectedSymbol={selectedSymbol}
            />
          </div>
        </div>
      </div>

      {/* Market Execution Modal */}
      <MarketExecutionModal
        isOpen={showBuySellPanel}
        onClose={() => setShowBuySellPanel(false)}
        selectedSymbol={enrichedSelectedSymbol}
        accountBalance={selectedChallenge?.currentBalance || 0}
      />
    </>
  );
};

export default MT5TradingArea;
