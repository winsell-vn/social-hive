import { Injectable } from "@nestjs/common";
import {
  HealthIndicatorResult,
  HealthIndicatorService,
} from "@nestjs/terminus";
import { RedisService } from "../../redis/redis.service";

@Injectable()
export class RedisHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly redisService: RedisService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);

    try {
      // Check circuit breaker status
      const circuitStatus = this.redisService.getCircuitStatus();

      if (circuitStatus.isOpen) {
        return indicator.down({
          circuitBreaker: "OPEN",
          failureCount: circuitStatus.failureCount,
        });
      }

      // Try a simple ping operation
      await this.redisService.set("health:ping", "pong", 10);
      const result = await this.redisService.get<string>("health:ping");

      if (result !== "pong") {
        return indicator.down({ error: "Ping mismatch" });
      }

      const metrics = this.redisService.getMetrics();

      return indicator.up({
        circuitBreaker: "CLOSED",
        metrics: {
          hitRate: `${metrics.hitRate.toFixed(1)}%`,
          hits: metrics.hits,
          misses: metrics.misses,
          errors: metrics.errors,
        },
      });
    } catch (error) {
      return indicator.down({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
