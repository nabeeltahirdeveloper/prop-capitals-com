
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { markNotificationAsRead, getUserNotifications } from '@/api/notifications';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  User,
  Settings,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Users,
  FileText,
  CreditCard,
  BarChart3,
  Shield,
  HelpCircle,
  Home,
  Award,
  Zap,
  Server,
  Activity,
  Target,
  Check,
  Calendar,
  PieChart,
  Columns3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useTranslation } from '../contexts/LanguageContext';
import { translateNotification } from '../utils/notificationTranslations';

export default function Layout({ children, currentPageName }) {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Full-screen pages with no layout at all
  const noLayoutPages = ['SignIn', 'SignUp'];
  const isNoLayoutPage = noLayoutPages.includes(currentPageName);

  // Public pages that don't need authentication
  const publicPages = ['Home', 'Challenges', 'HowItWorks', 'Payouts', 'FAQ', 'Contact', 'Terms', 'Privacy', 'Rules', 'BuyChallenge', 'ScalingPlan'];
  const isPublicPage = publicPages.includes(currentPageName);

  // Get auth status from AuthContext
  const { status, user: authUser, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  // Map auth user to local user state for compatibility
  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.userId,
        email: authUser.email,
        role: authUser.role?.toLowerCase() || 'trader',
        full_name: authUser.profile?.firstName || authUser.full_name || null,
      });
    } else {
      setUser(null);
    }
  }, [authUser]);

  // Use authUser as currentUser for consistency
  const currentUser = authUser;

  // Get all notifications (shared cache with other components)
  const { data: allNotificationsData = [] } = useQuery({
    queryKey: ['notifications', currentUser?.userId],
    queryFn: async () => {
      if (!currentUser?.userId) return [];
      try {
        return await getUserNotifications(currentUser.userId);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        return [];
      }
    },
    enabled: !!currentUser?.userId,
    retry: false,
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onSuccess: (_, id) => {
      // Optimistically update the cache - mark notification as read
      queryClient.setQueryData(['notifications', currentUser?.userId], (oldData = []) => {
        return oldData.map(n => n.id === id ? { ...n, read: true } : n);
      });
      // Invalidate and refetch to ensure consistency with backend
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.userId] });
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
      // Revert optimistic update on error by invalidating cache
      queryClient.invalidateQueries({ queryKey: ['notifications', currentUser?.userId] });
    },
  });

  // Filter to show only unread notifications in header (limit to 5)
  const notifications = (allNotificationsData || [])
    .filter(n => !n.read)
    .slice(0, 5)
    .map(n => {
      const translated = translateNotification(n.title, n.body, t);
      return {
        id: n.id,
        title: translated.title,
        message: translated.message,
      };
    });

  // Determine if current page is an admin page
  const adminPages = ['AdminDashboard', 'AdminUsers', 'AdminChallenges', 'AdminAccounts', 'AdminPayments', 'AdminPayouts', 'AdminViolations', 'AdminCoupons', 'AdminSupport', 'AdminSettings', 'AdminBrokerServers', 'AdminRiskMonitor', 'AdminScaling', 'AdminProfile', 'CRMLeads', 'CRMPipeline', 'CRMFTDReport', 'CRMCalendar'];
  const isAdminPage = adminPages.includes(currentPageName);

  // Show admin menu only if user is admin AND on admin pages
  const showAdminMenu = isAdmin && isAdminPage;

  const traderNavItems = useMemo(() => [
    { name: t('nav.dashboard'), icon: LayoutDashboard, page: 'TraderDashboard' },
    { name: t('nav.tradingTerminal'), icon: Activity, page: 'TradingTerminal' },
    { name: t('nav.buyChallenge'), icon: Award, page: 'TraderBuyChallenge' },
    { name: t('nav.myAccounts'), icon: TrendingUp, page: 'MyAccounts' },
    { name: t('nav.accountDetails'), icon: FileText, page: 'AccountDetails' },
    { name: t('nav.challengeProgress'), icon: Target, page: 'ChallengeProgress' },
    { name: t('nav.ruleCompliance'), icon: Shield, page: 'RuleCompliance' },
    { name: t('nav.tradeHistory'), icon: FileText, page: 'TradeHistory' },
    { name: t('nav.analytics'), icon: BarChart3, page: 'Analytics' },
    { name: t('nav.payouts'), icon: Wallet, page: 'TraderPayouts' },
    { name: t('nav.notifications'), icon: Bell, page: 'Notifications' },
    { name: t('nav.profile'), icon: User, page: 'Profile' },
    { name: t('nav.support'), icon: HelpCircle, page: 'Support' },
  ], [t]);

  const adminNavItems = useMemo(() => [
    { name: t('nav.overview'), icon: LayoutDashboard, page: 'AdminDashboard' },
    { name: t('nav.users'), icon: Users, page: 'AdminUsers' },
    { name: t('nav.challenges'), icon: Award, page: 'AdminChallenges' },
    { name: t('nav.accounts'), icon: TrendingUp, page: 'AdminAccounts' },
    { name: t('nav.riskMonitor'), icon: Activity, page: 'AdminRiskMonitor' },
    { name: t('nav.brokerServers'), icon: Server, page: 'AdminBrokerServers' },
    { name: t('nav.scaling'), icon: Zap, page: 'AdminScaling' },
    { name: t('nav.payments'), icon: CreditCard, page: 'AdminPayments' },
    { name: t('nav.payouts'), icon: Wallet, page: 'AdminPayouts' },
    { name: t('nav.coupons'), icon: Zap, page: 'AdminCoupons' },
    {
      name: 'CRM',
      icon: Users,
      children: [
        { name: 'Leads', icon: Users, page: 'CRMLeads' },
        { name: 'Pipeline', icon: Columns3, page: 'CRMPipeline' },
        { name: 'FTD Report', icon: PieChart, page: 'CRMFTDReport' },
        { name: 'Calendar', icon: Calendar, page: 'CRMCalendar' },
      ]
    },
    { name: t('nav.violations'), icon: Shield, page: 'AdminViolations' },
    { name: t('nav.support'), icon: HelpCircle, page: 'AdminSupport' },
    { name: t('nav.settings'), icon: Settings, page: 'AdminSettings' },
    { name: t('nav.profile'), icon: User, page: 'AdminProfile' },
  ], [t]);

  const navItems = useMemo(() => showAdminMenu ? adminNavItems : traderNavItems, [showAdminMenu, adminNavItems, traderNavItems]);

  // Auto-open submenu if a child is active - only run once when the current page changes
  useEffect(() => {
    let activeSubmenu = null;
    navItems.forEach(item => {
      if (item.children && item.children.some(child => child.page === currentPageName)) {
        activeSubmenu = item.name;
      }
    });

    if (activeSubmenu) {
      setOpenSubmenu(activeSubmenu);
    }
  }, [currentPageName]); // Only trigger when navigating to a new page

  // Return early for SignIn/SignUp pages (no layout)
  if (isNoLayoutPage) {
    return <>{children}</>;
  }

  // For protected pages, don't render layout until authenticated
  // This prevents protected UI from flashing when not logged in
  const isProtectedPage = !isPublicPage && !isNoLayoutPage;
  if (isProtectedPage && status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // If on protected page but not authenticated, don't render layout
  // (ProtectedRoute will handle redirect)
  if (isProtectedPage && status !== 'authenticated') {
    return <>{children}</>;
  }

  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Public Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <Link to={createPageUrl('Home')} className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-white">Prop Capitals</span>
              </Link>

              {/* Desktop Nav */}
              <div className="hidden md:flex items-center gap-6 lg:gap-8">
                <Link to={createPageUrl('Home')} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t('nav.home')}
                </Link>
                <Link to={createPageUrl('Challenges')} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t('nav.challenges')}
                </Link>
                <Link to={createPageUrl('HowItWorks')} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t('nav.howItWorks')}
                </Link>
                <Link to={createPageUrl('ScalingPlan')} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t('nav.scaling')}
                </Link>
                <Link to={createPageUrl('Rules')} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t('nav.rules')}
                </Link>
                <Link to={createPageUrl('FAQ')} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t('nav.faq')}
                </Link>
                <Link to={createPageUrl('Contact')} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t('nav.contact')}
                </Link>
              </div>

              {/* Right side buttons */}
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:block">
                  <LanguageSwitcher />
                </div>
                {currentUser ? (
                  <Link to={createPageUrl((currentUser.role === 'ADMIN' || currentUser.role === 'admin') ? 'AdminDashboard' : 'TraderDashboard')}>
                    <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs sm:text-sm px-3 sm:px-4">
                      {t('nav.dashboard')}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to={createPageUrl('SignIn')} className="hidden sm:block">
                      <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white text-xs sm:text-sm">
                        {t('nav.login')}
                      </Button>
                    </Link>
                    <Link to={createPageUrl('SignUp')}>
                      <Button size="sm" className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs sm:text-sm px-3 sm:px-4">
                        {t('nav.getStarted')}
                      </Button>
                    </Link>
                  </>
                )}
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="md:hidden text-slate-400 hover:text-white p-2"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation Menu */}
        {sidebarOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/50 z-50 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Mobile Menu */}
            <div className="fixed top-0 right-0 bottom-0 w-72 bg-slate-900 z-50 md:hidden transform transition-transform duration-300 ease-in-out overflow-y-auto">
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                  <Link to={createPageUrl('Home')} className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">Prop Capitals</span>
                  </Link>
                  <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                  <Link
                    to={createPageUrl('Home')}
                    className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    {t('nav.home')}
                  </Link>
                  <Link
                    to={createPageUrl('Challenges')}
                    className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    {t('nav.challenges')}
                  </Link>
                  <Link
                    to={createPageUrl('HowItWorks')}
                    className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    {t('nav.howItWorks')}
                  </Link>
                  <Link
                    to={createPageUrl('ScalingPlan')}
                    className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    {t('nav.scaling')}
                  </Link>
                  <Link
                    to={createPageUrl('Rules')}
                    className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    {t('nav.rules')}
                  </Link>
                  <Link
                    to={createPageUrl('FAQ')}
                    className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    {t('nav.faq')}
                  </Link>
                  <Link
                    to={createPageUrl('Contact')}
                    className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    onClick={() => setSidebarOpen(false)}
                  >
                    {t('nav.contact')}
                  </Link>
                </nav>

                {/* Mobile Menu Footer */}
                <div className="p-4 border-t border-slate-800 space-y-3">
                  <div className="mb-3">
                    <LanguageSwitcher />
                  </div>
                  {!currentUser && (
                    <Link to={createPageUrl('SignIn')} onClick={() => setSidebarOpen(false)}>
                      <Button variant="outline" className="w-full border-slate-700 text-white">
                        {t('nav.login')}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <main className="pt-16">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex w-full overflow-x-hidden">
      <style>{`
        :root {
          --primary: 160 84% 39%;
          --primary-foreground: 0 0% 100%;
        }
      `}</style>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Prop Capitals</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {showAdminMenu && (
              <div className="mb-4 px-3">
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">{t('nav.adminPanel')}</Badge>
              </div>
            )}
            {navItems.map((item, index) => {
              // Handle divider type for section labels
              if (item.type === 'divider') {
                return (
                  <div key={`divider-${index}`} className="pt-4 pb-2 px-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{item.label}</span>
                  </div>
                );
              }

              if (item.children) {
                const isSubmenuOpen = openSubmenu === item.name;
                const isAnyChildActive = item.children.some(child => child.page === currentPageName);

                return (
                  <div key={`submenu-${item.name}`} className="space-y-1">
                    <button
                      onClick={() => setOpenSubmenu(isSubmenuOpen ? null : item.name)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all ${isAnyChildActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`w-5 h-5 ${isAnyChildActive ? 'text-emerald-400' : ''}`} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 transition-transform ${isSubmenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isSubmenuOpen && (
                      <div className="pl-4 ml-2 border-l border-slate-800 space-y-1 mt-1">
                        {item.children.map((child) => {
                          const isChildActive = currentPageName === child.page;
                          return (
                            <Link
                              key={child.page}
                              to={createPageUrl(child.page)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${isChildActive
                                ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white'
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                }`}
                            >
                              <child.icon className={`w-4 h-4 ${isChildActive ? 'text-emerald-400' : ''}`} />
                              <span className="text-sm font-medium">{child.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = currentPageName === item.page;
              const handleClick = (e) => {
                // Force navigation even if on TradingTerminal
                if (currentPageName === 'TradingTerminal' && item.page !== 'TradingTerminal') {
                  e.preventDefault();
                  e.stopPropagation();
                  // Use window.location for hard navigation to force page reload
                  window.location.href = createPageUrl(item.page);
                }
              };
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={handleClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${isActive
                    ? 'bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : ''}`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold">
                {currentUser?.profile?.firstName?.[0] || currentUser?.email?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{currentUser?.profile?.firstName || t('nav.user')}</p>
                <p className="text-xs text-slate-400 truncate">{currentUser?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-slate-400 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <LanguageSwitcher />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-white">
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-slate-900 border-slate-800">
                <div className="p-4 border-b border-slate-800">
                  <h3 className="font-semibold text-white">{t('notifications.title')}</h3>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">{t('notifications.noNewNotifications')}</div>
                ) : (
                  notifications.map((notif) => (
                    <DropdownMenuItem
                      key={notif.id}
                      className="p-4 cursor-pointer focus:bg-slate-800"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <div className="flex items-start justify-between gap-3 w-full">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white">{notif.title}</p>
                          <p className="text-sm text-slate-400">{notif.message}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-slate-400 hover:text-white flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsReadMutation.mutate(notif.id);
                          }}
                          title={t('notifications.markAsRead')}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-slate-300 hover:text-white">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                    {currentUser?.profile?.firstName?.[0] || currentUser?.email?.[0] || 'U'}
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
                <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-800 text-slate-300">
                  <Link
                    to={createPageUrl(isAdmin ? 'AdminProfile' : 'Profile')}
                    className="flex items-center gap-2"
                    onClick={(e) => {
                      // Force navigation even if on TradingTerminal
                      if (currentPageName === 'TradingTerminal') {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = createPageUrl(isAdmin ? 'AdminProfile' : 'Profile');
                      }
                    }}
                  >
                    <User className="w-4 h-4" />
                    {t('nav.profile')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer focus:bg-slate-800 text-slate-300">
                  <Link
                    to={createPageUrl('Home')}
                    className="flex items-center gap-2"
                    onClick={(e) => {
                      // Force navigation even if on TradingTerminal
                      if (currentPageName === 'TradingTerminal') {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = createPageUrl('Home');
                      }
                    }}
                  >
                    <Home className="w-4 h-4" />
                    {t('nav.website')}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-800" />
                <DropdownMenuItem
                  className="cursor-pointer focus:bg-slate-800 text-red-400"
                  onClick={() => {
                    localStorage.removeItem('token');
                    window.location.href = createPageUrl('SignIn');
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t('nav.logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 lg:p-8 bg-slate-950 min-h-screen">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
