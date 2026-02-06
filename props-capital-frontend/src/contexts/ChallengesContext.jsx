import React, { createContext, useContext, useState } from 'react';

const ChallengesContext = createContext();

export const useChallenges = () => {
  const context = useContext(ChallengesContext);
  if (!context) {
    throw new Error('useChallenges must be used within a ChallengesProvider');
  }
  return context;
};

// Mock challenges data - in production this would come from API
const mockChallenges = [
  {
    id: 'ch-001',
    accountId: '#5214',
    type: '2-step',
    accountSize: 100000,
    currentBalance: 102847.53,
    equity: 102847.53,
    phase: 1,
    status: 'active',
    platform: 'MT5',
    server: 'PropCapitals-Live',
    createdAt: '2025-01-15',
    tradingDays: { current: 3, required: 5 },
    rules: {
      profitTarget: 8,
      maxDailyLoss: 5,
      maxTotalDrawdown: 10,
      minTradingDays: 5,
    },
    stats: {
      currentProfit: 2.85,
      currentDailyLoss: 0,
      currentDrawdown: 1.85,
      totalTrades: 47,
      winRate: 68.5,
      avgRR: 1.8,
    },
    profitSplit: null, // Not funded yet
  },
  {
    id: 'ch-002',
    accountId: '#5298',
    type: '1-step',
    accountSize: 50000,
    currentBalance: 54250.00,
    equity: 54125.00,
    phase: 'funded',
    status: 'active',
    platform: 'MT5',
    server: 'PropCapitals-Live',
    createdAt: '2024-12-01',
    tradingDays: { current: 12, required: 5 },
    rules: {
      profitTarget: 10,
      maxDailyLoss: 5,
      maxTotalDrawdown: 10,
      minTradingDays: 5,
    },
    stats: {
      currentProfit: 8.5,
      currentDailyLoss: 0.5,
      currentDrawdown: 2.1,
      totalTrades: 89,
      winRate: 72.3,
      avgRR: 2.1,
    },
    profitSplit: 80, // 80% to trader
    payoutEligible: true,
    totalPaidOut: 2500,
  },
  {
    id: 'ch-003',
    accountId: '#5312',
    type: '2-step',
    accountSize: 200000,
    currentBalance: 198500.00,
    equity: 198500.00,
    phase: 1,
    status: 'failed',
    platform: 'MT5',
    server: 'PropCapitals-Live',
    createdAt: '2025-01-10',
    tradingDays: { current: 4, required: 5 },
    rules: {
      profitTarget: 8,
      maxDailyLoss: 5,
      maxTotalDrawdown: 10,
      minTradingDays: 5,
    },
    stats: {
      currentProfit: -0.75,
      currentDailyLoss: 5.2, // Exceeded daily loss
      currentDrawdown: 5.2,
      totalTrades: 23,
      winRate: 45.2,
      avgRR: 0.8,
    },
    profitSplit: null,
    failReason: 'Daily loss limit exceeded',
  },
  {
    id: 'ch-004',
    accountId: '#5356',
    type: '2-step',
    accountSize: 100000,
    currentBalance: 108500.00,
    equity: 108500.00,
    phase: 2,
    status: 'active',
    platform: 'MT5',
    server: 'PropCapitals-Live',
    createdAt: '2024-11-20',
    tradingDays: { current: 8, required: 5 },
    rules: {
      profitTarget: 5, // Phase 2 has lower target
      maxDailyLoss: 5,
      maxTotalDrawdown: 10,
      minTradingDays: 5,
    },
    stats: {
      currentProfit: 3.2,
      currentDailyLoss: 0,
      currentDrawdown: 0.8,
      totalTrades: 34,
      winRate: 70.5,
      avgRR: 1.9,
    },
    profitSplit: null,
  },
];

// Challenge type configurations
export const challengeTypes = {
  '1-step': {
    name: '1-Step Evaluation',
    phases: ['Evaluation', 'Funded'],
    rules: {
      profitTarget: 10,
      maxDailyLoss: 5,
      maxTotalDrawdown: 10,
      minTradingDays: 5,
    },
    profitSplit: 80,
    scalingAvailable: true,
  },
  '2-step': {
    name: '2-Step Evaluation',
    phases: ['Phase 1', 'Phase 2', 'Funded'],
    rules: {
      phase1: {
        profitTarget: 8,
        maxDailyLoss: 5,
        maxTotalDrawdown: 10,
        minTradingDays: 5,
      },
      phase2: {
        profitTarget: 5,
        maxDailyLoss: 5,
        maxTotalDrawdown: 10,
        minTradingDays: 5,
      },
    },
    profitSplit: 80,
    scalingAvailable: true,
  },
};

export const ChallengesProvider = ({ children }) => {
  const [challenges, setChallenges] = useState(mockChallenges);
  const [selectedChallengeId, setSelectedChallengeId] = useState(mockChallenges[0]?.id);

  const selectedChallenge = challenges.find(c => c.id === selectedChallengeId) || challenges[0];

  const selectChallenge = (challengeId) => {
    setSelectedChallengeId(challengeId);
  };

  // Update challenge balance (for demo payout flow)
  const updateChallengeBalance = (challengeId, newBalance) => {
    setChallenges(prev => prev.map(challenge =>
      challenge.id === challengeId
        ? {
          ...challenge,
          currentBalance: newBalance,
          equity: newBalance,
          stats: {
            ...challenge.stats,
            currentProfit: ((newBalance - challenge.accountSize) / challenge.accountSize) * 100
          }
        }
        : challenge
    ));
  };

  const getActiveChallenges = () => challenges.filter(c => c.status === 'active');
  const getFailedChallenges = () => challenges.filter(c => c.status === 'failed');
  const getFundedChallenges = () => challenges.filter(c => c.phase === 'funded' && c.status === 'active');

  const getChallengeStatusColor = (challenge) => {
    if (challenge.status === 'failed') return 'red';
    if (challenge.phase === 'funded') return 'emerald';
    return 'amber';
  };

  const getChallengePhaseLabel = (challenge) => {
    if (challenge.status === 'failed') return 'Failed';
    if (challenge.phase === 'funded') return 'Funded';
    if (challenge.type === '1-step') {
      return 'Evaluation';
    }
    return `Phase ${challenge.phase}`;
  };

  const getRuleCompliance = (challenge) => {
    const { stats, rules } = challenge;
    return {
      profitTarget: {
        current: stats.currentProfit,
        target: rules.profitTarget,
        status: stats.currentProfit >= rules.profitTarget ? 'passed' : 'in-progress',
        percentage: Math.min((stats.currentProfit / rules.profitTarget) * 100, 100),
      },
      dailyLoss: {
        current: stats.currentDailyLoss,
        limit: rules.maxDailyLoss,
        status: stats.currentDailyLoss >= rules.maxDailyLoss ? 'violated' :
          stats.currentDailyLoss >= rules.maxDailyLoss * 0.8 ? 'warning' : 'safe',
        percentage: (stats.currentDailyLoss / rules.maxDailyLoss) * 100,
      },
      totalDrawdown: {
        current: stats.currentDrawdown,
        limit: rules.maxTotalDrawdown,
        status: stats.currentDrawdown >= rules.maxTotalDrawdown ? 'violated' :
          stats.currentDrawdown >= rules.maxTotalDrawdown * 0.8 ? 'warning' : 'safe',
        percentage: (stats.currentDrawdown / rules.maxTotalDrawdown) * 100,
      },
      tradingDays: {
        current: challenge.tradingDays.current,
        required: challenge.tradingDays.required,
        status: challenge.tradingDays.current >= challenge.tradingDays.required ? 'passed' : 'in-progress',
        percentage: Math.min((challenge.tradingDays.current / challenge.tradingDays.required) * 100, 100),
      },
    };
  };

  return (
    <ChallengesContext.Provider value={{
      challenges,
      selectedChallenge,
      selectedChallengeId,
      selectChallenge,
      updateChallengeBalance,
      getActiveChallenges,
      getFailedChallenges,
      getFundedChallenges,
      getChallengeStatusColor,
      getChallengePhaseLabel,
      getRuleCompliance,
      challengeTypes,
    }}>
      {children}
    </ChallengesContext.Provider>
  );
};

export default ChallengesContext;
