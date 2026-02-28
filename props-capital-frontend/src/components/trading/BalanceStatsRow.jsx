import React from 'react';
import { DollarSign, TrendingUp, Activity } from 'lucide-react';
import { useTraderTheme } from '../trader/TraderPanelLayout';

const BalanceStatsRow = ({ balance, equity, floatingPL, profitPercent }) => {
  const { isDark } = useTraderTheme();
  
  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  const stats = [
    {
      id: 'balance',
      icon: DollarSign,
      label: 'Available',
      value: `$${(balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      color: textClass,
    },
    {
      id: 'equity',
      icon: TrendingUp,
      label: 'Equity',
      value: `$${(equity || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}`,
      color: 'text-emerald-500',
    },
    {
      id: 'floatingPL',
      icon: Activity,
      label: 'Floating P/L',
      value: `${floatingPL >= 0 ? '+' : ''}${(floatingPL || 0).toFixed(2)}`,
      color: floatingPL >= 0 ? 'text-emerald-500' : 'text-red-500',
      iconColor: floatingPL >= 0 ? 'text-emerald-500' : 'text-red-500',
    },
    {
      id: 'profitPercent',
      icon: TrendingUp,
      label: 'Profit %',
      value: `${profitPercent >= 0 ? '+' : ''}${(profitPercent || 0).toFixed(2)}%`,
      color: profitPercent >= 0 ? 'text-emerald-500' : 'text-red-500',
      iconColor: profitPercent >= 0 ? 'text-emerald-500' : 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
      {stats.map((stat) => (
        <div key={stat.id} className={cardClass + ' p-3 sm:p-4'}>
          <div className="flex items-center gap-2 mb-1 sm:mb-2">
            <stat.icon 
              className={`w-3 h-3 sm:w-4 sm:h-4 ${stat.iconColor || (isDark ? 'text-gray-500' : 'text-slate-400')}`} 
            />
            <span className={`text-xs sm:text-sm ${mutedClass}`}>{stat.label}</span>
          </div>
          <p className={`text-base sm:text-xl font-bold font-mono ${stat.color}`}>
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default BalanceStatsRow;
