/**
 * Karma point values for various actions
 * User-provided values take priority over spec defaults
 */
export const KARMA_ACTIONS = {
  // Post moderation
  POST_APPROVED: 50,
  POST_REJECTED: -20,

  // Reactions/Likes
  RECEIVED_LIKE: 1,
  LIKE_MILESTONE_10: 5,
  LIKE_MILESTONE_50: 25,
  LIKE_MILESTONE_100: 50,

  // Comments
  COMMENT_RECEIVED: 2,

  // Daily activity
  DAILY_LOGIN: 1,

  // Spam penalty (from spec)
  SPAM_DELETED: -100,
} as const;

/**
 * Tier thresholds and metadata
 * Maps to Prisma Tier enum: NEWCOMER, CONTRIBUTOR, EXPERT, MASTER, LEGEND
 */
export const TIER_THRESHOLDS = {
  NEWCOMER: { min: 0, max: 99, icon: "🌱", label: "Newcomer", multiplier: 1.0 },
  CONTRIBUTOR: {
    min: 100,
    max: 499,
    icon: "⭐",
    label: "Regular",
    multiplier: 1.2,
  },
  EXPERT: {
    min: 500,
    max: 1999,
    icon: "🏅",
    label: "Trusted",
    multiplier: 1.5,
  },
  MASTER: {
    min: 2000,
    max: 4999,
    icon: "💎",
    label: "Veteran",
    multiplier: 2.0,
  },
  LEGEND: {
    min: 5000,
    max: Infinity,
    icon: "👑",
    label: "Legend",
    multiplier: 3.0,
  },
} as const;

/**
 * Anti-gaming limits
 */
export const KARMA_LIMITS = {
  // Max karma from likes per day
  MAX_DAILY_LIKE_KARMA: 500,

  // Max posts per day
  MAX_POSTS_PER_DAY: 10,

  // Max comments per day
  MAX_COMMENTS_PER_DAY: 100,

  // Max daily login karma (1 per day)
  MAX_DAILY_LOGIN_KARMA: 1,
} as const;

/**
 * Karma decay settings
 */
export const KARMA_DECAY = {
  // Days of inactivity before decay starts
  INACTIVE_DAYS_THRESHOLD: 90,

  // Decay percentage (5% = 0.05)
  DECAY_PERCENTAGE: 0.05,

  // Decay runs weekly
  DECAY_INTERVAL_DAYS: 7,
} as const;

/**
 * Like milestones that trigger bonus karma
 */
export const LIKE_MILESTONES = [
  { threshold: 10, bonus: KARMA_ACTIONS.LIKE_MILESTONE_10 },
  { threshold: 50, bonus: KARMA_ACTIONS.LIKE_MILESTONE_50 },
  { threshold: 100, bonus: KARMA_ACTIONS.LIKE_MILESTONE_100 },
] as const;

/**
 * Karma action types for transaction logging
 */
export enum KarmaActionType {
  POST_APPROVED = "POST_APPROVED",
  POST_REJECTED = "POST_REJECTED",
  RECEIVED_LIKE = "RECEIVED_LIKE",
  LIKE_MILESTONE = "LIKE_MILESTONE",
  COMMENT_RECEIVED = "COMMENT_RECEIVED",
  DAILY_LOGIN = "DAILY_LOGIN",
  SPAM_DELETED = "SPAM_DELETED",
  KARMA_DECAY = "KARMA_DECAY",
  ADMIN_ADJUSTMENT = "ADMIN_ADJUSTMENT",
}
