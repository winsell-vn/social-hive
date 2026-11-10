import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { PricingService } from "../services/pricing.service";
import { CreateQuoteDto, UpdateQuoteStatusDto } from "../dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { Role } from "@prisma/client";

@Controller("pricing/quotes")
export class QuoteController {
  constructor(private readonly pricingService: PricingService) {}

  // ==================== Public Endpoint ====================

  /**
   * Submit a quote request (Public with rate limiting)
   * POST /api/pricing/quotes/submit
   * Rate limit: 5 requests per hour per IP
   */
  @Post("submit")
  @Public()
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 per hour (3600000ms = 1 hour)
  async submitQuote(@Body() dto: CreateQuoteDto) {
    return this.pricingService.submitQuote(dto);
  }

  // ==================== Admin Endpoints ====================

  /**
   * Export quotes to CSV (Admin)
   * GET /api/pricing/quotes/export?status=PENDING&startDate=2024-01-01&endDate=2024-12-31
   * Note: This route must be defined BEFORE the :id route to avoid conflicts
   */
  @Get("export")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async exportQuotes(
    @Res() res: Response,
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
  ) {
    const csv = await this.pricingService.exportQuotesToCsv({
      status,
      startDate,
      endDate,
    });
    const filename = `quotes-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }

  /**
   * Get all quote requests (Admin)
   * GET /api/pricing/quotes?status=PENDING&startDate=2024-01-01&endDate=2024-12-31&page=1&limit=20
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getAllQuotes(
    @Query("status") status?: string,
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    const result = await this.pricingService.getAllQuotes({
      status,
      startDate,
      endDate,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
    return { data: result };
  }

  /**
   * Get quote by ID (Admin)
   * GET /api/pricing/quotes/:id
   */
  @Get(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async getQuoteById(@Param("id") id: string) {
    const quote = await this.pricingService.getQuoteById(id);
    return { data: quote };
  }

  /**
   * Update quote status (Admin)
   * PATCH /api/pricing/quotes/:id/status
   */
  @Patch(":id/status")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async updateQuoteStatus(
    @Param("id") id: string,
    @Body() dto: UpdateQuoteStatusDto,
  ) {
    const quote = await this.pricingService.updateQuoteStatus(id, dto);
    return { data: quote };
  }

  /**
   * Delete quote (Admin)
   * DELETE /api/pricing/quotes/:id
   */
  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async deleteQuote(@Param("id") id: string) {
    return this.pricingService.deleteQuote(id);
  }
}
