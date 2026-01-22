import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { calculatePositionsWithPnL, getPositionDuration } from '@/utils/positionCalculations';
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
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
import { PnlDisplay } from "../PnlDisplay";




export default function AccountMetrics({
  account,
  positions = [],
  currentPrices = {},
  getPriceForPosition,
  isCryptoSymbol,
  isLoading = false,
}) {
  const { t } = useTranslation();
  // Real-time display states for smooth updates
  const [displayEquity, setDisplayEquity] = React.useState(
    account?.equity || 100850,
  );
  const [displayFloatingPnL, setDisplayFloatingPnL] = React.useState(
    account?.floatingPnL || 0,
  );

  console.log(account)
  // const [disp
  // layBalance, setDisplayBalance] = React.useState(
  //   account?.balance || 100000,
  // );



  // console.log(account?.balance)
  // Calculate real-time margin and "used" balance: baseBalance - totalMarginUsed
  // This updates in real-time as positions open/close.
  // NOTE: Backend balance is the ledger balance and should only change when trades close.
  // We use this computed balance only for non-funded/demo-style views; real accounts keep balance static.
  // const calculateRealTimeMarginAndBalance = React.useCallback(() => {
  //   const baseBalance = account?.balance || 100000;

  //   // If no positions, balance equals base balance, margin is 0
  //   if (!positions || positions.length === 0) {
  //     return { margin: 0, balance: baseBalance }; 
  //     // return { margin: 0 };
  //   }

  //   // Calculate total margin used by all open positions
  //   // Margin is based on entry price (doesn't change as price moves)
  //   let totalMargin = 0;
  //   const leverage = 100;

  //   positions.forEach((pos) => {
  //     // Get current price for margin calculation
  //     // For margin calculation, we use the entry price side (ask for BUY, bid for SELL)
  //     // But we need current market price, so we use getPriceForPosition with the position type
  //     const currentPrice = getPriceForPosition(
  //       pos.symbol,
  //       pos.type,
  //       pos.entryPrice,
  //     );

  //     if (!currentPrice || currentPrice <= 0) {
  //       // Fallback to entry price if current price unavailable
  //       const fallbackPrice = pos.entryPrice;
  //       const contractSize = isCryptoSymbol(pos.symbol) ? 1 : 100000;
  //       const positionMargin =
  //         (pos.lotSize * contractSize * fallbackPrice) / leverage;
  //       totalMargin += positionMargin;
  //     } else {
  //       // Calculate margin using current price (margin changes as price moves)
  //       const contractSize = isCryptoSymbol(pos.symbol) ? 1 : 100000;
  //       const positionMargin =
  //         (pos.lotSize * contractSize * currentPrice) / leverage;
  //       totalMargin += positionMargin;
  //     }
  //   });

  //   // Real-time "used" balance = base balance - margin used
  //   return {
  //     margin: totalMargin, 
  //     balance: Math.max(0, baseBalance - totalMargin),
  //   };
  // }, [account?.balance, positions, getPriceForPosition, isCryptoSymbol]);

  // Calculate real-time "used" balance (for backward compatibility)
  // const calculateRealTimeBalance = React.useCallback(() => {
  //   return calculateRealTimeMarginAndBalance().balance;

  // }, [calculateRealTimeMarginAndBalance]);

  // Calculate real-time margin for display
  // const realTimeMargin = React.useMemo(() => {
  //   return calculateRealTimeMarginAndBalance().margin;
  // }, [calculateRealTimeMarginAndBalance]);

  // Calculate real-time free margin: equity - margin used
  // const realTimeFreeMargin = React.useMemo(() => {
  //   const currentEquity = account?.equity || 100000;
  //   return Math.max(0, currentEquity - realTimeMargin);
  // }, [account?.equity, realTimeMargin]);

  const [displayProfitPercent, setDisplayProfitPercent] = React.useState(
    account?.profitPercent || 0,
  );
  const [displayDailyDrawdown, setDisplayDailyDrawdown] = React.useState(
    account?.dailyDrawdown || 0,
  );
  const [displayOverallDrawdown, setDisplayOverallDrawdown] = React.useState(
    account?.overallDrawdown || 0,
  );
  const [equityColor, setEquityColor] = React.useState("text-emerald-400");
  const [floatingPnLColor, setFloatingPnLColor] =
    React.useState("text-emerald-400");

  // Ref to track previous values for threshold checking (prevent flickering)
  const prevValuesRef = React.useRef({
    equity: account?.equity || 100850,
    floatingPnL: account?.floatingPnL || 0,
    balance: account?.balance || 100000,
    profitPercent: account?.profitPercent || 0,
    dailyDrawdown: account?.dailyDrawdown || 0,
    overallDrawdown: account?.overallDrawdown || 0,
  });

  // Store frozen drawdown values when limit is reached (so bars stay at 100%)
  // Get from sessionStorage if available (set when violation occurs), otherwise use current values
  // Use namespaced keys: violation:${accountId}:... to prevent overwrites across accounts
  const getFrozenDrawdown = (key, currentValue) => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem(key);
    return stored ? parseFloat(stored) : null;
  };

  const accountId = account?.id || "";
  const frozenDailyDrawdownValue = getFrozenDrawdown(
    `violation:${accountId}:daily_dd`,
    displayDailyDrawdown,
  );
  const frozenOverallDrawdownValue = getFrozenDrawdown(
    `violation:${accountId}:overall_dd`,
    displayOverallDrawdown,
  );

  const frozenDailyDrawdownRef = React.useRef(frozenDailyDrawdownValue);
  const frozenOverallDrawdownRef = React.useRef(frozenOverallDrawdownValue);

  // Update refs from sessionStorage if available (use namespaced keys)
  // Also check for breach snapshot values from trades if available
  React.useEffect(() => {
    if (accountId) {
      const dailyDD = getFrozenDrawdown(
        `violation:${accountId}:daily_dd`,
        displayDailyDrawdown,
      );
      const overallDD = getFrozenDrawdown(
        `violation:${accountId}:overall_dd`,
        displayOverallDrawdown,
      );
      if (dailyDD !== null) frozenDailyDrawdownRef.current = dailyDD;
      if (overallDD !== null) frozenOverallDrawdownRef.current = overallDD;

      // Also check for breach snapshot from trades (more accurate - from actual trade records)
      // This ensures progress bars use the exact breach snapshot values captured at breach moment
      if (typeof window !== "undefined") {
        // Try to get breach snapshot from most recent auto-closed trade
        // This is done asynchronously after trades are loaded, but we can also check sessionStorage
        // which should have been updated from trades
        const snapshotOverallDD = sessionStorage.getItem(
          `violation:${accountId}:snapshot_overall_dd`,
        );
        if (snapshotOverallDD !== null) {
          const snapshotValue = parseFloat(snapshotOverallDD);
          if (Number.isFinite(snapshotValue) && snapshotValue > 0) {
            frozenOverallDrawdownRef.current = snapshotValue;
          }
        }
      }
    }
  }, [accountId, displayDailyDrawdown, displayOverallDrawdown]);

  // Real-time updates for all metrics - updates every 1 second for responsiveness
  React.useEffect(() => {
    // Calculate real-time "used" balance based on positions
    // const realTimeBalance = calculateRealTimeBalance();
    const baseBalance = account?.balance || 100000;

    // Calculate real-time equity from positions (balance + floating PnL)
    let calculatedRealTimeEquity = baseBalance;
    if (positions && positions.length > 0) {
      let totalFloatingPnL = 0;
      positions.forEach((pos) => {
        const currentPrice = getPriceForPosition(
          pos.symbol,
          pos.type,
          pos.entryPrice,
        );
        if (currentPrice && currentPrice > 0) {
          const isCrypto =
            typeof isCryptoSymbol === "function"
              ? isCryptoSymbol(pos.symbol)
              : /BTC|ETH|SOL|XRP|ADA|DOGE/.test(pos.symbol || "");
          const contractSize = isCrypto ? 1 : 100000;
          const priceDiff =
            pos.type === "BUY"
              ? currentPrice - pos.entryPrice
              : pos.entryPrice - currentPrice;
          const positionPnL = isCrypto
            ? priceDiff * pos.lotSize
            : priceDiff * pos.lotSize * contractSize;
          totalFloatingPnL += positionPnL;
        }
      });
      calculatedRealTimeEquity = baseBalance + totalFloatingPnL;
    }

    // Equity from backend (settled equity – updated when trades close)
    const currentEquity = account?.equity;
    const currentFloatingPnL = account?.floatingPnL || 0;
    const currentProfitPercent = account?.profitPercent || 0;

    // CRITICAL: Use frozen violation values if account is locked/disqualified
    // This ensures progress bars show the violation values, not current values
    const statusUpper = String(account?.status || "").toUpperCase();
    const isDailyLocked = statusUpper.includes("DAILY");
    const isDisqualified =
      statusUpper.includes("FAIL") || statusUpper.includes("DISQUAL");

    let currentDailyDrawdown = account?.dailyDrawdown || 0;
    let currentOverallDrawdown = account?.overallDrawdown || 0;

    // If DAILY_LOCKED, use frozen violation value
    if (isDailyLocked && typeof window !== "undefined" && accountId) {
      const violationDailyDD = sessionStorage.getItem(
        `violation:${accountId}:daily_dd`,
      );
      if (violationDailyDD !== null) {
        const violationValue = parseFloat(violationDailyDD);
        if (Number.isFinite(violationValue) && violationValue > 0) {
          currentDailyDrawdown = violationValue;
        }
      }
    }

    // If DISQUALIFIED, use frozen violation value
    if (isDisqualified && typeof window !== "undefined" && accountId) {
      const violationOverallDD = sessionStorage.getItem(
        `violation:${accountId}:overall_dd`,
      );
      if (violationOverallDD !== null) {
        const violationValue = parseFloat(violationOverallDD);
        if (Number.isFinite(violationValue) && violationValue > 0) {
          currentOverallDrawdown = violationValue;
        }
      }
    }

    // Initial set
    setDisplayEquity(currentEquity);
    setDisplayFloatingPnL(currentFloatingPnL);

    // Professional behaviour:
    // - FUNDED (real) accounts: show ledger balance from backend (no real-time change)
    // - Challenge/demo phases: keep previous behaviour (balance - used margin)
    // const initialDisplayBalance = isFunded ? baseBalance : "hardcode";
    // setDisplayBalance(initialDisplayBalance);
    const totalProfit = !totalEquity == 0 ?
      ((displayFloatingPnL.toFixed(2) / totalEquity) * 100)
      : 0;


    if (totalProfit <= 0) {
      setDisplayProfitPercent(0)
    } else {
      setDisplayProfitPercent(totalProfit);
    }
    setDisplayDailyDrawdown(currentDailyDrawdown);
    setDisplayOverallDrawdown(currentOverallDrawdown);
    // setEquityColor(
    //   currentEquity >= realTimeBalance ? "text-emerald-400" : "text-red-400",
    // );
    setFloatingPnLColor(
      currentFloatingPnL >= 0 ? "text-emerald-400" : "text-red-400",
    );

    // Update ref with initial values
    prevValuesRef.current = {
      equity: currentEquity,
      floatingPnL: currentFloatingPnL,
      // balance: realTimeBalance,
      profitPercent: currentProfitPercent,
      dailyDrawdown: currentDailyDrawdown,
      overallDrawdown: currentOverallDrawdown,
    };
    console.log(account.profitPercent)

    // Update all metrics in real-time with smooth transitions
    // Use threshold checks to prevent flickering from tiny changes
    const interval = setInterval(() => {
      // Calculate real-time "used" balance (updates as positions/prices change)
      // const realTimeBal = calculateRealTimeBalance();

      // Equity is taken directly from backend (source of truth).
      // Backend evaluation service already accounts for unrealized PnL where applicable.
      const eq = account?.equity || 100850;
      const fpl = account?.floatingPnL || 0;
      const profitPct = account?.profitPercent || 0;
      const dailyDD = account?.dailyDrawdown || 0;
      const overallDD = account?.overallDrawdown || 0;

      const prev = prevValuesRef.current;

      // Only update if values changed significantly (prevent flickering)
      const equityChanged = Math.abs(prev.equity - eq) >= 0.01;
      const pnlChanged = Math.abs(prev.floatingPnL - fpl) >= 0.01;
      // const balanceChanged = Math.abs(prev.balance - realTimeBal) >= 0.01;
      const profitChanged = Math.abs(prev.profitPercent - profitPct) >= 0.01; // Reduced to 0.01% for real-time updates
      const dailyDDChanged = Math.abs(prev.dailyDrawdown - dailyDD) >= 0.005;
      const overallDDChanged =
        Math.abs(prev.overallDrawdown - overallDD) >= 0.005;

      if (
        equityChanged ||
        pnlChanged ||
        // balanceChanged ||
        profitChanged ||
        dailyDDChanged ||
        overallDDChanged
      ) {
        if (equityChanged) {
          // Always use backend equity as single source of truth
          setDisplayEquity(eq);
          prev.equity = eq;
        }
        if (pnlChanged) {
          setDisplayFloatingPnL(fpl);
          prev.floatingPnL = fpl;
        }
        // if (balanceChanged) {
        //   // FUNDED (real) accounts: keep balance static (backend ledger),
        //   // other phases: show "used" balance as before
        //   const balanceForDisplay = isFunded
        //     ? account?.balance || 100000
        //     : realTimeBal;
        //   setDisplayBalance(balanceForDisplay);
        //   prev.balance = balanceForDisplay;
        // }
        // if (profitChanged) {
        //   setDisplayProfitPercent(profitPct);
        //   prev.profitPercent = profitPct;
        // }
        if (dailyDDChanged) {
          setDisplayDailyDrawdown(dailyDD);
          prev.dailyDrawdown = dailyDD;
        }
        if (overallDDChanged) {
          setDisplayOverallDrawdown(overallDD);
          prev.overallDrawdown = overallDD;
        }

        // Update colors - compare equity to real-time balance
        setEquityColor(eq >= realTimeBal ? "text-emerald-400" : "text-red-400");
        setFloatingPnLColor(fpl >= 0 ? "text-emerald-400" : "text-red-400");
      }
    }, 2000); // Update every 2 seconds for stable display

    return () => clearInterval(interval);
  }, [
    account?.equity,
    account?.balance,
    account?.floatingPnL,
    account?.profitPercent,
    account?.dailyDrawdown,
    account?.overallDrawdown,
    // calculateRealTimeBalance,
  ]);

  const {
    balance = 100000,
    equity = 100850,
    margin = 0, // Use backend value
    freeMargin = 100000, // Use backend value
    floatingPnL = 850,
    profitPercent = 0.85,
    dailyDrawdown = 0,
    maxDailyDrawdown = 5,
    overallDrawdown = 3.5,
    maxOverallDrawdown = 10,
    profitTarget = 10,
    tradingDays = 0, // Use backend value
    minTradingDays = 5, // Use backend value
    daysRemaining = 0, // Use backend value
    phase = "phase1",
    status = "active",
  } = account || {};

  // Determine if account is locked or disqualified
  // Handle all possible failure statuses: DAILY_LOCKED, DISQUALIFIED, FAILED, CHALLENGE_FAILED, ACCOUNT_FAILED, etc.
  const statusUpper = String(status || "").toUpperCase();
  const isLocked =
    statusUpper.includes("DAILY") ||
    statusUpper.includes("FAIL") ||
    statusUpper.includes("DISQUAL");
  const isDailyLocked = statusUpper.includes("DAILY");
  const isDisqualified =
    statusUpper.includes("FAIL") || statusUpper.includes("DISQUAL");

  // Freeze drawdown values when limit is reached - use stored violation values from sessionStorage
  React.useEffect(() => {
    if (accountId) {
      // Always check sessionStorage when status changes to locked/disqualified
      if (isDailyLocked) {
        const storedValue = getFrozenDrawdown(
          `violation:${accountId}:daily_dd`,
          displayDailyDrawdown,
        );
        if (storedValue !== null) {
          frozenDailyDrawdownRef.current = storedValue;
        } else if (frozenDailyDrawdownRef.current === null) {
          // Fallback to max limit if no stored value
          frozenDailyDrawdownRef.current = maxDailyDrawdown;
        }
      }
      if (isDisqualified) {
        const storedValue = getFrozenDrawdown(
          `violation:${accountId}:overall_dd`,
          displayOverallDrawdown,
        );
        if (storedValue !== null) {
          frozenOverallDrawdownRef.current = storedValue;
        } else if (frozenOverallDrawdownRef.current === null) {
          // Fallback to max limit if no stored value
          frozenOverallDrawdownRef.current = maxOverallDrawdown;
        }
      }
    }

    // Reset frozen values when account becomes active again (e.g., after daily reset)
    const statusUpperCheck = String(status || "").toUpperCase();
    if (statusUpperCheck === "ACTIVE" && !isDailyLocked && !isDisqualified) {
      frozenDailyDrawdownRef.current = null;
      frozenOverallDrawdownRef.current = null;
      if (typeof window !== "undefined" && accountId) {
        sessionStorage.removeItem(`violation:${accountId}:daily_dd`);
        sessionStorage.removeItem(`violation:${accountId}:overall_dd`);
      }
    }
  }, [
    status,
    isDailyLocked,
    isDisqualified,
    maxDailyDrawdown,
    maxOverallDrawdown,
    accountId,
    displayDailyDrawdown,
    displayOverallDrawdown,
  ]);

  // Use frozen values if available, otherwise use current display values
  // Freeze progress bars at violation values when account is locked/disqualified
  // CRITICAL: Overall drawdown should come from account state (backend metrics), not sessionStorage fallback
  // Only use sessionStorage for violation freezing, not for general fallback
  const dailyDrawdownForBar =
    isDailyLocked && frozenDailyDrawdownRef.current !== null
      ? frozenDailyDrawdownRef.current
      : displayDailyDrawdown;

  // For overall drawdown: only freeze if disqualified, otherwise use account state value
  // Account state already has the correct backend value or fallback from syncAccountFromBackend
  const overallDrawdownForBar =
    isDisqualified && frozenOverallDrawdownRef.current !== null
      ? frozenOverallDrawdownRef.current
      : displayOverallDrawdown; // This comes from account.overallDrawdown (backend source of truth)

  // Always show 100% when locked/disqualified, otherwise show actual percentage
  const dailyDDUsage = isDailyLocked
    ? 100 // Always 100% when daily locked
    : (dailyDrawdownForBar / maxDailyDrawdown) * 100;
  const overallDDUsage = isDisqualified
    ? 100 // Always 100% when disqualified
    : (overallDrawdownForBar / maxOverallDrawdown) * 100;

  // Display the frozen violation values in the UI (not 0% after positions close)
  const displayDailyDrawdownFinal =
    isDailyLocked && frozenDailyDrawdownRef.current !== null
      ? frozenDailyDrawdownRef.current
      : displayDailyDrawdown;
  const displayOverallDrawdownFinal =
    isDisqualified && frozenOverallDrawdownRef.current !== null
      ? frozenOverallDrawdownRef.current
      : displayOverallDrawdown;

  // Calculate profit progress with aggressive smoothing removed for better responsiveness
  // Use ref to track previous value and only update if change is significant (very tiny threshold now)
  const profitProgressRef = React.useRef(100);
  const rawProfitProgress = (profitPercent / profitTarget) * 100;
  // console.log(rawProfitProgress)
  // Only update if change is at least 0.01% (prevents jumpy UI while staying responsive)
  const profitProgress = React.useMemo(() => {
    const rounded = Math.round(rawProfitProgress * 100) / 100; // Round to 2 decimal places for smoother feel
    const prev = profitProgressRef.current;
    // Only update if change is significant (at least 0.01% difference)
    if (Math.abs(rounded - prev) >= 0.01 || prev === 0) {
      profitProgressRef.current = rounded;
      return rounded;
    }
    return prev; // Return previous value if change is too small
  }, [rawProfitProgress, profitTarget]);

  // Determine challenge status - show failed banner for DAILY_LOCKED and DISQUALIFIED/FAILED
  const statusUpperForFailed = String(status || "").toUpperCase();
  const isFailed =
    status === "failed" ||
    phase === "failed" ||
    statusUpperForFailed.includes("FAIL") ||
    statusUpperForFailed.includes("DISQUAL") ||
    statusUpperForFailed.includes("DAILY");
  const isFunded = phase === "funded" || phase === "FUNDED";
  const isPhase2 = phase === "phase2" || phase === "PHASE2";
  const isPhase1 = phase === "phase1" || phase === "PHASE1";

  // Check if Phase 1 requirements are met
  const phase1ProfitMet = profitPercent >= profitTarget;
  // const phase1ProfitMet = displayProfitPercent >= profitTarget;
  const phase1TradingDaysMet = tradingDays >= minTradingDays;
  const phase1DailyDDMet = dailyDrawdown <= maxDailyDrawdown;
  const phase1OverallDDMet = overallDrawdown <= maxOverallDrawdown;
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

  const getProfitStatus = (displayProfitPercent, profitTarget, progress) => {
    // If profit is negative, it's loss
    if (displayProfitPercent > 0)
      // console.log(profitPercent)
      return { color: "text-red-400", bg: "bg-red-500", statusKey: "safe" };
    // If target is reached, it's reached
    if (progress >= 100)
      return {
        color: "text-emerald-400",
        bg: "bg-emerald-500",
        statusKey: "reached",
      };
    // If progress is good (>= 70%), it's safe
    if (progress >= 70)
      return {
        color: "text-emerald-400",
        bg: "bg-emerald-500",
        statusKey: "safe",
      };
    // If progress is moderate (>= 30%), it's warning
    if (progress >= 30)
      return {
        color: "text-amber-400",
        bg: "bg-amber-500",
        statusKey: "warning",
      };


    // If progress is low (< 30%), it's danger
    return { color: "text-red-400", bg: "bg-red-500", statusKey: "danger" };
  };











  const totalEquity = ((account?.balance || 0) + (account?.floatingPnL || 0)).toFixed(2)
  const balanceForMarginUsed = account.balance
  useEffect(() => {
    const getMarginUsed = (displayFloatingPnL, balanceForMarginUsed) => {
      if (displayFloatingPnL < 0) {
        let realMarginUsed = (balanceForMarginUsed - displayFloatingPnL)
      } else {
        let realMarginUsed = 0

      }

    }


    getMarginUsed()
  }, [balanceForMarginUsed])
  // console.log(marginUsed)


  const dailyStatus = getDDStatus(dailyDDUsage);
  const overallStatus = getDDStatus(overallDDUsage);
  const profitStatus = getProfitStatus(
    displayProfitPercent,
    profitTarget,
    profitProgress,
  );

  return (
    <div className="space-y-3">
      {/* Challenge Status Banner */}
      <Card
        className={`border-2 p-4 ${isFailed
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
            className={` min-w-[60px] text-xs sm:text-sm px-1 sm:px-3 py-1 ${isFailed
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

        {/* RESPONSIVE CONTAINER */}
        <div className="flex flex-col md:flex-row items-center md:justify-between gap-4">
          {/* Phase 1 */}
          <div
            className={`w-full md:flex-1 p-3 rounded-lg border-2 transition-all
        ${getPhaseStatus("phase1") === "completed"
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
            ${getPhaseStatus("phase1") === "completed"
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
                    {phase1ProfitMet ? "✓" : "✗"} {profitPercent.toFixed(2)}% /{" "}
                    {profitTarget}%
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
                    {phase1TradingDaysMet ? "✓" : "✗"} {tradingDays} /{" "}
                    {minTradingDays}
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
        ${getPhaseStatus("phase2") === "completed"
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
            ${getPhaseStatus("phase2") === "completed"
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
        ${getPhaseStatus("funded") === "completed"
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
            ${getPhaseStatus("funded") === "completed"
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
      </Card>

      {/* Main Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
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
            <>
              <p
                className="text-sm sm:text-lg font-bold text-white font-mono"
              >
                <div>${account?.balance?.toFixed(2) || '0.00'}</div>
              </p>

              {/* {(realTimeMargin > 0 || positions?.length > 0) && (
      <div className="mt-1 pt-1 border-t border-slate-700">
        <p className="text-[9px] text-red-400">
          -${realTimeMargin.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          {t("terminal.accountMetrics.used")}
        </p>
        <p className="text-[9px] text-emerald-400">
          ${realTimeFreeMargin.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}{" "}
          {t("terminal.accountMetrics.free")}
        </p>
      </div>
    )} */}
            </>
          )}
          {/* {isLoading ? (
            <Skeleton className="h-6 w-24 bg-slate-800" />
          ) : (
            <> */}
          {/* ${account.balance.toFixed(2)} */}
          {/* {positionsWithPnL.map((position) => (
              <p className="text-sm sm:text-lg font-bold text-white font-mono"> 
<PnlDisplay
  pnl={position.pnl}
  priceChange={position.priceChange}
  isForex={position.isForex}
  isCrypto={position.isCrypto}
  size="default"
/>

</p>
} */}






          {/* {(realTimeMargin > 0 || positions?.length > 0) && (
  <div className="mt-1 pt-1 border-t border-slate-700">
  <p className="text-[9px] text-red-400">
                    -$
                    {realTimeMargin.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {t("terminal.accountMetrics.used")}
                  </p>
                  <p className="text-[9px] text-emerald-400">
                    $
                    {realTimeFreeMargin.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                      })}{" "}
                      {t("terminal.accountMetrics.free")}
                      </p>
                      </div>
                      )} */}


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
              {/* ${Math.round(displayEquity).toLocaleString()} */}
              {/* ${((account?.balance || 0) + (account?.floatingPnL || 0)).toFixed(2)} */}
              ${totalEquity}
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









        {/* floating pNl */}

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
              className={`text-sm sm:text-lg font-bold font-mono ${displayProfitPercent >= 0 ? "text-emerald-400" : "text-red-400"}`}
            >
              {/* {displayProfitPercent >= 0 ? "+" : ""} */}

              {/* {((displayFloatingPnL.toFixed(2) / totalEquity) * 100).toFixed(3)}% */}
              {displayProfitPercent.toFixed(2)}%
              {/* {displayProfitPercent.toFixed(2)}% */}
              {/* hardcode */}
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
                  className={`${profitStatus.statusKey === "loss"
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
                value={Math.min(Math.max(0, profitProgress),)}
                className="h-3 bg-slate-800 transition-all duration-700 ease-out"
              />
              <div className="flex justify-between mt-2 text-xs">
                <span
                  className={
                    displayProfitPercent < 0
                      ? "text-red-400"
                      : phase1ProfitMet
                        ? "text-emerald-400 font-semibold"
                        : "text-emerald-400"
                  }
                >
                  {displayProfitPercent.toFixed(2)}% {phase1ProfitMet && "✓"}
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
          className={`bg-slate-900 border-slate-800 p-4 ${dailyDDUsage >= 80
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
                  className={`${dailyStatus.statusKey === "danger"
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
                  {displayDailyDrawdownFinal.toFixed(2)}%{" "}
                  {phase1DailyDDMet && "✓"}
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
          className={`bg-slate-900 border-slate-800 p-4 ${overallDDUsage >= 80
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
                  className={`${overallStatus.statusKey === "danger"
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
                value={overallDDUsage}
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
                  {displayOverallDrawdownFinal.toFixed(2)}%{" "}
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

              ${displayFloatingPnL >= 0 ? "0" : displayFloatingPnL.toFixed(2).slice(1)}


              {/* git */}
              {/* {displayFloatingPnL.toFixed(2)} */}
              {/* {realTimeMargin.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} */}

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
              {/* $hardcode */}
              ${totalEquity}
              {/* {realTimeFreeMargin.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} */}
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
              className={`text-xs ${phase === "funded"
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
