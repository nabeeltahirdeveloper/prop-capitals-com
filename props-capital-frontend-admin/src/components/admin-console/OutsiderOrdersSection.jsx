import React, { useState, useEffect } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';

export default function OutsiderOrdersSection() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [state, setState] = useState({ page: 1, pageSize: 20, q: '', status: '' });
  const [searchQuery, setSearchQuery] = useState('');
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadOrders();
  }, [state.page, state.q, state.status]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: String(state.page),
        pageSize: String(state.pageSize),
        ...(state.q ? { q: state.q } : {}),
        ...(state.status ? { status: state.status } : {}),
      };
      const res = await adminConsoleApi.outsiderOrders.list(params);
      const ordersList = res.data?.orders || [];
      setOrders(ordersList);
      setMeta(res.data?.meta || { page: 1, pages: 1, total: 0 });
      // Extract unique project names for filter
      const unique = [...new Set(ordersList.map(o => o.project_name).filter(Boolean))];
      if (unique.length > projects.length) setProjects(unique);
    } catch (error) {
      console.error('Failed to load outsider orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setState(prev => ({ ...prev, q: searchQuery.trim(), page: 1 }));
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dateStr; }
  };

  const getStatusBadge = (status) => {
    if (!status) return 'status-pending';
    const s = status.toLowerCase();
    if (s === 'paid' || s === 'approved') return 'status-active';
    if (s === 'failed' || s === 'declined' || s === 'decline') return 'status-inactive';
    if (s === 'pending' || s === 'processing') return 'status-pending';
    return 'status-pending';
  };

  const getStatusLabel = (status) => {
    if (!status) return 'Unknown';
    const s = status.toLowerCase();
    if (s === 'paid') return 'Paid';
    if (s === 'approved') return 'Approved';
    if (s === 'failed') return 'Failed';
    if (s === 'declined' || s === 'decline') return 'Declined';
    if (s === 'pending') return 'Pending';
    if (s === 'processing') return 'Processing';
    return status;
  };

  // Status counts from current orders
  const statusCounts = {
    paid: orders.filter(o => o.payment_status === 'paid').length,
    failed: orders.filter(o => ['failed', 'declined', 'decline'].includes(o.payment_status)).length,
    pending: orders.filter(o => ['pending', 'processing'].includes(o.payment_status)).length,
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold gradient-text">Outsider Orders</h2>
          <p className="text-gray-400 mt-1">Transactions from external projects using the Checkout API</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 rounded-xl">
          <div className="text-2xl font-bold text-cyan-400">{meta.total}</div>
          <div className="text-xs text-gray-500">Total Orders</div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="text-2xl font-bold text-green-400">{statusCounts.paid}</div>
          <div className="text-xs text-gray-500">Paid</div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="text-2xl font-bold text-red-400">{statusCounts.failed}</div>
          <div className="text-xs text-gray-500">Failed</div>
        </div>
        <div className="glass-card p-4 rounded-xl">
          <div className="text-2xl font-bold text-yellow-400">{statusCounts.pending}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              placeholder="Search by session ID, order ID, or email..."
              className="search-input p-3 rounded-lg flex-1"
            />
            <button onClick={handleSearch} className="action-btn btn-primary px-4">
              <i className="fas fa-search"></i>
            </button>
          </div>
          <select
            value={state.status || ''}
            onChange={(e) => setState(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="search-input p-3 rounded-lg min-w-[160px]"
          >
            <option value="">All Statuses</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel p-6">
        {loading ? (
          <div className="text-center py-12">
            <div>
              <i className="fas fa-spinner fa-spin text-4xl text-cyan-400 mb-4"></i>
              <p className="text-gray-400">Loading orders...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="table-container brands-table-scroll overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="text-left p-4">Project</th>
                    <th className="text-left p-4">Customer Email</th>
                    <th className="text-left p-4">Customer Name</th>
                    <th className="text-left p-4">Session / Order ID</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Currency</th>
                    <th className="text-left p-4">Gateway</th>
                    <th className="text-left p-4">Country</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="p-4" data-label="Project">
                        <span className="font-medium text-white">{order.project_name || '-'}</span>
                      </td>
                      <td className="p-4" data-label="Email">
                        {order.email || '-'}
                      </td>
                      <td className="p-4" data-label="Name">
                        {[order.first_name, order.last_name].filter(Boolean).join(' ') || '-'}
                      </td>
                      <td className="p-4" data-label="Session/Order">
                        <div className="text-xs font-mono text-cyan-300">{order.session_id}</div>
                        {order.order_id && (
                          <div className="text-xs text-gray-500 mt-1">{order.order_id}</div>
                        )}
                      </td>
                      <td className="p-4" data-label="Amount">
                        <span className="font-semibold text-white">{Number(order.amount || 0).toFixed(2)}</span>
                      </td>
                      <td className="p-4" data-label="Currency">
                        <span className="text-gray-300">{order.currency || '-'}</span>
                      </td>
                      <td className="p-4" data-label="Gateway">
                        <span className="text-gray-400">{order.payment_gateway || '-'}</span>
                      </td>
                      <td className="p-4" data-label="Country">
                        <span className="text-gray-400">{order.billing_country || '-'}</span>
                      </td>
                      <td className="p-4" data-label="Status">
                        <span className={`status-badge ${getStatusBadge(order.payment_status)}`}>
                          {getStatusLabel(order.payment_status)}
                        </span>
                      </td>
                      <td className="p-4" data-label="Date">
                        <span className="text-gray-400">{formatDate(order.created_at)}</span>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && !loading && (
                    <tr>
                      <td colSpan="10" className="p-8 text-center text-gray-400">
                        {state.q
                          ? `No orders match "${state.q}".`
                          : 'No outsider orders found. Orders will appear here when external projects make payments through the Checkout API.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0 pt-4 mt-auto border-t border-gray-700">
                <button
                  className="action-btn btn-secondary w-full sm:w-auto"
                  onClick={() => state.page > 1 && setState(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={state.page <= 1}
                >
                  Prev
                </button>
                <div className="text-sm text-gray-400 text-center order-first sm:order-none">
                  Page {meta.page} of {meta.pages} — {meta.total} total
                </div>
                <button
                  className="action-btn btn-secondary w-full sm:w-auto"
                  onClick={() => state.page < meta.pages && setState(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={state.page >= meta.pages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
