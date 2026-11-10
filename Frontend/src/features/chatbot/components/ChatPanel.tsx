'use client';

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChat } from '../hooks/useChat';
import { ChatHeader } from './ChatHeader';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

interface ChatPanelProps {
  isOpen: boolean;
}

export function ChatPanel({ isOpen }: ChatPanelProps) {
  const {
    messages,
    isTyping,
    error,
    isLoadingHistory,
    sendMessage,
    setOpen,
    resetChat,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col',
        // Desktop: fixed panel bottom-right
        'bottom-24 right-6 w-[380px] h-[600px] rounded-2xl',
        // Mobile: fullscreen (100dvh for mobile browser compatibility)
        'max-md:inset-0 max-md:w-[100vw] max-md:h-[100dvh] max-md:rounded-none',
        // Explicit light-mode colors (chat is used on pricing page which forces light mode)
        'bg-white/95 backdrop-blur-xl',
        'shadow-2xl shadow-black/20',
        'border border-slate-200/50',
        // Animation
        'animate-in fade-in slide-in-from-bottom-4 duration-300',
      )}
      role="dialog"
      aria-label="Chat với Hưng DPS"
    >
      {/* Header */}
      <ChatHeader
        onClose={() => setOpen(false)}
        onReset={resetChat}
      />

      {/* Messages Area */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-3 p-4">
          {/* Loading history indicator */}
          {isLoadingHistory && messages.length === 0 && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-3">
                <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
              </div>
              <p className="text-xs text-slate-500">
                Đang tải lịch sử trò chuyện...
              </p>
            </div>
          )}

          {/* Welcome message - only show when not loading and no messages */}
          {!isLoadingHistory && messages.length === 0 && (
            <div className="text-center py-6">
              <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-3">
                <span className="text-2xl">👋</span>
              </div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">
                Xin chào! Mình là Hưng DPS
              </h4>
              <p className="text-xs text-slate-500 max-w-[260px] mx-auto">
                Chuyên gia lập trình & BA tại ChúngTôiXâyWeb. Mình có thể giúp bạn tìm gói dịch vụ phù hợp!
              </p>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}

          {/* Error message */}
          {error && (
            <div className="mx-auto px-3 py-2 rounded-lg bg-red-50 text-red-600 text-xs text-center max-w-[90%]">
              {error}
            </div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input - autoFocus when panel opens */}
      <ChatInput onSend={sendMessage} disabled={isTyping} autoFocus={isOpen} />
    </div>
  );
}

