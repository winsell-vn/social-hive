import { Injectable, Logger } from "@nestjs/common";
import { createHash } from "crypto";

@Injectable()
export class PasswordBreachService {
  private readonly logger = new Logger(PasswordBreachService.name);
  private readonly HIBP_API_URL = "https://api.pwnedpasswords.com/range/";
  private readonly BREACH_THRESHOLD = 3; // Reject if password appeared in 3+ breaches
  private readonly TIMEOUT_MS = 5000; // 5 second timeout

  /**
   * Check if a password has been found in known data breaches
   * Uses HaveIBeenPwned k-Anonymity API (only first 5 chars of SHA-1 hash sent)
   * @returns number of times the password appeared in breaches (0 = safe)
   */
  async checkPassword(password: string): Promise<number> {
    try {
      const sha1Hash = createHash("sha1")
        .update(password)
        .digest("hex")
        .toUpperCase();
      const prefix = sha1Hash.substring(0, 5);
      const suffix = sha1Hash.substring(5);

      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(`${this.HIBP_API_URL}${prefix}`, {
        headers: {
          "User-Agent": "ChungToiXayWeb-PasswordCheck",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        this.logger.warn(`HIBP API returned ${response.status}`);
        return 0; // Fail open - don't block registration if API is down
      }

      const text = await response.text();
      const lines = text.split("\n");

      for (const line of lines) {
        const [hashSuffix, count] = line.trim().split(":");
        if (hashSuffix === suffix) {
          return parseInt(count, 10);
        }
      }

      return 0; // Password not found in breaches
    } catch (error) {
      this.logger.error("HIBP password check failed:", error);
      return 0; // Fail open
    }
  }

  /**
   * Check if password is too commonly breached
   */
  async isBreached(password: string): Promise<boolean> {
    const count = await this.checkPassword(password);
    return count >= this.BREACH_THRESHOLD;
  }
}

