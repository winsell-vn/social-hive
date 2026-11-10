import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import type {
  PlatformStats,
  PendingPost,
  UserManagement,
  ModerationAction,
  PaginatedResponse,
  UserFilters,
} from '../types/admin';

// Query keys
export const adminKeys = {
  all: ['admin'] as const,
  stats: () => [...adminKeys.all, 'stats'] as const,
  pendingPosts: () => [...adminKeys.all, 'pending-posts'] as const,
  users: (filters?: UserFilters) => [...adminKeys.all, 'users', filters] as const,
};

// Fetch platform stats
export function usePlatformStats() {
  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: PlatformStats }>('/admin/analytics');
      return response.data.data;
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

// Fetch pending posts with pagination
export function usePendingPosts(limit = 10) {
  return useInfiniteQuery({
    queryKey: adminKeys.pendingPosts(),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{ data: PaginatedResponse<PendingPost> }>(
        '/admin/moderation/queue',
        { params: { page: pageParam, limit } }
      );
      return response.data.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
  });
}

// Moderate post (approve/reject)
export function useModeratePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, action, reason }: ModerationAction) => {
      const endpoint = action === 'APPROVE'
        ? `/admin/moderation/${postId}/approve`
        : `/admin/moderation/${postId}/reject`;
      
      const response = await apiClient.post(endpoint, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.pendingPosts() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

// Fetch users with pagination and filters
export function useUsers(filters?: UserFilters, limit = 10) {
  return useInfiniteQuery({
    queryKey: adminKeys.users(filters),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{ data: PaginatedResponse<UserManagement> }>(
        '/admin/users',
        { params: { page: pageParam, limit, ...filters } }
      );
      return response.data.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
  });
}

// Ban user
export function useBanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.patch(`/admin/users/${userId}`, { isBanned: true });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
      queryClient.invalidateQueries({ queryKey: adminKeys.stats() });
    },
  });
}

// Unban user
export function useUnbanUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.patch(`/admin/users/${userId}`, { isBanned: false });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

// Change user role
export function useChangeUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN' }) => {
      const response = await apiClient.patch(`/admin/users/${userId}`, { role });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.users() });
    },
  });
}

