import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { getCurrentUser } from "@/api/auth";
import { getUserAccounts } from "@/api/accounts";
import {
  getUserPayouts,
  requestPayout,
  getPayoutStatistics,
} from "@/api/payouts";
import { useTranslation } from "../contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatsCard from "../components/shared/StatsCard";
import StatusBadge from "../components/shared/StatusBadge";
import DataTable from "../components/shared/DataTable";
import {
  Wallet,
  DollarSign,
  Clock,
  CheckCircle,
  Plus,
  Calendar,
  CreditCard,
  Bitcoin,
  Zap,
  Percent,
  ChevronRight,
} from "lucide-react";
import { format, addDays } from "date-fns";
import { Link } from "react-router-dom";
import { createPageUrl } from "../utils";

export default function TraderPayouts() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [requestForm, setRequestForm] = useState({
    tradingAccountId: "",
    payment_method: "",
    payment_details: "",
  });
  const queryClient = useQueryClient();

  // Get current user
  const { data: user } = useQuery({
    queryKey: ["user", "me"],
    queryFn: getCurrentUser,
    retry: false,
  });

  useEffect(() => {
    // Check URL params for account
    const params = new URLSearchParams(window.location.search);
    const accountParam = params.get("account");
    if (accountParam) setSelectedAccount(accountParam);
  }, []);

  // Get user's trading accounts (filter for funded accounts)
  const { data: allAccounts = [] } = useQuery({
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
    retry: false,
    refetchInterval: 30000, // Update every 30 seconds
  });

  // Filter for funded accounts
  const accounts = allAccounts.filter(
    (account) => account.status === "ACTIVE" && account.phase === "FUNDED",
  );

  // Get user's payouts (with account filtering)
  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ["payouts", user?.userId, selectedAccount],
    queryFn: async () => {
      if (!user?.userId) return [];
      try {
        const accountId = selectedAccount === "all" ? null : selectedAccount;
        return await getUserPayouts(user.userId, accountId);
      } catch (error) {
        console.error("Failed to fetch payouts:", error);
        return [];
      }
    },
    enabled: !!user?.userId,
    retry: false,
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // Get payout statistics
  const { data: statisticsData } = useQuery({
    queryKey: ["payout-statistics", user?.userId, selectedAccount],
    queryFn: async () => {
      if (!user?.userId) return null;
      try {
        const accountId = selectedAccount === "all" ? null : selectedAccount;
        return await getPayoutStatistics(user.userId, accountId);
      } catch (error) {
        console.error("Failed to fetch payout statistics:", error);
        return null;
      }
    },
    enabled: !!user?.userId,
    retry: false,
    refetchInterval: 5000, // Real-time updates every 5 seconds
  });

  // Request payout mutation
  const createPayoutMutation = useMutation({
    mutationFn: async (data) => {
      return requestPayout(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts", user?.userId] });
      setIsOpen(false);
      setRequestForm({
        tradingAccountId: "",
        payment_method: "",
        payment_details: "",
      });
    },
  });

  const handleSubmit = () => {
    if (!user?.userId || !requestForm.tradingAccountId) return;

    createPayoutMutation.mutate({
      userId: user.userId,
      tradingAccountId: requestForm.tradingAccountId,
      payment_method: requestForm.payment_method,
      payment_details: requestForm.payment_details,
    });
  };

  // Extract statistics and settings from backend
  const statistics = statisticsData?.statistics || {
    totalEarnings: 0,
    pendingPayouts: 0,
    totalPayoutsCount: 0,
    nextPayoutDate: new Date().toISOString(),
  };

  const settings = statisticsData?.settings || {
    profitSplit: { base: 80, withScaling: 90 },
    frequency: "bi-weekly",
    processingTime: "2-5 business days",
    minimumAmount: 50,
    fees: "free",
    availablePaymentMethods: [],
  };

  // Map payouts to display format (handle field name differences)
  const displayPayouts = (payouts || []).map((payout) => ({
    id: payout.id,
    amount: payout.amount,
    status: payout.status?.toLowerCase() || payout.status,
    payment_method: payout.paymentMethod || payout.payment_method || null,
    created_date: payout.createdAt || payout.created_date,
    processed_date:
      payout.status === "PAID" || payout.status === "paid"
        ? payout.processedAt || payout.updatedAt || payout.processed_date
        : null,
    tradingAccount: payout.tradingAccount,
  }));

  // Helper function to translate backend frequency value
  const translateFrequency = (value) => {
    if (!value) return t("payouts.biWeekly");
    const valueLower = value.toLowerCase();
    if (valueLower === "bi-weekly" || valueLower === "biweekly") {
      return t("payouts.biWeeklyValue");
    }
    return value;
  };

  // Helper function to translate backend processing time value
  const translateProcessingTime = (value) => {
    if (!value) return t("payouts.processingTimeValue");
    const valueLower = value.toLowerCase();
    if (valueLower.includes("business days")) {
      return t("payouts.businessDays");
    }
    return value;
  };

  // Helper function to translate backend fees value
  const translateFees = (value) => {
    if (!value) return t("payouts.free");
    const valueLower = value.toLowerCase();
    if (valueLower === "free") {
      return t("payouts.freeValue");
    }
    return value;
  };

  // Helper function to translate payment method names
  const translatePaymentMethod = (name) => {
    if (!name) return name;
    const nameLower = name.toLowerCase();
    if (nameLower === "bank transfer" || nameLower === "bank_transfer") {
      return t("payouts.bankTransfer");
    }
    if (nameLower === "cryptocurrency" || nameLower === "crypto") {
      return t("payouts.cryptocurrency");
    }
    // If it's already a translation key, use it, otherwise return the name as-is
    return name;
  };

  // Helper function to translate payment method processing time (e.g., "2-5 business days")
  const translatePaymentMethodTime = (value) => {
    if (!value) return value;
    const valueLower = value.toLowerCase();
    if (valueLower.includes("business days")) {
      // Replace "business days" with translated version, preserving any number prefix
      return value.replace(/business\s+days/gi, t("payouts.businessDaysOnly"));
    }
    return value;
  };

  const payoutColumns = [
    {
      header: t("payouts.date"),
      accessorKey: "created_date",
      cell: (row) =>
        row.created_date
          ? format(new Date(row.created_date), "MMM d, yyyy")
          : "-",
    },
    {
      header: t("payouts.amount"),
      accessorKey: "amount",
      cell: (row) => (
        <span className="text-white font-semibold">
          ${row.amount?.toLocaleString()}
        </span>
      ),
    },
    {
      header: t("payouts.method"),
      accessorKey: "payment_method",
      cell: (row) => {
        const methodMap = {
          bank_transfer: t("payouts.bankTransfer"),
          crypto: t("payouts.cryptocurrency"),
          paypal: t("payouts.paypal"),
          wise: t("payouts.wise"),
        };
        return (
          <span className="capitalize">
            {methodMap[row.payment_method] ||
              row.payment_method?.replace(/_/g, " ")}
          </span>
        );
      },
    },
    {
      header: t("payouts.status"),
      accessorKey: "status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: t("payouts.processed"),
      accessorKey: "processed_date",
      cell: (row) =>
        row.processed_date
          ? format(new Date(row.processed_date), "MMM d, yyyy")
          : "-",
    },
  ];

  // Calculate next payout date - use backend value or calculate based on frequency setting
  const nextPayoutDate = statistics.nextPayoutDate
    ? new Date(statistics.nextPayoutDate)
    : (() => {
        const frequency = settings?.frequency?.toLowerCase();
        let daysUntilNext = 14; // Default to bi-weekly

        if (frequency === "weekly") {
          daysUntilNext = 7 - (new Date().getDay() % 7);
        } else if (frequency === "bi-weekly" || frequency === "biweekly") {
          daysUntilNext = 14 - (new Date().getDate() % 14);
        } else if (frequency === "monthly") {
          const today = new Date();
          const lastDayOfMonth = new Date(
            today.getFullYear(),
            today.getMonth() + 1,
            0,
          ).getDate();
          daysUntilNext = lastDayOfMonth - today.getDate();
        }

        return addDays(new Date(), daysUntilNext);
      })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t("payouts.title")}
          </h1>
          <p className="text-slate-400">{t("payouts.subtitle")}</p>
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
            <SelectValue
              placeholder={t("payouts.selectAccount") || "Select Account"}
            />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-slate-800 text-white">
            <SelectItem value="all" className="text-white">
              {t("payouts.allAccounts") || "All Accounts"}
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
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-cyan-500"
              disabled={accounts.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("payouts.requestPayout")}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">
                {t("payouts.requestPayout")}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-slate-300">
                  {t("payouts.selectAccount")}
                </Label>
                <Select
                  onValueChange={(value) =>
                    setRequestForm({ ...requestForm, tradingAccountId: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue
                      placeholder={t("payouts.selectFundedAccount")}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {accounts.map((acc) => {
                      const accChallenge = acc.challenge || {};
                      const accInitialBalance =
                        acc.initialBalance || accChallenge.accountSize || 0;
                      const accPlatform = accChallenge.platform || "MT5";
                      return (
                        <SelectItem
                          key={acc.id}
                          value={acc.id}
                          className="text-white"
                        >
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

              <div className="space-y-2">
                <Label className="text-slate-300">
                  {t("payouts.paymentMethod")}
                </Label>
                <Select
                  onValueChange={(value) =>
                    setRequestForm({ ...requestForm, payment_method: value })
                  }
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue
                      placeholder={t("payouts.selectPaymentMethod")}
                    />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 text-white">
                    {settings.availablePaymentMethods &&
                    settings.availablePaymentMethods.length > 0
                      ? settings.availablePaymentMethods.map((method) => (
                          <SelectItem
                            key={method.id}
                            value={method.id}
                            className="text-white"
                          >
                            {method.name}
                          </SelectItem>
                        ))
                      : [
                          {
                            id: "bank_transfer",
                            name: t("payouts.bankTransfer"),
                          },
                          { id: "crypto", name: t("payouts.cryptocurrency") },
                          { id: "paypal", name: t("payouts.paypal") },
                          { id: "wise", name: t("payouts.wise") },
                        ].map((method) => (
                          <SelectItem
                            key={method.id}
                            value={method.id}
                            className="text-white"
                          >
                            {method.name}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">
                  {t("payouts.paymentDetails")}
                </Label>
                <Textarea
                  placeholder={t("payouts.paymentDetailsPlaceholder")}
                  value={requestForm.payment_details}
                  onChange={(e) =>
                    setRequestForm({
                      ...requestForm,
                      payment_details: e.target.value,
                    })
                  }
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500"
                disabled={
                  createPayoutMutation.isPending ||
                  !requestForm.tradingAccountId
                }
              >
                {createPayoutMutation.isPending
                  ? t("payouts.submitting")
                  : t("payouts.submitRequest")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatsCard
          title={t("payouts.totalEarnings")}
          value={`$${statistics.totalEarnings.toLocaleString()}`}
          icon={DollarSign}
          gradient="from-emerald-500 to-teal-500"
        />
        <StatsCard
          title={t("payouts.pendingPayouts")}
          value={`$${statistics.pendingPayouts.toLocaleString()}`}
          icon={Clock}
          gradient="from-amber-500 to-orange-500"
        />
        <StatsCard
          title={t("payouts.totalPayouts")}
          value={statistics.totalPayoutsCount}
          icon={CheckCircle}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatsCard
          title={t("payouts.nextPayout")}
          value={format(nextPayoutDate, "MMM d")}
          icon={Calendar}
          gradient="from-purple-500 to-pink-500"
        />
      </div>

      {/* Payout Schedule */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t("payouts.payoutSchedule")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {[
            {
              icon: Calendar,
              title: t("payouts.payoutFrequency"),
              value: translateFrequency(settings.frequency),
            },
            {
              icon: Clock,
              title: t("payouts.processingTime"),
              value: translateProcessingTime(settings.processingTime),
            },
            {
              icon: DollarSign,
              title: t("payouts.minimumAmount"),
              value: `$${settings.minimumAmount || 50}`,
            },
            {
              icon: CheckCircle,
              title: t("payouts.payoutFee"),
              value: translateFees(settings.fees),
            },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center">
                <item.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{item.title}</p>
                <p className="text-white font-medium">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment Methods */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t("payouts.availablePaymentMethods")}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {(settings.availablePaymentMethods &&
          settings.availablePaymentMethods.length > 0
            ? settings.availablePaymentMethods.map((method) => ({
                icon: method.id === "crypto" ? Bitcoin : CreditCard,
                name: translatePaymentMethod(method.name),
                time: translatePaymentMethodTime(method.processingTime),
              }))
            : [
                {
                  icon: CreditCard,
                  name: t("payouts.bankTransfer"),
                  time: t("payouts.bankTransferTime"),
                },
                {
                  icon: Bitcoin,
                  name: t("payouts.cryptocurrency"),
                  time: t("payouts.cryptoTime"),
                },
                {
                  icon: CreditCard,
                  name: t("payouts.paypal"),
                  time: t("payouts.paypalTime"),
                },
                {
                  icon: CreditCard,
                  name: t("payouts.wise"),
                  time: t("payouts.wiseTime"),
                },
              ]
          ).map((method, i) => (
            <div key={i} className="bg-slate-800/50 rounded-lg p-4 text-center">
              <method.icon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-white font-medium">{method.name}</p>
              <p className="text-xs text-slate-400">{method.time}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Profit Split Info */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Percent className="w-7 h-7 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {t("payouts.yourProfitSplit")}
              </h3>
              <p className="text-slate-400">{t("payouts.profitSplitDesc")}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl font-bold text-purple-400">
                {settings.profitSplit?.base || 80}%
              </p>
              <p className="text-xs text-slate-400">
                {t("payouts.currentSplit")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-emerald-400">
                {settings.profitSplit?.withScaling || 90}%
              </p>
              <p className="text-xs text-slate-400">
                {t("payouts.withScaling")}
              </p>
            </div>
            <Link to={createPageUrl("ScalingPlan")}>
              <Button className="bg-purple-500 hover:bg-purple-600">
                <Zap className="w-4 h-4 mr-2" />
                {t("payouts.viewScalingPlan")}
              </Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Payout History */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          {t("payouts.payoutHistory")}
        </h3>
        <DataTable
          columns={payoutColumns}
          data={displayPayouts}
          isLoading={isLoading}
          emptyMessage={t("payouts.noPayouts")}
        />
      </Card>

      {/* Help Card */}
      <Card className="bg-slate-900 border-slate-800 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold mb-1">
              {t("payouts.needHelp")}
            </h3>
            <p className="text-slate-400 text-sm">
              {t("payouts.needHelpDesc")}
            </p>
          </div>
          <Link to={createPageUrl("Support")}>
            <Button
              variant="outline"
              className="border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700 hover:text-white"
            >
              {t("payouts.contactSupport")}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
