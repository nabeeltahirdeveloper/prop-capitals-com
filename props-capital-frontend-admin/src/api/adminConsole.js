import { apiGet, apiPost, apiPatch, apiPut, apiDelete } from "@/lib/api";

const PREFIX = "/admin-console";

const qs = (params) => {
  if (!params) return "";
  const filtered = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (filtered.length === 0) return "";
  return "?" + new URLSearchParams(filtered).toString();
};

export const adminConsoleApi = {
  analytics: {
    overview: () => apiGet(`${PREFIX}/analytics/overview`),
    revenueChart: (days) =>
      apiGet(`${PREFIX}/analytics/revenue-chart${qs({ days })}`),
    packageDistribution: (days, limit) =>
      apiGet(`${PREFIX}/analytics/package-distribution${qs({ days, limit })}`),
  },
  users: {
    list: (params) => apiGet(`${PREFIX}/users${qs(params)}`),
    create: (userData) => apiPost(`${PREFIX}/users`, userData),
    update: (id, partial) => apiPatch(`${PREFIX}/users/${id}`, partial),
  },
  packages: {
    list: () => apiGet(`${PREFIX}/packages`),
    create: (packageData) => apiPost(`${PREFIX}/packages`, packageData),
    update: (id, packageData) => apiPut(`${PREFIX}/packages/${id}`, packageData),
    delete: (id) => apiDelete(`${PREFIX}/packages/${id}`),
  },
  packagePrices: {
    get: (packageId) => apiGet(`${PREFIX}/package-prices/${packageId}`),
    update: (packageId, prices) =>
      apiPut(`${PREFIX}/package-prices/${packageId}`, { prices }),
  },
  currencies: {
    list: () => apiGet(`${PREFIX}/currencies`),
    update: (code, data) => apiPut(`${PREFIX}/currencies/${code}`, data),
    syncRates: () => apiPost(`${PREFIX}/currencies/sync-rates`),
    updateConversionFee: (amount) =>
      apiPut(`${PREFIX}/currencies/conversion-fee`, { amount }),
    delete: (code) => apiDelete(`${PREFIX}/currencies/${code}`),
  },
  currencyGeoMappings: {
    list: () => apiGet(`${PREFIX}/currency-geo-mappings`),
    create: (data) => apiPost(`${PREFIX}/currency-geo-mappings`, data),
    update: (countryCode, data) =>
      apiPut(`${PREFIX}/currency-geo-mappings/${countryCode}`, data),
    delete: (countryCode) =>
      apiDelete(`${PREFIX}/currency-geo-mappings/${countryCode}`),
  },
  paymentGatewayMappings: {
    list: () => apiGet(`${PREFIX}/payment-gateway-mappings`),
    create: (data) => apiPost(`${PREFIX}/payment-gateway-mappings`, data),
    update: (countryCode, data) =>
      apiPut(`${PREFIX}/payment-gateway-mappings/${countryCode}`, data),
    delete: (countryCode) =>
      apiDelete(`${PREFIX}/payment-gateway-mappings/${countryCode}`),
    bulk: (mappings) =>
      apiPost(`${PREFIX}/payment-gateway-mappings/bulk`, { mappings }),
  },
  brands: {
    list: (params) => apiGet(`${PREFIX}/brands${qs(params)}`),
    get: (id) => apiGet(`${PREFIX}/brands/${encodeURIComponent(id)}`),
    create: (brandData) => apiPost(`${PREFIX}/brands`, brandData),
    update: (id, brandData) =>
      apiPatch(`${PREFIX}/brands/${encodeURIComponent(id)}`, brandData),
    delete: (id) => apiDelete(`${PREFIX}/brands/${encodeURIComponent(id)}`),
    bulkDelete: (ids) => apiPost(`${PREFIX}/brands/bulk-delete`, { ids }),
    getUnpaidTransactions: (params) =>
      apiGet(`${PREFIX}/brands/unpaid-transactions${qs(params)}`),
    getDashboard: (id) =>
      apiGet(`${PREFIX}/brands/${encodeURIComponent(id)}/dashboard`),
    getPending: (params) => apiGet(`${PREFIX}/brands/pending${qs(params)}`),
    approve: (id) =>
      apiPost(`${PREFIX}/brands/${encodeURIComponent(id)}/approve`),
    reject: (id, reason) =>
      apiPost(
        `${PREFIX}/brands/${encodeURIComponent(id)}/reject`,
        reason ? { reason } : {},
      ),
    resetPassword: (id) =>
      apiPost(`${PREFIX}/brands/${encodeURIComponent(id)}/reset-password`),
  },
  directPurchaseLinks: {
    list: (params) => apiGet(`${PREFIX}/direct-purchase-links${qs(params)}`),
    listByBrand: (brandId) =>
      apiGet(
        `${PREFIX}/direct-purchase-links/brand/${encodeURIComponent(brandId)}`,
      ),
    backfill: () => apiPost(`${PREFIX}/direct-purchase-links/backfill`),

    regenerateForBrand: (brandId) =>
      apiPost(`${PREFIX}/brands/${encodeURIComponent(brandId)}/regenerate-links`),
  },
  orders: {
    list: (params) => apiGet(`${PREFIX}/orders${qs(params)}`),
    get: (id) => apiGet(`${PREFIX}/orders/${encodeURIComponent(id)}`),
    create: (orderData) => apiPost(`${PREFIX}/orders`, orderData),
    createManual: (orderData) => apiPost(`${PREFIX}/orders/manual`, orderData),
    update: (id, orderData) =>
      apiPatch(`${PREFIX}/orders/${encodeURIComponent(id)}`, orderData),
    delete: (id) => apiDelete(`${PREFIX}/orders/${encodeURIComponent(id)}`),
  },
  visits: {
    list: (params) => apiGet(`${PREFIX}/visits${qs(params)}`),
    getStats: (params) => apiGet(`${PREFIX}/visits/stats${qs(params)}`),
  },
  transactions: {
    list: (params) => apiGet(`${PREFIX}/all-transactions${qs(params)}`),
  },
  payouts: {
    list: (params) => apiGet(`${PREFIX}/payouts${qs(params)}`),
    markPaid: ({ brandIds, orderIds, fromDate, toDate }) =>
      apiPost(`${PREFIX}/payouts/mark-paid`, {
        brandIds,
        orderIds,
        fromDate,
        toDate,
      }),
  },
  brandWallets: {
    list: (params) => apiGet(`${PREFIX}/brand-wallets${qs(params)}`),
  },
  ipWhitelist: {
    list: async () => {
      const res = await apiGet(`${PREFIX}/ip-whitelist`);
      return res?.ips || [];
    },
    add: async (ip, label) => {
      const res = await apiPost(`${PREFIX}/ip-whitelist`, { ip, label });
      return res?.ip;
    },
    delete: (id) => apiDelete(`${PREFIX}/ip-whitelist/${id}`),
    getSettings: () => apiGet(`${PREFIX}/ip-whitelist/settings`),
    updateSettings: (settings) =>
      apiPatch(`${PREFIX}/ip-whitelist/settings`, settings),
  },
  blockedIPs: {
    list: (params) => apiGet(`${PREFIX}/blocked-ips${qs(params)}`),
    get: async (ip) => {
      const res = await apiGet(`${PREFIX}/blocked-ips/${encodeURIComponent(ip)}`);
      return res?.ip;
    },
    getAttempts: (ip) =>
      apiGet(`${PREFIX}/blocked-ips/${encodeURIComponent(ip)}/attempts`),
    update: async (ip, action) => {
      const res = await apiPatch(
        `${PREFIX}/blocked-ips/${encodeURIComponent(ip)}`,
        { action },
      );
      return res?.ip;
    },
  },
  outsiderOrders: {
    list: (params) => apiGet(`${PREFIX}/outsider-orders${qs(params)}`),
  },
  apiKeys: {
    list: () => apiGet(`${PREFIX}/api-keys`),
    create: (data) => apiPost(`${PREFIX}/api-keys`, data),
    update: (id, data) => apiPatch(`${PREFIX}/api-keys/${id}`, data),
    delete: (id) => apiDelete(`${PREFIX}/api-keys/${id}`),
  },
  systemTools: {
    fixUsdAmounts: () => apiPost(`${PREFIX}/fix-usd-amounts`),
  },
};

export const adminConsoleApiBase = () => {
  const root =
    import.meta.env.VITE_API_URL || "http://localhost:5002";
  return `${root}${PREFIX}`;
};

export default adminConsoleApi;
