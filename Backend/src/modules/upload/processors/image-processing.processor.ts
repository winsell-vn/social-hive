import { Processor, Process } from "@nestjs/bull";
import { Logger, Inject } from "@nestjs/common";
import { Job } from "bull";
import { ImageProcessorService } from "../services/image-processor.service";
import { MediaRepository } from "../repositories/media.repository";
import {
  IStorageAdapter,
  STORAGE_ADAPTER,
} from "../interfaces/storage.interface";
import { MediaStatus, MediaType } from "@prisma/client";
import { randomBytes } from "crypto";
import { getOriginalExtension, getFolder } from "../utils/validation.utils";

export interface ImageProcessingJobData {
  mediaId: string;
  userId: string;
  buffer: string; // Base64 encoded buffer
  originalName: string;
  mimeType: string;
  type: MediaType;
  originalSize: number; // Original file size for compressionRatio calculation
}

@Processor("image-processing")
export class ImageProcessingProcessor {
  private readonly logger = new Logger(ImageProcessingProcessor.name);

  constructor(
    private readonly imageProcessor: ImageProcessorService,
    private readonly mediaRepository: MediaRepository,
    @Inject(STORAGE_ADAPTER) private readonly storage: IStorageAdapter,
  ) {}

  @Process("process-image")
  async handleProcessImage(job: Job<ImageProcessingJobData>) {
    const {
      mediaId,
      userId,
      buffer: base64Buffer,
      originalName,
      mimeType,
      type,
      originalSize,
    } = job.data;

    this.logger.log(`Processing image ${mediaId} (${type}) for user ${userId}`);

    try {
      const buffer = Buffer.from(base64Buffer, "base64");

      // Validate image
      const isValid = await this.imageProcessor.validateImage(buffer);
      if (!isValid) {
        await this.mediaRepository.updateStatus(
          mediaId,
          MediaStatus.FAILED,
          "Invalid image file",
        );
        return { success: false, error: "Invalid image" };
      }

      let processedImage;
      const uniqueId = randomBytes(8).toString("hex");

      // Process based on type
      switch (type) {
        case MediaType.AVATAR:
          processedImage = await this.imageProcessor.processAvatar(buffer);
          break;
        case MediaType.COVER:
          processedImage = await this.imageProcessor.processCover(buffer);
          break;
        default:
          processedImage = await this.imageProcessor.convertToWebP(buffer);
          break;
      }

      // Save main image
      const filename = `${uniqueId}.webp`;
      const folder = getFolder(type);
      const mainResult = await this.storage.save(
        processedImage.buffer,
        `${folder}/${filename}`,
        "image/webp",
      );

      // Save original file as fallback (AC-003)
      const originalExt = getOriginalExtension(mimeType);
      const originalFilename = `${uniqueId}_original.${originalExt}`;
      const originalResult = await this.storage.save(
        buffer,
        `${folder}/${originalFilename}`,
        mimeType,
      );

      // Generate and save variants (for post/blog images)
      const variantsData: Record<
        string,
        { url: string; width: number; height: number }
      > = {};

      if (type === MediaType.POST_IMAGE || type === MediaType.BLOG_IMAGE) {
        const variants = await this.imageProcessor.generateVariants(buffer);

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

      // Update media record
      await this.mediaRepository.update(mediaId, {
        status: MediaStatus.READY,
        storagePath: mainResult.path,
        publicUrl: mainResult.url,
        width: processedImage.width,
        height: processedImage.height,
        size: processedImage.size,
        variants:
          Object.keys(variantsData).length > 0 ? variantsData : undefined,
        compressionRatio: originalSize
          ? processedImage.size / originalSize
          : null,
        originalPath: originalResult.path,
        originalUrl: originalResult.url,
        originalMimeType: mimeType,
      });

      this.logger.log(
        `Image ${mediaId} processed successfully: ${mainResult.url}`,
      );

      return {
        success: true,
        url: mainResult.url,
        variants: variantsData,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to process image ${mediaId}: ${message}`,
        stack,
      );

      await this.mediaRepository.updateStatus(
        mediaId,
        MediaStatus.FAILED,
        message || "Processing failed",
      );

      return { success: false, error: message };
    }
  }
}
