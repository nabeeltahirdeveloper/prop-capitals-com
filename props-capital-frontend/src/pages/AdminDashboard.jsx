import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  adminGetDashboardOverview,
  adminGetRecentAccounts,
  adminGetRecentViolations,
  adminGetRevenueChart,
  adminGetRegistrationsChart,
} from "@/api/admin";
import { useTranslation } from "../contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatsCard from "../components/shared/StatsCard";
import StatusBadge from "../components/shared/StatusBadge";
import DataTable from "../components/shared/DataTable";
import {
  Users,
  TrendingUp,
  DollarSign,
  Wallet,
  AlertTriangle,
  Award,
  ArrowRight,
  Activity,
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

  // Get dashboard overview stats
  const { data: overview = {} } = useQuery({
    queryKey: ["admin-dashboard-overview"],
    queryFn: adminGetDashboardOverview,
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  // Get recent accounts
  const { data: recentAccountsData = [] } = useQuery({
    queryKey: ["admin-dashboard-recent-accounts"],
    queryFn: adminGetRecentAccounts,
    refetchInterval: 30000,
  });

  // Get recent violations
  const { data: recentViolationsData = [] } = useQuery({
    queryKey: ["admin-dashboard-recent-violations"],
    queryFn: adminGetRecentViolations,
    refetchInterval: 30000,
  });

  // Get revenue chart data
  const { data: revenueChartData = [] } = useQuery({
    queryKey: ["admin-dashboard-revenue-chart"],
    queryFn: adminGetRevenueChart,
    retry: false,
    refetchInterval: 60000, // Refresh every minute (charts don't need to update as frequently)
  });

  // Map revenue chart data to frontend format (backend now returns daily data with date, revenue, payouts)
  const revenueData =
    revenueChartData.length > 0
      ? revenueChartData
          .map((item) => {
            try {
              const dateObj = item.date ? new Date(item.date) : new Date();
              // Check if date is valid
              if (isNaN(dateObj.getTime())) {
                console.warn("Invalid date:", item.date);
                return null;
              }
              return {
                date: format(dateObj, "MMM d"),
                revenue: item.revenue || 0,
                payouts: item.payouts || 0,
              };
            } catch (error) {
              console.error("Error formatting date:", item.date, error);
              return null;
            }
          })
          .filter(Boolean) // Remove null entries
      : [];

  // Map backend accounts to frontend format
  const recentAccounts = (recentAccountsData || []).map((account) => {
    const challenge = account.challenge || {};
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
      id: account.id,
      account_number: account.brokerLogin || account.id.slice(0, 8),
      platform: challenge.platform || "MT5",
      status:
        statusMap[account.status] || account.status?.toLowerCase() || "active",
      current_phase:
        phaseMap[account.phase] || account.phase?.toLowerCase() || "phase1",
      created_date: account.createdAt,
    };
  });

  // Helper function to extract percentage from message
  const extractPercentage = (message) => {
    if (!message) return null;
    const match = message.match(/(\d+\.?\d*)%/);
    return match ? parseFloat(match[1]) : null;
  };

  // Map backend violations to frontend format
  const recentViolations = (recentViolationsData || []).map((violation) => {
    const violationType = violation.type?.toLowerCase() || "unknown";
    const threshold = extractPercentage(violation.message) || 5; // Default to 5 if not found
    return {
      id: violation.id,
      type: violationType,
      description:
        violation.message ||
        t(`admin.dashboard.violations.${violationType}.description`, {
          defaultValue: `${violation.type} violation`,
        }),
      threshold: threshold,
      created_date: violation.createdAt,
    };
  });

  const displayRecentAccounts = recentAccounts;
  const displayRecentViolations = recentViolations.slice(0, 5);

  const accountColumns = [
    {
      header: t("admin.dashboard.table.account"),
      accessorKey: "account_number",
      cell: (row) => (
        <span className="font-medium text-white">{row.account_number}</span>
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
      cell: (row) => {
        try {
          if (!row.created_date) return "-";
          const date = new Date(row.created_date);
          return isNaN(date.getTime()) ? "-" : format(date, "MMM d, HH:mm");
        } catch (error) {
          return "-";
        }
      },
    },
  ];

  const violationColumns = [
    {
      header: t("admin.dashboard.table.type"),
      accessorKey: "type",
      cell: (row) => (
        <span className="text-red-400 capitalize">
          {t(`admin.dashboard.violations.${row.type}.type`, {
            defaultValue: row.type?.replace(/_/g, " "),
          })}
        </span>
      ),
    },
    {
      header: t("admin.dashboard.table.description"),
      accessorKey: "description",
      cell: (row) => {
        // Try to translate description based on type, similar to AdminViolations page
        const descriptionKey = `admin.violations.descriptions.${row.type}`;
        const threshold = row.threshold || 5; // Use threshold from row data
        const translated = t(descriptionKey, { threshold });
        // If translation key doesn't exist (returns the key itself), use original description
        return translated === descriptionKey ? row.description : translated;
      },
    },
    {
      header: t("admin.dashboard.table.time"),
      accessorKey: "created_date",
      cell: (row) => {
        try {
          if (!row.created_date) return "-";
          const date = new Date(row.created_date);
          return isNaN(date.getTime()) ? "-" : format(date, "HH:mm");
        } catch (error) {
          return "-";
        }
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">
          {t("admin.dashboard.title")}
        </h1>
        <p className="text-sm sm:text-base text-slate-400">
          {t("admin.dashboard.subtitle")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatsCard
          title={t("admin.dashboard.stats.totalTraders")}
          value={overview.totalUsers || 0}
          icon={Users}
          gradient="from-blue-500 to-cyan-500"
          change={
            overview.usersChangePercent !== undefined
              ? t("admin.dashboard.stats.changeThisMonth", {
                  percent: Math.round(overview.usersChangePercent),
                })
              : undefined
          }
          changeType={
            overview.usersChangePercent >= 0 ? "positive" : "negative"
          }
        />
        <StatsCard
          title={t("admin.dashboard.stats.activeChallenges")}
          value={overview.activeAccounts || 0}
          icon={TrendingUp}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatsCard
          title={t("admin.dashboard.stats.revenue")}
          value={`$${(overview.totalRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          gradient="from-green-500 to-emerald-500"
          change={
            overview.revenueChangePercent !== undefined
              ? t("admin.dashboard.stats.changeThisMonth", {
                  percent: Math.round(overview.revenueChangePercent),
                })
              : undefined
          }
          changeType={
            overview.revenueChangePercent >= 0 ? "positive" : "negative"
          }
        />
        <StatsCard
          title={t("admin.dashboard.stats.payouts")}
          value={`$${(overview.pendingPayoutsAmount || 0).toLocaleString()}`}
          icon={Wallet}
          gradient="from-purple-500 to-pink-500"
        />
        <StatsCard
          title={t("admin.dashboard.stats.fundedAccounts")}
          value={overview.fundedAccounts || 0}
          icon={Award}
          gradient="from-amber-500 to-orange-500"
        />
        <StatsCard
          title={t("admin.dashboard.stats.violationsToday")}
          value={overview.violationsToday || 0}
          icon={AlertTriangle}
          gradient="from-red-500 to-pink-500"
        />
      </div>

      {/* Revenue Chart */}
      <Card className="bg-slate-900 border-slate-900 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-white">
            {t("admin.dashboard.chart.title")}
          </h3>
          <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400">
                {t("admin.dashboard.chart.revenue")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-purple-500" />
              <span className="text-slate-400">
                {t("admin.dashboard.chart.payouts")}
              </span>
            </div>
          </div>
        </div>
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
                <linearGradient id="payoutGradient" x1="0" y1="0" x2="0" y2="1">
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
                tickFormatter={(v) => `$${v / 1000}k`}
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
                  return [`$${value.toLocaleString()}`, label];
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
      </Card>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Accounts */}
        <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-white">
              {t("admin.dashboard.recentAccounts.title")}
            </h3>
            <Link to={createPageUrl("AdminAccounts")}>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:!text-black text-xs sm:text-sm px-2 sm:px-3"
              >
                {t("admin.dashboard.viewAll")}{" "}
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <DataTable
            columns={accountColumns}
            data={displayRecentAccounts}
            emptyMessage={t("admin.dashboard.noDataFound")}
          />
        </Card>

        {/* Recent Violations */}
        <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
              {t("admin.dashboard.recentViolations.title")}
            </h3>
            <Link to={createPageUrl("AdminViolations")}>
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:!text-black text-xs sm:text-sm px-2 sm:px-3"
              >
                {t("admin.dashboard.viewAll")}{" "}
                <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <DataTable
            columns={violationColumns}
            data={displayRecentViolations}
            emptyMessage={t("admin.dashboard.noDataFound")}
          />
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Link to={createPageUrl("AdminUsers")}>
          <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4 hover:border-emerald-500/50 transition-colors cursor-pointer h-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 flex-shrink-0" />
              <span className="text-white font-medium text-xs sm:text-sm">
                {t("admin.dashboard.quickActions.manageUsers")}
              </span>
            </div>
          </Card>
        </Link>
        <Link to={createPageUrl("AdminChallenges")}>
          <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4 hover:border-cyan-500/50 transition-colors cursor-pointer h-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 flex-shrink-0" />
              <span className="text-white font-medium text-xs sm:text-sm">
                {t("admin.dashboard.quickActions.manageChallenges")}
              </span>
            </div>
          </Card>
        </Link>
        <Link to={createPageUrl("AdminPayouts")}>
          <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4 hover:border-purple-500/50 transition-colors cursor-pointer h-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
              <span className="text-white font-medium text-xs sm:text-sm">
                {t("admin.dashboard.quickActions.reviewPayouts")}
              </span>
            </div>
          </Card>
        </Link>
        <Link to={createPageUrl("AdminSettings")}>
          <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4 hover:border-amber-500/50 transition-colors cursor-pointer h-full">
            <div className="flex items-center gap-2 sm:gap-3">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
              <span className="text-white font-medium text-xs sm:text-sm">
                {t("admin.dashboard.quickActions.platformSettings")}
              </span>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
