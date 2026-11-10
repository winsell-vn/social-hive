import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type {
  UserReputation,
  TiersResponse,
  PaginatedKarmaHistory,
  KarmaActionType,
} from '@/types/reputation'

// Query keys
export const reputationKeys = {
  all: ['reputation'] as const,
  me: () => [...reputationKeys.all, 'me'] as const,
  history: (filters?: { action?: KarmaActionType }) =>
    [...reputationKeys.all, 'history', filters] as const,
  tiers: () => [...reputationKeys.all, 'tiers'] as const,
}

/**
 * Fetch current user's reputation info
 * GET /reputation/me
 */
export function useMyReputation() {
  return useQuery({
    queryKey: reputationKeys.me(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: UserReputation }>('/reputation/me')
      return response.data.data
    },
  })
}

/**
 * Fetch karma transaction history (paginated)
 * GET /reputation/history
 */
export function useKarmaHistory(action?: KarmaActionType, limit = 20) {
  return useInfiniteQuery({
    queryKey: reputationKeys.history({ action }),
    queryFn: async ({ pageParam = 1 }) => {
      const params: Record<string, unknown> = { page: pageParam, limit }
      if (action) {
        params.action = action
      }
      const response = await apiClient.get<{ data: PaginatedKarmaHistory }>(
        '/reputation/history',
        { params }
      )
      return response.data.data
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
  })
}

/**
 * Fetch tier definitions (public endpoint)
 * GET /reputation/tiers
 */
export function useTierDefinitions() {
  return useQuery({
    queryKey: reputationKeys.tiers(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: TiersResponse }>('/reputation/tiers')
      return response.data.data
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (tier definitions rarely change)
  })
}

