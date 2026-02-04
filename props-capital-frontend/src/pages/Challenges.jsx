import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight, Star, Shield, Zap, Clock, TrendingUp, Award } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

const accountSizes = [
  { label: '$5K', key: '5K', value: 5000 },
  { label: '$10K', key: '10K', value: 10000 },
  { label: '$25K', key: '25K', value: 25000 },
  { label: '$50K', key: '50K', value: 50000 },
  { label: '$100K', key: '100K', value: 100000 },
  { label: '$200K', key: '200K', value: 200000 }
];

const challengeTypes = [
  {
    id: "one-step",
    name: "1-Step Challenge",
    badge: "Most Popular",
    description: "Quick evaluation with achievable targets and best value for traders",
    phases: 1,
    profitTarget: "10%",
    dailyDrawdown: "4%",
    maxDrawdown: "8%",
    profitSplit: "85%",
    leverage: "1:30",
    minDays: "None",
    popular: true,
    prices: { "5K": 55, "10K": 99, "25K": 189, "50K": 299, "100K": 499, "200K": 949 }
  },
  {
    id: "two-step",
    name: "2-Step Challenge",
    badge: "Best Split",
    description: "Traditional evaluation with highest profit split potential up to 90%",
    phases: 2,
    profitTarget: "8% / 5%",
    dailyDrawdown: "5%",
    maxDrawdown: "10%",
    profitSplit: "90%",
    leverage: "1:50",
    minDays: "None",
    popular: false,
    prices: { "5K": 45, "10K": 79, "25K": 159, "50K": 249, "100K": 449, "200K": 849 }
  }
];

const features = [
  { icon: Zap, title: "No Time Limit", description: "Complete the challenge at your own pace" },
  { icon: Shield, title: "100% Fee Refund", description: "Get your fee back on first payout" },
  { icon: TrendingUp, title: "All Strategies", description: "EAs, scalping, news trading allowed" },
  { icon: Clock, title: "Fast Payouts", description: "Under 90 minutes average" }
];

const ChallengesPage = () => {
  const { isDark } = useTheme();
  const [selectedSize, setSelectedSize] = useState(3);

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
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Funding Programs</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-6xl font-black mb-4 lg:mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Choose Your <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Challenge</span>
            </h1>
            <p className={`text-base lg:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Select the evaluation program that matches your trading style. All programs include free education and 100% fee refund.
            </p>
          </div>

          {/* Account Size Selector */}
          <div className="flex justify-center mb-12 overflow-x-auto pb-2">
            <div className={`rounded-full p-1.5 inline-flex gap-1 border min-w-max ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
              {accountSizes.map((size, index) => (
                <button
                  key={size.value}
                  onClick={() => setSelectedSize(index)}
                  className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
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

          {/* Challenge Cards */}
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
            {challengeTypes.map((challenge) => (
              <div 
                key={challenge.id}
                className={`relative rounded-3xl p-6 lg:p-8 border transition-all duration-300 hover:-translate-y-2 ${
                  challenge.popular 
                    ? 'border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.15)]' 
                    : isDark ? 'border-white/10 hover:border-amber-500/30' : 'border-slate-200 hover:border-amber-500/30'
                } ${isDark ? 'bg-gradient-to-br from-[#12161d] to-[#0d1117]' : 'bg-white'}`}
              >
                {/* Badge */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className={`px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1 whitespace-nowrap ${
                    challenge.popular 
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0d12]' 
                      : isDark ? 'bg-[#1a1f2a] text-gray-400 border border-white/10' : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {challenge.popular && <Star className="w-4 h-4 fill-current" />}
                    {challenge.badge}
                  </div>
                </div>

                {/* Header */}
                <div className="text-center mb-6 pt-4">
                  <h3 className={`text-xl lg:text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{challenge.name}</h3>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{challenge.description}</p>
                </div>

                {/* Price */}
                <div className={`text-center mb-6 py-5 rounded-2xl ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                  <div className={`text-sm line-through mb-1 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    ${(challenge.prices[accountSizes[selectedSize].key] * 3).toFixed(0)}
                  </div>
                  <div className="text-amber-500 text-4xl lg:text-5xl font-black">
                    ${challenge.prices[accountSizes[selectedSize].key]}
                  </div>
                  <div className="text-emerald-400 text-sm font-semibold mt-1">70% OFF - Limited Time</div>
                </div>

                {/* Stats */}
                <div className="space-y-3 mb-6">
                  {[
                    { label: 'Phases', value: `${challenge.phases} Phase${challenge.phases > 1 ? 's' : ''}` },
                    { label: 'Profit Target', value: challenge.profitTarget },
                    { label: 'Daily Drawdown', value: challenge.dailyDrawdown },
                    { label: 'Max Drawdown', value: challenge.maxDrawdown },
                    { label: 'Leverage', value: challenge.leverage },
                    { label: 'Min Trading Days', value: challenge.minDays, highlight: true },
                    { label: 'Profit Split', value: challenge.profitSplit, highlight: 'amber', large: true }
                  ].map((item, index) => (
                    <div key={index} className={`flex items-center justify-between py-2 ${index < 6 ? isDark ? 'border-b border-white/5' : 'border-b border-slate-100' : ''}`}>
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
                  {['No time limit', 'All strategies allowed', '100% fee refund', 'Free trading course'].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-emerald-400" />
                      </div>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link to={`/checkout?type=${challenge.id}&size=${accountSizes[selectedSize].key}`}>
                  <Button 
                    className={`w-full rounded-full py-6 h-auto text-base font-bold transition-all group ${
                      challenge.popular 
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] shadow-lg shadow-amber-500/25' 
                        : 'bg-slate-900 hover:bg-slate-800 text-white'
                    }`}
                  >
                    Start Challenge
                    <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={`py-16 lg:py-24 ${isDark ? 'bg-gradient-to-b from-[#0a0d12] to-[#0d1117]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Why Choose <span className="text-amber-500">Prop Capitals</span>?
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
      <section className={`py-16 lg:py-24 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Compare <span className="text-amber-500">Challenges</span>
            </h2>
          </div>

          <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className={`grid grid-cols-3 ${isDark ? 'bg-[#0d1117]' : 'bg-slate-50'}`}>
              <div className="p-4 lg:p-6">
                <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Feature</span>
              </div>
              <div className={`p-4 lg:p-6 text-center border-l ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <span className="text-amber-500 font-bold">1-Step</span>
              </div>
              <div className={`p-4 lg:p-6 text-center border-l ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <span className="text-blue-400 font-bold">2-Step</span>
              </div>
            </div>
            
            {[
              { feature: "Phases", oneStep: "1", twoStep: "2" },
              { feature: "Profit Target", oneStep: "10%", twoStep: "8% + 5%" },
              { feature: "Daily Drawdown", oneStep: "4%", twoStep: "5%" },
              { feature: "Max Drawdown", oneStep: "8%", twoStep: "10%" },
              { feature: "Profit Split", oneStep: "85%", twoStep: "90%" },
              { feature: "Leverage", oneStep: "1:30", twoStep: "1:50" },
              { feature: "Time Limit", oneStep: "Unlimited", twoStep: "Unlimited" }
            ].map((row, index) => (
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

      {/* CTA Section */}
      <section className={`py-16 lg:py-20 ${isDark ? 'bg-gradient-to-b from-[#0d1117] to-[#0a0d12]' : 'bg-white'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-2xl sm:text-3xl lg:text-4xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Ready to Get <span className="text-amber-500">Funded</span>?
          </h2>
          <p className={`text-base lg:text-lg mb-8 max-w-xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Join thousands of successful traders. Start your challenge today and trade with up to $200,000.
          </p>
          <Button className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-10 py-6 h-auto text-lg font-bold shadow-xl shadow-amber-500/25 group">
            Start Trading Now
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default ChallengesPage;
