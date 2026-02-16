import { apiGet } from '@/lib/api';

/**
 * Fetch the spot wallet for a trading account.
 * Returns aggregated spot holdings computed from open SPOT trades.
 */
export const getWallet = async (accountId) => {
  return apiGet(`/wallets/account/${accountId}`);
};
