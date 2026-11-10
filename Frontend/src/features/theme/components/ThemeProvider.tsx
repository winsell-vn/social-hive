'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useThemeStore, type Theme } from '../stores/theme-store';

// Avoids the SSR "useLayoutEffect does nothing on the server" warning while
// still applying the theme before paint on the client (prevents a flash of
// the wrong theme when navigating between the site and the admin panel).
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface ThemeProviderProps {
  children: React.ReactNode;
}

/**
 * Check if the page has force-light-mode enabled.
 * Pages can opt-in to forced light mode by adding a .force-light-mode element.
 */
function isLightModeForced(): boolean {
  return document.querySelector('.force-light-mode') !== null;
}

/**
 * Resolve the concrete theme to apply for the current route.
 * The admin panel has its own preference (light by default).
 */
function resolveTheme(theme: Theme): 'light' | 'dark' {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  }
  return theme;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const pathname = usePathname();
  const { theme, adminTheme } = useThemeStore();

  const isAdmin = pathname?.startsWith('/admin') ?? false;
  const activeTheme: Theme = isAdmin ? adminTheme : theme;

  // Manually rehydrate the store on mount (required when skipHydration: true)
  useEffect(() => {
    useThemeStore.persist.rehydrate();
  }, []);

  useIsomorphicLayoutEffect(() => {
    const root = window.document.documentElement;

    // Skip theme application if page forces light mode (e.g., pricing page)
    if (isLightModeForced()) {
      root.classList.remove('dark');
      root.classList.add('light');
      root.style.colorScheme = 'light';
      return;
    }

    // Remove existing theme class
    root.classList.remove('light', 'dark');

    const resolved = resolveTheme(activeTheme);
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  }, [activeTheme]);

  // Listen for system theme changes
  useEffect(() => {
    if (activeTheme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      const root = window.document.documentElement;

      // Skip if page forces light mode
      if (isLightModeForced()) return;

      root.classList.remove('light', 'dark');
      const newTheme = e.matches ? 'dark' : 'light';
      root.classList.add(newTheme);
      root.style.colorScheme = newTheme;
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [activeTheme]);

  return <>{children}</>;
}

