import { apiGet, apiPost, apiPatch } from '@/lib/api';

// API Functions
export const createSupportTicket = async (data) => {
  return apiPost('/support-tickets', data);
};

export const getUserTickets = async (userId) => {
  try {
    return await apiGet('/support-tickets/me');
  } catch (error) {
    // Some deployed environments may not have /me yet; fallback to user route.
    if (error?.status === 404 && userId) {
      return apiGet(`/support-tickets/user/${userId}`);
    }
    throw error;
  }
};

export const getTicket = async (id) => {
  return apiGet(`/support-tickets/${id}`);
};

export const updateTicketStatus = async (id, status) => {
  return apiPatch(`/support-tickets/${id}/status`, { status });
};

