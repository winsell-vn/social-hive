/**
 * Image URL utilities for handling legacy CDN URLs and local storage URLs
 *
 * IMPORTANT: Returns RELATIVE paths (/uploads/...) to work with Next.js rewrite proxy.
 * This avoids Next.js Image Optimization blocking private IPs (localhost:4000).
 * The rewrite proxy in next.config.js handles routing to the backend.
 */

const CDN_HOSTNAME = 'cdn.chungtoixayweb.vn';
const GATEWAY_HOSTNAME = 'gateway.chungtoixayweb.vn';

/**
 * Default avatar path for users who haven't uploaded an avatar.
 * Served from Frontend/public folder.
 */
export const DEFAULT_AVATAR_PATH = '/default_avatar_for_user_did_not_update_for_their_avatar.webp';

/**
 * Transform image URLs to relative paths for Next.js rewrite proxy
 *
 * @param url - Image URL (can be CDN URL, relative path, or full backend URL)
 * @returns Relative path starting with /uploads/ (for Next.js rewrite proxy)
 *
 * @example
 * // Legacy CDN URL
 * transformImageUrl('https://cdn.chungtoixayweb.vn/avatars/file.webp')
 * // Returns: '/uploads/avatars/file.webp'
 *
 * // Already relative path
 * transformImageUrl('/uploads/avatars/file.webp')
 * // Returns: '/uploads/avatars/file.webp' (unchanged)
 *
 * // Full backend URL (localhost or gateway)
 * transformImageUrl('http://localhost:4000/uploads/avatars/file.webp')
 * // Returns: '/uploads/avatars/file.webp'
 *
 * // External URL (not our uploads)
 * transformImageUrl('https://example.com/image.jpg')
 * // Returns: 'https://example.com/image.jpg' (unchanged)
 */
export function transformImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;

  try {
    // If it's a CDN URL, extract the path and convert to relative uploads path
    if (url.includes(CDN_HOSTNAME)) {
      const urlObj = new URL(url);
      const path = urlObj.pathname; // e.g., /avatars/file.webp

      // Convert CDN path to relative uploads path
      // CDN: /avatars/file.webp -> /uploads/avatars/file.webp
      return path.startsWith('/uploads/') ? path : `/uploads${path}`;
    }

    // If it's a gateway URL, extract the relative path
    if (url.includes(GATEWAY_HOSTNAME)) {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      // Gateway URLs should already have /uploads/ prefix
      return path.startsWith('/uploads/') ? path : `/uploads${path}`;
    }

    // If it's a localhost backend URL, extract the relative path
    if (url.includes('localhost:4000/uploads/') || url.includes('127.0.0.1:4000/uploads/')) {
      const urlObj = new URL(url);
      return urlObj.pathname; // Already /uploads/...
    }

    // If it's already a relative path starting with /uploads/, keep as-is
    if (url.startsWith('/uploads/')) {
      return url;
    }

    // If it's a relative path without /uploads/, add it
    if (url.startsWith('/') && !url.startsWith('//')) {
      return `/uploads${url}`;
    }

    // If it's a full external URL (not our uploads), return as-is
    // This handles external images that shouldn't go through our proxy
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }

    // Fallback: treat as relative path and prepend /uploads/
    console.warn('Unexpected image URL pattern, applying fallback:', url);
    return `/uploads/${url}`;
  } catch (error) {
    // If URL parsing fails, return null to trigger fallback avatar
    console.error('Failed to transform image URL:', url, error);
    return null;
  }
}

/**
 * Get avatar URL with fallback to default avatar
 * Transforms legacy CDN URLs and handles null/undefined/empty strings
 *
 * @param avatarUrl - Avatar URL from database
 * @returns Transformed URL or default avatar path (never undefined)
 */
export function getAvatarUrl(avatarUrl: string | null | undefined): string {
  // Handle null, undefined, or empty string
  if (!avatarUrl || avatarUrl.trim() === '') {
    return DEFAULT_AVATAR_PATH;
  }

  const transformed = transformImageUrl(avatarUrl);
  return transformed || DEFAULT_AVATAR_PATH;
}

/**
 * Get cover photo URL with fallback handling
 * Transforms legacy CDN URLs and handles null/undefined
 * 
 * @param coverUrl - Cover photo URL from database
 * @returns Transformed URL or undefined (for fallback handling)
 */
export function getCoverUrl(coverUrl: string | null | undefined): string | undefined {
  const transformed = transformImageUrl(coverUrl);
  return transformed || undefined;
}

