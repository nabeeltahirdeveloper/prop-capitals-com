import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery } from "@tanstack/react-query";
import {
  adminGetDashboardOverview,
  adminGetRecentAccounts,
  adminGetRecentViolations,
  adminGetRevenueChart,
} from "@/api/admin";
import { useTranslation } from "../contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/shared/StatsCard";
import StatusBadge from "@/components/shared/StatusBadge";
import DataTable from "@/components/shared/DataTable";
import {
  Users,
  TrendingUp,
  DollarSign,
  Wallet,
  AlertTriangle,
  Award,
  ArrowRight,
  Activity,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export default function AdminDashboard() {
  const { t } = useTranslation();

  // Get dashboard overview stats with error/loading states
  const {
    data: overview = {},
    isLoading: overviewLoading,
    isError: overviewError,
    error: overviewErrorObj,
  } = useQuery({
    queryKey: ["admin-dashboard-overview"],
    queryFn: adminGetDashboardOverview,
    refetchInterval: 30000,
    retry: 2,
    staleTime: 10000,
  });

  // Get recent accounts with error/loading states
  const {
    data: recentAccountsData = [],
    isLoading: accountsLoading,
    isError: accountsError,
  } = useQuery({
    queryKey: ["admin-dashboard-recent-accounts"],
    queryFn: adminGetRecentAccounts,
    refetchInterval: 30000,
    retry: 2,
  });

  // Get recent violations with error/loading states
  const {
    data: recentViolationsData = [],
    isLoading: violationsLoading,
    isError: violationsError,
  } = useQuery({
    queryKey: ["admin-dashboard-recent-violations"],
    queryFn: adminGetRecentViolations,
    refetchInterval: 30000,
    retry: 2,
  });

  // Get revenue chart data with error/loading states
  const {
    data: revenueChartData = [],
    isLoading: revenueLoading,
    isError: revenueError,
  } = useQuery({
    queryKey: ["admin-dashboard-revenue-chart"],
    queryFn: adminGetRevenueChart,
    retry: 1,
    refetchInterval: 60000,
  });

  // SAFE: Map revenue chart data with comprehensive error handling
  const revenueData = React.useMemo(() => {
    if (!Array.isArray(revenueChartData) || revenueChartData.length === 0) {
      return [];
    }

    return revenueChartData
      .map((item) => {
        try {
          if (!item || !item.date) return null;

          const dateObj = new Date(item.date);

          if (isNaN(dateObj.getTime())) {
            console.warn("Invalid date in revenue chart:", item.date);
            return null;
          }

          return {
            date: format(dateObj, "MMM d"),
            revenue: Number(item.revenue) || 0,
            payouts: Number(item.payouts) || 0,
          };
        } catch (error) {
          console.error("Error formatting revenue chart item:", item, error);
          return null;
        }
      })
      .filter(Boolean);
  }, [revenueChartData]);

  // SAFE: Map backend accounts to frontend format with null safety
  const recentAccounts = React.useMemo(() => {
    if (!Array.isArray(recentAccountsData)) return [];

    return recentAccountsData
      .map((account) => {
        try {
          const challenge = account?.challenge || {};
          const statusMap = {
            ACTIVE: "active",
            PAUSED: "paused",
            CLOSED: "closed",
          };
          const phaseMap = {
            PHASE1: "phase1",
            PHASE2: "phase2",
            FUNDED: "funded",
            FAILED: "failed",
          };

          return {
            id: account?.id || "",
            account_number:
              account?.brokerLogin || account?.id?.slice(0, 8) || "N/A",
            platform: challenge?.platform || "MT5",
            status:
              statusMap[account?.status] ||
              account?.status?.toLowerCase() ||
              "active",
            current_phase:
              phaseMap[account?.phase] ||
              account?.phase?.toLowerCase() ||
              "phase1",
            created_date: account?.createdAt || null,
          };
        } catch (error) {
          console.error("Error mapping account:", account, error);
          return null;
        }
      })
      .filter(Boolean);
  }, [recentAccountsData]);

  // SAFE: Helper function to extract percentage from message
  const extractPercentage = (message) => {
    if (!message) return null;
    try {
      const match = message.match(/(\d+\.?\d*)%/);
      return match ? parseFloat(match[1]) : null;
    } catch {
      return null;
    }
  };

  // SAFE: Map backend violations to frontend format with null safety
  const recentViolations = React.useMemo(() => {
    if (!Array.isArray(recentViolationsData)) return [];

    return recentViolationsData
      .map((violation) => {
        try {
          const violationType = violation?.type?.toLowerCase() || "unknown";
          const threshold = extractPercentage(violation?.message) || 5;

          return {
            id: violation?.id || "",
            type: violationType,
            description:
              violation?.message ||
              t(`admin.dashboard.violations.${violationType}.description`, {
                defaultValue: `${violation?.type || "Unknown"} violation`,
              }),
            threshold: threshold,
            created_date: violation?.createdAt || null,
          };
        } catch (error) {
          console.error("Error mapping violation:", violation, error);
          return null;
        }
      })
      .filter(Boolean);
  }, [recentViolationsData, t]);

  const displayRecentAccounts = recentAccounts;
  const displayRecentViolations = recentViolations.slice(0, 5);

  // SAFE: Date formatter with error handling
  const formatDate = (dateValue, formatString) => {
    try {
      if (!dateValue) return "-";
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "-";
      return format(date, formatString);
    } catch (error) {
      console.error("Error formatting date:", dateValue, error);
      return "-";
    }
  };

  // Table column definitions
  const accountColumns = [
    {
      header: t("admin.dashboard.table.account"),
      accessorKey: "account_number",
      cell: (row) => (
        <span className="font-medium text-foreground">
          {row.account_number}
        </span>
      ),
    },
    { header: t("admin.dashboard.table.platform"), accessorKey: "platform" },
    {
      header: t("admin.dashboard.table.phase"),
      accessorKey: "current_phase",
      cell: (row) => <StatusBadge status={row.current_phase} />,
    },
    {
      header: t("admin.dashboard.table.status"),
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: t("admin.dashboard.table.created"),
      accessorKey: "created_date",
      cell: (row) => formatDate(row.created_date, "MMM d, HH:mm"),
    },
  ];

  const violationColumns = [
    {
      header: t("admin.dashboard.table.type"),
      accessorKey: "type",
      cell: (row) => (
        <span className="text-red-400 capitalize">
          {t(`admin.dashboard.violations.${row.type}.type`, {
            defaultValue: row.type?.replace(/_/g, " ") || "Unknown",
          })}
        </span>
      ),
    },
    {
      header: t("admin.dashboard.table.description"),
      accessorKey: "description",
      cell: (row) => {
        const descriptionKey = `admin.violations.descriptions.${row.type}`;
        const threshold = row.threshold || 5;
        const translated = t(descriptionKey, { threshold });
        return translated === descriptionKey ? row.description : translated;
      },
    },
    {
      header: t("admin.dashboard.table.time"),
      accessorKey: "created_date",
      cell: (row) => formatDate(row.created_date, "HH:mm"),
    },
  ];

  // Show global loading state
  if (
    overviewLoading &&
    accountsLoading &&
    violationsLoading &&
    revenueLoading
  ) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <span className="ml-3 text-muted-foreground font-medium">
          Loading dashboard...
        </span>
      </div>
    );
  }

  // Show global error state
  if (overviewError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-foreground mb-2">
          Failed to Load Dashboard
        </h2>
        <p className="text-muted-foreground mb-4">
          {overviewErrorObj?.message || "An unexpected error occurred"}
        </p>
        <Button onClick={() => window.location.reload()}>
          Reload Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Custom styles for hiding scrollbars */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {t("admin.dashboard.title")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("admin.dashboard.subtitle")}
        </p>
      </div>

      {/* Stats Grid - FIXED: Better responsive breakpoints */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatsCard
          title={t("admin.dashboard.stats.totalTraders")}
          value={overview.totalUsers || 0}
          icon={Users}
          gradient="from-[#020617] to-[#020617]"
          change={
            overview.usersChangePercent !== undefined
              ? t("admin.dashboard.stats.changeThisMonth", {
                  percent: Math.round(overview.usersChangePercent),
                })
              : undefined
          }
          changeType={
            (overview.usersChangePercent || 0) >= 0 ? "positive" : "negative"
          }
        />
        <StatsCard
          title={t("admin.dashboard.stats.activeChallenges")}
          value={overview.activeAccounts || 0}
          icon={TrendingUp}
          gradient="from-[#0f766e] to-[#14b8a6]"
        />
        <StatsCard
          title={t("admin.dashboard.stats.revenue")}
          value={`$${(overview.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          gradient="from-[#15803d] to-[#22c55e]"
          change={
            overview.revenueChangePercent !== undefined
              ? t("admin.dashboard.stats.changeThisMonth", {
                  percent: Math.round(overview.revenueChangePercent),
                })
              : undefined
          }
          changeType={
            (overview.revenueChangePercent || 0) >= 0 ? "positive" : "negative"
          }
        />
        <StatsCard
          title={t("admin.dashboard.stats.payouts")}
          value={`$${(overview.pendingPayoutsAmount || 0).toLocaleString()}`}
          icon={Wallet}
          gradient="from-[#4c1d95] to-[#ec4899]"
        />
        <StatsCard
          title={t("admin.dashboard.stats.fundedAccounts")}
          value={overview.fundedAccounts || 0}
          icon={Award}
          gradient="from-[#d97706] to-[#d97706]"
        />
        <StatsCard
          title={t("admin.dashboard.stats.violationsToday")}
          value={overview.violationsToday || 0}
          icon={AlertTriangle}
          gradient="from-[#991b1b] to-[#e11d48]"
        />
      </div>

      {/* Revenue Chart */}
      <Card className="bg-card border-border p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">
            {t("admin.dashboard.chart.title")}
          </h3>
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">
                {t("admin.dashboard.chart.revenue")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-purple-500" />
              <span className="text-muted-foreground">
                {t("admin.dashboard.chart.payouts")}
              </span>
            </div>
          </div>
        </div>

        {revenueLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          </div>
        ) : revenueError ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">Failed to load chart data</p>
          </div>
        ) : revenueData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center">
            <p className="text-muted-foreground">No revenue data available</p>
          </div>
        ) : (
          <div className="h-[200px] sm:h-[250px] md:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient
                    id="revenueGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="payoutGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#64748b"
                  tick={{ fill: "#64748b", fontSize: 10 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  width={45}
                />
                <Tooltip
                  contentStyle={{
                    background: "#1e293b",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "#fff" }}
                  labelFormatter={(label) =>
                    `${t("admin.dashboard.chart.tooltip.date")}: ${label}`
                  }
                  formatter={(value, name) => {
                    const label =
                      name === "revenue"
                        ? t("admin.dashboard.chart.tooltip.revenue")
                        : t("admin.dashboard.chart.tooltip.payout");
                    return [`$${Number(value).toLocaleString()}`, label];
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  fill="url(#revenueGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="payouts"
                  stroke="#a855f7"
                  fill="url(#payoutGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* Tables - FIXED: Added no-scrollbar class */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Accounts */}
        <Card className="bg-card border-border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground">
              {t("admin.dashboard.recentAccounts.title")}
            </h3>
            <Link to={createPageUrl("AdminAccounts")}>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:!text-foreground text-xs sm:text-sm px-2 sm:px-3"
              >
                {t("admin.dashboard.viewAll")}{" "}
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {accountsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : accountsError ? (
            <p className="text-center text-muted-foreground py-8">
              Failed to load accounts
            </p>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <DataTable
                columns={accountColumns}
                data={displayRecentAccounts}
                emptyMessage={t("admin.dashboard.noDataFound")}
              />
            </div>
          )}
        </Card>
      
        {/* Recent Violations */}
        <Card className="bg-card border-border p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              {t("admin.dashboard.recentViolations.title")}
            </h3>
            <Link to={createPageUrl("AdminViolations")}>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:!text-foreground text-xs sm:text-sm px-2 sm:px-3"
              >
                {t("admin.dashboard.viewAll")}{" "}
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </Button>
            </Link>
          </div>
          {violationsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
            </div>
          ) : violationsError ? (
            <p className="text-center text-muted-foreground py-8">
              Failed to load violations
            </p>
          ) : (
            <div className="overflow-x-auto no-scrollbar">
              <DataTable
                columns={violationColumns}
                data={displayRecentViolations}
                emptyMessage={t("admin.dashboard.noDataFound")}
              />
            </div>
          )}
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Link to={createPageUrl("AdminUsers")}>
          <Card className="bg-card border-border p-3 sm:p-4 hover:border-amber-500/50 transition-colors cursor-pointer h-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
              <span className="text-foreground font-medium text-xs sm:text-sm">
                {t("admin.dashboard.quickActions.manageUsers")}
              </span>
            </div>
          </Card>
        </Link>
        <Link to={createPageUrl("AdminChallenges")}>
          <Card className="bg-card border-border p-3 sm:p-4 hover:border-cyan-500/50 transition-colors cursor-pointer h-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
              <span className="text-foreground font-medium text-xs sm:text-sm">
                {t("admin.dashboard.quickActions.manageChallenges")}
              </span>
            </div>
          </Card>
        </Link>
        <Link to={createPageUrl("AdminPayouts")}>
          <Card className="bg-card border-border p-3 sm:p-4 hover:border-purple-500/50 transition-colors cursor-pointer h-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
              <span className="text-foreground font-medium text-xs sm:text-sm">
                {t("admin.dashboard.quickActions.reviewPayouts")}
              </span>
            </div>
          </Card>
        </Link>
        <Link to={createPageUrl("AdminSettings")}>
          <Card className="bg-card border-border p-3 sm:p-4 hover:border-amber-500/50 transition-colors cursor-pointer h-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
              <span className="text-foreground font-medium text-xs sm:text-sm">
                {t("admin.dashboard.quickActions.platformSettings")}
              </span>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
