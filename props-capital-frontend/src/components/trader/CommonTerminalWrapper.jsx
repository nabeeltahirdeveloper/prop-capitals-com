import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  TrendingUp,
  ChevronDown,
  Loader2,
  AlertTriangle,
  XCircle,
  Pencil,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTraderTheme } from "./TraderPanelLayout";
import { useChallenges } from "@/contexts/ChallengesContext";
import { usePrices } from "@/contexts/PriceContext";
import {
  getAccountTrades,
  updateTrade,
  createTrade,
  modifyPosition,
} from "@/api/trades";
import { getPendingOrders, cancelPendingOrder } from "@/api/pending-orders";
import {
  processPriceTick,
  getAccountSummary,
  evaluateAccountRealTime,
} from "@/api/accounts";
import { useToast } from "@/components/ui/use-toast";
import ChallengeActiveBanner from "../trading/ChallengeActiveBanner";
import PhaseProgressionCards from "../trading/PhaseProgressionCards";
import BalanceStatsRow from "../trading/BalanceStatsRow";
import ComplianceMetrics from "../trading/ComplianceMetrics";
import TradingStyleRules from "../trading/TradingStyleRules";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenPositions from "../trading/OpenPositions";
import ViolationModal from "../trading/ViolationModal";
import { useTranslation } from "@/contexts/LanguageContext";
import { useSearchParams } from "react-router-dom";
import { getCurrentUser } from "@/api/auth";
import { Input } from "@/components/ui/input";
import { createPendingOrder } from "@/api/pending-orders";
import { Card } from "../ui/card";
import { cn } from "@/lib/utils";
import MarketExecutionModal from "./MarketExecutionModal";
import { getTradingEngineForPlatform } from "@/trading/engines/TradingEngine";
// WALLET FEATURE DISABLED - 2026-02-16: import WalletPanel from './WalletPanel';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Badge } from "../ui/badge";
import { Calendar } from "../ui/calendar";

// Demo account localStorage helpers (same as pages/TradingTerminal.jsx)
const DEMO_ACCOUNT_STORAGE_KEY = "demo-account:trades";
const loadDemoAccountTrades = () => {
  try {
    const stored = localStorage.getItem(DEMO_ACCOUNT_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        positions: data.positions || [],
        closedTrades: data.closedTrades || [],
        pendingOrders: data.pendingOrders || [],
        balance: data.balance || 100000,
        equity: data.equity || 100000,
      };
    }
  } catch (error) {
    console.error("Failed to load demo account data from localStorage:", error);
  }
  return {
    positions: [],
    closedTrades: [],
    pendingOrders: [],
    balance: 100000,
    equity: 100000,
  };
};
const saveDemoAccountTrades = (
  positions,
  closedTrades,
  pendingOrders,
  balance,
  equity,
) => {
  try {
    const data = {
      positions: positions || [],
      closedTrades: closedTrades || [],
      pendingOrders: pendingOrders || [],
      balance: balance || 100000,
      equity: equity || 100000,
    };
    localStorage.setItem(DEMO_ACCOUNT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save demo account data to localStorage:", error);
  }
};

const CommonTerminalWrapper = ({
  children,
  selectedChallenge: selectedChallengeProp = null,
}) => {
  const { isDark } = useTraderTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { prices } = usePrices();
  const {
    challenges,
    selectedChallenge: selectedChallengeFromContext,
    selectChallenge,
    getChallengePhaseLabel,
    getRuleCompliance,
    loading,
  } = useChallenges();
  const selectedChallenge =
    selectedChallengeProp || selectedChallengeFromContext;
  const platformKey = String(
    selectedChallenge?.platform || "mt5",
  ).toLowerCase();
  const tradingEngine = useMemo(
    () => getTradingEngineForPlatform(platformKey),
    [platformKey],
    // console.log(platformKey)
  );
  // Local alias for formatPrice to keep JSX concise
  const formatPrice = tradingEngine.formatPrice;

  const [selectedTab, setSelectedTab] = useState("positions");
  const [violationModal, setViolationModal] = useState(null);
  const [liveMetrics, setLiveMetrics] = useState({
    equity: null,
    profitPercent: null,
    dailyDrawdownPercent: null,
    overallDrawdownPercent: null,
  });
  const [closeConfirmTrade, setCloseConfirmTrade] = useState(null);
  const [modifyTPSLTrade, setModifyTPSLTrade] = useState(null);
  const [modifyTP, setModifyTP] = useState("");
  const [modifySL, setModifySL] = useState("");
  const [showBuySellPanel, setShowBuySellPanel] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const priceTickThrottleRef = useRef({});
  const activeEquityBaselineRef = useRef(null);
  const profitBarPeakRef = useRef(0);
  const overallDrawdownBarPeakRef = useRef(0);
  const dailyDrawdownBarPeakRef = useRef({ date: null, value: 0 });
  const dismissedModalAccountsRef = useRef(new Set());
  const violationEnforcementThrottleRef = useRef({});

  const getViolationTypeFromStatus = useCallback((status) => {
    const upper = String(status || "").toUpperCase();
    if (!upper) return null;
    if (upper.includes("DAILY")) return "DAILY_LOCKED";
    if (upper.includes("DISQUAL") || upper.includes("FAIL"))
      return "DISQUALIFIED";
    return null;
  }, []);

  const accountId = selectedChallenge?.id;
  const isStatusLocked = useCallback((status) => {
    const normalizedStatus = String(status || "").toLowerCase();
    return (
      normalizedStatus === "failed" ||
      normalizedStatus === "inactive" ||
      normalizedStatus === "daily_locked" ||
      normalizedStatus === "disqualified" ||
      normalizedStatus === "closed" ||
      normalizedStatus === "paused"
    );
  }, []);

  // Reset live metrics when account changes
  useEffect(() => {
    setLiveMetrics({
      equity: null,
      profitPercent: null,
      dailyDrawdownPercent: null,
      overallDrawdownPercent: null,
    });
    priceTickThrottleRef.current = {};
    profitBarPeakRef.current = 0;
    overallDrawdownBarPeakRef.current = 0;
    dailyDrawdownBarPeakRef.current = { date: null, value: 0 };
    if (accountId) {
      dismissedModalAccountsRef.current.delete(accountId);
    }
    setViolationModal(null);
  }, [accountId]);

  /* ── Data Queries (React Query auto-deduplicates with same keys used in terminal) ── */
  const { data: tradesData, isLoading: tradesLoading } = useQuery({
    queryKey: ["trades", accountId],
    queryFn: () => getAccountTrades(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });
  const { data: pendingOrdersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["pendingOrders", accountId],
    queryFn: () => getPendingOrders(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });
  const { data: accountSummaryData } = useQuery({
    queryKey: ["accountSummary", accountId],
    queryFn: () => getAccountSummary(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });
  const effectiveAccountStatus =
    accountSummaryData?.account?.status ?? selectedChallenge?.status;
  const isChallengeLocked = isStatusLocked(effectiveAccountStatus);

  /* ── Derived data ── */
  const openPositions = useMemo(() => {
    const t = Array.isArray(tradesData) ? tradesData : [];
    return t.filter((x) => !x.closedAt);
  }, [tradesData]);
  const closedTrades = useMemo(() => {
    const t = Array.isArray(tradesData) ? tradesData : [];
    return t.filter((x) => x.closedAt);
  }, [tradesData]);
  const activePendingOrders = useMemo(() => {
    const o = Array.isArray(pendingOrdersData) ? pendingOrdersData : [];
    return o.filter((x) => x.status === "PENDING");
  }, [pendingOrdersData]);
  const hasTradeHistory = openPositions.length > 0 || closedTrades.length > 0;

  /* ── Live PnL per position (delegated to engine) ── */
  const positionsWithPnL = useMemo(
    () => tradingEngine.computePositionsPnL(openPositions, prices),
    [openPositions, prices, tradingEngine],
  );

  const totalFloatingPnL = useMemo(
    () => tradingEngine.computeTotalFloatingPnL(positionsWithPnL),
    [positionsWithPnL, tradingEngine],
  );
  const usedOpenMargin = useMemo(
    () => tradingEngine.computeMarginUsage(openPositions),
    [openPositions, tradingEngine],
  );
  const usedPendingMargin = useMemo(() => {
    // Normalize pending orders: engine expects `openPrice` field
    const normalized = activePendingOrders.map((o) => ({
      ...o,
      openPrice: Number(o.price),
    }));
    return tradingEngine.computeMarginUsage(normalized);
  }, [activePendingOrders, tradingEngine]);
  const totalReservedMargin = usedOpenMargin + usedPendingMargin;

  const hasOpenPositions = openPositions.length > 0;
  useEffect(() => {
    if (!hasOpenPositions) {
      activeEquityBaselineRef.current = null;
      return;
    }
    if (!Number.isFinite(activeEquityBaselineRef.current)) {
      const summaryEquity = accountSummaryData?.account?.equity;
      const summaryBalance = accountSummaryData?.account?.balance;
      activeEquityBaselineRef.current = Number.isFinite(summaryEquity)
        ? summaryEquity
        : Number.isFinite(summaryBalance)
          ? summaryBalance
          : selectedChallenge?.currentBalance || 0;
    }
  }, [hasOpenPositions, accountSummaryData, selectedChallenge]);

  useEffect(() => {
    const metrics = accountSummaryData?.metrics;
    if (!metrics) return;
    setLiveMetrics((prev) => ({
      ...prev,
      ...(Number.isFinite(metrics?.equity) && { equity: metrics.equity }),
      ...(Number.isFinite(metrics?.profitPercent) && {
        profitPercent: metrics.profitPercent,
      }),
      ...(Number.isFinite(metrics?.dailyDrawdownPercent) && {
        dailyDrawdownPercent: metrics.dailyDrawdownPercent,
      }),
      ...(Number.isFinite(metrics?.overallDrawdownPercent) && {
        overallDrawdownPercent: metrics.overallDrawdownPercent,
      }),
    }));
  }, [accountSummaryData]);

  /* ── Forward price ticks to backend for violation checking ── */
  useEffect(() => {
    if (openPositions.length === 0 || !accountId) return;

    const positionSymbols = [...new Set(openPositions.map((t) => t.symbol))];
    if (positionSymbols.length === 0) return;

    positionSymbols.forEach((symbol) => {
      const pd = tradingEngine.resolvePrice(symbol, prices);
      if (!pd || pd.bid === undefined || pd.ask === undefined) return;

      const throttleKey = `${accountId}-${symbol}`;
      const lastTickTime = priceTickThrottleRef.current[throttleKey] || 0;
      const now = Date.now();
      if (now - lastTickTime < 50) return;
      priceTickThrottleRef.current[throttleKey] = now;

      processPriceTick(accountId, symbol, pd.bid, pd.ask, pd.timestamp || now)
        .then((response) => {
          if (
            response &&
            (response.equity !== undefined ||
              response.profitPercent !== undefined ||
              response.dailyDrawdownPercent !== undefined ||
              response.overallDrawdownPercent !== undefined)
          ) {
            setLiveMetrics((prev) => ({
              ...prev,
              ...(response.equity !== undefined &&
                Number.isFinite(response.equity) && {
                  equity: response.equity,
                }),
              ...(response.profitPercent !== undefined &&
                Number.isFinite(response.profitPercent) && {
                  profitPercent: response.profitPercent,
                }),
              ...(response.dailyDrawdownPercent !== undefined &&
                Number.isFinite(response.dailyDrawdownPercent) && {
                  dailyDrawdownPercent: response.dailyDrawdownPercent,
                }),
              ...(response.overallDrawdownPercent !== undefined &&
                Number.isFinite(response.overallDrawdownPercent) && {
                  overallDrawdownPercent: response.overallDrawdownPercent,
                }),
            }));
          }
          if (response?.statusChanged) {
            queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
            queryClient.invalidateQueries({
              queryKey: ["accountSummary", accountId],
            });
            queryClient.invalidateQueries({
              queryKey: ["pendingOrders", accountId],
            });
            toast({
              title: "Account Status Changed",
              description: `Limit breached. ${response.positionsClosed || 0} positions auto-closed.`,
              variant: "destructive",
            });
            const type = response?.violationType || response?.accountStatus;
            if (type === "DAILY_LOCKED" || type === "DISQUALIFIED") {
              dismissedModalAccountsRef.current.delete(accountId);
              setViolationModal({
                type,
                shown: true,
                accountId,
              });
            }
          }
        })
        .catch(() => {});
    });
  }, [openPositions, accountId, prices, tradingEngine, queryClient, toast]);

  useEffect(() => {
    if (!accountId || openPositions.length === 0) return;
    const now = Date.now();
    const throttleKey = `${accountId}-realtime-enforce`;
    const last = violationEnforcementThrottleRef.current[throttleKey] || 0;
    if (now - last < 1000) return;
    violationEnforcementThrottleRef.current[throttleKey] = now;

    const currentBalance = Number(
      accountSummaryData?.account?.balance ??
        selectedChallenge?.currentBalance ??
        0,
    );
    const activeEquityForEnforcement = currentBalance + totalFloatingPnL;

    evaluateAccountRealTime(accountId, Number(activeEquityForEnforcement))
      .then((response) => {
        const responseType =
          response?.tradingBlockReason ||
          (response?.drawdownViolated
            ? "DISQUALIFIED"
            : response?.dailyViolated
              ? "DAILY_LOCKED"
              : null);

        if (response?.statusChanged || responseType) {
          queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
          queryClient.invalidateQueries({
            queryKey: ["accountSummary", accountId],
          });
          queryClient.invalidateQueries({
            queryKey: ["pendingOrders", accountId],
          });

          if (
            responseType === "DAILY_LOCKED" ||
            responseType === "DISQUALIFIED"
          ) {
            dismissedModalAccountsRef.current.delete(accountId);
            setViolationModal({
              type: responseType,
              shown: true,
              accountId,
            });
          }
        }
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn(
            "[Realtime enforcement] evaluateAccountRealTime failed:",
            error?.message || error,
          );
        }
      });
  }, [
    accountId,
    openPositions,
    accountSummaryData,
    selectedChallenge,
    totalFloatingPnL,
    queryClient,
  ]);

  useEffect(() => {
    if (!accountId || openPositions.length === 0) return;
    const type = getViolationTypeFromStatus(effectiveAccountStatus);
    if (!type) return;

    const throttleKey = `${accountId}-locked-open-positions`;
    const now = Date.now();
    const last = violationEnforcementThrottleRef.current[throttleKey] || 0;
    if (now - last < 2000) return;
    violationEnforcementThrottleRef.current[throttleKey] = now;
    const currentBalance = Number(
      accountSummaryData?.account?.balance ??
        selectedChallenge?.currentBalance ??
        0,
    );
    const activeEquityForEnforcement = currentBalance + totalFloatingPnL;

    evaluateAccountRealTime(accountId, Number(activeEquityForEnforcement))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
        queryClient.invalidateQueries({
          queryKey: ["accountSummary", accountId],
        });
      })
      .catch(() => {});
  }, [
    accountId,
    openPositions.length,
    effectiveAccountStatus,
    accountSummaryData,
    selectedChallenge,
    totalFloatingPnL,
    getViolationTypeFromStatus,
    queryClient,
  ]);

  useEffect(() => {
    if (!accountId) return;
    const type = getViolationTypeFromStatus(effectiveAccountStatus);
    if (!type) {
      setViolationModal(null);
      dismissedModalAccountsRef.current.delete(accountId);
      return;
    }
    const wasDismissed = dismissedModalAccountsRef.current.has(accountId);
    if (!wasDismissed) {
      setViolationModal({
        type,
        shown: true,
        accountId,
      });
    }
  }, [accountId, effectiveAccountStatus, getViolationTypeFromStatus]);

  const handleViolationModalClose = useCallback(() => {
    if (accountId) {
      dismissedModalAccountsRef.current.add(accountId);
    }
    setViolationModal((prev) => (prev ? { ...prev, shown: false } : null));
  }, [accountId]);

  /* ── Mutations ── */
  const closePositionMutation = useMutation({
    mutationFn: ({ tradeId, closePrice }) =>
      updateTrade(tradeId, {
        closePrice,
        closedAt: new Date().toISOString(),
        closeReason: "USER_CLOSE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
      queryClient.invalidateQueries({
        queryKey: ["accountSummary", accountId],
      });
      toast({ title: "Position Closed" });
    },
    onError: (e) => {
      toast({
        title: "Close Failed",
        description: e?.response?.data?.message || e.message,
        variant: "destructive",
      });
    },
  });
  const modifyTPSLMutation = useMutation({
    mutationFn: ({ tradeId, stopLoss, takeProfit }) =>
      modifyPosition(tradeId, { stopLoss, takeProfit }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
      toast({ title: "TP/SL updated" });
      setModifyTPSLTrade(null);
      setModifyTP("");
      setModifySL("");
    },
    onError: (e) => {
      toast({
        title: "Modify failed",
        description: e?.response?.data?.message || e.message,
        variant: "destructive",
      });
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: cancelPendingOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingOrders", accountId] });
      toast({ title: "Order Cancelled" });
    },
    onError: (e) => {
      toast({
        title: "Cancel Failed",
        description: e?.response?.data?.message || e.message,
        variant: "destructive",
      });
    },
  });

  const handleExecuteTrade = useCallback(
    async (trade) => {
      if (!accountId) {
        toast({ title: "No account selected", variant: "destructive" });
        return;
      }
      if (isChallengeLocked) {
        toast({
          title: "Trading locked",
          description: "Account is not active for trading.",
          variant: "destructive",
        });
        return;
      }
      const volume = parseFloat(trade?.volume ?? trade?.lotSize);
      const openPrice = parseFloat(trade?.openPrice ?? trade?.entryPrice);
      const rawOrderType = String(trade?.orderType || "").toLowerCase();
      const isPendingOrder =
        rawOrderType === "limit" ||
        rawOrderType === "stop" ||
        rawOrderType === "stop_limit";

      if (
        !trade?.symbol ||
        !trade?.type ||
        !Number.isFinite(volume) ||
        volume <= 0
      ) {
        toast({
          title: "Invalid trade",
          description: "Missing symbol, type, or valid volume.",
          variant: "destructive",
        });
        return;
      }

      if (!isPendingOrder && (!Number.isFinite(openPrice) || openPrice <= 0)) {
        toast({
          title: "Invalid trade",
          description: "Missing or invalid execution price.",
          variant: "destructive",
        });
        return;
      }
      const pendingPrice = isPendingOrder
        ? parseFloat(
            trade?.limitPrice ??
              trade?.price ??
              trade?.entryPrice ??
              trade?.openPrice,
          )
        : openPrice;
      const executionPriceForMargin = isPendingOrder ? pendingPrice : openPrice;

      if (
        !Number.isFinite(executionPriceForMargin) ||
        executionPriceForMargin <= 0
      ) {
        toast({
          title: "Invalid trade",
          description: "Missing or invalid price for margin calculation.",
          variant: "destructive",
        });
        return;
      }

      const requestedLeverage = Number(trade?.leverage);
      const tradeLeverage =
        Number.isFinite(requestedLeverage) && requestedLeverage > 0
          ? requestedLeverage
          : 100;
      const requiredMargin = tradingEngine.calculateRequiredMargin({
        symbol: trade.symbol,
        volume,
        price: executionPriceForMargin,
        leverage: tradeLeverage,
      });
      const currentBalance = Number(
        accountSummaryData?.account?.balance ??
          selectedChallenge?.currentBalance ??
          0,
      );
      const availableMargin = Math.max(
        0,
        currentBalance - usedOpenMargin - usedPendingMargin,
      );

      if (requiredMargin > availableMargin) {
        toast({
          title: "Insufficient margin",
          description: `Required $${requiredMargin.toFixed(2)}, available $${availableMargin.toFixed(2)}.`,
          variant: "destructive",
        });
        return;
      }
      try {
        if (isPendingOrder) {
          if (!Number.isFinite(pendingPrice) || pendingPrice <= 0) {
            toast({
              title: "Invalid order",
              description: "Missing or invalid pending order price.",
              variant: "destructive",
            });
            return;
          }

          const rawOrderType = String(
            trade?.orderType || "limit",
          ).toLowerCase();
          const mappedOrderType =
            rawOrderType === "stop"
              ? "STOP"
              : rawOrderType === "stop_limit"
                ? "STOP_LIMIT"
                : "LIMIT";

          await createPendingOrder({
            tradingAccountId: accountId,
            symbol: trade.symbol,
            type: String(trade.type).toUpperCase(),
            orderType: mappedOrderType,
            volume,
            price: pendingPrice,
            leverage: tradeLeverage,
            stopLoss:
              trade.stopLoss != null ? parseFloat(trade.stopLoss) : null,
            takeProfit:
              trade.takeProfit != null ? parseFloat(trade.takeProfit) : null,
          });
        } else {
          await createTrade({
            accountId,
            symbol: trade.symbol,
            type: String(trade.type).toUpperCase(),
            volume,
            openPrice,
            leverage: tradeLeverage,
            stopLoss:
              trade.stopLoss != null ? parseFloat(trade.stopLoss) : null,
            takeProfit:
              trade.takeProfit != null ? parseFloat(trade.takeProfit) : null,
          });
        }
        queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
        queryClient.invalidateQueries({
          queryKey: ["accountSummary", accountId],
        });
        queryClient.invalidateQueries({
          queryKey: ["pendingOrders", accountId],
        });
        toast({
          title: isPendingOrder ? "Pending order created" : "Trade executed",
        });
      } catch (e) {
        toast({
          title: "Trade failed",
          description: e?.response?.data?.message || e.message,
          variant: "destructive",
        });
      }
    },
    [
      accountId,
      isChallengeLocked,
      tradingEngine,
      usedOpenMargin,
      usedPendingMargin,
      accountSummaryData,
      selectedChallenge,
      queryClient,
      toast,
    ],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className={isDark ? "text-gray-400" : "text-slate-500"}>
            Loading challenges...
          </p>
        </div>
      </div>
    );
  }

  if (!selectedChallenge) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div
            className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDark ? "bg-white/5" : "bg-slate-200"}`}
          >
            <TrendingUp
              className={`w-8 h-8 ${isDark ? "text-gray-500" : "text-slate-400"}`}
            />
          </div>
          <p
            className={`font-medium ${isDark ? "text-white" : "text-slate-900"} mb-2`}
          >
            No Active Challenges
          </p>
          <p className={isDark ? "text-gray-400" : "text-slate-500"}>
            Purchase a challenge to start trading
          </p>
          <a
            href="/traderdashboard/checkout"
            className="inline-block mt-4 px-6 py-2 bg-amber-500 hover:bg-amber-600 text-black font-bold rounded-xl transition-colors"
          >
            Buy Challenge
          </a>
        </div>
      </div>
    );
  }

  const cardClass = `rounded-2xl border ${isDark ? "bg-[#12161d] border-white/5" : "bg-white border-slate-200"}`;
  const textClass = isDark ? "text-white" : "text-slate-900";
  const mutedClass = isDark ? "text-gray-400" : "text-amber-500";
  const borderColor = isDark ? "border-white/10" : "border-slate-200";
  const bgMuted = isDark ? "bg-[#0a0d12]" : "bg-slate-50";
  const green = "#0ecb81";
  const red = "#f6465d";

  const phaseLabel = getChallengePhaseLabel(selectedChallenge);
  const rules = selectedChallenge?.rules || {};
  const summaryAccount = accountSummaryData?.account;
  const summaryMetrics = accountSummaryData?.metrics;
  const selectedAccountId = accountId;
  const account = summaryAccount ?? {
    balance: selectedChallenge?.currentBalance,
    equity: selectedChallenge?.equity,
    status: selectedChallenge?.status,
  };
  const enrichedSelectedSymbol = selectedSymbol;
  const balance = Number.isFinite(summaryAccount?.balance)
    ? summaryAccount.balance
    : selectedChallenge.currentBalance || 0;

  /* ── Equity computation (delegated to engine) ── */
  const initialBalance = summaryAccount?.initialBalance || selectedChallenge?.accountSize || balance;
  const todayStartEquity = summaryAccount?.todayStartEquity || balance;
  const {
    availableBalance,
    activeEquity,
    equity,
    activeProfitPercent,
    activeDrawdownPercent,
    activeDailyDrawdownPercent,
    activeOverallDrawdownPercent,
  } = tradingEngine.computeEquity({
    balance,
    totalFloatingPnL,
    totalReservedMargin,
    hasOpenPositions,
    baselineEquity: Number.isFinite(activeEquityBaselineRef.current)
      ? activeEquityBaselineRef.current
      : balance,
    summaryEquity: summaryAccount?.equity,
    challengeEquity: selectedChallenge.equity,
    initialBalance,
    todayStartEquity,
  });
  const floatingPL = totalFloatingPnL;
  const profitPercent = Math.max(0, activeProfitPercent);

  const isAccountLocked = isStatusLocked(
    account?.status ?? effectiveAccountStatus,
  );
  const isDataLoading = tradesLoading || ordersLoading;
  const statusLockBanner = (() => {
    const violationType = getViolationTypeFromStatus(
      account?.status ?? effectiveAccountStatus,
    );
    if (!violationType) return null;
    if (violationType === "DAILY_LOCKED") {
      return {
        type: "warning",
        title: "Daily Loss Limit Reached",
        message:
          "Trading is locked until tomorrow. Open positions are being force-closed.",
      };
    }
    return {
      type: "error",
      title: "Challenge Disqualified",
      message:
        "Maximum drawdown was exceeded. Trading is disabled and positions are being force-closed.",
    };
  })();

  /* ── Compliance bars (delegated to engine) ── */
  const baseCompliance = getRuleCompliance(selectedChallenge);
  const complianceResult = tradingEngine.computeComplianceBars({
    baseCompliance,
    rules: {
      profitTarget: rules.profitTarget || 8,
      maxDailyLoss: rules.maxDailyLoss || 5,
      maxTotalDrawdown: rules.maxTotalDrawdown || 10,
    },
    summaryMetrics,
    liveMetrics,
    activeProfitPercent,
    activeDailyDrawdownPercent,
    activeOverallDrawdownPercent,
    hasTradeHistory,
    profitBarPeak: profitBarPeakRef.current,
    overallDrawdownBarPeak: overallDrawdownBarPeakRef.current,
    dailyDrawdownBarPeak: dailyDrawdownBarPeakRef.current,
  });
  const compliance = complianceResult.compliance;
  // Write updated peaks back to refs during render (intentional).
  // These are deterministic, monotonic (Math.max), and self-correcting — safe
  // to write here. Moving to useEffect would introduce a one-render-cycle delay
  // that could cause child components to read stale peak values.
  profitBarPeakRef.current = complianceResult.profitBarPeak;
  overallDrawdownBarPeakRef.current = complianceResult.overallDrawdownBarPeak;
  dailyDrawdownBarPeakRef.current = complianceResult.dailyDrawdownBarPeak;

  // WALLET FEATURE DISABLED - 2026-02-16
  // const spotPositionsCount = openPositions.filter((t) => t.positionType === 'SPOT').length;
  const tabs = [
    { id: "positions", label: "Positions", count: openPositions.length },
    { id: "pending", label: "Pending", count: activePendingOrders.length },
    { id: "history", label: "History", count: closedTrades.length },
    // { id: 'wallet', label: 'Wallet', count: spotPositionsCount }, // WALLET FEATURE DISABLED
  ];

  const thStyle = {
    padding: "8px 12px",
    fontWeight: 500,
    fontSize: 12,
    whiteSpace: "nowrap",
  };
  const tdStyle = {
    padding: "6px 12px",
    fontSize: 12,
    fontFamily: "monospace",
    whiteSpace: "nowrap",
  };

  return (
    <div className="w-full space-y-3 sm:space-y-5 px-2 sm:px-4 lg:px-6 py-2 sm:py-4">
      {/* ==================== CHALLENGE ACTIVE BANNER ==================== */}
      <ChallengeActiveBanner
        challenge={selectedChallenge}
        phaseLabel={phaseLabel}
      />

      {/* ==================== PHASE PROGRESSION ==================== */}
      <PhaseProgressionCards
        challenge={(() => {
          const effectiveProfit = hasTradeHistory
            ? Math.max(
                0,
                profitBarPeakRef.current,
                Number(summaryMetrics?.profitPercent) || 0,
              )
            : 0;
          const tradingDaysCompleted = summaryMetrics?.tradingDaysCompleted;
          if (
            !Number.isFinite(effectiveProfit) &&
            !Number.isFinite(tradingDaysCompleted)
          )
            return selectedChallenge;
          return {
            ...selectedChallenge,
            stats: {
              ...selectedChallenge.stats,
              ...(Number.isFinite(effectiveProfit) && {
                currentProfit: Math.max(0, effectiveProfit),
              }),
            },
            tradingDays: {
              ...selectedChallenge.tradingDays,
              ...(Number.isFinite(tradingDaysCompleted) && {
                current: tradingDaysCompleted,
              }),
              required:
                selectedChallenge?.tradingDays?.required ||
                rules.minTradingDays ||
                5,
            },
          };
        })()}
      />

      {/* ==================== BALANCE STATS ROW ==================== */}
      <BalanceStatsRow
        balance={availableBalance}
        equity={equity}
        floatingPL={floatingPL}
        profitPercent={profitPercent}
      />

      {/* ==================== COMPLIANCE METRICS ==================== */}
      <ComplianceMetrics
        compliance={compliance}
        challenge={selectedChallenge}
      />

      {statusLockBanner && (
        <div
          className={`rounded-xl border px-4 py-3 flex items-start gap-3 ${
            statusLockBanner.type === "error"
              ? isDark
                ? "bg-red-500/10 border-red-500/30 text-red-200"
                : "bg-red-50 border-red-200 text-red-800"
              : isDark
                ? "bg-orange-500/10 border-orange-500/30 text-orange-200"
                : "bg-orange-50 border-orange-200 text-orange-800"
          }`}
        >
          {statusLockBanner.type === "error" ? (
            <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold">{statusLockBanner.title}</p>
            <p className="text-xs opacity-90">{statusLockBanner.message}</p>
          </div>
        </div>
      )}

      {/* ==================== PLATFORM-SPECIFIC TRADING AREA ==================== */}
      <div className="w-full overflow-hidden rounded-xl">
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child, {
                positions: openPositions,
                onExecuteTrade: handleExecuteTrade,
                showBuySellPanel,
                setShowBuySellPanel,
                accountBalance: availableBalance,
                selectedAccountId,
                account,
                selectedSymbol: enrichedSelectedSymbol,
                setSelectedSymbol: setSelectedSymbol,
                tradingEngine,
              })
            : child,
        )}
      </div>

      {/* ==================== POSITIONS / PENDING / HISTORY ==================== */}
   { platformKey !== "mt5" &&  (
            <div className={cardClass}>
        <div className={`flex ${borderColor} border-b overflow-x-auto`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-6 py-3 font-medium text-sm transition-all shrink-0 ${
                selectedTab === tab.id
                  ? `${textClass} border-b-2 border-amber-500`
                  : `${mutedClass}`
              }`}
            >
              {tab.label}
              {tab.count > 0 ? (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold">
                  {tab.count}
                </span>
              ) : (
                <span className={`ml-1 text-xs ${mutedClass}`}>
                  ({tab.count})
                </span>
              )}
            </button>
          ))}
        </div>

        <div className={`${bgMuted} min-h-[120px]`}>
          {/* Loading state */}
          {isDataLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className={`w-5 h-5 animate-spin ${mutedClass}`} />
              <span className={`ml-2 text-sm ${mutedClass}`}>Loading...</span>
            </div>
          )}

          {/* ── POSITIONS TAB ── */}
          {!isDataLoading &&
            selectedTab === "positions" &&
            (openPositions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div
                  className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isDark ? "bg-white/5" : "bg-slate-200"}`}
                >
                  <TrendingUp className={`w-6 h-6 ${mutedClass}`} />
                </div>
                <p className={`font-medium text-sm ${textClass}`}>
                  No Open Positions
                </p>
                <p className={`text-xs mt-1 ${mutedClass}`}>
                  Place a trade to see your positions here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr className={`border-b ${borderColor}`}>
                      <th
                        style={{ ...thStyle, textAlign: "left" }}
                        className={mutedClass}
                      >
                        Symbol
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "left" }}
                        className={mutedClass}
                      >
                        Side
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        Qty
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        Entry
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        Current
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        PnL
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        SL
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        TP
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "center" }}
                        className={mutedClass}
                      ></th>
                    </tr>
                  </thead>
                  <tbody>
                    {positionsWithPnL.map((trade) => (
                      <tr
                        key={trade.id}
                        className={`border-b ${borderColor}/20`}
                      >
                        <td
                          style={{ ...tdStyle, textAlign: "left" }}
                          className={textClass}
                        >
                          {trade.symbol}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "left",
                            fontWeight: 600,
                            color: trade.type === "BUY" ? green : red,
                          }}
                        >
                          {trade.type === "BUY" ? "Long" : "Short"}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "right" }}
                          className={textClass}
                        >
                          {trade.volume?.toFixed(3)}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "right" }}
                          className={textClass}
                        >
                          {formatPrice(trade.openPrice)}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "right" }}
                          className={mutedClass}
                        >
                          {trade.currentPrice
                            ? formatPrice(trade.currentPrice)
                            : "--"}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "right",
                            fontWeight: 600,
                            color: trade.livePnL >= 0 ? green : red,
                          }}
                        >
                          {trade.livePnL >= 0 ? "+" : ""}
                          {trade.livePnL.toFixed(2)}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "right" }}
                          className={mutedClass}
                        >
                          {trade.stopLoss ? formatPrice(trade.stopLoss) : "--"}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "right" }}
                          className={mutedClass}
                        >
                          {trade.takeProfit
                            ? formatPrice(trade.takeProfit)
                            : "--"}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setModifyTPSLTrade(trade);
                                setModifyTP(
                                  trade.takeProfit
                                    ? String(trade.takeProfit)
                                    : "",
                                );
                                setModifySL(
                                  trade.stopLoss ? String(trade.stopLoss) : "",
                                );
                              }}
                              disabled={isAccountLocked}
                              title="Modify TP/SL"
                              className={`p-1 rounded transition-colors disabled:opacity-50 ${
                                isDark
                                  ? "text-gray-400 hover:text-amber-400"
                                  : "text-slate-400 hover:text-amber-600"
                              }`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setCloseConfirmTrade(trade)}
                              disabled={
                                closePositionMutation.isPending ||
                                isAccountLocked
                              }
                              className={`text-xs px-3 py-1 rounded border transition-colors disabled:opacity-50 ${
                                isDark
                                  ? "border-white/10 text-gray-400 hover:text-white hover:border-white/30"
                                  : "border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400"
                              }`}
                            >
                              Close
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {/* ── PENDING ORDERS TAB ── */}
          {!isDataLoading &&
            selectedTab === "pending" &&
            (activePendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div
                  className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isDark ? "bg-white/5" : "bg-slate-200"}`}
                >
                  <TrendingUp className={`w-6 h-6 ${mutedClass}`} />
                </div>
                <p className={`font-medium text-sm ${textClass}`}>
                  No Pending Orders
                </p>
                <p className={`text-xs mt-1 ${mutedClass}`}>
                  Create pending orders to see them here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr className={`border-b ${borderColor}`}>
                      <th
                        style={{ ...thStyle, textAlign: "left" }}
                        className={mutedClass}
                      >
                        Symbol
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "left" }}
                        className={mutedClass}
                      >
                        Type
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "left" }}
                        className={mutedClass}
                      >
                        Side
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        Qty
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        Price
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        SL
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        TP
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "center" }}
                        className={mutedClass}
                      ></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePendingOrders.map((order) => (
                      <tr
                        key={order.id}
                        className={`border-b ${borderColor}/20`}
                      >
                        <td
                          style={{ ...tdStyle, textAlign: "left" }}
                          className={textClass}
                        >
                          {order.symbol}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "left" }}
                          className={mutedClass}
                        >
                          {order.orderType}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "left",
                            fontWeight: 600,
                            color: order.type === "BUY" ? green : red,
                          }}
                        >
                          {order.type === "BUY" ? "Long" : "Short"}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "right" }}
                          className={textClass}
                        >
                          {order.volume?.toFixed(3)}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "right" }}
                          className={textClass}
                        >
                          {formatPrice(order.price)}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "right" }}
                          className={mutedClass}
                        >
                          {order.stopLoss ? formatPrice(order.stopLoss) : "--"}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "right" }}
                          className={mutedClass}
                        >
                          {order.takeProfit
                            ? formatPrice(order.takeProfit)
                            : "--"}
                        </td>
                        <td style={{ ...tdStyle, textAlign: "center" }}>
                          <button
                            onClick={() => cancelOrderMutation.mutate(order.id)}
                            disabled={cancelOrderMutation.isPending}
                            className="text-xs px-3 py-1 rounded border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {/* ── HISTORY TAB ── */}
          {!isDataLoading &&
            selectedTab === "history" &&
            (closedTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div
                  className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isDark ? "bg-white/5" : "bg-slate-200"}`}
                >
                  <TrendingUp className={`w-6 h-6 ${mutedClass}`} />
                </div>
                <p className={`font-medium text-sm ${textClass}`}>
                  No Trade History
                </p>
                <p className={`text-xs mt-1 ${mutedClass}`}>
                  Your closed trades will appear here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr className={`border-b ${borderColor}`}>
                      <th
                        style={{ ...thStyle, textAlign: "left" }}
                        className={mutedClass}
                      >
                        Symbol
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "left" }}
                        className={mutedClass}
                      >
                        Side
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        Qty
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        Entry
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        Close
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        PnL
                      </th>
                      <th
                        style={{ ...thStyle, textAlign: "right" }}
                        className={mutedClass}
                      >
                        Reason
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedTrades.slice(0, 50).map((trade) => (
                      <tr
                        key={trade.id}
                        className={`border-b ${borderColor}/20`}
                      >
                        <td
                          style={{ ...tdStyle, textAlign: "left" }}
                          className={textClass}
                        >
                          {trade.symbol}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "left",
                            fontWeight: 600,
                            color: trade.type === "BUY" ? green : red,
                          }}
                        >
                          {trade.type === "BUY" ? "Long" : "Short"}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "right" }}
                          className={textClass}
                        >
                          {trade.volume?.toFixed(3)}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "right" }}
                          className={textClass}
                        >
                          {formatPrice(trade.openPrice)}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "right" }}
                          className={textClass}
                        >
                          {formatPrice(trade.closePrice)}
                        </td>
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "right",
                            fontWeight: 600,
                            color: (trade.profit || 0) >= 0 ? green : red,
                          }}
                        >
                          {(trade.profit || 0) >= 0 ? "+" : ""}
                          {(trade.profit || 0).toFixed(2)}
                        </td>
                        <td
                          style={{ ...tdStyle, textAlign: "right" }}
                          className={mutedClass}
                        >
                          {trade.closeReason || "--"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}

          {/* ── WALLET TAB - DISABLED 2026-02-16 ──
          {selectedTab === 'wallet' && (
            <WalletPanel
              accountId={selectedAccountId}
              openPositions={openPositions}
              prices={prices}
              availableBalance={availableBalance}
              isDark={isDark}
              isAccountLocked={isAccountLocked}
              onTradeExecuted={() => {
                queryClient.invalidateQueries({ queryKey: ['trades', accountId] });
                queryClient.invalidateQueries({ queryKey: ['accountSummary', accountId] });
                queryClient.invalidateQueries({ queryKey: ['pendingOrders', accountId] });
              }}
            />
          )}
          ── END WALLET TAB ── */}
        </div>
      </div>
        )
      }
    

      {/* ==================== TRADING STYLE RULES ==================== */}
      <TradingStyleRules challenge={selectedChallenge} />

      {/* ==================== MODIFY TP/SL DIALOG ==================== */}
      {modifyTPSLTrade && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60"
          onClick={() => setModifyTPSLTrade(null)}
        >
          <div
            className={`${cardClass} p-6 max-w-sm w-full mx-4 shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-bold mb-1 ${textClass}`}>
              Modify TP / SL
            </h3>
            <p className={`text-sm ${mutedClass} mb-4`}>
              {modifyTPSLTrade.symbol} ·{" "}
              {modifyTPSLTrade.type === "BUY" ? "Long" : "Short"} · Entry{" "}
              {formatPrice(modifyTPSLTrade.openPrice)}
            </p>
            <div className="space-y-3 mb-5">
              <div>
                <label
                  className={`text-xs font-medium ${mutedClass} mb-1 block`}
                >
                  Take Profit
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Leave blank to remove"
                  value={modifyTP}
                  onChange={(e) => setModifyTP(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 ${isDark ? "bg-[#0a0d12] border-white/10 text-white placeholder-gray-600" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"}`}
                />
              </div>
              <div>
                <label
                  className={`text-xs font-medium ${mutedClass} mb-1 block`}
                >
                  Stop Loss
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Leave blank to remove"
                  value={modifySL}
                  onChange={(e) => setModifySL(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 ${isDark ? "bg-[#0a0d12] border-white/10 text-white placeholder-gray-600" : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"}`}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setModifyTPSLTrade(null);
                  setModifyTP("");
                  setModifySL("");
                }}
                className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors ${isDark ? "border-white/10 text-gray-400 hover:text-white" : "border-slate-200 text-slate-500 hover:text-slate-900"}`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const tp = modifyTP !== "" ? parseFloat(modifyTP) : null;
                  const sl = modifySL !== "" ? parseFloat(modifySL) : null;
                  modifyTPSLMutation.mutate({
                    tradeId: modifyTPSLTrade.id,
                    takeProfit: tp,
                    stopLoss: sl,
                  });
                }}
                disabled={modifyTPSLMutation.isPending}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-bold transition-colors"
              >
                {modifyTPSLMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================== CLOSE CONFIRMATION DIALOG ==================== */}
      {closeConfirmTrade && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60"
          onClick={() => setCloseConfirmTrade(null)}
        >
          <div
            className={`${cardClass} p-6 max-w-sm w-full mx-4 shadow-xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={`text-lg font-bold mb-4 ${textClass}`}>
              Close Position?
            </h3>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className={mutedClass}>Symbol</span>
                <span className={textClass}>{closeConfirmTrade.symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={mutedClass}>Side</span>
                <span
                  style={{
                    color: closeConfirmTrade.type === "BUY" ? green : red,
                    fontWeight: 600,
                  }}
                >
                  {closeConfirmTrade.type === "BUY" ? "Long" : "Short"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={mutedClass}>Qty</span>
                <span className={textClass}>
                  {closeConfirmTrade.volume?.toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={mutedClass}>Entry Price</span>
                <span className={textClass}>
                  {formatPrice(closeConfirmTrade.openPrice)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={mutedClass}>Close Price</span>
                <span className={textClass}>
                  {formatPrice(
                    closeConfirmTrade.currentPrice ||
                      tradingEngine.getExitPrice(closeConfirmTrade, prices),
                  )}
                </span>
              </div>
              <div
                className={`flex justify-between text-sm pt-2 border-t ${borderColor}`}
              >
                <span className={mutedClass}>Est. PnL</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: closeConfirmTrade.livePnL >= 0 ? green : red,
                  }}
                >
                  {closeConfirmTrade.livePnL >= 0 ? "+" : ""}$
                  {closeConfirmTrade.livePnL.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCloseConfirmTrade(null)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border ${
                  isDark
                    ? "border-white/10 text-gray-400 hover:text-white"
                    : "border-slate-300 text-slate-500 hover:text-slate-900"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const cp =
                    closeConfirmTrade.currentPrice ||
                    tradingEngine.getExitPrice(closeConfirmTrade, prices);
                  closePositionMutation.mutate({
                    tradeId: closeConfirmTrade.id,
                    closePrice: cp,
                  });
                  setCloseConfirmTrade(null);
                }}
                disabled={closePositionMutation.isPending}
                className="flex-1 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                {closePositionMutation.isPending
                  ? "Closing..."
                  : "Confirm Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ViolationModal
        isOpen={violationModal?.shown === true}
        onClose={handleViolationModalClose}
        violationType={violationModal?.type}
        account={{
          ...(account || {}),
          maxDailyDrawdown: rules.maxDailyLoss || 0,
          maxOverallDrawdown: rules.maxTotalDrawdown || 0,
        }}
      />
    </div>
  );
};

export default CommonTerminalWrapper;
