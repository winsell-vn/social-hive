'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../stores/auth-store';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: ('GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN')[];
}

export function ProtectedRoute({ children, requiredRoles }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hydrated } = useAuthStore();

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!hydrated) return;

    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }

    if (!isLoading && isAuthenticated && requiredRoles && user) {
      if (!requiredRoles.includes(user.role)) {
        router.push('/'); // Redirect to home if not authorized
      }
    }
  }, [isLoading, isAuthenticated, user, requiredRoles, router, hydrated]);

  // Show loading while hydrating or checking auth
  if (!hydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-rose-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requiredRoles && user && !requiredRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}

