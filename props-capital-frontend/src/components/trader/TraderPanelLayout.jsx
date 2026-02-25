import React, { useState, useEffect } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  LineChart,
  ShoppingCart,
  Calendar,
  Wallet,
  Settings,
  HelpCircle,
  Bell,
  RefreshCw,
  ChevronDown,
  Zap,
  Globe,
  User,
  MessageSquare,
  Sun,
  Moon,
  Plus,
  Trophy,
  LogOut,
  Menu,
  X,
  Check,
  Pin,
  PinOff,
} from "lucide-react";
import {
  ChallengesProvider,
  useChallenges,
} from "@/contexts/ChallengesContext";
import { useTrading } from "@/contexts/TradingContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { getCurrentUser } from "@/api/auth";
import { getUserAccounts } from "@/api/accounts";
import {
  getUserNotifications,
  markNotificationAsRead,
} from "@/api/notifications";
import { getUserPayouts, getPayoutStatistics } from "@/api/payouts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { translateNotification } from "@/utils/notificationTranslations";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "../ui/button";
import { dayjs } from "@/lib/utils";
import { usePlatformTokensStore } from "@/lib/stores/platform-tokens.store";

export const TraderThemeContext = React.createContext();
export const useTraderTheme = () => React.useContext(TraderThemeContext);

const TraderPanelLayoutInner = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  const { isDark, toggleTheme: globalToggleTheme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const {
    selectedChallenge,
    getChallengePhaseLabel,
    challenges,
    selectChallenge,
  } = useChallenges();
  const { fetchOrders, fetchUserBalance } = useTrading();
  const pinnedAccounts = usePlatformTokensStore(
    (state) => state.pinnedAccounts || [],
  );
  const togglePinnedAccount = usePlatformTokensStore(
    (state) => state.togglePinnedAccount,
  );
  const pinnedSet = new Set(pinnedAccounts);
  const orderedChallenges = [
    ...challenges.filter((challenge) => pinnedSet.has(challenge.id)),
    ...challenges.filter((challenge) => !pinnedSet.has(challenge.id)),
  ];

  // Refetch orders & balance when the selected account changes
  useEffect(() => {
    if (selectedChallenge?.id) {
      fetchOrders(selectedChallenge.id);
      fetchUserBalance(selectedChallenge.id);
    }
  }, [selectedChallenge?.id, fetchOrders, fetchUserBalance]);

  const { data: user } = useQuery({
    queryKey: ["user", "me"],
    queryFn: getCurrentUser,
  });

  const [userState, setUserState] = useState({
    fullname: "",
    email: "",
    theme: "dark",
  });

  console.log("User : ", user);

  useEffect(() => {
    if (user) {
      const firstName = user.profile?.firstName || "";
      const lastName = user.profile?.lastName || "";
      const fullname = `${firstName} ${lastName}`.trim();
      const email = user.email || "";
      const theme = user.profile?.theme || "dark";

      setUserState({
        fullname,
        email,
        theme,
      });
    }
  }, [user]);

  // const { data: accounts = [], isLoading: accountsLoading } = useQuery({
  //   queryKey: ["trader-accounts", user?.userId],
  //   queryFn: async () => {
  //     if (!user?.userId) return [];
  //     try {
  //       return await getUserAccounts(user.userId);
  //     } catch (error) {
  //       console.error("Failed to fetch accounts:", error);
  //       return [];
  //     }
  //   },
  //   enabled: !!user?.userId,
  //   refetchOnMount: true,
  //   refetchOnWindowFocus: true,
  //   refetchInterval: 60000,
  //   staleTime: 30000,
  //   retry: false,
  // });

  // Notifications
  const { data: allNotificationsData = [] } = useQuery({
    queryKey: ["notifications", user?.userId],
    queryFn: async () => {
      if (!user?.userId) return [];
      try {
        return await getUserNotifications(user.userId);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
        return [];
      }
    },
    enabled: !!user?.userId,
    retry: false,
    refetchInterval: 5000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(
        ["notifications", user?.userId],
        (oldData = []) =>
          oldData.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.userId],
      });
    },
    onError: (error) => {
      console.error("Failed to mark notification as read:", error);
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.userId],
      });
    },
  });

  // Header dropdown: only show unread notifications, sorted by date (newest first)
  const notificationsForDropdown = (allNotificationsData || [])
    .filter((n) => !n.read) // Only unread notifications
    .slice()
    .sort((a, b) => {
      return (
        new Date(b.createdAt || 0).getTime() -
        new Date(a.createdAt || 0).getTime()
      );
    })
    .slice(0, 5)
    .map((n) => {
      const translated = translateNotification(n.title, n.body, t);
      return {
        id: n.id,
        title: translated.title,
        message: translated.message,
        read: !!n.read,
        time: dayjs(n.createdAt).fromNow(),
      };
    });
  const notifications = notificationsForDropdown;
  const unreadNotificationCount = (allNotificationsData || []).filter(
    (n) => !n.read,
  ).length;

  const toggleTheme = () => globalToggleTheme();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setLastRefresh(new Date());
    // Simulate data refresh
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const mainNavItems = [
    {
      path: "/traderdashboard",
      icon: LayoutDashboard,
      label: "Account Overview",
      exact: true,
    },
    {
      path: "/traderdashboard/trading",
      icon: LineChart,
      label: "Trading Terminal",
    },
    { path: "/traderdashboard/orders", icon: ShoppingCart, label: "Orders" },
    {
      path: "/traderdashboard/calendar",
      icon: Calendar,
      label: "Economic Calendar",
    },
    { path: "/traderdashboard/payouts", icon: Wallet, label: "Payout History" },
  ];

  const settingsNavItems = [
    {
      path: "/traderdashboard/settings",
      icon: Settings,
      label: "Account Settings",
    },
    { path: "/traderdashboard/profile", icon: User, label: "Profile" },
  ];

  const supportNavItems = [
    { path: "/traderdashboard/support", icon: MessageSquare, label: "Support" },
    { path: "/traderdashboard/faqs", icon: HelpCircle, label: "FAQ" },
  ];

  const isActive = (path, exact = false) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const phaseLabel = selectedChallenge
    ? getChallengePhaseLabel(selectedChallenge)
    : "";
  const statusColor =
    selectedChallenge?.status === "failed"
      ? "red"
      : selectedChallenge?.phase === "funded"
        ? "emerald"
        : "amber";

  // Close mobile menu when route changes
  const handleNavClick = () => {
    setMobileMenuOpen(false);
  };

  const handleSignOut = () => {
    logout();
    setShowProfileMenu(false);
  };

  return (
    <TraderThemeContext.Provider value={{ isDark, toggleTheme }}>
      <div
        className={`min-h-screen flex ${isDark ? "bg-[#0a0d12]" : "bg-slate-100"}`}
      >
        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed left-0 top-0 h-full flex flex-col border-r z-50 transition-all duration-300 ${
            isDark ? "bg-[#12161d] border-white/5" : "bg-white border-slate-200"
          } ${sidebarCollapsed ? "w-20" : "w-64"} ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
        >
          {/* Logo */}
          <div
            className={`h-16 flex items-center justify-between px-4 border-b ${isDark ? "border-white/5" : "border-slate-200"}`}
          >
            <Link
              to="/"
              className="flex items-center gap-3"
              onClick={handleNavClick}
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
                <img src="/assets/images/logo-light.png" alt="Logo" className="block dark:hidden w-full h-full object-contain" />
                <img src="/assets/images/logo-dark.png" alt="Logo Dark" className="hidden dark:block w-full h-full object-contain" />
              </div>
              {!sidebarCollapsed && (
                <span
                  className={`font-bold text-lg ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  PROP<span className="text-amber-500">CAPITALS</span>
                </span>
              )}
            </Link>
            {/* Close button for mobile */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className={`lg:hidden p-2 rounded-lg ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-slate-100 text-slate-500"}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-2">
            <Link
              to="/traderdashboard/trading"
              onClick={handleNavClick}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-all"
            >
              <Zap className="w-5 h-5" />
              {!sidebarCollapsed && <span>Start Trading</span>}
            </Link>
            <Link
              to="/traderdashboard/checkout"
              onClick={handleNavClick}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-[#0a0d12] font-bold py-3 px-4 rounded-xl transition-all"
            >
              <Plus className="w-5 h-5" />
              {!sidebarCollapsed && <span>Buy Challenge</span>}
            </Link>
          </div>

          {/* Navigation */}
          <nav className="px-3 py-2 overflow-y-auto flex-1 min-h-0">
            {/* Main Navigation */}
            <div className="mb-6">
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-2 px-3 ${
                  isDark ? "text-gray-500" : "text-slate-400"
                } ${sidebarCollapsed ? "hidden" : ""}`}
              >
                Trades
              </p>
              {mainNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
                    isActive(item.path, item.exact)
                      ? "bg-amber-500/10 text-amber-500 border-l-2 border-amber-500"
                      : isDark
                        ? "text-gray-400 hover:text-white hover:bg-white/5"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              ))}
            </div>

            {/* Account Settings */}
            <div className="mb-6">
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-2 px-3 ${
                  isDark ? "text-gray-500" : "text-slate-400"
                } ${sidebarCollapsed ? "hidden" : ""}`}
              >
                Account Settings
              </p>
              {settingsNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
                    isActive(item.path)
                      ? "bg-amber-500/10 text-amber-500 border-l-2 border-amber-500"
                      : isDark
                        ? "text-gray-400 hover:text-white hover:bg-white/5"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              ))}
            </div>

            {/* Support */}
            <div className="mb-6">
              <p
                className={`text-xs font-semibold uppercase tracking-wider mb-2 px-3 ${
                  isDark ? "text-gray-500" : "text-slate-400"
                } ${sidebarCollapsed ? "hidden" : ""}`}
              >
                Support
              </p>
              {supportNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all ${
                    isActive(item.path)
                      ? "bg-amber-500/10 text-amber-500 border-l-2 border-amber-500"
                      : isDark
                        ? "text-gray-400 hover:text-white hover:bg-white/5"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              ))}
            </div>
          </nav>

          {/* Bottom Section - Language Only */}
          {/* <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
            <div className={`flex items-center gap-3 px-3 py-2.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
              <Globe className="w-5 h-5" />
              {!sidebarCollapsed && (
                <div className="flex items-center gap-2 text-sm">
                  <span>English</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              )}
            </div>
          </div>*/}
        </aside>

        {/* Main Content */}
        <main
          className={`h-screen flex-1 flex flex-col transition-all duration-300 ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"} ml-0`}
        >
          {/* Top Header */}
          <header
            className={`h-14 sm:h-16 border-b flex items-center justify-between px-3 sm:px-6 shrink-0 ${
              isDark
                ? "bg-[#12161d] border-white/5"
                : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className={`lg:hidden p-2 rounded-lg ${
                  isDark
                    ? "bg-white/5 hover:bg-white/10 text-gray-400"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Account Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className={`flex items-center gap-2 sm:gap-3 px-3 py-1.5 rounded-xl transition-all ${isDark ? "hover:bg-white/5" : "hover:bg-slate-100"}`}
                >
                  {selectedChallenge && (
                    <>
                      <h1
                        className={`font-bold text-base sm:hidden ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {`Account #${selectedChallenge.accountId.substring(0, 4)}`}
                      </h1>
                      <div className="hidden sm:flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h1
                            className={`font-bold text-xl ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            {`Account #${selectedChallenge.accountId.substring(0, 4)}`}
                          </h1>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${isDark ? "bg-white/10 text-gray-300" : "bg-slate-100 text-slate-700"}`}
                          >
                            ${selectedChallenge.accountSize?.toLocaleString()}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${isDark ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}
                          >
                            {(selectedChallenge.platform || "").toUpperCase()}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              statusColor === "emerald"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : statusColor === "red"
                                  ? "bg-red-500/10 text-red-500"
                                  : "bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {phaseLabel}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded ${
                              selectedChallenge.status === "active"
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {selectedChallenge.status === "active"
                              ? "Active"
                              : "Failed"}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                  {challenges.length > 1 && (
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${showAccountDropdown ? "rotate-180" : ""} ${isDark ? "text-gray-400" : "text-slate-400"}`}
                    />
                  )}
                </button>

                {/* Account Dropdown Panel */}
                {showAccountDropdown && challenges.length > 1 && (
                  <>
                    <div
                      className="fixed inset-0 z-[999999]"
                      onClick={() => setShowAccountDropdown(false)}
                    />
                    <div
                      className={`absolute left-0 top-full mt-2 max-w-2xl rounded-xl shadow-2xl border z-[9999999] ${isDark ? "bg-[#12161d] border-white/10" : "bg-white border-slate-200"}`}
                    >
                      <div
                        className={`p-3 border-b ${isDark ? "border-white/5" : "border-slate-200"}`}
                      >
                        <p
                          className={`text-xs font-semibold uppercase tracking-wider ${isDark ? "text-gray-500" : "text-slate-400"}`}
                        >
                          Switch Account
                        </p>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2">
                        {orderedChallenges.map((challenge) => {
                          const label = getChallengePhaseLabel(challenge);
                          const isSelected =
                            selectedChallenge?.id === challenge.id;
                          const isPinned = pinnedSet.has(challenge.id);
                          const pinLimitReached =
                            !isPinned && pinnedAccounts.length >= 4;
                          const color =
                            challenge.status === "failed"
                              ? "red"
                              : challenge.phase === "funded"
                                ? "emerald"
                                : "amber";
                          return (
                            <button
                              key={challenge.id}
                              onClick={() => {
                                selectChallenge(challenge.id);
                                setShowAccountDropdown(false);
                              }}
                              className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition-all ${
                                isSelected
                                  ? isDark
                                    ? "bg-amber-500/10 border border-amber-500/20"
                                    : "bg-amber-50 border border-amber-200"
                                  : isDark
                                    ? "hover:bg-white/5"
                                    : "hover:bg-slate-50"
                              }`}
                            >
                              <div className="flex flex-col items-start gap-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span
                                    className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}
                                  >
                                    Account #{challenge.accountId.substr(0, 4)}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                                      isDark
                                        ? "bg-white/10 text-gray-300"
                                        : "bg-slate-100 text-slate-700"
                                    }`}
                                  >
                                    ${challenge.accountSize?.toLocaleString()}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                                      isDark
                                        ? "bg-blue-500/10 text-blue-400"
                                        : "bg-blue-50 text-blue-600"
                                    }`}
                                  >
                                    {(challenge.platform || "").toUpperCase()}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                                      color === "emerald"
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : color === "red"
                                          ? "bg-red-500/10 text-red-500"
                                          : "bg-amber-500/10 text-amber-500"
                                    }`}
                                  >
                                    {label}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 text-xs font-medium rounded ${
                                      challenge.status === "active"
                                        ? "bg-emerald-500/10 text-emerald-500"
                                        : "bg-red-500/10 text-red-500"
                                    }`}
                                  >
                                    {challenge.status === "active"
                                      ? "Active"
                                      : "Failed"}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <span
                                  role="button"
                                  tabIndex={pinLimitReached ? -1 : 0}
                                  onClick={(event) => {
                                    if (pinLimitReached) return;
                                    event.stopPropagation();
                                    togglePinnedAccount(challenge.id);
                                  }}
                                  onKeyDown={(event) => {
                                    if (pinLimitReached) return;
                                    if (
                                      event.key === "Enter" ||
                                      event.key === " "
                                    ) {
                                      event.preventDefault();
                                      event.stopPropagation();
                                      togglePinnedAccount(challenge.id);
                                    }
                                  }}
                                  className={`p-1.5 rounded-md transition-all ${
                                    pinLimitReached
                                      ? "opacity-40 cursor-not-allowed"
                                      : isDark
                                        ? "hover:bg-white/10"
                                        : "hover:bg-slate-200"
                                  }`}
                                  title={
                                    isPinned
                                      ? "Unpin account"
                                      : pinLimitReached
                                        ? "Maximum 4 pinned accounts"
                                        : "Pin account"
                                  }
                                >
                                  {isPinned ? (
                                    <PinOff className="w-3.5 h-3.5 text-amber-500" />
                                  ) : (
                                    <Pin
                                      className={`w-3.5 h-3.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}
                                    />
                                  )}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* <span className={`hidden md:block text-xs sm:text-sm ${isDark ? 'text-gray-500' : 'text-slate-500'}`}>
                Last Updated: {lastRefresh.toLocaleString()}
              </span> */}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all ${
                  isDark
                    ? "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                }`}
                title="Toggle theme"
              >
                {isDark ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>

              {/* <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={`p-2 rounded-lg transition-all ${isDark ? 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900'
                  } ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Refresh data"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>  */}

              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2 rounded-lg transition-all relative ${
                    isDark
                      ? "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-[10px] font-bold text-[#0a0d12] rounded-full flex items-center justify-center">
                      {unreadNotificationCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div
                    className={`absolute right-0 top-12 w-80 rounded-xl shadow-2xl border z-50 ${
                      isDark
                        ? "bg-[#12161d] border-white/10"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div
                      className={`p-4 border-b ${isDark ? "border-white/5" : "border-slate-200"}`}
                    >
                      <div className="flex items-center justify-between">
                        <h3
                          className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                        >
                          Notifications
                        </h3>
                        <span
                          className={`text-xs ${isDark ? "text-gray-500" : "text-slate-500"}`}
                        >
                          {unreadNotificationCount} unread
                        </span>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center">
                          <div
                            className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${isDark ? "bg-white/5" : "bg-slate-200"}`}
                          >
                            <Bell
                              className={`w-6 h-6 ${isDark ? "text-gray-500" : "text-slate-400"}`}
                            />
                          </div>
                          <p
                            className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                          >
                            No new notifications
                          </p>
                          <p
                            className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-slate-500"}`}
                          >
                            You&apos;re all caught up!
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            className={`p-4 border-b transition-all cursor-pointer ${
                              isDark
                                ? "border-white/5 hover:bg-white/5"
                                : "border-slate-100 hover:bg-slate-50"
                            } ${!notif.read ? (isDark ? "bg-white/5" : "bg-amber-50/50") : ""}`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                                    notif.type === "success"
                                      ? "bg-emerald-500"
                                      : notif.type === "warning"
                                        ? "bg-amber-500"
                                        : notif.type === "error"
                                          ? "bg-red-500"
                                          : "bg-blue-500"
                                  }`}
                                />
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                                  >
                                    {notif.title}
                                  </p>
                                  <p
                                    className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-slate-500"}`}
                                  >
                                    {notif.message}
                                  </p>
                                  <p
                                    className={`text-xs mt-1 ${isDark ? "text-gray-500" : "text-slate-400"}`}
                                  >
                                    {notif.time}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-slate-400 flex-shrink-0 hover:bg-slate-400"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsReadMutation.mutate(notif.id);
                                }}
                                title={t("notifications.markAsRead")}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div
                      className={`p-3 text-center border-t ${isDark ? "border-white/5" : "border-slate-200"}`}
                    >
                      <Link
                        to="/traderdashboard/notifications"
                        className="w-full text-center text-sm text-amber-500 hover:text-amber-400 font-medium"
                        onClick={() => {
                          setShowNotifications(false);
                        }}
                      >
                        View All Notifications
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              <div
                className={`relative flex items-center gap-3 pl-4 border-l ${isDark ? "border-white/10" : "border-slate-200"}`}
              >
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-all"
                >
                  <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-[#0a0d12] font-bold text-sm">
                    {userState.fullname.charAt(0) || "U"}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p
                      className={`text-sm font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {userState.fullname || "User"}
                    </p>
                    <p
                      className={`text-xs ${isDark ? "text-gray-500" : "text-slate-500"}`}
                    >
                      Demo Account
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showProfileMenu ? "rotate-180" : ""} ${isDark ? "text-gray-400" : "text-slate-400"}`}
                  />
                </button>

                {/* Profile Dropdown */}
                {showProfileMenu && (
                  <div
                    className={`absolute right-0 top-12 w-56 rounded-xl shadow-2xl border z-50 ${
                      isDark
                        ? "bg-[#12161d] border-white/10"
                        : "bg-white border-slate-200"
                    }`}
                  >
                    <div
                      className={`p-3 border-b ${isDark ? "border-white/5" : "border-slate-100"}`}
                    >
                      <p
                        className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}
                      >
                        {userState.fullname || "User"}
                      </p>
                      <p
                        className={`text-xs ${isDark ? "text-gray-500" : "text-slate-500"}`}
                      >
                        {userState.email || "user@example.com"}
                      </p>
                    </div>
                    <div className="p-2">
                      <Link
                        to="/traderdashboard/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isDark
                            ? "hover:bg-white/5 text-gray-300"
                            : "hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <User className="w-4 h-4" />
                        <span className="text-sm">My Profile</span>
                      </Link>
                      <Link
                        to="/traderdashboard/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isDark
                            ? "hover:bg-white/5 text-gray-300"
                            : "hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <Settings className="w-4 h-4" />
                        <span className="text-sm">Settings</span>
                      </Link>
                      <Link
                        to="/traderdashboard/support"
                        onClick={() => setShowProfileMenu(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isDark
                            ? "hover:bg-white/5 text-gray-300"
                            : "hover:bg-slate-50 text-slate-600"
                        }`}
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm">Support</span>
                      </Link>
                    </div>
                    <div
                      className={`p-2 border-t ${isDark ? "border-white/5" : "border-slate-100"}`}
                    >
                      <button
                        onClick={handleSignOut}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                          isDark
                            ? "hover:bg-red-500/10 text-red-400"
                            : "hover:bg-red-50 text-red-500"
                        }`}
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </TraderThemeContext.Provider>
  );
};

// Wrapper component that provides the ChallengesProvider
const TraderPanelLayout = () => {
  return (
    <ChallengesProvider>
      <TraderPanelLayoutInner />
    </ChallengesProvider>
  );
};

export default TraderPanelLayout;


