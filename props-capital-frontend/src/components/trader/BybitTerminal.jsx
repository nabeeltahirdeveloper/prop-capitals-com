import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Loader2, TrendingUp } from 'lucide-react';
import { useTrading } from '@/contexts/TradingContext';
import { usePrices } from '@/contexts/PriceContext';
import { useTradingWebSocket } from '@/hooks/useTradingWebSocket';
import { getAccountTrades, createTrade } from '@/api/trades';
import { getPendingOrders, createPendingOrder, cancelPendingOrder } from '@/api/pending-orders';
import { getAccountSummary } from '@/api/accounts';
import { useToast } from '@/components/ui/use-toast';
import TradingChart from '../trading/TradingChart';

const BybitTradingArea = ({ selectedChallenge }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [orderType, setOrderType] = useState('limit');
  const [orderSide, setOrderSide] = useState('buy');
  const [limitPrice, setLimitPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [leverage, setLeverage] = useState(10);
  const [tpPrice, setTpPrice] = useState('');
  const [slPrice, setSlPrice] = useState('');
  const [showTpSl, setShowTpSl] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const {
    selectedSymbol,
    selectedTimeframe,
    setSelectedTimeframe,
    chartType,
    setChartType,
  } = useTrading();

  const chartAreaRef = useRef(null);
  const pricesRef = useRef({});
  const { prices: unifiedPrices } = usePrices();
  
  const accountId = selectedChallenge?.accountId;

  // Fetch data
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

  useTradingWebSocket(accountId);

  const openPositions = tradesData?.trades?.filter(t => t.status === 'OPEN') || [];
  const pendingOrders = pendingOrdersData?.orders || [];

  const enrichedSelectedSymbol = useMemo(() => {
    if (!selectedSymbol?.symbol) return selectedSymbol;
    const priceData = unifiedPrices[selectedSymbol.symbol];
    if (priceData && typeof priceData === 'object' && priceData.bid !== undefined && priceData.ask !== undefined) {
      const spread = ((priceData.ask - priceData.bid) * 10000).toFixed(1);
      return { ...selectedSymbol, bid: priceData.bid, ask: priceData.ask, spread: parseFloat(spread) };
    }
    return selectedSymbol;
  }, [selectedSymbol, unifiedPrices]);

  const handlePriceUpdate = useCallback((symbolName, price) => {
    pricesRef.current[symbolName] = price;
  }, []);

  const askOrders = useMemo(() => {
    const base = 97150.50;
    const rows = [];
    for (let i = 0; i < 12; i++) {
      const price = base + (12 - i) * 0.50;
      const qty = (Math.random() * 5 + 0.1).toFixed(3);
      rows.push({ price: price.toFixed(2), qty, total: (price * parseFloat(qty)).toFixed(2) });
    }
    return rows;
  }, []);

  const bidOrders = useMemo(() => {
    const base = 97150.50;
    const rows = [];
    for (let i = 0; i < 12; i++) {
      const price = base - (i + 1) * 0.50;
      const qty = (Math.random() * 5 + 0.1).toFixed(3);
      rows.push({ price: price.toFixed(2), qty, total: (price * parseFloat(qty)).toFixed(2) });
    }
    return rows;
  }, []);

  const maxAskQty = useMemo(() => Math.max(...askOrders.map(o => parseFloat(o.qty))), [askOrders]);
  const maxBidQty = useMemo(() => Math.max(...bidOrders.map(o => parseFloat(o.qty))), [bidOrders]);

  // Mutations
  const createTradeMutation = useMutation({
    mutationFn: createTrade,
    onSuccess: () => {
      queryClient.invalidateQueries(['trades', accountId]);
      queryClient.invalidateQueries(['accountSummary', accountId]);
      toast({ title: 'Order Placed', description: 'Your order has been successfully placed.' });
      setQuantity('');
      setLimitPrice('');
      setTpPrice('');
      setSlPrice('');
    },
    onError: (error) => {
      toast({ title: 'Order Failed', description: error.message || 'Failed to place order', variant: 'destructive' });
    },
  });

  const createPendingOrderMutation = useMutation({
    mutationFn: createPendingOrder,
    onSuccess: () => {
      queryClient.invalidateQueries(['pendingOrders', accountId]);
      toast({ title: 'Pending Order Created', description: 'Your pending order has been created.' });
      setQuantity('');
      setLimitPrice('');
      setTpPrice('');
      setSlPrice('');
    },
    onError: (error) => {
      toast({ title: 'Order Failed', description: error.message || 'Failed to create pending order', variant: 'destructive' });
    },
  });

  const handlePlaceOrder = async () => {
    if (!accountId || !selectedSymbol?.symbol) {
      toast({ title: 'Error', description: 'Please select a symbol', variant: 'destructive' });
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast({ title: 'Error', description: 'Please enter a valid quantity', variant: 'destructive' });
      return;
    }

    setIsPlacingOrder(true);

    try {
      const currentPrice = enrichedSelectedSymbol?.bid || enrichedSelectedSymbol?.ask || 0;
      const orderPrice = orderType === 'limit' && limitPrice ? parseFloat(limitPrice) : currentPrice;

      if (orderType === 'market') {
        await createTradeMutation.mutateAsync({
          accountId,
          symbol: selectedSymbol.symbol,
          type: orderSide.toUpperCase(),
          volume: parseFloat(quantity),
          openPrice: currentPrice,
          stopLoss: slPrice ? parseFloat(slPrice) : null,
          takeProfit: tpPrice ? parseFloat(tpPrice) : null,
          leverage: leverage,
        });
      } else {
        await createPendingOrderMutation.mutateAsync({
          accountId,
          symbol: selectedSymbol.symbol,
          type: orderSide.toUpperCase(),
          volume: parseFloat(quantity),
          triggerPrice: orderPrice,
          stopLoss: slPrice ? parseFloat(slPrice) : null,
          takeProfit: tpPrice ? parseFloat(tpPrice) : null,
        });
      }
    } catch (error) {
      console.error('Order placement error:', error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const balance = selectedChallenge?.currentBalance || 0;
  const timeframes = ['1', '3', '5', '15', '30', '1H', '4H', '1D', '1W'];

  return (
    <div className="flex flex-col gap-[1px] bg-[#16191e]" style={{ fontFamily: "'IBM Plex Sans', -apple-system, sans-serif" }}>
      {/* TOP SYMBOL BAR */}
      <div className="bg-[#1b1d29] px-3 py-2 flex items-center gap-4 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">
          <Star className="w-4 h-4 text-[#f7a600]" />
          <span className="text-white font-semibold text-sm">{selectedSymbol?.symbol || 'BTCUSDT'}</span>
          <span className="text-[#f7a600] text-[10px] font-medium px-1.5 py-0.5 bg-[#f7a600]/10 rounded">Perpetual</span>
        </div>
        <div className="flex items-center gap-5 text-xs shrink-0">
          <div>
            <span className="text-[#20b26c] text-base font-semibold font-mono">97,150.50</span>
            <span className="text-[#71757a] ml-1.5">$97,150.50</span>
          </div>
          <div>
            <span className="text-[#71757a]">24h Change</span>
            <span className="text-[#20b26c] ml-1.5 font-mono">+1.23%</span>
          </div>
          <div className="hidden md:block">
            <span className="text-[#71757a]">24h High</span>
            <span className="text-white ml-1.5 font-mono">97,845.00</span>
          </div>
          <div className="hidden md:block">
            <span className="text-[#71757a]">24h Low</span>
            <span className="text-white ml-1.5 font-mono">95,320.10</span>
          </div>
          <div className="hidden lg:block">
            <span className="text-[#71757a]">24h Vol(USDT)</span>
            <span className="text-white ml-1.5 font-mono">2.31B</span>
          </div>
        </div>
      </div>

      {/* TIMEFRAME BAR */}
      <div className="bg-[#1b1d29] px-3 py-1.5 flex items-center gap-1 border-b border-[#2b2f36]">
        {timeframes.map((tf) => (
          <button
            key={tf}
            onClick={() => setSelectedTimeframe(tf)}
            className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
              selectedTimeframe === tf
                ? 'text-[#f7a600] bg-[#f7a600]/10'
                : 'text-[#71757a] hover:text-white'
            }`}
          >
            {tf}
          </button>
        ))}
        <div className="mx-2 w-px h-4 bg-[#2b2f36]" />
        <button className={`px-2 py-1 text-[11px] font-medium rounded ${chartType === 'candlestick' ? 'text-[#f7a600]' : 'text-[#71757a]'}`}
          onClick={() => setChartType('candlestick')}>Candles</button>
        <button className={`px-2 py-1 text-[11px] font-medium rounded ${chartType === 'line' ? 'text-[#f7a600]' : 'text-[#71757a]'}`}
          onClick={() => setChartType('line')}>Line</button>
      </div>

      {/* MAIN TRADING AREA */}
      <div className="flex flex-col lg:flex-row gap-[1px]">
        {/* LEFT: CHART */}
        <div className="flex-1 min-w-0 bg-[#1b1d29] flex flex-col" style={{ minHeight: '480px' }}>
          <TradingChart
            key={`chart-bybit-${selectedSymbol?.symbol}`}
            symbol={enrichedSelectedSymbol}
            openPositions={openPositions}
            onPriceUpdate={handlePriceUpdate}
          />
        </div>

        {/* MIDDLE: ORDER BOOK */}
        <div className="w-full lg:w-[220px] shrink-0 bg-[#1b1d29] flex flex-col">
          <div className="px-3 py-2 border-b border-[#2b2f36] flex items-center justify-between">
            <span className="text-white text-xs font-medium">Order Book</span>
            <span className="text-[11px] text-[#71757a]">0.01</span>
          </div>

          <div className="px-3 py-1">
            <div className="grid grid-cols-3 text-[10px] text-[#71757a] py-1 mb-0.5">
              <span>Price(USDT)</span>
              <span className="text-right">Qty(BTC)</span>
              <span className="text-right">Total</span>
            </div>

            <div className="space-y-0">
              {askOrders.map((order, i) => (
                <div key={`ask-${i}`} className="relative grid grid-cols-3 text-[10px] py-[2px] cursor-pointer hover:bg-[#ef454526]">
                  <div className="absolute right-0 top-0 bottom-0 bg-[#ef4545]/10"
                    style={{ width: `${(parseFloat(order.qty) / maxAskQty) * 100}%` }} />
                  <span className="text-[#ef4545] font-mono relative z-10">{order.price}</span>
                  <span className="text-[#c8cad0] text-right font-mono relative z-10">{order.qty}</span>
                  <span className="text-[#71757a] text-right font-mono relative z-10">{order.total}</span>
                </div>
              ))}
            </div>

            <div className="py-2 border-y border-[#2b2f36] my-1 text-center">
              <span className="text-[#20b26c] text-sm font-bold font-mono">97,150.50</span>
              <span className="text-[#71757a] text-[10px] ml-1.5">= $97,150.50</span>
            </div>

            <div className="space-y-0">
              {bidOrders.map((order, i) => (
                <div key={`bid-${i}`} className="relative grid grid-cols-3 text-[10px] py-[2px] cursor-pointer hover:bg-[#20b26c26]">
                  <div className="absolute right-0 top-0 bottom-0 bg-[#20b26c]/10"
                    style={{ width: `${(parseFloat(order.qty) / maxBidQty) * 100}%` }} />
                  <span className="text-[#20b26c] font-mono relative z-10">{order.price}</span>
                  <span className="text-[#c8cad0] text-right font-mono relative z-10">{order.qty}</span>
                  <span className="text-[#71757a] text-right font-mono relative z-10">{order.total}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT: TRADE PANEL */}
        <div className="w-full lg:w-[280px] shrink-0 bg-[#1b1d29] flex flex-col">
          <div className="flex border-b border-[#2b2f36]">
            {['limit', 'market', 'conditional'].map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex-1 py-2.5 text-[11px] font-medium capitalize transition-colors ${
                  orderType === type
                    ? 'text-white border-b-2 border-[#f7a600]'
                    : 'text-[#71757a] hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="p-3 space-y-3 flex-1 overflow-y-auto">
            <div className="flex gap-2">
              <button className="flex-1 text-[11px] font-medium text-white bg-[#2b2f36] rounded py-1.5 hover:bg-[#363a45] transition-colors">
                Cross
              </button>
              <button className="flex-1 text-[11px] font-medium text-[#f7a600] bg-[#f7a600]/10 border border-[#f7a600]/30 rounded py-1.5">
                {leverage}x
              </button>
            </div>

            <div>
              <input
                type="range" min="1" max="100" value={leverage}
                onChange={(e) => setLeverage(parseInt(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #f7a600 ${leverage}%, #2b2f36 ${leverage}%)`,
                  accentColor: '#f7a600'
                }}
              />
              <div className="flex justify-between mt-1">
                {[1, 5, 10, 25, 50, 100].map((v) => (
                  <button key={v} onClick={() => setLeverage(v)}
                    className={`text-[9px] px-1 py-0.5 rounded ${leverage === v ? 'text-[#f7a600] bg-[#f7a600]/10' : 'text-[#71757a]'}`}
                  >{v}x</button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-0 rounded-md overflow-hidden">
              <button
                onClick={() => setOrderSide('buy')}
                className={`py-2 text-xs font-bold transition-colors ${
                  orderSide === 'buy'
                    ? 'bg-[#20b26c] text-white'
                    : 'bg-[#2b2f36] text-[#71757a] hover:text-white'
                }`}
              >Buy/Long</button>
              <button
                onClick={() => setOrderSide('sell')}
                className={`py-2 text-xs font-bold transition-colors ${
                  orderSide === 'sell'
                    ? 'bg-[#ef4545] text-white'
                    : 'bg-[#2b2f36] text-[#71757a] hover:text-white'
                }`}
              >Sell/Short</button>
            </div>

            {orderType === 'limit' && (
              <div>
                <label className="text-[10px] text-[#71757a] mb-1 block">Order Price</label>
                <div className="flex items-center bg-[#2b2f36] rounded border border-[#363a45] focus-within:border-[#f7a600] transition-colors">
                  <button className="px-2 py-2 text-[#71757a] hover:text-white text-sm font-mono">-</button>
                  <input
                    type="text" value={limitPrice}
                    onChange={(e) => setLimitPrice(e.target.value)}
                    placeholder="97,150.50"
                    className="flex-1 bg-transparent text-center text-white text-xs font-mono outline-none py-2"
                  />
                  <button className="px-2 py-2 text-[#71757a] hover:text-white text-sm font-mono">+</button>
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] text-[#71757a]">Qty (BTC)</label>
                <span className="text-[10px] text-[#71757a]">Avbl: {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</span>
              </div>
              <div className="flex items-center bg-[#2b2f36] rounded border border-[#363a45] focus-within:border-[#f7a600] transition-colors">
                <button className="px-2 py-2 text-[#71757a] hover:text-white text-sm font-mono">-</button>
                <input
                  type="text" value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.000"
                  className="flex-1 bg-transparent text-center text-white text-xs font-mono outline-none py-2"
                />
                <button className="px-2 py-2 text-[#71757a] hover:text-white text-sm font-mono">+</button>
              </div>
              <div className="flex gap-1 mt-1.5">
                {['25%', '50%', '75%', '100%'].map((pct) => (
                  <button key={pct}
                    className="flex-1 text-[9px] py-1 rounded bg-[#2b2f36] text-[#71757a] hover:text-white hover:bg-[#363a45] font-medium transition-colors"
                  >{pct}</button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-[#71757a]">TP/SL</span>
              <button
                onClick={() => setShowTpSl(!showTpSl)}
                className={`w-8 h-4 rounded-full transition-colors relative ${showTpSl ? 'bg-[#f7a600]' : 'bg-[#2b2f36]'}`}
              >
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${showTpSl ? 'left-[18px]' : 'left-0.5'}`} />
              </button>
            </div>

            {showTpSl && (
              <div className="space-y-2">
                <div className="flex items-center bg-[#2b2f36] rounded border border-[#363a45] px-3 py-1.5">
                  <span className="text-[10px] text-[#20b26c] w-8">TP</span>
                  <input type="text" value={tpPrice} onChange={(e) => setTpPrice(e.target.value)}
                    placeholder="Take Profit Price" className="flex-1 bg-transparent text-white text-xs font-mono outline-none" />
                </div>
                <div className="flex items-center bg-[#2b2f36] rounded border border-[#363a45] px-3 py-1.5">
                  <span className="text-[10px] text-[#ef4545] w-8">SL</span>
                  <input type="text" value={slPrice} onChange={(e) => setSlPrice(e.target.value)}
                    placeholder="Stop Loss Price" className="flex-1 bg-transparent text-white text-xs font-mono outline-none" />
                </div>
              </div>
            )}

            <div className="space-y-1.5 py-2 border-t border-[#2b2f36]">
              <div className="flex justify-between text-[10px]">
                <span className="text-[#71757a]">Order Value</span>
                <span className="text-[#c8cad0] font-mono">0.00 USDT</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[#71757a]">Order Cost</span>
                <span className="text-[#c8cad0] font-mono">0.00 USDT</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-[#71757a]">Available Balance</span>
                <span className="text-[#c8cad0] font-mono">{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USDT</span>
              </div>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={isPlacingOrder || !accountId}
              className={`w-full py-2.5 rounded font-bold text-xs transition-colors ${
              orderSide === 'buy'
                ? 'bg-[#20b26c] hover:bg-[#1a9e5c] text-white disabled:opacity-50 disabled:cursor-not-allowed'
                : 'bg-[#ef4545] hover:bg-[#d93b3b] text-white disabled:opacity-50 disabled:cursor-not-allowed'
            }`}>
              {isPlacingOrder ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Placing...
                </span>
              ) : (
                orderSide === 'buy' ? 'Buy/Long' : 'Sell/Short'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BybitTradingArea;
