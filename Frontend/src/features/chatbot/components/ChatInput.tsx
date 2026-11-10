'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MAX_LENGTH = 1000;
const MAX_TEXTAREA_HEIGHT = 120;

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export function ChatInput({ onSend, disabled = false, autoFocus = false }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !disabled;

  // Auto-focus when autoFocus prop changes to true
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      // Small delay to ensure the panel animation has started
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  const handleSend = useCallback(() => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [canSend, value, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      if (newValue.length <= MAX_LENGTH) {
        setValue(newValue);
      }
      // Auto-resize
      const textarea = e.target;
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, MAX_TEXTAREA_HEIGHT) + 'px';
    },
    [],
  );

  return (
    <div className="border-t border-slate-200 bg-white rounded-b-2xl max-md:rounded-b-none">
      <div className="flex items-end gap-2 p-3">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          disabled={disabled}
          rows={1}
          className={cn(
            'flex-1 resize-none rounded-xl border border-slate-200',
            'bg-white px-3 py-2 text-sm',
            'text-slate-900',
            'placeholder:text-slate-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'max-h-[120px] min-h-[40px]',
          )}
          aria-label="Nhập tin nhắn"
        />
        <Button
          size="icon"
          className={cn(
            'h-10 w-10 shrink-0 rounded-xl transition-all',
            canSend
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed',
          )}
          onClick={handleSend}
          disabled={!canSend}
          aria-label="Gửi tin nhắn"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Character counter */}
      {value.length > 800 && (
        <div className="px-4 pb-2 text-right">
          <span
            className={cn(
              'text-xs',
              value.length > 950 ? 'text-red-500' : 'text-slate-400',
            )}
          >
            {value.length}/{MAX_LENGTH}
          </span>
        </div>
      )}
    </div>
  );
}

