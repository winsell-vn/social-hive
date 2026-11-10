import { Injectable } from "@nestjs/common";
import { NotificationType, Prisma } from "@prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class NotificationsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.NotificationCreateInput) {
    return this.prisma.notification.create({ data });
  }

  async createMany(data: Prisma.NotificationCreateManyInput[]) {
    return this.prisma.notification.createMany({ data });
  }

  async findById(id: string) {
    return this.prisma.notification.findUnique({ where: { id } });
  }

  async findByUserId(
    userId: string,
    options: {
      skip?: number;
      take?: number;
      unreadOnly?: boolean;
      type?: NotificationType;
    } = {},
  ) {
    const { skip = 0, take = 20, unreadOnly, type } = options;

    const where: Prisma.NotificationWhereInput = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }
    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async delete(id: string) {
    return this.prisma.notification.delete({ where: { id } });
  }

  async deleteOldNotifications(userId: string, olderThanDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return this.prisma.notification.deleteMany({
      where: {
        userId,
        createdAt: { lt: cutoffDate },
        isRead: true,
      },
    });
  }

  // Find existing notification for batching purposes
  async findRecentSimilar(
    userId: string,
    type: NotificationType,
    targetId: string,
    withinMinutes: number = 5,
  ) {
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - withinMinutes);

    // Since data is stored as a JSON string, we need to fetch and filter manually
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId,
        type,
        createdAt: { gte: cutoffTime },
      },
      orderBy: { createdAt: "desc" },
    });

    // Find the first notification that matches the targetId in its data
    for (const notification of notifications) {
      if (!notification.data) continue;

      try {
        const data = JSON.parse(notification.data) as Record<string, unknown>;
        if (data.postId === targetId) {
          return notification;
        }
      } catch {
        // Invalid JSON, skip this notification
        continue;
      }
    }

    return null;
  }
}
