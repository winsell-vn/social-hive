'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import type { User } from '@/features/auth/types/auth';

interface AdminGuardProps {
  children: React.ReactNode;
}

/**
 * AdminGuard component that wraps admin-only pages.
 *
 * Behavior:
 * - If user is SUPER_ADMIN or ADMIN: renders children
 * - If user is not authenticated: redirects to /login
 * - If user is authenticated but not admin: redirects to /
 * - While checking auth state: shows loading skeleton
 *
 * Usage:
 * ```tsx
 * export default function AdminDashboardPage() {
 *   return (
 *     <AdminGuard>
 *       <AdminDashboardContent />
 *     </AdminGuard>
 *   );
 * }
 * ```
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, hydrated } = useAuth();

  // Helper function to check if user has required role (SUPER_ADMIN or ADMIN)
  const hasRequiredRole = (user: User | null): boolean => {
    if (!user) return false;
    return user.role === 'SUPER_ADMIN' || user.role === 'ADMIN';
  };

  useEffect(() => {
    // Wait for auth state to hydrate from localStorage
    if (!hydrated) {
      return;
    }

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    // If authenticated but doesn't have required role, redirect to home
    if (!hasRequiredRole(user)) {
      router.push('/');
    }
  }, [isAuthenticated, user, hydrated, router]);

  // Show loading state while hydrating auth state
  if (!hydrated) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  // If not authenticated or doesn't have required role, don't render children
  if (!isAuthenticated || !hasRequiredRole(user)) {
    return null;
  }

  // Render admin content
  return <>{children}</>;
}
