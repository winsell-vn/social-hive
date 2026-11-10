import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { PricingService } from "../services/pricing.service";
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateServiceDto,
  UpdateServiceDto,
  CreateTierDto,
  UpdateTierDto,
  CreateFaqDto,
  UpdateFaqDto,
} from "../dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { Role } from "@prisma/client";

@Controller("pricing")
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  // ==================== Public Endpoints ====================

  /**
   * Get public pricing data (services with tiers)
   * GET /api/pricing/public
   */
  @Get("public")
  @Public()
  async getPublicPricing() {
    const services = await this.pricingService.getPublicPricing();
    return { data: services };
  }

  /**
   * Get public FAQs
   * GET /api/pricing/public/faqs
   */
  @Get("public/faqs")
  @Public()
  async getPublicFaqs() {
    const faqs = await this.pricingService.getPublicFaqs();
    return { data: faqs };
  }

  /**
   * Get public categories
   * GET /api/pricing/public/categories
   */
  @Get("public/categories")
  @Public()
  async getPublicCategories() {
    const categories = await this.pricingService.getPublicCategories();
    return { data: categories };
  }

  // ==================== Admin Category Endpoints ====================

  /**
   * Get all categories (Admin)
   * GET /api/pricing/categories
   */
  @Get("categories")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllCategories() {
    const categories = await this.pricingService.getAllCategories();
    return { data: categories };
  }

  /**
   * Get category by ID (Admin)
   * GET /api/pricing/categories/:id
   */
  @Get("categories/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getCategoryById(@Param("id") id: string) {
    const category = await this.pricingService.getCategoryById(id);
    return { data: category };
  }

  /**
   * Create category (Admin)
   * POST /api/pricing/categories
   */
  @Post("categories")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async createCategory(@Body() dto: CreateCategoryDto) {
    const category = await this.pricingService.createCategory(dto);
    return { data: category };
  }

  /**
   * Update category (Admin)
   * PUT /api/pricing/categories/:id
   */
  @Put("categories/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateCategory(
    @Param("id") id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    const category = await this.pricingService.updateCategory(id, dto);
    return { data: category };
  }

  /**
   * Delete category (Admin)
   * DELETE /api/pricing/categories/:id
   */
  @Delete("categories/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async deleteCategory(@Param("id") id: string) {
    return this.pricingService.deleteCategory(id);
  }

  /**
   * Toggle category active status (Admin)
   * PATCH /api/pricing/categories/:id/toggle
   */
  @Patch("categories/:id/toggle")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async toggleCategory(@Param("id") id: string) {
    const category = await this.pricingService.toggleCategory(id);
    return { data: category };
  }

  // ==================== Admin Service Endpoints ====================

  /**
   * Get all services (Admin)
   * GET /api/pricing/services
   */
  @Get("services")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllServices() {
    const services = await this.pricingService.getAllServices();
    return { data: services };
  }

  /**
   * Get service by ID (Admin)
   * GET /api/pricing/services/:id
   */
  @Get("services/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getServiceById(@Param("id") id: string) {
    const service = await this.pricingService.getServiceById(id);
    return { data: service };
  }

  /**
   * Create service (Admin)
   * POST /api/pricing/services
   */
  @Post("services")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async createService(@Body() dto: CreateServiceDto) {
    const service = await this.pricingService.createService(dto);
    return { data: service };
  }

  /**
   * Update service (Admin)
   * PUT /api/pricing/services/:id
   */
  @Put("services/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateService(@Param("id") id: string, @Body() dto: UpdateServiceDto) {
    const service = await this.pricingService.updateService(id, dto);
    return { data: service };
  }

  /**
   * Delete service (Admin)
   * DELETE /api/pricing/services/:id
   */
  @Delete("services/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async deleteService(@Param("id") id: string) {
    return this.pricingService.deleteService(id);
  }

  /**
   * Toggle service active status (Admin)
   * PATCH /api/pricing/services/:id/toggle
   */
  @Patch("services/:id/toggle")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async toggleService(@Param("id") id: string) {
    const service = await this.pricingService.toggleService(id);
    return { data: service };
  }

  // ==================== Admin Tier Endpoints ====================

  /**
   * Get all tiers (Admin)
   * GET /api/pricing/tiers?serviceId=xxx
   */
  @Get("tiers")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllTiers(@Query("serviceId") serviceId?: string) {
    const tiers = await this.pricingService.getAllTiers(serviceId);
    return { data: tiers };
  }

  /**
   * Get tier by ID (Admin)
   * GET /api/pricing/tiers/:id
   */
  @Get("tiers/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getTierById(@Param("id") id: string) {
    const tier = await this.pricingService.getTierById(id);
    return { data: tier };
  }

  /**
   * Create tier (Admin)
   * POST /api/pricing/tiers
   */
  @Post("tiers")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async createTier(@Body() dto: CreateTierDto) {
    const tier = await this.pricingService.createTier(dto);
    return { data: tier };
  }

  /**
   * Update tier (Admin)
   * PUT /api/pricing/tiers/:id
   */
  @Put("tiers/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateTier(@Param("id") id: string, @Body() dto: UpdateTierDto) {
    const tier = await this.pricingService.updateTier(id, dto);
    return { data: tier };
  }

  /**
   * Delete tier (Admin)
   * DELETE /api/pricing/tiers/:id
   */
  @Delete("tiers/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async deleteTier(@Param("id") id: string) {
    return this.pricingService.deleteTier(id);
  }

  // ==================== Admin FAQ Endpoints ====================

  /**
   * Get all FAQs (Admin)
   * GET /api/pricing/faqs
   */
  @Get("faqs")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllFaqs() {
    const faqs = await this.pricingService.getAllFaqs();
    return { data: faqs };
  }

  /**
   * Create FAQ (Admin)
   * POST /api/pricing/faqs
   */
  @Post("faqs")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async createFaq(@Body() dto: CreateFaqDto) {
    const faq = await this.pricingService.createFaq(dto);
    return { data: faq };
  }

  /**
   * Update FAQ (Admin)
   * PUT /api/pricing/faqs/:id
   */
  @Put("faqs/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateFaq(@Param("id") id: string, @Body() dto: UpdateFaqDto) {
    const faq = await this.pricingService.updateFaq(id, dto);
    return { data: faq };
  }

  /**
   * Delete FAQ (Admin)
   * DELETE /api/pricing/faqs/:id
   */
  @Delete("faqs/:id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async deleteFaq(@Param("id") id: string) {
    return this.pricingService.deleteFaq(id);
  }
}
