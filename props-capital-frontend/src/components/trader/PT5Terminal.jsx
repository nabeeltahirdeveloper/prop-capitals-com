import React, { useState, useMemo, useCallback } from "react";
import { useTrading } from "@/contexts/TradingContext";
import { usePrices } from "@/contexts/PriceContext";
import { useToast } from "@/components/ui/use-toast";
import { useTraderTheme } from "./TraderPanelLayout";
import MarketWatchlist from "../trading/MarketWatchlist";
import TradingPanel from "../trading/TradingPanel";
import TradingChart from "../trading/TradingChart";
import TopBar from "@/components/trading/Topbar";
import { Activity, LayoutGrid, Monitor } from "lucide-react";

const PT5Terminal = ({
  onExecuteTrade,
  accountBalance = 0,
  account,
  selectedSymbol: selectedSymbolFromWrapper,
  setSelectedSymbol: setSelectedSymbolFromWrapper,
}) => {
  const { isDark } = useTraderTheme();
  const { toast } = useToast();
  const {
    selectedSymbol: selectedSymbolFromContext,
    setSelectedSymbol: setSelectedSymbolFromContext,
    selectedTimeframe,
    setSelectedTimeframe,
    chartType,
    setChartType,
  } = useTrading();
  const { prices: unifiedPrices } = usePrices();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const selectedSymbol = selectedSymbolFromWrapper ?? selectedSymbolFromContext;

  const setSelectedSymbol = useCallback(
    (symbol) => {
      const normalized = symbol?.symbol ?? symbol;
      setSelectedSymbolFromContext(normalized);
      if (setSelectedSymbolFromWrapper) {
        setSelectedSymbolFromWrapper(symbol);
      }
    },
    [setSelectedSymbolFromContext, setSelectedSymbolFromWrapper],
  );

  const handleExecuteTrade = useCallback(
    async (tradeParams) => {
      if (!onExecuteTrade) {
        toast({
          title: "Trade flow unavailable",
          description: "Terminal wrapper trade handler is not connected.",
          variant: "destructive",
        });
        return;
      }
      await onExecuteTrade(tradeParams);
    },
    [onExecuteTrade, toast],
  );

  const enrichedSelectedSymbol = useMemo(() => {
    if (!selectedSymbol) return null;
    const symbolKey = selectedSymbol?.symbol ?? selectedSymbol;
    if (!symbolKey) return selectedSymbol;
    const priceData = unifiedPrices?.[symbolKey];
    if (!priceData || priceData.bid == null || priceData.ask == null) {
      return selectedSymbol;
    }
    const spread = Math.max(0, priceData.ask - priceData.bid);
    return {
      ...(typeof selectedSymbol === "object"
        ? selectedSymbol
        : { symbol: symbolKey }),
      symbol: symbolKey,
      bid: priceData.bid,
      ask: priceData.ask,
      spread,
    };
  }, [selectedSymbol, unifiedPrices]);

  const normalizedStatus = String(account?.status || "").toLowerCase();
  const isTradingDisabled =
    normalizedStatus === "failed" ||
    normalizedStatus === "inactive" ||
    normalizedStatus === "daily_locked" ||
    normalizedStatus === "disqualified" ||
    normalizedStatus === "closed" ||
    normalizedStatus === "paused";

  return (
    <div className="flex flex-col gap-4 p-0.5">
      <div className="grid grid-cols-12 gap-3 h-[580px] items-stretch">
        <div
          className={`${sidebarCollapsed ? "col-span-1" : "col-span-12 lg:col-span-2"} transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] relative flex flex-col rounded-2xl overflow-hidden shadow-sm border bg-card border-border h-full`}
        >
          <div
            className={`px-4 py-2.5 border-b flex items-center justify-between transition-colors ${isDark ? "bg-white/[0.02]" : "bg-slate-50"}`}
          >
            {!sidebarCollapsed && (
              <div className="flex items-center gap-2">
                <div
                  className={`p-1.5 rounded-lg border ${isDark ? "bg-emerald-500/10 border-emerald-500/20" : "bg-emerald-50/50 border-emerald-200"}`}
                >
                  <Activity
                    className={`w-3.5 h-3.5 ${isDark ? "text-emerald-400" : "text-emerald-600"}`}
                  />
                </div>
                <span
                  className={`font-bold text-[11px] uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}
                >
                  Watchlist
                </span>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-1.5 rounded-lg transition-all duration-300 group ${isDark ? "hover:bg-white/10" : "hover:bg-slate-200/50"}`}
              type="button"
            >
              <LayoutGrid
                className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${sidebarCollapsed ? (isDark ? "text-emerald-400" : "text-emerald-600") : "text-slate-400"}`}
              />
            </button>
          </div>
          <div className="flex-1 overflow-hidden min-h-0">
            <MarketWatchlist
              onSymbolSelect={setSelectedSymbol}
              selectedSymbol={selectedSymbol}
              headless={true}
            />
          </div>
        </div>

        <div
          className={`${sidebarCollapsed ? "col-span-11 lg:col-span-8" : "col-span-12 lg:col-span-7"} flex flex-col transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] rounded-2xl overflow-hidden shadow-sm border bg-card border-border h-full`}
        >
          <div
            className={`border-b transition-colors ${isDark ? "bg-white/[0.02]" : "bg-slate-50/50"}`}
          >
            <TopBar
              selectedSymbol={selectedSymbol}
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
              chartType={chartType}
              onChartTypeChange={setChartType}
              marketWatchOpen={!sidebarCollapsed}
              onToggleMarketWatch={() => setSidebarCollapsed(!sidebarCollapsed)}
            />
          </div>

          <div className="flex-1 relative overflow-hidden group min-h-0">
            <div
              className={`absolute top-0 left-1/4 w-1/2 h-1/4 blur-[100px] pointer-events-none ${isDark ? "bg-emerald-500/5" : "bg-emerald-500/10"}`}
            />
            <div
              className={`absolute bottom-0 right-1/4 w-1/2 h-1/4 blur-[100px] pointer-events-none ${isDark ? "bg-blue-500/5" : "bg-blue-500/10"}`}
            />

            <TradingChart
              key={`chart-${enrichedSelectedSymbol?.symbol || "default"}`}
              symbol={enrichedSelectedSymbol}
              showBuySellPanel={false}
              onPriceUpdate={() => {}}
            />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 flex flex-col rounded-2xl overflow-hidden shadow-sm border bg-card border-border h-full">
          <div
            className={`px-4 py-2.5 border-b flex items-center justify-between transition-colors ${isDark ? "bg-white/[0.02]" : "bg-slate-50"}`}
          >
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg border ${isDark ? "bg-blue-500/10 border-blue-500/20" : "bg-blue-50/50 border-blue-200"}`}
              >
                <Monitor
                  className={`w-3.5 h-3.5 ${isDark ? "text-blue-400" : "text-blue-600"}`}
                />
              </div>
              <span
                className={`font-bold text-[11px] uppercase tracking-wider ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Execution
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            <TradingPanel
              selectedSymbol={enrichedSelectedSymbol}
              accountBalance={accountBalance}
              onExecuteTrade={handleExecuteTrade}
              disabled={isTradingDisabled}
              chartPrice={enrichedSelectedSymbol?.bid}
              headless={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PT5Terminal;
