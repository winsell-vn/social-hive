import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { pricingKeys } from './pricing';
import type {
  Service,
  PricingTier,
  PricingFAQ,
  QuoteRequest,
  ServiceCategoryAdmin,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateServiceInput,
  UpdateServiceInput,
  CreateTierInput,
  UpdateTierInput,
  CreateFaqInput,
  UpdateFaqInput,
  UpdateQuoteStatusInput,
} from '@/types/pricing';

export const pricingAdminKeys = {
  all: ['pricing-admin'] as const,
  categories: () => [...pricingAdminKeys.all, 'categories'] as const,
  category: (id: string) => [...pricingAdminKeys.all, 'categories', id] as const,
  services: () => [...pricingAdminKeys.all, 'services'] as const,
  service: (id: string) => [...pricingAdminKeys.all, 'services', id] as const,
  tiers: (serviceId?: string) => [...pricingAdminKeys.all, 'tiers', serviceId] as const,
  tier: (id: string) => [...pricingAdminKeys.all, 'tiers', 'detail', id] as const,
  faqs: () => [...pricingAdminKeys.all, 'faqs'] as const,
  quotes: (filters?: Record<string, unknown>) => [...pricingAdminKeys.all, 'quotes', filters] as const,
  quote: (id: string) => [...pricingAdminKeys.all, 'quotes', id] as const,
};

// Categories hooks
export function useCategories() {
  return useQuery({
    queryKey: pricingAdminKeys.categories(),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiClient.get<{ data: any }>('/pricing/categories');
      const rawData = response.data?.data?.data || response.data?.data;
      return (Array.isArray(rawData) ? rawData : []) as ServiceCategoryAdmin[];
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCategoryInput) => {
      const response = await apiClient.post('/pricing/categories', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.categories() });
      // Also invalidate public pricing cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.public() });
      queryClient.invalidateQueries({ queryKey: pricingKeys.publicCategories() });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateCategoryInput }) => {
      const response = await apiClient.put(`/pricing/categories/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.categories() });
      // Also invalidate public pricing cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.public() });
      queryClient.invalidateQueries({ queryKey: pricingKeys.publicCategories() });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/pricing/categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.categories() });
      // Also invalidate public pricing cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.public() });
      queryClient.invalidateQueries({ queryKey: pricingKeys.publicCategories() });
    },
  });
}

export function useToggleCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(`/pricing/categories/${id}/toggle`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.categories() });
      // Also invalidate public pricing cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.public() });
      queryClient.invalidateQueries({ queryKey: pricingKeys.publicCategories() });
    },
  });
}

// Services hooks
export function useServices() {
  return useQuery({
    queryKey: pricingAdminKeys.services(),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiClient.get<{ data: any }>('/pricing/services');
      // Handle triple-nesting: response.data.data may be { data: [...] } or [...] directly
      const rawData = response.data?.data?.data || response.data?.data;
      return (Array.isArray(rawData) ? rawData : []) as Service[];
    },
  });
}

export function useCreateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateServiceInput) => {
      const response = await apiClient.post('/pricing/services', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.services() });
      // Also invalidate public pricing cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.public() });
    },
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateServiceInput }) => {
      const response = await apiClient.put(`/pricing/services/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.services() });
      // Also invalidate public pricing cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.public() });
    },
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/pricing/services/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.services() });
      // Also invalidate public pricing cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.public() });
    },
  });
}

export function useToggleService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch(`/pricing/services/${id}/toggle`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.services() });
      // Also invalidate public pricing cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.public() });
    },
  });
}

// Tiers hooks
export function useTiers(serviceId?: string) {
  return useQuery({
    queryKey: pricingAdminKeys.tiers(serviceId),
    queryFn: async () => {
      const params = serviceId ? `?serviceId=${serviceId}` : '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiClient.get<{ data: any }>(`/pricing/tiers${params}`);
      // Handle triple-nesting: response.data.data may be { data: [...] } or [...] directly
      const rawData = response.data?.data?.data || response.data?.data;
      return (Array.isArray(rawData) ? rawData : []) as PricingTier[];
    },
  });
}

export function useCreateTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTierInput) => {
      const response = await apiClient.post('/pricing/tiers', data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate all tier queries (with any serviceId filter)
      queryClient.invalidateQueries({ queryKey: [...pricingAdminKeys.all, 'tiers'] });
      // Also invalidate public pricing cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.public() });
    },
  });
}

export function useUpdateTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTierInput }) => {
      const response = await apiClient.put(`/pricing/tiers/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      // Invalidate all tier queries (with any serviceId filter)
      queryClient.invalidateQueries({ queryKey: [...pricingAdminKeys.all, 'tiers'] });
      // Also invalidate public pricing cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.public() });
    },
  });
}

export function useDeleteTier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/pricing/tiers/${id}`);
    },
    onSuccess: () => {
      // Invalidate all tier queries (with any serviceId filter)
      queryClient.invalidateQueries({ queryKey: [...pricingAdminKeys.all, 'tiers'] });
      // Also invalidate public pricing cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.public() });
    },
  });
}

// FAQs hooks
export function useFaqs() {
  return useQuery({
    queryKey: pricingAdminKeys.faqs(),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiClient.get<{ data: any }>('/pricing/faqs');
      // Handle triple-nesting: response.data.data may be { data: [...] } or [...] directly
      const rawData = response.data?.data?.data || response.data?.data;
      return (Array.isArray(rawData) ? rawData : []) as PricingFAQ[];
    },
  });
}

export function useCreateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateFaqInput) => {
      const response = await apiClient.post('/pricing/faqs', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.faqs() });
      // Also invalidate public FAQs cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.faqs() });
    },
  });
}

export function useUpdateFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateFaqInput }) => {
      const response = await apiClient.put(`/pricing/faqs/${id}`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.faqs() });
      // Also invalidate public FAQs cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.faqs() });
    },
  });
}

export function useDeleteFaq() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/pricing/faqs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.faqs() });
      // Also invalidate public FAQs cache
      queryClient.invalidateQueries({ queryKey: pricingKeys.faqs() });
    },
  });
}

// Quotes hooks
export function useQuotes(filters?: { status?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: pricingAdminKeys.quotes(filters),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      if (filters?.page) params.append('page', String(filters.page));
      if (filters?.limit) params.append('limit', String(filters.limit));
      const queryString = params.toString() ? `?${params.toString()}` : '';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiClient.get<{ data: any }>(`/pricing/quotes${queryString}`);
      // Handle triple-nesting: response.data.data may be { data: {...} } or {...} directly
      const rawData = response.data?.data?.data || response.data?.data;
      // New paginated response format: { data: [...], total, page, limit }
      if (rawData && typeof rawData === 'object' && 'data' in rawData && 'total' in rawData) {
        return {
          data: (Array.isArray(rawData.data) ? rawData.data : []) as QuoteRequest[],
          total: rawData.total as number,
          page: rawData.page as number,
          limit: rawData.limit as number,
        };
      }
      // Fallback for old format (array directly)
      return {
        data: (Array.isArray(rawData) ? rawData : []) as QuoteRequest[],
        total: Array.isArray(rawData) ? rawData.length : 0,
        page: 1,
        limit: 20,
      };
    },
  });
}

export function useQuote(id: string) {
  return useQuery({
    queryKey: pricingAdminKeys.quote(id),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiClient.get<{ data: any }>(`/pricing/quotes/${id}`);
      // Handle triple-nesting: response.data.data may be { data: {...} } or {...} directly
      const rawData = response.data?.data?.data || response.data?.data;
      return rawData as QuoteRequest;
    },
    enabled: !!id,
  });
}

export function useUpdateQuoteStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateQuoteStatusInput }) => {
      const response = await apiClient.patch(`/pricing/quotes/${id}/status`, data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.quotes() });
    },
  });
}

export function useDeleteQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/pricing/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pricingAdminKeys.quotes() });
    },
  });
}

/**
 * Export quotes to CSV file
 */
export async function exportQuotesCSV(params?: { status?: string; startDate?: string; endDate?: string }) {
  const response = await apiClient.get('/pricing/quotes/export', {
    params,
    responseType: 'blob',
  });

  // Create download link
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `quotes-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

