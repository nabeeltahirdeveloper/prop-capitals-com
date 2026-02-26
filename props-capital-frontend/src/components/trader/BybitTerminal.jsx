import React, {
  useState,
  useRef,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ChevronDown, ArrowDown, ArrowUp, Search } from "lucide-react";
import { useTrading } from "@/contexts/TradingContext";
import { usePrices } from "@/contexts/PriceContext";
import { useTradingWebSocket } from "@/hooks/useTradingWebSocket";
import { useBinanceStream } from "@/hooks/useBinanceStream";
import { getAccountTrades, createTrade, updateTrade } from "@/api/trades";
import { createPendingOrder } from "@/api/pending-orders";
import { getCurrentPrice } from "@/api/market-data";
import { getAccountSummary, evaluateAccountRealTime } from "@/api/accounts";
import { isCryptoSymbol } from "@/config/symbolConfig";
import { useToast } from "@/components/ui/use-toast";
import { useTraderTheme } from "./TraderPanelLayout";
import TradingChart from "../trading/TradingChart";
import ViolationModal from "../trading/ViolationModal";
import SectionErrorBoundary from "../ui/SectionErrorBoundary";

/* ───────────────────────── Symbol List (Crypto + Forex) ───────────────────────── */
const ALL_SYMBOLS = [
  // Crypto
  {
    symbol: "BTCUSDT",
    base: "BTC",
    quote: "USDT",
    label: "BTC/USDT",
    type: "crypto",
  },
  {
    symbol: "ETHUSDT",
    base: "ETH",
    quote: "USDT",
    label: "ETH/USDT",
    type: "crypto",
  },
  {
    symbol: "SOLUSDT",
    base: "SOL",
    quote: "USDT",
    label: "SOL/USDT",
    type: "crypto",
  },
  {
    symbol: "XRPUSDT",
    base: "XRP",
    quote: "USDT",
    label: "XRP/USDT",
    type: "crypto",
  },
  {
    symbol: "DOGEUSDT",
    base: "DOGE",
    quote: "USDT",
    label: "DOGE/USDT",
    type: "crypto",
  },
  {
    symbol: "BNBUSDT",
    base: "BNB",
    quote: "USDT",
    label: "BNB/USDT",
    type: "crypto",
  },
  {
    symbol: "ADAUSDT",
    base: "ADA",
    quote: "USDT",
    label: "ADA/USDT",
    type: "crypto",
  },
  {
    symbol: "AVAXUSDT",
    base: "AVAX",
    quote: "USDT",
    label: "AVAX/USDT",
    type: "crypto",
  },
  {
    symbol: "DOTUSDT",
    base: "DOT",
    quote: "USDT",
    label: "DOT/USDT",
    type: "crypto",
  },
  // { symbol: 'MATICUSDT', base: 'MATIC', quote: 'USDT', label: 'MATIC/USDT', type: 'crypto' },
  {
    symbol: "LINKUSDT",
    base: "LINK",
    quote: "USDT",
    label: "LINK/USDT",
    type: "crypto",
  },
  // Forex Major Pairs
  {
    symbol: "EURUSD",
    base: "EUR",
    quote: "USD",
    label: "EUR/USD",
    type: "forex",
  },
  {
    symbol: "GBPUSD",
    base: "GBP",
    quote: "USD",
    label: "GBP/USD",
    type: "forex",
  },
  {
    symbol: "USDJPY",
    base: "USD",
    quote: "JPY",
    label: "USD/JPY",
    type: "forex",
  },
  {
    symbol: "USDCHF",
    base: "USD",
    quote: "CHF",
    label: "USD/CHF",
    type: "forex",
  },
  {
    symbol: "AUDUSD",
    base: "AUD",
    quote: "USD",
    label: "AUD/USD",
    type: "forex",
  },
  {
    symbol: "USDCAD",
    base: "USD",
    quote: "CAD",
    label: "USD/CAD",
    type: "forex",
  },
  {
    symbol: "NZDUSD",
    base: "NZD",
    quote: "USD",
    label: "NZD/USD",
    type: "forex",
  },
  // Forex Cross Pairs
  {
    symbol: "EURGBP",
    base: "EUR",
    quote: "GBP",
    label: "EUR/GBP",
    type: "forex",
  },
  {
    symbol: "EURJPY",
    base: "EUR",
    quote: "JPY",
    label: "EUR/JPY",
    type: "forex",
  },
  {
    symbol: "GBPJPY",
    base: "GBP",
    quote: "JPY",
    label: "GBP/JPY",
    type: "forex",
  },
  {
    symbol: "CADJPY",
    base: "CAD",
    quote: "JPY",
    label: "CAD/JPY",
    type: "forex",
  },
  // Metals
  {
    symbol: "XAUUSD",
    base: "XAU",
    quote: "USD",
    label: "XAU/USD",
    type: "forex",
  },
  {
    symbol: "XAGUSD",
    base: "XAG",
    quote: "USD",
    label: "XAG/USD",
    type: "forex",
  },
];

/* ───────────────────────── Theme Color Tokens ───────────────────────── */
const DARK_COLORS = {
  bg: "#0b0e11",
  panel: "#161a1e",
  card: "#1e2329",
  border: "#2b3139",
  borderL: "#363c46",
  textP: "#eaecef",
  textS: "#848e9c",
  textT: "#5e6673",
  green: "#0ecb81",
  greenBg: "#0ecb81",
  greenDim: "rgba(14,203,129,0.12)",
  red: "#f6465d",
  redDim: "rgba(246,70,93,0.12)",
  yellow: "#fcd535",
  yellowDim: "rgba(252,213,53,0.12)",
  orange: "#f0b90b",
  inputBg: "#1e2329",
  hoverBg: "rgba(255,255,255,0.04)",
};

const LIGHT_COLORS = {
  bg: "#f8f9fb",
  panel: "#ffffff",
  card: "#f1f3f5",
  border: "#e2e5e9",
  borderL: "#d1d5db",
  textP: "#1e2329",
  textS: "#5e6673",
  textT: "#848e9c",
  green: "#0ecb81",
  greenBg: "#0ecb81",
  greenDim: "rgba(14,203,129,0.10)",
  red: "#f6465d",
  redDim: "rgba(246,70,93,0.10)",
  yellow: "#f0b90b",
  yellowDim: "rgba(240,185,11,0.12)",
  orange: "#f0b90b",
  inputBg: "#f1f3f5",
  hoverBg: "rgba(0,0,0,0.03)",
};

/* ───────────────────────── Helpers ───────────────────────── */
// Convert BybitTerminal symbol format to backend API format
// e.g. 'EURUSD' → 'EUR/USD', 'BTCUSDT' → 'BTC/USD'
const toBackendSymbol = (sym, type) => {
  if (!sym) return sym;
  if (type === "crypto") {
    // BTCUSDT → BTC/USD (strip trailing T, add slash)
    const base = sym.replace(/USDT$/, "");
    return `${base}/USD`;
  }
  // Forex/Metals: EURUSD → EUR/USD, XAUUSD → XAU/USD, OILUSD → OIL/USD
  // Insert slash after first 3 chars
  if (sym.length >= 6) return `${sym.slice(0, 3)}/${sym.slice(3)}`;
  return sym;
};

/** Returns the correct contract size for a given symbol.
 *  XAU (Gold)  = 100 oz/lot
 *  XAG (Silver) = 5000 oz/lot
 *  Crypto       = 1 unit/lot
 *  Forex        = 100,000 units/lot
 *  Handles both "XAUUSD" and "XAU/USD" formats.
 *
 *  NOTE: Duplicates BybitEngine.getContractSpec() logic. All Bybit symbols
 *  are crypto (contractSize=1), so XAU/XAG/forex branches are dead code.
 *  Consider using engine.getContractSpec() instead if tradingEngine prop
 *  becomes available in this component. */
const getContractSize = (symbol) => {
  if (!symbol) return 100000;
  const upper = String(symbol)
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
  if (upper.includes("XAU")) return 100;
  if (upper.includes("XAG")) return 5000;
  if (
    upper.endsWith("USDT") ||
    /^(BTC|ETH|SOL|XRP|ADA|DOGE|BNB|AVAX|DOT|LINK)/.test(upper)
  )
    return 1;
  return 100000;
};

const formatPrice = (price) => {
  if (!price || price === 0) return "--";
  if (price >= 1000)
    return price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
};

const formatNum = (n, d = 2) => {
  if (n === null || n === undefined) return "--";
  return n.toLocaleString("en-US", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
};

const formatVolume = (v) => {
  if (!v || v === 0) return "--";
  if (v >= 1e9) return (v / 1e9).toFixed(2) + "B";
  if (v >= 1e6) return (v / 1e6).toFixed(2) + "M";
  if (v >= 1e3) return (v / 1e3).toFixed(2) + "K";
  return v.toFixed(2);
};

const getSymbolInfo = (sym) =>
  ALL_SYMBOLS.find((s) => s.symbol === sym) || ALL_SYMBOLS[0];

const toComparableSymbol = (sym) => {
  if (!sym) return "";
  return String(sym).toUpperCase().replace(/\//g, "").replace(/USDT$/, "USD");
};

const symbolsMatch = (a, b) => toComparableSymbol(a) === toComparableSymbol(b);

const deterministicQty = (base, i, side) => {
  const factor = side === "ask" ? 1.07 : 1.04;
  const raw = Math.max(0.001, base * Math.pow(factor, i));
  return raw.toFixed(5);
};

/* ═══════════════════════════════════════════════════════════════════════ */

const BybitTradingArea = ({ selectedChallenge }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isDark } = useTraderTheme();
  const C = isDark ? DARK_COLORS : LIGHT_COLORS;

  /* ── State ── */
  const [orderType, setOrderType] = useState("market");
  const [orderSide, setOrderSide] = useState("buy");
  const [limitPrice, setLimitPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [tpPrice, setTpPrice] = useState("");
  const [slPrice, setSlPrice] = useState("");
  const [showTpSl, setShowTpSl] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [obTab, setObTab] = useState("book");
  const [obMode, setObMode] = useState("both");
  const [chartTab, setChartTab] = useState("chart");
  // Partial close state
  const [partialCloseId, setPartialCloseId] = useState(null);
  const [partialCloseQty, setPartialCloseQty] = useState("");
  const [sliderPct, setSliderPct] = useState(0);
  const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState("");
  const dropdownRef = useRef(null);
  const chartRef = useRef(null);
  const [tradeMode, setTradeMode] = useState("cfd");
  const [selectedLeverage, setSelectedLeverage] = useState(100);
  const [violationModal, setViolationModal] = useState(null);
  const dismissedModalAccountsRef = useRef(new Set());
  const violationEnforcementThrottleRef = useRef({});

  const {
    selectedSymbol,
    setSelectedSymbol,
    selectedTimeframe,
    setSelectedTimeframe,
    chartType,
    setChartType,
  } = useTrading();
  const pricesRef = useRef({});
  const { prices: unifiedPrices, updatePrice: updatePriceContext } =
    usePrices();

  /* ── Symbol resolution ── */
  // Ensure selected symbol is one we support; default to BTCUSDT otherwise
  const rawSymbolStr =
    typeof selectedSymbol === "string"
      ? selectedSymbol
      : (selectedSymbol?.symbol ?? "BTCUSDT");
  const isKnownSymbol = ALL_SYMBOLS.some((s) => s.symbol === rawSymbolStr);
  const currentSymbolStr = isKnownSymbol ? rawSymbolStr : "BTCUSDT";
  const symbolInfo = getSymbolInfo(currentSymbolStr);

  // Set to BTCUSDT on mount if current symbol is unsupported
  useEffect(() => {
    if (!isKnownSymbol) setSelectedSymbol("BTCUSDT");
  }, [isKnownSymbol, setSelectedSymbol]);

  // Restore last symbol from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("bybit_selectedSymbol");
    if (saved && ALL_SYMBOLS.some((s) => s.symbol === saved)) {
      setSelectedSymbol(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Restore last timeframe from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("bybit_selectedTimeframe");
    const validTfs = ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1"];
    if (saved && validTfs.includes(saved)) {
      setSelectedTimeframe(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist symbol and timeframe to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("bybit_selectedSymbol", currentSymbolStr);
  }, [currentSymbolStr]);

  useEffect(() => {
    localStorage.setItem("bybit_selectedTimeframe", selectedTimeframe);
  }, [selectedTimeframe]);

  /* ── Binance live streams (crypto only — forex has no Binance data) ── */
  const isCrypto = symbolInfo.type === "crypto";
  const {
    orderBook,
    ticker,
    connected: binanceConnected,
  } = useBinanceStream(isCrypto ? currentSymbolStr : null);

  // Backend API symbol format (EUR/USD, BTC/USD) vs terminal format (EURUSD, BTCUSDT)
  const backendSymbol = toBackendSymbol(currentSymbolStr, symbolInfo.type);

  /* ── Backend price polling (Massive WS for forex, Binance WS for crypto via backend) ── */
  const [backendPrice, setBackendPrice] = useState(null);
  useEffect(() => {
    // For crypto, direct Binance stream is primary; backend is fallback
    // For forex, backend (Massive WS) is the ONLY source
    let cancelled = false;
    setBackendPrice(null);
    const fetchPrice = async () => {
      try {
        // getCurrentPrice auto-normalizes symbol format (BTCUSDT → BTC/USD, EURUSD → EUR/USD)
        const data = await getCurrentPrice(currentSymbolStr);
        if (cancelled) return;
        if (data && (data.bid || data.ask || data.price)) {
          const fallbackPrice = Number(data.price) || 0;
          const bid = Number(data.bid);
          const ask = Number(data.ask);
          const hasBid = Number.isFinite(bid) && bid > 0;
          const hasAsk = Number.isFinite(ask) && ask > 0;
          const syntheticSpread =
            fallbackPrice > 0 ? fallbackPrice * 0.0002 : 0;
          setBackendPrice({
            bid: hasBid
              ? bid
              : isCrypto
                ? Math.max(0, fallbackPrice - syntheticSpread / 2)
                : fallbackPrice,
            ask: hasAsk
              ? ask
              : isCrypto
                ? fallbackPrice + syntheticSpread / 2
                : fallbackPrice,
          });
        }
      } catch {
        /* silent */
      }
    };
    fetchPrice();
    // Poll forex every 1s (Massive WS data), crypto every 3s (Binance direct is primary)
    const interval = setInterval(fetchPrice, isCrypto ? 3000 : 1000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentSymbolStr, isCrypto]);

  /* ── Account ── */
  const accountId = selectedChallenge?.id;
  const { data: accountSummaryData } = useQuery({
    queryKey: ["accountSummary", accountId],
    queryFn: () => getAccountSummary(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });
  const accountStatus = accountSummaryData?.account?.status ?? selectedChallenge?.status;
  const normalizedAccountStatus = String(accountStatus || "").toLowerCase();
  const isAccountLocked =
    normalizedAccountStatus === "failed" ||
    normalizedAccountStatus === "inactive" ||
    normalizedAccountStatus === "daily_locked" ||
    normalizedAccountStatus === "disqualified" ||
    normalizedAccountStatus === "closed" ||
    normalizedAccountStatus === "paused";
  const balance = Number.isFinite(accountSummaryData?.account?.balance)
    ? accountSummaryData.account.balance
    : selectedChallenge?.currentBalance || 0;

  /* ── Queries ── */
  const { data: tradesData } = useQuery({
    queryKey: ["trades", accountId],
    queryFn: () => getAccountTrades(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });
  /* ── WebSocket ── */
  const handlePositionClosed = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
    queryClient.invalidateQueries({ queryKey: ["accountSummary", accountId] });
  }, [queryClient, accountId]);
  const handleAccountStatusChange = useCallback(
    (event) => {
      queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
      queryClient.invalidateQueries({ queryKey: ["pendingOrders", accountId] });
      queryClient.invalidateQueries({
        queryKey: ["accountSummary", accountId],
      });
      if (
        event?.status === "DISQUALIFIED" ||
        event?.status === "DAILY_LOCKED"
      ) {
        toast({
          title: "Account Status Changed",
          description: `Account is now ${event.status}`,
          variant: "destructive",
        });
        dismissedModalAccountsRef.current.delete(accountId);
        setViolationModal({
          type: event.status,
          shown: true,
          accountId,
        });
      }
    },
    [queryClient, accountId, toast],
  );
  const handleAccountUpdate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
    queryClient.invalidateQueries({ queryKey: ["accountSummary", accountId] });
  }, [queryClient, accountId]);
  useTradingWebSocket({
    accountId,
    onPositionClosed: handlePositionClosed,
    onAccountStatusChange: handleAccountStatusChange,
    onAccountUpdate: handleAccountUpdate,
  });

  /* ── Violation modal: show on status change or page load with locked status ── */
  useEffect(() => {
    if (!accountId) return;
    const status = normalizedAccountStatus;
    const type =
      status === "daily_locked"
        ? "DAILY_LOCKED"
        : status === "disqualified" || status === "failed"
          ? "DISQUALIFIED"
          : null;
    if (!type) {
      setViolationModal(null);
      dismissedModalAccountsRef.current.delete(accountId);
      return;
    }
    if (!dismissedModalAccountsRef.current.has(accountId)) {
      setViolationModal({ type, shown: true, accountId });
    }
  }, [accountId, normalizedAccountStatus]);

  const handleViolationModalClose = useCallback(() => {
    if (accountId) {
      dismissedModalAccountsRef.current.add(accountId);
    }
    setViolationModal((prev) => (prev ? { ...prev, shown: false } : null));
  }, [accountId]);

  /* ── Derived data ── */
  const openPositions = useMemo(() => {
    const t = Array.isArray(tradesData) ? tradesData : [];
    return t.filter((x) => !x.closedAt);
  }, [tradesData]);
  const usedMargin = useMemo(() => {
    return openPositions.reduce((sum, position) => {
      const vol = Number(position.volume);
      const price = Number(position.openPrice);
      const lev = Number(position.leverage) || 100;
      if (
        !Number.isFinite(vol) ||
        vol <= 0 ||
        !Number.isFinite(price) ||
        price <= 0
      )
        return sum;
      const cs = getContractSize(position.symbol);
      return sum + (vol * cs * price) / lev;
    }, 0);
  }, [openPositions]);
  const equity = Number.isFinite(accountSummaryData?.account?.equity)
    ? accountSummaryData.account.equity
    : balance;
  const freeMargin = Math.max(0, equity - usedMargin);
  const availableBalance = Math.max(0, balance - usedMargin);

  /* ── Auto-close positions when account is locked (violation enforcement) ── */
  useEffect(() => {
    if (!accountId || openPositions.length === 0) return;
    if (!isAccountLocked) return;

    const throttleKey = `${accountId}-locked-open-positions`;
    const now = Date.now();
    const last = violationEnforcementThrottleRef.current[throttleKey] || 0;
    if (now - last < 2000) return;
    violationEnforcementThrottleRef.current[throttleKey] = now;

    evaluateAccountRealTime(accountId, Number(equity))
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
        queryClient.invalidateQueries({ queryKey: ["accountSummary", accountId] });
      })
      .catch(() => {});
  }, [accountId, openPositions.length, isAccountLocked, equity, queryClient]);

  const recentTrades = useMemo(() => {
    const list = Array.isArray(tradesData) ? tradesData : [];
    return list
      .filter((t) => symbolsMatch(t.symbol, currentSymbolStr))
      .map((t) => ({
        id: t.id,
        type: t.type,
        volume: t.volume || 0,
        price: t.closePrice ?? t.openPrice ?? 0,
        time: t.closedAt || t.openedAt || null,
      }))
      .sort(
        (a, b) =>
          new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime(),
      )
      .slice(0, 40);
  }, [tradesData, currentSymbolStr]);

  const enrichedSelectedSymbol = useMemo(() => {
    const baseSymbol = getSymbolInfo(currentSymbolStr);
    const p = unifiedPrices[currentSymbolStr] || unifiedPrices[backendSymbol];
    if (
      p &&
      typeof p === "object" &&
      p.bid !== undefined &&
      p.ask !== undefined
    ) {
      return {
        ...baseSymbol,
        bid: p.bid,
        ask: p.ask,
        spread: Math.abs(p.ask - p.bid),
      };
    }
    return baseSymbol;
  }, [currentSymbolStr, unifiedPrices, backendSymbol]);

  /* ── Prices: Binance ticker for crypto, Massive WS (via backend) for forex ── */
  const currentBid = isCrypto
    ? parseFloat(orderBook?.bids?.[0]?.[0]) ||
      backendPrice?.bid ||
      enrichedSelectedSymbol?.bid ||
      (ticker?.lastPrice
        ? ticker.lastPrice - (ticker.lastPrice * 0.0002) / 2
        : 0)
    : backendPrice?.bid || enrichedSelectedSymbol?.bid || 0;
  const currentAsk = isCrypto
    ? parseFloat(orderBook?.asks?.[0]?.[0]) ||
      backendPrice?.ask ||
      enrichedSelectedSymbol?.ask ||
      (ticker?.lastPrice
        ? ticker.lastPrice + (ticker.lastPrice * 0.0002) / 2
        : 0)
    : backendPrice?.ask || enrichedSelectedSymbol?.ask || 0;
  const currentMid =
    currentBid && currentAsk ? (currentBid + currentAsk) / 2 : 0;

  const handlePriceUpdate = useCallback((s, p) => {
    pricesRef.current[s] = p;
  }, []);

  // Feed real-time bid/ask into PriceContext so TradingChart gets live price updates
  useEffect(() => {
    if (currentBid > 0 && currentAsk > 0) {
      updatePriceContext(currentSymbolStr, currentBid, currentAsk);
    }
  }, [currentBid, currentAsk, currentSymbolStr, updatePriceContext]);

  /* ── Order Book: live Binance for crypto, simulated for forex ── */
  const askOrders = useMemo(() => {
    if (orderBook.asks.length > 0) {
      let cumTotal = 0;
      return orderBook.asks
        .slice(0, 12)
        .map(([price, qty]) => {
          const p = parseFloat(price);
          const q = parseFloat(qty);
          cumTotal += q;
          return {
            price: formatPrice(p),
            qty: q.toFixed(5),
            total: cumTotal.toFixed(5),
            rawTotal: cumTotal,
            rawPrice: p,
          };
        })
        .reverse();
    }
    // Simulated depth for forex or when Binance disconnected
    const base = currentAsk || currentMid || 100;
    const step = base > 1000 ? 0.1 : base > 100 ? 0.01 : 0.0001;
    const rows = [];
    const baseQty = Math.max(0.02, base > 1000 ? 0.05 : base > 100 ? 0.2 : 0.8);
    for (let i = 0; i < 10; i++) {
      const price = base + (10 - i) * step;
      const qty = deterministicQty(baseQty, i, "ask");
      const cumTotal =
        rows.length > 0
          ? parseFloat(rows[rows.length - 1].rawTotal) + parseFloat(qty)
          : parseFloat(qty);
      rows.push({
        price: formatPrice(price),
        qty,
        total: cumTotal.toFixed(5),
        rawTotal: cumTotal,
        rawPrice: price,
      });
    }
    return rows;
  }, [orderBook.asks, currentAsk, currentMid]);

  const bidOrders = useMemo(() => {
    if (orderBook.bids.length > 0) {
      let cumTotal = 0;
      return orderBook.bids.slice(0, 12).map(([price, qty]) => {
        const p = parseFloat(price);
        const q = parseFloat(qty);
        cumTotal += q;
        return {
          price: formatPrice(p),
          qty: q.toFixed(5),
          total: cumTotal.toFixed(5),
          rawTotal: cumTotal,
          rawPrice: p,
        };
      });
    }
    // Simulated depth for forex
    const base = currentBid || currentMid || 100;
    const step = base > 1000 ? 0.1 : base > 100 ? 0.01 : 0.0001;
    const rows = [];
    const baseQty = Math.max(0.02, base > 1000 ? 0.05 : base > 100 ? 0.2 : 0.8);
    for (let i = 0; i < 10; i++) {
      const price = base - (i + 1) * step;
      const qty = deterministicQty(baseQty, i, "bid");
      const cumTotal =
        rows.length > 0
          ? parseFloat(rows[rows.length - 1].rawTotal) + parseFloat(qty)
          : parseFloat(qty);
      rows.push({
        price: formatPrice(price),
        qty,
        total: cumTotal.toFixed(5),
        rawTotal: cumTotal,
        rawPrice: price,
      });
    }
    return rows;
  }, [orderBook.bids, currentBid, currentMid]);

  const maxAskTotal = useMemo(
    () => Math.max(...askOrders.map((o) => o.rawTotal || 0), 1),
    [askOrders],
  );
  const maxBidTotal = useMemo(
    () => Math.max(...bidOrders.map((o) => o.rawTotal || 0), 1),
    [bidOrders],
  );

  /* ── Spread ── */
  const spread = useMemo(() => {
    if (orderBook.asks.length > 0 && orderBook.bids.length > 0) {
      return (
        parseFloat(orderBook.asks[0][0]) - parseFloat(orderBook.bids[0][0])
      );
    }
    // For forex, calculate from bid/ask
    if (currentAsk > 0 && currentBid > 0) {
      return currentAsk - currentBid;
    }
    return 0;
  }, [orderBook, currentAsk, currentBid]);

  /* ── Computed values ── */
  const contractSize = getContractSize(currentSymbolStr);
  const effectivePrice =
    orderType === "limit" && limitPrice
      ? parseFloat(limitPrice) || 0
      : orderSide === "buy"
        ? currentAsk
        : currentBid;
  const qty = parseFloat(quantity) || 0;
  const orderValue = qty * effectivePrice * contractSize;
  // Commission: crypto 0.1% of notional, metals $7/lot, forex $7/lot standard
  const commission = isCrypto ? orderValue * 0.001 : qty > 0 ? qty * 7 : 0;

  /* ── Slider → qty ── */
  const handleSlider = useCallback(
    (pct) => {
      setSliderPct(pct);
      if (!availableBalance || !effectivePrice || effectivePrice === 0) return;
      const maxQty = (availableBalance * selectedLeverage) / (effectivePrice * contractSize);
      setQuantity(((maxQty * pct) / 100).toFixed(isCrypto ? 6 : 2));
    },
    [availableBalance, effectivePrice, contractSize, isCrypto, selectedLeverage],
  );

  /* ── Symbol switching ── */
  const handleSymbolSelect = useCallback(
    (sym) => {
      setSelectedSymbol(sym);
      setSymbolDropdownOpen(false);
      setSymbolSearch("");
      setLimitPrice("");
      setQuantity("");
      setSliderPct(0);
    },
    [setSelectedSymbol],
  );

  const filteredSymbols = useMemo(() => {
    if (!symbolSearch) return ALL_SYMBOLS;
    const q = symbolSearch.toLowerCase();
    return ALL_SYMBOLS.filter(
      (s) =>
        s.symbol.toLowerCase().includes(q) || s.base.toLowerCase().includes(q),
    );
  }, [symbolSearch]);

  /* ── Close dropdown on outside click ── */
  React.useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSymbolDropdownOpen(false);
      }
    };
    if (symbolDropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [symbolDropdownOpen]);

  /* ── Mutations ── */
  const createTradeMutation = useMutation({
    mutationFn: createTrade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
      queryClient.invalidateQueries({
        queryKey: ["accountSummary", accountId],
      });
      toast({ title: "Order Placed" });
      setQuantity("");
      setLimitPrice("");
      setTpPrice("");
      setSlPrice("");
      setSliderPct(0);
    },
    onError: (e) => {
      toast({
        title: "Order Failed",
        description: e?.response?.data?.message || e.message || "Failed",
        variant: "destructive",
      });
    },
  });
  const createPendingOrderMutation = useMutation({
    mutationFn: createPendingOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pendingOrders", accountId] });
      queryClient.invalidateQueries({
        queryKey: ["accountSummary", accountId],
      });
      toast({ title: "Pending Order Created" });
      setQuantity("");
      setLimitPrice("");
      setTpPrice("");
      setSlPrice("");
      setSliderPct(0);
    },
    onError: (e) => {
      toast({
        title: "Order Failed",
        description: e?.response?.data?.message || e.message || "Failed",
        variant: "destructive",
      });
    },
  });

  const closePositionMutation = useMutation({
    mutationFn: ({ tradeId, closePrice, profit, closeReason }) =>
      updateTrade(tradeId, { closePrice, profit, closeReason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades", accountId] });
      queryClient.invalidateQueries({
        queryKey: ["accountSummary", accountId],
      });
      setPartialCloseId(null);
      setPartialCloseQty("");
      toast({ title: "Position Closed" });
    },
    onError: (e) => {
      toast({
        title: "Close Failed",
        description: e?.response?.data?.message || e.message || "Failed",
        variant: "destructive",
      });
    },
  });

  const handleClosePosition = useCallback(
    async (pos, partialVol) => {
      const closePrice = pos.type === "BUY" ? currentBid : currentAsk;
      if (!closePrice) return;
      const fullVol = pos.volume || 0;

      await closePositionMutation.mutateAsync({
        tradeId: pos.id,
        closePrice,
        closeReason:
          partialVol && partialVol < fullVol ? "PARTIAL_CLOSE" : "MANUAL",
      });

      // Re-open remaining volume for partial close
      if (partialVol && partialVol < fullVol) {
        const remainVol = parseFloat((fullVol - partialVol).toFixed(6));
        if (remainVol > 0) {
          await createTradeMutation.mutateAsync({
            accountId,
            symbol: pos.symbol || backendSymbol,
            type: pos.type,
            volume: remainVol,
            openPrice: closePrice,
            leverage: selectedLeverage,
            stopLoss: pos.stopLoss ?? null,
            takeProfit: pos.takeProfit ?? null,
          });
        }
      }
    },
    [
      currentBid,
      currentAsk,
      currentSymbolStr,
      backendSymbol,
      accountId,
      closePositionMutation,
      createTradeMutation,
      selectedLeverage,
    ],
  );

  /* ── Handlers ── */
  const handlePlaceOrder = async () => {
    if (isAccountLocked) {
      toast({ title: "Account Locked", variant: "destructive" });
      return;
    }
    if (!accountId || !currentSymbolStr) {
      toast({ title: "Select a symbol", variant: "destructive" });
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      toast({ title: "Enter valid quantity", variant: "destructive" });
      return;
    }
    if (
      (orderType === "limit" || orderType === "tp/sl") &&
      (!limitPrice || parseFloat(limitPrice) <= 0)
    ) {
      toast({ title: "Enter valid price", variant: "destructive" });
      return;
    }
    // Margin check: reject if requested quantity exceeds available balance
    const priceForMargin =
      orderType === "limit" && limitPrice
        ? parseFloat(limitPrice)
        : orderSide === "buy"
          ? currentAsk
          : currentBid;
    const maxAllowedQty =
      priceForMargin > 0 && contractSize > 0
        ? (availableBalance * selectedLeverage) / (priceForMargin * contractSize)
        : 0;
    const requestedQty = parseFloat(quantity);
    if (requestedQty > maxAllowedQty * 1.001) {
      toast({
        title: "Insufficient Margin",
        description: `Max allowed: ${maxAllowedQty.toFixed(isCrypto ? 6 : 4)} ${isCrypto ? symbolInfo.base : "Lots"}`,
        variant: "destructive",
      });
      return;
    }
    setIsPlacingOrder(true);
    try {
      if (orderType === "market") {
        const openPrice = orderSide === "buy" ? currentAsk : currentBid;
        if (!openPrice) {
          toast({ title: "No price available", variant: "destructive" });
          return;
        }
        await createTradeMutation.mutateAsync({
          accountId,
          symbol: backendSymbol,
          type: orderSide.toUpperCase(),
          volume: parseFloat(quantity),
          openPrice,
          leverage: selectedLeverage,
          stopLoss: slPrice ? parseFloat(slPrice) : null,
          takeProfit: tpPrice ? parseFloat(tpPrice) : null,
        });
      } else {
        await createPendingOrderMutation.mutateAsync({
          tradingAccountId: accountId,
          symbol: backendSymbol,
          type: orderSide.toUpperCase(),
          orderType: orderType === "tp/sl" ? "STOP" : "LIMIT",
          volume: parseFloat(quantity),
          price: parseFloat(limitPrice),
          leverage: selectedLeverage,
          stopLoss: slPrice ? parseFloat(slPrice) : null,
          takeProfit: tpPrice ? parseFloat(tpPrice) : null,
        });
      }
    } catch (e) {
      console.error("[BybitTerminal] Place order failed:", e);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  /* ── Chart buy/sell: execute market order directly using current qty ── */
  const handleChartBuy = useCallback(async () => {
    if (isAccountLocked || !accountId || !currentSymbolStr || !currentAsk)
      return;
    const vol = parseFloat(quantity) || (isCrypto ? 0.001 : 0.01);
    const maxAllowed =
      currentAsk > 0 && contractSize > 0
        ? (availableBalance * selectedLeverage) / (currentAsk * contractSize)
        : 0;
    if (vol > maxAllowed * 1.001) {
      toast({
        title: "Insufficient Margin",
        description: `Max allowed: ${maxAllowed.toFixed(isCrypto ? 6 : 4)} ${isCrypto ? "" : "Lots"}`,
        variant: "destructive",
      });
      return;
    }
    setOrderSide("buy");
    try {
      await createTradeMutation.mutateAsync({
        accountId,
        symbol: backendSymbol,
        type: "BUY",
        volume: vol,
        openPrice: currentAsk,
        leverage: selectedLeverage,
      });
    } catch (e) {
      console.error("[BybitTerminal] Chart buy failed:", e);
    }
  }, [
    isAccountLocked,
    accountId,
    currentSymbolStr,
    currentAsk,
    quantity,
    isCrypto,
    backendSymbol,
    contractSize,
    availableBalance,
    createTradeMutation,
    selectedLeverage,
    toast,
  ]);

  const handleChartSell = useCallback(async () => {
    if (isAccountLocked || !accountId || !currentSymbolStr || !currentBid)
      return;
    const vol = parseFloat(quantity) || (isCrypto ? 0.001 : 0.01);
    const maxAllowed =
      currentBid > 0 && contractSize > 0
        ? (availableBalance * selectedLeverage) / (currentBid * contractSize)
        : 0;
    if (vol > maxAllowed * 1.001) {
      toast({
        title: "Insufficient Margin",
        description: `Max allowed: ${maxAllowed.toFixed(isCrypto ? 6 : 4)} ${isCrypto ? "" : "Lots"}`,
        variant: "destructive",
      });
      return;
    }
    setOrderSide("sell");
    try {
      await createTradeMutation.mutateAsync({
        accountId,
        symbol: backendSymbol,
        type: "SELL",
        volume: vol,
        openPrice: currentBid,
        leverage: selectedLeverage,
      });
    } catch (e) {
      console.error("[BybitTerminal] Chart sell failed:", e);
    }
  }, [
    isAccountLocked,
    accountId,
    currentSymbolStr,
    currentBid,
    quantity,
    isCrypto,
    backendSymbol,
    contractSize,
    availableBalance,
    createTradeMutation,
    selectedLeverage,
    toast,
  ]);

  const timeframes = [
    { key: "M1", label: "1m" },
    { key: "M5", label: "5m" },
    { key: "M15", label: "15m" },
    { key: "M30", label: "30m" },
    { key: "H1", label: "1h" },
    { key: "H4", label: "4h" },
    { key: "D1", label: "1d" },
    { key: "W1", label: "1w" },
  ];

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <div
      className="flex flex-col h-full overflow-hidden"
      style={{
        background: C.bg,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        color: C.textP,
        fontSize: 12,
      }}
    >
      {/* ═══ LOCKED BANNER ═══ */}
      {isAccountLocked && (
        <div
          style={{ background: C.redDim, borderBottom: `1px solid ${C.red}` }}
          className="px-4 py-1.5 text-center"
        >
          <span style={{ color: C.red, fontSize: 12 }}>
            Account{" "}
            {normalizedAccountStatus === "failed" ||
            normalizedAccountStatus === "disqualified"
              ? "Failed - Trading Disabled"
              : normalizedAccountStatus === "daily_locked"
                ? "Daily Locked"
                : "Inactive"}
          </span>
        </div>
      )}

      {/* ═══ TOP HEADER BAR ═══ */}
      <div
        style={{
          background: C.panel,
          borderBottom: `1px solid ${C.border}`,
          position: "relative",
          zIndex: 100,
        }}
        className="flex items-center px-4 py-3 gap-y-4 gap-x-6 flex-wrap"
      >
        {/* Symbol selector */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setSymbolDropdownOpen(!symbolDropdownOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded transition-colors"
            style={{ background: symbolDropdownOpen ? C.card : "transparent" }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: C.textP }}>
              {symbolInfo.label}
            </span>
            <span
              style={{
                fontSize: 11,
                color: C.textS,
                background: C.card,
                padding: "2px 6px",
                borderRadius: 3,
              }}
            >
              Perpetual
            </span>
            <ChevronDown
              size={14}
              style={{
                color: C.textS,
                transform: symbolDropdownOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </button>

          {/* Dropdown */}
          {symbolDropdownOpen && (
            <div
              className="absolute top-full left-0 mt-1 rounded-lg overflow-hidden shadow-xl"
              style={{
                background: C.panel,
                border: `1px solid ${C.border}`,
                width: 260,
                zIndex: 9999,
              }}
            >
              <div
                className="p-2"
                style={{ borderBottom: `1px solid ${C.border}` }}
              >
                <div
                  className="flex items-center gap-2 px-2 py-1.5 rounded"
                  style={{ background: C.card }}
                >
                  <Search size={14} style={{ color: C.textT }} />
                  <input
                    type="text"
                    value={symbolSearch}
                    onChange={(e) => setSymbolSearch(e.target.value)}
                    placeholder="Search..."
                    autoFocus
                    style={{
                      flex: 1,
                      background: "transparent",
                      color: C.textP,
                      fontSize: 12,
                      outline: "none",
                      border: "none",
                    }}
                  />
                </div>
              </div>
              <div style={{ maxHeight: 320, overflowY: "auto" }}>
                {(() => {
                  let lastType = "";
                  return filteredSymbols.map((s) => {
                    const showHeader = s.type !== lastType;
                    lastType = s.type;
                    return (
                      <React.Fragment key={s.symbol}>
                        {showHeader && (
                          <div
                            className="px-3 py-1.5 sticky top-0"
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: C.textT,
                              background: C.panel,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                            }}
                          >
                            {s.type === "crypto" ? "Crypto" : "Forex & Metals"}
                          </div>
                        )}
                        <button
                          onClick={() => handleSymbolSelect(s.symbol)}
                          className="flex items-center justify-between w-full px-3 py-2 transition-colors"
                          style={{
                            background:
                              currentSymbolStr === s.symbol
                                ? C.yellowDim
                                : "transparent",
                            color:
                              currentSymbolStr === s.symbol
                                ? C.yellow
                                : C.textP,
                          }}
                          onMouseEnter={(e) => {
                            if (currentSymbolStr !== s.symbol)
                              e.currentTarget.style.background = C.hoverBg;
                          }}
                          onMouseLeave={(e) => {
                            if (currentSymbolStr !== s.symbol)
                              e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 500 }}>
                            {s.label}
                          </span>
                          <span style={{ fontSize: 11, color: C.textT }}>
                            {s.base}
                          </span>
                        </button>
                      </React.Fragment>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Current price */}
        <div className="shrink-0">
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: isCrypto
                ? ticker?.priceChangePercent >= 0
                  ? C.green
                  : C.red
                : C.textP,
              fontFamily: "monospace",
            }}
          >
            {currentMid > 0 ? formatPrice(currentMid) : "--"}
          </span>
          <div style={{ fontSize: 11, color: C.textS }}>
            {currentMid > 0 ? `≈${formatNum(currentMid)} USD` : ""}
          </div>
        </div>

        {/* 24h Stats from Binance ticker */}
        {[
          {
            label: "24h Change",
            value: ticker
              ? `${ticker.priceChangePercent >= 0 ? "+" : ""}${ticker.priceChangePercent.toFixed(2)}%`
              : "--",
            color: ticker
              ? ticker.priceChangePercent >= 0
                ? C.green
                : C.red
              : C.textS,
          },
          {
            label: "24h High",
            value: ticker ? formatPrice(ticker.highPrice) : "--",
            color: C.textP,
          },
          {
            label: "24h Low",
            value: ticker ? formatPrice(ticker.lowPrice) : "--",
            color: C.textP,
          },
          {
            label: "24H Turnover(USDT)",
            value: ticker ? formatVolume(ticker.quoteVolume) : "--",
            color: C.textP,
          },
        ].map((item, i) => (
          <div key={i} className="shrink-0 hidden md:block">
            <div style={{ fontSize: 10, color: C.textT, marginBottom: 1 }}>
              {item.label}
            </div>
            <div
              style={{
                fontSize: 12,
                color: item.color,
                fontFamily: "monospace",
              }}
            >
              {item.value}
            </div>
          </div>
        ))}

        {/* Connection indicator */}
        <div className="shrink-0 hidden lg:flex items-center gap-1 ml-auto">
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: isCrypto
                ? binanceConnected
                  ? C.green
                  : C.red
                : C.yellow,
            }}
          />
          <span style={{ fontSize: 10, color: C.textT }}>
            {isCrypto ? (binanceConnected ? "Live" : "Offline") : "Polling"}
          </span>
        </div>
      </div>

      {/* ═══ CHART NAV TABS ═══ */}
      <div
        style={{
          background: C.panel,
          borderBottom: `1px solid ${C.border}`,
          position: "relative",
          zIndex: 2,
        }}
        className="flex items-center px-4 gap-1"
      >
        {[
          { key: "chart", label: "Chart" },
          { key: "overview", label: "Overview" },
          { key: "data", label: "Data" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setChartTab(tab.key)}
            className="px-3 py-2"
            style={{
              fontSize: 12,
              color: chartTab === tab.key ? C.textP : C.textS,
              fontWeight: chartTab === tab.key ? 600 : 400,
              borderBottom:
                chartTab === tab.key
                  ? `2px solid ${C.yellow}`
                  : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
        <div className="flex-1" />
      </div>

      {/* ═══ MAIN 3-COLUMN AREA ═══ */}
      <div
        className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden"
        style={{ position: "relative", zIndex: 1 }}
      >
        {/* ── LEFT: CHART / OVERVIEW / DATA ── */}
        <div
          className="flex-1 min-w-0 min-h-[350px] lg:min-h-[300px] flex flex-col"
          style={{ background: C.panel }}
        >
          {chartTab === "chart" && (
            <SectionErrorBoundary label="Chart">
              {/* Timeframe bar */}
              <div
                className="flex items-center px-2 py-1 gap-0.5 overflow-x-auto"
                style={{ borderBottom: `1px solid ${C.border}` }}
              >
                {timeframes.map((tf) => (
                  <button
                    key={tf.key}
                    onClick={() => setSelectedTimeframe(tf.key)}
                    className="px-2 py-1 shrink-0"
                    style={{
                      fontSize: 11,
                      fontWeight: selectedTimeframe === tf.key ? 600 : 400,
                      color: selectedTimeframe === tf.key ? C.yellow : C.textS,
                      background:
                        selectedTimeframe === tf.key
                          ? C.yellowDim
                          : "transparent",
                      borderRadius: 3,
                    }}
                  >
                    {tf.label}
                  </button>
                ))}
                <div
                  style={{
                    width: 1,
                    height: 14,
                    background: C.border,
                    margin: "0 6px",
                  }}
                  className="shrink-0"
                />
                <button
                  onClick={() => setChartType("candlestick")}
                  className="px-2 py-1 shrink-0"
                  style={{
                    fontSize: 11,
                    color:
                      chartType === "candlestick" || chartType === "candles"
                        ? C.textP
                        : C.textS,
                  }}
                >
                  Candles
                </button>
                <button
                  onClick={() => setChartType("line")}
                  className="px-2 py-1 shrink-0"
                  style={{
                    fontSize: 11,
                    color: chartType === "line" ? C.textP : C.textS,
                  }}
                >
                  Line
                </button>
                <div style={{ flex: 1 }} />
                <button
                  onClick={() => chartRef.current?.fitContent()}
                  className="px-2 py-1 shrink-0"
                  title="Reset chart view"
                  style={{
                    fontSize: 11,
                    color: C.textS,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M21 3H3v18h18V3z" />
                    <path d="M21 3L3 21M3 3l18 18" />
                  </svg>
                  Fit
                </button>
              </div>
              <div className="flex-1">
                <TradingChart
                  ref={chartRef}
                  key={`chart-bybit-${currentSymbolStr}`}
                  symbol={enrichedSelectedSymbol}
                  openPositions={openPositions}
                  onPriceUpdate={handlePriceUpdate}
                  showBuySellPanel={true}
                  onBuyClick={handleChartBuy}
                  onSellClick={handleChartSell}
                />
              </div>
            </SectionErrorBoundary>
          )}

          {chartTab === "overview" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Symbol Header */}
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: C.card,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{ fontSize: 14, fontWeight: 700, color: C.yellow }}
                  >
                    {symbolInfo.base.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, color: C.textP }}
                  >
                    {symbolInfo.label}
                  </div>
                  <div style={{ fontSize: 12, color: C.textS }}>
                    {isCrypto
                      ? "Perpetual Contract"
                      : symbolInfo.type === "forex" && symbolInfo.base === "XAU"
                        ? "Perpetual Metal"
                        : "Forex Perpetual"}
                  </div>
                </div>
              </div>

              {/* Price Overview Card */}
              <div
                style={{
                  background: C.card,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                }}
                className="p-4"
              >
                <div
                  style={{
                    fontSize: 11,
                    color: C.textT,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 12,
                  }}
                >
                  Price Overview
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div
                      style={{ fontSize: 10, color: C.textT, marginBottom: 2 }}
                    >
                      Bid
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: C.green,
                        fontFamily: "monospace",
                      }}
                    >
                      {currentBid > 0 ? formatPrice(currentBid) : "--"}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 10, color: C.textT, marginBottom: 2 }}
                    >
                      Ask
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: C.red,
                        fontFamily: "monospace",
                      }}
                    >
                      {currentAsk > 0 ? formatPrice(currentAsk) : "--"}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 10, color: C.textT, marginBottom: 2 }}
                    >
                      Mid Price
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: C.textP,
                        fontFamily: "monospace",
                      }}
                    >
                      {currentMid > 0 ? formatPrice(currentMid) : "--"}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 10, color: C.textT, marginBottom: 2 }}
                    >
                      Spread
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: C.textP,
                        fontFamily: "monospace",
                      }}
                    >
                      {spread > 0 ? formatPrice(spread) : "--"}
                    </div>
                  </div>
                </div>
              </div>

              {/* 24h Statistics (crypto only, from Binance ticker) */}
              {isCrypto && ticker && (
                <div
                  style={{
                    background: C.card,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                  }}
                  className="p-4"
                >
                  <div
                    style={{
                      fontSize: 11,
                      color: C.textT,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 12,
                    }}
                  >
                    24h Statistics
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.textT,
                          marginBottom: 2,
                        }}
                      >
                        24h Change
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color:
                            ticker.priceChangePercent >= 0 ? C.green : C.red,
                          fontFamily: "monospace",
                        }}
                      >
                        {ticker.priceChangePercent >= 0 ? "+" : ""}
                        {ticker.priceChangePercent.toFixed(2)}%
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.textT,
                          marginBottom: 2,
                        }}
                      >
                        24h Volume
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.textP,
                          fontFamily: "monospace",
                        }}
                      >
                        {formatVolume(ticker.volume)} {symbolInfo.base}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.textT,
                          marginBottom: 2,
                        }}
                      >
                        24h High
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.textP,
                          fontFamily: "monospace",
                        }}
                      >
                        {formatPrice(ticker.highPrice)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.textT,
                          marginBottom: 2,
                        }}
                      >
                        24h Low
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.textP,
                          fontFamily: "monospace",
                        }}
                      >
                        {formatPrice(ticker.lowPrice)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.textT,
                          marginBottom: 2,
                        }}
                      >
                        24h Turnover
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.textP,
                          fontFamily: "monospace",
                        }}
                      >
                        {formatVolume(ticker.quoteVolume)} USDT
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: C.textT,
                          marginBottom: 2,
                        }}
                      >
                        Last Price
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: C.textP,
                          fontFamily: "monospace",
                        }}
                      >
                        {formatPrice(ticker.lastPrice)}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Market Info */}
              <div
                style={{
                  background: C.card,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                }}
                className="p-4"
              >
                <div
                  style={{
                    fontSize: 11,
                    color: C.textT,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 12,
                  }}
                >
                  Market Info
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Base Asset", value: symbolInfo.base },
                    { label: "Quote Asset", value: symbolInfo.quote },
                    {
                      label: "Market Type",
                      value: isCrypto
                        ? "Crypto Perpetual"
                        : symbolInfo.base === "XAU" || symbolInfo.base === "XAG"
                          ? "Precious Metal"
                          : "Forex",
                    },
                    {
                      label: "Price Source",
                      value: isCrypto ? "Binance WebSocket" : "REST Polling",
                    },
                    { label: "Status", value: "Trading" },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center"
                      style={{ fontSize: 12 }}
                    >
                      <span style={{ color: C.textS }}>{row.label}</span>
                      <span style={{ color: C.textP, fontWeight: 500 }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* About Section */}
              <div
                style={{
                  background: C.card,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                }}
                className="p-4"
              >
                <div
                  style={{
                    fontSize: 11,
                    color: C.textT,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 8,
                  }}
                >
                  About {symbolInfo.label}
                </div>
                <p style={{ fontSize: 12, color: C.textS, lineHeight: 1.6 }}>
                  {isCrypto
                    ? `${symbolInfo.base} is traded against ${symbolInfo.quote} as a perpetual contract. This pair tracks the spot price of ${symbolInfo.base} and is one of the most liquid cryptocurrency trading pairs available.`
                    : symbolInfo.base === "XAU"
                      ? "Gold (XAU) is a precious metal traded against the US Dollar. It is considered a safe-haven asset and is one of the most actively traded commodities worldwide."
                      : symbolInfo.base === "XAG"
                        ? "Silver (XAG) is a precious metal traded against the US Dollar. It serves as both an industrial commodity and a store of value."
                        : `The ${symbolInfo.base}/${symbolInfo.quote} pair represents the exchange rate between the ${symbolInfo.base} and ${symbolInfo.quote}. It is one of the major forex pairs traded in the global foreign exchange market.`}
                </p>
              </div>
            </div>
          )}

          {chartTab === "data" && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Contract / Pair Specifications */}
              <div
                style={{
                  background: C.card,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                }}
                className="p-4"
              >
                <div
                  style={{
                    fontSize: 11,
                    color: C.textT,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 12,
                  }}
                >
                  {isCrypto ? "Contract Specifications" : "Pair Specifications"}
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Symbol", value: symbolInfo.label },
                    {
                      label: "Type",
                      value: isCrypto ? "USDT Perpetual" : "Perpetual",
                    },
                    { label: "Base Currency", value: symbolInfo.base },
                    { label: "Quote Currency", value: symbolInfo.quote },
                    {
                      label: "Contract Size",
                      value: isCrypto
                        ? `1 ${symbolInfo.base}`
                        : "100,000 units",
                    },
                    {
                      label: "Tick Size",
                      value: isCrypto
                        ? currentMid >= 1000
                          ? "0.01"
                          : currentMid >= 1
                            ? "0.0001"
                            : "0.000001"
                        : currentMid >= 100
                          ? "0.001"
                          : "0.00001",
                    },
                    { label: "Margin", value: `Perpetual (${selectedLeverage}x Leverage)` },
                    {
                      label: "Trading Hours",
                      value: isCrypto ? "24/7" : "Mon-Fri, 00:00-24:00 UTC",
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center py-1"
                      style={{
                        fontSize: 12,
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <span style={{ color: C.textS }}>{row.label}</span>
                      <span
                        style={{
                          color: C.textP,
                          fontWeight: 500,
                          fontFamily: "monospace",
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Current Position for this symbol */}
              {(() => {
                const symbolPositions = openPositions.filter((t) =>
                  symbolsMatch(t.symbol, currentSymbolStr),
                );
                if (symbolPositions.length === 0)
                  return (
                    <div
                      style={{
                        background: C.card,
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                      }}
                      className="p-4"
                    >
                      <div
                        style={{
                          fontSize: 11,
                          color: C.textT,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: 0.5,
                          marginBottom: 12,
                        }}
                      >
                        My Position
                      </div>
                      <p
                        style={{
                          fontSize: 12,
                          color: C.textS,
                          textAlign: "center",
                          padding: "12px 0",
                        }}
                      >
                        No open position for {symbolInfo.label}
                      </p>
                    </div>
                  );
                return (
                  <div
                    style={{
                      background: C.card,
                      borderRadius: 8,
                      border: `1px solid ${C.border}`,
                    }}
                    className="p-4"
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: C.textT,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        marginBottom: 12,
                      }}
                    >
                      My Positions — {symbolInfo.label}
                    </div>
                    {symbolPositions.map((pos) => {
                      const exitP =
                        pos.type === "BUY" ? currentBid : currentAsk;
                      const priceDiff =
                        pos.type === "BUY"
                          ? exitP - pos.openPrice
                          : pos.openPrice - exitP;
                      const posCs = getContractSize(
                        pos.symbol || currentSymbolStr,
                      );
                      const pnl = priceDiff * (pos.volume || 0) * posCs;
                      return (
                        <div
                          key={pos.id}
                          className="space-y-2 mb-3 pb-3"
                          style={{ borderBottom: `1px solid ${C.border}` }}
                        >
                          <div className="flex justify-between items-center">
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: pos.type === "BUY" ? C.green : C.red,
                              }}
                            >
                              {pos.type === "BUY" ? "Long" : "Short"}
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: pnl >= 0 ? C.green : C.red,
                                fontFamily: "monospace",
                              }}
                            >
                              {pnl >= 0 ? "+" : ""}
                              {pnl.toFixed(2)} USDT
                            </span>
                          </div>
                          {[
                            {
                              label: "Size",
                              value: `${pos.volume?.toFixed(isCrypto ? 6 : 2)} ${isCrypto ? symbolInfo.base : "Lots"}`,
                            },
                            {
                              label: "Entry Price",
                              value: formatPrice(pos.openPrice),
                            },
                            { label: "Mark Price", value: formatPrice(exitP) },
                            { label: "Mode", value: "Perpetual" },
                            ...(pos.stopLoss
                              ? [
                                  {
                                    label: "Stop Loss",
                                    value: formatPrice(pos.stopLoss),
                                  },
                                ]
                              : []),
                            ...(pos.takeProfit
                              ? [
                                  {
                                    label: "Take Profit",
                                    value: formatPrice(pos.takeProfit),
                                  },
                                ]
                              : []),
                          ].map((row) => (
                            <div
                              key={row.label}
                              className="flex justify-between"
                              style={{ fontSize: 12 }}
                            >
                              <span style={{ color: C.textS }}>
                                {row.label}
                              </span>
                              <span
                                style={{
                                  color: C.textP,
                                  fontFamily: "monospace",
                                }}
                              >
                                {row.value}
                              </span>
                            </div>
                          ))}

                          {/* Partial close UI */}
                          {partialCloseId === pos.id && (
                            <div
                              className="flex items-center gap-1 mt-2"
                              style={{
                                background: C.card,
                                borderRadius: 4,
                                padding: "6px 8px",
                                border: `1px solid ${C.border}`,
                              }}
                            >
                              <input
                                type="number"
                                step={isCrypto ? 0.001 : 0.01}
                                min={isCrypto ? 0.001 : 0.01}
                                max={pos.volume}
                                value={partialCloseQty}
                                onChange={(e) =>
                                  setPartialCloseQty(e.target.value)
                                }
                                placeholder={`Max ${pos.volume}`}
                                style={{
                                  flex: 1,
                                  background: C.inputBg,
                                  border: `1px solid ${C.border}`,
                                  borderRadius: 3,
                                  color: C.textP,
                                  fontSize: 12,
                                  padding: "3px 6px",
                                  outline: "none",
                                }}
                              />
                              <button
                                onClick={() => {
                                  const v = parseFloat(partialCloseQty);
                                  if (v > 0 && v < (pos.volume || 0))
                                    handleClosePosition(pos, v);
                                  else if (v >= (pos.volume || 0))
                                    handleClosePosition(pos);
                                }}
                                style={{
                                  background: C.red,
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: 3,
                                  fontSize: 11,
                                  padding: "3px 8px",
                                  cursor: "pointer",
                                }}
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => {
                                  setPartialCloseId(null);
                                  setPartialCloseQty("");
                                }}
                                style={{
                                  background: C.border,
                                  color: C.textS,
                                  border: "none",
                                  borderRadius: 3,
                                  fontSize: 11,
                                  padding: "3px 8px",
                                  cursor: "pointer",
                                }}
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {/* Close buttons */}
                          <div className="flex gap-1 mt-2">
                            <button
                              onClick={() => handleClosePosition(pos)}
                              disabled={closePositionMutation.isPending}
                              style={{
                                flex: 1,
                                background: C.redDim,
                                color: C.red,
                                border: `1px solid ${C.red}`,
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "5px 0",
                                cursor: "pointer",
                              }}
                            >
                              Close All
                            </button>
                            <button
                              onClick={() => {
                                setPartialCloseId(
                                  partialCloseId === pos.id ? null : pos.id,
                                );
                                setPartialCloseQty("");
                              }}
                              style={{
                                flex: 1,
                                background: C.yellowDim,
                                color: C.yellow,
                                border: `1px solid ${C.yellow}`,
                                borderRadius: 4,
                                fontSize: 11,
                                fontWeight: 600,
                                padding: "5px 0",
                                cursor: "pointer",
                              }}
                            >
                              Partial Close
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Price Reference */}
              <div
                style={{
                  background: C.card,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                }}
                className="p-4"
              >
                <div
                  style={{
                    fontSize: 11,
                    color: C.textT,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 12,
                  }}
                >
                  Price Reference
                </div>
                <div className="space-y-2">
                  {[
                    {
                      label: "Bid",
                      value: currentBid > 0 ? formatPrice(currentBid) : "--",
                      color: C.green,
                    },
                    {
                      label: "Ask",
                      value: currentAsk > 0 ? formatPrice(currentAsk) : "--",
                      color: C.red,
                    },
                    {
                      label: "Spread",
                      value: spread > 0 ? formatPrice(spread) : "--",
                      color: C.textP,
                    },
                    ...(isCrypto && ticker
                      ? [
                          {
                            label: "24h High",
                            value: formatPrice(ticker.highPrice),
                            color: C.textP,
                          },
                          {
                            label: "24h Low",
                            value: formatPrice(ticker.lowPrice),
                            color: C.textP,
                          },
                          {
                            label: "24h Volume",
                            value: `${formatVolume(ticker.volume)} ${symbolInfo.base}`,
                            color: C.textP,
                          },
                        ]
                      : []),
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center"
                      style={{ fontSize: 12 }}
                    >
                      <span style={{ color: C.textS }}>{row.label}</span>
                      <span
                        style={{
                          color: row.color,
                          fontWeight: 500,
                          fontFamily: "monospace",
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Account Trading Summary */}
              <div
                style={{
                  background: C.card,
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                }}
                className="p-4"
              >
                <div
                  style={{
                    fontSize: 11,
                    color: C.textT,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    marginBottom: 12,
                  }}
                >
                  Account Summary
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Balance", value: `${formatNum(balance)} USDT` },
                    {
                      label: "Open Positions",
                      value: `${openPositions.length}`,
                    },
                    {
                      label: `${symbolInfo.label} Positions`,
                      value: `${openPositions.filter((t) => symbolsMatch(t.symbol, currentSymbolStr)).length}`,
                    },
                    {
                      label: "Account Status",
                      value: isAccountLocked ? "Locked" : "Active",
                      color: isAccountLocked ? C.red : C.green,
                    },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between items-center"
                      style={{ fontSize: 12 }}
                    >
                      <span style={{ color: C.textS }}>{row.label}</span>
                      <span
                        style={{
                          color: row.color || C.textP,
                          fontWeight: 500,
                          fontFamily: "monospace",
                        }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── MIDDLE: ORDER BOOK ── */}
        <SectionErrorBoundary label="Order Book">
          <div
            className="hidden lg:flex lg:w-[280px] lg:max-h-none shrink-0 flex-col lg:border-r overflow-hidden"
            style={{ background: C.panel, borderColor: C.border }}
          >
            {/* OB Header */}
            <div
              className="flex items-center justify-between px-3 shrink-0"
              style={{ borderBottom: `1px solid ${C.border}` }}
            >
              <div className="flex">
                <button
                  onClick={() => setObTab("book")}
                  className="py-2 mr-4"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: obTab === "book" ? C.textP : C.textS,
                    borderBottom:
                      obTab === "book"
                        ? `2px solid ${C.yellow}`
                        : "2px solid transparent",
                  }}
                >
                  Order Book
                </button>
                <button
                  onClick={() => setObTab("trades")}
                  className="py-2"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: obTab === "trades" ? C.textP : C.textS,
                    borderBottom:
                      obTab === "trades"
                        ? `2px solid ${C.yellow}`
                        : "2px solid transparent",
                  }}
                >
                  Recent Trades
                </button>
              </div>
              <div
                className="flex items-center gap-1"
                style={{
                  opacity: obTab === "book" ? 1 : 0.45,
                  pointerEvents: obTab === "book" ? "auto" : "none",
                }}
              >
                {["both", "asks", "bids"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setObMode(mode)}
                    className="p-1 rounded"
                    style={{
                      background: obMode === mode ? C.card : "transparent",
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        display: "flex",
                        flexDirection: "column",
                        gap: 1,
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 10,
                          height: 2,
                          background:
                            mode === "asks" || mode === "both"
                              ? C.red
                              : C.textT,
                          borderRadius: 1,
                        }}
                      />
                      <div
                        style={{
                          width: 10,
                          height: 2,
                          background:
                            mode === "bids" || mode === "both"
                              ? C.green
                              : C.textT,
                          borderRadius: 1,
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {obTab === "book" ? (
              <>
                {/* OB Column Headers */}
                <div
                  className="grid grid-cols-3 px-3 py-1.5 shrink-0"
                  style={{ fontSize: 10, color: C.textT }}
                >
                  <span>Price({symbolInfo.quote})</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Total</span>
                </div>

                {/* OB Content */}
                <div className="flex-1 flex flex-col px-3 overflow-hidden">
                  {/* Ask side */}
                  {obMode !== "bids" && (
                    <div className="flex-1 flex flex-col justify-end overflow-hidden">
                      {askOrders.map((o, i) => {
                        const pct = o.rawTotal
                          ? (o.rawTotal / maxAskTotal) * 100
                          : 0;
                        return (
                          <div
                            key={`a-${i}`}
                            onClick={() =>
                              o.rawPrice && setLimitPrice(o.rawPrice.toString())
                            }
                            className="relative grid grid-cols-3 py-[1.5px] cursor-pointer hover:brightness-125"
                            style={{ fontSize: 11 }}
                          >
                            <div
                              className="absolute right-0 top-0 bottom-0"
                              style={{ width: `${pct}%`, background: C.redDim }}
                            />
                            <span
                              style={{ color: C.red, fontFamily: "monospace" }}
                              className="relative z-10"
                            >
                              {o.price}
                            </span>
                            <span
                              style={{
                                color: C.textP,
                                fontFamily: "monospace",
                              }}
                              className="text-right relative z-10"
                            >
                              {o.qty}
                            </span>
                            <span
                              style={{
                                color: C.textS,
                                fontFamily: "monospace",
                              }}
                              className="text-right relative z-10"
                            >
                              {o.total}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Spread / current price */}
                  <div
                    className="py-2 flex items-center gap-2 shrink-0 overflow-hidden"
                    style={{
                      borderTop: `1px solid ${C.border}`,
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    {currentMid > 0 ? (
                      <>
                        {isCrypto ? (
                          ticker?.priceChangePercent >= 0 ? (
                            <ArrowUp size={14} style={{ color: C.green, flexShrink: 0 }} />
                          ) : (
                            <ArrowDown size={14} style={{ color: C.red, flexShrink: 0 }} />
                          )
                        ) : null}
                        <span
                          className="truncate"
                          style={{
                            fontSize: 16,
                            fontWeight: 700,
                            color: isCrypto
                              ? ticker?.priceChangePercent >= 0
                                ? C.green
                                : C.red
                              : C.textP,
                            fontFamily: "monospace",
                            flexShrink: 0,
                          }}
                        >
                          {formatPrice(currentMid)}
                        </span>
                        <span className="truncate" style={{ fontSize: 11, color: C.textS, minWidth: 0 }}>
                          ≈{formatNum(currentMid)} USD
                        </span>
                        {spread > 0 && (
                          <span
                            className="truncate"
                            style={{
                              fontSize: 10,
                              color: C.textT,
                              marginLeft: "auto",
                              flexShrink: 0,
                            }}
                          >
                            Spread: {formatPrice(spread)}
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ color: C.textS }}>--</span>
                    )}
                  </div>

                  {/* Bid side */}
                  {obMode !== "asks" && (
                    <div className="flex-1 overflow-hidden">
                      {bidOrders.map((o, i) => {
                        const pct = o.rawTotal
                          ? (o.rawTotal / maxBidTotal) * 100
                          : 0;
                        return (
                          <div
                            key={`b-${i}`}
                            onClick={() =>
                              o.rawPrice && setLimitPrice(o.rawPrice.toString())
                            }
                            className="relative grid grid-cols-3 py-[1.5px] cursor-pointer hover:brightness-125"
                            style={{ fontSize: 11 }}
                          >
                            <div
                              className="absolute right-0 top-0 bottom-0"
                              style={{
                                width: `${pct}%`,
                                background: C.greenDim,
                              }}
                            />
                            <span
                              style={{
                                color: C.green,
                                fontFamily: "monospace",
                              }}
                              className="relative z-10"
                            >
                              {o.price}
                            </span>
                            <span
                              style={{
                                color: C.textP,
                                fontFamily: "monospace",
                              }}
                              className="text-right relative z-10"
                            >
                              {o.qty}
                            </span>
                            <span
                              style={{
                                color: C.textS,
                                fontFamily: "monospace",
                              }}
                              className="text-right relative z-10"
                            >
                              {o.total}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Buy/Sell ratio bar */}
                  <div
                    className="flex items-center gap-0 shrink-0 py-2"
                    style={{ borderTop: `1px solid ${C.border}` }}
                  >
                    <span
                      style={{ fontSize: 10, color: C.green, marginRight: 4 }}
                    >
                      B
                    </span>
                    <div className="flex-1 flex h-1 rounded overflow-hidden">
                      <div style={{ width: "45%", background: C.green }} />
                      <div style={{ width: "55%", background: C.red }} />
                    </div>
                    <span style={{ fontSize: 10, color: C.red, marginLeft: 4 }}>
                      S
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto px-3 py-2">
                {recentTrades.length === 0 ? (
                  <div
                    className="text-center py-4"
                    style={{ fontSize: 12, color: C.textS }}
                  >
                    No recent trades for {symbolInfo.label}
                  </div>
                ) : (
                  <>
                    <div
                      className="grid grid-cols-3 px-1 py-1.5 sticky top-0 z-10"
                      style={{
                        fontSize: 10,
                        color: C.textT,
                        background: C.panel,
                      }}
                    >
                      <span>Price</span>
                      <span className="text-right">Qty</span>
                      <span className="text-right">Time</span>
                    </div>
                    <div className="space-y-0.5">
                      {recentTrades.map((t) => (
                        <div
                          key={t.id}
                          className="grid grid-cols-3 py-1 px-1"
                          style={{ fontSize: 11 }}
                        >
                          <span
                            style={{
                              color: t.type === "BUY" ? C.green : C.red,
                              fontFamily: "monospace",
                            }}
                          >
                            {formatPrice(t.price)}
                          </span>
                          <span
                            className="text-right"
                            style={{ color: C.textP, fontFamily: "monospace" }}
                          >
                            {(t.volume || 0).toFixed(isCrypto ? 6 : 3)}
                          </span>
                          <span
                            className="text-right"
                            style={{ color: C.textS, fontFamily: "monospace" }}
                          >
                            {t.time
                              ? new Date(t.time).toLocaleTimeString([], {
                                  hour12: false,
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })
                              : "--"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </SectionErrorBoundary>

        {/* ── RIGHT: TRADE PANEL ── */}
        <SectionErrorBoundary label="Trade Panel">
          <div
            className="w-full lg:w-[280px] lg:max-h-none shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l overflow-y-auto"
            style={{ background: C.panel, borderColor: C.border }}
          >
            {/* Trade header */}
            <div
              className="px-4 py-2.5 flex items-center justify-between shrink-0"
              style={{ borderBottom: `1px solid ${C.border}` }}
            >
              <span style={{ fontSize: 14, fontWeight: 700, color: C.textP }}>
                Trade
              </span>
            </div>

            {/* CFD / Spot mode toggle */}
            <div
              className="flex px-4 shrink-0"
              style={{ borderBottom: `1px solid ${C.border}` }}
            >
              <button
                onClick={() => setTradeMode("cfd")}
                className="py-2 mr-4"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: tradeMode === "cfd" ? C.textP : C.textS,
                  borderBottom:
                    tradeMode === "cfd"
                      ? `2px solid ${C.yellow}`
                      : "2px solid transparent",
                }}
              >
                CFD
              </button>
              {/* <button onClick={() => setTradeMode('spot')} className="py-2 mr-4"
              style={{ fontSize: 12, fontWeight: 600, color: tradeMode === 'spot' ? C.textP : C.textS, borderBottom: tradeMode === 'spot' ? `2px solid ${C.yellow}` : '2px solid transparent' }}>
              Spot
            </button> */}
            </div>

            {/* ── SPOT PANEL ── */}
            {tradeMode === "spot" && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 gap-5">
                {/* Wallet icon circle */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    background: C.yellowDim,
                    border: `1px solid ${C.yellow}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 24 }}>💼</span>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: C.textP,
                      marginBottom: 6,
                    }}
                  >
                    Spot Trading
                  </div>
                  <p
                    style={{
                      fontSize: 12,
                      color: C.textS,
                      lineHeight: 1.7,
                      maxWidth: 200,
                    }}
                  >
                    Buy and manage crypto assets from the{" "}
                    <strong style={{ color: C.yellow }}>Wallet</strong> tab in
                    the panel below.
                  </p>
                </div>

                <div
                  style={{
                    background: C.card,
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    padding: "10px 14px",
                    width: "100%",
                  }}
                >
                  {[
                    { label: "Mode", value: "Spot (No Leverage)" },
                    { label: "Order Types", value: "Market & Limit" },
                    { label: "Available", value: `${formatNum(balance)} USDT` },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex justify-between"
                      style={{
                        fontSize: 11,
                        paddingBottom: 4,
                        marginBottom: 4,
                        borderBottom: `1px solid ${C.border}`,
                      }}
                    >
                      <span style={{ color: C.textS }}>{row.label}</span>
                      <span style={{ color: C.textP, fontFamily: "monospace" }}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                  <div
                    className="flex justify-between"
                    style={{ fontSize: 11 }}
                  >
                    <span style={{ color: C.textS }}>Assets</span>
                    <span style={{ color: C.textP, fontFamily: "monospace" }}>
                      11 crypto pairs
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 11,
                    color: C.textT,
                    textAlign: "center",
                    lineHeight: 1.6,
                  }}
                >
                  Scroll down to the{" "}
                  <span style={{ color: C.yellow, fontWeight: 600 }}>
                    Wallet
                  </span>{" "}
                  tab to buy, sell, and track your spot positions.
                </div>
              </div>
            )}

            {/* ── CFD PANEL ── */}
            {tradeMode === "cfd" && (
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-3">
                  {/* Buy / Sell toggle */}
                  <div className="grid grid-cols-2 gap-0 rounded overflow-hidden">
                    <button
                      onClick={() => setOrderSide("buy")}
                      style={{
                        padding: "10px 0",
                        fontSize: 13,
                        fontWeight: 700,
                        color: orderSide === "buy" ? "#fff" : C.textS,
                        background: orderSide === "buy" ? C.green : C.card,
                        transition: "all .15s",
                      }}
                    >
                      Buy
                    </button>
                    <button
                      onClick={() => setOrderSide("sell")}
                      style={{
                        padding: "10px 0",
                        fontSize: 13,
                        fontWeight: 700,
                        color: orderSide === "sell" ? "#fff" : C.textS,
                        background: orderSide === "sell" ? C.red : C.card,
                        transition: "all .15s",
                      }}
                    >
                      Sell
                    </button>
                  </div>

                  {/* Limit / Market / TP/SL tabs */}
                  <div className="flex gap-0">
                    {["limit", "market", "tp/sl"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setOrderType(t)}
                        className="py-1.5 mr-4"
                        style={{
                          fontSize: 12,
                          fontWeight: orderType === t ? 600 : 400,
                          color: orderType === t ? C.textP : C.textS,
                          borderBottom:
                            orderType === t
                              ? `2px solid ${C.yellow}`
                              : "2px solid transparent",
                          textTransform: "capitalize",
                        }}
                      >
                        {t === "tp/sl"
                          ? "TP/SL"
                          : t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    ))}
                  </div>

                  {/* Account metrics: Balance / Equity / Margin */}
                  <div
                    className="space-y-1 pb-2"
                    style={{ borderBottom: `1px solid ${C.border}` }}
                  >
                    {/* "Balance" = available trading balance (decreases when trades open) */}
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 11, color: C.textS }}>
                        Balance
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: C.yellow,
                          fontFamily: "monospace",
                          fontWeight: 600,
                        }}
                      >
                        {balance > 0 ? formatNum(availableBalance) : "--"} USDT
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 11, color: C.textS }}>
                        Equity
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: equity >= balance ? C.green : C.red,
                          fontFamily: "monospace",
                        }}
                      >
                        {equity > 0 ? formatNum(equity) : "--"} USDT
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 11, color: C.textS }}>
                        Acct. Balance
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: C.textP,
                          fontFamily: "monospace",
                        }}
                      >
                        {balance > 0 ? formatNum(balance) : "--"} USDT
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 11, color: C.textS }}>
                        Used Margin
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: C.textP,
                          fontFamily: "monospace",
                        }}
                      >
                        {formatNum(usedMargin)} USDT
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 11, color: C.textS }}>
                        Free Margin
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: freeMargin > 0 ? C.textP : C.red,
                          fontFamily: "monospace",
                        }}
                      >
                        {balance > 0 ? formatNum(freeMargin) : "--"} USDT
                      </span>
                    </div>
                  </div>

                  {/* Price input (for limit / tp/sl) */}
                  {orderType !== "market" && (
                    <div
                      style={{
                        background: C.inputBg,
                        borderRadius: 4,
                        border: `1px solid ${C.border}`,
                      }}
                      className="flex items-center px-3 py-2"
                    >
                      <span
                        style={{
                          fontSize: 12,
                          color: C.textS,
                          width: 40,
                          flexShrink: 0,
                        }}
                      >
                        Price
                      </span>
                      <input
                        type="text"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        placeholder={
                          currentMid > 0 ? formatPrice(currentMid) : "--"
                        }
                        style={{
                          flex: 1,
                          background: "transparent",
                          color: C.textP,
                          fontSize: 13,
                          fontFamily: "monospace",
                          textAlign: "center",
                          outline: "none",
                          border: "none",
                          minWidth: 0,
                        }}
                      />
                      <span style={{ fontSize: 12, color: C.textS }}>USDT</span>
                    </div>
                  )}

                  {/* Quantity input */}
                  <div
                    style={{
                      background: C.inputBg,
                      borderRadius: 4,
                      border: `1px solid ${C.border}`,
                    }}
                    className="flex items-center px-3 py-2"
                  >
                    <span
                      style={{
                        fontSize: 12,
                        color: C.textS,
                        width: 58,
                        flexShrink: 0,
                      }}
                    >
                      Quantity
                    </span>
                    <input
                      type="text"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="--"
                      style={{
                        flex: 1,
                        background: "transparent",
                        color: C.textP,
                        fontSize: 13,
                        fontFamily: "monospace",
                        textAlign: "center",
                        outline: "none",
                        border: "none",
                        minWidth: 0,
                      }}
                    />
                    <span style={{ fontSize: 12, color: C.textS }}>
                      {isCrypto ? symbolInfo.base : "Lots"}
                    </span>
                  </div>

                  {/* Slider with dots */}
                  <div className="relative py-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={sliderPct}
                      onChange={(e) => handleSlider(parseInt(e.target.value))}
                      className="w-full"
                      style={{
                        height: 4,
                        appearance: "none",
                        background: `linear-gradient(to right, ${orderSide === "buy" ? C.green : C.red} ${sliderPct}%, ${C.border} ${sliderPct}%)`,
                        borderRadius: 2,
                        outline: "none",
                        cursor: "pointer",
                        accentColor: orderSide === "buy" ? C.green : C.red,
                      }}
                    />
                    <div className="flex justify-between mt-1 px-0">
                      {[0, 25, 50, 75, 100].map((p) => (
                        <button
                          key={p}
                          onClick={() => handleSlider(p)}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background:
                              sliderPct >= p
                                ? orderSide === "buy"
                                  ? C.green
                                  : C.red
                                : C.border,
                            border: `1.5px solid ${sliderPct >= p ? (orderSide === "buy" ? C.green : C.red) : C.textT}`,
                            cursor: "pointer",
                            transition: "all .15s",
                          }}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-0.5 px-0">
                      {[0, 25, 50, 75, 100].map((p) => (
                        <span
                          key={p}
                          style={{
                            fontSize: 9,
                            color: C.textT,
                            width: 24,
                            textAlign: "center",
                          }}
                        >
                          {p}%
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Leverage selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{ fontSize: 12, color: C.textS }}>Leverage</span>
                      <span style={{ fontSize: 11, color: C.yellow, fontWeight: 600 }}>
                        {selectedLeverage}x
                      </span>
                    </div>
                    <div className="grid grid-cols-6 gap-1">
                      {[1, 10, 25, 50, 75, 100].map((lev) => (
                        <button
                          key={lev}
                          onClick={() => setSelectedLeverage(lev)}
                          style={{
                            padding: "4px 0",
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer",
                            border: `1px solid ${selectedLeverage === lev ? C.yellow : C.border}`,
                            background: selectedLeverage === lev ? C.yellowDim : "transparent",
                            color: selectedLeverage === lev ? C.yellow : C.textS,
                            transition: "all .15s",
                          }}
                        >
                          {lev}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TP/SL toggle */}
                  {orderType !== "tp/sl" && (
                    <div className="flex items-center justify-between">
                      <span style={{ fontSize: 12, color: C.textS }}>
                        TP/SL
                      </span>
                      <button
                        onClick={() => setShowTpSl(!showTpSl)}
                        style={{
                          width: 32,
                          height: 18,
                          borderRadius: 9,
                          background: showTpSl ? C.green : C.border,
                          position: "relative",
                          transition: "background .2s",
                          cursor: "pointer",
                          border: "none",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: 2,
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            background: "#fff",
                            transition: "left .2s",
                            left: showTpSl ? 16 : 2,
                          }}
                        />
                      </button>
                    </div>
                  )}

                  {/* TP/SL inputs */}
                  {(showTpSl || orderType === "tp/sl") && (
                    <div className="space-y-2">
                      <div
                        style={{
                          background: C.inputBg,
                          borderRadius: 4,
                          border: `1px solid ${C.border}`,
                        }}
                        className="flex items-center px-3 py-1.5"
                      >
                        <span
                          style={{ fontSize: 11, color: C.green, width: 24 }}
                        >
                          TP
                        </span>
                        <input
                          type="text"
                          value={tpPrice}
                          onChange={(e) => setTpPrice(e.target.value)}
                          placeholder="Take Profit"
                          style={{
                            flex: 1,
                            background: "transparent",
                            color: C.textP,
                            fontSize: 12,
                            fontFamily: "monospace",
                            outline: "none",
                            border: "none",
                            minWidth: 0,
                          }}
                        />
                      </div>
                      <div
                        style={{
                          background: C.inputBg,
                          borderRadius: 4,
                          border: `1px solid ${C.border}`,
                        }}
                        className="flex items-center px-3 py-1.5"
                      >
                        <span style={{ fontSize: 11, color: C.red, width: 24 }}>
                          SL
                        </span>
                        <input
                          type="text"
                          value={slPrice}
                          onChange={(e) => setSlPrice(e.target.value)}
                          placeholder="Stop Loss"
                          style={{
                            flex: 1,
                            background: "transparent",
                            color: C.textP,
                            fontSize: 12,
                            fontFamily: "monospace",
                            outline: "none",
                            border: "none",
                            minWidth: 0,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Order summary */}
                  <div
                    className="space-y-1 pt-1"
                    style={{ borderTop: `1px solid ${C.border}` }}
                  >
                    <div
                      className="flex justify-between"
                      style={{ fontSize: 12 }}
                    >
                      <span style={{ color: C.textS }}>Order Value</span>
                      <span style={{ color: C.textP, fontFamily: "monospace" }}>
                        {orderValue > 0 ? formatNum(orderValue) : "--"} USDT
                      </span>
                    </div>
                    <div
                      className="flex justify-between"
                      style={{ fontSize: 12 }}
                    >
                      <span style={{ color: C.textS }}>Margin</span>
                      <span style={{ color: C.textP, fontFamily: "monospace" }}>
                        {orderValue > 0 ? formatNum(orderValue / selectedLeverage) : "--"} USDT
                      </span>
                    </div>
                    <div
                      className="flex justify-between"
                      style={{ fontSize: 12 }}
                    >
                      <span style={{ color: C.textS }}>Commission</span>
                      <span style={{ color: C.textS, fontFamily: "monospace" }}>
                        {qty > 0 ? `~${commission.toFixed(2)}` : "--"} USDT
                      </span>
                    </div>
                    <div
                      className="flex justify-between"
                      style={{ fontSize: 12 }}
                    >
                      <span style={{ color: C.textS }}>
                        Max. {orderSide === "buy" ? "buy" : "sell"} amount
                      </span>
                      <span
                        style={{
                          color: orderSide === "buy" ? C.green : C.red,
                          fontFamily: "monospace",
                          fontWeight: 600,
                        }}
                      >
                        {balance > 0 && effectivePrice > 0
                          ? (
                              (availableBalance * selectedLeverage) /
                              (effectivePrice * contractSize)
                            ).toFixed(isCrypto ? 6 : 4)
                          : "--"}{" "}
                        {isCrypto ? symbolInfo.base : "Lots"}
                      </span>
                    </div>
                  </div>

                  {/* Place order button */}
                  <button
                    onClick={handlePlaceOrder}
                    disabled={isPlacingOrder || !accountId || isAccountLocked}
                    style={{
                      width: "100%",
                      padding: "12px 0",
                      borderRadius: 4,
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: "pointer",
                      border: "none",
                      transition: "opacity .15s",
                      background: isAccountLocked
                        ? C.border
                        : orderSide === "buy"
                          ? C.green
                          : C.red,
                      color: isAccountLocked ? C.textS : "#fff",
                      opacity: isPlacingOrder || !accountId ? 0.5 : 1,
                    }}
                  >
                    {isPlacingOrder ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Placing...
                      </span>
                    ) : isAccountLocked ? (
                      "Account Locked"
                    ) : (
                      `${orderSide === "buy" ? "Buy" : "Sell"} ${symbolInfo.label}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </SectionErrorBoundary>
      </div>

      {/* Violation Modal */}
      <ViolationModal
        isOpen={violationModal?.shown === true}
        onClose={handleViolationModalClose}
        violationType={violationModal?.type}
        account={{
          equity: equity,
          balance: balance,
          maxDailyDrawdown: selectedChallenge?.challenge?.maxDailyLoss ?? selectedChallenge?.rules?.maxDailyLoss ?? 5,
          maxOverallDrawdown: selectedChallenge?.challenge?.maxTotalDrawdown ?? selectedChallenge?.rules?.maxTotalDrawdown ?? 10,
        }}
      />
    </div>
  );
};

export default BybitTradingArea;
