import type { Post } from '@/types/post'

export type SearchType = 'all' | 'posts' | 'users' | 'hashtags' | 'groups'

// Backend pagination structure
export interface SearchPaginatedResult<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface SearchUser {
  id: string
  username: string
  displayName: string | null
  avatar: string | null
  bio: string | null
  followerCount: number
  user: {
    id: string
    karma: number
    tier: string
    role: string
  }
}

export interface SearchHashtag {
  id: string
  name: string
  postCount: number
  trendingScore: number
}

export interface SearchGroup {
  id: string
  name: string
  description: string | null
  coverPhoto: string | null
  memberCount: number
  isPrivate: boolean
}

export interface SearchResults {
  posts?: SearchPaginatedResult<Post>
  users?: SearchPaginatedResult<SearchUser>
  hashtags?: SearchPaginatedResult<SearchHashtag>
  groups?: SearchPaginatedResult<SearchGroup>
}

export interface SearchSuggestions {
  hashtags: SearchHashtag[]
  users: {
    id: string
    username: string
    displayName: string | null
    avatar: string | null
  }[]
}

export interface TrendingHashtag {
  id: string
  name: string
  postCount: number
  trendingScore: number
}

