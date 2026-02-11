import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Minus,
  Plus,
  X,
  ChevronDown
} from 'lucide-react';
import { useTranslation } from '../../contexts/LanguageContext';
import { useTraderTheme } from '../trader/TraderPanelLayout';

export default function TradingPanel({ 
  selectedSymbol, 
  accountBalance = 100000,
  onExecuteTrade,
  maxLotSize = 100,
  chartPrice,
  disabled = false,
  headless = false
}) {
  const { t } = useTranslation();
  const { isDark } = useTraderTheme();
  const [orderType, setOrderType] = useState('limit');
  const [tradeDirection, setTradeDirection] = useState('buy');
  const [lotSize, setLotSize] = useState(0.01);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leveragePercent, setLeveragePercent] = useState(25);

  // Default symbol if none selected
  const defaultSymbol = { 
    symbol: 'EUR/USD', 
    bid: 1.08542, 
    ask: 1.08557, 
    spread: 1.5,
    change: 0.05
  };
  
  const symbol = selectedSymbol && selectedSymbol.symbol ? selectedSymbol : defaultSymbol;

  const leverage = 100;
  
  // Check if symbol is crypto - derived directly from symbol
  const isCrypto = symbol.symbol.includes('BTC') || symbol.symbol.includes('ETH') || 
                   symbol.symbol.includes('SOL') || symbol.symbol.includes('XRP') ||
                   symbol.symbol.includes('ADA') || symbol.symbol.includes('DOGE');
  
  // Contract size: 1 for crypto, 100000 for forex
  const contractSize = isCrypto ? 1 : 100000;
  
  // Reset lot size when symbol changes
  useEffect(() => {
    // Set a reasonable default based on asset type and account balance
    if (isCrypto) {
      setLotSize(0.1); // 0.1 BTC
    } else {
      setLotSize(1.0); // 1.0 lot = standard lot
    }
    setLeveragePercent(25);
  }, [symbol.symbol]);
  
  const calculateMargin = () => {
    const margin = lotSize * contractSize * symbol.bid / leverage;
    return margin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculateOrderValue = () => {
    const value = lotSize * contractSize * symbol.bid;
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  // Calculate lot size from percentage of account balance (as margin)
  const calculateLotSizeFromPercent = (percent) => {
    // With 100x leverage:
    // margin = lotSize * contractSize * price / leverage
    // So: lotSize = (margin * leverage) / (contractSize * price)
    const marginToUse = accountBalance * (percent / 100);
    const price = symbol.bid;
    
    if (!price || price === 0) return isCrypto ? 0.01 : 0.1;
    
    // lotSize = (marginToUse * leverage) / (contractSize * price)
    const newLotSize = (marginToUse * leverage) / (contractSize * price);
    
    // For crypto, round to 4 decimals; for forex, round to 2 decimals
    const decimals = isCrypto ? 4 : 2;
    const minLot = isCrypto ? 0.0001 : 0.01;
    
    const result = Math.max(minLot, Math.min(newLotSize, maxLotSize));
    return parseFloat(result.toFixed(decimals));
  };

  const handleTrade = () => {
    console.log('=== TradingPanel handleTrade START ===');
    console.log('Symbol:', symbol);
    console.log('onExecuteTrade:', typeof onExecuteTrade);
    
    if (isSubmitting) {
      console.log('Already submitting, returning');
      return;
    }
    
    // Get market price - prefer chart price (real-time), then symbol data, then fallback
    const basePrice = chartPrice || symbol.bid || 1.08542;
    // Add small spread for ask price
    const spread = isCrypto ? basePrice * 0.001 : 0.00015;
    const marketPrice = tradeDirection === 'buy' 
      ? basePrice + spread
      : basePrice;
    
    console.log('Chart price:', chartPrice, 'Market price:', marketPrice);
    
    if (!marketPrice || marketPrice <= 0) {
      console.error('Invalid market price');
      return;
    }
    
    setIsSubmitting(true);
    
    // Parse limit price from input - if user typed a custom price
    const inputLimitPrice = limitPrice && limitPrice.trim() !== '' ? parseFloat(limitPrice) : null;
    
    // Check if this is a pending limit order (user entered a specific price)
    const isPendingOrder = inputLimitPrice !== null && 
      !isNaN(inputLimitPrice) && 
      inputLimitPrice > 0;
    
    // For pending orders, use the limit price; for market orders, use current market price
    const executionPrice = isPendingOrder ? inputLimitPrice : marketPrice;
    
    const trade = {
      symbol: symbol.symbol || 'EUR/USD',
      type: tradeDirection,
      lotSize: lotSize,
      entryPrice: executionPrice,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      orderType: isPendingOrder ? 'limit' : 'market',
      limitPrice: isPendingOrder ? inputLimitPrice : null,
      timestamp: new Date().toISOString()
    };

    console.log('Trade object created:', trade);

    if (onExecuteTrade) {
      console.log('Calling onExecuteTrade...');
      onExecuteTrade(trade);
      console.log('onExecuteTrade called successfully');
    } else {
      console.error('onExecuteTrade is not defined!');
    }
    
    setLimitPrice('');
    setIsSubmitting(false);
    console.log('=== TradingPanel handleTrade END ===');
  };

  const adjustLotSize = (delta) => {
    const decimals = isCrypto ? 4 : 2;
    const minLot = isCrypto ? 0.0001 : 0.01;
    const step = isCrypto ? 0.01 : 0.1;
    const actualDelta = delta > 0 ? step : -step;
    const newSize = Math.max(minLot, Math.min(maxLotSize, lotSize + actualDelta));
    setLotSize(parseFloat(newSize.toFixed(decimals)));
  };

  const formatPrice = (price) => {
    if (!price) return '—';
    if (symbol.symbol.includes('JPY')) return price.toFixed(3);
    if (symbol.symbol.includes('BTC') || symbol.symbol.includes('ETH') || symbol.symbol.includes('SOL')) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (symbol.symbol.includes('XRP') || symbol.symbol.includes('ADA') || symbol.symbol.includes('DOGE')) return price.toFixed(4);
    return price.toFixed(5);
  };

  // Use chart price if available, otherwise fall back to symbol price
  const baseDisplayPrice = chartPrice || symbol.bid || 1.08542;
  const displaySpread = isCrypto ? baseDisplayPrice * 0.001 : 0.00015;
  const currentPrice = tradeDirection === 'buy' ? baseDisplayPrice + displaySpread : baseDisplayPrice;

  const content = (
    <div className={`${headless ? "" : "p-2.5"} h-full flex flex-col overflow-hidden`}>
      {/* Top (no scroll) */}
      <div className="flex-1 min-h-0 flex flex-col justify-between gap-1.5">
        {/* Buy/Sell Tabs */}
        <div className="justify-center grid grid-cols-2 gap-1">
          <button
            onClick={() => setTradeDirection("buy")}
            className={[
              "h-5 px-2 rounded-xl text-[10px] font-semibold leading-none tracking-wide transition-all",
              "border border-slate-200",
              tradeDirection === "buy"
                ? "bg-emerald-500 text-white border-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.12)]"
                : isDark
                ? "bg-slate-900/40 text-slate-400 border-slate-800 hover:text-slate-100 hover:bg-slate-900/60"
                : "bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-200",
            ].join(" ")}
          >
            {t("terminal.tradingPanel.buyLong")}
          </button>

          <button
            onClick={() => setTradeDirection("sell")}
            className={[
              "h-5 px-2 rounded-xl text-[10px] font-semibold leading-none tracking-wide transition-all",
              "border border-slate-200",
              tradeDirection === "sell"
                ? "bg-red-500 text-white border-red-500 shadow-[0_4px_12px_rgba(239,68,68,0.12)]"
                : isDark
                ? "bg-slate-900/40 text-slate-400 border-slate-800 hover:text-slate-100 hover:bg-slate-900/60"
                : "bg-slate-100 text-slate-500 border-slate-200 hover:text-slate-900 hover:bg-slate-200",
            ].join(" ")}
          >
            {t("terminal.tradingPanel.sellShort")}
          </button>
        </div>

        {/* PRICE */}
        <div className="space-y-1">
          <div className="flex justify-between items-center px-5">
            <label className={`text-[9px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {t("terminal.tradingPanel.price")}
            </label>
            <span className={`text-[9px] font-mono font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {formatPrice(currentPrice)}
            </span>
          </div>
          <Input
            type="number"
            step="0.00001"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder={t("terminal.tradingPanel.leaveEmpty")}
            className={[
              "h-7 rounded-lg",
              "text-[9px] font-mono font-black",
              "bg-muted/40 border-border/60",
              "focus-visible:ring-1 focus-visible:ring-emerald-500/40",
              isDark ? "text-slate-100" : "text-slate-900",
            ].join(" ")}
          />
        </div>

        {/* AMOUNT */}
        <div className="space-y-1">
          <label className={`text-[9px] font-black uppercase tracking-widest px-5 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
            {t("terminal.tradingPanel.amount")}
          </label>
          <div className="relative">
            <Input
              type="number"
              step={isCrypto ? "0.01" : "0.1"}
              min={isCrypto ? "0.0001" : "0.01"}
              value={lotSize}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val > 0) {
                  const decimals = isCrypto ? 4 : 2;
                  setLotSize(parseFloat(val.toFixed(decimals)));
                }
              }}
              className={[
                "h-7 rounded-lg",
                "text-[9px] font-mono font-black",
                "bg-muted/40 border-border/60",
                "focus-visible:ring-1 focus-visible:ring-emerald-500/40",
                "pr-14",
                isDark ? "text-slate-100" : "text-slate-900",
              ].join(" ")}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
                {isCrypto ? symbol.symbol.split("/")[0] : "LOTS"}
              </span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-5 gap-0.5">
            {[10, 25, 50, 75, 100].map((percent) => {
              const active = leveragePercent === percent;
              return (
                <button
                  key={percent}
                  onClick={() => {
                    setLeveragePercent(percent);
                    setLotSize(calculateLotSizeFromPercent(percent));
                  }}
                  className={[
                    "h-7 rounded-md text-[10px] font-black",
                    "border transition-colors",
                    active
                      ? "bg-emerald-500/12 text-emerald-600 border-emerald-500/25"
                      : "bg-muted/30 text-muted-foreground/80 border-border/60 hover:text-foreground hover:bg-muted/50",
                  ].join(" ")}
                >
                  {percent}%
                </button>
              );
            })}
          </div>
        </div>

        {/* TP / SL */}
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-emerald-600/80 px-5">TP</label>
            <Input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="0.0000"
              className={[
                "h-8 rounded-lg px-1",
                "text-[10px] font-mono font-black",
                "bg-muted/40 border-border/60",
                "focus-visible:ring-1 focus-visible:ring-emerald-500/35",
                isDark ? "text-slate-100" : "text-slate-900",
              ].join(" ")}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-red-600/80 px-5">SL</label>
            <Input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="0.0000"
              className={[
                "h-8 rounded-lg px-1",
                "text-[10px] font-mono font-black",
                "bg-muted/40 border-border/60",
                "focus-visible:ring-1 focus-visible:ring-red-500/35",
                isDark ? "text-slate-100" : "text-slate-900",
              ].join(" ")}
            />
          </div>
        </div>

        {/* Summary */}
        <div className="rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
              {t("terminal.tradingPanel.orderValue")}
            </span>
            <span className="text-[10px] font-mono font-black tabular-nums">
              ${calculateOrderValue()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
              {t("terminal.tradingPanel.margin")}
            </span>
            <span className="text-[10px] font-mono font-black tabular-nums">
              ${calculateMargin()}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1.5 border-t border-border/60">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
              {t("terminal.tradingPanel.leverage")}
            </span>
            <span className="text-[9px] font-mono font-black text-emerald-600 bg-emerald-500/12 px-1.5 py-0.5 rounded-md">
              1:{leverage}
            </span>
          </div>
        </div>

        {/* Execute */}
        <button
          onClick={handleTrade}
          disabled={isSubmitting}
          className={[
            "w-full h-9 rounded-lg",
            "font-black text-[11px] uppercase tracking-widest",
            "text-white transition-all",
            "active:scale-[0.99] disabled:opacity-50",
            tradeDirection === "buy"
              ? "bg-emerald-500 hover:bg-emerald-600 shadow-[0_6px_16px_rgba(16,185,129,0.15)]"
              : "bg-red-500 hover:bg-red-600 shadow-[0_6px_16px_rgba(239,68,68,0.15)]",
          ].join(" ")}
        >
          {tradeDirection === "buy" ? t("terminal.tradingPanel.buyLong") : t("terminal.tradingPanel.sellShort")}
        </button>

        {/* Footer pricing */}
        <div className="grid grid-cols-3 gap-1 pt-0.5">
          {[
            { label: t("terminal.tradingPanel.bid"), value: formatPrice(symbol.bid), cls: "text-red-500" },
            { label: t("terminal.tradingPanel.spread"), value: symbol.spread, cls: "text-muted-foreground" },
            { label: t("terminal.tradingPanel.ask"), value: formatPrice(symbol.ask), cls: "text-emerald-500" },
          ].map((x) => (
            <div key={x.label} className="rounded-lg border border-border/60 bg-muted/20 p-1 text-center">
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/70">{x.label}</p>
              <p className={["text-[10px] font-mono font-black tabular-nums", x.cls].join(" ")}>{x.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (headless) {
    return <div className="flex flex-col h-full overflow-hidden">{content}</div>;
  }

  return (
    <Card className="overflow-hidden border-none shadow-none bg-transparent h-full">
      <div className={`border-b px-4 py-2 ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
        <h3 className={`font-black text-[10px] uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-600"}`}>
          {t("terminal.tradingPanel.newOrder")}
        </h3>
      </div>
      <div className="h-full overflow-hidden">{content}</div>
    </Card>
  );
}