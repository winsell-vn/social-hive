'use client';

import { useCallback, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';

interface RequireAuthOptions {
  onUnauthenticated?: () => void;
}

export function useRequireAuth() {
  const { isAuthenticated } = useAuthStore();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const requireAuth = useCallback((
    action: () => void,
    options?: RequireAuthOptions
  ) => {
    if (isAuthenticated) {
      action();
    } else {
      // Store the action to execute after login
      setPendingAction(() => action);
      setShowLoginPrompt(true);
      options?.onUnauthenticated?.();
    }
  }, [isAuthenticated]);

  const executeAfterLogin = useCallback(() => {
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
    setShowLoginPrompt(false);
  }, [pendingAction]);

  const dismissLoginPrompt = useCallback(() => {
    setPendingAction(null);
    setShowLoginPrompt(false);
  }, []);

  return {
    requireAuth,
    isAuthenticated,
    showLoginPrompt,
    executeAfterLogin,
    dismissLoginPrompt,
  };
}

