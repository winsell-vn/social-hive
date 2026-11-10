import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';

// Types

/**
 * Wire protocol used to talk to the provider endpoint.
 */
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

export interface AiProviderKey {
  id: string;
  name: string;
  /** Root of the OpenAI-compatible API, e.g. https://api.groq.com/openai/v1 */
  baseUrl: string;
  /** Model identifier understood by the provider */
  modelId: string;
  /** Wire protocol used to talk to the provider */
  protocol: AiProviderProtocol;
  isActive: boolean;
  maxAgents: number;
  agentCount: number;
  /** Masked key for display only */
  maskedKey: string;
  usageToday: number;
  usageTotal: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AiAgentPersonality {
  traits: string;
  tone: string;
  interests?: string[];
}

export interface AiAgent {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'DISABLED';
  personality: AiAgentPersonality | string;
  postFrequency: number;
  commentFrequency: number;
  reactionFrequency: number;
  totalPosts: number;
  totalComments: number;
  totalReactions: number;
  lastActiveAt: string | null;
  createdAt: string;
  user: {
    id: string;
    email: string;
    profile: {
      username: string;
      displayName: string | null;
      avatar: string | null;
    } | null;
  };
  apiKey: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

export interface ActivityLog {
  id: string;
  agentId: string;
  /** Agent relation returned by the backend (id + name) */
  agent: {
    id: string;
    name: string;
  } | null;
  actionType: string;
  /** Whether the action succeeded */
  success: boolean;
  /** Content filter verdict: PASSED | FILTERED | BLOCKED */
  filterResult: string;
  targetId: string | null;
  targetType: string | null;
  content: string | null;
  tokensUsed: number;
  errorMessage: string | null;
  createdAt: string;
}

export interface ActivityStats {
  total: number;
  success: number;
  failed: number;
  filtered: number;
  successRate: number;
  byActionType: Record<string, number>;
}

export interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

export interface DashboardData {
  apiKeys: { total: number; active: number };
  agents: { total: number; active: number; paused: number; disabled: number };
  queue: QueueStatus;
  activity: ActivityStats;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AgentFilters {
  status?: string;
  apiKeyId?: string;
  page?: number;
  limit?: number;
}

export interface CreateApiKeyData {
  name: string;
  apiKey: string;
  baseUrl?: string;
  modelId?: string;
  protocol?: AiProviderProtocol;
  maxAgents?: number;
}

export interface UpdateApiKeyData {
  name?: string;
  apiKey?: string;
  baseUrl?: string;
  modelId?: string;
  protocol?: AiProviderProtocol;
  isActive?: boolean;
  maxAgents?: number;
}

export interface CreateAgentData {
  apiKeyId: string;
  name: string;
  username: string;
  personality: {
    traits: string;
    tone: string;
    interests?: string[];
    writingStyle?: string;
  };
  postFrequency?: number;
  commentFrequency?: number;
  reactionFrequency?: number;
}

// Query keys
export const aiSeedingKeys = {
  all: ['ai-seeding'] as const,
  dashboard: () => [...aiSeedingKeys.all, 'dashboard'] as const,
  apiKeys: () => [...aiSeedingKeys.all, 'api-keys'] as const,
  apiKey: (id: string) => [...aiSeedingKeys.all, 'api-keys', id] as const,
  // Base key for invalidating all agent queries (regardless of filters)
  agentsBase: () => [...aiSeedingKeys.all, 'agents'] as const,
  agents: (filters?: AgentFilters) => [...aiSeedingKeys.all, 'agents', filters] as const,
  agent: (id: string) => [...aiSeedingKeys.all, 'agents', id] as const,
  queue: () => [...aiSeedingKeys.all, 'queue'] as const,
  activity: (params?: Record<string, unknown>) => [...aiSeedingKeys.all, 'activity', params] as const,
};

// API Base path
const API_BASE = '/admin/ai-seeding';

// Dashboard
export function useAiSeedingDashboard() {
  return useQuery({
    queryKey: aiSeedingKeys.dashboard(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: DashboardData }>(`${API_BASE}/dashboard`);
      return response.data.data;
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

// API Keys
export function useApiKeys() {
  return useQuery({
    queryKey: aiSeedingKeys.apiKeys(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: AiProviderKey[] }>(`${API_BASE}/api-keys`);
      return response.data.data;
    },
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateApiKeyData) => {
      const response = await apiClient.post<{ data: AiProviderKey }>(`${API_BASE}/api-keys`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.apiKeys() });
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.dashboard() });
    },
  });
}

export function useUpdateApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateApiKeyData }) => {
      const response = await apiClient.put<{ data: AiProviderKey }>(`${API_BASE}/api-keys/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.apiKeys() });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${API_BASE}/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.apiKeys() });
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.dashboard() });
    },
  });
}

export function useTestApiKey() {
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ data: { valid: boolean } }>(`${API_BASE}/api-keys/${id}/test`);
      return response.data.data;
    },
  });
}

// Agents
export function useAiAgents(filters?: AgentFilters) {
  return useQuery({
    queryKey: aiSeedingKeys.agents(filters),
    queryFn: async () => {
      const response = await apiClient.get<{ data: { agents: AiAgent[]; total: number; page: number; totalPages: number } }>(`${API_BASE}/agents`, {
        params: filters,
      });
      return response.data.data;
    },
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAgentData) => {
      const response = await apiClient.post<{ data: AiAgent }>(`${API_BASE}/agents`, data);
      return response.data.data;
    },
    onSuccess: () => {
      // Use agentsBase() to invalidate ALL agent queries regardless of filters
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.agentsBase() });
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.dashboard() });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AiAgent> }) => {
      const response = await apiClient.put<{ data: AiAgent }>(`${API_BASE}/agents/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      // Use agentsBase() to invalidate ALL agent queries regardless of filters
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.agentsBase() });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${API_BASE}/agents/${id}`);
    },
    onSuccess: () => {
      // Use agentsBase() to invalidate ALL agent queries regardless of filters
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.agentsBase() });
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.dashboard() });
    },
  });
}

export function usePauseAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ data: AiAgent }>(`${API_BASE}/agents/${id}/pause`);
      return response.data.data;
    },
    onSuccess: () => {
      // Use agentsBase() to invalidate ALL agent queries regardless of filters
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.agentsBase() });
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.dashboard() });
    },
  });
}

export function useResumeAgent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ data: AiAgent }>(`${API_BASE}/agents/${id}/resume`);
      return response.data.data;
    },
    onSuccess: () => {
      // Use agentsBase() to invalidate ALL agent queries regardless of filters
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.agentsBase() });
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.dashboard() });
    },
  });
}

export function useTriggerAgentAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      actionType,
      targetId,
      customPrompt,
    }: {
      id: string;
      actionType: 'POST' | 'COMMENT' | 'REACTION';
      targetId?: string;
      customPrompt?: string;
    }) => {
      const response = await apiClient.post<{ data: { jobId: string } }>(
        `${API_BASE}/agents/${id}/trigger`,
        { actionType, targetId, customPrompt }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.activity() });
    },
  });
}

// Queue
export function useQueueStatus() {
  return useQuery({
    queryKey: aiSeedingKeys.queue(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: QueueStatus }>(`${API_BASE}/queue/status`);
      return response.data.data;
    },
    staleTime: 10 * 1000, // 10 seconds
  });
}

export function usePauseQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post(`${API_BASE}/queue/pause`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.queue() });
    },
  });
}

export function useResumeQueue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post(`${API_BASE}/queue/resume`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.queue() });
    },
  });
}

// Activity
export function useActivityLogs(params?: { agentId?: string; actionType?: string; success?: boolean; filterResult?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: aiSeedingKeys.activity(params),
    queryFn: async () => {
      const response = await apiClient.get<{ data: { logs: ActivityLog[]; total: number; page: number; totalPages: number } }>(`${API_BASE}/activity`, {
        params,
      });
      return response.data.data;
    },
  });
}

export function useActivityStats(agentId?: string, days?: number) {
  return useQuery({
    queryKey: [...aiSeedingKeys.activity(), 'stats', agentId, days],
    queryFn: async () => {
      const response = await apiClient.get<{ data: ActivityStats }>(`${API_BASE}/activity/stats`, {
        params: { agentId, days },
      });
      return response.data.data;
    },
  });
}

// Hourly Activity Chart
export interface HourlyActivityData {
  hour: string;
  posts: number;
  comments: number;
  reactions: number;
  total: number;
}

export function useHourlyActivity(hours: number = 24) {
  return useQuery({
    queryKey: [...aiSeedingKeys.activity(), 'hourly', hours],
    queryFn: async () => {
      const response = await apiClient.get<{ data: HourlyActivityData[] }>(`${API_BASE}/activity/chart`, {
        params: { hours },
      });
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// Bulk Agent Operations
export interface BulkOperationResult {
  success: number;
  failed: number;
  errors: { agentId: string; error: string }[];
}

export function useBulkAgentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentIds, status }: { agentIds: string[]; status: 'ACTIVE' | 'PAUSED' | 'DISABLED' }) => {
      const response = await apiClient.post<{ data: BulkOperationResult }>(`${API_BASE}/agents/bulk-status`, {
        agentIds,
        status,
      });
      return response.data.data;
    },
    onSuccess: () => {
      // Use agentsBase() to invalidate ALL agent queries regardless of filters
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.agentsBase() });
      queryClient.invalidateQueries({ queryKey: aiSeedingKeys.dashboard() });
    },
  });
}

// Export Activity Logs to CSV
export async function exportActivityLogsCSV(params?: { agentId?: string; actionType?: string; success?: boolean; filterResult?: string; startDate?: string; endDate?: string }) {
  const response = await apiClient.get(`${API_BASE}/activity/export`, {
    params,
    responseType: 'blob',
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `ai-activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

