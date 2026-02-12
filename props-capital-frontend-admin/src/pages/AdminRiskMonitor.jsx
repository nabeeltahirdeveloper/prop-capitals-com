import React, { useState } from "react";
import {
  adminGetRiskOverview,
  adminGetAllViolations,
  adminUpdateAccountStatus,
} from "@/api/admin";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "../../../props-capital-frontend/src/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Shield,
  TrendingDown,
  Activity,
  Search,
  RefreshCw,
  Eye,
  Lock,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../../props-capital-frontend/src/utils";

export default function AdminRiskMonitor() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const queryClient = useQueryClient();

  const {
    data: accounts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["risk-overview"],
    queryFn: adminGetRiskOverview,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: violations = [] } = useQuery({
    queryKey: ["risk-violations"],
    queryFn: adminGetAllViolations,
    refetchInterval: 60000, // Refresh every minute
  });

  const lockAccountMutation = useMutation({
    mutationFn: (accountId) => adminUpdateAccountStatus(accountId, "PAUSED"),
    onSuccess: () => {
      queryClient.invalidateQueries(["risk-overview"]);
    },
  });

  // Calculate risk metrics based on dynamic limits
  const getRiskLevel = (account) => {
    const ddPercent = account.overall_drawdown_percent || 0;
    const dailyDD = account.daily_drawdown_percent || 0;
    const dailyLimit = account.daily_drawdown_limit || 5;
    const overallLimit = account.overall_drawdown_limit || 10;

    // Critical: >= 80% of either limit
    if (ddPercent >= overallLimit * 0.8 || dailyDD >= dailyLimit * 0.8)
      return "critical";
    // High: >= 60% of either limit
    if (ddPercent >= overallLimit * 0.6 || dailyDD >= dailyLimit * 0.6)
      return "high";
    // Medium: >= 40% of either limit
    if (ddPercent >= overallLimit * 0.4 || dailyDD >= dailyLimit * 0.4)
      return "medium";
    return "low";
  };

  const filteredAccounts = accounts.filter((account) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      account.account_number?.toLowerCase().includes(searchLower) ||
      account.trader_id?.toLowerCase().includes(searchLower) ||
      account.trader_email?.toLowerCase().includes(searchLower);
    const riskLevel = getRiskLevel(account);
    const matchesRisk = riskFilter === "all" || riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const riskCounts = {
    critical: accounts.filter((a) => getRiskLevel(a) === "critical").length,
    high: accounts.filter((a) => getRiskLevel(a) === "high").length,
    medium: accounts.filter((a) => getRiskLevel(a) === "medium").length,
    low: accounts.filter((a) => getRiskLevel(a) === "low").length,
  };

  const getRiskBadge = (level) => {
    switch (level) {
      case "critical":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            {t("admin.riskMonitor.riskBadges.critical")}
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            {t("admin.riskMonitor.riskBadges.high")}
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            {t("admin.riskMonitor.riskBadges.medium")}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            {t("admin.riskMonitor.riskBadges.low")}
          </Badge>
        );
    }
  };

  const handleEmergencyClose = async (accountId) => {
    if (!confirm(t("admin.riskMonitor.confirmations.emergencyClose"))) return;

    // Pause the account - in a real implementation this would also close positions via broker API
    try {
      await lockAccountMutation.mutateAsync(accountId);
    } catch (error) {
      console.error("Failed to pause account:", error);
    }
  };

  const handleLockAccount = async (accountId) => {
    if (!confirm(t("admin.riskMonitor.confirmations.lockAccount"))) return;

    try {
      await lockAccountMutation.mutateAsync(accountId);
    } catch (error) {
      console.error("Failed to lock account:", error);
    }
  };

  // Ensure violations is always treated as an array for rendering
  const recentViolations = Array.isArray(violations)
    ? violations
    : violations?.items ||
      violations?.data ||
      [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {t("admin.riskMonitor.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("admin.riskMonitor.subtitle")}
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="border-border text-foreground hover:bg-accent hover:text-foreground w-full sm:w-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          <span className="sm:inline">{t("admin.riskMonitor.refresh")}</span>
        </Button>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card
          className={`bg-card border-border p-3 sm:p-4 cursor-pointer transition-all ${
            riskFilter === "critical" ? "ring-2 ring-red-500" : ""
          }`}
          onClick={() =>
            setRiskFilter(riskFilter === "critical" ? "all" : "critical")
          }
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-red-500">
                {riskCounts.critical}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("admin.riskMonitor.riskLevels.critical")}
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={`bg-card border-border p-3 sm:p-4 cursor-pointer transition-all ${
            riskFilter === "high" ? "ring-2 ring-amber-500" : ""
          }`}
          onClick={() => setRiskFilter(riskFilter === "high" ? "all" : "high")}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-[#d97706]" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-[#d97706]">
                {riskCounts.high}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("admin.riskMonitor.riskLevels.high")}
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={`bg-card border-border p-3 sm:p-4 cursor-pointer transition-all ${
            riskFilter === "medium" ? "ring-2 ring-yellow-500" : ""
          }`}
          onClick={() =>
            setRiskFilter(riskFilter === "medium" ? "all" : "medium")
          }
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-yellow-500">
                {riskCounts.medium}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("admin.riskMonitor.riskLevels.medium")}
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={`bg-card border-border p-3 sm:p-4 cursor-pointer transition-all ${
            riskFilter === "low" ? "ring-2 ring-emerald-500" : ""
          }`}
          onClick={() => setRiskFilter(riskFilter === "low" ? "all" : "low")}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-emerald-500">
                {riskCounts.low}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {t("admin.riskMonitor.riskLevels.low")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={t("admin.riskMonitor.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
        />
      </div>

      {/* Accounts Table */}
      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border bg-muted/50">
                <TableHead className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {t("admin.riskMonitor.table.account")}
                </TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {t("admin.riskMonitor.table.balance")}
                </TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {t("admin.riskMonitor.table.equity")}
                </TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {t("admin.riskMonitor.table.dailyDD")}
                </TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {t("admin.riskMonitor.table.maxDD")}
                </TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {t("admin.riskMonitor.table.riskLevel")}
                </TableHead>
                <TableHead className="text-muted-foreground text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {t("admin.riskMonitor.table.actions")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAccounts.map((account) => {
                const riskLevel = getRiskLevel(account);
                const dailyDD = account.daily_drawdown_percent || 0;
                const maxDD = account.overall_drawdown_percent || 0;

                return (
                  <TableRow
                    key={account.id}
                    className="border-border hover:bg-muted/50"
                  >
                    <TableCell className="py-2 sm:py-4 px-2 sm:px-4">
                      <div>
                        <p className="text-foreground font-medium text-xs sm:text-sm">
                          {account.account_number}
                        </p>
                        <p className="text-xs text-muted-foreground hidden sm:block">
                          {account.platform} • {account.current_phase}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-foreground text-xs sm:text-sm py-2 sm:py-4 px-2 sm:px-4 whitespace-nowrap">
                      ${account.current_balance?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-foreground text-xs sm:text-sm py-2 sm:py-4 px-2 sm:px-4 whitespace-nowrap">
                      ${account.current_equity?.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-2 sm:py-4 px-2 sm:px-4">
                      <div className="w-16 sm:w-24">
                        <div className="flex justify-between text-xs mb-1">
                          <span
                            className={
                              dailyDD >=
                              (account.daily_drawdown_limit || 5) * 0.8
                                ? "text-red-500"
                                : "text-muted-foreground"
                            }
                          >
                            {dailyDD.toFixed(1)}%
                          </span>
                          <span className="text-muted-foreground hidden sm:inline">
                            / {account.daily_drawdown_limit || 5}%
                          </span>
                        </div>
                        <Progress
                          value={
                            (dailyDD / (account.daily_drawdown_limit || 5)) *
                            100
                          }
                          className="h-1 sm:h-1.5 bg-muted"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-2 sm:py-4 px-2 sm:px-4">
                      <div className="w-16 sm:w-24">
                        <div className="flex justify-between text-xs mb-1">
                          <span
                            className={
                              maxDD >=
                              (account.overall_drawdown_limit || 10) * 0.8
                                ? "text-red-500"
                                : "text-muted-foreground"
                            }
                          >
                            {maxDD.toFixed(1)}%
                          </span>
                          <span className="text-muted-foreground hidden sm:inline">
                            / {account.overall_drawdown_limit || 10}%
                          </span>
                        </div>
                        <Progress
                          value={
                            (maxDD / (account.overall_drawdown_limit || 10)) *
                            100
                          }
                          className="h-1 sm:h-1.5 bg-muted"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-2 sm:py-4 px-2 sm:px-4">
                      {getRiskBadge(riskLevel)}
                    </TableCell>
                    <TableCell className="py-2 sm:py-4 px-2 sm:px-4">
                      <div className="flex gap-1 sm:gap-2">
                        <Link
                          to={createPageUrl(`AccountDetails?id=${account.id}`)}
                        >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-foreground h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </Link>
                        {riskLevel === "critical" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[#d97706] hover:text-amber-500 h-7 w-7 sm:h-8 sm:w-8 p-0"
                              onClick={() => handleEmergencyClose(account.id)}
                            >
                              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-400 h-7 w-7 sm:h-8 sm:w-8 p-0"
                              onClick={() => handleLockAccount(account.id)}
                            >
                              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Recent Violations */}
      <Card className="bg-card border-border p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-foreground mb-3 sm:mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          {t("admin.riskMonitor.recentViolations.title")}
        </h2>
        <div className="space-y-2 sm:space-y-3">
          {recentViolations.slice(0, 10).map((violation) => {
            const isFatal = violation.type === "OVERALL_DRAWDOWN";
            const accountNumber =
              violation.tradingAccount?.brokerLogin ||
              violation.tradingAccountId?.slice(0, 8);

            return (
              <div
                key={violation.id}
                className="flex items-center justify-between gap-2 p-2.5 sm:p-3 bg-muted/60 rounded-lg"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      isFatal ? "bg-red-500" : "bg-amber-500"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-foreground text-xs sm:text-sm font-medium truncate">
                      {violation.type?.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      <span className="hidden sm:inline">
                        {t("admin.riskMonitor.recentViolations.account")}:{" "}
                      </span>
                      {accountNumber}...
                    </p>
                  </div>
                </div>
                <Badge
                  className={`flex-shrink-0 text-xs ${
                    isFatal
                      ? "bg-red-500/10 text-red-500 border border-red-200"
                      : "bg-amber-500/10 text-[#d97706] border border-amber-200"
                  }`}
                >
                  {isFatal
                    ? t("admin.riskMonitor.severity.fatal")
                    : t("admin.riskMonitor.severity.warning")}
                </Badge>
              </div>
            );
          })}
          {recentViolations.length === 0 && (
            <p className="text-center text-muted-foreground py-4 text-sm">
              {t("admin.riskMonitor.recentViolations.noViolations")}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
