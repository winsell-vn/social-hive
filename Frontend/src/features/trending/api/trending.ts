import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { TimeRange, TrendingPostsResponse, TrendingHashtag } from '../types/trending'

// Query keys
export const trendingKeys = {
  all: ['trending'] as const,
  posts: (timeRange: TimeRange) => [...trendingKeys.all, 'posts', timeRange] as const,
  hashtags: (timeRange: TimeRange, includeSamplePosts?: boolean) => [...trendingKeys.all, 'hashtags', timeRange, includeSamplePosts] as const,
}

/**
 * Fetch trending posts with infinite scroll pagination
 */
export function useTrendingPosts(timeRange: TimeRange) {
  return useInfiniteQuery({
    queryKey: trendingKeys.posts(timeRange),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{ data: TrendingPostsResponse }>('/posts/trending', {
        params: { timeRange, page: pageParam, limit: 10 },
      })
      return response.data.data
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 60000, // 1 minute - data considered fresh
    refetchInterval: 300000, // 5 minutes - auto-refresh
    refetchOnWindowFocus: false, // reduce API calls
  })
}

/**
 * Fetch trending hashtags
 */
export function useTrendingHashtags(timeRange: TimeRange, includeSamplePosts?: boolean) {
  return useQuery({
    queryKey: trendingKeys.hashtags(timeRange, includeSamplePosts),
    queryFn: async () => {
      const response = await apiClient.get<{ data: TrendingHashtag[] }>('/hashtags/trending', {
        params: { timeRange, limit: 10, ...(includeSamplePosts && { includeSamplePosts: true }) },
      })
      return response.data.data
    },
    staleTime: 60000, // 1 minute - data considered fresh
    refetchInterval: 300000, // 5 minutes - auto-refresh
    refetchOnWindowFocus: false, // reduce API calls
  })
}

