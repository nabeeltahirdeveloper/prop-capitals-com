import React from 'react';
import { Layers, ArrowRight } from 'lucide-react';
import { useTraderTheme } from '../trader/TraderPanelLayout';

const PhaseProgressionCards = ({ challenge }) => {
  const { isDark } = useTraderTheme();
  
  if (!challenge) return null;

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  // Determine phases based on challenge type
  const phases = [];
  if (challenge.type === '1-step') {
    phases.push({
      name: 'Evaluation',
      status: challenge.phase === 1 ? 'active' : challenge.phase === 'funded' ? 'completed' : 'locked',
      profit: challenge.phase === 1 ? challenge.stats?.currentProfit : undefined,
      profitTarget: challenge.rules?.profitTarget || 10,
      days: challenge.tradingDays?.current || 0,
      daysTarget: challenge.rules?.minTradingDays || 0,
      description: 'Pass evaluation phase',
    });
    phases.push({
      name: 'Funded',
      status: challenge.phase === 'funded' ? 'active' : 'locked',
      description: 'Receive funding & trade',
    });
  } else {
    // 2-step challenge
    phases.push({
      name: 'Phase 1',
      status: challenge.phase === 1 ? 'active' : challenge.phase > 1 ? 'completed' : 'locked',
      profit: challenge.phase === 1 ? challenge.stats?.currentProfit : undefined,
      profitTarget: challenge.rules?.profitTarget || 8,
      days: challenge.tradingDays?.current || 0,
      daysTarget: challenge.rules?.minTradingDays || 0,
      description: 'Complete first phase',
    });
    phases.push({
      name: 'Phase 2',
      status: challenge.phase === 2 ? 'active' : challenge.phase === 'funded' ? 'completed' : 'locked',
      profit: challenge.phase === 2 ? challenge.stats?.currentProfit : undefined,
      profitTarget: 5, // Phase 2 typically has 5% target
      days: challenge.phase === 2 ? challenge.tradingDays?.current : 0,
      daysTarget: challenge.rules?.minTradingDays || 0,
      description: 'Complete second phase',
    });
    phases.push({
      name: 'Funded',
      status: challenge.phase === 'funded' ? 'active' : 'locked',
      description: 'Receive funding & trade',
    });
  }

  return (
    <div className={cardClass + ' p-3 sm:p-4'}>
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
        <h3 className={`font-bold text-sm sm:text-base ${textClass}`}>Phase Progression</h3>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        {phases.map((phase, index) => (
          <React.Fragment key={phase.name}>
            <div
              className={`flex-1 rounded-xl p-3 sm:p-4 border-2 ${
                phase.status === 'active'
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : phase.status === 'completed'
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : isDark ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <div
                  className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                    phase.status === 'active'
                      ? 'bg-blue-500'
                      : phase.status === 'completed'
                        ? 'bg-emerald-500'
                        : isDark ? 'bg-gray-600' : 'bg-slate-300'
                  }`}
                />
                <span
                  className={`font-semibold text-sm sm:text-base ${
                    phase.status === 'active'
                      ? 'text-blue-400'
                      : phase.status === 'completed'
                        ? 'text-emerald-500'
                        : mutedClass
                  }`}
                >
                  {phase.name}
                </span>
              </div>
              {phase.profit !== undefined && phase.status === 'active' ? (
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>Profit:</span>
                    <span className={textClass}>
                      <span className={phase.profit >= phase.profitTarget ? 'text-emerald-500' : 'text-red-500'}>
                        {phase.profit >= phase.profitTarget ? '✓' : '✗'}
                      </span>{' '}
                      {phase.profit.toFixed(2)}% / {phase.profitTarget}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={isDark ? 'text-gray-500' : 'text-slate-500'}>Days:</span>
                    <span className={textClass}>
                      <span className={phase.days >= phase.daysTarget ? 'text-emerald-500' : 'text-red-500'}>
                        {phase.days >= phase.daysTarget ? '✓' : '✗'}
                      </span>{' '}
                      {phase.days} / {phase.daysTarget}
                    </span>
                  </div>
                </div>
              ) : (
                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                  {phase.status === 'completed' ? 'Completed' : phase.description || 'Locked'}
                </p>
              )}
            </div>
            {index < phases.length - 1 && (
              <ArrowRight className={`hidden sm:block w-5 h-5 flex-shrink-0 ${mutedClass}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default PhaseProgressionCards;
