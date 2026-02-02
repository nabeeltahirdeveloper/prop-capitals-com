import { apiGet, apiPost, apiPatch } from '@/lib/api';

// API Functions
export const createAccount = async (data) => {
  return apiPost('/trading-accounts', data);
};

export const getUserAccounts = async (userId) => {
  return apiGet(`/trading-accounts/user/${userId}`);
};

export const getAccountById = async (id) => {
  return apiGet(`/trading-accounts/${id}`);
};

export const getAccountSummary = async (id) => {
  return apiGet(`/trading-accounts/${id}/summary`);
};

export const getAccountRules = async (id) => {
  return apiGet(`/trading-accounts/${id}/rules`);
};

export const evaluateAccountRealTime = async (id, currentEquity) => {
  return apiPost(`/trading-accounts/${id}/evaluate-real-time`, { currentEquity });
};

export const processPriceTick = async (id, symbol, bid, ask, timestamp) => {
  return apiPost(`/trading-accounts/${id}/price-tick`, { 
    symbol, 
    bid, 
    ask, 
    ts: timestamp || Date.now() 
  });
};

export const getPhaseTransitions = async (id) => {
  return apiGet(`/trading-accounts/${id}/phase-transitions`);
};

export const getDailyComplianceHistory = async (id, days = 7) => {
  return apiGet(`/trading-accounts/${id}/compliance-history`, {
    params: { days },
  });
};

export const getAnalytics = async (userId, accountId = null) => {
  const params = { userId };
  if (accountId) {
    params.accountId = accountId;
  }
  return apiGet('/trading-accounts/analytics', {
    params,
  });
};

