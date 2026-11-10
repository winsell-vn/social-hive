/**
 * Word counting utilities for post content
 */

// Word limit for posts
export const POST_WORD_LIMIT = 1000;

// Thresholds for color states (as percentage of limit)
export const WORD_COUNT_THRESHOLDS = {
  warning: 0.9, // 90% - amber color
  danger: 0.98, // 98% - red color
  exceeded: 1.0, // 100% - red bold + pulse
};

/**
 * Strip HTML tags and get plain text content (client-side only)
 */
export function getTextContent(html: string): string {
  if (typeof window === 'undefined') return '';
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

/**
 * Count words in text content
 * Splits by whitespace and filters empty strings
 * Handles Vietnamese and other languages properly
 */
export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  
  // Split by whitespace (handles multiple spaces, tabs, newlines)
  // Filter out empty strings
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);
  
  return words.length;
}

/**
 * Get word count color class based on current count and limit
 */
export function getWordCountColor(wordCount: number, limit: number = POST_WORD_LIMIT): string {
  const ratio = wordCount / limit;
  
  if (ratio > WORD_COUNT_THRESHOLDS.exceeded) {
    return 'text-red-600 dark:text-red-500 font-bold';
  }
  if (ratio > WORD_COUNT_THRESHOLDS.danger) {
    return 'text-red-600 dark:text-red-500 font-medium';
  }
  if (ratio > WORD_COUNT_THRESHOLDS.warning) {
    return 'text-amber-600 dark:text-amber-500';
  }
  return 'text-muted-foreground';
}

/**
 * Check if word count should trigger pulse animation
 */
export function shouldPulseWordCount(wordCount: number, limit: number = POST_WORD_LIMIT): boolean {
  return wordCount > limit;
}

/**
 * Check if content is within word limit
 */
export function isWithinWordLimit(wordCount: number, limit: number = POST_WORD_LIMIT): boolean {
  return wordCount <= limit;
}

