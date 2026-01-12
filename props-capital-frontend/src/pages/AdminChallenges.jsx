import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetAllChallenges,
  adminCreateChallenge,
  adminUpdateChallenge,
  adminDeleteChallenge,
} from "@/api/admin";
import { useTranslation } from "../contexts/LanguageContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import {
  Plus,
  Pencil,
  Trash2,
  Award,
  DollarSign,
  AlertTriangle,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminChallenges() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteErrorOpen, setDeleteErrorOpen] = useState(false);
  const [challengeToDelete, setChallengeToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    account_size: "",
    price: "",
    challenge_type: "two_phase",
    phase1_profit_target: 8,
    phase2_profit_target: 5,
    max_daily_drawdown: 5,
    max_overall_drawdown: 10,
    min_trading_days: 4,
    max_trading_days: null,
    profit_split: 80,
    is_active: true,
    news_trading_allowed: true,
    weekend_holding_allowed: true,
    ea_allowed: true,
    scaling_enabled: false,
  });
  const queryClient = useQueryClient();

  const { data: challengesData = [], isLoading } = useQuery({
    queryKey: ["admin-challenges"],
    queryFn: adminGetAllChallenges,
  });

  const createMutation = useMutation({
    mutationFn: (data) => adminCreateChallenge(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      setIsOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminUpdateChallenge(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      setIsOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminDeleteChallenge(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-challenges"] });
      setDeleteConfirmOpen(false);
      setChallengeToDelete(null);
      toast({
        title: t("admin.challenges.deleteSuccess") || "Challenge deleted",
        description:
          t("admin.challenges.deleteSuccessDesc") ||
          "The challenge has been successfully deleted.",
        duration: 3000,
      });
    },
    onError: (error) => {
      setDeleteConfirmOpen(false);
      // Extract error message from various possible error structures
      const rawErrorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        "Failed to delete challenge. It may be in use by trading accounts.";

      // Check if it's the specific backend error about linked accounts
      if (
        rawErrorMessage.includes("linked to existing trading accounts") ||
        rawErrorMessage.includes(
          "Challenge cannot be deleted because it is linked"
        )
      ) {
        setDeleteError(t("admin.challenges.deleteErrorDesc"));
      } else {
        setDeleteError(rawErrorMessage);
      }
      setDeleteErrorOpen(true);
    },
  });

  const handleDeleteClick = (challenge) => {
    setChallengeToDelete(challenge);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (challengeToDelete) {
      deleteMutation.mutate(challengeToDelete.id);
    }
  };

  const resetForm = () => {
    setEditingChallenge(null);
    setFormData({
      name: "",
      description: "",
      account_size: "",
      price: "",
      challenge_type: "two_phase",
      phase1_profit_target: 8,
      phase2_profit_target: 5,
      max_daily_drawdown: 5,
      max_overall_drawdown: 10,
      min_trading_days: 4,
      max_trading_days: undefined,
      profit_split: 80,
      is_active: true,
      news_trading_allowed: true,
      weekend_holding_allowed: true,
      ea_allowed: true,
      scaling_enabled: false,
    });
  };

  const handleEdit = (challenge) => {
    setEditingChallenge(challenge);

    setFormData({
      name: challenge.name || "",
      description: challenge.description || "",
      account_size:
        (challenge.accountSize || challenge.account_size)?.toString() || "",
      price: challenge.price?.toString() || "",
      challenge_type:
        challenge.challengeType || challenge.challenge_type || "two_phase",
      phase1_profit_target:
        challenge.phase1TargetPercent || challenge.phase1_profit_target || 8,
      phase2_profit_target:
        challenge.phase2TargetPercent || challenge.phase2_profit_target || 5,
      max_daily_drawdown:
        challenge.dailyDrawdownPercent || challenge.max_daily_drawdown || 5,
      max_overall_drawdown:
        challenge.overallDrawdownPercent ||
        challenge.max_overall_drawdown ||
        10,
      min_trading_days:
        challenge.minTradingDays || challenge.min_trading_days || 4,
      max_trading_days: challenge.maxTradingDays || challenge.max_trading_days,
      profit_split: challenge.profitSplit || challenge.profit_split || 80,
      is_active:
        challenge.isActive !== undefined
          ? challenge.isActive
          : challenge.is_active !== undefined
          ? challenge.is_active
          : true,
      news_trading_allowed:
        challenge.newsTradingAllowed !== undefined
          ? challenge.newsTradingAllowed
          : challenge.news_trading_allowed !== undefined
          ? challenge.news_trading_allowed
          : true,
      weekend_holding_allowed:
        challenge.weekendHoldingAllowed !== undefined
          ? challenge.weekendHoldingAllowed
          : challenge.weekend_holding_allowed !== undefined
          ? challenge.weekend_holding_allowed
          : true,
      ea_allowed:
        challenge.eaAllowed !== undefined
          ? challenge.eaAllowed
          : challenge.ea_allowed !== undefined
          ? challenge.ea_allowed
          : true,
      scaling_enabled:
        challenge.scalingEnabled !== undefined
          ? challenge.scalingEnabled
          : challenge.scaling_enabled !== undefined
          ? challenge.scaling_enabled
          : false,
    });
    setIsOpen(true);
  };

  const handleSubmit = () => {
    const data = {
      name: formData.name,
      description: formData.description || null,
      accountSize: formData.account_size
        ? parseInt(formData.account_size)
        : undefined,
      price: formData.price ? parseInt(formData.price) : undefined,
      challengeType: formData.challenge_type || "two_phase",
      challenge_type: formData.challenge_type || "two_phase", // Send both formats for compatibility
      phase1TargetPercent: formData.phase1_profit_target || 8,
      phase2TargetPercent: formData.phase2_profit_target || 5,
      dailyDrawdownPercent: formData.max_daily_drawdown || 5,
      overallDrawdownPercent: formData.max_overall_drawdown || 10,
      minTradingDays: formData.min_trading_days || 4,
      maxTradingDays: formData.max_trading_days
        ? parseInt(formData.max_trading_days)
        : null,
      profitSplit: formData.profit_split || 80,
      profit_split: formData.profit_split || 80, // Send both formats for compatibility
      isActive: formData.is_active !== undefined ? formData.is_active : true,
      is_active: formData.is_active !== undefined ? formData.is_active : true, // Send both formats for compatibility
      newsTradingAllowed:
        formData.news_trading_allowed !== undefined
          ? formData.news_trading_allowed
          : true,
      news_trading_allowed:
        formData.news_trading_allowed !== undefined
          ? formData.news_trading_allowed
          : true, // Send both formats for compatibility
      weekendHoldingAllowed:
        formData.weekend_holding_allowed !== undefined
          ? formData.weekend_holding_allowed
          : true,
      weekend_holding_allowed:
        formData.weekend_holding_allowed !== undefined
          ? formData.weekend_holding_allowed
          : true, // Send both formats for compatibility
      eaAllowed: formData.ea_allowed !== undefined ? formData.ea_allowed : true,
      ea_allowed:
        formData.ea_allowed !== undefined ? formData.ea_allowed : true, // Send both formats for compatibility
      scalingEnabled:
        formData.scaling_enabled !== undefined
          ? formData.scaling_enabled
          : false,
      scaling_enabled:
        formData.scaling_enabled !== undefined
          ? formData.scaling_enabled
          : false,
      platform: null, // Explicitly send null to prevent backend defaulting to MT5 if possible
    };

    if (editingChallenge) {
      updateMutation.mutate({ id: editingChallenge.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Map backend challenges to frontend format
  const challenges = (challengesData || []).map((challenge) => ({
    id: challenge.id,
    name: challenge.name,
    account_size: challenge.accountSize || challenge.account_size,
    price: challenge.price,
    challenge_type:
      challenge.challengeType || challenge.challenge_type || "two_phase",
    phase1_profit_target:
      challenge.phase1TargetPercent || challenge.phase1_profit_target || 8,
    phase2_profit_target:
      challenge.phase2TargetPercent || challenge.phase2_profit_target || 5,
    max_daily_drawdown:
      challenge.dailyDrawdownPercent || challenge.max_daily_drawdown || 5,
    max_overall_drawdown:
      challenge.overallDrawdownPercent || challenge.max_overall_drawdown || 10,
    min_trading_days:
      challenge.minTradingDays || challenge.min_trading_days || 4,
    profit_split: challenge.profitSplit || challenge.profit_split || 80,
    is_active:
      challenge.isActive !== undefined
        ? challenge.isActive
        : challenge.is_active !== undefined
        ? challenge.is_active
        : true,
    news_trading_allowed:
      challenge.newsTradingAllowed !== undefined
        ? challenge.newsTradingAllowed
        : challenge.news_trading_allowed !== undefined
        ? challenge.news_trading_allowed
        : true,
    weekend_holding_allowed:
      challenge.weekendHoldingAllowed !== undefined
        ? challenge.weekendHoldingAllowed
        : challenge.weekend_holding_allowed !== undefined
        ? challenge.weekend_holding_allowed
        : true,
    ea_allowed:
      challenge.eaAllowed !== undefined
        ? challenge.eaAllowed
        : challenge.ea_allowed !== undefined
        ? challenge.ea_allowed
        : true,
    scaling_enabled:
      challenge.scalingEnabled !== undefined
        ? challenge.scalingEnabled
        : challenge.scaling_enabled !== undefined
        ? challenge.scaling_enabled
        : false,
  }));

  const displayChallenges = challenges;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {t("admin.challenges.title")}
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            {t("admin.challenges.subtitle")}
          </p>
        </div>
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              resetForm();
            }
          }}
        >
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              {t("admin.challenges.createChallenge")}
            </Button>
          </DialogTrigger>
          <DialogContent
            className="bg-slate-900 border-slate-800 w-[95vw] sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
            key={editingChallenge?.id || "new"}
          >
            <DialogHeader>
              <DialogTitle className="text-white text-base sm:text-lg md:text-xl">
                {editingChallenge
                  ? t("admin.challenges.editChallenge")
                  : t("admin.challenges.createNewChallenge")}
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 sm:gap-4 mt-3 sm:mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.challenges.form.challengeName")}
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="$50K Standard"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.challenges.form.challengeType")}
                  </Label>
                  <Select
                    value={formData.challenge_type}
                    onValueChange={(v) =>
                      setFormData({ ...formData, challenge_type: v })
                    }
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="one_phase" className="text-white">
                        {t("admin.challenges.form.onePhase")}
                      </SelectItem>
                      <SelectItem value="two_phase" className="text-white">
                        {t("admin.challenges.form.twoPhase")}
                      </SelectItem>
                      <SelectItem
                        value="instant_funding"
                        className="text-white"
                      >
                        {t("admin.challenges.form.instantFunding")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.challenges.form.accountSize")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.account_size}
                    onChange={(e) =>
                      setFormData({ ...formData, account_size: e.target.value })
                    }
                    placeholder="50000"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.challenges.form.price")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    placeholder="299"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.challenges.form.phase1ProfitTarget")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.phase1_profit_target}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phase1_profit_target: parseFloat(e.target.value),
                      })
                    }
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.challenges.form.phase2ProfitTarget")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.phase2_profit_target}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        phase2_profit_target: parseFloat(e.target.value),
                      })
                    }
                    className="bg-slate-800 border-slate-700 text-sm text-white"
                    disabled={formData.challenge_type === "one_phase"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.challenges.form.dailyDrawdown")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.max_daily_drawdown}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_daily_drawdown: parseFloat(e.target.value),
                      })
                    }
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.challenges.form.overallDrawdown")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.max_overall_drawdown}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_overall_drawdown: parseFloat(e.target.value),
                      })
                    }
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.challenges.form.profitSplit")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.profit_split}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        profit_split: parseFloat(e.target.value),
                      })
                    }
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.challenges.form.minTradingDays")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.min_trading_days}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        min_trading_days: parseInt(e.target.value),
                      })
                    }
                    placeholder="4"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                  />

                  <p className="text-xs text-slate-500">
                    {t("admin.challenges.form.minTradingDaysHint") ||
                      "Minimum days trader must trade"}
                  </p>
                </div>
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-slate-300 text-xs sm:text-sm">
                    {t("admin.challenges.form.maxTradingDays")}
                  </Label>
                  <Input
                    type="number"
                    value={formData.max_trading_days || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        max_trading_days: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="30"
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 text-sm"
                  />
                  <p className="text-xs text-slate-500">
                    {t("admin.challenges.form.maxTradingDaysHint") ||
                      "Challenge expires after X days (leave empty for unlimited)"}
                  </p>
                </div>
              </div>

              <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-slate-800">
                <h4 className="text-white font-medium text-xs sm:text-sm">
                  {t("admin.challenges.form.tradingRules")}
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:gap-3">
                  <div className="flex items-center justify-between py-1">
                    <Label className="text-slate-300 text-xs sm:text-sm">
                      {t("admin.challenges.form.newsTradingAllowed")}
                    </Label>
                    <Switch
                      checked={formData.news_trading_allowed}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, news_trading_allowed: v })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <Label className="text-slate-300 text-xs sm:text-sm">
                      {t("admin.challenges.form.weekendHolding")}
                    </Label>
                    <Switch
                      checked={formData.weekend_holding_allowed}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, weekend_holding_allowed: v })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <Label className="text-slate-300 text-xs sm:text-sm">
                      {t("admin.challenges.form.eaBotsAllowed", {
                        ea: t("admin.challenges.form.ea"),
                        bots: t("admin.challenges.form.bots"),
                      })}
                    </Label>
                    <Switch
                      checked={formData.ea_allowed}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, ea_allowed: v })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <Label className="text-slate-300 text-xs sm:text-sm">
                      {t("admin.challenges.form.active")}
                    </Label>
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(v) =>
                        setFormData({ ...formData, is_active: v })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSubmit}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 mt-4"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? t("admin.challenges.saving")
                  : editingChallenge
                  ? t("admin.challenges.updateChallenge")
                  : t("admin.challenges.createChallenge")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Challenges Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="bg-slate-900 border-slate-800 p-4 sm:p-6">
              <Skeleton className="h-8 w-24 mb-4" />
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="space-y-2 mb-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
              <div className="pt-4 border-t border-slate-800">
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : displayChallenges.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">
            {t("admin.challenges.noChallenges") || "No challenges available"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {displayChallenges.map((challenge) => (
            <Card
              key={challenge.id}
              className={`bg-slate-900 border-slate-800 p-4 sm:p-6 ${
                !challenge.is_active ? "opacity-60" : ""
              }`}
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Award className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-white truncate">
                      {challenge.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 capitalize">
                      {t(`admin.challenges.types.${challenge.challenge_type}`, {
                        defaultValue: challenge.challenge_type?.replace(
                          /_/g,
                          " "
                        ),
                      })}
                    </p>
                  </div>
                </div>
                {!challenge.is_active && (
                  <span className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs flex-shrink-0">
                    {t("admin.challenges.inactive")}
                  </span>
                )}
              </div>

              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-400">
                    {t("admin.challenges.card.accountSize")}
                  </span>
                  <span className="text-white font-medium">
                    ${challenge.account_size?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-400">
                    {t("admin.challenges.card.price")}
                  </span>
                  <span className="text-emerald-400 font-medium">
                    ${challenge.price}
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-400">
                    {t("admin.challenges.card.profitTarget")}
                  </span>
                  <span className="text-white">
                    {challenge.phase1_profit_target}% /{" "}
                    {challenge.phase2_profit_target}%
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-400">
                    {t("admin.challenges.card.drawdown")}
                  </span>
                  <span className="text-white">
                    {challenge.max_daily_drawdown}% /{" "}
                    {challenge.max_overall_drawdown}%
                  </span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-slate-400">
                    {t("admin.challenges.card.profitSplit")}
                  </span>
                  <span className="text-emerald-400 font-medium">
                    {challenge.profit_split}%
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-slate-600 bg-slate-800/50 text-white hover:bg-slate-700 hover:text-white  text-xs sm:text-sm"
                  onClick={() => handleEdit(challenge)}
                >
                  <Pencil className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  {t("admin.challenges.edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                  onClick={() => handleDeleteClick(challenge)}
                >
                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              {t("admin.challenges.deleteConfirmTitle") || "Delete Challenge"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-slate-300">
              {t("admin.challenges.deleteConfirmMessage", {
                name: challengeToDelete?.name || "this challenge",
              }) ||
                `Are you sure you want to delete "${challengeToDelete?.name}"? This action cannot be undone.`}
            </p>
            <p className="text-sm text-slate-400">
              {t("admin.challenges.deleteConfirmWarning") ||
                "Only challenges that are not currently in use can be deleted."}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                className="border-slate-700 text-slate-300 hover:text-black"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setChallengeToDelete(null);
                }}
                disabled={deleteMutation.isPending}
              >
                {t("admin.challenges.cancel") || "Cancel"}
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending
                  ? t("admin.challenges.deleting") || "Deleting..."
                  : t("admin.challenges.confirmDelete") || "Delete Challenge"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Error Dialog */}
      <Dialog open={deleteErrorOpen} onOpenChange={setDeleteErrorOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 mx-4 sm:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2 text-base sm:text-lg">
              <AlertCircle className="w-5 h-5 text-red-400" />
              {t("admin.challenges.deleteErrorTitle") ||
                "Cannot Delete Challenge"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="text-red-400 font-medium mb-2">
                {t("admin.challenges.deleteErrorMessage") ||
                  "This challenge cannot be deleted"}
              </p>
              <p className="text-slate-300 text-sm">
                {deleteError ||
                  t("admin.challenges.deleteErrorDesc") ||
                  "This challenge is currently being used by one or more trading accounts. Please ensure all accounts using this challenge are removed or deleted before attempting to delete the challenge."}
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                className="bg-slate-700 hover:bg-slate-600 text-white"
                onClick={() => {
                  setDeleteErrorOpen(false);
                  setDeleteError(null);
                  setChallengeToDelete(null);
                }}
              >
                {t("admin.challenges.understand") || "I Understand"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
