import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { getCurrentUser } from '@/api/auth';
import { getUserAccounts } from '@/api/accounts';
import { getUserNotifications, markNotificationAsRead } from '@/api/notifications';
import { getUserPayouts, getPayoutStatistics } from '@/api/payouts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import StatsCard from '../components/shared/StatsCard';
import StatusBadge from '../components/shared/StatusBadge';
import ChallengeRulesPanel from '../components/trading/ChallengeRulesPanel';
import {
  TrendingUp,
  Wallet,
  Target,
  Shield,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle,
  Plus,
  BarChart3,
  Calendar,
  Bell,
  Award,
  Zap,
  Eye,
  DollarSign,
  Activity,
  AlertCircle,
  ChevronRight,
  Rocket,
  FileText,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { enUS, th } from 'date-fns/locale';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from '../contexts/LanguageContext';
import { translateNotification } from '../utils/notificationTranslations';

// Helper function to translate violation messages
const translateViolationMessage = (violationReason, t) => {
  if (!violationReason) return '';

  // Parse messages like "Daily drawdown exceeded: 9.99% > 5%"
  // or "Overall drawdown exceeded: 10.5% > 10%"
  const dailyMatch = violationReason.match(/Daily drawdown exceeded:\s*([\d.]+)%\s*>\s*([\d.]+)%/i);
  const overallMatch = violationReason.match(/(?:Overall|Maximum) drawdown exceeded:\s*([\d.]+)%\s*>\s*([\d.]+)%/i);
  const maxDaysMatch = violationReason.match(/Maximum trading days/i);

  if (dailyMatch) {
    return t('dashboard.accounts.violation.dailyDrawdown', {
      actual: dailyMatch[1],
      threshold: dailyMatch[2]
    });
  } else if (overallMatch) {
    return t('dashboard.accounts.violation.overallDrawdown', {
      actual: overallMatch[1],
      threshold: overallMatch[2]
    });
  } else if (maxDaysMatch) {
    return t('dashboard.accounts.violation.maxTradingDays');
  }

  // Fallback to original message if pattern doesn't match
  return violationReason;
};

export default function TraderDashboard() {
  const { t, language } = useTranslation();
  const [selectedAccountForRules, setSelectedAccountForRules] = useState(null);
  const queryClient = useQueryClient();

  // Get date-fns locale based on current language
  const dateLocale = language === 'th' ? th : enUS;

  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['trader-accounts', user?.userId],
    queryFn: async () => {
      if (!user?.userId) return [];
      try {
        return await getUserAccounts(user.userId);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
        return [];
      }
    },
    enabled: !!user?.userId,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchInterval: 60000, // Poll every 60 seconds to reduce server load
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: false,
  });

  // Load notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.userId],
    queryFn: async () => {
      if (!user?.userId) return [];
      try {
        return await getUserNotifications(user.userId);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
      }
    },
    enabled: !!user?.userId,
    retry: false,
    refetchInterval: 30000, // Refetch every 30 seconds to reduce server load
    staleTime: 15000, // Consider data fresh for 15 seconds
  });

  // Mark notification as read mutation with proper optimistic update
  const markAsReadMutation = useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    // Optimistic update BEFORE the mutation runs
    onMutate: async (id) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['notifications', user?.userId] });

      // Snapshot the previous value
      const previousNotifications = queryClient.getQueryData(['notifications', user?.userId]);

      // Optimistically update to the new value
      queryClient.setQueryData(['notifications', user?.userId], (oldData = []) => {
        return oldData.map(n => n.id === id ? { ...n, read: true } : n);
      });

      // Return context with previous value for rollback
      return { previousNotifications };
    },
    onError: (error, id, context) => {
      console.error('Failed to mark notification as read:', error);
      // Rollback to previous value on error
      if (context?.previousNotifications) {
        queryClient.setQueryData(['notifications', user?.userId], context.previousNotifications);
      }
    },
    onSettled: () => {
      // Refetch after error or success to ensure consistency (delayed to avoid flicker)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['notifications', user?.userId] });
      }, 1000);
    },
  });

  // Load payouts
  const { data: payouts = [] } = useQuery({
    queryKey: ['payouts', user?.userId],
    queryFn: async () => {
      if (!user?.userId) return [];
      try {
        return await getUserPayouts(user.userId);
      } catch (error) {
        console.error('Failed to fetch payouts:', error);
        return [];
      }
    },
    enabled: !!user?.userId,
    retry: false,
    staleTime: 60000, // Payouts don't change often, cache for 1 minute
  });

  // Get payout statistics for next payout date
  const { data: payoutStatistics } = useQuery({
    queryKey: ['payout-statistics', user?.userId],
    queryFn: async () => {
      if (!user?.userId) return null;
      try {
        return await getPayoutStatistics(user.userId);
      } catch (error) {
        console.error('Failed to fetch payout statistics:', error);
        return null;
      }
    },
    enabled: !!user?.userId,
    retry: false,
    staleTime: 60000, // Statistics don't change often, cache for 1 minute
  });

  // Map backend accounts to display format
  const displayAccounts = (accounts || []).map(account => {
    const phaseMap = {
      'PHASE1': 'phase1',
      'PHASE2': 'phase2',
      'FUNDED': 'funded',
      'FAILED': 'failed'
    };
    const statusMap = {
      'ACTIVE': 'active',
      'PAUSED': 'paused',
      'CLOSED': 'closed'
    };

    const challenge = account?.challenge || {};
    const initialBalance = Number(account?.initialBalance) || Number(challenge?.accountSize) || 0;
    const balance = Number(account?.balance) || initialBalance;
    const equity = Number(account?.equity) || balance;
    const maxEquityToDate = Number(account?.maxEquityToDate) || initialBalance;

    // Calculate profit percent from initial balance
    const profitPercent = initialBalance > 0 ? ((equity - initialBalance) / initialBalance) * 100 : 0;

    // Calculate overall drawdown from maxEquityToDate (peak equity) - matches backend calculation
    // This is the industry standard: drawdown from highest equity ever reached
    const overallDrawdownPercent = maxEquityToDate > 0 && equity < maxEquityToDate
      ? ((maxEquityToDate - equity) / maxEquityToDate) * 100
      : 0;

    // Calculate daily drawdown from today's start balance
    // If todayStartEquity is available from backend, use it; otherwise fall back to balance
    const todayStartEquity = Number(account?.todayStartEquity) || balance;
    const dailyDrawdownPercent = todayStartEquity > 0 && equity < todayStartEquity
      ? ((todayStartEquity - equity) / todayStartEquity) * 100
      : 0;

    return {
      id: account?.id,
      account_number: account?.brokerLogin || account?.id?.slice(0, 8) || 'N/A',
      platform: account?.platform || challenge?.platform || 'MT5',
      status: statusMap[account?.status] || account?.status?.toLowerCase() || 'active',
      current_phase: phaseMap[account?.phase] || account?.phase?.toLowerCase() || 'phase1',
      initial_balance: initialBalance,
      current_balance: balance,
      current_equity: equity,
      current_profit_percent: profitPercent,
      daily_drawdown_percent: dailyDrawdownPercent,
      overall_drawdown_percent: overallDrawdownPercent,
      trading_days_count: Number(account?.tradingDaysCount) || 0,
      violation_reason: account?.lastViolationMessage,
      challenge_id: account?.challengeId,
      challenge: challenge,
      createdAt: account?.createdAt,
    };
  });

  // Map notifications to display format
  // Show ALL notifications (both read and unread), sorted by date (newest first)
  const allNotifications = (notifications || [])
    .map(notif => {
      const translated = translateNotification(notif.title, notif.body, t);

      // Determine notification type based on content/category
      let type = 'info';
      const titleLower = (notif.title || '').toLowerCase();
      const categoryLower = (notif.category || '').toLowerCase();

      if (titleLower.includes('violation') || titleLower.includes('failed') || titleLower.includes('breach') || categoryLower === 'violation') {
        type = 'warning';
      } else if (titleLower.includes('passed') || titleLower.includes('funded') || titleLower.includes('approved') || titleLower.includes('success') || categoryLower === 'success') {
        type = 'success';
      } else if (titleLower.includes('payout') || categoryLower === 'payout') {
        type = 'success';
      }

      return {
        id: notif.id,
        title: translated.title,
        message: translated.message,
        type: type,
        created_date: notif.createdAt,
        is_read: notif.read || false,
      };
    })
    .sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());

  // Show only 2 latest notifications in dashboard
  const displayNotifications = allNotifications.slice(0, 2);
  const hasMoreNotifications = allNotifications.length > 2;

  const activeAccounts = displayAccounts.filter(a => a.status === 'active' || a.current_phase === 'funded');
  const fundedAccounts = displayAccounts.filter(a => a.current_phase === 'funded');
  const totalPayouts = (payouts || [])
    .filter(p => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  // Calculate aggregated metrics from ALL active accounts
  const aggregatedMetrics = activeAccounts.length > 0 ? (() => {
    // Sum all balances and equity
    const totalBalance = activeAccounts.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
    const totalEquity = activeAccounts.reduce((sum, acc) => sum + (acc.current_equity || 0), 0);
    const totalInitialBalance = activeAccounts.reduce((sum, acc) => sum + (acc.initial_balance || 0), 0);

    // Calculate weighted average profit percentage
    const totalProfit = totalEquity - totalInitialBalance;
    const overallProfitPercent = totalInitialBalance > 0 ? (totalProfit / totalInitialBalance) * 100 : 0;

    // Calculate average daily drawdown (weighted by balance)
    const weightedDailyDD = activeAccounts.reduce((sum, acc) => {
      const weight = acc.current_balance || acc.initial_balance || 0;
      return sum + ((acc.daily_drawdown_percent || 0) * weight);
    }, 0) / (totalBalance || 1);

    // Get max daily drawdown limit (use the most restrictive one)
    const maxDailyDrawdown = Math.min(...activeAccounts.map(acc => acc.challenge?.dailyDrawdownPercent || 5));

    // Calculate DD remaining
    const ddRemaining = Math.max(0, maxDailyDrawdown - weightedDailyDD);

    // Get average trading days and min trading days
    const avgTradingDays = activeAccounts.length > 0
      ? Math.round(activeAccounts.reduce((sum, acc) => sum + (acc.trading_days_count || 0), 0) / activeAccounts.length)
      : 0;
    const minTradingDays = Math.max(...activeAccounts.map(acc => acc.challenge?.minTradingDays || 4));

    return {
      balance: totalBalance,
      equity: totalEquity,
      profitPercent: overallProfitPercent,
      dailyDrawdown: weightedDailyDD,
      ddRemaining: ddRemaining,
      tradingDays: avgTradingDays,
      minTradingDays: minTradingDays,
      accountCount: activeAccounts.length,
    };
  })() : null;

  // Set default selected account for rules panel
  useEffect(() => {
    if (activeAccounts.length > 0 && !selectedAccountForRules) {
      setSelectedAccountForRules(activeAccounts[0].id);
    }
  }, [activeAccounts, selectedAccountForRules]);

  const selectedAccountData = activeAccounts.find(a => a.id === selectedAccountForRules);
  const selectedChallenge = selectedAccountData?.challenge || null;

  if (accountsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full bg-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state for new users
  if (displayAccounts.length === 0) {
    return (
      <div className="space-y-8">
        <Card className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30 p-8 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <img src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=400&fit=crop" alt="" className="w-full h-full object-cover" />
          </div>
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">{t('dashboard.empty.welcome', { name: user?.profile?.firstName || 'Trader' })}</h1>
            <p className="text-slate-300 text-lg mb-6 max-w-xl">
              {t('dashboard.empty.description')}
            </p>
            <Link to={createPageUrl('TraderBuyChallenge')}>
              <Button size="lg" className="bg-gradient-to-r from-emerald-500 to-cyan-500">
                <Rocket className="w-5 h-5 mr-2" />
                {t('dashboard.empty.startChallenge')}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">{t('dashboard.welcome', { name: user?.profile?.firstName || 'Trader' })}</h1>
          <p className="text-slate-400">{t('dashboard.overview')}</p>
        </div>
        <Link to={createPageUrl('TraderBuyChallenge')}>
          <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500">
            <Plus className="w-4 h-4 mr-2" />
            {t('dashboard.newChallenge')}
          </Button>
        </Link>
      </div>

      {/* Account Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard
          title={t('dashboard.stats.totalChallenges')}
          value={displayAccounts.length}
          icon={Award}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatsCard
          title={t('dashboard.stats.activeChallenges')}
          value={activeAccounts.length}
          icon={Activity}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatsCard
          title={t('dashboard.stats.fundedAccounts')}
          value={fundedAccounts.length}
          icon={TrendingUp}
          gradient="from-purple-500 to-pink-500"
        />
        <StatsCard
          title={t('dashboard.stats.totalPayouts')}
          value={`$${totalPayouts.toLocaleString()}`}
          icon={Wallet}
          gradient="from-amber-500 to-orange-500"
        />
      </div>

      {/* Active Trading Accounts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">{t('dashboard.accounts.title')}</h2>
          <Link to={createPageUrl('MyAccounts')}>
            <Button variant="ghost" size="sm" className="text-slate-400">
              {t('dashboard.accounts.viewAll')} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {displayAccounts.slice(0, 3).map((account) => (
            <Card key={account.id} className={`bg-slate-900 border-slate-800 p-4 sm:p-5 hover:border-slate-700 transition-colors ${account.current_phase === 'failed' ? 'opacity-70' : ''}`}>
              <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-white font-semibold text-sm sm:text-base">${account.initial_balance?.toLocaleString()}</span>
                    <Badge variant="default" className="text-xs">{account.platform}</Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-400 truncate">#{account.account_number}</p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <StatusBadge status={account.current_phase} />
                  <StatusBadge status={account.status} />
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3 sm:mb-4">
                <div className="flex justify-between text-xs sm:text-sm mb-1 gap-2">
                  <span className="text-slate-400 truncate">{t('dashboard.accounts.profitProgress')}</span>
                  <span className={`flex-shrink-0 ${account.current_profit_percent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {account.current_profit_percent >= 0 ? '+' : ''}{account.current_profit_percent?.toFixed(2)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  {account.challenge && (
                    <div
                      className={`h-full rounded-full ${account.current_profit_percent >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(Math.abs(account.current_profit_percent) / (account.challenge.phase1TargetPercent || 8) * 100, 100)}%` }}
                    />
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {t('dashboard.accounts.target')}: {account.challenge?.phase1TargetPercent || 8}%
                </p>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <p className="text-xs text-slate-400 truncate">{t('dashboard.accounts.dailyDD')}</p>
                  <p className={`text-sm sm:text-base font-medium ${account.daily_drawdown_percent > (account.challenge?.dailyDrawdownPercent || 5) * 0.8 ? 'text-amber-400' : 'text-white'}`}>
                    {account.daily_drawdown_percent?.toFixed(2)}% / {account.challenge?.dailyDrawdownPercent || 5}%
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <p className="text-xs text-slate-400 truncate">{t('dashboard.accounts.overallDD')}</p>
                  <p className={`text-sm sm:text-base font-medium ${account.overall_drawdown_percent > (account.challenge?.overallDrawdownPercent || 10) * 0.8 ? 'text-red-400' : 'text-white'}`}>
                    {account.overall_drawdown_percent?.toFixed(2)}% / {account.challenge?.overallDrawdownPercent || 10}%
                  </p>
                </div>
              </div>

              {account.current_phase === 'failed' && account.violation_reason && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2 mb-3 sm:mb-4">
                  <p className="text-xs text-red-400 line-clamp-2">{translateViolationMessage(account.violation_reason, t)}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Link to={`${createPageUrl('AccountDetails')}?id=${account.id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full border-slate-700 hover:bg-slate-800 hover:text-white text-xs sm:text-sm">
                    <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                    {t('dashboard.accounts.details')}
                  </Button>
                </Link>
                {account.current_phase !== 'failed' && (
                  <Link to={`${createPageUrl('TradingTerminal')}?accountId=${account.id}`} className="flex-1">
                    <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-xs sm:text-sm">
                      <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                      {t('dashboard.accounts.trade')}
                    </Button>
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Metrics & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Quick Metrics for ALL Active Accounts */}
        {activeAccounts.length > 0 && aggregatedMetrics && (
          <Card className="bg-slate-900 border-slate-800 p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">{t('dashboard.metrics.title')}</h3>
              <Badge className="bg-emerald-500/20 text-emerald-400 text-xs pointer-events-none">
                {aggregatedMetrics.accountCount} {aggregatedMetrics.accountCount === 1 ? t('dashboard.metrics.account') : t('dashboard.metrics.accounts')}
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              <div className="bg-slate-800/50 rounded-xl p-4 text-center flex flex-col justify-between min-h-[120px]">
                <DollarSign className="w-6 h-6 text-emerald-400 mx-auto" />
                <div>
                  <p className="text-lg sm:text-xl font-bold text-white truncate">${aggregatedMetrics.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  <p className="text-xs text-slate-400 mt-1">{t('dashboard.metrics.currentBalance')}</p>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 text-center flex flex-col justify-between min-h-[120px]">
                <Target className="w-6 h-6 text-cyan-400 mx-auto" />
                <div>
                  <p className={`text-lg sm:text-xl font-bold ${aggregatedMetrics.profitPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {aggregatedMetrics.profitPercent >= 0 ? '+' : ''}{aggregatedMetrics.profitPercent.toFixed(2)}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{t('dashboard.metrics.profitThisCycle')}</p>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 text-center flex flex-col justify-between min-h-[120px]">
                <Shield className="w-6 h-6 text-amber-400 mx-auto" />
                <div>
                  <p className="text-lg sm:text-xl font-bold text-white">
                    {aggregatedMetrics.ddRemaining.toFixed(2)}%
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{t('dashboard.metrics.ddRemaining')}</p>
                </div>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-4 text-center flex flex-col justify-between min-h-[120px]">
                <Calendar className="w-6 h-6 text-purple-400 mx-auto" />
                <div>
                  <p className="text-lg sm:text-xl font-bold text-white">
                    {aggregatedMetrics.tradingDays}/{aggregatedMetrics.minTradingDays}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{t('dashboard.metrics.tradingDays')}</p>
                </div>
              </div>
            </div>
            {fundedAccounts.length > 0 && payoutStatistics?.statistics?.nextPayoutDate && (
              <div className="mt-4 p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-400 font-medium">{t('dashboard.metrics.nextPayoutDate')}</p>
                    <p className="text-white text-lg font-bold">
                      {format(new Date(payoutStatistics.statistics.nextPayoutDate), 'MMMM d, yyyy', { locale: dateLocale })}
                    </p>
                  </div>
                  <Link to={createPageUrl('TraderPayouts')}>
                    <Button size="sm" className="bg-purple-500 hover:bg-purple-600">
                      {t('dashboard.metrics.requestPayout')}
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Notifications */}
        <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <Bell className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              {t('dashboard.notifications.title')}
            </h3>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Badge className="bg-slate-700/50 text-slate-300 border-slate-600 pointer-events-none text-xs px-2 py-0.5">
                {notifications.length}
              </Badge>
              {notifications.filter(n => !n.read).length > 0 && (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 pointer-events-none text-xs px-2 py-0.5">
                  {notifications.filter(n => !n.read).length} {t('notifications.unread')}
                </Badge>
              )}
            </div>
          </div>
          <div className="space-y-2.5">
            {displayNotifications.length === 0 ? (
              <div className="text-center text-slate-400 py-4 text-sm">
                {t('dashboard.notifications.noNotifications')}
              </div>
            ) : (
              displayNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border ${notif.type === 'warning' ? 'bg-amber-500/10 border-amber-500/30' :
                    notif.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30' :
                      'bg-slate-800/50 border-slate-700'
                    } ${!notif.is_read ? 'ring-1 ring-emerald-500/30' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {notif.type === 'warning' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                    ) : notif.type === 'success' ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-white text-sm font-medium truncate">{notif.title}</p>
                          {!notif.is_read && (
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0" />
                          )}
                        </div>
                        {!notif.is_read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-slate-400 hover:text-white flex-shrink-0"
                            onClick={() => markAsReadMutation.mutate(notif.id)}
                            title={t('notifications.markAsRead')}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{notif.message}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
            {hasMoreNotifications && (
              <div className="pt-2 border-t border-slate-800 mt-3">
                <Link to={createPageUrl('Notifications')}>
                  <Button
                    variant="outline"
                    className="w-full border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700 hover:text-white text-sm"
                  >
                    {t('dashboard.notifications.seeMore')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Rule Compliance Section */}
      {activeAccounts.length > 0 && (
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h2 className="text-md sm:text-lg font-semibold text-white">{t('dashboard.rules.title')}</h2>
            {activeAccounts.length > 1 && (
              <Select value={selectedAccountForRules} onValueChange={setSelectedAccountForRules}>
                <SelectTrigger className="w-full sm:w-[320px] md:w-[380px] bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder={t('dashboard.rules.selectAccount')} />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white [&>svg]:text-white">
                  {activeAccounts.map((acc) => {
                    const phaseTranslations = {
                      'phase1': t('dashboard.rules.phase1'),
                      'phase2': t('dashboard.rules.phase2'),
                      'funded': t('dashboard.rules.funded'),
                      'failed': t('dashboard.rules.failed')
                    };
                    return (
                      <SelectItem
                        key={acc.id}
                        value={acc.id}
                        className="
                            text-white
                          hover:text-white
                          focus:text-white
                          data-[highlighted]:text-white
                          data-[state=checked]:text-white
                          hover:bg-slate-700
                          focus:bg-slate-700
                        "
                      >
                        <div className="flex items-center gap-1.5 sm:gap-2 text-sm">
                          <span className="font-medium text-white">${acc.initial_balance?.toLocaleString()}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-300">{acc.platform}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-emerald-400">{phaseTranslations[acc.current_phase] || acc.current_phase}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedAccountData && (() => {
            // Calculate days elapsed from account creation using UTC dates to avoid timezone issues
            const accountCreatedAt = selectedAccountData.createdAt;
            let daysElapsed = 0;
            if (accountCreatedAt) {
              const createdDate = new Date(accountCreatedAt);
              const now = new Date();
              // Use UTC dates to avoid timezone inconsistencies
              const createdUTC = Date.UTC(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
              const nowUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
              daysElapsed = Math.floor((nowUTC - createdUTC) / (1000 * 60 * 60 * 24));
            }

            return (
              <ChallengeRulesPanel
                account={{
                  balance: selectedAccountData.current_balance || selectedAccountData.initial_balance,
                  equity: selectedAccountData.current_equity || selectedAccountData.current_balance,
                  profitPercent: selectedAccountData.current_profit_percent || 0,
                  dailyDrawdown: selectedAccountData.daily_drawdown_percent || 0,
                  overallDrawdown: selectedAccountData.overall_drawdown_percent || 0,
                  tradingDays: selectedAccountData.trading_days_count || 0,
                  daysElapsed: daysElapsed,
                  phase: selectedAccountData.current_phase,
                  startingBalance: selectedAccountData.initial_balance,
                  highestBalance: selectedAccountData.current_equity || selectedAccountData.initial_balance,
                  profitTarget: selectedChallenge?.phase1TargetPercent || 10,
                  maxDailyDrawdown: selectedChallenge?.dailyDrawdownPercent || 5,
                  maxOverallDrawdown: selectedChallenge?.overallDrawdownPercent || 10,
                  minTradingDays: selectedChallenge?.minTradingDays || 5,
                }}
                challenge={{
                  phase1_profit_target: selectedChallenge?.phase1TargetPercent || 10,
                  phase2_profit_target: selectedChallenge?.phase2TargetPercent || 5,
                  max_daily_drawdown: selectedChallenge?.dailyDrawdownPercent || 5,
                  max_overall_drawdown: selectedChallenge?.overallDrawdownPercent || 10,
                  min_trading_days: selectedChallenge?.minTradingDays || 5,
                  max_trading_days: selectedChallenge?.maxTradingDays || selectedChallenge?.max_trading_days || 30,
                }}
              />
            );
          })()}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
        {[
          { icon: Activity, title: t('dashboard.quickActions.tradingTerminal'), desc: t('dashboard.quickActions.openTrading'), page: 'TradingTerminal', bgClass: 'bg-blue-500/20', textClass: 'text-blue-400', hoverClass: 'hover:border-blue-500/50' },
          { icon: TrendingUp, title: t('dashboard.quickActions.myAccounts'), desc: t('dashboard.quickActions.viewAllAccounts'), page: 'MyAccounts', bgClass: 'bg-emerald-500/20', textClass: 'text-emerald-400', hoverClass: 'hover:border-emerald-500/50' },
          { icon: BarChart3, title: t('dashboard.quickActions.analytics'), desc: t('dashboard.quickActions.performanceStats'), page: 'Analytics', bgClass: 'bg-cyan-500/20', textClass: 'text-cyan-400', hoverClass: 'hover:border-cyan-500/50' },
          { icon: Wallet, title: t('dashboard.quickActions.payouts'), desc: t('dashboard.quickActions.requestPayouts'), page: 'TraderPayouts', bgClass: 'bg-purple-500/20', textClass: 'text-purple-400', hoverClass: 'hover:border-purple-500/50' },
          { icon: Award, title: t('dashboard.quickActions.scalingPlan'), desc: t('dashboard.quickActions.growthRoadmap'), page: 'ScalingPlan', bgClass: 'bg-amber-500/20', textClass: 'text-amber-400', hoverClass: 'hover:border-amber-500/50' },
        ].map((action, i) => (
          <Link key={i} to={createPageUrl(action.page)} className="h-full">
            <Card className={`bg-slate-900 border-slate-800 p-3 sm:p-4 ${action.hoverClass} transition-colors cursor-pointer group h-full`}>
              <div className="flex items-center gap-3 h-full">
                <div className={`w-10 h-10 ${action.bgClass} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0`}>
                  <action.icon className={`w-5 h-5 ${action.textClass}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm sm:text-base text-white font-medium leading-tight">{action.title}</p>
                  <p className="text-xs text-slate-400 leading-tight">{action.desc}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Additional Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Link to={createPageUrl('ChallengeProgress')}>
          <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30 p-4 hover:border-cyan-500/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{t('dashboard.links.challengeProgress')}</p>
                  <p className="text-xs text-slate-400">{t('dashboard.links.trackJourney')}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </Card>
        </Link>
        <Link to={createPageUrl('TradeHistory')}>
          <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 p-4 hover:border-emerald-500/50 transition-colors cursor-pointer">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-white font-medium">{t('dashboard.links.tradeHistory')}</p>
                  <p className="text-xs text-slate-400">{t('dashboard.links.viewAllTrades')}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}