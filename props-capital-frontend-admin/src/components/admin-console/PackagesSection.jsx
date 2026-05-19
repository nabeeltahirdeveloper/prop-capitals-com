import React, { useState, useEffect } from 'react';
import PackageModal from './PackageModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import { adminConsoleApi } from '@/api/adminConsole';
import { useTranslation } from "../../contexts/LanguageContext";

export default function PackagesSection() {
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [creditPackages, setCreditPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('packages'); // 'packages' or 'credits'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      setLoading(true);
      const data = await adminConsoleApi.packages.list();
      setPackages(data.packages || []);
      setCreditPackages(data.creditPackages || []);
    } catch (error) {
      console.error('Failed to load packages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPackage(null);
    setModalOpen(true);
  };

  const handleEdit = (pkg) => {
    setEditingPackage(pkg);
    setModalOpen(true);
  };

  const handleDelete = (pkg) => {
    setPackageToDelete(pkg);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!packageToDelete) return;
    
    try {
      await adminConsoleApi.packages.delete(packageToDelete.id);
      await loadPackages();
      setDeleteModalOpen(false);
      setPackageToDelete(null);
    } catch (error) {
      console.error('Failed to delete package:', error);
    }
  };

  const handleSave = async (packageData) => {
    try {
      if (editingPackage) {
        await adminConsoleApi.packages.update(editingPackage.id, packageData);
      } else {
        await adminConsoleApi.packages.create(packageData);
      }
      await loadPackages();
      setModalOpen(false);
      setEditingPackage(null);
    } catch (error) {
      console.error('Failed to save package:', error);
    }
  };

  const displayPackages = activeTab === 'packages' ? packages : creditPackages;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-xl text-gray-400">{t("adminConsole.packages.loading", { defaultValue: "Loading packages..." })}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold gradient-text">{t("adminConsole.packages.title", { defaultValue: "Package Management" })}</h2>
        <button 
          className="action-btn btn-primary"
          onClick={handleCreate}
        >
          <i className="fas fa-plus mr-2"></i>
          {activeTab === 'packages'
            ? t("adminConsole.packages.createPackage", { defaultValue: "Create Package" })
            : t("adminConsole.packages.createCreditPackage", { defaultValue: "Create Credit Package" })}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mb-6">
        <button
          className={`px-6 py-3 rounded-lg font-semibold transition-all w-full sm:w-auto ${
            activeTab === 'packages'
              ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('packages')}
        >
          <i className="fas fa-box mr-2"></i>
          {t("adminConsole.packages.mainPackages", { count: packages.length, defaultValue: "Main Packages ({{count}})" })}
        </button>
        <button
          className={`px-6 py-3 rounded-lg font-semibold transition-all w-full sm:w-auto ${
            activeTab === 'credits'
              ? 'bg-gradient-to-r from-purple-600 to-cyan-500 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
          onClick={() => setActiveTab('credits')}
        >
          <i className="fas fa-coins mr-2"></i>
          {t("adminConsole.packages.creditPackages", { count: creditPackages.length, defaultValue: "Credit Packages ({{count}})" })}
        </button>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {displayPackages.map((pkg) => (
          <PackageCard
            key={pkg.id}
            package={pkg}
            onEdit={handleEdit}
            onDelete={handleDelete}
            type={activeTab}
          />
        ))}
      </div>

      {displayPackages.length === 0 && (
        <div className="text-center py-12">
          <i className="fas fa-box-open text-6xl text-gray-600 mb-4"></i>
          <p className="text-xl text-gray-400">
            {activeTab === 'packages'
              ? t("adminConsole.packages.noPackagesYet", { defaultValue: "No packages yet" })
              : t("adminConsole.packages.noCreditPackagesYet", { defaultValue: "No credit packages yet" })}
          </p>
          <button
            className="mt-4 action-btn btn-primary"
            onClick={handleCreate}
          >
            <i className="fas fa-plus mr-2"></i>
            {activeTab === 'packages'
              ? t("adminConsole.packages.createFirstPackage", { defaultValue: "Create Your First Package" })
              : t("adminConsole.packages.createFirstCreditPackage", { defaultValue: "Create Your First Credit Package" })}
          </button>
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <PackageModal
          package={editingPackage}
          type={activeTab}
          onClose={() => {
            setModalOpen(false);
            setEditingPackage(null);
          }}
          onSave={handleSave}
        />
      )}

      {deleteModalOpen && (
        <DeleteConfirmModal
          title={t("adminConsole.packages.deleteTitle", { defaultValue: "Delete Package" })}
          message={t("adminConsole.packages.deleteMessage", { name: packageToDelete?.name, defaultValue: 'Are you sure you want to delete "{{name}}"? This action cannot be undone.' })}
          onConfirm={confirmDelete}
          onCancel={() => {
            setDeleteModalOpen(false);
            setPackageToDelete(null);
          }}
        />
      )}
    </div>
  );
}

function PackageCard({ package: pkg, onEdit, onDelete, type }) {
  const { t } = useTranslation();
  const getColorClasses = () => {
    if (pkg.popular) return 'from-purple-600 to-pink-600';
    if (type === 'credits') return 'from-cyan-600 to-blue-600';
    return 'from-gray-700 to-gray-800';
  };

  return (
    <div className={`glass-card p-6 rounded-xl relative ${pkg.popular ? 'ring-2 ring-purple-500' : ''}`}>
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full">
            {t("adminConsole.packages.popular", { defaultValue: "POPULAR" })}
          </span>
        </div>
      )}

      {!pkg.active && (
        <div className="absolute top-4 right-4">
          <span className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            {t("adminConsole.packages.inactive", { defaultValue: "INACTIVE" })}
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
        <p className="text-sm text-gray-400">{pkg.description}</p>
      </div>

      <div className="mb-4">
        <div className={`text-4xl font-bold bg-gradient-to-r ${getColorClasses()} bg-clip-text text-transparent`}>
          {pkg.currency}{pkg.price}
        </div>
        {pkg.credits && (
  <div className="text-sm text-cyan-400 mt-1">
    <i className="fas fa-coins mr-1"></i>
    {pkg.credits === 'unlimited' ? t("adminConsole.packages.unlimited", { defaultValue: "Unlimited" }) : t("adminConsole.packages.creditsCount", { count: pkg.credits, defaultValue: "{{count}} credits" })}
  </div>
)}
      </div>

      {pkg.features && pkg.features.length > 0 && (
        <div className="mb-4 space-y-2">
          {pkg.features.slice(0, 4).map((feature, idx) => (
            <div key={idx} className="flex items-start text-sm text-gray-300">
              <i className="fas fa-check text-green-400 mr-2 mt-1"></i>
              <span>{feature}</span>
            </div>
          ))}
          {pkg.features.length > 4 && (
            <div className="text-xs text-gray-500">
              {t("adminConsole.packages.moreFeatures", { count: pkg.features.length - 4, defaultValue: "+{{count}} more features" })}
            </div>
          )}
        </div>
      )}

      <div className="flex space-x-2 mt-6">
        <button
          className="flex-1 action-btn btn-primary"
          onClick={() => onEdit(pkg)}
        >
          <i className="fas fa-edit mr-2"></i>
          {t("adminConsole.packages.edit", { defaultValue: "Edit" })}
        </button>
        <button
          className="action-btn btn-secondary px-4"
          onClick={() => onDelete(pkg)}
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );
}


