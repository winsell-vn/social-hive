import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { CACHE_KEYS, CACHE_PATTERNS } from "./cache-keys";

/**
 * Service responsible for cache invalidation.
 * Provides methods to invalidate cache when data changes.
 *
 * Usage: Inject this service and call invalidation methods after mutations.
 * Example: After creating a post, call onPostCreated(authorUsername)
 *
 * @see .claude/specs/redis-caching-strategy/design.md for invalidation matrix
 */
@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  constructor(private readonly redisService: RedisService) {}

  // ==================== POST EVENTS ====================

  /**
   * Invalidate caches after a new post is created
   * @param authorUsername - Username of the post author
   */
  async onPostCreated(authorUsername: string): Promise<void> {
    this.logger.debug(
      `Invalidating caches after post created by ${authorUsername}`,
    );
    await Promise.all([
      this.redisService.delPattern(CACHE_PATTERNS.ALL_NEWSFEED),
      this.redisService.delPattern(CACHE_PATTERNS.ALL_POPULAR_POSTS),
      this.redisService.del(CACHE_KEYS.PROFILE_COUNTS(authorUsername)),
    ]);
  }

  /**
   * Invalidate caches after a post is updated
   */
  async onPostUpdated(): Promise<void> {
    this.logger.debug("Invalidating newsfeed cache after post update");
    await Promise.all([
      this.redisService.delPattern(CACHE_PATTERNS.ALL_NEWSFEED),
      this.redisService.delPattern(CACHE_PATTERNS.ALL_POPULAR_POSTS),
    ]);
  }

  /**
   * Invalidate caches after a post is deleted
   * @param postId - ID of the deleted post
   * @param authorUsername - Username of the post author
   */
  async onPostDeleted(postId: string, authorUsername: string): Promise<void> {
    this.logger.debug(`Invalidating caches after post ${postId} deleted`);
    await Promise.all([
      this.redisService.delPattern(CACHE_PATTERNS.ALL_NEWSFEED),
      // Without this the popular posts widget keeps serving deleted posts
      // until POPULAR_POSTS_CACHE_TTL (1 hour) expires.
      this.redisService.delPattern(CACHE_PATTERNS.ALL_POPULAR_POSTS),
      this.redisService.del(CACHE_KEYS.PROFILE_COUNTS(authorUsername)),
      this.redisService.del(CACHE_KEYS.POST_REACTION_COUNTS(postId)),
    ]);
  }

  // ==================== NOTIFICATION EVENTS ====================

  /**
   * Invalidate notification count cache after new notification
   * @param userId - ID of the user who received the notification
   */
  async onNotificationCreated(userId: string): Promise<void> {
    this.logger.debug(`Invalidating notification count for user ${userId}`);
    await this.redisService.del(CACHE_KEYS.NOTIFICATION_UNREAD(userId));
  }

  /**
   * Invalidate notification count cache after notification is read
   * @param userId - ID of the user who read the notification
   */
  async onNotificationRead(userId: string): Promise<void> {
    this.logger.debug(`Invalidating notification count for user ${userId}`);
    await this.redisService.del(CACHE_KEYS.NOTIFICATION_UNREAD(userId));
  }

  /**
   * Invalidate notification count cache after all notifications are marked as read
   * @param userId - ID of the user
   */
  async onAllNotificationsRead(userId: string): Promise<void> {
    this.logger.debug(`Invalidating notification count for user ${userId}`);
    await this.redisService.del(CACHE_KEYS.NOTIFICATION_UNREAD(userId));
  }

  // ==================== PROFILE EVENTS ====================

  /**
   * Invalidate profile cache after profile is updated
   * @param username - Username of the updated profile
   */
  async onProfileUpdated(username: string): Promise<void> {
    this.logger.debug(`Invalidating profile cache for ${username}`);
    await Promise.all([
      this.redisService.del(CACHE_KEYS.PROFILE(username)),
      this.redisService.del(CACHE_KEYS.PROFILE_COUNTS(username)),
    ]);
  }

  // ==================== FRIEND EVENTS ====================

  /**
   * Invalidate caches after friend request is sent
   * @param senderId - ID of the user who sent the request
   * @param receiverId - ID of the user who received the request
   */
  async onFriendRequestSent(
    senderId: string,
    receiverId: string,
  ): Promise<void> {
    this.logger.debug(
      `Invalidating friend caches after request from ${senderId} to ${receiverId}`,
    );
    await Promise.all([
      this.redisService.del(CACHE_KEYS.FRIEND_SUGGESTIONS(senderId)),
      this.redisService.del(CACHE_KEYS.FRIEND_SUGGESTIONS(receiverId)),
      this.redisService.delPattern(`friends:pending:${senderId}:*`),
      this.redisService.delPattern(`friends:pending:${receiverId}:*`),
    ]);
  }

  /**
   * Invalidate caches after friend request is accepted
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   */
  async onFriendRequestAccepted(
    userId1: string,
    userId2: string,
  ): Promise<void> {
    this.logger.debug(
      `Invalidating friend caches after friendship between ${userId1} and ${userId2}`,
    );
    await Promise.all([
      this.redisService.delPattern(`friends:list:${userId1}:*`),
      this.redisService.delPattern(`friends:list:${userId2}:*`),
      this.redisService.del(CACHE_KEYS.FRIEND_SUGGESTIONS(userId1)),
      this.redisService.del(CACHE_KEYS.FRIEND_SUGGESTIONS(userId2)),
      this.redisService.delPattern(`friends:pending:${userId1}:*`),
      this.redisService.delPattern(`friends:pending:${userId2}:*`),
    ]);
  }

  /**
   * Invalidate caches after friend is removed
   * @param userId1 - First user ID
   * @param userId2 - Second user ID
   */
  async onFriendRemoved(userId1: string, userId2: string): Promise<void> {
    this.logger.debug(
      `Invalidating friend caches after unfriend between ${userId1} and ${userId2}`,
    );
    await Promise.all([
      this.redisService.delPattern(`friends:list:${userId1}:*`),
      this.redisService.delPattern(`friends:list:${userId2}:*`),
      this.redisService.del(CACHE_KEYS.FRIEND_SUGGESTIONS(userId1)),
      this.redisService.del(CACHE_KEYS.FRIEND_SUGGESTIONS(userId2)),
    ]);
  }

  // ==================== REACTION EVENTS ====================

  /**
   * Invalidate reaction count cache after reaction changes
   * @param postId - ID of the post
   */
  async onReactionChanged(postId: string): Promise<void> {
    this.logger.debug(`Invalidating reaction cache for post ${postId}`);
    await Promise.all([
      this.redisService.del(CACHE_KEYS.POST_REACTION_COUNTS(postId)),
      // Engagement score (view/like/comment counts) drives the popular posts
      // ordering, so the cached list is stale once a reaction changes.
      this.redisService.delPattern(CACHE_PATTERNS.ALL_POPULAR_POSTS),
    ]);
  }

  // ==================== GROUP EVENTS ====================

  /**
   * Invalidate group caches after group is created
   */
  async onGroupCreated(): Promise<void> {
    this.logger.debug("Invalidating public groups cache");
    await this.redisService.delPattern(CACHE_PATTERNS.ALL_GROUPS);
  }

  /**
   * Invalidate group caches after user joins/leaves group
   * @param userId - ID of the user
   */
  async onGroupMemberChanged(userId: string): Promise<void> {
    this.logger.debug(`Invalidating group cache for user ${userId}`);
    await this.redisService.delPattern(`groups:user:${userId}:*`);
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Invalidate all caches (use with caution - for maintenance only)
   */
  async invalidateAll(): Promise<void> {
    this.logger.warn("Invalidating ALL caches");
    await Promise.all([
      this.redisService.delPattern(CACHE_PATTERNS.ALL_NEWSFEED),
      this.redisService.delPattern(CACHE_PATTERNS.ALL_GROUPS),
      this.redisService.delPattern(CACHE_PATTERNS.ALL_POPULAR_POSTS),
      this.redisService.delPattern("profile:*"),
      this.redisService.delPattern("notifications:*"),
      this.redisService.delPattern("friends:*"),
      this.redisService.delPattern("search:*"),
      this.redisService.delPattern("reactions:*"),
      this.redisService.delPattern("admin:*"),
    ]);
  }

  /**
   * Invalidate newsfeed cache only
   */
  async invalidateNewsfeed(): Promise<void> {
    this.logger.debug("Invalidating newsfeed cache");
    await this.redisService.delPattern(CACHE_PATTERNS.ALL_NEWSFEED);
  }
}
