import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  LineChart,
  ShoppingCart,
  Calendar,
  Wallet,
  Settings,
  HelpCircle,
  ArrowLeft,
  Bell,
  RefreshCw,
  ChevronDown,
  Zap,
  Globe,
  User,
  FileText,
  MessageSquare
} from 'lucide-react';

const TraderPanelLayout = () => {
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const mainNavItems = [
    { path: '/traderdashboard', icon: LayoutDashboard, label: 'Account Overview', exact: true },
    { path: '/traderdashboard/trading', icon: LineChart, label: 'Trading Terminal' },
    { path: '/traderdashboard/orders', icon: ShoppingCart, label: 'Orders' },
    { path: '/traderdashboard/calendar', icon: Calendar, label: 'Economic Calendar' },
    { path: '/traderdashboard/payouts', icon: Wallet, label: 'Payout History' },
  ];

  const settingsNavItems = [
    { path: '/traderdashboard/settings', icon: Settings, label: 'Account Settings' },
    { path: '/traderdashboard/profile', icon: User, label: 'Profile' },
  ];

  const supportNavItems = [
    { path: '/traderdashboard/support', icon: MessageSquare, label: 'Support' },
    { path: '/traderdashboard/faqs', icon: HelpCircle, label: 'FAQ' },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-[#0a0d12] flex">
      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full bg-[#12161d] border-r border-white/5 z-40 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/5">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-[#0a0d12] font-black text-sm">
              PC
            </div>
            {!sidebarCollapsed && (
              <span className="text-white font-bold text-lg">PROP<span className="text-amber-500">CAPITALS</span></span>
            )}
          </Link>
        </div>

        {/* Start Trading Button */}
        <div className="p-4">
          <Link
            to="/traderdashboard/trading"
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all"
          >
            <Zap className="w-5 h-5" />
            {!sidebarCollapsed && <span>Start Trading</span>}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-2">
          {/* Main Navigation */}
          <div className="mb-6">
            <p className={`text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 px-3 ${sidebarCollapsed ? 'hidden' : ''}`}>
              Trades
            </p>
            {mainNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${isActive(item.path, item.exact)
                  ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            ))}
          </div>

          {/* Account Settings */}
          <div className="mb-6">
            <p className={`text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 px-3 ${sidebarCollapsed ? 'hidden' : ''}`}>
              Account Settings
            </p>
            {settingsNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${isActive(item.path)
                  ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            ))}
          </div>

          {/* Support */}
          <div className="mb-6">
            <p className={`text-gray-500 text-xs font-semibold uppercase tracking-wider mb-2 px-3 ${sidebarCollapsed ? 'hidden' : ''}`}>
              Support
            </p>
            {supportNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${isActive(item.path)
                  ? 'bg-amber-500/10 text-amber-500 border-l-2 border-amber-500'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </Link>
            ))}
          </div>
        </nav>

        {/* Bottom Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all mb-2"
          >
            <ArrowLeft className="w-5 h-5" />
            {!sidebarCollapsed && <span className="text-sm font-medium">Back to Website</span>}
          </Link>

          <div className="flex items-center gap-3 px-3 py-2.5">
            <Globe className="w-5 h-5 text-gray-400" />
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <span>English</span>
                <ChevronDown className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
        {/* Top Header */}
        <header className="h-16 bg-[#12161d] border-b border-white/5 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-white font-bold text-xl">Account #5214</h1>
            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-xs font-medium rounded">Active</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-gray-500 text-sm">Last Updated: {new Date().toLocaleString()}</span>
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all relative">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-[10px] font-bold text-[#0a0d12] rounded-full flex items-center justify-center">3</span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
              <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-[#0a0d12] font-bold text-sm">
                J
              </div>
              <div className="hidden sm:block">
                <p className="text-white text-sm font-medium">John Doe</p>
                <p className="text-gray-500 text-xs">Demo Account</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default TraderPanelLayout;
