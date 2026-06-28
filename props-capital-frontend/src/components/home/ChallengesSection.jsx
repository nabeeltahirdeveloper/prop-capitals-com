import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getFullPrice } from '@/utils/fullPrice';
import { Skeleton } from '@/components/ui/skeleton';
import { useChallenges } from '@/hooks/useChallenges';
import { groupChallengesByType } from '@/lib/challenges';
import CustomChallengeCard from '@/components/challenges/CustomChallengeCard';


const ChallengesSection = () => {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const { formatFee, formatSize, symbol } = useCurrency();
  const [selectedSize, setSelectedSize] = useState(3);

  const { data: rawChallenges = [], isLoading, isError } = useChallenges();
  const { accountSizes, challengeTypes } = useMemo(
    () => groupChallengesByType(rawChallenges),
    [rawChallenges],
  );

  const isCustomSelected = selectedSize === 'custom';
  const safeIndex = isCustomSelected
    ? 0
    : Math.min(selectedSize, Math.max(accountSizes.length - 1, 0));
  const sizeKey = accountSizes[safeIndex]?.key;
  // Only show phase-type cards that exist at the selected size.
  const visibleTypes = challengeTypes.filter((t) => t.prices[sizeKey] != null);

  const sectionClass = `py-20 lg:py-32 transition-colors duration-300 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`;
  const heading = (
    <div className="text-center mb-12">
      <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Funding Programs</span>
      <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        Choose Your <span className="text-amber-500">Path</span>
      </h2>
      <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
        Select the funding program that matches your trading style. All programs include 100% fee refund.
      </p>
    </div>
  );

  // Loading: skeleton cards (never a blank section).
  if (isLoading) {
    return (
      <section className={sectionClass}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {heading}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className={`rounded-3xl p-6 lg:p-8 border ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
                <Skeleton className="h-6 w-32 mx-auto mb-4" />
                <Skeleton className="h-10 w-24 mx-auto mb-6" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((j) => <Skeleton key={j} className="h-8 w-full" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Error / empty: explicit non-blank state (data is API-only — no hardcoded fallback).
  if (isError || challengeTypes.length === 0) {
    return (
      <section className={sectionClass}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {heading}
          <div className={`max-w-lg mx-auto text-center rounded-3xl p-8 border ${isDark ? 'bg-[#12161d] border-white/10 text-gray-300' : 'bg-white border-slate-200 text-slate-600'}`}>
            <p className="mb-6">
              {isError
                ? 'Our funding programs are temporarily unavailable. Please try again shortly.'
                : 'No funding programs are available right now. Please check back soon.'}
            </p>
            <Link to="/Challenges">
              <Button className="rounded-full px-8 py-5 h-auto font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12]">
                View all challenges
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={sectionClass}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {heading}

        {/* Account Size Selector - Fixed for mobile */}
        <div className="flex justify-center mb-12 overflow-x-auto pb-2">
          <div className={`rounded-full p-1.5 inline-flex gap-1 border min-w-max ${
            isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            {accountSizes.map((size, index) => (
              <button
                key={size.value}
                onClick={() => setSelectedSize(index)}
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                  !isCustomSelected && safeIndex === index
                    ? 'bg-amber-400 text-[#0a0d12]'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {formatSize(size.key)}
              </button>
            ))}
            <button
              onClick={() => setSelectedSize('custom')}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                isCustomSelected
                  ? 'bg-amber-400 text-[#0a0d12]'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Custom {symbol}
            </button>
          </div>
        </div>

        {/* Challenge Cards — Custom selected shows the shared Build-Your-Own card,
            exactly like the /challenges page */}
        {isCustomSelected ? (
          <CustomChallengeCard className="max-w-lg mx-auto" />
        ) : (
        <div
          className={`grid gap-6 lg:gap-8 mx-auto ${
            visibleTypes.length === 1
              ? 'max-w-lg'
              : visibleTypes.length === 2
                ? 'sm:grid-cols-2 max-w-4xl'
                : 'sm:grid-cols-2 lg:grid-cols-3 max-w-5xl'
          }`}
        >
          {visibleTypes.map((challenge) => {
            const price = challenge.prices[sizeKey];
            return (
              <div
                key={challenge.id}
                className={`relative rounded-3xl p-5 sm:p-6 lg:p-8 border transition-all duration-300 hover:-translate-y-2 ${
                  isDark
                    ? 'bg-gradient-to-br from-[#12161d] to-[#0d1117]'
                    : 'bg-white shadow-xl shadow-slate-200/50'
                } ${
                  challenge.popular
                    ? 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.15)]'
                    : isDark ? 'border-white/10 hover:border-amber-500/30' : 'border-slate-200 hover:border-amber-300'
                }`}
              >
                {/* Badge */}
                {challenge.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <div className={`px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1 whitespace-nowrap ${
                      challenge.popular
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0d12]'
                        : isDark ? 'bg-[#1a1f2a] text-gray-400 border border-white/10' : 'bg-slate-100 text-slate-500 border border-slate-200'
                    }`}>
                      {challenge.popular && <Star className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />}
                      {challenge.badge}
                    </div>
                  </div>
                )}

                {/* Header */}
                <div className="text-center mb-5 pt-4">
                  <h3 className={`text-lg sm:text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.name}</h3>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{challenge.description}</p>
                </div>

                {/* Price */}
                {price != null ? (
                  <div className={`text-center mb-5 py-4 rounded-2xl ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                    <div className={`text-xs sm:text-sm line-through mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                      {formatFee(getFullPrice(challenge.id, sizeKey, price))}
                    </div>
                    <div className="text-amber-500 text-3xl sm:text-4xl font-black">
                      {formatFee(price)}
                    </div>
                    <div className="text-emerald-500 text-xs sm:text-sm font-semibold mt-1">70% OFF</div>
                  </div>
                ) : (
                  <div className={`text-center mb-5 py-4 rounded-2xl ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                    <div className="text-amber-500 text-2xl sm:text-3xl font-black">
                      Not at this size
                    </div>
                    <div className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                      Pick another account size
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="space-y-2 sm:space-y-3 mb-5">
                  <div className={`flex items-center justify-between py-2 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Profit Target</span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.profitTarget}</span>
                  </div>
                  <div className={`flex items-center justify-between py-2 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Daily Drawdown</span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.dailyDrawdown}</span>
                  </div>
                  <div className={`flex items-center justify-between py-2 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Max Drawdown</span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.maxDrawdown}</span>
                  </div>
                  <div className={`flex items-center justify-between py-2 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                    <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Leverage</span>
                    <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.leverage}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Profit Split</span>
                    <span className="text-amber-500 font-bold text-base sm:text-lg">{challenge.profitSplit}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2 mb-5">
                  {['No time limit', 'All strategies allowed', '100% fee refund', 'Free education included'].map((feature) => (
                    <div key={feature} className="flex items-center gap-2">
                      <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500" />
                      </div>
                      <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link to={user ? "/dashboard" : "/signup"} className="block">
                  <Button
                    className={`w-full rounded-full py-5 sm:py-6 h-auto text-sm sm:text-base font-bold transition-all group ${
                      challenge.popular
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] shadow-lg shadow-amber-500/25'
                        : isDark ? 'bg-white hover:bg-gray-100 text-[#0a0d12]' : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    Get Started
                    <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
};

export default ChallengesSection;
