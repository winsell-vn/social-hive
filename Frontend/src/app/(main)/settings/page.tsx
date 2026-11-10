'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoginPromptModal } from '@/features/auth/components/LoginPromptModal';
import { SettingsPage } from '@/features/settings';
import { Skeleton } from '@/components/ui/skeleton';

function SettingsPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4">
      <Skeleton className="h-8 w-32 mb-6" />
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-56">
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function SettingsRoute() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();

  const handleClose = () => {
    router.push('/');
  };

  // Show loading while hydrating
  if (!hydrated) {
    return <SettingsPageSkeleton />;
  }

  return (
    <>
      {isAuthenticated ? (
        <Suspense fallback={<SettingsPageSkeleton />}>
          <SettingsPage />
        </Suspense>
      ) : (
        <div className="space-y-4 p-4">
          <h1 className="text-2xl font-bold">Cài đặt</h1>
          <div className="text-muted-foreground">Vui lòng đăng nhập để truy cập cài đặt</div>
        </div>
      )}

      {/* Show modal if not authenticated - closes and redirects to home */}
      <LoginPromptModal
        open={!isAuthenticated}
        onClose={handleClose}
        message="Vui lòng đăng nhập để truy cập cài đặt"
      />
    </>
  );
}

