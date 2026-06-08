import { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

export default function AdminSidebar({ activeSection, onSectionChange, isOpen, onClose }) {
  const [expandedCategories, setExpandedCategories] = useState({});
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      localStorage.removeItem('token');
      sessionStorage.clear();
      window.location.href = createPageUrl('SignIn');
    }
  };

  const handleBackToAdmin = () => {
    window.location.href = createPageUrl('AdminDashboard');
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const menuCategories = [
    {
      id: 'dashboard',
      icon: 'fa-tachometer-alt',
      label: 'Dashboard',
      i18nKey: 'nav.dashboard',
      color: 'text-purple-400'
    },
    {
      id: 'orders-transactions',
      icon: 'fa-shopping-cart',
      label: 'Orders & Transactions',
      i18nKey: 'nav.ordersTransactions',
      color: 'text-cyan-400',
      items: [
        { id: 'orders', icon: 'fa-shopping-cart', label: 'Orders', i18nKey: 'nav.orders', color: 'text-cyan-400' },
        { id: 'transactions', icon: 'fa-list', label: 'All Transactions', i18nKey: 'nav.allTransactions', color: 'text-green-400' },
        { id: 'payouts', icon: 'fa-dollar-sign', label: 'Payouts', i18nKey: 'nav.payouts', color: 'text-emerald-400' },
        { id: 'direct-purchase-links', icon: 'fa-link', label: 'Direct Purchase Links', i18nKey: 'nav.directPurchaseLinks', color: 'text-orange-400' },
        { id: 'quick-links', icon: 'fa-bolt', label: 'Quick Links', i18nKey: 'nav.quickLinks', color: 'text-amber-400' },
        { id: 'packages', icon: 'fa-box', label: 'Packages', i18nKey: 'nav.packages', color: 'text-pink-400' },
        { id: 'brands-unpaid-transactions', icon: 'fa-exclamation-triangle', label: 'Brands For Payouts', i18nKey: 'nav.brandsForPayouts', color: 'text-red-400' },
      ]
    },
    {
      id: 'users-brands',
      icon: 'fa-users',
      label: 'Users & Brands',
      i18nKey: 'nav.usersBrands',
      color: 'text-orange-400',
      items: [
        { id: 'users', icon: 'fa-users', label: 'Users', i18nKey: 'nav.users', color: 'text-orange-400' },
        { id: 'brands', icon: 'fa-building', label: 'Brands Management', i18nKey: 'nav.brandsManagement', color: 'text-yellow-400' },
        { id: 'pending-brands', icon: 'fa-clock', label: 'Pending Brands', i18nKey: 'nav.pendingBrands', color: 'text-yellow-300' },
        { id: 'brand-wallets', icon: 'fa-wallet', label: 'Brand Wallets', i18nKey: 'nav.brandWallets', color: 'text-amber-400' },
      ]
    },
    {
      id: 'traffic-security',
      icon: 'fa-shield-alt',
      label: 'Traffic & Security',
      i18nKey: 'nav.trafficSecurity',
      color: 'text-red-400',
      items: [
        { id: 'visits', icon: 'fa-eye', label: 'Visits', i18nKey: 'nav.visits', color: 'text-blue-400' },
        { id: 'blocked-ips', icon: 'fa-ban', label: 'Blocked IPs', i18nKey: 'nav.blockedIps', color: 'text-red-500' },
        { id: 'ip-whitelist', icon: 'fa-shield-alt', label: 'Access Control', i18nKey: 'nav.accessControl', color: 'text-red-400' },
      ]
    },
    {
      id: 'currencies-geo',
      icon: 'fa-globe-americas',
      label: 'Currencies & Geo Settings',
      i18nKey: 'nav.currenciesGeo',
      color: 'text-teal-400',
      items: [
        { id: 'currencies', icon: 'fa-money-bill', label: 'Currencies', i18nKey: 'nav.currencies', color: 'text-teal-400' },
        { id: 'currency-geo', icon: 'fa-globe-americas', label: 'Currency Geo Mapping', i18nKey: 'nav.currencyGeoMapping', color: 'text-lime-400' },
       // { id: 'payment-gateway-geo', icon: 'fa-credit-card', label: 'Geolocation Payment Gateway', color: 'text-cyan-400' },
      ]
    },
    {
      id: 'logs-monitoring',
      icon: 'fa-chart-line',
      label: 'Logs & System Monitoring',
      i18nKey: 'nav.logsMonitoring',
      color: 'text-violet-400',
      items: [
        { id: 'logs', icon: 'fa-file-alt', label: 'System Logs', i18nKey: 'nav.systemLogs', color: 'text-violet-400' },
        { id: 'bot-logs', icon: 'fa-robot', label: 'Bot Logs', i18nKey: 'nav.botLogs', color: 'text-cyan-400' },
        { id: 'analytics', icon: 'fa-chart-bar', label: 'Analytics', i18nKey: 'nav.analytics', color: 'text-indigo-400' },
        { id: 'system-tools', icon: 'fa-wrench', label: 'System Tools', i18nKey: 'nav.systemTools', color: 'text-rose-400' },
        { id: 'settings', icon: 'fa-cog', label: 'Settings', i18nKey: 'nav.settings', color: 'text-gray-400' },
      ]
    },
  ];

  // Check if current activeSection is within a category
  const isCategoryActive = (category) => {
    if (!category.items) return false;
    return category.items.some(item => item.id === activeSection);
  };

  // Auto-expand category when one of its sub-items is active
  useEffect(() => {
    menuCategories.forEach(category => {
      if (category.items && isCategoryActive(category)) {
        setExpandedCategories(prev => ({
          ...prev,
          [category.id]: true
        }));
      }
    });
  }, [activeSection]);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        {/* Header Section - Fixed */}
        <div className="sidebar-header">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-chart-line text-white"></i>
            </div>
            <div>
              <h1 className="text-xl font-bold gradient-text">Prop Capitals</h1>
              <p className="text-xs text-gray-400 mono">{t("nav.adminConsole", { defaultValue: "Admin Console" })}</p>
            </div>
          </div>
        </div>
      
        {/* Navigation Section - Scrollable */}
        <nav className="sidebar-nav">
          <div className="space-y-2">
            {menuCategories.map(category => (
              <div key={category.id}>
                {/* Category without sub-items (Dashboard, Settings) */}
                {!category.items ? (
                  <div
                    className={`nav-item p-3 cursor-pointer ${activeSection === category.id ? 'active' : ''}`}
                    onClick={() => onSectionChange(category.id)}
                  >
                    <i className={`fas ${category.icon} mr-3 ${category.color}`}></i>
                    <span>{t(category.i18nKey, { defaultValue: category.label })}</span>
                  </div>
                ) : (
                  /* Category with sub-items */
                  <>
                    <div
                      className={`nav-item nav-category p-3 cursor-pointer ${isCategoryActive(category) ? 'category-active' : ''}`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <i className={`fas ${category.icon} mr-3 ${category.color}`}></i>
                      <span>{t(category.i18nKey, { defaultValue: category.label })}</span>
                      <i className={`fas fa-chevron-right ml-auto chevron-icon ${expandedCategories[category.id] ? 'expanded' : ''}`}></i>
                    </div>
                    {/* Sub-items */}
                    {expandedCategories[category.id] && (
                      <div className="sub-items">
                        {category.items.map(item => (
                          <div
                            key={item.id}
                            className={`nav-item nav-sub-item p-3 cursor-pointer ${activeSection === item.id ? 'active' : ''}`}
                            onClick={() => onSectionChange(item.id)}
                          >
                            <i className={`fas ${item.icon} mr-3 ${item.color}`}></i>
                            <span>{t(item.i18nKey, { defaultValue: item.label })}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </nav>
      
        {/* Logout Section - Fixed at Bottom */}
        <div className="sidebar-footer">
          <div className="glass-card p-4 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mx-auto mb-2 flex items-center justify-center">
              <i className="fas fa-user text-white"></i>
            </div>
            <p className="text-sm font-medium">{user?.profile?.firstName || user?.email?.split('@')[0] || t("nav.adminUser", { defaultValue: "Admin User" })}</p>
            <p className="text-xs text-gray-400">{user?.email || ''}</p>
            <button
              onClick={handleBackToAdmin}
              className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <i className="fas fa-arrow-left"></i>
              <span>{t("nav.backToAdminPanel", { defaultValue: "Back to Admin Panel" })}</span>
            </button>
            <button
              onClick={handleLogout}
              className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>{t("nav.logout", { defaultValue: "Logout" })}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
