'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * ProtectedRoute component that wraps authenticated-only pages.
 *
 * Behavior:
 * - If user is authenticated: renders children
 * - If user is not authenticated: redirects to /login
 * - While checking auth state: shows loading skeleton
 *
 * Usage:
 * ```tsx
 * export default function SettingsPage() {
 *   return (
 *     <ProtectedRoute>
 *       <SettingsContent />
 *     </ProtectedRoute>
 *   );
 * }
 * ```
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();

  useEffect(() => {
    // Wait for auth state to hydrate from localStorage
    if (!hydrated) {
      return;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, hydrated, router]);

  // Show loading state while hydrating auth state
  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // If not authenticated, don't render children (redirect is in progress)
  if (!isAuthenticated) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
