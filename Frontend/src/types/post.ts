export type ReactionType = 'LIKE' | 'LOVE' | 'HAHA' | 'WOW' | 'SAD' | 'ANGRY'

export type PostStatus = 'DRAFT' | 'PENDING' | 'PUBLISHED' | 'REJECTED'

export interface Author {
  id: string
  /** @deprecated Use profile.username instead - this field is not populated by the backend */
  username?: string
  profile?: {
    username?: string
    displayName?: string
    avatar?: string | null
    tier?: string
    bio?: string | null
    jobTitle?: string | null
    company?: string | null
  }
}

export interface Hashtag {
  id: string
  name: string
  postCount: number
}

export interface PostHashtag {
  hashtag: Hashtag
}

export interface Post {
  id: string
  content: string
  images: string[]
  slug: string | null
  status: PostStatus
  viewCount: number
  likeCount: number
  commentCount: number
  shareCount: number
  createdAt: string
  updatedAt: string
  publishAt: string | null
  author: Author
  hashtags: PostHashtag[]
  /** ID of the original post if this is a shared post */
  sharedPostId?: string | null
  /** The original post being shared (null if original was deleted) */
  sharedPost?: Post | null
  _count?: {
    comments: number
    likes: number
  }
}

export interface ReactionCounts {
  LIKE?: number
  LOVE?: number
  HAHA?: number
  WOW?: number
  SAD?: number
  ANGRY?: number
}

export interface UserReaction {
  id: string
  reactionType: ReactionType
  userId: string
  postId?: string
  commentId?: string
}

export interface PaginatedResponse<T> {
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

export interface CreatePostInput {
  content: string
  images?: string[]
  hashtags?: string[]
  groupId?: string
  isDraft?: boolean
}

export interface UpdatePostInput {
  content?: string
  images?: string[]
  hashtags?: string[]
}

