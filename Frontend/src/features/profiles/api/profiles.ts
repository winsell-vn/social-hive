import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { UserProfile, UpdateProfileInput } from '@/types/profile'
import type { UploadResult } from '@/types/media'

export const profileKeys = {
  all: ['profiles'] as const,
  detail: (username: string) => [...profileKeys.all, username] as const,
  me: () => [...profileKeys.all, 'me'] as const,
  followers: (username: string) => [...profileKeys.all, username, 'followers'] as const,
  following: (username: string) => [...profileKeys.all, username, 'following'] as const,
}

export function useProfile(username: string) {
  return useQuery({
    queryKey: profileKeys.detail(username),
    queryFn: async () => {
      const response = await apiClient.get<{ data: UserProfile }>(`/profiles/${username}`)
      return response.data.data
    },
    enabled: !!username,
  })
}

export function useMyProfile() {
  return useQuery({
    queryKey: profileKeys.me(),
    queryFn: async () => {
      const response = await apiClient.get<{ data: UserProfile }>('/profiles/me')
      return response.data.data
    },
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: UpdateProfileInput) => {
      const response = await apiClient.patch<{ data: UserProfile }>('/profiles/me', data)
      return response.data.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}

export function useFollow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiClient.post(`/profiles/${userId}/follow`)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}

export function useUnfollow() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/profiles/${userId}/follow`)
      return userId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}

export function useFollowStatus(userId: string) {
  return useQuery({
    queryKey: [...profileKeys.all, userId, 'followStatus'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: { isFollowing: boolean } }>(
        `/profiles/${userId}/follow/status`
      )
      return response.data.data
    },
    enabled: !!userId,
  })
}

export function useUploadAvatar() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('avatar', file)
      const response = await apiClient.post<{ data: UploadResult }>(
        '/profiles/me/avatar',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )
      return response.data.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}

export function useUploadCover() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('cover', file)
      const response = await apiClient.post<{ data: UploadResult }>(
        '/profiles/me/cover',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      )
      return response.data.data
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}

