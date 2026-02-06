import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Wifi,
  Clock,
  BarChart3,
  CandlestickChart
} from 'lucide-react';

// Demo currency pairs with live-ish prices
const currencyPairs = [
  { symbol: 'EUR/USD', bid: 1.08547, ask: 1.08562, change: -0.12, spread: 1.5 },
  { symbol: 'GBP/USD', bid: 1.26234, ask: 1.26252, change: 0.24, spread: 1.8 },
  { symbol: 'USD/JPY', bid: 149.847, ask: 149.865, change: 0.45, spread: 1.8 },
  { symbol: 'AUD/USD', bid: 0.65423, ask: 0.65438, change: -0.31, spread: 1.5 },
  { symbol: 'USD/CAD', bid: 1.35678, ask: 1.35695, change: 0.08, spread: 1.7 },
  { symbol: 'NZD/USD', bid: 0.59234, ask: 0.59251, change: -0.18, spread: 1.7 },
  { symbol: 'USD/CHF', bid: 0.87456, ask: 0.87472, change: 0.15, spread: 1.6 },
  { symbol: 'EUR/GBP', bid: 0.85923, ask: 0.85939, change: -0.22, spread: 1.6 },
];

const timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];

// Generate candlestick data
const generateCandlestickData = (count = 50) => {
  const data = [];
  let basePrice = 1.08500;

  for (let i = 0; i < count; i++) {
    const open = basePrice + (Math.random() - 0.5) * 0.002;
    const close = open + (Math.random() - 0.5) * 0.003;
    const high = Math.max(open, close) + Math.random() * 0.001;
    const low = Math.min(open, close) - Math.random() * 0.001;

    data.push({ open, high, low, close, time: i });
    basePrice = close;
  }

  return data;
};

const TradingTerminal = () => {
  const [selectedPair, setSelectedPair] = useState(currencyPairs[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('H1');
  const [orderType, setOrderType] = useState('buy');
  const [amount, setAmount] = useState('0.01');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [prices, setPrices] = useState(currencyPairs);

  const candlestickData = useMemo(() => generateCandlestickData(60), [selectedPair.symbol]);

  // Simulate price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => prev.map(pair => ({
        ...pair,
        bid: pair.bid + (Math.random() - 0.5) * 0.0002,
        ask: pair.ask + (Math.random() - 0.5) * 0.0002,
        change: pair.change + (Math.random() - 0.5) * 0.01
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const filteredPairs = prices.filter(pair =>
    pair.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentPair = prices.find(p => p.symbol === selectedPair.symbol) || selectedPair;

  // Calculate chart dimensions
  const chartWidth = 800;
  const chartHeight = 400;
  const candleWidth = chartWidth / candlestickData.length * 0.8;
  const priceRange = {
    min: Math.min(...candlestickData.map(d => d.low)),
    max: Math.max(...candlestickData.map(d => d.high))
  };
  const priceScale = chartHeight / (priceRange.max - priceRange.min);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-white text-2xl font-bold">Trading Terminal</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 rounded-lg">
            <Wifi className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500 text-sm font-medium">Connected</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Clock className="w-4 h-4" />
          <span>Server Time: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Symbol List */}
        <div className="lg:col-span-2 bg-[#12161d] rounded-2xl border border-white/5 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-emerald-500 text-sm font-medium">Live</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Pairs List */}
          <div className="space-y-1 max-h-[500px] overflow-y-auto">
            {filteredPairs.map((pair) => (
              <button
                key={pair.symbol}
                onClick={() => setSelectedPair(pair)}
                className={`w-full p-3 rounded-lg text-left transition-all ${selectedPair.symbol === pair.symbol
                  ? 'bg-amber-500/10 border border-amber-500/30'
                  : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-sm ${selectedPair.symbol === pair.symbol ? 'text-amber-500' : 'text-white'
                    }`}>
                    {pair.symbol}
                  </span>
                  {pair.change >= 0 ? (
                    <TrendingUp className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-400 text-xs">{pair.bid.toFixed(5)}</span>
                  <span className={`text-xs font-medium ${pair.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                    {pair.change >= 0 ? '+' : ''}{pair.change.toFixed(2)}%
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="lg:col-span-7 bg-[#12161d] rounded-2xl border border-white/5 p-4">
          {/* Chart Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CandlestickChart className="w-5 h-5 text-amber-500" />
                <span className="text-white font-bold text-lg">{currentPair.symbol}</span>
              </div>
              <div className={`text-lg font-semibold ${currentPair.change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {currentPair.bid.toFixed(5)}
                <span className="text-sm ml-2">
                  {currentPair.change >= 0 ? '+' : ''}{currentPair.change.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Timeframe Buttons */}
            <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
              {timeframes.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${selectedTimeframe === tf
                    ? 'bg-amber-500 text-[#0a0d12]'
                    : 'text-gray-400 hover:text-white hover:bg-white/10'
                    }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Candlestick Chart */}
          <div className="relative bg-[#0a0d12] rounded-xl p-4 h-[400px] overflow-hidden">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <g key={i}>
                  <line
                    x1="0"
                    y1={i * (chartHeight / 4)}
                    x2={chartWidth}
                    y2={i * (chartHeight / 4)}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth="1"
                  />
                  <text
                    x={chartWidth - 5}
                    y={i * (chartHeight / 4) + 12}
                    fill="rgba(255,255,255,0.3)"
                    fontSize="10"
                    textAnchor="end"
                  >
                    {(priceRange.max - (i * (priceRange.max - priceRange.min) / 4)).toFixed(5)}
                  </text>
                </g>
              ))}

              {/* Candlesticks */}
              {candlestickData.map((candle, i) => {
                const x = (i / candlestickData.length) * chartWidth + candleWidth / 2;
                const isGreen = candle.close >= candle.open;
                const bodyTop = chartHeight - ((Math.max(candle.open, candle.close) - priceRange.min) * priceScale);
                const bodyBottom = chartHeight - ((Math.min(candle.open, candle.close) - priceRange.min) * priceScale);
                const wickTop = chartHeight - ((candle.high - priceRange.min) * priceScale);
                const wickBottom = chartHeight - ((candle.low - priceRange.min) * priceScale);

                return (
                  <g key={i}>
                    {/* Wick */}
                    <line
                      x1={x}
                      y1={wickTop}
                      x2={x}
                      y2={wickBottom}
                      stroke={isGreen ? '#10b981' : '#ef4444'}
                      strokeWidth="1"
                    />
                    {/* Body */}
                    <rect
                      x={x - candleWidth / 2}
                      y={bodyTop}
                      width={candleWidth}
                      height={Math.max(1, bodyBottom - bodyTop)}
                      fill={isGreen ? '#10b981' : '#ef4444'}
                      rx="1"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Current Price Line */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-amber-500 text-[#0a0d12] px-2 py-1 rounded text-xs font-bold">
              {currentPair.bid.toFixed(5)}
            </div>
          </div>

          {/* Chart Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-gray-500 text-xs">BID</span>
                <p className="text-red-500 font-mono font-bold">{currentPair.bid.toFixed(5)}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">ASK</span>
                <p className="text-emerald-500 font-mono font-bold">{currentPair.ask.toFixed(5)}</p>
              </div>
              <div>
                <span className="text-gray-500 text-xs">SPREAD</span>
                <p className="text-white font-mono font-bold">{currentPair.spread}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-gray-500 text-xs">Vol: 1.2M</span>
            </div>
          </div>
        </div>

        {/* Order Panel */}
        <div className="lg:col-span-3 bg-[#12161d] rounded-2xl border border-white/5 p-4">
          <h3 className="text-white font-bold mb-4">New Order</h3>

          {/* Buy/Sell Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
              onClick={() => setOrderType('buy')}
              className={`py-3 rounded-xl font-bold text-sm transition-all ${orderType === 'buy'
                ? 'bg-emerald-500 text-white'
                : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
                }`}
            >
              BUY
            </button>
            <button
              onClick={() => setOrderType('sell')}
              className={`py-3 rounded-xl font-bold text-sm transition-all ${orderType === 'sell'
                ? 'bg-red-500 text-white'
                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                }`}
            >
              SELL
            </button>
          </div>

          {/* Price Display */}
          <div className="bg-white/5 rounded-xl p-3 mb-4">
            <p className="text-gray-500 text-xs mb-1">Price</p>
            <p className={`text-2xl font-mono font-bold ${orderType === 'buy' ? 'text-emerald-500' : 'text-red-500'}`}>
              {orderType === 'buy' ? currentPair.ask.toFixed(5) : currentPair.bid.toFixed(5)}
            </p>
          </div>

          {/* Amount */}
          <div className="mb-4">
            <label className="text-gray-500 text-xs block mb-1">Amount (Lots)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-amber-500/50"
              step="0.01"
              min="0.01"
            />
            <div className="grid grid-cols-5 gap-1 mt-2">
              {['10%', '25%', '50%', '75%', '100%'].map((pct) => (
                <button
                  key={pct}
                  className="py-1.5 rounded-lg bg-white/5 text-gray-400 text-xs hover:bg-white/10 hover:text-white transition-all"
                >
                  {pct}
                </button>
              ))}
            </div>
          </div>

          {/* TP & SL */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="text-gray-500 text-xs block mb-1">Take Profit</label>
              <input
                type="text"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="0.00000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            <div>
              <label className="text-gray-500 text-xs block mb-1">Stop Loss</label>
              <input
                type="text"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="0.00000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-red-500/50"
              />
            </div>
          </div>

          {/* Order Info */}
          <div className="bg-white/5 rounded-xl p-3 mb-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Order Value</span>
              <span className="text-white font-medium">$10,854.70</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Margin</span>
              <span className="text-white font-medium">$108.55</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Leverage</span>
              <span className="text-amber-500 font-medium">1:100</span>
            </div>
          </div>

          {/* Place Order Button */}
          <button className={`w-full py-4 rounded-xl font-bold text-white transition-all ${orderType === 'buy'
            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700'
            : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
            }`}>
            Place {orderType === 'buy' ? 'Buy' : 'Sell'} Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradingTerminal;
