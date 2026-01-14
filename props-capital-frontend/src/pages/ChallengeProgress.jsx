import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery } from '@tanstack/react-query';
import { getAccountById, getUserAccounts } from '@/api/accounts';
import { getCurrentUser } from '@/api/auth';
import { getPayoutStatistics } from '@/api/payouts';
import { useTranslation } from '../contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  ChevronRight,
  ArrowRight,
  Lock,
  Unlock,
  DollarSign,
  Calendar,
  Shield,
  Star
} from 'lucide-react';

export default function ChallengeProgress() {
  const { t } = useTranslation();
  const [accountId, setAccountId] = useState(null);
  const navigate = useNavigate();

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
      // If no ID in URL but user has accounts, use the first one
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Load account details using enriched TradingAccountDetails
  const { data: account, isLoading, error } = useQuery({
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

  // Get payout statistics for profit split and payout cycle
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

  // Show loading state only when actually loading accounts
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

  // Show empty state if user has no accounts
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

  // Show loading state when loading account details (but we have accounts)
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
  const initialBalance = account.initialBalance || challenge.accountSize || 0;
  const profitPercent = account.profitPercent || 0;
  const tradingDaysCount = account.tradingDaysCount || 0;
  const dailyDrawdownPercent = account.dailyDrawdownPercent || 0;
  const overallDrawdownPercent = account.overallDrawdownPercent || 0;
  const phase1Target = challenge.phase1TargetPercent || 8;
  const phase2Target = challenge.phase2TargetPercent || 5;
  const maxDailyDD = challenge.dailyDrawdownPercent || 5;
  const maxOverallDD = challenge.overallDrawdownPercent || 10;
  const minTradingDays = challenge.minTradingDays || 4;
  const accountNumber = account.brokerLogin || account.id?.slice(0, 8) || 'N/A';
  const platform = account.platform || challenge.platform || 'MT5';
  const startDate = account.createdAt;

  const phases = [
    {
      id: 'purchase',
      name: t('challengeProgress.purchase'),
      icon: ShoppingCart,
      status: 'completed',
      description: t('challengeProgress.purchaseDesc'),
      details: `$${initialBalance?.toLocaleString()} ${platform} ${t('challengeProgress.challenge')}`,
      date: startDate
    },
    {
      id: 'phase1',
      name: t('challengeProgress.phase1'),
      icon: Target,
      status: currentPhase === 'phase1' ? 'active' :
        ['phase2', 'funded'].includes(currentPhase) ? 'completed' : 'pending',
      description: t('challengeProgress.reachTarget', { target: `${phase1Target}%` }),
      requirements: [
        { label: t('challengeProgress.profitTarget'), value: `${phase1Target}%`, current: `${profitPercent?.toFixed(2)}%`, met: profitPercent >= phase1Target },
        { label: t('challengeProgress.minTradingDays'), value: `${minTradingDays}`, current: tradingDaysCount, met: tradingDaysCount >= minTradingDays },
        { label: t('challengeProgress.maxDailyDD'), value: `${maxDailyDD}%`, current: `${dailyDrawdownPercent?.toFixed(2)}%`, met: dailyDrawdownPercent <= maxDailyDD },
        { label: t('challengeProgress.maxOverallDD'), value: `${maxOverallDD}%`, current: `${overallDrawdownPercent?.toFixed(2)}%`, met: overallDrawdownPercent <= maxOverallDD },
      ]
    },
    {
      id: 'phase2',
      name: t('challengeProgress.phase2'),
      icon: Award,
      status: currentPhase === 'phase2' ? 'active' :
        currentPhase === 'funded' ? 'completed' : 'locked',
      description: t('challengeProgress.reachTarget', { target: `${phase2Target}%` }),
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
      name: t('challengeProgress.funded'),
      icon: TrendingUp,
      status: currentPhase === 'funded' ? 'active' : 'locked',
      description: t('challengeProgress.fundedDesc'),
      details: t('challengeProgress.profitSplit80')
    },
    {
      id: 'scaling',
      name: t('challengeProgress.scaling'),
      icon: Zap,
      status: 'locked',
      description: t('challengeProgress.scalingDesc'),
      details: t('challengeProgress.profitSplit90')
    }
  ];

  const currentPhaseIndex = phases.findIndex(p => p.status === 'active');
  const progressPercent = ((currentPhaseIndex + 1) / phases.length) * 100;

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500';
      case 'active': return 'bg-cyan-500';
      case 'locked': return 'bg-slate-600';
      default: return 'bg-slate-600';
    }
  };

  const getStatusBorder = (status) => {
    switch (status) {
      case 'completed': return 'border-emerald-500';
      case 'active': return 'border-cyan-500 ring-4 ring-cyan-500/20';
      case 'locked': return 'border-slate-600';
      default: return 'border-slate-600';
    }
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
                        className="text-white
                          hover:text-white
                          focus:text-white
                          data-[highlighted]:text-white
                          data-[state=checked]:text-white
                          hover:bg-slate-700
                          focus:bg-slate-700">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">${accInitialBalance?.toLocaleString()}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400 text-xs">{accPlatform}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs text-emerald-400">{phaseTranslations[accPhase] || accPhase}</span>
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

      {/* Account Summary */}
      <Card className="bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-4">
            <ProgressRing
              progress={Math.max(0, Math.min((profitPercent / phase1Target) * 100, 100))}
              value={profitPercent}
              size={80}
              strokeWidth={6}
              color={profitPercent >= phase1Target ? '#10b981' : '#06b6d4'}
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-sm sm:text-xl font-bold text-white">${initialBalance?.toLocaleString()} {t('challengeProgress.challenge')}</h2>
                <StatusBadge status={currentPhase}  />
              </div>
              <p className="text-slate-400">{t('challengeProgress.account')} #{accountNumber} • {platform}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-base sm:text-2xl font-bold text-emerald-400">+{profitPercent?.toFixed(2)}%</p>
              <p className="text-sm text-slate-400">{t('challengeProgress.profit')}</p>
            </div>
            <div className="text-center">
              <p className="text-base sm:text-2xl font-bold text-white">{tradingDaysCount}</p>
              <p className="text-sm text-slate-400">{t('challengeProgress.tradingDays')}</p>
            </div>
            <div className="text-center">
              <p className="text-base sm:text-2xl font-bold text-amber-400">{dailyDrawdownPercent?.toFixed(1)}%</p>
              <p className="text-sm text-slate-400">{t('challengeProgress.dailyDDUsed')}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Progress Timeline */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">{t('challengeProgress.yourJourney')}</h3>

        {/* Progress Bar */}
        <div className="relative mb-8">
          <div className="h-2 bg-slate-800 rounded-full">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {phases.map((phase, index) => (
              <div
                key={phase.id}
                className="flex flex-col items-center"
                style={{ width: `${100 / phases.length}%` }}
              >
                <div className={`w-4 h-4 rounded-full ${getStatusColor(phase.status)} -mt-3 border-2 border-slate-900`} />
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {phases.map((phase, index) => (
            <div
              key={phase.id}
              className={`relative rounded-xl border-2 p-2 sm:p-4 transition-all ${getStatusBorder(phase.status)} ${phase.status === 'active' ? 'bg-cyan-500/5' :
                phase.status === 'completed' ? 'bg-emerald-500/5' : 'bg-slate-800/50'
                }`}
            >
              {/* Status Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${phase.status === 'completed' ? 'bg-emerald-500/20' :
                phase.status === 'active' ? 'bg-cyan-500/20' : 'bg-slate-700'
                }`}>
                {phase.status === 'completed' ? (
                  <Check className="w-6 h-6 text-emerald-400" />
                ) : phase.status === 'locked' ? (
                  <Lock className="w-6 h-6 text-slate-500" />
                ) : (
                  <phase.icon className={`w-6 h-6 ${phase.status === 'active' ? 'text-cyan-400' : 'text-slate-400'}`} />
                )}
              </div>

              <h4 className={`font-semibold mb-1 ${phase.status === 'locked' ? 'text-slate-500' : 'text-white'
                }`}>{phase.name}</h4>

              <p className={`text-xs sm:text-sm mb-3 ${phase.status === 'locked' ? 'text-slate-600' : 'text-slate-400'
                }`}>{phase.description}</p>

              {phase.details && (
                <Badge className={
                  'text-[10px] ' +  ( phase.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                    phase.status === 'active' ? 'bg-cyan-500/20 text-cyan-400' :
                      'bg-slate-700 text-slate-500')
                }>
                  {phase.details}
                </Badge>
              )}

              {/* Connector */}
              {index < phases.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                  <ChevronRight className={`w-4 h-4 ${phase.status === 'completed' ? 'text-emerald-500' : 'text-slate-600'
                    }`} />
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Current Phase Requirements */}
      {phases.find(p => p.status === 'active')?.requirements && (
        <Card className="bg-slate-900 border-slate-800 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            {t('challengeProgress.currentPhaseRequirements')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {phases.find(p => p.status === 'active')?.requirements.map((req, i) => (
              <div
                key={i}
                className={`p-4 rounded-lg border ${req.met ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
                  }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">{req.label}</span>
                  <div className="flex items-center gap-2">
                    {req.met ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
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
              if (frequency === 'bi-weekly' || frequency === 'biweekly') {
                return '14';
              } else if (frequency === 'weekly') {
                return '7';
              } else if (frequency === 'monthly') {
                return '30';
              }
              // Default to bi-weekly if frequency is not recognized
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
            <Button variant="outline" className="border-slate-700 bg-slate-800/50 text-white  w-full">
              {t('challengeProgress.viewTradingRules')}
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}