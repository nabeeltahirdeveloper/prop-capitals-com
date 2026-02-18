import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  Activity,
  Wallet,
  BarChart2,
  XCircle,
  Trophy,
  ArrowRight,
  Layers,
  Calendar,
} from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";

export default function AccountMetrics({ account, isLoading = false }) {
  const { t } = useTranslation();

  const displayEquity = account?.equity ?? 0;
  const displayFloatingPnL = account?.floatingPnL ?? 0;
  const displayDailyDrawdown = account?.dailyDrawdown ?? 0;
  const displayOverallDrawdown = account?.overallDrawdown ?? 0;

  const equityColor =
    displayEquity >= (account?.balance ?? 0)
      ? "text-emerald-400"
      : "text-red-400";
  const floatingPnLColor =
    displayFloatingPnL >= 0 ? "text-emerald-400" : "text-red-400";

  const {
    margin = 0,
    freeMargin = 100000,
    profitForTarget = 0,
    dailyDrawdown = 0,
    maxDailyDrawdown = 5,
    overallDrawdown = 3.5,
    maxOverallDrawdown = 10,
    profitTarget = 10,
    tradingDays = 0,
    minTradingDays = 5,
    daysRemaining = 0,
    phase = "phase1",
    status = "active",
  } = account || {};

  // Determine if account is locked or disqualified
  const statusUpper = String(status || "").toUpperCase();
  const isLocked =
    statusUpper.includes("DAILY") ||
    statusUpper.includes("FAIL") ||
    statusUpper.includes("DISQUAL");
  const isDailyLocked = statusUpper.includes("DAILY");
  const isDisqualified =
    statusUpper.includes("FAIL") || statusUpper.includes("DISQUAL");

  const dailyDDUsage = isDailyLocked
    ? 100
    : (displayDailyDrawdown / maxDailyDrawdown) * 100;
  const overallDDUsage = isDisqualified
    ? 100
    : (displayOverallDrawdown / maxOverallDrawdown) * 100;

  const profitProgress = (profitForTarget / profitTarget) * 100;

  const isFailed =
    status === "failed" ||
    phase === "failed" ||
    statusUpper.includes("FAIL") ||
    statusUpper.includes("DISQUAL") ||
    statusUpper.includes("DAILY");
  const isFunded = phase === "funded" || phase === "FUNDED";
  const isPhase2 = phase === "phase2" || phase === "PHASE2";
  const isPhase1 = phase === "phase1" || phase === "PHASE1";

  const phase1ProfitMet = profitForTarget >= profitTarget;
  const phase1TradingDaysMet = tradingDays >= minTradingDays;
  const phase1DailyDDMet = !isLocked && dailyDrawdown < maxDailyDrawdown;
  const phase1OverallDDMet = !isLocked && overallDrawdown < maxOverallDrawdown;
  const phase1Passed =
    phase1ProfitMet &&
    phase1TradingDaysMet &&
    phase1DailyDDMet &&
    phase1OverallDDMet;

  // Phase progression
  const getPhaseStatus = (targetPhase) => {
    if (isFailed) return "failed";
    if (targetPhase === "phase1") {
      return isPhase1
        ? "active"
        : isPhase2 || isFunded
          ? "completed"
          : "pending";
    }
    if (targetPhase === "phase2") {
      return isPhase2
        ? "active"
        : isFunded
          ? "completed"
          : isPhase1 && phase1Passed
            ? "pending"
            : "locked";
    }
    if (targetPhase === "funded") {
      return isFunded ? "completed" : "locked";
    }
    return "locked";
  };

  const getDDStatus = (usage) => {
    if (usage >= 80)
      return { color: "text-red-400", bg: "bg-red-500", statusKey: "danger" };
    if (usage >= 50)
      return {
        color: "text-amber-400",
        bg: "bg-amber-500",
        statusKey: "warning",
      };
    return {
      color: "text-emerald-400",
      bg: "bg-emerald-500",
      statusKey: "safe",
    };
  };

  const getProfitStatus = (displayProfitPercent, progress) => {
    if (displayProfitPercent < 0)
      return { color: "text-red-400", bg: "bg-red-500", statusKey: "loss" };
    if (progress >= 100)
      return {
        color: "text-emerald-400",
        bg: "bg-emerald-500",
        statusKey: "reached",
      };
    if (progress >= 70)
      return {
        color: "text-emerald-400",
        bg: "bg-emerald-500",
        statusKey: "safe",
      };
    if (progress >= 30)
      return {
        color: "text-amber-400",
        bg: "bg-amber-500",
        statusKey: "warning",
      };
    return { color: "text-red-400", bg: "bg-red-500", statusKey: "danger" };
  };

  const dailyStatus = getDDStatus(dailyDDUsage);
  const overallStatus = getDDStatus(overallDDUsage);
  const profitStatus = getProfitStatus(profitForTarget, profitProgress);

  return (
    <div className="space-y-3">
      {/* Challenge Status Banner */}
      <Card
        className={`border-2 p-4 ${
          isFailed
            ? "bg-red-500/10 border-red-500/50"
            : isFunded
              ? "bg-purple-500/10 border-purple-500/50"
              : phase1Passed && isPhase1
                ? "bg-emerald-500/10 border-emerald-500/50"
                : "bg-slate-900 border-slate-800"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isFailed ? (
              <>
                <XCircle className="w-6 h-6 text-red-400" />
                <div>
                  <h3 className="text-lg font-bold text-red-400">
                    {isDailyLocked
                      ? t(
                          "terminal.accountMetrics.dailyLimitViolated",
                          "Daily Limit Violated (Locked)",
                        )
                      : isDisqualified
                        ? t(
                            "terminal.accountMetrics.challengeFailed",
                            "Challenge Failed / Disqualified",
                          )
                        : t(
                            "terminal.accountMetrics.challengeFailed",
                            "Challenge Failed",
                          )}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {isDailyLocked
                      ? t(
                          "terminal.accountMetrics.accountLockedUntilTomorrow",
                          "Account has been locked until tomorrow due to daily loss limit violation",
                        )
                      : t(
                          "terminal.accountMetrics.accountViolatedRules",
                          "Account has violated challenge rules",
                        )}
                  </p>
                </div>
              </>
            ) : isFunded ? (
              <>
                <Trophy className="w-6 h-6 text-purple-400" />
                <div>
                  <h3 className="text-lg font-bold text-purple-400">
                    {t("terminal.accountMetrics.fundedAccount")}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {t("terminal.accountMetrics.challengeCompleted")}
                  </p>
                </div>
              </>
            ) : phase1Passed && isPhase1 ? (
              <>
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-lg font-bold text-emerald-400">
                    {t("terminal.accountMetrics.phase1Complete")}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {t("terminal.accountMetrics.readyForPhase2")}
                  </p>
                </div>
              </>
            ) : (
              <>
                <Target className="w-6 h-6 text-blue-400" />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {t("terminal.accountMetrics.challengeActive")}
                  </h3>
                  <p className="text-sm text-slate-400">
                    {isPhase2
                      ? t("terminal.accountMetrics.workingTowardsPhase2")
                      : t("terminal.accountMetrics.workingTowardsPhase1")}
                  </p>
                </div>
              </>
            )}
          </div>
          <Badge
            className={` min-w-[60px] text-xs sm:text-sm px-1 sm:px-3 py-1 ${
              isFailed
                ? "bg-red-500/20 text-red-400"
                : isFunded
                  ? "bg-purple-500/20 text-purple-400"
                  : phase1Passed && isPhase1
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-blue-500/20 text-blue-400"
            }`}
          >
            {isFailed
              ? t("terminal.failedBadge")
              : isFunded
                ? t("terminal.fundedBadge")
                : isPhase2
                  ? t("terminal.phase2Badge")
                  : t("terminal.phase1Badge")}
          </Badge>
        </div>
      </Card>

      {/* Phase Progression Timeline */}
      <Card className="bg-slate-900 border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-semibold text-white">
            {t("terminal.accountMetrics.phaseProgression")}
          </h3>
        </div>

        {/* RESPONSIVE CONTAINER with horizontal scroll on small tablets */}
        <div className="overflow-x-auto pb-2 custom-scrollbar">
          <div className="flex flex-col md:flex-row items-center md:justify-between gap-4 min-w-0 md:min-w-[600px] lg:min-w-0">
            {/* Phase 1 */}
            <div
              className={`w-full md:flex-1 p-3 rounded-lg border-2 transition-all
        ${
          getPhaseStatus("phase1") === "completed"
            ? "bg-emerald-500/10 border-emerald-500/50"
            : getPhaseStatus("phase1") === "active"
              ? "bg-blue-500/10 border-blue-500/50"
              : "bg-slate-800/50 border-slate-700"
        }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getPhaseStatus("phase1") === "completed" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : getPhaseStatus("phase1") === "active" ? (
                  <div className="w-4 h-4 rounded-full bg-blue-400 animate-pulse" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-600" />
                )}
                <span
                  className={`text-xs font-semibold
            ${
              getPhaseStatus("phase1") === "completed"
                ? "text-emerald-400"
                : getPhaseStatus("phase1") === "active"
                  ? "text-blue-400"
                  : "text-slate-400"
            }`}
                >
                  {t("terminal.accountMetrics.phase1")}
                </span>
              </div>

              {isPhase1 && (
                <div className="space-y-1 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      {t("terminal.accountMetrics.profit")}:
                    </span>
                    <span
                      className={
                        phase1ProfitMet ? "text-emerald-400" : "text-slate-300"
                      }
                    >
                      {profitForTarget.toFixed(2)}% / {profitTarget}%
                      {phase1ProfitMet && " ✓"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">
                      {t("terminal.accountMetrics.days")}:
                    </span>
                    <span
                      className={
                        phase1TradingDaysMet
                          ? "text-emerald-400"
                          : "text-slate-300"
                      }
                    >
                      {tradingDays} / {minTradingDays}
                      {phase1TradingDaysMet && " ✓"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Arrow */}
            <ArrowRight className="w-4 h-4 text-slate-500 rotate-90 md:rotate-0" />

            {/* Phase 2 */}
            <div
              className={`w-full md:flex-1 p-3 rounded-lg border-2 transition-all
        ${
          getPhaseStatus("phase2") === "completed"
            ? "bg-emerald-500/10 border-emerald-500/50"
            : getPhaseStatus("phase2") === "active"
              ? "bg-cyan-500/10 border-cyan-500/50"
              : getPhaseStatus("phase2") === "locked"
                ? "bg-slate-800/30 border-slate-700 opacity-50"
                : "bg-slate-800/50 border-slate-700"
        }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getPhaseStatus("phase2") === "completed" ? (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                ) : getPhaseStatus("phase2") === "active" ? (
                  <div className="w-4 h-4 rounded-full bg-cyan-400 animate-pulse" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-600" />
                )}
                <span
                  className={`text-xs font-semibold
            ${
              getPhaseStatus("phase2") === "completed"
                ? "text-emerald-400"
                : getPhaseStatus("phase2") === "active"
                  ? "text-cyan-400"
                  : "text-slate-400"
            }`}
                >
                  {t("terminal.accountMetrics.phase2")}
                </span>
              </div>

              {getPhaseStatus("phase2") === "locked" && (
                <p className="text-[10px] text-slate-500">
                  {t("terminal.accountMetrics.completePhase1")}
                </p>
              )}
            </div>

            {/* Arrow */}
            <ArrowRight className="w-4 h-4 text-slate-500 rotate-90 md:rotate-0" />

            {/* Funded */}
            <div
              className={`w-full md:flex-1 p-3 rounded-lg border-2 transition-all
        ${
          getPhaseStatus("funded") === "completed"
            ? "bg-purple-500/10 border-purple-500/50"
            : "bg-slate-800/30 border-slate-700 opacity-50"
        }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {getPhaseStatus("funded") === "completed" ? (
                  <Trophy className="w-4 h-4 text-purple-400" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-slate-600" />
                )}
                <span
                  className={`text-xs font-semibold
            ${
              getPhaseStatus("funded") === "completed"
                ? "text-purple-400"
                : "text-slate-400"
            }`}
                >
                  {t("terminal.accountMetrics.funded")}
                </span>
              </div>

              {getPhaseStatus("funded") === "locked" && (
                <p className="text-[10px] text-slate-500">
                  {t("terminal.accountMetrics.completePhase2")}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Main Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900 border-slate-800 p-2 sm:p-3">
          <div className="flex items-center gap-1 mb-1">
            <Wallet className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] sm:text-xs text-slate-400">
              {t("terminal.accountMetrics.balance")}
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-24 bg-slate-800" />
          ) : (
            <div className="text-sm sm:text-lg font-bold text-white font-mono">
              ${account?.balance?.toFixed(2) || "0.00"}
            </div>
          )}
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-2 sm:p-3">
          <div className="flex items-center gap-1 mb-1">
            <Activity className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] sm:text-xs text-slate-400">
              {t("terminal.accountMetrics.equity")}
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-24 bg-slate-800" />
          ) : (
            <p
              className={`text-sm sm:text-lg font-bold font-mono ${equityColor}`}
            >
              ${displayEquity?.toFixed(2) || "0.00"}
            </p>
          )}
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-2 sm:p-3">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] sm:text-xs text-slate-400">
              {t("terminal.accountMetrics.floatingPnL")}
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-20 bg-slate-800" />
          ) : (
            <p
              className={`text-sm sm:text-lg font-bold font-mono ${floatingPnLColor}`}
            >
              {displayFloatingPnL >= 0 ? "+" : ""}
              {displayFloatingPnL.toFixed(2)}
            </p>
          )}
        </Card>

        <Card className="bg-slate-900 border-slate-800 p-2 sm:p-3">
          <div className="flex items-center gap-1 mb-1">
            <BarChart2 className="w-3 h-3 text-slate-400" />
            <span className="text-[10px] sm:text-xs text-slate-400">
              {t("terminal.accountMetrics.profitPercent")}
            </span>
          </div>
          {isLoading ? (
            <Skeleton className="h-6 w-16 bg-slate-800" />
          ) : (
            <p
              className={`text-sm sm:text-lg font-bold font-mono ${profitForTarget >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {profitForTarget >= 0 ? "+" : ""}
              {profitForTarget.toFixed(2)}%
            </p>
          )}
        </Card>
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        {/* Profit Target */}
        <Card
          className={`bg-slate-900 border-slate-800 p-4 ${phase1ProfitMet ? "border-emerald-500/30" : ""}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target
                className={`w-4 h-4 ${phase1ProfitMet ? "text-emerald-400" : "text-slate-400"}`}
              />
              <span className="text-sm text-slate-300">
                {t("dashboard.rulesPanel.profitTarget")}
              </span>
            </div>
            {!isLoading && (
              <div className="flex items-center gap-2">
                {phase1ProfitMet && (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
                <Badge
                  className={`${
                    profitStatus.statusKey === "loss"
                      ? "bg-red-500/20 text-red-400"
                      : profitStatus.statusKey === "reached"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : profitStatus.statusKey === "safe"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : profitStatus.statusKey === "warning"
                            ? "bg-amber-500/20 text-amber-400"
                            : profitStatus.statusKey === "danger"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-slate-500/20 text-slate-400"
                  }`}
                >
                  {t(`dashboard.rulesPanel.status.${profitStatus.statusKey}`)}
                </Badge>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-3 w-full bg-slate-800" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-12 bg-slate-800" />
                <Skeleton className="h-3 w-16 bg-slate-800" />
              </div>
            </div>
          ) : (
            <>
              <Progress
                value={Math.min(100, Math.max(0, profitProgress))}
                className="h-3 bg-slate-800 transition-all duration-700 ease-out"
              />
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-emerald-400">
                  {profitForTarget.toFixed(2)}% {phase1ProfitMet && "✓"}
                </span>

                <span className="text-slate-400">
                  {t("dashboard.rulesPanel.target")}: {profitTarget}%
                </span>
              </div>
            </>
          )}
        </Card>

        {/* Daily Loss Limit */}
        <Card
          className={`bg-slate-900 border-slate-800 p-4 ${
            dailyDDUsage >= 80
              ? "border-red-500/50"
              : phase1DailyDDMet
                ? "border-emerald-500/30"
                : ""
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield
                className={`w-4 h-4 ${phase1DailyDDMet ? "text-emerald-400" : dailyStatus.statusKey === "danger" ? "text-red-400" : "text-amber-400"}`}
              />
              <span className="text-sm text-slate-300">
                {t("dashboard.rulesPanel.dailyLossLimit")}
              </span>
            </div>
            {!isLoading && (
              <div className="flex items-center gap-2">
                {phase1DailyDDMet && (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
                <Badge
                  className={`${
                    dailyStatus.statusKey === "danger"
                      ? "bg-red-500/20 text-red-400"
                      : dailyStatus.statusKey === "warning"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {t(`dashboard.rulesPanel.status.${dailyStatus.statusKey}`)}
                </Badge>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-3 w-full bg-slate-800" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-12 bg-slate-800" />
                <Skeleton className="h-3 w-16 bg-slate-800" />
              </div>
            </div>
          ) : (
            <>
              <Progress
                value={Math.min(100, dailyDDUsage)}
                className={`h-3 bg-slate-800 transition-all duration-300 ${dailyDDUsage >= 80 ? "[&>div]:bg-red-500" : dailyDDUsage >= 50 ? "[&>div]:bg-amber-500" : ""}`}
              />
              <div className="flex justify-between mt-2 text-xs">
                <span
                  className={
                    phase1DailyDDMet
                      ? "text-emerald-400 font-semibold"
                      : dailyStatus.color
                  }
                >
                  {t("terminal.accountMetrics.loss")}:{" "}
                  {displayDailyDrawdown.toFixed(2)}% {phase1DailyDDMet && "✓"}
                </span>
                <span className="text-slate-400">
                  {t("dashboard.rulesPanel.limit")}: {maxDailyDrawdown}%
                </span>
              </div>
            </>
          )}
        </Card>

        {/* Overall Drawdown */}
        <Card
          className={`bg-slate-900 border-slate-800 p-4 ${
            overallDDUsage >= 80
              ? "border-red-500/50"
              : phase1OverallDDMet
                ? "border-emerald-500/30"
                : ""
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle
                className={`w-4 h-4 ${phase1OverallDDMet ? "text-emerald-400" : overallStatus.statusKey === "danger" ? "text-red-400" : "text-amber-400"}`}
              />
              <span className="text-sm text-slate-300">
                {t("dashboard.rulesPanel.overallDrawdown")}
              </span>
            </div>
            {!isLoading && (
              <div className="flex items-center gap-2">
                {phase1OverallDDMet && (
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                )}
                <Badge
                  className={`${
                    overallStatus.statusKey === "danger"
                      ? "bg-red-500/20 text-red-400"
                      : overallStatus.statusKey === "warning"
                        ? "bg-amber-500/20 text-amber-400"
                        : "bg-emerald-500/20 text-emerald-400"
                  }`}
                >
                  {t(`dashboard.rulesPanel.status.${overallStatus.statusKey}`)}
                </Badge>
              </div>
            )}
          </div>
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-3 w-full bg-slate-800" />
              <div className="flex justify-between">
                <Skeleton className="h-3 w-12 bg-slate-800" />
                <Skeleton className="h-3 w-16 bg-slate-800" />
              </div>
            </div>
          ) : (
            <>
              <Progress
                value={Math.min(100, overallDDUsage)}
                className={`h-3 bg-slate-800 transition-all duration-300 ${overallDDUsage >= 80 ? "[&>div]:bg-red-500" : overallDDUsage >= 50 ? "[&>div]:bg-amber-500" : ""}`}
              />
              <div className="flex justify-between mt-2 text-xs">
                <span
                  className={
                    phase1OverallDDMet
                      ? "text-emerald-400 font-semibold"
                      : overallStatus.color
                  }
                >
                  {displayOverallDrawdown.toFixed(2)}%{" "}
                  {phase1OverallDDMet && "✓"}
                </span>
                <span className="text-slate-400">
                  {t("dashboard.rulesPanel.max")}: {maxOverallDrawdown}%
                </span>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* Trading Days & Additional Metrics - Always visible */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <Card className="bg-slate-800/50 border-slate-700 p-2">
          <p className="text-[10px] text-slate-400 mb-0.5">
            {t("terminal.accountMetrics.marginUsed")}
          </p>
          {isLoading ? (
            <Skeleton className="h-4 w-20 bg-slate-700" />
          ) : (
            <p className="text-white font-mono text-sm">
              $
              {margin.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
        </Card>
        <Card className="bg-slate-800/50 border-slate-700 p-2">
          <p className="text-[10px] text-slate-400 mb-0.5">
            {t("terminal.accountMetrics.freeMargin")}
          </p>
          {isLoading ? (
            <Skeleton className="h-4 w-20 bg-slate-700" />
          ) : (
            <p className="text-white font-mono text-sm">
              $
              {freeMargin.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
        </Card>
        <Card className="bg-slate-800/50 border-slate-700 p-2 sm:p-3">
          <div className="flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3 text-slate-400" />
            <p className="text-[10px] sm:text-xs text-slate-400">
              {t("terminal.accountMetrics.tradingDays")}
            </p>
          </div>
          {isLoading ? (
            <Skeleton className="h-5 w-16 bg-slate-700" />
          ) : (
            <>
              <p className="text-white text-sm sm:text-base font-semibold">
                {tradingDays} / {minTradingDays}
                {tradingDays >= minTradingDays && (
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-400 inline ml-1" />
                )}
              </p>
              {daysRemaining > 0 && (
                <p className="text-[9px] text-slate-500 mt-0.5">
                  {daysRemaining === 1
                    ? t("terminal.accountMetrics.daysRemaining_one", {
                        count: daysRemaining,
                      })
                    : t("terminal.accountMetrics.daysRemaining_other", {
                        count: daysRemaining,
                      })}
                </p>
              )}
            </>
          )}
        </Card>
        <Card className="bg-slate-800/50 border-slate-700 p-2">
          <p className="text-[10px] text-slate-400 mb-0.5">
            {t("terminal.accountMetrics.phase")}
          </p>
          {isLoading ? (
            <Skeleton className="h-5 w-16 bg-slate-700" />
          ) : (
            <Badge
              className={`text-xs ${
                phase === "funded"
                  ? "bg-purple-500/20 text-purple-400"
                  : phase === "phase2"
                    ? "bg-cyan-500/20 text-cyan-400"
                    : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {phase === "phase1"
                ? t("status.phase1")
                : phase === "phase2"
                  ? t("status.phase2")
                  : t("status.funded")}
            </Badge>
          )}
        </Card>
      </div>
    </div>
  );
}
