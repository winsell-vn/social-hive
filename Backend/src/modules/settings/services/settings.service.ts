import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all settings for a category as key-value object
   */
  async getByCategory(category: string): Promise<Record<string, string>> {
    const settings = await this.prisma.systemSetting.findMany({
      where: { category },
    });

    return settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>,
    );
  }

  /**
   * Get single setting value
   */
  async get(key: string, defaultValue?: string): Promise<string> {
    const setting = await this.prisma.systemSetting.findUnique({
      where: { key },
    });

    return setting?.value ?? defaultValue ?? "";
  }

  /**
   * Upsert a setting
   */
  async set(key: string, value: string, category?: string): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: { key },
      update: { value, category },
      create: { key, value, category },
    });
  }

  /**
   * Upsert multiple settings in a transaction
   */
  async setMany(
    settings: Array<{ key: string; value: string; category?: string }>,
  ): Promise<void> {
    await this.prisma.$transaction(
      settings.map((setting) =>
        this.prisma.systemSetting.upsert({
          where: { key: setting.key },
          update: { value: setting.value, category: setting.category },
          create: {
            key: setting.key,
            value: setting.value,
            category: setting.category,
          },
        }),
      ),
    );
  }

  /**
   * Delete a setting
   */
  async delete(key: string): Promise<void> {
    await this.prisma.systemSetting
      .delete({
        where: { key },
      })
      .catch(() => {
        // Ignore if setting doesn't exist
      });
  }
}
