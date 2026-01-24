import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getAccountById,
  getUserAccounts,
  getAccountRules,
  getPhaseTransitions,
  getDailyComplianceHistory,
} from "@/api/accounts";
import { getCurrentUser } from "@/api/auth";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "../utils";
import { useTranslation } from "../contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ChallengeRulesPanel from "../components/trading/ChallengeRulesPanel";
import PhaseProgressTimeline from "../components/trading/PhaseProgressTimeline";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Target,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  Scale,
  Newspaper,
  Bot,
  Layers,
  Ban,
  Info,
} from "lucide-react";

export default function RuleCompliance() {
  const { t } = useTranslation();
  const [accountId, setAccountId] = useState(null);

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["user", "me"],
    queryFn: getCurrentUser,
  });

  // Get user's accounts
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
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("account") || params.get("id");

    if (idFromUrl) {
      setAccountId(idFromUrl);
    } else if (accounts.length > 0 && !accountId) {
      // If no ID in URL but user has accounts, use the first one
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  // Load account details using enriched TradingAccountDetails
  const {
    data: account,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["account-details", accountId],
    queryFn: async () => {
      if (!accountId) return null;
      try {
        return await getAccountById(accountId);
      } catch (error) {
        console.error("Failed to fetch account details:", error);
        return null;
      }
    },
    enabled: !!accountId,
    retry: false,
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // Get rule compliance data with real-time updates
  const { data: ruleCompliance } = useQuery({
    queryKey: ["rule-compliance", accountId],
    queryFn: async () => {
      if (!accountId) return null;
      try {
        return await getAccountRules(accountId);
      } catch (error) {
        console.error("Failed to fetch rule compliance:", error);
        return null;
      }
    },
    enabled: !!accountId,
    retry: false,
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // Get phase transitions
  const { data: phaseTransitions = [] } = useQuery({
    queryKey: ["phase-transitions", accountId],
    queryFn: async () => {
      if (!accountId) return [];
      try {
        return await getPhaseTransitions(accountId);
      } catch (error) {
        console.error("Failed to fetch phase transitions:", error);
        return [];
      }
    },
    enabled: !!accountId,
    retry: false,
  });

  // Get daily compliance history
  const { data: complianceHistory = [], isLoading: isLoadingHistory } =
    useQuery({
      queryKey: ["compliance-history", accountId],
      queryFn: async () => {
        if (!accountId) return [];
        try {
          return await getDailyComplianceHistory(accountId, 7);
        } catch (error) {
          console.error("Failed to fetch compliance history:", error);
          return [];
        }
      },
      enabled: !!accountId,
      retry: false,
      staleTime: 0, // Always consider data stale to refetch on account change
      refetchOnMount: true, // Refetch when component mounts or account changes
      refetchInterval: 30000, // Update every 30 seconds (less frequent)
    });

  // Loading state
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">{t("ruleCompliance.loading")}</div>
      </div>
    );
  }

  // Show empty state if user has no accounts
  if (accounts.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-emerald-400" />
              {t("ruleCompliance.title")}
            </h1>
            <p className="text-slate-400">{t("ruleCompliance.subtitle")}</p>
          </div>
        </div>
        <Card className="bg-slate-900 border-slate-800 p-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {t("ruleCompliance.noAccounts")}
          </h3>
          <p className="text-slate-400 mb-6">
            {t("ruleCompliance.noAccountsDesc") ||
              "Purchase a challenge to view rule compliance and trading rules."}
          </p>
          <Link to={createPageUrl("TraderBuyChallenge")}>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500">
              {t("ruleCompliance.purchaseChallenge")}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-slate-400">
          {t("ruleCompliance.loadingCompliance")}
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="text-red-400">{t("ruleCompliance.loadError")}</div>
          <Link to={createPageUrl("MyAccounts")}>
            <Button variant="outline" className="border-slate-700">
              {t("ruleCompliance.goToMyAccounts")}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Extract data from TradingAccountDetails and rule compliance
  const challenge = account.challenge || {};
  const phase = account.phase || "PHASE1";

  // Map backend phase enum to frontend format
  const phaseMap = {
    PHASE1: "phase1",
    PHASE2: "phase2",
    FUNDED: "funded",
    FAILED: "failed",
  };
  const currentPhase = phaseMap[phase] || phase?.toLowerCase() || "phase1";

  // Use rule compliance data if available, otherwise fallback to account data
  const metrics = ruleCompliance?.metrics || {};
  const challengeRules = ruleCompliance?.challengeRules || {};
  const phaseStatus = ruleCompliance?.phaseStatus || {};

  const profitPercent = metrics.profitPercent || account.profitPercent || 0;
  const dailyDrawdownPercent =
    metrics.dailyDrawdownPercent || account.dailyDrawdownPercent || 0;
  const overallDrawdownPercent =
    metrics.overallDrawdownPercent || account.overallDrawdownPercent || 0;
  const tradingDaysCount =
    metrics.tradingDaysCompleted || account.tradingDaysCount || 0;

  const phase1Target =
    challengeRules.phase1TargetPercent || challenge.phase1TargetPercent || 8;
  const phase2Target =
    challengeRules.phase2TargetPercent || challenge.phase2TargetPercent || 5;
  const maxDailyDD =
    challengeRules.dailyDrawdownPercent || challenge.dailyDrawdownPercent || 5;
  const maxOverallDD =
    challengeRules.overallDrawdownPercent ||
    challenge.overallDrawdownPercent ||
    10;
  const minTradingDays =
    challengeRules.minTradingDays || challenge.minTradingDays || 5;

  // Determine current phase target
  const currentTarget =
    currentPhase === "phase2" || currentPhase === "funded"
      ? phase2Target
      : phase1Target;

  // Rule compliance status
  const profitTargetPassed = profitPercent >= currentTarget;
  const dailyDDPassed = dailyDrawdownPercent <= maxDailyDD;
  const overallDDPassed = overallDrawdownPercent <= maxOverallDD;
  const tradingDaysPassed = tradingDaysCount >= minTradingDays;

  // Calculate days elapsed from account creation
  const daysElapsed = account.createdAt
    ? Math.floor(
        (new Date().getTime() - new Date(account.createdAt).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : 0;

  // Convert compliance history to rule history format
  const ruleHistory = complianceHistory
    .flatMap((day) => {
      const history = [];

      // Daily drawdown entry
      const dailyStatus =
        day.dailyDrawdown <= maxDailyDD
          ? day.dailyDrawdown >= maxDailyDD * 0.8
            ? "warning"
            : "passed"
          : "failed";
      history.push({
        date: day.date,
        rule: t("ruleCompliance.dailyDrawdown"),
        status: dailyStatus,
        value: `${day.dailyDrawdown.toFixed(2)}%`,
        limit: `${maxDailyDD}%`,
      });

      // Overall drawdown entry
      const overallStatus =
        day.overallDrawdown <= maxOverallDD
          ? day.overallDrawdown >= maxOverallDD * 0.8
            ? "warning"
            : "passed"
          : "failed";
      history.push({
        date: day.date,
        rule: t("ruleCompliance.overallDrawdown"),
        status: overallStatus,
        value: `${day.overallDrawdown.toFixed(2)}%`,
        limit: `${maxOverallDD}%`,
      });

      return history;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-400" />
            {t("ruleCompliance.title")}
          </h1>
          <p className="text-slate-400">{t("ruleCompliance.subtitle")}</p>
        </div>
        <Select
          value={accountId || ""}
          onValueChange={(value) => {
            setAccountId(value);
            window.history.replaceState(
              {},
              "",
              `${window.location.pathname}?account=${value}`,
            );
          }}
        >
          <SelectTrigger className="w-[280px] bg-slate-900 border-slate-800 text-white">
            <SelectValue placeholder={t("ruleCompliance.selectAccount")} />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700 text-white [&>svg]:text-white">
            {accounts.map((acc) => {
              const accChallenge = acc.challenge || {};
              const accInitialBalance =
                acc.initialBalance || accChallenge.accountSize || 0;
              const accPhaseMap = {
                PHASE1: "phase1",
                PHASE2: "phase2",
                FUNDED: "funded",
                FAILED: "failed",
              };
              const accPhase =
                accPhaseMap[acc.phase] || acc.phase?.toLowerCase() || "phase1";
              const accPlatform = accChallenge.platform || "MT5";
              const phaseTranslations = {
                phase1: t("ruleCompliance.phase1"),
                phase2: t("ruleCompliance.phase2"),
                funded: t("ruleCompliance.funded"),
                failed: t("ruleCompliance.failed"),
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
                      ${accInitialBalance?.toLocaleString()}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-400 text-xs">
                      {accPlatform}
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="text-xs text-emerald-400">
                      {phaseTranslations[accPhase] || accPhase}
                    </span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

      {/* Overall Status */}
      {(() => {
        const hasViolation = !dailyDDPassed || !overallDDPassed;
        const isFailed = account.status === "FAILED";

        return (
          <Card
            className={`p-6 ${
              isFailed
                ? "bg-gradient-to-r from-red-500/10 to-red-600/10 border-red-500/30"
                : hasViolation
                  ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30"
                  : "bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-emerald-500/30"
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isFailed
                      ? "bg-red-500/20"
                      : hasViolation
                        ? "bg-amber-500/20"
                        : "bg-emerald-500/20"
                  }`}
                >
                  {isFailed ? (
                    <XCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-400" />
                  ) : hasViolation ? (
                    <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400" />
                  ) : (
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white">
                    {isFailed
                      ? t("ruleCompliance.accountFailed")
                      : hasViolation
                        ? t("ruleCompliance.rulesAtRisk")
                        : t("ruleCompliance.allRulesCompliant")}
                  </h2>
                  <p className="text-sm sm:text-base text-slate-400">
                    {isFailed
                      ? account.lastViolationMessage ||
                        t("ruleCompliance.failedDesc")
                      : hasViolation
                        ? t("ruleCompliance.atRiskDesc")
                        : t("ruleCompliance.goodStanding")}
                  </p>
                </div>
              </div>
              <Badge
                className={`text-base sm:text-lg px-3 py-1 sm:px-4 sm:py-2 ${
                  isFailed
                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                    : hasViolation
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                }`}
              >
                {isFailed
                  ? t("ruleCompliance.failed")
                  : hasViolation
                    ? t("ruleCompliance.warning")
                    : t("ruleCompliance.active")}
              </Badge>
            </div>
          </Card>
        );
      })()}

      {/* Phase Progress */}
      <PhaseProgressTimeline
        currentPhase={currentPhase}
        phase1Passed={phaseStatus.phase1Passed || false}
        phase2Passed={phaseStatus.phase2Passed || false}
        challengeRules={challengeRules}
        metrics={metrics}
        phaseTransitions={phaseTransitions}
      />

      {/* Challenge Rules Panel */}
      <ChallengeRulesPanel
        account={{
          balance: account.balance || account.initialBalance,
          equity: account.equity || account.balance,
          profitPercent: profitPercent,
          dailyDrawdown: dailyDrawdownPercent,
          overallDrawdown: overallDrawdownPercent,
          tradingDays: tradingDaysCount,
          daysElapsed: daysElapsed,
          daysRemaining: account.daysRemaining,
          phase: currentPhase,
          startingBalance: account.initialBalance,
          highestBalance: account.maxEquityToDate || account.initialBalance,
          profitTarget: challenge?.phase1TargetPercent || phase1Target,
          maxDailyDrawdown: challenge?.dailyDrawdownPercent || maxDailyDD,
          maxOverallDrawdown: challenge?.overallDrawdownPercent || maxOverallDD,
          minTradingDays: minTradingDays,
        }}
        challenge={challenge}
      />

      {/* Trading Style Rules */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t("ruleCompliance.tradingStyleRules")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {[
            {
              name: t("ruleCompliance.newsTrading"),
              description: t("ruleCompliance.newsTradingDesc"),
              allowed: true,
              icon: Newspaper,
              details: t("ruleCompliance.newsTradingDetails"),
            },
            {
              name: t("ruleCompliance.weekendHolding"),
              description: t("ruleCompliance.weekendHoldingDesc"),
              allowed: true,
              icon: Calendar,
              details: t("ruleCompliance.weekendHoldingDetails"),
            },
            {
              name: t("ruleCompliance.expertAdvisors"),
              description: t("ruleCompliance.expertAdvisorsDesc"),
              allowed: true,
              icon: Bot,
              details: t("ruleCompliance.expertAdvisorsDetails"),
            },
            {
              name: t("ruleCompliance.hedging"),
              description: t("ruleCompliance.hedgingDesc"),
              allowed: true,
              icon: Scale,
              details: t("ruleCompliance.hedgingDetails"),
            },
            {
              name: t("ruleCompliance.copyTrading"),
              description: t("ruleCompliance.copyTradingDesc"),
              allowed: false,
              icon: Layers,
              details: t("ruleCompliance.copyTradingDetails"),
            },
            {
              name: t("ruleCompliance.latencyArbitrage"),
              description: t("ruleCompliance.latencyArbitrageDesc"),
              allowed: false,
              icon: Ban,
              details: t("ruleCompliance.latencyArbitrageDetails"),
            },
          ].map((rule, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl border ${
                rule.allowed
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-red-500/5 border-red-500/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    rule.allowed ? "bg-emerald-500/20" : "bg-red-500/20"
                  }`}
                >
                  <rule.icon
                    className={`w-5 h-5 ${rule.allowed ? "text-emerald-400" : "text-red-400"}`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-white font-medium">{rule.name}</h4>
                    {rule.allowed ? (
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-400" />
                    )}
                  </div>
                  <p className="text-sm text-slate-400">{rule.description}</p>
                  <p className="text-xs text-slate-500 mt-2">{rule.details}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Rule Compliance History */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            {t("ruleCompliance.complianceHistory")}
          </h3>
          <Badge variant="outline" className="text-slate-400 border-slate-600">
            {t("ruleCompliance.last7Days")}
          </Badge>
        </div>
        <div className="space-y-2">
          {isLoadingHistory ? (
            <div className="text-center text-slate-400 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400 mx-auto mb-2"></div>
              <p className="text-sm">{t("ruleCompliance.loadingHistory")}</p>
            </div>
          ) : ruleHistory.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-sm font-medium text-white mb-1">
                {t("ruleCompliance.noComplianceHistory")}
              </p>
              <p className="text-xs">
                {t("ruleCompliance.noComplianceHistoryDesc")}
              </p>
            </div>
          ) : (
            ruleHistory.map((entry, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  entry.status === "passed"
                    ? "bg-slate-800/50"
                    : entry.status === "warning"
                      ? "bg-amber-500/10 border border-amber-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  {entry.status === "passed" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  ) : entry.status === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                  <div>
                    <p className="text-white text-sm font-medium">
                      {entry.rule}
                    </p>
                    <p className="text-xs text-slate-400">{entry.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-mono text-sm ${
                      entry.status === "passed"
                        ? "text-emerald-400"
                        : entry.status === "warning"
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {entry.value}
                  </p>
                  <p className="text-xs text-slate-500">
                    {t("ruleCompliance.limit")}: {entry.limit}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Important Notes */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-white font-medium mb-2">
              {t("ruleCompliance.importantInformation")}
            </h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• {t("ruleCompliance.info1")}</li>
              <li>• {t("ruleCompliance.info2")}</li>
              <li>• {t("ruleCompliance.info3")}</li>
              <li>• {t("ruleCompliance.info4")}</li>
              <li>• {t("ruleCompliance.info5")}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
