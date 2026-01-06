import React, { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/api/auth';

const AuthContext = createContext({
  status: 'checking',
  user: null,
  isAdmin: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Check if token exists in localStorage to determine if we should fetch
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('token');

  // Fetch current user - enabled only if token exists
  const { data: user, isLoading, isError, error } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: getCurrentUser,
    retry: false,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    enabled: hasToken, // Only fetch if token exists
    refetchOnWindowFocus: false,
  });

  // Determine auth status
  const status = useMemo(() => {
    // If no token exists, we're immediately unauthenticated (no need to check)
    if (!hasToken) {
      return 'unauthenticated';
    }
    
    // If query is loading or hasn't started yet, we're checking
    // Note: when enabled=false, isLoading can be false immediately, so we check both
    if (isLoading || (hasToken && user === undefined && !isError)) {
      return 'checking';
    }
    
    // If query errored or returned no user, we're unauthenticated
    if (isError || !user || error) {
      return 'unauthenticated';
    }
    
    // User exists and query succeeded
    return 'authenticated';
  }, [hasToken, isLoading, isError, user, error]);

  // Determine if user is admin
  const isAdmin = useMemo(() => {
    if (!user) return false;
    const role = user.role?.toUpperCase();
    return role === 'ADMIN';
  }, [user]);

  const value = useMemo(
    () => ({
      status,
      user,
      isAdmin,
    }),
    [status, user, isAdmin]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

