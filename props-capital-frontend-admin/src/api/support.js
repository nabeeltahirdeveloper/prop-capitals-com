import { apiGet, apiPost, apiPatch } from '@/lib/api';

// API Functions
export const createSupportTicket = async (data) => {
  return apiPost('/support-tickets', data);
};

export const getUserTickets = async (userId) => {
  return apiGet(`/support-tickets/user/${userId}`);
};

export const getTicket = async (id) => {
  return apiGet(`/support-tickets/${id}`);
};

export const updateTicketStatus = async (id, status) => {
  return apiPatch(`/support-tickets/${id}/status`, { status });
};

