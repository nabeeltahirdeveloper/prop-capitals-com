import React, { useState, useEffect } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import BlockedIPDetailModal from './BlockedIPDetailModal';
import { useTranslation } from "../../contexts/LanguageContext";

export default function BlockedIPsSection() {
  const { t } = useTranslation();
  const [ips, setIps] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [state, setState] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    q: '',
    status: 'all'
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [modalState, setModalState] = useState({
    show: false,
    ip: null,
    loading: false
  });

  // Handle search - only triggered when search icon is clicked or Enter is pressed
  const handleSearch = () => {
    setState(prev => ({ ...prev, q: searchQuery.trim(), page: 1 }));
  };

  // Handle Enter key in search input
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Load IPs when filters change
  useEffect(() => {
    loadIPs();
  }, [state.page, state.q, state.status]);

  const loadIPs = async () => {
    setLoading(true);

    try {
      const params = {
        page: String(state.page),
        pageSize: String(state.pageSize),
        ...(state.q ? { q: state.q } : {}),
        ...(state.status && state.status !== 'all' ? { status: state.status } : {})
      };

      const data = await adminConsoleApi.blockedIPs.list(params);

      setIps(data.ips || []);
      setMeta(data.meta || { page: 1, pages: 1, total: 0 });
      setState(prev => ({ ...prev, total: data.meta?.total || 0 }));

    } catch (error) {
      console.error('Failed to load blocked IPs:', error);
      alert(t("adminConsole.blockedIps.loadFailed", { defaultValue: "⚠️ Failed to load blocked IPs. Please check the console for details." }));
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (ip) => {
    if (ip.is_whitelisted) {
      return { label: t("adminConsole.blockedIps.statusWhitelisted", { defaultValue: "Whitelisted" }), badge: 'status-active' };
    }
    const now = new Date();
    const blockedUntil = ip.blocked_until ? new Date(ip.blocked_until) : null;
    if (blockedUntil && blockedUntil > now) {
      return { label: t("adminConsole.blockedIps.statusBlocked", { defaultValue: "Blocked" }), badge: 'status-inactive' };
    }
    return { label: t("adminConsole.blockedIps.statusActive", { defaultValue: "Active" }), badge: 'status-pending' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return t("adminConsole.blockedIps.notAvailable", { defaultValue: "N/A" });
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return t("adminConsole.blockedIps.notAvailable", { defaultValue: "N/A" });
    }
  };

  const viewIP = async (ipAddress) => {
    setModalState({ show: true, ip: null, loading: true });

    try {
      const ip = await adminConsoleApi.blockedIPs.get(ipAddress);
      setModalState({ show: true, ip, loading: false });
    } catch (error) {
      console.error('Failed to load IP details:', error);
      setModalState({ show: false, ip: null, loading: false });
      alert(t("adminConsole.blockedIps.detailsLoadFailed", { defaultValue: "❌ Failed to load IP details" }));
    }
  };

  const closeModal = () => {
    setModalState({ show: false, ip: null, loading: false });
  };

  const handleIPSuccess = async () => {
    loadIPs();
    // Refresh IP data in modal if modal is open
    if (modalState.show && modalState.ip?.ip_address) {
      try {
        const updatedIp = await adminConsoleApi.blockedIPs.get(modalState.ip.ip_address);
        setModalState(prev => ({ ...prev, ip: updatedIp }));
      } catch (error) {
        console.error('Failed to refresh IP data in modal:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold gradient-text">{t("adminConsole.blockedIps.title", { defaultValue: "Blocked IPs Management" })}</h2>
      </div>

      {/* Search and Filters */}
      <div className="glass-panel p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder={t("adminConsole.blockedIps.searchPlaceholder", { defaultValue: "Search by IP address..." })}
              className="search-input p-2.5 sm:p-3 pr-10 sm:pr-12 rounded-lg w-full text-sm sm:text-base min-h-[44px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleSearchKeyPress}
            />
            <button
              type="button"
              onClick={handleSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-400 hover:text-cyan-400 active:text-cyan-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              title={t("adminConsole.blockedIps.search", { defaultValue: "Search" })}
              aria-label={t("adminConsole.blockedIps.search", { defaultValue: "Search" })}
            >
              <i className="fas fa-search text-sm sm:text-base"></i>
            </button>
          </div>
          <select
            className="search-input p-2.5 sm:p-3 rounded-lg text-sm sm:text-base min-h-[44px] w-full"
            value={state.status}
            onChange={(e) => setState(prev => ({ ...prev, status: e.target.value, page: 1 }))}
          >
            <option value="all">{t("adminConsole.blockedIps.filterAllStatus", { defaultValue: "All Status" })}</option>
            <option value="blocked">{t("adminConsole.blockedIps.filterBlocked", { defaultValue: "Blocked" })}</option>
            <option value="whitelisted">{t("adminConsole.blockedIps.filterWhitelisted", { defaultValue: "Whitelisted" })}</option>
          </select>
        </div>
      </div>

      {/* IPs Table */}
      <div className="glass-panel p-3 sm:p-4 md:p-6 flex flex-col blocked-ips-container">
        {loading ? (
          <div className="text-center py-12 flex-1 flex items-center justify-center">
            <div>
              <i className="fas fa-spinner fa-spin text-3xl sm:text-4xl text-cyan-400 mb-4"></i>
              <p className="text-gray-400 text-sm sm:text-base">{t("adminConsole.blockedIps.loading", { defaultValue: "Loading blocked IPs..." })}</p>
            </div>
          </div>
        ) : (
          <div className="table-container flex-1 overflow-y-auto" style={{ minHeight: 0, maxHeight: 'none', height: '100%' }}>
            {ips.length === 0 ? (
              <div className="text-center py-12">
                <i className="fas fa-ban text-4xl sm:text-6xl text-gray-600 mb-4"></i>
                <p className="text-gray-400 text-sm sm:text-base">
                  {state.q ? t("adminConsole.blockedIps.noMatch", { query: state.q, defaultValue: 'No IPs match "{{query}}".' }) : t("adminConsole.blockedIps.noneFound", { defaultValue: "No blocked IPs found" })}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="border-b border-gray-700 sticky top-0 bg-gray-900 z-10">
                  <tr>
                    <th className="text-left p-2 lg:p-4 text-xs lg:text-sm">#</th>
                    <th className="text-left p-2 lg:p-4 text-xs lg:text-sm">{t("adminConsole.blockedIps.colIpAddress", { defaultValue: "IP Address" })}</th>
                    <th className="text-left p-2 lg:p-4 text-xs lg:text-sm">{t("adminConsole.blockedIps.colTotalAttempts", { defaultValue: "Total Attempts" })}</th>
                    <th className="text-left p-2 lg:p-4 text-xs lg:text-sm hidden lg:table-cell">{t("adminConsole.blockedIps.colLastAttemptTime", { defaultValue: "Last Attempt Time" })}</th>
                    <th className="text-left p-2 lg:p-4 text-xs lg:text-sm">{t("adminConsole.blockedIps.colStatus", { defaultValue: "Status" })}</th>
                    <th className="text-left p-2 lg:p-4 text-xs lg:text-sm">{t("adminConsole.blockedIps.colActions", { defaultValue: "Actions" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {ips.map((ip, index) => {
                    const status = getStatus(ip);
                    const serialNumber = (state.page - 1) * state.pageSize + index + 1;
                    return (
                      <tr key={ip.ip_address} className="border-b border-gray-800 hover:bg-gray-800/30">
                        <td className="p-2 lg:p-4 text-xs lg:text-sm" data-label="#">{serialNumber}</td>
                        <td className="p-2 lg:p-4 text-xs lg:text-sm" data-label={t("adminConsole.blockedIps.colIpAddress", { defaultValue: "IP Address" })}>
                          <span className="font-mono break-all">{ip.ip_address}</span>
                        </td>
                        <td className="p-2 lg:p-4 text-xs lg:text-sm" data-label={t("adminConsole.blockedIps.colTotalAttempts", { defaultValue: "Total Attempts" })}>{ip.attempt_count || 0}</td>
                        <td className="p-2 lg:p-4 text-xs lg:text-sm hidden lg:table-cell" data-label={t("adminConsole.blockedIps.colLastAttemptTime", { defaultValue: "Last Attempt Time" })}>{formatDate(ip.last_attempt_time)}</td>
                        <td className="p-2 lg:p-4 text-xs lg:text-sm" data-label={t("adminConsole.blockedIps.colStatus", { defaultValue: "Status" })}>
                          <span className={`status-badge ${status.badge}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="p-2 lg:p-4 text-xs lg:text-sm" data-label={t("adminConsole.blockedIps.colActions", { defaultValue: "Actions" })}>
                          <button
                            className="action-btn btn-secondary min-w-[44px] min-h-[44px] flex items-center justify-center"
                            onClick={() => viewIP(ip.ip_address)}
                            title={t("adminConsole.blockedIps.viewIpDetails", { defaultValue: "View IP details" })}
                            aria-label={t("adminConsole.blockedIps.viewIpDetails", { defaultValue: "View IP details" })}
                            type="button"
                          >
                            <i className="fas fa-arrow-right"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Pagination - Outside glass-panel to prevent card conversion */}
      {!loading && (
        <div className="glass-panel p-3 sm:p-4 md:p-6 pagination-controls">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4">
            <button
              className="action-btn btn-secondary w-full sm:w-auto min-h-[44px] px-4 sm:px-6 text-xs sm:text-sm md:text-base"
              onClick={() => state.page > 1 && setState(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={state.page <= 1}
              aria-label={t("adminConsole.blockedIps.previousPage", { defaultValue: "Previous page" })}
              type="button"
            >
              <i className="fas fa-chevron-left mr-1.5 sm:mr-2"></i>
              {t("common.pagination.previous", { defaultValue: "Previous" })}
            </button>
            <div className="text-[10px] sm:text-xs md:text-sm text-gray-400 text-center order-first sm:order-none px-2 py-1">
              {t("common.pagination.pageOf", { current: meta.page, total: meta.pages, defaultValue: "Page {{current}} of {{total}}" })} — {meta.total} {t("common.pagination.records", { defaultValue: "total" })}
            </div>
            <button
              className="action-btn btn-secondary w-full sm:w-auto min-h-[44px] px-4 sm:px-6 text-xs sm:text-sm md:text-base"
              onClick={() => state.page < meta.pages && setState(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={state.page >= meta.pages}
              aria-label={t("adminConsole.blockedIps.nextPage", { defaultValue: "Next page" })}
              type="button"
            >
              {t("common.pagination.next", { defaultValue: "Next" })}
              <i className="fas fa-chevron-right ml-1.5 sm:ml-2"></i>
            </button>
          </div>
        </div>
      )}

      {/* IP Detail Modal */}
      {modalState.show ? (
        <BlockedIPDetailModal
          ip={modalState.ip}
          onClose={closeModal}
          onSuccess={handleIPSuccess}
          loading={modalState.loading}
        />
      ) : null}
    </div>
  );
}

