import { useQuery, useMutation, useQueryClient, useInfiniteQuery, QueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import apiClient from '@/lib/api-client'
import { useAuthStore } from '@/features/auth/stores/auth-store'
import type { Post, PaginatedResponse, CreatePostInput, UpdatePostInput, ReactionType, PostStatus, UserReaction } from '@/types/post'

/** Invalidate current user's posts cache after mutation */
function invalidateCurrentUserPosts(queryClient: QueryClient) {
  const currentUser = useAuthStore.getState().user
  if (currentUser?.profile?.username) {
    queryClient.invalidateQueries({ queryKey: postKeys.userPosts(currentUser.profile.username) })
  }
}

/**
 * Invalidate the popular posts widget cache after a mutation.
 * Uses the root key so every limit variant is invalidated.
 */
function invalidatePopularPosts(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: postKeys.popularRoot() })
}

// Query keys
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
  userPosts: (username: string) => [...postKeys.all, 'user', username] as const,
  userPostsWithStatus: (username: string, status: PostStatus) => [...postKeys.all, 'user', username, status] as const,
  drafts: () => [...postKeys.all, 'drafts'] as const,
  popular: (limit: number) => [...postKeys.all, 'popular', limit] as const,
  popularRoot: () => [...postKeys.all, 'popular'] as const,
}

// Fetch newsfeed posts
export function useNewsfeed(limit = 10) {
  return useInfiniteQuery({
    queryKey: postKeys.list({ type: 'newsfeed' }),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{ data: PaginatedResponse<Post> }>('/posts', {
        params: { page: pageParam, limit },
      })
      return response.data.data
    },
    getNextPageParam: (lastPage) => 
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
  })
}

// Fetch single post
export function usePost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<{ data: Post }>(`/posts/${id}`)
      return response.data.data
    },
    enabled: !!id,
  })
}

// Fetch single post by slug
export function usePostBySlug(username: string, slug: string) {
  return useQuery({
    queryKey: [...postKeys.details(), 'slug', username, slug],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Post }>(`/posts/by-slug/${username}/${slug}`)
      return response.data.data
    },
    enabled: !!username && !!slug,
  })
}

// Fetch user posts
export function useUserPosts(username: string, limit = 10) {
  return useInfiniteQuery({
    queryKey: postKeys.userPosts(username),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{ data: PaginatedResponse<Post> }>(`/posts/user/${username}`, {
        params: { page: pageParam, limit },
      })
      return response.data.data
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!username,
  })
}

// Fetch user posts with status filter
export function useUserPostsWithStatus(username: string, status: PostStatus, limit = 10) {
  return useInfiniteQuery({
    queryKey: postKeys.userPostsWithStatus(username, status),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{ data: PaginatedResponse<Post> }>(`/posts/user/${username}`, {
        params: { page: pageParam, limit, status },
      })
      return response.data.data
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!username,
  })
}

// Fetch drafts
export function useDrafts() {
  return useQuery({
    queryKey: postKeys.drafts(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: Post[] }>('/posts/drafts')
      return response.data.data
    },
  })
}

// Create post mutation
export function useCreatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreatePostInput) => {
      const response = await apiClient.post<{ data: Post }>('/posts', data)
      return response.data.data
    },
    onSuccess: () => {
      // Invalidate all post lists to ensure new post appears
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      // Invalidate the popular posts widget (it may now include the new post)
      invalidatePopularPosts(queryClient)
      // Invalidate user's posts if we have the username
      invalidateCurrentUserPosts(queryClient)
      // Also invalidate pending posts for the compose page
      const currentUser = useAuthStore.getState().user
      if (currentUser?.profile?.username) {
        queryClient.invalidateQueries({ queryKey: postKeys.userPostsWithStatus(currentUser.profile.username, 'PENDING') })
      }
    },
  })
}

// Update post mutation
export function useUpdatePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdatePostInput }) => {
      const response = await apiClient.patch<{ data: Post }>(`/posts/${id}`, data)
      return response.data.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(data.id) })
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      // Content changes affect the popular posts widget
      invalidatePopularPosts(queryClient)
      // Also invalidate user's posts
      invalidateCurrentUserPosts(queryClient)
    },
  })
}

// Delete post mutation
export function useDeletePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/posts/${id}`)
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      // A deleted post must disappear from the popular posts widget
      invalidatePopularPosts(queryClient)
      // Also invalidate user's posts
      invalidateCurrentUserPosts(queryClient)
    },
  })
}

// Submit draft mutation
export function useSubmitDraft() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ data: Post }>(`/posts/${id}/submit`)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.drafts() })
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
}

// React to post mutation
export function useReactToPost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ postId, reactionType }: { postId: string; reactionType: ReactionType }) => {
      const response = await apiClient.post(`/posts/${postId}/reactions`, { reactionType })
      return response.data.data
    },
    onSuccess: (_, { postId }) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) })
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      // Like counts feed the popular posts engagement score
      invalidatePopularPosts(queryClient)
    },
    onError: (error: any) => {
      // Handle self-like error (403 Forbidden)
      const status = error.response?.status
      const message = error.response?.data?.message || ''

      if (status === 403 && (message.includes('tự thích') || message.includes('own post') || message.includes('chính mình'))) {
        toast.error('Bạn không thể thích bài viết của chính mình')
      } else if (status === 403) {
        toast.error('Bạn không có quyền thực hiện hành động này')
      } else {
        toast.error('Có lỗi xảy ra. Vui lòng thử lại.')
      }
    },
  })
}

// Remove reaction mutation
export function useRemoveReaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (postId: string) => {
      await apiClient.delete(`/posts/${postId}/reactions`)
      return postId
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) })
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      // Like counts feed the popular posts engagement score
      invalidatePopularPosts(queryClient)
      // Also invalidate user reactions cache
      queryClient.invalidateQueries({ queryKey: ['userReactions'] })
    },
  })
}

// Fetch user reactions for multiple posts (batch)
export function useUserReactions(postIds: string[], enabled = true) {
  return useQuery({
    queryKey: ['userReactions', postIds.sort().join(',')],
    queryFn: async () => {
      if (postIds.length === 0) return {}
      const response = await apiClient.post<{ data: Record<string, UserReaction> }>('/reactions/batch', { postIds })
      return response.data.data || response.data
    },
    enabled: enabled && postIds.length > 0,
    staleTime: 30000, // Cache for 30 seconds
  })
}

// Share post to profile mutation
export function useSharePost() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content?: string }) => {
      const response = await apiClient.post<{ data: Post }>(`/posts/${postId}/share`, { content })
      return response.data.data
    },
    onSuccess: () => {
      // Invalidate all post lists to show the new shared post
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
      // Invalidate the popular posts widget
      invalidatePopularPosts(queryClient)
      // Invalidate user's posts
      invalidateCurrentUserPosts(queryClient)
    },
  })
}

// Popular post type for widget display
export interface PopularPost {
  id: string
  content: string
  slug: string
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  author: {
    id: string
    profile: {
      username: string
      displayName: string | null
      avatar: string | null
    } | null
  }
}

// Fetch popular posts for widget (T-113)
export function usePopularPosts(limit = 5) {
  return useQuery({
    queryKey: postKeys.popular(limit),
    queryFn: async () => {
      const response = await apiClient.get<{ data: PopularPost[] }>('/posts/popular', {
        params: { limit },
      })
      return response.data.data
    },
    staleTime: 300000, // 5 minutes - data considered fresh
    refetchOnWindowFocus: false,
  })
}

