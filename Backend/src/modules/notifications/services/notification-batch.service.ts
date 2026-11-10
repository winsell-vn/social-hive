import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { NotificationType } from "@prisma/client";
import { NotificationsService } from "./notifications.service";
import {
  BatchedNotification,
  CreateNotificationInput,
  NOTIFICATION_TITLES,
} from "../types/notification.types";

interface BatchKey {
  userId: string;
  type: NotificationType;
  targetId: string;
}

interface BatchEntry {
  actors: Array<{
    id: string;
    name: string;
    avatar?: string;
  }>;
  targetId: string;
  createdAt: Date;
}

@Injectable()
export class NotificationBatchService {
  private readonly logger = new Logger(NotificationBatchService.name);
  private batchBuffer: Map<string, BatchEntry> = new Map();
  private readonly BATCH_WINDOW_MS = 3000; // 3 seconds

  constructor(private notificationsService: NotificationsService) {}

  private getBatchKey(
    userId: string,
    type: NotificationType,
    targetId: string,
  ): string {
    return `${userId}:${type}:${targetId}`;
  }

  async addToBatch(notification: BatchedNotification) {
    const key = this.getBatchKey(
      notification.userId,
      notification.type,
      notification.targetId,
    );

    const existing = this.batchBuffer.get(key);
    if (existing) {
      // Check if actor already exists
      const actorExists = existing.actors.some(
        (a) => a.id === notification.actorId,
      );
      if (!actorExists) {
        existing.actors.push({
          id: notification.actorId,
          name: notification.actorName,
          avatar: notification.actorAvatar,
        });
      }
    } else {
      this.batchBuffer.set(key, {
        actors: [
          {
            id: notification.actorId,
            name: notification.actorName,
            avatar: notification.actorAvatar,
          },
        ],
        targetId: notification.targetId,
        createdAt: new Date(),
      });
    }
  }

  // Process batches every 3 seconds
  @Cron(CronExpression.EVERY_5_SECONDS)
  async processBatches() {
    if (this.batchBuffer.size === 0) return;

    const now = Date.now();
    const toProcess: Array<{
      key: string;
      entry: BatchEntry;
      parsed: BatchKey;
    }> = [];

    // Find entries older than batch window
    for (const [key, entry] of this.batchBuffer.entries()) {
      if (now - entry.createdAt.getTime() >= this.BATCH_WINDOW_MS) {
        const [userId, type, targetId] = key.split(":");
        toProcess.push({
          key,
          entry,
          parsed: { userId, type: type as NotificationType, targetId },
        });
      }
    }

    if (toProcess.length === 0) return;

    this.logger.log(`Processing ${toProcess.length} batched notifications`);

    const notifications: CreateNotificationInput[] = [];

    for (const { key, entry, parsed } of toProcess) {
      this.batchBuffer.delete(key);

      const title = this.generateBatchedTitle(parsed.type, entry.actors);

      notifications.push({
        userId: parsed.userId,
        type: parsed.type,
        title,
        data: {
          actorId: entry.actors[0].id,
          actorName: entry.actors[0].name,
          actorAvatar: entry.actors[0].avatar,
          postId: parsed.type.includes("POST") ? parsed.targetId : undefined,
          commentId: parsed.type.includes("COMMENT")
            ? parsed.targetId
            : undefined,
          count: entry.actors.length,
        },
      });
    }

    if (notifications.length > 0) {
      await this.notificationsService.createBatchViaQueue(notifications);
    }
  }

  private generateBatchedTitle(
    type: NotificationType,
    actors: Array<{ name: string }>,
  ): string {
    const baseTitle = NOTIFICATION_TITLES[type];

    if (actors.length === 1) {
      return `${actors[0].name} ${baseTitle}`;
    } else if (actors.length === 2) {
      return `${actors[0].name} và ${actors[1].name} ${baseTitle}`;
    } else {
      const othersCount = actors.length - 1;
      return `${actors[0].name} và ${othersCount} người khác ${baseTitle}`;
    }
  }

  // Force flush all pending batches (useful for testing or shutdown)
  async flushAll() {
    const entries = Array.from(this.batchBuffer.entries());
    this.batchBuffer.clear();

    const notifications: CreateNotificationInput[] = [];

    for (const [key, entry] of entries) {
      const [userId, type, targetId] = key.split(":");
      const title = this.generateBatchedTitle(
        type as NotificationType,
        entry.actors,
      );

      notifications.push({
        userId,
        type: type as NotificationType,
        title,
        data: {
          actorId: entry.actors[0].id,
          actorName: entry.actors[0].name,
          actorAvatar: entry.actors[0].avatar,
          postId: type.includes("POST") ? targetId : undefined,
          commentId: type.includes("COMMENT") ? targetId : undefined,
          count: entry.actors.length,
        },
      });
    }

    if (notifications.length > 0) {
      await this.notificationsService.createBatchViaQueue(notifications);
    }

    return { flushed: notifications.length };
  }
}
