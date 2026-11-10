import {
  Injectable,
  NotFoundException,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import {
  PRICING_CACHE_KEYS,
  PRICING_CACHE_TTL,
} from "../../../redis/cache-keys";
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateServiceDto,
  UpdateServiceDto,
  CreateTierDto,
  UpdateTierDto,
  CreateFaqDto,
  UpdateFaqDto,
  CreateQuoteDto,
  UpdateQuoteStatusDto,
} from "../dto";
import { QuoteStatus } from "@prisma/client";

@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  /**
   * Parse tier features from JSON string to array.
   * Database stores features as JSON string in LongText column.
   */
  private parseTierFeatures<T extends { features: string }>(
    tier: T,
  ): T & { features: string[] } {
    let features: string[] = [];
    try {
      features = JSON.parse(tier.features || "[]");
      if (!Array.isArray(features)) {
        features = [];
      }
    } catch {
      this.logger.warn(`Failed to parse features for tier, using empty array`);
      features = [];
    }
    return {
      ...tier,
      features,
    };
  }

  // ==================== Public Endpoints (Cached) ====================

  /**
   * Get active services with their tiers for public display (cached)
   */
  async getPublicPricing() {
    return this.redisService.getOrSet(
      PRICING_CACHE_KEYS.PUBLIC_SERVICES,
      async () => {
        const services = await this.prisma.service.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          include: {
            pricingTiers: {
              where: { isActive: true },
              orderBy: { displayOrder: "asc" },
            },
          },
        });

        // Parse features JSON for each tier
        return services.map((service) => ({
          ...service,
          pricingTiers: service.pricingTiers.map((tier) =>
            this.parseTierFeatures(tier),
          ),
        }));
      },
      PRICING_CACHE_TTL,
    );
  }

  /**
   * Get active FAQs for public display (cached)
   */
  async getPublicFaqs() {
    return this.redisService.getOrSet(
      PRICING_CACHE_KEYS.PUBLIC_FAQS,
      async () => {
        return this.prisma.pricingFAQ.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          select: {
            id: true,
            question: true,
            answer: true,
            category: true,
          },
        });
      },
      PRICING_CACHE_TTL,
    );
  }

  // ==================== Category CRUD ====================

  async getPublicCategories() {
    return this.redisService.getOrSet(
      PRICING_CACHE_KEYS.PUBLIC_CATEGORIES,
      async () => {
        return this.prisma.serviceCategory.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          include: {
            _count: { select: { services: true } },
          },
        });
      },
      PRICING_CACHE_TTL,
    );
  }

  async getAllCategories() {
    return this.prisma.serviceCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        _count: { select: { services: true } },
      },
    });
  }

  async getCategoryById(id: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
      include: { services: { orderBy: { displayOrder: "asc" } } },
    });

    if (!category) {
      throw new NotFoundException("Danh mục không tồn tại");
    }

    return category;
  }

  async createCategory(dto: CreateCategoryDto) {
    this.logger.log(`Creating category: ${dto.name}`);

    const category = await this.prisma.serviceCategory.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        icon: dto.icon,
        isActive: dto.isActive ?? true,
        displayOrder: dto.displayOrder ?? 0,
      },
    });

    await this.invalidatePricingCache();
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    this.logger.log(`Updating category: ${id}`);

    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException("Danh mục không tồn tại");
    }

    const updated = await this.prisma.serviceCategory.update({
      where: { id },
      data: dto,
    });

    await this.invalidatePricingCache();
    return updated;
  }

  async deleteCategory(id: string) {
    this.logger.log(`Deleting category: ${id}`);

    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException("Danh mục không tồn tại");
    }

    await this.prisma.serviceCategory.delete({ where: { id } });
    await this.invalidatePricingCache();

    return { message: "Đã xóa danh mục thành công" };
  }

  async toggleCategory(id: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException("Danh mục không tồn tại");
    }

    const updated = await this.prisma.serviceCategory.update({
      where: { id },
      data: { isActive: !category.isActive },
    });

    await this.invalidatePricingCache();
    return updated;
  }

  // ==================== Service CRUD ====================

  async getAllServices() {
    return this.prisma.service.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { pricingTiers: true },
        },
      },
    });
  }

  async getServiceById(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: { pricingTiers: { orderBy: { displayOrder: "asc" } } },
    });

    if (!service) {
      throw new NotFoundException("Dịch vụ không tồn tại");
    }

    return {
      ...service,
      pricingTiers: service.pricingTiers.map((tier) =>
        this.parseTierFeatures(tier),
      ),
    };
  }

  async createService(dto: CreateServiceDto) {
    this.logger.log(`Creating service: ${dto.name}`);

    const service = await this.prisma.service.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        icon: dto.icon,
        isActive: dto.isActive ?? true,
        displayOrder: dto.displayOrder ?? 0,
        categoryId: dto.categoryId,
      },
    });

    await this.invalidatePricingCache();
    return service;
  }

  async updateService(id: string, dto: UpdateServiceDto) {
    this.logger.log(`Updating service: ${id}`);

    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException("Dịch vụ không tồn tại");
    }

    const updated = await this.prisma.service.update({
      where: { id },
      data: dto,
    });

    await this.invalidatePricingCache();
    return updated;
  }

  async deleteService(id: string) {
    this.logger.log(`Deleting service: ${id}`);

    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException("Dịch vụ không tồn tại");
    }

    await this.prisma.service.delete({ where: { id } });
    await this.invalidatePricingCache();

    return { message: "Đã xóa dịch vụ thành công" };
  }

  async toggleService(id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) {
      throw new NotFoundException("Dịch vụ không tồn tại");
    }

    const updated = await this.prisma.service.update({
      where: { id },
      data: { isActive: !service.isActive },
    });

    await this.invalidatePricingCache();
    return updated;
  }

  // ==================== Tier CRUD ====================

  async getAllTiers(serviceId?: string) {
    const where = serviceId ? { serviceId } : {};
    const tiers = await this.prisma.pricingTier.findMany({
      where,
      orderBy: [{ serviceId: "asc" }, { displayOrder: "asc" }],
      include: { service: { select: { id: true, name: true } } },
    });
    return tiers.map((tier) => this.parseTierFeatures(tier));
  }

  async getTierById(id: string) {
    const tier = await this.prisma.pricingTier.findUnique({
      where: { id },
      include: { service: true },
    });

    if (!tier) {
      throw new NotFoundException("Gói dịch vụ không tồn tại");
    }

    return this.parseTierFeatures(tier);
  }

  async createTier(dto: CreateTierDto) {
    this.logger.log(`Creating tier: ${dto.name} for service ${dto.serviceId}`);

    // Verify service exists
    const service = await this.prisma.service.findUnique({
      where: { id: dto.serviceId },
    });
    if (!service) {
      throw new NotFoundException("Dịch vụ không tồn tại");
    }

    const tier = await this.prisma.pricingTier.create({
      data: {
        serviceId: dto.serviceId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        priceNote: dto.priceNote,
        currency: dto.currency ?? "VND",
        billingType: dto.billingType ?? "one-time",
        features: JSON.stringify(dto.features),
        isPopular: dto.isPopular ?? false,
        isRecommended: dto.isRecommended ?? false,
        displayOrder: dto.displayOrder ?? 0,
        ctaText: dto.ctaText ?? "Liên hệ tư vấn",
        ctaLink: dto.ctaLink,
        isActive: dto.isActive ?? true,
      },
    });

    await this.invalidatePricingCache();
    return this.parseTierFeatures(tier);
  }

  async updateTier(id: string, dto: UpdateTierDto) {
    this.logger.log(`Updating tier: ${id}`);

    const tier = await this.prisma.pricingTier.findUnique({ where: { id } });
    if (!tier) {
      throw new NotFoundException("Gói dịch vụ không tồn tại");
    }

    // If serviceId is being updated, verify new service exists
    if (dto.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: dto.serviceId },
      });
      if (!service) {
        throw new NotFoundException("Dịch vụ không tồn tại");
      }
    }

    const updateData: any = { ...dto };
    if (dto.features) {
      updateData.features = JSON.stringify(dto.features);
    }

    const updated = await this.prisma.pricingTier.update({
      where: { id },
      data: updateData,
    });

    await this.invalidatePricingCache();
    return this.parseTierFeatures(updated);
  }

  async deleteTier(id: string) {
    this.logger.log(`Deleting tier: ${id}`);

    const tier = await this.prisma.pricingTier.findUnique({ where: { id } });
    if (!tier) {
      throw new NotFoundException("Gói dịch vụ không tồn tại");
    }

    await this.prisma.pricingTier.delete({ where: { id } });
    await this.invalidatePricingCache();

    return { message: "Đã xóa gói dịch vụ thành công" };
  }

  // ==================== FAQ CRUD ====================

  async getAllFaqs() {
    return this.prisma.pricingFAQ.findMany({
      orderBy: { displayOrder: "asc" },
    });
  }

  async createFaq(dto: CreateFaqDto) {
    this.logger.log(`Creating FAQ: ${dto.question.substring(0, 50)}...`);

    const faq = await this.prisma.pricingFAQ.create({
      data: {
        question: dto.question,
        answer: dto.answer,
        category: dto.category,
        displayOrder: dto.displayOrder ?? 0,
        isActive: dto.isActive ?? true,
      },
    });

    await this.invalidatePricingCache();
    return faq;
  }

  async updateFaq(id: string, dto: UpdateFaqDto) {
    this.logger.log(`Updating FAQ: ${id}`);

    const faq = await this.prisma.pricingFAQ.findUnique({ where: { id } });
    if (!faq) {
      throw new NotFoundException("FAQ không tồn tại");
    }

    const updated = await this.prisma.pricingFAQ.update({
      where: { id },
      data: dto,
    });

    await this.invalidatePricingCache();
    return updated;
  }

  async deleteFaq(id: string) {
    this.logger.log(`Deleting FAQ: ${id}`);

    const faq = await this.prisma.pricingFAQ.findUnique({ where: { id } });
    if (!faq) {
      throw new NotFoundException("FAQ không tồn tại");
    }

    await this.prisma.pricingFAQ.delete({ where: { id } });
    await this.invalidatePricingCache();

    return { message: "Đã xóa FAQ thành công" };
  }

  // ==================== Quote CRUD ====================

  async submitQuote(dto: CreateQuoteDto) {
    this.logger.log(`New quote request from: ${dto.email}`);

    const quote = await this.prisma.quoteRequest.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        company: dto.company,
        serviceId: dto.serviceId,
        tierId: dto.tierId,
        budget: dto.budget,
        timeline: dto.timeline,
        requirements: dto.requirements,
        source: dto.source,
      },
    });

    return {
      success: true,
      message:
        "Yêu cầu báo giá đã được gửi thành công. Chúng tôi sẽ liên hệ bạn sớm nhất.",
      quoteId: quote.id,
    };
  }

  async getAllQuotes(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    // Validate status against QuoteStatus enum
    if (filters?.status) {
      const validStatuses = Object.values(QuoteStatus);
      if (!validStatuses.includes(filters.status as QuoteStatus)) {
        throw new BadRequestException(
          `Invalid status: ${filters.status}. Valid values: ${validStatuses.join(", ")}`,
        );
      }
      where.status = filters.status as QuoteStatus;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        // Set to end of day for endDate
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Pagination defaults
    const page = filters?.page && filters.page > 0 ? filters.page : 1;
    const limit =
      filters?.limit && filters.limit > 0 ? Math.min(filters.limit, 100) : 20;
    const skip = (page - 1) * limit;

    // Get total count and paginated data
    const [quotes, total] = await Promise.all([
      this.prisma.quoteRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      this.prisma.quoteRequest.count({ where }),
    ]);

    return {
      data: quotes,
      total,
      page,
      limit,
    };
  }

  async getQuoteById(id: string) {
    const quote = await this.prisma.quoteRequest.findUnique({ where: { id } });

    if (!quote) {
      throw new NotFoundException("Yêu cầu báo giá không tồn tại");
    }

    return quote;
  }

  async updateQuoteStatus(id: string, dto: UpdateQuoteStatusDto) {
    this.logger.log(`Updating quote status: ${id} -> ${dto.status}`);

    const quote = await this.prisma.quoteRequest.findUnique({ where: { id } });
    if (!quote) {
      throw new NotFoundException("Yêu cầu báo giá không tồn tại");
    }

    return this.prisma.quoteRequest.update({
      where: { id },
      data: {
        status: dto.status,
        notes: dto.notes !== undefined ? dto.notes : quote.notes,
      },
    });
  }

  async deleteQuote(id: string) {
    this.logger.log(`Deleting quote: ${id}`);

    const quote = await this.prisma.quoteRequest.findUnique({ where: { id } });
    if (!quote) {
      throw new NotFoundException("Yêu cầu báo giá không tồn tại");
    }

    await this.prisma.quoteRequest.delete({ where: { id } });

    return { message: "Đã xóa yêu cầu báo giá thành công" };
  }

  // ==================== CSV Export ====================

  /**
   * Export quotes to CSV format with human-readable service/tier names
   */
  async exportQuotesToCsv(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<string> {
    // Build where clause (same logic as getAllQuotes but without pagination)
    const where: any = {};

    if (filters?.status) {
      const validStatuses = Object.values(QuoteStatus);
      if (validStatuses.includes(filters.status as QuoteStatus)) {
        where.status = filters.status as QuoteStatus;
      }
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    // Fetch all quotes (no pagination for export) with service/tier names
    const quotes = await this.prisma.quoteRequest.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    // Fetch all services and tiers for name lookup
    const [services, tiers] = await Promise.all([
      this.prisma.service.findMany({ select: { id: true, name: true } }),
      this.prisma.pricingTier.findMany({ select: { id: true, name: true } }),
    ]);

    const serviceMap = new Map(services.map((s) => [s.id, s.name]));
    const tierMap = new Map(tiers.map((t) => [t.id, t.name]));

    // CSV header
    const headers = [
      "Name",
      "Email",
      "Phone",
      "Company",
      "Service",
      "Tier",
      "Status",
      "Budget",
      "Timeline",
      "Requirements",
      "Notes",
      "Created At",
    ];
    const rows: string[] = [headers.join(",")];

    // CSV rows
    for (const quote of quotes) {
      // Escape content for CSV (handle commas, quotes, newlines)
      const escapeCsv = (value: string | null | undefined): string => {
        if (!value) return "";
        return `"${value.replace(/"/g, '""').replace(/\n/g, " ")}"`;
      };

      const serviceName = quote.serviceId
        ? serviceMap.get(quote.serviceId) || "-"
        : "-";
      const tierName = quote.tierId ? tierMap.get(quote.tierId) || "-" : "-";

      rows.push(
        [
          escapeCsv(quote.name),
          escapeCsv(quote.email),
          escapeCsv(quote.phone),
          escapeCsv(quote.company),
          escapeCsv(serviceName),
          escapeCsv(tierName),
          quote.status,
          escapeCsv(quote.budget),
          escapeCsv(quote.timeline),
          escapeCsv(quote.requirements),
          escapeCsv(quote.notes),
          quote.createdAt.toISOString(),
        ].join(","),
      );
    }

    return rows.join("\n");
  }

  // ==================== Cache Invalidation ====================

  private async invalidatePricingCache() {
    await Promise.all([
      this.redisService.del(PRICING_CACHE_KEYS.PUBLIC_SERVICES),
      this.redisService.del(PRICING_CACHE_KEYS.PUBLIC_FAQS),
      this.redisService.del(PRICING_CACHE_KEYS.PUBLIC_CATEGORIES),
    ]);
    this.logger.debug("Pricing cache invalidated");
  }
}
