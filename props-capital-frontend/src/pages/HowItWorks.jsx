import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, TrendingUp, Shield, Zap, Target, Award, DollarSign, BarChart3 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';


const HowItWorksPage = () => {
  const { isDark } = useTheme();
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAccountSize, setSelectedAccountSize] = useState(3);
  const [animatedPrice, setAnimatedPrice] = useState(1.0856);
  const [tradeProfit, setTradeProfit] = useState(0);

  const accountSizes = [
    { label: '$5K', value: 5000 },
    { label: '$10K', value: 10000 },
    { label: '$25K', value: 25000 },
    { label: '$50K', value: 50000 },
    { label: '$100K', value: 100000 },
    { label: '$200K', value: 200000 }
  ];

  // Simulate live price animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimatedPrice(prev => {
        const change = (Math.random() - 0.48) * 0.0005;
        return parseFloat((prev + change).toFixed(4));
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Simulate trade profit
  useEffect(() => {
    const interval = setInterval(() => {
      setTradeProfit(prev => {
        if (prev < 2450) return prev + Math.random() * 50;
        return 0;
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      number: "01",
      title: "Choose Your Challenge",
      description: "Select between our 1-Step or 2-Step evaluation. Pick your account size from $5K to $200K.",
      icon: Target,
      color: "amber"
    },
    {
      number: "02", 
      title: "Pass the Evaluation",
      description: "Hit the profit target while respecting drawdown limits. No time pressure - trade at your own pace.",
      icon: TrendingUp,
      color: "emerald"
    },
    {
      number: "03",
      title: "Get Funded",
      description: "Once you pass, receive your funded account. Start trading with our capital immediately.",
      icon: Shield,
      color: "blue"
    },
    {
      number: "04",
      title: "Earn & Withdraw",
      description: "Keep up to 90% of your profits. Request payouts anytime - funds arrive in under 90 minutes.",
      icon: Award,
      color: "purple"
    }
  ];

  return (
    <div className={`min-h-screen pt-20 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      {/* Hero Section */}
      <section className="py-12 lg:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className={`absolute top-1/4 left-1/4 w-64 lg:w-96 h-64 lg:h-96 rounded-full blur-3xl ${isDark ? 'bg-amber-500/10' : 'bg-amber-500/5'}`}></div>
          <div className={`absolute bottom-1/4 right-1/4 w-64 lg:w-96 h-64 lg:h-96 rounded-full blur-3xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-10 lg:mb-16">
            <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">How It Works</span>
            <h1 className={`text-3xl sm:text-4xl lg:text-6xl font-black mb-4 lg:mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Your Path to <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">Funded Trading</span>
            </h1>
            <p className={`text-base lg:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              Prop Capitals provides talented traders with the capital they need. Here's how you can start trading with up to $200,000.
            </p>
          </div>

          {/* 3D Trading Platform Mockup - Responsive */}
          <div className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Floating Elements - Hide on very small screens */}
              <div className="hidden sm:block absolute -top-4 lg:-top-8 -left-2 lg:-left-8 bg-emerald-500 text-white px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg shadow-xl z-20 animate-bounce">
                <div className="flex items-center gap-1 lg:gap-2">
                  <TrendingUp className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="font-bold text-sm lg:text-base">+$2,450</span>
                </div>
              </div>
              
              <div className="hidden sm:block absolute -top-2 lg:-top-4 -right-2 lg:-right-4 bg-amber-500 text-[#0a0d12] px-3 lg:px-4 py-1.5 lg:py-2 rounded-lg shadow-xl z-20" style={{ animation: 'pulse 2s infinite' }}>
                <div className="flex items-center gap-1 lg:gap-2">
                  <Zap className="w-4 h-4 lg:w-5 lg:h-5" />
                  <span className="font-bold text-sm lg:text-base">Live Trading</span>
                </div>
              </div>

              {/* Main Platform Window */}
              <div className={`rounded-2xl lg:rounded-3xl border shadow-2xl overflow-hidden ${
                isDark 
                  ? 'bg-gradient-to-br from-[#12161d] to-[#0d1117] border-white/10' 
                  : 'bg-white border-slate-200'
              }`}>
                {/* Window Header */}
                <div className={`px-3 lg:px-4 py-2 lg:py-3 flex items-center justify-between border-b ${
                  isDark ? 'bg-[#0a0d12] border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center gap-1.5 lg:gap-2">
                    <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-red-500"></div>
                    <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-2.5 h-2.5 lg:w-3 lg:h-3 rounded-full bg-emerald-500"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 lg:w-6 lg:h-6 bg-gradient-to-br from-amber-400 to-amber-600 rounded flex items-center justify-center">
                      <span className="text-[#0a0d12] font-black text-[6px] lg:text-[8px]">PC</span>
                    </div>
                    <span className={`font-semibold text-xs lg:text-sm hidden sm:inline ${isDark ? 'text-white' : 'text-slate-900'}`}>Prop Capitals Trading Platform</span>
                    <span className={`font-semibold text-xs sm:hidden ${isDark ? 'text-white' : 'text-slate-900'}`}>Trading Platform</span>
                  </div>
                  <div className={`text-[10px] lg:text-xs hidden sm:block ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>v2.0.1</div>
                </div>

                {/* Platform Content */}
                <div className="p-3 sm:p-4 lg:p-6">
                  <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
                    {/* Chart Area */}
                    <div className={`lg:col-span-2 rounded-xl lg:rounded-2xl p-3 lg:p-4 border ${
                      isDark ? 'bg-[#0a0d12] border-white/5' : 'bg-slate-50 border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between mb-3 lg:mb-4">
                        <div className="flex items-center gap-2 lg:gap-3">
                          <span className={`font-bold text-sm lg:text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>EUR/USD</span>
                          <span className={`text-base lg:text-lg font-mono ${animatedPrice > 1.0856 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {animatedPrice.toFixed(4)}
                          </span>
                          <span className={`text-xs lg:text-sm hidden sm:inline ${animatedPrice > 1.0856 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {animatedPrice > 1.0856 ? '+0.12%' : '-0.08%'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 lg:gap-2">
                          <button className={`px-2 lg:px-3 py-1 rounded text-[10px] lg:text-xs ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>1H</button>
                          <button className="px-2 lg:px-3 py-1 bg-amber-500/20 text-amber-500 rounded text-[10px] lg:text-xs">4H</button>
                          <button className={`px-2 lg:px-3 py-1 rounded text-[10px] lg:text-xs hidden sm:block ${isDark ? 'bg-white/5 text-gray-400 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>1D</button>
                        </div>
                      </div>
                      
                      {/* Animated Chart */}
                      <div className={`h-40 sm:h-52 lg:h-64 relative overflow-hidden rounded-lg lg:rounded-xl ${
                        isDark ? 'bg-gradient-to-b from-[#12161d] to-[#0a0d12]' : 'bg-gradient-to-b from-slate-100 to-slate-50'
                      }`}>
                        {/* Grid Lines */}
                        <div className="absolute inset-0 opacity-10">
                          {[...Array(6)].map((_, i) => (
                            <div key={i} className={`absolute w-full border-t ${isDark ? 'border-white' : 'border-slate-400'}`} style={{ top: `${i * 20}%` }}></div>
                          ))}
                        </div>
                        
                        {/* Chart SVG */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#f59e0b" />
                              <stop offset="100%" stopColor="#10b981" />
                            </linearGradient>
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                              <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          
                          <path 
                            d="M 0 140 Q 40 130 80 110 T 160 90 T 240 70 T 320 60 T 400 40"
                            fill="none"
                            stroke="url(#lineGradient)"
                            strokeWidth="3"
                          />
                          
                          <path 
                            d="M 0 140 Q 40 130 80 110 T 160 90 T 240 70 T 320 60 T 400 40 L 400 200 L 0 200 Z"
                            fill="url(#areaGradient)"
                          />
                        </svg>

                        {/* Trade Indicator */}
                        <div className="absolute top-2 lg:top-4 right-2 lg:right-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg px-2 lg:px-3 py-1 lg:py-2">
                          <div className="text-emerald-400 text-[10px] lg:text-xs">BUY @ 1.0842</div>
                          <div className="text-emerald-400 font-bold text-sm lg:text-base">+${tradeProfit.toFixed(0)}</div>
                        </div>
                      </div>
                    </div>

                    {/* Trading Panel */}
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 lg:gap-4">
                      {/* Account Info */}
                      <div className={`rounded-xl lg:rounded-2xl p-3 lg:p-4 border ${
                        isDark ? 'bg-[#0a0d12] border-white/5' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className={`text-[10px] lg:text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Account Balance</div>
                        <div className={`text-lg lg:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>$52,450</div>
                        <div className="text-emerald-400 text-xs lg:text-sm">+$2,450 (4.9%)</div>
                      </div>

                      {/* Quick Trade */}
                      <div className={`rounded-xl lg:rounded-2xl p-3 lg:p-4 border ${
                        isDark ? 'bg-[#0a0d12] border-white/5' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className={`font-semibold text-xs lg:text-sm mb-2 lg:mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Trade</div>
                        <div className="grid grid-cols-2 gap-2 mb-2 lg:mb-3">
                          <button className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 lg:py-3 rounded-lg lg:rounded-xl font-bold text-xs lg:text-sm transition-all hover:scale-105">
                            BUY
                          </button>
                          <button className="bg-red-500 hover:bg-red-600 text-white py-2 lg:py-3 rounded-lg lg:rounded-xl font-bold text-xs lg:text-sm transition-all hover:scale-105">
                            SELL
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-xs lg:text-sm">
                          <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>Lot Size</span>
                          <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>1.00</span>
                        </div>
                      </div>

                      {/* Open Positions - Hidden on small mobile, shown on larger */}
                      <div className={`col-span-2 lg:col-span-1 rounded-xl lg:rounded-2xl p-3 lg:p-4 border hidden sm:block ${
                        isDark ? 'bg-[#0a0d12] border-white/5' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className={`font-semibold text-xs lg:text-sm mb-2 lg:mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Open Positions</div>
                        <div className="space-y-2">
                          <div className={`flex items-center justify-between py-1.5 lg:py-2 border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                            <div>
                              <div className={`text-xs lg:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>EUR/USD</div>
                              <div className={`text-[10px] lg:text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>BUY 1.00</div>
                            </div>
                            <div className="text-emerald-400 font-semibold text-xs lg:text-sm">+$2,450</div>
                          </div>
                          <div className="flex items-center justify-between py-1.5 lg:py-2">
                            <div>
                              <div className={`text-xs lg:text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>GBP/USD</div>
                              <div className={`text-[10px] lg:text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>BUY 0.50</div>
                            </div>
                            <div className="text-emerald-400 font-semibold text-xs lg:text-sm">+$890</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className={`py-16 lg:py-32 ${isDark ? 'bg-gradient-to-b from-[#0a0d12] to-[#0d1117]' : 'bg-white'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className={`text-2xl sm:text-3xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              4 Simple Steps to <span className="text-amber-500">Get Funded</span>
            </h2>
            <p className={`text-base lg:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
              From registration to your first payout in as little as a few days.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {steps.map((step, index) => (
              <div 
                key={index}
                className={`relative rounded-2xl lg:rounded-3xl p-5 lg:p-6 border transition-all duration-500 cursor-pointer group hover:-translate-y-2 ${
                  activeStep === index 
                    ? 'border-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.15)]' 
                    : isDark ? 'border-white/10 hover:border-amber-500/30' : 'border-slate-200 hover:border-amber-500/30'
                } ${isDark ? 'bg-[#12161d]' : 'bg-white'}`}
                onClick={() => setActiveStep(index)}
              >
                {/* Step Number */}
                <div className={`absolute -top-3 left-5 lg:left-6 px-2.5 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs lg:text-sm font-bold ${
                  activeStep === index ? 'bg-amber-400 text-[#0a0d12]' : isDark ? 'bg-[#1a1f2a] text-gray-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  {step.number}
                </div>

                {/* Icon */}
                <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-xl lg:rounded-2xl flex items-center justify-center mb-3 lg:mb-4 mt-2 transition-all group-hover:scale-110 ${
                  step.color === 'amber' ? 'bg-amber-500/10' :
                  step.color === 'emerald' ? 'bg-emerald-500/10' :
                  step.color === 'blue' ? 'bg-blue-500/10' : 'bg-purple-500/10'
                }`}>
                  <step.icon className={`w-6 h-6 lg:w-7 lg:h-7 ${
                    step.color === 'amber' ? 'text-amber-500' :
                    step.color === 'emerald' ? 'text-emerald-400' :
                    step.color === 'blue' ? 'text-blue-400' : 'text-purple-400'
                  }`} />
                </div>

                {/* Content */}
                <h3 className={`text-lg lg:text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{step.title}</h3>
                <p className={`text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>{step.description}</p>

                {/* Connector Line (desktop only) */}
                {index < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 border-t-2 border-dashed border-amber-500/30"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={`py-16 lg:py-20 ${isDark ? 'bg-gradient-to-b from-[#0d1117] to-[#0a0d12]' : 'bg-slate-50'}`}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className={`text-2xl sm:text-3xl lg:text-5xl font-black mb-4 lg:mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Ready to Start Your <span className="text-amber-500">Trading Journey</span>?
          </h2>
          <p className={`text-base lg:text-lg mb-6 lg:mb-8 max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Join thousands of traders who have already proven their skills and are now trading with Prop Capitals funding.
          </p>
          <Button className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-8 lg:px-10 py-5 lg:py-7 h-auto text-lg lg:text-xl font-bold shadow-xl shadow-amber-500/25 group">
            Get Funded Now
            <ArrowRight className="ml-2 w-5 h-5 lg:w-6 lg:h-6 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default HowItWorksPage;
