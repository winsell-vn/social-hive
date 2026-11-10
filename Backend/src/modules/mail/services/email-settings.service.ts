import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../../prisma/prisma.service";

/**
 * Keys used to persist the email configuration in the `system_setting` table.
 * Category: "email"
 */
export const EMAIL_SETTING_KEYS = {
  API_KEY: "email.apiKey",
  FROM: "email.from",
  VERIFICATION_REQUIRED: "email.verificationRequired",
} as const;

export const EMAIL_CATEGORY = "email";

export type EmailConfigSource = "db" | "env";

export interface EmailConfig {
  /** Resend API key (DB override first, env fallback) */
  apiKey: string;
  /** Sender address */
  from: string;
  /** Whether new registrations must confirm their email address */
  verificationRequired: boolean;
  /** Where the API key currently comes from */
  source: EmailConfigSource;
  /** True when an API key is available (from DB or env) */
  configured: boolean;
}

export interface UpdateEmailConfig {
  apiKey?: string;
  from?: string;
  verificationRequired?: boolean;
}

/**
 * Email provider configuration.
 *
 * Only Resend is supported. The API key and the sender address can be
 * overridden by an administrator through the admin panel; when no override is
 * stored the values from the environment are used.
 */
@Injectable()
export class EmailSettingsService {
  private readonly logger = new Logger(EmailSettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Resolve the effective email configuration.
   */
  async getConfig(): Promise<EmailConfig> {
    let stored: Record<string, string> = {};

    try {
      const settings = await this.prisma.systemSetting.findMany({
        where: { category: EMAIL_CATEGORY },
      });
      stored = settings.reduce(
        (acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        },
        {} as Record<string, string>,
      );
    } catch (error) {
      this.logger.error(
        `Failed to read email settings from database: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }

    const dbApiKey = (stored[EMAIL_SETTING_KEYS.API_KEY] || "").trim();
    const envApiKey = (
      this.configService.get<string>("mail.resendApiKey") || ""
    ).trim();

    const dbFrom = (stored[EMAIL_SETTING_KEYS.FROM] || "").trim();
    const envFrom =
      this.configService.get<string>("mail.from") ||
      "noreply@chungtoixayweb.vn";

    const verificationRaw = stored[EMAIL_SETTING_KEYS.VERIFICATION_REQUIRED];
    const verificationRequired =
      verificationRaw === undefined ? true : verificationRaw === "true";

    return {
      apiKey: dbApiKey || envApiKey,
      from: dbFrom || envFrom,
      verificationRequired,
      source: dbApiKey ? "db" : "env",
      configured: !!(dbApiKey || envApiKey),
    };
  }

  /**
   * Persist the administrator overrides.
   */
  async updateConfig(input: UpdateEmailConfig): Promise<void> {
    const rows: Array<{ key: string; value: string }> = [];

    if (input.apiKey !== undefined) {
      rows.push({
        key: EMAIL_SETTING_KEYS.API_KEY,
        value: input.apiKey.trim(),
      });
    }
    if (input.from !== undefined) {
      rows.push({ key: EMAIL_SETTING_KEYS.FROM, value: input.from.trim() });
    }
    if (input.verificationRequired !== undefined) {
      rows.push({
        key: EMAIL_SETTING_KEYS.VERIFICATION_REQUIRED,
        value: input.verificationRequired ? "true" : "false",
      });
    }

    if (rows.length === 0) return;

    await this.prisma.$transaction(
      rows.map((row) =>
        this.prisma.systemSetting.upsert({
          where: { key: row.key },
          update: { value: row.value, category: EMAIL_CATEGORY },
          create: {
            key: row.key,
            value: row.value,
            category: EMAIL_CATEGORY,
          },
        }),
      ),
    );

    this.logger.log(
      `Updated email settings: ${rows.map((r) => r.key).join(", ")}`,
    );
  }

  /**
   * Whether new registrations must verify their email address.
   */
  async isVerificationRequired(): Promise<boolean> {
    const config = await this.getConfig();
    return config.verificationRequired;
  }

  /**
   * Remove the administrator overrides so the env values are used again.
   */
  async clearOverrides(): Promise<void> {
    await this.prisma.systemSetting.deleteMany({
      where: { category: EMAIL_CATEGORY },
    });
    this.logger.log("Cleared email setting overrides");
  }
}
