import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  X,
  TrendingDown,
  Shield,
  Calendar,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "../../utils";
import { useTranslation } from "../../contexts/LanguageContext";

export default function ViolationAlert({ account, onDismiss }) {
  const { t } = useTranslation();

  // Only show if account is failed - violation_reason is optional for display
  if (account.status !== "failed") {
    return null;
  }

  const violationDetails = {
    daily_drawdown: {
      icon: Shield,
      title: t("violationAlert.dailyDrawdownExceeded"),
      description: t("violationAlert.dailyDrawdownDescription", {
        limit: account.challenge?.dailyDrawdownPercent || 5,
      }),
      color: "red",
      value: `${account.daily_drawdown_percent?.toFixed(2)}%`,
      limit: `${account.challenge?.dailyDrawdownPercent || 5}%`,
    },
    overall_drawdown: {
      icon: TrendingDown,
      title: t("violationAlert.maximumDrawdownExceeded"),
      description: t("violationAlert.maximumDrawdownDescription", {
        limit: account.challenge?.overallDrawdownPercent || 10,
      }),
      color: "red",
      value: `${account.overall_drawdown_percent?.toFixed(2)}%`,
      limit: `${account.challenge?.overallDrawdownPercent || 10}%`,
    },
    max_trading_days: {
      icon: Calendar,
      title: t("violationAlert.maximumTradingDaysExceeded"),
      description: t("violationAlert.maximumTradingDaysDescription"),
      color: "amber",
      value: `${account.trading_days_count} ${t("violationAlert.days")}`,
      limit: `${account.challenge?.maxTradingDays || 30} ${t("violationAlert.days")}`,
    },
  };

  // Detect violation type from reason, or infer from current metrics
  const reasonLower = account.violation_reason?.toLowerCase() || "";
  let violationType = "overall_drawdown"; // Default

  if (reasonLower.includes("daily")) {
    violationType = "daily_drawdown";
  } else if (
    reasonLower.includes("overall") ||
    reasonLower.includes("max drawdown")
  ) {
    violationType = "overall_drawdown";
  } else if (reasonLower.includes("trading day")) {
    violationType = "max_trading_days";
  } else if (!account.violation_reason) {
    // Infer from metrics if no explicit reason
    if (
      account.daily_drawdown_percent >
      (account.challenge?.dailyDrawdownPercent || 5)
    ) {
      violationType = "daily_drawdown";
    } else if (
      account.overall_drawdown_percent >
      (account.challenge?.overallDrawdownPercent || 10)
    ) {
      violationType = "overall_drawdown";
    }
  }

  const details = violationDetails[violationType];
  const Icon = details.icon;

  return (
    <Card className="bg-red-500/10 border-2 border-red-500/50 p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, #ef4444 0, #ef4444 1px, transparent 0, transparent 50%)",
            backgroundSize: "20px 20px",
          }}
        />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-red-500/20 rounded-xl flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <Badge className="bg-red-500/30 text-red-300 border-red-500/50 mb-1">
                {t("violationAlert.accountFailed")}
              </Badge>
              <h3 className="text-xl font-bold text-red-400">
                {details.title}
              </h3>
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-slate-300 mb-4">{details.description}</p>

        {/* Violation Details */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon className="w-4 h-4 text-red-400" />
              <span className="text-sm text-slate-400">
                {t("violationAlert.valueAtViolation")}
              </span>
            </div>
            <p className="text-2xl font-bold text-red-400">{details.value}</p>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">
                {t("violationAlert.maximumAllowed")}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">{details.limit}</p>
          </div>
        </div>

        {/* Account Info */}
        <div className="bg-slate-900/50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-slate-400">
                {t("violationAlert.account")}
              </p>
              <p className="text-white font-medium">
                #{account.account_number}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">
                {t("violationAlert.finalBalance")}
              </p>
              <p className="text-white font-medium">
                ${account.current_balance?.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-slate-400">
                {t("violationAlert.tradingDays")}
              </p>
              <p className="text-white font-medium">
                {account.trading_days_count}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to={createPageUrl("BuyChallenge")} className="flex-1">
            <Button className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
              <RefreshCw className="w-4 h-4 mr-2" />
              {t("violationAlert.startNewChallenge")}
            </Button>
          </Link>
          <Link to={createPageUrl("Rules")} className="flex-1">
            <Button
              variant="outline"
              className="w-full border-slate-700 bg-slate-800/50 text-white hover:bg-slate-700"
            >
              {t("violationAlert.reviewTradingRules")}
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
