import { apiGet, apiPost, apiPatch } from '@/lib/api';

/**
 * Create a new pending order
 * @param {Object} data - Order data
 * @param {string} data.tradingAccountId - Account ID
 * @param {string} data.symbol - Symbol (e.g., 'EUR/USD')
 * @param {string} data.type - Trade type ('BUY' or 'SELL')
 * @param {string} data.orderType - Order type ('LIMIT', 'STOP', 'STOP_LIMIT')
 * @param {number} data.volume - Volume/lot size
 * @param {number} data.price - Limit/stop price
 * @param {number} [data.stopLoss] - Optional stop loss
 * @param {number} [data.takeProfit] - Optional take profit
 */
export const createPendingOrder = async (data) => {
  return apiPost('/pending-orders', data);
};

/**
 * Get all pending orders for an account
 * @param {string} accountId - Trading account ID
 */
export const getPendingOrders = async (accountId) => {
  return apiGet(`/pending-orders/account/${accountId}`);
};

/**
 * Cancel a pending order
 * @param {string} orderId - Pending order ID
 */
export const cancelPendingOrder = async (orderId) => {
  return apiPatch(`/pending-orders/${orderId}/cancel`);
};

/**
 * Execute a pending order (convert to trade)
 * @param {string} orderId - Pending order ID
 * @param {number} [executionPrice] - Optional execution price (if different from order price)
 */
export const executePendingOrder = async (orderId, executionPrice) => {
  return apiPatch(`/pending-orders/${orderId}/execute`, {
    executionPrice,
  });
};
