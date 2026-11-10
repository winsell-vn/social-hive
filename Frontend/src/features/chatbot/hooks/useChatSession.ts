'use client';

import { useCallback, useEffect, useState } from 'react';

const SESSION_KEY = 'chatbot_session_id';

function generateUUID(): string {
  return crypto.randomUUID();
}

export function useChatSession() {
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Check for existing session
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) {
      setSessionId(existing);
    } else {
      const newId = generateUUID();
      sessionStorage.setItem(SESSION_KEY, newId);
      setSessionId(newId);
    }
  }, []);

  const resetSession = useCallback(() => {
    const newId = generateUUID();
    sessionStorage.setItem(SESSION_KEY, newId);
    setSessionId(newId);
  }, []);

  return { sessionId, resetSession };
}

