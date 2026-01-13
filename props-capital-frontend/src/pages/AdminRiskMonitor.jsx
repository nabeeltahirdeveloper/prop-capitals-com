import React, { useState, useEffect } from "react";
import { adminGetAllAccounts } from "@/api/admin";
// TODO: Replace with risk monitoring API when available
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "../contexts/LanguageContext";
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
import { createPageUrl } from "../utils";

export default function AdminRiskMonitor() {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");

  const {
    data: accounts = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["active-accounts"],
    queryFn: () =>
      adminGetAllAccounts().then((accounts) =>
        accounts.filter((a) => a.status === "ACTIVE")
      ), // TODO: Add status filter to API
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: violations = [] } = useQuery({
    queryKey: ["recent-violations"],
    queryFn: () => Promise.resolve([]), // TODO: Replace with violations API
  });

  const { data: riskProfiles = [] } = useQuery({
    queryKey: ["risk-profiles"],
    queryFn: () => Promise.resolve([]), // TODO: Replace with risk profiles API
  });

  // Calculate risk metrics
  const getRiskLevel = (account) => {
    const ddPercent = account.overall_drawdown_percent || 0;
    const dailyDD = account.daily_drawdown_percent || 0;

    if (ddPercent >= 8 || dailyDD >= 4) return "critical";
    if (ddPercent >= 6 || dailyDD >= 3) return "high";
    if (ddPercent >= 4 || dailyDD >= 2) return "medium";
    return "low";
  };

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.account_number?.includes(searchTerm) ||
      account.trader_id?.includes(searchTerm);
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

    // TODO: Replace with risk engine API
    await Promise.resolve();
    refetch();
  };

  const handleLockAccount = async (accountId) => {
    if (!confirm(t("admin.riskMonitor.confirmations.lockAccount"))) return;

    // TODO: Replace with broker integration API
    await Promise.resolve();
    refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {t("admin.riskMonitor.title")}
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            {t("admin.riskMonitor.subtitle")}
          </p>
        </div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="border-slate-700 text-black hover:bg-black hover:text-white w-full sm:w-auto"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          <span className="sm:inline">{t("admin.riskMonitor.refresh")}</span>
        </Button>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <Card
          className={`bg-slate-900 border-slate-800 p-3 sm:p-4 cursor-pointer transition-all ${
            riskFilter === "critical" ? "ring-2 ring-red-500" : ""
          }`}
          onClick={() =>
            setRiskFilter(riskFilter === "critical" ? "all" : "critical")
          }
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-red-400">
                {riskCounts.critical}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {t("admin.riskMonitor.riskLevels.critical")}
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={`bg-slate-900 border-slate-800 p-3 sm:p-4 cursor-pointer transition-all ${
            riskFilter === "high" ? "ring-2 ring-amber-500" : ""
          }`}
          onClick={() => setRiskFilter(riskFilter === "high" ? "all" : "high")}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-amber-400">
                {riskCounts.high}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {t("admin.riskMonitor.riskLevels.high")}
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={`bg-slate-900 border-slate-800 p-3 sm:p-4 cursor-pointer transition-all ${
            riskFilter === "medium" ? "ring-2 ring-yellow-500" : ""
          }`}
          onClick={() =>
            setRiskFilter(riskFilter === "medium" ? "all" : "medium")
          }
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-yellow-400">
                {riskCounts.medium}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {t("admin.riskMonitor.riskLevels.medium")}
              </p>
            </div>
          </div>
        </Card>

        <Card
          className={`bg-slate-900 border-slate-800 p-3 sm:p-4 cursor-pointer transition-all ${
            riskFilter === "low" ? "ring-2 ring-emerald-500" : ""
          }`}
          onClick={() => setRiskFilter(riskFilter === "low" ? "all" : "low")}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                {riskCounts.low}
              </p>
              <p className="text-xs text-slate-400 truncate">
                {t("admin.riskMonitor.riskLevels.low")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder={t("admin.riskMonitor.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-slate-900 border-slate-800 text-white placeholder:text-slate-500 text-sm"
        />
      </div>

      {/* Accounts Table */}
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-slate-800/50">
                <TableHead className="text-slate-400 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {t("admin.riskMonitor.table.account")}
                </TableHead>
                <TableHead className="text-slate-400 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {t("admin.riskMonitor.table.balance")}
                </TableHead>
                <TableHead className="text-slate-400 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {t("admin.riskMonitor.table.equity")}
                </TableHead>
                <TableHead className="text-slate-400 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {t("admin.riskMonitor.table.dailyDD")}
                </TableHead>
                <TableHead className="text-slate-400 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {t("admin.riskMonitor.table.maxDD")}
                </TableHead>
                <TableHead className="text-slate-400 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
                  {t("admin.riskMonitor.table.riskLevel")}
                </TableHead>
                <TableHead className="text-slate-400 text-xs sm:text-sm whitespace-nowrap px-2 sm:px-4">
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
                    className="border-slate-800 hover:bg-slate-800/30"
                  >
                    <TableCell className="py-2 sm:py-4 px-2 sm:px-4">
                      <div>
                        <p className="text-white font-medium text-xs sm:text-sm">
                          {account.account_number}
                        </p>
                        <p className="text-xs text-slate-400 hidden sm:block">
                          {account.platform} • {account.current_phase}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-white text-xs sm:text-sm py-2 sm:py-4 px-2 sm:px-4 whitespace-nowrap">
                      ${account.current_balance?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-white text-xs sm:text-sm py-2 sm:py-4 px-2 sm:px-4 whitespace-nowrap">
                      ${account.current_equity?.toLocaleString()}
                    </TableCell>
                    <TableCell className="py-2 sm:py-4 px-2 sm:px-4">
                      <div className="w-16 sm:w-24">
                        <div className="flex justify-between text-xs mb-1">
                          <span
                            className={
                              dailyDD >= 4 ? "text-red-400" : "text-slate-400"
                            }
                          >
                            {dailyDD.toFixed(1)}%
                          </span>
                          <span className="text-slate-500 hidden sm:inline">
                            / 5%
                          </span>
                        </div>
                        <Progress
                          value={(dailyDD / 5) * 100}
                          className="h-1 sm:h-1.5 bg-slate-800"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-2 sm:py-8 px-2 sm:px-8">
                      <div className="w-16 sm:w-24">
                        <div className="flex justify-between text-xs mb-1">
                          <span
                            className={
                              maxDD >= 8 ? "text-red-400" : "text-slate-400"
                            }
                          >
                            {maxDD.toFixed(1)}%
                          </span>
                          <span className="text-slate-500 hidden sm:inline">
                            / 10%
                          </span>
                        </div>
                        <Progress
                          value={(maxDD / 10) * 100}
                          className="h-1 sm:h-1.5 bg-slate-800"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-2 sm:py-8 px-2 sm:px-8">
                      {getRiskBadge(riskLevel)}
                    </TableCell>
                    <TableCell className="py-2 sm:py-8 px-2 sm:px-8">
                      <div className="flex gap-1 sm:gap-2">
                        <Link
                          to={createPageUrl(`AccountDetails?id=${account.id}`)}
                        >
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-slate-400 hover:text-white h-7 w-7 sm:h-8 sm:w-8 p-0"
                          >
                            <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </Button>
                        </Link>
                        {riskLevel === "critical" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-400 hover:text-amber-300 h-7 w-7 sm:h-8 sm:w-8 p-0"
                              onClick={() => handleEmergencyClose(account.id)}
                            >
                              <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 h-7 w-7 sm:h-8 sm:w-8 p-0"
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
      <Card className="bg-slate-900 border-slate-800 p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          {t("admin.riskMonitor.recentViolations.title")}
        </h2>
        <div className="space-y-2 sm:space-y-3">
          {violations.slice(0, 10).map((violation) => (
            <div
              key={violation.id}
              className="flex items-center justify-between gap-2 p-2.5 sm:p-3 bg-slate-800/50 rounded-lg"
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${
                    violation.is_fatal ? "bg-red-500" : "bg-amber-500"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-white text-xs sm:text-sm font-medium truncate">
                    {violation.violation_type?.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    <span className="hidden sm:inline">
                      {t("admin.riskMonitor.recentViolations.account")}:{" "}
                    </span>
                    {violation.account_id?.slice(0, 8)}...
                  </p>
                </div>
              </div>
              <Badge
                className={`flex-shrink-0 text-xs ${
                  violation.is_fatal
                    ? "bg-red-500/20 text-red-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {violation.severity}
              </Badge>
            </div>
          ))}
          {violations.length === 0 && (
            <p className="text-center text-slate-400 py-4 text-sm">
              {t("admin.riskMonitor.recentViolations.noViolations")}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
