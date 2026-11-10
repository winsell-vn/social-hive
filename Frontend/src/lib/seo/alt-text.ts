/**
 * Alt Text Generator Utility - Generate SEO-friendly alt text for images
 * Vietnamese language support for accessibility and image search
 */

export interface PostImageAltOptions {
  /** 1-based index of the image in the post */
  index: number;
  /** Display name of the post author */
  authorName?: string;
  /** Title or excerpt of the post */
  postTitle?: string;
}

/**
 * Generate alt text for post images
 * Format with title: "Hình {index} trong bài viết: {title}"
 * Format with author: "Hình {index} trong bài viết của {authorName}"
 * Fallback: "Hình {index} trong bài viết"
 * 
 * @param options - Options for generating alt text
 * @returns The generated alt text string
 */
export function generatePostImageAlt(options: PostImageAltOptions): string {
  const { index, authorName, postTitle } = options;

  // Ensure index is at least 1
  const safeIndex = Math.max(1, index);

  // Prefer title over author name for more descriptive alt text
  if (postTitle && postTitle.trim()) {
    // Truncate long titles to keep alt text reasonable
    const truncatedTitle = postTitle.trim().length > 100 
      ? postTitle.trim().substring(0, 97) + '...'
      : postTitle.trim();
    return `Hình ${safeIndex} trong bài viết: ${truncatedTitle}`;
  }

  if (authorName && authorName.trim()) {
    return `Hình ${safeIndex} trong bài viết của ${authorName.trim()}`;
  }

  // Fallback for when no context is available
  return `Hình ${safeIndex} trong bài viết`;
}

/**
 * Generate alt text for user avatar
 * Format: "Ảnh đại diện của {displayName}"
 * 
 * @param displayName - The user's display name
 * @returns The generated alt text string
 */
export function generateAvatarAlt(displayName: string): string {
  if (!displayName || !displayName.trim()) {
    return 'Ảnh đại diện người dùng';
  }
  return `Ảnh đại diện của ${displayName.trim()}`;
}

/**
 * Generate alt text for cover photo
 * Format: "Ảnh bìa của {displayName}"
 * 
 * @param displayName - The user's display name
 * @returns The generated alt text string
 */
export function generateCoverAlt(displayName: string): string {
  if (!displayName || !displayName.trim()) {
    return 'Ảnh bìa người dùng';
  }
  return `Ảnh bìa của ${displayName.trim()}`;
}

