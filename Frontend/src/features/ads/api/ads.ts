import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type { Ad, CreateAdInput, UpdateAdInput, AdFilters, AdPlacement, AdClickStats, AdsAnalytics } from '@/types/ad';
import type { PaginatedResponse } from '@/types/post';

// Query keys
export const adKeys = {
  all: ['ads'] as const,
  lists: () => [...adKeys.all, 'list'] as const,
  list: (filters?: AdFilters) => [...adKeys.lists(), filters] as const,
  public: (placement?: AdPlacement) => [...adKeys.all, 'public', placement] as const,
  detail: (id: string) => [...adKeys.all, 'detail', id] as const,
  analytics: () => [...adKeys.all, 'analytics'] as const,
};

/**
 * Fetch active ads for public display (feed/sidebar)
 * Note: Backend wraps response with TransformInterceptor: { success, data: Ad[], timestamp }
 */
export function usePublicAds(placement?: AdPlacement) {
  return useQuery({
    queryKey: adKeys.public(placement),
    queryFn: async () => {
      const params = placement ? { placement } : {};
      const response = await apiClient.get<{ data: Ad[] }>('/ads/public', { params });
      // Defensive: handle both wrapped { success, data: [...] } and direct array responses
      const rawData = response.data;
      return Array.isArray(rawData) ? rawData : (rawData?.data ?? []);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Fetch all ads with pagination (Admin)
 */
export function useAds(filters?: AdFilters, limit = 20) {
  return useInfiniteQuery({
    queryKey: adKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{ data: PaginatedResponse<Ad> }>('/ads', {
        params: { page: pageParam, limit, ...filters },
      });
      return response.data.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
  });
}

/**
 * Fetch single ad by ID (Admin)
 */
export function useAd(id: string) {
  return useQuery({
    queryKey: adKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<{ data: Ad }>(`/ads/${id}`);
      return response.data.data;
    },
    enabled: !!id,
  });
}

/**
 * Create new ad (Admin)
 */
export function useCreateAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAdInput) => {
      const response = await apiClient.post<{ data: Ad }>('/ads', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adKeys.public() });
    },
  });
}

/**
 * Update ad (Admin)
 */
export function useUpdateAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateAdInput }) => {
      const response = await apiClient.put<{ data: Ad }>(`/ads/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: adKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adKeys.public() });
    },
  });
}

/**
 * Toggle ad status (Admin)
 */
export function useToggleAdStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.patch<{ data: Ad }>(`/ads/${id}/toggle`);
      return response.data.data;
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: adKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adKeys.public() });
    },
  });
}

/**
 * Delete ad (Admin)
 */
export function useDeleteAd() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/ads/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adKeys.lists() });
      queryClient.invalidateQueries({ queryKey: adKeys.public() });
    },
  });
}

/**
 * Record an ad click (public)
 */
export function useRecordAdClick() {
  return useMutation({
    mutationFn: async (adId: string) => {
      await apiClient.post(`/ads/${adId}/click`);
    },
  });
}

/**
 * Fetch click analytics for all ads (Admin)
 */
export function useAdsAnalytics() {
  return useQuery({
    queryKey: adKeys.analytics(),
    queryFn: async () => {
      const response = await apiClient.get<AdsAnalytics>('/ads/analytics');
      return response.data;
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });
}

/**
 * Track an ad impression (public, fire-and-forget)
 * Plain async function (not a hook) for use in IntersectionObserver callbacks
 */
export async function trackAdImpression(adId: string): Promise<void> {
  try {
    await apiClient.post(`/ads/${adId}/impression`);
  } catch {
    // Silently fail - impression tracking is not critical
  }
}
