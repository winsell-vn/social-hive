import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type {
  SearchResults,
  SearchSuggestions,
  SearchType,
  TrendingHashtag,
} from '../types/search'

// Query keys
export const searchKeys = {
  all: ['search'] as const,
  results: (query: string, type: SearchType) => [...searchKeys.all, 'results', query, type] as const,
  suggestions: (query: string) => [...searchKeys.all, 'suggestions', query] as const,
  trending: () => [...searchKeys.all, 'trending'] as const,
}

// Search query
export function useSearch(query: string, type: SearchType = 'all', limit = 10) {
  return useInfiniteQuery({
    queryKey: searchKeys.results(query, type),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{ data: SearchResults }>('/search', {
        params: { q: query, type, page: pageParam, limit },
      })
      return response.data.data
    },
    getNextPageParam: (lastPage, allPages) => {
      // Check if any result type has more pages
      const posts = lastPage.posts
      const users = lastPage.users
      const hashtags = lastPage.hashtags
      const groups = lastPage.groups

      const hasMore =
        (posts?.meta?.hasNextPage) ||
        (users?.meta?.hasNextPage) ||
        (hashtags?.meta?.hasNextPage) ||
        (groups?.meta?.hasNextPage)

      if (hasMore) {
        return allPages.length + 1
      }
      return undefined
    },
    initialPageParam: 1,
    enabled: query.length >= 2,
  })
}

// Search suggestions (autocomplete)
export function useSearchSuggestions(query: string, limit = 5) {
  return useQuery({
    queryKey: searchKeys.suggestions(query),
    queryFn: async () => {
      const response = await apiClient.get<{ data: SearchSuggestions }>('/search/suggestions', {
        params: { q: query, limit },
      })
      return response.data.data
    },
    enabled: query.length >= 2,
    staleTime: 30000, // 30 seconds
  })
}

// Trending hashtags
export function useTrendingHashtags(limit = 10) {
  return useQuery({
    queryKey: searchKeys.trending(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: TrendingHashtag[] }>('/search/trending', {
        params: { limit },
      })
      return response.data.data
    },
    staleTime: 60000, // 1 minute
  })
}

