import React, { useEffect, useState } from "react";
import { useChallenges } from "@/contexts/ChallengesContext";
import CommonTerminalWrapper from "./CommonTerminalWrapper";
import MT5TradingArea from "./MT5TradingArea";
import BybitTerminal from "./BybitTerminal";
import TradeLockerComingSoon from "./TradeLockerComingSoon";
import PT5Terminal from "./PT5Terminal";
import { TradingProvider } from "@nabeeltahirdeveloper/chart-sdk";

const MT5Terminal = () => {
  const { selectedChallenge } = useChallenges();
  console.log("Selected Challenge", selectedChallenge);
  // MT5 backend URL - use env variable for local testing
  const MT5_API_URL =
    import.meta.env.VITE_WEBSOCKET_URL || "https://api-dev.prop-capitals.com";

  const endpoints = {
    candles: "/market-data/history", // Historical candles endpoint
    symbols: "/market-data/prices?symbols", // Symbols list (query param allowed)
    trades: "/trades", // Trades endpoint (adjust if different)
    account: "/trades/account/${accountId}", // Account endpoint (adjust if different)
  };

  return (
    <TradingProvider
      baseUrl={MT5_API_URL}
      endpoints={endpoints}
      accountId={selectedChallenge?.id}
    >
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
