import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetAllAccounts,
  adminUpdateAccountStatus,
  adminUpdateAccountPhase,
  adminGetAccount,
} from "@/api/admin";
import { useTranslation } from "../../../props-capital-frontend/src/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DataTable from "../../../props-capital-frontend/src/components/shared/DataTable";
import StatusBadge from "../../../props-capital-frontend/src/components/shared/StatusBadge";
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminAccounts() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: accountsData = [], isLoading } = useQuery({
    queryKey: ["admin-accounts"],
    queryFn: adminGetAllAccounts,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => adminUpdateAccountStatus(id, status),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-account-details", variables.id],
      });
    },
  });

  const updatePhaseMutation = useMutation({
    mutationFn: ({ id, phase }) => adminUpdateAccountPhase(id, phase),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      queryClient.invalidateQueries({
        queryKey: ["admin-account-details", variables.id],
      });
    },
  });

  // Get selected account details
  const {
    data: accountDetails,
    isLoading: isLoadingDetails,
    error: accountDetailsError,
  } = useQuery({
    queryKey: ["admin-account-details", selectedAccountId],
    queryFn: () => adminGetAccount(selectedAccountId),
    enabled: !!selectedAccountId && isDetailsDialogOpen,
    retry: 1,
  });

  // Handler for viewing account details
  const handleViewDetails = (accountId) => {
    setSelectedAccountId(accountId);
    setIsDetailsDialogOpen(true);
  };

  // Handler for closing details dialog
  const handleCloseDetails = () => {
    setIsDetailsDialogOpen(false);
    setSelectedAccountId(null);
  };

  const handleUpdateStatus = (account, newStatus) => {
    // Map frontend status to backend status enum
    const statusMap = {
      active: "ACTIVE",
      paused: "PAUSED",
      closed: "CLOSED",
      daily_locked: "DAILY_LOCKED",
      disqualified: "DISQUALIFIED",
    };
    const backendStatus = statusMap[newStatus] || newStatus.toUpperCase();
    updateStatusMutation.mutate({
      id: account.id,
      status: backendStatus,
    });
  };

  const handlePause = (account) => {
    updateStatusMutation.mutate({
      id: account.id,
      status: "PAUSED",
    });
  };

  const handleResume = (account) => {
    updateStatusMutation.mutate({
      id: account.id,
      status: "ACTIVE",
    });
  };

  const handleForcePass = (account) => {
    const currentPhase = account.current_phase || account.phase;
    // Map frontend phase to backend phase enum
    const phaseMap = {
      phase1: "PHASE1",
      PHASE1: "PHASE1",
      phase2: "PHASE2",
      PHASE2: "PHASE2",
      funded: "FUNDED",
      FUNDED: "FUNDED",
    };
    const backendPhase = phaseMap[currentPhase] || currentPhase.toUpperCase();
    const nextPhase = backendPhase === "PHASE1" ? "PHASE2" : "FUNDED";
    updatePhaseMutation.mutate({
      id: account.id,
      phase: nextPhase,
    });
  };

  const handleForceFail = (account) => {
    // Force fail changes the phase to FAILED, not the status
    updatePhaseMutation.mutate({
      id: account.id,
      phase: "FAILED",
    });
  };

  const handleResetAccount = (account) => {
    // Reset failed account back to PHASE1 and set status to ACTIVE
    updatePhaseMutation.mutate({
      id: account.id,
      phase: "PHASE1",
    });
    updateStatusMutation.mutate({
      id: account.id,
      status: "ACTIVE",
    });
  };

  // Map backend accounts to frontend format
  const mappedAccounts = accountsData.map((account) => {
    const challenge = account.challenge || {};
    const user = account.user || {};
    // Map all backend TradingAccountStatus enum values
    const statusMap = {
      ACTIVE: "active",
      PAUSED: "paused",
      CLOSED: "closed",
      DAILY_LOCKED: "daily_locked",
      DISQUALIFIED: "disqualified",
    };
    // Map all backend TradingPhase enum values
    const phaseMap = {
      PHASE1: "phase1",
      PHASE2: "phase2",
      FUNDED: "funded",
      FAILED: "failed",
    };
    const initialBalance = account.initialBalance || challenge.accountSize || 0;
    const balance = account.balance || initialBalance;
    const equity = account.equity || balance;
    const profitPercent =
      initialBalance > 0
        ? ((equity - initialBalance) / initialBalance) * 100
        : 0;

    return {
      id: account.id,
      account_number: account.brokerLogin || account.id.slice(0, 8),
      platform: challenge.platform || "MT5",
      status:
        statusMap[account.status] || account.status?.toLowerCase() || "active",
      current_phase:
        phaseMap[account.phase] || account.phase?.toLowerCase() || "phase1",
      phase: account.phase,
      trader_id: user.email || account.userId || "N/A",
      initial_balance: initialBalance,
      current_balance: balance,
      current_profit_percent: profitPercent,
      violation_reason: account.lastViolationMessage,
      created_date: account.createdAt,
    };
  });

  const displayAccounts = mappedAccounts;

  const filteredAccounts = displayAccounts.filter((account) => {
    const matchesSearch =
      account.account_number?.includes(searchQuery) ||
      account.trader_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || account.status === statusFilter;
    const matchesPhase =
      phaseFilter === "all" || account.current_phase === phaseFilter;
    return matchesSearch && matchesStatus && matchesPhase;
  });

  const columns = [
    {
      header: t("admin.accounts.table.account"),
      accessorKey: "account_number",
      cell: (row) => (
        <div>
          <p className="text-foreground font-medium">{row.account_number}</p>
          <p className="text-xs text-muted-foreground ">{row.trader_id}</p>
        </div>
      ),
    },
    { header: t("admin.accounts.table.platform"), accessorKey: "platform" },
    {
      header: t("admin.accounts.table.balance"),
      accessorKey: "current_balance",
      cell: (row) => (
        <div>
          <p className="text-foreground font-medium">
            ${row.current_balance?.toLocaleString()}
          </p>
          <p
            className={`text-xs ${
              row.current_profit_percent >= 0
                ? "text-emerald-500"
                : "text-red-500"
            }`}
          >
            {row.current_profit_percent >= 0 ? "+" : ""}
            {row.current_profit_percent?.toFixed(2)}%
          </p>
        </div>
      ),
    },
    {
      header: t("admin.accounts.table.phase"),
      accessorKey: "current_phase",
      cell: (row) => <StatusBadge status={row.current_phase} />,
    },
    {
      header: t("admin.accounts.table.status"),
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: t("admin.accounts.table.created"),
      accessorKey: "created_date",
      cell: (row) => format(new Date(row.created_date), "MMM d, yyyy"),
    },
    {
      header: t("admin.accounts.table.actions"),
      accessorKey: "id",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground data-[state=open]:text-foreground"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="bg-card border-border"
          >
            <DropdownMenuItem
              className="
        cursor-pointer
        text-foreground
        data-[highlighted]:bg-accent
      "
              onClick={() => handleViewDetails(row.id)}
            >
              <Eye className="w-4 h-4 mr-2 data-[highlighted]:text-white" />
              {t("admin.accounts.actions.viewDetails")}
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-border" />

            {/* Actions for active accounts - can force pass or force fail */}
            {row.status === "active" &&
              row.current_phase !== "funded" &&
              row.current_phase !== "failed" && (
                <>
                  <DropdownMenuItem
                    className="
        cursor-pointer
        text-emerald-500
        data-[highlighted]:bg-accent
          "
                    onClick={() => handleForcePass(row)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2 data-[highlighted]:text-emerald-300" />
                    {t("admin.accounts.actions.forcePass")}
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="
        cursor-pointer
        text-red-500
        data-[highlighted]:bg-accent
          "
                    onClick={() => handleForceFail(row)}
                  >
                    <XCircle className="w-4 h-4 mr-2 data-[highlighted]:text-red-300" />
                    {t("admin.accounts.actions.forceFail")}
                  </DropdownMenuItem>
                </>
              )}

            {/* Actions for paused accounts - can resume */}
            {row.status === "paused" && (
              <DropdownMenuItem
                className="
        cursor-pointer
        text-emerald-500
        data-[highlighted]:bg-accent
        "
                onClick={() => handleResume(row)}
              >
                <RefreshCw className="w-4 h-4 mr-2 data-[highlighted]:text-emerald-300" />
                {t("admin.accounts.actions.resume")}
              </DropdownMenuItem>
            )}

            {/* Actions for active accounts - can pause */}
            {row.status === "active" && (
              <DropdownMenuItem
                className="
        cursor-pointer
        text-yellow-500
        data-[highlighted]:bg-accent
        "
                onClick={() => handlePause(row)}
              >
                <XCircle className="w-4 h-4 mr-2 data-[highlighted]:text-yellow-300" />
                {t("admin.accounts.actions.pause")}
              </DropdownMenuItem>
            )}

            {/* Actions for failed phase accounts - can reset */}
            {row.current_phase === "failed" && (
              <DropdownMenuItem
                className="
        cursor-pointer
        text-cyan-500
        data-[highlighted]:bg-accent
        "
                onClick={() => handleResetAccount(row)}
              >
                <RefreshCw className="w-4 h-4 mr-2 data-[highlighted]:text-cyan-300" />
                {t("admin.accounts.actions.resetAccount")}
              </DropdownMenuItem>
            )}

            {/* Actions for phase2 accounts - can move to funded */}
            {row.current_phase === "phase2" && row.status === "active" && (
              <DropdownMenuItem
                className="
          cursor-pointer
          text-purple-400
          data-[highlighted]:bg-slate-800
          data-[highlighted]:text-purple-300
        "
                onClick={() =>
                  updatePhaseMutation.mutate({ id: row.id, phase: "FUNDED" })
                }
              >
                <TrendingUp className="w-4 h-4 mr-2 text-purple-300" />
                {t("admin.accounts.actions.moveToFunded")}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">
          {t("admin.accounts.title")}
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          {t("admin.accounts.subtitle")}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <Card className="bg-card border-border p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("admin.accounts.stats.totalAccounts")}
          </p>
          {isLoading ? (
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-2" />
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-foreground">
              {displayAccounts.length}
            </p>
          )}
        </Card>
        <Card className="bg-card border-border p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("admin.accounts.stats.active")}
          </p>
          {isLoading ? (
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-2" />
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-emerald-500">
              {displayAccounts.filter((a) => a.status === "active").length}
            </p>
          )}
        </Card>
        <Card className="bg-card border-border p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("admin.accounts.stats.phase2")}
          </p>
          {isLoading ? (
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-2" />
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-blue-500">
              {
                displayAccounts.filter((a) => a.current_phase === "phase2")
                  .length
              }
            </p>
          )}
        </Card>
        <Card className="bg-card border-border p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("admin.accounts.stats.funded")}
          </p>
          {isLoading ? (
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-2" />
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-purple-500">
              {
                displayAccounts.filter((a) => a.current_phase === "funded")
                  .length
              }
            </p>
          )}
        </Card>
        <Card className="bg-card border-border p-3 sm:p-4 col-span-2 sm:col-span-1">
          <p className="text-xs sm:text-sm text-muted-foreground">
            {t("admin.accounts.stats.failed")}
          </p>
          {isLoading ? (
            <Skeleton className="h-6 sm:h-8 w-12 sm:w-16 mt-2" />
          ) : (
            <p className="text-xl sm:text-2xl font-bold text-red-500">
              {
                displayAccounts.filter((a) => a.current_phase === "failed")
                  .length
              }
            </p>
          )}
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("admin.accounts.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1 sm:w-[130px] bg-muted border-border text-foreground text-sm">
                <SelectValue placeholder={t("admin.accounts.filter.status")} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="all" className="text-foreground">
                  {t("admin.accounts.filter.allStatus")}
                </SelectItem>
                <SelectItem value="active" className="text-foreground">
                  {t("admin.accounts.filter.active")}
                </SelectItem>
                <SelectItem value="paused" className="text-foreground">
                  {t("admin.accounts.filter.paused")}
                </SelectItem>
                <SelectItem value="closed" className="text-foreground">
                  {t("admin.accounts.filter.closed")}
                </SelectItem>
                <SelectItem value="daily_locked" className="text-foreground">
                  {t("admin.accounts.filter.dailyLocked")}
                </SelectItem>
                <SelectItem value="disqualified" className="text-foreground">
                  {t("admin.accounts.filter.disqualified")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={phaseFilter} onValueChange={setPhaseFilter}>
              <SelectTrigger className="flex-1 sm:w-[130px] bg-muted border-border text-foreground text-sm">
                <SelectValue placeholder={t("admin.accounts.filter.phase")} />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="all" className="text-foreground">
                  {t("admin.accounts.filter.allPhases")}
                </SelectItem>
                <SelectItem value="phase1" className="text-foreground">
                  {t("admin.accounts.filter.phase1")}
                </SelectItem>
                <SelectItem value="phase2" className="text-foreground">
                  {t("admin.accounts.filter.phase2")}
                </SelectItem>
                <SelectItem value="funded" className="text-foreground">
                  {t("admin.accounts.filter.funded")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Accounts Table */}
      <Card className="bg-card border-border p-3 sm:p-4 md:p-6">
        <DataTable
          columns={columns}
          data={filteredAccounts}
          isLoading={isLoading}
          emptyMessage={t("admin.accounts.emptyMessage")}
        />
      </Card>

      {/* Account Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={handleCloseDetails}>
        <DialogContent
          className="
            bg-card border-border
            w-[95vw] sm:w-full sm:max-w-3xl
            max-h-[85vh] overflow-y-auto
            p-4 sm:p-6
          "
        >
          <DialogHeader>
            <DialogTitle className="text-foreground text-base sm:text-lg md:text-xl">
              {t("admin.accounts.dialog.title", {
                defaultValue: "Account Details",
              })}
            </DialogTitle>
          </DialogHeader>
          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-6 sm:py-8">
              <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-amber-500" />
            </div>
          ) : accountDetails ? (
            <div className="space-y-4 sm:space-y-6 mt-3 sm:mt-4">
              {/* Account Header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-border text-center sm:text-left">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-[#0a0d12] text-lg sm:text-2xl font-bold flex-shrink-0">
                  {accountDetails.brokerLogin?.[0]?.toUpperCase() ||
                    accountDetails.id?.[0]?.toUpperCase() ||
                    "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg md:text-xl font-bold text-foreground truncate">
                    {accountDetails.brokerLogin ||
                      accountDetails.id ||
                      "Account"}
                  </h3>
                  <p className="text-muted-foreground text-xs sm:text-sm break-all">
                    {accountDetails.user?.email || "N/A"}
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-1.5 sm:mt-2">
                    <StatusBadge
                      status={
                        accountDetails.phase?.toLowerCase() ||
                        accountDetails.phase
                      }
                    />
                    <StatusBadge
                      status={
                        accountDetails.status?.toLowerCase() ||
                        accountDetails.status
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
                <div className="bg-muted/50 rounded-xl p-2.5 sm:p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.accountId", {
                      defaultValue: "Account ID",
                    })}
                  </p>
                  <p className="text-foreground font-mono text-xs break-all">
                    {accountDetails.id?.slice(0, 8) || "N/A"}...
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-2.5 sm:p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.brokerLogin", {
                      defaultValue: "Broker Login",
                    })}
                  </p>
                  <p className="text-foreground text-xs sm:text-sm">
                    {accountDetails.brokerLogin || "N/A"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-2.5 sm:p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.platform", {
                      defaultValue: "Platform",
                    })}
                  </p>
                  <p className="text-foreground text-xs sm:text-sm">
                    {accountDetails.challenge?.platform || "N/A"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-2.5 sm:p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.challenge", {
                      defaultValue: "Challenge",
                    })}
                  </p>
                  <p className="text-foreground text-xs sm:text-sm truncate">
                    {accountDetails.challenge?.name || "N/A"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-2.5 sm:p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.trader", {
                      defaultValue: "Trader",
                    })}
                  </p>
                  <p className="text-foreground text-xs sm:text-sm truncate">
                    {accountDetails.user?.email || "N/A"}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-2.5 sm:p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.phase", {
                      defaultValue: "Phase",
                    })}
                  </p>
                  <StatusBadge
                    status={
                      accountDetails.phase?.toLowerCase() ||
                      accountDetails.phase
                    }
                  />
                </div>
                <div className="bg-muted/50 rounded-xl p-2.5 sm:p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.status", {
                      defaultValue: "Status",
                    })}
                  </p>
                  <StatusBadge
                    status={
                      accountDetails.status?.toLowerCase() ||
                      accountDetails.status
                    }
                  />
                </div>
                <div className="bg-muted/50 rounded-xl p-2.5 sm:p-3 border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.created", {
                      defaultValue: "Created",
                    })}
                  </p>
                  <p className="text-foreground text-xs sm:text-sm">
                    {accountDetails.createdAt
                      ? format(
                          new Date(accountDetails.createdAt),
                          "MMM d, yyyy",
                        )
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Balance Information */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 p-3 sm:p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.initialBalance", {
                      defaultValue: "Initial Balance",
                    })}
                  </p>
                  <p className="text-foreground font-bold text-sm sm:text-lg">
                    ${accountDetails.initialBalance?.toLocaleString() || "0"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.currentBalance", {
                      defaultValue: "Current Balance",
                    })}
                  </p>
                  <p className="text-foreground font-bold text-sm sm:text-lg">
                    ${accountDetails.balance?.toLocaleString() || "0"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.equity", {
                      defaultValue: "Equity",
                    })}
                  </p>
                  <p className="text-foreground font-bold text-sm sm:text-lg">
                    ${accountDetails.equity?.toLocaleString() || "0"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.profit", {
                      defaultValue: "Profit/Loss",
                    })}
                  </p>
                  {accountDetails.initialBalance > 0 &&
                    (() => {
                      const profit =
                        accountDetails.equity - accountDetails.initialBalance ||
                        0;
                      const profitPercent =
                        accountDetails.initialBalance > 0
                          ? (profit / accountDetails.initialBalance) * 100
                          : 0;
                      return (
                        <p
                          className={`font-bold text-sm sm:text-lg ${
                            profit >= 0 ? "text-emerald-500" : "text-red-500"
                          }`}
                        >
                          {profit >= 0 ? "+" : ""}
                          {profitPercent.toFixed(2)}%
                        </p>
                      );
                    })()}
                </div>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-muted/50 rounded-xl p-2.5 sm:p-3 text-center border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.totalTrades", {
                      defaultValue: "Trades",
                    })}
                  </p>
                  <p className="text-foreground font-bold text-base sm:text-lg">
                    {accountDetails.trades?.length || 0}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-2.5 sm:p-3 text-center border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.violations", {
                      defaultValue: "Violations",
                    })}
                  </p>
                  <p className="text-foreground font-bold text-base sm:text-lg">
                    {accountDetails.violations?.length || 0}
                  </p>
                </div>
                <div className="bg-muted/50 rounded-xl p-2.5 sm:p-3 text-center border border-border">
                  <p className="text-xs text-muted-foreground mb-0.5 sm:mb-1">
                    {t("admin.accounts.dialog.phaseTransitions", {
                      defaultValue: "Transitions",
                    })}
                  </p>
                  <p className="text-foreground font-bold text-base sm:text-lg">
                    {accountDetails.phaseHistory?.length || 0}
                  </p>
                </div>
              </div>

              {/* Recent Violations */}
              {accountDetails.violations &&
                accountDetails.violations.length > 0 && (
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                      {t("admin.accounts.dialog.recentViolations", {
                        defaultValue: "Recent Violations",
                      })}
                    </p>
                    <div className="space-y-2">
                      {accountDetails.violations
                        .slice(0, 3)
                        .map((violation) => (
                          <div
                            key={violation.id}
                            className="p-2.5 sm:p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
                          >
                            <p className="text-foreground text-xs sm:text-sm font-medium">
                              {violation.type}
                            </p>
                            <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                              {violation.message}
                            </p>
                            <p className="text-muted-foreground/70 text-xs mt-1">
                              {format(
                                new Date(violation.createdAt),
                                "MMM d, yyyy HH:mm",
                              )}
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          ) : accountDetailsError ? (
            <div className="text-center py-6 sm:py-8">
              <p className="text-red-500 mb-2 text-sm">
                {t("admin.accounts.dialog.error", {
                  defaultValue: "Error loading account details",
                })}
              </p>
              <p className="text-muted-foreground text-xs sm:text-sm">
                {accountDetailsError.message ||
                  "Failed to load account details"}
              </p>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-muted-foreground text-sm">
              {t("admin.accounts.dialog.noDetails", {
                defaultValue: "No account details available",
              })}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
