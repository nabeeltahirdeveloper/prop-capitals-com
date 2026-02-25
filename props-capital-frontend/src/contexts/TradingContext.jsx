import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  createContext,
  useContext,
} from "react";
import { getCurrentUser } from "@/api/auth";
import { getUserAccounts, getAccountSummary } from "@/api/accounts";
import { getAccountTrades } from "@/api/trades";
import { getUnifiedPrices } from "@/api/market-data";
import socket from "@/lib/socket";

const defaultAccountSummary = {
  balance: 0,
  equity: 0,
  margin: 0,
  freeMargin: 0,
  level: "0",
};
const noop = () => {};
const defaultTradingContext = {
  selectedSymbol: "EUR/USD",
  setSelectedSymbol: noop,
  selectedTimeframe: "M1",
  setSelectedTimeframe: noop,
  symbols: [],
  setSymbols: noop,
  symbolsLoading: false,
  orders: [],
  setOrders: noop,
  ordersLoading: false,
  fetchOrders: noop,
  fetchUserBalance: noop,
  userBalance: 0,
  setUserBalance: noop,
  accountSummary: defaultAccountSummary,
  currentSymbolData: { bid: "0", ask: "0", change: 0 },
  activeTool: null,
  setActiveTool: noop,
  chartObjects: [],
  setChartObjects: noop,
  showGrid: true,
  setShowGrid: noop,
  snapToGrid: false,
  setSnapToGrid: noop,
  drawingsVisible: true,
  setDrawingsVisible: noop,
  chartType: "candles",
  setChartType: noop,
  chartLocked: false,
  setChartLocked: noop,
  theme: "dark",
  setTheme: noop,
};
const TradingContext = createContext(defaultTradingContext);

export const useTrading = () => {
  const context = useContext(TradingContext);
  return context ?? defaultTradingContext;
};

export const TradingProvider = ({ children }) => {
  const [selectedSymbol, setSelectedSymbol] = useState("BTCUSDT");
  const [selectedTimeframe, setSelectedTimeframe] = useState("M1");

  const [symbols, setSymbols] = useState([]);
  const [symbolsLoading, setSymbolsLoading] = useState(true);

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [userBalance, setUserBalance] = useState(100000);

  const [activeTool, setActiveTool] = useState(null);
  const [chartObjects, setChartObjects] = useState([]);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [drawingsVisible, setDrawingsVisible] = useState(true);
  const [chartType, setChartType] = useState("candles");
  const [chartLocked, setChartLocked] = useState(false);
  const [theme, setTheme] = useState("dark"); // 'dark' | 'light'

  const socketRef = useRef(null);

  // Ref so fetchOrders can read current prices synchronously without adding symbols to its deps
  const symbolsRef = useRef([]);
  // Monotonically increasing counter — only the latest fetch call may write to state
  const fetchOrdersRequestIdRef = useRef(0);

  // Normalize symbol to canonical slash format: "BTCUSDT" → "BTC/USD", "EURUSD" → "EUR/USD"
  // DB trades can be stored in either format; prices/sockets always use slash format
  const normalizeSymbol = useCallback((symbol) => {
    if (!symbol) return symbol;
    if (symbol.includes("/")) return symbol; // already normalized
    if (symbol.endsWith("USDT")) return `${symbol.replace(/USDT$/, "")}/USD`;
    if (symbol.length >= 6 && /^[A-Z]+$/.test(symbol))
      return `${symbol.slice(0, 3)}/${symbol.slice(3)}`;
    return symbol;
  }, []);

  // ---------------------------------------
  // API: fetchOrders – project APIs: auth/me → trading-accounts → trades/account
  // ---------------------------------------
  const fetchOrders = useCallback(async (accountId) => {
    const myRequestId = ++fetchOrdersRequestIdRef.current;
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      setOrdersLoading(true);

      // If no accountId provided, resolve it from the API chain
      let resolvedAccountId = accountId;
      if (!resolvedAccountId) {
        const user = await getCurrentUser();
        if (!user?.userId) {
          setOrders([]);
          return;
        }
        const accounts = await getUserAccounts(user.userId);
        const account =
          Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null;
        if (!account?.id) {
          setOrders([]);
          return;
        }
        resolvedAccountId = account.id;
      }

      const trades = await getAccountTrades(resolvedAccountId);
      const list = Array.isArray(trades) ? trades : [];
      const fetchedOrders = list.map((trade) => ({
        id: trade.id,
        ticket: trade.id,
        symbol: normalizeSymbol(trade.symbol), // normalize to "BTC/USD" format to match price data
        type: trade.type,
        volume: trade.volume,
        price: trade.openPrice,
        stopLoss: trade.stopLoss ?? undefined,
        takeProfit: trade.takeProfit ?? undefined,
        comment: "",
        status: trade.closedAt ? "CLOSED" : "OPEN",
        swap: 0,
        profit: trade.profit ?? 0,
        profitCurrency: "USD",
        time: new Date(trade.openedAt).toLocaleTimeString(),
        openAt: trade.openedAt,
        closeAt: trade.closedAt ?? null,
        closePrice: trade.closePrice ?? null,
        closeReason: trade.closeReason ?? null,
      }));

      // Discard result if a newer fetch has already started
      if (myRequestId !== fetchOrdersRequestIdRef.current) return;

      // Merge fetched orders with real-time profit so open positions never flash to 0
      setOrders((prev) => {
        const prevById = new Map(prev.map((o) => [o.id, o]));
        return fetchedOrders.map((order) => {
          if (order.status !== "OPEN") return order;

          // Priority 1: calculate from current known prices (handles startup + reconnect)
          const symbolData = symbolsRef.current.find(
            (s) => s.symbol === order.symbol,
          );
          if (symbolData) {
            const currentPrice =
              order.type === "BUY"
                ? parseFloat(symbolData.bid || 0)
                : parseFloat(symbolData.ask || 0);
            if (currentPrice && !isNaN(currentPrice) && currentPrice > 0) {
              const priceDiff =
                order.type === "BUY"
                  ? currentPrice - order.price
                  : order.price - currentPrice;
              return { ...order, profit: priceDiff * order.volume };
            }
          }

          // Priority 2: preserve existing real-time profit from state (navigation between pages)
          const existing = prevById.get(order.id);
          if (existing && existing.profit !== 0) {
            return { ...order, profit: existing.profit };
          }

          // Fallback: DB value (0 for new positions, fixed on next price tick)
          return order;
        });
      });
    } catch (error) {
      if (myRequestId !== fetchOrdersRequestIdRef.current) return;
      console.error("❌ Error fetching orders:", error?.message || error);
      setOrders([]);
    } finally {
      if (myRequestId === fetchOrdersRequestIdRef.current) {
        setOrdersLoading(false);
      }
    }
  }, []);

  // ---------------------------------------
  // Profit calc (stable)
  // ---------------------------------------
  const calculateRealTimeProfit = useCallback((order, currentPrice) => {
    if (
      !currentPrice ||
      !order.price ||
      isNaN(currentPrice) ||
      isNaN(order.price)
    ) {
      return order.profit || 0;
    }

    const priceDiff =
      order.type === "BUY"
        ? currentPrice - order.price
        : order.price - currentPrice;

    return priceDiff * order.volume;
  }, []);

  // ---------------------------------------
  // API: fetchUserBalance – project APIs: auth/me → trading-accounts → account summary
  // ---------------------------------------
  const fetchUserBalance = useCallback(async (accountId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // If no accountId provided, resolve it from the API chain
      let resolvedAccountId = accountId;
      if (!resolvedAccountId) {
        const user = await getCurrentUser();
        if (!user?.userId) return;
        const accounts = await getUserAccounts(user.userId);
        const account =
          Array.isArray(accounts) && accounts.length > 0 ? accounts[0] : null;
        if (!account?.id) return;
        resolvedAccountId = account.id;
      }

      const summary = await getAccountSummary(resolvedAccountId);
      const balance =
        summary?.balance != null ? parseFloat(summary.balance) : NaN;
      if (!isNaN(balance)) setUserBalance(balance);
    } catch (error) {
      console.error("❌ Error fetching user balance:", error?.message || error);
    }
  }, []);

  // ---------------------------------------
  // ✅ Derived accountSummary (NO setState loop)
  // ---------------------------------------
  const accountSummary = useMemo(() => {
    const baseBalance = userBalance;

    const totalMargin = orders.reduce((sum, order) => {
      const marginRate = 0.01;
      return sum + order.volume * order.price * marginRate;
    }, 0);

    const totalProfit = orders.reduce((sum, order) => {
      const symbolData = symbols.find((s) => s.symbol === order.symbol);
      if (symbolData) {
        const currentPrice =
          order.type === "BUY"
            ? parseFloat(symbolData.bid || 0)
            : parseFloat(symbolData.ask || 0);

        if (currentPrice && currentPrice > 0 && !isNaN(currentPrice)) {
          return sum + calculateRealTimeProfit(order, currentPrice);
        }
      }
      return sum + (order.profit || 0);
    }, 0);

    const equity = baseBalance + totalProfit;
    const freeMargin = equity - totalMargin;
    const level = totalMargin > 0 ? (equity / totalMargin) * 100 : 0;

    return {
      balance: baseBalance,
      equity,
      margin: totalMargin,
      freeMargin,
      level: level.toFixed(2),
    };
  }, [orders, symbols, userBalance, calculateRealTimeProfit]);

  // ---------------------------------------
  // on mount: balance only — orders are fetched by TraderPanelLayout/OrdersPage
  // with the correct account ID to avoid a race with the wrong account
  // ---------------------------------------
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUserBalance();
    }
  }, [fetchUserBalance]);

  // Keep symbolsRef current so fetchOrders can read prices synchronously
  useEffect(() => {
    symbolsRef.current = symbols;
  }, [symbols]);

  // ---------------------------------------
  // symbols list on mount – project API: market-data/prices
  // ---------------------------------------
  useEffect(() => {
    const loadSymbols = async () => {
      try {
        setSymbolsLoading(true);
        const data = await getUnifiedPrices();
        const fetchedSymbols = data?.prices ?? [];
        setSymbols(fetchedSymbols);
        if (fetchedSymbols.length > 0) {
          // Don't auto-reset the symbol if the user has an explicit saved preference
          // (BybitTerminal saves its symbol to bybit_selectedSymbol in localStorage)
          const hasBybitSavedSymbol = !!localStorage.getItem(
            "bybit_selectedSymbol",
          );
          if (!hasBybitSavedSymbol) {
            const normalized = selectedSymbol.replace("/", "");
            const exists = fetchedSymbols.find(
              (s) =>
                (s.symbol && s.symbol.replace("/", "") === normalized) ||
                s.symbol === selectedSymbol,
            );
            if (!exists) setSelectedSymbol(fetchedSymbols[0].symbol);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching symbols:", error?.message || error);
        setSymbols([]);
      } finally {
        setSymbolsLoading(false);
      }
    };
    loadSymbols();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------
  // Socket.io price updates (batched)
  // ---------------------------------------
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = socket;
    }

    const sock = socketRef.current;

    const onConnect = () => console.log("✅ TradingContext: Connected");
    const onDisconnect = () => console.log("⚠️ TradingContext: Disconnected");

    // Backend emits "position:closed" (not "tradeClosed"). Normalize payload for one handler.
    const onTradeClosed = async (data) => {
      console.log("🔔 Trade closed event received:", data);
      if (!data) return;

      // balance update from event (account:update has newBalance; position:closed may not)
      if (data.newBalance !== undefined) {
        const newBalance = parseFloat(data.newBalance);
        if (!isNaN(newBalance)) setUserBalance(newBalance);
      }

      // optional UI notification (backend: profit, closeReason)
      if (window.notify) {
        const profitLoss = data.profitLoss ?? data.profit ?? 0;
        const profitText =
          profitLoss >= 0 ? `+${profitLoss.toFixed(2)}` : profitLoss.toFixed(2);
        const symbol = data.symbol || "Trade";
        const reason = data.reason ?? data.closeReason ?? "Closed";
        window.notify(
          `Trade Closed: ${reason} | ${symbol} | P/L: ${profitText} USD`,
          profitLoss >= 0 ? "success" : "error",
        );
      }

      // optimistic remove
      if (data.tradeId) {
        setOrders((prev) => prev.filter((o) => o.id !== data.tradeId));
      }

      // refresh from API (sync)
      await fetchOrders();
      await fetchUserBalance();
    };

    // Backend emits "trade:executed" when a new position is opened
    const onTradeExecuted = async (data) => {
      console.log("🔔 Trade executed event received:", data);
      // Optimistically add the new order so the list updates immediately
      if (data?.tradeId && data?.symbol) {
        const newOrder = {
          id: data.tradeId,
          ticket: data.tradeId,
          symbol: normalizeSymbol(data.symbol),
          type: data.type,
          volume: data.volume,
          price: data.openPrice,
          status: "OPEN",
          profit: 0,
          profitCurrency: "USD",
          openAt: data.timestamp,
          closeAt: null,
          closePrice: null,
          closeReason: null,
          swap: 0,
          comment: "",
          time: new Date(data.timestamp).toLocaleTimeString(),
        };
        setOrders((prev) => {
          // Avoid duplicate if already present
          if (prev.some((o) => o.id === data.tradeId)) return prev;
          return [newOrder, ...prev];
        });
      }
      // Full sync from API to get accurate data
      await fetchOrders();
    };

    sock.on("connect", onConnect);
    sock.on("disconnect", onDisconnect);
    // Backend sends "position:closed"; listen for that so trade-closed events work
    sock.on("position:closed", onTradeClosed);
    // Backend sends "trade:executed" when a new position opens
    sock.on("trade:executed", onTradeExecuted);

    return () => {
      sock.off("connect", onConnect);
      sock.off("disconnect", onDisconnect);
      sock.off("position:closed", onTradeClosed);
      sock.off("trade:executed", onTradeExecuted);
    };
  }, [fetchOrders, fetchUserBalance]);

  // ---------------------------------------
  // Global theme (dark/light) applied to document root
  // ---------------------------------------
  useEffect(() => {
    try {
      const root = document.documentElement;
      if (!root) return;
      root.dataset.theme = theme;
    } catch {
      // ignore if document is not available (SSR etc.)
    }
  }, [theme]);

  // ---------------------------------------
  // current symbol data (memo)
  // ---------------------------------------
  const currentSymbolData = useMemo(() => {
    return (
      symbols.find((s) => s.symbol === selectedSymbol) || {
        bid: "0.00000",
        ask: "0.00000",
        change: 0,
      }
    );
  }, [symbols, selectedSymbol]);

  // ---------------------------------------
  // ✅ Provider value memoized (stability)
  // ---------------------------------------
  const value = useMemo(
    () => ({
      selectedSymbol,
      setSelectedSymbol,
      selectedTimeframe,
      setSelectedTimeframe,

      symbols,
      setSymbols,
      symbolsLoading,

      orders,
      setOrders,
      ordersLoading,

      fetchOrders,
      fetchUserBalance,

      userBalance,
      setUserBalance,

      accountSummary,
      currentSymbolData,

      activeTool,
      setActiveTool,
      chartObjects,
      setChartObjects,
      showGrid,
      setShowGrid,
      snapToGrid,
      setSnapToGrid,
      drawingsVisible,
      setDrawingsVisible,
      chartType,
      setChartType,
      chartLocked,
      setChartLocked,
      theme,
      setTheme,
    }),
    [
      selectedSymbol,
      selectedTimeframe,
      symbols,
      symbolsLoading,
      orders,
      ordersLoading,
      fetchOrders,
      fetchUserBalance,
      userBalance,
      accountSummary,
      currentSymbolData,
      activeTool,
      chartObjects,
      showGrid,
      snapToGrid,
      drawingsVisible,
      chartType,
      chartLocked,
      theme,
    ],
  );

  return (
    <TradingContext.Provider value={value}>{children}</TradingContext.Provider>
  );
};
