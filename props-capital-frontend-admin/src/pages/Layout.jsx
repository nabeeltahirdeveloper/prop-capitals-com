import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
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
  CreditCard,
  Shield,
  HelpCircle,
  Award,
  Zap,
  Server,
  Activity,
  Check,
  DollarSign,
  Sun,
  Moon,
  ShoppingCart,
  List,
  Link2,
  AlertTriangle,
  Building2,
  Clock,
  Eye,
  Ban,
  Globe,
  Banknote,
  FileText,
  Bot,
  BarChart3,
  Wrench,
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

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentSection = searchParams.get("section");
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

  // Full-screen pages with no layout (SignIn only — AdminConsole is now embedded inside the admin panel layout)
  const noLayoutPages = ["SignIn"];
  const isNoLayoutPage = noLayoutPages.includes(currentPageName);

  const { status, user: authUser, isAdmin, logout } = useAuth();

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
        (oldData = []) =>
          oldData.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      queryClient.invalidateQueries({
        queryKey: ["notifications", currentUser?.userId],
      });
    },
    onError: (error) => {
      console.error("Failed to mark notification as read:", error);
      queryClient.invalidateQueries({
        queryKey: ["notifications", currentUser?.userId],
      });
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
    "AdminFundedAccounts",
    "AdminPayments",
    "AdminPayouts",
    "AdminViolations",
    "AdminCoupons",
    "AdminSupport",
    "AdminTicketChat",
    "AdminSettings",
    "AdminBrokerServers",
    "AdminRiskMonitor",
    "AdminScaling",
    "AdminProfile",
    "CRMLeads",
    "CRMPipeline",
    "CRMFTDReport",
    "CRMCalendar",
    "CRMApiKeys",
    "Notifications",
    "AdminConsole",
  ];
  const isAdminPage = adminPages.includes(currentPageName);
  const showAdminMenu = isAdmin && isAdminPage;

  const adminNavItems = useMemo(
    () => [
      {
        name: t("nav.overview"),
        icon: LayoutDashboard,
        page: "AdminDashboard",
      },
      { name: t("nav.users"), icon: Users, page: "AdminUsers" },
      { name: t("nav.challenges"), icon: Award, page: "AdminChallenges" },
      { name: t("nav.accounts"), icon: TrendingUp, page: "AdminAccounts" },
      {
        name: t("nav.fundedAccounts"),
        icon: DollarSign,
        page: "AdminFundedAccounts",
      },
      { name: t("nav.riskMonitor"), icon: Activity, page: "AdminRiskMonitor" },
      {
        name: t("nav.propServer"),
        icon: Server,
        page: "AdminBrokerServers",
      },
      { name: t("nav.scaling"), icon: Zap, page: "AdminScaling" },
      { name: t("nav.payments"), icon: CreditCard, page: "AdminPayments" },
      { name: t("nav.payouts"), icon: Wallet, page: "AdminPayouts" },
      {
        name: t("nav.crm"),
        icon: Briefcase,
        children: [
          { name: t("nav.crmLeads"), page: "CRMLeads" },
          { name: t("nav.pipeline"), page: "CRMPipeline" },
          { name: t("nav.ftdReport"), page: "CRMFTDReport" },
          { name: t("nav.calendar"), page: "CRMCalendar" },
          { name: t("nav.crmApiKey"), page: "CRMApiKeys" },
        ],
      },
      { name: t("nav.coupons"), icon: Zap, page: "AdminCoupons" },
      { name: t("nav.violations"), icon: Shield, page: "AdminViolations" },
      {
        name: t("nav.support"),
        icon: HelpCircle,
        page: "AdminSupport",
        activeFor: ["AdminSupport", "AdminTicketChat"],
      },
      { name: t("nav.notifications"), icon: Bell, page: "Notifications" },
      { name: t("nav.settings"), icon: Settings, page: "AdminSettings" },

      // ===== Admin Console — merged from standalone admin console =====
      // NOTE: Dashboard, Orders, Users, Packages, and Geolocation Payment Gateway
      // are temporarily disabled — see commented entries below.
      //{ type: "divider", label: "Admin Console" },
      // {
      //   name: "Dashboard",
      //   icon: LayoutDashboard,
      //   section: "dashboard",
      // },
      {
        name: t("nav.ordersTransactions", {
          defaultValue: "Orders & Transactions",
        }),
        icon: ShoppingCart,
        children: [
          {
            name: t("nav.orders", { defaultValue: "Orders" }),
            icon: ShoppingCart,
            section: "orders",
          },
          {
            name: t("nav.allTransactions", { defaultValue: "All Transactions" }),
            icon: List,
            section: "transactions",
          },
          {
            name: t("nav.payouts", { defaultValue: "Payouts" }),
            icon: DollarSign,
            section: "payouts",
          },
          {
            name: t("nav.directPurchaseLinks", {
              defaultValue: "Direct Purchase Links",
            }),
            icon: Link2,
            section: "direct-purchase-links",
          },
          {
            name: t("nav.quickLinks", {
              defaultValue: "Quick Links",
            }),
            icon: Zap,
            section: "quick-links",
          },
          // { name: "Packages", icon: Package, section: "packages" },
          {
            name: t("nav.brandsForPayouts", {
              defaultValue: "Brands For Payouts",
            }),
            icon: AlertTriangle,
            section: "brands-unpaid-transactions",
          },
        ],
      },
      {
        name: t("nav.brands", { defaultValue: "Brands" }),
        icon: Users,
        children: [
          // { name: "Users", icon: Users, section: "users" },
          {
            name: t("nav.brandsManagement", {
              defaultValue: "Brands Management",
            }),
            icon: Building2,
            section: "brands",
          },
          {
            name: t("nav.pendingBrands", { defaultValue: "Pending Brands" }),
            icon: Clock,
            section: "pending-brands",
          },
          {
            name: t("nav.brandWallets", { defaultValue: "Brand Wallets" }),
            icon: Wallet,
            section: "brand-wallets",
          },
        ],
      },
      {
        name: t("nav.trafficSecurity", { defaultValue: "Traffic & Security" }),
        icon: Shield,
        children: [
          {
            name: t("nav.visits", { defaultValue: "Visits" }),
            icon: Eye,
            section: "visits",
          },
          {
            name: t("nav.blockedIps", { defaultValue: "Blocked IPs" }),
            icon: Ban,
            section: "blocked-ips",
          },
          {
            name: t("nav.accessControl", { defaultValue: "Access Control" }),
            icon: Shield,
            section: "ip-whitelist",
          },
        ],
      },
      {
        name: t("nav.currenciesGeo", {
          defaultValue: "Currencies & Geo Settings",
        }),
        icon: Globe,
        children: [
          {
            name: t("nav.currencies", { defaultValue: "Currencies" }),
            icon: Banknote,
            section: "currencies",
          },
          {
            name: t("nav.currencyGeoMapping", {
              defaultValue: "Currency Geo Mapping",
            }),
            icon: Globe,
            section: "currency-geo",
          },
          // {
          //   name: "Geolocation Payment Gateway",
          //   icon: CreditCard,
          //   section: "payment-gateway-geo",
          // },
        ],
      },
      {
        name: t("nav.logsMonitoring", {
          defaultValue: "Logs & System Monitoring",
        }),
        icon: Activity,
        children: [
          {
            name: t("nav.systemLogs", { defaultValue: "System Logs" }),
            icon: FileText,
            section: "logs",
          },
          {
            name: t("nav.botLogs", { defaultValue: "Bot Logs" }),
            icon: Bot,
            section: "bot-logs",
          },
          {
            name: t("nav.analytics", { defaultValue: "Analytics" }),
            icon: BarChart3,
            section: "analytics",
          },
          {
            name: t("nav.systemTools", { defaultValue: "System Tools" }),
            icon: Wrench,
            section: "system-tools",
          },
          {
            name: t("nav.settings", { defaultValue: "Settings" }),
            icon: Settings,
            section: "settings",
          },
        ],
      },

      { name: t("nav.profile"), icon: User, page: "AdminProfile" },
    ],
    [t],
  );

  const navItems = adminNavItems;

  // Auto-open submenu if a child is active (only meaningful when you actually have item.children)
  useEffect(() => {
    let activeSubmenu = null;
    navItems.forEach((item) => {
      if (
        item.children &&
        item.children.some((child) =>
          child.section
            ? currentPageName === "AdminConsole" &&
              currentSection === child.section
            : child.page === currentPageName,
        )
      ) {
        activeSubmenu = item.name;
      }
    });
    if (activeSubmenu) setOpenSubmenu(activeSubmenu);
  }, [currentPageName, currentSection, navItems]);

  // Early returns
  if (isNoLayoutPage) return <>{children}</>;

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">
            {t("common.loading")}
          </p>
        </div>
      </div>
    );
  }
  if (status !== "authenticated") return <>{children}</>;

  // Protected layout (responsive + collapsible sidebar)
  return (
    <div className="admin-panel-surface min-h-screen bg-background flex w-full overflow-x-hidden">
      {/* Sidebar — group for hover-to-show toggle */}
      <aside
        className={`group fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transform transition-[width,transform] duration-300 ease-in-out
        ${sidebarCollapsed ? "w-20" : "w-72"}
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
            aria-label={
              sidebarCollapsed
                ? t("nav.expandSidebar", { defaultValue: "Expand sidebar" })
                : t("nav.collapseSidebar", { defaultValue: "Collapse sidebar" })
            }
            title={
              sidebarCollapsed
                ? t("nav.expandSidebar", { defaultValue: "Expand sidebar" })
                : t("nav.collapseSidebar", { defaultValue: "Collapse sidebar" })
            }
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5 font-bold" />
            ) : (
              <ChevronLeft className="w-5 h-5 font-bold" />
            )}
          </button>

          {/* Logo + controls */}
          <div
            className={`flex items-center h-16 shrink-0 border-b border-sidebar-border transition-all ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-4 lg:justify-start"}`}
          >
            <Link
              to={createPageUrl("AdminDashboard")}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center min-w-0 transition-all ${sidebarCollapsed ? "justify-center" : "gap-2 flex-1 min-w-0 lg:flex-none"}`}
              title={t("nav.adminDashboard", { defaultValue: "Admin Dashboard" })}
            >
              <div className="w-10 h-10 shrink-0 mx-auto rounded-xl overflow-hidden flex items-center justify-center">
                <img
                  src={
                    isDark
                      ? "/assets/images/logo-dark.png"
                      : "/assets/images/logo-light.png"
                  }
                  alt={t("nav.logo", { defaultValue: "Logo" })}
                  className="w-full h-full object-contain"
                />
              </div>
              {!sidebarCollapsed && (
                <span className="min-w-0 block truncate text-base font-bold text-sidebar-foreground lg:text-xl">
                  PROP<span className="text-amber-500">CAPITALS</span>
                </span>
              )}
            </Link>

            {/* Mobile: close button */}
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden ml-2 shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              aria-label={t("nav.closeMenu", { defaultValue: "Close menu" })}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav
            className={`flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden transition-all ${sidebarCollapsed ? "px-2" : "px-4"}`}
          >
            {showAdminMenu && !sidebarCollapsed && (
              <div className="mb-4 px-2">
                <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
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
                const isAnyChildActive = item.children.some((child) =>
                  child.section
                    ? currentPageName === "AdminConsole" &&
                      currentSection === child.section
                    : child.page === currentPageName,
                );

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
                      className={`w-full flex items-center transition-all ${
                        sidebarCollapsed
                          ? "justify-center px-2"
                          : "justify-between px-3"
                      } py-2.5 rounded-xl ${
                        isAnyChildActive
                          ? "bg-amber-500/10 text-foreground border border-amber-500/40"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }
                        }`}
                      title={sidebarCollapsed ? item.name : undefined}
                    >
                      <div
                        className={`flex items-center transition-all ${sidebarCollapsed ? "justify-center" : "gap-3"}`}
                      >
                        <item.icon
                          className={`w-5 h-5 shrink-0 ${isAnyChildActive ? "text-amber-500" : ""}`}
                        />
                        {!sidebarCollapsed && (
                          <span className="font-medium truncate">
                            {item.name}
                          </span>
                        )}
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
                          const isChildActive = child.section
                            ? currentPageName === "AdminConsole" &&
                              currentSection === child.section
                            : currentPageName === child.page;
                          const childTo = child.section
                            ? `${createPageUrl("AdminConsole")}?section=${child.section}`
                            : createPageUrl(child.page);
                          return (
                            <Link
                              key={child.section || child.page}
                              to={childTo}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                                isChildActive
                                  ? "bg-amber-500/10 text-foreground border border-amber-500/40"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                              }`}
                            >
                              {child.icon && (
                                <child.icon
                                  className={`w-4 h-4 shrink-0 ${isChildActive ? "text-amber-500" : ""}`}
                                />
                              )}
                              <span className="text-sm font-medium">
                                {child.name}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const isActive = item.section
                ? currentPageName === "AdminConsole" &&
                  currentSection === item.section
                : currentPageName === item.page ||
                  (item.activeFor?.includes(currentPageName) ?? false);

              const itemTo = item.section
                ? `${createPageUrl("AdminConsole")}?section=${item.section}`
                : createPageUrl(item.page);

              const handleClick = (e) => {
                if (
                  currentPageName === "TradingTerminal" &&
                  item.page !== "TradingTerminal"
                ) {
                  e.preventDefault();
                  e.stopPropagation();
                  window.location.href = itemTo;
                } else {
                  setSidebarOpen(false);
                }
              };

              return (
                <Link
                  key={item.section || item.page}
                  onClick={handleClick}
                  to={itemTo}
                  title={sidebarCollapsed ? item.name : undefined}
                  className={`flex items-center transition-all ${
                    sidebarCollapsed ? "justify-center px-2" : "gap-3 px-3"
                  } py-2.5 rounded-xl transition-colors ${
                    isActive
                      ? "bg-amber-500/10 text-foreground border border-amber-500/40"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 shrink-0 ${isActive ? "text-amber-500" : ""}`}
                  />
                  {!sidebarCollapsed && (
                    <span className="font-medium truncate min-w-0">
                      {item.name}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div
            className={`border-t border-sidebar-border transition-all ${sidebarCollapsed ? "p-2" : "p-4"}`}
          >
            <div
              className={`flex items-center transition-all ${
                sidebarCollapsed ? "justify-center" : "gap-3 px-3"
              } py-2`}
            >
              <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0a0d12] font-bold">
                {currentUser?.profile?.firstName?.[0] ||
                  currentUser?.email?.[0] ||
                  "U"}
              </div>

              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {currentUser?.profile?.firstName || t("nav.user")}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentUser?.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 min-w-0 transition-all duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"}`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-40 h-16 bg-card/90 backdrop-blur-xl border-b border-border flex items-center justify-between gap-2 px-3 sm:px-4 lg:px-8">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center justify-center w-10 h-10 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            aria-label={t("nav.openMenu", { defaultValue: "Open menu" })}
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex-1" />

          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              aria-label={t("nav.toggleTheme", { defaultValue: "Toggle theme" })}
            >
              {isDark ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            {/* Admin Console — visionscope-style admin
            {isAdmin && (
              <Link to={createPageUrl("AdminConsole")}>
                <Button
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex items-center gap-2 border-amber-500/40 text-amber-600 hover:bg-amber-500/10 hover:text-amber-700"
                >
                  <Terminal className="w-4 h-4" />
                  <span className="font-medium">{t("nav.adminConsole") || "Admin Console"}</span>
                </Button>
              </Link>
            )} */}

            <LanguageSwitcher />

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 text-foreground hover:text-[#d97706]"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-semibold">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                collisionPadding={8}
                className="w-[min(20rem,calc(100vw-1rem))] max-w-[calc(100vw-1rem)] bg-card border-border"
              >
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
                          <p className="text-sm text-muted-foreground">
                            {notif.message}
                          </p>
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
                <Button
                  variant="ghost"
                  className="flex h-9 items-center gap-2 px-2 text-foreground hover:bg-accent"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0a0d12] font-bold text-sm">
                    {currentUser?.profile?.firstName?.[0] ||
                      currentUser?.email?.[0] ||
                      "U"}
                  </div>
                  <ChevronDown className="w-4 h-4 text-muted-foreground data-[state=open]:text-foreground" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent
                align="end"
                className="w-56 bg-card border-border"
              >
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
                        window.location.href = createPageUrl(
                          isAdmin ? "AdminProfile" : "Profile",
                        );
                      }
                    }}
                  >
                    <User className="w-4 h-4" />
                    <span>{t("nav.profile")}</span>
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="bg-border" />

                <DropdownMenuItem
                  className="cursor-pointer text-foreground focus:bg-primary/10 focus:text-foreground data-[highlighted]:bg-primary/10 data-[highlighted]:text-foreground"
                  onClick={logout}
                >
                  <LogOut className="w-4 h-4 mr-2 text-muted-foreground" />
                  {t("nav.logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="p-4 lg:p-8 bg-background min-h-screen">
          {children}
        </main>
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
