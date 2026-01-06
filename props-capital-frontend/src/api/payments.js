import { apiPost } from '@/lib/api';

// API Functions
export const purchaseChallenge = async (data) => {
  return apiPost('/payments/purchase', data);
};

