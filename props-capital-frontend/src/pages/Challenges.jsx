import React, { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, ArrowRight, Star, Shield, Zap, Clock, TrendingUp, Award, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useTranslation } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';
import { getFullPrice } from '@/utils/fullPrice';
import { persistBrandAttribution } from '@/pages/CheckoutPage';
import { apiPost } from '@/lib/api';
import { useChallenges } from '@/hooks/useChallenges';
import { groupChallengesByType } from '@/lib/challenges';
import CustomChallengeCard from '@/components/challenges/CustomChallengeCard';

const featureIcons = [Zap, Shield, TrendingUp, Clock];

const ChallengesPage = () => {
  const { isDark } = useTheme();
  const { formatFee, formatSize, cur, symbol } = useCurrency();
  const { t } = useTranslation();
  const [selectedSize, setSelectedSize] = useState(3);
  const [searchParams] = useSearchParams();

  const featureItems = t('challengesPage.features', { returnObjects: true });
  const features = (Array.isArray(featureItems) ? featureItems : []).map((item, index) => ({
    icon: featureIcons[index],
    title: item.title,
    description: item.description,
  }));

  useEffect(() => {
    const brandSlug = searchParams.get('brand');
    const linkSlug = searchParams.get('link');
    if (brandSlug || linkSlug) {
      persistBrandAttribution(brandSlug, linkSlug);
    }
    if (linkSlug) {
      apiPost(`/challenges/brand-link/${encodeURIComponent(linkSlug)}/track-click`).catch(() => {});
    }
  }, [searchParams]);

  const { data: rawChallenges = [], isLoading } = useChallenges();

  // Group challenges by type and build account size / price structure
  // (shared transform — same shape consumed by Home + Buy Challenge).
  const { accountSizes, challengeTypes } = useMemo(
    () => groupChallengesByType(rawChallenges),
    [rawChallenges],
  );

  // Translated "min trading days" label ("N days" / "None").
  const fmtMinDays = (c) =>
    c.minTradingDays ? t('challengeDefs.minDays', { count: c.minTradingDays }) : t('challengeDefs.none');

  // Build comparison rows from fetched data
  const comparisonRows = useMemo(() => {
    if (challengeTypes.length < 2) return [];
    const oneStep = challengeTypes.find(t => t.id === 'one_phase');
    const twoStep = challengeTypes.find(t => t.id === 'two_phase');
    if (!oneStep || !twoStep) return [];
    return [
      { feature: t('challengesPage.comparison.phases'), oneStep: `${oneStep.phases}`, twoStep: `${twoStep.phases}` },
      { feature: t('challengesPage.comparison.profitTarget'), oneStep: oneStep.profitTarget, twoStep: twoStep.profitTarget },
      { feature: t('challengesPage.comparison.dailyDrawdown'), oneStep: oneStep.dailyDrawdown, twoStep: twoStep.dailyDrawdown },
      { feature: t('challengesPage.comparison.maxDrawdown'), oneStep: oneStep.maxDrawdown, twoStep: twoStep.maxDrawdown },
      { feature: t('challengesPage.comparison.profitSplit'), oneStep: oneStep.profitSplit, twoStep: twoStep.profitSplit },
      { feature: t('challengesPage.comparison.minTradingDays'), oneStep: fmtMinDays(oneStep), twoStep: fmtMinDays(twoStep) },
      { feature: t('challengesPage.comparison.timeLimit'), oneStep: t('challengesPage.comparison.unlimited'), twoStep: t('challengesPage.comparison.unlimited') }
    ];
  }, [challengeTypes, t]);

  const isCustomSelected = selectedSize === 'custom' || accountSizes.length === 0;
  const safeSelectedSize = isCustomSelected
    ? 0
    : Math.min(selectedSize, Math.max(accountSizes.length - 1, 0));
  const selectedSizeKey = accountSizes[safeSelectedSize]?.key;
  // Only render a phase-type card if a challenge of that type exists at the
  // selected size — a size may legitimately offer only 1-Step or only 2-Step.
  const visibleTypes = challengeTypes.filter((t) => t.prices[selectedSizeKey] != null);

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      {/* Hero Section */}
      <section className="py-12 lg:py-20 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute top-1/4 left-1/4 w-64 lg:w-96 h-64 lg:h-96 rounded-full blur-3xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-500/5'}`}></div>
          <div className={`absolute bottom-1/4 right-1/4 w-64 lg:w-96 h-64 lg:h-96 rounded-full blur-3xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-500/5'}`}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">{t('challengesPage.hero.eyebrow')}</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-6xl font-black mb-4 lg:mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('challengesPage.hero.titlePrefix')} <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">{t('challengesPage.hero.titleHighlight')}</span>
            </h1>
            <p className={`text-base lg:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              {t('challengesPage.hero.subtitle')}
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
              {[1, 2].map(i => (
                <div key={i} className={`rounded-3xl p-6 lg:p-8 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                  <Skeleton className="h-6 w-32 mx-auto mb-4" />
                  <Skeleton className="h-10 w-24 mx-auto mb-6" />
                  <div className="space-y-3">
                    {[1,2,3,4,5].map(j => <Skeleton key={j} className="h-8 w-full" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Account Size Selector */}
              <div className="flex justify-center mb-12 overflow-x-auto pb-2">
                <div className={`rounded-full p-1.5 inline-flex gap-1 border min-w-max ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                  {accountSizes.map((size, index) => (
                    <button
                      key={size.value}
                      onClick={() => setSelectedSize(index)}
                      className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                        !isCustomSelected && safeSelectedSize === index
                          ? 'bg-amber-400 text-[#0a0d12]'
                          : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {formatSize(size.key)}
                    </button>
                  ))}
                  <button
                    onClick={() => setSelectedSize('custom')}
                    className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
                      isCustomSelected
                        ? 'bg-amber-400 text-[#0a0d12]'
                        : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {t('challengesPage.customSize', { symbol })}
                  </button>
                </div>
              </div>

              {/* Challenge Cards */}
              {isCustomSelected ? (
                <CustomChallengeCard className="max-w-lg mx-auto" />
              ) : (
              <div className={`grid gap-6 lg:gap-8 max-w-4xl mx-auto ${visibleTypes.length === 1 ? 'max-w-lg' : 'md:grid-cols-2'}`}>
                {visibleTypes.map((challenge) => {
                  const sizeKey = selectedSizeKey;
                  const price = challenge.prices[sizeKey];
                  const fullPrice = getFullPrice(challenge.id, sizeKey, price);
                  return (
                    <div
                      key={challenge.id}
                      className={`relative rounded-3xl p-6 lg:p-8 border transition-all duration-300 hover:-translate-y-2 ${
                        challenge.popular
                          ? 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.15)]'
                          : isDark ? 'border-white/10 hover:border-amber-500/30' : 'border-slate-200 hover:border-amber-500/30'
                      } ${isDark ? 'bg-gradient-to-br from-[#12161d] to-[#0d1117]' : 'bg-white'}`}
                    >
                      {/* Badge */}
                      {challenge.badge && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <div className={`px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 whitespace-nowrap ${
                            challenge.popular
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0d12]'
                              : isDark ? 'bg-[#1a1f2a] text-gray-400 border border-white/10' : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {challenge.popular && <Star className="w-4 h-4 fill-current" />}
                            {challenge.badgeKey ? t(challenge.badgeKey) : challenge.badge}
                          </div>
                        </div>
                      )}

                      {/* Header */}
                      <div className="text-center mb-6 pt-4">
                        <h3 className={`text-xl lg:text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.nameKey ? t(challenge.nameKey) : challenge.name}</h3>
                        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{challenge.descriptionKey ? t(challenge.descriptionKey) : challenge.description}</p>
                      </div>

                      {/* Price */}
                      {price != null && (
                        <div className={`text-center mb-6 py-5 rounded-2xl ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                          <div className={`text-sm line-through mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                            {formatFee(fullPrice)}
                          </div>
                          <div className="text-amber-500 text-4xl lg:text-5xl font-black">
                            {formatFee(price)}
                          </div>
                          <div className="text-emerald-400 text-sm font-semibold mt-1">{t('challengesPage.discountBadge')}</div>
                        </div>
                      )}

                      {/* Stats */}
                      <div className="space-y-3 mb-6">
                        {[
                          { label: t('challengesPage.stats.phases'), value: t('challengesPage.stats.phaseCount', { count: challenge.phases }) },
                          { label: t('challengesPage.stats.profitTarget'), value: challenge.profitTarget },
                          { label: t('challengesPage.stats.dailyDrawdown'), value: challenge.dailyDrawdown },
                          { label: t('challengesPage.stats.maxDrawdown'), value: challenge.maxDrawdown },
                          { label: t('challengesPage.stats.minTradingDays'), value: fmtMinDays(challenge), highlight: true },
                          { label: t('challengesPage.stats.profitSplit'), value: challenge.profitSplit, highlight: 'amber', large: true }
                        ].map((item, index) => (
                          <div key={index} className={`flex items-center justify-between py-2 ${index < 5 ? isDark ? 'border-b border-white/5' : 'border-b border-slate-100' : ''}`}>
                            <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{item.label}</span>
                            <span className={`font-semibold ${
                              item.highlight === 'amber' ? 'text-amber-500 text-xl font-bold' :
                              item.highlight ? 'text-emerald-400' :
                              isDark ? 'text-white' : 'text-slate-900'
                            }`}>{item.value}</span>
                          </div>
                        ))}
                      </div>

                      {/* Features */}
                      <div className="space-y-2 mb-6">
                        {(t('challengesPage.cardFeatures', { returnObjects: true }) || []).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-emerald-400" />
                            </div>
                            <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <Link to={`/checkout?type=${challenge.id}&size=${accountSizes[safeSelectedSize]?.key}`}>
                        <Button
                          className={`w-full rounded-full py-6 h-auto text-base font-bold transition-all group ${
                            challenge.popular
                              ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] shadow-lg shadow-amber-500/25'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          {t('challengesPage.startChallenge')}
                          <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 lg:py-24 ${isDark ? 'bg-gradient-to-b from-[#0a0d12] to-[#0d1117]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t('challengesPage.whyChoose.prefix')} <span className="text-amber-500">Prop Capitals</span>{t('challengesPage.whyChoose.suffix')}
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`rounded-2xl p-6 border hover:border-amber-500/30 transition-all text-center ${
                  isDark ? 'bg-[#12161d] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-7 h-7 text-amber-500" />
                </div>
                <h3 className={`font-bold text-lg mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{feature.title}</h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      {comparisonRows.length > 0 && (
        <section className={`py-16 lg:py-24 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {t('challengesPage.compare.prefix')} <span className="text-amber-500">{t('challengesPage.compare.highlight')}</span>
              </h2>
            </div>

            <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
              <div className={`grid grid-cols-3 ${isDark ? 'bg-[#0d1117]' : 'bg-slate-50'}`}>
                <div className="p-4 lg:p-6">
                  <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{t('challengesPage.compare.featureColumn')}</span>
                </div>
                <div className={`p-4 lg:p-6 text-center border-l ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                  <span className="text-amber-500 font-bold">{t('challengesPage.compare.oneStep')}</span>
                </div>
                <div className={`p-4 lg:p-6 text-center border-l ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                  <span className="text-blue-400 font-bold">{t('challengesPage.compare.twoStep')}</span>
                </div>
              </div>

              {comparisonRows.map((row, index) => (
                <div key={index} className={`grid grid-cols-3 ${index % 2 === 0 ? isDark ? 'bg-[#0a0d12]' : 'bg-slate-50/50' : ''}`}>
                  <div className="p-4 lg:p-5">
                    <span className={`font-medium text-sm lg:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.feature}</span>
                  </div>
                  <div className={`p-4 lg:p-5 text-center border-l ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <span className={`text-sm lg:text-base ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{row.oneStep}</span>
                  </div>
                  <div className={`p-4 lg:p-5 text-center border-l ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <span className={`text-sm lg:text-base ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{row.twoStep}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className={`py-16 lg:py-20 ${isDark ? 'bg-gradient-to-b from-[#0d1117] to-[#0a0d12]' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {t('challengesPage.cta.titlePrefix')} <span className="text-amber-500">{t('challengesPage.cta.titleHighlight')}</span>{t('challengesPage.cta.titleSuffix')}
          </h2>
          <p className={`text-base lg:text-lg mb-8 max-w-xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            {t('challengesPage.cta.subtitle', { amount: cur('€200,000') })}
          </p>
          <Button
            onClick={User ? () => window.location.href = '/dashboard' : () => window.location.href = '/sign-up'}
            className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-10 py-6 h-auto text-lg font-bold shadow-xl shadow-amber-500/25 group"
          >
            {t('challengesPage.cta.button')}
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ChallengesPage;
