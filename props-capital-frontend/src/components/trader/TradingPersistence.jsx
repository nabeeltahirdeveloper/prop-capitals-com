import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useTrading } from "@nabeeltahirdeveloper/chart-sdk";

const LS_SYMBOL_KEY = "trading_selectedSymbol";
const LS_TIMEFRAME_KEY = "trading_selectedTimeframe";

/**
 * Renderless component that syncs selectedSymbol and selectedTimeframe
 * from TradingContext to URL search params and localStorage.
 *
 * Must be placed INSIDE <TradingProvider>.
 * Data flow is one-way: context state -> URL + localStorage (no loops).
 */
const TradingPersistence = () => {
  const { selectedSymbol, selectedTimeframe } = useTrading();
  const [, setSearchParams] = useSearchParams();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip the first render — the initial values already came FROM
    // URL/localStorage, so writing them back is a no-op that could
    // cause an unnecessary history entry.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Persist to localStorage
    if (selectedSymbol) {
      localStorage.setItem(LS_SYMBOL_KEY, selectedSymbol);
    }
    if (selectedTimeframe) {
      localStorage.setItem(LS_TIMEFRAME_KEY, selectedTimeframe);
    }

    // Update URL search params (replace to avoid polluting browser history)
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (selectedSymbol) next.set("symbol", selectedSymbol);
        if (selectedTimeframe) next.set("tf", selectedTimeframe);
        return next;
      },
      { replace: true },
    );
  }, [selectedSymbol, selectedTimeframe, setSearchParams]);

  return null;
};

export default TradingPersistence;
