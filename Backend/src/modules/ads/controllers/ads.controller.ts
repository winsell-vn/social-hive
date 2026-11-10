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
  Req,
  ParseUUIDPipe,
} from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { Request } from "express";
import * as crypto from "crypto";
import { AdsService } from "../services/ads.service";
import { CreateAdDto, UpdateAdDto, GetAdsDto } from "../dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role, AdPlacement } from "@prisma/client";

@Controller("ads")
export class AdsController {
  constructor(private readonly adsService: AdsService) {}

  /**
   * Get active ads for public display (no auth required)
   * GET /api/ads/public?placement=FEED|SIDEBAR
   */
  @Get("public")
  async getPublicAds(@Query("placement") placement?: AdPlacement) {
    return this.adsService.getActiveAds(placement);
  }

  /**
   * Get click analytics for all ads (Admin only)
   * GET /api/ads/analytics
   */
  @Get("analytics")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAnalytics() {
    return this.adsService.getAllAdsAnalytics();
  }

  /**
   * Record an ad click (public, no auth required)
   * POST /api/ads/:id/click
   * Rate limited: 30 requests/minute per IP (framework level)
   * + 5-minute per-ad deduplication (service level)
   */
  @Post(":id/click")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async recordClick(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    // Hash the IP address for privacy
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16);
    const userAgent = req.headers["user-agent"] || "";

    await this.adsService.recordClick(id, ipHash, userAgent);
    return { success: true };
  }

  /**
   * Record an ad impression (public, no auth required)
   * POST /api/ads/:id/impression
   * Rate limited: 60 requests/minute per IP (framework level)
   * + 5-minute per-ad deduplication (service level via Redis)
   */
  @Post(":id/impression")
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async recordImpression(
    @Param("id", ParseUUIDPipe) id: string,
    @Req() req: Request,
  ) {
    // Hash the IP address for privacy
    const ip = req.ip || req.headers["x-forwarded-for"]?.toString() || "";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").substring(0, 16);

    await this.adsService.recordImpression(id, ipHash);
    return { success: true };
  }

  /**
   * Get all ads with filters (Admin only)
   * GET /api/ads
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findAll(@Query() query: GetAdsDto) {
    return this.adsService.findAll(query);
  }

  /**
   * Get single ad by ID (Admin only)
   * GET /api/ads/:id
   */
  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.adsService.findOne(id);
  }

  /**
   * Create new ad (Admin only)
   * POST /api/ads
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async create(@Body() dto: CreateAdDto) {
    return this.adsService.create(dto);
  }

  /**
   * Update ad (Admin only)
   * PUT /api/ads/:id
   */
  @Put(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateAdDto) {
    return this.adsService.update(id, dto);
  }

  /**
   * Toggle ad status (Admin only)
   * PATCH /api/ads/:id/toggle
   */
  @Patch(":id/toggle")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async toggleStatus(@Param("id", ParseUUIDPipe) id: string) {
    return this.adsService.toggleStatus(id);
  }

  /**
   * Delete ad (Admin only)
   * DELETE /api/ads/:id
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.adsService.remove(id);
  }
}
