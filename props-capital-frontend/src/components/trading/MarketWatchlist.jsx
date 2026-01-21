import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Star, RefreshCw, Wifi, WifiOff, Loader2 } from "lucide-react";
import { useTranslation } from "../../contexts/LanguageContext";
import { usePrices } from "@/contexts/PriceContext";

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

export default function MarketWatchlist({ onSymbolSelect, selectedSymbol }) {
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

  return (
    <Card className="bg-slate-900 border-slate-800 h-full flex flex-col">
      <div className="p-3 border-b border-slate-800">
        {/* Connection Status */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            {connectionStatus === "connected" ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] text-emerald-400">
                  {t("terminal.watchlist.live")}
                </span>
              </>
            ) : connectionStatus === "reconnecting" ? (
              <>
                <Loader2 className="w-3 h-3 text-amber-400 animate-spin" />
                <span className="text-[10px] text-amber-400">
                  {t("terminal.watchlist.reconnecting", "Reconnecting")} (
                  {failedAttempts}/{maxReconnectAttempts})
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-400" />
                <span className="text-[10px] text-red-400">
                  {t("terminal.watchlist.offline")}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="h-5 px-1.5 ml-1 text-[10px] text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                >
                  {isRetrying ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span className="ml-1">
                    {t("terminal.watchlist.retry", "Retry")}
                  </span>
                </Button>
              </>
            )}
          </div>
          <div className="text-[9px] text-slate-500">
            {priceSource === "websocket" ? "WS" : "REST"}
          </div>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
          <Input
            placeholder={t("terminal.watchlist.search")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 bg-slate-800 border-slate-700 text-white text-xs h-8"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto ">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={activeCategory === cat.id ? "default" : "ghost"}
              onClick={() => setActiveCategory(cat.id)}
              className={`h-6 px-2 text-[10px] whitespace-nowrap ${
                activeCategory === cat.id
                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table with horizontal scroll */}
      <div className="flex-1 overflow-x-auto overflow-y-auto">
        {/* Table Header */}
        <div className="px-3 py-2 border-b border-slate-800 min-w-[320px]">
          <div className="flex items-center text-[10px] text-slate-500 uppercase tracking-wider">
            <div className="w-[120px] min-w-[120px] flex-shrink-0">
              {t("terminal.watchlist.symbol")}
            </div>
            <div className="w-[90px] min-w-[90px] text-right flex-shrink-0">
              {t("terminal.watchlist.bid")}
            </div>
            <div className="w-[90px] min-w-[90px] text-right flex-shrink-0">
              {t("terminal.watchlist.ask")}
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-800/50">
          {filteredSymbols.map((item) => (
            <div
              key={item.symbol}
              onClick={() => onSymbolSelect?.(item)}
              className={`px-3 py-2.5 flex items-center min-w-[320px] cursor-pointer transition-all hover:bg-slate-800/50 ${
                selectedSymbol?.symbol === item.symbol
                  ? "bg-emerald-500/10 border-l-2 border-emerald-500"
                  : ""
              }`}
            >
              {/* Symbol Info */}
              <div className="w-[120px] min-w-[120px] flex-shrink-0 flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(item.symbol);
                  }}
                  className="flex-shrink-0"
                >
                  <Star
                    className={`w-3 h-3 ${
                      favorites.includes(item.symbol)
                        ? "text-amber-400 fill-amber-400"
                        : "text-slate-600 hover:text-slate-400"
                    }`}
                  />
                </button>
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">
                    {item.symbol}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    {item.category}
                  </p>
                </div>
              </div>

              {/* Bid */}
              <div
                className={`w-[90px] min-w-[90px] text-right font-mono text-xs tabular-nums flex-shrink-0 ${
                  item.direction === "up"
                    ? "text-emerald-400"
                    : item.direction === "down"
                      ? "text-red-400"
                      : "text-white"
                }`}
              >
                {formatPrice(item.bid, item.symbol)}
              </div>

              {/* Ask */}
              <div
                className={`w-[90px] min-w-[90px] text-right font-mono text-xs tabular-nums flex-shrink-0 ${
                  item.direction === "up"
                    ? "text-emerald-400"
                    : item.direction === "down"
                      ? "text-red-400"
                      : "text-white"
                }`}
              >
                {formatPrice(item.ask, item.symbol)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {lastUpdate && (
        <div className="px-3 py-1.5 border-t border-slate-800 text-[9px] text-slate-500 text-center">
          {t("terminal.watchlist.updated")}:{" "}
          {new Date(lastUpdate).toLocaleTimeString()}
        </div>
      )}
    </Card>
  );
}
