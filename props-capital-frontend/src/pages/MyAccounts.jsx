import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useQuery } from "@tanstack/react-query";
import { getCurrentUser } from "@/api/auth";
import { getUserAccounts } from "@/api/accounts";
import { useTranslation } from "../contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import StatusBadge from "../components/shared/StatusBadge";
import ProgressRing from "../components/shared/ProgressRing";
import {
  TrendingUp,
  Plus,
  Eye,
  Copy,
  Check,
  Shield,
  Target,
  Clock,
  Award,
  AlertTriangle,
  DollarSign,
  Activity,
  Filter,
  ChevronRight,
  BarChart3,
} from "lucide-react";

// Helper function to translate violation messages
const translateViolationMessage = (violationReason, t) => {
  if (!violationReason) return "";

  // Parse messages like "Daily drawdown exceeded: 9.99% > 5%"
  // or "Overall drawdown exceeded: 10.5% > 10%"
  const dailyMatch = violationReason.match(
    /Daily drawdown exceeded:\s*([\d.]+)%\s*>\s*([\d.]+)%/i,
  );
  const overallMatch = violationReason.match(
    /(?:Overall|Maximum) drawdown exceeded:\s*([\d.]+)%\s*>\s*([\d.]+)%/i,
  );
  const maxDaysMatch = violationReason.match(/Maximum trading days/i);

  if (dailyMatch) {
    return t("dashboard.accounts.violation.dailyDrawdown", {
      actual: dailyMatch[1],
      threshold: dailyMatch[2],
    });
  } else if (overallMatch) {
    return t("dashboard.accounts.violation.overallDrawdown", {
      actual: overallMatch[1],
      threshold: overallMatch[2],
    });
  } else if (maxDaysMatch) {
    return t("dashboard.accounts.violation.maxTradingDays");
  }

  // Fallback to original message if pattern doesn't match
  return violationReason;
};

export default function MyAccounts() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("all");
  const [copiedId, setCopiedId] = useState(null);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["user", "me"],
    queryFn: getCurrentUser,
    retry: false,
  });

  // Get user's trading accounts
  const { data: accounts = [], isLoading } = useQuery({
    queryKey: ["trading-accounts", user?.userId],
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
    refetchInterval: 30000, // Poll every 30 seconds to catch closed trades and update metrics
    retry: false,
  });

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Map backend accounts to frontend format
  const mappedAccounts = (accounts || []).map((account) => {
    const challenge = account.challenge || {};
    const initialBalance = account.initialBalance || challenge.accountSize || 0;
    const balance = account.balance || initialBalance;
    const equity = account.equity || balance;
    const profitPercent =
      initialBalance > 0
        ? ((equity - initialBalance) / initialBalance) * 100
        : 0;

    // Overall DD: Calculate from maxEquityToDate (peak equity ever reached)
    // This matches the backend calculation in trading-accounts.service.ts
    const maxEquityToDate = account.maxEquityToDate || initialBalance;
    const overallDD =
      maxEquityToDate > 0 && equity < maxEquityToDate
        ? ((maxEquityToDate - equity) / maxEquityToDate) * 100
        : 0;

    // Daily DD: Calculate from todayStartEquity or balance (start of day equity)
    // Use todayStartEquity if available, otherwise fallback to balance
    const todayStartEquity =
      account.todayStartEquity || Math.max(balance, initialBalance);
    const dailyDD =
      todayStartEquity > 0 && equity < todayStartEquity
        ? ((todayStartEquity - equity) / todayStartEquity) * 100
        : 0;

    // Map phase enum to frontend format
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
      DAILY_LOCKED: "dailylocked",
      DISQUALIFIED: "disqualified",
    };

    return {
      id: account.id,
      account_number: account.brokerLogin || account.id.slice(0, 8),
      platform: account.platform || challenge.platform || "MT5",
      status:
        statusMap[account.status] || account.status?.toLowerCase() || "active",
      current_phase:
        phaseMap[account.phase] || account.phase?.toLowerCase() || "phase1",
      challenge_name: challenge.name || challenge.title || null,
      initial_balance: initialBalance,
      current_balance: balance,
      current_equity: equity,
      current_profit_percent: profitPercent,
      daily_drawdown_percent: dailyDD,
      overall_drawdown_percent: overallDD,
      trading_days_count: account.tradingDaysCount,
      created_date: account.createdAt,
      violation_reason: account.lastViolationMessage,
    };
  });

  // Use only real accounts from backend (no mock data fallback)
  const displayAccounts = mappedAccounts;

  const filteredAccounts =
    filter === "all"
      ? displayAccounts
      : displayAccounts.filter((a) => {
          if (filter === "challenges")
            return (
              a.status === "active" &&
              (a.current_phase === "phase1" || a.current_phase === "phase2")
            );
          if (filter === "phase1")
            return a.current_phase === "phase1" && a.status === "active";
          if (filter === "phase2")
            return a.current_phase === "phase2" && a.status === "active";
          if (filter === "funded") return a.current_phase === "funded";
          if (filter === "failed")
            return a.current_phase === "failed" || a.status === "disqualified";
          return true;
        });

  const accountCounts = {
    all: displayAccounts.length,
    challenges: displayAccounts.filter(
      (a) =>
        a.status === "active" &&
        (a.current_phase === "phase1" || a.current_phase === "phase2"),
    ).length,
    phase1: displayAccounts.filter(
      (a) => a.current_phase === "phase1" && a.status === "active",
    ).length,
    phase2: displayAccounts.filter(
      (a) => a.current_phase === "phase2" && a.status === "active",
    ).length,
    funded: displayAccounts.filter((a) => a.current_phase === "funded").length,
    failed: displayAccounts.filter(
      (a) => a.current_phase === "failed" || a.status === "disqualified",
    ).length,
  };

  // Show loading state while fetching accounts
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Skeleton className="h-8 w-48 bg-slate-800 mb-2" />
            <Skeleton className="h-4 w-64 bg-slate-800" />
          </div>
          <Skeleton className="h-10 w-40 bg-slate-800" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 bg-slate-800" />
          ))}
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-96 bg-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {t("myAccounts.title")}
          </h1>
          <p className="text-slate-400">{t("myAccounts.subtitle")}</p>
        </div>
        <Link to={createPageUrl("TraderBuyChallenge")}>
          <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            {t("myAccounts.newChallenge")}
          </Button>
        </Link>
      </div>

      {/* Category Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {[
          {
            key: "challenges",
            label: t("myAccounts.activeChallenges"),
            icon: Activity,
            color: "emerald",
          },
          {
            key: "phase1",
            label: t("myAccounts.phase1"),
            icon: Target,
            color: "blue",
          },
          {
            key: "phase2",
            label: t("myAccounts.phase2"),
            icon: Target,
            color: "purple",
          },
          {
            key: "funded",
            label: t("myAccounts.funded"),
            icon: Award,
            color: "amber",
          },
          {
            key: "failed",
            label: t("myAccounts.failed"),
            icon: AlertTriangle,
            color: "red",
          },
        ].map((cat) => (
          <Card
            key={cat.key}
            className={`bg-slate-900 border-slate-800 p-3 sm:p-4 cursor-pointer transition-all ${filter === cat.key ? "ring-2 ring-emerald-500" : "hover:border-slate-700"}`}
            onClick={() => setFilter(cat.key)}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 bg-${cat.color}-500/20 rounded-lg flex items-center justify-center`}
              >
                <cat.icon className={`w-5 h-5 text-${cat.color}-400`} />
              </div>
              <div>
                <p className="text-lg sm:text-2xl font-bold text-white">
                  {accountCounts[cat.key]}
                </p>
                <p className="text-xs text-slate-400">{cat.label}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex w-full items-center gap-2">
        <Filter className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <Tabs value={filter} onValueChange={setFilter} className="w-full sm:w-auto">
          <TabsList className="flex h-9 w-full flex-1 flex-row gap-0 rounded-lg bg-slate-900 p-0 sm:w-96 border border-slate-800 [&>button]:flex-1 [&>button]:rounded-md [&>button]:px-2 [&>button]:py-1.5 [&>button]:text-xs sm:[&>button]:text-sm">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-white"
            >
              {t("myAccounts.all")} ({accountCounts.all})
            </TabsTrigger>
            <TabsTrigger
              value="challenges"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-white"
            >
              {t("myAccounts.active")}
            </TabsTrigger>
            <TabsTrigger
              value="funded"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-white"
            >
              {t("myAccounts.funded")}
            </TabsTrigger>
            <TabsTrigger
              value="failed"
              className="data-[state=active]:bg-slate-800 data-[state=active]:text-white"
            >
              {t("myAccounts.failed")}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Accounts Grid */}
      {filteredAccounts.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {t("myAccounts.noAccounts")}
          </h3>
          <p className="text-slate-400 mb-6">
            {t("myAccounts.noAccountsDesc")}
          </p>
          <Link to={createPageUrl("TraderBuyChallenge")}>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500">
              {t("myAccounts.startChallenge")}
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredAccounts.map((account) => {
            const profitTarget = account.current_phase === "phase2" ? 5 : 8;
            const profitProgress =
              account.status === "funded"
                ? 100
                : Math.max(
                    0,
                    Math.min(
                      (account.current_profit_percent / profitTarget) * 100,
                      100,
                    ),
                  );
            const dailyDDUsed = (account.daily_drawdown_percent / 5) * 100;
            const overallDDUsed = (account.overall_drawdown_percent / 10) * 100;
            return (
              <Card
                key={account.id}
                className={`bg-slate-900 border-slate-800 overflow-hidden flex flex-col ${account.status === "funded" ? "ring-1 ring-amber-500/50" : ""} ${account.status === "disqualified" ? "opacity-75" : ""}`}
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-800">
                  {/* Row 1: Challenge name */}
                  {account.challenge_name && (
                    <p className="text-sm text-slate-400 mb-1">
                      {account.challenge_name}
                    </p>
                  )}
                  {/* Row 2: Account size + Platform badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl font-bold text-white">
                      ${account.initial_balance?.toLocaleString()}
                    </span>
                    <Badge
                      variant="default"
                      className="text-[10px] px-1.5 py-0.5"
                    >
                      {account.platform}
                    </Badge>
                  </div>
                  {/* Row 3: Phase badge + Status badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <StatusBadge status={account.current_phase} />
                    <StatusBadge status={account.status} />
                  </div>
                  {/* Row 4: Account number */}
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="truncate">#{account.account_number}</span>
                    <button
                      onClick={() =>
                        copyToClipboard(account.account_number, account.id)
                      }
                      className="hover:text-white transition-colors shrink-0"
                    >
                      {copiedId === account.id ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>
                {/* Progress */}
                <div className="p-4 flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="shrink-0">
                      <ProgressRing
                        progress={profitProgress}
                        value={account.current_profit_percent}
                        size={80}
                        strokeWidth={6}
                        color={
                          account.status === "funded"
                            ? "#f59e0b"
                            : account.status === "disqualified"
                              ? "#ef4444"
                              : account.current_profit_percent > 0
                                ? "#10b981"
                                : "#06b6d4"
                        }
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center text-sm mb-1 gap-2">
                        <span className="text-slate-400 shrink-0">
                          {t("myAccounts.balance")}
                        </span>
                        <span className="text-white font-medium truncate">
                          $
                          {account.current_balance?.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm mb-1 gap-2">
                        <span className="text-slate-400 shrink-0">
                          {t("myAccounts.profit")}
                        </span>
                        <span
                          className={`font-medium truncate ${account.current_profit_percent >= 0 ? "text-emerald-400" : "text-red-400"}`}
                        >
                          {account.current_profit_percent >= 0 ? "+" : ""}
                          {account.current_profit_percent?.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm gap-2">
                        <span className="text-slate-400 shrink-0">
                          {t("myAccounts.days")}
                        </span>
                        <span className="text-white">
                          {account.trading_days_count}
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Drawdown Bars */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">
                          {t("myAccounts.dailyDD")}
                        </span>
                        <span
                          className={
                            dailyDDUsed > 80 ? "text-amber-400" : "text-white"
                          }
                        >
                          {account.daily_drawdown_percent?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${dailyDDUsed > 80 ? "bg-amber-500" : "bg-slate-500"}`}
                          style={{ width: `${dailyDDUsed}%` }}
                        />
                      </div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-400">
                          {t("myAccounts.overallDD")}
                        </span>
                        <span
                          className={
                            overallDDUsed > 80 ? "text-red-400" : "text-white"
                          }
                        >
                          {account.overall_drawdown_percent?.toFixed(1)}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${overallDDUsed > 80 ? "bg-red-500" : "bg-slate-500"}`}
                          style={{ width: `${overallDDUsed}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Violation Message */}
                  {account.status === "disqualified" &&
                    account.violation_reason && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-sm text-red-400 break-words">
                            {translateViolationMessage(
                              account.violation_reason,
                              t,
                            )}
                          </p>
                        </div>
                      </div>
                    )}

                  {/* Actions */}
                  <div className="space-y-2">
                    <Link
                      to={`${createPageUrl("TradingTerminal")}?accountId=${account.id}`}
                    >
                      <Button
                        variant="outline"
                        className="w-full border-slate-700 hover:bg-slate-800 hover:text-white"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {t("myAccounts.openDashboard")}
                      </Button>
                    </Link>
                    <div className="flex gap-2">
                      <Link
                        to={`${createPageUrl("ChallengeProgress")}?id=${account.id}`}
                        className="flex-1"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Target className="w-3 h-3 mr-1" />
                          {t("myAccounts.progress")}
                        </Button>
                      </Link>
                      <Link
                        to={`${createPageUrl("TradeHistory")}?account=${account.id}`}
                        className="flex-1"
                      >
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <BarChart3 className="w-3 h-3 mr-1" />
                          {t("myAccounts.trades")}
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Quick Tips */}
      <Card className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border-cyan-500/30 p-4 md:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {t("myAccounts.needChallenge")}
            </h3>
            <p className="text-slate-400 text-sm">
              {t("myAccounts.needChallengeDesc")}
            </p>
          </div>
          <Link to={createPageUrl("TraderBuyChallenge")}>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500">
              {t("myAccounts.buyChallenge")}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
