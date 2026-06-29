import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { useChallenges } from '@/hooks/useChallenges';
import { groupChallengesByType } from '@/lib/challenges';

const ProfitCalculatorSection = () => {
  const { isDark } = useTheme();
  const { formatAmount, formatSize } = useCurrency();
  const { t } = useTranslation();
  const [accountSizeIndex, setAccountSizeIndex] = useState(3); // Default to mid-range size
  const [profitRate, setProfitRate] = useState(5.7);

  const { data: rawChallenges = [], isLoading, isError } = useChallenges();
  const { accountSizes } = useMemo(
    () => groupChallengesByType(rawChallenges),
    [rawChallenges],
  );

  const safeIndex = Math.min(accountSizeIndex, Math.max(accountSizes.length - 1, 0));
  const selectedAccount = accountSizes[safeIndex];

  const calculations = useMemo(() => {
    if (!selectedAccount) return { monthly: '', yearly: '' };
    const monthlyProfit = selectedAccount.value * (profitRate / 100);
    const yearlyProfit = monthlyProfit * 12;
    return {
      monthly: formatAmount(monthlyProfit),
      yearly: formatAmount(yearlyProfit),
    };
  }, [selectedAccount, profitRate, formatAmount]);

  const sectionClass = `py-20 transition-colors duration-300 ${
    isDark
      ? 'bg-gradient-to-b from-[#0d1117] to-[#0a0d12]'
      : 'bg-gradient-to-b from-white to-slate-50'
  }`;
  const heading = (
    <div className="text-center mb-12">
      <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 ${
        isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
      }`}>
        <Calculator className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
        <span className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{t('home.profitCalculator.badge')}</span>
      </div>
      <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {t('home.profitCalculator.titlePrefix')} <span className="text-amber-500">{t('home.profitCalculator.titleHighlight')}</span>
      </h2>
      <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
        {t('home.profitCalculator.subtitle')}
      </p>
    </div>
  );

  // Account sizes come from the live catalog — show a skeleton while loading and
  // an explicit message if it's unavailable (no hardcoded fallback).
  if (isLoading) {
    return (
      <section className={sectionClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {heading}
          <div className="max-w-4xl mx-auto">
            <Skeleton className="h-72 w-full rounded-3xl" />
          </div>
        </div>
      </section>
    );
  }

  if (isError || !selectedAccount) {
    return (
      <section className={sectionClass}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {heading}
          <div className={`max-w-lg mx-auto text-center rounded-3xl p-8 border ${isDark ? 'bg-[#12161d] border-white/10 text-gray-300' : 'bg-white border-slate-200 text-slate-600'}`}>
            {t('home.profitCalculator.unavailable')}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {heading}

        <div className="max-w-4xl mx-auto">
          <div className={`rounded-3xl p-6 lg:p-10 border shadow-2xl ${
            isDark
              ? 'bg-[#12161d] border-white/10 shadow-black/20'
              : 'bg-white border-slate-200 shadow-slate-200/50'
          }`}>
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
              {/* Left Side - Sliders */}
              <div>
                {/* Account Size */}
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
                        <DollarSign className="w-5 h-5 text-amber-500" />
                      </div>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('home.profitCalculator.accountSize')}</span>
                    </div>
                    <span className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      {t('home.profitCalculator.step', { current: safeIndex + 1, total: accountSizes.length })}
                    </span>
                  </div>
                  <div className={`text-4xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {formatSize(selectedAccount.key)}
                  </div>
                  <Slider
                    value={[safeIndex]}
                    onValueChange={(value) => setAccountSizeIndex(value[0])}
                    max={accountSizes.length - 1}
                    step={1}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-xs">
                    {accountSizes.map((size, index) => (
                      <span
                        key={size.value}
                        className={`transition-colors cursor-pointer ${
                          index === safeIndex
                            ? 'text-amber-500 font-semibold'
                            : isDark ? 'text-gray-600' : 'text-slate-400'
                        }`}
                        onClick={() => setAccountSizeIndex(index)}
                      >
                        {formatSize(size.key)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Profit Rate */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-50'}`}>
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      </div>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('home.profitCalculator.monthlyProfitRate')}</span>
                    </div>
                    <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>{t('home.profitCalculator.average')}</span>
                  </div>
                  <div className={`text-4xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {profitRate.toFixed(1)}%
                  </div>
                  <Slider
                    value={[profitRate]}
                    onValueChange={(value) => setProfitRate(value[0])}
                    max={20}
                    min={0}
                    step={0.1}
                    className="mb-4"
                  />
                  <div className={`flex justify-between text-xs ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>
                    <span>0%</span>
                    <span>10%</span>
                    <span>20%</span>
                  </div>
                </div>
              </div>

              {/* Right Side - Results */}
              <div className="flex flex-col justify-center">
                <div className={`rounded-2xl p-6 mb-4 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 bg-amber-400 rounded-full"></span>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('home.profitCalculator.monthlyEarnings')}</span>
                  </div>
                  <div className="text-4xl lg:text-5xl font-black text-amber-500">{calculations.monthly}</div>
                </div>

                <div className={`rounded-2xl p-6 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 bg-emerald-400 rounded-full"></span>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('home.profitCalculator.yearlyPotential')}</span>
                  </div>
                  <div className="text-4xl lg:text-5xl font-black text-emerald-500">{calculations.yearly}</div>
                </div>

                <p className={`text-xs mt-4 text-center ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  {t('home.profitCalculator.disclaimer')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProfitCalculatorSection;
