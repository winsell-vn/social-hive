'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { LoginPromptModal } from '@/features/auth/components/LoginPromptModal';

export default function ProfileRedirectPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoadingUser, hydrated } = useAuth();

  const handleClose = () => {
    router.push('/');
  };

  useEffect(() => {
    // Wait for hydration and user data loading to complete before making redirect decision
    if (!hydrated || isLoadingUser) {
      return;
    }

    if (isAuthenticated && user?.profile?.username) {
      router.replace(`/profile/${user.profile.username}`);
    }
    // Don't redirect to login anymore - modal will handle unauthenticated users
  }, [hydrated, isAuthenticated, isLoadingUser, user, router]);

  // Show loading while hydrating or loading user
  if (!hydrated || isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If authenticated and has username, show loading (redirect is in progress)
  if (isAuthenticated && user?.profile?.username) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show modal for unauthenticated users
  return (
    <>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Vui lòng đăng nhập để xem trang cá nhân</div>
      </div>

      <LoginPromptModal
        open={!isAuthenticated}
        onClose={handleClose}
        message="Vui lòng đăng nhập để xem trang cá nhân"
      />
    </>
  );
}
