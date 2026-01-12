import axios from 'axios';

// Create axios instance with base URL from environment variable
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5002',
});

// Request interceptor: automatically attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: normalize errors and handle 401 gracefully
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Clear token from localStorage
      localStorage.removeItem('token');
      // Only redirect to sign in page if we're on a protected page
      const currentPath = window.location.pathname.toLowerCase();
      const publicPages = ['/home', '/challenges', '/howitworks', '/payouts', '/faq', '/contact', '/terms', '/privacy', '/rules', '/buychallenge', '/scalingplan', '/signin', '/signup', '/login', '/'];

      // Check if current path is a public page
      const isPublicPage = publicPages.some(page =>
        currentPath === page || currentPath === page + '/' || currentPath.startsWith(page + '?')
      );

      // Only redirect if we're on a protected page
      if (!isPublicPage) {
        window.location.href = '/SignIn';
      }
    }
    // Normalize error response
    const normalizedError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data,
    };
    return Promise.reject(normalizedError);
  }
);

// Typed helper wrappers
export const apiGet = async (url, config) => {
  const response = await api.get(url, config);
  return response.data;
};

export const apiPost = async (url, data, config) => {
  const response = await api.post(url, data, config);
  return response.data;
};

export const apiPatch = async (url, data, config) => {
  const response = await api.patch(url, data, config);
  return response.data;
};

export const apiDelete = async (url, config) => {
  const response = await api.delete(url, config);
  return response.data;
};

export default api;

