/**
 * Upload API functions for the image upload system
 * Uses apiClient for authentication and error handling
 *
 * Note: Backend wraps responses with TransformInterceptor:
 * { success: boolean, data: T, timestamp: string }
 */

import apiClient from './api-client';
import type { UploadResult, MediaStatusResult } from '@/types/media';
import type { ApiResponse } from '@/types/api';

/**
 * Upload a single image
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiResponse<UploadResult>>('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

/**
 * Upload multiple images (max 5 per request)
 */
export async function uploadImages(files: File[]): Promise<UploadResult[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  const response = await apiClient.post<ApiResponse<UploadResult[]>>('/upload/images', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

/**
 * Upload avatar image (300x300 crop)
 */
export async function uploadAvatar(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiResponse<UploadResult>>('/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

/**
 * Upload cover photo (1200x400 crop)
 */
export async function uploadCover(file: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post<ApiResponse<UploadResult>>('/upload/cover', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.data;
}

/**
 * Check upload status (for async uploads of files > 2MB)
 */
export async function getMediaStatus(mediaId: string): Promise<MediaStatusResult> {
  const response = await apiClient.get<ApiResponse<MediaStatusResult>>(`/upload/status/${mediaId}`);
  return response.data.data;
}

/**
 * Delete uploaded media
 */
export async function deleteMedia(mediaId: string): Promise<void> {
  await apiClient.delete(`/upload/${mediaId}`);
}

/**
 * Poll for media status until ready or failed
 * Used for async uploads (files > 2MB)
 */
export async function waitForMediaReady(
  mediaId: string,
  options?: { maxAttempts?: number; intervalMs?: number }
): Promise<MediaStatusResult> {
  const { maxAttempts = 30, intervalMs = 1000 } = options || {};

  for (let i = 0; i < maxAttempts; i++) {
    const status = await getMediaStatus(mediaId);
    if (status.status === 'READY' || status.status === 'FAILED') {
      return status;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  // Timeout - return failed status
  return { status: 'FAILED', url: null };
}

