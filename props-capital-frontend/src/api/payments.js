import { apiPost, apiGet } from '@/lib/api';

// API Functions
export const purchaseChallenge = async (data) => {
  return apiPost('/payments/purchase', data);
};

export const validateCoupon = async (code) => {
  return apiPost('/coupons/validate', { code });
};

// WorldCard
export const createWorldCardSession = async (data) => {
  return apiPost('/payments/worldcard/session', data);
};

export const createGuestWorldCardSession = async (data) => {
  return apiPost('/payments/worldcard/guest-session', data);
};

export const getPaymentStatus = async (reference) => {
  return apiGet(`/payments/status/${reference}`);
};

export const getUserPayments = async (userId) => {
  return apiGet(`/payments/user/${userId}`);
};

