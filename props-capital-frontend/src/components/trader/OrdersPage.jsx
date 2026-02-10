import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Clock,
  Filter,
  Download,
  Search,
  ChevronDown
} from 'lucide-react';
import { useTraderTheme } from './TraderPanelLayout';

// Demo orders data
const demoOrders = [
  { id: 1, symbol: 'EUR/USD', type: 'buy', lots: 0.5, openPrice: 1.08234, closePrice: 1.08567, profit: 166.50, openTime: '2025-01-15 09:30:00', closeTime: '2025-01-15 14:45:00', status: 'closed' },
  { id: 2, symbol: 'GBP/USD', type: 'sell', lots: 0.3, openPrice: 1.26789, closePrice: 1.26234, profit: 166.50, openTime: '2025-01-15 10:15:00', closeTime: '2025-01-15 16:30:00', status: 'closed' },
  { id: 3, symbol: 'USD/JPY', type: 'buy', lots: 0.2, openPrice: 149.234, closePrice: 149.876, profit: 85.60, openTime: '2025-01-14 08:00:00', closeTime: '2025-01-14 13:20:00', status: 'closed' },
  { id: 4, symbol: 'EUR/USD', type: 'buy', lots: 0.1, openPrice: 1.08456, closePrice: null, profit: 23.40, openTime: '2025-01-16 09:00:00', closeTime: null, status: 'open' },
  { id: 5, symbol: 'AUD/USD', type: 'sell', lots: 0.4, openPrice: 0.65678, closePrice: 0.65234, profit: 177.60, openTime: '2025-01-13 11:30:00', closeTime: '2025-01-13 17:45:00', status: 'closed' },
  { id: 6, symbol: 'USD/CAD', type: 'buy', lots: 0.25, openPrice: 1.35234, closePrice: 1.35678, profit: -111.00, openTime: '2025-01-12 14:00:00', closeTime: '2025-01-12 18:30:00', status: 'closed' },
  { id: 7, symbol: 'GBP/USD', type: 'buy', lots: 0.15, openPrice: 1.26123, closePrice: null, profit: 45.30, openTime: '2025-01-16 10:30:00', closeTime: null, status: 'open' },
  { id: 8, symbol: 'NZD/USD', type: 'sell', lots: 0.35, openPrice: 0.59456, closePrice: 0.59123, profit: 116.55, openTime: '2025-01-11 08:45:00', closeTime: '2025-01-11 15:20:00', status: 'closed' },
];

const OrdersPage = () => {
  const { isDark } = useTraderTheme();
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = demoOrders.filter(order => {
    if (activeTab === 'open') return order.status === 'open';
    if (activeTab === 'closed') return order.status === 'closed';
    return true;
  }).filter(order =>
    order.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalProfit = demoOrders.filter(o => o.status === 'closed').reduce((acc, o) => acc + o.profit, 0);
  const openProfit = demoOrders.filter(o => o.status === 'open').reduce((acc, o) => acc + o.profit, 0);
  const winRate = (demoOrders.filter(o => o.profit > 0).length / demoOrders.length * 100).toFixed(1);

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
          <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{demoOrders.length}</p>
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
              { key: 'all', label: 'All Orders', count: demoOrders.length },
              { key: 'open', label: 'Open', count: demoOrders.filter(o => o.status === 'open').length },
              { key: 'closed', label: 'Closed', count: demoOrders.filter(o => o.status === 'closed').length },
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
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${order.type === 'buy'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : 'bg-red-500/10 text-red-500'
                      }`}>
                      {order.type === 'buy' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {order.type.toUpperCase()}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{order.lots}</td>
                  <td className={`px-6 py-4 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{order.openPrice}</td>
                  <td className={`px-6 py-4 font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{order.closePrice || '-'}</td>
                  <td className={`px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{order.openTime}</td>
                  <td className="px-6 py-4">
                    <span className={`font-semibold ${order.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {order.profit >= 0 ? '+' : ''}${order.profit.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${order.status === 'open'
                      ? 'bg-amber-500/10 text-amber-500'
                      : isDark ? 'bg-white/10 text-gray-400' : 'bg-slate-100 text-slate-500'
                      }`}>
                      {order.status === 'open' && <Clock className="w-3 h-3" />}
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
