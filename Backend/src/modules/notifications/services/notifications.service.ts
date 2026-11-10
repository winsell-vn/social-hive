import { Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { NotificationType } from "@prisma/client";
import { NotificationsRepository } from "../repositories/notifications.repository";
import {
  CreateNotificationInput,
  NotificationData,
  NOTIFICATION_TITLES,
} from "../types/notification.types";
import { PaginatedResult } from "../../../common/dto/pagination.dto";
import { RedisService } from "../../../redis/redis.service";
import { CacheInvalidationService } from "../../../redis/cache-invalidation.service";
import { CACHE_KEYS, CACHE_TTL } from "../../../redis/cache-keys";

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private notificationsRepository: NotificationsRepository,
    @InjectQueue("notification") private notificationQueue: Queue,
    private readonly redisService: RedisService,
    private readonly cacheInvalidationService: CacheInvalidationService,
  ) {}

  async create(input: CreateNotificationInput) {
    this.logger.log(
      `Creating notification for user ${input.userId}: ${input.type}`,
    );

    const notification = await this.notificationsRepository.create({
      user: { connect: { id: input.userId } },
      type: input.type,
      title: input.title,
      data: input.data ? JSON.stringify(input.data) : null,
    });

    // Invalidate unread count cache for the user
    await this.cacheInvalidationService.onNotificationCreated(input.userId);

    return notification;
  }

  async createViaQueue(input: CreateNotificationInput) {
    await this.notificationQueue.add("create", {
      userId: input.userId,
      type: input.type,
      title: input.title,
      data: input.data,
    });
  }

  async createBatchViaQueue(notifications: CreateNotificationInput[]) {
    await this.notificationQueue.add("batch", { notifications });
  }

  async getNotifications(
    userId: string,
    page: number,
    limit: number,
    unreadOnly?: boolean,
    type?: NotificationType,
  ) {
    const { notifications, total } =
      await this.notificationsRepository.findByUserId(userId, {
        skip: (page - 1) * limit,
        take: limit,
        unreadOnly,
        type,
      });

    return new PaginatedResult(notifications, page, limit, total);
  }

  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = CACHE_KEYS.NOTIFICATION_UNREAD(userId);

    return this.redisService.getOrSet(
      cacheKey,
      () => this.notificationsRepository.getUnreadCount(userId),
      CACHE_TTL.NOTIFICATION_UNREAD,
    );
  }

  async markAsRead(id: string, userId: string) {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification || notification.userId !== userId) {
      return null;
    }

    const result = await this.notificationsRepository.markAsRead(id);

    // Invalidate unread count cache for the user
    await this.cacheInvalidationService.onNotificationRead(userId);

    return result;
  }

  async markAllAsRead(userId: string) {
    const result = await this.notificationsRepository.markAllAsRead(userId);
    this.logger.log(
      `Marked ${result.count} notifications as read for user ${userId}`,
    );

    // Invalidate unread count cache for the user
    await this.cacheInvalidationService.onAllNotificationsRead(userId);

    return { count: result.count };
  }

  async delete(id: string, userId: string) {
    const notification = await this.notificationsRepository.findById(id);
    if (!notification || notification.userId !== userId) {
      return null;
    }

    await this.notificationsRepository.delete(id);
    return { success: true };
  }

  // Helper methods for creating specific notification types
  async notifyPostApproved(
    userId: string,
    postId: string,
    postContent: string,
  ) {
    const title = NOTIFICATION_TITLES.POST_APPROVED;
    const data: NotificationData = {
      postId,
      postContent: postContent.substring(0, 100),
    };

    return this.createViaQueue({
      userId,
      type: NotificationType.POST_APPROVED,
      title,
      data,
    });
  }

  async notifyPostRejected(
    userId: string,
    postId: string,
    postContent: string,
    reason?: string,
  ) {
    const title = NOTIFICATION_TITLES.POST_REJECTED;
    const data: NotificationData = {
      postId,
      postContent: postContent.substring(0, 100),
      reason,
    };

    return this.createViaQueue({
      userId,
      type: NotificationType.POST_REJECTED,
      title,
      data,
    });
  }

  async notifyPostLiked(
    postAuthorId: string,
    actorId: string,
    actorUsername: string,
    actorName: string,
    actorAvatar: string | null,
    postId: string,
    reactionType: string,
    postAuthorUsername: string,
  ) {
    // Don't notify if user liked their own post
    if (postAuthorId === actorId) return;

    const title = `${actorName} ${NOTIFICATION_TITLES.POST_LIKED}`;
    const data: NotificationData = {
      actorId,
      actorUsername,
      actorName,
      actorAvatar: actorAvatar || undefined,
      postId,
      postAuthorUsername,
      reactionType,
    };

    return this.createViaQueue({
      userId: postAuthorId,
      type: NotificationType.POST_LIKED,
      title,
      data,
    });
  }

  async notifyPostCommented(
    postAuthorId: string,
    actorId: string,
    actorUsername: string,
    actorName: string,
    actorAvatar: string | null,
    postId: string,
    commentId: string,
    commentContent: string,
    postAuthorUsername: string,
  ) {
    if (postAuthorId === actorId) return;

    const title = `${actorName} ${NOTIFICATION_TITLES.POST_COMMENTED}`;
    const data: NotificationData = {
      actorId,
      actorUsername,
      actorName,
      actorAvatar: actorAvatar || undefined,
      postId,
      postAuthorUsername,
      commentId,
      commentContent: commentContent.substring(0, 100),
    };

    return this.createViaQueue({
      userId: postAuthorId,
      type: NotificationType.POST_COMMENTED,
      title,
      data,
    });
  }

  async notifyCommentReplied(
    parentCommentAuthorId: string,
    actorId: string,
    actorUsername: string,
    actorName: string,
    actorAvatar: string | null,
    postId: string,
    commentId: string,
    commentContent: string,
    postAuthorUsername: string,
  ) {
    if (parentCommentAuthorId === actorId) return;

    const title = `${actorName} ${NOTIFICATION_TITLES.COMMENT_REPLIED}`;
    const data: NotificationData = {
      actorId,
      actorUsername,
      actorName,
      actorAvatar: actorAvatar || undefined,
      postId,
      postAuthorUsername,
      commentId,
      commentContent: commentContent.substring(0, 100),
    };

    return this.createViaQueue({
      userId: parentCommentAuthorId,
      type: NotificationType.COMMENT_REPLIED,
      title,
      data,
    });
  }

  async notifyNewFollower(
    followedUserId: string,
    actorId: string,
    actorUsername: string,
    actorName: string,
    actorAvatar: string | null,
  ) {
    const title = `${actorName} ${NOTIFICATION_TITLES.NEW_FOLLOWER}`;
    const data: NotificationData = {
      actorId,
      actorUsername,
      actorName,
      actorAvatar: actorAvatar || undefined,
    };

    return this.createViaQueue({
      userId: followedUserId,
      type: NotificationType.NEW_FOLLOWER,
      title,
      data,
    });
  }

  async notifyMention(
    mentionedUserId: string,
    actorId: string,
    actorUsername: string,
    actorName: string,
    actorAvatar: string | null,
    postId?: string,
    commentId?: string,
  ) {
    if (mentionedUserId === actorId) return;

    const title = `${actorName} ${NOTIFICATION_TITLES.MENTION}`;
    const data: NotificationData = {
      actorId,
      actorUsername,
      actorName,
      actorAvatar: actorAvatar || undefined,
      postId,
      commentId,
    };

    return this.createViaQueue({
      userId: mentionedUserId,
      type: NotificationType.MENTION,
      title,
      data,
    });
  }

  async notifyFriendRequest(
    receiverId: string,
    senderId: string,
    senderUsername: string,
    senderName: string,
    senderAvatar: string | null,
  ) {
    const title = `${senderName} ${NOTIFICATION_TITLES.FRIEND_REQUEST_RECEIVED}`;
    const data: NotificationData = {
      actorId: senderId,
      actorUsername: senderUsername,
      actorName: senderName,
      actorAvatar: senderAvatar || undefined,
    };

    return this.createViaQueue({
      userId: receiverId,
      type: NotificationType.FRIEND_REQUEST_RECEIVED,
      title,
      data,
    });
  }

  async notifyFriendRequestAccepted(
    senderId: string,
    receiverId: string,
    receiverUsername: string,
    receiverName: string,
    receiverAvatar: string | null,
  ) {
    const title = `${receiverName} ${NOTIFICATION_TITLES.FRIEND_REQUEST_ACCEPTED}`;
    const data: NotificationData = {
      actorId: receiverId,
      actorUsername: receiverUsername,
      actorName: receiverName,
      actorAvatar: receiverAvatar || undefined,
    };

    return this.createViaQueue({
      userId: senderId,
      type: NotificationType.FRIEND_REQUEST_ACCEPTED,
      title,
      data,
    });
  }
}
