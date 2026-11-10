'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuthStore } from '../stores/auth-store';

// Constants
const ACTIVITY_DEBOUNCE_MS = 30 * 1000; // 30 seconds
const IDLE_WARNING_MS = 30 * 60 * 1000; // 30 minutes
const IDLE_LOGOUT_MS = 60 * 60 * 1000; // 1 hour
const IDLE_COUNTDOWN_SECONDS = 60; // 1 minute countdown in modal

interface UseActivityTrackerReturn {
  showIdleWarning: boolean;
  idleCountdown: number;
  resetIdleTimer: () => void;
}

export function useActivityTracker(): UseActivityTrackerReturn {
  const { isAuthenticated, rememberMe, logout } = useAuthStore();

  const [showIdleWarning, setShowIdleWarning] = useState(false);
  const [idleCountdown, setIdleCountdown] = useState(IDLE_COUNTDOWN_SECONDS);

  const lastActivityRef = useRef<number>(Date.now());
  const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleWarningTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idleLogoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTabVisibleRef = useRef(true);

  // Reset idle timer
  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowIdleWarning(false);
    setIdleCountdown(IDLE_COUNTDOWN_SECONDS);

    // Clear existing timeouts
    if (idleWarningTimeoutRef.current) {
      clearTimeout(idleWarningTimeoutRef.current);
    }
    if (idleLogoutTimeoutRef.current) {
      clearTimeout(idleLogoutTimeoutRef.current);
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    // Only set idle timeouts for non-rememberMe sessions
    if (!rememberMe && isAuthenticated) {
      // Set warning timeout
      idleWarningTimeoutRef.current = setTimeout(() => {
        setShowIdleWarning(true);
        setIdleCountdown(IDLE_COUNTDOWN_SECONDS);
        
        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
          setIdleCountdown((prev) => {
            if (prev <= 1) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }, IDLE_WARNING_MS);

      // Set logout timeout
      idleLogoutTimeoutRef.current = setTimeout(() => {
        logout();
      }, IDLE_LOGOUT_MS);
    }
  }, [rememberMe, isAuthenticated, logout]);

  // Handle user activity
  // Token refresh is handled globally by the axios interceptor in api-client.ts
  const handleActivity = useCallback(() => {
    // Skip if tab is hidden
    if (!isTabVisibleRef.current) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    // Debounce activity detection
    if (timeSinceLastActivity < ACTIVITY_DEBOUNCE_MS) return;

    lastActivityRef.current = now;

    // Reset idle timer
    resetIdleTimer();
  }, [resetIdleTimer]);

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    isTabVisibleRef.current = !document.hidden;
  }, []);

  // Set up event listeners
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear all timeouts when not authenticated
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      if (idleWarningTimeoutRef.current) clearTimeout(idleWarningTimeoutRef.current);
      if (idleLogoutTimeoutRef.current) clearTimeout(idleLogoutTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      return;
    }

    // Activity events to track
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    
    events.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Initialize idle timer
    resetIdleTimer();

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      if (activityTimeoutRef.current) clearTimeout(activityTimeoutRef.current);
      if (idleWarningTimeoutRef.current) clearTimeout(idleWarningTimeoutRef.current);
      if (idleLogoutTimeoutRef.current) clearTimeout(idleLogoutTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [isAuthenticated, handleActivity, handleVisibilityChange, resetIdleTimer]);

  return {
    showIdleWarning,
    idleCountdown,
    resetIdleTimer,
  };
}

