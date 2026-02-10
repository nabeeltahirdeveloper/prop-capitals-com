import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';
import { useChallenges } from '@/contexts/ChallengesContext';
import ChallengeActiveBanner from '../trading/ChallengeActiveBanner';
import PhaseProgressionCards from '../trading/PhaseProgressionCards';
import BalanceStatsRow from '../trading/BalanceStatsRow';
import ComplianceMetrics from '../trading/ComplianceMetrics';
import TradingStyleRules from '../trading/TradingStyleRules';

const CommonTerminalWrapper = ({ children }) => {
  const { isDark } = useTraderTheme();
  const { 
    selectedChallenge, 
    getChallengePhaseLabel, 
    getRuleCompliance,
    loading 
  } = useChallenges();
  
  const [selectedTab, setSelectedTab] = useState('positions');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>Loading challenges...</p>
        </div>
      </div>
    );
  }

  if (!selectedChallenge) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
            <TrendingUp className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
          </div>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
            No Active Challenges
          </p>
          <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
            Purchase a challenge to start trading
          </p>
          <a 
            href="/traderdashboard/checkout" 
            className="inline-block mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-colors"
          >
            Buy Challenge
          </a>
        </div>
      </div>
    );
  }

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';
  
  const phaseLabel = getChallengePhaseLabel(selectedChallenge);
  const compliance = getRuleCompliance(selectedChallenge);
  const balance = selectedChallenge.currentBalance || 0;
  const equity = selectedChallenge.equity || balance;
  const floatingPL = 0; // Would come from open positions
  const profitPercent = ((balance - selectedChallenge.accountSize) / selectedChallenge.accountSize) * 100;

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* ==================== CHALLENGE ACTIVE BANNER ==================== */}
      <ChallengeActiveBanner challenge={selectedChallenge} phaseLabel={phaseLabel} />

      {/* ==================== PHASE PROGRESSION ==================== */}
      <PhaseProgressionCards challenge={selectedChallenge} />

      {/* ==================== BALANCE STATS ROW ==================== */}
      <BalanceStatsRow 
        balance={balance}
        equity={equity}
        floatingPL={floatingPL}
        profitPercent={profitPercent}
      />

      {/* ==================== COMPLIANCE METRICS ==================== */}
      <ComplianceMetrics compliance={compliance} challenge={selectedChallenge} />

      {/* ==================== PLATFORM-SPECIFIC TRADING AREA ==================== */}
      <div className="my-6">
        {children}
      </div>

      {/* ==================== TRADING STYLE RULES ==================== */}
      <TradingStyleRules challenge={selectedChallenge} />

      {/* ==================== POSITIONS / PENDING / HISTORY ==================== */}
      <div className={cardClass}>
        <div className={`flex border-b ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
          {[
            { id: 'positions', label: 'Positions', count: 0 },
            { id: 'pending', label: 'Pending', count: 0 },
            { id: 'history', label: 'History', count: 0 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm transition-all ${
                selectedTab === tab.id
                  ? `${textClass} border-b-2 border-amber-500`
                  : `${mutedClass} hover:${textClass}`
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
        <div className={`p-8 text-center ${isDark ? 'bg-[#0a0d12]' : 'bg-slate-50'}`}>
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
            <TrendingUp className={`w-8 h-8 ${mutedClass}`} />
          </div>
          <p className={`font-medium ${textClass}`}>
            {selectedTab === 'positions' ? 'No Open Positions' :
              selectedTab === 'pending' ? 'No Pending Orders' :
                'No Trade History'}
          </p>
          <p className={`text-sm mt-2 ${mutedClass}`}>
            {selectedTab === 'positions' ? 'Place a trade to see your positions here' :
              selectedTab === 'pending' ? 'Create pending orders to see them here' :
                'Your closed trades will appear here'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommonTerminalWrapper;
