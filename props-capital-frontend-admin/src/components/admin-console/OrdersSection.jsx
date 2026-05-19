import React, { useState, useEffect } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import OrderModal from './OrderModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { useTranslation } from "../../contexts/LanguageContext";

export default function OrdersSection() {
  const { t } = useTranslation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load saved date filters from localStorage on mount
  const loadSavedDateFilters = () => {
    try {
      const saved = localStorage.getItem('adminOrdersDateFilters');
      if (saved) {
        const filters = JSON.parse(saved);
        return {
          fromDate: filters.fromDate || '',
          toDate: filters.toDate || ''
        };
      }
    } catch (e) {
      console.warn('Failed to load saved date filters:', e);
    }
    return { fromDate: '', toDate: '' };
  };

  const savedFilters = loadSavedDateFilters();

  const [state, setState] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    q: '',
    status: 'all',
    pkg: '',
    fromDate: savedFilters.fromDate,
    toDate: savedFilters.toDate
  });
  const [searchQuery, setSearchQuery] = useState(''); // Local search input value (debounced to state.q)
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [statusCounts, setStatusCounts] = useState({ approved: 0, unpaid: 0, declined: 0 });
  const [modalState, setModalState] = useState({
    show: false,
    mode: null, // 'view', 'edit', 'create'
    order: null,
    loading: false
  });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    orderId: null
  });

  // Save date filters to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('adminOrdersDateFilters', JSON.stringify({
        fromDate: state.fromDate,
        toDate: state.toDate
      }));
    } catch (e) {
      console.warn('Failed to save date filters:', e);
    }
  }, [state.fromDate, state.toDate]);

  // Debounced search - triggers 400ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setState(prev => {
        const trimmed = searchQuery.trim();
        if (prev.q === trimmed) return prev;
        return { ...prev, q: trimmed, page: 1 };
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle all filter changes - date filters will be disabled during loading
  useEffect(() => {
    loadOrders();
  }, [state.page, state.q, state.status, state.pkg, state.fromDate, state.toDate]);

  const formatDateForAPI = (dateStr, isEndOfDay = false) => {
    if (!dateStr) return '';

    // Parse date string directly (YYYY-MM-DD format from HTML date input)
    // Split by '-' to avoid timezone issues with Date object
    const parts = dateStr.split('-');
    if (parts.length !== 3) {
      console.warn(`[formatDateForAPI] Invalid date format: ${dateStr}`);
      return '';
    }

    const [year, month, day] = parts;

    if (isEndOfDay) {
      // For end date: send the end of the selected day in UTC (23:59:59.999Z)
      // Using Z to indicate UTC timezone to match database storage format
      const endDateString = `${year}-${month}-${day}T23:59:59.999Z`;
      console.log(`[formatDateForAPI] End date: ${dateStr} -> sending end of day (UTC): ${endDateString}`);
      return endDateString;
    } else {
      // For start date: send the start of the selected day in UTC (00:00:00.000Z)
      // Using Z to indicate UTC timezone to match database storage format
      const startDateString = `${year}-${month}-${day}T00:00:00.000Z`;
      console.log(`[formatDateForAPI] Start date: ${dateStr} -> sending (UTC): ${startDateString}`);
      return startDateString;
    }
  };

  const loadOrders = async () => {
    setLoading(true);

    try {
      const params = {
        page: String(state.page),
        pageSize: String(state.pageSize),
        ...(state.q ? { q: state.q } : {}),
        ...(state.status && state.status !== 'all' ? { status: state.status } : {}),
        ...(state.pkg ? { package: state.pkg } : {}),
        ...(state.fromDate ? { from: formatDateForAPI(state.fromDate, false) } : {}),
        ...(state.toDate ? { to: formatDateForAPI(state.toDate, true) } : {})
      };

      console.log('[OrdersSection] Loading orders with params:', params);

      const data = await adminConsoleApi.orders.list(params);

      console.log('[OrdersSection] Received orders:', data.orders?.length || 0, 'Total:', data.meta?.total || 0);

      setOrders(data.orders || []);
      setMeta(data.meta || { page: 1, pages: 1, total: 0 });
      setStatusCounts(data.statusCounts || { approved: 0, unpaid: 0, declined: 0 });
      setState(prev => ({ ...prev, total: data.meta?.total || 0 }));

    } catch (error) {
      console.error('Failed to load orders:', error);
      alert(t("adminConsole.orders.loadErrorAlert", { defaultValue: "⚠️ Failed to load orders. Please check the console for details." }));
    } finally {
      setLoading(false);
    }
  };

  const getPackageDisplay = (items) => {
    try {
      const arr = Array.isArray(items) ? items : [];
      const p = arr.find(it => (it?.type || '').toLowerCase() === 'package');
      const c = arr.find(it => (it?.type || '').toLowerCase() === 'credits');
      const pkgName = p ? (p.name || p.id || t("adminConsole.orders.packageDefault", { defaultValue: "Package" })) : '';
      const credits = c ? (c.unlimited ? t("adminConsole.orders.unlimited", { defaultValue: "Unlimited" }) : (c.credits ? t("adminConsole.orders.creditsCount", { count: c.credits, defaultValue: "{{count}} Credits" }) : '')) : '';
      return [pkgName, credits].filter(Boolean).join(' - ');
    } catch (e) {
      return '';
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'paid') return 'status-active';
    if (s === 'pending') return 'status-pending';
    return 'status-inactive';
  };

  const getStatusLabel = (order) => {
    // Check payment_message for success
    if (order.payment_message === 'Transaction succeeded') {
      return t("adminConsole.orders.statusApproved", { defaultValue: "Approved" });
    }

    const s = (order.payment_status || '').toLowerCase();
    if (s === 'unpaid') return t("adminConsole.orders.statusUnpaid", { defaultValue: "Unpaid" });
    if (s === 'pending') return t("adminConsole.orders.statusPending", { defaultValue: "Pending" });
    if (s === 'cancelled' || s === 'failed' || s === 'rejected') return t("adminConsole.orders.statusDeclined", { defaultValue: "Declined" });
    return order.payment_status || t("adminConsole.orders.statusUnknown", { defaultValue: "Unknown" });
  };

  const formatOrderDate = (dateString) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'UTC'
      }).format(date).replace(',', ''); // en-GB inserts comma by default
    } catch (err) {
      console.warn('[formatOrderDate] Failed to format date:', dateString, err);
      return dateString;
    }
  };

  const openDeleteModal = (orderId) => {
    setDeleteModal({ show: true, orderId });
  };

  const confirmDelete = async () => {
    try {
      await adminConsoleApi.orders.delete(deleteModal.orderId);
      setDeleteModal({ show: false, orderId: null });
      loadOrders();
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert(t("adminConsole.orders.deleteErrorAlert", { message: error.message, defaultValue: "❌ Failed to delete order: {{message}}" }));
      setDeleteModal({ show: false, orderId: null });
    }
  };

  const viewOrder = async (orderId) => {
    // Show modal immediately with loading state
    setModalState({ show: true, mode: 'view', order: null, loading: true });

    try {
      const data = await adminConsoleApi.orders.get(orderId);
      setModalState({ show: true, mode: 'view', order: data.order, loading: false });
    } catch (error) {
      console.error('Failed to view order:', error);
      setModalState({ show: false, mode: null, order: null, loading: false });
      alert(t("adminConsole.orders.loadDetailsErrorAlert", { defaultValue: "❌ Failed to load order details" }));
    }
  };

  const editOrder = async (orderId) => {
    // Show modal immediately with loading state
    setModalState({ show: true, mode: 'edit', order: null, loading: true });

    try {
      const data = await adminConsoleApi.orders.get(orderId);
      setModalState({ show: true, mode: 'edit', order: data.order, loading: false });
    } catch (error) {
      console.error('Failed to load order:', error);
      setModalState({ show: false, mode: null, order: null, loading: false });
      alert(t("adminConsole.orders.loadDetailsErrorAlert", { defaultValue: "❌ Failed to load order details" }));
    }
  };

  const createOrder = () => {
    setModalState({ show: true, mode: 'create', order: null, loading: false });
  };

  const closeModal = () => {
    setModalState({ show: false, mode: null, order: null, loading: false });
  };

  const handleOrderSuccess = () => {
    loadOrders();
  };

  const approvedCount = statusCounts.approved;
  const unpaidCount = statusCounts.unpaid;
  const declineCount = statusCounts.declined;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-6 gap-4">
        <h2 className="text-3xl font-bold gradient-text">{t("adminConsole.orders.title", { defaultValue: "Order Management" })}</h2>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button className="action-btn btn-primary w-full sm:w-auto" onClick={createOrder}>
            <i className="fas fa-plus mr-2"></i>{t("adminConsole.orders.addOrder", { defaultValue: "Add Order" })}
          </button>
          <button className="action-btn btn-danger w-full sm:w-auto" onClick={() => window.location.href = '/dashboard'}>
            <i className="fas fa-arrow-left mr-2"></i>{t("adminConsole.orders.switchToUserDashboard", { defaultValue: "Switch to User Dashboard" })}
          </button>
        </div>
      </div>

      {/* Status Count Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{t("adminConsole.orders.approvedTransactions", { defaultValue: "Approved Transactions" })}</p>
              <p className="text-3xl font-bold text-green-400">{approvedCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
              <i className="fas fa-check-circle text-2xl text-green-400"></i>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{t("adminConsole.orders.unpaidTransactions", { defaultValue: "Unpaid Transactions" })}</p>
              <p className="text-3xl font-bold text-blue-400">{unpaidCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <i className="fas fa-clock text-2xl text-blue-400"></i>
            </div>
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400 mb-1">{t("adminConsole.orders.declinedTransactions", { defaultValue: "Declined Transactions" })}</p>
              <p className="text-3xl font-bold text-red-400">{declineCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-red-500/20 flex items-center justify-center">
              <i className="fas fa-times-circle text-2xl text-red-400"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel p-6 mb-6 space-y-4">
        {/* Row 1: Search + Status */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative md:col-span-3">
            <input
              type="text"
              placeholder={t("adminConsole.orders.searchPlaceholder", { defaultValue: "Search by customer email, full name, or order ID..." })}
              className="search-input p-3 pr-12 rounded-lg w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400">
              <i className="fas fa-search"></i>
            </div>
          </div>
          <select
            className="search-input p-3 rounded-lg"
            value={state.status}
            onChange={(e) => setState(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          >
            <option value="all">{t("adminConsole.orders.filterAllStatus", { defaultValue: "All Status" })}</option>
            <option value="paid">{t("adminConsole.orders.statusApproved", { defaultValue: "Approved" })}</option>
            <option value="unpaid">{t("adminConsole.orders.statusUnpaid", { defaultValue: "Unpaid" })}</option>
            <option value="pending">{t("adminConsole.orders.statusPending", { defaultValue: "Pending" })}</option>
            <option value="cancelled">{t("adminConsole.orders.statusCancelled", { defaultValue: "Cancelled" })}</option>
          </select>
        </div>

        {/* Row 2: Package + Date Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            className="search-input p-3 rounded-lg"
            value={state.pkg}
            onChange={(e) => setState(prev => ({ ...prev, pkg: e.target.value, page: 1 }))}
          >
            <option value="">{t("adminConsole.orders.allPackages", { defaultValue: "All Packages" })}</option>
            <option value="starter">{t("adminConsole.orders.packageStarter", { defaultValue: "Starter" })}</option>
            <option value="professional">{t("adminConsole.orders.packageProfessional", { defaultValue: "Professional" })}</option>
            <option value="expert">{t("adminConsole.orders.packageExpert", { defaultValue: "Expert" })}</option>
          </select>
          <input
            type="date"
            placeholder={t("adminConsole.orders.fromDate", { defaultValue: "From Date" })}
            className="search-input p-3 rounded-lg"
            value={state.fromDate}
            onChange={(e) => setState(prev => ({ ...prev, fromDate: e.target.value, page: 1 }))}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          />
          <input
            type="date"
            placeholder={t("adminConsole.orders.toDate", { defaultValue: "To Date" })}
            className="search-input p-3 rounded-lg"
            value={state.toDate}
            onChange={(e) => setState(prev => ({ ...prev, toDate: e.target.value, page: 1 }))}
            disabled={loading}
            style={{ opacity: loading ? 0.6 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="glass-panel p-6">
        {loading ? (
          <div className="text-center py-12">
            <div>
              <i className="fas fa-spinner fa-spin text-4xl text-cyan-400 mb-4"></i>
              <p className="text-gray-400">{t("adminConsole.orders.loading", { defaultValue: "Loading orders..." })}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="table-container brands-table-scroll overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="text-left p-4">{t("adminConsole.orders.colCustomerEmail", { defaultValue: "Customer Email" })}</th>
                    <th className="text-left p-4">{t("adminConsole.orders.colFullName", { defaultValue: "Full Name" })}</th>
                    <th className="text-left p-4">{t("adminConsole.orders.colBrandName", { defaultValue: "Brand Name" })}</th>
                    <th className="text-left p-4">{t("adminConsole.orders.colResellerName", { defaultValue: "Reseller Name" })}</th>
                    <th className="text-left p-4">{t("adminConsole.orders.colPackage", { defaultValue: "Package" })}</th>
                    <th className="text-left p-4">{t("adminConsole.orders.colAmount", { defaultValue: "Amount" })}</th>
                    <th className="text-left p-4">{t("adminConsole.orders.colStatus", { defaultValue: "Status" })}</th>
                    <th className="text-left p-4">{t("adminConsole.orders.colDate", { defaultValue: "Date" })}</th>
                    <th className="text-left p-4">{t("adminConsole.orders.colActions", { defaultValue: "Actions" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.order_id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="p-4" data-label="Customer Email">{order.email || ''}</td>
                      <td className="p-4" data-label="Full Name">{order.full_name || '-'}</td>
                      <td className="p-4" data-label="Brand Name">{order.brand_name || '-'}</td>
                      <td className="p-4" data-label="Reseller Name">{order.reseller_name || '-'}</td>
                      <td className="p-4" data-label="Package">{getPackageDisplay(order.items)}</td>
                      <td className="p-4" data-label="Amount">${Number(order.total_amount || 0)}</td>
                      <td className="p-4" data-label="Status">
                        <span className={`status-badge ${getStatusBadge(order.payment_status)}`}>
                          {getStatusLabel(order)}
                        </span>
                      </td>
                      <td className="p-4" data-label="Date">{formatOrderDate(order.created_at)}</td>
                      <td className="p-4" data-label="Actions">
                        <div className="flex space-x-2">
                          <button
                            className="action-btn btn-secondary"
                            onClick={() => viewOrder(order.order_id)}
                            title={t("adminConsole.orders.viewTooltip", { defaultValue: "View order details" })}
                          >
                            {t("adminConsole.orders.view", { defaultValue: "View" })}
                          </button>
                          <button
                            className="action-btn btn-primary"
                            onClick={() => editOrder(order.order_id)}
                            title={t("adminConsole.orders.editTooltip", { defaultValue: "Edit order" })}
                          >
                            {t("adminConsole.orders.edit", { defaultValue: "Edit" })}
                          </button>
                          <button
                            className="action-btn btn-danger"
                            onClick={() => openDeleteModal(order.order_id)}
                            title={t("adminConsole.orders.deleteTooltip", { defaultValue: "Delete order" })}
                          >
                            {t("adminConsole.orders.delete", { defaultValue: "Delete" })}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && !loading && (
                    <tr>
                      <td colSpan="9" className="p-8 text-center text-gray-400">
                        {state.q
                          ? t("adminConsole.orders.noOrdersMatch", { query: state.q, defaultValue: 'No orders match "{{query}}".' })
                          : t("adminConsole.orders.noOrdersFound", { defaultValue: "No orders found" })}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {!loading && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0 pt-4 mt-auto border-t border-gray-700">
                <button
                  className="action-btn btn-secondary w-full sm:w-auto"
                  onClick={() => state.page > 1 && setState(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={state.page <= 1}
                >
                  {t("common.pagination.previous", { defaultValue: "Previous" })}
                </button>
                <div className="text-sm text-gray-400 text-center order-first sm:order-none">
                  {t("common.pagination.pageOf", { current: meta.page, total: meta.pages, defaultValue: "Page {{current}} of {{total}}" })} — {meta.total} {t("common.pagination.records", { defaultValue: "total" })}
                </div>
                <button
                  className="action-btn btn-secondary w-full sm:w-auto"
                  onClick={() => state.page < meta.pages && setState(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={state.page >= meta.pages}
                >
                  {t("common.pagination.next", { defaultValue: "Next" })}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Order Modal */}
      {modalState.show && (
        <OrderModal
          order={modalState.order}
          mode={modalState.mode}
          onClose={closeModal}
          onSuccess={handleOrderSuccess}
          loading={modalState.loading}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <DeleteConfirmModal
          title={t("adminConsole.orders.deleteOrderTitle", { defaultValue: "Delete Order" })}
          message={t("adminConsole.orders.deleteOrderMessage", { orderId: deleteModal.orderId, defaultValue: "Are you sure you want to delete order {{orderId}}? This action cannot be undone." })}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteModal({ show: false, orderId: null })}
        />
      )}
    </div>
  );
}
