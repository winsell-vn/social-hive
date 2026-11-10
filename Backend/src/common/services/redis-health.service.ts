import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

@Injectable()
export class RedisHealthService implements OnModuleInit {
  private readonly logger = new Logger(RedisHealthService.name);
  private client: Redis;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const config = {
      host: this.configService.get("REDIS_HOST", "localhost"),
      port: this.configService.get("REDIS_PORT", 6379),
      password: this.configService.get("REDIS_PASSWORD") || undefined,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Don't retry for health check
      lazyConnect: true,
    };

    this.client = new Redis(config);
  }

  /**
   * Check Redis connection by sending PING command
   * @returns true if Redis is connected and responding
   * @throws Error if Redis is not available
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.client.connect();
      const response = await this.client.ping();

      if (response === "PONG") {
        this.logger.log("Redis health check passed");
        return true;
      }

      throw new Error(`Unexpected Redis response: ${response}`);
    } catch (error) {
      this.logger.error("Redis health check failed", error);
      throw new Error(`Redis connection failed: ${error.message}`);
    } finally {
      try {
        await this.client.quit();
      } catch {
        // Ignore quit errors
      }
    }
  }

  /**
   * Get Redis connection info for diagnostics
   */
  getConnectionInfo(): { host: string; port: number } {
    return {
      host: this.configService.get("REDIS_HOST", "localhost"),
      port: this.configService.get("REDIS_PORT", 6379),
    };
  }
}
