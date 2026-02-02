import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api';

// API Functions
export const getChallenges = async () => {
  return apiGet('/challenges');
};

export const getChallenge = async (id) => {
  return apiGet(`/challenges/${id}`);
};

export const createChallenge = async (data) => {
  return apiPost('/challenges', data);
};

export const updateChallenge = async (id, data) => {
  return apiPatch(`/challenges/${id}`, data);
};

export const deleteChallenge = async (id) => {
  return apiDelete(`/challenges/${id}`);
};

