'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/features/theme';
import { useAuthStore } from '@/features/auth/stores/auth-store';
import { useWizardStore } from '@/features/pricing/stores/wizard-store';
import { initCsrfToken } from '@/lib/api-client';
import { AnalyticsProvider } from '@/components/analytics/AnalyticsProvider';
import { AgentationToolbar } from '@/components/dev/AgentationToolbar';

export function ClientLayout({ children }: { children: ReactNode }) {
  const initialized = useRef(false);

  // Manually rehydrate Zustand stores on mount (required when skipHydration: true)
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      useAuthStore.persist.rehydrate();
      useWizardStore.persist.rehydrate();
      initCsrfToken();
    }
  }, []);

  return (
    <QueryProvider>
      <ThemeProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              color: "hsl(var(--foreground))",
            },
          }}
        />
      </ThemeProvider>
      <AnalyticsProvider />
      {/* Dev-only visual feedback toolbar for AI agents (stripped in production builds) */}
      {process.env.NODE_ENV === 'development' && <AgentationToolbar />}
    </QueryProvider>
  );
}

