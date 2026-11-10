'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { Loader2 } from 'lucide-react';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, hydrated } = useAuthStore();

  useEffect(() => {
    // Wait for hydration before checking auth
    if (!hydrated) return;

    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (!isLoading && isAuthenticated && user) {
      // Check if user has ADMIN or SUPER_ADMIN role
      if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, user, router, hydrated]);

  // Show loading while hydrating or checking auth
  if (!hydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-rose-600 mx-auto" />
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return null;
  }

  // Not authorized (not admin or super admin)
  if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Không có quyền truy cập</h1>
          <p className="mt-2 text-gray-600">Bạn không có quyền truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

