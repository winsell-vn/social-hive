'use client';

import { MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWizardStore } from '@/features/pricing/stores/wizard-store';
import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';

// Session storage key for greeting tooltip
const GREETING_SESSION_KEY = 'chatGreetingSession';

// Contextual messages based on current page
const GREETING_MESSAGES: Record<string, string> = {
  '/': 'Chào anh/chị! Em là trợ lý AI của ChungToiXayWeb. Cần tư vấn gì về thiết kế website không ạ? 😊',
  '/bang-gia': 'Anh/chị đang xem bảng giá? Click vào em để được tư vấn gói phù hợp nhất nhé! 💰',
  default: 'Dạ, anh/chị cần hỗ trợ gì thì click vào em nhé! Em sẵn sàng tư vấn 24/7 ạ 🙋',
};

interface ChatBubbleProps {
  isOpen: boolean;
  onClick: () => void;
}

export function ChatBubble({ isOpen, onClick }: ChatBubbleProps) {
  const { isQuoteSummaryExpanded, selectedItems } = useWizardStore();
  const pathname = usePathname();
  const [showGreeting, setShowGreeting] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Calculate if we need to move up (only on mobile when QuoteSummary is expanded)
  const hasSelectedItems = selectedItems.length > 0;

  // Get contextual message based on current page
  const greetingMessage = GREETING_MESSAGES[pathname] || GREETING_MESSAGES.default;

  // Dismiss greeting with exit animation
  const dismissGreeting = useCallback(() => {
    if (!showGreeting || isExiting) return;
    setIsExiting(true);
    // Mark as shown in session
    try {
      sessionStorage.setItem(GREETING_SESSION_KEY, JSON.stringify({ shown: true }));
    } catch {}
    // Wait for exit animation before hiding
    setTimeout(() => {
      setShowGreeting(false);
      setIsExiting(false);
    }, 200);
  }, [showGreeting, isExiting]);

  // Handle bubble click - dismiss greeting and open chat
  const handleBubbleClick = useCallback(() => {
    dismissGreeting();
    onClick();
  }, [dismissGreeting, onClick]);

  // Show greeting after delay (once per session)
  useEffect(() => {
    // Don't show if chat is open
    if (isOpen) {
      setShowGreeting(false);
      return;
    }

    // Check if already shown this session
    try {
      const session = sessionStorage.getItem(GREETING_SESSION_KEY);
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed.shown) return;
      }
    } catch {}

    // Show after 4 second delay
    const showTimer = setTimeout(() => {
      setShowGreeting(true);
    }, 4000);

    return () => clearTimeout(showTimer);
  }, [isOpen]);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (!showGreeting || isExiting) return;

    const autoDismissTimer = setTimeout(() => {
      dismissGreeting();
    }, 10000);

    return () => clearTimeout(autoDismissTimer);
  }, [showGreeting, isExiting, dismissGreeting]);

  // Dismiss on ESC key
  useEffect(() => {
    if (!showGreeting) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismissGreeting();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showGreeting, dismissGreeting]);

  // Dismiss when chat opens
  useEffect(() => {
    if (isOpen && showGreeting) {
      dismissGreeting();
    }
  }, [isOpen, showGreeting, dismissGreeting]);

  return (
    <>
      {/* Greeting Tooltip */}
      {showGreeting && !isOpen && (
        <div
          role="status"
          aria-live="polite"
          onClick={dismissGreeting}
          className={cn(
            'fixed z-50 max-w-[280px] p-3 pr-8 rounded-2xl cursor-pointer',
            // Glassmorphism
            'bg-white/95 backdrop-blur-[12px]',
            'border border-slate-200/50',
            'shadow-lg shadow-blue-500/10',
            // Text
            'text-sm text-slate-900 leading-relaxed',
            // Desktop position - above ChatBubble
            'bottom-[88px] right-6',
            // Mobile position - adjusts based on QuoteSummary expansion
            hasSelectedItems && isQuoteSummaryExpanded
              ? 'max-md:bottom-[calc(60vh+72px+env(safe-area-inset-bottom))]'
              : 'max-md:bottom-[calc(10rem+72px+env(safe-area-inset-bottom))]',
            'max-md:right-4',
            // Animation
            isExiting
              ? 'animate-out fade-out slide-out-to-bottom-2 duration-200'
              : 'animate-in fade-in slide-in-from-bottom-2 duration-300',
            // Reduced motion
            'motion-reduce:animate-none motion-reduce:transition-none',
          )}
        >
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismissGreeting();
            }}
            className={cn(
              'absolute top-2 right-2 h-5 w-5 flex items-center justify-center',
              'text-slate-400 hover:text-slate-600',
              'rounded-full hover:bg-slate-100',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/30',
              'transition-colors',
            )}
            aria-label="Đóng thông báo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
          {greetingMessage}
        </div>
      )}

      {/* Chat Bubble Button */}
      <button
        onClick={handleBubbleClick}
        className={cn(
          'fixed z-50 flex items-center justify-center rounded-full shadow-lg transition-all duration-300',
          // Position - Desktop
          'bottom-6 right-6',
          // Size
          'h-[60px] w-[60px]',
          // Mobile position - adjusts based on QuoteSummary expansion
          'max-md:h-14 max-md:w-14 max-md:right-4',
          // Mobile bottom position: move up when QuoteSummary is expanded
          hasSelectedItems && isQuoteSummaryExpanded
            ? 'max-md:bottom-[calc(60vh+env(safe-area-inset-bottom))]'
            : 'max-md:bottom-[calc(10rem+env(safe-area-inset-bottom))]',
          // Hide on mobile when chat is open (fullscreen mode)
          isOpen && 'max-md:hidden',
          // Colors
          'bg-blue-600 hover:bg-blue-700 text-white',
          // Hover & focus
          'hover:scale-105 active:scale-95',
          'focus:outline-none focus:ring-4 focus:ring-blue-500/30',
          // Shadow
          'shadow-blue-600/30 hover:shadow-blue-600/40 shadow-xl',
          // Pulse animation when closed
          !isOpen && 'animate-pulse-subtle',
        )}
        aria-label={isOpen ? 'Đóng chat' : 'Mở chat với Hưng DPS'}
        title="Chat với Hưng DPS"
      >
        {isOpen ? (
          <X className="h-6 w-6 transition-transform duration-200" />
        ) : (
          <MessageCircle className="h-6 w-6 transition-transform duration-200" />
        )}
      </button>
    </>
  );
}

