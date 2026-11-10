import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../../../redis/redis.service";

@Injectable()
export class LoginAttemptService {
  private readonly logger = new Logger(LoginAttemptService.name);
  private readonly MAX_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes

  constructor(private readonly redisService: RedisService) {}

  private getKey(email: string): string {
    return `auth:login_attempts:${email.toLowerCase()}`;
  }

  async recordFailedAttempt(email: string): Promise<number> {
    const key = this.getKey(email);
    const count = await this.redisService.incr(key);
    if (count === 1) {
      await this.redisService.expire(key, this.LOCKOUT_DURATION_SECONDS);
    }
    this.logger.warn(
      `Failed login attempt for ${email}: ${count}/${this.MAX_ATTEMPTS}`,
    );
    return count;
  }

  async isLocked(email: string): Promise<boolean> {
    const key = this.getKey(email);
    const countStr = await this.redisService.getClient().get(key);
    const count = countStr ? parseInt(countStr, 10) : 0;
    return count >= this.MAX_ATTEMPTS;
  }

  async clearAttempts(email: string): Promise<void> {
    const key = this.getKey(email);
    await this.redisService.del(key);
  }
}

