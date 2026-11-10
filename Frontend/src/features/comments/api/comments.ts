import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { Comment, CreateCommentInput, UpdateCommentInput } from '@/types/comment'
import type { PaginatedResponse } from '@/types/post'
import { postKeys } from '@/features/posts/api/posts'

export const commentKeys = {
  all: ['comments'] as const,
  lists: () => [...commentKeys.all, 'list'] as const,
  list: (postId: string) => [...commentKeys.lists(), postId] as const,
  replies: (commentId: string) => [...commentKeys.all, 'replies', commentId] as const,
}

export function usePostComments(postId: string, limit = 10) {
  return useInfiniteQuery({
    queryKey: commentKeys.list(postId),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{ data: PaginatedResponse<Comment> }>(
        `/posts/${postId}/comments`,
        { params: { page: pageParam, limit } }
      )
      return response.data.data
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!postId,
  })
}

export function useCommentReplies(commentId: string, limit = 10) {
  return useInfiniteQuery({
    queryKey: commentKeys.replies(commentId),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{ data: PaginatedResponse<Comment> }>(
        `/comments/${commentId}/replies`,
        { params: { page: pageParam, limit } }
      )
      return response.data.data
    },
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNextPage ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!commentId,
  })
}

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ postId, data }: { postId: string; data: CreateCommentInput }) => {
      const response = await apiClient.post<{ data: Comment }>(
        `/posts/${postId}/comments`,
        data
      )
      return response.data.data
    },
    onSuccess: (_, { postId }) => {
      // Invalidate comments list to show new comment
      queryClient.invalidateQueries({ queryKey: commentKeys.list(postId) })
      // Invalidate post detail to update comment count
      queryClient.invalidateQueries({ queryKey: postKeys.detail(postId) })
      // Invalidate post lists to update comment count in feeds
      queryClient.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
}

export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ commentId, data }: { commentId: string; data: UpdateCommentInput }) => {
      const response = await apiClient.patch<{ data: Comment }>(
        `/comments/${commentId}`,
        data
      )
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commentKeys.all })
    },
  })
}

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (commentId: string) => {
      await apiClient.delete(`/comments/${commentId}`)
      return commentId
    },
    onSuccess: () => {
      // Invalidate all comments queries
      queryClient.invalidateQueries({ queryKey: commentKeys.all })
      // Invalidate all post queries to update comment counts
      queryClient.invalidateQueries({ queryKey: postKeys.all })
    },
  })
}

