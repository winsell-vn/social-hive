import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService } from "@nestjs/terminus";
import { RedisHealthIndicator } from "./indicators/redis.health";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private redisHealth: RedisHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([() => this.redisHealth.isHealthy("redis")]);
  }

  @Get("redis")
  @HealthCheck()
  checkRedis() {
    return this.health.check([() => this.redisHealth.isHealthy("redis")]);
  }
}
