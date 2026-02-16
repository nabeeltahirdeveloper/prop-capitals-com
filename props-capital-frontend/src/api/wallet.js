/* ============================================
   WALLET FEATURE DISABLED - 2026-02-16
   Reason: Feature not ready for production
   TODO: Re-enable when spot trading is live
   ============================================

import { apiGet } from '@/lib/api';

export const getWallet = async (accountId) => {
  return apiGet(`/wallets/account/${accountId}`);
};

============================================ */
