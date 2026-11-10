/**
 * Link Processor Utility - SEO-appropriate rel attributes for links
 * Works server-side using regex (no DOM APIs)
 */

const BASE_DOMAIN = 'chungtoixayweb.vn';

export interface LinkProcessorOptions {
  /** Whether the content is from a trusted user (higher karma) */
  trusted?: boolean;
}

export interface LinkRelOptions {
  /** Whether the link is user-generated content */
  isUGC?: boolean;
  /** Whether the user is trusted (higher karma) */
  trusted?: boolean;
}

/**
 * Check if a URL is internal (same domain or relative path)
 * @param url - The URL to check
 * @returns true if the URL is internal
 */
export function isInternalLink(url: string): boolean {
  if (!url) return false;

  // Relative paths are internal
  if (url.startsWith('/') && !url.startsWith('//')) {
    return true;
  }

  // Check if URL contains our domain
  try {
    // Handle protocol-relative URLs
    const normalizedUrl = url.startsWith('//') ? `https:${url}` : url;
    const urlObj = new URL(normalizedUrl);
    return urlObj.hostname === BASE_DOMAIN || urlObj.hostname.endsWith(`.${BASE_DOMAIN}`);
  } catch {
    // If URL parsing fails, check string contains domain
    return url.includes(BASE_DOMAIN);
  }
}

/**
 * Get appropriate rel attribute for a link based on its type and trust level
 * @param url - The URL to get rel attribute for
 * @param options - Options for determining rel attribute
 * @returns The rel attribute string
 */
export function getLinkRelAttribute(url: string, options: LinkRelOptions = {}): string {
  const { isUGC = true, trusted = false } = options;

  const relParts: string[] = [];

  // All UGC links get ugc attribute
  if (isUGC) {
    relParts.push('ugc');
  }

  // External links need additional attributes
  if (!isInternalLink(url)) {
    // Untrusted users get nofollow
    if (!trusted) {
      relParts.push('nofollow');
    }
    // All external links get security attributes
    relParts.push('noopener', 'noreferrer');
  }

  return relParts.join(' ');
}

/**
 * Process HTML content to add SEO-appropriate rel attributes to links
 * Uses regex for server-side compatibility (no DOM APIs)
 * 
 * @param html - The HTML content to process
 * @param options - Options for link processing
 * @returns The processed HTML with rel attributes added
 */
export function processUGCLinks(html: string, options: LinkProcessorOptions = {}): string {
  if (!html) return html;

  const { trusted = false } = options;

  // Regex to match <a> tags and capture href value
  // Handles: <a href="..."> with optional other attributes
  const anchorRegex = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>/gi;

  return html.replace(anchorRegex, (match, beforeHref, href, afterHref) => {
    // Get the appropriate rel attribute
    const relValue = getLinkRelAttribute(href, { isUGC: true, trusted });

    // Check if rel attribute already exists
    const existingRelMatch = (beforeHref + afterHref).match(/rel=["']([^"']*)["']/i);

    if (existingRelMatch) {
      // Merge with existing rel attribute
      const existingRel = existingRelMatch[1];
      const mergedRel = mergeRelAttributes(existingRel, relValue);
      
      // Replace existing rel with merged value
      const updatedBefore = beforeHref.replace(/rel=["'][^"']*["']/i, '');
      const updatedAfter = afterHref.replace(/rel=["'][^"']*["']/i, '');
      
      return `<a ${updatedBefore}href="${href}"${updatedAfter} rel="${mergedRel}">`;
    }

    // Add new rel attribute
    return `<a ${beforeHref}href="${href}"${afterHref} rel="${relValue}">`;
  });
}

/**
 * Merge two rel attribute strings, removing duplicates
 */
function mergeRelAttributes(existing: string, newRel: string): string {
  const existingParts = existing.split(/\s+/).filter(Boolean);
  const newParts = newRel.split(/\s+/).filter(Boolean);
  const merged = new Set([...existingParts, ...newParts]);
  return Array.from(merged).join(' ');
}

