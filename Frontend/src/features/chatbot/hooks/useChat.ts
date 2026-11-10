'use client';

import { useCallback, useRef, useEffect } from 'react';
import { useChatStore } from '../stores/chat-store';
import { useChatSession } from './useChatSession';
import { sendChatMessage, fetchChatHistory } from '../api/chat';
import { executeAction } from '../utils/action-executor';
import type { ChatMessage } from '../types/chat';
import type { ChatActionType } from '../utils/action-parser';

export function useChat() {
  const { sessionId, resetSession } = useChatSession();
  const {
    messages,
    isOpen,
    isTyping,
    error,
    hasInteracted,
    isLoadingHistory,
    addMessage,
    setMessages,
    updateLastAssistantMessage,
    finalizeLastAssistantMessage,
    setOpen,
    toggleOpen,
    setTyping,
    setError,
    setHasInteracted,
    setLoadingHistory,
    reset,
  } = useChatStore();

  const abortControllerRef = useRef<AbortController | null>(null);
  const historyLoadedRef = useRef<string | null>(null); // Track which sessionId we've loaded history for

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Load chat history on mount when sessionId is available
  useEffect(() => {
    // Skip if no sessionId or already loaded for this session
    if (!sessionId || historyLoadedRef.current === sessionId) {
      return;
    }

    // Skip if we already have messages (avoid overwriting current conversation)
    if (messages.length > 0) {
      historyLoadedRef.current = sessionId;
      return;
    }

    const loadHistory = async () => {
      setLoadingHistory(true);
      try {
        const history = await fetchChatHistory(sessionId);
        if (history.length > 0) {
          // Convert history messages to ChatMessage format
          const chatMessages: ChatMessage[] = history.map((msg) => ({
            id: crypto.randomUUID(),
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
            timestamp: msg.timestamp || Date.now(),
          }));
          setMessages(chatMessages);
          setHasInteracted(true);
        }
      } catch (error) {
        console.error('Failed to load chat history:', error);
      } finally {
        setLoadingHistory(false);
        historyLoadedRef.current = sessionId;
      }
    };

    loadHistory();
  }, [sessionId, messages.length, setMessages, setHasInteracted, setLoadingHistory]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || !sessionId || isTyping) return;

      // Clear any previous error
      setError(null);
      setHasInteracted(true);

      // Add user message
      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      };
      addMessage(userMessage);

      // Add placeholder assistant message
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        isStreaming: true,
      };
      addMessage(assistantMessage);
      setTyping(true);

      // Abort previous request if any
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        await sendChatMessage(
          {
            sessionId,
            message: text.trim(),
          },
          {
            onChunk: (content) => {
              updateLastAssistantMessage(content);
            },
            onDone: () => {
              finalizeLastAssistantMessage();
              setTyping(false);
            },
            onError: (code, message) => {
              finalizeLastAssistantMessage();
              setTyping(false);
              setError(message);
            },
            onAction: (action) => {
              // Execute tool-based actions from AI
              executeAction({
                type: action.type as ChatActionType,
                params: action.params,
              });
            },
          },
          abortControllerRef.current.signal,
        );
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        finalizeLastAssistantMessage();
        setTyping(false);
        setError('Đã xảy ra lỗi kết nối. Vui lòng thử lại.');
      }
    },
    [
      sessionId,
      isTyping,
      addMessage,
      updateLastAssistantMessage,
      finalizeLastAssistantMessage,
      setTyping,
      setError,
      setHasInteracted,
    ],
  );

  const resetChat = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    reset();
    resetSession();
    historyLoadedRef.current = null; // Allow history to be loaded for new session
  }, [reset, resetSession]);

  return {
    messages,
    isOpen,
    isTyping,
    error,
    hasInteracted,
    isLoadingHistory,
    sessionId,
    sendMessage,
    setOpen,
    toggleOpen,
    resetChat,
  };
}

