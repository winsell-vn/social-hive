import { Injectable, Inject, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LRUCache } from "lru-cache";
import { RedisService } from "../../../redis/redis.service";
import {
  IStorageAdapter,
  STORAGE_ADAPTER,
} from "../interfaces/storage.interface";

export interface CachedImageMetadata {
  storagePath: string;
  mimeType: string;
  hash?: string;
  size: number;
  originalPath?: string;
  originalMimeType?: string;
  variants?: Record<
    string,
    { path?: string; url?: string; width?: number; height?: number }
  >;
}

@Injectable()
export class ImageCacheService implements OnModuleInit {
  private readonly logger = new Logger(ImageCacheService.name);
  private lruCache: LRUCache<string, Buffer>;
  private readonly metadataTtl: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    @Inject(STORAGE_ADAPTER) private readonly storage: IStorageAdapter,
  ) {
    const maxSize = this.configService.get<number>(
      "upload.cache.lruMaxSize",
      100 * 1024 * 1024,
    ); // 100MB
    const ttl = this.configService.get<number>(
      "upload.cache.lruTtl",
      60 * 60 * 1000,
    ); // 1 hour
    this.metadataTtl = this.configService.get<number>(
      "upload.cache.metadataTtl",
      86400,
    ); // 24 hours

    this.lruCache = new LRUCache<string, Buffer>({
      maxSize,
      ttl,
      sizeCalculation: (buffer) => buffer.length,
      updateAgeOnGet: true,
    });
  }

  onModuleInit() {
    this.logger.log("ImageCacheService initialized");
  }

  /**
   * Get image buffer from cache hierarchy: LRU → disk
   */
  async get(cacheKey: string, storagePath: string): Promise<Buffer | null> {
    // 1. Check LRU memory cache
    const cached = this.lruCache.get(cacheKey);
    if (cached) {
      this.logger.debug(`LRU cache HIT: ${cacheKey}`);
      return cached;
    }

    // 2. Read from disk using storage adapter
    try {
      const buffer = await this.storage.read(storagePath);
      // Populate LRU cache
      this.lruCache.set(cacheKey, buffer);
      this.logger.debug(`Disk read + LRU populated: ${cacheKey}`);
      return buffer;
    } catch {
      this.logger.debug(`File not found on disk: ${storagePath}`);
      return null;
    }
  }

  /**
   * Store image metadata in Redis for fast lookup
   */
  async setMetadata(
    mediaId: string,
    metadata: CachedImageMetadata,
  ): Promise<void> {
    try {
      await this.redisService.set(
        `image:meta:${mediaId}`,
        metadata,
        this.metadataTtl,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to cache metadata for ${mediaId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get image metadata from Redis
   */
  async getMetadata(mediaId: string): Promise<CachedImageMetadata | null> {
    try {
      return await this.redisService.get<CachedImageMetadata>(
        `image:meta:${mediaId}`,
      );
    } catch {
      return null;
    }
  }

  /**
   * Set image buffer in LRU cache
   */
  set(cacheKey: string, buffer: Buffer): void {
    this.lruCache.set(cacheKey, buffer);
    this.logger.debug(`LRU cache SET: ${cacheKey}`);
  }

  /**
   * Check if a key exists in LRU cache (without fetching from disk)
   */
  has(cacheKey: string): boolean {
    return this.lruCache.has(cacheKey);
  }

  /**
   * Invalidate all caches for a media item
   */
  async invalidate(mediaId: string, variants?: string[]): Promise<void> {
    // Remove metadata from Redis
    try {
      await this.redisService.del(`image:meta:${mediaId}`);
    } catch (error) {
      this.logger.warn(
        `Failed to invalidate Redis cache for ${mediaId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Remove from LRU (all variants with all format suffixes)
    const variantNames = variants || [
      "thumb",
      "thumbnail",
      "small",
      "medium",
      "large",
      "original",
      "avatar",
      "cover",
    ];
    const formats = ["webp", "jpeg", "original"];
    for (const variant of variantNames) {
      // Delete 2-part key for backward compatibility
      this.lruCache.delete(`${mediaId}:${variant}`);
      // Delete 3-part keys with all format suffixes
      for (const format of formats) {
        this.lruCache.delete(`${mediaId}:${variant}:${format}`);
      }
    }
    // Also delete the base key
    this.lruCache.delete(mediaId);
  }

  /**
   * Get cache stats for monitoring
   */
  getStats() {
    return {
      lruSize: this.lruCache.calculatedSize,
      lruItemCount: this.lruCache.size,
    };
  }
}
