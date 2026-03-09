import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "@/api/notifications";
import { useTranslation } from "../contexts/LanguageContext";
import { translateNotification } from "../utils/notificationTranslations";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  DollarSign,
  TrendingUp,
  Shield,
  Award,
  Trash2,
  Check,
  X,
  Clock,
  Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS, th, fr, ja, ru, ko, es, tr } from "date-fns/locale";

// Defined outside component — constant, no need to recreate on every render
const localeMap = {
  en: enUS,
  th: th,
  fr: fr,
  ja: ja,
  ru: ru,
  ko: ko,
  es: es,
  tr: tr,
};

export default function Notifications() {
  const { t, language } = useTranslation();
  const [filter, setFilter] = useState("all");

  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get user notifications
  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    isError: notificationsError,
  } = useQuery({
    queryKey: ["notifications", user?.userId],
    queryFn: () => getUserNotifications(user?.userId),
    enabled: !!user?.userId,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (id) => markNotificationAsRead(id),
    onSuccess: (_, id) => {
      queryClient.setQueryData(
        ["notifications", user?.userId],
        (oldData = []) => {
          return oldData.map((n) => (n.id === id ? { ...n, read: true } : n));
        },
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

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (id) => deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.userId],
      });
    },
    onError: (error) => {
      console.error("Failed to delete notification:", error);
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.userId],
      });
    },
  });

  // Mark all as read — uses mutation for proper loading state
  const markAllAsReadMutation = useMutation({
    mutationFn: () => markAllNotificationsAsRead(user.userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.userId],
      });
    },
    onError: (error) => {
      console.error("Failed to mark all notifications as read:", error);
    },
  });

  // Map backend notifications to frontend format
  // Sort: unread first, then by createdAt descending
  const mappedNotifications = notifications
    .map((notification) => {
      const type = notification.type?.toLowerCase() || "info";
      const category = notification.category?.toLowerCase() || "system";
      const translated = translateNotification(
        notification.title,
        notification.body,
        t,
      );

      return {
        id: notification.id,
        title: translated.title,
        message: translated.message,
        type: type,
        category: category,
        is_read: notification.read || false,
        created_date: notification.createdAt,
      };
    })
    .sort((a, b) => {
      if (a.is_read !== b.is_read) {
        return a.is_read ? 1 : -1;
      }
      return (
        new Date(b.created_date).getTime() - new Date(a.created_date).getTime()
      );
    });

  const filteredNotifications =
    filter === "all"
      ? mappedNotifications
      : filter === "unread"
        ? mappedNotifications.filter((n) => !n.is_read)
        : mappedNotifications.filter((n) => n.category === filter);

  const unreadCount = mappedNotifications.filter((n) => !n.is_read).length;

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <CheckCircle className="w-5 h-5 text-emerald-400" />;
      case "warning":
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case "error":
        return <X className="w-5 h-5 text-red-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "challenge":
        return <Award className="w-4 h-4" />;
      case "payout":
        return <DollarSign className="w-4 h-4" />;
      case "account":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case "success":
        return "border-emerald-500/30 bg-emerald-500/5";
      case "warning":
        return "border-amber-500/30 bg-amber-500/5";
      case "error":
        return "border-red-500/30 bg-red-500/5";
      default:
        return "border-border bg-accent/50";
    }
  };

  if (notificationsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-xl bg-accent" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48 bg-accent" />
            <Skeleton className="h-4 w-64 bg-accent" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl bg-accent" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl bg-accent" />
          ))}
        </div>
      </div>
    );
  }

  if (notificationsError) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("notifications.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("notifications.subtitle")}
            </p>
          </div>
        </div>
        <Card className="bg-card border-red-500/30 p-6 md:p-12 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t("notifications.loadError")}
          </h3>
          <p className="text-muted-foreground">
            {t("notifications.loadErrorHint")}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center">
            <Bell className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {t("notifications.title")}
            </h1>
            <p className="text-muted-foreground">
              {t("notifications.subtitle")}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            className="border-border bg-card hover:bg-accent"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <Check className="w-4 h-4 mr-2" />
            {t("notifications.markAllAsRead")}
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Card className="bg-card border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <Bell className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground">
                {mappedNotifications.length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("notifications.total")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="bg-card border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {unreadCount}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("notifications.unread")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="bg-card border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {mappedNotifications.filter((n) => n.type === "warning").length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("notifications.warnings")}
              </p>
            </div>
          </div>
        </Card>
        <Card className="bg-card border-border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {mappedNotifications.filter((n) => n.type === "error").length}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("notifications.violations")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="bg-accent/50 p-1.5 rounded-lg flex-shrink-0">
          <Filter className="w-4 h-4 text-emerald-400" />
        </div>
        <div className="flex-1 overflow-x-auto no-scrollbar">
          <Tabs value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="bg-card border border-border w-full sm:w-auto justify-start inline-flex h-auto p-1 overflow-x-auto">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-accent text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap px-4 py-2 text-xs sm:text-sm"
              >
                {t("notifications.all")}
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="data-[state=active]:bg-accent text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap px-4 py-2 text-xs sm:text-sm"
              >
                {t("notifications.unread")}{" "}
                {unreadCount > 0 && (
                  <Badge className="ml-1.5 bg-emerald-500/20 text-emerald-400 px-1.5 py-0 min-w-[1.25rem] h-5 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="challenge"
                className="data-[state=active]:bg-accent text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap px-4 py-2 text-xs sm:text-sm"
              >
                {t("notifications.challenges")}
              </TabsTrigger>
              <TabsTrigger
                value="payout"
                className="data-[state=active]:bg-accent text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap px-4 py-2 text-xs sm:text-sm"
              >
                {t("notifications.payouts")}
              </TabsTrigger>
              <TabsTrigger
                value="account"
                className="data-[state=active]:bg-accent text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap px-4 py-2 text-xs sm:text-sm"
              >
                {t("notifications.account")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="bg-card border-border p-6 md:p-12 text-center">
            <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t("notifications.noNotifications")}
            </h3>
            <p className="text-muted-foreground">
              {t("notifications.allCaughtUp")}
            </p>
          </Card>
        ) : (
          filteredNotifications.map((notification) => (
            <Card
              key={notification.id}
              className={`border p-4 transition-all hover:border-border/80 ${getBorderColor(notification.type)} ${!notification.is_read ? "ring-1 ring-emerald-500/30" : ""}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    notification.type === "success"
                      ? "bg-emerald-500/20"
                      : notification.type === "warning"
                        ? "bg-amber-500/20"
                        : notification.type === "error"
                          ? "bg-red-500/20"
                          : "bg-blue-500/20"
                  }`}
                >
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-foreground font-semibold">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {notification.message}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground h-8 w-8"
                          aria-label={t("notifications.markAsRead")}
                          onClick={() =>
                            markAsReadMutation.mutate(notification.id)
                          }
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-red-400 h-8 w-8"
                        aria-label={t("notifications.delete")}
                        onClick={() =>
                          deleteNotificationMutation.mutate(notification.id)
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-3">
                    <Badge
                      variant="outline"
                      className="text-xs border-border text-muted-foreground"
                    >
                      {getCategoryIcon(notification.category)}
                      <span className="ml-1 capitalize">
                        {notification.category === "challenge"
                          ? t("notifications.challenge")
                          : notification.category === "payout"
                            ? t("notifications.payout")
                            : notification.category === "account"
                              ? t("notifications.account")
                              : t("notifications.system")}
                      </span>
                    </Badge>
                    <span
                      key={language + notification.id}
                      className="text-xs text-muted-foreground"
                    >
                      {formatDistanceToNow(
                        new Date(notification.created_date),
                        {
                          addSuffix: true,
                          locale: localeMap[language] || enUS,
                        },
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
