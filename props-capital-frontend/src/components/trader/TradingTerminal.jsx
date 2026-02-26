import React, { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useChallenges } from "@/contexts/ChallengesContext";
import CommonTerminalWrapper from "./CommonTerminalWrapper";
import MT5TradingArea from "./MT5TradingArea";
import BybitTerminal from "./BybitTerminal";
import TradeLockerComingSoon from "./TradeLockerComingSoon";
import PT5Terminal from "./PT5Terminal";
import TradingPersistence from "./TradingPersistence";
import { TradingProvider } from "@nabeeltahirdeveloper/chart-sdk";

const LS_SYMBOL_KEY = "trading_selectedSymbol";
const LS_TIMEFRAME_KEY = "trading_selectedTimeframe";

const MT5Terminal = () => {
  const { selectedChallenge } = useChallenges();
  const [searchParams] = useSearchParams();

  // Read persisted values ONCE on mount (URL > localStorage > default)
  const initialSymbol = useMemo(
    () =>
      searchParams.get("symbol") ||
      localStorage.getItem(LS_SYMBOL_KEY) ||
      "BTC/USD",
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const initialTimeframe = useMemo(
    () =>
      searchParams.get("tf") ||
      localStorage.getItem(LS_TIMEFRAME_KEY) ||
      "M1",
    [], // eslint-disable-line react-hooks/exhaustive-deps
  );

  // MT5 backend URL - use env variable for local testing
  const MT5_API_URL =
    import.meta.env.VITE_WEBSOCKET_URL || "https://api-dev.prop-capitals.com";

  const endpoints = {
    candles: "/market-data/history",
    symbols: "/market-data/prices?symbols",
    trades: "/trades",
    account: "/trades/account/${accountId}",
  };

  return (
    <TradingProvider
      baseUrl={MT5_API_URL}
      endpoints={endpoints}
      accountId={selectedChallenge?.id}
      initialSymbol={initialSymbol}
      initialTimeframe={initialTimeframe}
    >
      <TradingPersistence />
      <CommonTerminalWrapper>
        <MT5TradingArea selectedChallenge={selectedChallenge} />
      </CommonTerminalWrapper>
    </TradingProvider>
  );
};

const BybitTerminalWrapper = () => {
  const { selectedChallenge } = useChallenges();

  return (
    <CommonTerminalWrapper selectedChallenge={selectedChallenge}>
      <BybitTerminal selectedChallenge={selectedChallenge} />
    </CommonTerminalWrapper>
  );
};

const PT5TerminalWrapper = () => {
  const { selectedChallenge } = useChallenges();
  return (
    <CommonTerminalWrapper selectedChallenge={selectedChallenge}>
      <PT5Terminal />
    </CommonTerminalWrapper>
  );
};

const TradingTerminal = () => {
  const { selectedChallenge } = useChallenges();

  const platform = (selectedChallenge?.platform || "mt5").toLowerCase();

  switch (platform) {
    case "tradelocker":
      return <TradeLockerComingSoon />;
    case "bybit":
      return <BybitTerminalWrapper />;
    case "pt5":
      return <PT5TerminalWrapper />;
    case "mt5":
    default:
      return <MT5Terminal />;
  }
};

export default TradingTerminal;
