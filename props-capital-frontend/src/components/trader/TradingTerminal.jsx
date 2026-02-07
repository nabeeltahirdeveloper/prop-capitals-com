import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  Shield,
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Newspaper,
  Calendar,
  Bot,
  GitBranch,
  Copy,
  DollarSign,
  Activity,
  Wifi,
  WifiOff,
  Layers,
  BarChart2,
  Settings,
  Maximize2,
  Search,
  Minus,
  Plus,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useTrading } from '@/contexts/TradingContext';
import TradingChart from "../trading/TradingChart"
import { usePrices } from '@/contexts/PriceContext';
import MarketWatch from './MarketWatch';
import MarketWatchlist from '../trading/MarketWatchlist';
import TopBar from '../trading/Topbar';
import MarketExecutionModal from './MarketExecutionModal';
import LeftSidebar from '../trading/LeftSidebar';

// Demo trading symbols
const tradingSymbols = [
  { symbol: 'EUR/USD', price: 1.08567, change: +0.15, spread: 0.8 },
  { symbol: 'GBP/USD', price: 1.26234, change: -0.08, spread: 1.2 },
  { symbol: 'USD/JPY', price: 149.876, change: +0.22, spread: 1.0 },
  { symbol: 'XAU/USD', price: 2034.56, change: +0.45, spread: 2.5 },
  { symbol: 'BTC/USD', price: 43567.89, change: +1.23, spread: 15.0 },
];

// Demo candlestick data
const generateCandleData = () => {
  const data = [];
  let price = 1.0850;
  for (let i = 0; i < 50; i++) {
    const open = price;
    const volatility = 0.002;
    const change = (Math.random() - 0.48) * volatility;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * volatility * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * 0.5;
    data.push({ open, high, low, close, bullish: close > open });
    price = close;
  }
  return data;
};

const candleData = generateCandleData();


// Demo positions
const demoPositions = [];

// Trading style rules
const tradingStyleRules = [
  { id: 'news', label: 'News Trading', icon: Newspaper, allowed: true },
  { id: 'weekend', label: 'Weekend Holding', icon: Calendar, allowed: false },
  { id: 'ea', label: 'Expert Advisors', icon: Bot, allowed: false },
  { id: 'hedging', label: 'Hedging', icon: GitBranch, allowed: true },
  { id: 'copy', label: 'Copy Trading', icon: Copy, allowed: false },
];

const TradingTerminal = () => {
  const { isDark } = useTraderTheme();
  const { challenges, selectedChallenge, selectChallenge, getChallengePhaseLabel, getRuleCompliance, getChallengeStatusColor } = useChallenges();
  const [selectedTab, setSelectedTab] = useState('positions');
  // const [selectedSymbol, setSelectedSymbol] = useState('EUR/USD');
  const [orderType, setOrderType] = useState('market');
  const [isConnected, setIsConnected] = useState(true);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showMarketWatch, setShowMarketWatch] = useState(true)
  const [showBuySellPanel, setShowBuySellPanel] = useState(true)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false)


  //  --- This portion is specific for chart and symbols 

  //geting Data from Trading Context of Trading Chart 
  const {
    selectedSymbol,
    setSelectedSymbol,
    selectedTimeframe,
    setSelectedTimeframe,
    symbols,
    symbolsLoading,
    accountSummary,
    orders,
    currentSymbolData,
    chartType,
    setChartType,
    theme
  } = useTrading()

  const [positions, setPositions] = useState([]);
  const chartAreaRef = useRef(null)
  const pricesRef = useRef({});




  const { setSelectedSymbol: setTradingSelectedSymbol } = useTrading();

  const {
    prices: unifiedPrices,
    getPrice: getUnifiedPrice,
    lastUpdate: pricesLastUpdate,
  } = usePrices();

  const selectedSymbolStr =
    typeof selectedSymbol === "string"
      ? selectedSymbol
      : (selectedSymbol?.symbol ?? "");

  useEffect(() => {
    if (!selectedSymbolStr) return;

    const bid = getUnifiedPrice(selectedSymbolStr, "bid");
    const ask = getUnifiedPrice(selectedSymbolStr, "ask");

    // console.log("LIVE_TERMINAL", selectedSymbolStr, { bid, ask, ts: Date.now() });
  }, [selectedSymbolStr, getUnifiedPrice, unifiedPrices]);


  // Enrich selectedSymbol with real-time prices from unifiedPrices
  const enrichedSelectedSymbol = useMemo(() => {
    if (!selectedSymbol?.symbol) return selectedSymbol;

    const priceData = unifiedPrices[selectedSymbol.symbol];
    if (
      priceData &&
      typeof priceData === "object" &&
      priceData.bid !== undefined &&
      priceData.ask !== undefined
    ) {
      const spread = ((priceData.ask - priceData.bid) * 10000).toFixed(1); // Calculate spread in pips for forex
      return {
        ...selectedSymbol,
        bid: priceData.bid,
        ask: priceData.ask,
        spread: parseFloat(spread),
      };
    }
    return selectedSymbol;
  }, [selectedSymbol, unifiedPrices]);

  //Update at every second
  const handlePriceUpdate = useCallback((symbolName, price) => {
    pricesRef.current[symbolName] = price;
  }, []);


  // Simulate connection status
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

  // Calculate values
  const balance = selectedChallenge.currentBalance;
  const equity = selectedChallenge.equity || selectedChallenge.currentBalance;
  const floatingPL = 0;
  const profitPercent = ((selectedChallenge.currentBalance - selectedChallenge.accountSize) / selectedChallenge.accountSize * 100);
  const marginUsed = 0;
  const freeMargin = selectedChallenge.currentBalance;
  const selectedSymbolData = tradingSymbols.find(s => s.symbol === selectedSymbol);

  // Get phases for progression
  const phases = selectedChallenge.type === '1-step'
    ? [
      { name: 'Phase 1', status: selectedChallenge.phase === 'funded' ? 'completed' : 'active', profit: selectedChallenge.stats.currentProfit, profitTarget: selectedChallenge.rules.profitTarget, days: selectedChallenge.tradingDays.current, daysTarget: selectedChallenge.tradingDays.required },
      { name: 'Funded', status: selectedChallenge.phase === 'funded' ? 'active' : 'locked', description: 'Complete Phase 1' },
    ]
    : [
      { name: 'Phase 1', status: selectedChallenge.phase >= 2 || selectedChallenge.phase === 'funded' ? 'completed' : selectedChallenge.phase === 1 ? 'active' : 'locked', profit: selectedChallenge.stats.currentProfit, profitTarget: selectedChallenge.rules.profitTarget, days: selectedChallenge.tradingDays.current, daysTarget: selectedChallenge.tradingDays.required },
      { name: 'Phase 2', status: selectedChallenge.phase === 'funded' ? 'completed' : selectedChallenge.phase === 2 ? 'active' : 'locked', description: 'Complete Phase 1' },
      { name: 'Funded', status: selectedChallenge.phase === 'funded' ? 'active' : 'locked', description: 'Complete Phase 2' },
    ];

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#0d1117] border-white/10' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';


  // ========================== Topbar Functions ======================
  const handleNewOrder = () => {
    // Open new order modal/dialog (Side panel like Binance)
    setIsOrderModalOpen(true)
  }

  const handleZoomIn = () => {
    chartAreaRef.current?.zoomIn()
  }

  const handleZoomOut = () => {
    chartAreaRef.current?.zoomOut()
  }
  const handleDownloadChartPNG = () => {
    chartAreaRef.current?.downloadChartAsPNG?.()
  }

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.()?.catch(() => { })
    } else {
      document.exitFullscreen?.()
    }
  }

  const handleToggleBuySell = () => {
    setShowBuySellPanel(prev => !prev)
  }

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
  return (
    <div className="space-y-3 sm:space-y-4 ">
      {/* ==================== HEADER BAR ==================== */}
      <div className={`${cardClass} p-3 sm:p-4`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <h2 className={`text-lg sm:text-xl font-bold ${textClass}`}>Trading Terminal</h2>
            <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-lg">DEMO</span>

            {/* Challenge Dropdown */}
            {challenges.length > 1 && (
              <div className="relative">
                <select
                  value={selectedChallenge.id}
                  onChange={(e) => selectChallenge(e.target.value)}
                  className={`appearance-none px-3 py-1.5 pr-8 rounded-lg font-medium cursor-pointer text-sm transition-all ${isDark
                    ? 'bg-[#1a1f2e] border border-white/10 text-white hover:border-amber-500/50'
                    : 'bg-slate-50 border border-slate-200 text-slate-900 hover:border-amber-500'
                    } focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
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

            {/* Account Info (only show if no dropdown or on larger screens) */}
            {challenges.length <= 1 && (
              <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
                <span className={`font-bold ${textClass}`}>
                  ${selectedChallenge.accountSize.toLocaleString()}
                </span>
                <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>•</span>
                <span className={mutedClass}>{selectedChallenge.platform}</span>
                <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>•</span>
                <span className="text-amber-500 font-medium">{phaseLabel}</span>
              </div>
            )}

            {/* Connection Status */}
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

      {/* ==================== CHALLENGE ACTIVE BANNER ==================== */}
      <div className={cardClass + ' p-3 sm:p-4'}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <Target className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            </div>
            <div>
              <h3 className={`font-bold text-base sm:text-lg ${textClass}`}>Challenge Active</h3>
              <p className={`text-xs sm:text-sm ${mutedClass}`}>Working towards {phaseLabel} completion</p>
            </div>
          </div>
          <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500/20 text-blue-400 rounded-xl font-bold text-sm sm:text-base">
            {phaseLabel.toUpperCase()}
          </span>
        </div>
      </div>

      {/* ==================== PHASE PROGRESSION ==================== */}
      <div className={cardClass + ' p-3 sm:p-4'}>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          <h3 className={`font-bold text-sm sm:text-base ${textClass}`}>Phase Progression</h3>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {phases.map((phase, index) => (
            <React.Fragment key={phase.name}>
              <div
                className={`flex-1 rounded-xl p-3 sm:p-4 border-2 ${phase.status === 'active'
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : phase.status === 'completed'
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : isDark ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-slate-50'
                  }`}
              >
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${phase.status === 'active' ? 'bg-blue-500' :
                    phase.status === 'completed' ? 'bg-emerald-500' :
                      isDark ? 'bg-gray-600' : 'bg-slate-300'
                    }`} />
                  <span className={`font-semibold text-sm sm:text-base ${phase.status === 'active' ? 'text-blue-400' :
                    phase.status === 'completed' ? 'text-emerald-500' :
                      mutedClass
                    }`}>{phase.name}</span>
                </div>
                {phase.profit !== undefined && phase.status === 'active' ? (
                  <div className="space-y-1 text-xs sm:text-sm">
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>Profit:</span>
                      <span className={textClass}>
                        <span className="text-red-500">✗</span> {phase.profit.toFixed(2)}% / {phase.profitTarget}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>Days:</span>
                      <span className={textClass}>
                        <span className="text-red-500">✗</span> {phase.days} / {phase.daysTarget}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                    {phase.status === 'completed' ? 'Completed' : phase.description || 'Locked'}
                  </p>
                )}
              </div>
              {index < phases.length - 1 && (
                <ArrowRight className={`hidden sm:block w-5 h-5 flex-shrink-0 ${mutedClass}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ==================== BALANCE STATS ROW ==================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <div className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <DollarSign className={`w-3 h-3 sm:w-4 sm:h-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
            <span className={`text-xs sm:text-sm ${mutedClass}`}>Balance</span>
          </div>
          <p className={`text-base sm:text-xl font-bold font-mono ${textClass}`}>
            ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
            <span className={`text-xs sm:text-sm ${mutedClass}`}>Equity</span>
          </div>
          <p className="text-base sm:text-xl font-bold font-mono text-emerald-500">
            ${equity.toLocaleString('en-US', { minimumFractionDigits: 0 })}
          </p>
        </div>
        <div className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <Activity className={`w-3 h-3 sm:w-4 sm:h-4 ${floatingPL >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            <span className={`text-xs sm:text-sm ${mutedClass}`}>Floating P/L</span>
          </div>
          <p className={`text-base sm:text-xl font-bold font-mono ${floatingPL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            +{floatingPL.toFixed(2)}
          </p>
        </div>
        <div className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <TrendingUp className={`w-3 h-3 sm:w-4 sm:h-4 ${profitPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            <span className={`text-xs sm:text-sm ${mutedClass}`}>Profit %</span>
          </div>
          <p className={`text-base sm:text-xl font-bold font-mono ${profitPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            +{profitPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* ==================== COMPLIANCE ROW ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
        {/* Profit Target */}
        <div className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <Target className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              <span className={`font-medium text-sm sm:text-base ${textClass}`}>Profit Target</span>
            </div>
            <span className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold ${selectedChallenge.stats.currentProfit >= selectedChallenge.rules.profitTarget
              ? 'bg-emerald-500/20 text-emerald-500'
              : 'bg-red-500/20 text-red-500'
              }`}>
              {selectedChallenge.stats.currentProfit >= selectedChallenge.rules.profitTarget ? 'PASSED' : 'DANGER'}
            </span>
          </div>
          <div className={`h-1.5 sm:h-2 rounded-full overflow-hidden mb-2 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
            <div
              className="h-full rounded-full bg-gray-500"
              style={{ width: `${Math.min((selectedChallenge.stats.currentProfit / selectedChallenge.rules.profitTarget) * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className={mutedClass}>{selectedChallenge.stats.currentProfit.toFixed(2)}%</span>
            <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>Target: {selectedChallenge.rules.profitTarget}%</span>
          </div>
        </div>

        {/* Daily Loss Limit */}
        <div className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
              <span className={`font-medium text-sm sm:text-base ${textClass}`}>Daily Loss Limit</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {compliance.dailyLoss.status === 'safe' && <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />}
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-500">
                SAFE
              </span>
            </div>
          </div>
          <div className={`h-1.5 sm:h-2 rounded-full overflow-hidden mb-2 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${compliance.dailyLoss.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs sm:text-sm">
            <span className={mutedClass}>Loss: {compliance.dailyLoss.current.toFixed(2)}% <CheckCircle className="w-3 h-3 inline text-emerald-500" /></span>
            <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>Limit: {compliance.dailyLoss.limit}%</span>
          </div>
        </div>

        {/* Overall Drawdown */}
        <div className={cardClass + ' p-4'}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className={`font-medium ${textClass}`}>Overall Drawdown</span>
            </div>
            <div className="flex items-center gap-2">
              {compliance.totalDrawdown.status === 'safe' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-500">
                SAFE
              </span>
            </div>
          </div>
          <div className={`h-2 rounded-full overflow-hidden mb-2 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${compliance.totalDrawdown.percentage}%` }}
            />
          </div>
          <div className="flex justify-between text-sm">
            <span className={mutedClass}>{compliance.totalDrawdown.current.toFixed(2)}% <CheckCircle className="w-3 h-3 inline text-emerald-500" /></span>
            <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>Max: {compliance.totalDrawdown.limit}%</span>
          </div>
        </div>
      </div>

      {/* ==================== MARGIN & TRADING DAYS ROW ==================== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={cardClass + ' p-4'}>
          <span className={`text-sm ${mutedClass}`}>Margin Used</span>
          <p className={`text-xl font-bold font-mono ${textClass}`}>$0.00</p>
        </div>
        <div className={cardClass + ' p-4'}>
          <span className={`text-sm ${mutedClass}`}>Free Margin</span>
          <p className={`text-xl font-bold font-mono ${textClass}`}>
            ${freeMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className={cardClass + ' p-4'}>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className={`w-4 h-4 ${mutedClass}`} />
            <span className={`text-sm ${mutedClass}`}>Trading Days</span>
          </div>
          <p className={`text-2xl font-bold font-mono ${textClass}`}>
            {selectedChallenge.tradingDays.current} / {selectedChallenge.tradingDays.required}
          </p>
          <p className={`text-xs ${mutedClass}`}>
            {Math.max(0, selectedChallenge.tradingDays.required - selectedChallenge.tradingDays.current)} days remaining
          </p>
        </div>
        <div className={cardClass + ' p-4'}>
          <span className={`text-sm ${mutedClass}`}>Phase</span>
          <div className="mt-2">
            <span className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg font-bold text-sm">
              {phaseLabel}
            </span>
          </div>
        </div>
      </div>

      {/* ==================== DEMO WEBTRADER ==================== */}
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
          {/* Left sidebar - fixed 48px (w-12) so no gap, chart starts immediately */}
          <div className="hidden lg:flex lg:w-12 lg:shrink-0 flex-col min-h-0 overflow-hidden">
            <LeftSidebar />
          </div>

          {/* Chart Area - takes remaining space, no gap after sidebar */}
          <div className="flex-1 min-w-0 flex flex-col min-h-0 order-first lg:order-none">

            {/* Candlestick Chart - flex container so chart fills height */}
            <div className="flex-1 min-h-[200px] flex flex-col">
              <TradingChart
                key={`chart-mobile-${selectedSymbol?.symbol}`}
                symbol={enrichedSelectedSymbol}
                openPositions={positions}
                onPriceUpdate={handlePriceUpdate}
              />
            </div>

          </div>

          {/* Market Watch / Symbols - full width on mobile (below chart), fixed 18rem on lg */}
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

      {/* ==================== TRADING STYLE RULES ==================== */}
      <div className={cardClass + ' p-4'}>
        <h3 className={`font-bold mb-4 ${textClass}`}>Trading Style Rules</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {tradingStyleRules.map((rule) => (
            <div
              key={rule.id}
              className={`flex items-center gap-3 p-3 rounded-xl ${rule.allowed
                ? isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
                : isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
                }`}
            >
              <rule.icon className={`w-4 h-4 ${rule.allowed ? 'text-emerald-500' : 'text-red-500'}`} />
              <div>
                <span className={`text-sm font-medium ${textClass}`}>{rule.label}</span>
                <span className={`block text-xs ${rule.allowed ? 'text-emerald-500' : 'text-red-500'}`}>
                  {rule.allowed ? 'Allowed' : 'Not Allowed'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ==================== POSITIONS / PENDING / HISTORY ==================== */}
      <div className={cardClass}>
        <div className={`flex border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          {[
            { id: 'positions', label: 'Positions', count: demoPositions.length },
            { id: 'pending', label: 'Pending', count: 0 },
            { id: 'history', label: 'History', count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm transition-all ${selectedTab === tab.id
                ? `${textClass} border-b-2 border-amber-500`
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
              selectedTab === 'pending' ? 'No Pending Orders' : 'No Trade History'}
          </p>
          <p className={`text-sm ${mutedClass}`}>
            {selectedTab === 'positions' ? 'Place a trade to see your positions here' :
              selectedTab === 'pending' ? 'Create pending orders to see them here' : 'Your completed trades will appear here'}
          </p>
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
            className='fixed left-12 top-0 w-96 max-w-sm z-40 transition-transform duration-300 ease-in-out pointer-events-auto'
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
  );
};

export default TradingTerminal;
