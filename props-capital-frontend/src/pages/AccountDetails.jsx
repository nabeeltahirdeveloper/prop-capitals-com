import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/auth";
import {
  getUserAccounts,
  getAccountById,
  getAccountSummary,
  getAccountRules,
  getAnalytics,
} from "@/api/accounts";
import { getAccountTrades } from "@/api/trades";
import { useTranslation } from "../contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatusBadge from "../components/shared/StatusBadge";
import ProgressRing from "../components/shared/ProgressRing";
import EquityChart from "@/components/charts/EquityChart";
import DailyPnLChart from "@/components/charts/DailyPnLChart";
import DataTable from "../components/shared/DataTable";
import RuleComplianceWidget from "@/components/trading/RuleComplianceWidget";
import OpenPositionsWidget from "@/components/trading/OpenPositionsWidget";
import ViolationAlert from "@/components/trading/ViolationAlert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  Wallet,
  Target,
  Shield,
  Clock,
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Award,
  DollarSign,
  Activity,
  AlertCircle,
  XCircle,
  Check,
  X,
  Info,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ChevronRight,
  Copy,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

export default function AccountDetails() {
  const { t } = useTranslation();
  const [selectedAccountId, setSelectedAccountId] = useState(null);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["user", "me"],
    queryFn: getCurrentUser,
    retry: false,
  });

  // Get all user accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
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
  });

  // Set default account from URL params or first account (only on initial load)
  useEffect(() => {
    if (selectedAccountId) return; // Don't override if already set

    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("id");

    if (idFromUrl && accounts.length > 0) {
      // Check if the account from URL exists in user's accounts
      const accountExists = accounts.find((acc) => acc.id === idFromUrl);
      if (accountExists) {
        setSelectedAccountId(idFromUrl);
        return;
      }
    }

    // If no URL param or account not found, use first account
    if (accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // Get account details
  const {
    data: accountData,
    isLoading: accountLoading,
    error: accountError,
  } = useQuery({
    queryKey: ["trading-account", selectedAccountId],
    queryFn: async () => {
      if (!selectedAccountId) return null;
      try {
        return await getAccountById(selectedAccountId);
      } catch (error) {
        console.error("Failed to fetch account details:", error);
        return null;
      }
    },
    enabled: !!selectedAccountId,
    retry: false,
  });

  // Get account summary
  const { data: summaryData } = useQuery({
    queryKey: ["trading-account-summary", selectedAccountId],
    queryFn: async () => {
      if (!selectedAccountId) return null;
      try {
        return await getAccountSummary(selectedAccountId);
      } catch (error) {
        console.error("Failed to fetch account summary:", error);
        return null;
      }
    },
    enabled: !!selectedAccountId,
    retry: false,
  });

  // Get rule compliance
  const { data: rulesData } = useQuery({
    queryKey: ["trading-account-rules", selectedAccountId],
    queryFn: async () => {
      if (!selectedAccountId) return null;
      try {
        return await getAccountRules(selectedAccountId);
      } catch (error) {
        console.error("Failed to fetch account rules:", error);
        return null;
      }
    },
    enabled: !!selectedAccountId,
    retry: false,
  });

  // Get account trades
  const { data: tradesData = [] } = useQuery({
    queryKey: ["account-trades", selectedAccountId],
    queryFn: async () => {
      if (!selectedAccountId) return [];
      try {
        return await getAccountTrades(selectedAccountId);
      } catch (error) {
        console.error("Failed to fetch account trades:", error);
        return [];
      }
    },
    enabled: !!selectedAccountId,
    retry: false,
  });

  // Get analytics data for statistics
  const { data: analyticsData } = useQuery({
    queryKey: ["account-analytics", user?.userId, selectedAccountId],
    queryFn: async () => {
      if (!user?.userId || !selectedAccountId) return null;
      try {
        return await getAnalytics(user.userId, selectedAccountId);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
        return null;
      }
    },
    enabled: !!user?.userId && !!selectedAccountId,
    retry: false,
  });

  // Map backend accounts to display format for dropdown
  const displayAccounts = (accounts || []).map((account) => {
    const challenge = account.challenge || {};
    const phaseMap = {
      PHASE1: "phase1",
      PHASE2: "phase2",
      FUNDED: "funded",
      FAILED: "failed",
    };
    return {
      id: account.id,
      account_number: account.brokerLogin || account.id.slice(0, 8),
      platform: account.platform || challenge.platform || "MT5",
      initial_balance: account.initialBalance || challenge.accountSize || 0,
      current_phase:
        phaseMap[account.phase] || account.phase?.toLowerCase() || "phase1",
    };
  });

  // Loading state
  if (accountsLoading || accountLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">{t("accountDetails.loading")}</div>
      </div>
    );
  }

  // No accounts state
  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-base sm:text-2xl font-bold text-white">
              {t("accountDetails.title")}
            </h1>
            <p className="text-slate-400">{t("accountDetails.subtitle")}</p>
          </div>
        </div>
        <Card className="bg-slate-900 border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {t("accountDetails.noAccounts")}
          </h3>
          <p className="text-slate-400 mb-6">
            {t("accountDetails.noAccountsDesc") ||
              "Purchase a challenge to view your account details and trading dashboard."}
          </p>
          <Link to={createPageUrl("TraderBuyChallenge")}>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500">
              {t("accountDetails.purchaseChallenge")}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  // If no account selected yet, show selector
  if (!selectedAccountId || !accountData) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("MyAccounts")}>
              <Button
                variant="ghost"
                size="icon"
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5 hover:text-black" />
              </Button>
            </Link>
            <div>
              <h1 className="text-base sm:text-2xl font-bold text-white">
                {t("accountDetails.title")}
              </h1>
              <p className="text-slate-400">
                {t("accountDetails.selectAccountDesc")}
              </p>
            </div>
          </div>
          <Select
            value={selectedAccountId || ""}
            onValueChange={(value) => {
              setSelectedAccountId(value);
              // Update URL immediately when dropdown changes
              const params = new URLSearchParams(window.location.search);
              params.set("id", value);
              window.history.replaceState(
                {},
                "",
                `${window.location.pathname}?${params.toString()}`,
              );
            }}
          >
            <SelectTrigger className="w-[280px] bg-slate-900 border-slate-800 text-white">
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <SelectValue placeholder={t("accountDetails.selectAccount")} />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white">
              {displayAccounts.map((acc) => {
                const phaseTranslations = {
                  phase1: t("accountDetails.phase1"),
                  phase2: t("accountDetails.phase2"),
                  funded: t("accountDetails.funded"),
                  failed: t("accountDetails.failed"),
                };
                return (
                  <SelectItem
                    key={acc.id}
                    value={acc.id}
                    className="text-white hover:bg-slate-700 focus:bg-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        ${acc.initial_balance?.toLocaleString()}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400 text-xs">
                        {acc.platform}
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs text-emerald-400">
                        {phaseTranslations[acc.current_phase] ||
                          acc.current_phase}
                      </span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }

  // Map backend data to frontend format
  const challenge = accountData.challenge || {};
  const metrics = summaryData?.metrics || rulesData?.metrics || {};
  const challengeRules =
    summaryData?.challengeRules || rulesData?.challengeRules || challenge;

  const phaseMap = {
    PHASE1: "phase1",
    PHASE2: "phase2",
    FUNDED: "funded",
    FAILED: "failed",
  };
  const statusMap = {
    ACTIVE: "active",
    PAUSED: "paused",
    CLOSED: "closed",
  };

  console.log("🔍 Account Details Platform Debug:", {
    accountData_platform: accountData.platform,
    challenge_platform: challenge.platform,
    final_platform: accountData.platform || challenge.platform || "MT5",
    account_id: accountData.id,
  });

  const account = {
    id: accountData.id,
    account_number: accountData.brokerLogin || accountData.id.slice(0, 8),
    platform: accountData.platform || challenge.platform || "MT5",
    server: "Prop Capitals-Live",
    status:
      statusMap[accountData.status] ||
      accountData.status?.toLowerCase() ||
      "active",
    current_phase:
      phaseMap[accountData.phase] ||
      accountData.phase?.toLowerCase() ||
      "phase1",
    initial_balance: accountData.initialBalance || challenge.accountSize || 0,
    current_balance: accountData.balance || accountData.initialBalance || 0,
    current_equity:
      accountData.equity ||
      accountData.balance ||
      accountData.initialBalance ||
      0,
    floating_pl: (accountData.equity || 0) - (accountData.balance || 0),
    current_profit_percent: metrics.profitPercent || 0,
    daily_drawdown_percent: metrics.dailyDrawdownPercent || 0,
    overall_drawdown_percent: metrics.overallDrawdownPercent || 0,
    trading_days_count:
      metrics.tradingDaysCompleted || accountData.tradingDaysCount || 0,
    start_date: accountData.createdAt || new Date().toISOString(),
    profit_target:
      accountData.phase === "PHASE2"
        ? challengeRules.phase2TargetPercent ||
          challenge.phase2TargetPercent ||
          5
        : challengeRules.phase1TargetPercent ||
          challenge.phase1TargetPercent ||
          8,
    max_daily_dd:
      challengeRules.dailyDrawdownPercent ||
      challenge.dailyDrawdownPercent ||
      5,
    max_overall_dd:
      challengeRules.overallDrawdownPercent ||
      challenge.overallDrawdownPercent ||
      10,
    min_trading_days:
      challengeRules.minTradingDays || challenge.minTradingDays || 4,
    leverage: "1:100",
    news_trading_allowed:
      challengeRules.newsTradingAllowed ?? challenge.newsTradingAllowed ?? true,
    weekend_holding_allowed:
      challengeRules.weekendHoldingAllowed ??
      challenge.weekendHoldingAllowed ??
      true,
    ea_allowed: challengeRules.eaAllowed ?? challenge.eaAllowed ?? true,
  };

  // Get trades from account data or summary
  const trades = (tradesData || []).map((trade) => {
    const tradeTypeMap = {
      BUY: "buy",
      SELL: "sell",
    };
    return {
      id: trade.id,
      symbol: trade.symbol || "EURUSD",
      type: tradeTypeMap[trade.type] || trade.type?.toLowerCase() || "buy",
      lot_size: trade.volume || trade.lotSize || 0.1,
      open_price: trade.openPrice || 0,
      close_price: trade.closePrice || null,
      profit: trade.profit || 0,
      open_time: trade.openedAt
        ? format(new Date(trade.openedAt), "yyyy-MM-dd HH:mm")
        : new Date().toISOString(),
      close_time: trade.closedAt
        ? format(new Date(trade.closedAt), "yyyy-MM-dd HH:mm")
        : null,
      status: trade.closePrice || trade.closedAt ? "closed" : "open",
    };
  });

  // Get equity history from summary or analytics
  const equityHistory =
    summaryData?.equityHistory ||
    accountData.equityShots ||
    analyticsData?.equityCurve ||
    [];
  const equityMetrics =
    equityHistory.length > 0
      ? equityHistory.map((shot) => ({
          date: shot.timestamp || shot.createdAt || shot.date,
          ending_equity: shot.equity || shot.balance || account.current_equity,
          daily_profit: shot.pnl || shot.daily_profit || 0,
        }))
      : [];

  const dailyPnLHistory =
    accountData.analytics?.dailyPnL ||
    analyticsData?.dailyPnL ||
    summaryData?.dailyPnL ||
    [];
  const profitMetrics =
    dailyPnLHistory.length > 0
      ? dailyPnLHistory.map((item) => ({
          date: item.date || item.timestamp || item.createdAt,
          pnl: item.pnl || item.profit || item.daily_profit || 0,
        }))
      : [];

  const profitProgress = Math.max(
    0,
    Math.min(
      (account.current_profit_percent / account.profit_target) * 100,
      100,
    ),
  );
  const dailyDDUsed =
    (account.daily_drawdown_percent / account.max_daily_dd) * 100;
  const overallDDUsed =
    (account.overall_drawdown_percent / account.max_overall_dd) * 100;

  // Calculate stats from analytics or trades data
  const analyticsStats = analyticsData?.statistics || {};
  const closedTrades = (tradesData || []).filter(
    (t) => t.closePrice || t.closedAt,
  );

  // Calculate stats from trades if analytics not available
  const calculatedStats =
    closedTrades.length > 0
      ? (() => {
          const winningTrades = closedTrades.filter((t) => (t.profit || 0) > 0);
          const losingTrades = closedTrades.filter((t) => (t.profit || 0) < 0);
          const totalTrades = closedTrades.length;
          const winRate =
            totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

          const winningProfits = winningTrades.map((t) => t.profit || 0);
          const losingProfits = losingTrades.map((t) => t.profit || 0);

          const largestWin =
            winningProfits.length > 0 ? Math.max(...winningProfits) : 0;
          const largestLoss =
            losingProfits.length > 0 ? Math.min(...losingProfits) : 0;

          const grossProfit = winningTrades.reduce(
            (sum, t) => sum + (t.profit || 0),
            0,
          );
          const grossLoss = Math.abs(
            losingTrades.reduce((sum, t) => sum + (t.profit || 0), 0),
          );

          const avgWin =
            winningTrades.length > 0 ? grossProfit / winningTrades.length : 0;
          const avgLoss =
            losingTrades.length > 0 ? grossLoss / losingTrades.length : 0;

          const profitFactor =
            grossLoss > 0
              ? grossProfit / grossLoss
              : grossProfit > 0
                ? 99.99
                : 0;
          const avgRR = avgLoss > 0 ? avgWin / avgLoss : 0;

          const avgTradeSize =
            closedTrades.length > 0
              ? closedTrades.reduce(
                  (sum, t) => sum + (t.volume || t.lotSize || 0),
                  0,
                ) / closedTrades.length
              : 0;

          // Calculate average duration
          const durations = closedTrades
            .filter((t) => t.openedAt && t.closedAt)
            .map((t) => {
              const opened = new Date(t.openedAt);
              const closed = new Date(t.closedAt);
              return closed - opened;
            });
          const avgDurationMs =
            durations.length > 0
              ? durations.reduce((sum, d) => sum + d, 0) / durations.length
              : 0;
          const hours = Math.floor(avgDurationMs / (1000 * 60 * 60));
          const minutes = Math.floor(
            (avgDurationMs % (1000 * 60 * 60)) / (1000 * 60),
          );
          const avgDuration =
            avgDurationMs > 0 ? `${hours}h ${minutes}m` : "0h 0m";

          return {
            winRate,
            avgRR,
            totalTrades,
            avgTradeSize,
            largestWin,
            largestLoss,
            profitFactor,
            avgDuration,
          };
        })()
      : {};

  // Use analytics stats from account response if available, otherwise fallback to calculated stats
  const integratedStats = accountData.analytics?.statistics || {};
  const stats = {
    winRate:
      integratedStats.winRate ??
      analyticsStats.winRate ??
      calculatedStats.winRate ??
      0,
    avgRR:
      integratedStats.avgRR ??
      analyticsStats.avgRR ??
      calculatedStats.avgRR ??
      0,
    totalTrades:
      integratedStats.totalTrades ??
      analyticsStats.totalTrades ??
      calculatedStats.totalTrades ??
      0,
    avgTradeSize:
      integratedStats.avgTradeSize ?? calculatedStats.avgTradeSize ?? 0,
    largestWin:
      integratedStats.bestTrade ??
      analyticsStats.bestTrade ??
      calculatedStats.largestWin ??
      0,
    largestLoss:
      integratedStats.worstTrade ??
      analyticsStats.worstTrade ??
      calculatedStats.largestLoss ??
      0,
    profitFactor:
      integratedStats.profitFactor ??
      analyticsStats.profitFactor ??
      calculatedStats.profitFactor ??
      0,
    avgDuration:
      integratedStats.avgDuration ?? calculatedStats.avgDuration ?? "0h 0m",
  };

  // Build rule compliance from rules data
  const ruleCompliance = rulesData
    ? [
        {
          rule: t("accountDetails.dailyDrawdown"),
          status:
            metrics.dailyDrawdownPercent <= challengeRules.dailyDrawdownPercent
              ? "ok"
              : "violated",
          value: `${metrics.dailyDrawdownPercent?.toFixed(2) || 0}%`,
          limit: `${challengeRules.dailyDrawdownPercent || 5}%`,
        },
        {
          rule: t("accountDetails.overallDrawdown"),
          status:
            metrics.overallDrawdownPercent <=
            challengeRules.overallDrawdownPercent
              ? "ok"
              : "violated",
          value: `${metrics.overallDrawdownPercent?.toFixed(2) || 0}%`,
          limit: `${challengeRules.overallDrawdownPercent || 10}%`,
        },
        {
          rule: t("accountDetails.minTradingDays"),
          status:
            metrics.tradingDaysCompleted >= challengeRules.minTradingDays
              ? "completed"
              : "pending",
          value: `${metrics.tradingDaysCompleted || 0} ${t("accountDetails.days")}`,
          limit: `${challengeRules.minTradingDays || 4} ${t("accountDetails.days")}`,
        },
        {
          rule: t("accountDetails.newsTrading"),
          status: "ok",
          value: t("accountDetails.compliant"),
          limit: t("accountDetails.allowed"),
        },
        {
          rule: t("accountDetails.weekendHolding"),
          status: "ok",
          value: t("accountDetails.compliant"),
          limit: t("accountDetails.allowed"),
        },
      ]
    : [
        {
          rule: t("accountDetails.dailyDrawdown"),
          status:
            account.daily_drawdown_percent <= account.max_daily_dd
              ? "ok"
              : "violated",
          value: `${account.daily_drawdown_percent}%`,
          limit: `${account.max_daily_dd}%`,
        },
        {
          rule: t("accountDetails.overallDrawdown"),
          status:
            account.overall_drawdown_percent <= account.max_overall_dd
              ? "ok"
              : "violated",
          value: `${account.overall_drawdown_percent}%`,
          limit: `${account.max_overall_dd}%`,
        },
        {
          rule: t("accountDetails.minTradingDays"),
          status:
            account.trading_days_count >= account.min_trading_days
              ? "completed"
              : "pending",
          value: `${account.trading_days_count} ${t("accountDetails.days")}`,
          limit: `${account.min_trading_days} ${t("accountDetails.days")}`,
        },
        {
          rule: t("accountDetails.newsTrading"),
          status: "ok",
          value: t("accountDetails.compliant"),
          limit: t("accountDetails.allowed"),
        },
        {
          rule: t("accountDetails.weekendHolding"),
          status: "ok",
          value: t("accountDetails.compliant"),
          limit: t("accountDetails.allowed"),
        },
      ];

  const tradeColumns = [
    {
      header: t("accountDetails.time"),
      accessorKey: "open_time",
      cell: (row) => (
        <span className="text-slate-300 text-sm">{row.open_time}</span>
      ),
    },
    {
      header: t("accountDetails.symbol"),
      accessorKey: "symbol",
      cell: (row) => (
        <span className="text-white font-medium">{row.symbol}</span>
      ),
    },
    {
      header: t("accountDetails.type"),
      accessorKey: "type",
      cell: (row) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${row.type === "buy" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
        >
          {row.type === "buy"
            ? t("accountDetails.buy").toUpperCase()
            : t("accountDetails.sell").toUpperCase()}
        </span>
      ),
    },
    {
      header: t("accountDetails.lots"),
      accessorKey: "lot_size",
      cell: (row) => (
        <span className="text-slate-300">{row.lot_size?.toFixed(2)}</span>
      ),
    },
    {
      header: t("accountDetails.open"),
      accessorKey: "open_price",
      cell: (row) => (
        <span className="text-slate-300">{row.open_price?.toFixed(2)}</span>
      ),
    },
    {
      header: t("accountDetails.close"),
      accessorKey: "close_price",
      cell: (row) => (
        <span className="text-slate-300">
          {row.close_price ? row.close_price.toFixed(2) : "-"}
        </span>
      ),
    },
    {
      header: t("accountDetails.pl"),
      accessorKey: "profit",
      cell: (row) => (
        <span
          className={`font-medium ${row.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}
        >
          {row.profit >= 0 ? "+" : ""}${row.profit?.toFixed(2)}
        </span>
      ),
    },
    {
      header: t("accountDetails.status"),
      accessorKey: "status",
      cell: (row) => (
        <Badge
          className={
            row.status === "open"
              ? "bg-blue-500/20 text-blue-400"
              : "bg-slate-500/20 text-slate-400"
          }
        >
          {row.status === "open"
            ? t("accountDetails.open")
            : t("accountDetails.closed")}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl("MyAccounts")}>
            <Button variant="ghost" size="icon" className="text-slate-400">
              <ArrowLeft className="w-5 h-5 hover:text-black" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-base sm:text-2xl font-bold text-white">
                ${account.initial_balance?.toLocaleString()}{" "}
                {t("accountDetails.account")}
              </h1>
              <StatusBadge status={account.current_phase} />
              <StatusBadge status={account.status} />
            </div>
            <div className="flex items-center gap-4 text-[10px] sm:text-sm text-slate-400 mt-1">
              <span>{account.platform}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                #{account.account_number}
                <button className="hover:text-white">
                  <Copy className="w-3 h-3" />
                </button>
              </span>
              <span>•</span>
              <span>
                {t("accountDetails.started")}{" "}
                {format(new Date(account.start_date), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        </div>
        {/* Account Selector Dropdown */}
        <Select
          value={selectedAccountId}
          onValueChange={(value) => {
            setSelectedAccountId(value);
            // Update URL immediately when dropdown changes
            const params = new URLSearchParams(window.location.search);
            params.set("id", value);
            window.history.replaceState(
              {},
              "",
              `${window.location.pathname}?${params.toString()}`,
            );
          }}
        >
          <SelectTrigger className="w-[280px] bg-slate-900 border-slate-800 text-white">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <SelectValue placeholder={t("accountDetails.selectAccount")} />
            </div>
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white [&>svg]:text-white">
            {displayAccounts.map((acc) => {
              const phaseTranslations = {
                phase1: t("accountDetails.phase1"),
                phase2: t("accountDetails.phase2"),
                funded: t("accountDetails.funded"),
                failed: t("accountDetails.failed"),
              };
              return (
                <SelectItem
                  key={acc.id}
                  value={acc.id}
                  className=" text-white
                          hover:text-white
                          focus:text-white
                          data-[highlighted]:text-white
                          data-[state=checked]:text-white
                          hover:bg-slate-700
                          focus:bg-slate-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      ${acc.initial_balance?.toLocaleString()}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400 text-xs">
                      {acc.platform}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs text-emerald-400">
                      {phaseTranslations[acc.current_phase] ||
                        acc.current_phase}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Violation Alert */}
      {account.status === "failed" && <ViolationAlert account={account} />}

      {/* Phase Progress Alert */}
      {profitProgress >= 100 &&
        account.trading_days_count >= account.min_trading_days &&
        account.status !== "failed" && (
          <Card className="bg-emerald-500/10 border-emerald-500/30 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-emerald-400">
                    {t("accountDetails.phase1Completed")}
                  </h3>
                  <p className="text-slate-300">
                    {t("accountDetails.phase1CompletedDesc")}
                  </p>
                </div>
              </div>
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                {t("accountDetails.proceedToPhase2")}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        )}

      {/* Account Summary - Top Section */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Financial Metrics */}
        <Card className="bg-slate-900 border-slate-800 p-6 lg:col-span-3">
          <h3 className="text-lg font-semibold text-white mb-6">
            {t("accountDetails.accountSummary")}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            <div>
              <p className="text-sm text-slate-400 mb-1">
                {t("accountDetails.balance")}
              </p>
              <p className="text-base sm:text-2xl font-bold text-white">
                ${account.current_balance?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">
                {t("accountDetails.equity")}
              </p>
              <p className="text-base sm:text-2xl font-bold text-white">
                ${account.current_equity?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">
                {t("accountDetails.floatingPL")}
              </p>
              <p
                className={`text-base sm:text-2xl font-bold  ${account.floating_pl >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                {account.floating_pl >= 0 ? "+" : ""}${account.floating_pl}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400 mb-1">
                {t("accountDetails.totalProfit")}
              </p>
              <p
                className={`text-base sm:text-2xl font-bold  ${account.current_profit_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}
              >
                +$
                {(
                  account.current_balance - account.initial_balance
                ).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mt-6 pt-6 border-t border-slate-800">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">
                  {t("accountDetails.profitTarget")}
                </span>
                <span className="text-emerald-400">
                  {account.current_profit_percent?.toFixed(2)}% /{" "}
                  {account.profit_target}%
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${profitProgress}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">
                  {t("accountDetails.dailyDrawdown")}
                </span>
                <span
                  className={dailyDDUsed > 80 ? "text-amber-400" : "text-white"}
                >
                  {account.daily_drawdown_percent?.toFixed(2)}% /{" "}
                  {account.max_daily_dd}%
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${dailyDDUsed > 80 ? "bg-amber-500" : "bg-slate-600"}`}
                  style={{ width: `${dailyDDUsed}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">
                  {t("accountDetails.overallDrawdown")}
                </span>
                <span
                  className={overallDDUsed > 80 ? "text-red-400" : "text-white"}
                >
                  {account.overall_drawdown_percent?.toFixed(2)}% /{" "}
                  {account.max_overall_dd}%
                </span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${overallDDUsed > 80 ? "bg-red-500" : "bg-slate-600"}`}
                  style={{ width: `${overallDDUsed}%` }}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Profit Target Ring */}
        <Card className="bg-slate-900 border-slate-800 p-6 flex flex-col items-center justify-center">
          <ProgressRing
            progress={profitProgress}
            value={account.current_profit_percent}
            size={140}
            color={profitProgress >= 100 ? "#10b981" : "#06b6d4"}
            label={t("accountDetails.target")}
          />
          <p className="text-slate-400 text-sm mt-4">
            {t("accountDetails.tradingDays")}: {account.trading_days_count}/
            {account.min_trading_days}
          </p>
        </Card>
      </div>

      {/* Open Positions */}
      <OpenPositionsWidget trades={trades} />

      {/* Challenge Rules & Compliance */}
      <RuleComplianceWidget account={account} />

      {/* Charts */}
      {(equityMetrics.length > 0 || profitMetrics.length > 0) && (
        <div className="grid lg:grid-cols-2 gap-6">
          <EquityChart
            data={equityMetrics}
            title={t("accountDetails.equityCurve")}
          />
          <DailyPnLChart
            data={profitMetrics.length > 0 ? profitMetrics : null}
          />
        </div>
      )}

      {/* Performance Stats */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-6">
          {t("accountDetails.performanceStatistics")}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <div className="text-center p-4 bg-slate-800/50 rounded-xl">
            <p className="text-xl sm:text-3xl font-bold text-emerald-400">
              {stats.winRate.toFixed(2)}%
            </p>
            <p className="text-sm text-slate-400">
              {t("accountDetails.winRate")}
            </p>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-xl">
            <p className="text-lg sm:text-3xl font-bold text-cyan-400">
              {stats.avgRR.toFixed(2)}
            </p>
            <p className="text-sm text-slate-400">
              {t("accountDetails.avgRiskReward")}
            </p>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-xl">
            <p className="text-lg sm:text-3xl font-bold text-white">
              {stats.totalTrades}
            </p>
            <p className="text-sm text-slate-400">
              {t("accountDetails.totalTrades")}
            </p>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-xl">
            <p className="text-lg sm:text-3xl font-bold text-purple-400">
              {stats.profitFactor > 0 ? stats.profitFactor.toFixed(2) : "0.00"}
            </p>
            <p className="text-sm text-slate-400">
              {t("accountDetails.profitFactor")}
            </p>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-xl">
            <p className="text-lg sm:text-3xl font-bold text-emerald-400">
              {stats.largestWin >= 0 ? "+" : ""}$
              {Math.abs(stats.largestWin).toFixed(2)}
            </p>
            <p className="text-sm text-slate-400">
              {t("accountDetails.largestWin")}
            </p>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-xl">
            <p className="text-lg sm:text-3xl font-bold text-red-400">
              -${Math.abs(stats.largestLoss).toFixed(2)}
            </p>
            <p className="text-sm text-slate-400">
              {t("accountDetails.largestLoss")}
            </p>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-xl">
            <p className="text-lg sm:text-3xl font-bold text-white">
              {stats.avgTradeSize.toFixed(2)}
            </p>
            <p className="text-sm text-slate-400">
              {t("accountDetails.avgLotSize")}
            </p>
          </div>
          <div className="text-center p-4 bg-slate-800/50 rounded-xl">
            <p className="text-lg sm:text-3xl font-bold text-white">
              {stats.avgDuration}
            </p>
            <p className="text-sm text-slate-400">
              {t("accountDetails.avgDuration")}
            </p>
          </div>
        </div>
      </Card>

      {/* Trades History */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">
            {t("accountDetails.tradeHistory")}
          </h3>
          <Button variant="outline" size="sm" className="border-slate-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            {t("accountDetails.refresh")}
          </Button>
        </div>
        <DataTable
          columns={tradeColumns}
          data={trades}
          emptyMessage={t("accountDetails.noTradesFound")}
        />
        <div className="mt-4 flex justify-center">
          <Link to={createPageUrl("TradeHistory")}>
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700 hover:text-white"
            >
              {t("accountDetails.viewFullTradeHistory")}
              <ExternalLink className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <Link to={createPageUrl("ChallengeProgress")}>
          <Card className="bg-slate-900 border-slate-800 p-4 hover:border-cyan-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {t("accountDetails.challengeProgress")}
                </p>
                <p className="text-xs text-slate-400">
                  {t("accountDetails.trackJourney")}
                </p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to={createPageUrl("Analytics")}>
          <Card className="bg-slate-900 border-slate-800 p-4 hover:border-emerald-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {t("accountDetails.analytics")}
                </p>
                <p className="text-xs text-slate-400">
                  {t("accountDetails.detailedStats")}
                </p>
              </div>
            </div>
          </Card>
        </Link>
        <Link to={createPageUrl("Rules")}>
          <Card className="bg-slate-900 border-slate-800 p-4 hover:border-purple-500/50 transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">
                  {t("accountDetails.tradingRules")}
                </p>
                <p className="text-xs text-slate-400">
                  {t("accountDetails.viewAllRules")}
                </p>
              </div>
            </div>
          </Card>
        </Link>
      </div>
    </div>
  );
}
