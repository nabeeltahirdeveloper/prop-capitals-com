import axios from "axios";

const RESELLER_TOKEN_KEY = "reseller_token";

// Dedicated axios instance — same isolation rationale as brand.js. Never
// reads localStorage.token (the trader token) and never writes it on login.
const resellerAxios = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? "https://api.prop-capitals.com"
      : "http://localhost:5002"),
});

resellerAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem(RESELLER_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

resellerAxios.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      try {
        localStorage.removeItem(RESELLER_TOKEN_KEY);
      } catch (_e) {}
      if (
        typeof window !== "undefined" &&
        window.location.pathname.startsWith("/reseller")
      ) {
        window.location.href = "/reseller-login";
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

const get = async (url, config) => (await resellerAxios.get(url, config)).data;
const post = async (url, data, config) =>
  (await resellerAxios.post(url, data, config)).data;
const put = async (url, data, config) =>
  (await resellerAxios.put(url, data, config)).data;
const patch = async (url, data, config) =>
  (await resellerAxios.patch(url, data, config)).data;
const del = async (url, config) =>
  (await resellerAxios.delete(url, config)).data;

const qs = (params) => {
  if (!params) return "";
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (filtered.length === 0) return "";
  return "?" + new URLSearchParams(filtered).toString();
};

export const resellerApi = {
  auth: {
    async login({ username, password }) {
      const res = await post("/auth/reseller-login", { username, password });
      if (res?.token) {
        try {
          localStorage.setItem(RESELLER_TOKEN_KEY, res.token);
        } catch (_e) {}
      }
      return res?.reseller;
    },
    async me() {
      const res = await get("/auth/reseller-me");
      return res?.reseller;
    },
    logout() {
      try {
        localStorage.removeItem(RESELLER_TOKEN_KEY);
      } catch (_e) {}
    },
    getToken() {
      try {
        return localStorage.getItem(RESELLER_TOKEN_KEY);
      } catch (_e) {
        return null;
      }
    },
    changePassword: (currentPassword, newPassword) =>
      patch("/reseller/password", { currentPassword, newPassword }),
  },
  profile: {
    get: () => get("/reseller/profile"),
    update: (data) => put("/reseller/profile", data),
  },
  dashboard: {
    getStats: (params) => get(`/reseller/dashboard/stats${qs(params)}`),
  },
  visits: {
    list: (params) => get(`/reseller/visits${qs(params)}`),
    getStats: (params) => get(`/reseller/visits/stats${qs(params)}`),
  },
  links: {
    list: () => get("/reseller/links"),
    listByBrand: (brandId) =>
      get(`/reseller/brands/${encodeURIComponent(brandId)}/links`),
    create: (data) => post("/reseller/links", data),
    update: (id, data) =>
      put(`/reseller/links/${encodeURIComponent(id)}`, data),
    delete: (id) => del(`/reseller/links/${encodeURIComponent(id)}`),
  },
  orders: {
    list: (params) => get(`/reseller/orders${qs(params)}`),
  },
  network: {
    brands: (params) => get(`/reseller/network/brands${qs(params)}`),
    transactions: (params) =>
      get(`/reseller/network/transactions${qs(params)}`),
  },
  brands: {
    create: (data) => post("/reseller/brands", data),
  },
  mids: {
    list: () => get("/reseller/mids"),
  },
  analytics: {
    get: (params) => get(`/reseller/analytics${qs(params)}`),
  },
  commission: {
    getStats: (params) => get(`/reseller/commission/stats${qs(params)}`),
  },
  networkTransactions: {
    list: (params) => get(`/reseller/network-transactions${qs(params)}`),
  },
  allTransactions: {
    list: (params) => get(`/reseller/all-transactions${qs(params)}`),
  },
  payouts: {
    list: (params) => get(`/reseller/payouts${qs(params)}`),
  },
};

export default resellerApi;
