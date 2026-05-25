import React, { useState, useEffect, useMemo } from 'react';
import { adminConsoleApi } from '@/api/adminConsole';
import { useTranslation } from "../../contexts/LanguageContext";
import DirectPurchaseLinkModal from './DirectPurchaseLinkModal';

// Get the public site base URL where /pay/<slug> resolves brand links.
// In dev the admin runs on :5175 and the public site on :5173. In prod we
// point at prop-capitals.com (no separate pay subdomain — checkout lives on
// the same site at /pay/:slug).
const getCheckoutBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:5173';
    }
    return 'https://prop-capitals.com';
  }
  return 'https://prop-capitals.com';
};

export default function DirectPurchaseLinksSection() {
  const { t } = useTranslation();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState('');
  const [brands, setBrands] = useState([]);
  const [modalLink, setModalLink] = useState(null); // edit target
  const [modalOpen, setModalOpen] = useState(false);
  const [busyId, setBusyId] = useState(null); // toggle/delete-in-flight tracker

  useEffect(() => {
    loadBrands();
    loadLinks();
  }, []);

  useEffect(() => {
    loadLinks();
  }, [selectedBrandId]);

  const stats = useMemo(() => {
    const total = links.length;
    const active = links.filter(link => link.is_active).length;
    const visits = links.reduce((sum, link) => sum + Number(link.visits_count || 0), 0);
    return { total, active, visits };
  }, [links]);

  const loadBrands = async () => {
    try {
      const data = await adminConsoleApi.brands.list();
      setBrands(data.brands || []);
    } catch (err) {
      console.error('Failed to load brands:', err);
    }
  };

  const loadLinks = async () => {
    setLoading(true);
    try {
      const params = selectedBrandId ? { brand_id: selectedBrandId } : {};
      const data = await adminConsoleApi.directPurchaseLinks.list(params);
      setLinks(data.links || []);
    } catch (err) {
      console.error('Failed to load direct purchase links:', err);
      setError(t("adminConsole.directLinks.loadError", { defaultValue: "Failed to load direct purchase links" }));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSuccess(t("adminConsole.directLinks.linkCopied", { defaultValue: "Link copied to clipboard!" }));
    setTimeout(() => setSuccess(''), 2000);
  };

  const getPurchaseUrl = (link) => {
    if (link?.destination_url) return link.destination_url;
    const baseUrl = getCheckoutBaseUrl();
    return `${baseUrl}/pay/${link.link_id}`;
  };

  const openCreateModal = () => {
    setModalLink(null);
    setModalOpen(true);
  };

  const openEditModal = (link) => {
    setModalLink(link);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalLink(null);
  };

  const handleModalSaved = async () => {
    closeModal();
    setSuccess(
      modalLink
        ? t('adminConsole.directLinks.updateSuccess', {
            defaultValue: 'Link updated successfully',
          })
        : t('adminConsole.directLinks.createSuccess', {
            defaultValue: 'Link created successfully',
          }),
    );
    setTimeout(() => setSuccess(''), 3000);
    await loadLinks();
  };

  const handleToggleActive = async (link) => {
    setBusyId(link.id);
    setError('');
    try {
      await adminConsoleApi.directPurchaseLinks.update(link.id, {
        active: !link.is_active,
      });
      await loadLinks();
    } catch (err) {
      setError(
        err?.message ||
          t('adminConsole.directLinks.updateError', {
            defaultValue: 'Failed to update link',
          }),
      );
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (link) => {
    const confirmMsg = t('adminConsole.directLinks.confirmDelete', {
      name: link.name || link.link_id,
      defaultValue: 'Delete "{{name}}"? This cannot be undone.',
    });
    if (!window.confirm(confirmMsg)) return;

    setBusyId(link.id);
    setError('');
    try {
      await adminConsoleApi.directPurchaseLinks.delete(link.id);
      setSuccess(
        t('adminConsole.directLinks.deleteSuccess', {
          defaultValue: 'Link deleted',
        }),
      );
      setTimeout(() => setSuccess(''), 3000);
      await loadLinks();
    } catch (err) {
      setError(
        err?.message ||
          t('adminConsole.directLinks.deleteError', {
            defaultValue: 'Failed to delete link',
          }),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold gradient-text mb-2">{t("adminConsole.directLinks.title", { defaultValue: "Direct Purchase Links" })}</h2>
          <p className="text-gray-400">
            {t("adminConsole.directLinks.subtitle", { defaultValue: "Monitor every direct purchase link created by brands and share them instantly." })}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={openCreateModal}
            disabled={loading}
            className="action-btn btn-primary flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            {t("adminConsole.directLinks.createCustom", { defaultValue: "Create Custom Link" })}
          </button>
          <button
            onClick={async () => {
              setError('');
              setSuccess('');
              setLoading(true);
              try {
                const res = await adminConsoleApi.directPurchaseLinks.backfill();
                setSuccess(
                  t("adminConsole.directLinks.generateSuccess", {
                    brands: res?.brands_processed ?? 0,
                    links: res?.total_links_created ?? 0,
                    defaultValue: "Generated links for {{brands}} brands ({{links}} new links).",
                  }),
                );
                await loadLinks();
              } catch (err) {
                setError(err?.message || t("adminConsole.directLinks.generateError", { defaultValue: "Failed to generate links" }));
              } finally {
                setLoading(false);
                setTimeout(() => setSuccess(''), 4000);
              }
            }}
            disabled={loading}
            className="action-btn btn-secondary flex items-center gap-2"
            title={t("adminConsole.directLinks.generateTooltip", { defaultValue: "Provision Main link + one link per challenge for every brand. Idempotent — won't duplicate." })}
          >
            <i className={`fas fa-magic`}></i>
            {t("adminConsole.directLinks.generateForAll", { defaultValue: "Generate Links for All Brands" })}
          </button>
          <button
            onClick={loadLinks}
            disabled={loading}
            className="action-btn btn-secondary flex items-center gap-2"
          >
            <i className={`fas fa-sync-alt ${loading ? 'fa-spin' : ''}`}></i>
            {t("adminConsole.directLinks.refresh", { defaultValue: "Refresh" })}
          </button>
        </div>
      </div>

      {/* Alerts */}
      {success && (
        <div className="glass-panel border border-green-400/40 bg-green-500/10 text-green-200 px-4 py-3 mb-4 flex items-center gap-2">
          <i className="fas fa-check-circle"></i>
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="glass-panel border border-red-400/40 bg-red-500/10 text-red-200 px-4 py-3 mb-4 flex items-center gap-2">
          <i className="fas fa-exclamation-triangle"></i>
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Stats */}
      <div className="glass-panel p-6 mb-6">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              {t("adminConsole.directLinks.filterByBrand", { defaultValue: "Filter by Brand" })}
            </label>
            <select
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              className="search-input p-3 rounded-lg w-full"
            >
              <option value="">{t("adminConsole.directLinks.allBrands", { defaultValue: "All Brands" })}</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-4 rounded-lg text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400">{t("adminConsole.directLinks.totalLinks", { defaultValue: "Total Links" })}</p>
              <p className="text-2xl font-bold text-cyan-300">{stats.total}</p>
            </div>
            <div className="glass-card p-4 rounded-lg text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400">{t("adminConsole.directLinks.active", { defaultValue: "Active" })}</p>
              <p className="text-2xl font-bold text-green-300">{stats.active}</p>
            </div>
            <div className="glass-card p-4 rounded-lg text-center">
              <p className="text-xs uppercase tracking-wide text-gray-400">{t("adminConsole.directLinks.visits", { defaultValue: "Visits" })}</p>
              <p className="text-2xl font-bold text-purple-300">{stats.visits}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && links.length === 0 && (
        <div className="glass-panel p-8 text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-cyan-400 mb-4"></i>
          <p className="text-gray-400">{t("adminConsole.directLinks.loading", { defaultValue: "Loading direct purchase links..." })}</p>
        </div>
      )}

      {/* Links List */}
      {links.length > 0 && !loading && (
        <div className="space-y-5">
          {links.map((link) => (
            <div key={link.id} className="glass-panel p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-2xl font-semibold text-white">{link.name}</h3>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      link.is_active ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'
                    }`}>
                      {link.is_active ? t("adminConsole.directLinks.statusActive", { defaultValue: "Active" }) : t("adminConsole.directLinks.statusInactive", { defaultValue: "Inactive" })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-1">
                    <span className="text-gray-300 font-medium">{t("adminConsole.directLinks.brandLabel", { defaultValue: "Brand:" })}</span> {link.brand_name || t("adminConsole.directLinks.notAvailable", { defaultValue: "N/A" })}
                  </p>
                  <p className="text-sm text-gray-400">
                    ${Number(link.total_amount).toFixed(2)} • {t("adminConsole.directLinks.packageLabel", { defaultValue: "Package:" })} ${Number(link.package_price).toFixed(2)} • {t("adminConsole.directLinks.creditsLabel", { defaultValue: "Credits:" })} ${Number(link.credits_price).toFixed(2)} ({link.credits_amount === 'unlimited' ? t("adminConsole.directLinks.unlimited", { defaultValue: "Unlimited" }) : link.credits_amount} {t("adminConsole.directLinks.creditsWord", { defaultValue: "credits" })})
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(getPurchaseUrl(link))}
                    className="action-btn btn-secondary whitespace-nowrap"
                    title={t("adminConsole.directLinks.copyLink", { defaultValue: "Copy Link" })}
                  >
                    <i className="fas fa-copy mr-2"></i>
                    {t("adminConsole.directLinks.copyLink", { defaultValue: "Copy Link" })}
                  </button>
                  <button
                    onClick={() => openEditModal(link)}
                    className="action-btn btn-secondary"
                    title={t("adminConsole.directLinks.edit", { defaultValue: "Edit" })}
                    disabled={busyId === link.id}
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    onClick={() => handleToggleActive(link)}
                    className={`action-btn ${link.is_active ? 'btn-secondary' : 'btn-primary'}`}
                    title={link.is_active
                      ? t("adminConsole.directLinks.deactivate", { defaultValue: "Deactivate" })
                      : t("adminConsole.directLinks.activate", { defaultValue: "Activate" })}
                    disabled={busyId === link.id}
                  >
                    <i className={`fas fa-${link.is_active ? 'toggle-on' : 'toggle-off'}`}></i>
                  </button>
                  <button
                    onClick={() => handleDelete(link)}
                    className="action-btn btn-secondary !text-red-300 hover:!text-red-200"
                    title={t("adminConsole.directLinks.delete", { defaultValue: "Delete" })}
                    disabled={busyId === link.id}
                  >
                    {busyId === link.id ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-trash"></i>
                    )}
                  </button>
                </div>
              </div>

              <div className="glass-card border border-white/10 rounded-lg p-3 mb-5 flex flex-col md:flex-row md:items-center gap-3">
                <input
                  type="text"
                  value={getPurchaseUrl(link)}
                  readOnly
                  className="search-input font-mono text-sm p-3 rounded-lg flex-1 bg-transparent"
                />
                <button
                  onClick={() => copyToClipboard(getPurchaseUrl(link))}
                  className="action-btn btn-primary w-full md:w-auto"
                >
                  {t("adminConsole.directLinks.copy", { defaultValue: "Copy" })}
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass-card p-4 rounded-lg text-center">
                  <div className="text-gray-400 text-sm flex items-center justify-center gap-2 mb-2">
                    <i className="fas fa-eye"></i> {t("adminConsole.directLinks.visits", { defaultValue: "Visits" })}
                  </div>
                  <div className="text-3xl font-bold text-cyan-300">
                    {link.visits_count || 0}
                  </div>
                </div>

                <div className="glass-card p-4 rounded-lg text-center">
                  <div className="text-gray-400 text-sm flex items-center justify-center gap-2 mb-2">
                    <i className="fas fa-receipt"></i> {t("adminConsole.directLinks.transactions", { defaultValue: "Transactions" })}
                  </div>
                  <div className="text-3xl font-bold text-purple-300">
                    {link.transactions_count || 0}
                  </div>
                </div>

                <div className="glass-card p-4 rounded-lg text-center">
                  <div className="text-gray-400 text-sm flex items-center justify-center gap-2 mb-2">
                    <i className="fas fa-percentage"></i> {t("adminConsole.directLinks.convRate", { defaultValue: "Conv. Rate" })}
                  </div>
                  <div className="text-3xl font-bold text-green-300">
                    {Number(link.conversion_rate || 0).toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Links */}
      {links.length === 0 && !loading && (
        <div className="glass-panel p-12 text-center">
          <i className="fas fa-link text-5xl text-gray-500 mb-4"></i>
          <h3 className="text-xl font-semibold text-gray-200 mb-2">{t("adminConsole.directLinks.noLinksTitle", { defaultValue: "No Direct Purchase Links" })}</h3>
          <p className="text-gray-400 mb-4">
            {selectedBrandId ? t("adminConsole.directLinks.noLinksForBrand", { defaultValue: "This brand has no direct purchase links yet." }) : t("adminConsole.directLinks.noLinksFound", { defaultValue: "No direct purchase links found." })}
          </p>
          <button
            onClick={openCreateModal}
            className="action-btn btn-primary inline-flex items-center gap-2"
          >
            <i className="fas fa-plus"></i>
            {t("adminConsole.directLinks.createCustom", { defaultValue: "Create Custom Link" })}
          </button>
        </div>
      )}

      {modalOpen && (
        <DirectPurchaseLinkModal
          link={modalLink}
          brands={brands}
          onClose={closeModal}
          onSaved={handleModalSaved}
        />
      )}
    </div>
  );
}

