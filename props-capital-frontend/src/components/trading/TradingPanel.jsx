import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
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
  const [tradeDirection, setTradeDirection] = useState('buy');
  const [lotSize, setLotSize] = useState(0.01);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [leveragePercent, setLeveragePercent] = useState(25);

  const defaultSymbol = {
    symbol: 'EUR/USD',
    bid: 1.08542,
    ask: 1.08557,
    spread: 1.5,
    change: 0.05
  };

  const symbol = selectedSymbol && selectedSymbol.symbol ? selectedSymbol : defaultSymbol;
  const leverage = 100;

  const isCrypto = /BTC|ETH|SOL|XRP|ADA|DOGE/.test(symbol.symbol);
  const contractSize = isCrypto ? 1 : 100000;

  useEffect(() => {
    if (isCrypto) {
      setLotSize(0.1);
    } else {
      setLotSize(1.0);
    }
    setLeveragePercent(25);
  }, [symbol.symbol, isCrypto]);

  const calculateMargin = () => {
    const margin = lotSize * contractSize * symbol.bid / leverage;
    return margin.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculateOrderValue = () => {
    const value = lotSize * contractSize * symbol.bid;
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculateLotSizeFromPercent = (percent) => {
    const marginToUse = accountBalance * (percent / 100);
    const price = symbol.bid;
    if (!price || price === 0) return isCrypto ? 0.01 : 0.1;
    const newLotSize = (marginToUse * leverage) / (contractSize * price);
    const decimals = isCrypto ? 4 : 2;
    const minLot = isCrypto ? 0.0001 : 0.01;
    const result = Math.max(minLot, Math.min(newLotSize, maxLotSize));
    return parseFloat(result.toFixed(decimals));
  };

  const handleTrade = async () => {
    if (isSubmitting || disabled) return;

    const basePrice = chartPrice || symbol.bid || 1.08542;
    const spread = isCrypto ? basePrice * 0.001 : 0.00015;
    const marketPrice = tradeDirection === 'buy'
      ? basePrice + spread
      : basePrice;

    if (!marketPrice || marketPrice <= 0) return;

    setIsSubmitting(true);

    const inputLimitPrice = limitPrice && limitPrice.trim() !== '' ? parseFloat(limitPrice) : null;
    const isPendingOrder = inputLimitPrice !== null &&
      !isNaN(inputLimitPrice) &&
      inputLimitPrice > 0;
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

    try {
      if (onExecuteTrade) {
        await onExecuteTrade(trade);
      }
      setLimitPrice('');
    } catch {
      // Error handling done by parent via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return '\u2014';
    if (symbol.symbol.includes('JPY')) return price.toFixed(3);
    if (/BTC|ETH|SOL/.test(symbol.symbol)) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (/XRP|ADA|DOGE/.test(symbol.symbol)) return price.toFixed(4);
    return price.toFixed(5);
  };

  const baseDisplayPrice = chartPrice || symbol.bid || 1.08542;
  const displaySpread = isCrypto ? baseDisplayPrice * 0.001 : 0.00015;
  const currentPrice = tradeDirection === 'buy' ? baseDisplayPrice + displaySpread : baseDisplayPrice;

  const isDisabled = disabled || isSubmitting;

  const content = (
    <div className={`${headless ? "" : "p-2.5"} h-full flex flex-col overflow-hidden`}>
      <div className="flex-1 min-h-0 flex flex-col justify-between gap-1.5">

        {/* Buy/Sell Tabs */}
        <div className="grid grid-cols-2 gap-1">
          <button
            onClick={() => !isDisabled && setTradeDirection("buy")}
            disabled={isDisabled}
            className={[
              "h-8 px-2 rounded-xl text-[11px] font-bold leading-none tracking-wide transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              tradeDirection === "buy"
                ? "bg-emerald-500 text-white border border-emerald-500 shadow-[0_4px_12px_rgba(16,185,129,0.15)]"
                : isDark
                ? "bg-slate-900/40 text-slate-400 border border-slate-800 hover:text-slate-100 hover:bg-slate-900/60"
                : "bg-slate-100 text-slate-500 border border-slate-200 hover:text-slate-900 hover:bg-slate-200",
            ].join(" ")}
          >
            {t("terminal.tradingPanel.buyLong")}
          </button>

          <button
            onClick={() => !isDisabled && setTradeDirection("sell")}
            disabled={isDisabled}
            className={[
              "h-8 px-2 rounded-xl text-[11px] font-bold leading-none tracking-wide transition-all",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              tradeDirection === "sell"
                ? "bg-red-500 text-white border border-red-500 shadow-[0_4px_12px_rgba(239,68,68,0.15)]"
                : isDark
                ? "bg-slate-900/40 text-slate-400 border border-slate-800 hover:text-slate-100 hover:bg-slate-900/60"
                : "bg-slate-100 text-slate-500 border border-slate-200 hover:text-slate-900 hover:bg-slate-200",
            ].join(" ")}
          >
            {t("terminal.tradingPanel.sellShort")}
          </button>
        </div>

        {/* PRICE */}
        <div className="space-y-1">
          <div className="flex justify-between items-center px-1">
            <label className={`text-[9px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {t("terminal.tradingPanel.price")}
            </label>
            <span className={`text-[9px] font-mono font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}>
              {t("terminal.tradingPanel.market")}: {formatPrice(currentPrice)}
            </span>
          </div>
          <Input
            type="number"
            step="0.00001"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder={t("terminal.tradingPanel.leaveEmpty")}
            disabled={isDisabled}
            className={[
              "h-8 rounded-lg",
              "text-[10px] font-mono font-black",
              "bg-muted/40 border-border/60",
              "focus-visible:ring-1 focus-visible:ring-emerald-500/40",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isDark ? "text-slate-100" : "text-slate-900",
            ].join(" ")}
          />
        </div>

        {/* AMOUNT */}
        <div className="space-y-1">
          <label className={`text-[9px] font-black uppercase tracking-widest px-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}>
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
              disabled={isDisabled}
              className={[
                "h-8 rounded-lg",
                "text-[10px] font-mono font-black",
                "bg-muted/40 border-border/60",
                "focus-visible:ring-1 focus-visible:ring-emerald-500/40",
                "pr-14",
                "disabled:opacity-50 disabled:cursor-not-allowed",
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
                  disabled={isDisabled}
                  onClick={() => {
                    setLeveragePercent(percent);
                    setLotSize(calculateLotSizeFromPercent(percent));
                  }}
                  className={[
                    "h-7 rounded-md text-[10px] font-black",
                    "border transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
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
            <label className="text-[9px] font-black uppercase tracking-widest text-emerald-600/80 px-1">
              {t("terminal.tradingPanel.takeProfit")}
            </label>
            <Input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
              placeholder="0.0000"
              disabled={isDisabled}
              className={[
                "h-8 rounded-lg px-2",
                "text-[10px] font-mono font-black",
                "bg-muted/40 border-border/60",
                "focus-visible:ring-1 focus-visible:ring-emerald-500/35",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isDark ? "text-slate-100" : "text-slate-900",
              ].join(" ")}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] font-black uppercase tracking-widest text-red-600/80 px-1">
              {t("terminal.tradingPanel.stopLoss")}
            </label>
            <Input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
              placeholder="0.0000"
              disabled={isDisabled}
              className={[
                "h-8 rounded-lg px-2",
                "text-[10px] font-mono font-black",
                "bg-muted/40 border-border/60",
                "focus-visible:ring-1 focus-visible:ring-red-500/35",
                "disabled:opacity-50 disabled:cursor-not-allowed",
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
          disabled={isDisabled}
          className={[
            "w-full h-9 rounded-lg",
            "font-black text-[11px] uppercase tracking-widest",
            "text-white transition-all",
            "active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2",
            tradeDirection === "buy"
              ? "bg-emerald-500 hover:bg-emerald-600 shadow-[0_6px_16px_rgba(16,185,129,0.15)]"
              : "bg-red-500 hover:bg-red-600 shadow-[0_6px_16px_rgba(239,68,68,0.15)]",
          ].join(" ")}
        >
          {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          {disabled
            ? t("terminal.tradingPanel.tradingDisabled", "Trading Disabled")
            : tradeDirection === "buy"
              ? t("terminal.tradingPanel.placeBuyOrder")
              : t("terminal.tradingPanel.placeSellOrder")
          }
        </button>

        {/* Footer pricing */}
        <div className="grid grid-cols-3 gap-1 pt-0.5">
          {[
            { label: t("terminal.tradingPanel.bid"), value: formatPrice(symbol.bid), cls: "text-red-500" },
            { label: t("terminal.tradingPanel.spread"), value: symbol.spread, cls: "text-muted-foreground" },
            { label: t("terminal.tradingPanel.ask"), value: formatPrice(symbol.ask), cls: "text-emerald-500" },
          ].map((x) => (
            <div key={x.label} className="rounded-lg border border-border/60 bg-muted/20 p-1.5 text-center">
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
