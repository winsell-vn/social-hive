export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface SSEChunkEvent {
  type: 'chunk';
  content: string;
}

export interface SSEDoneEvent {
  type: 'done';
  usage?: {
    model: string;
    promptTokens?: number;
    completionTokens?: number;
  };
}

export interface SSEErrorEvent {
  type: 'error';
  code: string;
  message: string;
}

export type SSEEvent = SSEChunkEvent | SSEDoneEvent | SSEErrorEvent;

