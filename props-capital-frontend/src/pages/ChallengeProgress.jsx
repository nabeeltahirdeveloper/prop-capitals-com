import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { getAccountById, getUserAccounts } from '@/api/accounts';
import { getCurrentUser } from '@/api/auth';
import { getPayoutStatistics } from '@/api/payouts';
import { useTranslation } from '../contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatusBadge from '../components/shared/StatusBadge';
import ProgressRing from '../components/shared/ProgressRing';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ShoppingCart,
  Target,
  Award,
  TrendingUp,
  Zap,
  Check,
  Clock,
  ArrowRight,
  Lock,
  DollarSign,
  Calendar,
  Shield,
  Star,
  X,
  ChevronRight
} from 'lucide-react';

export default function ChallengeProgress() {
  const { t } = useTranslation();
  const [accountId, setAccountId] = useState(null);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
  });

  // Get user's accounts
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
    retry: false,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('id');

    if (idFromUrl) {
      setAccountId(idFromUrl);
    } else if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Load account details
  const { data: account, isLoading } = useQuery({
    queryKey: ['account-details', accountId],
    queryFn: async () => {
      if (!accountId) return null;
      try {
        return await getAccountById(accountId);
      } catch (error) {
        console.error('Failed to fetch account details:', error);
        return null;
      }
    },
    enabled: !!accountId,
    retry: false,
  });

  // Get payout statistics
  const { data: payoutStats } = useQuery({
    queryKey: ['payout-statistics', user?.userId, accountId],
    queryFn: async () => {
      if (!user?.userId || !accountId) return null;
      try {
        return await getPayoutStatistics(user.userId, accountId);
      } catch (error) {
        console.error('Failed to fetch payout statistics:', error);
        return null;
      }
    },
    enabled: !!user?.userId && !!accountId,
    retry: false,
  });

  // Loading state
  if (accountsLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 w-full bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
              <Target className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{t('challengeProgress.title')}</h1>
              <p className="text-slate-400">{t('challengeProgress.subtitle')}</p>
            </div>
          </div>
        </div>
        <Card className="bg-slate-900 border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">{t('accountDetails.noAccounts')}</h3>
          <p className="text-slate-400 mb-6">{t('challengeProgress.noAccountsDesc') || 'Purchase a challenge to start tracking your progress.'}</p>
          <Link to={createPageUrl('TraderBuyChallenge')}>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500">
              {t('accountDetails.purchaseChallenge')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // Loading account details
  if (isLoading || !account) {
    return (
      <div className="space-y-6">
        <div className="h-32 w-full bg-slate-800 rounded-lg animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Map backend phase enum to frontend format
  const phaseMap = {
    'PHASE1': 'phase1',
    'PHASE2': 'phase2',
    'FUNDED': 'funded',
    'FAILED': 'failed'
  };
  const currentPhase = phaseMap[account.phase] || account.phase?.toLowerCase() || 'phase1';

  const challenge = account.challenge || {};
  const challengeName = challenge.name || `$${(account.initialBalance || challenge.accountSize || 0).toLocaleString()} Challenge`;
  const initialBalance = account.initialBalance || challenge.accountSize || 0;
  const profitPercent = account.profitPercent ?? 0;
  const tradingDaysCount = account.tradingDaysCount ?? 0;
  const dailyDrawdownPercent = account.dailyDrawdownPercent ?? 0;
  const overallDrawdownPercent = account.overallDrawdownPercent ?? 0;
  const phase1Target = challenge.phase1TargetPercent || 8;
  const phase2Target = challenge.phase2TargetPercent || 5;
  const maxDailyDD = challenge.dailyDrawdownPercent || 5;
  const maxOverallDD = challenge.overallDrawdownPercent || 10;
  const minTradingDays = challenge.minTradingDays || 4;
  const accountNumber = account.brokerLogin || account.id?.slice(0, 8) || 'N/A';
  const platform = account.platform || challenge.platform || 'MT5';
  const startDate = account.createdAt;
  const lastViolationMessage = account.lastViolationMessage;

  // Determine the current profit target based on phase
  const currentProfitTarget = currentPhase === 'phase2' ? phase2Target : phase1Target;

  const phases = [
    {
      id: 'purchase',
      name: t('challengeProgress.purchase') || 'Purchase',
      icon: ShoppingCart,
      status: 'completed',
      description: t('challengeProgress.purchaseDesc') || 'Challenge purchased',
      badge: `$${initialBalance?.toLocaleString()} ${platform} Challenge`,
    },
    {
      id: 'phase1',
      name: t('challengeProgress.phase1') || 'Phase 1',
      icon: Target,
      status: currentPhase === 'phase1' ? 'active' :
        ['phase2', 'funded'].includes(currentPhase) ? 'completed' :
        currentPhase === 'failed' ? 'failed' : 'pending',
      description: `${phase1Target}% profit target`,
      badge: null,
      requirements: currentPhase === 'phase1' || currentPhase === 'failed' ? [
        { label: t('challengeProgress.profitTarget'), value: `${phase1Target}%`, current: `${profitPercent?.toFixed(2)}%`, met: profitPercent >= phase1Target },
        { label: t('challengeProgress.minTradingDays'), value: `${minTradingDays}`, current: tradingDaysCount, met: tradingDaysCount >= minTradingDays },
        { label: t('challengeProgress.maxDailyDD'), value: `${maxDailyDD}%`, current: `${dailyDrawdownPercent?.toFixed(2)}%`, met: dailyDrawdownPercent <= maxDailyDD },
        { label: t('challengeProgress.maxOverallDD'), value: `${maxOverallDD}%`, current: `${overallDrawdownPercent?.toFixed(2)}%`, met: overallDrawdownPercent <= maxOverallDD },
      ] : [
        { label: t('challengeProgress.profitTarget'), value: `${phase1Target}%`, current: t('challengeProgress.passed') || 'Passed', met: true },
        { label: t('challengeProgress.minTradingDays'), value: `${minTradingDays}`, current: t('challengeProgress.passed') || 'Passed', met: true },
        { label: t('challengeProgress.maxDailyDD'), value: `${maxDailyDD}%`, current: t('challengeProgress.passed') || 'Passed', met: true },
        { label: t('challengeProgress.maxOverallDD'), value: `${maxOverallDD}%`, current: t('challengeProgress.passed') || 'Passed', met: true },
      ]
    },
    {
      id: 'phase2',
      name: t('challengeProgress.phase2') || 'Phase 2',
      icon: Award,
      status: currentPhase === 'phase2' ? 'active' :
        currentPhase === 'funded' ? 'completed' : 'locked',
      description: `${phase2Target}% profit target`,
      badge: null,
      requirements: currentPhase === 'phase2' || currentPhase === 'funded' ? [
        { label: t('challengeProgress.profitTarget'), value: `${phase2Target}%`, current: `${profitPercent?.toFixed(2)}%`, met: profitPercent >= phase2Target },
        { label: t('challengeProgress.minTradingDays'), value: `${minTradingDays}`, current: tradingDaysCount, met: tradingDaysCount >= minTradingDays },
        { label: t('challengeProgress.maxDailyDD'), value: `${maxDailyDD}%`, current: `${dailyDrawdownPercent?.toFixed(2)}%`, met: dailyDrawdownPercent <= maxDailyDD },
        { label: t('challengeProgress.maxOverallDD'), value: `${maxOverallDD}%`, current: `${overallDrawdownPercent?.toFixed(2)}%`, met: overallDrawdownPercent <= maxOverallDD },
      ] : [
        { label: t('challengeProgress.profitTarget'), value: `${phase2Target}%`, current: '-', met: false },
        { label: t('challengeProgress.minTradingDays'), value: `${minTradingDays}`, current: '-', met: false },
        { label: t('challengeProgress.maxDailyDD'), value: `${maxDailyDD}%`, current: '-', met: false },
        { label: t('challengeProgress.maxOverallDD'), value: `${maxOverallDD}%`, current: '-', met: false },
      ]
    },
    {
      id: 'funded',
      name: t('challengeProgress.funded') || 'Funded',
      icon: TrendingUp,
      status: currentPhase === 'funded' ? 'active' : 'locked',
      description: t('challengeProgress.fundedDesc') || 'Trade with our capital',
      badge: '80% profit split',
    },
    {
      id: 'scaling',
      name: t('challengeProgress.scaling') || 'Scaling',
      icon: Zap,
      status: 'locked',
      description: t('challengeProgress.scalingDesc') || 'Grow to $2,000,000',
      badge: 'Up to 90% profit split',
    }
  ];

  // Calculate progress for the journey bar
  const getPhaseProgress = () => {
    const phaseOrder = ['purchase', 'phase1', 'phase2', 'funded', 'scaling'];
    const currentIdx = phaseOrder.indexOf(currentPhase === 'failed' ? 'phase1' : currentPhase);
    if (currentIdx === -1) return 20;
    // Each phase is 20% (5 phases)
    return Math.min((currentIdx + 1) * 20, 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
            <Target className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{t('challengeProgress.title')}</h1>
            <p className="text-slate-400">{t('challengeProgress.subtitle')}</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <Select value={accountId || ''} onValueChange={(value) => {
            setAccountId(value);
            window.history.replaceState({}, '', `${window.location.pathname}?id=${value}`);
          }}>
            <SelectTrigger className="w-full sm:w-[280px] bg-slate-900 border-slate-800 text-white">
              <SelectValue placeholder={t('challengeProgress.selectAccount')} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white [&>svg]:text-white">
              {accounts.map((acc) => {
                const accChallenge = acc.challenge || {};
                const accInitialBalance = acc.initialBalance || accChallenge.accountSize || 0;
                const accPhaseMap = {
                  'PHASE1': 'phase1',
                  'PHASE2': 'phase2',
                  'FUNDED': 'funded',
                  'FAILED': 'failed'
                };
                const accPhase = accPhaseMap[acc.phase] || acc.phase?.toLowerCase() || 'phase1';
                const accPlatform = acc.platform || accChallenge.platform || 'MT5';
                const phaseTranslations = {
                  'phase1': t('challengeProgress.phase1'),
                  'phase2': t('challengeProgress.phase2'),
                  'funded': t('challengeProgress.funded'),
                  'failed': t('challengeProgress.failed')
                };
                return (
                  <SelectItem key={acc.id} value={acc.id}
                    className="text-white hover:text-white focus:text-white data-[highlighted]:text-white data-[state=checked]:text-white hover:bg-slate-700 focus:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">${accInitialBalance?.toLocaleString()}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400 text-xs">{accPlatform}</span>
                      <span className="text-slate-400">•</span>
                      <span className={`text-xs ${accPhase === 'failed' ? 'text-red-400' : 'text-emerald-400'}`}>
                        {phaseTranslations[accPhase] || accPhase}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {account?.id && (
            <Link to={`${createPageUrl('AccountDetails')}?id=${account.id}`} className="w-full sm:w-auto">
              <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 w-full">
                {t('challengeProgress.viewTradingDashboard')}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Failed Account Alert */}
      {currentPhase === 'failed' && (
        <Card className="bg-red-500/10 border-red-500/30 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <X className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-red-400 font-semibold mb-1">{t('challengeProgress.challengeFailed') || 'Challenge Failed'}</h3>
              <p className="text-slate-400 text-sm">
                {lastViolationMessage || t('challengeProgress.failedDescription') || 'This challenge has been disqualified due to a rule violation.'}
              </p>
              <Link to={createPageUrl('TraderBuyChallenge')} className="inline-block mt-3">
                <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500">
                  {t('challengeProgress.startNewChallenge') || 'Start New Challenge'}
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      )}

      {/* Account Summary Card */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border-slate-700 overflow-hidden">
        <div className="p-6">
          {/* Challenge Name & Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-4">
              <ProgressRing
                progress={Math.max(0, Math.min((profitPercent / currentProfitTarget) * 100, 100))}
                value={profitPercent}
                size={64}
                strokeWidth={5}
                color={profitPercent < 0 ? '#ef4444' : profitPercent >= currentProfitTarget ? '#10b981' : '#06b6d4'}
                textColor={profitPercent < 0 ? '#f87171' : undefined}
              />
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{challengeName}</h2>
                <p className="text-slate-400 text-sm">
                  Account #{accountNumber} • {platform}
                </p>
              </div>
            </div>
            <StatusBadge status={currentPhase} />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Profit */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Profit</p>
              <p className={`text-2xl font-bold ${profitPercent >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {profitPercent >= 0 ? '+' : ''}{profitPercent?.toFixed(2)}%
              </p>
              <p className="text-xs text-slate-500">Target: {currentProfitTarget}%</p>
            </div>

            {/* Trading Days */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Trading Days</p>
              <p className="text-2xl font-bold text-white">{tradingDaysCount}</p>
              <p className="text-xs text-slate-500">Min: {minTradingDays} days</p>
            </div>

            {/* Daily DD */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Daily DD</p>
              <p className={`text-2xl font-bold ${dailyDrawdownPercent > maxDailyDD * 0.8 ? 'text-amber-400' : 'text-white'}`}>
                {dailyDrawdownPercent?.toFixed(2)}%
              </p>
              <p className="text-xs text-slate-500">Max: {maxDailyDD}%</p>
            </div>

            {/* Overall DD */}
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Overall DD</p>
              <p className={`text-2xl font-bold ${overallDrawdownPercent > maxOverallDD * 0.8 ? 'text-amber-400' : 'text-white'}`}>
                {overallDrawdownPercent?.toFixed(2)}%
              </p>
              <p className="text-xs text-slate-500">Max: {maxOverallDD}%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Your Journey */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-8">{t('challengeProgress.yourJourney') || 'Your Journey'}</h3>

        {/* Journey Steps */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {phases.map((phase) => {
            const isCompleted = phase.status === 'completed';
            const isActive = phase.status === 'active';
            const isFailed = phase.status === 'failed';
            const isLocked = phase.status === 'locked';

            return (
              <div
                key={phase.id}
                className={`relative rounded-xl border-2 p-4 transition-all ${
                  isCompleted ? 'border-emerald-500/50 bg-emerald-500/5' :
                  isActive ? 'border-cyan-500 bg-cyan-500/5 ring-2 ring-cyan-500/20' :
                  isFailed ? 'border-red-500/50 bg-red-500/5' :
                  'border-slate-700 bg-slate-800/30'
                }`}
              >
                {/* Step Icon */}
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${
                    isCompleted ? 'bg-emerald-500/20' :
                    isActive ? 'bg-cyan-500/20' :
                    isFailed ? 'bg-red-500/20' :
                    'bg-slate-700/50'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 text-emerald-400" />
                  ) : isFailed ? (
                    <X className="w-5 h-5 text-red-400" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4 text-slate-500" />
                  ) : (
                    <phase.icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  )}
                </div>

                {/* Step Name */}
                <h4 className={`font-semibold text-sm mb-1 ${
                  isCompleted ? 'text-emerald-400' :
                  isActive ? 'text-cyan-400' :
                  isFailed ? 'text-red-400' :
                  'text-slate-500'
                }`}>
                  {phase.name}
                </h4>

                {/* Step Description */}
                <p className={`text-xs mb-3 ${isLocked ? 'text-slate-600' : 'text-slate-400'}`}>
                  {phase.description}
                </p>

                {/* Badge */}
                {phase.badge && (
                  <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                    isCompleted ? 'bg-emerald-500/20 text-emerald-400' :
                    isActive ? 'bg-cyan-500/20 text-cyan-400' :
                    'bg-slate-700/50 text-slate-400'
                  }`}>
                    {phase.badge}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400">Progress</span>
            <span className="text-xs text-slate-400">{getPhaseProgress()}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all duration-500"
              style={{ width: `${getPhaseProgress()}%` }}
            />
          </div>
        </div>
      </Card>

      {/* Current Phase Requirements */}
      {phases.find(p => p.status === 'active')?.requirements && (
        <Card className="bg-slate-900 border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            {t('challengeProgress.currentPhaseRequirements')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {phases.find(p => p.status === 'active')?.requirements.map((req, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all ${
                  req.met
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-slate-800/50 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">{req.label}</span>
                  {req.met ? (
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-emerald-400" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-amber-400" />
                    </div>
                  )}
                </div>
                <div className="flex items-baseline justify-between">
                  <span className={`text-xl font-bold ${req.met ? 'text-emerald-400' : 'text-white'}`}>
                    {req.current}
                  </span>
                  <span className="text-sm text-slate-500">/ {req.value}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Rewards Preview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold">{t('challengeProgress.profitSplit')}</h4>
              <p className="text-sm text-slate-400">{t('challengeProgress.whenFunded')}</p>
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-400">{payoutStats?.settings?.profitSplit?.base || 80}%</p>
          <p className="text-sm text-slate-400 mt-1">{t('challengeProgress.upTo90WithScaling')}</p>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold">{t('challengeProgress.payoutCycle')}</h4>
              <p className="text-sm text-slate-400">{t('challengeProgress.biWeeklyPayouts')}</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-purple-400">
            {(() => {
              const frequency = payoutStats?.settings?.frequency?.toLowerCase();
              if (frequency === 'bi-weekly' || frequency === 'biweekly') return '14';
              if (frequency === 'weekly') return '7';
              if (frequency === 'monthly') return '30';
              return '14';
            })()} {t('challengeProgress.days')}
          </p>
          <p className="text-sm text-slate-400 mt-1">{t('challengeProgress.processedWithin24h')}</p>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-500/30 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h4 className="text-white font-semibold">{t('challengeProgress.scaleTo')}</h4>
              <p className="text-sm text-slate-400">{t('challengeProgress.maximumAccountSize')}</p>
            </div>
          </div>
          <p className="text-3xl font-bold text-amber-400">$2M</p>
          <p className="text-sm text-slate-400 mt-1">{t('challengeProgress.scalingLevels')}</p>
        </Card>
      </div>

      {/* CTA */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30 p-6 text-center">
        <h3 className="text-xl font-bold text-white mb-2">{t('challengeProgress.readyToStart')}</h3>
        <p className="text-slate-400 mb-4">{t('challengeProgress.readyToStartDesc')}</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          {account?.id && (
            <Link to={`${createPageUrl('AccountDetails')}?id=${account.id}`} className="w-full sm:w-auto">
              <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 w-full">
                {t('challengeProgress.viewTradingDashboard')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
          <Link to={createPageUrl('Rules')} className="w-full sm:w-auto">
            <Button variant="outline" className="border-slate-700 bg-slate-800/50 text-white w-full">
              {t('challengeProgress.viewTradingRules')}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
