/**
 * Reading Time Utility - Calculate estimated reading time for posts
 * Vietnamese language support for display
 */

/**
 * Strip HTML tags from content
 * @param html - HTML string to strip
 * @returns Plain text without HTML tags
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').trim();
}

export interface ReadingTimeResult {
  /** Estimated reading time in minutes */
  minutes: number;
  /** Word count of the content */
  wordCount: number;
  /** Whether to show reading time (false for posts < 50 words) */
  shouldShow: boolean;
}

/**
 * Calculate reading time based on word count and image count
 * Formula: ceil(wordCount / 200) + ceil(imageCount * 12 / 60) minutes
 * - 200 words per minute reading speed
 * - 12 seconds per image viewing time
 * - Hide for posts with < 50 words
 * 
 * @param content - Post content (may contain HTML)
 * @param imageCount - Number of images in the post
 * @returns Reading time result with minutes, word count, and shouldShow flag
 */
export function calculateReadingTime(content: string, imageCount: number = 0): ReadingTimeResult {
  const strippedContent = stripHtmlTags(content);
  const words = strippedContent.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount < 50) {
    return { minutes: 0, wordCount, shouldShow: false };
  }

  const readingMinutes = Math.ceil(wordCount / 200);
  const imageMinutes = Math.ceil((imageCount * 12) / 60);
  const totalMinutes = readingMinutes + imageMinutes;

  return { minutes: totalMinutes, wordCount, shouldShow: true };
}

/**
 * Format reading time for display in Vietnamese
 * @param content - Post content
 * @param imageCount - Number of images
 * @returns Formatted string like "5 phút đọc" or empty string if < 50 words
 */
export function formatReadingTime(content: string, imageCount: number = 0): string {
  const result = calculateReadingTime(content, imageCount);
  if (!result.shouldShow) return '';
  return `${result.minutes} phút đọc`;
}

/**
 * Convert minutes to ISO 8601 duration format for JSON-LD timeRequired
 * @param readingTime - Reading time result from calculateReadingTime
 * @returns ISO 8601 duration string like "PT5M"
 */
export function toISO8601Duration(minutes: number): string {
  if (minutes <= 0) return 'PT1M'; // Minimum 1 minute
  return `PT${minutes}M`;
}

