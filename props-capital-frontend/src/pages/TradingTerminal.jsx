import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import { getCurrentUser } from '@/api/auth';
import { getUserAccounts, getAccountById, getAccountSummary, getAccountRules, processPriceTick } from '@/api/accounts';
import { getAccountTrades, createTrade, updateTrade, modifyPosition } from '@/api/trades';
import { createPendingOrder, getPendingOrders, cancelPendingOrder, executePendingOrder } from '@/api/pending-orders';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { playClosureAlert } from '@/utils/notificationSound';
import socket from '../lib/socket';

import MarketWatchlist from '../components/trading/MarketWatchlist';
import TradingPanel from '../components/trading/TradingPanel';
import TradingChart from '../components/trading/TradingChart';
import OpenPositions from '../components/trading/OpenPositions';
import AccountMetrics from '../components/trading/AccountMetrics';
import ChallengeRulesPanel from '../components/trading/ChallengeRulesPanel';
import ViolationPopup from '../components/trading/ViolationPopup';
import ModifyPositionDialog from '../components/trading/ModifyPositionDialog';
import ViolationModal from '../components/trading/ViolationModal';

import {
  LayoutGrid,
  Maximize2,
  Settings,
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
  ChevronLeft,
  ChevronRight,
  XCircle,
  X,
  ChevronDown,
  Wallet,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useTranslation } from '../contexts/LanguageContext';
import { useToast } from '@/components/ui/use-toast';
import { usePrices } from '@/contexts/PriceContext';
import { useTradingWebSocket } from '@/hooks/useTradingWebSocket';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Helper function for development-only logging
const devLog = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
};

const devWarn = (...args) => {
  if (process.env.NODE_ENV !== 'production') {
    console.warn(...args);
  }
};

// Demo account localStorage helpers
const DEMO_ACCOUNT_STORAGE_KEY = 'demo-account:trades';

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
    console.error('Failed to load demo account data from localStorage:', error);
  }
  return {
    positions: [],
    closedTrades: [],
    pendingOrders: [],
    balance: 100000,
    equity: 100000,
  };
};

const saveDemoAccountTrades = (positions, closedTrades, pendingOrders, balance, equity) => {
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
    console.error('Failed to save demo account data to localStorage:', error);
  }
};

export default function TradingTerminal() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const location = useLocation();
  const { prices: unifiedPrices, getPrice: getUnifiedPrice, lastUpdate: pricesLastUpdate } = usePrices();
  // Initialize with a default symbol so trading works immediately
  const [selectedSymbol, setSelectedSymbol] = useState({
    symbol: 'EUR/USD',
    bid: 1.08542,
    ask: 1.08557,
    spread: 1.5,
    change: 0.05
  });

  // Enrich selectedSymbol with real-time prices from unifiedPrices
  const enrichedSelectedSymbol = useMemo(() => {
    if (!selectedSymbol?.symbol) return selectedSymbol;

    const priceData = unifiedPrices[selectedSymbol.symbol];
    if (priceData && typeof priceData === 'object' && priceData.bid !== undefined && priceData.ask !== undefined) {
      const spread = ((priceData.ask - priceData.bid) * 10000).toFixed(1); // Calculate spread in pips for forex
      return {
        ...selectedSymbol,
        bid: priceData.bid,
        ask: priceData.ask,
        spread: parseFloat(spread),
      };
    }
    return selectedSymbol;
  }, [selectedSymbol, unifiedPrices]);

  const [positions, setPositions] = useState([]);
  const [demoClosedTrades, setDemoClosedTrades] = useState([]);
  const [demoPendingOrders, setDemoPendingOrders] = useState([]);
  const [optimisticClosedTrades, setOptimisticClosedTrades] = useState([]);
  const [isConnected, setIsConnected] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  // Account status banner state (for locked/disqualified messages)
  const [accountStatusBanner, setAccountStatusBanner] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [modifyingPosition, setModifyingPosition] = useState(null);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [isExecutingTrade, setIsExecutingTrade] = useState(false); // Prevent duplicate trade execution
  const [accountFailed, setAccountFailed] = useState(false);
  const [isAccountLoading, setIsAccountLoading] = useState(false);
  const [hasTriggeredWarning, setHasTriggeredWarning] = useState(false);
  const [hasTriggeredViolation, setHasTriggeredViolation] = useState(false);
  
  const [activeTab, setActiveTab] = useState('chart');

  // Trade history filters
  const [historySymbolFilter, setHistorySymbolFilter] = useState('');
  const [historyPnLFilter, setHistoryPnLFilter] = useState('all'); // 'all', 'profit', 'loss'
  const [historyDateFilter, setHistoryDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  // Refs for tracking daily balance
  const dailyStartBalanceRef = useRef(null);
  const currentDayRef = useRef(null);
  const prevPricesRef = useRef({}); // Track previous prices for limit order execution
  const violationCheckInProgressRef = useRef(false); // Prevent duplicate violation checks (deprecated - using price-tick now)
  const priceTickThrottleRef = useRef({}); // Throttle price tick calls (250ms per symbol)
  const [violationModal, setViolationModal] = React.useState(null); // { type: 'DAILY_LOCKED' | 'DISQUALIFIED', shown: boolean }

  // 🔥 WebSocket state for real-time trading days updates
  const [socketConnected, setSocketConnected] = useState(false);
  const [tradingDaysCount, setTradingDaysCount] = useState(0);
  const [tradedToday, setTradedToday] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [minTradingDays, setMinTradingDays] = useState(4);

// Aliases for compatibility with existing code
  const tradingDays = tradingDaysCount;

  // Ref to track active trade polling and prevent race conditions when switching accounts
  const activeTradePollRef = useRef({ accountId: null, pollId: 0, aborted: false });

  // Get accountId from URL using React Router
  const [searchParams] = useSearchParams();
  const accountId = searchParams.get('account') || searchParams.get('accountId');

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
    retry: false,
  });

  // Store last valid userId to prevent query from being disabled during refetches
  const lastValidUserIdRef = useRef(user?.userId);
  useEffect(() => {
    if (user?.userId) {
      lastValidUserIdRef.current = user.userId;
    }
  }, [user?.userId]);

  // Fetch all user's accounts
  // Use keepPreviousData to prevent accounts from disappearing during refetches
  const { data: allAccountsData = [], isLoading: isLoadingAccounts } = useQuery({
    queryKey: ['trading-accounts', lastValidUserIdRef.current || user?.userId],
    queryFn: async () => {
      const userId = lastValidUserIdRef.current || user?.userId;
      if (!userId) return [];
      try {
        const accounts = await getUserAccounts(userId);
        devLog('📥 Fetched accounts:', accounts?.length || 0);
        return accounts || [];
      } catch (error) {
        console.error('❌ Failed to fetch accounts:', error);
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
  });

  // Map backend accounts to frontend format
  // Map backend accounts to frontend format
  const allAccounts = (allAccountsData || []).map(account => {
    const challenge = account.challenge || {};
    const initialBalance = account.initialBalance || challenge.accountSize || 0;
    const balance = account.balance || initialBalance;
    const equity = account.equity || balance;
    const profitPercent = initialBalance > 0 ? ((equity - initialBalance) / initialBalance) * 100 : 0;
    const overallDD = initialBalance > 0 && equity < initialBalance
      ? ((initialBalance - equity) / initialBalance) * 100
      : 0;
    const dailyDD = balance > 0 && equity < balance
      ? ((balance - equity) / balance) * 100
      : 0;

    const phaseMap = {
      'PHASE1': 'phase1',
      'PHASE2': 'phase2',
      'FUNDED': 'funded',
      'FAILED': 'failed'
    };
    const statusMap = {
      'ACTIVE': 'ACTIVE',
      'PAUSED': 'PAUSED',
      'CLOSED': 'CLOSED',
      'DAILY_LOCKED': 'DAILY_LOCKED',
      'DISQUALIFIED': 'DISQUALIFIED',
      'FAILED': 'FAILED',
      'CHALLENGE_FAILED': 'CHALLENGE_FAILED',
      'ACCOUNT_FAILED': 'ACCOUNT_FAILED'
    };

    return {
      id: account.id,
      account_number: account.brokerLogin || account.id.slice(0, 8),
      platform: account.platform || challenge.platform || 'MT5',
      status: statusMap[account.status] || account.status || 'ACTIVE', // Preserve original status or use uppercase
      current_phase: phaseMap[account.phase] || account.phase?.toLowerCase() || 'phase1',
      initial_balance: initialBalance,
      current_balance: balance,
      current_equity: equity,
      current_profit_percent: profitPercent,
      daily_drawdown_percent: dailyDD,
      overall_drawdown_percent: overallDD,
      trading_days_count: account.trades ? new Set(account.trades.map(t => new Date(t.openedAt).toISOString().substring(0, 10))).size : 0,
      min_trading_days: challenge.minTradingDays || challenge.min_trading_days || 5,
      max_trading_days: challenge.maxTradingDays || challenge.max_trading_days || 30,
      days_remaining: account.daysRemaining ?? Math.max(0, (challenge.maxTradingDays || challenge.max_trading_days || 30) - (account.daysElapsed || 0)),
      margin_used: 0, // Will be updated from backend getAccountById
      free_margin: equity, // Will be updated from backend getAccountById
      // Challenge fields for ChallengeRulesPanel (camelCase versions)
      minTradingDays: challenge.minTradingDays || challenge.min_trading_days || 5,
      maxTradingDays: challenge.maxTradingDays || challenge.max_trading_days || 30,
      profitSplit: challenge.profitSplit || challenge.profit_split || 80,
      leverage: challenge.leverage || 100,
      maxLot: challenge.maxLot || challenge.max_lot || 10,
      phase1_profit_target: challenge.phase1TargetPercent || challenge.phase1_profit_target || 8,
      max_daily_drawdown: challenge.dailyDrawdownPercent || challenge.max_daily_drawdown || 5,
      max_overall_drawdown: challenge.overallDrawdownPercent || challenge.max_overall_drawdown || 10,
      news_trading_allowed: challenge.newsTradingAllowed ?? challenge.news_trading_allowed ?? true,
      weekend_holding_allowed: challenge.weekendHoldingAllowed ?? challenge.weekend_holding_allowed ?? true,
      ea_allowed: challenge.eaAllowed ?? challenge.ea_allowed ?? true,
    };
  });

  // Demo account for testing/demo purposes
  const demoAccount = {
    id: 'demo-account',
    account_number: 'DEMO001',
    platform: 'MT5',
    status: 'active',
    current_phase: 'phase1',
    initial_balance: 100000,
    current_balance: 100000,
    current_equity: 100000,
    current_profit_percent: 0,
    daily_drawdown_percent: 0.5,
    overall_drawdown_percent: 0.0,
    trading_days_count: 0,
    isDemo: true
  };

  // Combine real accounts with demo account
  const realAccounts = allAccounts.filter(a => a.status !== 'failed');
  const availableAccounts = [demoAccount, ...realAccounts];
  const [selectedAccountId, setSelectedAccountId] = useState(accountId || '');

  // Set default account if none selected - prioritize demo account
  useEffect(() => {
    if (!isLoadingAccounts) {
      // If no account selected or selected account doesn't exist in available accounts
      if (!selectedAccountId || !availableAccounts.find(a => a.id === selectedAccountId)) {
        // Default to demo account
        setSelectedAccountId(demoAccount.id);
      }
    }
  }, [availableAccounts, selectedAccountId, isLoadingAccounts]);

  // Get selected account data - includes demo account
  const selectedAccount = availableAccounts.find(a => a.id === selectedAccountId);

  // 🔥 Real-time account updates via WebSocket
  const handleAccountUpdate = useCallback((event) => {
    if (!event) return;
    
    devLog('⚡ WebSocket Account Update:', event);

    if (event.tradingDaysCount !== undefined) {
      setTradingDaysCount(event.tradingDaysCount);
      // Update account state to keep ChallengeRulesPanel in sync
      setAccount(prev => ({
        ...prev,
        tradingDays: event.tradingDaysCount
      }));
    }

    if (event.daysRemaining !== undefined) {
      setDaysRemaining(event.daysRemaining);
      setAccount(prev => ({
        ...prev,
        daysRemaining: event.daysRemaining
      }));
    }

    if (event.tradedToday !== undefined) {
      setTradedToday(event.tradedToday);
    }
  }, []);

  // Initialize WebSocket connection
  const { isConnected: isSocketConnected } = useTradingWebSocket({
    accountId: selectedAccountId,
    onAccountUpdate: handleAccountUpdate
  });

  // Update socket connection state
  useEffect(() => {
    setSocketConnected(isSocketConnected);
  }, [isSocketConnected]);


  // 🔥 Simple polling for trading days updates (fallback)
useEffect(() => {
  // Skip if no account or demo account
  if (!selectedAccountId || selectedAccount?.isDemo) {
    return;
  }

  console.log('📊 Starting trading days polling for account:', selectedAccountId);

  // Function to fetch account data and update trading days
  const updateTradingDays = async () => {
    try {
      const summary = await getAccountSummary(selectedAccountId);

      if (summary?.metrics?.tradingDaysCompleted !== undefined) {
        console.log('✅ Updated trading days:', summary.metrics.tradingDaysCompleted);
        setTradingDaysCount(summary.metrics.tradingDaysCompleted);
        // Also update account state so ChallengeRulesPanel gets the update
        setAccount(prev => ({
          ...prev,
          tradingDays: summary.metrics.tradingDaysCompleted
        }));
      }
      if (summary?.metrics?.daysRemaining !== undefined) {
        setDaysRemaining(summary.metrics.daysRemaining);
        setAccount(prev => ({
          ...prev,
          daysRemaining: summary.metrics.daysRemaining
        }));
      }

      // Check if traded today
      const traded = summary?.account?.tradedToday || false;
      setTradedToday(traded);
    } catch (error) {
      console.error('❌ Failed to update trading days:', error);
    }
  };

  // Update immediately
  updateTradingDays();

  // Then update every 5 seconds
  const interval = setInterval(updateTradingDays, 5000);

  // Cleanup
  return () => {
    console.log('🧹 Stopping trading days polling');
    clearInterval(interval);
  };
}, [selectedAccountId, selectedAccount?.isDemo]);

  // Account is valid if selected (demo account is always valid)
  const hasValidAccount = !!selectedAccount;

  // Demo account data - will be overridden if real account exists
  const [account, setAccount] = useState({
    balance: 100000,
    equity: 100000,
    margin: 0,
    freeMargin: 100000,
    floatingPnL: 0,
    profitPercent: 0,
    dailyDrawdown: 0,
    maxDailyDrawdown: 5,
    overallDrawdown: 0,
    maxOverallDrawdown: 10,
    profitTarget: 10,
    tradingDays: 5,
    minTradingDays: 5,
    daysRemaining: 15, // Default to 15 days remaining (30 max - 15 elapsed)
    daysElapsed: 15,
    phase: 'phase1',
    startingBalance: 100000,
    highestBalance: 100000,
    accountNumber: null,
    platform: 'MT5',
    status: 'ACTIVE' // Initialize with ACTIVE status
  });

  // Track the last account ID to detect actual account switches
  const [lastAccountId, setLastAccountId] = useState(null);
  const tradesLoadedForAccountRef = useRef(null); // Track which account we've loaded trades for

  // Track last local update time to prevent stale backend data from overwriting optimistic state
  const lastLocalUpdateRef = useRef(0);
  const lastLocalBalanceRef = useRef(null);

  // Throttle sync calls to prevent excessive API requests
  const lastSyncTimeRef = useRef({}); // Track last sync time per account
  const isSyncingRef = useRef({}); // Track if sync is in progress per account
  const SYNC_THROTTLE_MS = 2000; // Minimum 2 seconds between syncs for same account

  /**
   * Poll trades query until new closed trades appear (for auto-closed positions)
   * Returns true if new trades detected, false if timeout or aborted
   * Includes cancellation mechanism to prevent race conditions when switching accounts
   */
  const refetchTradesUntilSettled = useCallback(async (accountId, beforeMarker) => {
    if (!accountId) return false;

    // Increment poll ID and mark as active for this account
    activeTradePollRef.current.pollId += 1;
    const localPollId = activeTradePollRef.current.pollId;
    activeTradePollRef.current.accountId = accountId;
    activeTradePollRef.current.aborted = false;

    const MAX_ATTEMPTS = 8;
    const POLL_INTERVAL_MS = 250;
    const MAX_TOTAL_TIME_MS = 2000; // 2 seconds total

    const startTime = Date.now();

    devLog('🔄 Starting trade polling for account:', accountId, 'pollId:', localPollId);

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Check cancellation: poll ID changed (new poll started) or account changed
      if (activeTradePollRef.current.pollId !== localPollId) {
        devLog('🚫 Trade polling aborted: new poll started (pollId changed)');
        return false;
      }

      if (activeTradePollRef.current.accountId !== accountId) {
        devLog('🚫 Trade polling aborted: account changed');
        return false;
      }

      if (activeTradePollRef.current.aborted) {
        devLog('🚫 Trade polling aborted: explicitly aborted');
        return false;
      }

      // Check if we've exceeded total time limit
      if (Date.now() - startTime >= MAX_TOTAL_TIME_MS) {
        devLog('⏱️ Trade polling timeout after', MAX_TOTAL_TIME_MS, 'ms');
        break;
      }

      // Refetch trades (account-scoped only)
      await queryClient.refetchQueries({ queryKey: ['trades', accountId] });

      // Get current trades from cache
      const queryData = queryClient.getQueryData(['trades', accountId]);
      const currentTrades = Array.isArray(queryData) ? queryData : [];

      // Check if we have new trades
      if (beforeMarker) {
        // Compare by trade count or latest trade timestamp
        if (currentTrades.length > beforeMarker.tradeCount) {
          devLog('✅ New trades detected! Count:', currentTrades.length, 'vs', beforeMarker.tradeCount);
          return true;
        }

        // Check if latest trade is newer than before marker
        if (currentTrades.length > 0 && beforeMarker.latestTradeTimestamp) {
          const latestTrade = currentTrades[0]; // Assuming trades are sorted by newest first
          const latestCloseTime = latestTrade.closedAt || latestTrade.closeTime;
          if (latestCloseTime && new Date(latestCloseTime) > new Date(beforeMarker.latestTradeTimestamp)) {
            devLog('✅ New closed trades detected! Latest close:', latestCloseTime);
            return true;
          }
        }

        // Check if we have closed trades that weren't there before
        const closedTrades = currentTrades.filter(t => t.closedAt || t.closePrice);
        if (closedTrades.length > (beforeMarker.closedCount || 0)) {
          devLog('✅ New closed trades detected! Closed count:', closedTrades.length, 'vs', beforeMarker.closedCount);
          return true;
        }
      } else {
        // If no before marker, just check if we have any closed trades
        const closedTrades = currentTrades.filter(t => t.closedAt || t.closePrice);
        if (closedTrades.length > 0) {
          devLog('✅ Closed trades found');
          return true;
        }
      }

      // Wait before next attempt (except on last attempt)
      if (attempt < MAX_ATTEMPTS - 1) {
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
      }
    }

    devLog('⏱️ Trade polling completed without detecting new trades');
    return false;
  }, [queryClient, selectedAccountId]);

  /**
   * Compute overall drawdown snapshot at breach moment (atomic)
   * Uses best available value in priority order
   */
  const computeBreachSnapshotOverallDD = useCallback((evaluation, currentEquity) => {
    // Priority a: evaluation.drawdownPercent (if present and > 0)
    if (evaluation?.drawdownPercent !== undefined && evaluation.drawdownPercent > 0) {
      return evaluation.drawdownPercent;
    }

    // Priority b: current account.overallDrawdown (if > 0)
    if (account.overallDrawdown > 0) {
      return account.overallDrawdown;
    }

    // Priority c: compute from peak equity
    const maxEquityToDate = account.maxEquityToDate || account.highestBalance || account.startingBalance || 100000;
    if (maxEquityToDate > 0 && currentEquity < maxEquityToDate) {
      const computedDD = ((maxEquityToDate - currentEquity) / maxEquityToDate) * 100;
      if (computedDD > 0) {
        return computedDD;
      }
    }

    return null; // No valid snapshot available
  }, [account.overallDrawdown, account.maxEquityToDate, account.highestBalance, account.startingBalance]);

  /**
   * Persist violation drawdown values to sessionStorage
   * Stores values when violation occurs so they can be frozen even after positions close
   */
  const persistViolationValues = useCallback((accountId, evaluation, backendStatus = null) => {
    if (!accountId || typeof window === 'undefined') return;

    // Store daily drawdown if daily violation occurred
    if (evaluation?.dailyViolated && evaluation?.dailyLossPercent !== undefined && evaluation.dailyLossPercent > 0) {
      sessionStorage.setItem(`violation:${accountId}:daily_dd`, evaluation.dailyLossPercent.toString());
      devLog('💾 Stored daily drawdown violation value:', evaluation.dailyLossPercent);
    }

    // Store overall drawdown if overall violation occurred
    if (evaluation?.drawdownViolated && evaluation?.drawdownPercent !== undefined && evaluation.drawdownPercent > 0) {
      sessionStorage.setItem(`violation:${accountId}:overall_dd`, evaluation.drawdownPercent.toString());
      devLog('💾 Stored overall drawdown violation value:', evaluation.drawdownPercent);
    }

    // Also check backend status as fallback
    if (backendStatus) {
      const statusUpper = String(backendStatus).toUpperCase();
      if (statusUpper.includes('DAILY') && evaluation?.dailyLossPercent !== undefined && evaluation.dailyLossPercent > 0) {
        sessionStorage.setItem(`violation:${accountId}:daily_dd`, evaluation.dailyLossPercent.toString());
        devLog('💾 Stored daily drawdown from backend status:', evaluation.dailyLossPercent);
      }
      if ((statusUpper.includes('FAIL') || statusUpper.includes('DISQUAL')) && evaluation?.drawdownPercent !== undefined && evaluation.drawdownPercent > 0) {
        sessionStorage.setItem(`violation:${accountId}:overall_dd`, evaluation.drawdownPercent.toString());
        devLog('💾 Stored overall drawdown from backend status:', evaluation.drawdownPercent);
      }
    }
  }, []);

  // Helper function to sync account data from backend (Step 3: Account Balance Sync)
  // Returns the resolved account status from backend
  // showLoading: if true, shows skeleton loading state (for account switches). If false, syncs silently in background (for trade updates)
  const syncAccountFromBackend = useCallback(async (accountId, force = false, showLoading = false) => {
    if (!accountId || selectedAccount?.isDemo) {
      devLog('⏭️ Skipping account sync - demo account or no account ID');
      return null;
    }

    // Throttle: Don't sync if we just synced this account recently (unless forced)
    const now = Date.now();
    const lastSync = lastSyncTimeRef.current[accountId] || 0;
    const timeSinceLastSync = now - lastSync;

    if (!force && timeSinceLastSync < SYNC_THROTTLE_MS) {
      devLog(`⏭️ Skipping sync - last sync was ${timeSinceLastSync}ms ago (throttle: ${SYNC_THROTTLE_MS}ms)`);
      return account.status || null;
    }

    // Prevent concurrent syncs for the same account
    if (isSyncingRef.current[accountId]) {
      devLog('⏭️ Skipping sync - already syncing this account');
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
      devLog('🔄 Syncing account data from backend for account:', accountId);

      // Fetch fresh account summary from backend
      const accountSummary = await getAccountSummary(accountId);

      if (accountSummary?.account) {
        const acc = accountSummary.account;
        const metrics = accountSummary.metrics || {}; // Get metrics from the correct path

        // Debug: Log full response to see what we're getting
        devLog('📊 Full account summary response:', {
          account: acc,
          metrics: metrics,
          fullResponse: accountSummary
        });

        // Always use backend values for drawdown calculations (single source of truth)
        // Backend uses equity snapshots to track highest equity today, which is more accurate
        const balance = acc.balance ?? 0;
        const equity = acc.equity ?? balance;
        const initialBalance = acc.initialBalance || account.startingBalance || 100000;
        const todayStartEquity = acc.todayStartEquity ?? equity; // Equity at start of trading day
        const maxEquityToDate = acc.maxEquityToDate ?? initialBalance; // Highest equity ever reached

        // Use backend metrics directly - never recalculate (single source of truth)
        const backendOverallDD = metrics.overallDrawdownPercent ?? 0;
        const backendDailyDD = metrics.dailyDrawdownPercent ?? 0;
        // CRITICAL: Get backend status and check for frozen violation values
        const backendStatus = acc.status || account.status;
        const statusUpper = String(backendStatus).toUpperCase();

        // Store last known metrics in sessionStorage for fallback (update on every successful sync)
        if (typeof window !== 'undefined' && backendOverallDD >= 0) {
          sessionStorage.setItem(`metrics:${accountId}:last_overall_dd`, backendOverallDD.toString());
          devLog('💾 Stored last known overall drawdown:', backendOverallDD);
        }
        if (typeof window !== 'undefined' && backendDailyDD >= 0) {
          sessionStorage.setItem(`metrics:${accountId}:last_daily_dd`, backendDailyDD.toString());
          devLog('💾 Stored last known daily drawdown:', backendDailyDD);
        }

        // Handle daily drawdown: use frozen violation value when DAILY_LOCKED
        let dailyDrawdown = backendDailyDD;
        if (statusUpper.includes('DAILY')) {
          const storedDailyDD = sessionStorage.getItem(`violation:${accountId}:daily_dd`);
          if (storedDailyDD !== null) {
            dailyDrawdown = parseFloat(storedDailyDD);
            devLog('🔒 Using frozen daily drawdown value from violation:', dailyDrawdown);
          }
        }

        // Handle overall drawdown: use breach snapshot if available, then fallback
        let overallDrawdown = backendOverallDD;
        const isLocked = statusUpper.includes('DAILY') || statusUpper.includes('FAIL') || statusUpper.includes('DISQUAL');
        const isDailyLocked = statusUpper.includes('DAILY');
        const isDisqualified = statusUpper.includes('FAIL') || statusUpper.includes('DISQUAL');

        // If account is disqualified/failed, use frozen overall drawdown value if available (highest priority)
        if (isDisqualified) {
          const storedOverallDD = sessionStorage.getItem(`violation:${accountId}:overall_dd`);
          if (storedOverallDD !== null) {
            const violationDD = parseFloat(storedOverallDD);
            if (Number.isFinite(violationDD) && violationDD > 0) {
              overallDrawdown = violationDD;
              devLog('🔒 Using frozen overall drawdown value from violation:', overallDrawdown);
            }
          }
        }

        // If DAILY_LOCKED and backend returns 0/null, use breach snapshot (atomic snapshot at breach moment)
        if (isDailyLocked && (backendOverallDD === 0 || backendOverallDD === null || backendOverallDD === undefined)) {
          const snapshotDD = sessionStorage.getItem(`violation:${accountId}:snapshot_overall_dd`);
          if (snapshotDD !== null) {
            const snapshotValue = parseFloat(snapshotDD);
            if (Number.isFinite(snapshotValue) && snapshotValue > 0) {
              overallDrawdown = snapshotValue;
              devLog('🔒 [SNAPSHOT] Using overall drawdown from breach snapshot:', overallDrawdown);
            }
          } else {
            // Fallback to last known metrics if snapshot not available
            const lastKnownOverallDD = sessionStorage.getItem(`metrics:${accountId}:last_overall_dd`);
            if (lastKnownOverallDD !== null) {
              const lastDD = parseFloat(lastKnownOverallDD);
              if (Number.isFinite(lastDD) && lastDD > 0) {
                overallDrawdown = lastDD;
                devLog('🔄 Using fallback overall drawdown from last known metrics:', overallDrawdown);
              }
            }
          }
        }

        // Clear snapshot when account becomes ACTIVE again (unlocked)
        if (backendStatus === 'ACTIVE' && typeof window !== 'undefined') {
          const previousStatus = account.status;
          const prevStatusUpper = String(previousStatus || '').toUpperCase();
          // Only clear if transitioning from locked state to active
          if (prevStatusUpper.includes('DAILY') || prevStatusUpper.includes('FAIL') || prevStatusUpper.includes('DISQUAL')) {
            sessionStorage.removeItem(`violation:${accountId}:snapshot_overall_dd`);
            devLog('🧹 Cleared breach snapshot - account unlocked');
          }
        }

        // Get challenge rules from accountSummary response
        const challengeRules = accountSummary.challengeRules || {};
        const maxDailyDD = challengeRules.dailyDrawdownPercent || account.maxDailyDrawdown || 5;
        const maxOverallDD = challengeRules.overallDrawdownPercent || account.maxOverallDrawdown || 10;

        // CRITICAL: For daily drawdown, use frozen violation value if DAILY_LOCKED
        let finalDailyDrawdown = dailyDrawdown;
        if (isDailyLocked && typeof window !== 'undefined') {
          const violationDailyDD = sessionStorage.getItem(`violation:${accountId}:daily_dd`);
          if (violationDailyDD !== null) {
            const violationValue = parseFloat(violationDailyDD);
            if (Number.isFinite(violationValue) && violationValue > 0) {
              finalDailyDrawdown = violationValue;
              devLog('🔒 Using frozen daily drawdown from violation:', finalDailyDrawdown);
            }
          }
        }

        // CRITICAL: Never overwrite overallDrawdown with 0 if account is locked/disqualified and violation value exists
        // This prevents reset-to-0 when backend returns 0 after positions close
        let finalOverallDrawdown = overallDrawdown;
        if ((isDailyLocked || isDisqualified) && (overallDrawdown === 0 || !Number.isFinite(overallDrawdown))) {
          // Try violation value first
          if (typeof window !== 'undefined') {
            const violationOverallDD = sessionStorage.getItem(`violation:${accountId}:overall_dd`);
            if (violationOverallDD !== null) {
              const violationValue = parseFloat(violationOverallDD);
              if (Number.isFinite(violationValue) && violationValue > 0) {
                finalOverallDrawdown = violationValue;
                devLog('🔒 Using frozen overall drawdown from violation (fallback):', finalOverallDrawdown);
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
          finalOverallDrawdown = Number.isFinite(overallDrawdown) ? overallDrawdown : (account.overallDrawdown ?? 0);
        }

        setAccount(prev => {
          // PROTECTION: Prevent stale backend data from overwriting optimistic balance
          // If we had a local update within the last 3 seconds, use the backend balance only if it's different 
          // from what we expect (meaning the backend has definitely processed our change)
          const now = Date.now();
          const isRecentlyUpdated = now - lastLocalUpdateRef.current < 3000;

          let finalBalance = (acc.balance !== null && acc.balance !== undefined && Number.isFinite(acc.balance))
            ? acc.balance
            : prev.balance;

          if (isRecentlyUpdated && lastLocalBalanceRef.current !== null) {
            // If the backend balance hasn't caught up to our optimistic balance yet, keep our optimistic one
            if (Math.abs(finalBalance - lastLocalBalanceRef.current) > 0.01) {
              devLog('🛡️ Protected optimistic balance from stale backend data:', finalBalance, '->', lastLocalBalanceRef.current);
              finalBalance = lastLocalBalanceRef.current;
            } else {
              // Backend caught up, we can clear our ref
              lastLocalBalanceRef.current = null;
            }
          }

          return {
            ...prev,
            balance: finalBalance,
            equity: (acc.equity !== null && acc.equity !== undefined && Number.isFinite(acc.equity))
              ? acc.equity
              : prev.equity,
            profitPercent: Math.max(
              prev.profitPercent ?? 0,
              (metrics.profitPercent !== null && metrics.profitPercent !== undefined && Number.isFinite(metrics.profitPercent))
                ? metrics.profitPercent
                : 0
            ),
            // CRITICAL: Drawdowns should only INCREASE - never decrease when profit comes
            overallDrawdown: Math.max(
              prev.overallDrawdown ?? 0,
              (Number.isFinite(finalOverallDrawdown) && finalOverallDrawdown >= 0) ? finalOverallDrawdown : 0
            ),
            dailyDrawdown: Math.max(
              prev.dailyDrawdown ?? 0,
              (Number.isFinite(finalDailyDrawdown) && finalDailyDrawdown >= 0) ? finalDailyDrawdown : 0
            ),
            maxDailyDrawdown: maxDailyDD, // Use from challenge rules
            maxOverallDrawdown: maxOverallDD, // Use from challenge rules
            phase: acc.phase?.toLowerCase() || prev.phase,
            tradingDays: metrics.tradingDaysCompleted ?? prev.tradingDays, // Backend uses tradingDaysCompleted
            minTradingDays: challengeRules.minTradingDays ?? prev.minTradingDays,
            daysRemaining: (metrics.daysRemaining !== null && metrics.daysRemaining !== undefined && Number.isFinite(metrics.daysRemaining))
              ? metrics.daysRemaining
              : prev.daysRemaining,
            margin: (acc.marginUsed !== null && acc.marginUsed !== undefined && Number.isFinite(acc.marginUsed))
              ? acc.marginUsed
              : prev.margin,
            freeMargin: (acc.freeMargin !== null && acc.freeMargin !== undefined && Number.isFinite(acc.freeMargin))
              ? acc.freeMargin
              : prev.freeMargin,
            startingBalance: initialBalance,
            todayStartEquity: todayStartEquity, // Store for consistent drawdown calculations
            maxEquityToDate: maxEquityToDate, // Store for consistent drawdown calculations
            status: backendStatus, // CRITICAL: Always update status from backend
          };
        });

        devLog('✅ Account data synced from backend:', {
          balance: acc.balance,
          equity: acc.equity,
          initialBalance: initialBalance,
          profitPercent: metrics.profitPercent,
          overallDrawdown: overallDrawdown,
          dailyDrawdown: dailyDrawdown,
          phase: acc.phase,
          status: backendStatus
        });

        // Return the resolved status so caller can act on it
        return backendStatus;
      }

      // Don't invalidate accounts query here - it causes infinite loops
      // Accounts will be invalidated after trade operations, not during sync
      return account.status || null;
    } catch (error) {
      console.error('❌ Failed to sync account data from backend:', error);
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
  }, [selectedAccount?.isDemo, queryClient, account.status, lastLocalUpdateRef]); // Added lastLocalUpdateRef to dependencies

  // Fetch trades for selected account
  // IMPORTANT: Don't default to [] - use undefined so we can detect when data hasn't loaded yet
  const { data: backendTrades, isLoading: isLoadingTrades, error: tradesError, isFetching: isFetchingTrades } = useQuery({
    queryKey: ['trades', selectedAccountId],
    queryFn: async () => {
      if (!selectedAccountId) return [];
      try {
        const trades = await getAccountTrades(selectedAccountId);
        // Debug: Log raw backend response to see what fields are returned
        console.log('🔍 [Backend Trades] Raw response from backend:', trades);
        if (trades && trades.length > 0) {
          console.log('🔍 [Backend Trades] First trade fields:', Object.keys(trades[0]));
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
                breachDrawdownPercentOverall: trade.breachDrawdownPercentOverall,
              });
            }
          });
        }
        devLog('📥 Fetched trades from backend for account:', selectedAccountId, 'Count:', trades?.length || 0);
        return trades || [];
      } catch (error) {
        console.error('Failed to fetch trades:', error);
        // Don't show error toast for initial load, only log
        if (error.response?.status !== 404) {
          devWarn('Trade fetch error:', error.message);
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

  // CRITICAL: tradeHistory is now computed from backendTrades query data, not local state
  // This ensures History tab re-renders immediately when query cache updates
  // Must be defined AFTER backendTrades query is declared
  const tradeHistory = React.useMemo(() => {
    // If demo account, return demo closed trades
    if (selectedAccount?.isDemo) {
      return demoClosedTrades;
    }

    const backendClosedTrades = (backendTrades || [])
      .filter(trade => trade.closePrice !== null && trade.closePrice !== undefined)
      .map(trade => {
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
          closeTime: trade.closedAt ? new Date(trade.closedAt).toISOString() : new Date().toISOString(),
          pnl: trade.profit || 0,
          breachTriggered: trade.breachTriggered === true || trade.breachTriggered === 1 || String(trade.breachTriggered) === 'true',
          breachType: trade.breachType || null,
          breachUnrealizedPnl: (trade.breachUnrealizedPnl !== null && trade.breachUnrealizedPnl !== undefined) ? trade.breachUnrealizedPnl : null,
          breachDrawdownPercentDaily: trade.breachDrawdownPercentDaily ?? null,
          breachDrawdownPercentOverall: trade.breachDrawdownPercentOverall ?? null,
          closeReason: trade.closeReason || null,
        };
      });

    // Merge optimistic trades with backend trades, removing duplicates
    const backendTradeIds = new Set(backendClosedTrades.map(t => t.id));
    const uniqueOptimisticTrades = optimisticClosedTrades.filter(t => !backendTradeIds.has(t.id));

    return [...uniqueOptimisticTrades, ...backendClosedTrades];
  }, [backendTrades, selectedAccountId, selectedAccount?.isDemo, demoClosedTrades, optimisticClosedTrades]);

  // Extract breach snapshot from trades and store in sessionStorage for progress bars
  // This runs whenever trades are updated, ensuring progress bars always have the latest breach snapshot
  useEffect(() => {
    if (!selectedAccountId || !backendTrades || !Array.isArray(backendTrades)) return;

    try {
      // Find all auto-closed trades with breach snapshots
      const autoClosedTrades = backendTrades.filter(t =>
        t.breachTriggered &&
        t.closePrice !== null &&
        (t.closeReason === 'RISK_AUTO_CLOSE' ||
          t.closeReason === 'risk_auto_close' ||
          String(t.closeReason || '').toUpperCase() === 'RISK_AUTO_CLOSE')
      );

      if (autoClosedTrades.length > 0) {
        // Get the most recent auto-closed trade (sorted by breachAt or closedAt)
        const mostRecentBreachTrade = autoClosedTrades.sort((a, b) => {
          const aTime = a.breachAt ? new Date(a.breachAt).getTime() : (a.closedAt ? new Date(a.closedAt).getTime() : 0);
          const bTime = b.breachAt ? new Date(b.breachAt).getTime() : (b.closedAt ? new Date(b.closedAt).getTime() : 0);
          return bTime - aTime;
        })[0];

        // Store breach snapshot drawdown values in sessionStorage for progress bars
        if (typeof window !== 'undefined') {
          if (mostRecentBreachTrade.breachDrawdownPercentDaily !== null &&
            mostRecentBreachTrade.breachDrawdownPercentDaily !== undefined &&
            Number.isFinite(mostRecentBreachTrade.breachDrawdownPercentDaily)) {
            sessionStorage.setItem(`violation:${selectedAccountId}:daily_dd`, mostRecentBreachTrade.breachDrawdownPercentDaily.toString());
            devLog('💾 [TRADE BREACH] Extracted daily drawdown from trade breach snapshot:', mostRecentBreachTrade.breachDrawdownPercentDaily);
          }

          if (mostRecentBreachTrade.breachDrawdownPercentOverall !== null &&
            mostRecentBreachTrade.breachDrawdownPercentOverall !== undefined &&
            Number.isFinite(mostRecentBreachTrade.breachDrawdownPercentOverall)) {
            sessionStorage.setItem(`violation:${selectedAccountId}:overall_dd`, mostRecentBreachTrade.breachDrawdownPercentOverall.toString());
            sessionStorage.setItem(`violation:${selectedAccountId}:snapshot_overall_dd`, mostRecentBreachTrade.breachDrawdownPercentOverall.toString());
            devLog('💾 [TRADE BREACH] Extracted overall drawdown from trade breach snapshot:', mostRecentBreachTrade.breachDrawdownPercentOverall);
          }
        }
      }
    } catch (error) {
      devLog('⚠️ Error extracting breach snapshot from trades:', error);
    }
  }, [backendTrades, selectedAccountId]);

  // Fetch pending orders from backend
  const { data: backendPendingOrders, isLoading: isLoadingPendingOrders } = useQuery({
    queryKey: ['pending-orders', selectedAccountId],
    queryFn: async () => {
      if (!selectedAccountId) return [];
      try {
        const orders = await getPendingOrders(selectedAccountId);
        devLog('📥 Fetched pending orders from backend for account:', selectedAccountId, 'Count:', orders?.length || 0);
        return orders || [];
      } catch (error) {
        console.error('Failed to fetch pending orders:', error);
        if (error.response?.status !== 404) {
          devWarn('Pending orders fetch error:', error.message);
        }
        return [];
      }
    },
    enabled: !!selectedAccountId && hasValidAccount && !selectedAccount?.isDemo,
    refetchOnWindowFocus: false,
    retry: 2,
    retryDelay: 1000,
    staleTime: 0,
  });

  // WebSocket integration for real-time position closure notifications
  const { isConnected: wsConnected, connectionStatus: wsConnectionStatus } = useTradingWebSocket({
    accountId: selectedAccountId,
    onPositionClosed: useCallback((event) => {
      devLog('🔔 [WebSocket] Position closed event:', event);

      // Remove position from state immediately (optimistic update)
      setPositions(prev => {
        const filtered = prev.filter(p => p.id !== event.tradeId);
        devLog('⚡ [WebSocket] Removed position from state:', event.tradeId, 'Remaining:', filtered.length);
        return filtered;
      });

      // Play sound notification
      playClosureAlert(event.closeReason);

      // Show toast notification with appropriate styling
      const isProfit = event.profit >= 0;
      const closeReasonText = event.closeReason === 'SL_HIT'
        ? t('terminal.stopLossHit', 'Stop Loss Hit')
        : event.closeReason === 'TP_HIT'
          ? t('terminal.takeProfitHit', 'Take Profit Hit')
          : t('terminal.positionClosed', 'Position Closed');

      // Translate trade type (BUY/SELL)
      const tradeTypeText = event.type === 'BUY' || event.type === 'buy'
        ? t('terminal.positions.buy', 'BUY')
        : t('terminal.positions.sell', 'SELL');

      toast({
        title: closeReasonText,
        description: `${tradeTypeText} ${event.symbol} ${t('terminal.closedAt', 'closed at')} ${event.closePrice.toFixed(4)} - ${t('dashboard.pl', 'P/L')}: ${isProfit ? '+' : ''}$${Math.abs(event.profit).toFixed(2)}`,
        variant: isProfit ? 'success' : 'destructive',
        duration: event.closeReason === 'SL_HIT' ? 10000 : 6000, // Longer duration for stop loss
      });

      // Refetch trades to sync with backend
      queryClient.invalidateQueries({ queryKey: ['trades', selectedAccountId] });

      // Also refetch account data to update balance/equity
      const userId = lastValidUserIdRef.current || user?.userId;
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['trading-accounts', userId] });
      }

      // Sync account from backend to ensure metrics are updated
      if (selectedAccountId) {
        syncAccountFromBackend(selectedAccountId, false, false).catch(err => {
          devWarn('Failed to sync account after WebSocket position close:', err);
        });
      }
    }, [selectedAccountId, queryClient, toast, t, syncAccountFromBackend]),

    onAccountStatusChange: useCallback((event) => {
      devLog('🔔 [WebSocket] Account status changed:', event);

      // Show toast for account status changes
      toast({
        title: t('terminal.accountStatusChanged', 'Account Status Changed'),
        description: `Status: ${event.status}${event.reason ? ` - ${event.reason}` : ''}`,
        variant: event.status === 'ACTIVE' ? 'default' : 'destructive',
        duration: 8000,
      });

      // Refetch account data
      const userId = lastValidUserIdRef.current || user?.userId;
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['trading-accounts', userId] });
      }
    }, [queryClient, toast, t]),
  });

  // Store WebSocket connection status for UI display
  const [websocketStatus, setWebsocketStatus] = useState({
    connected: false,
    status: 'disconnected',
  });

  useEffect(() => {
    setWebsocketStatus({
      connected: wsConnected,
      status: wsConnectionStatus,
    });
  }, [wsConnected, wsConnectionStatus]);

  // Fallback polling mechanism: Check for closed positions every 5 seconds
  // This ensures positions are removed even if WebSocket fails
  useEffect(() => {
    if (!selectedAccountId || selectedAccount?.isDemo) {
      return; // Skip for demo accounts
    }

    const pollInterval = setInterval(async () => {
      try {
        // Get current open positions from state
        const currentPositionIds = new Set(positions.map(p => p.id));

        if (currentPositionIds.size === 0) {
          return; // No positions to check
        }

        // Fetch latest trades from backend
        const backendTrades = queryClient.getQueryData(['trades', selectedAccountId]);

        if (!backendTrades || !Array.isArray(backendTrades)) {
          return;
        }

        // Find positions that are in our state but closed in backend
        const backendOpenIds = new Set(
          backendTrades
            .filter(t => !t.closePrice && t.closePrice === null)
            .map(t => t.id)
        );

        // Check for positions that were closed on backend but still in frontend state
        const closedPositionIds = [];
        for (const posId of currentPositionIds) {
          if (!backendOpenIds.has(posId)) {
            // This position exists in frontend but not in backend open positions
            // It was likely closed by the backend
            const backendTrade = backendTrades.find(t => t.id === posId);
            if (backendTrade && backendTrade.closePrice) {
              closedPositionIds.push({
                id: posId,
                trade: backendTrade
              });
            }
          }
        }

        // Remove closed positions from state and show notifications
        if (closedPositionIds.length > 0) {
          devLog('🔄 [Fallback Polling] Detected', closedPositionIds.length, 'closed positions');

          closedPositionIds.forEach(({ id, trade }) => {
            // Remove from state
            setPositions(prev => prev.filter(p => p.id !== id));

            // Play sound notification
            playClosureAlert(trade.closeReason);

            // Show notification
            const isProfit = (trade.profit || 0) >= 0;
            const closeReasonText = trade.closeReason === 'SL_HIT'
              ? t('terminal.stopLossHit', 'Stop Loss Hit')
              : trade.closeReason === 'TP_HIT'
                ? t('terminal.takeProfitHit', 'Take Profit Hit')
                : t('terminal.positionClosed', 'Position Closed');

            // Translate trade type (BUY/SELL)
            const tradeTypeText = trade.type === 'BUY' || trade.type === 'buy'
              ? t('terminal.positions.buy', 'BUY')
              : t('terminal.positions.sell', 'SELL');

            toast({
              title: closeReasonText,
              description: `${tradeTypeText} ${trade.symbol} ${t('terminal.closedAt', 'closed at')} ${trade.closePrice.toFixed(4)} - ${t('dashboard.pl', 'P/L')}: ${isProfit ? '+' : ''}$${Math.abs(trade.profit || 0).toFixed(2)}`,
              variant: isProfit ? 'success' : 'destructive',
              duration: trade.closeReason === 'SL_HIT' ? 10000 : 8000, // Longer duration for stop loss
            });
          });

          // Refetch account data to update balance
          const userId = lastValidUserIdRef.current || user?.userId;
          if (userId) {
            queryClient.invalidateQueries({ queryKey: ['trading-accounts', userId] });
          }

          // Sync account from backend
          if (selectedAccountId) {
            syncAccountFromBackend(selectedAccountId, false, false).catch(err => {
              devWarn('Failed to sync account after fallback polling:', err);
            });
          }
        }
      } catch (error) {
        devWarn('Fallback polling error:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [positions, selectedAccountId, selectedAccount?.isDemo, queryClient, toast, t, syncAccountFromBackend]);

  // Update account when selected account changes - allow demo account too
  useEffect(() => {
    if (selectedAccount) {
      // Only reset positions if we're actually switching to a DIFFERENT account
      const isNewAccount = lastAccountId !== null && lastAccountId !== selectedAccount.id;

      let newBalance = selectedAccount.current_balance || selectedAccount.initial_balance || 100000;
      let newEquity = selectedAccount.current_equity || selectedAccount.current_balance || 100000;

      // Special handling for demo account data loading
      if (selectedAccount.isDemo) {
        const demoData = loadDemoAccountTrades();
        newBalance = demoData.balance;
        newEquity = demoData.equity;

        // Update local states for demo account
        if (isNewAccount || lastAccountId === null) {
          setPositions(demoData.positions);
          setDemoClosedTrades(demoData.closedTrades);
          setDemoPendingOrders(demoData.pendingOrders);
        }
      }

      // Initialize daily starting balance on first load
      const today = new Date().toDateString();
      if (dailyStartBalanceRef.current === null) {
        currentDayRef.current = today;
        dailyStartBalanceRef.current = newBalance;
      }
      // Reset on new day
      if (currentDayRef.current !== today) {
        currentDayRef.current = today;
        dailyStartBalanceRef.current = newBalance;
      }

      // Get challenge rules for max drawdown limits
      const challenge = selectedAccount.challenge || {};
      const maxDailyDD = challenge.dailyDrawdownPercent || selectedAccount.max_daily_drawdown || 5;
      const maxOverallDD = challenge.overallDrawdownPercent || selectedAccount.max_overall_drawdown || 10;

      // Calculate days elapsed from account creation (for real accounts only)
      const accountFromBackend = allAccountsData.find(acc => acc.id === selectedAccount.id);
      const accountCreatedAt = accountFromBackend?.createdAt || accountFromBackend?.created_date;
      const daysElapsed = selectedAccount.isDemo
        ? 15 // Keep hardcoded for demo account
        : accountCreatedAt
          ? Math.floor((new Date().getTime() - new Date(accountCreatedAt).getTime()) / (1000 * 60 * 60 * 24))
          : 0;

      setAccount(prev => {
        // PROTECTION: Prevent stale backend data from overwriting optimistic balance during account switch
        const now = Date.now();
        const isRecentlyUpdated = now - lastLocalUpdateRef.current < 3000;

        let finalBalance = newBalance;
        let finalEquity = newEquity;

        if (isRecentlyUpdated && lastLocalBalanceRef.current !== null && !isNewAccount) {
          if (Math.abs(newBalance - lastLocalBalanceRef.current) > 0.01) {
            devLog('🛡️ [Switch] Protected optimistic balance:', newBalance, '->', lastLocalBalanceRef.current);
            finalBalance = lastLocalBalanceRef.current;
            finalEquity = lastLocalBalanceRef.current; // Assume no positions if balance was just updated
          }
        }

        return {
          ...prev,
          balance: finalBalance,
          equity: finalEquity,
          startingBalance: selectedAccount.initial_balance || 100000,
          highestBalance: selectedAccount.highest_balance || selectedAccount.initial_balance || 100000,
          profitPercent: Math.max(prev.profitPercent ?? 0, selectedAccount.current_profit_percent || 0),
          // CRITICAL: Don't reset dailyDrawdown - preserve it until syncAccountFromBackend updates it
          // If we reset here, we lose the value set by sync!
          dailyDrawdown: prev.dailyDrawdown, // Keep existing value
          overallDrawdown: selectedAccount.overall_drawdown_percent || prev.overallDrawdown || 0,
          maxDailyDrawdown: maxDailyDD, // Load from challenge rules
          maxOverallDrawdown: maxOverallDD, // Load from challenge rules
          tradingDays: Math.max(selectedAccount.trading_days_count || 0, prev.tradingDays || 0),
          minTradingDays: selectedAccount.min_trading_days || challenge.minTradingDays || prev.minTradingDays || 5,
          daysRemaining: selectedAccount.days_remaining !== undefined ? selectedAccount.days_remaining : (prev.daysRemaining !== undefined ? prev.daysRemaining : Math.max(0, (challenge.maxTradingDays || 30) - (daysElapsed || 0))),
          daysElapsed: daysElapsed,
          margin: selectedAccount.margin_used !== undefined ? selectedAccount.margin_used : prev.margin,
          freeMargin: selectedAccount.free_margin !== undefined ? selectedAccount.free_margin : prev.freeMargin,
          phase: selectedAccount.current_phase || 'phase1',
          accountNumber: selectedAccount.account_number,
          platform: selectedAccount.platform || 'MT5',
          status: selectedAccount.status || prev.status || 'ACTIVE' // Preserve status or default to ACTIVE
        };
      });

      // Only reset positions when switching to a different account
      if (isNewAccount) {
        devLog('🔄 Switching to new account:', selectedAccount.id, 'from:', lastAccountId);
        setIsAccountLoading(true);
        setPositions([]);
        setPendingOrders([]);
        // Abort any active trade polling when switching accounts
        activeTradePollRef.current.aborted = true;
        activeTradePollRef.current.accountId = null;
        setAccountFailed(false);
        setHasTriggeredWarning(false);
        setHasTriggeredViolation(false);
        // Reset flag to allow loading trades for new account
        // This will trigger the trade loading useEffect to run
        tradesLoadedForAccountRef.current = null;

        // Reset daily starting balance for new account
        const today = new Date().toDateString();
        currentDayRef.current = today;
        dailyStartBalanceRef.current = newBalance;

        // Reset drawdowns when switching accounts (will be updated by syncAccountFromBackend)
        // This is correct because each account has its own drawdown values
        setAccount(prev => ({
          ...prev,
          dailyDrawdown: 0,
          overallDrawdown: 0,
        }));
        // Also reset prevMetricsRef so the "only increase" logic starts fresh for new account
        prevMetricsRef.current = {
          equity: 0,
          floatingPnL: 0,
          profitPercent: 0,
          overallDrawdown: 0,
          dailyDrawdown: 0,
        };
      }

      setLastAccountId(selectedAccount.id);

      // Step 3: Sync account data from backend when switching accounts (for real accounts)
      // CRITICAL FIX: Sync on FIRST load (lastAccountId === null) OR when switching to a different account
      const shouldSync = !selectedAccount.isDemo && selectedAccount.id &&
        (lastAccountId === null || isNewAccount);
      if (shouldSync) {
        devLog('📊 Triggering account sync - first load or account switch');
        syncAccountFromBackend(selectedAccount.id, true, true);
      }
    }
  }, [selectedAccount, lastAccountId]); // Removed allAccountsData and syncAccountFromBackend to prevent loops

  // Reset loading flag and refetch trades when account changes
  // This ensures trades reload when switching accounts
  // Also aborts any active trade polling to prevent race conditions
  useEffect(() => {
    // Reset the loading flag whenever account changes to allow fresh loading
    if (selectedAccountId) {
      const previousAccountId = tradesLoadedForAccountRef.current;
      // If switching to a different account, reset the flag and invalidate query
      if (previousAccountId !== null && previousAccountId !== selectedAccountId) {
        devLog('🔄 Account changed from', previousAccountId, 'to', selectedAccountId, '- resetting trade loading flag');
        tradesLoadedForAccountRef.current = null; // Reset to allow loading

        // Abort any active trade polling for the previous account
        activeTradePollRef.current.aborted = true;
        activeTradePollRef.current.accountId = null;

        // Explicitly invalidate and refetch trades for the new account
        if (!selectedAccount?.isDemo) {
          queryClient.invalidateQueries({ queryKey: ['trades', selectedAccountId] });
        }
      }
    }
  }, [selectedAccountId, selectedAccount?.isDemo, queryClient]);

  // Load trades from backend and map to frontend format
  useEffect(() => {
    // Skip if no account selected or demo account
    if (!selectedAccountId || selectedAccount?.isDemo) {
      // If demo account or no account, ensure positions are cleared
      if (selectedAccount?.isDemo || !selectedAccountId) {
        if (tradesLoadedForAccountRef.current !== selectedAccountId) {
          setPositions([]);
          // Abort any active trade polling when switching accounts
          activeTradePollRef.current.aborted = true;
          activeTradePollRef.current.accountId = null;
          tradesLoadedForAccountRef.current = selectedAccountId;
        }
      }
      return;
    }

    // CRITICAL: Wait for query to finish loading before processing
    // This prevents processing empty array before real data arrives
    if (isLoadingTrades || isFetchingTrades) {
      devLog('⏳ Waiting for trades to load for account:', selectedAccountId);
      return; // Don't process until query completes
    }

    // Check if we should load trades
    const accountChanged = tradesLoadedForAccountRef.current !== null &&
      tradesLoadedForAccountRef.current !== selectedAccountId;

    // Skip if already loaded for this EXACT account (prevents re-loading on re-renders)
    // But always allow loading if account changed (handles account switching)
    if (!accountChanged && tradesLoadedForAccountRef.current === selectedAccountId) {
      // Already loaded for this account - but if backendTrades is undefined, it means query hasn't run yet
      // So we should wait
      if (backendTrades === undefined) {
        return;
      }
      // If we have data and already loaded, skip (unless data changed)
      return;
    }

    // If backendTrades is undefined, it means query hasn't completed yet
    // Wait for it (we already checked isLoading/isFetching above, but double-check)
    if (backendTrades === undefined) {
      devLog('⏳ Trades data not available yet for account:', selectedAccountId);
      return;
    }

    // Mark as loading for this account BEFORE processing
    tradesLoadedForAccountRef.current = selectedAccountId;

    // Now process the trades
    const tradesArray = Array.isArray(backendTrades) ? backendTrades : [];
    devLog('🔄 Processing trades from backend for account:', selectedAccountId, 'Total trades:', tradesArray.length);

    // Separate open and closed trades
    const openTrades = [];
    const closedTrades = [];

    tradesArray.forEach(trade => {
      // Map backend trade to frontend position format
      const mappedPosition = {
        id: trade.id, // Use backend ID
        symbol: trade.symbol,
        type: trade.type.toLowerCase(), // Convert BUY/SELL to buy/sell
        lotSize: trade.volume, // volume = lotSize
        entryPrice: trade.openPrice,
        stopLoss: trade.stopLoss ?? null, // Use backend SL/TP values
        takeProfit: trade.takeProfit ?? null,
        openTime: new Date(trade.openedAt).toISOString(),
      };

      // If trade has closePrice, it's closed
      if (trade.closePrice !== null && trade.closePrice !== undefined) {
        closedTrades.push({
          ...mappedPosition,
          closePrice: trade.closePrice,
          closeTime: trade.closedAt ? new Date(trade.closedAt).toISOString() : new Date().toISOString(),
          pnl: trade.profit || 0,
        });
      } else {
        // Open trade - add to positions
        openTrades.push(mappedPosition);
      }
    });

    // IMPORTANT: Replace positions completely (don't merge) to avoid duplicates and ensure backend is source of truth
    devLog(`✅ Loaded ${openTrades.length} open positions and ${closedTrades.length} closed trades`);

    // Replace positions completely - backend is the source of truth
    setPositions(openTrades);

    // Trade history is now computed from backendTrades via useMemo, no need to set state
    // If no trades found, ensure positions are cleared
    if (openTrades.length === 0 && closedTrades.length === 0) {
      devLog('⚠️ No trades found in backend for account:', selectedAccountId, '- clearing positions');
      setPositions([]);
    }
  }, [backendTrades, selectedAccountId, selectedAccount?.isDemo, isLoadingTrades, isFetchingTrades]);

  // Load pending orders from backend and map to frontend format
  useEffect(() => {
    // If demo account, use demo pending orders state
    if (selectedAccount?.isDemo) {
      setPendingOrders(demoPendingOrders);
      return;
    }

    // Skip if no account selected
    if (!selectedAccountId) {
      setPendingOrders([]);
      return;
    }

    // Wait for query to finish loading
    if (isLoadingPendingOrders) {
      devLog('⏳ Waiting for pending orders to load for account:', selectedAccountId);
      return;
    }

    // If backendPendingOrders is undefined, wait for it
    if (backendPendingOrders === undefined) {
      return;
    }

    // Map backend pending orders to frontend format
    const ordersArray = Array.isArray(backendPendingOrders) ? backendPendingOrders : [];
    devLog('🔄 Processing pending orders from backend for account:', selectedAccountId, 'Total orders:', ordersArray.length);

    const mappedOrders = ordersArray
      .filter(order => order.status === 'PENDING') // Only include pending orders
      .map(order => ({
        id: order.id, // Use backend ID
        symbol: order.symbol,
        type: order.type.toLowerCase(), // Convert BUY/SELL to buy/sell
        lotSize: order.volume,
        limitPrice: order.price,
        stopLoss: order.stopLoss ?? null,
        takeProfit: order.takeProfit ?? null,
        createdTime: new Date(order.createdAt).toISOString(),
        status: order.status.toLowerCase(),
      }));

    devLog(`✅ Loaded ${mappedOrders.length} pending orders from backend`);
    setPendingOrders(mappedOrders);
  }, [backendPendingOrders, selectedAccountId, selectedAccount?.isDemo, isLoadingPendingOrders]);

  // Use unified price context - prices update every 800ms
  // unifiedPrices format: { symbol: { bid: number, ask: number, price: number, timestamp: number } }

  // Initialize prevPricesRef with unified prices when they change
  useEffect(() => {
    if (Object.keys(unifiedPrices).length > 0) {
      prevPricesRef.current = { ...unifiedPrices };
    }
  }, [unifiedPrices]);

  // Handle price updates from chart - now uses unified price context
  // Chart can still trigger updates, but unified context is the source of truth
  const handlePriceUpdate = useCallback((symbolName, price) => {
    // Unified price context handles all updates - chart updates are already included
    // This callback is kept for backward compatibility but doesn't need to do anything
    // since unifiedPrices already contains the latest prices
  }, []);

  // Helper function to check if symbol is crypto
  const isCryptoSymbol = useCallback((symbolName) => {
    return symbolName.includes('BTC') || symbolName.includes('ETH') ||
      symbolName.includes('SOL') || symbolName.includes('XRP') ||
      symbolName.includes('ADA') || symbolName.includes('DOGE');
  }, []);

  // Helper function to calculate P/L for a position
  const calculatePositionPnL = useCallback((pos, currentPrice) => {
    const price = currentPrice || pos.entryPrice;
    const priceDiff = pos.type === 'buy'
      ? price - pos.entryPrice
      : pos.entryPrice - price;

    // For crypto - lotSize represents actual units (e.g., 0.5 BTC)
    // P/L = priceDiff * lotSize
    if (isCryptoSymbol(pos.symbol)) {
      const pnl = priceDiff * pos.lotSize;
      // Debug logging (dev only)
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[PnL Debug - Crypto] ${pos.symbol} ${pos.type}: entry=${pos.entryPrice}, current=${price}, priceDiff=${priceDiff}, lotSize=${pos.lotSize}, pnl=$${pnl.toFixed(2)}`);
      }
      return pnl;
    }

    // For forex - use standard lot calculation (100,000 units per lot)
    // IMPORTANT: lotSize represents LOTS (e.g., 10 = 10 lots), NOT units
    // P/L = priceDiff * lotSize * contractSize
    const contractSize = 100000;
    const pnl = priceDiff * pos.lotSize * contractSize;

    // Debug logging (dev only) - helps identify scaling issues
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[PnL Debug - Forex] ${pos.symbol} ${pos.type}: entry=${pos.entryPrice.toFixed(5)}, current=${price.toFixed(5)}, priceDiff=${priceDiff.toFixed(5)}, lotSize=${pos.lotSize} lots, contractSize=${contractSize}, pnl=$${pnl.toFixed(2)}`);
    }

    return pnl;
  }, [isCryptoSymbol]);

  // Use unified price context for positions - prices update every 800ms automatically
  // Send price ticks to backend for violation checking when prices update
  useEffect(() => {
    if (positions.length === 0 || !selectedAccountId || selectedAccount?.isDemo || account.status !== 'ACTIVE') {
      return;
    }

    // Get unique symbols from all open positions
    const positionSymbols = [...new Set(positions.map(pos => pos.symbol))];

    if (positionSymbols.length === 0) return;

    // When unified prices update, send price ticks to backend for violation checking
    positionSymbols.forEach(symbol => {
      const priceData = unifiedPrices[symbol];

      if (priceData && priceData.bid !== undefined && priceData.ask !== undefined) {
        const throttleKey = `${selectedAccountId}-${symbol}`;
        const lastTickTime = priceTickThrottleRef.current[throttleKey] || 0;
        const now = Date.now();

        // Throttle: Only send tick if 1000ms have passed since last tick for this symbol
        if (now - lastTickTime >= 1000) {
          priceTickThrottleRef.current[throttleKey] = now;

          // Send price tick to backend - triggers immediate evaluation and auto-close if needed
          processPriceTick(selectedAccountId, symbol, priceData.bid, priceData.ask, priceData.timestamp || now)
            .then(response => {
              if (response.statusChanged) {
                console.log(`⚠️ [Price-Tick] Limit breached! ${response.positionsClosed} positions auto-closed. Status: ${response.accountStatus}`);

                // CRITICAL: Compute and store breach snapshot (atomic, before any close/refetch)
                const currentEquity = account.balance + (positions.reduce((sum, pos) => {
                  const price = unifiedPrices[pos.symbol];
                  if (!price) return sum;
                  const currentPrice = typeof price === 'object'
                    ? (pos.type === 'buy' ? price.bid : price.ask)
                    : price;
                  return sum + calculatePositionPnL(pos, currentPrice);
                }, 0));
                const snapshotOverallDD = computeBreachSnapshotOverallDD({ drawdownPercent: response.violationOverallDrawdown }, currentEquity);
                if (snapshotOverallDD !== null && snapshotOverallDD > 0 && typeof window !== 'undefined') {
                  sessionStorage.setItem(`violation:${selectedAccountId}:snapshot_overall_dd`, snapshotOverallDD.toString());
                  devLog('💾 [ATOMIC SNAPSHOT] [Price-Tick] Stored overall drawdown at breach moment:', snapshotOverallDD);
                }

                // If positions were auto-closed, poll trades until they appear in history
                if (response.positionsClosed > 0) {
                  const beforeTrades = queryClient.getQueryData(['trades', selectedAccountId]) || [];
                  const beforeMarker = {
                    tradeCount: Array.isArray(beforeTrades) ? beforeTrades.length : 0,
                    closedCount: Array.isArray(beforeTrades) ? beforeTrades.filter(t => t.closedAt || t.closePrice).length : 0,
                    latestTradeTimestamp: Array.isArray(beforeTrades) && beforeTrades.length > 0
                      ? (beforeTrades[0].closedAt || beforeTrades[0].closeTime || beforeTrades[0].openedAt)
                      : null,
                  };

                  queryClient.invalidateQueries({ queryKey: ['trades', selectedAccountId] });
                  queryClient.invalidateQueries({
                    queryKey: ['trades'],
                    predicate: (query) => {
                      const queryKey = query.queryKey;
                      return queryKey.includes(selectedAccountId) ||
                        (Array.isArray(queryKey[1]) && queryKey[1].includes(selectedAccountId));
                    }
                  });

                  refetchTradesUntilSettled(selectedAccountId, beforeMarker).catch(err => {
                    devWarn('Price-tick trade polling error:', err);
                  });
                }

                // Store violation values and show modal
                if (response.violationType) {
                  if (response.violationDailyDrawdown !== undefined) {
                    sessionStorage.setItem(`violation:${selectedAccountId}:daily_dd`, response.violationDailyDrawdown.toString());
                  }
                  if (response.violationOverallDrawdown !== undefined) {
                    sessionStorage.setItem(`violation:${selectedAccountId}:overall_dd`, response.violationOverallDrawdown.toString());
                  }

                  setViolationModal({
                    type: response.violationType,
                    shown: true,
                  });
                }

                setPositions([]);
                queryClient.refetchQueries({ queryKey: ['trades', selectedAccountId] });
                queryClient.refetchQueries({ queryKey: ['account-summary', selectedAccountId] });
                syncAccountFromBackend(selectedAccountId, true, false);
              }
            })
            .catch(err => {
              if (process.env.NODE_ENV !== 'production') {
                console.warn(`[Price-Tick] Failed for ${symbol}:`, err.message);
              }
            });
        }
      }
    });
  }, [unifiedPrices, positions, selectedAccountId, selectedAccount?.isDemo, account.status, queryClient, syncAccountFromBackend, calculatePositionPnL]);

  // Helper function to get the correct price for a position type
  // BUY positions close by SELLING → use BID price
  // SELL positions close by BUYING → use ASK price
  const getPriceForPosition = useCallback((symbol, positionType, fallbackPrice = null) => {
    const priceData = unifiedPrices[symbol];
    let price;

    if (priceData && typeof priceData === 'object') {
      // BUY position closes by SELLING → use BID
      // SELL                              closes by BUYING → use ASK
      price = positionType === 'buy' ? priceData.bid : priceData.ask;
    } else {
      // Backward compatibility: if it's a simple number, use it
      // Or use fallback if no price data
      price = priceData || fallbackPrice;
    }

    // Ensure we always return a valid number
    if (typeof price !== 'number' || isNaN(price)) {
      return fallbackPrice || 0;
    }

    return price;
  }, [unifiedPrices]);

  // Helper function to close a position and update backend
  const closePositionWithBackendUpdate = useCallback(async (position, showToast = true) => {
    // Use the correct price side (bid for BUY, ask for SELL)
    const currentPrice = getPriceForPosition(position.symbol, position.type, position.entryPrice);
    const pnl = calculatePositionPnL(position, currentPrice);

    // Debug logging for position close (dev only)
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[Close Position Debug] ${position.symbol} ${position.type.toUpperCase()}`);
      console.log(`  Entry Price: ${position.entryPrice}`);
      console.log(`  Close Price (${position.type === 'buy' ? 'BID' : 'ASK'}): ${currentPrice}`);
      console.log(`  Lot Size: ${position.lotSize}`);
      console.log(`  Realized P/L: $${pnl.toFixed(2)}`);
      console.log(`  Balance Before: $${account.balance.toFixed(2)}`);
      console.log(`  Balance After: $${(account.balance + pnl).toFixed(2)}`);
    }

    // Check if position has a backend ID
    // Exclude temporary IDs (temp_, pos_, order_) - these are local-only positions
    const hasBackendId = position.id &&
      !position.id.startsWith('temp_') &&
      !position.id.startsWith('pos_') &&
      !position.id.startsWith('order_');

    // OPTIMISTIC UPDATE: Remove from positions and add to history immediately
    // This makes the UI feel instant while backend processes in background
    const closedTrade = {
      ...position,
      closePrice: currentPrice,
      closeTime: new Date().toISOString(),
      pnl: pnl,
      stopLoss: position.stopLoss ?? null,
      takeProfit: position.takeProfit ?? null,
    };

    // Remove from positions immediately (optimistic update)
    setPositions(prev => {
      devLog('⚡ Optimistically removing position:', position.id);
      const newPositions = prev.filter(p => p.id !== position.id);

      // If demo, also persist immediately
      if (selectedAccount?.isDemo) {
        const newClosedTrades = [...demoClosedTrades, closedTrade];
        setDemoClosedTrades(newClosedTrades);
        saveDemoAccountTrades(newPositions, newClosedTrades, demoPendingOrders, optimisticNewBalance, optimisticNewBalance);
      }

      return newPositions;
    });

    // OPTIMISTIC BALANCE UPDATE: Update local balance immediately
    const optimisticNewBalance = account.balance + pnl;
    lastLocalUpdateRef.current = Date.now();
    lastLocalBalanceRef.current = optimisticNewBalance;

    // Add to optimistic closed trades to show in history immediately
    setOptimisticClosedTrades(prev => {
      // Avoid duplicates
      if (prev.some(t => t.id === position.id)) return prev;
      return [closedTrade, ...prev];
    });

    setAccount(prev => ({
      ...prev,
      balance: optimisticNewBalance,
      equity: optimisticNewBalance, // Equity resets to balance when no positions
      floatingPnL: 0,
    }));

    devLog('⚡ Optimistically updated balance:', account.balance, '->', optimisticNewBalance);

    // If demo, we are done
    if (selectedAccount?.isDemo) {
      if (showToast) {
        toast({
          title: t('terminal.positionClosed'),
          description: `${position.type.toUpperCase()} ${position.lotSize} ${position.symbol} - P/L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`,
        });
      }
      return;
    }

    // If position has backend ID, update it in backend in the background (for real accounts)
    if (hasBackendId) {
      try {
        devLog('🔄 Closing position in backend (background):', {
          positionId: position.id,
          symbol: position.symbol,
          closePrice: currentPrice,
          profit: pnl,
          accountId: selectedAccountId
        });

        // Include SL/TP values to ensure they're preserved when closing
        // Backend will preserve them anyway, but explicitly including them ensures they're saved
        const response = await updateTrade(position.id, {
          closePrice: currentPrice,
          profit: pnl,
          stopLoss: position.stopLoss ?? null, // Preserve SL value
          takeProfit: position.takeProfit ?? null, // Preserve TP value
        });
        devLog('✅ Trade closed in backend:', response);

        // Trade history is now computed from backendTrades query, no manual update needed
        // Force immediate refetch (not just invalidation) to ensure history updates instantly
        // Using refetchQueries with specific options to force a network request
        await queryClient.refetchQueries({
          queryKey: ['trades', selectedAccountId],
          type: 'active',
          exact: true
        });

        // Trigger settlement polling to ensure trade history tab updates
        const currentTradesData = queryClient.getQueryData(['trades', selectedAccountId]) || [];
        const marker = {
          tradeCount: Array.isArray(currentTradesData) ? currentTradesData.length : 0,
          closedCount: Array.isArray(currentTradesData) ? currentTradesData.filter(t => t.closedAt || t.closePrice).length : 0,
          latestTradeTimestamp: Date.now(),
        };

        refetchTradesUntilSettled(selectedAccountId, marker).catch(err => {
          devWarn('Settlement polling error:', err);
        });

        // Use ref to ensure we always have a valid userId
        const userId = lastValidUserIdRef.current || user?.userId;
        if (userId) {
          queryClient.refetchQueries({
            queryKey: ['trading-accounts', userId],
            type: 'active',
            exact: true
          });
        }

        // Step 3: Sync account data from backend (single source of truth) - in background
        syncAccountFromBackend(selectedAccountId, false, false).catch(err => {
          devWarn('Failed to sync account after closing position:', err);
        });
      } catch (error) {
        // Check if this is a 404 for a temp position (shouldn't happen, but handle gracefully)
        const status = error.status || error.response?.status;
        const isTempPosition = position.id && (position.id.startsWith('temp_') || position.id.includes('temp'));
        const errorMessage = error.message || error.response?.data?.message || '';
        const isAlreadyClosed = errorMessage.toLowerCase().includes('already closed') ||
          errorMessage.toLowerCase().includes('trade is already closed');

        // Handle "already closed" as success (idempotent operation) - backend auto-close may have already closed it
        if (isAlreadyClosed || (status === 409)) {
          console.log('ℹ️ Position already closed (likely auto-closed by backend) - treating as success');
          // Position is already closed - just refresh positions from backend
          await queryClient.refetchQueries({ queryKey: ['trades', selectedAccountId] });
          if (showToast) {
            toast({
              title: t('terminal.positionClosed'),
              description: `${position.type.toUpperCase()} ${position.lotSize} ${position.symbol} - Position was already closed`,
            });
          }
          return;
        }

        if (status === 404 && isTempPosition) {
          // This shouldn't happen since we check hasBackendId, but handle gracefully
          console.warn('⚠️ Attempted to close temp position via backend - removing locally instead');
          setPositions(prev => prev.filter(p => p.id !== position.id));
          if (showToast) {
            toast({
              title: t('terminal.positionClosed'),
              description: `${position.type.toUpperCase()} ${position.lotSize} ${position.symbol} - P/L: ${pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}`,
            });
          }
          return;
        }

        console.error('❌ Failed to close position in backend:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          data: error.data,
          response: error.response,
          request: error.request
        });

        // ROLLBACK: Restore position and remove from history on error
        console.log('🔄 Rolling back optimistic close - restoring position');
        setPositions(prev => {
          // Check if position already exists (avoid duplicates)
          const exists = prev.some(p => p.id === position.id);
          if (exists) {
            return prev;
          }
          return [...prev, position];
        });

        // Trade history is now computed from backendTrades query, no manual update needed
        // Query invalidation will trigger refetch and update tradeHistory automatically

        // Enhanced error handling - check both normalized error and original error structure
        // Note: 'status' is already declared above at line 966, so we reuse it
        let errorMsg = t('terminal.updateError');
        const errorData = error.data || error.response?.data;

        if (status) {
          // We have a status code - it's a server error
          if (status === 404) {
            errorMsg = t('terminal.tradeNotFound');
          } else if (status === 400) {
            errorMsg = errorData?.message || error.message || t('terminal.invalidCloseData');
          } else if (status === 409) {
            errorMsg = t('terminal.tradeAlreadyClosed');
          } else if (status === 500) {
            errorMsg = t('terminal.serverError');
          } else {
            errorMsg = errorData?.message || error.message || errorMsg;
          }
        } else if (error.request || (!error.response && !error.status)) {
          // Network error - request was made but no response received
          if (!navigator.onLine) {
            errorMsg = t('terminal.networkOffline');
          } else {
            errorMsg = t('terminal.networkError');
          }
        } else {
          // Other error
          errorMsg = error.message || errorMsg;
        }

        if (showToast) {
          toast({
            title: t('terminal.closeFailed'),
            description: errorMsg,
            variant: 'destructive',
          });
        }
      }
    }
    // Note: Local-only (temp) positions are already handled optimistically at the start
  }, [unifiedPrices, calculatePositionPnL, queryClient, selectedAccountId, user?.userId, toast, t, syncAccountFromBackend, lastValidUserIdRef, getPriceForPosition]);

  // Check pending limit orders and execute when chart price hits the exact limit price
  useEffect(() => {
    if (pendingOrders.length === 0) return;

    const ordersToExecute = [];
    const remainingOrders = [];

    pendingOrders.forEach(order => {
      // For limit orders, use bid price (market price) to check execution
      const priceData = unifiedPrices[order.symbol];
      const currentPrice = priceData && typeof priceData === 'object'
        ? priceData.bid
        : (priceData || null);

      // Ensure prevPricesRef is initialized
      if (!prevPricesRef.current) {
        prevPricesRef.current = {};
      }
      const prevPriceData = prevPricesRef.current[order.symbol];
      const prevPrice = prevPriceData && typeof prevPriceData === 'object'
        ? prevPriceData.bid
        : prevPriceData;

      if (!currentPrice) {
        remainingOrders.push(order);
        return;
      }

      let shouldExecute = false;

      // Execute when chart price crosses through or hits the limit price exactly
      // Buy limit: price must reach or go below limit price
      // Sell limit: price must reach or go above limit price
      if (prevPrice !== undefined && prevPrice !== currentPrice) {
        if (order.type === 'buy') {
          // Execute when price crosses down to or through limit price
          shouldExecute = (prevPrice > order.limitPrice && currentPrice <= order.limitPrice) ||
            (currentPrice === order.limitPrice);
        } else if (order.type === 'sell') {
          // Execute when price crosses up to or through limit price
          shouldExecute = (prevPrice < order.limitPrice && currentPrice >= order.limitPrice) ||
            (currentPrice === order.limitPrice);
        }
      }

      if (shouldExecute) {
        ordersToExecute.push(order);
      } else {
        remainingOrders.push(order);
      }
    });

    // Update previous prices for next comparison (extract bid prices for limit order checking)
    prevPricesRef.current = {};
    Object.keys(unifiedPrices).forEach(symbol => {
      const priceData = unifiedPrices[symbol];
      if (priceData && typeof priceData === 'object') {
        prevPricesRef.current[symbol] = { bid: priceData.bid, ask: priceData.ask };
      } else {
        prevPricesRef.current[symbol] = priceData;
      }
    });

    if (ordersToExecute.length > 0) {
      // Execute pending orders - save to backend first, then add to positions
      console.log(`🔄 Executing ${ordersToExecute.length} pending limit orders...`);

      // Process each order: execute via backend API (or locally for demo), then add to positions
      Promise.all(ordersToExecute.map(async (order) => {
        try {
          // Handle demo order execution
          if (order.isDemo || selectedAccount?.isDemo) {
            console.log('✅ Executing demo limit order locally:', order.id);

            const newPosition = {
              id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              symbol: order.symbol,
              type: order.type,
              lotSize: order.lotSize,
              entryPrice: order.limitPrice,
              stopLoss: order.stopLoss ?? null,
              takeProfit: order.takeProfit ?? null,
              openTime: new Date().toISOString(),
              isDemo: true
            };

            setPositions(prev => {
              const newPositions = [...prev, newPosition];
              // Persist demo data
              const newPendingOrders = demoPendingOrders.filter(o => o.id !== order.id);
              setDemoPendingOrders(newPendingOrders);
              saveDemoAccountTrades(newPositions, demoClosedTrades, newPendingOrders, account.balance, account.equity);
              return newPositions;
            });

            return;
          }

          // Execute the pending order via backend API (converts to trade)
          const response = await executePendingOrder(order.id, order.limitPrice);

          if (response?.trade?.id) {
            // Backend has already converted the pending order to a trade
            // Add position with backend trade data
            const newPosition = {
              id: response.trade.id, // Use backend trade ID
              symbol: response.trade.symbol,
              type: response.trade.type.toLowerCase(),
              lotSize: response.trade.volume,
              entryPrice: response.trade.openPrice,
              stopLoss: response.trade.stopLoss ?? null,
              takeProfit: response.trade.takeProfit ?? null,
              openTime: new Date(response.trade.openedAt).toISOString(),
            };

            setPositions(prev => {
              const exists = prev.some(p => p.id === response.trade.id);
              if (exists) return prev;
              return [...prev, newPosition];
            });

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['trades', selectedAccountId] });
            queryClient.invalidateQueries({ queryKey: ['pending-orders', selectedAccountId] });
            queryClient.invalidateQueries({ queryKey: ['trading-accounts', user?.userId] });

            // Sync account data from backend
            await syncAccountFromBackend(selectedAccountId, false, false);

            console.log(`✅ Limit order executed via backend API: ${response.trade.id}`);
          }
        } catch (error) {
          console.error('❌ Failed to execute limit order:', error);
          toast({
            title: t('terminal.orderExecutionFailed'),
            description: error.message || 'Failed to execute pending order',
            variant: 'destructive',
          });
        }
      })).then(() => {
        // Remove executed orders from pending list after all are processed
        setPendingOrders(remainingOrders);

        // Refresh pending orders from backend to ensure consistency
        queryClient.invalidateQueries({ queryKey: ['pending-orders', selectedAccountId] });
      });
    }
  }, [unifiedPrices, pendingOrders, selectedAccountId, queryClient, getPriceForPosition]);

  // TP/SL auto-close is now handled by backend cron job (tp-sl-monitor.service.ts)
  // Backend checks positions every 1 second and auto-closes when TP/SL is hit
  // Frontend will receive updates via the trade polling mechanism (refetchInterval: 5000ms)

  // Calculate account metrics based on positions
  // Use refs to track previous values and only update when they actually change
  const prevMetricsRef = useRef({
    equity: 0,
    floatingPnL: 0,
    profitPercent: 0,
    overallDrawdown: 0,
    dailyDrawdown: 0,
  });

  // RequestAnimationFrame throttling for smooth UI updates
  // Pending values are batched and applied once per frame
  const pendingMetricsRef = useRef({
    equity: null,
    floatingPnL: null,
    margin: null,
    freeMargin: null,
    profitPercent: null,
    overallDrawdown: null,
    dailyDrawdown: null,
    highestBalance: null,
    maxEquityToDate: null,
  });
  const rafIdRef = useRef(null);

  /**
   * Schedule a batched account update using requestAnimationFrame
   * This prevents flickering by batching multiple rapid updates into a single frame
   */
  const scheduleAccountUpdate = useCallback(() => {
    // Cancel any pending update to debounce rapid calls
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const pending = pendingMetricsRef.current;
      const updates = {};

      // Only apply finite values and check for significant changes to prevent flickering
      const prevAccount = account;

      // Real-time equity updates: balance + floating P/L
      // Increased threshold to $1 to reduce flickering from tiny price movements
      if (pending.equity !== null && Number.isFinite(pending.equity) && Math.abs((prevAccount.equity || 0) - pending.equity) >= 1.00) {
        updates.equity = pending.equity;
      }
      if (pending.floatingPnL !== null && Number.isFinite(pending.floatingPnL) && Math.abs((prevAccount.floatingPnL || 0) - pending.floatingPnL) >= 1.00) {
        updates.floatingPnL = pending.floatingPnL;
      }
      if (pending.margin !== null && Number.isFinite(pending.margin)) {
        updates.margin = pending.margin;
      }
      if (pending.freeMargin !== null && Number.isFinite(pending.freeMargin)) {
        updates.freeMargin = pending.freeMargin;
      }
      // Only update profitPercent if change is significant (0.01% threshold for real-time responsiveness)
      // BUT: Always update if prevProfit is 0 or undefined (initial state) to ensure progress bar updates
      if (pending.profitPercent !== null && Number.isFinite(pending.profitPercent)) {
        const prevProfit = prevAccount.profitPercent ?? 0;
        // Always update if previous value is 0 (initial state) or if change is significant
        if (prevProfit === 0 || Math.abs(prevProfit - pending.profitPercent) >= 0.01) {
          updates.profitPercent = pending.profitPercent;
        }
      }
      // Only update overallDrawdown if change is significant (0.005% threshold for smoother updates)
      if (pending.overallDrawdown !== null && Number.isFinite(pending.overallDrawdown)) {
        const prevOverallDD = prevAccount.overallDrawdown || 0;
        if (Math.abs(prevOverallDD - pending.overallDrawdown) >= 0.005) {
          updates.overallDrawdown = pending.overallDrawdown;
        }
      }
      // Only update dailyDrawdown if change is significant (0.005% threshold for smoother updates)
      if (pending.dailyDrawdown !== null && Number.isFinite(pending.dailyDrawdown)) {
        const prevDailyDD = prevAccount.dailyDrawdown || 0;
        if (Math.abs(prevDailyDD - pending.dailyDrawdown) >= 0.005) {
          updates.dailyDrawdown = pending.dailyDrawdown;
        }
      }
      if (pending.highestBalance !== null && Number.isFinite(pending.highestBalance)) {
        updates.highestBalance = pending.highestBalance;
      }
      if (pending.maxEquityToDate !== null && Number.isFinite(pending.maxEquityToDate)) {
        updates.maxEquityToDate = pending.maxEquityToDate;
      }

      // Apply updates if any
      if (Object.keys(updates).length > 0) {
        setAccount(prev => ({ ...prev, ...updates }));
      }

      // Clear pending values and reset rafId
      pendingMetricsRef.current = {
        equity: null,
        floatingPnL: null,
        margin: null,
        freeMargin: null,
        profitPercent: null,
        overallDrawdown: null,
        dailyDrawdown: null,
        highestBalance: null,
        maxEquityToDate: null,
      };
      rafIdRef.current = null;
    });
  }, [account]);

  useEffect(() => {
    const updateMetrics = () => {
      // When no positions, just update based on balance
      if (positions.length === 0) {
        const newEquity = account.balance;
        const initialBalance = account.initial_balance || account.startingBalance || 100000;
        const currentProfitPercent = initialBalance > 0 ? ((newEquity - initialBalance) / initialBalance) * 100 : 0;
        const profitPercent = Math.max(prevMetricsRef.current.profitPercent ?? 0, currentProfitPercent);

        // When no positions, use backend values but NEVER decrease drawdowns
        // Drawdowns should only increase - track worst values seen
        const prevMetrics = prevMetricsRef.current;
        const backendOverallDD = account.overallDrawdown ?? 0;
        const backendDailyDD = account.dailyDrawdown ?? 0;
        // CRITICAL: Drawdowns should only INCREASE - use max of current, previous, and backend values
        let overallDrawdown = Math.max(backendOverallDD, prevMetrics.overallDrawdown ?? 0);
        const dailyDrawdown = Math.max(backendDailyDD, prevMetrics.dailyDrawdown ?? 0);

        // CRITICAL: If DAILY_LOCKED and overallDrawdown is 0, use breach snapshot (atomic)
        // This prevents reset-to-0 when positions are auto-closed
        const statusUpper = String(account.status || '').toUpperCase();
        const isDailyLocked = statusUpper.includes('DAILY');
        if (isDailyLocked && (overallDrawdown === 0 || !Number.isFinite(overallDrawdown)) && typeof window !== 'undefined') {
          // First try breach snapshot (most accurate - captured at breach moment)
          const snapshotDD = sessionStorage.getItem(`violation:${selectedAccountId}:snapshot_overall_dd`);
          if (snapshotDD !== null) {
            const snapshotValue = parseFloat(snapshotDD);
            if (Number.isFinite(snapshotValue) && snapshotValue > 0) {
              overallDrawdown = snapshotValue;
              devLog('🔒 [SNAPSHOT] Using overall drawdown from breach snapshot in updateMetrics:', overallDrawdown);
            }
          } else {
            // Fallback to last known metrics
            const lastKnownOverallDD = sessionStorage.getItem(`metrics:${selectedAccountId}:last_overall_dd`);
            if (lastKnownOverallDD !== null) {
              const lastDD = parseFloat(lastKnownOverallDD);
              if (Number.isFinite(lastDD) && lastDD > 0) {
                overallDrawdown = lastDD;
                devLog('🔄 Using fallback overall drawdown in updateMetrics:', overallDrawdown);
              }
            }
          }
        }

        // Only update if values actually changed (prevent unnecessary re-renders)
        // prevMetrics already declared above
        if (
          Math.abs((prevMetrics.equity ?? 0) - newEquity) < 0.01 &&
          Math.abs((prevMetrics.profitPercent ?? 0) - profitPercent) < 0.01 &&
          Math.abs((prevMetrics.floatingPnL ?? 0) - 0) < 0.01 &&
          Math.abs((prevMetrics.overallDrawdown ?? 0) - overallDrawdown) < 0.01 &&
          Math.abs((prevMetrics.dailyDrawdown ?? 0) - dailyDrawdown) < 0.01
        ) {
          return; // No significant change, skip update
        }

        prevMetricsRef.current = {
          equity: newEquity,
          floatingPnL: 0,
          profitPercent: profitPercent,
          overallDrawdown: overallDrawdown,
          dailyDrawdown: dailyDrawdown,
        };

        // Use requestAnimationFrame throttling for smooth UI updates
        // Real-time equity = balance when no positions
        if (Number.isFinite(newEquity)) pendingMetricsRef.current.equity = newEquity;
        pendingMetricsRef.current.floatingPnL = 0;
        pendingMetricsRef.current.margin = 0;
        // Free margin = equity when no positions
        if (Number.isFinite(newEquity)) pendingMetricsRef.current.freeMargin = newEquity;
        if (Number.isFinite(profitPercent)) pendingMetricsRef.current.profitPercent = profitPercent;
        if (Number.isFinite(overallDrawdown)) pendingMetricsRef.current.overallDrawdown = overallDrawdown;
        if (Number.isFinite(dailyDrawdown)) pendingMetricsRef.current.dailyDrawdown = dailyDrawdown;
        scheduleAccountUpdate();
        return;
      }

      // Stop real-time updates if account is locked or disqualified
      const statusUpper = String(account.status || '').toUpperCase();
      if (statusUpper.includes('DAILY') || statusUpper.includes('FAIL') || statusUpper.includes('DISQUAL')) {
        return; // Don't update metrics - violation already occurred
      }

      // Calculate with open positions
      let totalPnL = 0;
      let totalMargin = 0;

      positions.forEach(pos => {
        // Use the correct price side (bid for BUY, ask for SELL) for P/L calculation
        const currentPrice = getPriceForPosition(pos.symbol, pos.type, pos.entryPrice);
        const pnl = calculatePositionPnL(pos, currentPrice);
        totalPnL += pnl;

        // Debug logging for P/L calculation (dev only)
        if (process.env.NODE_ENV !== 'production') {
          console.log(`[Equity Debug] Position: ${pos.symbol} ${pos.type.toUpperCase()}`);
          console.log(`  Entry Price: ${pos.entryPrice}`);
          console.log(`  Current Price (${pos.type === 'buy' ? 'BID' : 'ASK'}): ${currentPrice}`);
          console.log(`  Lot Size: ${pos.lotSize}`);
          console.log(`  P/L: $${pnl.toFixed(2)}`);
        }

        const contractSize = isCryptoSymbol(pos.symbol) ? 1 : 100000;
        const leverage = 100;
        const positionMargin = (pos.lotSize * contractSize * currentPrice) / leverage;
        totalMargin += positionMargin;
      });

      const newEquity = account.balance + totalPnL;
      const initialBalance = account.initial_balance || account.startingBalance || 100000;
      const currentProfitPercent = initialBalance > 0 ? ((newEquity - initialBalance) / initialBalance) * 100 : 0;
      const profitPercent = Math.max(prevMetricsRef.current.profitPercent ?? 0, currentProfitPercent);

      // Debug logging for equity calculation (dev only)
      if (process.env.NODE_ENV !== 'production' && positions.length > 0) {
        console.log(`[Equity Debug] Balance: $${account.balance.toFixed(2)}, Total P/L: $${totalPnL.toFixed(2)}, Calculated Equity: $${newEquity.toFixed(2)}`);
        const drawdownPercent = account.startingBalance > 0
          ? ((account.startingBalance - newEquity) / account.startingBalance * 100)
          : 0;
        console.log(`[Equity Debug] balance=$${account.balance.toFixed(2)}, totalPnL=$${totalPnL.toFixed(2)}, equity=$${newEquity.toFixed(2)}, drawdown=${drawdownPercent.toFixed(2)}%`);
      }

      // Track highest equity for display purposes
      const newHighestBalance = Math.max(account.highestBalance || account.maxEquityToDate || account.startingBalance, newEquity);

      // Calculate live drawdowns using backend's method (todayStartEquity for daily, maxEquityToDate for overall)
      // IMPORTANT: Use todayStartEquity (start of day equity) NOT highestEquityToday (highest reached today)
      // This matches backend calculation: (todayStartEquity - equity) / todayStartEquity * 100
      // initialBalance already declared above at line 1837
      const todayStartEquity = account.todayStartEquity ?? account.today_start_equity ?? initialBalance;
      const maxEquityToDate = account.maxEquityToDate ?? account.max_equity_to_date ?? account.highestBalance ?? initialBalance;

      // CRITICAL: For overall drawdown, use the stored maxEquityToDate (peak equity ever reached)
      // DO NOT update it here - it should only be updated by the backend when equity actually increases
      // If current equity is higher than maxEquityToDate, overall drawdown should be 0% (at new peak)
      // Only calculate drawdown if equity is BELOW the peak
      const overallDrawdownPercent = maxEquityToDate > 0 && newEquity < maxEquityToDate
        ? Math.max(0, ((maxEquityToDate - newEquity) / maxEquityToDate) * 100)
        : 0; // 0% when at or above peak equity

      // Calculate current daily drawdown: (todayStartEquity - current) / todayStartEquity * 100
      // Backend formula: (todayStartEquity - equity) / todayStartEquity * 100
      const currentDailyDrawdownPercent = todayStartEquity > 0 && newEquity < todayStartEquity
        ? Math.max(0, ((todayStartEquity - newEquity) / todayStartEquity) * 100)
        : 0;

      // CRITICAL: Daily drawdown should only INCREASE - track worst drawdown of the day
      // This ensures that if price rebounds, daily drawdown stays at the worst point
      const prevWorstDailyDD = prevMetricsRef.current.dailyDrawdown ?? 0;
      const backendDailyDD = account.dailyDrawdown ?? 0;
      const dailyDrawdown = Math.max(currentDailyDrawdownPercent, prevWorstDailyDD, backendDailyDD);

      const prevMetrics = prevMetricsRef.current;

      // statusUpper already declared above at line 1850
      const isDailyLocked = statusUpper.includes('DAILY');
      const isDisqualified = statusUpper.includes('FAIL') || statusUpper.includes('DISQUAL');

      // CRITICAL: Overall drawdown should only INCREASE or stay the same - never decrease
      // Track the worst drawdown from peak equity, not current drawdown
      // This ensures that if price rebounds, overall drawdown stays at the worst point
      let overallDrawdown = overallDrawdownPercent;

      // If account is active, track worst drawdown (only increase, never decrease)
      if (!isDailyLocked && !isDisqualified) {
        // Use the maximum of: current drawdown, previous worst drawdown, or backend value
        // This ensures overall drawdown never decreases when price rebounds
        const prevWorstDD = prevMetrics.overallDrawdown ?? 0;
        const backendDD = account.overallDrawdown ?? 0;
        const worstDD = Math.max(overallDrawdownPercent, prevWorstDD, backendDD);
        overallDrawdown = worstDD;
      } else {
        // Account is locked/disqualified - use frozen violation values
        // Try backend value first
        const backendOverallDD = account.overallDrawdown ?? prevMetrics.overallDrawdown ?? 0;
        if (backendOverallDD > 0 && Number.isFinite(backendOverallDD)) {
          overallDrawdown = backendOverallDD;
        } else if (typeof window !== 'undefined') {
          // Fallback to violation snapshot if backend is 0
          const violationDD = sessionStorage.getItem(`violation:${selectedAccountId}:overall_dd`);
          if (violationDD !== null) {
            const violationValue = parseFloat(violationDD);
            if (Number.isFinite(violationValue) && violationValue > 0) {
              overallDrawdown = violationValue;
              devLog('🔒 Using frozen overall drawdown from violation:', overallDrawdown);
            }
          } else {
            // Fallback to breach snapshot
            const snapshotDD = sessionStorage.getItem(`violation:${selectedAccountId}:snapshot_overall_dd`);
            if (snapshotDD !== null) {
              const snapshotValue = parseFloat(snapshotDD);
              if (Number.isFinite(snapshotValue) && snapshotValue > 0) {
                overallDrawdown = snapshotValue;
                devLog('🔒 [SNAPSHOT] Using overall drawdown from breach snapshot in updateMetrics:', overallDrawdown);
              }
            } else {
              // Last fallback: use last known metrics
              const lastKnownOverallDD = sessionStorage.getItem(`metrics:${selectedAccountId}:last_overall_dd`);
              if (lastKnownOverallDD !== null) {
                const lastDD = parseFloat(lastKnownOverallDD);
                if (Number.isFinite(lastDD) && lastDD > 0) {
                  overallDrawdown = lastDD;
                  devLog('🔄 Using fallback overall drawdown in updateMetrics:', overallDrawdown);
                }
              }
            }
          }
        }
      }

      // REMOVED: Frontend limit checking - now handled by event-driven price-tick endpoint
      // The price-tick endpoint (called in fetchPricesForPositions) triggers immediate backend evaluation
      // This ensures positions are closed within 0.1 seconds when limit is breached, even briefly

      // Only update if values actually changed (prevent unnecessary re-renders and jumping)
      // Use $1 threshold to reduce flickering from small price movements
      // prevMetrics already declared above at line 1908
      const equityChanged = Math.abs((prevMetrics.equity ?? 0) - newEquity) >= 1.00; // $1 threshold for stability
      const pnlChanged = Math.abs((prevMetrics.floatingPnL ?? 0) - totalPnL) >= 1.00; // $1 threshold for stability
      // Always update profit if prevMetrics is 0 (initial state) or if change is significant
      const prevProfit = prevMetrics.profitPercent ?? 0;
      const profitChanged = prevProfit === 0 || Math.abs(prevProfit - profitPercent) >= 0.01; // 0.01% threshold
      const dailyDDChanged = Math.abs((prevMetrics.dailyDrawdown ?? 0) - dailyDrawdown) >= 0.005; // 0.005% threshold
      // For overall DD, use tiny threshold
      const overallDDDiff = overallDrawdown - (prevMetrics.overallDrawdown ?? 0);
      const overallDDChanged = Math.abs(overallDDDiff) >= 0.005;

      // Force update on first run (when equity is 0) to ensure immediate display
      const isFirstUpdate = prevMetrics.equity === 0 && newEquity !== 0;

      if (!equityChanged && !pnlChanged && !profitChanged && !dailyDDChanged && !overallDDChanged && !isFirstUpdate) {
        return; // No change, skip update (unless first update)
      }

      // Update ref with new values
      // Use computed overallDrawdown (which may include snapshot) for ref
      prevMetricsRef.current = {
        equity: newEquity,
        floatingPnL: totalPnL,
        profitPercent: profitPercent,
        overallDrawdown: overallDrawdown, // Use computed value (may include snapshot)
        dailyDrawdown: dailyDrawdown,
      };

      // Debug logging for equity calculation (dev only)
      if (process.env.NODE_ENV !== 'production') {
        devLog(`💰 [Equity Update] balance=$${account.balance.toFixed(2)}, totalPnL=$${totalPnL.toFixed(2)}, newEquity=$${newEquity.toFixed(2)}, positions=${positions.length}`);
      }

      // Use requestAnimationFrame throttling for smooth UI updates
      // Batch all updates into a single frame to prevent flickering
      // Real-time equity = balance + floating P/L
      if (Number.isFinite(newEquity)) pendingMetricsRef.current.equity = newEquity;
      if (Number.isFinite(totalPnL)) pendingMetricsRef.current.floatingPnL = totalPnL;
      if (Number.isFinite(profitPercent)) pendingMetricsRef.current.profitPercent = profitPercent;
      if (Number.isFinite(totalMargin)) pendingMetricsRef.current.margin = totalMargin;
      // Free margin = real-time equity - margin used
      if (Number.isFinite(newEquity) && Number.isFinite(totalMargin)) {
        pendingMetricsRef.current.freeMargin = Math.max(0, newEquity - totalMargin);
      }
      // CRITICAL: Use computed overallDrawdown (real-time calculated when active, frozen when locked)
      // This ensures smooth real-time updates during open positions, just like daily drawdown
      if (Number.isFinite(overallDrawdown)) pendingMetricsRef.current.overallDrawdown = overallDrawdown;
      if (Number.isFinite(dailyDrawdown)) pendingMetricsRef.current.dailyDrawdown = dailyDrawdown;
      if (Number.isFinite(newHighestBalance)) pendingMetricsRef.current.highestBalance = newHighestBalance;
      // NOTE: maxEquityToDate should only be updated by the backend, not locally
      // The backend updates it when equity increases (in processPriceTick)

      scheduleAccountUpdate();
    };

    // Initial update
    updateMetrics();

    // Update every 2 seconds for stable equity updates
    // This prevents flickering while still showing real-time P&L changes
    const intervalId = setInterval(updateMetrics, 2000);
    return () => {
      clearInterval(intervalId);
      // Cleanup requestAnimationFrame on unmount
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [positions, unifiedPrices, account.balance, account.startingBalance, account.highestBalance, account.maxDailyDrawdown, account.maxOverallDrawdown, account.todayStartEquity, account.maxEquityToDate, calculatePositionPnL, isCryptoSymbol, scheduleAccountUpdate]);

  // REMOVED: Real-time violation checking via evaluate-real-time API
  // This is now handled by processPriceTick endpoint (lines 1468-1558) which already:
  // - Checks violations on every price update (throttled to 1000ms per symbol)
  // - Auto-closes positions when limits are breached
  // - Provides immediate response (<100ms)
  // Removing this duplicate check prevents API spam and "insufficient resources" errors

  // Show status banner and violation modal when account status changes to locked/disqualified
  // Handle all possible failure statuses: DAILY_LOCKED, DISQUALIFIED, FAILED, CHALLENGE_FAILED, ACCOUNT_FAILED, etc.
  useEffect(() => {
    const statusUpper = String(account.status || '').toUpperCase();

    // Check for daily lock status (includes 'DAILY')
    if (statusUpper.includes('DAILY')) {
      setAccountStatusBanner({
        type: 'warning',
        title: t('terminal.dailyLocked') || 'Daily Loss Limit Reached',
        message: t('terminal.dailyLockedMessage') || 'Your account has been locked until tomorrow due to exceeding the daily loss limit.',
      });
      // Show violation modal if not already shown for this violation
      setViolationModal(prev => {
        if (!prev || prev.type !== 'DAILY_LOCKED' || !prev.shown) {
          return { type: 'DAILY_LOCKED', shown: true };
        }
        return prev;
      });
    }
    // Check for disqualification/failure status (includes 'FAIL' or 'DISQUAL')
    else if (statusUpper.includes('FAIL') || statusUpper.includes('DISQUAL')) {
      setAccountStatusBanner({
        type: 'error',
        title: t('terminal.disqualified') || 'Challenge Disqualified',
        message: t('terminal.disqualifiedMessage') || 'Your account has been disqualified due to exceeding the maximum drawdown limit.',
      });
      // Show violation modal if not already shown for this violation
      setViolationModal(prev => {
        if (!prev || prev.type !== 'DISQUALIFIED' || !prev.shown) {
          return { type: 'DISQUALIFIED', shown: true };
        }
        return prev;
      });
    } else {
      setAccountStatusBanner(null);
      // Don't reset modal - let user close it manually
    }
  }, [account.status, t]);

  // Direct function - async to save to backend
  async function handleExecuteTrade(trade) {
    console.log('=== TRADE EXECUTION ===');
    console.log('Trade data:', trade);
    console.log('Account status:', account.status);

    // Edge case: Prevent multiple simultaneous trade executions
    if (isExecutingTrade) {
      toast({
        title: t('terminal.tradeBlocked'),
        description: t('terminal.tradeInProgress'),
        variant: 'destructive',
      });
      return;
    }

    // Edge case: Account status validation - check account.status for locked/disqualified
    const statusUpper = String(account.status || '').toUpperCase();
    if (statusUpper.includes('DAILY')) {
      toast({
        title: t('terminal.tradeBlocked'),
        description: t('terminal.dailyLossLimitReached'),
        variant: 'destructive',
      });
      return;
    }

    if (statusUpper.includes('FAIL') || statusUpper.includes('DISQUAL')) {
      toast({
        title: t('terminal.tradeBlocked'),
        description: t('terminal.challengeDisqualified'),
        variant: 'destructive',
      });
      return;
    }

    if (account.status === 'PAUSED' || account.status === 'CLOSED') {
      toast({
        title: t('terminal.tradeBlocked'),
        description: t('terminal.accountStatusBlocked', { status: account.status }),
        variant: 'destructive',
      });
      return;
    }

    // Validate trade object - be lenient with entryPrice
    if (!trade || !trade.symbol || !trade.type || !trade.lotSize) {
      console.error('Invalid trade - missing required fields:', trade);
      toast({
        title: t('terminal.invalidTrade'),
        description: t('terminal.missingFields'),
        variant: 'destructive',
      });
      return;
    }

    // Validate lot size
    if (trade.lotSize <= 0 || isNaN(trade.lotSize)) {
      toast({
        title: t('terminal.invalidTrade'),
        description: t('terminal.invalidLotSize'),
        variant: 'destructive',
      });
      return;
    }

    // Validate account is selected
    if (!selectedAccountId) {
      console.error('No account selected');
      toast({
        title: t('terminal.noAccount'),
        description: t('terminal.selectAccountMessage'),
        variant: 'destructive',
      });
      return;
    }

    // Edge case: Prevent duplicate trades (same symbol, type, price within 1 second)
    // Check both real positions and temporary optimistic positions
    const recentTrade = positions.find(p =>
      p.symbol === trade.symbol &&
      p.type === trade.type &&
      Math.abs(new Date(p.openTime).getTime() - Date.now()) < 1000
    );
    if (recentTrade && trade.orderType !== 'limit') {
      // If it's a temporary position, it means a trade is already in progress
      if (recentTrade.id && recentTrade.id.startsWith('temp_')) {
        toast({
          title: t('terminal.tradeBlocked'),
          description: t('terminal.tradeInProgress'),
          variant: 'destructive',
        });
      } else {
        toast({
          title: t('terminal.duplicateTrade'),
          description: t('terminal.duplicateTradeMessage'),
          variant: 'destructive',
        });
      }
      return;
    }

    // Ensure we have an entry price
    // BUY: entryPrice should be ASK (you pay ask to buy)
    // SELL: entryPrice should be BID (you receive bid when selling)
    const entryPrice = trade.entryPrice ||
      (trade.type === 'buy' ? selectedSymbol?.ask : selectedSymbol?.bid) ||
      (trade.type === 'buy' ? unifiedPrices[trade.symbol]?.ask : unifiedPrices[trade.symbol]?.bid) ||
      (trade.type === 'buy' ? 1.08557 : 1.08542); // Default: ask for BUY, bid for SELL
    console.log('Entry price:', entryPrice, 'Type:', trade.type);

    // If it's a limit order with a limit price, add to pending orders
    if (trade.orderType === 'limit' && trade.limitPrice) {
      console.log('Creating PENDING order...');

      // Initialize prevPricesRef for this symbol if it doesn't exist
      if (!prevPricesRef.current) {
        prevPricesRef.current = {};
      }
      // Set initial previous price to current price (or entry price if available)
      if (!prevPricesRef.current[trade.symbol]) {
        const priceData = unifiedPrices[trade.symbol];
        const currentBid = priceData && typeof priceData === 'object' ? priceData.bid : priceData;
        prevPricesRef.current[trade.symbol] = entryPrice || selectedSymbol?.bid || currentBid || 1.08542;
      }

      // Handle demo account pending order
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
          status: 'pending',
          isDemo: true
        };

        setDemoPendingOrders(prev => {
          const newOrders = [...prev, demoOrder];
          // Also save positions to demo storage
          saveDemoAccountTrades(positions, demoClosedTrades, newOrders, account.balance, account.equity);
          return newOrders;
        });

        toast({
          title: t('terminal.orderPlaced'),
          description: t('terminal.pendingOrderDescription', {
            type: trade.type.toUpperCase(),
            symbol: trade.symbol
          }),
        });
        return;
      }

      // Save to backend first (for real accounts)
      try {
        const orderData = {
          tradingAccountId: selectedAccountId,
          symbol: trade.symbol,
          type: trade.type.toUpperCase(), // Backend expects BUY/SELL
          orderType: 'LIMIT', // LIMIT, STOP, or STOP_LIMIT
          volume: trade.lotSize,
          price: trade.limitPrice,
          stopLoss: trade.stopLoss ?? null,
          takeProfit: trade.takeProfit ?? null,
        };

        const response = await createPendingOrder(orderData);
        console.log('✅ Pending order saved to backend:', response);

        if (response?.id) {
          // Map backend response to frontend format
          const pendingOrder = {
            id: response.id, // Use backend ID
            symbol: response.symbol,
            type: response.type.toLowerCase(),
            lotSize: response.volume,
            limitPrice: response.price,
            stopLoss: response.stopLoss ?? null,
            takeProfit: response.takeProfit ?? null,
            createdTime: new Date(response.createdAt).toISOString(),
            status: response.status.toLowerCase(),
          };

          // Add to local state
          setPendingOrders(prevOrders => {
            console.log('Previous pending orders:', prevOrders.length);
            return [...prevOrders, pendingOrder];
          });

          // Invalidate query to refresh from backend
          queryClient.invalidateQueries({ queryKey: ['pending-orders', selectedAccountId] });

          toast({
            title: t('terminal.orderPlaced'),
            description: t('terminal.pendingOrderDescription', {
              type: trade.type.toUpperCase(),
              symbol: trade.symbol
            }),
          });
        } else {
          throw new Error('Backend did not return order ID');
        }
      } catch (error) {
        console.error('Failed to save pending order to backend:', error);
        toast({
          title: t('terminal.orderFailed'),
          description: error.message || 'Failed to create pending order',
          variant: 'destructive',
        });
      }
      return;
    }

    // Market order - execute immediately with optimistic update
    console.log('🔄 Creating MARKET position with optimistic update...');

    // Edge case: Verify account hasn't changed during execution
    if (!selectedAccountId || selectedAccountId !== selectedAccount?.id) {
      toast({
        title: t('terminal.tradeFailed'),
        description: 'Account changed during trade execution',
        variant: 'destructive',
      });
      return;
    }

    // Create temporary ID for optimistic update
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // OPTIMISTIC UPDATE: Add position immediately for instant UI feedback
    const optimisticPosition = {
      id: tempId, // Temporary ID - will be replaced with backend ID
      symbol: trade.symbol,
      type: trade.type,
      lotSize: trade.lotSize,
      entryPrice: entryPrice,
      stopLoss: trade.stopLoss,
      takeProfit: trade.takeProfit,
      openTime: new Date().toISOString(),
    };

    // Add position immediately (optimistic update)
    setPositions(prevPositions => {
      console.log('⚡ Adding position optimistically with temp ID:', tempId);
      const newPositions = [...prevPositions, optimisticPosition];

      // If demo, also persist immediately
      if (selectedAccount?.isDemo) {
        saveDemoAccountTrades(newPositions, demoClosedTrades, demoPendingOrders, account.balance, account.equity);
      }

      return newPositions;
    });

    // Update current prices - set both bid and ask
    // ...

    // Immediately fetch real-time price from API to replace the calculated one
    // ...

    // For demo account, we are done after the optimistic update
    if (selectedAccount?.isDemo) {
      toast({
        title: t('terminal.tradeExecuted'),
        description: `${trade.type.toUpperCase()} ${trade.lotSize} ${trade.symbol} @ ${entryPrice}`,
      });
      return;
    }

    // Save to backend in the background (for real accounts)
    setIsExecutingTrade(true);
    try {
      console.log('💾 Saving trade to backend...');

      // IMPORTANT: volume represents LOTS for forex, UNITS for crypto
      // For forex: lotSize = 10 means 10 lots = 1,000,000 units
      // For crypto: lotSize = 0.5 means 0.5 BTC units
      const tradeData = {
        accountId: selectedAccountId,
        symbol: trade.symbol,
        type: trade.type.toUpperCase(), // Backend expects BUY/SELL
        volume: trade.lotSize, // lotSize for forex = lots, for crypto = units
        openPrice: entryPrice,
        closePrice: null, // Open trade, no close price yet
        profit: 0, // No profit until closed
        stopLoss: trade.stopLoss ?? null, // Optional: only include if provided
        takeProfit: trade.takeProfit ?? null, // Optional: only include if provided
      };

      // Debug logging (dev only)
      if (process.env.NODE_ENV !== 'production') {
        const isCrypto = isCryptoSymbol(trade.symbol);
        console.log(`[Trade Creation Debug] ${trade.symbol} ${trade.type}: lotSize=${trade.lotSize} ${isCrypto ? 'units' : 'lots'}, entryPrice=${entryPrice}, volume sent to backend=${tradeData.volume}`);
      }

      // Wait for backend response
      const response = await createTrade(tradeData);
      queryClient.invalidateQueries(['trading-account', selectedAccountId]);

      // Update trading days count after successful trade
      try {
        // Wait briefly for backend to persist the trade
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Sync full account data from backend (updates account.tradingDays via metrics.tradingDaysCompleted)
        await syncAccountFromBackend(selectedAccountId, true, false); // Force refresh
        
        // Also fetch summary to update standalone tradingDaysCount state
        const summary = await getAccountSummary(selectedAccountId);
        
        if (summary?.metrics?.tradingDaysCompleted !== undefined) {
          setTradingDaysCount(summary.metrics.tradingDaysCompleted);
          // Also update the account state directly to ensure ChallengeRulesPanel gets the update
          setAccount(prev => ({
            ...prev,
            tradingDays: summary.metrics.tradingDaysCompleted
          }));
        }
        if (summary?.metrics?.daysRemaining !== undefined) {
          setDaysRemaining(summary.metrics.daysRemaining);
        }
      } catch (err) {
        console.error('Failed to update trading days:', err);
      }

      console.log('✅ Trade saved to backend:', response);

      // Verify we got a trade ID from backend
      if (!response?.trade?.id) {
        throw new Error('Backend did not return trade ID');
      }

      // Replace temporary position with real backend position
      // Use backend response values for SL/TP to ensure consistency
      const realPosition = {
        id: response.trade.id, // Use backend ID
        symbol: trade.symbol,
        type: trade.type,
        lotSize: trade.lotSize,
        entryPrice: entryPrice,
        stopLoss: response.trade.stopLoss ?? trade.stopLoss ?? null,
        takeProfit: response.trade.takeProfit ?? trade.takeProfit ?? null,
        openTime: response.trade.openedAt || new Date().toISOString(),
      };

      // Replace temp position with real one
      setPositions(prevPositions => {
        // Remove temp position and add real one
        const filtered = prevPositions.filter(p => p.id !== tempId);
        const exists = filtered.some(p => p.id === response.trade.id);
        if (exists) {
          console.warn('⚠️ Position already exists with ID:', response.trade.id);
          return filtered;
        }
        console.log('✅ Replacing temp position with backend ID:', response.trade.id);
        return [...filtered, realPosition];
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['trades', selectedAccountId] });
      const userId = lastValidUserIdRef.current || user?.userId;
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ['trading-accounts', userId] });
      }

      // Step 3: Sync account data from backend (single source of truth)
      await syncAccountFromBackend(selectedAccountId, false, false);

      toast({
        title: t('terminal.tradeExecuted'),
        description: `${trade.type.toUpperCase()} ${trade.lotSize} ${trade.symbol} @ ${entryPrice}`,
      });

      console.log('=== TRADE EXECUTION COMPLETE ===');
    } catch (error) {
      console.error('❌ Failed to save trade to backend:', error);

      // ROLLBACK: Remove optimistic position on error
      setPositions(prevPositions => {
        console.log('🔄 Rolling back optimistic position:', tempId);
        return prevPositions.filter(p => p.id !== tempId);
      });

      // Enhanced error handling with specific messages
      let errorMessage = t('terminal.saveError');

      if (error.response) {
        // Backend returned an error response
        const status = error.response.status;
        const data = error.response.data;

        if (status === 404) {
          errorMessage = t('terminal.accountNotFound');
        } else if (status === 400) {
          // Check for specific locked/disqualified messages
          const message = data?.message || '';
          if (message.includes('Daily loss limit') || message.includes('locked until tomorrow')) {
            errorMessage = t('terminal.dailyLossLimitReached');
          } else if (message.includes('disqualified') || message.includes('no longer allowed')) {
            errorMessage = t('terminal.challengeDisqualified');
          } else {
            errorMessage = message || t('terminal.invalidTradeData');
          }
          // Sync account status if locked/disqualified
          if (message.includes('Daily loss limit') || message.includes('disqualified')) {
            syncAccountFromBackend(selectedAccountId, true, false).catch(console.error);
          }
        } else if (status === 403) {
          errorMessage = t('terminal.tradeNotAllowed');
        } else if (status === 500) {
          errorMessage = t('terminal.serverError');
        } else {
          errorMessage = data?.message || error.message || errorMessage;
        }
      } else if (error.request) {
        // Request was made but no response received (network error)
        if (!navigator.onLine) {
          errorMessage = t('terminal.networkOffline');
        } else {
          errorMessage = t('terminal.networkError');
        }
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage;
      }

      toast({
        title: t('terminal.tradeFailed'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsExecutingTrade(false);
    }
  }

  const handleModifyPosition = useCallback((position) => {
    setModifyingPosition(position);
  }, []);

  const handleSaveModifiedPosition = useCallback(async (updatedPosition) => {
    // Check if position has a backend ID (not a temp ID)
    const isLocalPosition = !updatedPosition.id ||
      updatedPosition.id.startsWith('temp_') ||
      updatedPosition.id.startsWith('pos_') ||
      selectedAccount?.isDemo;

    if (isLocalPosition) {
      // For temporary or demo positions, just update local state
      setPositions(prev => {
        const newPositions = prev.map(p =>
          p.id === updatedPosition.id ? updatedPosition : p
        );

        // If demo, persist the changes
        if (selectedAccount?.isDemo) {
          saveDemoAccountTrades(newPositions, demoClosedTrades, demoPendingOrders, account.balance, account.equity);
        }

        return newPositions;
      });
      setModifyingPosition(null);
      return;
    }

    // For positions with backend ID, call backend API
    try {
      console.log('💾 Modifying position via backend API:', updatedPosition.id);

      const modificationData = {
        stopLoss: updatedPosition.stopLoss ?? null,
        takeProfit: updatedPosition.takeProfit ?? null,
      };

      const response = await modifyPosition(updatedPosition.id, modificationData);
      console.log('✅ Position modified in backend:', response);

      if (response?.trade) {
        // Update local state with backend response values
        const updatedPos = {
          ...updatedPosition,
          stopLoss: response.trade.stopLoss ?? null,
          takeProfit: response.trade.takeProfit ?? null,
        };

        setPositions(prev => prev.map(p =>
          p.id === updatedPosition.id ? updatedPos : p
        ));

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['trades', selectedAccountId] });

        setModifyingPosition(null);

        toast({
          title: 'Position Modified',
          description: `${updatedPosition.symbol} SL/TP updated successfully`,
        });
      } else {
        throw new Error('Backend did not return updated trade');
      }
    } catch (error) {
      console.error('❌ Failed to modify position:', error);
      toast({
        title: t('terminal.modificationFailed'),
        description: error.response?.data?.message || error.message || t('terminal.updateError'),
        variant: 'destructive',
      });
    }
  }, [queryClient, selectedAccountId, toast, t]);

  const handleClosePosition = useCallback(async (position) => {
    await closePositionWithBackendUpdate(position, true);
  }, [closePositionWithBackendUpdate]);


  // Demo account is always available, so we don't need to show empty state
  // But we can show a brief loading state if accounts are still loading
  if (isLoadingAccounts && availableAccounts.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-400">{t('terminal.loadingAccounts')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4" style={{ pointerEvents: 'auto' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">{t('terminal.title')}</h1>

            {/* Account Selector */}
            <Select value={selectedAccountId || ''} onValueChange={setSelectedAccountId}>
              <SelectTrigger className="w-[280px] bg-slate-800 border-slate-700 text-white">
                <div className="flex items-center gap-2 w-full">
                  <Wallet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  {selectedAccount ? (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {selectedAccount.isDemo && (
                        <Badge className="text-xs bg-purple-500/20 text-purple-400">DEMO</Badge>
                      )}
                      <span className="font-medium text-sm">${selectedAccount.initial_balance?.toLocaleString()}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400 text-xs">{selectedAccount.platform}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs text-emerald-400">
                        {selectedAccount.current_phase === 'phase1' ? t('terminal.phase1') :
                          selectedAccount.current_phase === 'phase2' ? t('terminal.phase2') :
                            selectedAccount.current_phase === 'funded' ? t('terminal.funded') :
                              selectedAccount.current_phase === 'failed' ? t('terminal.failed') :
                                selectedAccount.current_phase}
                      </span>
                    </div>
                  ) : (
                    <SelectValue placeholder={t('terminal.selectAccount')} />
                  )}
                </div>
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700 text-white [&>svg]:text-white">
                {availableAccounts.map((acc) => (
                  <SelectItem
                    key={acc.id}
                    value={acc.id}
                    className=" text-white
                          hover:text-white
                          focus:text-white
                          data-[highlighted]:text-white
                          data-[state=checked]:text-white
                          hover:bg-slate-700
                          focus:bg-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      {acc.isDemo && (
                        <Badge className="text-xs bg-purple-500/20 text-purple-400 mr-1">DEMO</Badge>
                      )}
                      <span className="font-medium">${acc.initial_balance?.toLocaleString()}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-slate-400 text-xs">{acc.platform}</span>
                      <span className="text-slate-400">•</span>
                      <span className="text-xs text-emerald-400">
                        {acc.current_phase === 'phase1' ? t('terminal.phase1') :
                          acc.current_phase === 'phase2' ? t('terminal.phase2') :
                            acc.current_phase === 'funded' ? t('terminal.funded') :
                              acc.current_phase === 'failed' ? t('terminal.failed') :
                                acc.current_phase}
                      </span>
                      {acc.status && (
                        <>
                          <span className="text-slate-400">•</span>
                          <Badge className={`text-xs ${acc.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                            acc.status === 'paused' ? 'bg-amber-500/20 text-amber-400' :
                              'bg-slate-500/20 text-slate-400'
                            }`}>
                            {t(`status.${acc.status}`)}
                          </Badge>
                        </>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Badge className={`text-xs ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
            <span className="hidden sm:inline">{isConnected ? t('terminal.connected') : t('terminal.disconnected')}</span>
          </Badge>
          {/* WebSocket Connection Status */}
          <Badge
            className={`text-xs cursor-help transition-colors ${websocketStatus.connected
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : websocketStatus.status === 'reconnecting'
                ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}
            title={
              websocketStatus.connected
                ? 'WebSocket Connected - Real-time updates active'
                : websocketStatus.status === 'reconnecting'
                  ? 'WebSocket Reconnecting - Fallback polling active'
                  : 'WebSocket Disconnected - Using fallback polling (5s interval)'
            }
          >
            <div className={`w-2 h-2 rounded-full mr-1.5 ${websocketStatus.connected
              ? 'bg-emerald-400 animate-pulse'
              : websocketStatus.status === 'reconnecting'
                ? 'bg-yellow-400 animate-pulse'
                : 'bg-red-400'
              }`} />
            <span className="hidden md:inline font-medium">
              {websocketStatus.connected
                ? 'Live Updates'
                : websocketStatus.status === 'reconnecting'
                  ? 'Reconnecting...'
                  : 'Polling Mode'
              }
            </span>
            <span className="inline md:hidden">
              {websocketStatus.connected ? 'Live' : 'Poll'}
            </span>
          </Badge>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-sm mr-2">
            <Clock className="w-4 h-4" />
            <span>{new Date().toLocaleTimeString()}</span>
          </div>

        </div>
      </div>

      {/* Account Metrics - Only show if valid account is selected */}
      {hasValidAccount && (
        <AccountMetrics
          account={account}
          positions={positions}
          getPriceForPosition={getPriceForPosition}
          isCryptoSymbol={isCryptoSymbol}
          isLoading={isAccountLoading}
        />
      )}

      {/* Show message if no account selected */}
      {!hasValidAccount && (
        <Card className="bg-slate-900 border-slate-800 p-8 text-center">
          <Wallet className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">{t('terminal.selectAccountTitle')}</h3>
          <p className="text-slate-400">{t('terminal.selectAccountMessage')}</p>
        </Card>
      )}

      {/* Mobile Tabs */}
      {hasValidAccount && (
        <div className="lg:hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full bg-slate-900 border border-slate-800 grid grid-cols-4">
              <TabsTrigger value="chart" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white">{t('terminal.tabs.chart')}</TabsTrigger>
              <TabsTrigger value="trade" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white">{t('terminal.tabs.trade')}</TabsTrigger>
              <TabsTrigger value="watchlist" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white">{t('terminal.tabs.watch')}</TabsTrigger>
              <TabsTrigger value="positions" className="text-xs data-[state=active]:bg-slate-800 data-[state=active]:text-white">{t('terminal.tabs.positions')}</TabsTrigger>
            </TabsList>

            <TabsContent value="chart" className="mt-4">
              <div className="h-[400px]">
                <TradingChart
                  key={`chart-mobile-${selectedSymbol?.symbol}`}
                  symbol={selectedSymbol}
                  openPositions={positions}
                  onPriceUpdate={handlePriceUpdate}
                />
              </div>
            </TabsContent>

            <TabsContent value="trade" className="mt-4">
              <TradingPanel
                selectedSymbol={enrichedSelectedSymbol}
                accountBalance={account.freeMargin}
                onExecuteTrade={handleExecuteTrade}
                disabled={(() => {
                  const statusUpper = String(account.status || '').toUpperCase();
                  return statusUpper.includes('DAILY') || statusUpper.includes('FAIL') || statusUpper.includes('DISQUAL') || statusUpper === 'PAUSED' || statusUpper === 'CLOSED';
                })()}
                chartPrice={(() => {
                  const priceData = unifiedPrices[selectedSymbol?.symbol];
                  return priceData && typeof priceData === 'object' ? priceData.bid : priceData;
                })()}
              />
            </TabsContent>

            <TabsContent value="watchlist" className="mt-4">
              <div className="h-[400px]">
                <MarketWatchlist
                  onSymbolSelect={(symbol) => {
                    setSelectedSymbol(symbol);
                    setActiveTab('chart');
                  }}
                  selectedSymbol={selectedSymbol}
                />
              </div>
            </TabsContent>

            <TabsContent value="positions" className="mt-4">
              <OpenPositions
                key={`positions-mobile-${pricesLastUpdate}-${positions.length}`}
                positions={positions}
                currentPrices={unifiedPrices}
                onClosePosition={handleClosePosition}
                onModifyPosition={handleModifyPosition}
                accountStatus={account.status}
              />
              {tradeHistory.length > 0 && (
                <Card className="bg-slate-900 border-slate-800 p-4 mt-4">
                  <h4 className="text-white font-medium mb-3">{t('terminal.tradeHistory')}</h4>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {tradeHistory.map((trade, i) => (
                      <div key={i} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          <Badge className={`text-xs ${trade.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                            {(trade.type === 'buy' ? t('terminal.tradingPanel.buyLong') : t('terminal.tradingPanel.sellShort')).toUpperCase()}
                          </Badge>
                          <span className="text-white">{trade.symbol}</span>
                        </div>
                        {/* Show breach PnL if auto-closed due to limit breach, otherwise show realized PnL */}
                        {/* Show breach snapshot if auto-closed due to limit breach */}
                        {(() => {
                          // Check if trade was auto-closed due to risk limit breach
                          const isAutoClosed = trade.closeReason === 'RISK_AUTO_CLOSE' ||
                            trade.closeReason === 'risk_auto_close' ||
                            String(trade.closeReason || '').toUpperCase() === 'RISK_AUTO_CLOSE';

                          // Check if breach snapshot exists
                          const isBreachTriggered = trade.breachTriggered === true ||
                            trade.breachTriggered === 1 ||
                            String(trade.breachTriggered) === 'true';
                          const hasBreachPnL = trade.breachUnrealizedPnl !== null &&
                            trade.breachUnrealizedPnl !== undefined &&
                            Number.isFinite(trade.breachUnrealizedPnl);

                          // Show breach snapshot if:
                          // 1. Trade was auto-closed due to risk limit breach, OR
                          // 2. Breach snapshot exists (breachTriggered + breachUnrealizedPnl)
                          const shouldShow = isAutoClosed || (isBreachTriggered && hasBreachPnL);

                          if (isAutoClosed || isBreachTriggered || hasBreachPnL) {
                            console.log('🔍 [History Display] Checking breach display:', {
                              tradeId: trade.id,
                              isAutoClosed,
                              isBreachTriggered,
                              hasBreachPnL,
                              shouldShow,
                              breachTriggered: trade.breachTriggered,
                              breachUnrealizedPnl: trade.breachUnrealizedPnl,
                              closeReason: trade.closeReason,
                              fullTrade: trade,
                            });
                          }

                          return shouldShow;
                        })() ? (
                          <div className="text-right">
                            {/* Show breach PnL if available, otherwise show realized PnL */}
                            {trade.breachUnrealizedPnl !== null &&
                              trade.breachUnrealizedPnl !== undefined &&
                              Number.isFinite(trade.breachUnrealizedPnl) ? (
                              <span className={`font-mono font-bold ${trade.breachUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {trade.breachUnrealizedPnl >= 0 ? '+' : ''}{trade.breachUnrealizedPnl.toFixed(2)}
                              </span>
                            ) : (
                              <span className={`font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                              </span>
                            )}
                            <Badge className="ml-1 text-xs bg-red-500/20 text-red-400">
                              {t('terminal.history.breach')}
                            </Badge>
                          </div>
                        ) : (
                          <span className={`font-mono font-bold ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Desktop Layout */}
      {hasValidAccount && (
        <div className="hidden lg:block space-y-4">
          {/* Main Trading Area */}
          <div className="grid grid-cols-12 gap-4">
            {/* Left Sidebar - Market Watch */}
            <div className={`${sidebarCollapsed ? 'col-span-1' : 'col-span-2'} transition-all relative h-[450px]`}>
              {sidebarCollapsed ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSidebarCollapsed(false)}
                  className="w-full h-full bg-slate-900 border border-slate-800 rounded-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <div className="h-full relative">
                  <MarketWatchlist
                    onSymbolSelect={setSelectedSymbol}
                    selectedSymbol={selectedSymbol}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(true)}
                    className="absolute top-2 right-2 text-slate-400 z-10 h-6 w-6 p-0"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Center - Chart */}
            <div className={`${sidebarCollapsed ? 'col-span-8' : 'col-span-7'} transition-all h-[450px]`}>
              <TradingChart
                key={`chart-desktop-${selectedSymbol?.symbol}`}
                symbol={selectedSymbol}
                openPositions={positions}
                onPriceUpdate={handlePriceUpdate}
              />
            </div>

            {/* Right Sidebar - Trading Panel */}
            <div className="col-span-3">
              <TradingPanel
                selectedSymbol={enrichedSelectedSymbol}
                accountBalance={account.freeMargin}
                onExecuteTrade={handleExecuteTrade}
                disabled={(() => {
                  const statusUpper = String(account.status || '').toUpperCase();
                  return statusUpper.includes('DAILY') || statusUpper.includes('FAIL') || statusUpper.includes('DISQUAL') || statusUpper === 'PAUSED' || statusUpper === 'CLOSED';
                })()}
                chartPrice={(() => {
                  const priceData = unifiedPrices[selectedSymbol?.symbol];
                  return priceData && typeof priceData === 'object' ? priceData.bid : priceData;
                })()}
              />
            </div>
          </div>

          {/* Bottom Section - Positions & Rules */}
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-7">
              <Tabs defaultValue="positions" className="w-full">
                <TabsList className="bg-slate-900 border border-slate-800">
                  <TabsTrigger value="positions" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white ">
                    {t('terminal.tabs.positions')} ({positions.length})
                  </TabsTrigger>
                  <TabsTrigger value="pending" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white ">
                    {t('terminal.tabs.pending')} ({pendingOrders.length})
                  </TabsTrigger>
                  <TabsTrigger value="history" className="data-[state=active]:bg-slate-800 data-[state=active]:text-white ">
                    {t('terminal.tabs.history')} ({tradeHistory.length})
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
                  <Card className="bg-slate-900 border-slate-800 p-4 max-h-64 overflow-auto">
                    {pendingOrders.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">{t('terminal.noPendingOrders')}</p>
                    ) : (
                      <div className="space-y-2">
                        {pendingOrders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Badge className={order.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                                {(order.type === 'buy' ? t('terminal.tradingPanel.buyLong') : t('terminal.tradingPanel.sellShort')).toUpperCase()} {t('terminal.tradingPanel.limit').toUpperCase()}
                              </Badge>
                              <span className="text-white">{order.symbol}</span>
                              <span className="text-slate-400 text-sm">{order.lotSize} {t('terminal.lots')}</span>
                              <span className="text-amber-400 text-sm font-mono">@ {order.limitPrice}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              onClick={async () => {
                                try {
                                  if (order.isDemo || selectedAccount?.isDemo) {
                                    // Cancel locally for demo
                                    console.log('✅ Pending order cancelled locally:', order.id);
                                    const newOrders = demoPendingOrders.filter(o => o.id !== order.id);
                                    setDemoPendingOrders(newOrders);
                                    saveDemoAccountTrades(positions, demoClosedTrades, newOrders, account.balance, account.equity);

                                    toast({
                                      title: t('terminal.orderCancelled'),
                                      description: t('terminal.orderCancelledSuccess'),
                                    });
                                    return;
                                  }

                                  // Cancel via backend API (for real accounts)
                                  await cancelPendingOrder(order.id);
                                  console.log('✅ Pending order cancelled in backend:', order.id);

                                  // Remove from local state
                                  setPendingOrders(prev => prev.filter(o => o.id !== order.id));

                                  // Invalidate query to refresh from backend
                                  queryClient.invalidateQueries({ queryKey: ['pending-orders', selectedAccountId] });

                                  toast({
                                    title: t('terminal.orderCancelled'),
                                    description: t('terminal.orderCancelledSuccess'),
                                  });
                                } catch (error) {
                                  console.error('Failed to cancel pending order:', error);
                                  toast({
                                    title: t('terminal.cancelFailed'),
                                    description: error.message || 'Failed to cancel order',
                                    variant: 'destructive',
                                  });
                                }
                              }}
                            >
                              <X className="w-4 h-4 mr-1" />
                              {t('terminal.cancel')}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </TabsContent>
                <TabsContent value="history" className="mt-2">
                  <Card className="bg-slate-900 border-slate-800 p-4">
                    {tradeHistory.length === 0 ? (
                      <p className="text-slate-400 text-center py-8">{t('terminal.noClosedTrades')}</p>
                    ) : (
                      <div className="space-y-4">
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 text-slate-400" />
                            <Input
                              placeholder={t('terminal.history.filterBySymbol')}
                              value={historySymbolFilter}
                              onChange={(e) => setHistorySymbolFilter(e.target.value)}
                              className="bg-slate-800 border-slate-700 text-white text-sm h-8"
                            />
                          </div>
                          <Select value={historyPnLFilter} onValueChange={setHistoryPnLFilter}>
                            <SelectTrigger className="w-[140px] h-8 bg-slate-800 border-slate-700 text-white text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">{t('terminal.history.allTrades')}</SelectItem>
                              <SelectItem value="profit">{t('terminal.history.profitOnly')}</SelectItem>
                              <SelectItem value="loss">{t('terminal.history.lossOnly')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={historyDateFilter} onValueChange={setHistoryDateFilter}>
                            <SelectTrigger className="w-[140px] h-8 bg-slate-800 border-slate-700 text-white text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">{t('terminal.history.allTime')}</SelectItem>
                              <SelectItem value="today">{t('terminal.history.today')}</SelectItem>
                              <SelectItem value="week">{t('terminal.history.thisWeek')}</SelectItem>
                              <SelectItem value="month">{t('terminal.history.thisMonth')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Filtered Trade History */}
                        {(() => {
                          // Filter trades based on filters
                          const filteredTrades = tradeHistory.filter(trade => {
                            // Symbol filter
                            if (historySymbolFilter && !trade.symbol?.toLowerCase().includes(historySymbolFilter.toLowerCase())) {
                              return false;
                            }

                            // P/L filter
                            if (historyPnLFilter === 'profit' && trade.pnl <= 0) return false;
                            if (historyPnLFilter === 'loss' && trade.pnl >= 0) return false;

                            // Date filter
                            if (historyDateFilter !== 'all' && trade.closeTime) {
                              const closeDate = new Date(trade.closeTime);
                              const now = new Date();
                              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                              const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                              const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

                              if (historyDateFilter === 'today' && closeDate < today) return false;
                              if (historyDateFilter === 'week' && closeDate < weekAgo) return false;
                              if (historyDateFilter === 'month' && closeDate < monthAgo) return false;
                            }

                            return true;
                          });

                          // Calculate stats
                          const totalPnL = filteredTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
                          const winCount = filteredTrades.filter(t => t.pnl > 0).length;
                          const lossCount = filteredTrades.filter(t => t.pnl < 0).length;
                          const winRate = filteredTrades.length > 0 ? ((winCount / filteredTrades.length) * 100).toFixed(1) : 0;

                          return (
                            <div className="space-y-3">
                              {/* Stats Summary */}
                              <div className="grid grid-cols-4 gap-2 text-xs">
                                <div className="bg-slate-800/50 rounded p-2">
                                  <p className="text-slate-400">{t('terminal.history.totalPL')}</p>
                                  <p className={`font-bold ${totalPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                                  </p>
                                </div>
                                <div className="bg-slate-800/50 rounded p-2">
                                  <p className="text-slate-400">{t('terminal.history.winRate')}</p>
                                  <p className="font-bold text-white">{winRate}%</p>
                                </div>
                                <div className="bg-slate-800/50 rounded p-2">
                                  <p className="text-slate-400">{t('terminal.history.wins')}</p>
                                  <p className="font-bold text-emerald-400">{winCount}</p>
                                </div>
                                <div className="bg-slate-800/50 rounded p-2">
                                  <p className="text-slate-400">{t('terminal.history.losses')}</p>
                                  <p className="font-bold text-red-400">{lossCount}</p>
                                </div>
                              </div>

                              {/* Trade List */}
                              <div className="max-h-64 overflow-auto space-y-2">
                                {filteredTrades.length === 0 ? (
                                  <p className="text-slate-400 text-center py-8">{t('terminal.history.noTradesMatch')}</p>
                                ) : (
                                  filteredTrades.map((trade, i) => {
                                    const closeDate = trade.closeTime ? new Date(trade.closeTime) : null;
                                    const formatDate = (date) => {
                                      if (!date) return '—';
                                      return new Intl.DateTimeFormat('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      }).format(date);
                                    };

                                    return (
                                      <div key={trade.id || i} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800/70 transition-colors">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <Badge className={`flex-shrink-0 ${trade.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {(trade.type === 'buy' ? t('terminal.tradingPanel.buyLong') : t('terminal.tradingPanel.sellShort')).toUpperCase()}
                                          </Badge>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                              <span className="text-white font-medium">{trade.symbol}</span>
                                              <span className="text-slate-400 text-xs">{trade.lotSize} {t('terminal.lots')}</span>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                              <span>{t('terminal.history.entry')}: {trade.entryPrice?.toFixed(5)}</span>
                                              <span>{t('terminal.history.exit')}: {trade.closePrice?.toFixed(5)}</span>
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
                                            const isAutoClosed = trade.closeReason === 'RISK_AUTO_CLOSE' ||
                                              trade.closeReason === 'risk_auto_close' ||
                                              String(trade.closeReason || '').toUpperCase() === 'RISK_AUTO_CLOSE';

                                            // Check if breach snapshot exists
                                            const isBreachTriggered = trade.breachTriggered === true ||
                                              trade.breachTriggered === 1 ||
                                              String(trade.breachTriggered) === 'true';
                                            const hasBreachPnL = trade.breachUnrealizedPnl !== null &&
                                              trade.breachUnrealizedPnl !== undefined &&
                                              Number.isFinite(trade.breachUnrealizedPnl);

                                            // Show breach snapshot if:
                                            // 1. Trade was auto-closed due to risk limit breach, OR
                                            // 2. Breach snapshot exists (breachTriggered + breachUnrealizedPnl)
                                            return isAutoClosed || (isBreachTriggered && hasBreachPnL);
                                          })() ? (
                                            <>
                                              {trade.breachUnrealizedPnl > 0 ? (
                                                <TrendingUp className="w-4 h-4 text-emerald-400" />
                                              ) : trade.breachUnrealizedPnl < 0 ? (
                                                <TrendingDown className="w-4 h-4 text-red-400" />
                                              ) : null}
                                              <div className="text-right">
                                                {/* Show breach PnL if available, otherwise show realized PnL */}
                                                {trade.breachUnrealizedPnl !== null &&
                                                  trade.breachUnrealizedPnl !== undefined &&
                                                  Number.isFinite(trade.breachUnrealizedPnl) ? (
                                                  <span className={`font-mono font-bold text-sm ${trade.breachUnrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {trade.breachUnrealizedPnl >= 0 ? '+' : ''}${trade.breachUnrealizedPnl.toFixed(2)}
                                                  </span>
                                                ) : (
                                                  <span className={`font-mono font-bold text-sm ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                    {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
                                                  </span>
                                                )}
                                                <Badge className="ml-1 text-xs bg-red-500/20 text-red-400" title={t('terminal.history.breachPnL')}>
                                                  {t('terminal.history.breach')}
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
                                              <span className={`font-mono font-bold text-sm ${trade.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {trade.pnl >= 0 ? '+' : ''}${trade.pnl?.toFixed(2)}
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
            <div className="col-span-5">
              <ChallengeRulesPanel account={account} challenge={selectedAccount} />
            </div>
          </div>
        </div>
      )}

      {/* Warning Popup */}
      {showWarning && warningMessage && (
        <ViolationPopup
          isOpen={showWarning}
          onClose={() => {
            setShowWarning(false);
            setWarningMessage('');
          }}
          type="warning"
          title={t('terminal.drawdownWarning.title')}
          message={warningMessage}
          details={t('terminal.drawdownWarning.details')}
        />
      )}

      {/* Modify Position Dialog */}
      <ModifyPositionDialog
        isOpen={!!modifyingPosition}
        onClose={() => setModifyingPosition(null)}
        position={modifyingPosition}
        onSave={handleSaveModifiedPosition}
        currentPrice={modifyingPosition ? (() => {
          const priceData = unifiedPrices[modifyingPosition.symbol];
          if (!priceData) return null;
          // Use the correct price side (ask for BUY, bid for SELL)
          if (typeof priceData === 'object') {
            return modifyingPosition.type === 'buy' ? priceData.ask : priceData.bid;
          }
          return priceData;
        })() : null}
      />

      {/* Violation Modal */}
      <ViolationModal
        isOpen={violationModal?.shown === true}
        onClose={() => setViolationModal(prev => prev ? { ...prev, shown: false } : null)}
        violationType={violationModal?.type}
        account={account}
      />

      {/* Account Status Banner (for locked/disqualified accounts) */}
      {accountStatusBanner && (
        <div className={`fixed bottom-4 left-4 right-4 lg:left-72 ${accountStatusBanner.type === 'error' ? 'bg-red-500/90' : 'bg-orange-500/90'
          } text-white px-4 py-3 rounded-lg flex items-center justify-between z-50`}>
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5" />
            <div>
              <span className="font-medium">{accountStatusBanner.title}</span>
              <p className="text-sm opacity-90">{accountStatusBanner.message}</p>
            </div>
          </div>
          <Button
            size="sm"
            className="bg-white text-red-600 hover:bg-white/90 font-semibold"
            onClick={() => setAccountStatusBanner(null)}
          >
            {t('common.dismiss')}
          </Button>
        </div>
      )}

    </div>
  );
}