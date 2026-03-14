import { apiGet, apiPost, apiPatch } from "@/lib/api";

// API Functions
export const createTrade = async (data) => {
  return apiPost("/trades", data);
};

export const getAccountTrades = async (accountId) => {
  return apiGet(`/trades/account/${accountId}`);
};

export const updateTrade = async (tradeId, data) => {
  return apiPatch(`/trades/${tradeId}`, data);
};

/**
 * Modify position (update SL/TP for open trades)
 * @param {string} tradeId - Trade ID
 * @param {Object} data - Modification data
 * @param {number} [data.stopLoss] - Optional stop loss
 * @param {number} [data.takeProfit] - Optional take profit
 */
export const modifyPosition = async (tradeId, data) => {
  return apiPatch(`/trades/${tradeId}/modify`, data);
};
