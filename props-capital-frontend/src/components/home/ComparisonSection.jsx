import { Check, X } from 'lucide-react';
// import { useTheme } from '../context/ThemeContext';
import { comparisonData } from './data/mockData.js';

const ComparisonSection = () => {
  // const { isDark } = useTheme();
  const isDark = true;

  return (
    <section className={`py-20 lg:py-32 transition-colors duration-300 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Why Choose Us</span>
          <h2 className={`text-2xl sm:text-3xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Prop Capitals vs. <span className={isDark ? 'text-gray-500' : 'text-slate-400'}>Other</span> Firms
          </h2>
          <p className={`text-base lg:text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            See why thousands of traders are switching to Prop Capitals.
          </p>
        </div>

        {/* Mobile View - Cards */}
        <div className="lg:hidden space-y-4">
          {comparisonData.map((row, index) => (
            <div 
              key={index}
              className={`rounded-2xl p-4 border ${
                isDark ? 'bg-[#12161d] border-white/10' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.feature}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className={`rounded-xl p-3 ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
                  <div className="flex items-center gap-1 mb-2">
                    <X className="w-4 h-4 text-red-400" />
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Others</span>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{row.others}</p>
                </div>
                <div className={`rounded-xl p-3 ${
                  row.highlight 
                    ? 'bg-amber-500/10 border border-amber-500/20' 
                    : 'bg-emerald-500/10 border border-emerald-500/20'
                }`}>
                  <div className="flex items-center gap-1 mb-2">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-amber-500 text-xs font-semibold">Prop Capitals</span>
                  </div>
                  <p className={`text-sm ${row.highlight ? 'text-amber-500 font-semibold' : isDark ? 'text-white' : 'text-slate-900'}`}>
                    {row.propCapitals}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View - Table */}
        <div className={`hidden lg:block rounded-3xl overflow-hidden border ${
          isDark ? 'border-white/10 bg-[#12161d]' : 'border-slate-200 bg-white shadow-xl'
        }`}>
          {/* Table Header */}
          <div className="grid grid-cols-3">
            <div className={`p-6 ${isDark ? 'bg-[#0d1117]' : 'bg-slate-50'}`}>
              <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Feature</span>
            </div>
            <div className={`p-6 border-l ${isDark ? 'bg-[#0d1117] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-center gap-2">
                <X className="w-5 h-5 text-red-400" />
                <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Other Prop Firms</span>
              </div>
            </div>
            <div className={`p-6 border-l ${isDark ? 'bg-amber-500/5 border-white/5' : 'bg-amber-50 border-slate-200'}`}>
              <div className="flex items-center justify-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <span className="text-amber-500 font-bold">Prop Capitals</span>
              </div>
            </div>
          </div>

          {/* Table Body */}
          {comparisonData.map((row, index) => (
            <div 
              key={index} 
              className={`grid grid-cols-3 border-t ${isDark ? 'border-white/5' : 'border-slate-100'}`}
            >
              <div className="p-5">
                <span className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>{row.feature}</span>
              </div>
              <div className={`p-5 border-l flex items-center justify-center ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                <span className={isDark ? 'text-gray-400' : 'text-slate-500'}>{row.others}</span>
              </div>
              <div className={`p-5 border-l flex items-center justify-center ${
                isDark ? 'bg-amber-500/5 border-white/5' : 'bg-amber-50/50 border-slate-100'
              }`}>
                <span className={`font-semibold ${row.highlight ? 'text-amber-500' : isDark ? 'text-white' : 'text-slate-900'}`}>
                  {row.propCapitals}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
