import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '../../contexts/LanguageContext';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Clock,
  BarChart2,
  Percent,
  Activity,
  Zap
} from 'lucide-react';

export default function PerformanceMetrics({ metrics }) {
  const { t } = useTranslation();
  const {
    totalTrades = 0,
    winningTrades = 0,
    losingTrades = 0,
    winRate = 0,
    profitFactor = 0,
    avgWin = 0,
    avgLoss = 0,
    bestTrade = 0,
    worstTrade = 0,
    avgRR = 0,
    avgHoldingTime = '0h 0m',
    largestPosition = 0,
    avgPosition = 0,
    sharpeRatio = 0,
    maxConsecutiveWins = 0,
    maxConsecutiveLosses = 0
  } = metrics || {};

  const stats = [
    {
      label: t('analytics.totalTrades'),
      value: totalTrades,
      icon: Activity,
      color: 'text-slate-300'
    },
    {
      label: t('analytics.winRate'),
      value: `${winRate.toFixed(1)}%`,
      icon: Target,
      color: winRate >= 50 ? 'text-emerald-400' : winRate > 0 ? 'text-red-400' : 'text-slate-400',
      progress: winRate
    },
    {
      label: t('analytics.profitFactor'),
      value: profitFactor > 0 
        ? profitFactor.toFixed(2)
        : losingTrades === 0 && winningTrades > 0
        ? '∞'
        : '0.00',
      icon: TrendingUp,
      color: profitFactor >= 1 || (losingTrades === 0 && winningTrades > 0) 
        ? 'text-emerald-400' 
        : profitFactor > 0 
        ? 'text-red-400' 
        : 'text-slate-400'
    },
    {
      label: t('analytics.avgWin'),
      value: `$${avgWin.toFixed(2)}`,
      icon: TrendingUp,
      color: avgWin > 0 ? 'text-emerald-400' : 'text-slate-400'
    },
    {
      label: t('analytics.avgLoss'),
      value: `$${Math.abs(avgLoss).toFixed(2)}`,
      icon: TrendingDown,
      color: avgLoss < 0 ? 'text-red-400' : 'text-slate-400'
    },
    {
      label: t('analytics.bestTrade'),
      value: `$${bestTrade.toFixed(2)}`,
      icon: Award,
      color: bestTrade > 0 ? 'text-emerald-400' : 'text-slate-400'
    },
    {
      label: t('analytics.worstTrade'),
      value: `$${worstTrade.toFixed(2)}`,
      icon: Award,
      color: worstTrade < 0 ? 'text-red-400' : 'text-slate-400'
    },
    {
      label: t('analytics.avgRR'),
      value: avgRR > 0 ? avgRR.toFixed(2) : '0.00',
      icon: BarChart2,
      color: avgRR >= 1 ? 'text-emerald-400' : avgRR > 0 ? 'text-amber-400' : 'text-slate-400'
    },
    {
      label: t('analytics.avgHolding'),
      value: avgHoldingTime,
      icon: Clock,
      color: 'text-slate-300'
    },
    {
      label: t('analytics.maxPosition'),
      value: `${largestPosition.toFixed(2)} ${t('analytics.lots')}`,
      icon: Zap,
      color: 'text-slate-300'
    },
    {
      label: t('analytics.sharpeRatio'),
      value: sharpeRatio > 0 ? sharpeRatio.toFixed(2) : '0.00',
      icon: Percent,
      color: sharpeRatio >= 1 ? 'text-emerald-400' : sharpeRatio > 0 ? 'text-amber-400' : 'text-slate-400'
    },
    {
      label: t('analytics.avgPosition'),
      value: `${avgPosition.toFixed(2)} ${t('analytics.lots')}`,
      icon: Activity,
      color: 'text-slate-300'
    }
  ];

  return (
    <Card className="bg-slate-900 border-slate-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{t('analytics.performanceMetrics')}</h3>

      {/* Win/Loss Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-emerald-400">{winningTrades} {t('analytics.wins')}</span>
          <span className="text-red-400">{losingTrades} {t('analytics.losses')}</span>
        </div>
        {totalTrades > 0 ? (
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden flex">
            {winningTrades > 0 && (
              <div 
                className="h-full bg-emerald-500"
                style={{ width: `${(winningTrades / totalTrades) * 100}%` }}
              />
            )}
            {losingTrades > 0 && (
              <div 
                className="h-full bg-red-500"
                style={{ width: `${(losingTrades / totalTrades) * 100}%` }}
              />
            )}
          </div>
        ) : (
          <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full w-0" />
          </div>
        )}
      </div>

      {/* Streaks */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
          <p className="text-xs text-emerald-400 mb-1">{t('analytics.maxWinStreak')}</p>
          <p className="text-xl font-bold text-emerald-400">{maxConsecutiveWins}</p>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-xs text-red-400 mb-1">{t('analytics.maxLossStreak')}</p>
          <p className="text-xl font-bold text-red-400">{maxConsecutiveLosses}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <stat.icon className={`w-3 h-3 ${stat.color}`} />
              <span className="text-xs text-slate-400">{stat.label}</span>
            </div>
            <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
            {stat.progress !== undefined && (
              <Progress value={stat.progress} className="h-1 mt-2" />
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}