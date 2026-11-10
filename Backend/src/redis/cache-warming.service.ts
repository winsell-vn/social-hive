import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "./redis.service";

@Injectable()
export class CacheWarmingService implements OnModuleInit {
  private readonly logger = new Logger(CacheWarmingService.name);
  private readonly enableWarmup: boolean;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    // Only enable cache warming in production or when explicitly enabled
    this.enableWarmup = this.configService.get<boolean>(
      "CACHE_WARMUP_ENABLED",
      false,
    );
  }

  async onModuleInit() {
    if (!this.enableWarmup) {
      this.logger.log("Cache warming disabled");
      return;
    }

    this.logger.log("Starting cache warming...");
    const startTime = Date.now();

    try {
      await this.warmCriticalCaches();
      const duration = Date.now() - startTime;
      this.logger.log(`Cache warming completed in ${duration}ms`);
    } catch (error) {
      this.logger.error("Cache warming failed", error);
      // Don't throw - app should still start even if warming fails
    }
  }

  /**
   * Warm critical caches that are frequently accessed.
   * This runs on application startup to prevent cold cache issues.
   */
  private async warmCriticalCaches(): Promise<void> {
    const warmupTasks: Array<{ name: string; task: () => Promise<void> }> = [
      {
        name: "Public Groups (page 1)",
        task: () => this.warmPublicGroups(),
      },
      {
        name: "Admin Analytics",
        task: () => this.warmAdminAnalytics(),
      },
    ];

    // Run warmup tasks in parallel with individual error handling
    const results = await Promise.allSettled(
      warmupTasks.map(async ({ name, task }) => {
        try {
          await task();
          this.logger.debug(`Warmed: ${name}`);
        } catch (error) {
          this.logger.warn(`Failed to warm: ${name}`, error);
          throw error;
        }
      }),
    );

    const succeeded = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    this.logger.log(
      `Cache warming results: ${succeeded} succeeded, ${failed} failed`,
    );
  }

  /**
   * Warm public groups cache - frequently accessed on homepage.
   */
  private async warmPublicGroups(): Promise<void> {
    // This is a placeholder - the actual implementation would call GroupsService
    // We just set a marker to indicate warming was attempted
    await this.redisService.set("cache:warmup:public-groups", Date.now(), 60);
  }

  /**
   * Warm admin analytics cache - expensive aggregation query.
   */
  private async warmAdminAnalytics(): Promise<void> {
    // This is a placeholder - the actual implementation would call AdminService
    await this.redisService.set("cache:warmup:admin-analytics", Date.now(), 60);
  }
}
