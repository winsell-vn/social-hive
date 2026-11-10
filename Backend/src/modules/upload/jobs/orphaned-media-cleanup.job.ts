import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { MediaRepository } from "../repositories/media.repository";
import { UploadService } from "../services/upload.service";
import { MediaStatus } from "@prisma/client";

@Injectable()
export class OrphanedMediaCleanupJob {
  private readonly logger = new Logger(OrphanedMediaCleanupJob.name);

  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Run daily at 2 AM — clean up orphaned and failed media (AC-047, AC-048)
   */
  @Cron("0 2 * * *")
  async handleCleanup() {
    this.logger.log("Starting orphaned media cleanup...");

    try {
      // 1. Delete FAILED media older than 1 day
      const failedCount = await this.cleanupFailedMedia();

      // 2. Delete PROCESSING media older than 1 hour (stuck jobs)
      const stuckCount = await this.cleanupStuckMedia();

      this.logger.log(
        `Cleanup complete: ${failedCount} failed, ${stuckCount} stuck media records cleaned`,
      );
    } catch (error) {
      this.logger.error(
        `Cleanup job failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Clean up FAILED media records older than 24 hours
   */
  private async cleanupFailedMedia(): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Find failed media older than 1 day
    const failedMedia = await this.mediaRepository.findMany({
      where: {
        status: MediaStatus.FAILED,
        createdAt: { lt: oneDayAgo },
      },
      take: 100, // Process in batches
    });

    let count = 0;
    for (const media of failedMedia) {
      try {
        await this.uploadService.deleteMediaBySystem(media.id);
        count++;
      } catch (error) {
        this.logger.warn(
          `Failed to clean up media ${media.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    return count;
  }

  /**
   * Clean up PROCESSING media older than 1 hour (stuck in queue)
   */
  private async cleanupStuckMedia(): Promise<number> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    const stuckMedia = await this.mediaRepository.findMany({
      where: {
        status: MediaStatus.PROCESSING,
        createdAt: { lt: oneHourAgo },
      },
      take: 100,
    });

    let count = 0;
    for (const media of stuckMedia) {
      try {
        // Mark as FAILED first, then delete
        await this.mediaRepository.update(media.id, {
          status: MediaStatus.FAILED,
          errorMessage: "Processing timed out - cleaned up by scheduled job",
        });
        await this.uploadService.deleteMediaBySystem(media.id);
        count++;
      } catch (error) {
        this.logger.warn(
          `Failed to clean up stuck media ${media.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    return count;
  }
}
