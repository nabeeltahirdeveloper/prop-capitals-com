import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTraderTheme } from './TraderPanelLayout';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPayments } from '@/api/payments';

const STATUS_CONFIG = {
  succeeded: { label: 'Succeeded', icon: CheckCircle2, color: 'emerald' },
  pending: { label: 'Pending', icon: Clock, color: 'amber' },
  failed: { label: 'Failed', icon: XCircle, color: 'red' },
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'succeeded', label: 'Succeeded' },
  { key: 'pending', label: 'Pending' },
  { key: 'failed', label: 'Failed' },
];

const TransactionsPage = () => {
  const { isDark } = useTraderTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  const { data: payments = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['user-payments', user?.userId],
    queryFn: () => getUserPayments(user.userId),
    enabled: !!user?.userId,
    staleTime: 30 * 1000,
  });

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';

  // Filter by tab and search
  const filtered = payments.filter((p) => {
    if (activeTab !== 'all' && p.status !== activeTab) return false;
    if (search) {
      const q = search.toLowerCase();
      const ref = (p.reference || '').toLowerCase();
      const name = (p.challenge?.name || '').toLowerCase();
      if (!ref.includes(q) && !name.includes(q)) return false;
    }
    return true;
  });

  // Stats
  const stats = {
    total: payments.length,
    succeeded: payments.filter((p) => p.status === 'succeeded').length,
    pending: payments.filter((p) => p.status === 'pending').length,
    failed: payments.filter((p) => p.status === 'failed').length,
  };

  const formatAmount = (cents) => {
    if (!cents && cents !== 0) return '—';
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StatusBadge = ({ status }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
        ${cfg.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-500' : ''}
        ${cfg.color === 'amber' ? 'bg-amber-500/10 text-amber-500' : ''}
        ${cfg.color === 'red' ? 'bg-red-500/10 text-red-500' : ''}
      `}>
        <Icon className="w-3 h-3" />
        {cfg.label}
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h2 className={`text-xl sm:text-2xl font-bold ${textClass}`}>Transactions</h2>
        <button
          onClick={() => refetch()}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all ${isDark ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total', value: stats.total, icon: Receipt, color: 'text-blue-500' },
          { label: 'Succeeded', value: stats.succeeded, icon: CheckCircle2, color: 'text-emerald-500' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-500' },
          { label: 'Failed', value: stats.failed, icon: XCircle, color: 'text-red-500' },
        ].map((s) => (
          <div key={s.label} className={cardClass + ' p-4 sm:p-5'}>
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <p className={`text-xs sm:text-sm ${mutedClass}`}>{s.label}</p>
              <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`} />
            </div>
            <p className={`text-xl sm:text-2xl font-bold ${textClass}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={`${cardClass} p-4`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Tabs */}
          <div className={`flex gap-1 p-1 rounded-xl ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
            {TABS.map((tab) => {
              const count = tab.key === 'all' ? stats.total : stats[tab.key] || 0;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    activeTab === tab.key
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-black'
                      : isDark ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    activeTab === tab.key
                      ? 'bg-black/20 text-black'
                      : isDark ? 'bg-white/10 text-gray-500' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative flex-1 w-full sm:w-auto sm:max-w-xs">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${mutedClass}`} />
            <input
              type="text"
              placeholder="Search by reference or challenge..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-xl text-sm border focus:outline-none focus:border-amber-500/50 ${
                isDark ? 'bg-white/5 border-white/10 text-white placeholder:text-gray-500' : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={`${cardClass} overflow-hidden`}>
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className={`w-8 h-8 mx-auto mb-3 animate-spin ${mutedClass}`} />
            <p className={mutedClass}>Loading transactions...</p>
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <XCircle className="w-8 h-8 mx-auto mb-3 text-red-500" />
            <p className={textClass}>Failed to load transactions</p>
            <button onClick={() => refetch()} className="mt-3 text-amber-500 text-sm font-semibold hover:underline">
              Try again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className={`w-8 h-8 mx-auto mb-3 ${mutedClass}`} />
            <p className={textClass}>No transactions found</p>
            {activeTab !== 'all' && (
              <button onClick={() => setActiveTab('all')} className="mt-2 text-amber-500 text-sm font-semibold hover:underline">
                Show all transactions
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className={isDark ? 'border-b border-white/5' : 'border-b border-slate-100'}>
                  {['Reference', 'Challenge', 'Amount', 'Provider', 'Status', 'Date', ''].map((h) => (
                    <th key={h} className={`text-left text-xs font-semibold uppercase tracking-wider px-4 py-3 ${mutedClass}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className={`transition-colors ${isDark ? 'border-b border-white/5 hover:bg-white/[0.02]' : 'border-b border-slate-50 hover:bg-slate-50'}`}
                  >
                    <td className={`px-4 py-3.5 font-mono text-xs ${textClass}`}>
                      {p.reference || p.id.substring(0, 12)}
                    </td>
                    <td className="px-4 py-3.5">
                      <div>
                        <p className={`text-sm font-medium ${textClass}`}>{p.challenge?.name || '—'}</p>
                        <p className={`text-xs ${mutedClass}`}>
                          {p.challenge?.accountSize ? `$${p.challenge.accountSize.toLocaleString()}` : ''}{' '}
                          {p.challenge?.challengeType || ''}
                        </p>
                      </div>
                    </td>
                    <td className={`px-4 py-3.5 font-semibold ${textClass}`}>
                      {formatAmount(p.amount)}
                      {p.discountAmount > 0 && (
                        <span className="block text-xs text-emerald-500">-{formatAmount(p.discountAmount)} off</span>
                      )}
                    </td>
                    <td className={`px-4 py-3.5 text-sm ${mutedClass}`}>
                      {p.provider === 'worldcard' ? 'WorldCard' : p.provider === 'internal' ? 'Internal' : p.provider}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className={`px-4 py-3.5 text-xs ${mutedClass}`}>
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      {p.status === 'succeeded' && p.tradingAccountId && (
                        <Link
                          to="/traderdashboard"
                          className="text-amber-500 hover:text-amber-400 transition-colors"
                          title="View account"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                      {p.status === 'pending' && p.reference && (
                        <Link
                          to={`/traderdashboard/checkout/success?reference=${p.reference}`}
                          className="text-amber-500 hover:text-amber-400 transition-colors"
                          title="Check status"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;
