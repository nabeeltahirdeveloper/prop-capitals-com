import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetAllPayouts,
  adminGetPayoutStatistics,
  adminApprovePayout,
  adminRejectPayout,
  adminMarkPayoutAsPaid,
} from "@/api/admin";
import { useTranslation } from "../../../props-capital-frontend/src/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import DataTable from "../../../props-capital-frontend/src/components/shared/DataTable";
import StatusBadge from "../../../props-capital-frontend/src/components/shared/StatusBadge";
import StatsCard from "../../../props-capital-frontend/src/components/shared/StatsCard";
import {
  Search,
  CheckCircle,
  XCircle,
  DollarSign,
  Clock,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";

export default function AdminPayouts() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const queryClient = useQueryClient();

  // Get all payouts
  const { data: payoutsData = [], isLoading } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: adminGetAllPayouts,
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  // Get payout statistics
  const { data: statistics = {} } = useQuery({
    queryKey: ["admin-payout-statistics"],
    queryFn: adminGetPayoutStatistics,
    refetchInterval: 30000,
  });

  const approveMutation = useMutation({
    mutationFn: (id) => adminApprovePayout(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payout-statistics"] });
    },
    onError: (error) => {
      console.error("Failed to approve payout:", error);
      alert(error.response?.data?.message || "Failed to approve payout");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => adminRejectPayout(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payout-statistics"] });
      setSelectedPayout(null);
      setRejectReason("");
    },
    onError: (error) => {
      console.error("Failed to reject payout:", error);
      alert(error.response?.data?.message || "Failed to reject payout");
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: (id) => adminMarkPayoutAsPaid(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payouts"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payout-statistics"] });
    },
    onError: (error) => {
      console.error("Failed to mark payout as paid:", error);
      alert(error.response?.data?.message || "Failed to mark payout as paid");
    },
  });

  const handleApprove = (payout) => {
    approveMutation.mutate(payout.id);
  };

  const handleReject = () => {
    if (selectedPayout) {
      rejectMutation.mutate({ id: selectedPayout.id, reason: rejectReason });
    }
  };

  const handleMarkPaid = (payout) => {
    markPaidMutation.mutate(payout.id);
  };

  // Map backend payouts to frontend format
  const mappedPayouts = (payoutsData || []).map((payout) => {
    const user = payout.user || {};
    const statusMap = {
      PENDING: "pending",
      APPROVED: "approved",
      REJECTED: "rejected",
      PAID: "paid",
    };
    return {
      id: payout.id,
      trader_id: user.email || payout.userId || "N/A",
      amount: payout.amount,
      currency: payout.currency || null,
      status:
        statusMap[payout.status] || payout.status?.toLowerCase() || "pending",
      trading_account_id: payout.tradingAccountId,
      account_number:
        payout.tradingAccount?.brokerLogin ||
        payout.tradingAccountId?.slice(0, 8),
      platform: payout.tradingAccount?.challenge?.platform || "N/A",
      payment_method: null, // Not stored in backend, can be removed from display or made optional
      created_date: payout.createdAt,
      updated_date: payout.updatedAt,
      processed_date:
        payout.processedAt ||
        (payout.status === "PAID" ? payout.updatedAt : null),
    };
  });

  const filteredPayouts = mappedPayouts.filter((payout) => {
    const matchesSearch = payout.trader_id
      ?.toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || payout.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Use statistics from backend
  const pendingAmount = statistics.pendingAmount || 0;
  const approvedAmount = statistics.approvedAmount || 0;
  const paidAmount = statistics.paidAmount || 0;
  const pendingCount = statistics.pendingCount || 0;

  const columns = [
    {
      header: t("admin.payouts.table.trader"),
      accessorKey: "trader_id",
      cell: (row) => (
        <span
          className="text-white font-medium block truncate max-w-[120px] sm:max-w-[200px]"
          title={row.trader_id}
        >
          {row.trader_id}
        </span>
      ),
    },
    {
      header: t("admin.payouts.table.amount"),
      accessorKey: "amount",
      cell: (row) => (
        <span className="text-emerald-400 font-bold">
          ${row.amount?.toLocaleString()}
        </span>
      ),
    },
    {
      header: t("admin.payouts.table.method"),
      accessorKey: "platform",
      cell: (row) => (
        <span className="capitalize">{row.platform || "N/A"}</span>
      ),
    },
    {
      header: t("admin.payouts.table.status"),
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: t("admin.payouts.table.requested"),
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
    {
      header: t("admin.payouts.table.actions"),
      accessorKey: "id",
      cell: (row) => {
        return (
          <div className="flex items-center gap-2 min-w-[100px]">
            {row.status === "pending" && (
              <>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                  onClick={() => handleApprove(row)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  onClick={() => setSelectedPayout(row)}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </>
            )}
            {row.status === "approved" && (
              <Button
                size="sm"
                className="bg-emerald-500 hover:bg-emerald-600 text-white whitespace-nowrap text-xs"
                onClick={() => handleMarkPaid(row)}
                disabled={markPaidMutation.isPending}
              >
                {markPaidMutation.isPending
                  ? t("admin.payouts.actions.processing") || "Processing..."
                  : t("admin.payouts.actions.markAsPaid")}
              </Button>
            )}
            {row.status === "paid" && (
              <span className="text-xs text-slate-400">
                {t("admin.payouts.actions.paid")}{" "}
                {row.processed_date &&
                  (() => {
                    try {
                      const date = new Date(row.processed_date);
                      return isNaN(date.getTime()) ? "" : format(date, "MMM d");
                    } catch (error) {
                      return "";
                    }
                  })()}
              </span>
            )}
            {row.status === "rejected" && (
              <span className="text-xs text-red-400">
                {t("admin.payouts.actions.rejected") || "Rejected"}
              </span>
            )}
            {/* Fallback for unknown status */}
            {!["pending", "approved", "paid", "rejected"].includes(
              row.status,
            ) && (
              <span className="text-xs text-slate-500">
                {row.status || "N/A"}
              </span>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {t("admin.payouts.title")}
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            {t("admin.payouts.subtitle")}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 overflow-hidden">
        <StatsCard
          title={t("admin.payouts.stats.pending")}
          value={`$${pendingAmount.toLocaleString()}`}
          icon={Clock}
          gradient="from-amber-500 to-orange-500"
        />
        <StatsCard
          title={t("admin.payouts.stats.approved")}
          value={`$${approvedAmount.toLocaleString()}`}
          icon={CheckCircle}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatsCard
          title={t("admin.payouts.stats.totalPaid")}
          value={`$${paidAmount.toLocaleString()}`}
          icon={DollarSign}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatsCard
          title={t("admin.payouts.stats.pendingRequests")}
          value={pendingCount}
          icon={Wallet}
          gradient="from-purple-500 to-pink-500"
        />
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t("admin.payouts.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white text-sm">
              <SelectValue placeholder={t("admin.payouts.filter.status")} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white z-50">
              <SelectItem value="all" className="text-white">
                {t("admin.payouts.filter.allStatus")}
              </SelectItem>
              <SelectItem value="pending" className="text-white">
                {t("admin.payouts.filter.pending")}
              </SelectItem>
              <SelectItem value="approved" className="text-white">
                {t("admin.payouts.filter.approved")}
              </SelectItem>
              <SelectItem value="paid" className="text-white">
                {t("admin.payouts.filter.paid")}
              </SelectItem>
              <SelectItem value="rejected" className="text-white">
                {t("admin.payouts.filter.rejected")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Payouts Table */}
      <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4 md:p-6 text-white overflow-hidden">
        <DataTable
          columns={columns}
          data={filteredPayouts}
          isLoading={isLoading}
          emptyMessage={t("admin.payouts.emptyMessage")}
        />
      </Card>

      {/* Reject Dialog */}
      <Dialog
        open={!!selectedPayout}
        onOpenChange={() => setSelectedPayout(null)}
      >
        <DialogContent className="bg-slate-900 border-slate-800 w-[95vw] sm:w-full sm:max-w-md p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-white text-base sm:text-lg md:text-xl">
              {t("admin.payouts.dialog.rejectTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <p className="text-slate-400 text-xs sm:text-sm">
              {t("admin.payouts.dialog.rejectMessage", {
                amount: `$${selectedPayout?.amount?.toLocaleString()}`,
                trader: selectedPayout?.trader_id,
              })}
            </p>
            <Textarea
              placeholder={t("admin.payouts.dialog.rejectReasonPlaceholder")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
            />
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
              <Button
                variant="outline"
                className="flex-1 border-slate-700 text-slate-300 hover:text-white w-full sm:w-auto order-2 sm:order-1"
                onClick={() => setSelectedPayout(null)}
              >
                {t("admin.payouts.dialog.cancel")}
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 w-full sm:w-auto order-1 sm:order-2"
                onClick={handleReject}
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending
                  ? t("admin.payouts.actions.rejecting")
                  : t("admin.payouts.dialog.rejectPayout")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
