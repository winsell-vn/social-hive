import { Processor, Process } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { PrismaService } from "../../prisma/prisma.service";
import { NotificationType } from "@prisma/client";

export interface NotificationJob {
  userId: string;
  type: NotificationType;
  title: string;
  data?: Record<string, unknown>;
}

@Processor("notification")
export class NotificationProcessor {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process("create")
  async handleCreate(job: Job<NotificationJob>) {
    this.logger.log(`Creating notification for user ${job.data.userId}`);

    await this.prisma.notification.create({
      data: {
        userId: job.data.userId,
        type: job.data.type,
        title: job.data.title,
        data: job.data.data ? JSON.stringify(job.data.data) : null,
      },
    });

    return { success: true };
  }

  @Process("batch")
  async handleBatch(job: Job<{ notifications: NotificationJob[] }>) {
    this.logger.log(`Creating ${job.data.notifications.length} notifications`);

    await this.prisma.notification.createMany({
      data: job.data.notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        data: n.data ? JSON.stringify(n.data) : null,
      })),
    });

    return { success: true, count: job.data.notifications.length };
  }
}
