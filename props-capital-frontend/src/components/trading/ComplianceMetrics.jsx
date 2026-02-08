import React from 'react';
import { Target, AlertTriangle, Shield } from 'lucide-react';
import { useTraderTheme } from '../trader/TraderPanelLayout';

const ComplianceMetrics = ({ compliance, challenge }) => {
  const { isDark } = useTraderTheme();
  
  if (!compliance || !challenge) return null;

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  const metrics = [
    {
      id: 'profitTarget',
      icon: Target,
      label: 'Profit Target',
      current: compliance.profitTarget?.current || 0,
      target: compliance.profitTarget?.target || challenge.rules?.profitTarget || 0,
      percentage: compliance.profitTarget?.percentage || 0,
      status: compliance.profitTarget?.status || 'in-progress',
      color: 'amber',
      suffix: '%',
    },
    {
      id: 'dailyLoss',
      icon: AlertTriangle,
      label: 'Daily Loss Limit',
      current: compliance.dailyLoss?.current || 0,
      target: compliance.dailyLoss?.limit || challenge.rules?.maxDailyLoss || 5,
      percentage: compliance.dailyLoss?.percentage || 0,
      status: compliance.dailyLoss?.status || 'safe',
      color: 'emerald',
      suffix: '%',
    },
    {
      id: 'totalDrawdown',
      icon: Shield,
      label: 'Overall Drawdown',
      current: compliance.totalDrawdown?.current || 0,
      target: compliance.totalDrawdown?.limit || challenge.rules?.maxTotalDrawdown || 10,
      percentage: compliance.totalDrawdown?.percentage || 0,
      status: compliance.totalDrawdown?.status || 'safe',
      color: 'emerald',
      suffix: '%',
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'emerald';
      case 'warning':
        return 'amber';
      case 'violated':
        return 'red';
      case 'safe':
        return 'emerald';
      case 'in-progress':
      default:
        return 'blue';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'passed':
        return 'PASSED';
      case 'warning':
        return 'WARNING';
      case 'violated':
        return 'VIOLATED';
      case 'safe':
        return 'SAFE';
      case 'in-progress':
      default:
        return 'IN PROGRESS';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-4">
      {metrics.map((metric) => {
        const statusColor = getStatusColor(metric.status);
        const statusLabel = getStatusLabel(metric.status);

        return (
          <div key={metric.id} className={cardClass + ' p-3 sm:p-4'}>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2">
                <metric.icon className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                <span className={`text-xs sm:text-sm font-medium ${textClass}`}>{metric.label}</span>
              </div>
              <span
                className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-lg bg-${statusColor}-500/20 text-${statusColor}-500`}
              >
                {statusLabel}
              </span>
            </div>

            {/* Progress bar */}
            <div className={`h-2 rounded-full overflow-hidden mb-2 ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
              <div
                className={`h-full rounded-full transition-all bg-${metric.color}-500`}
                style={{ width: `${Math.min(metric.percentage, 100)}%` }}
              />
            </div>

            <div className="flex items-end justify-between">
              <div>
                <span className={`text-lg sm:text-2xl font-bold font-mono ${textClass}`}>
                  {metric.current.toFixed(2)}{metric.suffix}
                </span>
                <span className={`text-xs sm:text-sm ${mutedClass}`}> / {metric.target}{metric.suffix}</span>
              </div>
              <span className={`text-xs sm:text-sm font-medium ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                {metric.percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ComplianceMetrics;
