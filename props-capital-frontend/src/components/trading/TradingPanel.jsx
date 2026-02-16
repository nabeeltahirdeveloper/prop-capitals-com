import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import { useTraderTheme } from "../trader/TraderPanelLayout";

export default function TradingPanel({
  selectedSymbol,
  accountBalance = 100000,
  onExecuteTrade,
  maxLotSize = Number.POSITIVE_INFINITY,
  chartPrice,
  disabled = false,
  headless = false,
}) {
  const { t } = useTranslation();
  const { isDark } = useTraderTheme();
  const [orderType, setOrderType] = useState("limit");
  const [tradeDirection, setTradeDirection] = useState("buy");
  const [lotSize, setLotSize] = useState(0.01);
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allocationPercent, setAllocationPercent] = useState(25);
  const [leverageMultiplier, setLeverageMultiplier] = useState(100);

  const symbol =
    selectedSymbol && selectedSymbol.symbol ? selectedSymbol : null;
  const effectiveLeverage = leverageMultiplier === 0 ? 1 : leverageMultiplier;

  const hasValidSymbol = Boolean(symbol?.symbol);
  const isCrypto =
    hasValidSymbol && /BTC|ETH|SOL|XRP|ADA|DOGE/.test(symbol.symbol);
  const contractSize = isCrypto ? 1 : 100000;
  const referencePrice = Number(
    chartPrice ||
      (tradeDirection === "buy"
        ? (symbol?.ask ?? symbol?.bid)
        : (symbol?.bid ?? symbol?.ask)) ||
      symbol?.bid ||
      0,
  );

  useEffect(() => {
    if (isCrypto) {
      setLotSize(0.1);
    } else {
      setLotSize(1.0);
    }
    setAllocationPercent(25);
    setLeverageMultiplier(100);
  }, [symbol?.symbol, isCrypto]);

  const inputLimitPrice =
    limitPrice && limitPrice.trim() !== "" ? parseFloat(limitPrice) : null;
  const marketExecutionPrice = Number(
    tradeDirection === "buy"
      ? (symbol?.ask ?? referencePrice)
      : (symbol?.bid ?? referencePrice),
  );
  const executionPrice =
    Number.isFinite(inputLimitPrice) && inputLimitPrice > 0
      ? inputLimitPrice
      : marketExecutionPrice;
  const estimatedOrderValue =
    Number.isFinite(executionPrice) && executionPrice > 0
      ? lotSize * contractSize * executionPrice
      : 0;
  const estimatedRequiredMargin =
    Number.isFinite(executionPrice) && executionPrice > 0
      ? estimatedOrderValue / effectiveLeverage
      : 0;
  const calculateMargin = () => {
    return estimatedRequiredMargin.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
  const calculateOrderValue = () => {
    return estimatedOrderValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const calculateLotSizeFromPercent = (percent) => {
    const marginToUse = accountBalance * (percent / 100);
    const price = referencePrice > 0 ? referencePrice : Number(symbol.bid || 0);
    if (!price || price === 0) return isCrypto ? 0.01 : 0.1;
    const newLotSize =
      (marginToUse * effectiveLeverage) / (contractSize * price);
    const decimals = isCrypto ? 4 : 2;
    const minLot = isCrypto ? 0.0001 : 0.01;
    const maxCap =
      Number.isFinite(maxLotSize) && Number(maxLotSize) > 0
        ? Number(maxLotSize)
        : Number.POSITIVE_INFINITY;
    const result = Math.max(minLot, Math.min(newLotSize, maxCap));
    return parseFloat(result.toFixed(decimals));
  };

  const handleTrade = async () => {
    if (isSubmitting || disabled) return;

    if (
      !hasValidSymbol ||
      !Number.isFinite(referencePrice) ||
      referencePrice <= 0
    ) {
      return;
    }

    const marketPrice = marketExecutionPrice;

    if (!marketPrice || marketPrice <= 0) return;

    setIsSubmitting(true);

    const isPendingOrder =
      inputLimitPrice !== null &&
      !isNaN(inputLimitPrice) &&
      inputLimitPrice > 0;
    const executionPriceForTrade = isPendingOrder
      ? inputLimitPrice
      : marketPrice;

    const trade = {
      symbol: symbol.symbol,
      type: tradeDirection,
      lotSize: lotSize,
      leverage: leverageMultiplier,
      entryPrice: executionPriceForTrade,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      orderType: isPendingOrder ? "limit" : "market",
      limitPrice: isPendingOrder ? inputLimitPrice : null,
      timestamp: new Date().toISOString(),
    };

    try {
      if (onExecuteTrade) {
        await onExecuteTrade(trade);
      }
      setLimitPrice("");
    } catch {
      // Error handling done by parent via toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (price) => {
    if (!price) return "\u2014";
    const symbolCode = symbol?.symbol || "";
    if (symbolCode.includes("JPY")) return price.toFixed(3);
    if (/BTC|ETH|SOL/.test(symbolCode))
      return price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    if (/XRP|ADA|DOGE/.test(symbolCode)) return price.toFixed(4);
    return price.toFixed(5);
  };

  const formatSpread = (spreadValue) => {
    const spreadNum = Number(spreadValue);
    if (!Number.isFinite(spreadNum) || spreadNum <= 0) return "\u2014";
    if (spreadNum >= 1)
      return spreadNum.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    if (isCrypto) return spreadNum.toFixed(2);
    return spreadNum.toFixed(5);
  };

  const spreadFromQuote = Number(symbol?.ask) - Number(symbol?.bid);
  const displaySpread =
    Number.isFinite(spreadFromQuote) && spreadFromQuote > 0
      ? spreadFromQuote
      : Number(symbol?.spread || 0);
  const currentPrice = executionPrice;
  const hasAvailableBalance = Number(accountBalance) > 0;
  const exceedsAvailableBalance =
    estimatedRequiredMargin > Number(accountBalance || 0) + 0.01;
  const isInputLocked = disabled || isSubmitting;
  const isExecutionBlocked =
    isInputLocked ||
    !hasAvailableBalance ||
    exceedsAvailableBalance ||
    !hasValidSymbol ||
    !(referencePrice > 0);
  const panelClass = isDark
    ? "bg-[#101826] border-[#233041]"
    : "bg-white border-slate-200";
  const fieldClass = isDark
    ? "bg-[#0b1320] border-[#1f2a3a] text-slate-100"
    : "bg-muted/40 border-border/60 text-slate-900";
  const cardMutedClass = isDark
    ? "bg-[#0d1523] border-[#1f2a3a]"
    : "bg-muted/20 border-border/60";

  const content = (
    <div
      className={`${headless ? "" : "p-2.5"} h-full flex flex-col overflow-hidden rounded-xl border ${panelClass}`}
    >
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
            <label
              className={`text-[9px] font-black uppercase tracking-widest ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              {t("terminal.tradingPanel.price")}
            </label>
            <span
              className={`text-[9px] font-mono font-bold ${isDark ? "text-slate-500" : "text-slate-400"}`}
            >
              {t("terminal.tradingPanel.market")}: {formatPrice(currentPrice)}
            </span>
          </div>
          <Input
            type="number"
            step="0.00001"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder={t("terminal.tradingPanel.leaveEmpty")}
            disabled={isInputLocked}
            className={[
              "h-8 rounded-lg",
              "text-[10px] font-mono font-black",
              `${fieldClass}`,
              "focus-visible:ring-1 focus-visible:ring-emerald-500/40",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            ].join(" ")}
          />
        </div>

        {/* AMOUNT */}
        <div className="space-y-1">
          <label
            className={`text-[9px] font-black uppercase tracking-widest px-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
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
                  const maxCap =
                    Number.isFinite(maxLotSize) && Number(maxLotSize) > 0
                      ? Number(maxLotSize)
                      : Number.POSITIVE_INFINITY;
                  const clamped = Math.min(val, maxCap);
                  setLotSize(parseFloat(clamped.toFixed(decimals)));
                }
              }}
              disabled={isInputLocked}
              className={[
                "h-8 rounded-lg",
                "text-[10px] font-mono font-black",
                `${fieldClass}`,
                "focus-visible:ring-1 focus-visible:ring-emerald-500/40",
                "pr-14",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
                {isCrypto
                  ? symbol?.symbol?.split("/")?.[0] || "CRYPTO"
                  : "LOTS"}
              </span>
            </div>
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-5 gap-0.5">
            {[10, 25, 50, 75, 100].map((percent) => {
              const active = allocationPercent === percent;
              return (
                <button
                  key={percent}
                  disabled={isInputLocked}
                  onClick={() => {
                    setAllocationPercent(percent);
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

        <div className="space-y-1">
          <label
            className={`text-[9px] font-black uppercase tracking-widest px-1 ${isDark ? "text-slate-500" : "text-slate-400"}`}
          >
            Leverage
          </label>
          <div className="grid grid-cols-4 gap-0.5">
            {[0, 25, 50, 100].map((lev) => {
              const active = leverageMultiplier === lev;
              return (
                <button
                  key={lev}
                  disabled={isInputLocked}
                  onClick={() => {
                    setLeverageMultiplier(lev);
                    setLotSize(calculateLotSizeFromPercent(allocationPercent));
                  }}
                  className={[
                    "h-7 rounded-md text-[10px] font-black",
                    "border transition-colors",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    active
                      ? "bg-cyan-500/12 text-cyan-500 border-cyan-500/30"
                      : "bg-muted/30 text-muted-foreground/80 border-border/60 hover:text-foreground hover:bg-muted/50",
                  ].join(" ")}
                >
                  {lev === 0 ? "0x" : `${lev}x`}
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
              disabled={isInputLocked}
              className={[
                "h-8 rounded-lg px-2",
                "text-[10px] font-mono font-black",
                `${fieldClass}`,
                "focus-visible:ring-1 focus-visible:ring-emerald-500/35",
                "disabled:opacity-50 disabled:cursor-not-allowed",
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
              disabled={isInputLocked}
              className={[
                "h-8 rounded-lg px-2",
                "text-[10px] font-mono font-black",
                `${fieldClass}`,
                "focus-visible:ring-1 focus-visible:ring-red-500/35",
                "disabled:opacity-50 disabled:cursor-not-allowed",
              ].join(" ")}
            />
          </div>
        </div>

        {/* Summary */}
        <div
          className={`rounded-lg border px-2.5 py-1.5 space-y-1 ${cardMutedClass}`}
        >
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

          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
              Available
            </span>
            <span className="text-[10px] font-mono font-black tabular-nums text-cyan-500">
              $
              {(Number(accountBalance) || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>

          <div className="flex justify-between items-center pt-1.5 border-t border-border/60">
            <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
              {t("terminal.tradingPanel.leverage")}
            </span>
            <span className="text-[9px] font-mono font-black text-emerald-600 bg-emerald-500/12 px-1.5 py-0.5 rounded-md">
              {leverageMultiplier === 0 ? "1:1 (0x)" : `1:${effectiveLeverage}`}
            </span>
          </div>
        </div>

        {/* Execute */}
        <button
          onClick={handleTrade}
          disabled={isExecutionBlocked}
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
          {!hasAvailableBalance
            ? "No Available Balance"
            : !hasValidSymbol || !(referencePrice > 0)
              ? "Select a symbol"
              : exceedsAvailableBalance
                ? "Insufficient Margin"
                : disabled
                  ? t(
                      "terminal.tradingPanel.tradingDisabled",
                      "Trading Disabled",
                    )
                  : tradeDirection === "buy"
                    ? t("terminal.tradingPanel.placeBuyOrder")
                    : t("terminal.tradingPanel.placeSellOrder")}
        </button>

        {/* Footer pricing */}
        <div className="grid grid-cols-3 gap-1 pt-0.5">
          {[
            {
              label: t("terminal.tradingPanel.bid"),
              value: formatPrice(symbol?.bid),
              cls: "text-red-500",
            },
            {
              label: t("terminal.tradingPanel.spread"),
              value: formatSpread(symbol?.spread),
              cls: "text-muted-foreground",
            },
            {
              label: t("terminal.tradingPanel.ask"),
              value: formatPrice(symbol?.ask),
              cls: "text-emerald-500",
            },
          ].map((x) => (
            <div
              key={x.label}
              className={`rounded-lg border p-1.5 text-center ${cardMutedClass}`}
            >
              <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/70">
                {x.label}
              </p>
              <p
                className={[
                  "text-[10px] font-mono font-black tabular-nums truncate",
                  x.cls,
                ].join(" ")}
              >
                {x.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (headless) {
    return (
      <div className="flex flex-col h-full overflow-hidden">{content}</div>
    );
  }

  return (
    <Card className="overflow-hidden border-none shadow-none bg-transparent h-full">
      <div
        className={`border-b px-4 py-2 ${isDark ? "bg-slate-800/50 border-slate-800" : "bg-slate-50 border-slate-200"}`}
      >
        <h3
          className={`font-black text-[10px] uppercase tracking-widest ${isDark ? "text-slate-400" : "text-slate-600"}`}
        >
          {t("terminal.tradingPanel.newOrder")}
        </h3>
      </div>
      <div className="h-full overflow-hidden">{content}</div>
    </Card>
  );
}
