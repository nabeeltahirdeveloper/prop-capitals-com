import React, { useState, useEffect, useCallback } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import IPAttemptHistoryModal from './IPAttemptHistoryModal';
import { useTranslation } from "../../contexts/LanguageContext";

export default function BlockedIPDetailModal({ ip, onClose, onSuccess, loading: ipLoading }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptHistory, setAttemptHistory] = useState({
    loading: false,
    attempts: [],
    total: ip?.attempt_count || 0,
    error: ''
  });

  const getStatus = (ipData) => {
    if (!ipData) return { label: t("adminConsole.blockedIpModal.statusUnknown", { defaultValue: "Unknown" }), badge: 'status-pending' };
    if (ipData.is_whitelisted) {
      return { label: t("adminConsole.blockedIpModal.statusWhitelisted", { defaultValue: "Whitelisted" }), badge: 'status-active' };
    }
    const now = new Date();
    const blockedUntil = ipData.blocked_until ? new Date(ipData.blocked_until) : null;
    if (blockedUntil && blockedUntil > now) {
      return { label: t("adminConsole.blockedIpModal.statusBlocked", { defaultValue: "Blocked" }), badge: 'status-inactive' };
    }
    return { label: t("adminConsole.blockedIpModal.statusActive", { defaultValue: "Active" }), badge: 'status-pending' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return t("adminConsole.blockedIpModal.notAvailable", { defaultValue: "N/A" });
    try {
      return new Date(dateStr).toLocaleString();
    } catch (e) {
      return t("adminConsole.blockedIpModal.notAvailable", { defaultValue: "N/A" });
    }
  };

  const resetAttemptHistoryState = () => {
    setAttemptHistory({
      loading: false,
      attempts: [],
      total: ip?.attempt_count || 0,
      error: ''
    });
  };

  const handleModalClose = () => {
    resetAttemptHistoryState();
    onClose();
  };

  const handleAction = async (action) => {
    if (!ip) return;

    setLoading(true);
    setError('');

    try {
      await adminConsoleApi.blockedIPs.update(ip.ip_address, action);
      // Refresh data - parent will update both table and modal IP data
      onSuccess();
      // For unblock action, keep modal open briefly to show status change
      if (action === 'unblock') {
        // Small delay to let user see the status change before closing
        setTimeout(() => {
          handleModalClose();
        }, 800);
      } else {
        handleModalClose();
      }
    } catch (err) {
      console.error(`Failed to ${action} IP:`, err);
      setError(err.message || t("adminConsole.blockedIpModal.actionFailed", { action, defaultValue: "Failed to {{action}} IP address" }));
    } finally {
      setLoading(false);
    }
  };

  const fetchAttemptHistory = useCallback(async ({ preserveAttempts = false } = {}) => {
    if (!ip?.ip_address) {
      setAttemptHistory({
        loading: false,
        attempts: [],
        total: ip?.attempt_count || 0,
        error: ''
      });
      return;
    }

    setAttemptHistory(prev => ({
      loading: true,
      attempts: preserveAttempts ? prev.attempts : [],
      total: ip?.attempt_count || prev.total || 0,
      error: ''
    }));

    try {
      const result = await adminConsoleApi.blockedIPs.getAttempts(ip.ip_address);
      const attempts = Array.isArray(result?.attempts) ? result.attempts : [];
      const total = typeof result?.total === 'number' ? result.total : (attempts.length || 0);
      setAttemptHistory({
        loading: false,
        attempts,
        total,
        error: ''
      });
    } catch (err) {
      setAttemptHistory(prev => ({
        ...prev,
        loading: false,
        error: err?.message || t("adminConsole.blockedIpModal.attemptHistoryLoadFailed", { defaultValue: "Failed to load attempt history. Please try again." })
      }));
    }
  }, [ip?.ip_address, ip?.attempt_count, t]);

  useEffect(() => {
    fetchAttemptHistory();
  }, [fetchAttemptHistory]);

  // Hide hamburger menu when modal is open (both loading and loaded states)
  useEffect(() => {
    if (ipLoading || ip) {
      document.body.classList.add('blocked-ip-modal-open');
      return () => {
        document.body.classList.remove('blocked-ip-modal-open');
      };
    }
  }, [ip, ipLoading]);

  const status = ip ? getStatus(ip) : { label: t("adminConsole.blockedIpModal.statusLoading", { defaultValue: "Loading..." }), badge: 'status-pending' };
  const now = new Date();
  const blockedUntil = ip?.blocked_until ? new Date(ip.blocked_until) : null;
  const isBlocked = ip && !ip.is_whitelisted && blockedUntil && blockedUntil > now;
  const isWhitelisted = ip && ip.is_whitelisted;

  if (ipLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4 blocked-ip-modal" style={{ display: 'flex', pointerEvents: 'auto' }}>
        <div className="bg-gray-800 rounded-lg p-4 sm:p-6 w-full max-w-2xl border border-gray-700">
          <div className="text-center py-6 sm:py-8">
            <i className="fas fa-spinner fa-spin text-3xl sm:text-4xl text-cyan-400 mb-4"></i>
            <p className="text-gray-400 text-sm sm:text-base">{t("adminConsole.blockedIpModal.loadingDetails", { defaultValue: "Loading IP details..." })}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!ip) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-2 sm:p-4 blocked-ip-modal" style={{ display: 'flex', pointerEvents: 'auto' }}>
      <div className="bg-gray-800 rounded-lg p-3 sm:p-4 md:p-6 w-full max-w-2xl border border-gray-700 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col mb-4 sm:mb-6 gap-3">
          <div className="flex justify-center">
            <button
              onClick={handleModalClose}
              className="text-gray-400 hover:text-white active:text-gray-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-700/50"
              title={t("adminConsole.blockedIpModal.close", { defaultValue: "Close" })}
              aria-label={t("adminConsole.blockedIpModal.closeModal", { defaultValue: "Close modal" })}
            >
              <i className="fas fa-times text-lg sm:text-xl"></i>
            </button>
          </div>
          <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-white">{t("adminConsole.blockedIpModal.title", { defaultValue: "IP Address Details" })}</h3>
        </div>

        {error && (
          <div className="mb-3 sm:mb-4 p-2.5 sm:p-3 bg-red-900 bg-opacity-50 border border-red-500 rounded text-red-200 text-sm sm:text-base">
            {error}
          </div>
        )}

        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">{t("adminConsole.blockedIpModal.ipAddress", { defaultValue: "IP Address" })}</label>
            <div className="text-white font-mono text-sm sm:text-base md:text-lg bg-gray-900 p-2.5 sm:p-3 rounded border border-gray-700 break-all">
              {ip.ip_address}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
              <label className="block text-xs sm:text-sm font-medium text-gray-400">{t("adminConsole.blockedIpModal.totalAttemptsLifetime", { defaultValue: "Total Attempts (Lifetime)" })}</label>
              {attemptHistory.loading && (
                <span className="text-xs text-cyan-400 flex items-center gap-2">
                  <i className="fas fa-spinner fa-spin"></i>
                  {t("adminConsole.blockedIpModal.syncing", { defaultValue: "Syncing" })}
                </span>
              )}
            </div>
            <div className="text-white text-base sm:text-lg bg-gray-900 p-2.5 sm:p-3 rounded border border-gray-700 flex items-center justify-between gap-2">
              <span className="font-semibold">{attemptHistory.total ?? ip.attempt_count ?? 0}</span>
              <span className="text-xs text-gray-400 uppercase tracking-wide whitespace-nowrap">
                {t("adminConsole.blockedIpModal.historyLinked", { defaultValue: "History linked" })}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">{t("adminConsole.blockedIpModal.lastAttemptTime", { defaultValue: "Last Attempt Time" })}</label>
            <div className="text-white text-sm sm:text-base md:text-lg bg-gray-900 p-2.5 sm:p-3 rounded border border-gray-700 break-words">
              {formatDate(ip.last_attempt_time)}
            </div>
          </div>

          {ip.blocked_until && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">{t("adminConsole.blockedIpModal.blockedUntil", { defaultValue: "Blocked Until" })}</label>
              <div className="text-white text-sm sm:text-base md:text-lg bg-gray-900 p-2.5 sm:p-3 rounded border border-gray-700 break-words">
                {formatDate(ip.blocked_until)}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">{t("adminConsole.blockedIpModal.status", { defaultValue: "Status" })}</label>
            <div className="bg-gray-900 p-2.5 sm:p-3 rounded border border-gray-700">
              <span className={`status-badge ${status.badge} inline-block`}>
                {status.label}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">{t("adminConsole.blockedIpModal.createdAt", { defaultValue: "Created At" })}</label>
            <div className="text-gray-300 text-xs sm:text-sm bg-gray-900 p-2.5 sm:p-3 rounded border border-gray-700 break-words">
              {formatDate(ip.created_at)}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">{t("adminConsole.blockedIpModal.updatedAt", { defaultValue: "Updated At" })}</label>
            <div className="text-gray-300 text-xs sm:text-sm bg-gray-900 p-2.5 sm:p-3 rounded border border-gray-700 break-words">
              {formatDate(ip.updated_at)}
            </div>
          </div>
        </div>

        <div className="mb-4 sm:mb-6">
          <IPAttemptHistoryModal
            total={attemptHistory.total ?? ip.attempt_count ?? 0}
            attempts={attemptHistory.attempts}
            loading={attemptHistory.loading}
            error={attemptHistory.error}
            onRefresh={() => fetchAttemptHistory({ preserveAttempts: true })}
          />
        </div>

        <div className="border-t border-gray-700 pt-3 sm:pt-4">
          <h4 className="text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3">{t("adminConsole.blockedIpModal.actions", { defaultValue: "Actions" })}</h4>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {isBlocked && !isWhitelisted && (
              <button
                onClick={() => handleAction('unblock')}
                disabled={loading}
                className="flex-1 action-btn btn-primary min-h-[44px] px-4 text-sm sm:text-base"
                aria-label={t("adminConsole.blockedIpModal.unblockIp", { defaultValue: "Unblock IP" })}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {t("adminConsole.blockedIpModal.processing", { defaultValue: "Processing..." })}
                  </>
                ) : (
                  <>
                    <i className="fas fa-unlock mr-2"></i>
                    {t("adminConsole.blockedIpModal.unblockIp", { defaultValue: "Unblock IP" })}
                  </>
                )}
              </button>
            )}
            
            {!isWhitelisted && (
              <button
                onClick={() => handleAction('whitelist')}
                disabled={loading}
                className="flex-1 action-btn btn-primary min-h-[44px] px-4 text-sm sm:text-base"
                aria-label={t("adminConsole.blockedIpModal.whitelistIp", { defaultValue: "Whitelist IP" })}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {t("adminConsole.blockedIpModal.processing", { defaultValue: "Processing..." })}
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle mr-2"></i>
                    {t("adminConsole.blockedIpModal.whitelistIp", { defaultValue: "Whitelist IP" })}
                  </>
                )}
              </button>
            )}
            
            {isWhitelisted && (
              <button
                onClick={() => handleAction('remove_whitelist')}
                disabled={loading}
                className="flex-1 action-btn btn-danger min-h-[44px] px-4 text-sm sm:text-base"
                aria-label={t("adminConsole.blockedIpModal.removeWhitelist", { defaultValue: "Remove whitelist" })}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    {t("adminConsole.blockedIpModal.processing", { defaultValue: "Processing..." })}
                  </>
                ) : (
                  <>
                    <i className="fas fa-times-circle mr-2"></i>
                    {t("adminConsole.blockedIpModal.removeWhitelistBtn", { defaultValue: "Remove Whitelist" })}
                  </>
                )}
              </button>
            )}
            
            <button
              onClick={handleModalClose}
              disabled={loading}
              className="flex-1 bg-gray-700 text-white py-2.5 sm:py-2 px-4 rounded-lg hover:bg-gray-600 active:bg-gray-500 transition-colors disabled:opacity-50 min-h-[44px] text-sm sm:text-base"
              aria-label={t("adminConsole.blockedIpModal.closeModal", { defaultValue: "Close modal" })}
            >
              {t("adminConsole.blockedIpModal.close", { defaultValue: "Close" })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

