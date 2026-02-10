import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api";

// API Functions
export const createNotification = async (data) => {
  return apiPost("/notifications", data);
};

export const getUserNotifications = async (userId) => {
  return apiGet(`/notifications/user/${userId}`);
};

export const markNotificationAsRead = async (id) => {
  return apiPatch(`/notifications/${id}/read`);
};

export const deleteNotification = async (id) => {
  return apiDelete(`/notifications/${id}`);
};

export const markAllNotificationsAsRead = async (userId) => {
  return apiPatch(`/notifications/user/${userId}/read-all`);
};
