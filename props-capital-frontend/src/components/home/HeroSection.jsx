import { useState, useMemo } from 'react';
import { ArrowRight, Star, Play, Shield, Clock, TrendingUp } from 'lucide-react';
import { Button } from "./ui/button";
import { Slider } from "./ui/slider";
import { Link } from 'react-router-dom';
// import { useTheme } from '../context/ThemeContext';
import { accountSizes, stats } from './data/mockData.js';

// Convert stats object to array for display
const statsDisplay = [
  { value: stats.payoutTime, label: "Avg. Payout", icon: 'clock' },
  { value: stats.totalPaid, label: "Total Paid Out", icon: 'trending' },
  { value: "100%", label: "Fee Refund", icon: 'shield' }
];

const HeroSection = () => {
  // const { isDark } = useTheme();
  const isDark = true;
  const [accountSizeIndex, setAccountSizeIndex] = useState(3); // Default to $50K
  const [profitRate, setProfitRate] = useState(5.7);

  const selectedAccount = accountSizes[accountSizeIndex];

  const calculations = useMemo(() => {
    const monthlyProfit = selectedAccount.value * (profitRate / 100);
    const yearlyProfit = monthlyProfit * 12;
    return {
      monthly: monthlyProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }),
      yearly: yearlyProfit.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
    };
  }, [selectedAccount, profitRate]);

  return (
    <section className={`relative min-h-screen pt-20 overflow-hidden ${isDark
      ? 'bg-gradient-to-b from-[#0a0d12] via-[#0d1117] to-[#0a0d12]'
      : 'bg-gradient-to-b from-slate-50 via-white to-slate-50'
      }`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {isDark ? (
          <>
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl"></div>
          </>
        ) : (
          <>
            <div className="absolute top-20 left-1/4 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
          </>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-12 lg:py-20">
        {/* Trustpilot Badge */}
        <div className="flex justify-center mb-8">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${isDark
            ? 'bg-white/5 border-white/10'
            : 'bg-white border-slate-200 shadow-sm'
            }`}>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
              ))}
            </div>
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>4.8 on Trustpilot</span>
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>(18,500+ traders)</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 ${isDark
              ? 'bg-emerald-500/10 border border-emerald-500/20'
              : 'bg-emerald-50 border border-emerald-200'
              }`}>
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
              <span className={`text-sm font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                Limited Time: 70% OFF All Challenges
              </span>
            </div>

            <h1 className={`text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6 ${isDark ? 'text-white' : 'text-slate-900'
              }`}>
              Calculate Your{' '}
              <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                Earning Potential
              </span>
            </h1>

            <p className={`text-lg mb-8 max-w-xl mx-auto lg:mx-0 ${isDark ? 'text-gray-400' : 'text-slate-600'
              }`}>
              Based on statistics from our funded traders, the average monthly profit rate is{' '}
              <span className="text-amber-500 font-semibold">5.72%</span>. Start your journey to financial freedom today.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <Link to="/challenges">
                <Button className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-8 py-6 h-auto text-lg font-bold shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transition-all group">
                  Start Trading NOW
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/watch-demo">
                <Button
                  variant="outline"
                  className={`rounded-full px-8 py-6 h-auto text-lg font-medium ${isDark
                    ? 'border-white/20 text-white hover:bg-white/5'
                    : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                >
                  <Play className="mr-2 w-5 h-5" /> Watch Demo
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-8">
              {statsDisplay.map((stat, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'
                    }`}>
                    {stat.icon === 'clock' && <Clock className="w-5 h-5 text-amber-500" />}
                    {stat.icon === 'trending' && <TrendingUp className="w-5 h-5 text-amber-500" />}
                    {stat.icon === 'shield' && <Shield className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div>
                    <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{stat.value}</div>
                    <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Content - Calculator Card */}
          <div className={`rounded-3xl p-6 lg:p-8 border shadow-2xl ${isDark
            ? 'bg-[#12161d] border-white/10 shadow-black/20'
            : 'bg-white border-slate-200 shadow-slate-200/50'
            }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Profit Calculator</h3>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${isDark
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-emerald-50 text-emerald-600'
                }`}>
                90% Split
              </div>
            </div>

            {/* Account Size */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Account Size</span>
                <span className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                  Step {accountSizeIndex + 1}/{accountSizes.length}
                </span>
              </div>
              <div className={`text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {selectedAccount.label}
              </div>
              <Slider
                value={[accountSizeIndex]}
                onValueChange={(value) => setAccountSizeIndex(value[0])}
                max={accountSizes.length - 1}
                step={1}
                className="mb-3"
              />
              <div className="flex justify-between text-xs">
                {accountSizes.map((size, index) => (
                  <span
                    key={index}
                    className={`transition-colors ${index === accountSizeIndex
                      ? 'text-amber-500 font-semibold'
                      : isDark ? 'text-gray-600' : 'text-slate-400'
                      }`}
                  >
                    {size.label}
                  </span>
                ))}
              </div>
            </div>

            {/* Profit Rate */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Monthly Profit Rate</span>
                <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Avg: 5.72%</span>
              </div>
              <div className={`text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {profitRate.toFixed(1)}%
              </div>
              <Slider
                value={[profitRate]}
                onValueChange={(value) => setProfitRate(value[0])}
                max={20}
                min={0}
                step={0.1}
                className="mb-3"
              />
              <div className={`flex justify-between text-xs ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>
                <span>0%</span>
                <span>20%</span>
              </div>
            </div>

            {/* Results */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`rounded-2xl p-4 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Monthly</span>
                </div>
                <div className="text-2xl font-black text-amber-500">{calculations.monthly}</div>
              </div>
              <div className={`rounded-2xl p-4 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Yearly</span>
                </div>
                <div className="text-2xl font-black text-emerald-500">{calculations.yearly}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
