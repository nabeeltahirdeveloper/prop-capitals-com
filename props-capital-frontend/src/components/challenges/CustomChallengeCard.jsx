import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { useCustomChallenge } from '@/hooks/useChallenges';

/**
 * The "Custom €" challenge card — a price input (1–1000), live account-size
 * preview, and a CTA that routes to the contact form with the custom params.
 * Shared across /challenges, Home and the Buy Challenge pages so the behavior
 * is identical everywhere. `className` lets each surface control sizing
 * (e.g. centered on /challenges, grid-filling on Home / buy wizards).
 */
const CustomChallengeCard = ({ className = '' }) => {
  const { isDark } = useTheme();
  const { formatFee, formatAmount, symbol } = useCurrency();
  const { t } = useTranslation();
  const {
    customPrice,
    setCustomPrice,
    customPriceNumber,
    isValid,
    customAccountSize,
    startCustomChallenge,
  } = useCustomChallenge();

  return (
    <div
      className={`relative rounded-3xl p-6 lg:p-8 border transition-all duration-300 border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.15)] ${
        isDark
          ? 'bg-gradient-to-br from-[#12161d] to-[#0d1117]'
          : 'bg-white shadow-xl shadow-amber-500/10'
      } ${className}`}
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
        <div className="px-4 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0d12] whitespace-nowrap">
          {t('challengeCard.badge')}
        </div>
      </div>

      <div className="text-center mb-6 pt-4">
        <h3 className={`text-xl lg:text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {t('challengeCard.title')}
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
          {t('challengeCard.subtitle', { min: formatFee(1), max: formatFee(1000) })}
        </p>
      </div>

      <div className={`mb-6 rounded-2xl p-5 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
        <label className={`text-sm font-semibold mb-2 block ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
          {t('challengeCard.priceLabel', { symbol })}
        </label>
        <input
          type="number"
          min="1"
          max="1000"
          step="1"
          value={customPrice}
          onChange={(e) => setCustomPrice(e.target.value)}
          className={`w-full rounded-xl px-4 py-4 text-xl font-bold outline-none transition-colors ${
            isDark
              ? 'bg-[#12161d] border border-white/10 text-white focus:border-amber-500/60'
              : 'bg-white border border-slate-200 text-slate-900 focus:border-amber-500/60'
          }`}
        />
        <p className={`text-sm mt-3 ${isValid ? (isDark ? 'text-gray-300' : 'text-slate-600') : 'text-red-400'}`}>
          {isValid ? (
            <>
              {t('challengeCard.previewPrefix')}{' '}
              <span className="text-amber-500 font-bold">{formatFee(customPriceNumber)}</span>{' '}
              {t('challengeCard.previewMiddle')}{' '}
              <span className="text-amber-500 font-bold">{formatAmount(customAccountSize)}</span>{' '}
              {t('challengeCard.previewSuffix')}
            </>
          ) : (
            t('challengeCard.invalidPrice', { min: formatFee(1), max: formatFee(1000) })
          )}
        </p>
      </div>

      <div className="space-y-3 mb-8">
        {[
          { label: t('challengeCard.specs.phases'), value: t('challengeCard.specs.phasesValue') },
          { label: t('challengeCard.specs.profitTarget'), value: '10%' },
          { label: t('challengeCard.specs.dailyDrawdown'), value: '4%' },
          { label: t('challengeCard.specs.maxDrawdown'), value: '8%' },
          { label: t('challengeCard.specs.minTradingDays'), value: t('challengeCard.specs.minTradingDaysValue'), highlight: true },
          { label: t('challengeCard.specs.profitSplit'), value: '85%', highlight: 'amber', large: true },
        ].map((item, index) => (
          <div key={item.label} className={`flex items-center justify-between py-2 ${index < 5 ? isDark ? 'border-b border-white/5' : 'border-b border-slate-100' : ''}`}>
            <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{item.label}</span>
            <span className={`font-semibold ${
              item.highlight === 'amber' ? 'text-amber-500 text-xl font-bold' :
              item.highlight ? 'text-emerald-400' :
              isDark ? 'text-white' : 'text-slate-900'
            }`}>{item.value}</span>
          </div>
        ))}
      </div>

      <Button
        onClick={startCustomChallenge}
        disabled={!isValid}
        className="w-full rounded-full py-6 h-auto text-base font-bold transition-all group bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] shadow-lg shadow-amber-500/25 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {t('challengeCard.startButton')}
        <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
      </Button>
    </div>
  );
};

export default CustomChallengeCard;
