import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { BlogPost, BlogCategory, BlogListResponse } from '@/types/blog'

// Query keys
export const blogKeys = {
  all: ['blog'] as const,
  posts: () => [...blogKeys.all, 'posts'] as const,
  postList: (filters: Record<string, unknown>) => [...blogKeys.posts(), filters] as const,
  postDetail: (slug: string) => [...blogKeys.posts(), 'detail', slug] as const,
  categories: () => [...blogKeys.all, 'categories'] as const,
  byTopic: (topic: string, page: number, limit: number) => [...blogKeys.posts(), 'topic', topic, page, limit] as const,
}

// Fetch paginated blog posts
export function useBlogPosts(page = 1, limit = 12, categorySlug?: string) {
  return useQuery({
    queryKey: blogKeys.postList({ page, limit, categorySlug }),
    queryFn: async () => {
      const params: Record<string, string | number> = { page, limit }
      if (categorySlug) params.categorySlug = categorySlug
      const response = await apiClient.get<{ data: BlogListResponse }>('/blog/posts', { params })
      return response.data.data
    },
  })
}

// Fetch single blog post by slug
export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: blogKeys.postDetail(slug),
    queryFn: async () => {
      const response = await apiClient.get<{ data: BlogPost }>(`/blog/posts/${slug}`)
      return response.data.data
    },
    enabled: !!slug,
  })
}

// Fetch all blog categories
export function useBlogCategories() {
  return useQuery({
    queryKey: blogKeys.categories(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: BlogCategory[] }>('/blog/categories')
      return response.data.data
    },
  })
}

// Increment blog post view count
export function useIncrementBlogView() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (slug: string) => {
      const response = await apiClient.post(`/blog/posts/${slug}/view`)
      return response.data.data
    },
    onSuccess: (_, slug) => {
      // Invalidate the post detail to refresh view count
      queryClient.invalidateQueries({ queryKey: blogKeys.postDetail(slug) })
    },
  })
}

// Fetch blog posts by topic/tag (T-111)
export function useBlogPostsByTopic(topic: string, page = 1, limit = 12) {
  return useQuery({
    queryKey: blogKeys.byTopic(topic, page, limit),
    queryFn: async () => {
      const response = await apiClient.get<{ data: BlogListResponse }>(
        `/blog/posts/by-topic/${encodeURIComponent(topic)}`,
        { params: { page, limit } }
      )
      return response.data.data
    },
    enabled: !!topic,
  })
}

