import React from 'react';
import { Target } from 'lucide-react';
import { useTraderTheme } from '../trader/TraderPanelLayout';
import { useTranslation } from '@/contexts/LanguageContext';

const ChallengeActiveBanner = ({ challenge, phaseLabel }) => {
  const { isDark } = useTraderTheme();
  const { t } = useTranslation();
  
  if (!challenge) return null;

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className={cardClass + ' p-3 sm:p-4'}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
            <Target className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
          </div>
          <div>
            <h3 className={`font-bold text-base sm:text-lg ${textClass}`}>{t('challengeActiveBanner.title')}</h3>
            <p className={`text-xs sm:text-sm ${mutedClass}`}>
              {t('challengeActiveBanner.workingTowards', { phase: phaseLabel || t('challengeActiveBanner.defaultPhase') })}
            </p>
          </div>
        </div>
        <span className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500/20 text-blue-400 rounded-xl font-bold text-sm sm:text-base">
          {(phaseLabel || t('challengeActiveBanner.defaultPhase')).toUpperCase()}
        </span>
      </div>
    </div>
  );
};

export default ChallengeActiveBanner;
