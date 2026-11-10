/**
 * Meta Description Utility - Generate SEO-friendly meta descriptions
 * Strips HTML, hashtags, and truncates at word boundary
 */

import { stripHtmlTags } from './reading-time';

/**
 * Strip hashtag patterns from text
 * Removes patterns like #hashtag, #Hashtag123
 * @param text - Text to strip hashtags from
 * @returns Text without hashtags
 */
export function stripHashtags(text: string): string {
  if (!text) return '';
  // Remove hashtags (# followed by word characters)
  return text.replace(/#\w+/g, '').trim();
}

/**
 * Truncate text at word boundary
 * Ensures we don't cut words in half
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export function truncateAtWordBoundary(text: string, maxLength: number): string {
  if (!text) return '';
  
  // Normalize whitespace
  const normalized = text.replace(/\s+/g, ' ').trim();
  
  if (normalized.length <= maxLength) return normalized;
  
  // Find the last space before maxLength
  const truncated = normalized.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxLength * 0.5) {
    // Cut at word boundary if we're not losing too much
    return truncated.substring(0, lastSpace).trim() + '...';
  }
  
  // Otherwise just cut at maxLength - 3 for ellipsis
  return normalized.substring(0, maxLength - 3).trim() + '...';
}

/**
 * Generate SEO-friendly meta description from post content
 * - Strips HTML tags
 * - Strips hashtags
 * - Normalizes whitespace
 * - Truncates at word boundary
 * 
 * @param content - Post content (may contain HTML and hashtags)
 * @param maxLength - Maximum length (default: 150 for SEO best practices)
 * @returns Clean, truncated meta description
 */
export function generateMetaDescription(content: string, maxLength: number = 150): string {
  if (!content) return '';
  
  // Step 1: Strip HTML tags
  let cleaned = stripHtmlTags(content);
  
  // Step 2: Strip hashtags
  cleaned = stripHashtags(cleaned);
  
  // Step 3: Normalize whitespace (multiple spaces, newlines, etc.)
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Step 4: Truncate at word boundary
  return truncateAtWordBoundary(cleaned, maxLength);
}

