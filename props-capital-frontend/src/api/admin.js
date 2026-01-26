import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

// ============================================================================
// Admin Users
// ============================================================================
export const adminGetAllUsers = async () => {
  return apiGet("/admin/users");
};

export const adminGetUser = async (userId) => {
  return apiGet(`/admin/users/${userId}`);
};

export const adminSearchUsers = async (query) => {
  return apiGet(`/admin/users/search/query?q=${encodeURIComponent(query)}`);
};

export const adminUpdateUserRole = async (id, role) => {
  return apiPatch(`/admin/users/${id}/role`, { role });
};

// ============================================================================
// Admin Challenges
// ============================================================================
export const adminGetAllChallenges = async () => {
  return apiGet("/admin/challenges");
};

export const adminGetChallenge = async (id) => {
  return apiGet(`/admin/challenges/${id}`);
};

export const adminCreateChallenge = async (data) => {
  return apiPost("/admin/challenges", data);
};

export const adminUpdateChallenge = async (id, data) => {
  return apiPatch(`/admin/challenges/${id}`, data);
};

export const adminDeleteChallenge = async (id) => {
  return apiDelete(`/admin/challenges/${id}`);
};

// ============================================================================
// Admin Accounts
// ============================================================================
export const adminGetAllAccounts = async () => {
  return apiGet("/admin/accounts");
};

export const adminGetAccount = async (id) => {
  return apiGet(`/admin/accounts/${id}`);
};

export const adminUpdateAccountStatus = async (id, status) => {
  return apiPatch(`/admin/accounts/${id}/status`, { status });
};

export const adminUpdateAccountPhase = async (id, phase) => {
  return apiPatch(`/admin/accounts/${id}/phase`, { phase });
};

// ============================================================================
// Admin Payouts
// ============================================================================
export const adminGetAllPayouts = async () => {
  return apiGet("/admin/payouts");
};

export const adminGetPayoutStatistics = async () => {
  return apiGet("/admin/payouts/statistics");
};

export const adminApprovePayout = async (id) => {
  return apiPatch(`/admin/payouts/${id}/approve`);
};

export const adminRejectPayout = async (id) => {
  return apiPatch(`/admin/payouts/${id}/reject`);
};

export const adminMarkPayoutAsPaid = async (id) => {
  return apiPatch(`/admin/payouts/${id}/mark-paid`);
};

// ============================================================================
// Admin Payments
// ============================================================================
export const adminGetAllPayments = async () => {
  return apiGet("/admin/payments");
};

export const adminGetPaymentStatistics = async () => {
  return apiGet("/admin/payments/statistics");
};

export const adminRefundPayment = async (id, reason) => {
  return apiPatch(`/admin/payments/${id}/refund`, { reason });
};

// ============================================================================
// Admin Dashboard - IMPROVED WITH ERROR HANDLING & TIMEOUT
// ============================================================================

const TIMEOUT_MS = 15000; // 15 second timeout for dashboard API calls

/**
 * Helper function to handle API errors consistently
 */
const handleApiError = (error, context) => {
  if (error.response) {
    // Server responded with error status
    console.error(`[${context}] API Error:`, error.response.data);
    throw new Error(error.response.data?.message || `Failed to ${context}`);
  } else if (error.request) {
    // Request made but no response
    console.error(`[${context}] Network Error:`, error.request);
    throw new Error(`Network error while trying to ${context}`);
  } else {
    // Something else happened
    console.error(`[${context}] Error:`, error.message);
    throw new Error(`Failed to ${context}: ${error.message}`);
  }
};

/**
 * Get dashboard overview statistics
 * GET /admin/dashboard/overview
 */
export const adminGetDashboardOverview = async () => {
  try {
    const response = await apiGet("/admin/dashboard/overview", {
      timeout: TIMEOUT_MS,
    });
    return response;
  } catch (error) {
    handleApiError(error, "fetch dashboard overview");
  }
};

/**
 * Get recent trading accounts with optional pagination
 * GET /admin/dashboard/recent-accounts?page=1&limit=5
 */
export const adminGetRecentAccounts = async (page = 1, limit = 5) => {
  try {
    const response = await apiGet("/admin/dashboard/recent-accounts", {
      params: { page, limit },
      timeout: TIMEOUT_MS,
    });

    // Return just the data array for backward compatibility
    // If backend returns paginated response, extract data array
    return response.data || response;
  } catch (error) {
    handleApiError(error, "fetch recent accounts");
  }
};

/**
 * Get recent violations with optional pagination
 * GET /admin/dashboard/recent-violations?page=1&limit=10
 */
export const adminGetRecentViolations = async (page = 1, limit = 10) => {
  try {
    const response = await apiGet("/admin/dashboard/recent-violations", {
      params: { page, limit },
      timeout: TIMEOUT_MS,
    });

    // Return just the data array for backward compatibility
    return response.data || response;
  } catch (error) {
    handleApiError(error, "fetch recent violations");
  }
};

/**
 * Get revenue chart data (last 30 days)
 * GET /admin/dashboard/revenue-chart
 */
export const adminGetRevenueChart = async () => {
  try {
    const response = await apiGet("/admin/dashboard/revenue-chart", {
      timeout: TIMEOUT_MS,
    });
    return response;
  } catch (error) {
    handleApiError(error, "fetch revenue chart");
  }
};

/**
 * Get registrations chart data
 * GET /admin/dashboard/registrations-chart
 */
export const adminGetRegistrationsChart = async () => {
  try {
    const response = await apiGet("/admin/dashboard/registrations-chart", {
      timeout: TIMEOUT_MS,
    });
    return response;
  } catch (error) {
    handleApiError(error, "fetch registrations chart");
  }
};

// ============================================================================
// Admin Risk Monitoring
// ============================================================================
export const adminGetRiskOverview = async () => {
  return apiGet("/admin/risk/overview");
};

export const adminGetAccountRisk = async (accountId) => {
  return apiGet(`/admin/risk/account/${accountId}`);
};

export const adminGetAllViolations = async () => {
  return apiGet("/admin/risk/violations");
};

export const adminGetViolation = async (id) => {
  return apiGet(`/admin/risk/violations/${id}`);
};

// ============================================================================
// Admin Support
// ============================================================================
export const adminGetAllSupportTickets = async () => {
  return apiGet("/admin/support/tickets");
};

export const adminGetSupportStatistics = async () => {
  return apiGet("/admin/support/tickets/statistics");
};

export const adminUpdateTicketStatus = async (id, status) => {
  return apiPatch(`/admin/support/tickets/${id}/status`, { status });
};

// ============================================================================
// Admin Settings
// ============================================================================
export const adminGetAllSettings = async () => {
  return apiGet("/admin/settings/all/groups");
};

export const adminGetSettingsByGroup = async (group) => {
  return apiGet(`/admin/settings/group/${group}`);
};

export const adminUpdateSettingsGroup = async (group, settings) => {
  return apiPatch(`/admin/settings/group/${group}`, settings);
};

// ============================================================================
// Admin Trades
// ============================================================================
export const adminGetAllTrades = async () => {
  return apiGet("/admin/trades");
};

export const adminGetTradesByUser = async (userId) => {
  return apiGet(`/admin/trades/user/${userId}`);
};

export const adminGetTradesByAccount = async (accountId) => {
  return apiGet(`/admin/trades/account/${accountId}`);
};

export const adminGetTradeById = async (tradeId) => {
  return apiGet(`/admin/trades/${tradeId}`);
};
