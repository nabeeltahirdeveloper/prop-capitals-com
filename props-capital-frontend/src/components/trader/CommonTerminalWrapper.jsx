import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, ChevronDown, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTraderTheme } from './TraderPanelLayout';
import { useChallenges } from '@/contexts/ChallengesContext';
import { usePrices } from '@/contexts/PriceContext';
import { getAccountTrades, updateTrade } from '@/api/trades';
import { getPendingOrders, cancelPendingOrder } from '@/api/pending-orders';
import { processPriceTick } from '@/api/accounts';
import { useToast } from '@/components/ui/use-toast';
import ChallengeActiveBanner from '../trading/ChallengeActiveBanner';
import PhaseProgressionCards from '../trading/PhaseProgressionCards';
import BalanceStatsRow from '../trading/BalanceStatsRow';
import ComplianceMetrics from '../trading/ComplianceMetrics';
import TradingStyleRules from '../trading/TradingStyleRules';

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

const CommonTerminalWrapper = ({ children }) => {
  const { isDark } = useTraderTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { prices } = usePrices();
  const {
    challenges,
    selectedChallenge,
    selectChallenge,
    getChallengePhaseLabel,
    getRuleCompliance,
    loading
  } = useChallenges();

  const [selectedTab, setSelectedTab] = useState('positions');
  const [liveMetrics, setLiveMetrics] = useState({ equity: null, profitPercent: null, dailyDrawdownPercent: null, overallDrawdownPercent: null });
  const [closeConfirmTrade, setCloseConfirmTrade] = useState(null);
  const priceTickThrottleRef = useRef({});

  const accountId = selectedChallenge?.id;

  // Reset live metrics when account changes
  useEffect(() => {
    setLiveMetrics({ equity: null, profitPercent: null, dailyDrawdownPercent: null, overallDrawdownPercent: null });
    priceTickThrottleRef.current = {};
  }, [accountId]);

  /* ── Price lookup helper ── */
  const getPriceForSymbol = useCallback((symbol) => {
    if (!symbol || !prices) return null;
    let pd = prices[symbol];
    if (pd && pd.bid !== undefined) return pd;
    const upper = symbol.toUpperCase();
    if (upper.endsWith('USDT')) {
      pd = prices[`${upper.replace(/USDT$/, '')}/USD`];
    } else if (upper.length >= 6) {
      pd = prices[`${upper.slice(0, 3)}/${upper.slice(3)}`];
    }
    return pd && pd.bid !== undefined ? pd : null;
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

  /* ── Forward price ticks to backend for violation checking ── */
  useEffect(() => {
    if (openPositions.length === 0 || !accountId) return;
    const isLocked = selectedChallenge?.status === 'failed' || selectedChallenge?.status === 'inactive';
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
  }, [openPositions, accountId, selectedChallenge?.status, prices, getPriceForSymbol, queryClient, toast]);

  /* ── Mutations ── */
  const closePositionMutation = useMutation({
    mutationFn: ({ tradeId, closePrice }) => updateTrade(tradeId, { closePrice, closedAt: new Date().toISOString(), closeReason: 'USER_CLOSE' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['trades', accountId] }); toast({ title: 'Position Closed' }); },
    onError: (e) => { toast({ title: 'Close Failed', description: e?.response?.data?.message || e.message, variant: 'destructive' }); },
  });
  const cancelOrderMutation = useMutation({
    mutationFn: cancelPendingOrder,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['pendingOrders', accountId] }); toast({ title: 'Order Cancelled' }); },
    onError: (e) => { toast({ title: 'Cancel Failed', description: e?.response?.data?.message || e.message, variant: 'destructive' }); },
  });

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
  const borderColor = isDark ? 'border-white/10' : 'border-slate-200';
  const bgMuted = isDark ? 'bg-[#0a0d12]' : 'bg-slate-50';
  const green = '#0ecb81';
  const red = '#f6465d';

  const phaseLabel = getChallengePhaseLabel(selectedChallenge);
  const balance = selectedChallenge.currentBalance || 0;
  const equity = (openPositions.length > 0) ? (balance + totalFloatingPnL) : (selectedChallenge.equity || balance);
  const floatingPL = totalFloatingPnL;
  const profitPercent = liveMetrics.profitPercent !== null
    ? liveMetrics.profitPercent
    : ((balance - selectedChallenge.accountSize) / selectedChallenge.accountSize) * 100;

  const isAccountLocked = selectedChallenge.status === 'failed' || selectedChallenge.status === 'inactive';
  const isDataLoading = tradesLoading || ordersLoading;

  // Compliance: override with live backend metrics when available
  const baseCompliance = getRuleCompliance(selectedChallenge);
  const compliance = (() => {
    if (!baseCompliance) return baseCompliance;
    const result = { ...baseCompliance };
    if (liveMetrics.profitPercent !== null) {
      const current = liveMetrics.profitPercent;
      const target = selectedChallenge.rules?.profitTarget || 8;
      result.profitTarget = { ...result.profitTarget, current, percentage: Math.min((current / target) * 100, 100), status: current >= target ? 'passed' : 'in-progress' };
    }
    if (liveMetrics.dailyDrawdownPercent !== null) {
      const current = liveMetrics.dailyDrawdownPercent;
      const limit = selectedChallenge.rules?.maxDailyLoss || 5;
      result.dailyLoss = { ...result.dailyLoss, current, percentage: (current / limit) * 100, status: current >= limit ? 'violated' : current >= limit * 0.8 ? 'warning' : 'safe' };
    }
    if (liveMetrics.overallDrawdownPercent !== null) {
      const current = liveMetrics.overallDrawdownPercent;
      const limit = selectedChallenge.rules?.maxTotalDrawdown || 10;
      result.totalDrawdown = { ...result.totalDrawdown, current, percentage: (current / limit) * 100, status: current >= limit ? 'violated' : current >= limit * 0.8 ? 'warning' : 'safe' };
    }
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
      {/* ==================== CHALLENGE ACTIVE BANNER ==================== */}
      <ChallengeActiveBanner challenge={selectedChallenge} phaseLabel={phaseLabel} />

      {/* ==================== PHASE PROGRESSION ==================== */}
      <PhaseProgressionCards challenge={(() => {
        if (liveMetrics.profitPercent === null) return selectedChallenge;
        return {
          ...selectedChallenge,
          stats: { ...selectedChallenge.stats, currentProfit: Math.max(0, liveMetrics.profitPercent) },
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
        {children}
      </div>

      {/* ==================== POSITIONS / PENDING / HISTORY ==================== */}
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
