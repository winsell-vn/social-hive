/**
 * Centralized cache key generators and TTL constants for Redis caching strategy.
 *
 * @see .claude/specs/redis-caching-strategy/design.md for architecture details
 */

/**
 * Cache key generator functions.
 * All keys follow the pattern: `domain:entity:params`
 */
export const CACHE_KEYS = {
  // Priority 1 - Critical UX
  NEWSFEED: (page: number, limit: number) => `newsfeed:posts:${page}:${limit}`,
  PROFILE: (username: string) => `profile:${username}`,
  PROFILE_COUNTS: (username: string) => `profile:counts:${username}`,
  NOTIFICATION_UNREAD: (userId: string) => `notifications:unread:${userId}`,
  SEARCH_SUGGESTIONS: (query: string, limit: number) =>
    `search:suggestions:${query.toLowerCase()}:${limit}`,

  // Single post
  POST: (id: string) => `post:${id}`,
  RELATED_POSTS: (postId: string) => `related_posts:${postId}`,

  // Priority 2 - High
  FRIEND_SUGGESTIONS: (userId: string) => `friends:suggestions:${userId}`,
  FRIENDS_LIST: (
    userId: string,
    page: number,
    limit: number,
    search?: string,
  ) => `friends:list:${userId}:${page}:${limit}:${search || "all"}`,
  PENDING_REQUESTS_COUNT: (userId: string, type: string) =>
    `friends:pending:${userId}:${type}`,

  // Priority 3 - Medium
  PUBLIC_GROUPS: (page: number, limit: number, search?: string) =>
    `groups:public:${page}:${limit}:${search || "all"}`,
  USER_GROUPS: (userId: string, page: number, limit: number) =>
    `groups:user:${userId}:${page}:${limit}`,
  POST_REACTION_COUNTS: (postId: string) => `reactions:post:${postId}`,
  ADMIN_ANALYTICS: () => `admin:analytics`,

  // Upload / Media
  UPLOAD_RATE_LIMIT: (userId: string) => `upload:rate:${userId}`,
  DAILY_QUOTA: (userId: string, date: string) =>
    `upload:quota:${userId}:${date}`,
  MEDIA: (mediaId: string) => `media:${mediaId}`,
  IMAGE_METADATA: (mediaId: string) => `image:meta:${mediaId}`,
};

/**
 * Cache TTL values in seconds.
 * Values are tuned based on data volatility and query cost.
 */
export const CACHE_TTL = {
  // Priority 1 - Critical UX
  NEWSFEED: 60, // 1 minute - changes frequently
  PROFILE: 300, // 5 minutes
  NOTIFICATION_UNREAD: 30, // 30 seconds - needs freshness
  SEARCH_SUGGESTIONS: 300, // 5 minutes

  // Single post
  POST: 300, // 5 minutes - single post detail
  RELATED_POSTS: 300, // 5 minutes - related posts for SEO

  // Priority 2 - High
  FRIEND_SUGGESTIONS: 600, // 10 minutes - expensive query
  FRIENDS_LIST: 300, // 5 minutes
  PROFILE_COUNTS: 120, // 2 minutes

  // Priority 3 - Medium
  PUBLIC_GROUPS: 300, // 5 minutes
  USER_GROUPS: 300, // 5 minutes
  REACTION_COUNTS: 60, // 1 minute
  ADMIN_ANALYTICS: 60, // 1 minute
  PENDING_REQUESTS: 60, // 1 minute

  // Upload / Media
  UPLOAD_RATE_LIMIT: 3600, // 1 hour
  MEDIA: 300, // 5 minutes
  IMAGE_METADATA: 86400, // 24 hours

  // Existing (for reference - already used in PostsService and HashtagsService)
  TRENDING_POSTS: 300,
  TRENDING_HASHTAGS: 300,
};

/**
 * Cache key patterns for bulk invalidation.
 * Used with RedisService.delPattern() for wildcard deletion.
 */
export const CACHE_PATTERNS = {
  ALL_NEWSFEED: "newsfeed:*",
  ALL_POSTS: "post:*",
  // Popular posts widget cache. NOTE: "post:*" does NOT match these keys
  // because they are namespaced under "posts:popular:<limit>".
  ALL_POPULAR_POSTS: "posts:popular:*",
  ALL_PROFILE: (username: string) => `profile:*${username}*`,
  ALL_FRIENDS: (userId: string) => `friends:*${userId}*`,
  ALL_GROUPS: "groups:*",
  ALL_NOTIFICATIONS: (userId: string) => `notifications:*${userId}*`,
  ALL_UPLOAD_RATE: (userId: string) => `upload:rate:${userId}`,
};

/**
 * AI Seeding Cache Keys.
 * Used for rate limiting, agent state, content deduplication, and circuit breaker.
 */
export const AI_CACHE_KEYS = {
  // Rate limiting
  AI_PROVIDER_API_USAGE: (keyId: string) => `ai:provider:usage:${keyId}`,
  AI_PROVIDER_API_DAILY: (keyId: string, date: string) =>
    `ai:provider:daily:${keyId}:${date}`,
  AGENT_RATE_LIMIT: (agentId: string, action: string) =>
    `ai:agent:rate:${agentId}:${action}`,

  // Rate limit result caching (prevents repeated checks within short window)
  AGENT_RATE_LIMIT_RESULT: (agentId: string, action: string, date: string) =>
    `ai:agent:rate:result:${agentId}:${action}:${date}`,

  // Agent state
  AGENT_LAST_ACTION: (agentId: string) => `ai:agent:last:${agentId}`,
  AGENT_ACTIVE_LIST: "ai:agents:active",

  // Content hashes for duplicate detection
  CONTENT_HASH: (hash: string) => `ai:content:hash:${hash}`,
  AGENT_CONTENT_HASHES: (agentId: string) => `ai:agent:hashes:${agentId}`,

  // Circuit breaker
  AI_PROVIDER_CIRCUIT_STATE: "ai:provider:circuit:state",
  AI_PROVIDER_FAILURE_COUNT: "ai:provider:circuit:failures",

  // Stats
  AI_STATS_DAILY: (date: string) => `ai:stats:daily:${date}`,
  AI_STATS_AGENT: (agentId: string) => `ai:stats:agent:${agentId}`,

  // Topic diversity (AC-076, AC-080)
  // Stores recent topics used by an agent as a Redis LIST
  AGENT_RECENT_TOPICS: (agentId: string) => `ai:agent:topics:${agentId}`,
} as const;

/**
 * AI Cache TTLs (in seconds).
 * Values are tuned based on data volatility and operational requirements.
 */
export const AI_CACHE_TTL = {
  RATE_LIMIT_WINDOW: 60, // 1 minute for rate limit windows
  DAILY_USAGE: 86400, // 24 hours for daily usage counters
  RATE_LIMIT_RESULT: 300, // 5 minutes for rate limit check results (reduces repeated checks)
  CONTENT_HASH: 604800, // 7 days for content hashes
  AGENT_LAST_ACTION: 3600, // 1 hour for last action timestamp
  ACTIVE_AGENTS_LIST: 300, // 5 minutes for active agents list
  CIRCUIT_STATE: 300, // 5 minutes for circuit breaker state
  STATS_DAILY: 86400, // 24 hours for daily stats
  STATS_AGENT: 3600, // 1 hour for agent stats
  RECENT_TOPICS: 604800, // 7 days for recent topics (AC-080)
} as const;

/**
 * Pricing Page Cache Keys.
 * Used for caching public pricing data.
 */
export const PRICING_CACHE_KEYS = {
  PUBLIC_SERVICES: "pricing:public:services",
  PUBLIC_FAQS: "pricing:public:faqs",
  PUBLIC_CATEGORIES: "pricing:public:categories",
} as const;

/**
 * Pricing Cache TTL (in seconds).
 * 5 minutes for public pricing data - rarely changes.
 */
export const PRICING_CACHE_TTL = 300; // 5 minutes

/**
 * Chatbot Cache Keys.
 * Used for session management, rate limiting, and circuit breaker.
 */
export const CHATBOT_CACHE_KEYS = {
  SESSION: (sessionId: string) => `chatbot:session:${sessionId}`,
  RATE_MIN: (sessionId: string) => `chatbot:rate:${sessionId}:min`,
  RATE_HOUR: (sessionId: string) => `chatbot:rate:${sessionId}:hour`,
  CIRCUIT_STATE: "chatbot:groq:circuit:state",
  CIRCUIT_FAILURES: "chatbot:groq:circuit:failures",
} as const;

/**
 * Chatbot Cache TTLs (in seconds).
 */
export const CHATBOT_SESSION_TTL = 3600; // 1 hour for session data
export const CHATBOT_RATE_TTL_MIN = 60; // 1 minute for per-minute rate limit
export const CHATBOT_RATE_TTL_HOUR = 3600; // 1 hour for per-hour rate limit

/**
 * Blog Cache Keys.
 * Used for caching blog posts, categories, and lists.
 */
export const BLOG_CACHE_KEYS = {
  POST: (slug: string) => `blog:post:${slug}`,
  LIST: (page: number, limit: number, category?: string) =>
    `blog:list:${page}:${limit}:${category || "all"}`,
  CATEGORIES: () => "blog:categories",
  BY_TOPIC: (topic: string, page: number, limit: number) =>
    `blog:topic:${topic}:${page}:${limit}`,
} as const;

/**
 * Blog Cache TTLs (in seconds).
 */
export const BLOG_CACHE_TTL = {
  POST: 600, // 10 minutes for single post
  LIST: 300, // 5 minutes for post list
  CATEGORIES: 3600, // 1 hour for categories
  BY_TOPIC: 300, // 5 minutes for topic posts
} as const;

/**
 * Popular Posts Cache Keys.
 * Used for caching popular posts widget data.
 */
export const POPULAR_POSTS_CACHE_KEYS = {
  LIST: (limit: number) => `posts:popular:${limit}`,
} as const;

/**
 * Popular Posts Cache TTL (in seconds).
 * 1 hour for popular posts (engagement scores don't change rapidly).
 */
export const POPULAR_POSTS_CACHE_TTL = 3600; // 1 hour

/**
 * Sitemap Cache Keys.
 * Used for caching generated sitemap XML with pagination support.
 */
export const SITEMAP_CACHE_KEYS = {
  INDEX: () => "sitemap:index",
  POSTS: (page: number) => `sitemap:posts:${page}`,
  USERS: (page: number) => `sitemap:users:${page}`,
  HASHTAGS: (page: number) => `sitemap:hashtags:${page}`,
  BLOG: (page: number) => `sitemap:blog:${page}`,
  IMAGES: (page: number) => `sitemap:images:${page}`,
  STATIC: () => "sitemap:static",
  // Count cache for pagination calculation
  COUNT_POSTS: () => "sitemap:count:posts",
  COUNT_USERS: () => "sitemap:count:users",
  COUNT_HASHTAGS: () => "sitemap:count:hashtags",
  COUNT_BLOG: () => "sitemap:count:blog",
  COUNT_IMAGES: () => "sitemap:count:images",
} as const;

/**
 * Sitemap Cache TTL (in seconds).
 * 1 hour for sitemaps (content doesn't change frequently).
 */
export const SITEMAP_CACHE_TTL = 3600; // 1 hour

/**
 * Sitemap Count Cache TTL (in seconds).
 * 5 minutes for counts (used for pagination calculation).
 */
export const SITEMAP_COUNT_CACHE_TTL = 300; // 5 minutes
