import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { BlogService } from "../services/blog.service";
import { CreateBlogPostDto, UpdateBlogPostDto, BlogQueryDto } from "../dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import {
  CurrentUser,
  CurrentUserData,
} from "../../../common/decorators/current-user.decorator";
import { Role } from "@prisma/client";

@Controller("blog")
@UseGuards(JwtAuthGuard, RolesGuard)
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  // ==================== Public Endpoints ====================

  /**
   * Get paginated list of published blog posts
   * GET /api/blog/posts
   */
  @Get("posts")
  @Public()
  async findAll(@Query() query: BlogQueryDto) {
    return this.blogService.findAll(query);
  }

  /**
   * Get a single blog post by slug
   * GET /api/blog/posts/:slug
   */
  @Get("posts/:slug")
  @Public()
  async findBySlug(@Param("slug") slug: string) {
    return this.blogService.findBySlug(slug);
  }

  /**
   * Get all blog categories
   * GET /api/blog/categories
   */
  @Get("categories")
  @Public()
  async getCategories() {
    return this.blogService.getCategories();
  }

  /**
   * Get blog posts by topic/tag (T-111)
   * GET /api/blog/posts/by-topic/:topic
   */
  @Get("posts/by-topic/:topic")
  @Public()
  async getPostsByTopic(
    @Param("topic") topic: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.blogService.getPostsByTopic(
      topic,
      page ? Number(page) : 1,
      limit ? Math.min(Number(limit), 50) : 12,
    );
  }

  /**
   * Increment view count for a blog post
   * POST /api/blog/posts/:slug/view
   */
  @Post("posts/:slug/view")
  @Public()
  async incrementViewCount(@Param("slug") slug: string) {
    return this.blogService.incrementViewCount(slug);
  }

  // ==================== Admin Endpoints ====================

  /**
   * Create a new blog post (Admin only)
   * POST /api/blog/posts
   */
  @Post("posts")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async create(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateBlogPostDto,
  ) {
    return this.blogService.create(user.id, dto);
  }

  /**
   * Update a blog post (Admin only)
   * PATCH /api/blog/posts/:id
   */
  @Patch("posts/:id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async update(@Param("id") id: string, @Body() dto: UpdateBlogPostDto) {
    return this.blogService.update(id, dto);
  }

  /**
   * Delete (archive) a blog post (Admin only)
   * DELETE /api/blog/posts/:id
   */
  @Delete("posts/:id")
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async delete(@Param("id") id: string) {
    return this.blogService.delete(id);
  }
}
