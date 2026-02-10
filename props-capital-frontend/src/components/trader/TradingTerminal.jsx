import React from 'react';
import { useChallenges } from '@/contexts/ChallengesContext';
import CommonTerminalWrapper from './CommonTerminalWrapper';
import MT5TradingArea from './MT5TradingArea';
import BybitTerminal from './BybitTerminal';
import TradeLockerComingSoon from './TradeLockerComingSoon';
import PT5Terminal from '@/pages/TradingTerminal';
import { TradingProvider } from '@nabeeltahirdeveloper/chart-sdk'

const MT5Terminal = () => {
  const { selectedChallenge } = useChallenges();

  return (
    <CommonTerminalWrapper>
      <TradingProvider baseUrl="https://your-api-url.com">
        <MT5TradingArea selectedChallenge={selectedChallenge} />
      </ TradingProvider>
    </CommonTerminalWrapper>
  );
};

const BybitTerminalWrapper = () => {
  const { selectedChallenge } = useChallenges();

  return (
    <CommonTerminalWrapper>
      <BybitTerminal selectedChallenge={selectedChallenge} />
    </CommonTerminalWrapper>
  );
};

const PT5TerminalWrapper = () => {
  return (
    <CommonTerminalWrapper>
      <PT5Terminal />
    </CommonTerminalWrapper>
  );
};

const TradingTerminal = () => {
  const { selectedChallenge } = useChallenges();

  const platform = (selectedChallenge?.platform || 'mt5').toLowerCase();

  switch (platform) {
    case 'tradelocker':
      return <TradeLockerComingSoon />;
    case 'bybit':
      return <BybitTerminalWrapper />;
    case 'pt5':
      return <PT5TerminalWrapper />;
    case 'mt5':
    default:
      return <MT5Terminal />;
  }
};

export default TradingTerminal;
