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
  KeyRound,
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
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function Layout({ children, currentPageName }) {
  const { t } = useTranslation();

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

  // Full-screen pages with no layout
  const noLayoutPages = ["SignIn", "SignUp"];
  const isNoLayoutPage = noLayoutPages.includes(currentPageName);

  // Public pages that don't need authentication
  const publicPages = [
    "Home",
    "Challenges",
    "HowItWorks",
    "FAQ",
    "ABOUT",
    "Contact",
    "Terms",
    "Privacy",
    "Rules",
    "BuyChallenge",
    "ScalingPlan",
  ];
  const isPublicPage = publicPages.includes(currentPageName);

  const { status, user: authUser } = useAuth();

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

  // Header dropdown: unread on top, then by date (newest first). If no unread, show latest.
  const notificationsForDropdown = (allNotificationsData || [])
    .slice()
    .sort((a, b) => {
      if (a.read !== b.read) return a.read ? 1 : -1; // unread first
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
      };
    });
  const notifications = notificationsForDropdown;
  const unreadNotificationCount = (allNotificationsData || []).filter(
    (n) => !n.read,
  ).length;

  const traderNavItems = useMemo(
    () => [
      {
        name: t("nav.dashboard"),
        icon: LayoutDashboard,
        page: "TraderDashboard",
      },
      {
        name: t("nav.tradingTerminal"),
        icon: Activity,
        page: "TradingTerminal",
      },
      { name: t("nav.buyChallenge"), icon: Award, page: "TraderBuyChallenge" },
      { name: t("nav.myAccounts"), icon: TrendingUp, page: "MyAccounts" },
      { name: t("nav.accountDetails"), icon: FileText, page: "AccountDetails" },
      {
        name: t("nav.challengeProgress"),
        icon: Target,
        page: "ChallengeProgress",
      },
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

  const navItems = traderNavItems;

  // Auto-open submenu if a child is active (only meaningful when you actually have item.children)
  useEffect(() => {
    let activeSubmenu = null;
    navItems.forEach((item) => {
      if (
        item.children &&
        item.children.some((child) => child.page === currentPageName)
      ) {
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
      <div className="min-h-screen bg-white dark:bg-[#0a0d12] transition-colors duration-300">
        <Navbar />
        {children}
        <Footer />
      </div>
    );
  }

  // Protected layout (responsive + collapsible sidebar)
  return (
    <>{children}</>
  );
}
