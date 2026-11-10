import { Module, OnModuleInit, Logger } from "@nestjs/common";
import { BullModule, InjectQueue } from "@nestjs/bull";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Queue } from "bull";
import { EmailProcessor } from "./processors/email.processor";
import { NotificationProcessor } from "./processors/notification.processor";
import { PostPublishProcessor } from "./processors/post-publish.processor";
import { KarmaDecayProcessor } from "./processors/karma-decay.processor";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [
    PrismaModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get("REDIS_HOST", "localhost"),
          port: configService.get("REDIS_PORT", 6379),
          password: configService.get("REDIS_PASSWORD") || undefined,
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: "exponential",
            delay: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      { name: "email" },
      { name: "notification" },
      { name: "post-publish" },
      { name: "karma-decay" },
    ),
  ],
  providers: [
    EmailProcessor,
    NotificationProcessor,
    PostPublishProcessor,
    KarmaDecayProcessor,
  ],
  exports: [BullModule],
})
export class QueueModule implements OnModuleInit {
  private readonly logger = new Logger(QueueModule.name);

  constructor(@InjectQueue("karma-decay") private karmaDecayQueue: Queue) {}

  async onModuleInit() {
    // Schedule weekly karma decay job
    // Run every Sunday at 00:00 UTC
    const existingJobs = await this.karmaDecayQueue.getRepeatableJobs();
    const hasDecayJob = existingJobs.some(
      (job) => job.name === "process-decay",
    );

    if (!hasDecayJob) {
      await this.karmaDecayQueue.add(
        "process-decay",
        { triggeredAt: new Date() },
        {
          repeat: {
            cron: "0 0 * * 0", // Every Sunday at midnight
          },
        },
      );
      this.logger.log("Scheduled weekly karma decay job");
    }
  }
}
