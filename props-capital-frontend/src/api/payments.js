import { apiPost, apiGet } from '@/lib/api';

// API Functions
export const purchaseChallenge = async (data) => {
  return apiPost('/payments/purchase', data);
};

export const validateCoupon = async (code) => {
  return apiPost('/coupons/validate', { code });
};

// Xoala S2S — backend charges the card directly and returns one of:
//   { status: 'succeeded', reference, paymentId, tradingAccountId? }
//   { status: 'requires_action', reference, redirectUrl }   // 3DS challenge
//   { status: 'failed', reference, message }
export const chargeXoalaCard = async (data) => {
  return apiPost('/payments/xoala/charge', data);
};

export const createXoalaCardSession = async (data) => {
  return apiPost('/payments/xoala/card-session', data);
};

export const submitXoalaCheckout = ({ checkoutUrl, fields }) => {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = checkoutUrl;

  Object.entries(fields || {}).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value == null ? '' : String(value);
    form.appendChild(input);
  });

  document.body.appendChild(form);
  form.submit();
};

export const getPaymentStatus = async (reference) => {
  return apiGet(`/payments/status/${reference}`);
};

export const getUserPayments = async (userId) => {
  return apiGet(`/payments/user/${userId}`);
};

