import React from 'react';
import { Newspaper, Calendar, Bot, GitBranch, Copy } from 'lucide-react';
import { useTraderTheme } from '../trader/TraderPanelLayout';

const TradingStyleRules = ({ challenge }) => {
  const { isDark } = useTraderTheme();
  
  if (!challenge) return null;

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';

  const tradingStyleRules = [
    { id: 'news', label: 'News Trading', icon: Newspaper, allowed: true },
    { id: 'weekend', label: 'Weekend Holding', icon: Calendar, allowed: true },
    { id: 'ea', label: 'Expert Advisors', icon: Bot, allowed: true },
    { id: 'hedging', label: 'Hedging', icon: GitBranch, allowed: true },
    { id: 'copy', label: 'Copy Trading', icon: Copy, allowed: false },
  ];

  return (
    <div className={cardClass + ' p-4'}>
      <h3 className={`font-bold mb-4 ${textClass}`}>Trading Style Rules</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {tradingStyleRules.map((rule) => (
          <div
            key={rule.id}
            className={`flex items-center gap-3 p-3 rounded-xl ${
              rule.allowed
                ? isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'
                : isDark ? 'bg-red-500/10 border border-red-500/20' : 'bg-red-50 border border-red-200'
            }`}
          >
            <rule.icon className={`w-4 h-4 ${rule.allowed ? 'text-emerald-500' : 'text-red-500'}`} />
            <div>
              <span className={`text-sm font-medium ${textClass}`}>{rule.label}</span>
              <span className={`block text-xs ${rule.allowed ? 'text-emerald-500' : 'text-red-500'}`}>
                {rule.allowed ? 'Allowed' : 'Not Allowed'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TradingStyleRules;
