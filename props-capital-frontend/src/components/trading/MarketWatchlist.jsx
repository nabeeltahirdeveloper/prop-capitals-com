import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Star, RefreshCw, Wifi, WifiOff, Loader2 } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import { usePrices } from "@/contexts/PriceContext";
import { useTraderTheme } from "../trader/TraderPanelLayout";

// Fallback prices in case API fails
const fallbackPrices = {
  "EUR/USD": 1.0855,
  "GBP/USD": 1.265,
  "USD/JPY": 149.5,
  "AUD/USD": 0.652,
  "USD/CAD": 1.358,
  "USD/CHF": 0.882,
  "NZD/USD": 0.592,
  "EUR/GBP": 0.858,
  "BTC/USD": 97500,
  "ETH/USD": 3650,
  "XRP/USD": 2.35,
  "SOL/USD": 225,
  "ADA/USD": 1.05,
  "DOGE/USD": 0.42,
};

const initialSymbols = [
  {
    symbol: "EUR/USD",
    category: "forex",
    base: "eur",
    quote: "usd",
    bid: fallbackPrices["EUR/USD"],
    ask: fallbackPrices["EUR/USD"] + 0.00015,
    spread: 1.5,
    change: 0,
  },
  {
    symbol: "GBP/USD",
    category: "forex",
    base: "gbp",
    quote: "usd",
    bid: fallbackPrices["GBP/USD"],
    ask: fallbackPrices["GBP/USD"] + 0.00015,
    spread: 1.5,
    change: 0,
  },
  {
    symbol: "USD/JPY",
    category: "forex",
    base: "usd",
    quote: "jpy",
    bid: fallbackPrices["USD/JPY"],
    ask: fallbackPrices["USD/JPY"] + 0.02,
    spread: 2.0,
    change: 0,
  },
  {
    symbol: "AUD/USD",
    category: "forex",
    base: "aud",
    quote: "usd",
    bid: fallbackPrices["AUD/USD"],
    ask: fallbackPrices["AUD/USD"] + 0.00015,
    spread: 1.5,
    change: 0,
  },
  {
    symbol: "USD/CAD",
    category: "forex",
    base: "usd",
    quote: "cad",
    bid: fallbackPrices["USD/CAD"],
    ask: fallbackPrices["USD/CAD"] + 0.00015,
    spread: 1.5,
    change: 0,
  },
  {
    symbol: "USD/CHF",
    category: "forex",
    base: "usd",
    quote: "chf",
    bid: fallbackPrices["USD/CHF"],
    ask: fallbackPrices["USD/CHF"] + 0.00015,
    spread: 1.5,
    change: 0,
  },
  {
    symbol: "NZD/USD",
    category: "forex",
    base: "nzd",
    quote: "usd",
    bid: fallbackPrices["NZD/USD"],
    ask: fallbackPrices["NZD/USD"] + 0.00015,
    spread: 1.5,
    change: 0,
  },
  {
    symbol: "EUR/GBP",
    category: "forex",
    base: "eur",
    quote: "gbp",
    bid: fallbackPrices["EUR/GBP"],
    ask: fallbackPrices["EUR/GBP"] + 0.00015,
    spread: 1.5,
    change: 0,
  },
  {
    symbol: "BTC/USD",
    category: "crypto",
    coinId: "bitcoin",
    bid: fallbackPrices["BTC/USD"],
    ask: fallbackPrices["BTC/USD"] * 1.001,
    spread: 10,
    change: 0,
  },
  {
    symbol: "ETH/USD",
    category: "crypto",
    coinId: "ethereum",
    bid: fallbackPrices["ETH/USD"],
    ask: fallbackPrices["ETH/USD"] * 1.001,
    spread: 10,
    change: 0,
  },
  {
    symbol: "XRP/USD",
    category: "crypto",
    coinId: "ripple",
    bid: fallbackPrices["XRP/USD"],
    ask: fallbackPrices["XRP/USD"] * 1.001,
    spread: 10,
    change: 0,
  },
  {
    symbol: "SOL/USD",
    category: "crypto",
    coinId: "solana",
    bid: fallbackPrices["SOL/USD"],
    ask: fallbackPrices["SOL/USD"] * 1.001,
    spread: 10,
    change: 0,
  },
  {
    symbol: "ADA/USD",
    category: "crypto",
    coinId: "cardano",
    bid: fallbackPrices["ADA/USD"],
    ask: fallbackPrices["ADA/USD"] * 1.001,
    spread: 10,
    change: 0,
  },
  {
    symbol: "DOGE/USD",
    category: "crypto",
    coinId: "dogecoin",
    bid: fallbackPrices["DOGE/USD"],
    ask: fallbackPrices["DOGE/USD"] * 1.001,
    spread: 10,
    change: 0,
  },
];

export default function MarketWatchlist({ onSymbolSelect, selectedSymbol, headless = false }) {
  const { t } = useTranslation();
  const {
    prices: unifiedPrices,
    isConnected,
    lastUpdate,
    priceSource,
    connectionStatus,
    failedAttempts,
    maxReconnectAttempts,
    retryConnection,
  } = usePrices();
  const [symbols, setSymbols] = useState(initialSymbols);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [favorites, setFavorites] = useState(["EUR/USD", "BTC/USD", "ETH/USD"]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const { isDark } = useTraderTheme()





  // Handle manual retry
  const handleRetry = () => {
    setIsRetrying(true);
    retryConnection();
    // Reset retrying state after a short delay
    setTimeout(() => setIsRetrying(false), 2000);
  };

  // Update symbols from unified price context (updates every 800ms)
  useEffect(() => {
    if (!unifiedPrices || Object.keys(unifiedPrices).length === 0) {
      return;
    }

    setSymbols((prev) =>
      prev.map((s) => {
        const priceData = unifiedPrices[s.symbol];

        if (priceData) {
          const prevBid = s.bid || priceData.bid;
          const newBid = priceData.bid;
          const newAsk = priceData.ask;

          // Calculate change percentage from previous bid
          const changePercent =
            prevBid > 0 ? ((newBid - prevBid) / prevBid) * 100 : 0;

          // Calculate spread
          const spread =
            s.category === "forex"
              ? s.symbol.includes("JPY")
                ? 2.0
                : 1.5
              : ((newAsk - newBid) / newBid) * 10000; // Spread calculation (not pips)

          return {
            ...s,
            bid: newBid,
            ask: newAsk,
            spread: spread,
            change: changePercent,
            direction:
              newBid > prevBid ? "up" : newBid < prevBid ? "down" : s.direction,
          };
        }

        // If no price data, keep existing symbol data
        return s;
      }),
    );

    setIsLoading(false);
  }, [unifiedPrices]);

  // No simulation needed - unified price context provides real-time updates every 800ms

  const toggleFavorite = (symbol) => {
    setFavorites((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol],
    );
  };

  const filteredSymbols = symbols.filter((s) => {
    const matchesSearch = s.symbol
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    let matchesCategory = true;

    if (activeCategory === "favorites") {
      matchesCategory = favorites.includes(s.symbol);
    } else if (activeCategory !== "all") {
      matchesCategory = s.category === activeCategory;
    }

    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: "all", label: t("terminal.watchlist.all") },
    { id: "favorites", label: t("terminal.watchlist.favorites") },
    { id: "forex", label: t("terminal.watchlist.forex") },
    { id: "crypto", label: t("terminal.watchlist.crypto") },
  ];

  const formatPrice = (price, symbol) => {
    if (price === 0) return "—";
    if (symbol.includes("JPY")) return price.toFixed(3);
    if (
      symbol.includes("BTC") ||
      symbol.includes("ETH") ||
      symbol.includes("SOL")
    )
      return price.toFixed(2);
    if (
      symbol.includes("XRP") ||
      symbol.includes("ADA") ||
      symbol.includes("DOGE")
    )
      return price.toFixed(4);
    return price.toFixed(5);
  };

  const content = (
    <div className="flex flex-col h-full overflow-hidden">
      <div
        className={[
          "sticky top-0 z-10",
          "border-b border-border/60",
          "backdrop-blur supports-[backdrop-filter]:bg-background/70",
          "p-2.5",
          isDark ? "bg-[#101826]/85" : "bg-white/70",
        ].join(" ")}
      >
        {/* Status row */}
        <div className="flex items-center justify-between mb-2 px-0.5">
          <div className="flex items-center gap-2">
            <span
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5",
                "border text-[9px] font-black uppercase tracking-wide",
                connectionStatus === "connected"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                  : "border-red-500/30 bg-red-500/10 text-red-600",
              ].join(" ")}
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  connectionStatus === "connected" ? "bg-emerald-500" : "bg-red-500",
                ].join(" ")}
              />
              {connectionStatus === "connected" ? "LIVE" : "OFFLINE"}
            </span>

            {lastUpdate && (
              <span className="text-[9px] font-mono text-muted-foreground/70">
                {new Date(lastUpdate).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            )}
          </div>

          {/* optional tiny action area later (settings, etc.) */}
          <div className="h-6 w-6" />
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60" />
          <Input
            placeholder={t("terminal.watchlist.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={[
              "h-8 pl-8 pr-2 text-[11px] font-medium",
              "rounded-lg",
              "bg-muted/40 border-border/60",
              "focus-visible:ring-1 focus-visible:ring-emerald-500/40",
              isDark ? "text-slate-100" : "text-slate-900",
            ].join(" ")}
          />
        </div>

        {/* Tabs */}
        <div className="mt-2 flex gap-1 overflow-x-auto no-scrollbar">
          {categories.map((cat) => {
            const active = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={[
                  "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wide",
                  "transition-all border",
                  active
                    ? "bg-emerald-500/12 text-emerald-600 border-emerald-500/25"
                    : "bg-transparent border-transparent text-muted-foreground/70 hover:text-foreground hover:bg-muted/40",
                ].join(" ")}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Scrollable Table Section */}
      <div className="flex-1 flex flex-col min-h-0 overflow-x-auto custom-pro-scrollbar">
        <div className="min-w-[240px] flex flex-col h-full">
          {/* Table Header - Synchronized and Compact */}
          <div className="border-b border-border/60 bg-muted/20 flex-shrink-0">
            <div className="flex items-center px-3 py-2">
              <div className="flex-1 text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
                {t("terminal.watchlist.symbol")}
              </div>
              <div className="flex gap-2 pr-1">
                <div className="w-14 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
                  BID
                </div>
                <div className="w-14 text-right text-[9px] font-black uppercase tracking-widest text-muted-foreground/70">
                  ASK
                </div>
              </div>
            </div>
          </div>

          {/* Symbols List - Full Scrollable Area */}
          <div className="flex-1 overflow-y-auto custom-pro-scrollbar min-h-0">
        <div className="divide-y divide-border/40">
          {filteredSymbols.map((item, idx) => {
            const selected = selectedSymbol?.symbol === item.symbol;

            return (
              <div
                key={item.symbol}
                onClick={() => onSymbolSelect?.(item)}
                className={[
                  "px-3 py-2 flex items-center cursor-pointer group",
                  "transition-colors",
                  !selected && (idx % 2 === 1 ? "bg-muted/[0.10]" : "bg-transparent"),
                  selected
                    ? "bg-emerald-500/8 border-l-2 border-emerald-500"
                    : "hover:bg-muted/30",
                ].join(" ")}
              >
                <div className="flex-1 min-w-0 flex items-center gap-2 overflow-hidden">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(item.symbol);
                    }}
                    className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                    aria-label="favorite"
                  >
                    <Star
                      className={[
                        "w-3 h-3",
                        favorites.includes(item.symbol)
                          ? "text-amber-400 fill-amber-400"
                          : "text-muted-foreground/70",
                      ].join(" ")}
                    />
                  </button>

                  <div className="min-w-0 flex items-center gap-2">
                    <span
                      className={[
                        "text-[11px] font-black tracking-tight whitespace-nowrap",
                        selected ? "text-emerald-600" : "text-foreground",
                      ].join(" ")}
                    >
                      {item.symbol}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 text-right pr-1">
                  <div
                    className={[
                      "w-14 font-mono text-[11px] font-black tabular-nums",
                      item.direction === "up"
                        ? "text-emerald-500"
                        : item.direction === "down"
                        ? "text-red-500"
                        : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {formatPrice(item.bid, item.symbol)}
                  </div>

                  <div
                    className={[
                      "w-14 font-mono text-[11px] font-black tabular-nums",
                      item.direction === "up"
                        ? "text-emerald-500"
                        : item.direction === "down"
                        ? "text-red-500"
                        : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {formatPrice(item.ask, item.symbol)}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredSymbols.length === 0 && (
            <div className="py-10 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              No results found
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  </div>
);

  if (headless) {
    return (
      <div className={`flex flex-col h-full bg-transparent overflow-hidden`}>
        {content}
      </div>
    );
  }

  return (
    <Card
      className={[
        "min-h-0 flex flex-col overflow-hidden",
        "border border-border/60 shadow-sm",
        isDark ? "bg-slate-950/40" : "bg-white",
      ].join(" ")}
    >
      {content}
    </Card>
  );
}
