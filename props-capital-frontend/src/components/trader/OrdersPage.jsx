import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Filter,
  Download,
  Search,
  ChevronDown,
  Loader2
} from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';
import { useTrading } from '@/contexts/TradingContext';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const OrdersPage = () => {
  const { isDark } = useTraderTheme();
  const { orders, ordersLoading } = useTrading();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'open') return order.status === 'OPEN';
    if (activeTab === 'closed') return order.status === 'CLOSED';
    return true;
  }).filter(order =>
    order.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const closedOrders = orders.filter(o => o.status === 'CLOSED');
  const openOrders = orders.filter(o => o.status === 'OPEN');
  const totalProfit = closedOrders.reduce((acc, o) => acc + (o.profit || 0), 0);
  const openProfit = openOrders.reduce((acc, o) => acc + (o.profit || 0), 0);
  const winRate = closedOrders.length > 0
    ? (closedOrders.filter(o => o.profit > 0).length / closedOrders.length * 100).toFixed(1)
    : '0.0';

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Orders</h2>
        <button className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
          }`}>
          <Download className="w-4 h-4" />
          <span className="text-sm font-medium">Export</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Total Trades</p>
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{orders.length}</p>
        </div>
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Closed P/L</p>
          <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </p>
        </div>
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Open P/L</p>
          <p className={`text-2xl font-bold ${openProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {openProfit >= 0 ? '+' : ''}${openProfit.toFixed(2)}
          </p>
        </div>
        <div className={`rounded-2xl border p-5 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
          <p className={`text-sm mb-2 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Win Rate</p>
          <p className="text-amber-500 text-2xl font-bold">{winRate}%</p>
        </div>
      </div>

      {/* Filters */}
      <div className={`rounded-2xl border p-4 ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* Tabs - Highlighted */}
          <div className={`flex items-center gap-2 rounded-xl p-1.5 ${isDark ? 'bg-white/5' : 'bg-slate-100'}`}>
            {[
              { key: 'all', label: 'All Orders', count: orders.length },
              { key: 'open', label: 'Open', count: openOrders.length },
              { key: 'closed', label: 'Closed', count: closedOrders.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                data-testid={`filter-${tab.key}`}
                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === tab.key
                  ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-[#0a0d12] shadow-lg shadow-amber-500/20'
                  : isDark
                    ? 'text-gray-400 hover:text-white hover:bg-white/10'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                  }`}
              >
                {tab.label}
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.key
                  ? 'bg-[#0a0d12]/20 text-[#0a0d12]'
                  : isDark ? 'bg-white/10 text-gray-400' : 'bg-slate-200 text-slate-500'
                  }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full sm:w-64 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500/50 ${isDark ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-900'
                }`}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-6 py-4 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Symbol</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-6 py-4 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Type</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-6 py-4 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Lots</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-6 py-4 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Open Price</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-6 py-4 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Close Price</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-6 py-4 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Open Time</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-6 py-4 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>P/L</th>
                <th className={`text-left text-xs font-semibold uppercase tracking-wider px-6 py-4 ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className={`border-b transition-all ${isDark ? 'border-white/5 hover:bg-white/5' : 'border-slate-100 hover:bg-slate-50'}`}>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{order.symbol}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${order.type === 'BUY'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-red-500/10 text-red-500'
                      }`}>
                      {order.type === 'BUY' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {order.type}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{order.volume}</td>
                  <td className={`px-6 py-4 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{order.price}</td>
                  <td className={`px-6 py-4 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{order.closePrice || '-'}</td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{formatDateTime(order.openAt)}</td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${order.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {order.profit >= 0 ? '+' : ''}${(order.profit || 0).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${order.status === 'OPEN'
                      ? 'bg-amber-500/10 text-amber-500'
                      : isDark ? 'bg-white/10 text-gray-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {order.status === 'OPEN' && <Clock className="w-3 h-3" />}
                      {order.status === 'OPEN' ? 'Open' : 'Closed'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <p className={isDark ? 'text-gray-500' : 'text-slate-500'}>No orders found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
