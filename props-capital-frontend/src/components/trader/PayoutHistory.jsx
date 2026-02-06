import React from 'react';
import {
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  TrendingUp
} from 'lucide-react';

// Demo payout history
const payoutHistory = [
  { id: 1, amount: 4500.00, status: 'completed', method: 'Bank Transfer', requestDate: '2025-01-15', processDate: '2025-01-17', txId: 'PAY-001234' },
  { id: 2, amount: 2850.00, status: 'completed', method: 'Crypto (USDT)', requestDate: '2025-01-10', processDate: '2025-01-11', txId: 'PAY-001233' },
  { id: 3, amount: 1200.00, status: 'pending', method: 'Bank Transfer', requestDate: '2025-01-20', processDate: null, txId: 'PAY-001235' },
  { id: 4, amount: 3750.00, status: 'completed', method: 'Crypto (BTC)', requestDate: '2025-01-05', processDate: '2025-01-06', txId: 'PAY-001232' },
  { id: 5, amount: 5200.00, status: 'completed', method: 'Bank Transfer', requestDate: '2024-12-28', processDate: '2024-12-30', txId: 'PAY-001231' },
];

const PayoutHistory = () => {
  const totalPaid = payoutHistory.filter(p => p.status === 'completed').reduce((acc, p) => acc + p.amount, 0);
  const pendingAmount = payoutHistory.filter(p => p.status === 'pending').reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-white text-2xl font-bold">Payout History</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0d12] rounded-xl font-semibold hover:from-amber-500 hover:to-amber-600 transition-all">
          <DollarSign className="w-4 h-4" />
          Request Payout
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#12161d] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">Total Paid Out</p>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-white text-2xl font-bold">${totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-[#12161d] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">Pending</p>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-amber-500 text-2xl font-bold">${pendingAmount.toLocaleString()}</p>
        </div>
        <div className="bg-[#12161d] rounded-2xl border border-white/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-gray-500 text-sm">Available Balance</p>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-emerald-500 text-2xl font-bold">$2,847.53</p>
        </div>
      </div>

      {/* Payout Table */}
      <div className="bg-[#12161d] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-6 py-4">Transaction ID</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-6 py-4">Amount</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-6 py-4">Method</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-6 py-4">Request Date</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-6 py-4">Process Date</th>
                <th className="text-left text-gray-500 text-xs font-semibold uppercase tracking-wider px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {payoutHistory.map((payout) => (
                <tr key={payout.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                  <td className="px-6 py-4">
                    <span className="text-white font-mono text-sm">{payout.txId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-emerald-500 font-bold">${payout.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-white text-sm">{payout.method}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{payout.requestDate}</td>
                  <td className="px-6 py-4 text-gray-400 text-sm">{payout.processDate || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${payout.status === 'completed'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-amber-500/10 text-amber-500'
                      }`}>
                      {payout.status === 'completed' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PayoutHistory;
