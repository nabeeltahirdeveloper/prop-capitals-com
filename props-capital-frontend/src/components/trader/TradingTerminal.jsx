import React from 'react';
import { useChallenges } from '@/contexts/ChallengesContext';
import CommonTerminalWrapper from './CommonTerminalWrapper';
import MT5TradingArea from './MT5TradingArea';
import BybitTerminal from './BybitTerminal';
import TradeLockerComingSoon from './TradeLockerComingSoon';
import PT5Terminal from './PT5Terminal';
import { TradingProvider } from '@nabeeltahirdeveloper/chart-sdk'


const MT5Terminal = () => {
  const { selectedChallenge } = useChallenges();
  const MT5_API_URL = import.meta.env.VITE_MT5_API_URL || 'https://dev-api.prop-capitals.com';

  const endpoints = {
    candles: '/market-data/history',
    symbols: '/market-data/prices',
    // No 'trades' key — SDK uses accountId-aware URL internally via accountId prop
  };

  return (
    <CommonTerminalWrapper>
      <TradingProvider
        baseUrl={MT5_API_URL}
        endpoints={endpoints}
        accountId={selectedChallenge?.id}
      >
        <MT5TradingArea selectedChallenge={selectedChallenge} />
      </TradingProvider>
    </CommonTerminalWrapper>
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
