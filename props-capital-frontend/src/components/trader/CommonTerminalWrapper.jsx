<<<<<<< HEAD
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, ChevronDown, Search, TrendingDown } from 'lucide-react';
=======
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, ChevronDown, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
>>>>>>> 6aab4f3f735ae0ac13bf53e0ab7900d97f907fbb
import { useTraderTheme } from './TraderPanelLayout';
import { useChallenges } from '@/contexts/ChallengesContext';
import { usePrices } from '@/contexts/PriceContext';
import { getAccountTrades, updateTrade } from '@/api/trades';
import { getPendingOrders, cancelPendingOrder } from '@/api/pending-orders';
import { processPriceTick, getAccountSummary } from '@/api/accounts';
import { useToast } from '@/components/ui/use-toast';
import ChallengeActiveBanner from '../trading/ChallengeActiveBanner';
import PhaseProgressionCards from '../trading/PhaseProgressionCards';
import BalanceStatsRow from '../trading/BalanceStatsRow';
import ComplianceMetrics from '../trading/ComplianceMetrics';
import TradingStyleRules from '../trading/TradingStyleRules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OpenPositions from '../trading/OpenPositions';
import { useTranslation } from '@/contexts/LanguageContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getCurrentUser } from '@/api/auth';
import { Input } from '@/components/ui/input';
import { usePrices } from '@/contexts/PriceContext';
import { getUserAccounts, getAccountSummary } from '@/api/accounts';
import { getAccountTrades, createTrade, updateTrade } from '@/api/trades';
import { createPendingOrder } from '@/api/pending-orders';
import { useToast } from '../ui/use-toast';
import { Card } from '../ui/card';
import { cn } from '@/lib/utils';
import MarketExecutionModal from './MarketExecutionModal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';

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

const formatPrice = (price) => {
  if (!price || price === 0) return '--';
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
};

const isCryptoSymbol = (symbol) => {
  if (!symbol) return false;
  const s = symbol.toUpperCase();
  return s.includes('BTC') || s.includes('ETH') || s.includes('SOL') ||
    s.includes('XRP') || s.includes('ADA') || s.includes('DOGE') ||
    s.includes('BNB') || s.includes('AVAX') || s.includes('DOT') ||
    s.includes('MATIC') || s.includes('LINK') || s.endsWith('USDT');
};

const CommonTerminalWrapper = ({ children, selectedChallenge: selectedChallengeProp = null }) => {
  const { isDark } = useTraderTheme();
<<<<<<< HEAD
  const {
    challenges,
    selectedChallenge,
=======
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { prices } = usePrices();
  const {
    challenges,
    selectedChallenge: selectedChallengeFromContext,
>>>>>>> 6aab4f3f735ae0ac13bf53e0ab7900d97f907fbb
    selectChallenge,
    getChallengePhaseLabel,
    getRuleCompliance,
    loading
  } = useChallenges();
<<<<<<< HEAD


  const queryClient = useQueryClient();
  const { toast } = useToast();
  // Demo account for testing/demo purposes
  const demoAccount = {
    id: "demo-account",
    account_number: "DEMO001",
    platform: "MT5",
    status: "active",
    current_phase: "phase1",
    initial_balance: 100000,
    current_balance: 100000,
    current_equity: 100000,
    current_profit_percent: 0,
    daily_drawdown_percent: 0.5,
    overall_drawdown_percent: 0.0,
    trading_days_count: 0,
    isDemo: true,
  };
  // Get accountId from URL using React Router
  const [searchParams] = useSearchParams();
  const {
    prices: unifiedPrices,
    getPrice: getUnifiedPrice,
    lastUpdate: pricesLastUpdate,
  } = usePrices();
  // Get current user
  const { data: user } = useQuery({
    queryKey: ["user", "me"],
    queryFn: getCurrentUser,
    retry: false,
  });





  const [showBuySellPanel, setShowBuySellPanel] = useState(false);
   const [selectedSymbol, setSelectedSymbol] = useState(null);

 // Enrich selected symbol with real-time price data
  const enrichedSelectedSymbol = selectedSymbol && unifiedPrices[selectedSymbol.symbol]
    ? {
      ...selectedSymbol,
      bid: unifiedPrices[selectedSymbol.symbol].bid,
      ask: unifiedPrices[selectedSymbol.symbol].ask,
    }
    : selectedSymbol;


  // Helper function for development-only logging
  const devLog = (...args) => {
    if (process.env.NODE_ENV !== "production") {
      // console.log(...args);
    }
  };



  const devWarn = (...args) => {
    if (process.env.NODE_ENV !== "production") {
      console.warn(...args);
    }
  };

  // Store last valid userId to prevent query from being disabled during refetches
  const lastValidUserIdRef = useRef(user?.userId);
  useEffect(() => {
    if (user?.userId) {
      lastValidUserIdRef.current = user.userId;
    }
  }, [user?.userId]);


  // Demo account data - will be overridden if real account exists
  const [account, setAccount] = useState({
    balance: 100000,
    equity: 100000,
    margin: 0,
    freeMargin: 100000,
    floatingPnL: 0,
    profitPercent: 0,
    realizedProfitPercent: 0, // ✅ Added from earliest version
    liveProfitPercent: 0, // ✅ Added from earliest version
    profitForTarget: 0, // ✅ Added from earliest version
    dailyDrawdown: 0,
    maxDailyDrawdown: 5,
    overallDrawdown: 0,
    maxOverallDrawdown: 10,
    profitTarget: 10,
    tradingDays: 5,
    minTradingDays: 5,
    daysRemaining: 15, // Default to 15 days remaining (30 max - 15 elapsed)
    daysElapsed: 15,
    phase: "phase1",
    startingBalance: 100000,
    highestBalance: 100000,
    accountNumber: null,
    platform: "MT5",
    status: "ACTIVE", // Initialize with ACTIVE status
    maxTradingDays: 0,
  });

  // Track last local update time to prevent stale backend data from overwriting optimistic state
  const lastLocalUpdateRef = useRef(0);
  // Fetch all user's accounts
  // Use keepPreviousData to prevent accounts from disappearing during refetches
  const { data: allAccountsData = [], isLoading: isLoadingAccounts } = useQuery(
    {
      queryKey: [
        "trading-accounts",
        lastValidUserIdRef.current || user?.userId,
      ],
      queryFn: async () => {
        const userId = lastValidUserIdRef.current || user?.userId;
        if (!userId) return [];
        try {
          const accounts = await getUserAccounts(userId);
          devLog("📥 Fetched accounts:", accounts?.length || 0);
          return accounts || [];
        } catch (error) {
          console.error("❌ Failed to fetch accounts:", error);
          // Return previous data instead of empty array to prevent accounts from disappearing
          // React Query will handle this with keepPreviousData, but we add safety here
          throw error; // Let React Query handle the error state
        }
      },
      enabled: !!(lastValidUserIdRef.current || user?.userId),
      retry: 2, // Retry failed requests
      retryDelay: 1000,
      staleTime: 30000, // Consider data fresh for 30 seconds (prevent excessive refetches)
      refetchOnWindowFocus: false, // Don't refetch on window focus
      keepPreviousData: true, // Keep previous data while refetching (prevents accounts from disappearing)
    },
  );


  // Map backend accounts to frontend format
  // Map backend accounts to frontend format
  const allAccounts = (allAccountsData || []).map((account) => {
    const challenge = account.challenge || {};
    const initialBalance = account.initialBalance || challenge.accountSize || 0;
    const balance = account.balance || initialBalance;
    const equity = account.equity || balance;

    // ✅ Use monotonic tracking fields from backend (single source of truth)
    // These never reset/decrease, ensuring correct values on page load
    const maxEquityToDate = account.maxEquityToDate ?? initialBalance;
    const profitPercent =
      initialBalance > 0
        ? ((maxEquityToDate - initialBalance) / initialBalance) * 100
        : 0;

    const minEquityOverall = account.minEquityOverall ?? initialBalance;
    const overallDD =
      initialBalance > 0 && minEquityOverall < initialBalance
        ? ((initialBalance - minEquityOverall) / initialBalance) * 100
        : 0;

    const todayStartEquity = account.todayStartEquity ?? initialBalance;
    const minEquityToday = account.minEquityToday ?? initialBalance;
    const dailyDD =
      todayStartEquity > 0 && minEquityToday < todayStartEquity
        ? ((todayStartEquity - minEquityToday) / todayStartEquity) * 100
        : 0;

    const phaseMap = {
      PHASE1: "phase1",
      PHASE2: "phase2",
      FUNDED: "funded",
      FAILED: "failed",
    };
    const statusMap = {
      ACTIVE: "ACTIVE",
      PAUSED: "PAUSED",
      CLOSED: "CLOSED",
      DAILY_LOCKED: "DAILY_LOCKED",
      DISQUALIFIED: "DISQUALIFIED",
      FAILED: "FAILED",
      CHALLENGE_FAILED: "CHALLENGE_FAILED",
      ACCOUNT_FAILED: "ACCOUNT_FAILED",
    };

    return {
      id: account.id,
      account_number: account.brokerLogin || account.id.slice(0, 8),
      platform: account.platform || challenge.platform || "MT5",
      status: statusMap[account.status] || account.status || "ACTIVE", // Preserve original status or use uppercase
      current_phase:
        phaseMap[account.phase] || account.phase?.toLowerCase() || "phase1",
      initial_balance: initialBalance,
      current_balance: balance,
      current_equity: equity,
      current_profit_percent: profitPercent,
      daily_drawdown_percent: dailyDD,
      overall_drawdown_percent: overallDD,
      trading_days_count: account.trades
        ? new Set(
          account.trades.map((t) =>
            new Date(t.openedAt).toISOString().substring(0, 10),
          ),
        ).size
        : 0,
      min_trading_days:
        challenge.minTradingDays || challenge.min_trading_days || 5,
      max_trading_days:
        challenge.maxTradingDays || challenge.max_trading_days || 30,
      days_remaining:
        account.daysRemaining ??
        Math.max(
          0,
          (challenge.maxTradingDays || challenge.max_trading_days || 30) -
          (account.daysElapsed || 0),
        ),
      margin_used: 0, // Will be updated from backend getAccountById
      free_margin: equity, // Will be updated from backend getAccountById
      // Challenge fields for ChallengeRulesPanel (camelCase versions)
      minTradingDays:
        challenge.minTradingDays || challenge.min_trading_days || 5,
      maxTradingDays:
        challenge.maxTradingDays || challenge.max_trading_days || 30,
      profitSplit: challenge.profitSplit || challenge.profit_split || 80,
      leverage: challenge.leverage || 100,
      maxLot: challenge.maxLot || challenge.max_lot || 10,
      phase1_profit_target:
        challenge.phase1TargetPercent || challenge.phase1_profit_target || 8,
      max_daily_drawdown:
        challenge.dailyDrawdownPercent || challenge.max_daily_drawdown || 5,
      max_overall_drawdown:
        challenge.overallDrawdownPercent ||
        challenge.max_overall_drawdown ||
        10,
      // ✅ Add camelCase versions for ChallengeRulesPanel compatibility
      phase1TargetPercent:
        challenge.phase1TargetPercent || challenge.phase1_profit_target || 8,
      dailyDrawdownPercent:
        challenge.dailyDrawdownPercent || challenge.max_daily_drawdown || 5,
      overallDrawdownPercent:
        challenge.overallDrawdownPercent ||
        challenge.max_overall_drawdown ||
        10,
      news_trading_allowed:
        challenge.newsTradingAllowed ?? challenge.news_trading_allowed ?? true,
      weekend_holding_allowed:
        challenge.weekendHoldingAllowed ??
        challenge.weekend_holding_allowed ??
        true,
      ea_allowed: challenge.eaAllowed ?? challenge.ea_allowed ?? true,
    };
  });
  // Combine real accounts with demo account
  const realAccounts = allAccounts.filter((a) => a.status !== "failed");
  const availableAccounts = [demoAccount, ...realAccounts];
  const accountId =
    searchParams.get("account") || searchParams.get("accountId");


  const [selectedTab, setSelectedTab] = useState('positions');
  const [positions, setPositions] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [demoClosedTrades, setDemoClosedTrades] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState(accountId || demoAccount.id);
  const [optimisticClosedTrades, setOptimisticClosedTrades] = useState([]);
  const [isExecutingTrade, setIsExecutingTrade] = useState(false);
  // Trade history filters (same as pages/TradingTerminal.jsx)
  const [historySymbolFilter, setHistorySymbolFilter] = useState("");
  const [historyPnLFilter, setHistoryPnLFilter] = useState("all"); // 'all', 'profit', 'loss'
  const [historyDateFilter, setHistoryDateFilter] = useState("all"); // 'all', 'today', 'week', 'month'
  const { t } = useTranslation()

  const selectedAccount = availableAccounts.find(
    (a) => a.id === selectedAccountId,
  );
  const hasValidAccount = !!selectedAccount;

  // Fetch trades for selected account
  // IMPORTANT: Don't default to [] - use undefined so we can detect when data hasn't loaded yet
  const {
    data: backendTrades,
    isLoading: isLoadingTrades,
    error: tradesError,
    isFetching: isFetchingTrades,
  } = useQuery({
    queryKey: ["trades", selectedAccountId],
    queryFn: async () => {
      if (!selectedAccountId) return [];
      try {
        const trades = await getAccountTrades(selectedAccountId);
        // Debug: Log raw backend response to see what fields are returned
        console.log("🔍 [Backend Trades] Raw response from backend:", trades);
        if (trades && trades.length > 0) {
          console.log(
            "🔍 [Backend Trades] First trade fields:",
            Object.keys(trades[0]),
          );
          trades.forEach((trade, index) => {
            if (trade.closePrice !== null) {
              console.log(`🔍 [Backend Trades] Trade ${index} (closed):`, {
                id: trade.id,
                symbol: trade.symbol,
                closePrice: trade.closePrice,
                profit: trade.profit,
                breachTriggered: trade.breachTriggered,
                breachUnrealizedPnl: trade.breachUnrealizedPnl,
                closeReason: trade.closeReason,
                breachType: trade.breachType,
                breachAt: trade.breachAt,
                breachEquity: trade.breachEquity,
                breachDrawdownPercentDaily: trade.breachDrawdownPercentDaily,
                breachDrawdownPercentOverall:
                  trade.breachDrawdownPercentOverall,
              });
            }
          });
        }
        devLog(
          "📥 Fetched trades from backend for account:",
          selectedAccountId,
          "Count:",
          trades?.length || 0,
        );
        return trades || [];
      } catch (error) {
        console.error("Failed to fetch trades:", error);
        // Don't show error toast for initial load, only log
        if (error.response?.status !== 404) {
          devWarn("Trade fetch error:", error.message);
        }
        return [];
      }
    },
    enabled: !!selectedAccountId && hasValidAccount && !selectedAccount?.isDemo, // Don't fetch trades for demo account
    refetchOnWindowFocus: false,
    retry: 2, // Retry failed requests 2 times
    retryDelay: 1000, // Wait 1 second between retries
    // Keep data fresh - refetch every 5 seconds to catch backend auto-closes
    staleTime: 0, // Always consider data stale to ensure fresh fetch on account change
    refetchInterval: 5000, // Auto-refetch every 5 seconds to catch SL/TP auto-closes from backend
  });

  // Sync positions from backend (same flow as pages/TradingTerminal.jsx)
  useEffect(() => {
    if (selectedAccount?.isDemo || !selectedAccountId) {
      const demoData = loadDemoAccountTrades();
      setPositions(demoData.positions || []);
      setDemoClosedTrades(demoData.closedTrades || []);
      setPendingOrders(demoData.pendingOrders || []);
      return;
    }
    if (isLoadingTrades || isFetchingTrades || !backendTrades || !Array.isArray(backendTrades)) return;
    const openTrades = backendTrades
      .filter((t) => t.closePrice == null || t.closePrice === undefined)
      .map((trade) => ({
        id: trade.id,
        symbol: trade.symbol,
        type: trade.type?.toLowerCase() || trade.type,
        lotSize: trade.volume,
        entryPrice: trade.openPrice,
        stopLoss: trade.stopLoss ?? null,
        takeProfit: trade.takeProfit ?? null,
        openTime: new Date(trade.openedAt).toISOString(),
      }));
    setPositions(openTrades);
  }, [backendTrades, selectedAccountId, selectedAccount?.isDemo, isLoadingTrades, isFetchingTrades]);

  // Helper function to check if symbol is crypto

  const pricesRef = useRef({});

  const [currentPrices, setCurrentPrices] = useState({});

  const handlePriceUpdate = useCallback((symbolName, price) => {
    pricesRef.current[symbolName] = price;
  }, []);



 const handleNewOrder = () => {
    setShowBuySellPanel(true);
  };

  const handleToggleBuySell = () => {
    setShowBuySellPanel(prev => !prev);
  };

  // Helper function to get the correct price for a position type
  // BUY positions close by SELLING → use BID price
  // SELL positions close by BUYING → use ASK price
  const getPriceForPosition = useCallback(
    (symbol, positionType, fallbackPrice = null) => {
      const priceData = unifiedPrices[symbol];
      let price;

      if (priceData && typeof priceData === "object") {
        // BUY position closes by SELLING → use BID
        // SELL                              closes by BUYING → use ASK
        price = positionType === "buy" ? priceData.bid : priceData.ask;
      } else {
        // Backward compatibility: if it's a simple number, use it
        // Or use fallback if no price data
        price = priceData || fallbackPrice;
      }

      // Ensure we always return a valid number
      if (typeof price !== "number" || isNaN(price)) {
        return fallbackPrice || 0;
      }

      return price;
    },
    [unifiedPrices],
  );

  useEffect(() => {
    const id = setInterval(() => {
      setCurrentPrices({ ...pricesRef.current });
    }, 500);
    return () => clearInterval(id);
  }, []);

  const isCryptoSymbol = useCallback((symbolName) => {
    return (
      symbolName.includes("BTC") ||
      symbolName.includes("ETH") ||
      symbolName.includes("SOL") ||
      symbolName.includes("XRP") ||
      symbolName.includes("ADA") ||
      symbolName.includes("DOGE")
    );
  }, []);

  // Helper function to calculate P/L for a position (from earliest version)
  const calculatePositionPnL = useCallback(
    (pos, currentPrice) => {
      const price = currentPrice || pos.entryPrice;
      const priceDiff =
        pos.type === "buy" || pos.type === "BUY"
          ? price - pos.entryPrice
          : pos.entryPrice - price;

      // For crypto - lotSize represents actual units (e.g., 0.5 BTC)
      // P/L = priceDiff * lotSize
      if (isCryptoSymbol(pos.symbol)) {
        return priceDiff * pos.lotSize;
      }

      // For forex - use standard lot calculation (100,000 units per lot)
      // IMPORTANT: lotSize represents LOTS (e.g., 10 = 10 lots), NOT units
      // P/L = priceDiff * lotSize * contractSize
      const contractSize = 100000;
      return priceDiff * pos.lotSize * contractSize;
    },
    [isCryptoSymbol],
  );
  useEffect(() => {
    if (!isLoadingAccounts) {
      // If no account selected or selected account doesn't exist in available accounts
      if (
        !selectedAccountId ||
        !availableAccounts.find((a) => a.id === selectedAccountId)
      ) {
        // Default to demo account
        setSelectedAccountId(demoAccount.id);
      }
    }
  }, [availableAccounts, selectedAccountId, isLoadingAccounts]);

  // Helper function to sync account data from backend (Step 3: Account Balance Sync)
  // Returns the resolved account status from backend
  // showLoading: if true, shows skeleton loading state (for account switches). If false, syncs silently in background (for trade updates)
  const syncAccountFromBackend = useCallback(
    async (accountId, force = false, showLoading = false) => {
      if (!accountId || selectedAccount?.isDemo) {
        devLog("⏭️ Skipping account sync - demo account or no account ID");
        return null;
      }

      // Throttle: Don't sync if we just synced this account recently (unless forced)
      const now = Date.now();
      const lastSync = lastSyncTimeRef.current[accountId] || 0;
      const timeSinceLastSync = now - lastSync;

      if (!force && timeSinceLastSync < SYNC_THROTTLE_MS) {
        devLog(
          `⏭️ Skipping sync - last sync was ${timeSinceLastSync}ms ago (throttle: ${SYNC_THROTTLE_MS}ms)`,
        );
        return account.status || null;
      }

      // Prevent concurrent syncs for the same account
      if (isSyncingRef.current[accountId]) {
        devLog("⏭️ Skipping sync - already syncing this account");
        return account.status || null;
      }

      // Mark as syncing
      isSyncingRef.current[accountId] = true;
      lastSyncTimeRef.current[accountId] = now;

      // Only show loading state if explicitly requested (account switches, not background syncs)
      if (showLoading) {
        setIsAccountLoading(true);
      }

      try {
        devLog("🔄 Syncing account data from backend for account:", accountId);

        // Fetch fresh account summary from backend
        const accountSummary = await getAccountSummary(accountId);

        // Extract account and metrics from response
        const acc = accountSummary.account || {};
        const metrics = accountSummary.metrics || {};

        // Use backend metrics directly - never recalculate (single source of truth)
        const backendOverallDD = metrics.overallDrawdownPercent ?? 0;
        const backendDailyDD = metrics.dailyDrawdownPercent ?? 0;
        // CRITICAL: Get backend status and check for frozen violation values
        const backendStatus = acc.status || account.status;
        const statusUpper = String(backendStatus).toUpperCase();

        // Store last known metrics in sessionStorage for fallback (update on every successful sync)
        if (typeof window !== "undefined" && backendOverallDD >= 0) {
          sessionStorage.setItem(
            `metrics:${accountId}:last_overall_dd`,
            backendOverallDD.toString(),
          );
          devLog("💾 Stored last known overall drawdown:", backendOverallDD);
        }
        if (typeof window !== "undefined" && backendDailyDD >= 0) {
          sessionStorage.setItem(
            `metrics:${accountId}:last_daily_dd`,
            backendDailyDD.toString(),
          );
          devLog("💾 Stored last known daily drawdown:", backendDailyDD);
        }

        // Always use backend values for drawdown calculations (single source of truth)
        // Backend uses equity snapshots to track highest equity today, which is more accurate
        const balance = acc.balance ?? 0;
        const equity = acc.equity ?? balance;
        const initialBalance =
          acc.initialBalance || account.startingBalance || 100000;
        const todayStartEquity = acc.todayStartEquity ?? equity; // Equity at start of trading day
        const maxEquityToDate = acc.maxEquityToDate ?? initialBalance; // Highest equity ever reached

        // Handle daily drawdown: use frozen violation value when DAILY_LOCKED
        let dailyDrawdown = backendDailyDD;
        if (statusUpper.includes("DAILY")) {
          const storedDailyDD = sessionStorage.getItem(
            `violation:${accountId}:daily_dd`,
          );
          if (storedDailyDD !== null) {
            dailyDrawdown = parseFloat(storedDailyDD);
            devLog(
              "🔒 Using frozen daily drawdown value from violation:",
              dailyDrawdown,
            );
          }
        }

        // Handle overall drawdown: use breach snapshot if available, then fallback
        let overallDrawdown = backendOverallDD;
        const isLocked =
          statusUpper.includes("DAILY") ||
          statusUpper.includes("FAIL") ||
          statusUpper.includes("DISQUAL");
        const isDailyLocked = statusUpper.includes("DAILY");
        const isDisqualified =
          statusUpper.includes("FAIL") || statusUpper.includes("DISQUAL");

        // If account is disqualified/failed, use frozen overall drawdown value if available (highest priority)
        if (isDisqualified) {
          const storedOverallDD = sessionStorage.getItem(
            `violation:${accountId}:overall_dd`,
          );
          if (storedOverallDD !== null) {
            const violationDD = parseFloat(storedOverallDD);
            if (Number.isFinite(violationDD) && violationDD > 0) {
              overallDrawdown = violationDD;
              devLog(
                "🔒 Using frozen overall drawdown value from violation:",
                overallDrawdown,
              );
            }
          }
        }

        // If DAILY_LOCKED and backend returns 0/null, use breach snapshot (atomic snapshot at breach moment)
        if (
          isDailyLocked &&
          (backendOverallDD === 0 ||
            backendOverallDD === null ||
            backendOverallDD === undefined)
        ) {
          const snapshotDD = sessionStorage.getItem(
            `violation:${accountId}:snapshot_overall_dd`,
          );
          if (snapshotDD !== null) {
            const snapshotValue = parseFloat(snapshotDD);
            if (Number.isFinite(snapshotValue) && snapshotValue > 0) {
              overallDrawdown = snapshotValue;
              devLog(
                "🔒 [SNAPSHOT] Using overall drawdown from breach snapshot:",
                overallDrawdown,
              );
            }
          } else {
            // Fallback to last known metrics if snapshot not available
            const lastKnownOverallDD = sessionStorage.getItem(
              `metrics:${accountId}:last_overall_dd`,
            );
            if (lastKnownOverallDD !== null) {
              const lastDD = parseFloat(lastKnownOverallDD);
              if (Number.isFinite(lastDD) && lastDD > 0) {
                overallDrawdown = lastDD;
                devLog(
                  "🔄 Using fallback overall drawdown from last known metrics:",
                  overallDrawdown,
                );
              }
            }
          }
        }

        // Clear snapshot when account becomes ACTIVE again (unlocked)
        if (backendStatus === "ACTIVE" && typeof window !== "undefined") {
          const previousStatus = account.status;
          const prevStatusUpper = String(previousStatus || "").toUpperCase();
          // Only clear if transitioning from locked state to active
          if (
            prevStatusUpper.includes("DAILY") ||
            prevStatusUpper.includes("FAIL") ||
            prevStatusUpper.includes("DISQUAL")
          ) {
            sessionStorage.removeItem(
              `violation:${accountId}:snapshot_overall_dd`,
            );
            devLog("🧹 Cleared breach snapshot - account unlocked");
          }
        }

        // Get challenge rules from accountSummary response
        const challengeRules = accountSummary.challengeRules || {};
        const maxDailyDD =
          challengeRules.dailyDrawdownPercent || account.maxDailyDrawdown || 5;
        const maxOverallDD =
          challengeRules.overallDrawdownPercent ||
          account.maxOverallDrawdown ||
          10;

        // CRITICAL: For daily drawdown, use frozen violation value if DAILY_LOCKED
        let finalDailyDrawdown = dailyDrawdown;
        if (isDailyLocked && typeof window !== "undefined") {
          const violationDailyDD = sessionStorage.getItem(
            `violation:${accountId}:daily_dd`,
          );
          if (violationDailyDD !== null) {
            const violationValue = parseFloat(violationDailyDD);
            if (Number.isFinite(violationValue) && violationValue > 0) {
              finalDailyDrawdown = violationValue;
              devLog(
                "🔒 Using frozen daily drawdown from violation:",
                finalDailyDrawdown,
              );
            }
          }
        }

        // CRITICAL: Never overwrite overallDrawdown with 0 if account is locked/disqualified and violation value exists
        // This prevents reset-to-0 when backend returns 0 after positions close
        let finalOverallDrawdown = overallDrawdown;
        if (
          (isDailyLocked || isDisqualified) &&
          (overallDrawdown === 0 || !Number.isFinite(overallDrawdown))
        ) {
          // Try violation value first
          if (typeof window !== "undefined") {
            const violationOverallDD = sessionStorage.getItem(
              `violation:${accountId}:overall_dd`,
            );
            if (violationOverallDD !== null) {
              const violationValue = parseFloat(violationOverallDD);
              if (Number.isFinite(violationValue) && violationValue > 0) {
                finalOverallDrawdown = violationValue;
                devLog(
                  "🔒 Using frozen overall drawdown from violation (fallback):",
                  finalOverallDrawdown,
                );
              } else {
                // Fallback to account's existing value
                finalOverallDrawdown = account.overallDrawdown ?? 0;
              }
            } else {
              // Fallback to account's existing value
              finalOverallDrawdown = account.overallDrawdown ?? 0;
            }
          } else {
            finalOverallDrawdown = account.overallDrawdown ?? 0;
          }
        } else {
          finalOverallDrawdown = Number.isFinite(overallDrawdown)
            ? overallDrawdown
            : (account.overallDrawdown ?? 0);
        }

        setAccount((prev) => {
          // PROTECTION: Prevent stale backend data from overwriting optimistic balance
          // If we had a local update within the last 3 seconds, use the backend balance only if it's different
          // from what we expect (meaning the backend has definitely processed our change)
          const now = Date.now();
          const isRecentlyUpdated = now - lastLocalUpdateRef.current < 3000;

          let finalBalance =
            acc.balance !== null &&
              acc.balance !== undefined &&
              Number.isFinite(acc.balance)
              ? acc.balance
              : prev.balance;

          if (isRecentlyUpdated && lastLocalBalanceRef.current !== null) {
            // If the backend balance hasn't caught up to our optimistic balance yet, keep our optimistic one
            if (Math.abs(finalBalance - lastLocalBalanceRef.current) > 0.01) {
              devLog(
                "🛡️ Protected optimistic balance from stale backend data:",
                finalBalance,
                "->",
                lastLocalBalanceRef.current,
              );
              finalBalance = lastLocalBalanceRef.current;
            } else {
              // Backend caught up, we can clear our ref
              lastLocalBalanceRef.current = null;
            }
          }

          return {
            ...prev,
            balance: finalBalance,
            equity:
              acc.equity !== null &&
                acc.equity !== undefined &&
                Number.isFinite(acc.equity)
                ? acc.equity
                : prev.equity,
            // ✅ TRUST BACKEND VALUES (single source of truth)
            // Backend tracks maxEquityToDate for profit (monotonic - never decreases)
            // Backend tracks minEquityOverall for overall drawdown (monotonic - never decreases)
            // Backend tracks minEquityToday for daily drawdown (resets at midnight, monotonic during day)
            profitPercent:
              metrics.profitPercent !== null &&
                metrics.profitPercent !== undefined &&
                Number.isFinite(metrics.profitPercent)
                ? metrics.profitPercent
                : prev.profitPercent ?? 0,
            // ✅ profitForTarget MUST come from backend (monotonic, uses maxEquityToDate)
            // Frontend was calculating this incorrectly from current balance
            profitForTarget:
              metrics.profitPercent !== null &&
                metrics.profitPercent !== undefined &&
                Number.isFinite(metrics.profitPercent)
                ? metrics.profitPercent
                : prev.profitForTarget ?? 0,
            overallDrawdown:
              Number.isFinite(finalOverallDrawdown) && finalOverallDrawdown >= 0
                ? finalOverallDrawdown
                : prev.overallDrawdown ?? 0,
            dailyDrawdown:
              Number.isFinite(finalDailyDrawdown) && finalDailyDrawdown >= 0
                ? finalDailyDrawdown
                : prev.dailyDrawdown ?? 0,
            maxDailyDrawdown: maxDailyDD, // Use from challenge rules
            maxOverallDrawdown: maxOverallDD, // Use from challenge rules
            phase: acc.phase?.toLowerCase() || prev.phase,
            tradingDays: metrics.tradingDaysCompleted ?? prev.tradingDays, // Backend uses tradingDaysCompleted
            minTradingDays:
              challengeRules.minTradingDays ?? prev.minTradingDays,
            daysRemaining:
              metrics.daysRemaining !== null &&
                metrics.daysRemaining !== undefined &&
                Number.isFinite(metrics.daysRemaining)
                ? metrics.daysRemaining
                : prev.daysRemaining,
            margin:
              acc.marginUsed !== null &&
                acc.marginUsed !== undefined &&
                Number.isFinite(acc.marginUsed)
                ? acc.marginUsed
                : prev.margin,
            freeMargin:
              acc.freeMargin !== null &&
                acc.freeMargin !== undefined &&
                Number.isFinite(acc.freeMargin)
                ? acc.freeMargin
                : prev.freeMargin,
            startingBalance: initialBalance,
            todayStartEquity: todayStartEquity, // Store for consistent drawdown calculations
            maxEquityToDate: maxEquityToDate, // Store for consistent drawdown calculations
            status: backendStatus, // CRITICAL: Always update status from backend
          };
        });

        devLog("✅ Account data synced from backend:", {
          balance: acc.balance,
          equity: acc.equity,
          initialBalance: initialBalance,
          profitPercent: metrics.profitPercent,
          overallDrawdown: overallDrawdown,
          dailyDrawdown: dailyDrawdown,
          phase: acc.phase,
          status: backendStatus,
        });

        // Return the resolved status so caller can act on it
        return backendStatus;
      } catch (error) {
        console.error("❌ Failed to sync account data from backend:", error);
        // Don't show error toast - this is a background sync
        return account.status || null;
      } finally {
        // Mark as not syncing
        isSyncingRef.current[accountId] = false;

        // Only clear loading state if it was set
        if (showLoading) {
          setIsAccountLoading(false);
        }
      }
    },
    [selectedAccount?.isDemo, queryClient, account.status, lastLocalUpdateRef],
  ); // Added lastLocalUpdateRef to dependencies

  // Execute trade handler (same flow as pages/TradingTerminal.jsx)
  const handleExecuteTrade = useCallback(
    async (trade) => {
      if (!trade || !trade.symbol || !trade.type || !trade.lotSize) {
        toast({ title: t("terminal.invalidTrade"), description: t("terminal.missingFields"), variant: "destructive" });
        return;
      }
      if (trade.lotSize <= 0 || isNaN(trade.lotSize)) {
        toast({ title: t("terminal.invalidTrade"), description: t("terminal.invalidLotSize"), variant: "destructive" });
        return;
      }
      if (isExecutingTrade) {
        toast({ title: t("terminal.tradeBlocked"), description: t("terminal.tradeInProgress"), variant: "destructive" });
        return;
      }
      const statusUpper = String(account.status || "").toUpperCase();
      if (statusUpper.includes("DAILY") || statusUpper.includes("FAIL") || statusUpper.includes("DISQUAL") || account.status === "PAUSED" || account.status === "CLOSED") {
        toast({ title: t("terminal.tradeBlocked"), description: t("terminal.challengeDisqualified"), variant: "destructive" });
        return;
      }
      if (!selectedAccountId) {
        toast({ title: t("terminal.noAccount"), description: t("terminal.selectAccountMessage"), variant: "destructive" });
        return;
      }
      setIsExecutingTrade(true);
      const recentTrade = positions.find(
        (p) => p.symbol === trade.symbol && p.type === trade.type && Math.abs(new Date(p.openTime).getTime() - Date.now()) < 1000,
      );
      if (recentTrade && trade.orderType !== "limit") {
        toast({
          title: t("terminal.tradeBlocked"),
          description: recentTrade.id?.startsWith("temp_") ? t("terminal.tradeInProgress") : t("terminal.duplicateTradeMessage"),
          variant: "destructive",
        });
        setIsExecutingTrade(false);
        return;
      }
      const entryPrice =
        trade.entryPrice ||
        (trade.type === "buy" ? enrichedSelectedSymbol?.ask : enrichedSelectedSymbol?.bid) ||
        (trade.type === "buy" ? unifiedPrices[trade.symbol]?.ask : unifiedPrices[trade.symbol]?.bid) ||
        (trade.type === "buy" ? 1.08557 : 1.08542);

      if (trade.orderType === "limit" && trade.limitPrice) {
        if (selectedAccount?.isDemo) {
          const demoOrder = {
            id: `demo_order_${Date.now()}`,
            symbol: trade.symbol,
            type: trade.type.toLowerCase(),
            lotSize: trade.lotSize,
            limitPrice: trade.limitPrice,
            stopLoss: trade.stopLoss ?? null,
            takeProfit: trade.takeProfit ?? null,
            createdTime: new Date().toISOString(),
            status: "pending",
            isDemo: true,
          };
          setPendingOrders((prev) => {
            const newOrders = [...prev, demoOrder];
            saveDemoAccountTrades(positions, demoClosedTrades, newOrders, account.balance, account.equity);
            return newOrders;
          });
          toast({ title: t("terminal.orderPlaced"), description: t("terminal.pendingOrderDescription", { type: trade.type.toUpperCase(), symbol: trade.symbol }) });
        } else {
          try {
            const response = await createPendingOrder({
              tradingAccountId: selectedAccountId,
              symbol: trade.symbol,
              type: trade.type.toUpperCase(),
              orderType: "LIMIT",
              volume: trade.lotSize,
              price: trade.limitPrice,
              stopLoss: trade.stopLoss ?? null,
              takeProfit: trade.takeProfit ?? null,
            });
            if (response?.id) {
              setPendingOrders((prev) => [...prev, {
                id: response.id,
                symbol: response.symbol,
                type: response.type?.toLowerCase(),
                lotSize: response.volume,
                limitPrice: response.price,
                stopLoss: response.stopLoss ?? null,
                takeProfit: response.takeProfit ?? null,
                createdTime: new Date(response.createdAt).toISOString(),
                status: response.status?.toLowerCase(),
              }]);
              queryClient.invalidateQueries({ queryKey: ["pending-orders", selectedAccountId] });
              toast({ title: t("terminal.orderPlaced"), description: t("terminal.pendingOrderDescription", { type: trade.type.toUpperCase(), symbol: trade.symbol }) });
            } else throw new Error("Backend did not return order ID");
          } catch (error) {
            toast({
              title: t("terminal.orderFailed"),
              description: error.response?.data?.message || error.message || "Failed to create pending order",
              variant: "destructive",
            });
          }
        }
        setIsExecutingTrade(false);
        return;
      }

      if (!selectedAccountId || selectedAccountId !== selectedAccount?.id) {
        toast({ title: t("terminal.tradeFailed"), description: "Account changed during trade execution", variant: "destructive" });
        setIsExecutingTrade(false);
        return;
      }
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      const optimisticPosition = {
        id: tempId,
        symbol: trade.symbol,
        type: trade.type,
        lotSize: trade.lotSize,
        entryPrice,
        stopLoss: trade.stopLoss ?? null,
        takeProfit: trade.takeProfit ?? null,
        openTime: new Date().toISOString(),
      };
      setPositions((prev) => {
        const newPositions = [...prev, optimisticPosition];
        if (selectedAccount?.isDemo) {
          saveDemoAccountTrades(newPositions, demoClosedTrades, pendingOrders, account.balance, account.equity);
        }
        return newPositions;
      });
      if (selectedAccount?.isDemo) {
        toast({ title: t("terminal.tradeExecuted"), description: `${trade.type.toUpperCase()} ${trade.lotSize} ${trade.symbol} @ ${entryPrice}` });
        setIsExecutingTrade(false);
        return;
      }
      try {
        const tradeData = {
          accountId: selectedAccountId,
          symbol: trade.symbol,
          type: trade.type.toUpperCase(),
          volume: trade.lotSize,
          openPrice: entryPrice,
          closePrice: null,
          profit: 0,
          stopLoss: trade.stopLoss ?? null,
          takeProfit: trade.takeProfit ?? null,
        };
        const response = await createTrade(tradeData);
        if (!response?.trade?.id) throw new Error("Backend did not return trade ID");
        const realPosition = {
          id: response.trade.id,
          symbol: trade.symbol,
          type: trade.type,
          lotSize: trade.lotSize,
          entryPrice,
          stopLoss: response.trade.stopLoss ?? trade.stopLoss ?? null,
          takeProfit: response.trade.takeProfit ?? trade.takeProfit ?? null,
          openTime: response.trade.openedAt || new Date().toISOString(),
        };
        setPositions((prev) => {
          const filtered = prev.filter((p) => p.id !== tempId);
          if (filtered.some((p) => p.id === response.trade.id)) return filtered;
          return [...filtered, realPosition];
        });
        queryClient.invalidateQueries({ queryKey: ["trades", selectedAccountId] });
        if (user?.userId) queryClient.invalidateQueries({ queryKey: ["trading-accounts", user.userId] });
        await syncAccountFromBackend(selectedAccountId, false, false);
        toast({ title: t("terminal.tradeExecuted"), description: `${trade.type.toUpperCase()} ${trade.lotSize} ${trade.symbol} @ ${entryPrice}` });
      } catch (error) {
        setPositions((prev) => prev.filter((p) => p.id !== tempId));
        const data = error.response?.data;
        let errorMessage = t("terminal.saveError");
        if (error.response) {
          const status = error.response.status;
          const message = data?.message || "";
          if (status === 404) errorMessage = t("terminal.accountNotFound");
          else if (status === 400) {
            if (message.includes("Daily loss limit") || message.includes("locked")) errorMessage = t("terminal.dailyLossLimitReached");
            else if (message.includes("disqualified") || message.includes("no longer allowed")) errorMessage = t("terminal.challengeDisqualified");
            else errorMessage = message || t("terminal.invalidTradeData");
            if (message.includes("Daily loss limit") || message.includes("disqualified")) syncAccountFromBackend(selectedAccountId, true, false).catch(() => {});
          } else if (status === 403) errorMessage = t("terminal.tradeNotAllowed");
          else if (status === 500) errorMessage = t("terminal.serverError");
          else errorMessage = data?.message || error.message || errorMessage;
        } else if (error.request) {
          errorMessage = !navigator.onLine ? t("terminal.networkOffline") : t("terminal.networkError");
        } else errorMessage = error.message || errorMessage;
        toast({ title: t("terminal.tradeFailed"), description: errorMessage, variant: "destructive" });
      } finally {
        setIsExecutingTrade(false);
      }
    },
    [
      account,
      demoClosedTrades,
      enrichedSelectedSymbol,
      isExecutingTrade,
      pendingOrders,
      positions,
      selectedAccount,
      selectedAccountId,
      syncAccountFromBackend,
      t,
      toast,
      unifiedPrices,
      user?.userId,
      queryClient,
    ],
  );

  // Must be defined AFTER backendTrades query is declared
  const tradeHistory = React.useMemo(() => {
    // If demo account, return demo closed trades
    if (selectedAccount?.isDemo) {
      return demoClosedTrades;
    }





    const backendClosedTrades = (backendTrades || [])
      .filter(
        (trade) => trade.closePrice !== null && trade.closePrice !== undefined,
      )
      .map((trade) => {
        // ... (existing mapping logic) ...
        return {
          id: trade.id,
          symbol: trade.symbol,
          type: trade.type.toLowerCase(),
          lotSize: trade.volume,
          entryPrice: trade.openPrice,
          stopLoss: trade.stopLoss ?? null,
          takeProfit: trade.takeProfit ?? null,
          openTime: new Date(trade.openedAt).toISOString(),
          closePrice: trade.closePrice,
          closeTime: trade.closedAt
            ? new Date(trade.closedAt).toISOString()
            : new Date().toISOString(),
          pnl: trade.profit || 0,
          breachTriggered:
            trade.breachTriggered === true ||
            trade.breachTriggered === 1 ||
            String(trade.breachTriggered) === "true",
          breachType: trade.breachType || null,
          breachUnrealizedPnl:
            trade.breachUnrealizedPnl !== null &&
              trade.breachUnrealizedPnl !== undefined
              ? trade.breachUnrealizedPnl
              : null,
          breachDrawdownPercentDaily: trade.breachDrawdownPercentDaily ?? null,
          breachDrawdownPercentOverall:
            trade.breachDrawdownPercentOverall ?? null,
          closeReason: trade.closeReason || null,
        };
      });

    // Merge optimistic trades with backend trades, removing duplicates
    const backendTradeIds = new Set(backendClosedTrades.map((t) => t.id));
    const uniqueOptimisticTrades = optimisticClosedTrades.filter(
      (t) => !backendTradeIds.has(t.id),
    );

    return [...uniqueOptimisticTrades, ...backendClosedTrades];
  }, [
    backendTrades,
    selectedAccountId,
    selectedAccount?.isDemo,
    demoClosedTrades,
    optimisticClosedTrades,
  ]);

  const closePositionWithBackendUpdate = useCallback(
    async (position, showToast = true) => {
      const currentPrice = getPriceForPosition(
        position.symbol,
        position.type,
        position.entryPrice,
      );
      const pnl = calculatePositionPnL(position, currentPrice);
      if (process.env.NODE_ENV !== "production") {
        console.log(
          `[Close Position Debug] ${position.symbol} ${position.type.toUpperCase()}`,
        );
        console.log(`  Entry Price: ${position.entryPrice}`);
        console.log(
          `  Close Price (${position.type === "buy" ? "BID" : "ASK"}): ${currentPrice}`,
        );
        console.log(`  Lot Size: ${position.lotSize}`);
        console.log(`  Realized P/L: $${pnl.toFixed(2)}`);
        console.log(`  Balance Before: $${account.balance.toFixed(2)}`);
        console.log(`  Balance After: $${(account.balance + pnl).toFixed(2)}`);
      }
      const hasBackendId =
        position.id &&
        !position.id.startsWith("temp_") &&
        !position.id.startsWith("pos_") &&
        !position.id.startsWith("order_");
      const closedTrade = {
        ...position,
        closePrice: currentPrice,
        closeTime: new Date().toISOString(),
        pnl: pnl,
        stopLoss: position.stopLoss ?? null,
        takeProfit: position.takeProfit ?? null,
      };
      setPositions((prev) => {
        devLog("⚡ Optimistically removing position:", position.id);
        const newPositions = prev.filter((p) => p.id !== position.id);
        if (selectedAccount?.isDemo) {
          const newClosedTrades = [...demoClosedTrades, closedTrade];
          setDemoClosedTrades(newClosedTrades);
          saveDemoAccountTrades(
            newPositions,
            newClosedTrades,
            demoPendingOrders,
            optimisticNewBalance,
            optimisticNewBalance,
          );
        }
        return newPositions;
      });
      const optimisticNewBalance = account.balance + pnl;
      lastLocalUpdateRef.current = Date.now();
      lastLocalBalanceRef.current = optimisticNewBalance;
      setOptimisticClosedTrades((prev) => {
        if (prev.some((t) => t.id === position.id)) return prev;
        return [closedTrade, ...prev];
      });
      setAccount((prev) => ({
        ...prev,
        balance: optimisticNewBalance,
        equity: optimisticNewBalance,
        floatingPnL: 0,
      }));
      devLog(
        "⚡ Optimistically updated balance:",
        account.balance,
        "->",
        optimisticNewBalance,
      );
      if (selectedAccount?.isDemo) {
        if (showToast) {
          toast({
            title: t("terminal.positionClosed"),
            description: `${position.type.toUpperCase()} ${position.lotSize} ${position.symbol} - P/L: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`,
          });
        }
        return;
      }
      if (hasBackendId) {
        try {
          devLog("🔄 Closing position in backend (background):", {
            positionId: position.id,
            symbol: position.symbol,
            closePrice: currentPrice,
            profit: pnl,
            accountId: selectedAccountId,
          });
          const response = await updateTrade(position.id, {
            closePrice: currentPrice,
            profit: pnl,
            stopLoss: position.stopLoss ?? null,
            takeProfit: position.takeProfit ?? null,
          });
          devLog("✅ Trade closed in backend:", response);
          await queryClient.refetchQueries({
            queryKey: ["trades", selectedAccountId],
            type: "active",
            exact: true,
          });
          const currentTradesData =
            queryClient.getQueryData(["trades", selectedAccountId]) || [];
          const marker = {
            tradeCount: Array.isArray(currentTradesData)
              ? currentTradesData.length
              : 0,
            closedCount: Array.isArray(currentTradesData)
              ? currentTradesData.filter((t) => t.closedAt || t.closePrice)
                .length
              : 0,
            latestTradeTimestamp: Date.now(),
          };
          refetchTradesUntilSettled(selectedAccountId, marker).catch((err) => {
            devWarn("Settlement polling error:", err);
          });
          const userId = lastValidUserIdRef.current || user?.userId;
          if (userId) {
            queryClient.refetchQueries({
              queryKey: ["trading-accounts", userId],
              type: "active",
              exact: true,
            });
          }
          syncAccountFromBackend(selectedAccountId, false, false).catch(
            (err) => {
              devWarn("Failed to sync account after closing position:", err);
            },
          );
        } catch (error) {
          const status = error.status || error.response?.status;
          const isTempPosition =
            position.id &&
            (position.id.startsWith("temp_") || position.id.includes("temp"));
          const errorMessage =
            error.message || error.response?.data?.message || "";
          const isAlreadyClosed =
            errorMessage.toLowerCase().includes("already closed") ||
            errorMessage.toLowerCase().includes("trade is already closed");
          if (isAlreadyClosed || status === 409) {
            console.log(
              "ℹ️ Position already closed (likely auto-closed by backend) - treating as success",
            );
            await queryClient.refetchQueries({
              queryKey: ["trades", selectedAccountId],
            });
            if (showToast) {
              toast({
                title: t("terminal.positionClosed"),
                description: `${position.type.toUpperCase()} ${position.lotSize} ${position.symbol} - Position was already closed`,
              });
            }
            return;
          }
          if (status === 404 && isTempPosition) {
            console.warn(
              "⚠️ Attempted to close temp position via backend - removing locally instead",
            );
            setPositions((prev) => prev.filter((p) => p.id !== position.id));
            if (showToast) {
              toast({
                title: t("terminal.positionClosed"),
                description: `${position.type.toUpperCase()} ${position.lotSize} ${position.symbol} - P/L: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}`,
              });
            }
            return;
          }
          console.error("❌ Failed to close position in backend:", error);
          console.error("Error details:", {
            message: error.message,
            status: error.status,
            data: error.data,
            response: error.response,
            request: error.request,
          });
          console.log("🔄 Rolling back optimistic close - restoring position");
          setPositions((prev) => {
            const exists = prev.some((p) => p.id === position.id);
            if (exists) return prev;
            return [...prev, position];
          });
          let errorMsg = t("terminal.updateError");
          const errorData = error.data || error.response?.data;
          if (status) {
            if (status === 404) errorMsg = t("terminal.tradeNotFound");
            else if (status === 400)
              errorMsg =
                errorData?.message ||
                error.message ||
                t("terminal.invalidCloseData");
            else if (status === 409) errorMsg = t("terminal.tradeAlreadyClosed");
            else if (status === 500) errorMsg = t("terminal.serverError");
            else errorMsg = errorData?.message || error.message || errorMsg;
          } else if (error.request || (!error.response && !error.status)) {
            errorMsg = !navigator.onLine
              ? t("terminal.networkOffline")
              : t("terminal.networkError");
          } else {
            errorMsg = error.message || errorMsg;
          }
          if (showToast) {
            toast({
              title: t("terminal.closeFailed"),
              description: errorMsg,
              variant: "destructive",
            });
          }
        }
      }
    },
    [
      unifiedPrices,
      calculatePositionPnL,
      queryClient,
      selectedAccountId,
      user?.userId,
      toast,
      t,
      syncAccountFromBackend,
      lastValidUserIdRef,
      getPriceForPosition,
    ],
  );
  const handleModifyPosition = useCallback((position) => {
    setModifyingPosition(position);
  }, []);

  const handleClosePosition = useCallback(
    async (position) => {
      await closePositionWithBackendUpdate(position, true);
    },
    [closePositionWithBackendUpdate],
  );
=======
  const selectedChallenge = selectedChallengeProp || selectedChallengeFromContext;

  const [selectedTab, setSelectedTab] = useState('positions');
  const [liveMetrics, setLiveMetrics] = useState({ equity: null, profitPercent: null, dailyDrawdownPercent: null, overallDrawdownPercent: null });
  const [closeConfirmTrade, setCloseConfirmTrade] = useState(null);
  const priceTickThrottleRef = useRef({});
  const activeEquityBaselineRef = useRef(null);
  const profitBarPeakRef = useRef(0);
  const overallDrawdownBarPeakRef = useRef(0);
  const dailyDrawdownBarPeakRef = useRef({ date: null, value: 0 });

  const accountId = selectedChallenge?.id;
  const normalizedStatus = String(selectedChallenge?.status || '').toLowerCase();
  const isChallengeLocked =
    normalizedStatus === 'failed' ||
    normalizedStatus === 'inactive' ||
    normalizedStatus === 'daily_locked' ||
    normalizedStatus === 'disqualified' ||
    normalizedStatus === 'closed' ||
    normalizedStatus === 'paused';

  // Reset live metrics when account changes
  useEffect(() => {
    setLiveMetrics({ equity: null, profitPercent: null, dailyDrawdownPercent: null, overallDrawdownPercent: null });
    priceTickThrottleRef.current = {};
    profitBarPeakRef.current = 0;
    overallDrawdownBarPeakRef.current = 0;
    dailyDrawdownBarPeakRef.current = { date: null, value: 0 };
  }, [accountId]);

  /* ── Price lookup helper ── */
  const getPriceForSymbol = useCallback((symbol) => {
    if (!symbol || !prices) return null;
    const raw = String(symbol).trim();
    const upper = raw.toUpperCase();
    const compact = upper.replace(/[^A-Z]/g, '');
    const compactUsd = compact.replace(/USDT$/, 'USD');
    const candidates = [
      raw,
      upper,
      compact,
      compactUsd,
      compact.length === 6 ? `${compact.slice(0, 3)}/${compact.slice(3)}` : null,
      compactUsd.length === 6 ? `${compactUsd.slice(0, 3)}/${compactUsd.slice(3)}` : null,
      compact.endsWith('USDT') ? `${compact.slice(0, -4)}/USDT` : null,
      compact.endsWith('USDT') ? `${compact.slice(0, -4)}/USD` : null,
    ].filter(Boolean);
    for (const key of candidates) {
      const pd = prices[key];
      if (pd && pd.bid !== undefined && pd.ask !== undefined) return pd;
    }
    return null;
  }, [prices]);

  /* ── PnL calculation helper ── */
  const calculateTradePnL = useCallback((trade, currentPrice) => {
    if (!currentPrice || !trade.openPrice) return 0;
    const priceDiff = (trade.type === 'BUY')
      ? (currentPrice - trade.openPrice)
      : (trade.openPrice - currentPrice);
    if (isCryptoSymbol(trade.symbol)) return priceDiff * (trade.volume || 0);
    return priceDiff * (trade.volume || 0) * 100000;
  }, []);

  /* ── Get exit price for a position ── */
  const getClosePrice = useCallback((trade) => {
    const pd = getPriceForSymbol(trade.symbol);
    if (!pd) return trade.openPrice;
    return trade.type === 'BUY' ? pd.bid : pd.ask;
  }, [getPriceForSymbol]);

  /* ── Data Queries (React Query auto-deduplicates with same keys used in terminal) ── */
  const { data: tradesData, isLoading: tradesLoading } = useQuery({
    queryKey: ['trades', accountId],
    queryFn: () => getAccountTrades(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });
  const { data: pendingOrdersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['pendingOrders', accountId],
    queryFn: () => getPendingOrders(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });
  const { data: accountSummaryData } = useQuery({
    queryKey: ['accountSummary', accountId],
    queryFn: () => getAccountSummary(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });

  /* ── Derived data ── */
  const openPositions = useMemo(() => {
    const t = Array.isArray(tradesData) ? tradesData : [];
    return t.filter(x => !x.closedAt);
  }, [tradesData]);
  const closedTrades = useMemo(() => {
    const t = Array.isArray(tradesData) ? tradesData : [];
    return t.filter(x => x.closedAt);
  }, [tradesData]);
  const activePendingOrders = useMemo(() => {
    const o = Array.isArray(pendingOrdersData) ? pendingOrdersData : [];
    return o.filter(x => x.status === 'PENDING');
  }, [pendingOrdersData]);

  /* ── Live PnL per position ── */
  const positionsWithPnL = useMemo(() => {
    return openPositions.map((trade) => {
      const pd = getPriceForSymbol(trade.symbol);
      if (!pd) return { ...trade, livePnL: trade.profit || 0, currentPrice: null };
      const exitPrice = trade.type === 'BUY' ? pd.bid : pd.ask;
      const livePnL = calculateTradePnL(trade, exitPrice);
      return { ...trade, livePnL, currentPrice: exitPrice };
    });
  }, [openPositions, getPriceForSymbol, calculateTradePnL]);

  const totalFloatingPnL = useMemo(() => {
    return positionsWithPnL.reduce((sum, pos) => sum + pos.livePnL, 0);
  }, [positionsWithPnL]);

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
        : (Number.isFinite(summaryBalance) ? summaryBalance : (selectedChallenge?.currentBalance || 0));
    }
  }, [hasOpenPositions, accountSummaryData, selectedChallenge]);

  useEffect(() => {
    const metrics = accountSummaryData?.metrics;
    if (!metrics) return;
    setLiveMetrics((prev) => ({
      ...prev,
      ...(Number.isFinite(metrics?.equity) && { equity: metrics.equity }),
      ...(Number.isFinite(metrics?.profitPercent) && { profitPercent: metrics.profitPercent }),
      ...(Number.isFinite(metrics?.dailyDrawdownPercent) && { dailyDrawdownPercent: metrics.dailyDrawdownPercent }),
      ...(Number.isFinite(metrics?.overallDrawdownPercent) && { overallDrawdownPercent: metrics.overallDrawdownPercent }),
    }));
  }, [accountSummaryData]);

  /* ── Forward price ticks to backend for violation checking ── */
  useEffect(() => {
    if (openPositions.length === 0 || !accountId) return;
    const isLocked = isChallengeLocked;
    if (isLocked) return;

    const positionSymbols = [...new Set(openPositions.map(t => t.symbol))];
    if (positionSymbols.length === 0) return;

    positionSymbols.forEach((symbol) => {
      const pd = getPriceForSymbol(symbol);
      if (!pd || pd.bid === undefined || pd.ask === undefined) return;

      const throttleKey = `${accountId}-${symbol}`;
      const lastTickTime = priceTickThrottleRef.current[throttleKey] || 0;
      const now = Date.now();
      if (now - lastTickTime < 100) return;
      priceTickThrottleRef.current[throttleKey] = now;

      processPriceTick(accountId, symbol, pd.bid, pd.ask, pd.timestamp || now)
        .then((response) => {
          if (response && (response.equity !== undefined || response.profitPercent !== undefined ||
              response.dailyDrawdownPercent !== undefined || response.overallDrawdownPercent !== undefined)) {
            setLiveMetrics(prev => ({
              ...prev,
              ...(response.equity !== undefined && Number.isFinite(response.equity) && { equity: response.equity }),
              ...(response.profitPercent !== undefined && Number.isFinite(response.profitPercent) && { profitPercent: response.profitPercent }),
              ...(response.dailyDrawdownPercent !== undefined && Number.isFinite(response.dailyDrawdownPercent) && { dailyDrawdownPercent: response.dailyDrawdownPercent }),
              ...(response.overallDrawdownPercent !== undefined && Number.isFinite(response.overallDrawdownPercent) && { overallDrawdownPercent: response.overallDrawdownPercent }),
            }));
          }
          if (response?.statusChanged) {
            queryClient.invalidateQueries({ queryKey: ['trades', accountId] });
            toast({ title: 'Account Status Changed', description: `Limit breached. ${response.positionsClosed || 0} positions auto-closed.`, variant: 'destructive' });
          }
        })
        .catch(() => {});
    });
  }, [openPositions, accountId, isChallengeLocked, prices, getPriceForSymbol, queryClient, toast]);

  /* ── Mutations ── */
  const closePositionMutation = useMutation({
    mutationFn: ({ tradeId, closePrice }) => updateTrade(tradeId, { closePrice, closedAt: new Date().toISOString(), closeReason: 'USER_CLOSE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', accountId] });
      queryClient.invalidateQueries({ queryKey: ['accountSummary', accountId] });
      toast({ title: 'Position Closed' });
    },
    onError: (e) => { toast({ title: 'Close Failed', description: e?.response?.data?.message || e.message, variant: 'destructive' }); },
  });
  const cancelOrderMutation = useMutation({
    mutationFn: cancelPendingOrder,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pendingOrders', accountId] }); toast({ title: 'Order Cancelled' }); },
    onError: (e) => { toast({ title: 'Cancel Failed', description: e?.response?.data?.message || e.message, variant: 'destructive' }); },
  });
>>>>>>> 6aab4f3f735ae0ac13bf53e0ab7900d97f907fbb

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>Loading challenges...</p>
        </div>
      </div>
    );
  }

  if (!selectedChallenge) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
            <TrendingUp className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
          </div>
          <p className={`font-medium ${isDark ? 'text-white' : 'text-slate-900'} mb-2`}>
            No Active Challenges
          </p>
          <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
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

  const cardClass = `rounded-2xl border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'}`;
  const textClass = isDark ? 'text-white' : 'text-slate-900';
  const mutedClass = isDark ? 'text-gray-400' : 'text-slate-500';
<<<<<<< HEAD
=======
  const borderColor = isDark ? 'border-white/10' : 'border-slate-200';
  const bgMuted = isDark ? 'bg-[#0a0d12]' : 'bg-slate-50';
  const green = '#0ecb81';
  const red = '#f6465d';
>>>>>>> 6aab4f3f735ae0ac13bf53e0ab7900d97f907fbb

  const phaseLabel = getChallengePhaseLabel(selectedChallenge);
  const rules = selectedChallenge?.rules || {};
  const summaryAccount = accountSummaryData?.account;
  const summaryMetrics = accountSummaryData?.metrics;
  const balance = Number.isFinite(summaryAccount?.balance) ? summaryAccount.balance : (selectedChallenge.currentBalance || 0);
  const baselineEquity = Number.isFinite(activeEquityBaselineRef.current) ? activeEquityBaselineRef.current : balance;
  const activeEquity = balance + totalFloatingPnL;
  const equity = hasOpenPositions
    ? activeEquity
    : (Number.isFinite(summaryAccount?.equity) ? summaryAccount.equity : (selectedChallenge.equity || balance));
  const floatingPL = totalFloatingPnL;
  const activeProfitPercent = hasOpenPositions && baselineEquity > 0
    ? ((activeEquity - baselineEquity) / baselineEquity) * 100
    : 0;
  const activeDrawdownPercent = hasOpenPositions && baselineEquity > 0
    ? Math.max(0, ((baselineEquity - activeEquity) / baselineEquity) * 100)
    : 0;
  const profitPercent = Math.max(0, activeProfitPercent);

  const isAccountLocked = isChallengeLocked;
  const isDataLoading = tradesLoading || ordersLoading;

  // Compliance: override with live backend metrics when available
  const baseCompliance = getRuleCompliance(selectedChallenge);
  const compliance = (() => {
    if (!baseCompliance) return baseCompliance;
    const result = { ...baseCompliance };
    const target = rules.profitTarget || 8;
    const dailyLimit = rules.maxDailyLoss || 5;
    const overallLimit = rules.maxTotalDrawdown || 10;

    const currentDate = new Date().toISOString().substring(0, 10);
    if (dailyDrawdownBarPeakRef.current.date !== currentDate) {
      dailyDrawdownBarPeakRef.current = {
        date: currentDate,
        value: Math.max(0, Number(summaryMetrics?.dailyDrawdownPercent) || 0),
      };
    }

    const profitSeed = Math.max(0, Number(summaryMetrics?.profitPercent) || 0);
    const overallSeed = Math.max(0, Number(summaryMetrics?.overallDrawdownPercent) || 0);
    const dailySeed = Math.max(0, Number(summaryMetrics?.dailyDrawdownPercent) || 0);

    const profitCurrentRaw = Math.max(0, activeProfitPercent);
    const dailyCurrentRaw = Math.max(0, activeDrawdownPercent);
    const overallCurrentRaw = Math.max(0, activeDrawdownPercent);

    profitBarPeakRef.current = Math.max(profitBarPeakRef.current, profitSeed, profitCurrentRaw);
    overallDrawdownBarPeakRef.current = Math.max(overallDrawdownBarPeakRef.current, overallSeed, overallCurrentRaw);
    dailyDrawdownBarPeakRef.current.value = Math.max(dailyDrawdownBarPeakRef.current.value, dailySeed, dailyCurrentRaw);

    const profitCurrent = profitBarPeakRef.current;
    result.profitTarget = {
      ...result.profitTarget,
      current: profitCurrent,
      percentage: target > 0 ? Math.min((profitCurrent / target) * 100, 100) : 0,
      status: profitCurrent >= target ? 'passed' : 'in-progress',
    };

    const dailyCurrent = dailyDrawdownBarPeakRef.current.value;
    const overallCurrent = overallDrawdownBarPeakRef.current;
    result.dailyLoss = {
      ...result.dailyLoss,
      current: dailyCurrent,
      percentage: dailyLimit > 0 ? (dailyCurrent / dailyLimit) * 100 : 0,
      status: dailyCurrent >= dailyLimit ? 'violated' : dailyCurrent >= dailyLimit * 0.8 ? 'warning' : 'safe',
    };
    result.totalDrawdown = {
      ...result.totalDrawdown,
      current: overallCurrent,
      percentage: overallLimit > 0 ? (overallCurrent / overallLimit) * 100 : 0,
      status: overallCurrent >= overallLimit ? 'violated' : overallCurrent >= overallLimit * 0.8 ? 'warning' : 'safe',
    };
    return result;
  })();

  const tabs = [
    { id: 'positions', label: 'Positions', count: openPositions.length },
    { id: 'pending', label: 'Pending', count: activePendingOrders.length },
    { id: 'history', label: 'History', count: closedTrades.length },
  ];

  const thStyle = { padding: '8px 12px', fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap' };
  const tdStyle = { padding: '6px 12px', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' };

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
<<<<<<< HEAD
      {/* ==================== CHALLENGE SELECTOR ==================== */}
      {challenges.length > 1 && (
        <div className={cardClass + ' p-4'}>
          <div className="flex items-center gap-3">
            <label className={`text-sm font-medium ${textClass}`}>Active Challenge:</label>
            <div className="relative flex-1 max-w-md">
              <select
                value={selectedChallenge.id}
                onChange={(e) => selectChallenge(e.target.value)}
                className={`appearance-none w-full px-4 py-2 pr-10 rounded-xl border font-medium text-sm cursor-pointer transition-all ${isDark
                  ? 'bg-[#1a1f2e] border-white/10 text-white hover:border-white/20'
                  : 'bg-white border-slate-200 text-slate-900 hover:border-slate-300'
                  }`}
                style={{ colorScheme: isDark ? 'dark' : 'light' }}
              >
                {challenges.map((challenge) => {
                  const label = getChallengePhaseLabel(challenge);
                  const type = challenge.type === '1-step' ? '1S' : '2S';
                  return (
                    <option key={challenge.id} value={challenge.id}>
                      {type} ${challenge.accountSize.toLocaleString()} - {label}
                    </option>
                  );
                })}
              </select>
              <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${mutedClass}`} />
            </div>
          </div>
        </div>
      )}

=======
>>>>>>> 6aab4f3f735ae0ac13bf53e0ab7900d97f907fbb
      {/* ==================== CHALLENGE ACTIVE BANNER ==================== */}
      <ChallengeActiveBanner challenge={selectedChallenge} phaseLabel={phaseLabel} />

      {/* ==================== PHASE PROGRESSION ==================== */}
      <PhaseProgressionCards challenge={(() => {
        const effectiveProfit = Math.max(
          0,
          profitBarPeakRef.current,
          Number(summaryMetrics?.profitPercent) || 0,
        );
        const tradingDaysCompleted = summaryMetrics?.tradingDaysCompleted;
        if (!Number.isFinite(effectiveProfit) && !Number.isFinite(tradingDaysCompleted)) return selectedChallenge;
        return {
          ...selectedChallenge,
          stats: {
            ...selectedChallenge.stats,
            ...(Number.isFinite(effectiveProfit) && { currentProfit: Math.max(0, effectiveProfit) }),
          },
          tradingDays: {
            ...selectedChallenge.tradingDays,
            ...(Number.isFinite(tradingDaysCompleted) && { current: tradingDaysCompleted }),
            required: selectedChallenge?.tradingDays?.required || rules.minTradingDays || 5,
          },
        };
      })()} />

      {/* ==================== BALANCE STATS ROW ==================== */}
      <BalanceStatsRow
        balance={balance}
        equity={equity}
        floatingPL={floatingPL}
        profitPercent={profitPercent}
      />

      {/* ==================== COMPLIANCE METRICS ==================== */}
      <ComplianceMetrics compliance={compliance} challenge={selectedChallenge} />

      {/* ==================== PLATFORM-SPECIFIC TRADING AREA ==================== */}
      <div className="my-6">
        {React.Children.map(children, (child) =>
          React.isValidElement(child)
            ? React.cloneElement(child, {
                positions,
                onExecuteTrade: handleExecuteTrade,
                showBuySellPanel,
                setShowBuySellPanel,
                accountBalance: selectedChallenge?.currentBalance ?? account?.balance ?? 0,
                selectedAccountId,
                account,
                selectedSymbol: enrichedSelectedSymbol,
                setSelectedSymbol,
              })
            : child
        )}
      </div>

      {/* ==================== POSITIONS / PENDING / HISTORY ==================== */}
<<<<<<< HEAD
      <div className={`p-8 ${isDark ? 'bg-[#0a0d12]' : 'bg-white'}`}>
        {/* Bottom Section - Positions & Rules */}
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-12">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className=" ">
              <TabsList className={`border ${isDark ? 'bg-[#12161d] border-white/5' : 'bg-slate-100 border-slate-200'} p-1 gap-0`}>
                <TabsTrigger
                  value="positions"
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    isDark
                      ? "text-gray-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                      : "text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  )}
                >
                  {t("terminal.tabs.positions")} ({positions.length})
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    isDark
                      ? "text-gray-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                      : "text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  )}
                >
                  {t("terminal.tabs.pending")} ({pendingOrders.length})
                </TabsTrigger>
                <TabsTrigger
                  value="history"
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                    isDark
                      ? "text-gray-400 data-[state=active]:bg-white/10 data-[state=active]:text-white"
                      : "text-slate-500 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm"
                  )}
                >
                  {t("terminal.tabs.history")} ({tradeHistory.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="positions" className="mt-2">
                <OpenPositions
                  key={`positions-desktop-${pricesLastUpdate}-${positions.length}`}
                  positions={positions}
                  currentPrices={unifiedPrices}
                  onClosePosition={handleClosePosition}
                  onModifyPosition={handleModifyPosition}
                  accountStatus={account.status}
                />
              </TabsContent>
              <TabsContent value="pending" className="mt-2">
                <Card className={`${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'} p-4 max-h-64 overflow-auto`}>
                  {pendingOrders.length === 0 ? (
                    <p className={`${isDark ? 'text-gray-400' : 'text-slate-500'} py-8`}>
                      {t("terminal.noPendingOrders")}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pendingOrders.map((order) => (
                        <div
                          key={order.id}
                          className={`flex items-center justify-between p-3 ${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded-lg`}
                        >
                          <div className="flex items-center gap-3">
                            <Badge
                              className={
                                order.type === "buy"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : "bg-red-500/20 text-red-400"
                              }
                            >
                              {(order.type === "buy"
                                ? t("terminal.tradingPanel.buyLong")
                                : t("terminal.tradingPanel.sellShort")
                              ).toUpperCase()}{" "}
                              {t("terminal.tradingPanel.limit").toUpperCase()}
                            </Badge>
                            <span className={isDark ? 'text-white' : 'text-slate-900'}>{order.symbol}</span>
                            <span className={`${isDark ? 'text-gray-400' : 'text-slate-500'} text-sm`}>
                              {order.lotSize} {t("terminal.lots")}
                            </span>
                            <span className="text-amber-400 text-sm font-mono">
                              @ {order.limitPrice}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            onClick={async () => {
                              try {
                                if (order.isDemo || selectedAccount?.isDemo) {
                                  // Cancel locally for demo
                                  console.log(
                                    "✅ Pending order cancelled locally:",
                                    order.id,
                                  );
                                  const newOrders = demoPendingOrders.filter(
                                    (o) => o.id !== order.id,
                                  );
                                  setDemoPendingOrders(newOrders);
                                  saveDemoAccountTrades(
                                    positions,
                                    demoClosedTrades,
                                    newOrders,
                                    account.balance,
                                    account.equity,
                                  );

                                  toast({
                                    title: t("terminal.orderCancelled"),
                                    description: t(
                                      "terminal.orderCancelledSuccess",
                                    ),
                                  });
                                  return;
                                }

                                // Cancel via backend API (for real accounts)
                                await cancelPendingOrder(order.id);
                                console.log(
                                  "✅ Pending order cancelled in backend:",
                                  order.id,
                                );

                                // Remove from local state
                                setPendingOrders((prev) =>
                                  prev.filter((o) => o.id !== order.id),
                                );

                                // Invalidate query to refresh from backend
                                queryClient.invalidateQueries({
                                  queryKey: [
                                    "pending-orders",
                                    selectedAccountId,
                                  ],
                                });

                                toast({
                                  title: t("terminal.orderCancelled"),
                                  description: t(
                                    "terminal.orderCancelledSuccess",
                                  ),
                                });
                              } catch (error) {
                                console.error(
                                  "Failed to cancel pending order:",
                                  error,
                                );
                                toast({
                                  title: t("terminal.cancelFailed"),
                                  description:
                                    error.message || "Failed to cancel order",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            {t("terminal.cancel")}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
              <TabsContent value="history" className="mt-2">
                <Card className={`${isDark ? 'bg-[#12161d] border-white/5' : 'bg-white border-slate-200'} p-4`}>
                  {tradeHistory.length === 0 ? (
                    <p className={`${isDark ? 'text-gray-400' : 'text-slate-500'} py-8`}>
                      {t("terminal.noClosedTrades")}
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {/* Filters */}
                      <div className={`flex flex-wrap items-center gap-2 pb-3 border-b ${isDark ? 'border-white/5' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                          <Search className={`w-4 h-4 ${isDark ? 'text-gray-400' : 'text-slate-500'}`} />
                          <Input
                            placeholder={t("terminal.history.filterBySymbol")}
                            value={historySymbolFilter}
                            onChange={(e) =>
                              setHistorySymbolFilter(e.target.value)
                            }
                            className={`${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'} text-sm h-8`}
                          />
                        </div>
                        <Select
                          value={historyPnLFilter}
                          onValueChange={setHistoryPnLFilter}
                        >
                          <SelectTrigger className={`w-[140px] h-8 text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              {t("terminal.history.allTrades")}
                            </SelectItem>
                            <SelectItem value="profit">
                              {t("terminal.history.profitOnly")}
                            </SelectItem>
                            <SelectItem value="loss">
                              {t("terminal.history.lossOnly")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={historyDateFilter}
                          onValueChange={setHistoryDateFilter}
                        >
                          <SelectTrigger className={`w-[140px] h-8 text-sm ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">
                              {t("terminal.history.allTime")}
                            </SelectItem>
                            <SelectItem value="today">
                              {t("terminal.history.today")}
                            </SelectItem>
                            <SelectItem value="week">
                              {t("terminal.history.thisWeek")}
                            </SelectItem>
                            <SelectItem value="month">
                              {t("terminal.history.thisMonth")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Filtered Trade History */}
                      {(() => {
                        // Filter trades based on filters
                        const filteredTrades = tradeHistory.filter(
                          (trade) => {
                            // Symbol filter
                            if (
                              historySymbolFilter &&
                              !trade.symbol
                                ?.toLowerCase()
                                .includes(historySymbolFilter.toLowerCase())
                            ) {
                              return false;
                            }

                            // P/L filter
                            if (
                              historyPnLFilter === "profit" &&
                              trade.pnl <= 0
                            )
                              return false;
                            if (historyPnLFilter === "loss" && trade.pnl >= 0)
                              return false;

                            // Date filter
                            if (
                              historyDateFilter !== "all" &&
                              trade.closeTime
                            ) {
                              const closeDate = new Date(trade.closeTime);
                              const now = new Date();
                              const today = new Date(
                                now.getFullYear(),
                                now.getMonth(),
                                now.getDate(),
                              );
                              const weekAgo = new Date(
                                today.getTime() - 7 * 24 * 60 * 60 * 1000,
                              );
                              const monthAgo = new Date(
                                today.getTime() - 30 * 24 * 60 * 60 * 1000,
                              );

                              if (
                                historyDateFilter === "today" &&
                                closeDate < today
                              )
                                return false;
                              if (
                                historyDateFilter === "week" &&
                                closeDate < weekAgo
                              )
                                return false;
                              if (
                                historyDateFilter === "month" &&
                                closeDate < monthAgo
                              )
                                return false;
                            }

                            return true;
                          },
                        );

                        // Calculate stats
                        const totalPnL = filteredTrades.reduce(
                          (sum, t) => sum + (t.pnl || 0),
                          0,
                        );
                        const winCount = filteredTrades.filter(
                          (t) => t.pnl > 0,
                        ).length;
                        const lossCount = filteredTrades.filter(
                          (t) => t.pnl < 0,
                        ).length;
                        const winRate =
                          filteredTrades.length > 0
                            ? (
                              (winCount / filteredTrades.length) *
                              100
                            ).toFixed(1)
                            : 0;

                        return (
                          <div className="space-y-3">
                            {/* Stats Summary */}
                            <div className="grid grid-cols-4 gap-2 text-xs">
                              <div className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded p-2`}>
                                <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
                                  {t("terminal.history.totalPL")}
                                </p>
                                <p
                                  className={`font-bold ${totalPnL >= 0 ? "text-emerald-400" : "text-red-400"}`}
                                >
                                  {totalPnL >= 0 ? "+" : ""}$
                                  {totalPnL.toFixed(2)}
                                </p>
                              </div>
                              <div className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded p-2`}>
                                <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
                                  {t("terminal.history.winRate")}
                                </p>
                                <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {winRate}%
                                </p>
                              </div>
                              <div className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded p-2`}>
                                <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
                                  {t("terminal.history.wins")}
                                </p>
                                <p className="font-bold text-emerald-400">
                                  {winCount}
                                </p>
                              </div>
                              <div className={`${isDark ? 'bg-white/5' : 'bg-slate-50'} rounded p-2`}>
                                <p className={isDark ? 'text-gray-400' : 'text-slate-500'}>
                                  {t("terminal.history.losses")}
                                </p>
                                <p className="font-bold text-red-400">
                                  {lossCount}
                                </p>
                              </div>
                            </div>

                            {/* Trade List */}
                            <div className="max-h-64 overflow-auto space-y-2">
                              {filteredTrades.length === 0 ? (
                                <p className={`${isDark ? 'text-gray-400' : 'text-slate-500'} py-8`}>
                                  {t("terminal.history.noTradesMatch")}
                                </p>
                              ) : (
                                filteredTrades.map((trade, i) => {
                                  const closeDate = trade.closeTime
                                    ? new Date(trade.closeTime)
                                    : null;
                                  const formatDate = (date) => {
                                    if (!date) return "—";
                                    return new Intl.DateTimeFormat("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }).format(date);
                                  };

                                  return (
                                    <div
                                      key={trade.id || i}
                                      className={`flex items-center justify-between p-3 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-50 hover:bg-slate-100'} rounded-lg transition-colors`}
                                    >
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <Badge
                                          className={`flex-shrink-0 ${trade.type === "buy" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                                        >
                                          {(trade.type === "buy"
                                            ? t(
                                              "terminal.tradingPanel.buyLong",
                                            )
                                            : t(
                                              "terminal.tradingPanel.sellShort",
                                            )
                                          ).toUpperCase()}
                                        </Badge>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <span className={`${isDark ? 'text-white' : 'text-slate-900'} font-medium`}>
                                              {trade.symbol}
                                            </span>
                                            <span className={`${isDark ? 'text-gray-400' : 'text-slate-500'} text-xs`}>
                                              {trade.lotSize}{" "}
                                              {t("terminal.lots")}
                                            </span>
                                          </div>
                                          <div className={`flex items-center gap-3 mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                                            <span>
                                              {t("terminal.history.entry")}:{" "}
                                              {trade.entryPrice?.toFixed(5)}
                                            </span>
                                            <span>
                                              {t("terminal.history.exit")}:{" "}
                                              {trade.closePrice?.toFixed(5)}
                                            </span>
                                            {closeDate && (
                                              <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {formatDate(closeDate)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        {/* Show breach PnL if auto-closed due to limit breach, otherwise show realized PnL */}
                                        {/* Show breach snapshot if auto-closed due to limit breach */}
                                        {(() => {
                                          // Check if trade was auto-closed due to risk limit breach
                                          const isAutoClosed =
                                            trade.closeReason ===
                                            "RISK_AUTO_CLOSE" ||
                                            trade.closeReason ===
                                            "risk_auto_close" ||
                                            String(
                                              trade.closeReason || "",
                                            ).toUpperCase() ===
                                            "RISK_AUTO_CLOSE";

                                          // Check if breach snapshot exists
                                          const isBreachTriggered =
                                            trade.breachTriggered === true ||
                                            trade.breachTriggered === 1 ||
                                            String(trade.breachTriggered) ===
                                            "true";
                                          const hasBreachPnL =
                                            trade.breachUnrealizedPnl !==
                                            null &&
                                            trade.breachUnrealizedPnl !==
                                            undefined &&
                                            Number.isFinite(
                                              trade.breachUnrealizedPnl,
                                            );

                                          // Show breach snapshot if:
                                          // 1. Trade was auto-closed due to risk limit breach, OR
                                          // 2. Breach snapshot exists (breachTriggered + breachUnrealizedPnl)
                                          return (
                                            isAutoClosed ||
                                            (isBreachTriggered &&
                                              hasBreachPnL)
                                          );
                                        })() ? (
                                          <>
                                            {trade.breachUnrealizedPnl > 0 ? (
                                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                                            ) : trade.breachUnrealizedPnl <
                                              0 ? (
                                              <TrendingDown className="w-4 h-4 text-red-400" />
                                            ) : null}
                                            <div className="text-right">
                                              {/* Show breach PnL if available, otherwise show realized PnL */}
                                              {trade.breachUnrealizedPnl !==
                                                null &&
                                                trade.breachUnrealizedPnl !==
                                                undefined &&
                                                Number.isFinite(
                                                  trade.breachUnrealizedPnl,
                                                ) ? (
                                                <span
                                                  className={`font-mono font-bold text-sm ${trade.breachUnrealizedPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
                                                >
                                                  {trade.breachUnrealizedPnl >=
                                                    0
                                                    ? "+"
                                                    : ""}
                                                  $
                                                  {trade.breachUnrealizedPnl.toFixed(
                                                    2,
                                                  )}
                                                </span>
                                              ) : (
                                                <span
                                                  className={`font-mono font-bold text-sm ${trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
                                                >
                                                  {trade.pnl >= 0 ? "+" : ""}$
                                                  {trade.pnl?.toFixed(2)}
                                                </span>
                                              )}
                                              <Badge
                                                className="ml-1 text-xs bg-red-500/20 text-red-400"
                                                title={t(
                                                  "terminal.history.breachPnL",
                                                )}
                                              >
                                                {t("terminal.history.breach")}
                                              </Badge>
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            {trade.pnl > 0 ? (
                                              <TrendingUp className="w-4 h-4 text-emerald-400" />
                                            ) : trade.pnl < 0 ? (
                                              <TrendingDown className="w-4 h-4 text-red-400" />
                                            ) : null}
                                            <span
                                              className={`font-mono font-bold text-sm ${trade.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}
                                            >
                                              {trade.pnl >= 0 ? "+" : ""}$
                                              {trade.pnl?.toFixed(2)}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
          {/* <div className="col-span-5">
              <ChallengeRulesPanel
                account={account}
                challenge={selectedAccount}
              />
            </div> */}



{/* Modal is rendered inside MT5TradingArea; trade flow (handleExecuteTrade, positions) is passed via props */}










        </div>



        {/* <p className={`font-medium ${textClass}`}>
            {selectedTab === 'positions' ? 'No Open Positions' :
              selectedTab === 'pending' ? 'No Pending Orders' :
                'No Trade History'}
          </p>
          <p className={`text-sm mt-2 ${mutedClass}`}>
            {selectedTab === 'positions' ? 'Place a trade to see your positions here' :
              selectedTab === 'pending' ? 'Create pending orders to see them here' :
                'Your closed trades will appear here'}
          </p> */}
=======
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
                <span className={`ml-1 text-xs ${mutedClass}`}>({tab.count})</span>
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
          {!isDataLoading && selectedTab === 'positions' && (
            openPositions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
                  <TrendingUp className={`w-6 h-6 ${mutedClass}`} />
                </div>
                <p className={`font-medium text-sm ${textClass}`}>No Open Positions</p>
                <p className={`text-xs mt-1 ${mutedClass}`}>Place a trade to see your positions here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className={`border-b ${borderColor}`}>
                      <th style={{ ...thStyle, textAlign: 'left' }} className={mutedClass}>Symbol</th>
                      <th style={{ ...thStyle, textAlign: 'left' }} className={mutedClass}>Side</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>Qty</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>Entry</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>Current</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>PnL</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>SL</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>TP</th>
                      <th style={{ ...thStyle, textAlign: 'center' }} className={mutedClass}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {positionsWithPnL.map((trade) => (
                      <tr key={trade.id} className={`border-b ${borderColor}/20`}>
                        <td style={{ ...tdStyle, textAlign: 'left' }} className={textClass}>{trade.symbol}</td>
                        <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: trade.type === 'BUY' ? green : red }}>
                          {trade.type === 'BUY' ? 'Long' : 'Short'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} className={textClass}>{trade.volume?.toFixed(3)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} className={textClass}>{formatPrice(trade.openPrice)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} className={mutedClass}>
                          {trade.currentPrice ? formatPrice(trade.currentPrice) : '--'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: trade.livePnL >= 0 ? green : red }}>
                          {trade.livePnL >= 0 ? '+' : ''}{trade.livePnL.toFixed(2)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} className={mutedClass}>{trade.stopLoss ? formatPrice(trade.stopLoss) : '--'}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} className={mutedClass}>{trade.takeProfit ? formatPrice(trade.takeProfit) : '--'}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          <button
                            onClick={() => setCloseConfirmTrade(trade)}
                            disabled={closePositionMutation.isPending || isAccountLocked}
                            className={`text-xs px-3 py-1 rounded border transition-colors disabled:opacity-50 ${
                              isDark ? 'border-white/10 text-gray-400 hover:text-white hover:border-white/30' : 'border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400'
                            }`}
                          >
                            Close
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}

          {/* ── PENDING ORDERS TAB ── */}
          {!isDataLoading && selectedTab === 'pending' && (
            activePendingOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
                  <TrendingUp className={`w-6 h-6 ${mutedClass}`} />
                </div>
                <p className={`font-medium text-sm ${textClass}`}>No Pending Orders</p>
                <p className={`text-xs mt-1 ${mutedClass}`}>Create pending orders to see them here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className={`border-b ${borderColor}`}>
                      <th style={{ ...thStyle, textAlign: 'left' }} className={mutedClass}>Symbol</th>
                      <th style={{ ...thStyle, textAlign: 'left' }} className={mutedClass}>Type</th>
                      <th style={{ ...thStyle, textAlign: 'left' }} className={mutedClass}>Side</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>Qty</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>Price</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>SL</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>TP</th>
                      <th style={{ ...thStyle, textAlign: 'center' }} className={mutedClass}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePendingOrders.map((order) => (
                      <tr key={order.id} className={`border-b ${borderColor}/20`}>
                        <td style={{ ...tdStyle, textAlign: 'left' }} className={textClass}>{order.symbol}</td>
                        <td style={{ ...tdStyle, textAlign: 'left' }} className={mutedClass}>{order.orderType}</td>
                        <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: order.type === 'BUY' ? green : red }}>
                          {order.type === 'BUY' ? 'Long' : 'Short'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} className={textClass}>{order.volume?.toFixed(3)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} className={textClass}>{formatPrice(order.price)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} className={mutedClass}>{order.stopLoss ? formatPrice(order.stopLoss) : '--'}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} className={mutedClass}>{order.takeProfit ? formatPrice(order.takeProfit) : '--'}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
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
            )
          )}

          {/* ── HISTORY TAB ── */}
          {!isDataLoading && selectedTab === 'history' && (
            closedTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
                  <TrendingUp className={`w-6 h-6 ${mutedClass}`} />
                </div>
                <p className={`font-medium text-sm ${textClass}`}>No Trade History</p>
                <p className={`text-xs mt-1 ${mutedClass}`}>Your closed trades will appear here</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr className={`border-b ${borderColor}`}>
                      <th style={{ ...thStyle, textAlign: 'left' }} className={mutedClass}>Symbol</th>
                      <th style={{ ...thStyle, textAlign: 'left' }} className={mutedClass}>Side</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>Qty</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>Entry</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>Close</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>PnL</th>
                      <th style={{ ...thStyle, textAlign: 'right' }} className={mutedClass}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedTrades.slice(0, 50).map((trade) => (
                      <tr key={trade.id} className={`border-b ${borderColor}/20`}>
                        <td style={{ ...tdStyle, textAlign: 'left' }} className={textClass}>{trade.symbol}</td>
                        <td style={{ ...tdStyle, textAlign: 'left', fontWeight: 600, color: trade.type === 'BUY' ? green : red }}>
                          {trade.type === 'BUY' ? 'Long' : 'Short'}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} className={textClass}>{trade.volume?.toFixed(3)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} className={textClass}>{formatPrice(trade.openPrice)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} className={textClass}>{formatPrice(trade.closePrice)}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: (trade.profit || 0) >= 0 ? green : red }}>
                          {(trade.profit || 0) >= 0 ? '+' : ''}{(trade.profit || 0).toFixed(2)}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }} className={mutedClass}>{trade.closeReason || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
>>>>>>> 6aab4f3f735ae0ac13bf53e0ab7900d97f907fbb
      </div>

      {/* ==================== TRADING STYLE RULES ==================== */}
      <TradingStyleRules challenge={selectedChallenge} />

      {/* ==================== CLOSE CONFIRMATION DIALOG ==================== */}
      {closeConfirmTrade && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60" onClick={() => setCloseConfirmTrade(null)}>
          <div className={`${cardClass} p-6 max-w-sm w-full mx-4 shadow-xl`} onClick={(e) => e.stopPropagation()}>
            <h3 className={`text-lg font-bold mb-4 ${textClass}`}>Close Position?</h3>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className={mutedClass}>Symbol</span>
                <span className={textClass}>{closeConfirmTrade.symbol}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={mutedClass}>Side</span>
                <span style={{ color: closeConfirmTrade.type === 'BUY' ? green : red, fontWeight: 600 }}>
                  {closeConfirmTrade.type === 'BUY' ? 'Long' : 'Short'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={mutedClass}>Qty</span>
                <span className={textClass}>{closeConfirmTrade.volume?.toFixed(3)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={mutedClass}>Entry Price</span>
                <span className={textClass}>{formatPrice(closeConfirmTrade.openPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className={mutedClass}>Close Price</span>
                <span className={textClass}>{formatPrice(closeConfirmTrade.currentPrice || getClosePrice(closeConfirmTrade))}</span>
              </div>
              <div className={`flex justify-between text-sm pt-2 border-t ${borderColor}`}>
                <span className={mutedClass}>Est. PnL</span>
                <span style={{ fontWeight: 700, color: closeConfirmTrade.livePnL >= 0 ? green : red }}>
                  {closeConfirmTrade.livePnL >= 0 ? '+' : ''}${closeConfirmTrade.livePnL.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCloseConfirmTrade(null)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium border ${
                  isDark ? 'border-white/10 text-gray-400 hover:text-white' : 'border-slate-300 text-slate-500 hover:text-slate-900'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const cp = closeConfirmTrade.currentPrice || getClosePrice(closeConfirmTrade);
                  closePositionMutation.mutate({ tradeId: closeConfirmTrade.id, closePrice: cp });
                  setCloseConfirmTrade(null);
                }}
                disabled={closePositionMutation.isPending}
                className="flex-1 py-2 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
              >
                {closePositionMutation.isPending ? 'Closing...' : 'Confirm Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommonTerminalWrapper;
