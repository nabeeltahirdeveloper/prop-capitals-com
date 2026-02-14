import React, { useState, useMemo } from 'react';
import { TrendingUp, Wallet, ShoppingCart } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createTrade, updateTrade } from '@/api/trades';
import { createPendingOrder } from '@/api/pending-orders';
import { useToast } from '@/components/ui/use-toast';

const SPOT_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT',
  'BNBUSDT', 'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'MATICUSDT', 'LINKUSDT',
];

const SYMBOL_LABELS = {
  BTCUSDT: 'Bitcoin',
  ETHUSDT: 'Ethereum',
  SOLUSDT: 'Solana',
  XRPUSDT: 'XRP',
  DOGEUSDT: 'Dogecoin',
  BNBUSDT: 'BNB',
  ADAUSDT: 'Cardano',
  AVAXUSDT: 'Avalanche',
  DOTUSDT: 'Polkadot',
  MATICUSDT: 'Polygon',
  LINKUSDT: 'Chainlink',
};

const formatPrice = (price) => {
  if (!price || price === 0) return '--';
  if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
};

const formatUsd = (val) => {
  if (!Number.isFinite(val)) return '--';
  return val.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const getPriceForSymbol = (prices, symbol) => {
  if (!prices || !symbol) return null;
  const s = symbol.toUpperCase();
  const candidates = [
    s,
    s.replace('USDT', '/USDT'),
    s.replace('USDT', '/USD'),
    s.replace('USD', '/USD'),
  ];
  for (const c of candidates) {
    if (prices[c]) return prices[c].mid || prices[c].ask || prices[c].bid || prices[c].price || null;
  }
  return null;
};

/**
 * WalletPanel — spot holdings view built on top of existing open positions.
 *
 * Props:
 *  - accountId: string
 *  - openPositions: Trade[]   (all open trades, already loaded by CommonTerminalWrapper)
 *  - prices: object           (from usePrices() context)
 *  - availableBalance: number (freeMargin — what can still be spent)
 *  - isDark: boolean
 *  - isAccountLocked: boolean
 *  - onTradeExecuted: () => void  (callback to refresh trades)
 */
export default function WalletPanel({
  accountId,
  openPositions = [],
  prices = {},
  availableBalance = 0,
  isDark = true,
  isAccountLocked = false,
  onTradeExecuted,
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // ── Panel tab ────────────────────────────────────────────────────────────────
  const [formTab, setFormTab] = useState('buy'); // 'buy' | 'sell'

  // ── Buy form state ────────────────────────────────────────────────────────────
  const [orderSymbol, setOrderSymbol] = useState('BTCUSDT');
  const [orderQty, setOrderQty] = useState('');
  const [orderType, setOrderType] = useState('MARKET');
  const [limitPrice, setLimitPrice] = useState('');

  // ── Sell form state ─────────────────────────────────────────────────────────
  const [sellAsset, setSellAsset] = useState('');       // selected holding asset
  const [sellQty, setSellQty] = useState('');           // qty to sell
  const [confirmSell, setConfirmSell] = useState(null); // holding to sell (row Sell button)

  // ── Derived data ────────────────────────────────────────────────────────────
  const spotPositions = useMemo(
    () => openPositions.filter((t) => t.positionType === 'SPOT'),
    [openPositions],
  );

  const holdings = useMemo(() => {
    const assetMap = new Map();
    for (const trade of spotPositions) {
      const sym = (trade.symbol || '').toUpperCase().replace('/', '');
      const asset = sym.endsWith('USDT') ? sym.replace('USDT', '') : sym.replace('USD', '');
      const symbol = sym.endsWith('USDT') ? sym : `${asset}USDT`;

      if (!assetMap.has(asset)) {
        assetMap.set(asset, { asset, symbol, totalQty: 0, weightedCostSum: 0, trades: [] });
      }
      const entry = assetMap.get(asset);
      const qty = Number(trade.volume);
      entry.totalQty += qty;
      entry.weightedCostSum += qty * Number(trade.openPrice);
      entry.trades.push(trade);
    }

    return Array.from(assetMap.values()).map((entry) => {
      const avgCost = entry.totalQty > 0 ? entry.weightedCostSum / entry.totalQty : 0;
      const markPrice = getPriceForSymbol(prices, entry.symbol) || 0;
      const valueUsd = entry.totalQty * markPrice;
      const costBasis = entry.totalQty * avgCost;
      const unrealizedPnl = valueUsd - costBasis;
      const unrealizedPct = costBasis > 0 ? (unrealizedPnl / costBasis) * 100 : 0;
      return { ...entry, avgCost, markPrice, valueUsd, unrealizedPnl, unrealizedPct };
    });
  }, [spotPositions, prices]);

  const totalHoldingsValue = useMemo(
    () => holdings.reduce((sum, h) => sum + h.valueUsd, 0),
    [holdings],
  );
  const totalUnrealizedPnl = useMemo(
    () => holdings.reduce((sum, h) => sum + h.unrealizedPnl, 0),
    [holdings],
  );

  // ── Buy form derived ─────────────────────────────────────────────────────────
  const currentMarkPrice = getPriceForSymbol(prices, orderSymbol) || 0;
  const orderCost = orderType === 'MARKET'
    ? Number(orderQty || 0) * currentMarkPrice
    : Number(orderQty || 0) * Number(limitPrice || 0);

  // ── Sell form derived ───────────────────────────────────────────────────────
  const sellHolding = holdings.find((h) => h.asset === sellAsset) || null;
  const sellMarkPrice = sellHolding ? sellHolding.markPrice : 0;
  const sellQtyNum = parseFloat(sellQty) || 0;
  const sellEstValue = sellQtyNum * sellMarkPrice;

  // ── Mutations ───────────────────────────────────────────────────────────────
  const buyMutation = useMutation({
    mutationFn: async () => {
      const qty = parseFloat(orderQty);
      const price = orderType === 'MARKET' ? currentMarkPrice : parseFloat(limitPrice);
      if (!qty || qty <= 0) throw new Error('Enter a valid quantity.');
      if (!price || price <= 0) throw new Error('Price is unavailable. Try again.');
      if (orderCost > availableBalance) throw new Error(`Insufficient balance. Required $${orderCost.toFixed(2)}, available $${availableBalance.toFixed(2)}.`);
      if (orderType === 'MARKET') {
        return createTrade({ accountId, symbol: orderSymbol, type: 'BUY', volume: qty, openPrice: price, leverage: 1, positionType: 'SPOT' });
      }
      return createPendingOrder({ tradingAccountId: accountId, symbol: orderSymbol, type: 'BUY', orderType: 'LIMIT', volume: qty, price: parseFloat(limitPrice), leverage: 1, positionType: 'SPOT' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', accountId] });
      queryClient.invalidateQueries({ queryKey: ['accountSummary', accountId] });
      queryClient.invalidateQueries({ queryKey: ['pendingOrders', accountId] });
      toast({ title: orderType === 'MARKET' ? 'Spot buy executed' : 'Spot limit order placed' });
      setOrderQty('');
      setLimitPrice('');
      onTradeExecuted?.();
    },
    onError: (e) => {
      toast({ title: 'Buy failed', description: e?.response?.data?.message || e.message, variant: 'destructive' });
    },
  });

  const sellMutation = useMutation({
    mutationFn: ({ tradeId, closePrice }) =>
      updateTrade(tradeId, { closePrice, closedAt: new Date().toISOString(), closeReason: 'USER_CLOSE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trades', accountId] });
      queryClient.invalidateQueries({ queryKey: ['accountSummary', accountId] });
      onTradeExecuted?.();
    },
    onError: (e) => {
      toast({ title: 'Sell failed', description: e?.response?.data?.message || e.message, variant: 'destructive' });
    },
  });

  // Close trades greedily (oldest first) until qty is covered
  const executeSell = (holding, qtyToSell, price) => {
    if (!price) { toast({ title: 'Price unavailable', variant: 'destructive' }); return; }
    let remaining = qtyToSell;
    const tradesToClose = [];
    for (const t of holding.trades) {
      if (remaining <= 0) break;
      tradesToClose.push(t);
      remaining -= Number(t.volume);
    }
    Promise.all(
      tradesToClose.map((t) =>
        updateTrade(t.id, { closePrice: price, closedAt: new Date().toISOString(), closeReason: 'USER_CLOSE' }),
      ),
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ['trades', accountId] });
      queryClient.invalidateQueries({ queryKey: ['accountSummary', accountId] });
      toast({ title: `${holding.asset} sold` });
      setConfirmSell(null);
      setSellQty('');
      onTradeExecuted?.();
    }).catch((e) => {
      toast({ title: 'Sell failed', description: e?.response?.data?.message || e.message, variant: 'destructive' });
    });
  };

  // ── Styles ──────────────────────────────────────────────────────────────────
  const bg = isDark ? 'bg-[#12161d]' : 'bg-white';
  const bg2 = isDark ? 'bg-[#0a0d12]' : 'bg-slate-50';
  const border = isDark ? 'border-white/10' : 'border-slate-200';
  const text = isDark ? 'text-white' : 'text-slate-900';
  const muted = isDark ? 'text-gray-400' : 'text-slate-500';
  const inputClass = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#0a0d12] border-white/10 text-white placeholder-gray-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'} focus:outline-none focus:ring-1 focus:ring-amber-500`;
  const selectClass = `w-full px-3 py-2 rounded-lg border text-sm ${isDark ? 'bg-[#0a0d12] border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} focus:outline-none focus:ring-1 focus:ring-amber-500`;
  const green = '#0ecb81';
  const red = '#f6465d';
  const thStyle = { padding: '8px 12px', fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap' };
  const tdStyle = { padding: '6px 12px', fontSize: 12, fontFamily: 'monospace', whiteSpace: 'nowrap' };

  return (
    <div className="space-y-4 p-4">

      {/* ── Summary Cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className={`rounded-xl border ${border} ${bg} p-3`}>
          <p className={`text-xs ${muted} mb-1`}>Total Holdings</p>
          <p className={`text-base font-bold ${text}`}>{formatUsd(totalHoldingsValue)}</p>
        </div>
        <div className={`rounded-xl border ${border} ${bg} p-3`}>
          <p className={`text-xs ${muted} mb-1`}>Unrealized PnL</p>
          <p className="text-base font-bold" style={{ color: totalUnrealizedPnl >= 0 ? green : red }}>
            {totalUnrealizedPnl >= 0 ? '+' : ''}{formatUsd(totalUnrealizedPnl)}
          </p>
        </div>
        <div className={`rounded-xl border ${border} ${bg} p-3`}>
          <p className={`text-xs ${muted} mb-1`}>Available Balance</p>
          <p className={`text-base font-bold ${text}`}>{formatUsd(availableBalance)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Buy / Sell Form ───────────────────────────────────────────────── */}
        <div className={`rounded-xl border ${border} ${bg} overflow-hidden`}>
          {/* Tab header */}
          <div className={`flex border-b ${border}`}>
            <button
              onClick={() => setFormTab('buy')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors ${formTab === 'buy' ? 'bg-amber-500/10 text-amber-500 border-b-2 border-amber-500' : `${muted} hover:${text}`}`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Buy
            </button>
            <button
              onClick={() => setFormTab('sell')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold transition-colors ${formTab === 'sell' ? 'bg-red-500/10 text-red-400 border-b-2 border-red-400' : `${muted} hover:${text}`}`}
            >
              <Wallet className="w-3.5 h-3.5" />
              Sell
            </button>
          </div>

          <div className="p-4 space-y-3">
            {/* ── BUY FORM ── */}
            {formTab === 'buy' && (
              <>
                {/* Order type toggle */}
                <div className={`flex rounded-lg overflow-hidden border ${border}`}>
                  {['MARKET', 'LIMIT'].map((t) => (
                    <button
                      key={t}
                      onClick={() => setOrderType(t)}
                      className={`flex-1 py-1.5 text-xs font-medium transition-colors ${orderType === t ? 'bg-amber-500 text-black' : `${bg2} ${muted}`}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Asset */}
                <div>
                  <label className={`text-xs ${muted} mb-1 block`}>Asset</label>
                  <select value={orderSymbol} onChange={(e) => setOrderSymbol(e.target.value)} className={selectClass}>
                    {SPOT_SYMBOLS.map((s) => (
                      <option key={s} value={s}>{s.replace('USDT', '')} — {SYMBOL_LABELS[s] || s}</option>
                    ))}
                  </select>
                </div>

                <div className={`text-xs ${muted}`}>
                  Mark price: <span className={`font-mono ${text}`}>{currentMarkPrice > 0 ? formatPrice(currentMarkPrice) : '--'}</span>
                </div>

                {orderType === 'LIMIT' && (
                  <div>
                    <label className={`text-xs ${muted} mb-1 block`}>Limit Price (USD)</label>
                    <input type="number" min="0" step="any" placeholder="0.00" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} className={inputClass} />
                  </div>
                )}

                <div>
                  <label className={`text-xs ${muted} mb-1 block`}>Quantity ({orderSymbol.replace('USDT', '')})</label>
                  <input type="number" min="0" step="any" placeholder="0.00" value={orderQty} onChange={(e) => setOrderQty(e.target.value)} className={inputClass} />
                </div>

                {orderCost > 0 && (
                  <p className={`text-xs ${muted}`}>
                    Est. cost: <span className={`font-mono ${text}`}>{formatUsd(orderCost)}</span>
                    {orderCost > availableBalance && <span style={{ color: red }}> — insufficient balance</span>}
                  </p>
                )}

                <button
                  onClick={() => buyMutation.mutate()}
                  disabled={buyMutation.isPending || isAccountLocked || !orderQty}
                  className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-bold transition-colors"
                >
                  {buyMutation.isPending ? 'Placing...' : orderType === 'MARKET' ? 'Buy Now' : 'Place Limit Order'}
                </button>
              </>
            )}

            {/* ── SELL FORM ── */}
            {formTab === 'sell' && (
              <>
                {holdings.length === 0 ? (
                  <p className={`text-xs ${muted} text-center py-4`}>No holdings to sell.<br />Buy crypto from the Buy tab.</p>
                ) : (
                  <>
                    <div>
                      <label className={`text-xs ${muted} mb-1 block`}>Asset</label>
                      <select
                        value={sellAsset}
                        onChange={(e) => { setSellAsset(e.target.value); setSellQty(''); }}
                        className={selectClass}
                      >
                        <option value="">— Select asset —</option>
                        {holdings.map((h) => (
                          <option key={h.asset} value={h.asset}>
                            {h.asset} — {h.totalQty.toFixed(6)} available
                          </option>
                        ))}
                      </select>
                    </div>

                    {sellHolding && (
                      <>
                        <div className={`rounded-lg p-2 space-y-1 ${bg2} border ${border}`}>
                          <div className="flex justify-between text-xs">
                            <span className={muted}>Mark Price</span>
                            <span className={`font-mono ${text}`}>{sellMarkPrice > 0 ? formatPrice(sellMarkPrice) : '--'}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className={muted}>Holdings</span>
                            <span className={`font-mono ${text}`}>{sellHolding.totalQty.toFixed(6)} {sellHolding.asset}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className={muted}>Avg Cost</span>
                            <span className={`font-mono ${muted}`}>{formatPrice(sellHolding.avgCost)}</span>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className={`text-xs ${muted}`}>Quantity ({sellHolding.asset})</label>
                            <button onClick={() => setSellQty(sellHolding.totalQty.toString())} className="text-xs text-amber-500 hover:text-amber-400">Max</button>
                          </div>
                          <input type="number" min="0" max={sellHolding.totalQty} step="any" placeholder="0.00" value={sellQty} onChange={(e) => setSellQty(e.target.value)} className={inputClass} />
                        </div>

                        {sellEstValue > 0 && (
                          <p className={`text-xs ${muted}`}>
                            Est. value: <span className={`font-mono ${text}`}>{formatUsd(sellEstValue)}</span>
                          </p>
                        )}

                        <button
                          onClick={() => {
                            if (!sellQty || sellQtyNum <= 0) { toast({ title: 'Enter valid quantity', variant: 'destructive' }); return; }
                            if (sellQtyNum > sellHolding.totalQty) { toast({ title: 'Quantity exceeds holdings', variant: 'destructive' }); return; }
                            if (!sellMarkPrice) { toast({ title: 'Price unavailable', variant: 'destructive' }); return; }
                            executeSell(sellHolding, sellQtyNum, sellMarkPrice);
                          }}
                          disabled={sellMutation.isPending || isAccountLocked || !sellQty || !sellMarkPrice}
                          className="w-full py-2 rounded-lg bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-sm font-bold transition-colors"
                        >
                          {sellMutation.isPending ? 'Selling...' : `Sell ${sellHolding.asset}`}
                        </button>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Holdings Table ────────────────────────────────────────────────── */}
        <div className={`lg:col-span-2 rounded-xl border ${border} ${bg} overflow-hidden`}>
          <div className={`px-4 py-3 border-b ${border} flex items-center gap-2`}>
            <Wallet className="w-4 h-4 text-amber-500" />
            <span className={`text-sm font-semibold ${text}`}>Holdings</span>
            {holdings.length > 0 && (
              <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold">{holdings.length}</span>
            )}
          </div>

          {holdings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10">
              <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-slate-200'}`}>
                <TrendingUp className={`w-6 h-6 ${muted}`} />
              </div>
              <p className={`font-medium text-sm ${text}`}>No spot holdings</p>
              <p className={`text-xs mt-1 ${muted}`}>Buy crypto using the Buy tab on the left</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr className={`border-b ${border}`}>
                    <th style={{ ...thStyle, textAlign: 'left' }} className={muted}>Asset</th>
                    <th style={{ ...thStyle, textAlign: 'right' }} className={muted}>Qty</th>
                    <th style={{ ...thStyle, textAlign: 'right' }} className={muted}>Avg Cost</th>
                    <th style={{ ...thStyle, textAlign: 'right' }} className={muted}>Mark Price</th>
                    <th style={{ ...thStyle, textAlign: 'right' }} className={muted}>Value</th>
                    <th style={{ ...thStyle, textAlign: 'right' }} className={muted}>Unrealized PnL</th>
                    <th style={{ ...thStyle, textAlign: 'center' }} className={muted}></th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.asset} className={`border-b border-white/5`}>
                      <td style={{ ...tdStyle, textAlign: 'left' }}>
                        <div className={`font-semibold ${text}`}>{h.asset}</div>
                        <div className={`text-xs ${muted}`}>{SYMBOL_LABELS[h.symbol] || h.symbol}</div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }} className={text}>
                        {h.totalQty.toFixed(6)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }} className={muted}>
                        {formatPrice(h.avgCost)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }} className={text}>
                        {h.markPrice > 0 ? formatPrice(h.markPrice) : '--'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }} className={text}>
                        {h.markPrice > 0 ? formatUsd(h.valueUsd) : '--'}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                        <div style={{ color: h.unrealizedPnl >= 0 ? green : red }}>
                          {h.markPrice > 0 ? (
                            <>
                              {h.unrealizedPnl >= 0 ? '+' : ''}{formatUsd(h.unrealizedPnl)}
                              <div className="text-xs" style={{ color: h.unrealizedPct >= 0 ? green : red }}>
                                {h.unrealizedPct >= 0 ? '+' : ''}{h.unrealizedPct.toFixed(2)}%
                              </div>
                            </>
                          ) : '--'}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button
                          onClick={() => setConfirmSell(h)}
                          disabled={sellMutation.isPending || isAccountLocked || !h.markPrice}
                          className={`text-xs px-3 py-1 rounded border transition-colors disabled:opacity-50 ${
                            isDark
                              ? 'border-white/10 text-gray-400 hover:text-white hover:border-white/30'
                              : 'border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-400'
                          }`}
                        >
                          Sell
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Sell Confirmation Modal ──────────────────────────────────────────── */}
      {confirmSell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className={`rounded-2xl border ${border} ${bg} p-6 w-full max-w-sm shadow-2xl`}>
            <h3 className={`text-base font-bold ${text} mb-1`}>Sell {confirmSell.asset}</h3>
            <p className={`text-sm ${muted} mb-4`}>
              Close all {confirmSell.trades.length} open position{confirmSell.trades.length > 1 ? 's' : ''} — {confirmSell.totalQty.toFixed(6)} {confirmSell.asset} at market price.
            </p>

            <div className={`rounded-lg ${bg2} p-3 mb-4 space-y-1`}>
              <div className="flex justify-between text-xs">
                <span className={muted}>Quantity</span>
                <span className={`font-mono ${text}`}>{confirmSell.totalQty.toFixed(6)} {confirmSell.asset}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={muted}>Mark Price</span>
                <span className={`font-mono ${text}`}>{formatPrice(confirmSell.markPrice)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={muted}>Est. Value</span>
                <span className={`font-mono ${text}`}>{formatUsd(confirmSell.valueUsd)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className={muted}>Unrealized PnL</span>
                <span className="font-mono" style={{ color: confirmSell.unrealizedPnl >= 0 ? green : red }}>
                  {confirmSell.unrealizedPnl >= 0 ? '+' : ''}{formatUsd(confirmSell.unrealizedPnl)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmSell(null)}
                className={`flex-1 py-2 rounded-lg border ${border} text-sm ${muted} hover:${text} transition-colors`}
              >
                Cancel
              </button>
              <button
                disabled={!confirmSell.markPrice || sellMutation.isPending}
                onClick={() => {
                  const price = confirmSell.markPrice;
                  if (!price) {
                    toast({ title: 'Price unavailable', variant: 'destructive' });
                    return;
                  }
                  // Close each individual trade
                  const closingPromises = confirmSell.trades.map((t) =>
                    updateTrade(t.id, { closePrice: price, closedAt: new Date().toISOString(), closeReason: 'USER_CLOSE' }),
                  );
                  Promise.all(closingPromises)
                    .then(() => {
                      queryClient.invalidateQueries({ queryKey: ['trades', accountId] });
                      queryClient.invalidateQueries({ queryKey: ['accountSummary', accountId] });
                      toast({ title: `${confirmSell.asset} sold` });
                      setConfirmSell(null);
                      onTradeExecuted?.();
                    })
                    .catch((e) => {
                      toast({ title: 'Sell failed', description: e?.response?.data?.message || e.message, variant: 'destructive' });
                    });
                }}
                className="flex-1 py-2 rounded-lg bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white text-sm font-bold transition-colors"
              >
                {sellMutation.isPending ? 'Selling...' : 'Confirm Sell'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
