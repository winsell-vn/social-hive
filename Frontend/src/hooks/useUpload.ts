/**
 * Centralized upload hooks for the image upload system
 * Uses tanstack/react-query for state management
 */

import { useMutation, useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import type { UploadResult, MediaStatusResult } from '@/types/media'
import type { ApiResponse } from '@/types/api'

// Query keys for upload operations
export const uploadKeys = {
  all: ['upload'] as const,
  status: (mediaId: string) => [...uploadKeys.all, 'status', mediaId] as const,
}

/**
 * Hook to upload a single image
 */
export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await apiClient.post<ApiResponse<UploadResult>>(
        '/upload/image',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return response.data.data
    },
  })
}

/**
 * Hook to upload multiple images (max 5 per request)
 */
export function useUploadImages() {
  return useMutation({
    mutationFn: async (files: File[]): Promise<UploadResult[]> => {
      const formData = new FormData()
      files.forEach((file) => formData.append('files', file))
      const response = await apiClient.post<ApiResponse<UploadResult[]>>(
        '/upload/images',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return response.data.data
    },
  })
}

/**
 * Hook to upload avatar image (300x300 crop)
 */
export function useUploadAvatar() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await apiClient.post<ApiResponse<UploadResult>>(
        '/upload/avatar',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return response.data.data
    },
  })
}

/**
 * Hook to upload cover photo (1200x400 crop)
 */
export function useUploadCover() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      const formData = new FormData()
      formData.append('file', file)
      const response = await apiClient.post<ApiResponse<UploadResult>>(
        '/upload/cover',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return response.data.data
    },
  })
}

/**
 * Hook to check media upload status (for async uploads)
 */
export function useMediaStatus(mediaId: string, enabled = true) {
  return useQuery({
    queryKey: uploadKeys.status(mediaId),
    queryFn: async (): Promise<MediaStatusResult> => {
      const response = await apiClient.get<ApiResponse<MediaStatusResult>>(
        `/upload/status/${mediaId}`
      )
      return response.data.data
    },
    enabled: enabled && !!mediaId,
    refetchInterval: (query) => {
      // Poll every second while processing
      const data = query.state.data
      if (data?.status === 'PROCESSING') {
        return 1000
      }
      return false
    },
  })
}

