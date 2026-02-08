import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Shield,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Activity,
  Wifi,
  WifiOff,
  Layers,
  Search,
  ChevronDown,
  ArrowUpDown,
  Star,
  BarChart2
} from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useTrading } from '@/contexts/TradingContext';
import TradingChart from '../trading/TradingChart';
import { usePrices } from '@/contexts/PriceContext';
import MarketWatchlist from '../trading/MarketWatchlist';
import TopBar from '../trading/Topbar';
import LeftSidebar from '../trading/LeftSidebar';

const cryptoSymbols = [
  { symbol: 'BTC/USDT', price: 43567.89, change: +1.23, volume: '2.1B' },
  { symbol: 'ETH/USDT', price: 2456.78, change: -0.45, volume: '890M' },
  { symbol: 'SOL/USDT', price: 98.45, change: +3.21, volume: '456M' },
  { symbol: 'XRP/USDT', price: 0.6234, change: +0.89, volume: '312M' },
  { symbol: 'DOGE/USDT', price: 0.0823, change: -1.56, volume: '234M' },
  { symbol: 'ADA/USDT', price: 0.4567, change: +2.15, volume: '178M' },
  { symbol: 'AVAX/USDT', price: 35.67, change: +1.89, volume: '145M' },
  { symbol: 'MATIC/USDT', price: 0.8912, change: -0.67, volume: '123M' },
];

const BybitTerminal = () => {
  const { isDark } = useTraderTheme();
  const { challenges, selectedChallenge, selectChallenge, getChallengePhaseLabel, getRuleCompliance, getChallengeStatusColor } = useChallenges();
  const [selectedTab, setSelectedTab] = useState('positions');
  const [orderType, setOrderType] = useState('limit');
  const [orderSide, setOrderSide] = useState('buy');
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMarketWatch, setShowMarketWatch] = useState(true);
  const [limitPrice, setLimitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [selectedCryptoSymbol, setSelectedCryptoSymbol] = useState(cryptoSymbols[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOrderbook, setShowOrderbook] = useState(true);

  const {
    selectedSymbol,
    setSelectedSymbol,
    selectedTimeframe,
    setSelectedTimeframe,
    symbols,
    symbolsLoading,
    currentSymbolData,
    chartType,
    setChartType,
  } = useTrading();

  const chartAreaRef = useRef(null);
  const pricesRef = useRef({});

  const { setSelectedSymbol: setTradingSelectedSymbol } = useTrading();

  const {
    prices: unifiedPrices,
    getPrice: getUnifiedPrice,
    lastUpdate: pricesLastUpdate,
  } = usePrices();

  const enrichedSelectedSymbol = useMemo(() => {
    if (!selectedSymbol?.symbol) return selectedSymbol;
    const priceData = unifiedPrices[selectedSymbol.symbol];
    if (priceData && typeof priceData === 'object' && priceData.bid !== undefined && priceData.ask !== undefined) {
      const spread = ((priceData.ask - priceData.bid) * 10000).toFixed(1);
      return { ...selectedSymbol, bid: priceData.bid, ask: priceData.ask, spread: parseFloat(spread) };
    }
    return selectedSymbol;
  }, [selectedSymbol, unifiedPrices]);

  const handlePriceUpdate = useCallback((symbolName, price) => {
    pricesRef.current[symbolName] = price;
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.95) {
        setIsReconnecting(true);
        setTimeout(() => setIsReconnecting(false), 2000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!selectedChallenge) {
    return <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No challenge selected</div>;
  }

  const compliance = getRuleCompliance(selectedChallenge);
  const phaseLabel = getChallengePhaseLabel(selectedChallenge);
  const balance = selectedChallenge.currentBalance;
  const equity = selectedChallenge.equity || selectedChallenge.currentBalance;
  const profitPercent = ((selectedChallenge.currentBalance - selectedChallenge.accountSize) / selectedChallenge.accountSize * 100);

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#0d1117] border-white/10' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  const generateOrderbookData = (side, count = 8) => {
    const base = selectedCryptoSymbol.price;
    const rows = [];
    for (let i = 0; i < count; i++) {
      const offset = (i + 1) * (base * 0.0005);
      const price = side === 'ask' ? base + offset : base - offset;
      const amount = (Math.random() * 2 + 0.01).toFixed(4);
      const total = (price * parseFloat(amount)).toFixed(2);
      rows.push({ price: price.toFixed(2), amount, total });
    }
    return side === 'ask' ? rows.reverse() : rows;
  };

  const askOrders = generateOrderbookData('ask');
  const bidOrders = generateOrderbookData('bid');

  const handleZoomIn = () => { chartAreaRef.current?.zoomIn(); };
  const handleZoomOut = () => { chartAreaRef.current?.zoomOut(); };
  const handleDownloadChartPNG = () => { chartAreaRef.current?.downloadChartAsPNG?.(); };
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()?.catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  };

  const filteredCryptoSymbols = cryptoSymbols.filter(s =>
    s.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ==================== BYBIT HEADER BAR ==================== */}
      <div className={`${cardClass} p-3 sm:p-4`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#f7a600] rounded-lg flex items-center justify-center">
                <span className="text-black font-black text-xs">B</span>
              </div>
              <h2 className={`text-lg sm:text-xl font-bold ${textClass}`}>Bybit Terminal</h2>
            </div>
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-[#f7a600]/20 text-[#f7a600] text-xs font-bold rounded-lg">CRYPTO</span>

            {challenges.length > 1 && (
              <div className="relative">
                <select
                  value={selectedChallenge.id}
                  onChange={(e) => selectChallenge(e.target.value)}
                  className={`appearance-none px-3 py-1.5 pr-8 rounded-lg font-medium cursor-pointer text-sm transition-all ${isDark
                    ? 'bg-[#1a1f2e] border border-white/10 text-white hover:border-[#f7a600]/50'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 hover:border-[#f7a600]'
                  } focus:outline-none focus:ring-2 focus:ring-[#f7a600]/50`}
                  style={isDark ? { colorScheme: 'dark' } : {}}
                >
                  {challenges.map((challenge) => {
                    const label = getChallengePhaseLabel(challenge);
                    const type = challenge.type === '1-step' ? '1-Step' : '2-Step';
                    return (
                      <option key={challenge.id} value={challenge.id} className={isDark ? 'bg-[#1a1f2e] text-white' : ''}>
                        {type} ${challenge.accountSize.toLocaleString()} - {label}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
              </div>
            )}

            {isConnected && !isReconnecting && (
              <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-500/20 text-emerald-500 rounded-lg text-xs sm:text-sm font-medium">
                <Wifi className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Connected</span>
              </span>
            )}
            {isReconnecting && (
              <span className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-500/20 text-amber-500 rounded-lg text-xs sm:text-sm font-medium">
                <WifiOff className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                <span className="hidden xs:inline">Reconnecting...</span>
              </span>
            )}
          </div>
          <div className={`flex items-center gap-2 ${mutedClass}`}>
            <Clock className="w-4 h-4" />
            <span className="font-mono text-xs sm:text-sm">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== BALANCE STATS ROW ==================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <DollarSign className={`w-3 h-3 sm:w-4 sm:h-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
            <span className={`text-xs sm:text-sm ${mutedClass}`}>Balance (USDT)</span>
          </div>
          <p className={`text-base sm:text-xl font-bold font-mono ${textClass}`}>
            {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
            <span className={`text-xs sm:text-sm ${mutedClass}`}>Equity</span>
          </div>
          <p className="text-base sm:text-xl font-bold font-mono text-emerald-500">
            {equity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
            <span className={`text-xs sm:text-sm ${mutedClass}`}>Unrealized PnL</span>
          </div>
          <p className="text-base sm:text-xl font-bold font-mono text-emerald-500">+0.00</p>
        </div>
        <div className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <TrendingUp className={`w-3 h-3 sm:w-4 sm:h-4 ${profitPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            <span className={`text-xs sm:text-sm ${mutedClass}`}>ROI</span>
          </div>
          <p className={`text-base sm:text-xl font-bold font-mono ${profitPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* ==================== COMPLIANCE ROW ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
        <div className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              <span className={`font-medium text-sm sm:text-base ${textClass}`}>Profit Target</span>
            </div>
            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold ${
              selectedChallenge.stats.currentProfit >= selectedChallenge.rules.profitTarget
                ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
            }`}>
              {selectedChallenge.stats.currentProfit >= selectedChallenge.rules.profitTarget ? 'PASSED' : 'IN PROGRESS'}
            </span>
          </div>
          <div className={`h-1.5 sm:h-2 rounded-full overflow-hidden mb-2 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
            <div className="h-full rounded-full bg-[#f7a600]"
              style={{ width: `${Math.min((selectedChallenge.stats.currentProfit / selectedChallenge.rules.profitTarget) * 100, 100)}%` }} />
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className={mutedClass}>{selectedChallenge.stats.currentProfit.toFixed(2)}%</span>
            <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>Target: {selectedChallenge.rules.profitTarget}%</span>
          </div>
        </div>

        <div className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              <span className={`font-medium text-sm sm:text-base ${textClass}`}>Daily Loss Limit</span>
            </div>
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-500">SAFE</span>
          </div>
          <div className={`h-1.5 sm:h-2 rounded-full overflow-hidden mb-2 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${compliance.dailyLoss.percentage}%` }} />
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className={mutedClass}>Loss: {compliance.dailyLoss.current.toFixed(2)}%</span>
            <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>Limit: {compliance.dailyLoss.limit}%</span>
          </div>
        </div>

        <div className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              <span className={`font-medium text-sm sm:text-base ${textClass}`}>Overall Drawdown</span>
            </div>
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-500">SAFE</span>
          </div>
          <div className={`h-1.5 sm:h-2 rounded-full overflow-hidden mb-2 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
            <div className="h-full rounded-full bg-emerald-500" style={{ width: `${compliance.totalDrawdown.percentage}%` }} />
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className={mutedClass}>{compliance.totalDrawdown.current.toFixed(2)}%</span>
            <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>Max: {compliance.totalDrawdown.limit}%</span>
          </div>
        </div>
      </div>

      {/* ==================== MAIN TRADING AREA ==================== */}
      <div className={cardClass + ' overflow-hidden'}>
        {/* Top toolbar */}
        <div className={`p-3 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          <TopBar
            selectedSymbol={selectedSymbol}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            chartType={chartType}
            onChartTypeChange={setChartType}
            onNewOrder={() => {}}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onDownloadChartPNG={handleDownloadChartPNG}
            onToggleFullscreen={handleToggleFullscreen}
            marketWatchOpen={showMarketWatch}
            onToggleMarketWatch={() => setShowMarketWatch(prev => !prev)}
            onToggleBuySell={() => {}}
            buySellPanelOpen={false}
          />
        </div>

        <div className="flex flex-col lg:flex-row w-full" style={{ minHeight: '500px' }}>
          {/* Left sidebar */}
          <div className="hidden lg:flex lg:w-12 lg:shrink-0 flex-col min-h-0 overflow-hidden">
            <LeftSidebar />
          </div>

          {/* Chart Area */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 order-first lg:order-none">
            <div className="flex-1 min-h-[300px] flex flex-col">
              <TradingChart
                key={`chart-bybit-${selectedSymbol?.symbol}`}
                symbol={enrichedSelectedSymbol}
                openPositions={[]}
                onPriceUpdate={handlePriceUpdate}
              />
            </div>
          </div>

          {/* Right Panel - Order Entry (Bybit-style) */}
          <div className={`w-full lg:w-80 shrink-0 border-l ${isDark ? 'border-white/10 bg-[#0d1117]' : 'border-slate-200 bg-white'}`}>
            {/* Order Type Tabs */}
            <div className={`flex border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              {['limit', 'market', 'conditional'].map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`flex-1 px-3 py-2.5 text-xs font-medium capitalize transition-all ${
                    orderType === type
                      ? `${textClass} border-b-2 border-[#f7a600]`
                      : `${mutedClass} hover:${textClass}`
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="p-3 space-y-3">
              {/* Buy/Sell Toggle */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOrderSide('buy')}
                  className={`py-2.5 rounded-lg font-bold text-sm transition-all ${
                    orderSide === 'buy'
                      ? 'bg-emerald-500 text-white'
                      : isDark ? 'bg-white/5 text-gray-400' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  Buy / Long
                </button>
                <button
                  onClick={() => setOrderSide('sell')}
                  className={`py-2.5 rounded-lg font-bold text-sm transition-all ${
                    orderSide === 'sell'
                      ? 'bg-red-500 text-white'
                      : isDark ? 'bg-white/5 text-gray-400' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  Sell / Short
                </button>
              </div>

              {/* Leverage */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-xs ${mutedClass}`}>Leverage</span>
                  <span className={`text-xs font-bold ${textClass}`}>{leverage}x</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={leverage}
                  onChange={(e) => setLeverage(parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#f7a600]"
                  style={{ background: `linear-gradient(to right, #f7a600 ${leverage}%, ${isDark ? '#1a1f2e' : '#e2e8f0'} ${leverage}%)` }}
                />
                <div className="flex justify-between mt-1">
                  {[1, 5, 10, 25, 50, 100].map((val) => (
                    <button
                      key={val}
                      onClick={() => setLeverage(val)}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        leverage === val
                          ? 'bg-[#f7a600]/20 text-[#f7a600] font-bold'
                          : mutedClass
                      }`}
                    >
                      {val}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Input (for limit orders) */}
              {orderType === 'limit' && (
                <div>
                  <label className={`text-xs ${mutedClass} mb-1 block`}>Price (USDT)</label>
                  <div className={`flex items-center rounded-lg border px-3 py-2 ${isDark ? 'bg-[#1a1f2e] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                    <input
                      type="number"
                      value={limitPrice}
                      onChange={(e) => setLimitPrice(e.target.value)}
                      placeholder={selectedCryptoSymbol.price.toFixed(2)}
                      className={`flex-1 bg-transparent text-sm font-mono outline-none ${textClass}`}
                    />
                    <span className={`text-xs ${mutedClass}`}>USDT</span>
                  </div>
                </div>
              )}

              {/* Quantity Input */}
              <div>
                <label className={`text-xs ${mutedClass} mb-1 block`}>Quantity</label>
                <div className={`flex items-center rounded-lg border px-3 py-2 ${isDark ? 'bg-[#1a1f2e] border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.000"
                    className={`flex-1 bg-transparent text-sm font-mono outline-none ${textClass}`}
                  />
                  <span className={`text-xs ${mutedClass}`}>BTC</span>
                </div>
                <div className="flex gap-1.5 mt-1.5">
                  {['25%', '50%', '75%', '100%'].map((pct) => (
                    <button
                      key={pct}
                      className={`flex-1 text-[10px] py-1 rounded font-medium ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {pct}
                    </button>
                  ))}
                </div>
              </div>

              {/* TP/SL */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`text-xs ${mutedClass} mb-1 block`}>Take Profit</label>
                  <input
                    type="number"
                    value={tpPrice}
                    onChange={(e) => setTpPrice(e.target.value)}
                    placeholder="TP Price"
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none ${isDark ? 'bg-[#1a1f2e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
                <div>
                  <label className={`text-xs ${mutedClass} mb-1 block`}>Stop Loss</label>
                  <input
                    type="number"
                    value={slPrice}
                    onChange={(e) => setSlPrice(e.target.value)}
                    placeholder="SL Price"
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none ${isDark ? 'bg-[#1a1f2e] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  />
                </div>
              </div>

              {/* Order Cost Summary */}
              <div className={`rounded-lg p-2.5 space-y-1.5 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                <div className="flex justify-between text-xs">
                  <span className={mutedClass}>Order Cost</span>
                  <span className={textClass}>0.00 USDT</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className={mutedClass}>Available</span>
                  <span className={textClass}>{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button className={`w-full py-3 rounded-xl font-bold text-sm transition-all ${
                orderSide === 'buy'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}>
                {orderSide === 'buy' ? 'Buy / Long' : 'Sell / Short'} {selectedSymbol?.symbol || 'BTC/USDT'}
              </button>
            </div>
          </div>

          {/* Market Watch on far right */}
          {showMarketWatch && (
            <div className={`flex w-full lg:w-64 shrink-0 p-3 border-l flex-col min-h-[160px] min-w-0 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <MarketWatchlist
                onSymbolSelect={(symbol) => {
                  setSelectedSymbol(symbol);
                  setTradingSelectedSymbol(symbol?.symbol ?? symbol);
                }}
                selectedSymbol={selectedSymbol}
              />
            </div>
          )}
        </div>
      </div>

      {/* ==================== ORDERBOOK ==================== */}
      <div className={cardClass + ' p-4'}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-[#f7a600]" />
            <h3 className={`font-bold ${textClass}`}>Order Book</h3>
          </div>
          <span className={`text-xs ${mutedClass}`}>Last Price: ${selectedCryptoSymbol.price.toLocaleString()}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Asks (Sell orders) */}
          <div>
            <div className={`grid grid-cols-3 text-xs font-medium mb-2 pb-2 border-b ${isDark ? 'border-white/10 text-gray-500' : 'border-slate-200 text-slate-400'}`}>
              <span>Price (USDT)</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Total</span>
            </div>
            {askOrders.map((order, i) => (
              <div key={`ask-${i}`} className="grid grid-cols-3 text-xs py-1 hover:bg-red-500/5 cursor-pointer">
                <span className="text-red-500 font-mono">{order.price}</span>
                <span className={`text-right font-mono ${textClass}`}>{order.amount}</span>
                <span className={`text-right font-mono ${mutedClass}`}>{order.total}</span>
              </div>
            ))}
          </div>
          {/* Bids (Buy orders) */}
          <div>
            <div className={`grid grid-cols-3 text-xs font-medium mb-2 pb-2 border-b ${isDark ? 'border-white/10 text-gray-500' : 'border-slate-200 text-slate-400'}`}>
              <span>Price (USDT)</span>
              <span className="text-right">Amount</span>
              <span className="text-right">Total</span>
            </div>
            {bidOrders.map((order, i) => (
              <div key={`bid-${i}`} className="grid grid-cols-3 text-xs py-1 hover:bg-emerald-500/5 cursor-pointer">
                <span className="text-emerald-500 font-mono">{order.price}</span>
                <span className={`text-right font-mono ${textClass}`}>{order.amount}</span>
                <span className={`text-right font-mono ${mutedClass}`}>{order.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ==================== POSITIONS / ORDERS / HISTORY ==================== */}
      <div className={cardClass}>
        <div className={`flex border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          {[
            { id: 'positions', label: 'Positions', count: 0 },
            { id: 'orders', label: 'Active Orders', count: 0 },
            { id: 'conditional', label: 'Conditional', count: 0 },
            { id: 'history', label: 'Trade History', count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 sm:px-6 py-3 font-medium text-xs sm:text-sm transition-all ${
                selectedTab === tab.id
                  ? `${textClass} border-b-2 border-[#f7a600]`
                  : `${mutedClass} hover:${textClass}`
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <div className={`p-8 text-center ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
            <TrendingUp className={`w-8 h-8 ${mutedClass}`} />
          </div>
          <p className={`font-medium ${textClass}`}>
            {selectedTab === 'positions' ? 'No Open Positions' :
              selectedTab === 'orders' ? 'No Active Orders' :
              selectedTab === 'conditional' ? 'No Conditional Orders' : 'No Trade History'}
          </p>
          <p className={`text-sm ${mutedClass}`}>
            {selectedTab === 'positions' ? 'Open a position to see it here' :
              selectedTab === 'orders' ? 'Place a limit order to see it here' :
              selectedTab === 'conditional' ? 'Set up conditional orders to see them here' : 'Your completed trades will appear here'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BybitTerminal;
