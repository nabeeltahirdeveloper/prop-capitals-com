import React, { useState, useEffect } from 'react';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminSidebar({ activeSection, onSectionChange, isOpen, onClose }) {
  const [expandedCategories, setExpandedCategories] = useState({});
  const { user, logout } = useAuth();

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
      color: 'text-purple-400' 
    },
    {
      id: 'orders-transactions',
      icon: 'fa-shopping-cart',
      label: 'Orders & Transactions',
      color: 'text-cyan-400',
      items: [
        { id: 'orders', icon: 'fa-shopping-cart', label: 'Orders', color: 'text-cyan-400' },
        { id: 'transactions', icon: 'fa-list', label: 'All Transactions', color: 'text-green-400' },
        { id: 'payouts', icon: 'fa-dollar-sign', label: 'Payouts', color: 'text-emerald-400' },
        { id: 'direct-purchase-links', icon: 'fa-link', label: 'Direct Purchase Links', color: 'text-orange-400' },
        { id: 'packages', icon: 'fa-box', label: 'Packages', color: 'text-pink-400' },
        { id: 'brands-unpaid-transactions', icon: 'fa-exclamation-triangle', label: 'Brands For Payouts', color: 'text-red-400' },
      ]
    },
    {
      id: 'users-brands',
      icon: 'fa-users',
      label: 'Users & Brands',
      color: 'text-orange-400',
      items: [
        { id: 'users', icon: 'fa-users', label: 'Users', color: 'text-orange-400' },
        { id: 'brands', icon: 'fa-building', label: 'Brands Management', color: 'text-yellow-400' },
        { id: 'pending-brands', icon: 'fa-clock', label: 'Pending Brands', color: 'text-yellow-300' },
        { id: 'brand-wallets', icon: 'fa-wallet', label: 'Brand Wallets', color: 'text-amber-400' },
      ]
    },
    {
      id: 'traffic-security',
      icon: 'fa-shield-alt',
      label: 'Traffic & Security',
      color: 'text-red-400',
      items: [
        { id: 'visits', icon: 'fa-eye', label: 'Visits', color: 'text-blue-400' },
        { id: 'blocked-ips', icon: 'fa-ban', label: 'Blocked IPs', color: 'text-red-500' },
        { id: 'ip-whitelist', icon: 'fa-shield-alt', label: 'Access Control', color: 'text-red-400' },
      ]
    },
    {
      id: 'currencies-geo',
      icon: 'fa-globe-americas',
      label: 'Currencies & Geo Settings',
      color: 'text-teal-400',
      items: [
        { id: 'currencies', icon: 'fa-money-bill', label: 'Currencies', color: 'text-teal-400' },
        { id: 'currency-geo', icon: 'fa-globe-americas', label: 'Currency Geo Mapping', color: 'text-lime-400' },
       // { id: 'payment-gateway-geo', icon: 'fa-credit-card', label: 'Geolocation Payment Gateway', color: 'text-cyan-400' },
      ]
    },
    {
      id: 'logs-monitoring',
      icon: 'fa-chart-line',
      label: 'Logs & System Monitoring',
      color: 'text-violet-400',
      items: [
        { id: 'logs', icon: 'fa-file-alt', label: 'System Logs', color: 'text-violet-400' },
        { id: 'bot-logs', icon: 'fa-robot', label: 'Bot Logs', color: 'text-cyan-400' },
        { id: 'analytics', icon: 'fa-chart-bar', label: 'Analytics', color: 'text-indigo-400' },
        { id: 'system-tools', icon: 'fa-wrench', label: 'System Tools', color: 'text-rose-400' },
        { id: 'settings', icon: 'fa-cog', label: 'Settings', color: 'text-gray-400' },
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
              <p className="text-xs text-gray-400 mono">Admin Console</p>
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
                    <span>{category.label}</span>
                  </div>
                ) : (
                  /* Category with sub-items */
                  <>
                    <div
                      className={`nav-item nav-category p-3 cursor-pointer ${isCategoryActive(category) ? 'category-active' : ''}`}
                      onClick={() => toggleCategory(category.id)}
                    >
                      <i className={`fas ${category.icon} mr-3 ${category.color}`}></i>
                      <span>{category.label}</span>
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
                            <span>{item.label}</span>
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
            <p className="text-sm font-medium">{user?.profile?.firstName || user?.email?.split('@')[0] || 'Admin User'}</p>
            <p className="text-xs text-gray-400">{user?.email || ''}</p>
            <button
              onClick={handleBackToAdmin}
              className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <i className="fas fa-arrow-left"></i>
              <span>Back to Admin Panel</span>
            </button>
            <button
              onClick={handleLogout}
              className="mt-2 w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              <i className="fas fa-sign-out-alt"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
