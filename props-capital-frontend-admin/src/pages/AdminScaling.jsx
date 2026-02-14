import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api";
import { useTranslation } from "../../../props-capital-frontend/src/contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CheckCircle,
  XCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Loader2,
} from "lucide-react";

// Transform backend response to frontend expected format
const transformRequest = (request) => {
  const tradingAccount = request.tradingAccount || {};
  const user = tradingAccount.user || {};
  const challenge = tradingAccount.challenge || {};
  const payouts = tradingAccount.payouts || [];

  // Calculate profit achieved as percentage
  const initialBalance = tradingAccount.initialBalance || request.oldBalance;
  const currentBalance = tradingAccount.balance || 0;
  const profitAchieved =
    initialBalance > 0
      ? ((currentBalance - initialBalance) / initialBalance) * 100
      : 0;

  // Count completed payouts
  const completedPayouts = payouts.filter(
    (p) => p.status === "COMPLETED" || p.status === "PAID",
  ).length;

  return {
    id: request.id,
    trader_id: user.id || tradingAccount.userId,
    trader_email: user.email,
    trader_name: user.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user.email,
    current_account_size: request.oldBalance,
    new_account_size: request.newBalance,
    current_profit_split: request.oldProfitSplit || challenge.profitSplit || 80,
    new_profit_split: request.newProfitSplit || 85,
    current_level: Math.floor(request.oldBalance / 50000) || 1,
    requested_level: Math.floor(request.newBalance / 50000) || 2,
    profit_achieved: profitAchieved,
    payout_cycles_completed: completedPayouts,
    eligibility_check: {
      profit_requirement_met: profitAchieved >= 10,
      payout_cycles_met: completedPayouts >= 2,
    },
    status: request.status?.toLowerCase() || "pending",
    reason: request.reason,
    requestedAt: request.requestedAt,
    approvedAt: request.approvedAt,
    processedAt: request.processedAt,
    brokerLogin: tradingAccount.brokerLogin,
  };
};

export default function AdminScaling() {
  const { t } = useTranslation();
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["scaling-requests"],
    queryFn: async () => {
      const data = await apiGet("/admin/scaling/requests");
      return data.map(transformRequest);
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (requestId) => {
      return await apiPost(`/admin/scaling/approve/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scaling-requests"] });
      setSelectedRequest(null);
      setNotes("");
    },
  });

  const processMutation = useMutation({
    mutationFn: async (requestId) => {
      return await apiPost(`/admin/scaling/process/${requestId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scaling-requests"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ requestId, reason }) => {
      return await apiPost(`/admin/scaling/reject/${requestId}`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scaling-requests"] });
      setSelectedRequest(null);
      setNotes("");
    },
  });

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const approvedRequests = requests.filter((r) => r.status === "approved");
  const completedRequests = requests.filter((r) => r.status === "completed");

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 whitespace-nowrap">
            <Clock className="w-3 h-3 mr-1" />{" "}
            {t("admin.scaling.status.pending")}
          </Badge>
        );
      case "approved":
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 whitespace-nowrap">
            <CheckCircle className="w-3 h-3 mr-1" />{" "}
            {t("admin.scaling.status.approved")}
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 whitespace-nowrap">
            <CheckCircle className="w-3 h-3 mr-1" />{" "}
            {t("admin.scaling.status.completed")}
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 whitespace-nowrap">
            <XCircle className="w-3 h-3 mr-1" />{" "}
            {t("admin.scaling.status.rejected")}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/20 text-slate-400 whitespace-nowrap">
            {status}
          </Badge>
        );
    }
  };

  const RequestsTable = ({ data, showActions }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-slate-200 dark:border-border bg-slate-200 dark:bg-muted/50 [&_tr]:hover:bg-transparent">
            <TableHead className="text-slate-800 dark:text-muted-foreground font-semibold text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
              {t("admin.scaling.table.trader")}
            </TableHead>
            <TableHead className="text-slate-800 dark:text-muted-foreground font-semibold text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
              {t("admin.scaling.table.currentToNew")}
            </TableHead>
            <TableHead className="text-slate-800 dark:text-muted-foreground font-semibold text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
              {t("admin.scaling.table.profitSplit")}
            </TableHead>
            <TableHead className="text-slate-800 dark:text-muted-foreground font-semibold text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
              {t("admin.scaling.table.profitAchieved")}
            </TableHead>
            <TableHead className="text-slate-800 dark:text-muted-foreground font-semibold text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
              {t("admin.scaling.table.payoutCycles")}
            </TableHead>
            <TableHead className="text-slate-800 dark:text-muted-foreground font-semibold text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
              {t("admin.scaling.table.status")}
            </TableHead>
            {showActions && (
              <TableHead className="text-muted-foreground text-xs sm:text-sm px-2 sm:px-4 whitespace-nowrap">
                {t("admin.scaling.table.actions")}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((request) => (
            <TableRow
              key={request.id}
              className="border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-muted/50"
            >
              <TableCell className="px-2 sm:px-4 py-3">
                <div>
                  <p className="text-foreground font-medium text-xs sm:text-sm">
                    {request.brokerLogin || request.trader_id?.slice(0, 8)}...
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    {t("admin.scaling.table.level", {
                      current: request.current_level,
                      new: request.requested_level,
                    })}
                  </p>
                </div>
              </TableCell>
              <TableCell className="px-2 sm:px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    ${request.current_account_size?.toLocaleString()}
                  </span>
                  <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                  <span className="text-emerald-500 font-medium text-xs sm:text-sm">
                    ${request.new_account_size?.toLocaleString()}
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-2 sm:px-4 py-3 whitespace-nowrap">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    {request.current_profit_split}%
                  </span>
                  <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400" />
                  <span className="text-emerald-500 font-medium text-xs sm:text-sm">
                    {request.new_profit_split}%
                  </span>
                </div>
              </TableCell>
              <TableCell className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                <span
                  className={
                    request.eligibility_check?.profit_requirement_met
                      ? "text-emerald-500"
                      : "text-red-500"
                  }
                >
                  {request.profit_achieved?.toFixed(2)}%
                </span>
              </TableCell>
              <TableCell className="px-2 sm:px-4 py-3 text-xs sm:text-sm">
                <span
                  className={
                    request.eligibility_check?.payout_cycles_met
                      ? "text-emerald-500"
                      : "text-red-500"
                  }
                >
                  {request.payout_cycles_completed}
                </span>
              </TableCell>
              <TableCell className="px-2 sm:px-4 py-3">
                {getStatusBadge(request.status)}
              </TableCell>
              {showActions && (
                <TableCell className="px-2 sm:px-4 py-3">
                  <div className="flex gap-1.5 sm:gap-2">
                    {request.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-600 h-7 sm:h-9 text-[10px] sm:text-sm"
                          onClick={() =>
                            setSelectedRequest({
                              ...request,
                              action: "approve",
                            })
                          }
                        >
                          {t("admin.scaling.actions.approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-500/60 text-red-500 h-7 sm:h-9 text-[10px] sm:text-sm whitespace-nowrap"
                          onClick={() =>
                            setSelectedRequest({ ...request, action: "reject" })
                          }
                        >
                          {t("admin.scaling.actions.reject")}
                        </Button>
                      </>
                    )}
                    {request.status === "approved" && (
                      <Button
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 h-7 sm:h-9 text-[10px] sm:text-sm w-full"
                        onClick={() => processMutation.mutate(request.id)}
                        disabled={processMutation.isPending}
                      >
                        {processMutation.isPending
                          ? t("admin.scaling.actions.processing")
                          : t("admin.scaling.actions.process")}
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
          {data.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={showActions ? 7 : 6}
                className="text-center text-muted-foreground py-8 text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  t("admin.scaling.emptyMessage")
                )}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {t("admin.scaling.title")}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t("admin.scaling.subtitle")}
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="bg-card border-border p-3 sm:p-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-amber-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-[#d97706]" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-[#d97706] truncate">
                {pendingRequests.length}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {t("admin.scaling.summary.pendingReview")}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border p-3 sm:p-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-blue-500 truncate">
                {approvedRequests.length}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {t("admin.scaling.summary.readyToProcess")}
              </p>
            </div>
          </div>
        </Card>

        <Card className="bg-card border-border p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-xl sm:text-2xl font-bold text-emerald-500 truncate">
                {completedRequests.length}
              </p>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {t("admin.scaling.summary.completed")}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <div className="overflow-x-auto pb-1 scrollbar-hide">
          <TabsList className="bg-muted w-full sm:w-auto flex min-w-max">
            <TabsTrigger
              value="pending"
              className="text-muted-foreground text-xs sm:text-sm px-3 sm:px-6 data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              {t("admin.scaling.tabs.pending")} ({pendingRequests.length})
            </TabsTrigger>

            <TabsTrigger
              value="approved"
              className="text-muted-foreground text-xs sm:text-sm px-3 sm:px-6 data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              {t("admin.scaling.tabs.approved")} ({approvedRequests.length})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="text-muted-foreground text-xs sm:text-sm px-3 sm:px-6 data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              {t("admin.scaling.tabs.completed")} ({completedRequests.length})
            </TabsTrigger>
            <TabsTrigger
              value="all"
              className="text-muted-foreground text-xs sm:text-sm px-3 sm:px-6 data-[state=active]:bg-card data-[state=active]:text-foreground"
            >
              {t("admin.scaling.tabs.all")}
            </TabsTrigger>
          </TabsList>
        </div>

        <Card className="bg-card border-border overflow-hidden">
          <TabsContent value="pending" className="m-0">
            <RequestsTable data={pendingRequests} showActions />
          </TabsContent>
          <TabsContent value="approved" className="m-0">
            <RequestsTable data={approvedRequests} showActions />
          </TabsContent>
          <TabsContent value="completed" className="m-0">
            <RequestsTable data={completedRequests} showActions={false} />
          </TabsContent>
          <TabsContent value="all" className="m-0">
            <RequestsTable data={requests} showActions />
          </TabsContent>
        </Card>
      </Tabs>

      {/* Approve/Reject Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => setSelectedRequest(null)}
      >
        <DialogContent className="bg-card border-border w-[95vw] sm:w-full sm:max-w-md p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground text-base sm:text-lg md:text-xl">
              {selectedRequest?.action === "approve"
                ? t("admin.scaling.dialog.approveTitle")
                : t("admin.scaling.dialog.rejectTitle")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <div className="bg-muted/60 rounded-lg p-3 sm:p-4 space-y-1.5 sm:space-y-2">
              <div className="flex justify-between text-[11px] sm:text-sm">
                <span className="text-muted-foreground">
                  {t("admin.scaling.dialog.currentSize")}
                </span>
                <span className="text-foreground">
                  ${selectedRequest?.current_account_size?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[11px] sm:text-sm">
                <span className="text-muted-foreground">
                  {t("admin.scaling.dialog.newSize")}
                </span>
                <span className="text-emerald-500 font-medium">
                  ${selectedRequest?.new_account_size?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[11px] sm:text-sm">
                <span className="text-muted-foreground">
                  {t("admin.scaling.dialog.newProfitSplit")}
                </span>
                <span className="text-emerald-500 font-medium">
                  {selectedRequest?.new_profit_split}%
                </span>
              </div>
            </div>

            <div className="space-y-1 sm:space-y-1.5">
              <label className="text-xs sm:text-sm text-muted-foreground block">
                {t("admin.scaling.dialog.notes")}
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground text-sm min-h-[80px]"
                placeholder={t("admin.scaling.dialog.notesPlaceholder")}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
              <Button
                variant="outline"
                className="w-full sm:flex-1 border-border text-foreground hover:bg-accent h-9 sm:h-11 order-2 sm:order-1"
                onClick={() => setSelectedRequest(null)}
              >
                {t("admin.scaling.dialog.cancel")}
              </Button>
              {selectedRequest?.action === "approve" ? (
                <Button
                  className="w-full sm:flex-1 bg-emerald-500 hover:bg-emerald-600 h-9 sm:h-11 order-1 sm:order-2"
                  onClick={() => approveMutation.mutate(selectedRequest.id)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending
                    ? t("admin.scaling.actions.approving")
                    : t("admin.scaling.actions.approve")}
                </Button>
              ) : (
                <Button
                  className="w-full sm:flex-1 bg-red-500 hover:bg-red-600 h-9 sm:h-11 order-1 sm:order-2"
                  onClick={() =>
                    rejectMutation.mutate({
                      requestId: selectedRequest.id,
                      reason: notes,
                    })
                  }
                  disabled={rejectMutation.isPending}
                >
                  {rejectMutation.isPending
                    ? t("admin.scaling.actions.rejecting")
                    : t("admin.scaling.actions.reject")}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
