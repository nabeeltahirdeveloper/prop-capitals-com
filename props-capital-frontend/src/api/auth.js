import { apiGet, apiPost } from '@/lib/api';

// API Functions
export const register = async (data) => {
  return apiPost('/auth/register', data);
};

export const requestRegisterOtp = async (data) => {
  return apiPost('/auth/register/request-otp', data);
};

export const verifyRegisterOtp = async (data) => {
  return apiPost('/auth/register/verify-otp', data);
};

export const login = async (data) => {
  return apiPost('/auth/login', data);
};

export const getCurrentUser = async () => {
  return apiGet('/auth/me');
};

export const processPlatformLogin = async (accountId, email, password) => {
  return apiPost(`/auth/account/${accountId}/platform-login`, { email, password });
};

export const validatePlatformAccess = async (accountId, platformToken) => {
  return apiPost(
    `/auth/account/${accountId}/validate-platform-access`,
    { platformToken },
    { allowPlatformUnauthorized: true }
  );
};

export const resetPlatformPassword = async (accountId) => {
  return apiPost(`/auth/account/${accountId}/reset-password`);
};
