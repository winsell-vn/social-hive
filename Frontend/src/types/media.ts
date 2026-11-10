/**
 * Media types for the image upload system
 * Matches backend DTOs from upload module
 */

export type MediaType = 'AVATAR' | 'COVER' | 'POST_IMAGE' | 'BLOG_IMAGE' | 'AD_IMAGE';
export type MediaStatus = 'PROCESSING' | 'READY' | 'FAILED';

export interface UploadResult {
  id: string;
  url: string | null;
  status: MediaStatus;
  type: MediaType;
}

export interface MediaStatusResult {
  status: MediaStatus;
  url: string | null;
}

