'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/auth-store';
import { useLogin, useLogout, useRegister, useCurrentUser } from '../api/auth';
import type { LoginInput, RegisterInput } from '../types/auth';

export function useAuth() {
  const router = useRouter();
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    hydrated,
    accessToken,
    setLoading,
    setError,
    setUser,
  } = useAuthStore();

  const loginMutation = useLogin();
  const logoutMutation = useLogout();
  const registerMutation = useRegister();
  const { data: currentUserData, isLoading: isLoadingUser, refetch: refetchUser } = useCurrentUser();

  // Update auth store when user data is fetched (React Query v5 - no onSuccess)
  useEffect(() => {
    if (currentUserData) {
      setUser(currentUserData);
    }
  }, [currentUserData, setUser]);

  const login = useCallback(
    async (data: LoginInput) => {
      setLoading(true);
      setError(null);
      try {
        const result = await loginMutation.mutateAsync(data);

        // Check if 2FA is required
        if (result.requires2FA && result.tempToken) {
          return {
            success: false,
            requires2FA: true,
            tempToken: result.tempToken
          };
        }

        router.push('/');
        return { success: true };
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.log('[DEBUG] useAuth.login catch: errorResponse=' + JSON.stringify(error.response?.data) + ' status=' + error.response?.status);
        const message = error.response?.data?.message || 'Đăng nhập thất bại';
        // eslint-disable-next-line no-console
        console.log('[DEBUG] useAuth.login: extractedMessage=' + message);
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [loginMutation, router, setLoading, setError]
  );

  const register = useCallback(
    async (data: RegisterInput) => {
      setLoading(true);
      setError(null);
      try {
        const result = await registerMutation.mutateAsync(data);
        return { success: true, data: result };
      } catch (error: any) {
        const message = error.response?.data?.message || 'Đăng ký thất bại';
        setError(message);
        return { success: false, error: message };
      } finally {
        setLoading(false);
      }
    },
    [registerMutation, setLoading, setError]
  );

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await logoutMutation.mutateAsync();
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [logoutMutation, router, setLoading]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    user,
    isAuthenticated,
    isLoading: isLoading || loginMutation.isPending || registerMutation.isPending,
    isLoadingUser,
    error,
    hydrated,
    accessToken,
    login,
    logout,
    register,
    refetchUser,
    clearError,
  };
}

