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

