import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { BlogPost, BlogCategory, BlogPostStatus, BlogPostType } from '@/types/blog'

// Query keys for admin blog operations
export const blogAdminKeys = {
  all: ['blog-admin'] as const,
  posts: () => [...blogAdminKeys.all, 'posts'] as const,
  postList: (filters: Record<string, unknown>) => [...blogAdminKeys.posts(), filters] as const,
  post: (id: string) => [...blogAdminKeys.all, 'post', id] as const,
  categories: () => [...blogAdminKeys.all, 'categories'] as const,
}

// Input types for create/update operations
export interface CreateBlogPostInput {
  title: string
  content: string
  excerpt?: string
  featuredImage?: string
  categoryId: string
  postType?: BlogPostType
  tags?: string[]
  takeaways?: string[]
  metaTitle?: string
  metaDescription?: string
  status?: BlogPostStatus
}

export interface UpdateBlogPostInput extends Partial<CreateBlogPostInput> {}

interface BlogPostsResponse {
  data: BlogPost[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

// Fetch admin blog posts with filters
export function useAdminBlogPosts(
  page = 1,
  limit = 10,
  status?: BlogPostStatus,
  categorySlug?: string,
  postType?: BlogPostType
) {
  return useQuery({
    queryKey: blogAdminKeys.postList({ page, limit, status, categorySlug, postType }),
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', String(page))
      params.append('limit', String(limit))
      if (status) params.append('status', status)
      if (categorySlug) params.append('categorySlug', categorySlug)
      if (postType) params.append('postType', postType)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiClient.get<{ data: any }>(`/blog/posts?${params.toString()}`)
      // Handle triple-nesting: response.data.data may be { data: [...], meta: {...} } or direct
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = response.data as any
      const rawData = responseData?.data?.data || responseData?.data
      const meta = responseData?.data?.meta || responseData?.meta || {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      }
      return {
        data: Array.isArray(rawData) ? rawData : [],
        meta,
      } as BlogPostsResponse
    },
  })
}

// Fetch all categories for dropdown
export function useAdminBlogCategories() {
  return useQuery({
    queryKey: blogAdminKeys.categories(),
    queryFn: async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await apiClient.get<{ data: any }>('/blog/categories')
      // Handle triple-nesting
      const rawData = response.data?.data?.data || response.data?.data
      return (Array.isArray(rawData) ? rawData : []) as BlogCategory[]
    },
  })
}

// Create blog post
export function useCreateBlogPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateBlogPostInput) => {
      const response = await apiClient.post('/blog/posts', data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogAdminKeys.posts() })
    },
  })
}

// Update blog post
export function useUpdateBlogPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateBlogPostInput }) => {
      const response = await apiClient.patch(`/blog/posts/${id}`, data)
      return response.data.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogAdminKeys.posts() })
    },
  })
}

// Delete blog post
export function useDeleteBlogPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/blog/posts/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogAdminKeys.posts() })
    },
  })
}

