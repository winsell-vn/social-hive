import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type {
  Friend,
  FriendRequest,
  FriendshipStatus,
  FriendCounts,
  FriendSuggestion,
  PendingRequestsResponse,
  FriendsPaginatedResponse,
} from "../types/friend";

export const friendKeys = {
  all: ["friends"] as const,
  lists: () => [...friendKeys.all, "list"] as const,
  list: (search?: string) => [...friendKeys.lists(), { search }] as const,
  userList: (userId: string, search?: string) =>
    [...friendKeys.all, "user", userId, { search }] as const,
  requests: () => [...friendKeys.all, "requests"] as const,
  suggestions: () => [...friendKeys.all, "suggestions"] as const,
  status: (userId: string) => [...friendKeys.all, "status", userId] as const,
  counts: () => [...friendKeys.all, "counts"] as const,
};

interface UseFriendsOptions {
  enabled?: boolean;
}

export function useFriends(search?: string, limit = 20, options?: UseFriendsOptions) {
  const { isAuthenticated, hydrated } = useAuth();
  const isEnabled = options?.enabled ?? true;

  return useInfiniteQuery({
    queryKey: friendKeys.list(search),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{ data: FriendsPaginatedResponse }>(
        "/friends",
        {
          params: {
            page: pageParam,
            limit,
            search,
          },
        }
      );
      return response.data.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    enabled: isAuthenticated && hydrated && isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent refetching on tab switches
  });
}

export function useUserFriends(userId: string, search?: string, limit = 10) {
  const { isAuthenticated, hydrated } = useAuth();

  return useInfiniteQuery({
    queryKey: friendKeys.userList(userId, search),
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams({
        page: pageParam.toString(),
        limit: limit.toString(),
      });
      if (search) params.append("search", search);

      const response = await apiClient.get<{ data: FriendsPaginatedResponse }>(
        `/friends/user/${userId}?${params}`
      );
      return response.data.data;
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    enabled: isAuthenticated && hydrated && !!userId,
  });
}

interface UsePendingRequestsOptions {
  enabled?: boolean;
}

export function usePendingRequests(options?: UsePendingRequestsOptions) {
  const { isAuthenticated, hydrated } = useAuth();
  const isEnabled = options?.enabled ?? true;

  return useQuery({
    queryKey: friendKeys.requests(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: PendingRequestsResponse }>(
        "/friends/requests"
      );
      return response.data.data;
    },
    enabled: isAuthenticated && hydrated && isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent refetching on tab switches
  });
}

interface UseFriendSuggestionsOptions {
  enabled?: boolean;
}

export function useFriendSuggestions(options?: UseFriendSuggestionsOptions) {
  const { isAuthenticated, hydrated } = useAuth();
  const isEnabled = options?.enabled ?? true;

  return useQuery({
    queryKey: friendKeys.suggestions(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: FriendSuggestion[] }>(
        "/friends/suggestions"
      );
      return response.data.data;
    },
    enabled: isAuthenticated && hydrated && isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent refetching on tab switches
  });
}

export function useFriendshipStatus(userId: string) {
  const { isAuthenticated, hydrated } = useAuth();

  return useQuery({
    queryKey: friendKeys.status(userId),
    queryFn: async () => {
      const response = await apiClient.get<{ data: FriendshipStatus }>(
        `/friends/status/${userId}`
      );
      return response.data.data;
    },
    enabled: isAuthenticated && hydrated && !!userId,
  });
}

export function useFriendCounts() {
  const { isAuthenticated, hydrated } = useAuth();

  return useQuery({
    queryKey: friendKeys.counts(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: FriendCounts }>(
        "/friends/count"
      );
      return response.data.data;
    },
    enabled: isAuthenticated && hydrated,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent unnecessary refetching
  });
}

export function useSendFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post<{ data: FriendRequest }>(
        `/friends/request/${userId}`
      );
      return response.data.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
      queryClient.invalidateQueries({ queryKey: friendKeys.status(userId) });
    },
  });
}

export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiClient.post<{ data: FriendRequest }>(
        `/friends/accept/${requestId}`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  });
}

export function useRejectFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiClient.post<{ data: FriendRequest }>(
        `/friends/reject/${requestId}`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  });
}

export function useCancelFriendRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId: string) => {
      const response = await apiClient.delete<{ data: { success: boolean } }>(
        `/friends/cancel/${requestId}`
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
    },
  });
}

export function useUnfriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.delete<{ data: { success: boolean } }>(
        `/friends/${userId}`
      );
      return response.data.data;
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
      queryClient.invalidateQueries({ queryKey: friendKeys.status(userId) });
    },
  });
}

