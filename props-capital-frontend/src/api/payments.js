import { apiPost, apiGet } from '@/lib/api';

// API Functions
export const purchaseChallenge = async (data) => {
  return apiPost('/payments/purchase', data);
};

export const validateCoupon = async (code) => {
  return apiPost('/coupons/validate', { code });
};

// Xoala — single guest checkout session endpoint
export const createXoalaCardSession = async (data) => {
  return apiPost('/payments/xoala/session', data);
};

// Xoala Standard Checkout is POST-only and the response is the hosted
// payment page itself, so the browser must submit a form to it directly.
export const submitXoalaCheckout = ({ checkoutUrl, fields, method = 'POST' }) => {
  const form = document.createElement('form');
  form.method = method;
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

