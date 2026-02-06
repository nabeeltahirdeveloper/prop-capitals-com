import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  ArrowRight
} from 'lucide-react';

// Demo account data
const accountData = {
  accountId: '#5214',
  platform: 'MT5',
  server: 'PropCapitals-Live',
  status: 'Active',
  product: 'TRADERPROXT',
  accountSize: '$100,000.00',
  accountType: 'Classic',
  balance: 102847.53,
  startingBalance: 100000,
  equity: 102847.53,
  floatingPL: 0,
  profitPercent: 2.85,
  currentPhase: 1,
  tradingDays: { current: 3, required: 5 },
};

const phases = [
  { id: 1, name: 'Phase 1', status: 'active', description: 'You are here' },
  { id: 2, name: 'Phase 2', status: 'pending', description: 'Next Stage' },
  { id: 3, name: 'Phase 3', status: 'pending', description: 'Next Stage' },
  { id: 4, name: 'Phase 4', status: 'pending', description: 'Next Stage' },
  { id: 5, name: 'Funded', status: 'pending', description: 'Live Account' },
];

// Generate demo chart data
const generateChartData = () => {
  const data = [];
  let value = 100000;
  for (let i = 0; i < 30; i++) {
    value += (Math.random() - 0.4) * 1000;
    data.push({ day: i + 1, value: Math.max(95000, value) });
  }
  return data;
};

const chartData = generateChartData();

// Generate trade calendar data
const generateCalendarData = () => {
  const data = [];
  for (let i = 1; i <= 30; i++) {
    const hasTraded = Math.random() > 0.4;
    if (hasTraded) {
      const profit = (Math.random() - 0.35) * 2000;
      data.push({ day: i, profit: Math.round(profit * 100) / 100, trades: Math.floor(Math.random() * 10) + 1 });
    } else {
      data.push({ day: i, profit: 0, trades: 0 });
    }
  }
  return data;
};

const calendarData = generateCalendarData();

const AccountOverview = () => {
  const profitAmount = accountData.balance - accountData.startingBalance;
  const profitPercent = (profitAmount / accountData.startingBalance) * 100;

  return (
    <div className="space-y-6">
      {/* Account Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card - Account Details */}
        <div className="bg-[#12161d] rounded-2xl border border-white/5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Platform ID</p>
              <p className="text-white font-semibold">#57297</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Platform</p>
              <p className="text-white font-semibold flex items-center gap-2">
                {accountData.platform}
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Username</p>
              <p className="text-white font-semibold">propcapitals@demo.com</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Account ID</p>
              <p className="text-white font-semibold">{accountData.accountId}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Password</p>
              <p className="text-white font-semibold">••••••••</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Product</p>
              <p className="text-white font-semibold">{accountData.product}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Server</p>
              <p className="text-white font-semibold">{accountData.server}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Account Type</p>
              <p className="text-white font-semibold">{accountData.accountType}</p>
            </div>
          </div>
        </div>

        {/* Right Card - Status & Size */}
        <div className="bg-[#12161d] rounded-2xl border border-white/5 p-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-500 text-sm">Status</p>
              <p className="text-emerald-500 font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {accountData.status}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Account Size</p>
              <p className="text-white font-semibold text-xl">{accountData.accountSize}</p>
            </div>
            <div className="col-span-2 mt-4">
              <p className="text-gray-500 text-sm mb-2">Trading Days</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                    style={{ width: `${(accountData.tradingDays.current / accountData.tradingDays.required) * 100}%` }}
                  />
                </div>
                <span className="text-white font-semibold">{accountData.tradingDays.current}/{accountData.tradingDays.required}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phase Progression */}
      <div className="bg-[#12161d] rounded-2xl border border-white/5 p-6">
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {phases.map((phase, index) => (
            <React.Fragment key={phase.id}>
              <div className={`flex flex-col items-center min-w-[100px] ${phase.status === 'active' ? 'text-emerald-500' : 'text-gray-500'
                }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mb-2 ${phase.status === 'active'
                  ? 'bg-emerald-500 text-white'
                  : phase.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-white/5 text-gray-500'
                  }`}>
                  {phase.id}
                </div>
                <p className="font-semibold text-sm whitespace-nowrap">{phase.name}</p>
                <p className="text-xs text-gray-500 whitespace-nowrap">{phase.description}</p>
              </div>
              {index < phases.length - 1 && (
                <ArrowRight className={`w-6 h-6 mx-2 flex-shrink-0 ${phase.status === 'active' || phase.status === 'completed' ? 'text-emerald-500' : 'text-gray-600'
                  }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Balance Chart */}
        <div className="bg-[#12161d] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold text-lg">Account Balance</h3>
            <div className="flex items-center gap-2 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
              <span className="font-semibold">+{profitPercent.toFixed(2)}%</span>
            </div>
          </div>

          {/* Simple SVG Chart */}
          <div className="relative h-48">
            <svg viewBox="0 0 400 150" className="w-full h-full">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgb(236, 72, 153)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="rgb(236, 72, 153)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              ))}

              {/* Area */}
              <path
                d={`M 0 150 ${chartData.map((d, i) => `L ${(i / (chartData.length - 1)) * 400} ${150 - ((d.value - 95000) / 10000) * 150}`).join(' ')} L 400 150 Z`}
                fill="url(#chartGradient)"
              />

              {/* Line */}
              <path
                d={`M ${chartData.map((d, i) => `${(i / (chartData.length - 1)) * 400} ${150 - ((d.value - 95000) / 10000) * 150}`).join(' L ')}`}
                fill="none"
                stroke="rgb(236, 72, 153)"
                strokeWidth="2"
              />

              {/* Current value dot */}
              <circle
                cx={400}
                cy={150 - ((chartData[chartData.length - 1].value - 95000) / 10000) * 150}
                r="6"
                fill="rgb(236, 72, 153)"
              />
            </svg>

            {/* Current Value Badge */}
            <div className="absolute top-4 right-4 bg-pink-500/20 text-pink-500 px-3 py-1 rounded-lg text-sm font-bold">
              ${accountData.balance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Trade Calendar */}
        <div className="bg-[#12161d] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-white font-bold text-lg">Trade Calendar</h3>
            <p className="text-gray-500 text-sm">September, 2025</p>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center text-gray-500 text-xs py-2">{day}</div>
            ))}

            {/* Calendar days */}
            {calendarData.slice(0, 28).map((day) => (
              <div
                key={day.day}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium ${day.trades > 0
                  ? day.profit >= 0
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-red-500/20 text-red-500'
                  : 'bg-white/5 text-gray-600'
                  }`}
              >
                <span className="text-[10px] text-gray-500">{day.day}</span>
                {day.trades > 0 && (
                  <span className="text-[10px] font-bold">
                    {day.profit >= 0 ? '+' : ''}{day.profit.toFixed(0)}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Calendar Footer */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">P/L:</span>
              <span className="text-emerald-500 font-semibold">+$2,179</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">RR:</span>
              <span className="text-white font-semibold">+$2,271</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">Trades:</span>
              <span className="text-white font-semibold">47</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Profit */}
        <div className="bg-[#12161d] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">Current Profit</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-white text-2xl font-bold mb-1">
            ${accountData.balance.toLocaleString()}
          </p>
          <p className="text-gray-500 text-xs">
            Starting Balance: ${accountData.startingBalance.toLocaleString()}
          </p>
        </div>

        {/* Daily Drawdown */}
        <div className="bg-[#12161d] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">Daily Drawdown</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <div>
              <p className="text-white text-2xl font-bold">0.00%</p>
              <p className="text-gray-500 text-xs">Current</p>
            </div>
            <div>
              <p className="text-gray-400 text-lg font-semibold">5.00%</p>
              <p className="text-gray-500 text-xs">Max</p>
            </div>
          </div>
        </div>

        {/* Trading Drawdown */}
        <div className="bg-[#12161d] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">Trading Drawdown</p>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <div>
              <p className="text-white text-2xl font-bold">1.85%</p>
              <p className="text-gray-500 text-xs">Current</p>
            </div>
            <div>
              <p className="text-gray-400 text-lg font-semibold">10.00%</p>
              <p className="text-gray-500 text-xs">Max</p>
            </div>
          </div>
        </div>

        {/* Profit Target */}
        <div className="bg-[#12161d] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">Profit Target</p>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Target className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <div>
              <p className="text-white text-2xl font-bold">2.85%</p>
              <p className="text-gray-500 text-xs">Current</p>
            </div>
            <div>
              <p className="text-amber-500 text-lg font-semibold">8.00%</p>
              <p className="text-gray-500 text-xs">Target</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountOverview;
