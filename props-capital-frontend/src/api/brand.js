import axios from "axios";

const BRAND_TOKEN_KEY = "brand_token";

// Dedicated axios instance for brand-portal calls. We intentionally do NOT
// reuse the shared `lib/api` client because that one's interceptor reads
// `localStorage.token` (the trader token), which would pollute brand requests
// AND cause the trader app's /auth/me to fire with a brand JWT — which the
// trader JWT strategy rejects with 400 since `kind: 'brand'` has no `userId`.
const brandAxios = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? "https://api.prop-capitals.com"
      : "http://localhost:5002"),
});

brandAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem(BRAND_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

brandAxios.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem(BRAND_TOKEN_KEY);
      } catch (_e) {
        /* intentionally ignored: localStorage may be unavailable (e.g. private mode) */
      }
      // Only redirect if we're inside the brand portal — never hijack the
      // trader site's loading screens
      if (typeof window !== "undefined" && window.location.pathname.startsWith("/brand")) {
        window.location.href = "/brand-login";
      }
    }
    return Promise.reject({
      message:
        error.response?.data?.message || error.message || "An error occurred",
      status: error.response?.status,
      data: error.response?.data,
    });
  },
);

const get = async (url, config) => (await brandAxios.get(url, config)).data;
const post = async (url, data, config) =>
  (await brandAxios.post(url, data, config)).data;
const put = async (url, data, config) =>
  (await brandAxios.put(url, data, config)).data;
const patch = async (url, data, config) =>
  (await brandAxios.patch(url, data, config)).data;
const del = async (url, config) =>
  (await brandAxios.delete(url, config)).data;

const qs = (params) => {
  if (!params) return "";
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (filtered.length === 0) return "";
  return "?" + new URLSearchParams(filtered).toString();
};

export const brandApi = {
  auth: {
    async login({ username, password }) {
      const res = await post("/auth/brand-login", { username, password });
      if (res?.token) {
        try {
          localStorage.setItem(BRAND_TOKEN_KEY, res.token);
        } catch (_e) {
          /* intentionally ignored: localStorage may be unavailable (e.g. private mode) */
        }
      }
      return res?.brand;
    },
    async me() {
      const res = await get("/auth/brand-me");
      return res?.brand;
    },
    logout() {
      try {
        localStorage.removeItem(BRAND_TOKEN_KEY);
      } catch (_e) {
        /* intentionally ignored: localStorage may be unavailable (e.g. private mode) */
      }
    },
    getToken() {
      try {
        return localStorage.getItem(BRAND_TOKEN_KEY);
      } catch (_e) {
        return null;
      }
    },
    changePassword: (currentPassword, newPassword) =>
      patch("/brand/password", { currentPassword, newPassword }),
  },
  profile: {
    get: () => get("/brand/profile"),
    update: (data) => put("/brand/profile", data),
  },
  dashboard: {
    getStats: (params) => get(`/brand/dashboard/stats${qs(params)}`),
    getRecent: (params) => get(`/brand/dashboard/recent${qs(params)}`),
    getDaily: (params) => get(`/brand/dashboard/daily${qs(params)}`),
  },
  visits: {
    list: (params) => get(`/brand/visits${qs(params)}`),
    getStats: (params) => get(`/brand/visits/stats${qs(params)}`),
  },
  links: {
    list: () => get("/brand/links"),
    create: (data) => post("/brand/links", data),
    update: (id, data) => put(`/brand/links/${encodeURIComponent(id)}`, data),
    delete: (id) => del(`/brand/links/${encodeURIComponent(id)}`),
  },
  directPurchaseLinks: {
    list: () => get("/brand/direct-purchase-links"),
    create: (data) => post("/brand/direct-purchase-links", data),
    update: (id, data) =>
      patch(`/brand/direct-purchase-links/${encodeURIComponent(id)}`, data),
    delete: (id) =>
      del(`/brand/direct-purchase-links/${encodeURIComponent(id)}`),
  },
  orders: {
    list: (params) => get(`/brand/orders${qs(params)}`),
  },
  network: {
    list: (params) => get(`/brand/network${qs(params)}`),
  },
  analytics: {
    get: (params) => get(`/brand/analytics${qs(params)}`),
  },
  commission: {
    getStats: (params) => get(`/brand/commission/stats${qs(params)}`),
  },
  childTransactions: {
    list: () => get("/brand/child-transactions"),
  },
  networkTransactions: {
    list: (params) => get(`/brand/network-transactions${qs(params)}`),
  },
  allTransactions: {
    list: (params) => get(`/brand/all-transactions${qs(params)}`),
  },
  payouts: {
    list: (params) => get(`/brand/payouts${qs(params)}`),
    getUnpaid: (params) => get(`/brand/payouts/unpaid${qs(params)}`),
  },
};

export default brandApi;
