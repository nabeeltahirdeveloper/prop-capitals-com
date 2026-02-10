import { apiGet, apiPost, apiPatch } from '@/lib/api';

// Profile API Functions
export const getProfile = async () => {
  return apiGet('/users/me/profile');
};

export const updateProfile = async (data) => {
  return apiPatch('/users/me/profile', data);
};

export const changePassword = async (currentPassword, newPassword) => {
  return apiPost('/auth/change-password', {
    currentPassword,
    newPassword,
  });
};

export const getNotificationPreferences = async () => {
  return apiGet('/users/me/notification-preferences');
};

export const updateNotificationPreferences = async (data) => {
  return apiPatch('/users/me/notification-preferences', data);
};

export const getVerificationDocuments = async () => {
  return apiGet('/users/me/verification-documents');
};

export const uploadVerificationDocument = async (documentType, fileUrl) => {
  return apiPatch('/users/me/verification-documents', {
    documentType,
    fileUrl,
  });
};

