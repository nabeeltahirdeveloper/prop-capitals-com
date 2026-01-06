import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

// Admin Users
export const adminGetAllUsers = async () => {
  return apiGet('/admin/users');
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

// Admin Challenges
export const adminGetAllChallenges = async () => {
  return apiGet('/admin/challenges');
};

export const adminGetChallenge = async (id) => {
  return apiGet(`/admin/challenges/${id}`);
};

export const adminCreateChallenge = async (data) => {
  return apiPost('/admin/challenges', data);
};

export const adminUpdateChallenge = async (id, data) => {
  return apiPatch(`/admin/challenges/${id}`, data);
};

export const adminDeleteChallenge = async (id) => {
  return apiDelete(`/admin/challenges/${id}`);
};

// Admin Accounts
export const adminGetAllAccounts = async () => {
  return apiGet('/admin/accounts');
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

// Admin Payouts
export const adminGetAllPayouts = async () => {
  return apiGet('/admin/payouts');
};

export const adminGetPayoutStatistics = async () => {
  return apiGet('/admin/payouts/statistics');
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

// Admin Payments
export const adminGetAllPayments = async () => {
  return apiGet('/admin/payments');
};

export const adminGetPaymentStatistics = async () => {
  return apiGet('/admin/payments/statistics');
};

export const adminRefundPayment = async (id, reason) => {
  return apiPatch(`/admin/payments/${id}/refund`, { reason });
};

// Admin Dashboard
export const adminGetDashboardOverview = async () => {
  return apiGet('/admin/dashboard/overview');
};

export const adminGetRecentAccounts = async () => {
  return apiGet('/admin/dashboard/recent-accounts');
};

export const adminGetRecentViolations = async () => {
  return apiGet('/admin/dashboard/recent-violations');
};

export const adminGetRevenueChart = async () => {
  return apiGet('/admin/dashboard/revenue-chart');
};

export const adminGetRegistrationsChart = async () => {
  return apiGet('/admin/dashboard/registrations-chart');
};

// Admin Violations
export const adminGetAllViolations = async () => {
  return apiGet('/admin/risk/violations');
};

// Admin Support
export const adminGetAllSupportTickets = async () => {
  return apiGet('/admin/support/tickets');
};

export const adminGetSupportStatistics = async () => {
  return apiGet('/admin/support/tickets/statistics');
};

export const adminUpdateTicketStatus = async (id, status) => {
  return apiPatch(`/admin/support/tickets/${id}/status`, { status });
};

// Admin Settings
export const adminGetAllSettings = async () => {
  return apiGet('/admin/settings/all/groups');
};

export const adminGetSettingsByGroup = async (group) => {
  return apiGet(`/admin/settings/group/${group}`);
};

export const adminUpdateSettingsGroup = async (group, settings) => {
  return apiPatch(`/admin/settings/group/${group}`, settings);
};

// Admin Trades
export const adminGetAllTrades = async () => {
  return apiGet('/admin/trades');
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

