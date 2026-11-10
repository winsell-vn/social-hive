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
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { PostsService } from "../services/posts.service";
import { RelatedPostsService } from "../services/related-posts.service";
import { ProfilesService } from "../../profiles/services/profiles.service";
import { CreatePostDto } from "../dto/create-post.dto";
import { UpdatePostDto } from "../dto/update-post.dto";
import { GetUserPostsDto } from "../dto/get-posts.dto";
import { GetTrendingPostsDto } from "../dto/get-trending-posts.dto";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../../../common/decorators/current-user.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role, Tier } from "@prisma/client";

@Controller("posts")
@UseGuards(JwtAuthGuard, RolesGuard)
export class PostsController {
  constructor(
    private postsService: PostsService,
    private relatedPostsService: RelatedPostsService,
    @Inject(forwardRef(() => ProfilesService))
    private profilesService: ProfilesService,
  ) {}

  @Post()
  async create(
    @Body() dto: CreatePostDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.postsService.create(
      user.id,
      dto,
      user.tier as Tier,
      user.role as Role,
    );
  }

  @Get()
  @Public()
  async getNewsfeed(@Query() query: PaginationDto) {
    return this.postsService.getNewsfeed(query.page ?? 1, query.limit ?? 20);
  }

  @Public()
  @Get("trending")
  async getTrendingPosts(@Query() dto: GetTrendingPostsDto) {
    return this.postsService.getTrendingPosts(
      dto.timeRange ?? "week",
      dto.page ?? 1,
      dto.limit ?? 10,
    );
  }

  /**
   * Get popular posts by engagement (T-113)
   * GET /api/posts/popular
   */
  @Public()
  @Get("popular")
  async getPopularPosts(@Query("limit") limit?: number) {
    return this.postsService.getPopularPosts(
      limit ? Math.min(Number(limit), 10) : 5,
    );
  }

  @Get("drafts")
  async getDrafts(@CurrentUser() user: CurrentUserData) {
    return this.postsService.getDrafts(user.id);
  }

  @Get("user/:username")
  @Public()
  async getUserPosts(
    @Param("username") username: string,
    @Query() query: GetUserPostsDto,
    @CurrentUser() user: CurrentUserData | null,
  ) {
    // Resolve username to userId to properly compare with viewerId
    const profile = await this.profilesService.getProfile(username);
    const authorId = profile.userId;
    // Pass viewerId to show PENDING posts to the post owner
    return this.postsService.getUserPosts(
      authorId,
      query.page ?? 1,
      query.limit ?? 20,
      query.status,
      user?.id,
    );
  }

  @Get("by-slug/:username/:slug")
  @Public()
  async findBySlug(
    @Param("username") username: string,
    @Param("slug") slug: string,
    @CurrentUser() user: CurrentUserData | null,
  ) {
    // Resolve username to userId
    const profile = await this.profilesService.getProfile(username);
    return this.postsService.findBySlug(profile.userId, slug, user?.id);
  }

  /**
   * Get related posts for a given post (AC-010, T-023)
   * Returns 3-6 posts based on shared hashtags, same author, and recency.
   * Public endpoint for SEO - no auth required.
   */
  @Public()
  @Get(":id/related")
  async getRelatedPosts(
    @Param("id") id: string,
    @Query("limit") limit?: number,
  ) {
    const posts = await this.relatedPostsService.getRelatedPosts(
      id,
      limit ? Math.min(Math.max(1, limit), 10) : 6,
    );
    return { data: posts };
  }

  @Get(":id")
  @Public()
  async findOne(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserData | null,
  ) {
    return this.postsService.findById(id, user?.id);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdatePostDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.postsService.update(id, user.id, dto, user.role as Role);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string, @CurrentUser() user: CurrentUserData) {
    await this.postsService.delete(id, user.id, user.role as Role);
  }

  @Post(":id/submit")
  async submitDraft(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.postsService.submitDraft(
      id,
      user.id,
      user.tier as Tier,
      user.role as Role,
    );
  }

  @Post(":id/share")
  @UseGuards(JwtAuthGuard)
  async sharePost(
    @Param("id") id: string,
    @Body() dto: { content?: string },
    @CurrentUser() user: CurrentUserData,
  ) {
    const post = await this.postsService.sharePost(
      user.id,
      id,
      dto.content || "",
      user.tier as Tier,
      user.role as Role,
    );
    return { data: post };
  }
}
