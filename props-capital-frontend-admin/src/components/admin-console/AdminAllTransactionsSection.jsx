import { useState, useEffect, useCallback } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import { exportToCSV, formatDateForCSV, formatCurrencyForCSV } from '@/utils/csvExport';
import { getCurrencySymbol } from '@/utils/currency';
import { useTranslation } from "../../contexts/LanguageContext";

const formatDateForAPI = (dateStr, isEndOfDay = false) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    console.warn(`[AdminAllTransactions] Invalid date format: ${dateStr}`);
    return '';
  }
  
  const [year, month, day] = parts;
  return isEndOfDay
    ? `${year}-${month}-${day}T23:59:59.999Z`
    : `${year}-${month}-${day}T00:00:00.000Z`;
};

const formatTransactionDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
      timeZone: 'UTC'
    });
    return formatter.format(new Date(dateString)).replace(',', '');
  } catch (err) {
    console.warn('[AdminAllTransactions] Failed to format date:', dateString, err);
    return dateString;
  }
};

const PAYMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'chargeback', label: 'Chargeback' },
];

const getStatusBadgeClass = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'succeeded' || normalized === 'completed') {
    return 'bg-green-500/20 text-green-400';
  }
  if (normalized === 'pending') return 'bg-orange-500/20 text-orange-400';
  if (normalized === 'refunded' || normalized === 'refund') {
    return 'bg-pink-500/20 text-pink-400';
  }
  if (normalized === 'chargeback') return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-red-500/20 text-red-400';
};

const getStatusLabel = (status) => (status || 'unknown').toUpperCase();

export default function AdminAllTransactionsSection() {
  const { t } = useTranslation();
  // Load saved date filters from localStorage on mount
  const loadSavedDateFilters = () => {
    try {
      const saved = localStorage.getItem('adminTransactionsDateFilters');
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

  const [transactions, setTransactions] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState(false);
  const [editingStatus, setEditingStatus] = useState(false);
  const [editingBrand, setEditingBrand] = useState(false);
  const [newPaymentMethod, setNewPaymentMethod] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newBrandId, setNewBrandId] = useState('');
  
  // Filters
  const [fromDate, setFromDate] = useState(savedFilters.fromDate);
  const [toDate, setToDate] = useState(savedFilters.toDate);
  const [statusFilter, setStatusFilter] = useState('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Save date filters to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('adminTransactionsDateFilters', JSON.stringify({
        fromDate: fromDate,
        toDate: toDate
      }));
    } catch (e) {
      console.warn('Failed to save date filters:', e);
    }
  }, [fromDate, toDate]);

  // Export to CSV
  const handleExportCSV = () => {
    const exportData = filteredTransactions.map(tx => ({
      order_id: tx.order_id || '',
      date: formatDateForCSV(tx.created_at),
      brand_name: getBrandName(tx.brand_id),
      customer_name: `${tx.first_name || ''} ${tx.last_name || ''}`.trim(),
      email: tx.email || '',
      country: tx.billing_country || tx.vpn_geo || '',
      amount_original: formatCurrencyForCSV(tx.total_amount, tx.currency || 'USD'),
      amount_usd: formatCurrencyForCSV(getCorrectUSDAmount(tx), 'USD'),
      commission: formatCurrencyForCSV(getCommissionAmount(tx), 'USD'),
      commission_rate: tx.commission_rate ? `${tx.commission_rate}%` : '',
      payment_method: getPaymentMethodName(tx.payment_method),
      payment_status: tx.payment_status || '',
      payment_message: tx.payment_message || '',
      items: tx.items || ''
    }));

    const columns = [
      { key: 'order_id', header: t("adminConsole.transactions.csvOrderId", { defaultValue: "Order ID" }) },
      { key: 'date', header: t("adminConsole.transactions.csvDate", { defaultValue: "Date" }) },
      { key: 'brand_name', header: t("adminConsole.transactions.csvBrand", { defaultValue: "Brand" }) },
      { key: 'customer_name', header: t("adminConsole.transactions.csvCustomerName", { defaultValue: "Customer Name" }) },
      { key: 'email', header: t("adminConsole.transactions.csvEmail", { defaultValue: "Email" }) },
      { key: 'country', header: t("adminConsole.transactions.csvCountry", { defaultValue: "Country" }) },
      { key: 'amount_original', header: t("adminConsole.transactions.csvAmountOriginal", { defaultValue: "Amount (Original)" }) },
      { key: 'amount_usd', header: t("adminConsole.transactions.csvAmountUsd", { defaultValue: "Amount (USD)" }) },
      { key: 'commission', header: t("adminConsole.transactions.csvCommission", { defaultValue: "Commission" }) },
      { key: 'commission_rate', header: t("adminConsole.transactions.csvCommissionRate", { defaultValue: "Commission Rate" }) },
      { key: 'payment_method', header: t("adminConsole.transactions.csvPaymentMethod", { defaultValue: "Payment Method" }) },
      { key: 'payment_status', header: t("adminConsole.transactions.csvPaymentStatus", { defaultValue: "Payment Status" }) },
      { key: 'payment_message', header: t("adminConsole.transactions.csvPaymentMessage", { defaultValue: "Payment Message" }) },
      { key: 'items', header: t("adminConsole.transactions.csvItems", { defaultValue: "Items" }) }
    ];

    const dateStr = new Date().toISOString().split('T')[0];
    exportToCSV(exportData, `admin-transactions-${dateStr}`, columns);
  };

  const loadAllBrands = async () => {
    const pageSize = 100;
    let page = 1;
    let allBrands = [];
    let totalPages = 1;

    do {
      const result = await adminConsoleApi.brands.list({ page: String(page), pageSize: String(pageSize) });
      const fetched = result.brands || [];
      allBrands = [...allBrands, ...fetched];
      totalPages = result.meta?.pages || 1;
      page += 1;
    } while (page <= totalPages);

    return allBrands;
  };

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      // Load all brands first so we can resolve names for every transaction
      const allBrands = await loadAllBrands();
      setBrands(allBrands);
      
      // Load transactions
      const params = {};
      if (fromDate) params.from = formatDateForAPI(fromDate);
      if (toDate) params.to = formatDateForAPI(toDate, true);
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      if (brandFilter && brandFilter !== 'all') params.brand = brandFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      
      const result = await adminConsoleApi.transactions.list(params);
      const txs = result.transactions || [];
      const total = result.total !== undefined ? result.total : txs.length;
      
      // Debug: Log first transaction to check data
      if (txs.length > 0) {
        console.log('[AllTransactions] Sample transaction data:', {
          order_id: txs[0].order_id,
          total_amount: txs[0].total_amount,
          currency: txs[0].currency,
          amount_usd: txs[0].amount_usd,
          commission_amount: txs[0].commission_amount
        });
      }
      
      setTransactions(txs);
      setTotalTransactions(total);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }, [fromDate, toDate, statusFilter, brandFilter, searchQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = () => {
    loadData(true);
  };

  const getBrandName = (brandId) => {
    if (brandId === undefined || brandId === null || brandId === '') {
      return t("adminConsole.transactions.unknownBrand", { defaultValue: "Unknown Brand" });
    }

    const idString = String(brandId);
    const brand = brands.find(
      (b) =>
        String(b.id) === idString ||
        String(b._id) === idString ||
        String(b.brand_id) === idString,
    );

    if (brand) {
      return brand.name || brand.username || brand.brand_name || `Brand #${brandId}`;
    }

    return `Brand #${brandId}`;
  };

  // Get exchange rate for a currency (simulating backend rates)
  const getExchangeRate = (currency) => {
    const rates = {
      'USD': 1.0,
      'EUR': 0.8620,
      'GBP': 0.79,
      'CAD': 1.36,
      'AUD': 1.53,
      'NZD': 1.68,
      'MYR': 4.47,
      'SGD': 1.34,
      'AED': 3.67,
      'CHF': 0.88,
      'INR': 83.12,
      'ZAR': 18.15,
      'PLN': 4.03,
      'CZK': 23.65,
      'MXN': 20.19
    };
    return rates[currency] || 1.0;
  };

  // Get correct USD amount (fixes old wrong conversions)
  const getCorrectUSDAmount = (tx) => {
    const currency = tx.currency || 'USD';
    const totalAmount = Number(tx.total_amount || 0);
    const storedUSD = Number(tx.amount_usd || totalAmount);
    
    // If currency is USD, use total_amount
    if (currency === 'USD') {
      return totalAmount;
    }
    
    // Calculate what USD SHOULD be based on current exchange rate
    // Exchange rate represents: 1 USD = X units of foreign currency
    // So to convert from foreign currency to USD, we DIVIDE
    const exchangeRate = getExchangeRate(currency);
    const correctUSD = totalAmount / exchangeRate;
    
    // If stored USD is way off from correct USD (more than 10% difference), 
    // it was likely calculated with wrong formula - use corrected value
    const difference = Math.abs(storedUSD - correctUSD) / correctUSD;
    if (difference > 0.10) {
      console.warn(`[USD Fix] Order ${tx.order_id}: ${totalAmount} ${currency} - stored USD=$${storedUSD.toFixed(2)}, corrected=$${correctUSD.toFixed(2)}`);
      return correctUSD;
    }
    
    return storedUSD;
  };

  const getCommissionAmount = (tx) => {
    // Use corrected USD amount for commission calculation
    const usdAmount = getCorrectUSDAmount(tx);
    const storedCommission = Number(tx.commission_amount || 0);
    const brand = brands.find(b => b.id === tx.brand_id);
    
    // If commission equals the total amount, it's likely wrong - recalculate
    if (storedCommission > 0 && Math.abs(storedCommission - usdAmount) < 0.01) {
      // Commission shouldn't be 100% of the order, recalculate using brand's rate
      const commissionRate = brand ? (Number(brand.commission_rate || 10) / 100) : 0.10;
      const calculatedCommission = usdAmount * commissionRate;
      console.warn(`[Commission Fix] Order ${tx.order_id}: stored=${storedCommission}, recalculated=${calculatedCommission}`);
      return calculatedCommission;
    }
    
    // Also recalculate if commission seems wrong based on USD amount
    const expectedCommission = usdAmount * (brand ? (Number(brand.commission_rate || 10) / 100) : 0.10);
    const commissionDiff = Math.abs(storedCommission - expectedCommission) / expectedCommission;
    if (commissionDiff > 0.15) { // If commission is off by more than 15%
      console.warn(`[Commission Fix] Order ${tx.order_id}: stored=${storedCommission}, recalculated=${expectedCommission} (off by ${(commissionDiff * 100).toFixed(1)}%)`);
      return expectedCommission;
    }
    
    return storedCommission;
  };

  const formatCurrency = (amount, currency = 'USD') => {
    const num = Number(amount || 0).toFixed(2);
    const symbol = getCurrencySymbol(currency);
    return `${num}${symbol}`;
  };

  const getClientName = (tx) => {
    // Try card_holder_name first
    if (tx.card_holder_name) {
      return tx.card_holder_name;
    }
    // Try combining first_name and last_name
    if (tx.first_name || tx.last_name) {
      return `${tx.first_name || ''} ${tx.last_name || ''}`.trim();
    }
    // Fallback to N/A
    return t("adminConsole.transactions.notAvailable", { defaultValue: "N/A" });
  };

  const getPaymentMethodName = (method) => {
    const normalized = (method || 'card').toLowerCase();
    if (normalized === 'applepay') return t("adminConsole.transactions.applePay", { defaultValue: "Apple Pay" });
    if (normalized === 'googlepay') return t("adminConsole.transactions.googlePay", { defaultValue: "Google Pay" });
    if (normalized === 'card') return t("adminConsole.transactions.card", { defaultValue: "Card" });
    return normalized.charAt(0).toUpperCase() + normalized.slice(1);
  };

  const getPaymentMethodIcon = (method) => {
    const normalized = (method || 'card').toLowerCase();
    if (normalized === 'applepay') return '🍎';
    if (normalized === 'googlepay') return '🔵';
    if (normalized === 'xoala' || normalized === 'worldcard') return '🏦';
    if (normalized === 'manual' || normalized === 'internal') return '🧾';
    return '💳';
  };

  const getOrderItems = (items) => {
    if (!items) return [];
    if (Array.isArray(items)) return items;
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const handleUpdatePaymentMethod = async () => {
    if (!selectedTx || !newPaymentMethod) return;
    
    await handleUpdateTransaction(
      { payment_method: newPaymentMethod },
      {
        payment_method: newPaymentMethod,
        provider: newPaymentMethod,
      },
    );
    setEditingPaymentMethod(false);
    setNewPaymentMethod('');
  };

  const startBrandEdit = (tx) => {
    setSelectedTx(tx);
    setEditingPaymentMethod(false);
    setEditingStatus(false);
    setEditingBrand(true);
    setNewPaymentMethod('');
    setNewStatus('');
    setNewBrandId(tx.brand_id || '');
  };

  const handleUpdateTransaction = async (payload, localFallback = {}) => {
    if (!selectedTx) return;

    try {
      const response = await adminConsoleApi.orders.update(selectedTx.id, {
        ...payload,
      });

      const updated = response.order
        ? {
            ...selectedTx,
            ...localFallback,
            ...response.order,
            order_id: response.order.reference || response.order.order_id || selectedTx.order_id,
            amount: response.order.total_amount ?? selectedTx.amount,
            brand_id: response.order.brand_id ?? null,
            brand_name: response.order.brand_name ?? null,
            brand_slug: response.order.brand_slug ?? null,
            commission_amount: response.order.commission_amount ?? response.order.brand_commission ?? selectedTx.commission_amount,
            commission_rate: response.order.commission_rate ?? selectedTx.commission_rate,
            payment_status: response.order.payment_status ?? selectedTx.payment_status,
            payment_method: response.order.payment_method ?? response.order.provider ?? selectedTx.payment_method,
          }
        : { ...selectedTx, ...localFallback };

      setTransactions(prev => prev.map(tx => (tx.id === selectedTx.id ? { ...tx, ...updated } : tx)));
      setSelectedTx(updated);
    } catch (error) {
      console.error('Failed to update transaction:', error);
      alert(t("adminConsole.transactions.alertFailedUpdateTransaction", { defaultValue: "Failed to update transaction. Please try again." }));
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) return;
    await handleUpdateTransaction(
      { payment_status: newStatus },
      { payment_status: newStatus, status: newStatus },
    );
    setEditingStatus(false);
    setNewStatus('');
  };

  const handleUpdateBrand = async () => {
    const brand = brands.find(b => String(b.id) === String(newBrandId));
    await handleUpdateTransaction(
      { brand_id: newBrandId || null },
      {
        brand_id: newBrandId || null,
        brand_name: brand?.name || null,
        brand_slug: brand?.slug || null,
        commission_rate: brand?.commission_rate || 0,
      },
    );
    setEditingBrand(false);
    setNewBrandId('');
  };

  // Calculate statistics (using corrected USD amounts for totals)
  // Use totalTransactions from API for accurate count, but calculate other stats from loaded transactions
  const stats = {
    total: totalTransactions, // Use total count from database via API
    totalRevenue: transactions.filter(tx => tx.payment_status === 'succeeded').reduce((sum, tx) => sum + getCorrectUSDAmount(tx), 0),
    totalCommission: transactions.filter(tx => tx.payment_status === 'succeeded').reduce((sum, tx) => sum + getCommissionAmount(tx), 0),
    unpaid: transactions.filter(tx => tx.payment_status === 'succeeded' && !tx.brand_paid_out).length,
    paid: transactions.filter(tx => tx.payment_status === 'succeeded' && tx.brand_paid_out).length,
    pending: transactions.filter(tx => tx.payment_status === 'pending').length,
  };

  // Filter transactions by search query and payment method
  const filteredTransactions = transactions.filter(tx => {
    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      const txMethod = (tx.payment_method || 'card').toLowerCase();
      if (txMethod !== paymentMethodFilter) return false;
    }
    
    // Search query filter
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      tx.order_id?.toLowerCase().includes(query) ||
      tx.email?.toLowerCase().includes(query) ||
      tx.card_holder_name?.toLowerCase().includes(query) ||
      tx.first_name?.toLowerCase().includes(query) ||
      tx.last_name?.toLowerCase().includes(query) ||
      getBrandName(tx.brand_id)?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-cyan-400 mb-4"></i>
        <p className="text-gray-400">{t("adminConsole.transactions.loading", { defaultValue: "Loading transactions..." })}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold gradient-text mb-2">{t("adminConsole.transactions.title", { defaultValue: "All Transactions" })}</h2>
          <p className="text-sm text-gray-400">
            {t("adminConsole.transactions.subtitle", { defaultValue: "Monitor all transactions across all brands and partners" })}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="action-btn btn-secondary px-6 py-3 flex items-center justify-center gap-2 whitespace-nowrap"
            disabled={refreshing}
          >
            <i className={`fas fa-sync-alt ${refreshing ? 'fa-spin' : ''}`}></i>
            <span>{refreshing ? t("adminConsole.transactions.refreshing", { defaultValue: "Refreshing..." }) : t("adminConsole.transactions.refresh", { defaultValue: "Refresh" })}</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="action-btn btn-secondary px-6 py-3 flex items-center justify-center gap-2 whitespace-nowrap"
            disabled={!filteredTransactions || filteredTransactions.length === 0}
          >
            <i className="fas fa-download"></i>
            <span>{t("adminConsole.transactions.exportCsv", { defaultValue: "Export CSV" })}</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4 mb-6">
        <div className="glass-panel p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-3 gap-2">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
              <i className="fas fa-list text-cyan-400 text-sm"></i>
            </div>
            <span className="text-xs text-gray-400 sm:text-right">{t("adminConsole.transactions.statTotalTransactions", { defaultValue: "Total Transactions" })}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.total}</p>
        </div>

        <div className="glass-panel p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-3 gap-2">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <i className="fas fa-dollar-sign text-green-400 text-sm"></i>
            </div>
            <span className="text-xs text-gray-400 sm:text-right">{t("adminConsole.transactions.statTotalRevenue", { defaultValue: "Total Revenue" })}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-green-400">{formatCurrency(stats.totalRevenue)}</p>
        </div>

        <div className="glass-panel p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-3 gap-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
              <i className="fas fa-percent text-purple-400 text-sm"></i>
            </div>
            <span className="text-xs text-gray-400 sm:text-right">{t("adminConsole.transactions.statTotalCommission", { defaultValue: "Total Commission" })}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-purple-400">{formatCurrency(stats.totalCommission)}</p>
        </div>

        <div className="glass-panel p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-3 gap-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <i className="fas fa-exclamation-circle text-blue-400 text-sm"></i>
            </div>
            <span className="text-xs text-gray-400 sm:text-right">{t("adminConsole.transactions.statUnpaidToBrand", { defaultValue: "Unpaid to Brand" })}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-400">{stats.unpaid}</p>
        </div>

        <div className="glass-panel p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-3 gap-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <i className="fas fa-check-circle text-emerald-400 text-sm"></i>
            </div>
            <span className="text-xs text-gray-400 sm:text-right">{t("adminConsole.transactions.statPaidToBrand", { defaultValue: "Paid to Brand" })}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400">{stats.paid}</p>
        </div>

        <div className="glass-panel p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between mb-3 gap-2">
            <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
              <i className="fas fa-clock text-orange-400 text-sm"></i>
            </div>
            <span className="text-xs text-gray-400 sm:text-right">{t("adminConsole.transactions.statPending", { defaultValue: "Pending" })}</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-orange-400">{stats.pending}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 md:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <i className="fas fa-search mr-2 text-cyan-400"></i>{t("adminConsole.transactions.search", { defaultValue: "Search" })}
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("adminConsole.transactions.searchPlaceholder", { defaultValue: "Order ID, email, client name, brand..." })}
              className="search-input p-3 rounded-lg w-full"
            />
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <i className="fas fa-calendar-alt mr-2 text-blue-400"></i>{t("adminConsole.transactions.fromDate", { defaultValue: "From Date" })}
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="search-input p-3 rounded-lg w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <i className="fas fa-calendar-check mr-2 text-blue-400"></i>{t("adminConsole.transactions.toDate", { defaultValue: "To Date" })}
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="search-input p-3 rounded-lg w-full"
            />
      </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <i className="fas fa-filter mr-2 text-purple-400"></i>{t("adminConsole.transactions.status", { defaultValue: "Status" })}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="search-input p-3 rounded-lg w-full"
            >
              <option value="all">{t("adminConsole.transactions.statusAll", { defaultValue: "All Status" })}</option>
              {PAYMENT_STATUS_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {t(`adminConsole.transactions.status.${option.value}`, { defaultValue: option.label })}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <i className="fas fa-credit-card mr-2 text-green-400"></i>{t("adminConsole.transactions.paymentMethod", { defaultValue: "Payment Method" })}
            </label>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="search-input p-3 rounded-lg w-full"
            >
              <option value="all">{t("adminConsole.transactions.allMethods", { defaultValue: "All Methods" })}</option>
              <option value="card">💳 {t("adminConsole.transactions.card", { defaultValue: "Card" })}</option>
              <option value="applepay">🍎 {t("adminConsole.transactions.applePay", { defaultValue: "Apple Pay" })}</option>
              <option value="googlepay">🔵 {t("adminConsole.transactions.googlePay", { defaultValue: "Google Pay" })}</option>
            </select>
          </div>
          </div>
          
        {/* Brand Filter - Full Width */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <i className="fas fa-building mr-2 text-orange-400"></i>{t("adminConsole.transactions.filterByBrand", { defaultValue: "Filter by Brand" })}
          </label>
            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
            className="search-input p-3 rounded-lg w-full"
            >
              <option value="all">{t("adminConsole.transactions.allBrands", { defaultValue: "All Brands" })}</option>
            {brands.map(brand => (
              <option key={brand.id} value={brand.id}>
                {brand.name} {brand.account_type === 'reseller' ? t("adminConsole.transactions.resellerSuffix", { defaultValue: "(Reseller)" }) : ''}
              </option>
              ))}
            </select>
          </div>
          
        {/* Clear Filters */}
        <div className="mt-4 flex justify-start md:justify-end">
          <button
            onClick={() => {
              setFromDate('');
              setToDate('');
              setStatusFilter('all');
              setBrandFilter('all');
              setPaymentMethodFilter('all');
              setSearchQuery('');
              // Clear from localStorage
              try {
                localStorage.removeItem('adminTransactionsDateFilters');
              } catch (e) {
                console.warn('Failed to clear date filters from localStorage:', e);
              }
            }}
            className="action-btn btn-secondary w-full md:w-auto"
          >
            <i className="fas fa-times mr-2"></i>{t("adminConsole.transactions.clearFilters", { defaultValue: "Clear Filters" })}
          </button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
          <h3 className="text-lg md:text-xl font-semibold text-white">
            <i className="fas fa-receipt mr-2 text-cyan-400"></i>{t("adminConsole.transactions.transactionsCount", { count: filteredTransactions.length, defaultValue: "Transactions ({{count}})" })}
          </h3>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-inbox text-6xl text-gray-600 mb-4"></i>
            <p className="text-gray-400">{t("adminConsole.transactions.noTransactionsFound", { defaultValue: "No transactions found" })}</p>
            <p className="text-sm text-gray-500 mt-2">{t("adminConsole.transactions.tryAdjustingFilters", { defaultValue: "Try adjusting your filters" })}</p>
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colOrderId", { defaultValue: "Order ID" })}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colBrand", { defaultValue: "Brand" })}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colCardholderName", { defaultValue: "Cardholder Name " })}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colEmail", { defaultValue: "Email" })}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colCountry", { defaultValue: "Country" })}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colIp", { defaultValue: "IP" })}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colErrorMessage", { defaultValue: "Error Message" })}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colOrderAmount", { defaultValue: "Order Amount" })}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colUsdAmount", { defaultValue: "USD Amount" })}</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colCommission", { defaultValue: "Commission" })}</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colPaymentMethod", { defaultValue: "Payment Method" })}</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colStatus", { defaultValue: "Status" })}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colDate", { defaultValue: "Date" })}</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-400">{t("adminConsole.transactions.colActions", { defaultValue: "Actions" })}</th>
              </tr>
            </thead>
            <tbody>
                {filteredTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-800 hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4" data-label="Order ID">
                      <span className="text-sm text-cyan-400 font-mono">{tx.order_id}</span>
                    </td>
                    <td className="py-3 px-4" data-label="Brand">
                      <div className="flex flex-col items-start gap-1 min-w-[220px]">
                        <span className="text-sm text-white leading-5 whitespace-normal break-words">
                          {getBrandName(tx.brand_id)}
                        </span>
                        <button
                          type="button"
                          onClick={() => startBrandEdit(tx)}
                          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                          title={t("adminConsole.transactions.assignBrand", { defaultValue: "Assign or change brand" })}
                        >
                          <i className="fas fa-edit mr-1"></i>
                          {tx.brand_id
                            ? t("adminConsole.transactions.changeBrand", { defaultValue: "Change" })
                            : t("adminConsole.transactions.assignBrandShort", { defaultValue: "Assign" })}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4" data-label="Customer Name">
                      <span className="text-sm text-gray-300">{getClientName(tx)}</span>
                    </td>
                    <td className="py-3 px-4" data-label="Email">
                      <span className="text-sm text-gray-300">{tx.email || t("adminConsole.transactions.notAvailable", { defaultValue: "N/A" })}</span>
                    </td>
                    <td className="py-3 px-4" data-label="Country">
                      <span className="text-sm text-gray-300">{tx.billing_country || tx.vpn_geo || t("adminConsole.transactions.notAvailable", { defaultValue: "N/A" })}</span>
                    </td>
                    <td className="py-3 px-4" data-label="IP">
                      <span className="text-sm text-gray-300 font-mono">{tx.user_ip || t("adminConsole.transactions.notAvailable", { defaultValue: "N/A" })}</span>
                    </td>
                    <td className="py-3 px-4" data-label="Error Message">
                      <span 
                        className="text-sm text-gray-400 truncate max-w-xs block" 
                        title={tx.payment_message || '-'}
                      >
                        {tx.payment_message || '-'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" data-label="Order Amount">
                      <span className="text-sm font-semibold text-green-400">
                        {formatCurrency(tx.total_amount, tx.currency || 'USD')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" data-label="USD Amount">
                      <span className="text-sm font-semibold text-blue-400">
                        {formatCurrency(getCorrectUSDAmount(tx), 'USD')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right" data-label="Commission">
                      <span className="text-sm font-semibold text-purple-400">
                        {formatCurrency(getCommissionAmount(tx))}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center" data-label="Payment Method">
                      <span className="text-sm text-gray-300">
                        {getPaymentMethodIcon(tx.payment_method)} {getPaymentMethodName(tx.payment_method)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center" data-label="Status">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(tx.payment_status)}`}>
                        {getStatusLabel(tx.payment_status)}
                      </span>
                    </td>
                    <td className="py-3 px-4" data-label="Date">
                      <span className="text-sm text-gray-400">{formatTransactionDate(tx.created_at)}</span>
                  </td>
                    <td className="py-3 px-4 text-center" data-label="Actions">
                        <button
                        onClick={() => setSelectedTx(selectedTx?.id === tx.id ? null : tx)}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                        title={t("adminConsole.transactions.viewDetails", { defaultValue: "View Details" })}
                        >
                        <i className={`fas fa-${selectedTx?.id === tx.id ? 'eye-slash' : 'eye'}`}></i>
                        </button>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
                              </div>
                              
      {/* Transaction Details Modal */}
      {selectedTx && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSelectedTx(null);
            setEditingPaymentMethod(false);
            setEditingStatus(false);
            setEditingBrand(false);
            setNewPaymentMethod('');
            setNewStatus('');
            setNewBrandId('');
          }}
        >
          <div
            className="glass-panel p-6 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold gradient-text">{t("adminConsole.transactions.detailsTitle", { defaultValue: "Transaction Details" })}</h3>
              <button
                onClick={() => {
                  setSelectedTx(null);
                  setEditingPaymentMethod(false);
                  setEditingStatus(false);
                  setEditingBrand(false);
                  setNewPaymentMethod('');
                  setNewStatus('');
                  setNewBrandId('');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <i className="fas fa-times text-2xl"></i>
              </button>
                              </div>
                              
            <div className="space-y-4">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-400">{t("adminConsole.transactions.detailOrderId", { defaultValue: "Order ID" })}</label>
                  <p className="text-white font-mono">{selectedTx.order_id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">{t("adminConsole.transactions.detailBrand", { defaultValue: "Brand" })}</label>
                  <p className="text-white">{getBrandName(selectedTx.brand_id)}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">{t("adminConsole.transactions.detailCustomerName", { defaultValue: "Customer Name" })}</label>
                  <p className="text-white">
                    {selectedTx.first_name || selectedTx.last_name
                      ? `${selectedTx.first_name || ''} ${selectedTx.last_name || ''}`.trim()
                      : t("adminConsole.transactions.notAvailable", { defaultValue: "N/A" })}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">{t("adminConsole.transactions.detailCustomerEmail", { defaultValue: "Customer Email" })}</label>
                  <p className="text-white">{selectedTx.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">{t("adminConsole.transactions.detailPhone", { defaultValue: "Phone" })}</label>
                  <p className="text-white">{selectedTx.phone || t("adminConsole.transactions.notAvailable", { defaultValue: "N/A" })}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">{t("adminConsole.transactions.detailDate", { defaultValue: "Date" })}</label>
                  <p className="text-white">{formatTransactionDate(selectedTx.created_at)}</p>
                </div>
              </div>
                            
              {/* Financial Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-700">
                <div>
                  <label className="text-sm text-gray-400">{t("adminConsole.transactions.detailOrderAmount", { defaultValue: "Order Amount" })}</label>
                  <p className="text-xl font-bold text-green-400">
                    {formatCurrency(selectedTx.total_amount, selectedTx.currency || 'USD')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{t("adminConsole.transactions.originalCurrency", { defaultValue: "Original currency" })}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">{t("adminConsole.transactions.detailUsdAmount", { defaultValue: "USD Amount" })}</label>
                  <p className="text-xl font-bold text-blue-400">
                    {formatCurrency(getCorrectUSDAmount(selectedTx), 'USD')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{t("adminConsole.transactions.convertedToUsd", { defaultValue: "Converted to USD" })}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">{t("adminConsole.transactions.detailCommission", { defaultValue: "Commission" })}</label>
                  <p className="text-xl font-bold text-purple-400">{formatCurrency(getCommissionAmount(selectedTx))}</p>
                  <p className="text-xs text-gray-500 mt-1">{t("adminConsole.transactions.brandCommission", { defaultValue: "Brand commission" })}</p>
                </div>
              </div>
                              
              {/* Status */}
              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">{t("adminConsole.transactions.paymentStatus", { defaultValue: "Payment Status" })}</label>
                  {!editingStatus && (
                    <button
                      onClick={() => {
                        setEditingStatus(true);
                        setNewStatus(selectedTx.payment_status || 'pending');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                    >
                      <i className="fas fa-edit mr-1"></i>{t("adminConsole.transactions.edit", { defaultValue: "Edit" })}
                    </button>
                  )}
                </div>
                {editingStatus ? (
                  <div className="space-y-3">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      {PAYMENT_STATUS_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {t(`adminConsole.transactions.status.${option.value}`, { defaultValue: option.label })}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateStatus}
                        className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                      >
                        <i className="fas fa-check mr-2"></i>{t("adminConsole.transactions.save", { defaultValue: "Save" })}
                      </button>
                      <button
                        onClick={() => {
                          setEditingStatus(false);
                          setNewStatus('');
                        }}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        <i className="fas fa-times mr-2"></i>{t("adminConsole.transactions.cancel", { defaultValue: "Cancel" })}
                      </button>
                    </div>
                  </div>
                ) : (
                  <span className={`inline-block px-4 py-2 rounded-lg text-sm font-medium mt-2 ${getStatusBadgeClass(selectedTx.payment_status)}`}>
                    {getStatusLabel(selectedTx.payment_status)}
                  </span>
                )}
              </div>

              {/* Brand Assignment */}
              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">{t("adminConsole.transactions.brandAssignment", { defaultValue: "Brand Assignment" })}</label>
                  {!editingBrand && (
                    <button
                      onClick={() => {
                        setEditingBrand(true);
                        setNewBrandId(selectedTx.brand_id || '');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                    >
                      <i className="fas fa-random mr-1"></i>{t("adminConsole.transactions.reassign", { defaultValue: "Reassign" })}
                    </button>
                  )}
                </div>
                {editingBrand ? (
                  <div className="space-y-3">
                    <select
                      value={newBrandId}
                      onChange={(e) => setNewBrandId(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="">{t("adminConsole.transactions.noBrandDirectSale", { defaultValue: "No Brand (Direct Sale)" })}</option>
                      {brands.map(brand => (
                        <option key={brand.id} value={brand.id}>
                          {brand.name || brand.email || brand.id}
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdateBrand}
                        className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                      >
                        <i className="fas fa-check mr-2"></i>{t("adminConsole.transactions.save", { defaultValue: "Save" })}
                      </button>
                      <button
                        onClick={() => {
                          setEditingBrand(false);
                          setNewBrandId('');
                        }}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        <i className="fas fa-times mr-2"></i>{t("adminConsole.transactions.cancel", { defaultValue: "Cancel" })}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-white text-lg">{getBrandName(selectedTx.brand_id)}</p>
                )}
              </div>

              {/* Payment Method */}
              <div className="pt-4 border-t border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-400">{t("adminConsole.transactions.paymentMethod", { defaultValue: "Payment Method" })}</label>
                  {!editingPaymentMethod && (
                    <button
                      onClick={() => {
                        setEditingPaymentMethod(true);
                        setNewPaymentMethod(selectedTx.payment_method || 'card');
                      }}
                      className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm"
                    >
                      <i className="fas fa-edit mr-1"></i>{t("adminConsole.transactions.edit", { defaultValue: "Edit" })}
                    </button>
                  )}
                </div>
                
                {editingPaymentMethod ? (
                  <div className="space-y-3">
                    <select
                      value={newPaymentMethod}
                      onChange={(e) => setNewPaymentMethod(e.target.value)}
                      className="w-full px-4 py-2 bg-white/10 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="card">💳 {t("adminConsole.transactions.card", { defaultValue: "Card" })}</option>
                      <option value="applepay">🍎 {t("adminConsole.transactions.applePay", { defaultValue: "Apple Pay" })}</option>
                      <option value="googlepay">🔵 {t("adminConsole.transactions.googlePay", { defaultValue: "Google Pay" })}</option>
                    </select>
                    <div className="flex gap-2">
                      <button
                        onClick={handleUpdatePaymentMethod}
                        className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
                      >
                        <i className="fas fa-check mr-2"></i>{t("adminConsole.transactions.save", { defaultValue: "Save" })}
                      </button>
                      <button
                        onClick={() => {
                          setEditingPaymentMethod(false);
                          setNewPaymentMethod('');
                        }}
                        className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        <i className="fas fa-times mr-2"></i>{t("adminConsole.transactions.cancel", { defaultValue: "Cancel" })}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-white text-lg">
                    {getPaymentMethodIcon(selectedTx.payment_method)} {getPaymentMethodName(selectedTx.payment_method)}
                  </p>
                )}
              </div>
                              
              {/* Items */}
              {selectedTx.items && (
                <div className="pt-4 border-t border-gray-700">
                  <label className="text-sm text-gray-400 mb-3 block">{t("adminConsole.transactions.orderItems", { defaultValue: "Order Items" })}</label>
                  <div className="space-y-2">
                    {getOrderItems(selectedTx.items).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                              <div>
                          <p className="text-white font-medium">{item.name || item.title || t("adminConsole.transactions.item", { defaultValue: "Item" })}</p>
                          <p className="text-sm text-gray-400">{t("adminConsole.transactions.qty", { qty: item.quantity || 1, defaultValue: "Qty: {{qty}}" })}</p>
                              </div>
                        <p className="text-green-400 font-semibold">{formatCurrency(item.price)}</p>
                            </div>
                    ))}
                              </div>
                            </div>
              )}

              {/* Geo Info */}
              {selectedTx.vpn_geo && (
                <div className="pt-4 border-t border-gray-700">
                  <label className="text-sm text-gray-400">{t("adminConsole.transactions.location", { defaultValue: "Location" })}</label>
                  <p className="text-white">
                    <i className="fas fa-map-marker-alt mr-2 text-cyan-400"></i>
                    {selectedTx.vpn_geo}
                            </p>
                          </div>
              )}
            </div>
            </div>
          </div>
        )}
    </div>
  );
}
