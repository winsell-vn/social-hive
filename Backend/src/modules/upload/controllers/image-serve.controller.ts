import {
  Controller,
  Get,
  Param,
  Res,
  Headers,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { Response } from "express";
import { createHash } from "crypto";
import { MediaRepository } from "../repositories/media.repository";
import { ImageCacheService } from "../services/image-cache.service";
import { ImageProcessorService } from "../services/image-processor.service";
import { MediaStatus } from "@prisma/client";
import { Public } from "../../../common/decorators/public.decorator";

@Controller("images")
@Public()
export class ImageServeController {
  private readonly logger = new Logger(ImageServeController.name);

  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly cacheService: ImageCacheService,
    private readonly imageProcessor: ImageProcessorService,
  ) {}

  // Express 5 / path-to-regexp 8 requires optional segments in braces.
  @Get(":id{/:variant}")
  async serveImage(
    @Param("id") id: string,
    @Param("variant") variant: string | undefined,
    @Res() res: Response,
    @Headers("if-none-match") ifNoneMatch?: string,
    @Headers("accept") accept?: string,
  ) {
    const effectiveVariant = variant || "large";

    // Determine format preference from Accept header (AC-032)
    const supportsWebP = accept?.includes("image/webp") ?? true; // Default to WebP if no Accept header

    // 1. Try Redis metadata cache first
    let storagePath: string | null = null;
    let mimeType = "image/webp";
    let hasHash = false;
    let originalPath: string | undefined;
    let originalMimeType: string | undefined;
    let variants: Record<string, { path?: string; url?: string }> | undefined;

    const cachedMeta = await this.cacheService.getMetadata(id);
    if (cachedMeta) {
      // Use cached variants data to resolve correct variant path (hash-based subdirectories differ per file)
      if (cachedMeta.variants) {
        storagePath = this.resolveStoragePathFromVariants(
          cachedMeta.variants,
          cachedMeta.storagePath,
          effectiveVariant,
        );
      } else {
        storagePath = this.getVariantPath(
          cachedMeta.storagePath,
          effectiveVariant,
        );
      }
      mimeType = cachedMeta.mimeType || "image/webp";
      hasHash = !!cachedMeta.hash;
      originalPath = cachedMeta.originalPath;
      originalMimeType = cachedMeta.originalMimeType;
      variants = cachedMeta.variants;
    }

    // 2. If no cached metadata, look up in database
    if (!storagePath) {
      const media = await this.mediaRepository.findById(id);
      if (!media || media.status !== MediaStatus.READY) {
        throw new NotFoundException("Không tìm thấy hình ảnh");
      }

      // Determine storage path for the requested variant
      storagePath = this.resolveStoragePath(media, effectiveVariant);
      mimeType = media.mimeType || "image/webp";
      hasHash = !!media.hash;
      originalPath = media.originalPath ?? undefined;
      originalMimeType = media.originalMimeType ?? undefined;
      variants = media.variants as
        | Record<string, { path?: string; url?: string }>
        | undefined;

      // Cache metadata for next time (include hash, originalPath, originalMimeType, variants)
      await this.cacheService.setMetadata(id, {
        storagePath: media.storagePath,
        mimeType,
        size: media.size,
        hash: media.hash ?? undefined,
        originalPath,
        originalMimeType,
        variants,
      });
    }

    if (!storagePath) {
      throw new NotFoundException("Không tìm thấy hình ảnh");
    }

    // 3. Get image buffer from cache hierarchy (include format in cache key)
    const format = supportsWebP ? "webp" : "jpeg";
    const cacheKey = `${id}:${effectiveVariant}:${format}`;
    const buffer = await this.cacheService.get(cacheKey, storagePath);

    if (!buffer) {
      throw new NotFoundException("Không tìm thấy file hình ảnh");
    }

    // 4. Handle content negotiation (AC-032)
    let responseBuffer = buffer;
    let responseMimeType = mimeType;

    // Detect if buffer is already JPEG by checking magic bytes (0xFF 0xD8)
    // This handles cached JPEG buffers correctly regardless of cache state
    if (
      format === "jpeg" &&
      responseBuffer.length >= 2 &&
      responseBuffer[0] === 0xff &&
      responseBuffer[1] === 0xd8
    ) {
      responseMimeType = "image/jpeg";
    } else if (!supportsWebP && mimeType === "image/webp") {
      // Client doesn't support WebP — try original file first, then convert
      if (originalPath && originalMimeType) {
        // Serve original file directly (works for both cache hit and DB lookup)
        try {
          const originalBuffer = await this.cacheService.get(
            `${id}:${effectiveVariant}:original`,
            originalPath,
          );
          if (originalBuffer) {
            responseBuffer = originalBuffer;
            responseMimeType = originalMimeType;
          }
        } catch {
          // Fall through to on-the-fly conversion
        }
      }

      // If still WebP (original not available), convert on-the-fly
      if (responseMimeType === "image/webp") {
        const jpegResult =
          await this.imageProcessor.convertToJpeg(responseBuffer);
        responseBuffer = jpegResult.buffer;
        responseMimeType = "image/jpeg";
        // Cache the converted JPEG buffer for future requests
        this.cacheService.set(cacheKey, responseBuffer);
      }
    }

    // 5. Generate ETag from response content hash
    const etag = createHash("md5").update(responseBuffer).digest("hex");

    // 6. Check If-None-Match for 304
    if (ifNoneMatch && ifNoneMatch === `"${etag}"`) {
      return res.status(304).end();
    }

    // 7. Set response headers and send
    res.setHeader("Vary", "Accept"); // Important for CDN/proxy caching
    res.setHeader("Content-Type", responseMimeType);
    res.setHeader("Content-Length", responseBuffer.length);
    if (hasHash) {
      // Content-addressed URL — safe to cache immutably
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    } else {
      // Non-versioned URL — use shorter cache
      res.setHeader("Cache-Control", "public, max-age=3600");
    }
    res.setHeader("ETag", `"${etag}"`);
    res.setHeader("X-Cache-Key", cacheKey);

    return res.send(responseBuffer);
  }

  /**
   * Resolve storage path from cached variants data
   */
  private resolveStoragePathFromVariants(
    variants: Record<string, { path?: string; url?: string }>,
    fallbackStoragePath: string,
    variant: string,
  ): string {
    const variantData = variants[variant];
    if (variantData?.path) {
      return variantData.path;
    }
    if (variantData?.url) {
      // Extract path from URL (remove /uploads/ prefix)
      return variantData.url.replace(/^\/uploads\//, "");
    }
    // Fallback: construct variant path from main storage path
    return this.getVariantPath(fallbackStoragePath, variant);
  }

  /**
   * Resolve storage path for a specific variant from media record
   */
  private resolveStoragePath(
    media: { storagePath: string; variants?: unknown },
    variant: string,
  ): string {
    if (media.variants && typeof media.variants === "object") {
      return this.resolveStoragePathFromVariants(
        media.variants as Record<string, { path?: string; url?: string }>,
        media.storagePath,
        variant,
      );
    }
    return this.getVariantPath(media.storagePath, variant);
  }

  /**
   * Get variant path by appending variant suffix to base path
   */
  private getVariantPath(basePath: string, variant: string): string {
    if (variant === "original") {
      return basePath;
    }
    // e.g., "posts/ab/cd/filename.webp" -> "posts/ab/cd/filename-large.webp"
    // Use dash separator to match upload naming convention in upload.service.ts
    const ext = basePath.substring(basePath.lastIndexOf("."));
    const base = basePath.substring(0, basePath.lastIndexOf("."));
    return `${base}-${variant}${ext}`;
  }
}
