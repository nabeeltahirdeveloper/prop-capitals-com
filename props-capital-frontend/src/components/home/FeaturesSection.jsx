import { Bot, Newspaper, Calendar, Timer, Zap, Copy, ArrowRight } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router-dom';
// import { useTheme } from '../context/ThemeContext';
import { tradingFeatures } from './data/mockData.js';

const iconMap = {
  'bot': Bot,
  'news': Newspaper,
  'calendar': Calendar,
  'clock': Timer,
  'zap': Zap,
  'copy': Copy
};

const FeaturesSection = () => {
  // const { isDark } = useTheme();
  const isDark = true;

  return (
    <section className={`py-20 lg:py-32 transition-colors duration-300 ${
      isDark ? 'bg-gradient-to-b from-[#0d1117] to-[#0a0d12]' : 'bg-gradient-to-b from-slate-50 to-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-amber-500 text-sm font-semibold tracking-wider uppercase mb-4 block">Trading Freedom</span>
          <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Trade <span className="text-amber-500">Your Way</span>
          </h2>
          <p className={`text-lg max-w-2xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            No restrictions, no limitations. Use any strategy that works for you with complete trading freedom.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {tradingFeatures.map((feature, index) => {
            const IconComponent = iconMap[feature.icon] || Zap;
            return (
              <div 
                key={index}
                className={`rounded-2xl p-6 border transition-all duration-300 group hover:-translate-y-1 ${
                  isDark 
                    ? 'bg-[#12161d] border-white/10 hover:border-amber-500/30' 
                    : 'bg-white border-slate-200 hover:border-amber-300 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    isDark 
                      ? 'bg-amber-500/10 group-hover:bg-amber-500/20' 
                      : 'bg-amber-100 group-hover:bg-amber-200'
                  }`}>
                    <IconComponent className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {feature.title}
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA Banner */}
        <div className={`rounded-3xl p-8 lg:p-12 border text-center ${
          isDark 
            ? 'bg-gradient-to-r from-amber-500/10 to-amber-600/5 border-amber-500/20' 
            : 'bg-gradient-to-r from-amber-50 to-amber-100/50 border-amber-200'
        }`}>
          <h3 className={`text-2xl lg:text-3xl font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Ready to Trade Without Limits?
          </h3>
          <p className={`mb-6 max-w-xl mx-auto ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
            Join thousands of traders who enjoy complete freedom with Prop Capitals. No restrictions on how you trade.
          </p>
          <Link to="/challenges">
            <Button className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] rounded-full px-8 py-6 h-auto text-lg font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all group">
              Get Started Now
              <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
