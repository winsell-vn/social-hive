import { Injectable, Logger, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as sharpModule from "sharp";
import type { Metadata, SharpConstructor } from "sharp";

// sharp 0.35 publishes ESM-first type declarations, while its CommonJS entry
// exports the callable constructor directly. Cast the namespace import so the
// call signature and the runtime require() behavior both stay correct.
const sharp = sharpModule as unknown as SharpConstructor;

export interface ProcessedImage {
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
  format: string;
}

export interface ImageVariant {
  name: string;
  buffer: Buffer;
  width: number;
  height: number;
  size: number;
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);
  private readonly webpQuality: number;
  private readonly variants: Record<string, { width: number; height: number }>;

  constructor(private configService: ConfigService) {
    this.webpQuality = this.configService.get<number>("upload.webpQuality", 80);
    this.variants = this.configService.get("upload.variants", {
      thumbnail: { width: 150, height: 150 },
      small: { width: 320, height: 320 },
      medium: { width: 600, height: 600 },
      large: { width: 1200, height: 1200 },
    });
  }

  /**
   * Validate image dimensions against max allowed (AC-020)
   * @throws BadRequestException if dimensions exceed limit
   */
  private async validateDimensions(buffer: Buffer): Promise<Metadata> {
    const metadata = await sharp(buffer).metadata();
    const maxDim =
      this.configService.get<number>("upload.maxDimension") || 4096;
    if (
      (metadata.width && metadata.width > maxDim) ||
      (metadata.height && metadata.height > maxDim)
    ) {
      throw new BadRequestException(
        `Kích thước ảnh vượt quá giới hạn ${maxDim}x${maxDim} pixels`,
      );
    }
    return metadata;
  }

  /**
   * Validate compression ratio to detect decompression bombs (AC-021)
   * @throws BadRequestException if compression ratio is suspiciously high
   */
  private validateCompressionRatio(
    buffer: Buffer,
    metadata: Metadata,
  ): void {
    if (metadata.width && metadata.height) {
      const uncompressedEstimate = metadata.width * metadata.height * 4; // RGBA
      const ratio = uncompressedEstimate / buffer.length;
      // Screenshots/clipboard images with solid backgrounds can reach 200-500:1 compression ratio
      // Real decompression bombs typically have ratios of 10,000:1 or higher
      if (ratio > 1000) {
        throw new BadRequestException(
          "File bị nghi ngờ là decompression bomb. Tỷ lệ nén quá cao.",
        );
      }
    }
  }

  /**
   * Get image metadata (width, height, format, size)
   */
  async getMetadata(
    buffer: Buffer,
  ): Promise<{ width: number; height: number; format: string }> {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || "unknown",
    };
  }

  /**
   * Convert image to WebP format with quality setting
   * Includes EXIF stripping via .rotate() (AC-004), dimension validation (AC-020),
   * and compression ratio check (AC-021)
   */
  async convertToWebP(buffer: Buffer): Promise<ProcessedImage> {
    // Validate dimensions and compression ratio before processing
    const metadata = await this.validateDimensions(buffer);
    this.validateCompressionRatio(buffer, metadata);

    // .rotate() auto-rotates based on EXIF and strips EXIF data
    const processed = sharp(buffer)
      .rotate()
      .webp({ quality: this.webpQuality });
    const outputBuffer = await processed.toBuffer();
    const outputMetadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      width: outputMetadata.width || 0,
      height: outputMetadata.height || 0,
      size: outputBuffer.length,
      format: "webp",
    };
  }

  /**
   * Generate all configured variants of an image
   * Each variant is resized (fit: inside, no enlargement) and converted to WebP
   * Includes EXIF stripping via .rotate() (AC-004)
   */
  async generateVariants(buffer: Buffer): Promise<ImageVariant[]> {
    const results: ImageVariant[] = [];
    const metadata = await sharp(buffer).metadata();
    const originalWidth = metadata.width || 0;
    const originalHeight = metadata.height || 0;

    for (const [name, dimensions] of Object.entries(this.variants)) {
      // Skip variant if original is smaller than target
      if (
        originalWidth <= dimensions.width &&
        originalHeight <= dimensions.height
      ) {
        this.logger.debug(
          `Skipping variant ${name}: original (${originalWidth}x${originalHeight}) smaller than target (${dimensions.width}x${dimensions.height})`,
        );
        continue;
      }

      // .rotate() auto-rotates based on EXIF and strips EXIF data
      const variantBuffer = await sharp(buffer)
        .rotate()
        .resize(dimensions.width, dimensions.height, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: this.webpQuality })
        .toBuffer();

      const variantMeta = await sharp(variantBuffer).metadata();

      results.push({
        name,
        buffer: variantBuffer,
        width: variantMeta.width || 0,
        height: variantMeta.height || 0,
        size: variantBuffer.length,
      });
    }

    return results;
  }

  /**
   * Process avatar: crop to square, resize to 300x300, convert to WebP
   * Includes EXIF stripping via .rotate() (AC-004), dimension validation (AC-020),
   * and compression ratio check (AC-021)
   */
  async processAvatar(buffer: Buffer): Promise<ProcessedImage> {
    // Validate dimensions and compression ratio before processing
    const inputMetadata = await this.validateDimensions(buffer);
    this.validateCompressionRatio(buffer, inputMetadata);

    // .rotate() auto-rotates based on EXIF and strips EXIF data
    const outputBuffer = await sharp(buffer)
      .rotate()
      .resize(300, 300, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();

    const metadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: outputBuffer.length,
      format: "webp",
    };
  }

  /**
   * Process cover photo: resize to 1200x400, convert to WebP
   * Includes EXIF stripping via .rotate() (AC-004), dimension validation (AC-020),
   * and compression ratio check (AC-021)
   */
  async processCover(buffer: Buffer): Promise<ProcessedImage> {
    // Validate dimensions and compression ratio before processing
    const inputMetadata = await this.validateDimensions(buffer);
    this.validateCompressionRatio(buffer, inputMetadata);

    // .rotate() auto-rotates based on EXIF and strips EXIF data
    const outputBuffer = await sharp(buffer)
      .rotate()
      .resize(1200, 400, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();

    const metadata = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      width: metadata.width || 0,
      height: metadata.height || 0,
      size: outputBuffer.length,
      format: "webp",
    };
  }

  /**
   * Validate image buffer - check if it's a valid image
   */
  async validateImage(buffer: Buffer): Promise<boolean> {
    try {
      await sharp(buffer).metadata();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Convert image buffer to JPEG format (AC-032)
   * Used for content negotiation fallback when client doesn't support WebP
   */
  async convertToJpeg(
    buffer: Buffer,
  ): Promise<{ buffer: Buffer; size: number }> {
    const processed = await sharp(buffer).jpeg({ quality: 85 }).toBuffer();
    return {
      buffer: processed,
      size: processed.length,
    };
  }
}
