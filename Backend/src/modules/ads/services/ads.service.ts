import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import { CreateAdDto, UpdateAdDto, GetAdsDto } from "../dto";
import { PaginatedResult } from "../../../common/dto/pagination.dto";
import { AdPlacement } from "@prisma/client";
import { Prisma } from "@prisma/client";

const CACHE_KEY_ADS_ACTIVE = "ads:active";
const CACHE_KEY_ADS_FEED = "ads:feed";
const CACHE_KEY_ADS_SIDEBAR = "ads:sidebar";
const CACHE_TTL_ADS = 300; // 5 minutes

@Injectable()
export class AdsService {
  private readonly logger = new Logger(AdsService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  /**
   * Create a new ad (Admin only)
   */
  async create(dto: CreateAdDto) {
    this.logger.log(`Creating new ad: ${dto.title}`);

    const ad = await this.prisma.ad.create({
      data: {
        title: dto.title,
        description: dto.description,
        imageUrl: dto.imageUrl,
        ctaText: dto.ctaText || "Tìm hiểu thêm",
        ctaLink: dto.ctaLink,
        placement: dto.placement || AdPlacement.FEED,
        isActive: dto.isActive ?? true,
        priority: dto.priority ?? 0,
      },
    });

    // Invalidate cache
    await this.invalidateAdsCache();

    return ad;
  }

  /**
   * Get all ads with pagination and filters (Admin)
   */
  async findAll(dto: GetAdsDto) {
    const { page = 1, limit = 20, placement, isActive } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (placement) where.placement = placement;
    if (isActive !== undefined) where.isActive = isActive;

    const [ads, total] = await Promise.all([
      this.prisma.ad.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      }),
      this.prisma.ad.count({ where }),
    ]);

    return new PaginatedResult(ads, page, limit, total);
  }

  /**
   * Get active ads for public display (with caching)
   */
  async getActiveAds(placement?: AdPlacement) {
    const cacheKey = placement
      ? placement === AdPlacement.FEED
        ? CACHE_KEY_ADS_FEED
        : CACHE_KEY_ADS_SIDEBAR
      : CACHE_KEY_ADS_ACTIVE;

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const where: any = { isActive: true };

        if (placement) {
          where.OR = [{ placement }, { placement: AdPlacement.BOTH }];
        }

        return this.prisma.ad.findMany({
          where,
          orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        });
      },
      CACHE_TTL_ADS,
    );
  }

  /**
   * Get a single ad by ID
   */
  async findOne(id: string) {
    try {
      const ad = await this.prisma.ad.findUnique({ where: { id } });

      if (!ad) {
        throw new NotFoundException("Quảng cáo không tồn tại");
      }

      return ad;
    } catch (error) {
      this.handleError("fetching", id, error);
    }
  }

  /**
   * Update an ad (Admin only)
   */
  async update(id: string, dto: UpdateAdDto) {
    this.logger.log(`Updating ad ${id}`);

    try {
      const ad = await this.prisma.ad.findUnique({ where: { id } });
      if (!ad) {
        throw new NotFoundException("Quảng cáo không tồn tại");
      }

      const updated = await this.prisma.ad.update({
        where: { id },
        data: dto,
      });

      // Invalidate cache
      await this.invalidateAdsCache();

      return updated;
    } catch (error) {
      this.handleError("updating", id, error);
    }
  }

  /**
   * Delete an ad (Admin only)
   */
  async remove(id: string) {
    this.logger.log(`Deleting ad ${id}`);

    try {
      const ad = await this.prisma.ad.findUnique({ where: { id } });
      if (!ad) {
        throw new NotFoundException("Quảng cáo không tồn tại");
      }

      await this.prisma.ad.delete({ where: { id } });

      // Invalidate cache
      await this.invalidateAdsCache();

      return { message: "Đã xóa quảng cáo thành công" };
    } catch (error) {
      this.handleError("deleting", id, error);
    }
  }

  /**
   * Toggle ad active status (Admin only)
   */
  async toggleStatus(id: string) {
    try {
      const ad = await this.prisma.ad.findUnique({ where: { id } });
      if (!ad) {
        throw new NotFoundException("Quảng cáo không tồn tại");
      }

      const updated = await this.prisma.ad.update({
        where: { id },
        data: { isActive: !ad.isActive },
      });

      // Invalidate cache
      await this.invalidateAdsCache();

      return updated;
    } catch (error) {
      this.handleError("toggling", id, error);
    }
  }

  /**
   * Record an ad click
   */
  async recordClick(adId: string, ipHash?: string, userAgent?: string): Promise<void> {
    try {
      // Verify ad exists
      const ad = await this.prisma.ad.findUnique({ where: { id: adId } });
      if (!ad) {
        throw new NotFoundException(`Ad with ID ${adId} not found`);
      }

      // Rate limit: max 1 click per IP per ad per 5 minutes
      if (ipHash) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentClick = await this.prisma.adClick.findFirst({
          where: {
            adId,
            ipHash,
            clickedAt: { gte: fiveMinutesAgo },
          },
        });
        if (recentClick) {
          return; // Silently skip duplicate clicks
        }
      }

      await this.prisma.adClick.create({
        data: { adId, ipHash, userAgent },
      });

      // Increment click count on the ad
      await this.prisma.ad.update({
        where: { id: adId },
        data: { clickCount: { increment: 1 } },
      });
    } catch (error) {
      this.handleError("recording click for", adId, error);
    }
  }

  /**
   * Record an ad impression
   * Uses Redis for deduplication (1 impression per IP per ad per 5 minutes)
   */
  async recordImpression(adId: string, ipHash?: string): Promise<void> {
    try {
      // Verify ad exists
      const ad = await this.prisma.ad.findUnique({ where: { id: adId } });
      if (!ad) {
        throw new NotFoundException(`Ad with ID ${adId} not found`);
      }

      // Rate limit: max 1 impression per IP per ad per 5 minutes using Redis
      if (ipHash) {
        const cacheKey = `ad:impression:${adId}:${ipHash}`;
        const exists = await this.redisService.get(cacheKey);
        if (exists) {
          return; // Silently skip duplicate impressions
        }
        // Set key with 5-minute TTL
        await this.redisService.set(cacheKey, "1", 300);
      }

      // Increment impression count directly on the ad
      await this.prisma.ad.update({
        where: { id: adId },
        data: { impressionCount: { increment: 1 } },
      });
    } catch (error) {
      this.handleError("recording impression for", adId, error);
    }
  }

  /**
   * Get click analytics for a single ad
   */
  async getAdAnalytics(adId: string): Promise<{ clicks1d: number; clicks7d: number; clicks30d: number }> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [clicks1d, clicks7d, clicks30d] = await Promise.all([
      this.prisma.adClick.count({ where: { adId, clickedAt: { gte: oneDayAgo } } }),
      this.prisma.adClick.count({ where: { adId, clickedAt: { gte: sevenDaysAgo } } }),
      this.prisma.adClick.count({ where: { adId, clickedAt: { gte: thirtyDaysAgo } } }),
    ]);

    return { clicks1d, clicks7d, clicks30d };
  }

  /**
   * Get click analytics for all ads
   */
  async getAllAdsAnalytics(): Promise<Record<string, { clicks1d: number; clicks7d: number; clicks30d: number }>> {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get all ads
    const ads = await this.prisma.ad.findMany({ select: { id: true } });

    // Get aggregated clicks for each period
    const [clicks1d, clicks7d, clicks30d] = await Promise.all([
      this.prisma.adClick.groupBy({
        by: ['adId'],
        where: { clickedAt: { gte: oneDayAgo } },
        _count: { id: true },
      }),
      this.prisma.adClick.groupBy({
        by: ['adId'],
        where: { clickedAt: { gte: sevenDaysAgo } },
        _count: { id: true },
      }),
      this.prisma.adClick.groupBy({
        by: ['adId'],
        where: { clickedAt: { gte: thirtyDaysAgo } },
        _count: { id: true },
      }),
    ]);

    // Build result map
    const result: Record<string, { clicks1d: number; clicks7d: number; clicks30d: number }> = {};

    for (const ad of ads) {
      result[ad.id] = { clicks1d: 0, clicks7d: 0, clicks30d: 0 };
    }

    for (const c of clicks1d) {
      if (result[c.adId]) result[c.adId].clicks1d = c._count.id;
    }
    for (const c of clicks7d) {
      if (result[c.adId]) result[c.adId].clicks7d = c._count.id;
    }
    for (const c of clicks30d) {
      if (result[c.adId]) result[c.adId].clicks30d = c._count.id;
    }

    return result;
  }

  /**
   * Handle Prisma and unexpected errors with consistent logging
   * Re-throws known HTTP exceptions, logs and re-throws others
   */
  private handleError(operation: string, id: string, error: unknown): never {
    if (error instanceof NotFoundException) {
      throw error;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        this.logger.warn(`Ad not found during ${operation}: ${id}`);
        throw new NotFoundException("Quảng cáo không tồn tại");
      }
      this.logger.error(`Prisma error ${operation} ad ${id}: ${error.code}`, error);
    } else {
      this.logger.error(`Error ${operation} ad ${id}`, error);
    }
    throw error;
  }

  /**
   * Invalidate all ads-related cache
   */
  private async invalidateAdsCache() {
    await Promise.all([
      this.redisService.del(CACHE_KEY_ADS_ACTIVE),
      this.redisService.del(CACHE_KEY_ADS_FEED),
      this.redisService.del(CACHE_KEY_ADS_SIDEBAR),
    ]);
  }
}
