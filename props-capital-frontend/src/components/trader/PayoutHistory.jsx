import React from 'react';
import { DollarSign, Clock, AlertCircle, TrendingUp, AlertTriangle } from 'lucide-react';

import { useTraderTheme } from './TraderPanelLayout';
import { useChallenges } from '@/contexts/ChallengesContext';

const PayoutHistory = () => {
  const { isDark } = useTraderTheme();
  const { selectedChallenge } = useChallenges();


  // Calculate available balance from selected challenge
  const availableBalance = selectedChallenge
    ? Math.max(0, selectedChallenge.currentBalance - selectedChallenge.accountSize)
    : 2847.53;

  const totalPaid = 0;
  const pendingAmount = 0;


  // Check if user can request payout
  const canRequestPayout = false; // backend not implemented yet

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className={`text-xl sm:text-2xl font-bold ${textClass}`}>Payout History</h2>
        <button
          onClick={() => { }}
          disabled={!canRequestPayout}
          data-testid="request-payout-btn"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${canRequestPayout
            ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0d12] hover:from-amber-500 hover:to-amber-600'
            : isDark ? 'bg-white/10 text-gray-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
        >
          <DollarSign className="w-4 h-4" />
          Request Payout
        </button>
      </div>

      {/* Info Banner for non-funded accounts */}
      {selectedChallenge && selectedChallenge.phase !== 'funded' && (
        <div className={`${cardClass} p-4 flex items-start gap-3`}>
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className={`font-medium ${textClass}`}>Payouts Available After Funding</p>
            <p className={`text-sm ${mutedClass}`}>
              Complete your challenge to unlock payout requests. You are currently in {selectedChallenge.phase === 1 ? 'Phase 1' : selectedChallenge.phase === 2 ? 'Phase 2' : 'evaluation'}.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className={cardClass + ' p-4 sm:p-5'}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className={`text-xs sm:text-sm ${mutedClass}`}>Total Paid Out</p>
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          </div>
          <p className={`text-xl sm:text-2xl font-bold ${textClass}`}>${totalPaid.toLocaleString()}</p>
        </div>
        <div className={cardClass + ' p-4 sm:p-5'}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className={`text-xs sm:text-sm ${mutedClass}`}>Pending</p>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </div>
          <p className="text-amber-500 text-xl sm:text-2xl font-bold">${pendingAmount.toLocaleString()}</p>
        </div>
        <div className={cardClass + ' p-4 sm:p-5'}>
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <p className={`text-xs sm:text-sm ${mutedClass}`}>Available Balance</p>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          </div>
          <p className="text-emerald-500 text-xl sm:text-2xl font-bold">${availableBalance.toLocaleString()}</p>
        </div>
      </div>

      {/* Zero State (no backend yet) */}
      <div className={`${cardClass} p-8 text-center`}>
        <AlertCircle className="w-10 h-10 mx-auto mb-3 text-amber-500" />
        <h3 className={`text-lg font-bold ${textClass}`}>No payout history yet</h3>
      </div>
    </div>
  );
};

export default PayoutHistory;
