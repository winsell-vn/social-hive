import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../../../redis/redis.service";
import { ConfigService } from "@nestjs/config";
import {
  CHATBOT_CACHE_KEYS,
  CHATBOT_RATE_TTL_MIN,
  CHATBOT_RATE_TTL_HOUR,
} from "../../../redis/cache-keys";

export interface RateLimitResult {
  allowed: boolean;
  remainingPerMin: number;
  remainingPerHour: number;
  retryAfterSeconds?: number;
}

@Injectable()
export class ChatbotRateLimiterService {
  private readonly logger = new Logger(ChatbotRateLimiterService.name);
  private readonly limitPerMin: number;
  private readonly limitPerHour: number;

  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {
    this.limitPerMin = this.configService.get<number>(
      "CHATBOT_RATE_LIMIT_PER_MIN",
      5,
    );
    this.limitPerHour = this.configService.get<number>(
      "CHATBOT_RATE_LIMIT_PER_HOUR",
      50,
    );
  }

  /**
   * Check rate limit for a session and increment counters if allowed
   */
  async checkRateLimit(sessionId: string): Promise<RateLimitResult> {
    const minKey = CHATBOT_CACHE_KEYS.RATE_MIN(sessionId);
    const hourKey = CHATBOT_CACHE_KEYS.RATE_HOUR(sessionId);

    // Check minute limit
    const minCount = await this.incrementCounter(minKey, CHATBOT_RATE_TTL_MIN);
    if (minCount > this.limitPerMin) {
      const ttl = await this.redisService.ttl(minKey);
      this.logger.warn(
        `Rate limited (per-min): session=${sessionId}, count=${minCount}`,
      );
      return {
        allowed: false,
        remainingPerMin: 0,
        remainingPerHour: Math.max(
          0,
          this.limitPerHour - (await this.getCount(hourKey)),
        ),
        retryAfterSeconds: ttl > 0 ? ttl : CHATBOT_RATE_TTL_MIN,
      };
    }

    // Check hour limit
    const hourCount = await this.incrementCounter(
      hourKey,
      CHATBOT_RATE_TTL_HOUR,
    );
    if (hourCount > this.limitPerHour) {
      const ttl = await this.redisService.ttl(hourKey);
      this.logger.warn(
        `Rate limited (per-hour): session=${sessionId}, count=${hourCount}`,
      );
      return {
        allowed: false,
        remainingPerMin: Math.max(0, this.limitPerMin - minCount),
        remainingPerHour: 0,
        retryAfterSeconds: ttl > 0 ? ttl : CHATBOT_RATE_TTL_HOUR,
      };
    }

    return {
      allowed: true,
      remainingPerMin: Math.max(0, this.limitPerMin - minCount),
      remainingPerHour: Math.max(0, this.limitPerHour - hourCount),
    };
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(sessionId: string): Promise<RateLimitResult> {
    const minKey = CHATBOT_CACHE_KEYS.RATE_MIN(sessionId);
    const hourKey = CHATBOT_CACHE_KEYS.RATE_HOUR(sessionId);

    const minCount = await this.getCount(minKey);
    const hourCount = await this.getCount(hourKey);

    return {
      allowed: minCount < this.limitPerMin && hourCount < this.limitPerHour,
      remainingPerMin: Math.max(0, this.limitPerMin - minCount),
      remainingPerHour: Math.max(0, this.limitPerHour - hourCount),
    };
  }

  /**
   * Increment a counter in Redis atomically using INCR.
   * Sets TTL only on first creation to avoid resetting expiry.
   */
  private async incrementCounter(
    key: string,
    ttlSeconds: number,
  ): Promise<number> {
    const newValue = await this.redisService.incr(key);
    // Set TTL only on first increment (when counter is 1)
    if (newValue === 1) {
      await this.redisService.expire(key, ttlSeconds);
    }
    return newValue;
  }

  /**
   * Get current count for a key
   */
  private async getCount(key: string): Promise<number> {
    const value = await this.redisService.get<string>(key);
    return value !== null ? parseInt(String(value), 10) : 0;
  }
}
