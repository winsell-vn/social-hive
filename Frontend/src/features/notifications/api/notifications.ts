import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type {
  Notification,
  NotificationPaginatedResponse,
  UnreadCountResponse,
  NotificationType,
} from "../types/notification";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (filters?: { unreadOnly?: boolean; type?: NotificationType }) =>
    [...notificationKeys.lists(), filters] as const,
  unreadCount: () => [...notificationKeys.all, "unreadCount"] as const,
};

export function useNotifications(
  options?: { unreadOnly?: boolean; type?: NotificationType },
  limit = 20,
) {
  const { isAuthenticated, hydrated } = useAuth();

  return useInfiniteQuery({
    queryKey: notificationKeys.list(options),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{
        data: NotificationPaginatedResponse;
      }>("/notifications", {
        params: {
          page: pageParam,
          limit,
          unreadOnly: options?.unreadOnly,
          type: options?.type,
        },
      });
      return response.data.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    // Only fetch notifications when user is authenticated and hydrated
    enabled: isAuthenticated && hydrated,
  });
}

export function useUnreadCount() {
  const { isAuthenticated, hydrated } = useAuth();

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: UnreadCountResponse }>(
        "/notifications/unread-count",
      );
      return response.data.data;
    },
    // Only fetch unread count when user is authenticated and hydrated
    enabled: isAuthenticated && hydrated,
    staleTime: 30000, // 30 seconds - data considered fresh
    refetchInterval: isAuthenticated ? 60000 : false, // Poll every 60 seconds when authenticated (reduced from 30s)
    refetchOnWindowFocus: false, // Don't refetch on tab switch to reduce API calls
  });
}

export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const response = await apiClient.patch<{ data: Notification }>(
        `/notifications/${notificationId}/read`,
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.patch<{ data: { count: number } }>(
        "/notifications/read-all",
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.delete(`/notifications/${notificationId}`);
      return notificationId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
