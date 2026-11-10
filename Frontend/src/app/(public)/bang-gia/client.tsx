'use client';

import { useEffect, useRef } from 'react';
import { WizardContainer } from '@/features/pricing/components/wizard';
import { ChatBubble, ChatPanel } from '@/features/chatbot';
import { useChatStore } from '@/features/chatbot';

/**
 * Forces light mode on the pricing page regardless of user's theme preference.
 * Restores original theme when leaving the page.
 */
function useForceLightMode() {
  const originalThemeRef = useRef<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    // Store original theme class (dark or light)
    originalThemeRef.current = root.classList.contains('dark') ? 'dark' : 'light';

    // Force light mode immediately
    root.classList.remove('dark');
    root.classList.add('light');
    root.style.colorScheme = 'light';

    // Cleanup: restore original theme when leaving the page
    return () => {
      root.classList.remove('light', 'dark');
      if (originalThemeRef.current) {
        root.classList.add(originalThemeRef.current);
        root.style.colorScheme = originalThemeRef.current;
      }
    };
  }, []);
}

export function PricingPageClient() {
  const { isOpen, toggleOpen } = useChatStore();

  // Force light mode on this page
  useForceLightMode();

  return (
    <>
      <WizardContainer />
      <ChatBubble isOpen={isOpen} onClick={toggleOpen} />
      <ChatPanel isOpen={isOpen} />
    </>
  );
}

