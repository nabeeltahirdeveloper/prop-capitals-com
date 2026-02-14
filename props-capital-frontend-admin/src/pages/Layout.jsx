import React, { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  markNotificationAsRead,
  getUserNotifications,
} from "@/api/notifications";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  User,
  Settings,
  Bell,
  Menu,
  X,
  Briefcase,
  LogOut,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
  UserPlus,
  DollarSign,
  Sun,
  Moon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslation } from "../contexts/LanguageContext";
import { translateNotification } from "../utils/notificationTranslations";
import { useTheme } from "@/contexts/ThemeContext";

export default function Layout({ children, currentPageName }) {
  const { t } = useTranslation();
  const { isDark, toggleTheme } = useTheme();

  // Mobile drawer open/close
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // Desktop collapse (icon-only)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [user, setUser] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Close mobile sidebar on route change (nice UX)
  useEffect(() => {
    setSidebarOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Escape key closes mobile sidebar; body scroll lock when drawer is open
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleEscape = (e) => e.key === "Escape" && setSidebarOpen(false);
    document.addEventListener("keydown", handleEscape);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prev;
    };
  }, [sidebarOpen]);

  // Full-screen pages with no layout (only SignIn for admin panel)
  const noLayoutPages = ["SignIn"];
  const isNoLayoutPage = noLayoutPages.includes(currentPageName);

  // No public pages in admin panel
  const publicPages = [];
  const isPublicPage = publicPages.includes(currentPageName);

  const { status, user: authUser, isAdmin } = useAuth();

  // Map auth user to local user state for compatibility
  useEffect(() => {
    if (authUser) {
      setUser({
        id: authUser.userId,
        email: authUser.email,
        role: authUser.role?.toLowerCase() || "trader",
        full_name: authUser.profile?.firstName || authUser.full_name || null,
      });
    } else {
      setUser(null);
    }
  }, [authUser]);

  const currentUser = authUser;

  // Notifications
  const { data: allNotificationsData = [] } = useQuery({
    queryKey: ["notifications", currentUser?.userId],
    queryFn: async () => {
      if (!currentUser?.userId) return [];
      try {
        return await getUserNotifications(currentUser.userId);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return [];
      }
    },
    enabled: !!currentUser?.userId,
    retry: false,
    refetchInterval: 5000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(
        ["notifications", currentUser?.userId],
        (oldData = []) => oldData.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      queryClient.invalidateQueries({ queryKey: ["notifications", currentUser?.userId] });
    },
    onError: (error) => {
      console.error("Failed to mark notification as read:", error);
      queryClient.invalidateQueries({ queryKey: ["notifications", currentUser?.userId] });
    },
  });

  const unreadNotifications = (allNotificationsData || []).filter(
    (n) => !n.read,
  );

  const unreadCount = unreadNotifications.length;

  const notifications = unreadNotifications.slice(0, 5).map((n) => {
    const translated = translateNotification(n.title, n.body, t);
    return {
      id: n.id,
      title: translated.title,
      message: translated.message,
    };
  });

  // Admin pages detection
  const adminPages = [
    "AdminDashboard",
    "AdminUsers",
    "AdminChallenges",
    "AdminAccounts",
    "AdminPayments",
    "AdminPayouts",
    "AdminViolations",
    "AdminCoupons",
    "AdminSupport",
    "AdminSettings",
    "AdminBrokerServers",
    "AdminRiskMonitor",
    "AdminScaling",
    "AdminProfile",
    "CRMLeads",
    "CRMPipeline",
    "CRMFTDReport",
    "CRMCalendar",
  ];
  const isAdminPage = adminPages.includes(currentPageName);
  const showAdminMenu = isAdmin && isAdminPage;

  const traderNavItems = useMemo(
    () => [
      { name: t("nav.dashboard"), icon: LayoutDashboard, page: "TraderDashboard" },
      { name: t("nav.tradingTerminal"), icon: Activity, page: "TradingTerminal" },
      { name: t("nav.buyChallenge"), icon: Award, page: "TraderBuyChallenge" },
      { name: t("nav.myAccounts"), icon: TrendingUp, page: "MyAccounts" },
      { name: t("nav.accountDetails"), icon: FileText, page: "AccountDetails" },
      { name: t("nav.challengeProgress"), icon: Target, page: "ChallengeProgress" },
      { name: t("nav.ruleCompliance"), icon: Shield, page: "RuleCompliance" },
      { name: t("nav.tradeHistory"), icon: FileText, page: "TradeHistory" },
      { name: t("nav.analytics"), icon: BarChart3, page: "Analytics" },
      { name: t("nav.payouts"), icon: Wallet, page: "TraderPayouts" },
      { name: t("nav.notifications"), icon: Bell, page: "Notifications" },
      { name: t("nav.profile"), icon: User, page: "Profile" },
      { name: t("nav.support"), icon: HelpCircle, page: "Support" },
    ],
    [t],
  );

  const adminNavItems = useMemo(
    () => [
      { name: t("nav.overview"), icon: LayoutDashboard, page: "AdminDashboard" },
      { name: t("nav.users"), icon: Users, page: "AdminUsers" },
      { name: t("nav.challenges"), icon: Award, page: "AdminChallenges" },
      { name: t("nav.accounts"), icon: TrendingUp, page: "AdminAccounts" },
      { name: t("nav.riskMonitor"), icon: Activity, page: "AdminRiskMonitor" },
      { name: t("nav.brokerServers"), icon: Server, page: "AdminBrokerServers" },
      { name: t("nav.scaling"), icon: Zap, page: "AdminScaling" },
      { name: t("nav.payments"), icon: CreditCard, page: "AdminPayments" },
      { name: t("nav.payouts"), icon: Wallet, page: "AdminPayouts" },
      {
        name: "CRM",
        icon: Briefcase,
        children: [
          { name: "CRM Leads", page: "CRMLeads" },
          { name: "Pipeline", page: "CRMPipeline" },
          { name: "FTD Report", page: "CRMFTDReport" },
          { name: "Calendar", page: "CRMCalendar" },
        ],
      },
      { name: t("nav.coupons"), icon: Zap, page: "AdminCoupons" },
      { name: t("nav.violations"), icon: Shield, page: "AdminViolations" },
      { name: t("nav.support"), icon: HelpCircle, page: "AdminSupport" },
      { name: t("nav.settings"), icon: Settings, page: "AdminSettings" },
      { name: t("nav.profile"), icon: User, page: "AdminProfile" },
    ],
    [t],
  );

  const navItems = useMemo(
    () => (showAdminMenu ? adminNavItems : traderNavItems),
    [showAdminMenu, adminNavItems, traderNavItems],
  );

  // Auto-open submenu if a child is active (only meaningful when you actually have item.children)
  useEffect(() => {
    let activeSubmenu = null;
    navItems.forEach((item) => {
      if (item.children && item.children.some((child) => child.page === currentPageName)) {
        activeSubmenu = item.name;
      }
    });
    if (activeSubmenu) setOpenSubmenu(activeSubmenu);
  }, [currentPageName, navItems]);

  // Early returns
  if (isNoLayoutPage) return <>{children}</>;

  const isProtectedPage = !isPublicPage && !isNoLayoutPage;
  if (isProtectedPage && status === "checking") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">{t("common.loading")}</p>
        </div>
      </div>
    );
  }
  if (isProtectedPage && status !== "authenticated") return <>{children}</>;

  // Public pages layout
  if (isPublicPage) {
    return (
      <div className="min-h-screen bg-slate-950">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link to={createPageUrl("Home")} className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="text-lg sm:text-xl font-bold text-white">Prop Capitals</span>
              </Link>

              {/* Desktop nav should start from lg+, but hide on XL screens */}
              <div className="hidden lg:flex xl:hidden items-center gap-6 lg:gap-8">
                <Link to={createPageUrl("Home")} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t("nav.home")}
                </Link>
                <Link to={createPageUrl("Challenges")} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t("nav.challenges")}
                </Link>
                <Link to={createPageUrl("HowItWorks")} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t("nav.howItWorks")}
                </Link>
                <Link to={createPageUrl("ScalingPlan")} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t("nav.scaling")}
                </Link>
                <Link to={createPageUrl("Rules")} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t("nav.rules")}
                </Link>
                <Link to={createPageUrl("FAQ")} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t("nav.faq")}
                </Link>
                <Link to={createPageUrl("Contact")} className="text-sm lg:text-base text-slate-300 hover:text-white transition-colors">
                  {t("nav.contact")}
                </Link>
              </div>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:block">
                  <LanguageSwitcher />
                </div>

                {currentUser ? (
                  <Link
                    to={createPageUrl(
                      currentUser.role === "ADMIN" || currentUser.role === "admin"
                        ? "AdminDashboard"
                        : "TraderDashboard",
                    )}
                  >
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs sm:text-sm px-3 sm:px-4"
                    >
                      {t("nav.dashboard")}
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link to={createPageUrl("SignIn")} className="hidden sm:block">
                      <Button variant="ghost" size="sm" className="text-slate-300 hover:text-black text-xs sm:text-sm">
                        {t("nav.login")}
                      </Button>
                    </Link>
                    <Link to={createPageUrl("SignUp")}>
                      <Button
                        size="sm"
                        className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white text-xs sm:text-sm px-3 sm:px-4"
                      >
                        {t("nav.getStarted")}
                      </Button>
                    </Link>
                  </>
                )}

                <button
                  onClick={() => setSidebarOpen(true)}
                  className=" text-slate-400 hover:text-white p-2"
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {sidebarOpen && (
          <>
            <div className="fixed inset-0 bg-black/50 z-50 " onClick={() => setSidebarOpen(false)} />
            <div className="fixed top-0 right-0 bottom-0 w-72 bg-slate-900 z-50  overflow-y-auto">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                  <Link to={createPageUrl("Home")} className="flex items-center gap-2" onClick={() => setSidebarOpen(false)}>
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white">Prop Capitals</span>
                  </Link>
                  <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2">
                  {[
                    ["Home", t("nav.home")],
                    ["Challenges", t("nav.challenges")],
                    ["HowItWorks", t("nav.howItWorks")],
                    ["ScalingPlan", t("nav.scaling")],
                    ["Rules", t("nav.rules")],
                    ["FAQ", t("nav.faq")],
                    ["Contact", t("nav.contact")],
                  ].map(([page, label]) => (
                    <Link
                      key={page}
                      to={createPageUrl(page)}
                      className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      onClick={() => setSidebarOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                </nav>

                <div className="p-4 border-t border-slate-800 space-y-3">
                  <div className="mb-3">
                    <LanguageSwitcher />
                  </div>
                  {!currentUser && (
                    <Link to={createPageUrl("SignIn")} onClick={() => setSidebarOpen(false)}>
                      <Button variant="outline" className="w-full border-slate-700 text-black">
                        {t("nav.login")}
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        <main className="pt-16">{children}</main>
      </div>
    );
  }

  // Protected layout (responsive + collapsible sidebar)
  return (
    <div className="min-h-screen bg-background flex w-full overflow-x-hidden">

      {/* Sidebar — group for hover-to-show toggle */}
      <aside
        className={`group fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transform transition-[width,transform] duration-300 ease-in-out
        ${sidebarCollapsed ? "w-20" : "w-64"}
        lg:translate-x-0
        ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        <div className="flex flex-col h-full relative">
          {/* Desktop: collapse toggle — always visible; vertically centered */}
          <button
            type="button"
            onClick={() => setSidebarCollapsed((v) => !v)}
            className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-[60] h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:bg-amber-50 hover:text-[#d97706] hover:border-[#d97706] shadow-sm transition-all duration-200 focus:outline-none"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 font-bold" />
            ) : (
              <ChevronLeft className="w-5 h-5 font-bold" />
            )}
          </button>

          {/* Logo + controls */}
          <div className={`flex items-center justify-between h-16 shrink-0 border-b border-sidebar-border transition-all ${sidebarCollapsed ? "px-2" : "px-4"}`}>
            <Link
              to={createPageUrl("AdminDashboard")}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center min-w-0 transition-all ${sidebarCollapsed ? "justify-center" : "gap-2"}`}
              title="Admin Dashboard"
            >
                <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center text-[#0a0d12] font-black">
                  PC
                </div>
              {!sidebarCollapsed && (
                <span className="text-xl font-bold truncate text-sidebar-foreground">
                  PROP<span className="text-amber-500">CAPITALS</span>
                </span>
              )}
            </Link>

            {/* Mobile: close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden transition-all ${sidebarCollapsed ? "px-2" : "px-4"}`}>
            {showAdminMenu && !sidebarCollapsed && (
              <div className="mb-4 px-2">
                <Badge className="bg-amber-500/20 text-black-400 border-amber-500/30">
                  {t("nav.adminPanel")}
                </Badge>
              </div>
            )}

            {navItems.map((item, index) => {
              if (item.type === "divider") {
                if (sidebarCollapsed) return null;
                return (
                  <div key={`divider-${index}`} className="pt-4 pb-2 px-3">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {item.label}
                    </span>
                  </div>
                );
              }

              if (item.children) {
                const isSubmenuOpen = openSubmenu === item.name;
                const isAnyChildActive = item.children.some((child) => child.page === currentPageName);

                return (
                  <div key={`submenu-${item.name}`} className="space-y-1">
                    <button
                      onClick={() => {
                        // If collapsed, don't open submenu (or you can auto-expand instead)
                        if (sidebarCollapsed) {
                          setSidebarCollapsed(false);
                          setOpenSubmenu(item.name);
                          return;
                        }
                        setOpenSubmenu(isSubmenuOpen ? null : item.name);
                      }}
                      className={`w-full flex items-center justify-between transition-all ${sidebarCollapsed ? "px-2 justify-center" : "px-3"} py-2.5 rounded-xl ${
                        isAnyChildActive
                          ? "bg-amber-500/10 text-foreground border border-amber-500/40"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }
                        }`}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <div className={`flex items-center transition-all ${sidebarCollapsed ? "justify-center" : "gap-3"}`}>
                        <item.icon className={`w-5 h-5 shrink-0 ${isAnyChildActive ? "text-amber-500" : ""}`} />
                        {!sidebarCollapsed && <span className="font-medium truncate">{item.name}</span>}
                      </div>

                      {!sidebarCollapsed && (
                        <ChevronDown
                          className={`w-4 h-4 shrink-0 transition-transform ${isSubmenuOpen ? "rotate-180" : ""}`}
                        />
                      )}
                    </button>

                    {!sidebarCollapsed && isSubmenuOpen && (
                      <div className="pl-4 ml-2 space-y-1 mt-1">
                        {item.children.map((child) => {
                          const isChildActive = currentPageName === child.page;
                          return (
                            <Link
                              key={child.page}
                              to={createPageUrl(child.page)}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                                isChildActive
                                  ? "bg-amber-500/10 text-foreground border border-amber-500/40"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                              }`}
                            >
                              {child.icon && <child.icon className={`w-4 h-4 shrink-0 ${isChildActive ? "text-amber-500" : ""}`} />}
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
                if (currentPageName === "TradingTerminal" && item.page !== "TradingTerminal") {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = createPageUrl(item.page);
                } else {
                  setSidebarOpen(false);
                }
              };

              return (
                <Link
                  key={item.page}
                  onClick={handleClick}
                  to={createPageUrl(item.page)}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`flex items-center transition-all ${
                    sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"
                  } py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? "bg-amber-500/10 text-foreground border border-amber-500/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon className={`w-5 h-5 shrink-0 ${isActive ? "text-amber-500" : ""}`} />
                  {!sidebarCollapsed && <span className="font-medium truncate min-w-0">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className={`border-t border-sidebar-border transition-all ${sidebarCollapsed ? "p-2" : "p-4"}`}>
            <div
              className={`flex items-center transition-all ${
                sidebarCollapsed ? "justify-center" : "gap-3 px-3"
              } py-2`}
            >
              <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0a0d12] font-bold">
                {currentUser?.profile?.firstName?.[0] || currentUser?.email?.[0] || "U"}
              </div>

              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {currentUser?.profile?.firstName || t("nav.user")}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{currentUser?.email}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-16 bg-card/90 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center w-10 h-10 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <LanguageSwitcher />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-15 w-15 text-foreground hover:text-[#d97706]"
                >
                  <Bell className="w-10 h-10" strokeWidth={2.4} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-card border-border">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">{t("notifications.title")}</h3>
                </div>

                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    {t("notifications.noNewNotifications")}
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <DropdownMenuItem
                      key={notif.id}
                      className="p-4 cursor-pointer focus:bg-accent"
                      onSelect={(e) => e.preventDefault()}
                    >
                      <div className="flex items-start justify-between gap-3 w-full">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{notif.title}</p>
                          <p className="text-sm text-muted-foreground">{notif.message}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsReadMutation.mutate(notif.id);
                          }}
                          title={t("notifications.markAsRead")}
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
                <Button variant="ghost" className="flex items-center gap-2 text-foreground hover:bg-accent">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0a0d12] font-bold text-sm">
                    {currentUser?.profile?.firstName?.[0] || currentUser?.email?.[0] || "U"}
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground data-[state=open]:text-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 bg-card border-border">
                <DropdownMenuItem
                  asChild
                  className="cursor-pointer focus:bg-accent data-[highlighted]:bg-accent"
                >
                  <Link
                    to={createPageUrl(isAdmin ? "AdminProfile" : "Profile")}
                    className="flex items-center gap-2"
                    onClick={(e) => {
                      if (currentPageName === "TradingTerminal") {
                        e.preventDefault();
                        e.stopPropagation();
                        window.location.href = createPageUrl(isAdmin ? "AdminProfile" : "Profile");
                      }
                    }}
                  >
                    <User className="w-4 h-4" />
                    <span>{t("nav.profile")}</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border" />

                <DropdownMenuItem
                  className="cursor-pointer text-red-500 data-[highlighted]:bg-accent"
                  onClick={() => {
                    localStorage.removeItem("token");
                    window.location.href = createPageUrl("SignIn");
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-4 lg:p-8 bg-background min-h-screen">{children}</main>
      </div>

      {/* Mobile overlay: backdrop with blur */}
      {sidebarOpen && (
        <div
          role="presentation"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
