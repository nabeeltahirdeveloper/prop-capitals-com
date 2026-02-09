import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ChevronDown, ArrowDown, ArrowUp, Search } from 'lucide-react';
import { useTrading } from '@/contexts/TradingContext';
import { usePrices } from '@/contexts/PriceContext';
import { useTradingWebSocket } from '@/hooks/useTradingWebSocket';
import { useBinanceStream } from '@/hooks/useBinanceStream';
import { getAccountTrades, createTrade, updateTrade } from '@/api/trades';
import { getPendingOrders, createPendingOrder, cancelPendingOrder } from '@/api/pending-orders';
import { getCurrentPrice } from '@/api/market-data';
import { useToast } from '@/components/ui/use-toast';
import { useTraderTheme } from './TraderPanelLayout';
import TradingChart from '../trading/TradingChart';

/* ───────────────────────── Symbol List (Crypto + Forex) ───────────────────────── */
const ALL_SYMBOLS = [
  // Crypto
  { symbol: 'BTCUSDT', base: 'BTC', quote: 'USDT', label: 'BTC/USDT', type: 'crypto' },
  { symbol: 'ETHUSDT', base: 'ETH', quote: 'USDT', label: 'ETH/USDT', type: 'crypto' },
  { symbol: 'SOLUSDT', base: 'SOL', quote: 'USDT', label: 'SOL/USDT', type: 'crypto' },
  { symbol: 'XRPUSDT', base: 'XRP', quote: 'USDT', label: 'XRP/USDT', type: 'crypto' },
  { symbol: 'DOGEUSDT', base: 'DOGE', quote: 'USDT', label: 'DOGE/USDT', type: 'crypto' },
  { symbol: 'BNBUSDT', base: 'BNB', quote: 'USDT', label: 'BNB/USDT', type: 'crypto' },
  { symbol: 'ADAUSDT', base: 'ADA', quote: 'USDT', label: 'ADA/USDT', type: 'crypto' },
  { symbol: 'AVAXUSDT', base: 'AVAX', quote: 'USDT', label: 'AVAX/USDT', type: 'crypto' },
  { symbol: 'DOTUSDT', base: 'DOT', quote: 'USDT', label: 'DOT/USDT', type: 'crypto' },
  { symbol: 'MATICUSDT', base: 'MATIC', quote: 'USDT', label: 'MATIC/USDT', type: 'crypto' },
  { symbol: 'LINKUSDT', base: 'LINK', quote: 'USDT', label: 'LINK/USDT', type: 'crypto' },
  // Forex Major Pairs
  { symbol: 'EURUSD', base: 'EUR', quote: 'USD', label: 'EUR/USD', type: 'forex' },
  { symbol: 'GBPUSD', base: 'GBP', quote: 'USD', label: 'GBP/USD', type: 'forex' },
  { symbol: 'USDJPY', base: 'USD', quote: 'JPY', label: 'USD/JPY', type: 'forex' },
  { symbol: 'USDCHF', base: 'USD', quote: 'CHF', label: 'USD/CHF', type: 'forex' },
  { symbol: 'AUDUSD', base: 'AUD', quote: 'USD', label: 'AUD/USD', type: 'forex' },
  { symbol: 'USDCAD', base: 'USD', quote: 'CAD', label: 'USD/CAD', type: 'forex' },
  { symbol: 'NZDUSD', base: 'NZD', quote: 'USD', label: 'NZD/USD', type: 'forex' },
  // Forex Cross Pairs
  { symbol: 'EURGBP', base: 'EUR', quote: 'GBP', label: 'EUR/GBP', type: 'forex' },
  { symbol: 'EURJPY', base: 'EUR', quote: 'JPY', label: 'EUR/JPY', type: 'forex' },
  { symbol: 'GBPJPY', base: 'GBP', quote: 'JPY', label: 'GBP/JPY', type: 'forex' },
  { symbol: 'CADJPY', base: 'CAD', quote: 'JPY', label: 'CAD/JPY', type: 'forex' },
  // Metals
  { symbol: 'XAUUSD', base: 'XAU', quote: 'USD', label: 'XAU/USD', type: 'forex' },
  { symbol: 'XAGUSD', base: 'XAG', quote: 'USD', label: 'XAG/USD', type: 'forex' },
];

/* ───────────────────────── Theme Color Tokens ───────────────────────── */
const DARK_COLORS = {
  bg: '#0b0e11',
  panel: '#161a1e',
  card: '#1e2329',
  border: '#2b3139',
  borderL: '#363c46',
  textP: '#eaecef',
  textS: '#848e9c',
  textT: '#5e6673',
  green: '#0ecb81',
  greenBg: '#0ecb81',
  greenDim: 'rgba(14,203,129,0.12)',
  red: '#f6465d',
  redDim: 'rgba(246,70,93,0.12)',
  yellow: '#fcd535',
  yellowDim: 'rgba(252,213,53,0.12)',
  orange: '#f0b90b',
  inputBg: '#1e2329',
  hoverBg: 'rgba(255,255,255,0.04)',
};

const LIGHT_COLORS = {
  bg: '#f8f9fb',
  panel: '#ffffff',
  card: '#f1f3f5',
  border: '#e2e5e9',
  borderL: '#d1d5db',
  textP: '#1e2329',
  textS: '#5e6673',
  textT: '#848e9c',
  green: '#0ecb81',
  greenBg: '#0ecb81',
  greenDim: 'rgba(14,203,129,0.10)',
  red: '#f6465d',
  redDim: 'rgba(246,70,93,0.10)',
  yellow: '#f0b90b',
  yellowDim: 'rgba(240,185,11,0.12)',
  orange: '#f0b90b',
  inputBg: '#f1f3f5',
  hoverBg: 'rgba(0,0,0,0.03)',
};

/* ───────────────────────── Helpers ───────────────────────── */
// Convert BybitTerminal symbol format to backend API format
// e.g. 'EURUSD' → 'EUR/USD', 'BTCUSDT' → 'BTC/USD'
const toBackendSymbol = (sym, type) => {
  if (!sym) return sym;
  if (type === 'crypto') {
    // BTCUSDT → BTC/USD (strip trailing T, add slash)
    const base = sym.replace(/USDT$/, '');
    return `${base}/USD`;
  }
  // Forex/Metals: EURUSD → EUR/USD, XAUUSD → XAU/USD, OILUSD → OIL/USD
  // Insert slash after first 3 chars
  if (sym.length >= 6) return `${sym.slice(0, 3)}/${sym.slice(3)}`;
  return sym;
};

const formatPrice = (price) => {
  if (!price || price === 0) return '--';
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
};

const formatNum = (n, d = 2) => {
  if (n === null || n === undefined) return '--';
  return n.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
};

const formatVolume = (v) => {
  if (!v || v === 0) return '--';
  if (v >= 1e9) return (v / 1e9).toFixed(2) + 'B';
  if (v >= 1e6) return (v / 1e6).toFixed(2) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(2) + 'K';
  return v.toFixed(2);
};

const getSymbolInfo = (sym) => ALL_SYMBOLS.find(s => s.symbol === sym) || ALL_SYMBOLS[0];

/* ═══════════════════════════════════════════════════════════════════════ */

const BybitTradingArea = ({ selectedChallenge }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isDark } = useTraderTheme();
  const C = isDark ? DARK_COLORS : LIGHT_COLORS;

  /* ── State ── */
  const [orderType, setOrderType] = useState('market');
  const [orderSide, setOrderSide] = useState('buy');
  const [limitPrice, setLimitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [showTpSl, setShowTpSl] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [bottomTab, setBottomTab] = useState('positions');
  const [obTab, setObTab] = useState('book');
  const [sliderPct, setSliderPct] = useState(0);
  const [symbolDropdownOpen, setSymbolDropdownOpen] = useState(false);
  const [symbolSearch, setSymbolSearch] = useState('');
  const dropdownRef = useRef(null);

  const { selectedSymbol, setSelectedSymbol, selectedTimeframe, setSelectedTimeframe, chartType, setChartType } = useTrading();
  const pricesRef = useRef({});
  const { prices: unifiedPrices } = usePrices();

  /* ── Symbol resolution ── */
  // Ensure selected symbol is one we support; default to BTCUSDT otherwise
  const rawSymbolStr = typeof selectedSymbol === 'string' ? selectedSymbol : (selectedSymbol?.symbol ?? 'BTCUSDT');
  const isKnownSymbol = ALL_SYMBOLS.some(s => s.symbol === rawSymbolStr);
  const currentSymbolStr = isKnownSymbol ? rawSymbolStr : 'BTCUSDT';
  const symbolInfo = getSymbolInfo(currentSymbolStr);

  // Set to BTCUSDT on mount if current symbol is unsupported
  useEffect(() => {
    if (!isKnownSymbol) setSelectedSymbol('BTCUSDT');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Binance live streams (crypto only — forex has no Binance data) ── */
  const isCrypto = symbolInfo.type === 'crypto';
  const { orderBook, ticker, connected: binanceConnected } = useBinanceStream(isCrypto ? currentSymbolStr : null);

  // Backend API symbol format (EUR/USD, BTC/USD) vs terminal format (EURUSD, BTCUSDT)
  const backendSymbol = toBackendSymbol(currentSymbolStr, symbolInfo.type);

  /* ── Backend price polling (Massive WS for forex, Binance WS for crypto via backend) ── */
  const [backendPrice, setBackendPrice] = useState(null);
  useEffect(() => {
    // For crypto, direct Binance stream is primary; backend is fallback
    // For forex, backend (Massive WS) is the ONLY source
    let cancelled = false;
    const fetchPrice = async () => {
      try {
        // getCurrentPrice auto-normalizes symbol format (BTCUSDT → BTC/USD, EURUSD → EUR/USD)
        const data = await getCurrentPrice(currentSymbolStr);
        if (cancelled) return;
        if (data && (data.bid || data.ask || data.price)) {
          setBackendPrice({
            bid: data.bid || data.price || 0,
            ask: data.ask || data.price || 0,
          });
        }
      } catch { /* silent */ }
    };
    fetchPrice();
    // Poll forex every 1s (Massive WS data), crypto every 3s (Binance direct is primary)
    const interval = setInterval(fetchPrice, isCrypto ? 3000 : 1000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [currentSymbolStr, isCrypto]);

  /* ── Account ── */
  const accountId = selectedChallenge?.id;
  const accountStatus = selectedChallenge?.status;
  const isAccountLocked = accountStatus === 'failed' || accountStatus === 'inactive';
  const balance = selectedChallenge?.currentBalance || 0;

  /* ── Queries ── */
  const { data: tradesData } = useQuery({
    queryKey: ['trades', accountId],
    queryFn: () => getAccountTrades(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });
  const { data: pendingOrdersData } = useQuery({
    queryKey: ['pendingOrders', accountId],
    queryFn: () => getPendingOrders(accountId),
    enabled: !!accountId,
    refetchInterval: 3000,
  });

  /* ── WebSocket ── */
  const handlePositionClosed = useCallback(() => {
    queryClient.invalidateQueries(['trades', accountId]);
  }, [queryClient, accountId]);
  const handleAccountStatusChange = useCallback((event) => {
    queryClient.invalidateQueries(['trades', accountId]);
    queryClient.invalidateQueries(['pendingOrders', accountId]);
    if (event?.status === 'DISQUALIFIED' || event?.status === 'DAILY_LOCKED') {
      toast({ title: 'Account Status Changed', description: `Account is now ${event.status}`, variant: 'destructive' });
    }
  }, [queryClient, accountId, toast]);
  const handleAccountUpdate = useCallback(() => {
    queryClient.invalidateQueries(['trades', accountId]);
  }, [queryClient, accountId]);
  useTradingWebSocket({ accountId, onPositionClosed: handlePositionClosed, onAccountStatusChange: handleAccountStatusChange, onAccountUpdate: handleAccountUpdate });

  /* ── Derived data ── */
  const openPositions = useMemo(() => { const t = Array.isArray(tradesData) ? tradesData : []; return t.filter(x => !x.closedAt); }, [tradesData]);
  const closedTrades = useMemo(() => { const t = Array.isArray(tradesData) ? tradesData : []; return t.filter(x => x.closedAt); }, [tradesData]);
  const activePendingOrders = useMemo(() => { const o = Array.isArray(pendingOrdersData) ? pendingOrdersData : []; return o.filter(x => x.status === 'PENDING'); }, [pendingOrdersData]);

  const enrichedSelectedSymbol = useMemo(() => {
    if (!selectedSymbol?.symbol) return selectedSymbol;
    // Try both terminal format (EURUSD) and backend format (EUR/USD) as price keys
    const p = unifiedPrices[selectedSymbol.symbol] || unifiedPrices[backendSymbol];
    if (p && typeof p === 'object' && p.bid !== undefined && p.ask !== undefined) {
      return { ...selectedSymbol, bid: p.bid, ask: p.ask, spread: Math.abs(p.ask - p.bid) };
    }
    return selectedSymbol;
  }, [selectedSymbol, unifiedPrices, backendSymbol]);

  /* ── Prices: Binance ticker for crypto, Massive WS (via backend) for forex ── */
  const currentBid = isCrypto
    ? (ticker?.lastPrice || backendPrice?.bid || enrichedSelectedSymbol?.bid || 0)
    : (backendPrice?.bid || enrichedSelectedSymbol?.bid || 0);
  const currentAsk = isCrypto
    ? (ticker?.lastPrice || backendPrice?.ask || enrichedSelectedSymbol?.ask || 0)
    : (backendPrice?.ask || enrichedSelectedSymbol?.ask || 0);
  const currentMid = (currentBid && currentAsk) ? (currentBid + currentAsk) / 2 : 0;

  const handlePriceUpdate = useCallback((s, p) => { pricesRef.current[s] = p; }, []);

  /* ── Order Book: live Binance for crypto, simulated for forex ── */
  const askOrders = useMemo(() => {
    if (orderBook.asks.length > 0) {
      let cumTotal = 0;
      return orderBook.asks.slice(0, 12).map(([price, qty]) => {
        const p = parseFloat(price);
        const q = parseFloat(qty);
        cumTotal += q;
        return { price: formatPrice(p), qty: q.toFixed(5), total: cumTotal.toFixed(5), rawTotal: cumTotal, rawPrice: p };
      }).reverse();
    }
    // Simulated depth for forex or when Binance disconnected
    const base = currentAsk || currentMid || 100;
    const step = base > 1000 ? 0.10 : base > 100 ? 0.01 : 0.0001;
    const rows = [];
    for (let i = 0; i < 10; i++) {
      const price = base + (10 - i) * step;
      const qty = (Math.random() * 3 + 0.001).toFixed(5);
      const cumTotal = rows.length > 0 ? parseFloat(rows[rows.length - 1].rawTotal) + parseFloat(qty) : parseFloat(qty);
      rows.push({ price: formatPrice(price), qty, total: cumTotal.toFixed(5), rawTotal: cumTotal, rawPrice: price });
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
        return { price: formatPrice(p), qty: q.toFixed(5), total: cumTotal.toFixed(5), rawTotal: cumTotal, rawPrice: p };
      });
    }
    // Simulated depth for forex
    const base = currentBid || currentMid || 100;
    const step = base > 1000 ? 0.10 : base > 100 ? 0.01 : 0.0001;
    const rows = [];
    for (let i = 0; i < 10; i++) {
      const price = base - (i + 1) * step;
      const qty = (Math.random() * 3 + 0.001).toFixed(5);
      const cumTotal = rows.length > 0 ? parseFloat(rows[rows.length - 1].rawTotal) + parseFloat(qty) : parseFloat(qty);
      rows.push({ price: formatPrice(price), qty, total: cumTotal.toFixed(5), rawTotal: cumTotal, rawPrice: price });
    }
    return rows;
  }, [orderBook.bids, currentBid, currentMid]);

  const maxAskTotal = useMemo(() => Math.max(...askOrders.map(o => o.rawTotal || 0), 1), [askOrders]);
  const maxBidTotal = useMemo(() => Math.max(...bidOrders.map(o => o.rawTotal || 0), 1), [bidOrders]);

  /* ── Spread ── */
  const spread = useMemo(() => {
    if (orderBook.asks.length > 0 && orderBook.bids.length > 0) {
      return parseFloat(orderBook.asks[0][0]) - parseFloat(orderBook.bids[0][0]);
    }
    // For forex, calculate from bid/ask
    if (currentAsk > 0 && currentBid > 0) {
      return currentAsk - currentBid;
    }
    return 0;
  }, [orderBook, currentAsk, currentBid]);

  /* ── Computed values ── */
  const effectivePrice = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) || 0 : (orderSide === 'buy' ? currentAsk : currentBid);
  const qty = parseFloat(quantity) || 0;
  const orderValue = qty * effectivePrice;

  /* ── Slider → qty ── */
  const handleSlider = useCallback((pct) => {
    setSliderPct(pct);
    if (!balance || !effectivePrice || effectivePrice === 0 || leverage === 0) return;
    const maxQty = (balance * leverage) / effectivePrice;
    setQuantity((maxQty * pct / 100).toFixed(6));
  }, [balance, effectivePrice, leverage]);

  /* ── Symbol switching ── */
  const handleSymbolSelect = useCallback((sym) => {
    setSelectedSymbol(sym);
    setSymbolDropdownOpen(false);
    setSymbolSearch('');
    setLimitPrice('');
    setQuantity('');
    setSliderPct(0);
  }, [setSelectedSymbol]);

  const filteredSymbols = useMemo(() => {
    if (!symbolSearch) return ALL_SYMBOLS;
    const q = symbolSearch.toLowerCase();
    return ALL_SYMBOLS.filter(s => s.symbol.toLowerCase().includes(q) || s.base.toLowerCase().includes(q));
  }, [symbolSearch]);

  /* ── Close dropdown on outside click ── */
  React.useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setSymbolDropdownOpen(false);
      }
    };
    if (symbolDropdownOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [symbolDropdownOpen]);

  /* ── Mutations ── */
  const createTradeMutation = useMutation({
    mutationFn: createTrade,
    onSuccess: () => { queryClient.invalidateQueries(['trades', accountId]); toast({ title: 'Order Placed' }); setQuantity(''); setLimitPrice(''); setTpPrice(''); setSlPrice(''); setSliderPct(0); },
    onError: (e) => { toast({ title: 'Order Failed', description: e?.response?.data?.message || e.message || 'Failed', variant: 'destructive' }); },
  });
  const createPendingOrderMutation = useMutation({
    mutationFn: createPendingOrder,
    onSuccess: () => { queryClient.invalidateQueries(['pendingOrders', accountId]); toast({ title: 'Pending Order Created' }); setQuantity(''); setLimitPrice(''); setTpPrice(''); setSlPrice(''); setSliderPct(0); },
    onError: (e) => { toast({ title: 'Order Failed', description: e?.response?.data?.message || e.message || 'Failed', variant: 'destructive' }); },
  });
  const cancelOrderMutation = useMutation({
    mutationFn: cancelPendingOrder,
    onSuccess: () => { queryClient.invalidateQueries(['pendingOrders', accountId]); toast({ title: 'Order Cancelled' }); },
    onError: (e) => { toast({ title: 'Cancel Failed', description: e?.response?.data?.message || e.message, variant: 'destructive' }); },
  });
  const closePositionMutation = useMutation({
    mutationFn: ({ tradeId, closePrice }) => updateTrade(tradeId, { closePrice, closedAt: new Date().toISOString(), closeReason: 'USER_CLOSE' }),
    onSuccess: () => { queryClient.invalidateQueries(['trades', accountId]); toast({ title: 'Position Closed' }); },
    onError: (e) => { toast({ title: 'Close Failed', description: e?.response?.data?.message || e.message, variant: 'destructive' }); },
  });

  /* ── Handlers ── */
  const handlePlaceOrder = async () => {
    if (isAccountLocked) { toast({ title: 'Account Locked', variant: 'destructive' }); return; }
    if (!accountId || !currentSymbolStr) { toast({ title: 'Select a symbol', variant: 'destructive' }); return; }
    if (!quantity || parseFloat(quantity) <= 0) { toast({ title: 'Enter valid quantity', variant: 'destructive' }); return; }
    if ((orderType === 'limit' || orderType === 'tp/sl') && (!limitPrice || parseFloat(limitPrice) <= 0)) { toast({ title: 'Enter valid price', variant: 'destructive' }); return; }
    setIsPlacingOrder(true);
    try {
      if (orderType === 'market') {
        const openPrice = orderSide === 'buy' ? currentAsk : currentBid;
        if (!openPrice) { toast({ title: 'No price available', variant: 'destructive' }); return; }
        await createTradeMutation.mutateAsync({ accountId, symbol: currentSymbolStr, type: orderSide.toUpperCase(), volume: parseFloat(quantity), openPrice, stopLoss: slPrice ? parseFloat(slPrice) : null, takeProfit: tpPrice ? parseFloat(tpPrice) : null });
      } else {
        await createPendingOrderMutation.mutateAsync({ tradingAccountId: accountId, symbol: currentSymbolStr, type: orderSide.toUpperCase(), orderType: orderType === 'tp/sl' ? 'STOP' : 'LIMIT', volume: parseFloat(quantity), price: parseFloat(limitPrice), stopLoss: slPrice ? parseFloat(slPrice) : null, takeProfit: tpPrice ? parseFloat(tpPrice) : null });
      }
    } catch (_) {} finally { setIsPlacingOrder(false); }
  };

  const handleClosePosition = (trade) => {
    const cp = trade.type === 'BUY' ? currentBid : currentAsk;
    if (!cp) { toast({ title: 'No price', variant: 'destructive' }); return; }
    closePositionMutation.mutate({ tradeId: trade.id, closePrice: cp });
  };

  const calcPnL = useCallback((trade) => {
    const p = trade.type === 'BUY' ? currentBid : currentAsk;
    if (!p || !trade.openPrice) return 0;
    return (trade.type === 'BUY' ? p - trade.openPrice : trade.openPrice - p) * (trade.volume || 0);
  }, [currentBid, currentAsk]);

  /* ── P&L summary ── */
  const pnlSummary = useMemo(() => {
    if (closedTrades.length === 0) return null;
    const totalPnL = closedTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const wins = closedTrades.filter(t => (t.profit || 0) > 0).length;
    const losses = closedTrades.filter(t => (t.profit || 0) < 0).length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length * 100) : 0;
    const avgWin = wins > 0 ? closedTrades.filter(t => (t.profit || 0) > 0).reduce((s, t) => s + t.profit, 0) / wins : 0;
    const avgLoss = losses > 0 ? closedTrades.filter(t => (t.profit || 0) < 0).reduce((s, t) => s + t.profit, 0) / losses : 0;
    return { totalPnL, wins, losses, total: closedTrades.length, winRate, avgWin, avgLoss };
  }, [closedTrades]);

  const timeframes = [
    { key: 'M1', label: '1m' },
    { key: 'M5', label: '5m' },
    { key: 'M15', label: '15m' },
    { key: 'M30', label: '30m' },
    { key: 'H1', label: '1h' },
    { key: 'H4', label: '4h' },
    { key: 'D1', label: '1d' },
    { key: 'W1', label: '1w' },
  ];

  /* ════════════════════════ RENDER ════════════════════════ */
  return (
    <div className="flex flex-col h-full" style={{ background: C.bg, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif", color: C.textP, fontSize: 12 }}>

      {/* ═══ LOCKED BANNER ═══ */}
      {isAccountLocked && (
        <div style={{ background: C.redDim, borderBottom: `1px solid ${C.red}` }} className="px-4 py-1.5 text-center">
          <span style={{ color: C.red, fontSize: 12 }}>Account {accountStatus === 'failed' ? 'Failed — Trading Disabled' : 'Inactive'}</span>
        </div>
      )}

      {/* ═══ TOP HEADER BAR ═══ */}
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, position: 'relative', zIndex: 100 }} className="flex items-center px-4 py-2 gap-6 flex-wrap">
        {/* Symbol selector */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            onClick={() => setSymbolDropdownOpen(!symbolDropdownOpen)}
            className="flex items-center gap-2 px-2 py-1 rounded transition-colors"
            style={{ background: symbolDropdownOpen ? C.card : 'transparent' }}
          >
            <span style={{ fontSize: 16, fontWeight: 700, color: C.textP }}>{symbolInfo.label}</span>
            <span style={{ fontSize: 11, color: C.textS, background: C.card, padding: '2px 6px', borderRadius: 3 }}>{isCrypto ? 'Perpetual' : 'Spot'}</span>
            <ChevronDown size={14} style={{ color: C.textS, transform: symbolDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {/* Dropdown */}
          {symbolDropdownOpen && (
            <div
              className="absolute top-full left-0 mt-1 rounded-lg overflow-hidden shadow-xl"
              style={{ background: C.panel, border: `1px solid ${C.border}`, width: 260, zIndex: 9999 }}
            >
              <div className="p-2" style={{ borderBottom: `1px solid ${C.border}` }}>
                <div className="flex items-center gap-2 px-2 py-1.5 rounded" style={{ background: C.card }}>
                  <Search size={14} style={{ color: C.textT }} />
                  <input
                    type="text"
                    value={symbolSearch}
                    onChange={(e) => setSymbolSearch(e.target.value)}
                    placeholder="Search..."
                    autoFocus
                    style={{ flex: 1, background: 'transparent', color: C.textP, fontSize: 12, outline: 'none', border: 'none' }}
                  />
                </div>
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {(() => {
                  let lastType = '';
                  return filteredSymbols.map((s) => {
                    const showHeader = s.type !== lastType;
                    lastType = s.type;
                    return (
                      <React.Fragment key={s.symbol}>
                        {showHeader && (
                          <div className="px-3 py-1.5 sticky top-0" style={{ fontSize: 10, fontWeight: 700, color: C.textT, background: C.panel, textTransform: 'uppercase', letterSpacing: 1 }}>
                            {s.type === 'crypto' ? 'Crypto' : 'Forex & Metals'}
                          </div>
                        )}
                        <button
                          onClick={() => handleSymbolSelect(s.symbol)}
                          className="flex items-center justify-between w-full px-3 py-2 transition-colors"
                          style={{
                            background: currentSymbolStr === s.symbol ? C.yellowDim : 'transparent',
                            color: currentSymbolStr === s.symbol ? C.yellow : C.textP,
                          }}
                          onMouseEnter={(e) => { if (currentSymbolStr !== s.symbol) e.currentTarget.style.background = C.hoverBg; }}
                          onMouseLeave={(e) => { if (currentSymbolStr !== s.symbol) e.currentTarget.style.background = 'transparent'; }}
                        >
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{s.label}</span>
                          <span style={{ fontSize: 11, color: C.textT }}>{s.base}</span>
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
          <span style={{ fontSize: 18, fontWeight: 700, color: isCrypto ? (ticker?.priceChangePercent >= 0 ? C.green : C.red) : C.textP, fontFamily: 'monospace' }}>
            {currentMid > 0 ? formatPrice(currentMid) : '--'}
          </span>
          <div style={{ fontSize: 11, color: C.textS }}>
            {currentMid > 0 ? `≈${formatNum(currentMid)} USD` : ''}
          </div>
        </div>

        {/* 24h Stats from Binance ticker */}
        {[
          {
            label: '24h Change',
            value: ticker ? `${ticker.priceChangePercent >= 0 ? '+' : ''}${ticker.priceChangePercent.toFixed(2)}%` : '--',
            color: ticker ? (ticker.priceChangePercent >= 0 ? C.green : C.red) : C.textS,
          },
          { label: '24h High', value: ticker ? formatPrice(ticker.highPrice) : '--', color: C.textP },
          { label: '24h Low', value: ticker ? formatPrice(ticker.lowPrice) : '--', color: C.textP },
          { label: '24H Turnover(USDT)', value: ticker ? formatVolume(ticker.quoteVolume) : '--', color: C.textP },
        ].map((item, i) => (
          <div key={i} className="shrink-0 hidden md:block">
            <div style={{ fontSize: 10, color: C.textT, marginBottom: 1 }}>{item.label}</div>
            <div style={{ fontSize: 12, color: item.color, fontFamily: 'monospace' }}>{item.value}</div>
          </div>
        ))}

        {/* Connection indicator */}
        <div className="shrink-0 hidden lg:flex items-center gap-1 ml-auto">
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: isCrypto ? (binanceConnected ? C.green : C.red) : C.yellow }} />
          <span style={{ fontSize: 10, color: C.textT }}>{isCrypto ? (binanceConnected ? 'Live' : 'Offline') : 'Polling'}</span>
        </div>
      </div>

      {/* ═══ CHART NAV TABS ═══ */}
      <div style={{ background: C.panel, borderBottom: `1px solid ${C.border}`, position: 'relative', zIndex: 2 }} className="flex items-center px-4 gap-1">
        {['Chart', 'Overview', 'Data', 'Trade Analysis'].map((tab, i) => (
          <button key={tab} className="px-3 py-2" style={{ fontSize: 12, color: i === 0 ? C.textP : C.textS, fontWeight: i === 0 ? 600 : 400, borderBottom: i === 0 ? `2px solid ${C.yellow}` : '2px solid transparent' }}>
            {tab}
          </button>
        ))}
        <div className="flex-1" />
        <div className="flex items-center gap-1 shrink-0">
          {['TradingView', 'Depth'].map((v, i) => (
            <button key={v} className="px-2 py-1.5" style={{ fontSize: 11, color: i === 0 ? C.textP : C.textS }}>{v}</button>
          ))}
        </div>
      </div>

      {/* ═══ MAIN 3-COLUMN AREA ═══ */}
      <div className="flex flex-col lg:flex-row flex-1 min-h-0" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── LEFT: CHART ── */}
        <div className="flex-1 min-w-0 flex flex-col" style={{ background: C.panel }}>
          {/* Timeframe bar */}
          <div className="flex items-center px-2 py-1 gap-0.5 overflow-x-auto" style={{ borderBottom: `1px solid ${C.border}` }}>
            {timeframes.map((tf) => (
              <button key={tf.key} onClick={() => setSelectedTimeframe(tf.key)}
                className="px-2 py-1 shrink-0" style={{
                  fontSize: 11,
                  fontWeight: selectedTimeframe === tf.key ? 600 : 400,
                  color: selectedTimeframe === tf.key ? C.yellow : C.textS,
                  background: selectedTimeframe === tf.key ? C.yellowDim : 'transparent',
                  borderRadius: 3,
                }}>{tf.label}</button>
            ))}
            <div style={{ width: 1, height: 14, background: C.border, margin: '0 6px' }} className="shrink-0" />
            <button onClick={() => setChartType('candlestick')} className="px-2 py-1 shrink-0"
              style={{ fontSize: 11, color: chartType === 'candlestick' ? C.textP : C.textS }}>Candles</button>
            <button onClick={() => setChartType('line')} className="px-2 py-1 shrink-0"
              style={{ fontSize: 11, color: chartType === 'line' ? C.textP : C.textS }}>Line</button>
          </div>
          <div className="flex-1 min-h-0" style={{ minHeight: 340 }}>
            <TradingChart key={`chart-bybit-${currentSymbolStr}`} symbol={enrichedSelectedSymbol} openPositions={openPositions} onPriceUpdate={handlePriceUpdate} showBuySellPanel={false} />
          </div>
        </div>

        {/* ── MIDDLE: ORDER BOOK ── */}
        <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: 280, background: C.panel, borderLeft: `1px solid ${C.border}`, borderRight: `1px solid ${C.border}` }}>
          {/* OB Header */}
          <div className="flex items-center justify-between px-3 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
            <div className="flex">
              <button onClick={() => setObTab('book')} className="py-2 mr-4"
                style={{ fontSize: 12, fontWeight: 600, color: obTab === 'book' ? C.textP : C.textS, borderBottom: obTab === 'book' ? `2px solid ${C.yellow}` : '2px solid transparent' }}>Order Book</button>
              <button onClick={() => setObTab('trades')} className="py-2"
                style={{ fontSize: 12, fontWeight: 600, color: obTab === 'trades' ? C.textP : C.textS, borderBottom: obTab === 'trades' ? `2px solid ${C.yellow}` : '2px solid transparent' }}>Recent Trades</button>
            </div>
            <div className="flex items-center gap-1">
              {['both', 'asks', 'bids'].map((mode) => (
                <button key={mode} className="p-1 rounded" style={{ background: mode === 'both' ? C.card : 'transparent' }}>
                  <div style={{ width: 14, height: 14, display: 'flex', flexDirection: 'column', gap: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <div style={{ width: 10, height: 2, background: mode === 'asks' || mode === 'both' ? C.red : C.textT, borderRadius: 1 }} />
                    <div style={{ width: 10, height: 2, background: mode === 'bids' || mode === 'both' ? C.green : C.textT, borderRadius: 1 }} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* OB Column Headers */}
          <div className="grid grid-cols-3 px-3 py-1.5 shrink-0" style={{ fontSize: 10, color: C.textT }}>
            <span>Price(USDT)</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Total</span>
          </div>

          {/* OB Content */}
          <div className="flex-1 flex flex-col px-3 overflow-hidden">
            {/* Ask side */}
            <div className="flex-1 flex flex-col justify-end overflow-hidden">
              {askOrders.map((o, i) => {
                const pct = o.rawTotal ? (o.rawTotal / maxAskTotal) * 100 : 0;
                return (
                  <div key={`a-${i}`} onClick={() => o.rawPrice && setLimitPrice(o.rawPrice.toString())}
                    className="relative grid grid-cols-3 py-[1.5px] cursor-pointer hover:brightness-125" style={{ fontSize: 11 }}>
                    <div className="absolute right-0 top-0 bottom-0" style={{ width: `${pct}%`, background: C.redDim }} />
                    <span style={{ color: C.red, fontFamily: 'monospace' }} className="relative z-10">{o.price}</span>
                    <span style={{ color: C.textP, fontFamily: 'monospace' }} className="text-right relative z-10">{o.qty}</span>
                    <span style={{ color: C.textS, fontFamily: 'monospace' }} className="text-right relative z-10">{o.total}</span>
                  </div>
                );
              })}
            </div>

            {/* Spread / current price */}
            <div className="py-2 flex items-center gap-2 shrink-0" style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
              {currentMid > 0 ? (
                <>
                  {isCrypto ? (
                    ticker?.priceChangePercent >= 0 ? (
                      <ArrowUp size={14} style={{ color: C.green }} />
                    ) : (
                      <ArrowDown size={14} style={{ color: C.red }} />
                    )
                  ) : null}
                  <span style={{ fontSize: 16, fontWeight: 700, color: isCrypto ? (ticker?.priceChangePercent >= 0 ? C.green : C.red) : C.textP, fontFamily: 'monospace' }}>{formatPrice(currentMid)}</span>
                  <span style={{ fontSize: 11, color: C.textS }}>≈{formatNum(currentMid)} USD</span>
                  {spread > 0 && <span style={{ fontSize: 10, color: C.textT, marginLeft: 'auto' }}>Spread: {formatPrice(spread)}</span>}
                </>
              ) : (
                <span style={{ color: C.textS }}>--</span>
              )}
            </div>

            {/* Bid side */}
            <div className="flex-1 overflow-hidden">
              {bidOrders.map((o, i) => {
                const pct = o.rawTotal ? (o.rawTotal / maxBidTotal) * 100 : 0;
                return (
                  <div key={`b-${i}`} onClick={() => o.rawPrice && setLimitPrice(o.rawPrice.toString())}
                    className="relative grid grid-cols-3 py-[1.5px] cursor-pointer hover:brightness-125" style={{ fontSize: 11 }}>
                    <div className="absolute right-0 top-0 bottom-0" style={{ width: `${pct}%`, background: C.greenDim }} />
                    <span style={{ color: C.green, fontFamily: 'monospace' }} className="relative z-10">{o.price}</span>
                    <span style={{ color: C.textP, fontFamily: 'monospace' }} className="text-right relative z-10">{o.qty}</span>
                    <span style={{ color: C.textS, fontFamily: 'monospace' }} className="text-right relative z-10">{o.total}</span>
                  </div>
                );
              })}
            </div>

            {/* Buy/Sell ratio bar */}
            <div className="flex items-center gap-0 shrink-0 py-2" style={{ borderTop: `1px solid ${C.border}` }}>
              <span style={{ fontSize: 10, color: C.green, marginRight: 4 }}>B</span>
              <div className="flex-1 flex h-1 rounded overflow-hidden">
                <div style={{ width: '45%', background: C.green }} />
                <div style={{ width: '55%', background: C.red }} />
              </div>
              <span style={{ fontSize: 10, color: C.red, marginLeft: 4 }}>S</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT: TRADE PANEL ── */}
        <div className="shrink-0 flex flex-col overflow-hidden" style={{ width: 280, background: C.panel }}>
          {/* Trade header */}
          <div className="px-4 py-2.5 flex items-center justify-between shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: C.textP }}>Trade</span>
          </div>

          {/* Spot / Convert / Margin tabs */}
          <div className="flex px-4 shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
            {['Spot', 'Convert', 'Margin'].map((t, i) => (
              <button key={t} className="py-2 mr-4"
                style={{ fontSize: 12, fontWeight: i === 0 ? 600 : 400, color: i === 0 ? C.textP : C.textS, borderBottom: i === 0 ? `2px solid ${C.yellow}` : '2px solid transparent' }}>
                {t === 'Margin' ? <><span className="inline-flex items-center gap-0.5"><span style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, display: 'inline-block' }} /><span style={{ width: 6, height: 6, borderRadius: '50%', background: C.red, display: 'inline-block', marginLeft: -2 }} /></span> {t}</> : t}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-3">
              {/* Buy / Sell toggle */}
              <div className="grid grid-cols-2 gap-0 rounded overflow-hidden">
                <button onClick={() => setOrderSide('buy')}
                  style={{ padding: '10px 0', fontSize: 13, fontWeight: 700, color: orderSide === 'buy' ? '#fff' : C.textS, background: orderSide === 'buy' ? C.green : C.card, transition: 'all .15s' }}>Buy</button>
                <button onClick={() => setOrderSide('sell')}
                  style={{ padding: '10px 0', fontSize: 13, fontWeight: 700, color: orderSide === 'sell' ? '#fff' : C.textS, background: orderSide === 'sell' ? C.red : C.card, transition: 'all .15s' }}>Sell</button>
              </div>

              {/* Limit / Market / TP/SL tabs */}
              <div className="flex gap-0">
                {['limit', 'market', 'tp/sl'].map((t) => (
                  <button key={t} onClick={() => setOrderType(t)}
                    className="py-1.5 mr-4" style={{
                      fontSize: 12, fontWeight: orderType === t ? 600 : 400,
                      color: orderType === t ? C.textP : C.textS,
                      borderBottom: orderType === t ? `2px solid ${C.yellow}` : '2px solid transparent',
                      textTransform: 'capitalize',
                    }}>{t === 'tp/sl' ? 'TP/SL' : t.charAt(0).toUpperCase() + t.slice(1)}</button>
                ))}
              </div>

              {/* Available Balance */}
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 12, color: C.textS }}>Available Balance</span>
                <span style={{ fontSize: 12, color: C.textP, fontFamily: 'monospace' }}>
                  {balance > 0 ? formatNum(balance) : '--'} USDT
                </span>
              </div>

              {/* Price input (for limit / tp/sl) */}
              {orderType !== 'market' && (
                <div style={{ background: C.inputBg, borderRadius: 4, border: `1px solid ${C.border}` }} className="flex items-center px-3 py-2">
                  <span style={{ fontSize: 12, color: C.textS, width: 40, shrink: 0 }}>Price</span>
                  <input type="text" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder={currentMid > 0 ? formatPrice(currentMid) : '--'}
                    style={{ flex: 1, background: 'transparent', color: C.textP, fontSize: 13, fontFamily: 'monospace', textAlign: 'center', outline: 'none', border: 'none', minWidth: 0 }} />
                  <span style={{ fontSize: 12, color: C.textS }}>USDT</span>
                </div>
              )}

              {/* Quantity input */}
              <div style={{ background: C.inputBg, borderRadius: 4, border: `1px solid ${C.border}` }} className="flex items-center px-3 py-2">
                <span style={{ fontSize: 12, color: C.textS, width: 58, shrink: 0 }}>Quantity</span>
                <input type="text" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                  placeholder="--"
                  style={{ flex: 1, background: 'transparent', color: C.textP, fontSize: 13, fontFamily: 'monospace', textAlign: 'center', outline: 'none', border: 'none', minWidth: 0 }} />
                <span style={{ fontSize: 12, color: C.textS }}>{isCrypto ? symbolInfo.base : 'Lots'}</span>
              </div>

              {/* Slider with dots */}
              <div className="relative py-2">
                <input type="range" min="0" max="100" value={sliderPct}
                  onChange={(e) => handleSlider(parseInt(e.target.value))}
                  className="w-full"
                  style={{
                    height: 4, appearance: 'none', background: `linear-gradient(to right, ${orderSide === 'buy' ? C.green : C.red} ${sliderPct}%, ${C.border} ${sliderPct}%)`,
                    borderRadius: 2, outline: 'none', cursor: 'pointer',
                    accentColor: orderSide === 'buy' ? C.green : C.red,
                  }} />
                <div className="flex justify-between mt-1 px-0.5">
                  {[0, 25, 50, 75, 100].map((p) => (
                    <button key={p} onClick={() => handleSlider(p)}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: sliderPct >= p ? (orderSide === 'buy' ? C.green : C.red) : C.border, border: `1.5px solid ${sliderPct >= p ? (orderSide === 'buy' ? C.green : C.red) : C.textT}`, cursor: 'pointer', transition: 'all .15s' }} />
                  ))}
                </div>
                <div className="flex justify-between mt-0.5 px-0">
                  {[0, 25, 50, 75, 100].map((p) => (
                    <span key={p} style={{ fontSize: 9, color: C.textT, width: 24, textAlign: 'center' }}>{p}%</span>
                  ))}
                </div>
              </div>

              {/* TP/SL toggle */}
              {orderType !== 'tp/sl' && (
                <div className="flex items-center justify-between">
                  <span style={{ fontSize: 12, color: C.textS }}>TP/SL</span>
                  <button onClick={() => setShowTpSl(!showTpSl)}
                    style={{ width: 32, height: 18, borderRadius: 9, background: showTpSl ? C.green : C.border, position: 'relative', transition: 'background .2s', cursor: 'pointer', border: 'none' }}>
                    <span style={{ position: 'absolute', top: 2, width: 14, height: 14, borderRadius: '50%', background: '#fff', transition: 'left .2s', left: showTpSl ? 16 : 2 }} />
                  </button>
                </div>
              )}

              {/* TP/SL inputs */}
              {(showTpSl || orderType === 'tp/sl') && (
                <div className="space-y-2">
                  <div style={{ background: C.inputBg, borderRadius: 4, border: `1px solid ${C.border}` }} className="flex items-center px-3 py-1.5">
                    <span style={{ fontSize: 11, color: C.green, width: 24 }}>TP</span>
                    <input type="text" value={tpPrice} onChange={(e) => setTpPrice(e.target.value)} placeholder="Take Profit"
                      style={{ flex: 1, background: 'transparent', color: C.textP, fontSize: 12, fontFamily: 'monospace', outline: 'none', border: 'none', minWidth: 0 }} />
                  </div>
                  <div style={{ background: C.inputBg, borderRadius: 4, border: `1px solid ${C.border}` }} className="flex items-center px-3 py-1.5">
                    <span style={{ fontSize: 11, color: C.red, width: 24 }}>SL</span>
                    <input type="text" value={slPrice} onChange={(e) => setSlPrice(e.target.value)} placeholder="Stop Loss"
                      style={{ flex: 1, background: 'transparent', color: C.textP, fontSize: 12, fontFamily: 'monospace', outline: 'none', border: 'none', minWidth: 0 }} />
                  </div>
                </div>
              )}

              {/* Leverage row */}
              <div className="flex items-center justify-between">
                <span style={{ fontSize: 12, color: C.textS }}>Leverage</span>
                <div className="flex items-center gap-1">
                  {[1, 5, 10, 25, 50, 100].map((v) => (
                    <button key={v} onClick={() => setLeverage(v)}
                      style={{ fontSize: 10, padding: '2px 6px', borderRadius: 3, fontWeight: leverage === v ? 600 : 400, color: leverage === v ? C.yellow : C.textS, background: leverage === v ? C.yellowDim : 'transparent' }}>{v}x</button>
                  ))}
                </div>
              </div>

              {/* Order summary */}
              <div className="space-y-1 pt-1" style={{ borderTop: `1px solid ${C.border}` }}>
                <div className="flex justify-between" style={{ fontSize: 12 }}>
                  <span style={{ color: C.textS }}>Order Value</span>
                  <span style={{ color: C.textP, fontFamily: 'monospace' }}>{orderValue > 0 ? formatNum(orderValue) : '--'} USDT</span>
                </div>
                <div className="flex justify-between" style={{ fontSize: 12 }}>
                  <span style={{ color: C.textS }}>Max. buying amount</span>
                  <span style={{ color: C.textP, fontFamily: 'monospace' }}>
                    {balance > 0 && effectivePrice > 0 ? (balance * leverage / effectivePrice).toFixed(isCrypto ? 6 : 2) : '--'} {isCrypto ? symbolInfo.base : 'Lots'}
                  </span>
                </div>
              </div>

              {/* Place order button */}
              <button onClick={handlePlaceOrder} disabled={isPlacingOrder || !accountId || isAccountLocked}
                style={{
                  width: '100%', padding: '12px 0', borderRadius: 4, fontSize: 14, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'opacity .15s',
                  background: isAccountLocked ? C.border : (orderSide === 'buy' ? C.green : C.red),
                  color: isAccountLocked ? C.textS : '#fff',
                  opacity: (isPlacingOrder || !accountId) ? 0.5 : 1,
                }}>
                {isPlacingOrder ? (
                  <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Placing...</span>
                ) : isAccountLocked ? 'Account Locked' : (
                  `${orderSide === 'buy' ? 'Buy' : 'Sell'} ${symbolInfo.label}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM PANEL ═══ */}
      <div style={{ background: C.panel, borderTop: `1px solid ${C.border}`, minHeight: 160, maxHeight: 260, position: 'relative', zIndex: 1 }} className="flex flex-col shrink-0">
        {/* Tabs */}
        <div className="flex items-center px-4 overflow-x-auto shrink-0" style={{ borderBottom: `1px solid ${C.border}` }}>
          {[
            { key: 'positions', label: 'Positions', count: openPositions.length },
            { key: 'open', label: 'Open Orders', count: activePendingOrders.length },
            { key: 'history', label: 'Trade History', count: closedTrades.length },
            { key: 'assets', label: 'Assets', count: 0 },
            { key: 'pnl', label: 'P&L', count: 0 },
          ].map(({ key, label, count }) => (
            <button key={key} onClick={() => setBottomTab(key)} className="py-2 mr-5 shrink-0 relative"
              style={{ fontSize: 12, color: bottomTab === key ? C.textP : C.textS, fontWeight: bottomTab === key ? 600 : 400 }}>
              {label}
              {count > 0 && <span style={{ fontSize: 9, marginLeft: 3, padding: '1px 4px', borderRadius: 3, background: C.yellowDim, color: C.yellow }}>{count}</span>}
              {bottomTab === key && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: C.yellow }} />}
            </button>
          ))}
        </div>

        {/* Table content */}
        <div className="flex-1 overflow-auto">
          {/* POSITIONS */}
          {bottomTab === 'positions' && (
            openPositions.length === 0
              ? <div className="flex items-center justify-center h-full" style={{ color: C.textT, fontSize: 12 }}>No open positions</div>
              : <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: C.textT, borderBottom: `1px solid ${C.border}` }}>
                      {['Symbol', 'Side', 'Qty', 'Entry', 'Mark', 'PnL', 'SL', 'TP', ''].map((h, i) => (
                        <th key={i} style={{ padding: '6px 10px', fontWeight: 500, textAlign: i < 2 ? 'left' : i === 8 ? 'center' : 'right' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {openPositions.map((trade) => {
                      const pnl = calcPnL(trade);
                      const mark = trade.type === 'BUY' ? currentBid : currentAsk;
                      return (
                        <tr key={trade.id} style={{ borderBottom: `1px solid ${C.border}22` }} className="hover:brightness-110">
                          <td style={{ padding: '5px 10px', color: C.textP, fontFamily: 'monospace' }}>{trade.symbol}</td>
                          <td style={{ padding: '5px 10px', color: trade.type === 'BUY' ? C.green : C.red, fontWeight: 600 }}>{trade.type === 'BUY' ? 'Long' : 'Short'}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', color: C.textP, fontFamily: 'monospace' }}>{trade.volume?.toFixed(3)}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', color: C.textP, fontFamily: 'monospace' }}>{formatPrice(trade.openPrice)}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', color: C.textP, fontFamily: 'monospace' }}>{mark > 0 ? formatPrice(mark) : '--'}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: pnl >= 0 ? C.green : C.red }}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', color: C.textT, fontFamily: 'monospace' }}>{trade.stopLoss ? formatPrice(trade.stopLoss) : '--'}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'right', color: C.textT, fontFamily: 'monospace' }}>{trade.takeProfit ? formatPrice(trade.takeProfit) : '--'}</td>
                          <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                            <button onClick={() => handleClosePosition(trade)} disabled={closePositionMutation.isLoading || isAccountLocked}
                              style={{ fontSize: 10, padding: '3px 10px', borderRadius: 3, border: `1px solid ${C.border}`, background: 'transparent', color: C.textS, cursor: 'pointer' }}
                              className="hover:brightness-150 disabled:opacity-50">Close</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
          )}

          {/* OPEN ORDERS (pending) */}
          {bottomTab === 'open' && (
            activePendingOrders.length === 0
              ? <div className="flex items-center justify-center h-full" style={{ color: C.textT, fontSize: 12 }}>No open orders</div>
              : <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: C.textT, borderBottom: `1px solid ${C.border}` }}>
                      {['Symbol', 'Type', 'Side', 'Qty', 'Price', 'SL', 'TP', ''].map((h, i) => (
                        <th key={i} style={{ padding: '6px 10px', fontWeight: 500, textAlign: i < 3 ? 'left' : i === 7 ? 'center' : 'right' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {activePendingOrders.map((order) => (
                      <tr key={order.id} style={{ borderBottom: `1px solid ${C.border}22` }}>
                        <td style={{ padding: '5px 10px', color: C.textP, fontFamily: 'monospace' }}>{order.symbol}</td>
                        <td style={{ padding: '5px 10px', color: C.textS }}>{order.orderType}</td>
                        <td style={{ padding: '5px 10px', color: order.type === 'BUY' ? C.green : C.red, fontWeight: 600 }}>{order.type === 'BUY' ? 'Long' : 'Short'}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'right', color: C.textP, fontFamily: 'monospace' }}>{order.volume?.toFixed(3)}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'right', color: C.textP, fontFamily: 'monospace' }}>{formatPrice(order.price)}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'right', color: C.textT, fontFamily: 'monospace' }}>{order.stopLoss ? formatPrice(order.stopLoss) : '--'}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'right', color: C.textT, fontFamily: 'monospace' }}>{order.takeProfit ? formatPrice(order.takeProfit) : '--'}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'center' }}>
                          <button onClick={() => cancelOrderMutation.mutate(order.id)} disabled={cancelOrderMutation.isLoading}
                            style={{ fontSize: 10, padding: '3px 10px', borderRadius: 3, border: `1px solid ${C.red}33`, background: 'transparent', color: C.red, cursor: 'pointer' }}
                            className="hover:brightness-150 disabled:opacity-50">Cancel</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
          )}

          {/* TRADE HISTORY */}
          {bottomTab === 'history' && (
            closedTrades.length === 0
              ? <div className="flex items-center justify-center h-full" style={{ color: C.textT, fontSize: 12 }}>No trade history</div>
              : <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ color: C.textT, borderBottom: `1px solid ${C.border}` }}>
                      {['Symbol', 'Side', 'Qty', 'Entry', 'Close', 'PnL', 'Reason'].map((h, i) => (
                        <th key={i} style={{ padding: '6px 10px', fontWeight: 500, textAlign: i < 2 ? 'left' : 'right' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {closedTrades.slice(0, 50).map((trade) => (
                      <tr key={trade.id} style={{ borderBottom: `1px solid ${C.border}22` }}>
                        <td style={{ padding: '5px 10px', color: C.textP, fontFamily: 'monospace' }}>{trade.symbol}</td>
                        <td style={{ padding: '5px 10px', color: trade.type === 'BUY' ? C.green : C.red, fontWeight: 600 }}>{trade.type === 'BUY' ? 'Long' : 'Short'}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'right', color: C.textP, fontFamily: 'monospace' }}>{trade.volume?.toFixed(3)}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'right', color: C.textP, fontFamily: 'monospace' }}>{formatPrice(trade.openPrice)}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'right', color: C.textP, fontFamily: 'monospace' }}>{formatPrice(trade.closePrice)}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'right', fontFamily: 'monospace', fontWeight: 600, color: (trade.profit || 0) >= 0 ? C.green : C.red }}>{(trade.profit || 0) >= 0 ? '+' : ''}{(trade.profit || 0).toFixed(2)}</td>
                        <td style={{ padding: '5px 10px', textAlign: 'right', color: C.textT }}>{trade.closeReason || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
          )}

          {/* ASSETS */}
          {bottomTab === 'assets' && (
            <div className="p-4">
              <div className="grid grid-cols-2 gap-4" style={{ maxWidth: 500 }}>
                <div className="p-3 rounded" style={{ background: C.card }}>
                  <div style={{ fontSize: 11, color: C.textT, marginBottom: 4 }}>Total Balance</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.textP, fontFamily: 'monospace' }}>{formatNum(balance)} USDT</div>
                </div>
                <div className="p-3 rounded" style={{ background: C.card }}>
                  <div style={{ fontSize: 11, color: C.textT, marginBottom: 4 }}>Equity</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.textP, fontFamily: 'monospace' }}>{formatNum(selectedChallenge?.equity || balance)} USDT</div>
                </div>
                <div className="p-3 rounded" style={{ background: C.card }}>
                  <div style={{ fontSize: 11, color: C.textT, marginBottom: 4 }}>Open Positions</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.textP }}>{openPositions.length}</div>
                </div>
                <div className="p-3 rounded" style={{ background: C.card }}>
                  <div style={{ fontSize: 11, color: C.textT, marginBottom: 4 }}>Pending Orders</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: C.textP }}>{activePendingOrders.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* P&L */}
          {bottomTab === 'pnl' && (
            !pnlSummary
              ? <div className="flex items-center justify-center h-full" style={{ color: C.textT, fontSize: 12 }}>No trading data available</div>
              : <div className="p-4">
                  <div className="grid grid-cols-4 gap-3" style={{ maxWidth: 700 }}>
                    <div className="p-3 rounded" style={{ background: C.card }}>
                      <div style={{ fontSize: 11, color: C.textT, marginBottom: 4 }}>Total P&L</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'monospace', color: pnlSummary.totalPnL >= 0 ? C.green : C.red }}>
                        {pnlSummary.totalPnL >= 0 ? '+' : ''}{pnlSummary.totalPnL.toFixed(2)}
                      </div>
                    </div>
                    <div className="p-3 rounded" style={{ background: C.card }}>
                      <div style={{ fontSize: 11, color: C.textT, marginBottom: 4 }}>Win Rate</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: C.textP }}>{pnlSummary.winRate.toFixed(1)}%</div>
                      <div style={{ fontSize: 10, color: C.textT }}>{pnlSummary.wins}W / {pnlSummary.losses}L / {pnlSummary.total} Total</div>
                    </div>
                    <div className="p-3 rounded" style={{ background: C.card }}>
                      <div style={{ fontSize: 11, color: C.textT, marginBottom: 4 }}>Avg Win</div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace', color: C.green }}>+{pnlSummary.avgWin.toFixed(2)}</div>
                    </div>
                    <div className="p-3 rounded" style={{ background: C.card }}>
                      <div style={{ fontSize: 11, color: C.textT, marginBottom: 4 }}>Avg Loss</div>
                      <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'monospace', color: C.red }}>{pnlSummary.avgLoss.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BybitTradingArea;
