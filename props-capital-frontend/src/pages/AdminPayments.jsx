import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetAllPayments,
  adminGetPaymentStatistics,
  adminRefundPayment,
} from "@/api/admin";
import { useTranslation } from "../contexts/LanguageContext";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import DataTable from "../components/shared/DataTable";
import StatusBadge from "../components/shared/StatusBadge";
import StatsCard from "../components/shared/StatsCard";
import {
  Search,
  DollarSign,
  CreditCard,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { format } from "date-fns";

export default function AdminPayments() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [refundReason, setRefundReason] = useState("");
  const queryClient = useQueryClient();

  // Get all payments
  const { data: paymentsData = [], isLoading } = useQuery({
    queryKey: ["admin-payments"],
    queryFn: adminGetAllPayments,
    refetchInterval: 30000, // Real-time updates every 30 seconds
  });

  // Get payment statistics
  const { data: statistics = {} } = useQuery({
    queryKey: ["admin-payment-statistics"],
    queryFn: adminGetPaymentStatistics,
    refetchInterval: 30000,
  });

  // Refund payment mutation
  const refundMutation = useMutation({
    mutationFn: ({ id, reason }) => adminRefundPayment(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payment-statistics"] });
      setRefundDialogOpen(false);
      setSelectedPayment(null);
      setRefundReason("");
    },
    onError: (error) => {
      console.error("Failed to refund payment:", error);
      alert(error.response?.data?.message || "Failed to refund payment");
    },
  });

  const handleRefund = (payment) => {
    setSelectedPayment(payment);
    setRefundDialogOpen(true);
  };

  const confirmRefund = () => {
    if (selectedPayment) {
      refundMutation.mutate({
        id: selectedPayment.id,
        reason: refundReason || undefined,
      });
    }
  };

  // Map backend payments to frontend format
  const mappedPayments = (paymentsData || []).map((payment) => {
    const user = payment.user || {};
    const statusMap = {
      succeeded: "completed",
      pending: "pending",
      failed: "failed",
      refunded: "refunded",
    };

    return {
      id: payment.id,
      trader_id: user.email || payment.userId || "N/A",
      amount: payment.amount,
      currency: payment.currency || null,
      status:
        statusMap[payment.status] || payment.status?.toLowerCase() || "pending",
      payment_method: payment.provider || "unknown",
      transaction_id: payment.reference || "-",
      refund_reason: payment.refundReason || null,
      created_date: payment.createdAt,
    };
  });

  const displayPayments = mappedPayments;

  const filteredPayments = displayPayments.filter((payment) => {
    const matchesSearch =
      payment.trader_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Use statistics from backend
  const totalRevenue = statistics.totalRevenue || 0;
  const refundedAmount = statistics.refundedAmount || 0;
  const pendingAmount = statistics.pendingAmount || 0;
  const completedCount = statistics.completedCount || 0;

  const columns = [
    {
      header: t("admin.payments.table.trader"),
      accessorKey: "trader_id",
      cell: (row) => (
        <span className="text-white font-medium">{row.trader_id}</span>
      ),
    },
    {
      header: t("admin.payments.table.amount"),
      accessorKey: "amount",
      cell: (row) => (
        <span className="text-emerald-400 font-bold">${row.amount}</span>
      ),
    },
    {
      header: t("admin.payments.table.method"),
      accessorKey: "payment_method",
      cell: (row) => {
        // Map payment method to translation key
        const methodKey = row.payment_method?.toLowerCase() || "unknown";

        // Try to get translation from buyChallenge.paymentMethods first
        let translationKey = `buyChallenge.paymentMethods.${methodKey}.name`;
        let translatedMethod = t(translationKey);

        // If that doesn't exist, try admin.payments.methods
        if (translatedMethod === translationKey) {
          translationKey = `admin.payments.methods.${methodKey}`;
          translatedMethod = t(translationKey);
        }

        // If translation doesn't exist (returns the key), use capitalized original value
        const displayMethod =
          translatedMethod === translationKey
            ? methodKey.charAt(0).toUpperCase() + methodKey.slice(1)
            : translatedMethod;

        return (
          <span className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-slate-400" />
            {displayMethod}
          </span>
        );
      },
    },
    {
      header: t("admin.payments.table.transactionId"),
      accessorKey: "transaction_id",
      cell: (row) => (
        <span className="text-xs font-mono text-slate-400">
          {row.transaction_id || "-"}
        </span>
      ),
    },
    {
      header: t("admin.payments.table.status"),
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: t("admin.payments.table.date"),
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
      header: t("admin.payments.table.actions"),
      accessorKey: "id",
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.status === "completed" && (
            <Dialog
              open={refundDialogOpen && selectedPayment?.id === row.id}
              onOpenChange={(open) => {
                setRefundDialogOpen(open);
                if (!open) {
                  setSelectedPayment(null);
                  setRefundReason("");
                }
              }}
            >
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  onClick={() => handleRefund(row)}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  {t("admin.payments.actions.refund")}
                </Button>
              </DialogTrigger>
              <DialogContent
                className="
    bg-slate-900 border-slate-800 w-[95vw] sm:w-full sm:max-w-md p-4 sm:p-6
    [&>button]:text-white
    [&>button]:hover:text-white
  "
              >
                <DialogHeader>
                  <DialogTitle className="text-white text-base sm:text-lg md:text-xl">
                    {t("admin.payments.refundTitle") || "Refund Payment"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
                  <div>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      {t("admin.payments.refundConfirm") ||
                        `Are you sure you want to refund $${row.amount} to ${row.trader_id}?`}
                    </p>
                  </div>
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-slate-300 text-xs sm:text-sm">
                      {t("admin.payments.refundReason") ||
                        "Refund Reason (Optional)"}
                    </Label>
                    <Textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder={
                        t("admin.payments.refundReasonPlaceholder") ||
                        "Enter reason for refund..."
                      }
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRefundDialogOpen(false);
                        setSelectedPayment(null);
                        setRefundReason("");
                      }}
                      className="border-slate-600 text-amber-600 w-full sm:w-auto order-2 sm:order-1"
                    >
                      {t("admin.payments.cancel") || "Cancel"}
                    </Button>
                    <Button
                      onClick={confirmRefund}
                      disabled={refundMutation.isPending}
                      className="bg-amber-500 hover:bg-amber-600 text-white w-full sm:w-auto order-1 sm:order-2"
                    >
                      {refundMutation.isPending
                        ? t("admin.payments.refunding") || "Processing..."
                        : t("admin.payments.confirmRefund") || "Confirm Refund"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
          {row.status === "refunded" && (
            <div className="flex flex-col">
              <span className="text-xs text-slate-400">
                {t("admin.payments.actions.refunded")}
              </span>
              {row.refund_reason && (
                <span className="text-xs text-slate-500 mt-1">
                  {row.refund_reason}
                </span>
              )}
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {t("admin.payments.title")}
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            {t("admin.payments.subtitle")}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title={t("admin.payments.stats.totalRevenue")}
          value={`$${totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          gradient="from-emerald-500 to-teal-500"
          change={
            statistics.revenueChangePercent !== undefined
              ? t("admin.payments.stats.changeThisMonth", {
                  percent: Math.round(statistics.revenueChangePercent),
                })
              : undefined
          }
          changeType={
            statistics.revenueChangePercent >= 0 ? "positive" : "negative"
          }
        />
        <StatsCard
          title={t("admin.payments.stats.completed")}
          value={completedCount}
          icon={TrendingUp}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatsCard
          title={t("admin.payments.stats.pending")}
          value={`$${pendingAmount.toLocaleString()}`}
          icon={CreditCard}
          gradient="from-amber-500 to-orange-500"
        />
        <StatsCard
          title={t("admin.payments.stats.refunded")}
          value={`$${refundedAmount.toLocaleString()}`}
          icon={RefreshCw}
          gradient="from-red-500 to-pink-500"
        />
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={t("admin.payments.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] bg-slate-800 border-slate-700 text-white text-sm">
              <SelectValue placeholder={t("admin.payments.filter.status")} />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="all" className="text-white">
                {t("admin.payments.filter.allStatus")}
              </SelectItem>
              <SelectItem value="completed" className="text-white">
                {t("admin.payments.filter.completed")}
              </SelectItem>
              <SelectItem value="pending" className="text-white">
                {t("admin.payments.filter.pending")}
              </SelectItem>
              <SelectItem value="failed" className="text-white">
                {t("admin.payments.filter.failed")}
              </SelectItem>
              <SelectItem value="refunded" className="text-white">
                {t("admin.payments.filter.refunded")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Payments Table */}
      <Card className="bg-slate-900 border-slate-800 p-3 sm:p-4 md:p-6">
        <DataTable
          columns={columns}
          data={filteredPayments}
          isLoading={isLoading}
          emptyMessage={t("admin.payments.emptyMessage")}
        />
      </Card>
    </div>
  );
}
