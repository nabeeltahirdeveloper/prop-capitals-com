import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/auth';
import { reconnectSocketWithToken } from '@/lib/socket';

const AuthContext = createContext({
  status: 'checking',
  user: null,
  login: () => { },
  logout: () => { },
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  });

  // Fetch current user - enabled only if token exists
  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: !!token, // Only fetch if token exists
    refetchOnWindowFocus: false,
  });

  const login = useCallback((newToken, userData) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    if (userData) {
      queryClient.setQueryData(['user', 'me'], userData);
    }
    queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    reconnectSocketWithToken();
  }, [queryClient]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    queryClient.setQueryData(['user', 'me'], null);
    queryClient.removeQueries({ queryKey: ['user', 'me'] });
    window.location.href = '/SignIn';
  }, [queryClient]);

  // Determine auth status
  const status = useMemo(() => {
    // If no token exists, we're immediately unauthenticated
    if (!token) {
      return 'unauthenticated';
    }

    // If query is loading and we have no cached data, we're checking
    if (isLoading && !user) {
      return 'checking';
    }

    // If query errored or returned no user, we're unauthenticated
    if (isError || !user) {
      return 'unauthenticated';
    }

    // User exists and query succeeded
    return 'authenticated';
  }, [token, isLoading, isError, user]);

  const value = useMemo(
    () => ({
      status,
      user,
      login,
      logout,
    }),
    [status, user, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

