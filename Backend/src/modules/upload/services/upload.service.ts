import {
  Injectable,
  BadRequestException,
  Logger,
  Inject,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { MediaRepository } from "../repositories/media.repository";
import {
  IStorageAdapter,
  STORAGE_ADAPTER,
} from "../interfaces/storage.interface";
import { ImageProcessorService } from "./image-processor.service";
import { ImageCacheService } from "./image-cache.service";
import { RedisService } from "../../../redis/redis.service";
import {
  validateUploadFile,
  getOriginalExtension,
  getFolder,
} from "../utils/validation.utils";
import { CACHE_KEYS } from "../../../redis/cache-keys";
import { MediaType, MediaStatus, Media } from "@prisma/client";
import { ImageProcessingJobData } from "../processors/image-processing.processor";
import { randomBytes, createHash } from "crypto";

export interface UploadResult {
  id: string;
  url: string | null;
  status: MediaStatus;
  type: MediaType;
}

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly maxFileSize: number;
  private readonly dailyQuota: number;
  private readonly rateLimitPerHour: number;
  private readonly allowedMimeTypes: string[];

  constructor(
    private readonly configService: ConfigService,
    private readonly mediaRepository: MediaRepository,
    @Inject(STORAGE_ADAPTER) private readonly storage: IStorageAdapter,
    private readonly imageProcessor: ImageProcessorService,
    private readonly imageCacheService: ImageCacheService,
    private readonly redisService: RedisService,
    @InjectQueue("image-processing") private readonly imageQueue: Queue,
  ) {
    this.maxFileSize = this.configService.get<number>(
      "upload.maxFileSize",
      10485760,
    );
    this.dailyQuota = this.configService.get<number>(
      "upload.dailyQuota",
      52428800,
    );
    this.rateLimitPerHour = this.configService.get<number>(
      "upload.rateLimitPerHour",
      10,
    );
    this.allowedMimeTypes = this.configService.get<string[]>(
      "upload.allowedMimeTypes",
      ["image/jpeg", "image/png", "image/gif", "image/webp"],
    );
  }

  // 2MB threshold for sync/async processing (AC-012, AC-013)
  private readonly SYNC_THRESHOLD = 2 * 1024 * 1024; // 2MB = 2,097,152 bytes

  /**
   * Compute SHA-256 hash of a buffer
   */
  private computeHash(buffer: Buffer): string {
    return createHash("sha256").update(buffer).digest("hex");
  }

  /**
   * Upload a single image
   * Files <= 2MB: processed synchronously, returns immediate URL (AC-013)
   * Files > 2MB: processed asynchronously via Bull queue (AC-012)
   */
  async uploadImage(
    file: Express.Multer.File,
    userId: string,
    type: MediaType = MediaType.POST_IMAGE,
    userRole?: string,
  ): Promise<UploadResult> {
    // Validate file
    validateUploadFile(file, {
      allowedTypes: this.allowedMimeTypes,
      maxSize: this.maxFileSize,
    });

    // Check rate limit (skip for admins)
    await this.checkRateLimit(userId, userRole);

    // Check daily quota (skip for admins)
    await this.checkDailyQuota(userId, file.size, userRole);

    // Generate unique ID and folder for storage path
    const uniqueId = randomBytes(8).toString("hex");
    const folder = getFolder(type);

    // AC-012/AC-013: Size-based sync/async threshold
    if (file.size <= this.SYNC_THRESHOLD) {
      // SYNCHRONOUS PATH: Process immediately for files <= 2MB
      return this.processImageSync(file, userId, type, uniqueId, folder);
    } else {
      // ASYNCHRONOUS PATH: Queue for processing for files > 2MB
      return this.processImageAsync(file, userId, type);
    }
  }

  /**
   * Process image synchronously (for files <= 2MB)
   * Replicates the logic from image-processing.processor.ts
   */
  private async processImageSync(
    file: Express.Multer.File,
    userId: string,
    type: MediaType,
    uniqueId: string,
    folder: string,
  ): Promise<UploadResult> {
    // Create media record (PROCESSING status initially)
    const media = await this.mediaRepository.create({
      user: { connect: { id: userId } },
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      type,
      status: MediaStatus.PROCESSING,
      storagePath: "",
      publicUrl: "",
      hash: this.computeHash(file.buffer),
      originalSize: file.size,
    });

    try {
      // Validate image
      const isValid = await this.imageProcessor.validateImage(file.buffer);
      if (!isValid) {
        await this.mediaRepository.updateStatus(
          media.id,
          MediaStatus.FAILED,
          "Invalid image file",
        );
        return {
          id: media.id,
          url: null,
          status: MediaStatus.FAILED,
          type,
        };
      }

      // Convert to WebP
      const processedImage = await this.imageProcessor.convertToWebP(
        file.buffer,
      );

      // Save main image
      const filename = `${uniqueId}.webp`;
      const mainResult = await this.storage.save(
        processedImage.buffer,
        `${folder}/${filename}`,
        "image/webp",
      );

      // Save original file as fallback (AC-003)
      const originalExt = getOriginalExtension(file.mimetype);
      const originalFilename = `${uniqueId}_original.${originalExt}`;
      const originalResult = await this.storage.save(
        file.buffer,
        `${folder}/${originalFilename}`,
        file.mimetype,
      );

      // Generate and save variants (for post/blog images)
      const variantsData: Record<
        string,
        { url: string; width: number; height: number }
      > = {};

      if (type === MediaType.POST_IMAGE || type === MediaType.BLOG_IMAGE) {
        const variants = await this.imageProcessor.generateVariants(
          file.buffer,
        );

        for (const variant of variants) {
          const variantFilename = `${uniqueId}-${variant.name}.webp`;
          const variantResult = await this.storage.save(
            variant.buffer,
            `${folder}/${variantFilename}`,
            "image/webp",
          );

          variantsData[variant.name] = {
            url: variantResult.url,
            width: variant.width,
            height: variant.height,
          };
        }
      }

      // Update media record to READY with all metadata
      await this.mediaRepository.update(media.id, {
        status: MediaStatus.READY,
        storagePath: mainResult.path,
        publicUrl: mainResult.url,
        width: processedImage.width,
        height: processedImage.height,
        size: processedImage.size,
        variants:
          Object.keys(variantsData).length > 0 ? variantsData : undefined,
        compressionRatio: processedImage.size / file.size,
        originalPath: originalResult.path,
        originalUrl: originalResult.url,
        originalMimeType: file.mimetype,
      });

      // Increment rate limit counter
      await this.incrementRateLimit(userId);

      // Increment daily quota counter
      await this.incrementDailyQuota(userId, file.size);

      this.logger.log(
        `Image processed synchronously: ${media.id} (${type}) for user ${userId}`,
      );

      return {
        id: media.id,
        url: mainResult.url,
        status: MediaStatus.READY,
        type,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Failed to process image ${media.id} synchronously: ${message}`,
      );

      await this.mediaRepository.updateStatus(
        media.id,
        MediaStatus.FAILED,
        message || "Processing failed",
      );

      return {
        id: media.id,
        url: null,
        status: MediaStatus.FAILED,
        type,
      };
    }
  }

  /**
   * Process image asynchronously via Bull queue (for files > 2MB)
   */
  private async processImageAsync(
    file: Express.Multer.File,
    userId: string,
    type: MediaType,
  ): Promise<UploadResult> {
    // Create media record (PROCESSING status)
    const media = await this.mediaRepository.create({
      user: { connect: { id: userId } },
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      type,
      status: MediaStatus.PROCESSING,
      storagePath: "",
      publicUrl: "",
      hash: this.computeHash(file.buffer),
      originalSize: file.size,
    });

    // Enqueue processing job
    const jobData: ImageProcessingJobData = {
      mediaId: media.id,
      userId,
      buffer: file.buffer.toString("base64"),
      originalName: file.originalname,
      mimeType: file.mimetype,
      type,
      originalSize: file.size,
    };

    await this.imageQueue.add("process-image", jobData, {
      attempts: 3,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: true,
      removeOnFail: false,
    });

    // Increment rate limit counter
    await this.incrementRateLimit(userId);

    // Increment daily quota counter (committed at enqueue time)
    await this.incrementDailyQuota(userId, file.size);

    this.logger.log(
      `Image upload queued (async): ${media.id} (${type}) for user ${userId}`,
    );

    return {
      id: media.id,
      url: null, // Will be available after processing
      status: MediaStatus.PROCESSING,
      type,
    };
  }

  /**
   * Upload multiple images
   */
  async uploadMultipleImages(
    files: Express.Multer.File[],
    userId: string,
    type: MediaType = MediaType.POST_IMAGE,
    userRole?: string,
  ): Promise<UploadResult[]> {
    const maxFiles = this.configService.get<number>(
      "upload.maxFilesPerUpload",
      5,
    );
    if (files.length > maxFiles) {
      throw new BadRequestException(`Tối đa ${maxFiles} ảnh mỗi lần upload`);
    }

    const results: UploadResult[] = [];
    for (const file of files) {
      const result = await this.uploadImage(file, userId, type, userRole);
      results.push(result);
    }
    return results;
  }

  /**
   * Upload avatar (synchronous processing - small file, immediate result needed)
   */
  async uploadAvatar(
    file: Express.Multer.File,
    userId: string,
    userRole?: string,
  ): Promise<UploadResult> {
    validateUploadFile(file, {
      allowedTypes: this.allowedMimeTypes,
      maxSize: 5 * 1024 * 1024, // 5MB for avatars
    });

    await this.checkRateLimit(userId, userRole);

    // Process synchronously (avatars are small, need immediate URL)
    const processed = await this.imageProcessor.processAvatar(file.buffer);

    // Capture timestamp once to ensure consistent filenames
    const timestamp = Date.now();
    const filename = `avatars/${userId}-${timestamp}.webp`;
    const storageResult = await this.storage.save(
      processed.buffer,
      filename,
      "image/webp",
    );

    // Save original avatar as fallback (AC-003)
    const originalExt = getOriginalExtension(file.mimetype);
    const originalFilename = `avatars/${userId}-${timestamp}_original.${originalExt}`;
    const originalAvatarResult = await this.storage.save(
      file.buffer,
      originalFilename,
      file.mimetype,
    );

    const media = await this.mediaRepository.create({
      user: { connect: { id: userId } },
      originalName: file.originalname,
      mimeType: "image/webp",
      size: processed.size,
      type: MediaType.AVATAR,
      status: MediaStatus.READY,
      storagePath: storageResult.path,
      publicUrl: storageResult.url,
      width: processed.width,
      height: processed.height,
      hash: this.computeHash(file.buffer),
      originalSize: file.size,
      compressionRatio: processed.size / file.size,
      originalPath: originalAvatarResult.path,
      originalUrl: originalAvatarResult.url,
      originalMimeType: file.mimetype,
    });

    await this.incrementRateLimit(userId);

    // Increment daily quota counter
    await this.incrementDailyQuota(userId, file.size);

    this.logger.log(`Avatar uploaded: ${media.id} for user ${userId}`);

    return {
      id: media.id,
      url: storageResult.url,
      status: MediaStatus.READY,
      type: MediaType.AVATAR,
    };
  }

  /**
   * Upload cover photo (synchronous processing)
   */
  async uploadCover(
    file: Express.Multer.File,
    userId: string,
    userRole?: string,
  ): Promise<UploadResult> {
    validateUploadFile(file, {
      allowedTypes: this.allowedMimeTypes,
      maxSize: 5 * 1024 * 1024, // 5MB for covers
    });

    await this.checkRateLimit(userId, userRole);

    const processed = await this.imageProcessor.processCover(file.buffer);

    // Capture timestamp once to ensure consistent filenames
    const timestamp = Date.now();
    const filename = `covers/${userId}-${timestamp}.webp`;
    const storageResult = await this.storage.save(
      processed.buffer,
      filename,
      "image/webp",
    );

    // Save original cover as fallback (AC-003)
    const originalExt = getOriginalExtension(file.mimetype);
    const originalFilename = `covers/${userId}-${timestamp}_original.${originalExt}`;
    const originalCoverResult = await this.storage.save(
      file.buffer,
      originalFilename,
      file.mimetype,
    );

    const media = await this.mediaRepository.create({
      user: { connect: { id: userId } },
      originalName: file.originalname,
      mimeType: "image/webp",
      size: processed.size,
      type: MediaType.COVER,
      status: MediaStatus.READY,
      storagePath: storageResult.path,
      publicUrl: storageResult.url,
      width: processed.width,
      height: processed.height,
      hash: this.computeHash(file.buffer),
      originalSize: file.size,
      compressionRatio: processed.size / file.size,
      originalPath: originalCoverResult.path,
      originalUrl: originalCoverResult.url,
      originalMimeType: file.mimetype,
    });

    await this.incrementRateLimit(userId);

    // Increment daily quota counter
    await this.incrementDailyQuota(userId, file.size);

    this.logger.log(`Cover uploaded: ${media.id} for user ${userId}`);

    return {
      id: media.id,
      url: storageResult.url,
      status: MediaStatus.READY,
      type: MediaType.COVER,
    };
  }

  /**
   * Get media by ID
   */
  async getMedia(mediaId: string): Promise<Media | null> {
    return this.mediaRepository.findById(mediaId);
  }

  /**
   * Get media status (for polling)
   */
  async getMediaStatus(
    mediaId: string,
  ): Promise<{ status: MediaStatus; url: string | null }> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new BadRequestException("Media không tồn tại");
    }
    return {
      status: media.status,
      url: media.status === MediaStatus.READY ? media.publicUrl : null,
    };
  }

  /**
   * Delete media
   */
  async deleteMedia(mediaId: string, userId: string): Promise<void> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      throw new BadRequestException("Media không tồn tại");
    }
    if (media.userId !== userId) {
      throw new BadRequestException("Không có quyền xóa media này");
    }

    await this.deleteMediaInternal(media);
    this.logger.log(`Media ${mediaId} deleted by user ${userId}`);
  }

  /**
   * Internal method to delete media files and DB record
   * Shared by deleteMedia and deleteMediaBySystem
   */
  private async deleteMediaInternal(media: Media): Promise<void> {
    // Invalidate cache first
    const variantNames = media.variants
      ? Object.keys(media.variants as Record<string, unknown>)
      : undefined;
    await this.imageCacheService.invalidate(media.id, variantNames);

    // Delete file from storage
    if (media.storagePath) {
      await this.storage.delete(media.storagePath).catch((err) => {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.error(
          `Failed to delete file ${media.storagePath}: ${message}`,
        );
      });
    }

    // Delete original file if exists (AC-003)
    if (media.originalPath) {
      try {
        await this.storage.delete(media.originalPath);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        this.logger.warn(
          `Failed to delete original file ${media.originalPath}: ${message}`,
        );
      }
    }

    // Delete variant files
    if (media.variants) {
      const variants = media.variants as Record<string, { url: string }>;
      for (const variant of Object.values(variants)) {
        const variantPath = variant.url.replace("/uploads/", "");
        await this.storage.delete(variantPath).catch((err) => {
          const message = err instanceof Error ? err.message : String(err);
          this.logger.error(
            `Failed to delete variant ${variantPath}: ${message}`,
          );
        });
      }
    }

    // Delete DB record
    await this.mediaRepository.delete(media.id);
  }

  /**
   * Check rate limit (uploads per hour)
   * Admins and Super Admins bypass rate limits
   */
  private async checkRateLimit(
    userId: string,
    userRole?: string,
  ): Promise<void> {
    // Admin bypass
    if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return;

    const key = `upload:rate:${userId}`;
    try {
      const count = await this.redisService.get<number>(key);
      if (count !== null && count >= this.rateLimitPerHour) {
        throw new BadRequestException(
          `Bạn đã đạt giới hạn ${this.rateLimitPerHour} lần upload mỗi giờ. Vui lòng thử lại sau.`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      // Redis failure - allow upload (fail open)
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Rate limit check failed: ${message}`);
    }
  }

  /**
   * Increment rate limit counter
   * Uses atomic INCR to avoid TOCTOU race condition
   */
  private async incrementRateLimit(userId: string): Promise<void> {
    const key = `upload:rate:${userId}`;
    try {
      // Use atomic INCR - Redis auto-creates key with value 1 if it doesn't exist
      const newCount = await this.redisService.incr(key);
      // Set TTL only on first increment (when count becomes 1)
      if (newCount === 1) {
        await this.redisService.expire(key, 3600); // 1 hour TTL
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Rate limit increment failed: ${message}`);
    }
  }

  /**
   * Check daily upload quota (Redis-backed with DB fallback)
   * Admins and Super Admins bypass quota limits
   */
  private async checkDailyQuota(
    userId: string,
    fileSize: number,
    userRole?: string,
  ): Promise<void> {
    if (userRole === "ADMIN" || userRole === "SUPER_ADMIN") return;

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const key = CACHE_KEYS.DAILY_QUOTA(userId, today);

    try {
      const currentUsage = (await this.redisService.get<number>(key)) || 0;

      if (currentUsage + fileSize > this.dailyQuota) {
        const remainingMB = Math.max(
          0,
          Math.round((this.dailyQuota - currentUsage) / (1024 * 1024)),
        );
        throw new BadRequestException(
          `Bạn đã đạt giới hạn dung lượng upload hàng ngày. Còn lại: ${remainingMB}MB`,
        );
      }
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Daily quota check failed (Redis): ${message}`);
      // Fallback to database
      const todayUsage = await this.mediaRepository.sumSizeByUserToday(userId);
      if (todayUsage + fileSize > this.dailyQuota) {
        const remainingMB = Math.max(
          0,
          Math.round((this.dailyQuota - todayUsage) / (1024 * 1024)),
        );
        throw new BadRequestException(
          `Bạn đã đạt giới hạn dung lượng upload hàng ngày. Còn lại: ${remainingMB}MB`,
        );
      }
    }
  }

  /**
   * Increment daily quota counter in Redis after successful upload
   */
  private async incrementDailyQuota(
    userId: string,
    fileSize: number,
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0];
      const key = CACHE_KEYS.DAILY_QUOTA(userId, today);

      await this.redisService.incrBy(key, fileSize);

      // Set TTL to expire at end of day
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const secondsUntilMidnight = Math.floor(
        (midnight.getTime() - now.getTime()) / 1000,
      );
      await this.redisService.expire(key, secondsUntilMidnight);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Failed to increment daily quota in Redis: ${message}`);
    }
  }

  /**
   * Delete old profile image by URL (best effort - doesn't throw on failure)
   */
  async deleteOldProfileImage(
    url: string | null,
    userId: string,
  ): Promise<void> {
    if (!url) return;

    try {
      const media = await this.mediaRepository.findByUrl(url);
      if (media && media.userId === userId) {
        await this.deleteMedia(media.id, userId);
        this.logger.log(`Old profile image deleted: ${media.id}`);
      }
    } catch (error) {
      this.logger.warn(
        `Failed to delete old profile image: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Delete media by system (bypasses ownership check)
   * Used by cleanup jobs and admin operations
   */
  async deleteMediaBySystem(mediaId: string): Promise<void> {
    const media = await this.mediaRepository.findById(mediaId);
    if (!media) {
      this.logger.warn(`Media ${mediaId} not found for system deletion`);
      return;
    }

    await this.deleteMediaInternal(media);
    this.logger.log(`Media ${mediaId} deleted by system`);
  }
}
