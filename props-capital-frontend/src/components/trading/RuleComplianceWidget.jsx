import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  X,
  Clock,
  AlertTriangle,
  Shield,
  Target,
  Calendar,
  Newspaper,
  Moon,
  Bot
} from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';

export default function RuleComplianceWidget({ account }) {
  const { t } = useTranslation();
  const rules = [
    {
      id: 'profit_target',
      label: t('accountDetails.ruleCompliance.profitTarget'),
      icon: Target,
      value: `${account.current_profit_percent?.toFixed(2)}%`,
      limit: `${account.profit_target}%`,
      status: account.current_profit_percent >= account.profit_target ? 'completed' : 'pending',
      description: t('accountDetails.ruleCompliance.reachProfitTarget')
    },
    {
      id: 'daily_dd',
      label: t('accountDetails.ruleCompliance.dailyDrawdown'),
      icon: Shield,
      value: `${account.daily_drawdown_percent?.toFixed(2)}%`,
      limit: `${account.max_daily_dd}%`,
      status: account.daily_drawdown_percent > account.max_daily_dd ? 'violated' :
        account.daily_drawdown_percent > (account.max_daily_dd * 0.8) ? 'warning' : 'ok',
      description: t('accountDetails.ruleCompliance.maxDailyLoss')
    },
    {
      id: 'overall_dd',
      label: t('accountDetails.ruleCompliance.overallDrawdown'),
      icon: AlertTriangle,
      value: `${account.overall_drawdown_percent?.toFixed(2)}%`,
      limit: `${account.max_overall_dd}%`,
      status: account.overall_drawdown_percent > account.max_overall_dd ? 'violated' :
        account.overall_drawdown_percent > (account.max_overall_dd * 0.8) ? 'warning' : 'ok',
      description: t('accountDetails.ruleCompliance.maxTotalLoss')
    },
    {
      id: 'trading_days',
      label: t('accountDetails.ruleCompliance.minTradingDays'),
      icon: Calendar,
      value: `${account.trading_days_count} ${t('accountDetails.days')}`,
      limit: `${account.min_trading_days} ${t('accountDetails.days')}`,
      status: account.trading_days_count >= account.min_trading_days ? 'completed' : 'pending',
      description: t('accountDetails.ruleCompliance.minRequiredDays')
    },
    {
      id: 'news_trading',
      label: t('accountDetails.ruleCompliance.newsTrading'),
      icon: Newspaper,
      value: account.news_trading_allowed ? t('accountDetails.ruleCompliance.allowed') : t('accountDetails.ruleCompliance.notAllowed'),
      limit: account.news_trading_allowed ? t('accountDetails.ruleCompliance.allowed') : t('accountDetails.ruleCompliance.notAllowed'),
      status: 'ok',
      description: t('accountDetails.ruleCompliance.tradingDuringNews')
    },
    {
      id: 'weekend_holding',
      label: t('accountDetails.ruleCompliance.weekendHolding'),
      icon: Moon,
      value: account.weekend_holding_allowed ? t('accountDetails.ruleCompliance.allowed') : t('accountDetails.ruleCompliance.notAllowed'),
      limit: account.weekend_holding_allowed ? t('accountDetails.ruleCompliance.allowed') : t('accountDetails.ruleCompliance.notAllowed'),
      status: 'ok',
      description: t('accountDetails.ruleCompliance.holdingOverWeekend')
    },
    {
      id: 'ea_trading',
      label: t('accountDetails.ruleCompliance.expertAdvisors'),
      icon: Bot,
      value: account.ea_allowed ? t('accountDetails.ruleCompliance.allowed') : t('accountDetails.ruleCompliance.notAllowed'),
      limit: account.ea_allowed ? t('accountDetails.ruleCompliance.allowed') : t('accountDetails.ruleCompliance.notAllowed'),
      status: 'ok',
      description: t('accountDetails.ruleCompliance.automatedTrading')
    }
  ];

  const getStatusIcon = (status) => {
    switch (status) {
      case 'ok':
      case 'completed':
        return <Check className="w-4 h-4 text-emerald-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'violated':
        return <X className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'ok':
      case 'completed':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'violated':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      default:
        return 'bg-slate-800/50 border-slate-700 text-slate-400';
    }
  };

  const violations = rules.filter(r => r.status === 'violated');
  const warnings = rules.filter(r => r.status === 'warning');
  const completed = rules.filter(r => r.status === 'completed' || r.status === 'ok');

  return (
    <Card className="bg-slate-900 border-slate-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          {t('accountDetails.ruleCompliance.title')}
        </h3>
        <div className="flex items-center gap-2">
          {violations.length > 0 && (
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
              {violations.length} {violations.length > 1 ? t('accountDetails.ruleCompliance.violations') : t('accountDetails.ruleCompliance.violation')}
            </Badge>
          )}
          {warnings.length > 0 && (
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
              {warnings.length} {warnings.length > 1 ? t('accountDetails.ruleCompliance.warnings') : t('accountDetails.ruleCompliance.warning')}
            </Badge>
          )}
          {violations.length === 0 && warnings.length === 0 && (
            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
              {t('accountDetails.ruleCompliance.allClear')}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`p-4 rounded-lg border transition-all hover:scale-[1.02] ${getStatusStyle(rule.status)}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <rule.icon className="w-4 h-4" />
                <span className="font-medium text-white">{rule.label}</span>
              </div>
              {getStatusIcon(rule.status)}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-lg font-bold">{rule.value}</span>
              <span className="text-xs opacity-60">{t('accountDetails.ruleCompliance.limit')}: {rule.limit}</span>
            </div>
            <p className="text-xs opacity-60 mt-1">{rule.description}</p>
          </div>
        ))}
      </div>

      {/* Violation Alert */}
      {violations.length > 0 && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <X className="w-5 h-5 text-red-400" />
            <span className="font-semibold text-red-400">{t('accountDetails.ruleCompliance.violationDetected')}</span>
          </div>
          <p className="text-sm text-slate-300">
            {t('accountDetails.ruleCompliance.violationMessage')}
          </p>
        </div>
      )}
    </Card>
  );
}