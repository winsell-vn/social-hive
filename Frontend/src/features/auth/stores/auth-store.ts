'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthState } from '../types/auth';

interface AuthStore extends AuthState {
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string | null, refreshToken?: string | null) => void;
  setRememberMe: (rememberMe: boolean) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      rememberMe: false,
      hydrated: false,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          error: null,
        }),

      setTokens: (_accessToken, _refreshToken) => {
        // SECURITY FIX: Tokens are now stored ONLY in HttpOnly cookies by the backend
        // This function is kept for backward compatibility but is now a no-op
        // isAuthenticated is determined by user presence, not token presence
        set({ hydrated: true });
      },

      setRememberMe: (rememberMe) => set({ rememberMe }),

      logout: () => {
        // Cookies are cleared by the backend on logout API call
        // We just clear the local state
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          error: null,
          rememberMe: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      setHydrated: (hydrated) => set({ hydrated }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      skipHydration: true, // Skip hydration during SSR to avoid prerender issues
      // Only persist non-sensitive data (no tokens)
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        // Note: accessToken is no longer stored - tokens are in HttpOnly cookies
      },
    }
  )
);

