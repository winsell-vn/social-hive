import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'sonner';

// Query keys
export const emailConfigKeys = {
  all: ['admin', 'email-config'] as const,
};

// Types
export interface EmailConfig {
  /** Masked API key for display purposes */
  apiKey: string;
  /** Sender address */
  from: string;
  /** When disabled, registrations are activated immediately without email */
  verificationRequired: boolean;
  /** True when an API key is available */
  hasApiKey: boolean;
  /** Where the API key comes from: "db" (admin override) or "env" */
  source: 'db' | 'env';
}

export interface UpdateEmailConfigDto {
  apiKey?: string;
  from?: string;
  verificationRequired?: boolean;
}

export interface TestEmailResult {
  success: boolean;
  message: string;
  details?: { id?: string };
}

// Hooks
export function useEmailConfig() {
  return useQuery({
    queryKey: emailConfigKeys.all,
    queryFn: async () => {
      const response = await apiClient.get<{ data: EmailConfig }>('/admin/settings/email');
      const rawData = response.data?.data || response.data;
      return rawData as EmailConfig;
    },
  });
}

export function useUpdateEmailConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpdateEmailConfigDto) => {
      const response = await apiClient.patch('/admin/settings/email', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: emailConfigKeys.all });
      toast.success('Đã lưu cấu hình email thành công');
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : 'Không thể lưu cấu hình email'
      );
    },
  });
}

export function useTestEmail() {
  return useMutation({
    mutationFn: async (to: string) => {
      const response = await apiClient.post<{ data: TestEmailResult }>(
        '/admin/settings/email/test',
        { to }
      );
      const result = response.data?.data || response.data;
      return result as TestEmailResult;
    },
  });
}
