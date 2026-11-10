'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useLogout } from '@/features/auth';

/**
 * Logout Page
 * Handles user logout by:
 * 1. Calling the logout API to invalidate the refresh token on the server
 * 2. Clearing auth tokens from localStorage (via auth-store)
 * 3. Clearing encryption keys from sessionStorage
 * 4. Redirecting to login page
 */
export default function LogoutPage() {
  const router = useRouter();
  const logoutMutation = useLogout();
  const hasInitiated = useRef(false);

  useEffect(() => {
    // Prevent double execution in React StrictMode
    if (hasInitiated.current) return;
    hasInitiated.current = true;

    const performLogout = async () => {
      try {
        // Call the logout mutation which:
        // - Calls POST /auth/logout to invalidate refresh token on server
        // - Calls auth-store.logout() to clear accessToken, refreshToken from localStorage
        // - Clears React Query cache
        await logoutMutation.mutateAsync();
      } catch (error) {
        // Even if API call fails, we still want to clear local state
        console.error('[Logout] API logout failed:', error);
      }

      // Clear encryption-related session storage keys
      // These are set by EncryptionProvider when user logs in
      if (typeof window !== 'undefined') {
        // Clear encryption_keys_initialized_* keys
        const keysToRemove = Object.keys(sessionStorage).filter(
          (key) =>
            key.startsWith('encryption_keys_initialized') ||
            key === 'dbKey' ||
            key === 'dbSalt'
        );
        keysToRemove.forEach((key) => sessionStorage.removeItem(key));
      }

      // Redirect to login page
      router.replace('/login');
    };

    performLogout();
  }, [logoutMutation, router]);

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Đang đăng xuất...</p>
    </div>
  );
}

