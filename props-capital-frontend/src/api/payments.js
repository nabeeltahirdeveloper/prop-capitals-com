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

// ─── WorldCard S2S APM (server-to-server card charge) ─────────────
// Same response shape as the Xoala S2S charge so the PayLink mutation
// can branch on `data.status` without caring which gateway handled it.
//   { provider: 'worldcard', status: 'succeeded', reference, paymentId, tradingAccountId? }
//   { provider: 'worldcard', status: 'requires_action', reference, redirectUrl,
//                                                      redirectMethod, redirectParams }
//   { provider: 'worldcard', status: 'pending', reference }   // async (webhook will finalize)
//   { provider: 'worldcard', status: 'failed',  reference, message }
export const chargeWorldCardCard = async (data) => {
  return apiPost('/payments/worldcard/charge', data);
};

// ─── Provider routing (Xoala vs WorldCard 50/50 for organic traffic) ───
// Sticky per browser via localStorage. The server is the source of truth
// when the request includes a `linkSlug` whose admin has pinned a specific
// gateway — in that case it overrides whatever's saved locally and the
// returned `locked` flag tells the UI it can't reroute.
const PROVIDER_STORAGE_KEY = 'pc_payment_provider';

export const getStoredProvider = () => {
  try {
    const v = (localStorage.getItem(PROVIDER_STORAGE_KEY) || '').toLowerCase();
    return v === 'xoala' || v === 'worldcard' ? v : null;
  } catch (_e) {
    return null;
  }
};

export const setStoredProvider = (provider) => {
  try {
    const v = (provider || '').toLowerCase();
    if (v === 'xoala' || v === 'worldcard') {
      localStorage.setItem(PROVIDER_STORAGE_KEY, v);
    }
  } catch (_e) {
    /* localStorage disabled */
  }
};

// Ask the backend which provider to use for a given checkout. The reply
// is { provider: 'xoala'|'worldcard', locked: boolean, source }.
// When `locked` is true the result was forced by a brand link override —
// the UI must respect it. Otherwise it's the sticky / random pick.
export const resolvePaymentProvider = async ({ linkSlug, challengeSlug } = {}) => {
  const params = new URLSearchParams();
  if (linkSlug) params.set('linkSlug', linkSlug);
  if (challengeSlug) params.set('challengeSlug', challengeSlug);
  const assigned = getStoredProvider();
  if (assigned) params.set('assigned', assigned);
  const qs = params.toString();
  const res = await apiGet(`/payments/provider${qs ? `?${qs}` : ''}`);
  if (res?.provider) setStoredProvider(res.provider);
  return res;
};

export const getPaymentStatus = async (reference) => {
  return apiGet(`/payments/status/${reference}`);
};

export const getUserPayments = async (userId) => {
  return apiGet(`/payments/user/${userId}`);
};

