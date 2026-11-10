import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class TurnstileService {
  private readonly logger = new Logger(TurnstileService.name);
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.secretKey =
      this.configService.get<string>("turnstile.secretKey") || "";

    if (!this.secretKey) {
      const nodeEnv =
        this.configService.get<string>("app.nodeEnv") || process.env.NODE_ENV;
      if (nodeEnv === "production") {
        this.logger.error(
          "CRITICAL: TURNSTILE_SECRET_KEY is not configured in production!",
        );
      }
    }
  }

  async verifyToken(token: string, ip?: string): Promise<boolean> {
    const nodeEnv =
      this.configService.get<string>("app.nodeEnv") || process.env.NODE_ENV;
    const isDevelopment = nodeEnv === "development";

    // Bypass in development if no secret key OR no token provided
    if (!this.secretKey || !token) {
      if (isDevelopment) {
        this.logger.warn("Turnstile verification bypassed (development mode)");
        return true;
      }
      if (!this.secretKey) {
        this.logger.error("Turnstile secret key is not configured!");
      }
      return false;
    }

    try {
      const formData = new URLSearchParams();
      formData.append("secret", this.secretKey);
      formData.append("response", token);
      if (ip) {
        formData.append("remoteip", ip);
      }

      const response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData.toString(),
        },
      );

      const data = await response.json();

      if (!data.success) {
        this.logger.warn(
          `Turnstile verification failed: ${JSON.stringify(data["error-codes"])}`,
        );
      }

      return data.success === true;
    } catch (error) {
      this.logger.error("Turnstile verification error:", error);
      return false;
    }
  }
}
