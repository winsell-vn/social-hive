import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;
  private subscriber: Redis;
  private publisher: Redis;

  // Cache metrics
  private cacheHits = 0;
  private cacheMisses = 0;
  private cacheErrors = 0;

  // Circuit breaker state
  private circuitOpen = false;
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private readonly FAILURE_THRESHOLD = 5;
  private readonly CIRCUIT_RESET_MS = 30000; // 30 seconds

  // Request coalescing - prevents cache stampede
  private inFlightRequests = new Map<string, Promise<any>>();

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const config = {
      host: this.configService.get("REDIS_HOST", "localhost"),
      port: this.configService.get("REDIS_PORT", 6379),
      password: this.configService.get("REDIS_PASSWORD") || undefined,
      retryStrategy: (times: number) => Math.min(times * 50, 2000),
    };

    this.client = new Redis(config);
    this.subscriber = new Redis(config);
    this.publisher = new Redis(config);

    this.client.on("connect", () => this.logger.log("Redis client connected"));
    this.client.on("error", (err) =>
      this.logger.error("Redis client error", err),
    );
  }

  async onModuleDestroy() {
    await Promise.all([
      this.client?.quit(),
      this.subscriber?.quit(),
      this.publisher?.quit(),
    ]);
  }

  getClient(): Redis {
    return this.client;
  }

  // Cache operations
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.client.get(key);
      if (value !== null) {
        this.logger.debug(`Cache HIT: ${key}`);
        return JSON.parse(value);
      }
      this.logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      this.logger.error(`Cache ERROR: ${key}`, error.stack);
      throw error;
    }
  }

  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setex(key, ttlSeconds, serialized);
        this.logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
      } else {
        await this.client.set(key, serialized);
        this.logger.debug(`Cache SET: ${key} (TTL: none)`);
      }
    } catch (error) {
      this.logger.error(`Cache ERROR: ${key}`, error.stack);
      throw error;
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.client.del(key);
      this.logger.debug(`Cache DEL: ${key}`);
    } catch (error) {
      this.logger.error(`Cache ERROR: ${key}`, error.stack);
      throw error;
    }
  }

  async delPattern(pattern: string): Promise<void> {
    try {
      // Use SCAN instead of KEYS: KEYS blocks the Redis server while it walks
      // the whole keyspace, which is unsafe on hot paths (e.g. every reaction
      // invalidates the popular posts cache).
      const keys: string[] = [];
      let cursor = "0";
      do {
        const [nextCursor, batch] = await this.client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;
        if (batch && batch.length > 0) {
          keys.push(...batch);
        }
      } while (cursor !== "0");

      if (keys.length > 0) {
        await this.client.del(...keys);
      }
      this.logger.debug(`Cache DEL PATTERN: ${pattern} (${keys.length} keys)`);
    } catch (error) {
      this.logger.error(`Cache ERROR: ${pattern}`, error.stack);
      throw error;
    }
  }

  /**
   * Get value from cache or compute and store it.
   * Implements cache-aside pattern with graceful fallback.
   *
   * @param key - Cache key
   * @param factory - Function to compute value on cache miss
   * @param ttlSeconds - Time to live in seconds
   * @returns Cached or computed value
   */
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number,
  ): Promise<T> {
    // Check if circuit should be reset (half-open state)
    if (this.circuitOpen && this.shouldResetCircuit()) {
      this.logger.log("Circuit breaker attempting reset (half-open state)");
      this.circuitOpen = false;
    }

    // If circuit is open, bypass cache entirely
    if (this.circuitOpen) {
      this.logger.warn(`Circuit breaker OPEN - bypassing cache for ${key}`);
      return factory();
    }

    try {
      // Try to get from cache
      const cached = await this.get<T>(key);
      if (cached !== null) {
        this.recordHit();
        this.resetCircuit(); // Success - reset circuit
        return cached;
      }

      // Cache miss - compute value
      this.recordMiss();
      const value = await factory();

      // Store in cache (don't await to not block response)
      this.set(key, value, ttlSeconds).catch((err) => {
        this.logger.error(`Cache ERROR: ${key}`, err.stack);
        this.recordFailure();
      });

      this.resetCircuit(); // Success - reset circuit
      return value;
    } catch (error) {
      // On Redis error, record failure and fallback to factory
      this.logger.error(`Cache ERROR: ${key}`, error.stack);
      this.recordFailure();
      return factory();
    }
  }

  /**
   * Same as getOrSet but waits for cache to be set.
   * Use when cache consistency is critical.
   *
   * @param key - Cache key
   * @param factory - Function to compute value on cache miss
   * @param ttlSeconds - Time to live in seconds
   * @returns Cached or computed value
   */
  async getOrSetSync<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number,
  ): Promise<T> {
    // Check if circuit should be reset (half-open state)
    if (this.circuitOpen && this.shouldResetCircuit()) {
      this.logger.log("Circuit breaker attempting reset (half-open state)");
      this.circuitOpen = false;
    }

    // If circuit is open, bypass cache entirely
    if (this.circuitOpen) {
      this.logger.warn(`Circuit breaker OPEN - bypassing cache for ${key}`);
      return factory();
    }

    try {
      const cached = await this.get<T>(key);
      if (cached !== null) {
        this.recordHit();
        this.resetCircuit(); // Success - reset circuit
        return cached;
      }

      this.recordMiss();
      const value = await factory();
      await this.set(key, value, ttlSeconds);
      this.resetCircuit(); // Success - reset circuit
      return value;
    } catch (error) {
      // On Redis error, record failure and fallback to factory
      this.logger.error(`Cache ERROR: ${key}`, error.stack);
      this.recordFailure();
      return factory();
    }
  }

  /**
   * Get or set with request coalescing to prevent cache stampede.
   * Multiple concurrent requests for the same key will share a single database call.
   *
   * @param key - Cache key
   * @param factory - Function to generate value if not cached
   * @param ttlSeconds - Time to live in seconds
   * @returns Cached or freshly generated value
   */
  async getOrSetCoalesced<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number,
  ): Promise<T> {
    // Check if there's already an in-flight request for this key
    const existingRequest = this.inFlightRequests.get(key);
    if (existingRequest) {
      this.logger.debug(`Request coalesced for key: ${key}`);
      return existingRequest;
    }

    // Create new request promise
    const requestPromise = this.getOrSet(key, factory, ttlSeconds);

    // Store in-flight request
    this.inFlightRequests.set(key, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up after completion (success or failure)
      this.inFlightRequests.delete(key);
    }
  }

  /**
   * Get the number of in-flight coalesced requests.
   * Useful for monitoring and debugging.
   */
  getCoalescedRequestCount(): number {
    return this.inFlightRequests.size;
  }

  // Pub/Sub
  async publish(channel: string, message: unknown): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe(
    channel: string,
    callback: (message: unknown) => void,
  ): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on("message", (ch, msg) => {
      if (ch === channel) {
        callback(JSON.parse(msg));
      }
    });
  }

  // TTL operations
  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    const result = await this.client.expire(key, seconds);
    return result === 1;
  }

  // Increment/Decrement
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async incrBy(key: string, value: number): Promise<number> {
    return this.client.incrby(key, value);
  }

  // Hash operations
  async hset(key: string, field: string, value: unknown): Promise<void> {
    await this.client.hset(key, field, JSON.stringify(value));
  }

  async hget<T>(key: string, field: string): Promise<T | null> {
    const value = await this.client.hget(key, field);
    return value ? JSON.parse(value) : null;
  }

  async hgetall<T>(key: string): Promise<Record<string, T>> {
    const data = await this.client.hgetall(key);
    const result: Record<string, T> = {};
    for (const [field, value] of Object.entries(data)) {
      result[field] = JSON.parse(value);
    }
    return result;
  }

  // Set operations for online users, etc.
  async sadd(key: string, ...members: string[]): Promise<void> {
    await this.client.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<void> {
    await this.client.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    return (await this.client.sismember(key, member)) === 1;
  }

  // Cache metrics methods

  /**
   * Record a cache hit
   */
  recordHit(): void {
    this.cacheHits++;
  }

  /**
   * Record a cache miss
   */
  recordMiss(): void {
    this.cacheMisses++;
  }

  /**
   * Record a cache error
   */
  recordError(): void {
    this.cacheErrors++;
  }

  /**
   * Get current cache metrics
   */
  getMetrics(): {
    hits: number;
    misses: number;
    errors: number;
    hitRate: number;
  } {
    const total = this.cacheHits + this.cacheMisses;
    const hitRate = total > 0 ? (this.cacheHits / total) * 100 : 0;

    return {
      hits: this.cacheHits,
      misses: this.cacheMisses,
      errors: this.cacheErrors,
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Reset cache metrics (useful for testing or periodic resets)
   */
  resetMetrics(): void {
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.cacheErrors = 0;
  }

  /**
   * Log current cache statistics.
   * Can be called periodically or on-demand for monitoring.
   */
  logCacheStats(): void {
    const metrics = this.getMetrics();
    const circuit = this.getCircuitStatus();
    const coalesced = this.getCoalescedRequestCount();

    this.logger.log(
      `Cache Stats - Hit Rate: ${metrics.hitRate.toFixed(1)}%, ` +
        `Hits: ${metrics.hits}, Misses: ${metrics.misses}, Errors: ${metrics.errors}, ` +
        `Circuit: ${circuit.isOpen ? "OPEN" : "CLOSED"}, In-Flight: ${coalesced}`,
    );
  }

  // Circuit breaker methods

  /**
   * Check if circuit breaker should be opened
   */
  private shouldOpenCircuit(): boolean {
    return this.failureCount >= this.FAILURE_THRESHOLD;
  }

  /**
   * Check if circuit breaker should be reset (half-open state)
   */
  private shouldResetCircuit(): boolean {
    if (!this.lastFailureTime) return false;
    return Date.now() - this.lastFailureTime >= this.CIRCUIT_RESET_MS;
  }

  /**
   * Record a Redis failure and potentially open circuit
   */
  private recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.recordError();

    if (this.shouldOpenCircuit() && !this.circuitOpen) {
      this.circuitOpen = true;
      this.logger.warn(`Circuit breaker OPEN: ${this.failureCount} failures`);
    }
  }

  /**
   * Reset circuit breaker on successful operation
   */
  private resetCircuit(): void {
    if (this.circuitOpen || this.failureCount > 0) {
      this.logger.log(
        `Circuit breaker CLOSED: Reset after successful operation`,
      );
    }
    this.circuitOpen = false;
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  /**
   * Get circuit breaker status
   */
  getCircuitStatus(): {
    isOpen: boolean;
    failureCount: number;
    lastFailure: number | null;
  } {
    return {
      isOpen: this.circuitOpen,
      failureCount: this.failureCount,
      lastFailure: this.lastFailureTime,
    };
  }

  /**
   * Check if circuit breaker is currently open
   */
  private isCircuitOpen(): boolean {
    // Check if circuit should be reset (half-open state)
    if (this.circuitOpen && this.shouldResetCircuit()) {
      this.logger.log("Circuit breaker attempting reset (half-open state)");
      this.circuitOpen = false;
    }
    return this.circuitOpen;
  }

  /**
   * Get or set with probabilistic early refresh to prevent thundering herd.
   * When cache is close to expiry, there's a chance to refresh it early.
   *
   * @param key - Cache key
   * @param factory - Function to generate value if not cached
   * @param ttlSeconds - Time to live in seconds
   * @param refreshThresholdPercent - Percentage of TTL remaining to start considering refresh (default: 20%)
   * @param refreshProbability - Probability of refreshing when below threshold (default: 0.1 = 10%)
   * @returns Cached or freshly generated value
   */
  async getOrSetWithEarlyRefresh<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number,
    refreshThresholdPercent: number = 20,
    refreshProbability: number = 0.1,
  ): Promise<T> {
    // Check circuit breaker
    if (this.isCircuitOpen()) {
      this.logger.warn(`Circuit breaker open, bypassing cache for key: ${key}`);
      return factory();
    }

    try {
      // Try to get from cache
      const cached = await this.get<T>(key);

      if (cached !== null) {
        this.recordHit();
        this.resetCircuit(); // Success - reset circuit

        // Check TTL remaining for early refresh
        const ttlRemaining = await this.client.ttl(key);
        const refreshThreshold = ttlSeconds * (refreshThresholdPercent / 100);

        // If TTL is below threshold and random chance hits, refresh in background
        if (ttlRemaining > 0 && ttlRemaining < refreshThreshold) {
          if (Math.random() < refreshProbability) {
            this.logger.debug(
              `Early refresh triggered for key: ${key} (TTL: ${ttlRemaining}s)`,
            );
            // Refresh in background - don't await
            this.refreshInBackground(key, factory, ttlSeconds);
          }
        }

        return cached;
      }

      // Cache miss - fetch and store
      this.recordMiss();
      const value = await factory();
      await this.set(key, value, ttlSeconds);
      this.resetCircuit(); // Success - reset circuit
      return value;
    } catch (error) {
      this.recordError();
      this.recordFailure();
      this.logger.error(`Cache ERROR: ${key}`, error.stack);
      return factory();
    }
  }

  /**
   * Refresh cache in background without blocking the response.
   */
  private async refreshInBackground<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds: number,
  ): Promise<void> {
    try {
      const value = await factory();
      await this.set(key, value, ttlSeconds);
      this.logger.debug(`Cache REFRESH: ${key} (background)`);
    } catch (error) {
      this.logger.error(
        `Cache ERROR: ${key} (background refresh)`,
        error.stack,
      );
    }
  }

  /**
   * Set cache metadata on the request for debugging headers.
   * Call this from services after cache operations.
   *
   * @param request - Express request object
   * @param status - Cache status (HIT, MISS, BYPASS, ERROR)
   * @param key - Cache key (will be sanitized in interceptor)
   * @param age - Age of cached data in seconds
   * @param ttl - Time to live in seconds
   */
  setCacheMetadata(
    request: any,
    status: "HIT" | "MISS" | "BYPASS" | "ERROR",
    key?: string,
    age?: number,
    ttl?: number,
  ): void {
    if (request) {
      request.cacheMetadata = { status, key, age, ttl };
    }
  }
}
