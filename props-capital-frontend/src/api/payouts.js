import { apiGet, apiPost, apiPatch } from "@/lib/api";

// API Functions
export const requestPayout = async (data) => {
  return apiPost("/payouts/request", {
    userId: data.userId,
    tradingAccountId: data.tradingAccountId,
    paymentMethod: data.payment_method,
    paymentDetails: data.payment_details,
  });
};

export const getUserPayouts = async (userId, accountId = null) => {
  const params = {};
  if (accountId) {
    params.accountId = accountId;
  }
  return apiGet(`/payouts/user/${userId}`, {
    params,
  });
};

export const getPayoutStatistics = async (userId, accountId = null) => {
  const params = {};
  if (accountId) {
    params.accountId = accountId;
  }
  return apiGet(`/payouts/user/${userId}/statistics`, {
    params,
  });
};

export const getAvailablePayoutAmount = async (userId, tradingAccountId) => {
  return apiGet(`/payouts/user/${userId}/available/${tradingAccountId}`);
};
