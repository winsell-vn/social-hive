/**
 * SEO Utilities - Link processing, alt text generation, reading time, and meta description for SEO optimization
 */

export {
  processUGCLinks,
  isInternalLink,
  getLinkRelAttribute,
  type LinkProcessorOptions,
  type LinkRelOptions,
} from './link-processor';

export {
  generatePostImageAlt,
  generateAvatarAlt,
  generateCoverAlt,
  type PostImageAltOptions,
} from './alt-text';

export {
  stripHtmlTags,
  calculateReadingTime,
  formatReadingTime,
  toISO8601Duration,
  type ReadingTimeResult,
} from './reading-time';

export {
  stripHashtags,
  truncateAtWordBoundary,
  generateMetaDescription,
} from './meta-description';

