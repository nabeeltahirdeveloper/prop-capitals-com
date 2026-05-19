import React, { useState, useEffect } from 'react';
import BrandModal from './BrandModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { adminConsoleApi } from '@/api/adminConsole';
import { useTranslation } from "../../contexts/LanguageContext";

export default function BrandsSection() {
  const { t } = useTranslation();
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [state, setState] = useState({
    page: 1,
    pageSize: 15,
    total: 0,
    q: ''
  });
  const [meta, setMeta] = useState({ page: 1, pages: 1, total: 0 });
  const [modalState, setModalState] = useState({
    show: false,
    mode: null,
    brand: null
  });
  const [deleteModal, setDeleteModal] = useState({
    show: false,
    brandId: null
  });
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    loadBrands();
  }, [state.page, state.q]);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const params = {
        page: String(state.page),
        pageSize: String(state.pageSize),
        ...(state.q ? { q: state.q } : {})
      };

      const data = await adminConsoleApi.brands.list(params);
      setBrands(data.brands || []);
      setMeta(data.meta || { page: 1, pages: 1, total: 0 });
      setState(prev => ({ ...prev, total: data.meta?.total || 0 }));
    } catch (error) {
      console.error('Failed to load brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'active') return 'status-active';
    if (s === 'inactive') return 'status-inactive';
    return 'status-pending';
  };

  const openDeleteModal = (brandId) => {
    setDeleteModal({ show: true, brandId });
  };

  const confirmDelete = async () => {
    try {
      await adminConsoleApi.brands.delete(deleteModal.brandId);
      setDeleteModal({ show: false, brandId: null });
      loadBrands();
    } catch (error) {
      console.error('Failed to delete brand:', error);
      alert(t("adminConsole.brands.deleteFailed", { defaultValue: "Failed to delete brand: " }) + error.message);
      setDeleteModal({ show: false, brandId: null });
    }
  };

  const viewBrand = async (brandId) => {
    try {
      const data = await adminConsoleApi.brands.get(brandId);
      setModalState({ show: true, mode: 'view', brand: data.brand });
    } catch (error) {
      console.error('Failed to view brand:', error);
      alert(t("adminConsole.brands.loadDetailsFailed", { defaultValue: "Failed to load brand details" }));
    }
  };

  const editBrand = async (brandId) => {
    try {
      const data = await adminConsoleApi.brands.get(brandId);
      setModalState({ show: true, mode: 'edit', brand: data.brand });
    } catch (error) {
      console.error('Failed to load brand:', error);
      alert(t("adminConsole.brands.loadDetailsFailed", { defaultValue: "Failed to load brand details" }));
    }
  };

  const createBrand = () => {
    setModalState({ show: true, mode: 'create', brand: null });
  };

  const closeModal = () => {
    setModalState({ show: false, mode: null, brand: null });
  };

  const handleBrandSuccess = () => {
    loadBrands();
  };

  const toggleSelectMode = () => {
    setSelectMode(prev => !prev);
    setSelectedIds(new Set());
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === brands.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(brands.map(b => b.id)));
    }
  };

  const confirmBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await adminConsoleApi.brands.bulkDelete([...selectedIds]);
      setSelectedIds(new Set());
      setSelectMode(false);
      setDeleteModal({ show: false, brandId: null });
      loadBrands();
    } catch (error) {
      console.error('Failed to bulk delete:', error);
      alert(t("adminConsole.brands.bulkDeleteFailed", { defaultValue: "Failed to delete selected brands: " }) + error.message);
    } finally {
      setBulkDeleting(false);
    }
  };

  // Calculate stats
  const stats = {
    total: meta.total || 0,
    active: brands.filter(b => (b.status || '').toLowerCase() === 'active').length,
    inactive: brands.filter(b => (b.status || '').toLowerCase() === 'inactive').length
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold gradient-text">{t("adminConsole.brands.title", { defaultValue: "Brands Management" })}</h2>
        <div className="flex gap-2">
          {!selectMode && (
            <button className="action-btn btn-primary" onClick={createBrand}>
              <i className="fas fa-plus mr-2"></i>{t("adminConsole.brands.addBrandPartner", { defaultValue: "Add Brand Partner" })}
            </button>
          )}
          <button
            onClick={toggleSelectMode}
            style={selectMode
              ? { background: '#dc2626', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }
              : { background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.3)', cursor: 'pointer', fontWeight: 600 }
            }
          >
            <i className={`fas ${selectMode ? 'fa-times' : 'fa-check-double'} mr-2`}></i>
            {selectMode ? t("adminConsole.brands.cancelSelection", { defaultValue: "Cancel Selection" }) : t("adminConsole.brands.select", { defaultValue: "Select" })}
          </button>
        </div>
      </div>

      {/* Bulk Delete Bar */}
      {selectMode && selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6">
          <span className="text-sm text-red-400 font-semibold">
            {t("adminConsole.brands.brandsSelected", { count: selectedIds.size, defaultValue: "{{count}} brand(s) selected" })}
          </span>
          <button
            className="action-btn bg-red-600 hover:bg-red-700 text-white text-sm"
            disabled={bulkDeleting}
            onClick={() => setDeleteModal({ show: true, brandId: 'bulk' })}
          >
            <i className={`fas ${bulkDeleting ? 'fa-spinner fa-spin' : 'fa-trash'} mr-2`}></i>
            {bulkDeleting ? t("adminConsole.brands.deleting", { defaultValue: "Deleting..." }) : t("adminConsole.brands.deleteSelected", { count: selectedIds.size, defaultValue: "Delete Selected ({{count}})" })}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-2 text-gray-300">{t("adminConsole.brands.totalBrands", { defaultValue: "Total Brands" })}</h3>
          <p className="text-3xl font-bold text-cyan-400">{stats.total}</p>
        </div>
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-2 text-gray-300">{t("adminConsole.brands.activeBrands", { defaultValue: "Active Brands" })}</h3>
          <p className="text-3xl font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="glass-card p-6 rounded-xl">
          <h3 className="text-lg font-semibold mb-2 text-gray-300">{t("adminConsole.brands.inactiveBrands", { defaultValue: "Inactive Brands" })}</h3>
          <p className="text-3xl font-bold text-yellow-400">{stats.inactive}</p>
        </div>
      </div>

      {/* Search */}
      <div className="glass-panel p-6 mb-6">
        <div className="grid grid-cols-1 gap-4">
          <input
            type="text"
            placeholder={t("adminConsole.brands.searchPlaceholder", { defaultValue: "Search brands by name, website, or description..." })}
            className="search-input p-3 rounded-lg"
            value={state.q}
            onChange={(e) => setState(prev => ({ ...prev, q: e.target.value, page: 1 }))}
          />
        </div>
      </div>

      {/* Brands Table */}
      <div className="glass-panel p-6">
        {loading ? (
          <div className="text-center py-12">
            <i className="fas fa-spinner fa-spin text-4xl text-cyan-400 mb-4"></i>
            <p className="text-gray-400">{t("adminConsole.brands.loading", { defaultValue: "Loading brands..." })}</p>
          </div>
        ) : (
          <div className="table-container brands-table-scroll overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="border-b border-gray-700">
                <tr>
                  {selectMode && (
                    <th className="p-4 w-10">
                      <input
                        type="checkbox"
                        checked={brands.length > 0 && selectedIds.size === brands.length}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 accent-cyan-500 cursor-pointer"
                      />
                    </th>
                  )}
                  <th className="text-left p-4">{t("adminConsole.brands.colId", { defaultValue: "ID" })}</th>
                  <th className="text-left p-4">{t("adminConsole.brands.colUsername", { defaultValue: "Username" })}</th>
                  <th className="text-left p-4">{t("adminConsole.brands.colLogo", { defaultValue: "Logo" })}</th>
                  <th className="text-left p-4">{t("adminConsole.brands.colName", { defaultValue: "Name" })}</th>
                  <th className="text-left p-4">{t("adminConsole.brands.colWebsite", { defaultValue: "Website" })}</th>
                  <th className="text-left p-4">{t("adminConsole.brands.colStatus", { defaultValue: "Status" })}</th>
                  <th className="text-left p-4">{t("adminConsole.brands.colCreated", { defaultValue: "Created" })}</th>
                  <th className="text-left p-4">{t("adminConsole.brands.colActions", { defaultValue: "Actions" })}</th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr
                    key={brand.id}
                    className={`border-b border-gray-800 hover:bg-gray-800/30 ${selectMode && selectedIds.has(brand.id) ? 'bg-cyan-500/10' : ''}`}
                    onClick={selectMode ? () => toggleSelect(brand.id) : undefined}
                    style={selectMode ? { cursor: 'pointer' } : undefined}
                  >
                    {selectMode && (
                      <td className="p-4 w-10" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(brand.id)}
                          onChange={() => toggleSelect(brand.id)}
                          className="w-4 h-4 accent-cyan-500 cursor-pointer"
                        />
                      </td>
                    )}
                    <td className="p-4 mono" data-label={t("adminConsole.brands.colId", { defaultValue: "ID" })}>#{brand.id}</td>
                    <td className="p-4 mono font-semibold text-cyan-400" data-label={t("adminConsole.brands.colUsername", { defaultValue: "Username" })}>
                      {brand.username || '-'}
                    </td>
                    <td className="p-4" data-label={t("adminConsole.brands.colLogo", { defaultValue: "Logo" })}>
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="w-10 h-10 rounded object-cover"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {brand.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-semibold" data-label={t("adminConsole.brands.colName", { defaultValue: "Name" })}>{brand.name || t("adminConsole.brands.notAvailable", { defaultValue: "N/A" })}</td>
                    <td className="p-4" data-label={t("adminConsole.brands.colWebsite", { defaultValue: "Website" })}>
                      {brand.website ? (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:underline"
                        >
                          {brand.website.replace(/^https?:\/\//, '').substring(0, 30)}
                        </a>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="p-4" data-label={t("adminConsole.brands.colStatus", { defaultValue: "Status" })}>
                      <span className={`status-badge ${getStatusBadge(brand.status)}`}>
                        {brand.status || 'active'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-400" data-label={t("adminConsole.brands.colCreated", { defaultValue: "Created" })}>
                      {new Date(brand.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4" data-label={t("adminConsole.brands.colActions", { defaultValue: "Actions" })}>
                      <div className="flex space-x-2">
                        <button
                          className="action-btn btn-secondary"
                          onClick={() => viewBrand(brand.id)}
                          title={t("adminConsole.brands.viewBrandTitle", { defaultValue: "View brand details" })}
                        >
                          {t("adminConsole.brands.view", { defaultValue: "View" })}
                        </button>
                        <button
                          className="action-btn btn-primary"
                          onClick={() => editBrand(brand.id)}
                          title={t("adminConsole.brands.editBrandTitle", { defaultValue: "Edit brand" })}
                        >
                          {t("adminConsole.brands.edit", { defaultValue: "Edit" })}
                        </button>
                        <button
                          className="action-btn btn-danger"
                          onClick={() => openDeleteModal(brand.id)}
                          title={t("adminConsole.brands.deleteBrandTitle", { defaultValue: "Delete brand" })}
                        >
                          {t("adminConsole.brands.delete", { defaultValue: "Delete" })}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {brands.length === 0 && (
                  <tr>
                    <td colSpan={selectMode ? "9" : "8"} className="p-8 text-center text-gray-400">
                      {t("adminConsole.brands.noBrandsFound", { defaultValue: "No brands found. Click \"Add Brand Partner\" to create your first brand." })}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {!loading && brands.length > 0 && (
          <div className="flex justify-between items-center mt-4">
            <button
              className="action-btn btn-secondary"
              onClick={() => state.page > 1 && setState(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={state.page <= 1}
            >
              <i className="fas fa-chevron-left mr-2"></i>{t("common.pagination.previous", { defaultValue: "Previous" })}
            </button>
            <div className="text-sm text-gray-400">
              {t("common.pagination.pageOf", { current: meta.page, total: meta.pages, defaultValue: "Page {{current}} of {{total}}" })} — {meta.total} {t("common.pagination.records", { defaultValue: "total" })}
            </div>
            <button
              className="action-btn btn-secondary"
              onClick={() => state.page < meta.pages && setState(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={state.page >= meta.pages}
            >
              {t("common.pagination.next", { defaultValue: "Next" })}<i className="fas fa-chevron-right ml-2"></i>
            </button>
          </div>
        )}
      </div>

      {/* Brand Modal */}
      {modalState.show && (
        <BrandModal
          brand={modalState.brand}
          mode={modalState.mode}
          onClose={closeModal}
          onSuccess={handleBrandSuccess}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <DeleteConfirmModal
          title={deleteModal.brandId === 'bulk' ? t("adminConsole.brands.deleteSelectedBrandsTitle", { defaultValue: "Delete Selected Brands" }) : t("adminConsole.brands.deleteBrandModalTitle", { defaultValue: "Delete Brand" })}
          message={deleteModal.brandId === 'bulk'
            ? t("adminConsole.brands.bulkDeleteConfirm", { count: selectedIds.size, defaultValue: "Are you sure you want to delete {{count}} selected brand(s)? This action cannot be undone." })
            : t("adminConsole.brands.deleteConfirm", { defaultValue: "Are you sure you want to delete this brand? This action cannot be undone." })}
          onConfirm={deleteModal.brandId === 'bulk' ? confirmBulkDelete : confirmDelete}
          onCancel={() => setDeleteModal({ show: false, brandId: null })}
          loading={bulkDeleting}
        />
      )}
    </div>
  );
}
