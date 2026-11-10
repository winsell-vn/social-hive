import { Global, Module } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { RedisHealthService } from "../common/services/redis-health.service";
import { CacheInvalidationService } from "./cache-invalidation.service";
import { CacheWarmingService } from "./cache-warming.service";

@Global()
@Module({
  providers: [
    RedisService,
    RedisHealthService,
    CacheInvalidationService,
    CacheWarmingService,
  ],
  exports: [
    RedisService,
    RedisHealthService,
    CacheInvalidationService,
    CacheWarmingService,
  ],
})
export class RedisModule {}
