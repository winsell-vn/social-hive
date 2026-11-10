import type { Post } from '@/types/post'

/**
 * Time range for trending content queries
 */
export type TimeRange = 'today' | 'week' | 'month'

/**
 * Trending post type - extends the base Post type
 * Used for posts returned from trending endpoints
 */
export type TrendingPost = Post

/**
 * Trending hashtag with optional trending score
 */
export interface TrendingHashtag {
  id: string
  name: string
  postCount: number
  trendingScore?: number
  samplePosts?: Array<{ id: string; content: string }>
}

/**
 * Pagination metadata for trending posts response
 */
export interface TrendingPostsMeta {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

/**
 * Paginated response for trending posts
 */
export interface TrendingPostsResponse {
  data: TrendingPost[]
  meta: TrendingPostsMeta
}

