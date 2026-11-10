import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Query keys
export const chatbotConfigKeys = {
  all: ['admin', 'chatbot-config'] as const,
};

// Types
export type AiProviderProtocol = 'OPENAI_CHAT_COMPLETION' | 'OPENAI_RESPONSE';

export const AI_PROVIDER_PROTOCOLS: Array<{
  value: AiProviderProtocol;
  label: string;
  endpoint: string;
}> = [
  {
    value: 'OPENAI_CHAT_COMPLETION',
    label: 'OpenAI Chat Completion',
    endpoint: '{BASE URL}/chat/completions',
  },
  {
    value: 'OPENAI_RESPONSE',
    label: 'OpenAI Response',
    endpoint: '{BASE URL}/responses',
  },
];

export interface ChatbotConfig {
  apiKey: string;
  baseUrl: string;
  protocol: AiProviderProtocol;
  primaryModel: string;
  fallbackModel: string;
  maxTokens: number;
  temperature: number;
  hasApiKey: boolean;
}

export interface UpdateChatbotConfigDto {
  apiKey?: string;
  baseUrl?: string;
  protocol?: AiProviderProtocol;
  primaryModel?: string;
  fallbackModel?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: {
    step: "key_validation" | "chat_test" | "connection";
    status?: number;
    model?: string;
    protocol?: string;
  };
}

// Hooks
export function useChatbotConfig() {
  return useQuery({
    queryKey: chatbotConfigKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<{ data: ChatbotConfig }>('/admin/settings/chatbot');
      // Handle both response shapes (with or without wrapper)
      const rawData = response.data?.data || response.data;
      return rawData as ChatbotConfig;
    },
  });
}

export function useUpdateChatbotConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateChatbotConfigDto) => {
      const response = await apiClient.patch('/admin/settings/chatbot', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: chatbotConfigKeys.all });
      toast.success('Đã lưu cấu hình thành công');
    },
    onError: () => {
      toast.error('Không thể lưu cấu hình');
    },
  });
}

export function useTestChatbotConnection() {
  return useMutation({
    mutationFn: async (payload: {
      apiKey: string;
      model?: string;
      baseUrl?: string;
      protocol?: AiProviderProtocol;
    }) => {
      const response = await apiClient.post<{ data: TestConnectionResult }>(
        '/admin/settings/chatbot/test',
        payload
      );
      // Handle both response shapes
      const result = response.data?.data || response.data;
      return result as TestConnectionResult;
    },
  });
}

