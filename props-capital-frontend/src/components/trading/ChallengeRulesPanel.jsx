import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '../../contexts/LanguageContext';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Shield,
  Clock,
  Calendar,
  TrendingUp,
  Ban,
  Newspaper,
  Bot,
  Scale,
  Layers
} from 'lucide-react';

export default function ChallengeRulesPanel({ account, challenge }) {
  const { t } = useTranslation();
  // Force component to track account changes with local state
  const [metrics, setMetrics] = useState({
    profitPercent: 0,
    dailyLoss: 0,
    overallDrawdown: 0,
    profitProgress: 0,
    dailyLossProgress: 0,
    overallDrawdownProgress: 0
  });

  // Update metrics whenever account changes
  useEffect(() => {
    if (!account) return;

    const profitPercent = parseFloat(account.profitPercent) || 0;
    const dailyLoss = parseFloat(account.dailyDrawdown) || 0;
    const overallDrawdown = parseFloat(account.overallDrawdown) || 0;

    const profitTarget = parseFloat(challenge?.phase1_profit_target || account.profitTarget || 10);
    const maxDailyLoss = parseFloat(challenge?.max_daily_drawdown || account.maxDailyDrawdown || 5);
    const maxOverallDrawdown = parseFloat(challenge?.max_overall_drawdown || account.maxOverallDrawdown || 10);

    // Calculate profit progress - ensure it's always >= 0 and handles negative profits correctly
    const profitProgress = profitTarget > 0
      ? Math.max(0, Math.min(100, (profitPercent / profitTarget) * 100))
      : 0;
    const dailyLossProgress = Math.min(100, (dailyLoss / maxDailyLoss) * 100);

    // Overall drawdown bar: 0% if profit, increases with loss
    // If in profit (overallDrawdown is 0 or negative), bar = 0%
    // If in loss, bar = (loss / max loss) * 100
    const overallDrawdownProgress = overallDrawdown > 0
      ? Math.min(100, (overallDrawdown / maxOverallDrawdown) * 100)
      : 0;

    setMetrics({
      profitPercent,
      dailyLoss,
      overallDrawdown,
      profitProgress,
      dailyLossProgress,
      overallDrawdownProgress
    });
  }, [account?.profitPercent, account?.dailyDrawdown, account?.overallDrawdown, account?.equity, account?.balance, account, challenge]);

  if (!account) {
    return null;
  }

  const profitTarget = parseFloat(challenge?.phase1_profit_target || account.profitTarget || 10);
  const maxDailyLoss = parseFloat(challenge?.max_daily_drawdown || account.maxDailyDrawdown || 5);
  const maxOverallDrawdown = parseFloat(challenge?.max_overall_drawdown || account.maxOverallDrawdown || 10);

  const tradingDays = parseInt(account.tradingDays) || 0;
  const minTradingDays = parseInt(challenge?.min_trading_days || challenge?.minTradingDays || account.minTradingDays || 5);
  const daysElapsed = parseInt(account.daysElapsed) || 0;
  const maxDays = parseInt(challenge?.max_trading_days || 30);

  const daysRemaining = Math.max(0, maxDays - daysElapsed);

  const { profitPercent, dailyLoss, overallDrawdown, profitProgress, dailyLossProgress, overallDrawdownProgress } = metrics;

  return (
    <Card className="bg-slate-900 border-slate-800 p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-emerald-400" />
        {t('dashboard.rulesPanel.title')}
      </h3>

      <div className="space-y-4 mb-6">
        {/* Profit Target */}
        <div className={`p-4 rounded-lg border ${profitPercent >= profitTarget ? 'bg-emerald-500/10 border-emerald-500/30' :
            profitPercent >= profitTarget * 0.7 ? 'bg-amber-500/10 border-amber-500/30' :
              profitPercent < 0 ? 'bg-red-500/10 border-red-500/30' :
                'bg-slate-800/50 border-slate-700'
          }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {profitPercent >= profitTarget ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                profitPercent >= profitTarget * 0.7 ? <TrendingUp className="w-4 h-4 text-amber-400" /> :
                  profitPercent < 0 ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                    <Target className="w-4 h-4 text-slate-400" />}
              <span className="text-white font-medium">{t('dashboard.rulesPanel.profitTarget')}</span>
            </div>
            <Badge className={
              profitPercent >= profitTarget ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 pointer-events-none' :
                profitPercent >= profitTarget * 0.7 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 pointer-events-none' :
                  profitPercent < 0 ? 'bg-red-500/20 text-red-400 border-red-500/30 pointer-events-none' :
                    'bg-slate-500/20 text-slate-400 border-slate-500/30 pointer-events-none'
                   
            }>
              {profitPercent >= profitTarget ? t('dashboard.rulesPanel.status.reached') : profitPercent < 0 ? t('dashboard.rulesPanel.status.loss') : `${profitProgress.toFixed(0)}%`}
            </Badge>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={
                profitPercent >= profitTarget ? 'h-full bg-emerald-500' :
                  profitPercent >= profitTarget * 0.7 ? 'h-full bg-amber-500' :
                    profitPercent > 0 ? 'h-full bg-emerald-500' :
                      'h-full bg-red-500'
              }
              style={{
                width: `${profitProgress}%`,
                transition: 'width 0.8s ease-out'
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className={
              profitPercent >= profitTarget ? 'text-emerald-400 font-medium' :
                profitPercent >= profitTarget * 0.7 ? 'text-amber-400 font-medium' :
                  profitPercent < 0 ? 'text-red-400 font-medium' :
                    'text-slate-400'
            }>
              {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
            </span>
            <span className="text-slate-400">{t('dashboard.rulesPanel.target')}: {profitTarget}%</span>
          </div>
        </div>

        {/* Daily Loss Limit */}
        <div className={`p-4 rounded-lg border ${dailyLoss >= maxDailyLoss ? 'bg-red-500/10 border-red-500/30' :
            dailyLossProgress >= 80 ? 'bg-red-500/10 border-red-500/30' :
              dailyLossProgress >= 50 ? 'bg-amber-500/10 border-amber-500/30' :
                'bg-emerald-500/10 border-emerald-500/30'
          }`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {dailyLoss >= maxDailyLoss ? <XCircle className="w-4 h-4 text-red-400" /> :
                dailyLossProgress >= 80 ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                  dailyLossProgress >= 50 ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                    <CheckCircle className="w-4 h-4 text-emerald-400" />}
              <span className="text-white font-medium">{t('dashboard.rulesPanel.dailyLossLimit')}</span>
            </div>
            <Badge className={
              dailyLoss >= maxDailyLoss ? 'bg-red-500/20 text-red-400 border-red-500/30 pointer-events-none' :
                dailyLossProgress >= 80 ? 'bg-red-500/20 text-red-400 border-red-500/30 pointer-events-none' :
                  dailyLossProgress >= 50 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 pointer-events-none' :
                    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 pointer-events-none'
            }>
              {dailyLoss >= maxDailyLoss ? t('dashboard.rulesPanel.status.violated') :
                dailyLossProgress >= 80 ? t('dashboard.rulesPanel.status.danger') :
                  dailyLossProgress >= 50 ? t('dashboard.rulesPanel.status.warning') : t('dashboard.rulesPanel.status.safe')}
            </Badge>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={
                dailyLoss >= maxDailyLoss || dailyLossProgress >= 80 ? 'h-full bg-red-500' :
                  dailyLossProgress >= 50 ? 'h-full bg-amber-500' :
                    'h-full bg-emerald-500'
              }
              style={{
                width: `${dailyLossProgress}%`,
                transition: 'width 0.8s ease-out'
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className={
              dailyLoss >= maxDailyLoss || dailyLossProgress >= 80 ? 'text-red-400 font-medium' :
                dailyLossProgress >= 50 ? 'text-amber-400 font-medium' :
                  'text-emerald-400 font-medium'
            }>
              {dailyLoss.toFixed(2)}%
            </span>
            <span className="text-slate-400">{t('dashboard.rulesPanel.limit')}: {maxDailyLoss}%</span>
          </div>
        </div>

        {/* Overall Drawdown */}
        <div className={`p-4 rounded-lg border ${overallDrawdown >= maxOverallDrawdown ? 'bg-red-500/10 border-red-500/30' :
            overallDrawdownProgress >= 80 ? 'bg-red-500/10 border-red-500/30' :
              overallDrawdownProgress >= 50 ? 'bg-amber-500/10 border-amber-500/30' :
                'bg-emerald-500/10 border-emerald-500/30'
          }`}>
            
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {overallDrawdown >= maxOverallDrawdown ? <XCircle className="w-4 h-4 text-red-400" /> :
                overallDrawdownProgress >= 80 ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                  overallDrawdownProgress >= 50 ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                    <CheckCircle className="w-4 h-4 text-emerald-400" />}
              <span className="text-white font-medium">{t('dashboard.rulesPanel.overallDrawdown')}</span>
            </div>
            <Badge className={
              
              overallDrawdown >= maxOverallDrawdown ? 'bg-red-500/20 text-red-400 border-red-500/30 border-none pointer-events-none ' :
                overallDrawdownProgress >= 80 ? 'bg-red-500/20 text-red-400 border-red-500/30 border-none pointer-events-none ' :
                  overallDrawdownProgress >= 50 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 border-none pointer-events-none' :
                    'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 pointer-events-none'
            }>
              {overallDrawdown >= maxOverallDrawdown ? t('dashboard.rulesPanel.status.violated') :
                overallDrawdownProgress >= 80 ? t('dashboard.rulesPanel.status.danger') :
                  overallDrawdownProgress >= 50 ? t('dashboard.rulesPanel.status.warning') : t('dashboard.rulesPanel.status.safe')}
            </Badge>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={
                overallDrawdown >= maxOverallDrawdown || overallDrawdownProgress >= 80 ? 'h-full bg-red-500' :
                  overallDrawdownProgress >= 50 ? 'h-full bg-amber-500' :
                    'h-full bg-emerald-500'
              }
              style={{
                width: `${overallDrawdownProgress}%`,
                transition: 'width 0.8s ease-out'
              }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs">
            <span className={
              overallDrawdown >= maxOverallDrawdown || overallDrawdownProgress >= 80 ? 'text-red-400 font-medium' :
                overallDrawdownProgress >= 50 ? 'text-amber-400 font-medium' :
                  'text-emerald-400 font-medium'
            }>
              {overallDrawdown.toFixed(2)}%
            </span>
            <span className="text-slate-400">{t('dashboard.rulesPanel.max')}: {maxOverallDrawdown}%</span>
          </div>
        </div>

        {/* Trading Days */}
        <div className="grid grid-cols-2 gap-4">
          <div className={`p-4 rounded-lg border ${tradingDays >= minTradingDays ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-slate-700'
            }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm">{t('dashboard.rulesPanel.minTradingDays')}</span>
              {tradingDays >= minTradingDays ?
                <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                <Clock className="w-4 h-4 text-slate-400" />
              }
            </div>
            <p className="text-2xl font-bold text-white">
              {tradingDays} / {minTradingDays}
            </p>
          </div>

          <div className={`p-4 rounded-lg border ${daysRemaining === 0 ? 'bg-red-500/10 border-red-500/30' :
              daysRemaining <= 5 ? 'bg-amber-500/10 border-amber-500/30' :
                'bg-slate-800/50 border-slate-700'
            }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-300 text-sm">{t('dashboard.rulesPanel.daysRemaining')}</span>
              {daysRemaining === 0 ? <XCircle className="w-4 h-4 text-red-400" /> :
                daysRemaining <= 5 ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                  <CheckCircle className="w-4 h-4 text-emerald-400" />}
            </div>
            <p className={`text-2xl font-bold ${daysRemaining === 0 ? 'text-red-400' :
                daysRemaining <= 5 ? 'text-amber-400' :
                  'text-emerald-400'
              }`}>
              {daysRemaining}
            </p>
          </div>
        </div>
      </div>

      {/* Trading Rules */}
      <div>
        <h4 className="text-sm font-medium text-slate-400 mb-3">{t('dashboard.rulesPanel.tradingStyleRules')}</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {[
            { name: t('dashboard.rulesPanel.newsTrading'), allowed: challenge?.news_trading_allowed !== false, icon: Newspaper },
            { name: t('dashboard.rulesPanel.weekendHolding'), allowed: challenge?.weekend_holding_allowed !== false, icon: Calendar },
            { name: t('dashboard.rulesPanel.expertAdvisors'), allowed: challenge?.ea_allowed !== false, icon: Bot },
            { name: t('dashboard.rulesPanel.hedging'), allowed: true, icon: Scale },
            { name: t('dashboard.rulesPanel.copyTrading'), allowed: false, icon: Layers },
          ].map((rule, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg flex items-center gap-2 ${rule.allowed
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-red-500/10 border border-red-500/30'
                }`}
            >
              <rule.icon className={`w-4 h-4 ${rule.allowed ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className={`text-xs ${rule.allowed ? 'text-emerald-400' : 'text-red-400'}`}>
                {rule.name}
              </span>
              {rule.allowed ?
                <CheckCircle className="w-3 h-3 text-emerald-400 ml-auto" /> :
                <Ban className="w-3 h-3 text-red-400 ml-auto" />
              }
            </div>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs text-slate-400">{t('dashboard.rulesPanel.leverage')}</p>
            <p className="text-white font-semibold">1:100</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">{t('dashboard.rulesPanel.maxLot', { max: t('dashboard.rulesPanel.max'), lot: t('dashboard.rulesPanel.lot') })}</p>
            <p className="text-white font-semibold">10.00</p>
          </div>
          <div>
            <p className="text-xs text-slate-400">{t('dashboard.rulesPanel.profitSplit')}</p>
            <p className="text-emerald-400 font-semibold">80%</p>
          </div>
        </div>
      </div>
    </Card>
  );
}