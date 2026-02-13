import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  ArrowRight,
  Shield,
  Zap,
  Award,
  AlertCircle,
  BarChart3,
  X,
  Calendar,
  Check
} from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';
import { useChallenges, challengeTypes } from '@/contexts/ChallengesContext';
import { usePlatformTokensStore } from '@/lib/stores/platform-tokens.store';

// Generate demo chart data
const generateChartData = (startBalance, currentBalance) => {
  const data = [];
  let value = startBalance;
  const target = currentBalance;
  for (let i = 0; i < 30; i++) {
    const progress = i / 29;
    value = startBalance + (target - startBalance) * progress + (Math.random() - 0.5) * (startBalance * 0.01);
    data.push({ day: i + 1, value: Math.max(startBalance * 0.9, value) });
  }
  data[data.length - 1].value = currentBalance;
  return data;
};

// Generate trade calendar data
const generateCalendarData = () => {
  const data = [];
  for (let i = 1; i <= 28; i++) {
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

// Static orders data for clicked calendar day
const calendarOrders = {
  1: [
    { id: 'ORD-1-1', symbol: 'EUR/USD', type: 'buy', lots: '0.30', openTime: '09:15', closeTime: '11:30', profit: 125.50 },
    { id: 'ORD-1-2', symbol: 'GBP/USD', type: 'sell', lots: '0.20', openTime: '14:22', closeTime: '16:45', profit: -45.00 },
  ],
  2: [
    { id: 'ORD-2-1', symbol: 'USD/JPY', type: 'buy', lots: '0.50', openTime: '08:00', closeTime: '12:15', profit: 310.00 },
  ],
  3: [
    { id: 'ORD-3-1', symbol: 'EUR/USD', type: 'buy', lots: '0.25', openTime: '10:30', closeTime: '14:00', profit: 88.75 },
    { id: 'ORD-3-2', symbol: 'AUD/USD', type: 'sell', lots: '0.40', openTime: '15:00', closeTime: '17:30', profit: 156.20 },
    { id: 'ORD-3-3', symbol: 'NZD/USD', type: 'buy', lots: '0.15', openTime: '09:45', closeTime: '11:20', profit: -28.50 },
  ],
};

// ComplianceIndicator moved outside to prevent re-renders
const ComplianceIndicator = ({ label, data, icon: Icon, type = 'progress', isDark }) => {
  const getStatusColor = () => {
    if (data.status === 'passed' || data.status === 'safe') return 'emerald';
    if (data.status === 'warning') return 'amber';
    if (data.status === 'violated') return 'red';
    return 'blue';
  };
  const color = getStatusColor();

  return (
    <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${color === 'emerald' ? 'text-emerald-500' :
            color === 'amber' ? 'text-amber-500' :
              color === 'red' ? 'text-red-500' : 'text-blue-500'
            }`} />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{label}</span>
        </div>
        {data.status === 'passed' && <CheckCircle className="w-4 h-4 text-emerald-500" />}
        {data.status === 'safe' && <Shield className="w-4 h-4 text-emerald-500" />}
        {data.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
        {data.status === 'violated' && <AlertCircle className="w-4 h-4 text-red-500" />}
      </div>
      <div className="flex items-baseline justify-between mb-2">
        <span className={`text-xl font-bold ${color === 'emerald' ? 'text-emerald-500' :
          color === 'amber' ? 'text-amber-500' :
            color === 'red' ? 'text-red-500' : isDark ? 'text-white' : 'text-slate-900'
          }`}>
          {type === 'progress' ? `${data.current.toFixed(2)}%` : `${data.current}/${data.required || data.limit}`}
        </span>
        <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
          {type === 'progress' ? `Target: ${data.target}%` : type === 'limit' ? `Limit: ${data.limit}%` : `Required: ${data.required}`}
        </span>
      </div>
      <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
        <div
          className={`h-full rounded-full transition-all ${color === 'emerald' ? 'bg-emerald-500' :
            color === 'amber' ? 'bg-amber-500' :
              color === 'red' ? 'bg-red-500' : 'bg-blue-500'
            }`}
          style={{ width: `${Math.min(data.percentage, 100)}%` }}
        />
      </div>
    </div>
  );
};

const AccountOverview = () => {
  const { isDark } = useTraderTheme();
  const [selectedDay, setSelectedDay] = useState(null);
  const {
    challenges,
    selectedChallenge,
    selectChallenge,
    getChallengePhaseLabel,
    getChallengeStatusColor,
    getRuleCompliance,
    loading
  } = useChallenges();
  const pinnedAccounts = usePlatformTokensStore((state) => state.pinnedAccounts || []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4" />
          <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
            Loading accounts...
          </p>
        </div>
      </div>
    );
  }

  if (!selectedChallenge) {
    return <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>No challenges found. Buy a challenge to get started!</div>;
  }

  const chartData = generateChartData(selectedChallenge.accountSize, selectedChallenge.currentBalance);
  const profitAmount = selectedChallenge.currentBalance - selectedChallenge.accountSize;
  const profitPercent = (profitAmount / selectedChallenge.accountSize) * 100;
  const compliance = getRuleCompliance(selectedChallenge);
  const pinnedChallenges = pinnedAccounts
    .map((id) => challenges.find((challenge) => challenge.id === id))
    .filter(Boolean)
    .slice(0, 4);

  // Get phase progression based on challenge type
  const getPhases = () => {
    if (selectedChallenge.type === '1-step') {
      return [
        { id: 1, name: 'Evaluation', status: selectedChallenge.phase === 'funded' ? 'completed' : 'active', description: selectedChallenge.phase === 'funded' ? 'Passed' : 'You are here' },
        { id: 2, name: 'Funded', status: selectedChallenge.phase === 'funded' ? 'active' : 'pending', description: selectedChallenge.phase === 'funded' ? 'Live Account' : 'Next Stage' },
      ];
    }
    return [
      { id: 1, name: 'Phase 1', status: selectedChallenge.phase >= 2 || selectedChallenge.phase === 'funded' ? 'completed' : selectedChallenge.phase === 1 ? 'active' : 'pending', description: selectedChallenge.phase === 1 ? 'You are here' : 'Passed' },
      { id: 2, name: 'Phase 2', status: selectedChallenge.phase === 'funded' ? 'completed' : selectedChallenge.phase === 2 ? 'active' : 'pending', description: selectedChallenge.phase === 2 ? 'You are here' : selectedChallenge.phase > 2 || selectedChallenge.phase === 'funded' ? 'Passed' : 'Next Stage' },
      { id: 3, name: 'Funded', status: selectedChallenge.phase === 'funded' ? 'active' : 'pending', description: selectedChallenge.phase === 'funded' ? 'Live Account' : 'Final Stage' },
    ];
  };

  const phases = getPhases();

  return (
    <div className="space-y-6">
      {/* Challenge Selector - Pinned Cards */}
      <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
              <Award className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Pinned Challenges</h3>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                {pinnedChallenges.length} of {challenges.length} accounts pinned
              </p>
            </div>
          </div>
        </div>

        {/* Display pinned challenges as cards */}
        {pinnedChallenges.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {pinnedChallenges.map((challenge) => {
            const isSelected = selectedChallenge.id === challenge.id;
            const phaseLabel = getChallengePhaseLabel(challenge);
            const statusColor = getChallengeStatusColor(challenge);

            return (
              <button
                key={challenge.id}
                onClick={() => selectChallenge(challenge.id)}
                className={`relative p-4 rounded-xl border-2 text-left transition-all ${isSelected
                  ? 'border-amber-500 bg-amber-500/5 shadow-lg shadow-amber-500/10'
                  : isDark
                    ? 'border-white/10 bg-white/5 hover:border-white/20'
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                  }`}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                    <Check className="w-3 h-3 text-black" />
                  </div>
                )}

                {/* Status badge */}
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold mb-2 ${statusColor === 'emerald' ? 'bg-emerald-500/20 text-emerald-500' :
                  statusColor === 'red' ? 'bg-red-500/20 text-red-500' :
                    'bg-amber-500/20 text-amber-500'
                  }`}>
                  {challenge.status === 'active' && challenge.phase === 'funded' && <Zap className="w-2.5 h-2.5" />}
                  {phaseLabel}
                </div>

                {/* Challenge info */}
                <div className="flex items-baseline gap-2 mb-1">
                  <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    ${challenge.accountSize.toLocaleString()}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${challenge.type === '1-step' ? 'bg-blue-500/10 text-blue-500' : 'bg-purple-500/10 text-purple-500'
                    }`}>
                    {challenge.type === '1-step' ? '1-Step' : '2-Step'}
                  </span>
                </div>

                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                  {challenge.accountId} • {challenge.platform}
                </div>

                {/* Progress mini bar */}
                <div className={`mt-3 h-1 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                  <div
                    className={`h-full rounded-full ${statusColor === 'emerald' ? 'bg-emerald-500' :
                      statusColor === 'red' ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                    style={{ width: `${Math.min((challenge.stats.currentProfit / challenge.rules.profitTarget) * 100, 100)}%` }}
                  />
                </div>
              </button>
            );
            })}
          </div>
        ) : (
          <div className={`rounded-xl border px-4 py-5 text-sm ${isDark ? 'border-white/10 bg-white/5 text-gray-400' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
            No pinned challenges yet. Pin up to 4 accounts from the header account selector.
          </div>
        )}
      </div>

      {/* Account Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card - Account Details */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Platform ID</p>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedChallenge.accountId}</p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Platform</p>
              <p className={`font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {selectedChallenge.platform}
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Challenge Type</p>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {challengeTypes[selectedChallenge.type]?.name}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Server</p>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedChallenge.server}</p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Start Date</p>
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedChallenge.createdAt}</p>
            </div>
            {selectedChallenge.phase === 'funded' && selectedChallenge.profitSplit && (
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Profit Split</p>
                <p className="font-semibold text-emerald-500">{selectedChallenge.profitSplit}% to You</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Card - Balance & Status */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Account Size</p>
              <p className={`font-semibold text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                ${selectedChallenge.accountSize.toLocaleString()}
              </p>
            </div>
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Current Balance</p>
              <p className={`font-semibold text-xl ${profitAmount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                ${selectedChallenge.currentBalance.toLocaleString()}
              </p>
            </div>
            <div className="col-span-2 mt-4">
              <p className={`text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Trading Days</p>
              <div className="flex items-center gap-3">
                <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-slate-200'}`}>
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-600 rounded-full"
                    style={{ width: `${Math.min((selectedChallenge.tradingDays.current / selectedChallenge.tradingDays.required) * 100, 100)}%` }}
                  />
                </div>
                <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {selectedChallenge.tradingDays.current}/{selectedChallenge.tradingDays.required}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Compliance Dashboard */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Challenge Rules Compliance</h3>
          {selectedChallenge.status === 'failed' && (
            <span className="px-3 py-1 bg-red-500/10 text-red-500 text-sm font-medium rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Challenge Failed
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ComplianceIndicator
            label="Profit Target"
            data={compliance.profitTarget}
            icon={Target}
            type="progress"
            isDark={isDark}
          />
          <ComplianceIndicator
            label="Daily Loss"
            data={compliance.dailyLoss}
            icon={TrendingDown}
            type="limit"
            isDark={isDark}
          />
          <ComplianceIndicator
            label="Max Drawdown"
            data={compliance.totalDrawdown}
            icon={Activity}
            type="limit"
            isDark={isDark}
          />
          <ComplianceIndicator
            label="Trading Days"
            data={compliance.tradingDays}
            icon={Clock}
            type="days"
            isDark={isDark}
          />
        </div>
      </div>

      {/* Phase Progression */}
      <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
        <h3 className={`font-bold text-lg mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Challenge Progress</h3>
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {phases.map((phase, index) => (
            <React.Fragment key={phase.id}>
              <div className={`flex flex-col items-center min-w-[100px] ${phase.status === 'active' ? 'text-emerald-500' :
                phase.status === 'completed' ? 'text-emerald-500' :
                  isDark ? 'text-gray-500' : 'text-slate-400'
                }`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg mb-2 ${phase.status === 'active'
                  ? 'bg-emerald-500 text-white'
                  : phase.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : isDark ? 'bg-white/5 text-gray-500' : 'bg-slate-100 text-slate-400'
                  }`}>
                  {phase.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : phase.id}
                </div>
                <p className={`font-semibold text-sm whitespace-nowrap ${phase.status === 'active' || phase.status === 'completed' ? '' : isDark ? 'text-gray-400' : 'text-slate-500'
                  }`}>{phase.name}</p>
                <p className={`text-xs whitespace-nowrap ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{phase.description}</p>
              </div>
              {index < phases.length - 1 && (
                <ArrowRight className={`w-6 h-6 mx-2 flex-shrink-0 ${phase.status === 'active' || phase.status === 'completed' ? 'text-emerald-500' : isDark ? 'text-gray-600' : 'text-slate-300'
                  }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Balance Chart */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Balance</h3>
            <div className={`flex items-center gap-2 ${profitPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {profitPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-semibold">{profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%</span>
            </div>
          </div>

          {/* Simple SVG Chart */}
          <div className="relative h-48">
            <svg viewBox="0 0 400 150" className="w-full h-full">
              <defs>
                <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={profitPercent >= 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={profitPercent >= 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"} stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 1, 2, 3].map((i) => (
                <line key={i} x1="0" y1={i * 50} x2="400" y2={i * 50} stroke={isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="1" />
              ))}

              {/* Area */}
              <path
                d={`M 0 150 ${chartData.map((d, i) => `L ${(i / (chartData.length - 1)) * 400} ${150 - ((d.value - selectedChallenge.accountSize * 0.9) / (selectedChallenge.accountSize * 0.2)) * 150}`).join(' ')} L 400 150 Z`}
                fill="url(#chartGradient)"
              />

              {/* Line */}
              <path
                d={`M ${chartData.map((d, i) => `${(i / (chartData.length - 1)) * 400} ${150 - ((d.value - selectedChallenge.accountSize * 0.9) / (selectedChallenge.accountSize * 0.2)) * 150}`).join(' L ')}`}
                fill="none"
                stroke={profitPercent >= 0 ? "rgb(16, 185, 129)" : "rgb(239, 68, 68)"}
                strokeWidth="2"
              />
            </svg>

            {/* Current Value Badge */}
            <div className={`absolute top-4 right-4 px-3 py-1 rounded-lg text-sm font-bold ${profitPercent >= 0 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
              }`}>
              ${selectedChallenge.currentBalance.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Trade Calendar */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Trade Calendar</h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Click a day to view details</p>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className={`text-center text-xs py-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{day}</div>
            ))}

            {/* Calendar days - clickable */}
            {calendarData.map((day) => (
              <button
                key={day.day}
                onClick={() => day.trades > 0 && setSelectedDay(day)}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${day.trades > 0
                  ? day.profit >= 0
                    ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 cursor-pointer'
                    : 'bg-red-500/20 text-red-500 hover:bg-red-500/30 cursor-pointer'
                  : isDark ? 'bg-white/5 text-gray-600 cursor-default' : 'bg-slate-100 text-slate-400 cursor-default'
                  }`}
              >
                <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{day.day}</span>
                {day.trades > 0 && (
                  <span className="text-[10px] font-bold">
                    {day.profit >= 0 ? '+' : ''}{day.profit.toFixed(0)}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Calendar Footer */}
          <div className={`flex items-center justify-between mt-4 pt-4 border-t text-sm ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
            <div className="flex items-center gap-2">
              <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>Total Trades:</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedChallenge.stats.totalTrades}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>Win Rate:</span>
              <span className="text-emerald-500 font-semibold">{selectedChallenge.stats.winRate}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>Avg RR:</span>
              <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedChallenge.stats.avgRR}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDay && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDay(null)}>
          <div className={`w-full max-w-2xl rounded-2xl border max-h-[80vh] overflow-hidden ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`} onClick={e => e.stopPropagation()}>
            {/* Modal Header */}
            <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <Calendar className={`w-5 h-5 ${isDark ? 'text-amber-500' : 'text-amber-600'}`} />
                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Day {selectedDay.day} - Trading Activity
                </h3>
              </div>
              <button
                onClick={() => setSelectedDay(null)}
                className={`p-2 rounded-lg transition-all ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary Stats */}
            <div className={`p-4 border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Total Trades</p>
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedDay.trades}</p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Day P/L</p>
                  <p className={`text-xl font-bold ${selectedDay.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {selectedDay.profit >= 0 ? '+' : ''}${selectedDay.profit.toFixed(2)}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Win Rate</p>
                  <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedDay.trades > 0 ? `${Math.min(50 + selectedDay.day * 2, 80)}%` : '0%'}
                  </p>
                </div>
              </div>
            </div>

            {/* Orders List */}
            <div className="overflow-y-auto max-h-[400px] p-4">
              <p className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Orders</p>
              {(calendarOrders[selectedDay.day] || []).length > 0 ? (
                <div className="space-y-2">
                  {(calendarOrders[selectedDay.day] || []).map((order) => (
                    <div key={order.id} className={`p-3 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{order.symbol}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold ${order.type === 'buy' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'
                            }`}>
                            {order.type.toUpperCase()}
                          </span>
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{order.lots} lots</span>
                        </div>
                        <span className={`font-bold ${order.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {order.profit >= 0 ? '+' : ''}${order.profit.toFixed(2)}
                        </span>
                      </div>
                      <div className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                        {order.openTime} - {order.closeTime}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                  No detailed order data available for this day
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Current Profit */}
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Current P/L</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${profitAmount >= 0 ? isDark ? 'bg-emerald-500/10' : 'bg-emerald-50' : isDark ? 'bg-red-500/10' : 'bg-red-50'
              }`}>
              {profitAmount >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : <TrendingDown className="w-4 h-4 text-red-500" />}
            </div>
          </div>
          <p className={`text-2xl font-bold mb-1 ${profitAmount >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {profitAmount >= 0 ? '+' : ''}${profitAmount.toLocaleString()}
          </p>
          <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
            {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}% from start
          </p>
        </div>

        {/* Daily Drawdown */}
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Daily Drawdown</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${compliance.dailyLoss.status === 'safe' ? isDark ? 'bg-emerald-500/10' : 'bg-emerald-50' :
              compliance.dailyLoss.status === 'warning' ? isDark ? 'bg-amber-500/10' : 'bg-amber-50' :
                isDark ? 'bg-red-500/10' : 'bg-red-50'
              }`}>
              {compliance.dailyLoss.status === 'safe' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                compliance.dailyLoss.status === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                  <AlertCircle className="w-4 h-4 text-red-500" />}
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedChallenge.stats.currentDailyLoss.toFixed(2)}%</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Current</p>
            </div>
            <div>
              <p className={`text-lg font-semibold ${isDark ? 'text-gray-400' : 'text-slate-400'}`}>{selectedChallenge.rules.maxDailyLoss}%</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Max</p>
            </div>
          </div>
        </div>

        {/* Total Drawdown */}
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Total Drawdown</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${compliance.totalDrawdown.status === 'safe' ? isDark ? 'bg-emerald-500/10' : 'bg-emerald-50' :
              compliance.totalDrawdown.status === 'warning' ? isDark ? 'bg-amber-500/10' : 'bg-amber-50' :
                isDark ? 'bg-red-500/10' : 'bg-red-50'
              }`}>
              {compliance.totalDrawdown.status === 'safe' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                compliance.totalDrawdown.status === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-500" /> :
                  <AlertCircle className="w-4 h-4 text-red-500" />}
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <div>
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedChallenge.stats.currentDrawdown.toFixed(2)}%</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Current</p>
            </div>
            <div>
              <p className={`text-lg font-semibold ${isDark ? 'text-gray-400' : 'text-slate-400'}`}>{selectedChallenge.rules.maxTotalDrawdown}%</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Max</p>
            </div>
          </div>
        </div>

        {/* Profit Target */}
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Profit Target</p>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
              <Target className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <div className="flex items-baseline gap-4">
            <div>
              <p className={`text-2xl font-bold ${compliance.profitTarget.status === 'passed' ? 'text-emerald-500' : isDark ? 'text-white' : 'text-slate-900'
                }`}>{selectedChallenge.stats.currentProfit.toFixed(2)}%</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Current</p>
            </div>
            <div>
              <p className="text-amber-500 text-lg font-semibold">{selectedChallenge.rules.profitTarget}%</p>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Target</p>
            </div>
          </div>
        </div>
      </div>

      {/* Funded Account Payout Section */}
      {selectedChallenge.phase === 'funded' && selectedChallenge.payoutEligible && (
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Payout Available</h3>
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                You have profits ready to withdraw • {selectedChallenge.profitSplit}% profit split
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Available</p>
                <p className="text-2xl font-bold text-emerald-500">
                  ${((selectedChallenge.currentBalance - selectedChallenge.accountSize) * (selectedChallenge.profitSplit / 100)).toLocaleString()}
                </p>
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl transition-all">
                Request Payout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountOverview;
