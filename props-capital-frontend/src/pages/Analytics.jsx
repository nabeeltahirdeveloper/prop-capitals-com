import React, { useState, useEffect } from "react";
import { getCurrentUser } from "@/api/auth";
import { getUserAccounts, getAccountById, getAnalytics } from "@/api/accounts";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "../contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatsCard from "../components/shared/StatsCard";
import EquityCurve from "../components/charts/EquityCurve";
import DailyPnLChart from "../components/charts/DailyPnLChart";
import PerformanceMetrics from "../components/trading/PerformanceMetrics";
import DataTable from "../components/shared/DataTable";
import StatusBadge from "../components/shared/StatusBadge";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Percent,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import {
  PieChart as RechartsPie,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

export default function Analytics() {
  const { t } = useTranslation();
  const [selectedAccount, setSelectedAccount] = useState("all");

  const { data: user } = useQuery({
    queryKey: ["user", "me"],
    queryFn: getCurrentUser,
  });

  useEffect(() => {
    // Check URL params for account
    const params = new URLSearchParams(window.location.search);
    const accountParam = params.get("account");
    if (accountParam) setSelectedAccount(accountParam);
  }, []);

  const { data: accounts = [] } = useQuery({
    queryKey: ["trader-accounts", user?.userId],
    queryFn: async () => {
      if (!user?.userId) return [];
      try {
        return await getUserAccounts(user.userId);
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
        return [];
      }
    },
    enabled: !!user?.userId,
    retry: false,
    refetchInterval: 30000, // Update every 30 seconds (less frequent)
  });

  // Get analytics data (single account or aggregated for all accounts)
  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ["analytics", user?.userId, selectedAccount],
    queryFn: async () => {
      if (!user?.userId) return null;
      try {
        const accountId = selectedAccount === "all" ? null : selectedAccount;
        return await getAnalytics(user.userId, accountId);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        return null;
      }
    },
    enabled: !!user?.userId,
    retry: false,
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // Extract analytics data with defaults
  const statistics = analytics?.statistics || {
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    winRate: 0,
    totalProfit: 0,
    avgWin: 0,
    avgLoss: 0,
    profitFactor: 0,
    bestTrade: 0,
    worstTrade: 0,
  };

  const symbolDistribution = analytics?.symbolDistribution || [];
  const equityCurveData = analytics?.equityCurve || [];
  const dailyPnLData = analytics?.dailyPnL || [];

  // Get starting balance for equity curve (from first equity point or account details)
  const startingBalance =
    equityCurveData.length > 0
      ? equityCurveData[0].balance
      : selectedAccount !== "all"
        ? accounts.find((acc) => acc.id === selectedAccount)?.initialBalance ||
          accounts.find((acc) => acc.id === selectedAccount)?.initial_balance ||
          0
        : accounts.length > 0
          ? accounts.reduce(
              (sum, acc) =>
                sum + (acc.initialBalance || acc.initial_balance || 0),
              0,
            )
          : 0;

  const COLORS = [
    "#10b981",
    "#06b6d4",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#ec4899",
  ];

  // For trade history table, we still need to fetch trades
  // But we can use the analytics statistics for the stats cards
  const { data: allTrades = [] } = useQuery({
    queryKey: ["trades", selectedAccount, accounts],
    queryFn: async () => {
      try {
        if (selectedAccount === "all") {
          // Fetch trades for all accounts
          if (!accounts || accounts.length === 0) return [];
          const { getAccountTrades } = await import("@/api/trades");
          const allTradesPromises = accounts.map((acc) =>
            getAccountTrades(acc.id).catch(() => []),
          );
          const allTradesResults = await Promise.all(allTradesPromises);
          return allTradesResults.flat();
        } else {
          // Fetch trades for selected account
          const { getAccountTrades } = await import("@/api/trades");
          return await getAccountTrades(selectedAccount);
        }
      } catch (error) {
        console.error("Failed to fetch trades:", error);
        return [];
      }
    },
    enabled: !!user?.userId && accounts.length > 0,
    retry: false,
  });

  // Map backend trades to display format for table
  const displayTrades = (allTrades || []).map((trade) => ({
    id: trade.id,
    symbol: trade.symbol,
    type: trade.type.toLowerCase(),
    lot_size: trade.volume,
    open_price: trade.openPrice,
    close_price: trade.closePrice || undefined,
    profit: trade.profit || 0,
    open_time: trade.openedAt,
    close_time: trade.closedAt || undefined,
    status: trade.closedAt ? "closed" : "open",
  }));

  const tradeColumns = [
    {
      header: t("analytics.symbol"),
      accessorKey: "symbol",
      cell: (row) => (
        <span className="font-medium text-white">{row.symbol}</span>
      ),
    },
    {
      header: t("analytics.type"),
      accessorKey: "type",
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            row.type === "buy"
              ? "bg-emerald-500/20 text-emerald-400"
              : "bg-red-500/20 text-red-400"
          }`}
        >
          {row.type === "buy" ? t("analytics.buy") : t("analytics.sell")}
        </span>
      ),
    },
    {
      header: t("analytics.lotSize"),
      accessorKey: "lot_size",
      cell: (row) => (
        <span className="text-slate-300">{row.lot_size?.toFixed(2)}</span>
      ),
    },
    {
      header: t("analytics.open"),
      accessorKey: "open_price",
      cell: (row) => (
        <span className="text-slate-300">{row.open_price?.toFixed(2)}</span>
      ),
    },
    {
      header: t("analytics.close"),
      accessorKey: "close_price",
      cell: (row) => (
        <span className="text-slate-300">
          {row.close_price ? row.close_price.toFixed(2) : "-"}
        </span>
      ),
    },
    {
      header: t("analytics.profit"),
      accessorKey: "profit",
      cell: (row) => (
        <span
          className={`font-medium ${row.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}
        >
          {row.profit >= 0 ? "+" : ""}${row.profit?.toFixed(2)}
        </span>
      ),
    },
  ];

  // Loading state
  if (isLoadingAnalytics && !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">
          {t("analytics.loading") || "Loading analytics..."}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t("analytics.title")}
          </h1>
          <p className="text-slate-400">{t("analytics.subtitle")}</p>
        </div>
        <Select
          value={selectedAccount}
          onValueChange={(value) => {
            setSelectedAccount(value);
            // Update URL to reflect selected account
            const params = new URLSearchParams(window.location.search);
            if (value === "all") {
              params.delete("account");
            } else {
              params.set("account", value);
            }
            window.history.replaceState(
              {},
              "",
              `${window.location.pathname}${params.toString() ? "?" + params.toString() : ""}`,
            );
          }}
        >
          <SelectTrigger className="w-[280px] bg-slate-900 border-slate-800 text-white">
            <SelectValue placeholder={t("analytics.selectAccount")} />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white">
            <SelectItem value="all" className="text-white">
              {t("analytics.allAccounts")}
            </SelectItem>
            {accounts.map((acc) => {
              const accChallenge = acc.challenge || {};
              const accInitialBalance =
                acc.initialBalance || accChallenge.accountSize || 0;
              const accPlatform = accChallenge.platform || "MT5";
              return (
                <SelectItem key={acc.id} value={acc.id} className="text-white">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      ${accInitialBalance?.toLocaleString()}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400 text-xs">
                      {accPlatform}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <StatsCard
          title={t("analytics.totalTrades")}
          value={statistics.totalTrades}
          icon={BarChart3}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatsCard
          title={t("analytics.winRate")}
          value={`${statistics.winRate.toFixed(1)}%`}
          icon={Target}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatsCard
          title={t("analytics.totalProfit")}
          value={`${statistics.totalProfit >= 0 ? "+" : ""}$${statistics.totalProfit.toFixed(2)}`}
          icon={statistics.totalProfit >= 0 ? TrendingUp : TrendingDown}
          gradient={
            statistics.totalProfit >= 0
              ? "from-emerald-500 to-green-500"
              : "from-red-500 to-pink-500"
          }
        />
        <StatsCard
          title={t("analytics.profitFactor")}
          value={
            statistics.profitFactor > 0
              ? statistics.profitFactor.toFixed(2)
              : statistics.losingTrades === 0 && statistics.winningTrades > 0
                ? "∞"
                : "0.00"
          }
          icon={Percent}
          gradient="from-purple-500 to-pink-500"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 p-4">
          <p className="text-sm text-slate-400 mb-1">
            {t("analytics.winningTrades")}
          </p>
          <p className="text-xl sm:text-2xl font-bold text-emerald-400">
            {statistics.winningTrades}
          </p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-4">
          <p className="text-sm text-slate-400 mb-1">
            {t("analytics.losingTrades")}
          </p>
          <p className="text-xl font-bold text-red-400">
            {statistics.losingTrades}
          </p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-4">
          <p className="text-sm text-slate-400 mb-1">
            {t("analytics.bestTrade")}
          </p>
          <p className="text-lg sm:text-xl md:text-2xl font-bold text-emerald-400">
            +${statistics.bestTrade.toFixed(2)}
          </p>
        </Card>
        <Card className="bg-slate-900 border-slate-800 p-4">
          <p className="text-sm text-slate-400 mb-1">
            {t("analytics.worstTrade")}
          </p>
          <p className=" text-lg   sm:text-xl md:text-2xl font-bold text-red-400">
            ${statistics.worstTrade.toFixed(2)}
          </p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <EquityCurve data={equityCurveData} startingBalance={startingBalance} />
        <DailyPnLChart data={dailyPnLData} />
      </div>

      {/* Symbol Distribution & More Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <Card className="bg-slate-900 border-slate-800 p-4 md:p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            {t("analytics.symbolDistribution")}
          </h3>
          {symbolDistribution.length > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={symbolDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {symbolDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1e293b",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      labelStyle={{ color: "#fff" }}
                      itemStyle={{ color: "#fff" }}
                    />
                  </RechartsPie>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                {symbolDistribution.map((item, i) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-slate-400">{item.name}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-slate-400">
              {t("analytics.noData") || "No symbol distribution data"}
            </div>
          )}
        </Card>

        <div className="lg:col-span-2">
          <PerformanceMetrics
            metrics={{
              totalTrades: statistics.totalTrades,
              winningTrades: statistics.winningTrades,
              losingTrades: statistics.losingTrades,
              winRate: statistics.winRate,
              profitFactor: statistics.profitFactor,
              avgWin: statistics.avgWin,
              avgLoss: statistics.avgLoss,
              bestTrade: statistics.bestTrade,
              worstTrade: statistics.worstTrade,
            }}
          />
        </div>
      </div>

      {/* Trade History */}
      <Card className="bg-slate-900 border-slate-800 p-4 md:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t("analytics.tradeHistory")}
        </h3>
        <DataTable
          columns={tradeColumns}
          data={displayTrades}
          emptyMessage={t("analytics.noTrades")}
        />
      </Card>
    </div>
  );
}
