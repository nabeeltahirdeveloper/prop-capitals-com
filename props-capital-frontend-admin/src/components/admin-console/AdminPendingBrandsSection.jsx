import React, { useState, useEffect } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import { useTranslation } from "../../contexts/LanguageContext";

export default function AdminPendingBrandsSection() {
  const { t } = useTranslation();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [processingId, setProcessingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectModal, setRejectModal] = useState({ show: false, brandId: null, reason: '' });

  useEffect(() => {
    loadPendingBrands();
  }, [page]);

  const loadPendingBrands = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminConsoleApi.brands.getPending({ 
        page: String(page), 
        pageSize: String(pageSize) 
      });
      setBrands(data.brands || []);
      setMeta(data.meta || { total: 0, pages: 1 });
    } catch (err) {
      console.error('Failed to load pending brands:', err);
      const errorMessage = err?.error || err?.message || t("adminConsole.pendingBrands.loadFailed", { defaultValue: "Failed to load pending brands" });
      setError(errorMessage);
      // If it's a 400 error with "invalid id", it might be a route conflict issue
      if (errorMessage.includes('invalid id')) {
        setError(t("adminConsole.pendingBrands.routeConflict", { defaultValue: "Route conflict detected. Please contact the administrator." }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (brandId) => {
    if (!confirm(t("adminConsole.pendingBrands.approveConfirm", { defaultValue: "Are you sure you want to approve this brand? This will create a user account and send login credentials via email." }))) {
      return;
    }

    setProcessingId(brandId);
    setError('');
    setSuccess('');

    try {
      const response = await adminConsoleApi.brands.approve(brandId);
      setSuccess(t("adminConsole.pendingBrands.approveSuccess", { defaultValue: "Brand approved successfully!" }) + " " + (response.password_sent ? t("adminConsole.pendingBrands.credentialsSent", { defaultValue: "Login credentials have been sent via email." }) : t("adminConsole.pendingBrands.emailNotConfigured", { defaultValue: "Note: Email service may not be configured." })));
      setTimeout(() => {
        setSuccess('');
        loadPendingBrands();
      }, 3000);
    } catch (err) {
      console.error('Failed to approve brand:', err);
      setError(err.message || t("adminConsole.pendingBrands.approveFailed", { defaultValue: "Failed to approve brand" }));
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.brandId) return;
    
    setProcessingId(rejectModal.brandId);
    setError('');
    setSuccess('');

    try {
      await adminConsoleApi.brands.reject(rejectModal.brandId, rejectModal.reason);
      setSuccess(t("adminConsole.pendingBrands.rejectSuccess", { defaultValue: "Brand rejected successfully. The reseller has been notified." }));
      setRejectModal({ show: false, brandId: null, reason: '' });
      setTimeout(() => {
        setSuccess('');
        loadPendingBrands();
      }, 3000);
    } catch (err) {
      console.error('Failed to reject brand:', err);
      setError(err.message || t("adminConsole.pendingBrands.rejectFailed", { defaultValue: "Failed to reject brand" }));
      setTimeout(() => setError(''), 5000);
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (brandId) => {
    setRejectModal({ show: true, brandId, reason: '' });
  };

  const closeRejectModal = () => {
    setRejectModal({ show: false, brandId: null, reason: '' });
  };

  if (loading && page === 1) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-spinner fa-spin text-4xl text-purple-500 mb-4"></i>
        <p className="text-gray-600">{t("adminConsole.pendingBrands.loading", { defaultValue: "Loading pending brands..." })}</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{t("adminConsole.pendingBrands.title", { defaultValue: "Pending Brand Approvals" })}</h2>
        <p className="text-sm text-gray-600 mt-1">{t("adminConsole.pendingBrands.subtitle", { defaultValue: "Review and approve brand registrations submitted by resellers" })}</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
          <i className="fas fa-exclamation-circle mr-2"></i>
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300">
          <i className="fas fa-check-circle mr-2"></i>
          {success}
        </div>
      )}

      {/* Stats Card */}
      <div className="glass-card p-4 md:p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{t("adminConsole.pendingBrands.totalPending", { defaultValue: "Total Pending Brands" })}</p>
            <p className="text-3xl font-bold text-yellow-600">{meta.total}</p>
          </div>
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <i className="fas fa-clock text-3xl text-yellow-500"></i>
          </div>
        </div>
      </div>

      {/* Brands List */}
      {brands.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <i className="fas fa-check-circle text-6xl text-green-400 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{t("adminConsole.pendingBrands.noPending", { defaultValue: "No Pending Brands" })}</h3>
          <p className="text-gray-600">{t("adminConsole.pendingBrands.allReviewed", { defaultValue: "All brand registrations have been reviewed." })}</p>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block glass-panel p-6">
            <div className="table-container overflow-x-auto">
              <table className="w-full min-w-[1150px]">
                <thead className="border-b border-gray-700">
                  <tr>
                    <th className="text-left p-4 whitespace-nowrap min-w-[240px]">{t("adminConsole.pendingBrands.colBrandName", { defaultValue: "Brand Name" })}</th>
                    <th className="text-left p-4 whitespace-nowrap min-w-[220px]">{t("adminConsole.pendingBrands.colEmail", { defaultValue: "Email" })}</th>
                    <th className="text-left p-4 whitespace-nowrap min-w-[130px]">{t("adminConsole.pendingBrands.colUsername", { defaultValue: "Username" })}</th>
                    <th className="text-left p-4 whitespace-nowrap min-w-[120px]">{t("adminConsole.pendingBrands.colSlug", { defaultValue: "Slug" })}</th>
                    <th className="text-left p-4 whitespace-nowrap min-w-[130px]">{t("adminConsole.pendingBrands.colCommissionRate", { defaultValue: "Commission Rate" })}</th>
                    <th className="text-left p-4 whitespace-nowrap min-w-[150px]">{t("adminConsole.pendingBrands.colCreatedBy", { defaultValue: "Created By" })}</th>
                    <th className="text-left p-4 whitespace-nowrap min-w-[120px]">{t("adminConsole.pendingBrands.colSubmitted", { defaultValue: "Submitted" })}</th>
                    <th className="text-left p-4 whitespace-nowrap min-w-[220px]">{t("adminConsole.pendingBrands.colActions", { defaultValue: "Actions" })}</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((brand) => (
                    <tr key={brand.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center">
                          {brand.logo_url ? (
                            <img 
                              src={brand.logo_url} 
                              alt={brand.name} 
                              className="w-10 h-10 rounded mr-3 object-cover"
                              onError={(e) => { e.target.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded mr-3 bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white">
                              <i className="fas fa-store"></i>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold">{brand.name}</p>
                            {brand.description && (
                              <p className="text-xs text-gray-400 truncate max-w-xs">{brand.description}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="truncate max-w-[220px]" title={brand.email}>{brand.email}</p>
                      </td>
                      <td className="p-4">
                        <code className="mono font-semibold text-cyan-400">{brand.username}</code>
                      </td>
                      <td className="p-4">
                        <code className="mono text-gray-300">{brand.slug}</code>
                      </td>
                      <td className="p-4 whitespace-nowrap">{brand.commission_rate}%</td>
                      <td className="p-4">
                        {brand.parent_brand_name ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 max-w-[140px]">
                            <i className="fas fa-network-wired mr-1"></i>
                            <span className="truncate" title={brand.parent_brand_name}>{brand.parent_brand_name}</span>
                          </span>
                        ) : (
                          <span className="text-gray-500">{t("adminConsole.pendingBrands.notAvailable", { defaultValue: "N/A" })}</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-gray-400 whitespace-nowrap">
                        {new Date(brand.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 flex-nowrap">
                          <button
                            onClick={() => handleApprove(brand.id)}
                            disabled={processingId === brand.id}
                            className="action-btn btn-primary whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {processingId === brand.id ? (
                              <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                {t("adminConsole.pendingBrands.processing", { defaultValue: "Processing..." })}
                              </>
                            ) : (
                              <>
                                <i className="fas fa-check mr-2"></i>
                                {t("adminConsole.pendingBrands.approve", { defaultValue: "Approve" })}
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => openRejectModal(brand.id)}
                            disabled={processingId === brand.id}
                            className="action-btn btn-danger whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <i className="fas fa-times mr-2"></i>
                            {t("adminConsole.pendingBrands.reject", { defaultValue: "Reject" })}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {brands.map((brand) => (
              <div key={brand.id} className="glass-card p-4 rounded-xl border border-cyan-500/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center flex-1 min-w-0">
                    {brand.logo_url ? (
                      <img 
                        src={brand.logo_url} 
                        alt={brand.name} 
                        className="w-12 h-12 rounded mr-3 object-cover flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded mr-3 bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center flex-shrink-0 text-white">
                        <i className="fas fa-store"></i>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{brand.name}</p>
                      <p className="text-xs text-gray-400 truncate">{brand.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{t("adminConsole.pendingBrands.usernameLabel", { defaultValue: "Username:" })}</span>
                    <code className="text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 px-2 py-1 rounded-md max-w-[55%] truncate">
                      {brand.username}
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{t("adminConsole.pendingBrands.slugLabel", { defaultValue: "Slug:" })}</span>
                    <code className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/30 px-2 py-1 rounded-md max-w-[55%] truncate">
                      {brand.slug}
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{t("adminConsole.pendingBrands.commissionLabel", { defaultValue: "Commission:" })}</span>
                    <span className="font-semibold text-white">{brand.commission_rate}%</span>
                  </div>
                  {brand.parent_brand_name && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">{t("adminConsole.pendingBrands.createdByLabel", { defaultValue: "Created By:" })}</span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        <i className="fas fa-network-wired mr-1"></i>
                        {brand.parent_brand_name}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{t("adminConsole.pendingBrands.submittedLabel", { defaultValue: "Submitted:" })}</span>
                    <span className="text-gray-300">{new Date(brand.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-3 border-t border-cyan-500/20">
                  <button
                    onClick={() => handleApprove(brand.id)}
                    disabled={processingId === brand.id}
                    className="action-btn btn-primary flex-1 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingId === brand.id ? (
                      <>
                        <i className="fas fa-spinner fa-spin mr-2"></i>
                        {t("adminConsole.pendingBrands.processing", { defaultValue: "Processing..." })}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-check mr-2"></i>
                        {t("adminConsole.pendingBrands.approve", { defaultValue: "Approve" })}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => openRejectModal(brand.id)}
                    disabled={processingId === brand.id}
                    className="action-btn btn-danger flex-1 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="fas fa-times mr-2"></i>
                    {t("adminConsole.pendingBrands.reject", { defaultValue: "Reject" })}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {meta.pages > 1 && (
            <div className="mt-6 flex justify-center items-center space-x-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="action-btn btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <span className="text-sm text-gray-600">
                {t("common.pagination.pageOf", { current: page, total: meta.pages, defaultValue: "Page {{current}} of {{total}}" })}
              </span>
              <button
                onClick={() => setPage(p => Math.min(meta.pages, p + 1))}
                disabled={page >= meta.pages}
                className="action-btn btn-secondary px-4 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {rejectModal.show && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-panel max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold gradient-text">{t("adminConsole.pendingBrands.rejectBrandTitle", { defaultValue: "Reject Brand" })}</h3>
                <button 
                  onClick={closeRejectModal}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  {t("adminConsole.pendingBrands.rejectionReasonLabel", { defaultValue: "Rejection Reason (Optional)" })}
                </label>
                <textarea
                  value={rejectModal.reason}
                  onChange={(e) => setRejectModal(prev => ({ ...prev, reason: e.target.value }))}
                  rows={4}
                  placeholder={t("adminConsole.pendingBrands.rejectionReasonPlaceholder", { defaultValue: "Provide a reason for rejection (will be sent to reseller via email)..." })}
                  className="search-input p-3 rounded-lg w-full resize-none"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {t("adminConsole.pendingBrands.rejectionReasonHint", { defaultValue: "This reason will be included in the rejection email sent to the reseller." })}
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={closeRejectModal}
                  className="action-btn btn-secondary px-6"
                >
                  {t("adminConsole.pendingBrands.cancel", { defaultValue: "Cancel" })}
                </button>
                <button
                  onClick={handleReject}
                  disabled={processingId === rejectModal.brandId}
                  className="action-btn btn-danger px-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processingId === rejectModal.brandId ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      {t("adminConsole.pendingBrands.processing", { defaultValue: "Processing..." })}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-times mr-2"></i>
                      {t("adminConsole.pendingBrands.rejectBrandButton", { defaultValue: "Reject Brand" })}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

