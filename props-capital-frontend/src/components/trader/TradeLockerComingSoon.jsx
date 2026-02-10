import React from 'react';
import { Lock, ArrowLeft, Clock } from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';
import { useNavigate } from 'react-router-dom';

const TradeLockerComingSoon = () => {
  const { isDark } = useTraderTheme();
  const navigate = useNavigate();

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#0d1117] border-white/10' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`${cardClass} p-8 sm:p-12 text-center max-w-lg w-full`}>
        <div className={`w-20 h-20 rounded-2xl mx-auto mb-6 flex items-center justify-center ${isDark ? 'bg-amber-500/10' : 'bg-amber-50'}`}>
          <Lock className="w-10 h-10 text-amber-500" />
        </div>

        <h2 className={`text-2xl sm:text-3xl font-bold mb-3 ${textClass}`}>
          TradeLocker
        </h2>

        <div className="flex items-center justify-center gap-2 mb-4">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-amber-500 font-semibold text-sm">Coming Soon</span>
        </div>

        <p className={`text-base mb-8 leading-relaxed ${mutedClass}`}>
          We're currently working on integrating TradeLocker into our platform.
          This feature will be available soon. Please choose another trading platform in the meantime.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => navigate('/traderdashboard/checkout')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-black font-bold rounded-xl transition-all"
          >
            Choose Another Platform
          </button>
          <button
            onClick={() => navigate('/traderdashboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradeLockerComingSoon;
