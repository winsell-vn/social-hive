'use client';

import { useEffect, useRef, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { ChatMessage as ChatMessageType } from '../types/chat';
import { parseActions } from '../utils/action-parser';
import { executeActions } from '../utils/action-executor';

interface ChatMessageProps {
  message: ChatMessageType;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const actionsExecutedRef = useRef(false);

  // Parse actions from assistant messages
  const { cleanContent, actions } = useMemo(() => {
    if (message.role === 'assistant') {
      return parseActions(message.content);
    }
    return { cleanContent: message.content, actions: [] };
  }, [message.role, message.content]);

  // Execute actions when message is finalized (not streaming)
  useEffect(() => {
    if (
      message.role === 'assistant' &&
      actions.length > 0 &&
      !message.isStreaming &&
      !actionsExecutedRef.current
    ) {
      actionsExecutedRef.current = true;
      executeActions(actions);
    }
  }, [message.role, message.isStreaming, actions]);

  // Reset the ref when message ID changes (new message)
  useEffect(() => {
    actionsExecutedRef.current = false;
  }, [message.id]);

  return (
    <div
      className={cn(
        'flex gap-2 animate-in fade-in slide-in-from-bottom-2 duration-200',
        isUser ? 'flex-row-reverse' : 'flex-row',
      )}
    >
      {/* Avatar - only for assistant */}
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0 mt-1">
          <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">
            H
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed break-words',
          'md:max-w-[85%]',
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-blue-50 text-slate-900 rounded-bl-md',
        )}
      >
        {/* Message content - use cleanContent for assistant messages */}
        <div className="whitespace-pre-wrap">{cleanContent}</div>

        {/* Streaming indicator */}
        {message.isStreaming && !message.content && (
          <TypingIndicator />
        )}

        {/* Blinking cursor while streaming */}
        {message.isStreaming && message.content && (
          <span className="inline-block w-0.5 h-4 bg-current animate-pulse ml-0.5 align-text-bottom" />
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1 px-1">
      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
      <span className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
    </div>
  );
}

