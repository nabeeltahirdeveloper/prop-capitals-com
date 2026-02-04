import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, DollarSign } from 'lucide-react';
import { Slider } from './ui/slider';
import { accountSizes } from './data/mockData';
import { useTheme } from '@/contexts/ThemeContext';

const ProfitCalculatorSection = () => {
  const { isDark } = useTheme();
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
    <section className={`py-20 transition-colors duration-300 ${
      isDark 
        ? 'bg-gradient-to-b from-[#0d1117] to-[#0a0d12]' 
        : 'bg-gradient-to-b from-white to-slate-50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4 ${
            isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'
          }`}>
            <Calculator className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <span className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Profit Calculator</span>
          </div>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Calculate Your <span className="text-amber-500">Earning Potential</span>
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Based on statistics from our funded traders, the average monthly profit rate is 5.72%.
          </p>
        </div>

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
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Size</span>
                    </div>
                    <span className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      Step {accountSizeIndex + 1}/{accountSizes.length}
                    </span>
                  </div>
                  <div className={`text-4xl font-black mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedAccount.label}
                  </div>
                  <Slider
                    value={[accountSizeIndex]}
                    onValueChange={(value) => setAccountSizeIndex(value[0])}
                    max={accountSizes.length - 1}
                    step={1}
                    className="mb-4"
                  />
                  <div className="flex justify-between text-xs">
                    {accountSizes.map((size, index) => (
                      <span 
                        key={index} 
                        className={`transition-colors cursor-pointer ${
                          index === accountSizeIndex 
                            ? 'text-amber-500 font-semibold' 
                            : isDark ? 'text-gray-600' : 'text-slate-400'
                        }`}
                        onClick={() => setAccountSizeIndex(index)}
                      >
                        {size.label}
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
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Monthly Profit Rate</span>
                    </div>
                    <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Avg: 5.72%</span>
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
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Monthly Earnings (90% split)</span>
                  </div>
                  <div className="text-4xl lg:text-5xl font-black text-amber-500">{calculations.monthly}</div>
                </div>
                
                <div className={`rounded-2xl p-6 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-3 h-3 bg-emerald-400 rounded-full"></span>
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Yearly Potential</span>
                  </div>
                  <div className="text-4xl lg:text-5xl font-black text-emerald-500">{calculations.yearly}</div>
                </div>

                <p className={`text-xs mt-4 text-center ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  *Based on 90% profit split. Actual results may vary based on trading performance.
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
