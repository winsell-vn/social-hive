import { getCsrfTokenFromCookie } from '@/lib/api-client';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export interface ChatHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SendMessageParams {
  sessionId: string;
  message: string;
  language?: 'vi' | 'en';
}

export interface StreamCallbacks {
  onChunk: (content: string) => void;
  onDone: (usage?: { model: string }) => void;
  onError: (code: string, message: string) => void;
  onAction?: (action: { type: string; params: Record<string, string> }) => void;
}

export async function sendChatMessage(
  params: SendMessageParams,
  callbacks: StreamCallbacks,
  signal?: AbortSignal,
): Promise<void> {
  const csrfToken = getCsrfTokenFromCookie();

  const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
    },
    body: JSON.stringify(params),
    credentials: 'include',
    signal,
  });

  if (!response.ok) {
    // Try to parse SSE error from body
    const text = await response.text();
    try {
      // SSE format: "data: {...}\n\n"
      const dataLine = text.split('\n').find((l) => l.startsWith('data: '));
      if (dataLine) {
        const data = JSON.parse(dataLine.slice(6));
        if (data.type === 'error') {
          callbacks.onError(data.code, data.message);
          return;
        }
      }
    } catch {
      // Ignore parse errors
    }
    callbacks.onError('HTTP_ERROR', `Request failed with status ${response.status}`);
    return;
  }

  if (!response.body) {
    callbacks.onError('NO_BODY', 'Response body is empty');
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const jsonStr = trimmed.slice(6);
        try {
          const data = JSON.parse(jsonStr);

          switch (data.type) {
            case 'chunk':
              callbacks.onChunk(data.content);
              break;
            case 'done':
              callbacks.onDone(data.usage);
              break;
            case 'error':
              callbacks.onError(data.code, data.message);
              return;
            case 'action':
              // Tool call from AI - execute action
              callbacks.onAction?.({
                type: data.actionType,
                params: data.params,
              });
              break;
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }

    // Process any remaining buffer
    if (buffer.trim().startsWith('data: ')) {
      try {
        const data = JSON.parse(buffer.trim().slice(6));
        if (data.type === 'done') callbacks.onDone(data.usage);
        else if (data.type === 'error') callbacks.onError(data.code, data.message);
      } catch {
        // Ignore
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Fetch chat history for a session from the backend
 * Used to restore chat messages after page refresh
 */
export async function fetchChatHistory(sessionId: string): Promise<ChatHistoryMessage[]> {
  if (!sessionId) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/chatbot/history/${sessionId}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      return [];
    }
    const data = await response.json();
    // Handle both wrapped response format (data.data.messages) and direct format (data.messages)
    const messages = data?.data?.messages ?? data?.messages;
    return Array.isArray(messages) ? messages : [];
  } catch (error) {
    console.error('Failed to fetch chat history:', error);
    return [];
  }
}

