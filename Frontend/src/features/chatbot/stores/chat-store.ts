'use client';

import { create } from 'zustand';
import type { ChatMessage } from '../types/chat';

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isTyping: boolean;
  error: string | null;
  hasInteracted: boolean; // true after first user message (hides quick actions)
  isLoadingHistory: boolean; // true while fetching chat history on mount

  // Actions
  addMessage: (message: ChatMessage) => void;
  setMessages: (messages: ChatMessage[]) => void;
  updateLastAssistantMessage: (content: string) => void;
  finalizeLastAssistantMessage: () => void;
  setOpen: (open: boolean) => void;
  toggleOpen: () => void;
  setTyping: (typing: boolean) => void;
  setError: (error: string | null) => void;
  setHasInteracted: (value: boolean) => void;
  setLoadingHistory: (loading: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  messages: [],
  isOpen: false,
  isTyping: false,
  error: null,
  hasInteracted: false,
  isLoadingHistory: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  setMessages: (messages) => set({ messages }),

  updateLastAssistantMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        messages[messages.length - 1] = {
          ...lastMsg,
          content: lastMsg.content + content,
        };
      }
      return { messages };
    }),

  finalizeLastAssistantMessage: () =>
    set((state) => {
      const messages = [...state.messages];
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        messages[messages.length - 1] = {
          ...lastMsg,
          isStreaming: false,
        };
      }
      return { messages };
    }),

  setOpen: (open) => set({ isOpen: open }),
  toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
  setTyping: (typing) => set({ isTyping: typing }),
  setError: (error) => set({ error }),
  setHasInteracted: (value) => set({ hasInteracted: value }),
  setLoadingHistory: (loading) => set({ isLoadingHistory: loading }),
  reset: () =>
    set({
      messages: [],
      isTyping: false,
      error: null,
      hasInteracted: false,
      isLoadingHistory: false,
    }),
}));

