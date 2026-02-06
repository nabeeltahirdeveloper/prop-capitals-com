import React, { useState } from 'react';
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  TrendingUp,
  X,
  CreditCard,
  Wallet,
  Building,
  AlertTriangle,
  ArrowRight,
  Shield,
  ChevronDown
} from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';
import { useChallenges } from '@/contexts/ChallengesContext';

// Demo payout history
const initialPayoutHistory = [
  { id: 1, amount: 4500.00, status: 'completed', method: 'Bank Transfer', requestDate: '2025-01-15', processDate: '2025-01-17', txId: 'PAY-001234' },
  { id: 2, amount: 2850.00, status: 'completed', method: 'Crypto (USDT)', requestDate: '2025-01-10', processDate: '2025-01-11', txId: 'PAY-001233' },
  { id: 3, amount: 1200.00, status: 'pending', method: 'Bank Transfer', requestDate: '2025-01-20', processDate: null, txId: 'PAY-001235' },
  { id: 4, amount: 3750.00, status: 'completed', method: 'Crypto (BTC)', requestDate: '2025-01-05', processDate: '2025-01-06', txId: 'PAY-001232' },
  { id: 5, amount: 5200.00, status: 'completed', method: 'Bank Transfer', requestDate: '2024-12-28', processDate: '2024-12-30', txId: 'PAY-001231' },
];

const paymentMethods = [
  { id: 'bank', name: 'Bank Transfer', icon: Building, desc: '2-3 business days', fee: '0%' },
  { id: 'crypto_usdt', name: 'Crypto (USDT)', icon: Wallet, desc: 'Within 24 hours', fee: '0%' },
  { id: 'crypto_btc', name: 'Crypto (BTC)', icon: Wallet, desc: 'Within 24 hours', fee: '0.5%' },
];

const PayoutHistory = () => {
  const { isDark } = useTraderTheme();
  const { selectedChallenge, challenges, selectChallenge, getChallengePhaseLabel, updateChallengeBalance } = useChallenges();
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutStep, setPayoutStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState('bank');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutHistory, setPayoutHistory] = useState(initialPayoutHistory);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Calculate available balance from selected challenge
  const availableBalance = selectedChallenge
    ? Math.max(0, selectedChallenge.currentBalance - selectedChallenge.accountSize)
    : 2847.53;

  const minPayout = 100;
  const totalPaid = payoutHistory.filter(p => p.status === 'completed').reduce((acc, p) => acc + p.amount, 0);
  const pendingAmount = payoutHistory.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);

  // Check if user can request payout
  const canRequestPayout = selectedChallenge?.phase === 'funded' && availableBalance >= minPayout;
  const profitSplit = selectedChallenge?.profitSplit || 80;

  const handleOpenModal = () => {
    setShowPayoutModal(true);
    setPayoutStep(1);
    setPayoutAmount('');
    setPayoutSuccess(false);
  };

  const handleRequestPayout = () => {
    if (!payoutAmount || parseFloat(payoutAmount) < minPayout || parseFloat(payoutAmount) > availableBalance) {
      return;
    }

    const amount = parseFloat(payoutAmount);

    // Create new payout request (demo: immediately completed)
    const today = new Date().toISOString().split('T')[0];
    const newPayout = {
      id: payoutHistory.length + 1,
      amount: amount,
      status: 'completed', // Demo flow - instant completion
      method: paymentMethods.find(m => m.id === selectedMethod)?.name || 'Bank Transfer',
      requestDate: today,
      processDate: today, // Same day processing for demo
      txId: `PAY-${String(payoutHistory.length + 1001).padStart(6, '0')}`
    };

    // Update challenge balance (deduct payout amount)
    if (updateChallengeBalance && selectedChallenge) {
      updateChallengeBalance(selectedChallenge.id, selectedChallenge.currentBalance - amount);
    }

    setPayoutHistory([newPayout, ...payoutHistory]);
    setPayoutSuccess(true);
    setPayoutStep(3);
  };

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className={`text-xl sm:text-2xl font-bold ${textClass}`}>Payout History</h2>

          {/* Challenge Dropdown */}
          {challenges.length > 1 && (
            <div className="relative">
              <select
                value={selectedChallenge?.id || ''}
                onChange={(e) => selectChallenge(e.target.value)}
                data-testid="payout-challenge-selector"
                className={`appearance-none px-3 py-1.5 pr-8 rounded-lg font-medium cursor-pointer text-sm transition-all ${isDark
                  ? 'bg-[#1a1f2e] border border-white/10 text-white hover:border-amber-500/50'
                  : 'bg-slate-50 border border-slate-200 text-slate-900 hover:border-amber-500'
                  } focus:outline-none focus:ring-2 focus:ring-amber-500/50`}
                style={isDark ? { colorScheme: 'dark' } : {}}
              >
                {challenges.map((challenge) => {
                  const label = getChallengePhaseLabel(challenge);
                  const type = challenge.type === '1-step' ? '1-Step' : '2-Step';
                  return (
                    <option key={challenge.id} value={challenge.id} className={isDark ? 'bg-[#1a1f2e] text-white' : ''}>
                      {type} ${challenge.accountSize.toLocaleString()} - {label}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
            </div>
          )}
        </div>
        <button
          onClick={handleOpenModal}
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

      {/* Payout Table */}
      <div className={cardClass + ' overflow-hidden'}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4 ${mutedClass}`}>Transaction ID</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4 ${mutedClass}`}>Amount</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4 ${mutedClass} hidden sm:table-cell`}>Method</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4 ${mutedClass} hidden md:table-cell`}>Request Date</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4 ${mutedClass} hidden lg:table-cell`}>Process Date</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-4 sm:px-6 py-3 sm:py-4 ${mutedClass}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payoutHistory.map((payout) => (
                <tr key={payout.id} className={`border-b transition-all ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={`font-mono text-xs sm:text-sm ${textClass}`}>{payout.txId}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className="text-emerald-500 font-bold text-sm sm:text-base">${payout.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4 hidden sm:table-cell">
                    <span className={`text-sm ${textClass}`}>{payout.method}</span>
                  </td>
                  <td className={`px-4 sm:px-6 py-3 sm:py-4 text-sm ${mutedClass} hidden md:table-cell`}>{payout.requestDate}</td>
                  <td className={`px-4 sm:px-6 py-3 sm:py-4 text-sm ${mutedClass} hidden lg:table-cell`}>{payout.processDate || '-'}</td>
                  <td className="px-4 sm:px-6 py-3 sm:py-4">
                    <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-xs font-semibold ${payout.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-amber-500/10 text-amber-500'
                      }`}>
                      {payout.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      <span className="hidden xs:inline">{payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`${cardClass} w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
            {/* Modal Header */}
            <div className={`p-4 sm:p-6 border-b flex items-center justify-between ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h3 className={`font-bold text-lg ${textClass}`}>Request Payout</h3>
                  <p className={`text-sm ${mutedClass}`}>
                    {payoutStep === 1 ? 'Enter amount' : payoutStep === 2 ? 'Select method' : 'Complete'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPayoutModal(false)}
                className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Amount */}
            {payoutStep === 1 && (
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${textClass}`}>Payout Amount</label>
                  <div className="relative">
                    <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold ${mutedClass}`}>$</span>
                    <input
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      placeholder="0.00"
                      min={minPayout}
                      max={availableBalance}
                      data-testid="payout-amount-input"
                      className={`w-full pl-10 pr-4 py-4 text-2xl font-bold rounded-xl border ${isDark
                        ? 'bg-white/5 border-white/10 text-white placeholder-gray-600 focus:border-amber-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-amber-500'
                        } focus:outline-none focus:ring-2 focus:ring-amber-500/20`}
                    />
                  </div>
                </div>

                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex justify-between mb-2">
                    <span className={mutedClass}>Available Balance</span>
                    <span className="text-emerald-500 font-bold">${availableBalance.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className={mutedClass}>Your Share ({profitSplit}%)</span>
                    <span className={textClass}>${(availableBalance * profitSplit / 100).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={mutedClass}>Minimum Payout</span>
                    <span className={textClass}>${minPayout}</span>
                  </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => setPayoutAmount(String(Math.floor(availableBalance * percent / 100)))}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setPayoutStep(2)}
                  disabled={!payoutAmount || parseFloat(payoutAmount) < minPayout || parseFloat(payoutAmount) > availableBalance}
                  data-testid="payout-continue-btn"
                  className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${payoutAmount && parseFloat(payoutAmount) >= minPayout && parseFloat(payoutAmount) <= availableBalance
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:from-amber-500 hover:to-amber-600'
                    : isDark ? 'bg-white/10 text-gray-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {payoutStep === 2 && (
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-3 ${textClass}`}>Select Payment Method</label>
                  <div className="space-y-2">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${selectedMethod === method.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : isDark ? 'border-white/10 hover:border-white/20' : 'border-slate-200 hover:border-slate-300'
                          }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-slate-100'
                          }`}>
                          <method.icon className={`w-6 h-6 ${selectedMethod === method.id ? 'text-amber-500' : mutedClass}`} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className={`font-semibold ${textClass}`}>{method.name}</p>
                          <p className={`text-sm ${mutedClass}`}>{method.desc}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-medium ${method.fee === '0%' ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {method.fee} fee
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex justify-between mb-2">
                    <span className={mutedClass}>Payout Amount</span>
                    <span className={`font-bold ${textClass}`}>${parseFloat(payoutAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className={mutedClass}>Processing Fee</span>
                    <span className={textClass}>{paymentMethods.find(m => m.id === selectedMethod)?.fee}</span>
                  </div>
                  <div className={`flex justify-between pt-2 border-t ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                    <span className={`font-semibold ${textClass}`}>You Receive</span>
                    <span className="text-emerald-500 font-bold text-lg">${parseFloat(payoutAmount).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setPayoutStep(1)}
                    className={`flex-1 py-3 rounded-xl font-medium ${isDark ? 'bg-white/5 text-gray-300 hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleRequestPayout}
                    data-testid="payout-confirm-btn"
                    className="flex-1 py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl hover:from-amber-500 hover:to-amber-600 flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" />
                    Confirm Payout
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Success */}
            {payoutStep === 3 && (
              <div className="p-6 sm:p-8 text-center">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h3 className={`text-2xl font-bold mb-2 ${textClass}`}>Payout Complete!</h3>
                <p className={`mb-6 ${mutedClass}`}>
                  Your demo payout has been processed successfully.
                </p>

                <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-white/5' : 'bg-slate-50'}`}>
                  <div className="flex justify-between mb-2">
                    <span className={mutedClass}>Amount</span>
                    <span className="text-emerald-500 font-bold">${parseFloat(payoutAmount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className={mutedClass}>Method</span>
                    <span className={textClass}>{paymentMethods.find(m => m.id === selectedMethod)?.name}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className={mutedClass}>Status</span>
                    <span className="text-emerald-500 font-semibold flex items-center gap-1">
                      <CheckCircle className="w-4 h-4" /> Completed
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className={mutedClass}>Transaction ID</span>
                    <span className={`font-mono text-sm ${textClass}`}>PAY-{String(payoutHistory.length + 1000).padStart(6, '0')}</span>
                  </div>
                </div>

                <div className={`p-3 rounded-lg mb-6 text-sm ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                  <span className="font-medium">Demo Mode:</span> This is a simulated payout for demonstration purposes.
                </div>

                <button
                  onClick={() => setShowPayoutModal(false)}
                  data-testid="payout-done-btn"
                  className="w-full py-3 bg-gradient-to-r from-amber-400 to-amber-500 text-black font-bold rounded-xl hover:from-amber-500 hover:to-amber-600"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutHistory;
