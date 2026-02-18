import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Activity,
  ArrowRight,
  Shield,
  Zap,
  Award,
  AlertCircle,
  Check
} from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';
import { useChallenges, challengeTypes } from '@/contexts/ChallengesContext';
import { usePlatformTokensStore } from '@/lib/stores/platform-tokens.store';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/auth';
import { getAnalytics } from '@/api/accounts';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import { dayjs } from '@/lib/utils';

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

  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
  });

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analytics', user?.userId, selectedChallenge?.id],
    queryFn: () => getAnalytics(user.userId, selectedChallenge.accountId),
    enabled: !!user?.userId && !!selectedChallenge?.accountId,
  });

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

  const compliance = getRuleCompliance(selectedChallenge);
  const profitAmount = selectedChallenge.currentBalance - selectedChallenge.accountSize;
  const profitPercent = (profitAmount / selectedChallenge.accountSize) * 100;

  const equityCurveData = analytics?.equityCurve || [];

  // Build calendar grid for current month from dailyPnL API data
  const now = dayjs();
  const daysInMonth = now.daysInMonth();
  const currentMonthStr = now.format('MMM'); // e.g. "Feb"
  const pnlByDay = {};
  (analytics?.dailyPnL || []).forEach(({ date, pnl }) => {
    // date format: "Feb 18" — only include entries for current month
    const [mon, dayStr] = date.split(' ');
    if (mon === currentMonthStr) {
      pnlByDay[parseInt(dayStr, 10)] = pnl;
    }
  });
  const calendarData = Array.from({ length: daysInMonth }, (_, i) => {
    const day = i + 1;
    const profit = pnlByDay[day] ?? 0;
    return { day, profit, trades: profit !== 0 ? 1 : 0 };
  });
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
                  #{challenge.accountId?.slice(0, 4)} • {challenge.platform}
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
              <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{selectedChallenge.accountId?.slice(0, 4)}</p>
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
        <div className={`rounded-2xl border p-6 flex flex-col ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Balance</h3>
            <div className={`flex items-center gap-2 ${profitPercent >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {profitPercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-semibold">{profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%</span>
            </div>
          </div>

          {isLoadingAnalytics ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : equityCurveData.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>No equity data yet</p>
            </div>
          ) : (
            <div className="relative h-48">
              {/* Current balance badge */}
              <div className="absolute top-2 right-2 z-10 px-3 py-1 rounded-lg text-sm font-bold bg-emerald-500/20 text-emerald-500">
                ${Math.floor(selectedChallenge.currentBalance).toLocaleString()}
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={equityCurveData} margin={{ top: 40, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ backgroundColor: isDark ? '#1a1f2e' : '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: isDark ? '#9ca3af' : '#64748b' }}
                    itemStyle={{ color: '#fff' }}
                    formatter={(value, name) => [`$${Number(value).toLocaleString()}`, name === 'balance' ? 'Balance' : 'Equity']}
                  />
                  <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={2} fill="url(#balanceGrad)" dot={false} />
                  <Area type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2} fill="url(#equityGrad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Trade Calendar */}
        <div className={`rounded-2xl border p-6 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>Trade Calendar</h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{dayjs().format('MMMM YYYY')}</p>
          </div>

          {/* Calendar Grid */}
          {isLoadingAnalytics ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
            </div>
          ) : (
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className={`text-center text-xs py-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{day}</div>
            ))}

            {/* Offset empty cells so day 1 lands on the correct weekday */}
            {Array.from({ length: (dayjs().startOf('month').day() + 6) % 7 }).map((_, i) => (
              <div key={`offset-${i}`} />
            ))}

            {/* Calendar days */}
            {calendarData.map((day) => (
              <div
                key={day.day}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium ${day.trades > 0
                  ? day.profit >= 0
                    ? 'bg-emerald-500/20 text-emerald-500'
                    : 'bg-red-500/20 text-red-500'
                  : isDark ? 'bg-white/5 text-gray-600' : 'bg-slate-100 text-slate-400'
                  }`}
              >
                <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{day.day}</span>
                {day.trades > 0 && (
                  <span className="text-[10px] font-bold">
                    {day.profit >= 0 ? '+' : ''}{day.profit.toFixed(0)}
                  </span>
                )}
              </div>
            ))}
          </div>
          )}

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
