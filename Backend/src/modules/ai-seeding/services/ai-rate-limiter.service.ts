import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../../../redis/redis.service";
import { AI_CACHE_KEYS, AI_CACHE_TTL } from "../../../redis/cache-keys";

export interface RateLimitConfig {
  maxRequests: number; // Maximum requests allowed
  windowMs: number; // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds until next allowed request
}

// Groq API rate limits (free tier)
export const AI_PROVIDER_RATE_LIMITS = {
  RPM: 30, // Requests per minute
  RPD: 14400, // Requests per day
  TPM: 6000, // Tokens per minute (for llama-3.1-8b-instant)
} as const;

// AI Agent action rate limits (per agent per day)
export const AGENT_ACTION_LIMITS = {
  POST: 20, // Max posts per day
  COMMENT: 50, // Max comments per day
  REPLY: 30, // Max replies per day
  REACTION: 100, // Max reactions per day
  MESSAGE: 20, // Max messages per day
  SHARE: 10, // Max shares per day (AC-059)
} as const;

@Injectable()
export class AiRateLimiterService {
  private readonly logger = new Logger(AiRateLimiterService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Check and consume rate limit for Groq API (per API key)
   */
  async checkProviderRateLimit(apiKeyId: string): Promise<RateLimitResult> {
    const now = Date.now();
    const minuteKey = AI_CACHE_KEYS.AI_PROVIDER_API_USAGE(apiKeyId);
    const today = new Date().toISOString().split("T")[0];
    const dailyKey = AI_CACHE_KEYS.AI_PROVIDER_API_DAILY(apiKeyId, today);

    // Check minute limit
    const minuteCount = await this.redisService.get<string>(minuteKey);
    const currentMinuteCount = minuteCount ? parseInt(minuteCount, 10) : 0;

    if (currentMinuteCount >= AI_PROVIDER_RATE_LIMITS.RPM) {
      const ttl = await this.redisService.ttl(minuteKey);
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(now + (ttl > 0 ? ttl * 1000 : 60000)),
        retryAfter: ttl > 0 ? ttl : 60,
      };
    }

    // Check daily limit
    const dailyCount = await this.redisService.get<string>(dailyKey);
    const currentDailyCount = dailyCount ? parseInt(dailyCount, 10) : 0;

    if (currentDailyCount >= AI_PROVIDER_RATE_LIMITS.RPD) {
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const secondsUntilMidnight = Math.ceil((midnight.getTime() - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt: midnight,
        retryAfter: secondsUntilMidnight,
      };
    }

    // Increment counters
    await this.incrementCounter(minuteKey, AI_CACHE_TTL.RATE_LIMIT_WINDOW);
    await this.incrementCounter(dailyKey, AI_CACHE_TTL.DAILY_USAGE);

    return {
      allowed: true,
      remaining: Math.min(
        AI_PROVIDER_RATE_LIMITS.RPM - currentMinuteCount - 1,
        AI_PROVIDER_RATE_LIMITS.RPD - currentDailyCount - 1,
      ),
      resetAt: new Date(now + 60000),
    };
  }

  /**
   * Check and consume rate limit for AI agent actions
   */
  async checkAgentActionLimit(
    agentId: string,
    action: keyof typeof AGENT_ACTION_LIMITS,
  ): Promise<RateLimitResult> {
    const now = Date.now();
    const today = new Date().toISOString().split("T")[0];
    const key = `${AI_CACHE_KEYS.AGENT_RATE_LIMIT(agentId, action)}:${today}`;
    const limit = AGENT_ACTION_LIMITS[action];

    const currentCount = await this.redisService.get<string>(key);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    if (count >= limit) {
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const secondsUntilMidnight = Math.ceil((midnight.getTime() - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetAt: midnight,
        retryAfter: secondsUntilMidnight,
      };
    }

    // Increment counter
    await this.incrementCounter(key, AI_CACHE_TTL.DAILY_USAGE);

    // Invalidate cached usage stats since count changed
    const usageCacheKey = AI_CACHE_KEYS.AGENT_RATE_LIMIT_RESULT(
      agentId,
      "usage",
      today,
    );
    await this.redisService.del(usageCacheKey);

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetAt: new Date(now + AI_CACHE_TTL.DAILY_USAGE * 1000),
    };
  }

  /**
   * Get current usage stats for an API key
   */
  async getApiKeyUsage(apiKeyId: string): Promise<{
    minuteUsage: number;
    dailyUsage: number;
    minuteLimit: number;
    dailyLimit: number;
  }> {
    const minuteKey = AI_CACHE_KEYS.AI_PROVIDER_API_USAGE(apiKeyId);
    const today = new Date().toISOString().split("T")[0];
    const dailyKey = AI_CACHE_KEYS.AI_PROVIDER_API_DAILY(apiKeyId, today);

    const [minuteCount, dailyCount] = await Promise.all([
      this.redisService.get<string>(minuteKey),
      this.redisService.get<string>(dailyKey),
    ]);

    return {
      minuteUsage: minuteCount ? parseInt(minuteCount, 10) : 0,
      dailyUsage: dailyCount ? parseInt(dailyCount, 10) : 0,
      minuteLimit: AI_PROVIDER_RATE_LIMITS.RPM,
      dailyLimit: AI_PROVIDER_RATE_LIMITS.RPD,
    };
  }

  /**
   * Get current usage stats for an agent (with caching)
   * Caches the result for 5 minutes to reduce Redis calls during scheduling
   */
  async getAgentUsage(
    agentId: string,
  ): Promise<Record<string, { used: number; limit: number }>> {
    const today = new Date().toISOString().split("T")[0];
    const cacheKey = AI_CACHE_KEYS.AGENT_RATE_LIMIT_RESULT(
      agentId,
      "usage",
      today,
    );

    // Try to get cached usage stats
    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const actions = Object.keys(
          AGENT_ACTION_LIMITS,
        ) as (keyof typeof AGENT_ACTION_LIMITS)[];
        const usage: Record<string, { used: number; limit: number }> = {};

        // Batch fetch all action counts in parallel
        const keys = actions.map(
          (action) =>
            `${AI_CACHE_KEYS.AGENT_RATE_LIMIT(agentId, action)}:${today}`,
        );

        const counts = await Promise.all(
          keys.map((key) => this.redisService.get<string>(key)),
        );

        actions.forEach((action, index) => {
          const count = counts[index];
          usage[action] = {
            used: count ? parseInt(count, 10) : 0,
            limit: AGENT_ACTION_LIMITS[action],
          };
        });

        return usage;
      },
      AI_CACHE_TTL.RATE_LIMIT_RESULT,
    );
  }

  /**
   * Reset rate limits for an API key (admin function)
   */
  async resetApiKeyLimits(apiKeyId: string): Promise<void> {
    const minuteKey = AI_CACHE_KEYS.AI_PROVIDER_API_USAGE(apiKeyId);
    const today = new Date().toISOString().split("T")[0];
    const dailyKey = AI_CACHE_KEYS.AI_PROVIDER_API_DAILY(apiKeyId, today);

    await Promise.all([
      this.redisService.del(minuteKey),
      this.redisService.del(dailyKey),
    ]);

    this.logger.log(`Rate limits reset for API key: ${apiKeyId}`);
  }

  /**
   * Reset rate limits for an agent (admin function)
   */
  async resetAgentLimits(agentId: string): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    const actions = Object.keys(
      AGENT_ACTION_LIMITS,
    ) as (keyof typeof AGENT_ACTION_LIMITS)[];

    await Promise.all(
      actions.map((action) => {
        const key = `${AI_CACHE_KEYS.AGENT_RATE_LIMIT(agentId, action)}:${today}`;
        return this.redisService.del(key);
      }),
    );

    // Invalidate cached usage stats
    const usageCacheKey = AI_CACHE_KEYS.AGENT_RATE_LIMIT_RESULT(
      agentId,
      "usage",
      today,
    );
    await this.redisService.del(usageCacheKey);

    this.logger.log(`Rate limits reset for agent: ${agentId}`);
  }

  /**
   * Calculate delay for natural behavior (randomized timing)
   */
  calculateNaturalDelay(
    baseDelayMs: number,
    variancePercent: number = 30,
  ): number {
    const variance = baseDelayMs * (variancePercent / 100);
    const randomVariance = (Math.random() * 2 - 1) * variance;
    return Math.max(1000, Math.round(baseDelayMs + randomVariance));
  }

  /**
   * Check if agent is within activity window
   */
  isWithinActivityWindow(
    activityWindow: {
      startHour: number;
      endHour: number;
      timezone?: string;
    } | null,
  ): boolean {
    if (!activityWindow) return true;

    const {
      startHour,
      endHour,
      timezone = "Asia/Ho_Chi_Minh",
    } = activityWindow;

    // Get current hour in the specified timezone
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      hour12: false,
      timeZone: timezone,
    });
    const currentHour = parseInt(formatter.format(now), 10);

    // Handle overnight windows (e.g., 22:00 - 06:00)
    if (startHour > endHour) {
      return currentHour >= startHour || currentHour < endHour;
    }

    return currentHour >= startHour && currentHour < endHour;
  }

  /**
   * Increment a counter in Redis with TTL
   */
  private async incrementCounter(
    key: string,
    ttlSeconds: number,
  ): Promise<number> {
    const exists = await this.redisService.get<string>(key);

    if (exists) {
      const newValue = parseInt(exists, 10) + 1;
      const ttl = await this.redisService.ttl(key);
      await this.redisService.set(
        key,
        newValue.toString(),
        ttl > 0 ? ttl : ttlSeconds,
      );
      return newValue;
    } else {
      await this.redisService.set(key, "1", ttlSeconds);
      return 1;
    }
  }
}
