import { useState } from 'react';
import { Check, ArrowRight, Star } from 'lucide-react';
import { Button } from './ui/button';
// import { useTheme } from '../context/ThemeContext';
import { challengeTypes, accountSizes } from './data/mockData.js';

const ChallengesSection = () => {
  // const { isDark } = useTheme();
  const isDark = true;
  const [selectedSize, setSelectedSize] = useState(3);

  return (
    <section className={`py-20 lg:py-32 transition-colors duration-300 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Funding Programs</span>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Choose Your <span className="text-amber-500">Path</span>
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Select the funding program that matches your trading style. All programs include 100% fee refund.
          </p>
        </div>

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
                  selectedSize === index
                    ? 'bg-amber-400 text-[#0a0d12]'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>

        {/* Challenge Cards - 2 columns centered */}
        <div className="grid sm:grid-cols-2 gap-6 lg:gap-8 max-w-3xl mx-auto">
          {challengeTypes.map((challenge) => (
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

              {/* Header */}
              <div className="text-center mb-5 pt-4">
                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.name}</h3>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{challenge.description}</p>
              </div>

              {/* Price */}
              <div className={`text-center mb-5 py-4 rounded-2xl ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                <div className={`text-xs sm:text-sm line-through mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  ${(challenge.prices[accountSizes[selectedSize].key] * 3).toFixed(0)}
                </div>
                <div className="text-amber-500 text-3xl sm:text-4xl font-black">
                  ${challenge.prices[accountSizes[selectedSize].key]}
                </div>
                <div className="text-emerald-500 text-xs sm:text-sm font-semibold mt-1">70% OFF</div>
              </div>

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
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500" />
                  </div>
                  <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>No time limit</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500" />
                  </div>
                  <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>All strategies allowed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500" />
                  </div>
                  <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>100% fee refund</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500" />
                  </div>
                  <span className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>Free education included</span>
                </div>
              </div>

              {/* CTA Button */}
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ChallengesSection;
