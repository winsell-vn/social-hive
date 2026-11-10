import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PostsRepository } from "../repositories/posts.repository";
import { HashtagsService } from "../../hashtags/services/hashtags.service";
import { BlogService } from "../../blog/services/blog.service";
import { UploadService } from "../../upload/services/upload.service";
import { RedisService } from "../../../redis/redis.service";
import { CacheInvalidationService } from "../../../redis/cache-invalidation.service";
import {
  CACHE_KEYS,
  CACHE_TTL,
  POPULAR_POSTS_CACHE_KEYS,
  POPULAR_POSTS_CACHE_TTL,
} from "../../../redis/cache-keys";
import { CreatePostDto } from "../dto/create-post.dto";
import { UpdatePostDto } from "../dto/update-post.dto";
import { PostStatus, Tier, Role, BlogPostStatus } from "@prisma/client";
import { PaginatedResult } from "../../../common/dto/pagination.dto";
import {
  generateSlug,
  generateUniqueSlug,
} from "../../../common/utils/slug.util";
import { PrismaService } from "../../../prisma/prisma.service";

@Injectable()
export class PostsService {
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private postsRepository: PostsRepository,
    private hashtagsService: HashtagsService,
    private redisService: RedisService,
    private readonly cacheInvalidationService: CacheInvalidationService,
    private readonly configService: ConfigService,
    private readonly blogService: BlogService,
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  async create(
    authorId: string,
    dto: CreatePostDto,
    authorTier: Tier,
    authorRole?: Role,
  ) {
    this.logger.log(`Creating post for user ${authorId}`);

    // Validate max 10 images per post (AC-044)
    if (dto.images && dto.images.length > 10) {
      throw new BadRequestException("Tối đa 10 ảnh mỗi bài viết");
    }

    // Determine initial status based on role, tier and draft flag
    const status = this.determinePostStatus(
      dto.isDraft || false,
      authorRole,
      authorTier,
    );

    // Generate SEO-friendly slug from content with retry for race conditions
    let post: any;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const baseSlug = generateSlug(dto.content);
        const slug = await generateUniqueSlug(baseSlug, async (s) =>
          this.postsRepository.slugExists(authorId, s),
        );

        post = await this.postsRepository.create({
          content: dto.content,
          images: dto.images ? JSON.stringify(dto.images) : null,
          slug,
          status,
          publishAt: status === PostStatus.PUBLISHED ? new Date() : null,
          author: { connect: { id: authorId } },
        });
        break; // Success, exit loop
      } catch (error) {
        attempts++;
        if (error?.code === 'P2002' && attempts < maxAttempts) {
          this.logger.warn(`Slug collision detected, retrying (attempt ${attempts}/${maxAttempts})`);
          continue;
        }
        throw error; // Re-throw if not P2002 or max attempts reached
      }
    }

    // Extract and link hashtags from content
    const extractedHashtags = this.extractHashtags(dto.content);
    const allHashtags = [
      ...new Set([...(dto.hashtags || []), ...extractedHashtags]),
    ];

    if (allHashtags.length > 0) {
      await this.hashtagsService.linkHashtagsToPost(post.id, allHashtags);
    }

    // Get the created post with author info for cache invalidation
    const createdPost = await this.postsRepository.findByIdWithAuthor(post.id);

    // Invalidate newsfeed cache using CacheInvalidationService
    if (createdPost?.author?.profile?.username) {
      await this.cacheInvalidationService.onPostCreated(
        createdPost.author.profile.username,
      );
    }

    // Sync to blog for Admin/Super_Admin users
    if (authorRole) {
      await this.syncPostToBlog(createdPost, "create", authorRole, allHashtags);
    }

    this.logger.log(
      `Post ${post.id} created with status ${status}, slug: ${post.slug}`,
    );
    return createdPost;
  }

  async findById(id: string, viewerId?: string) {
    const cacheKey = CACHE_KEYS.POST(id);

    const post = await this.redisService.getOrSet(
      cacheKey,
      async () => {
        const fetchedPost = await this.postsRepository.findByIdWithAuthor(id);
        if (!fetchedPost) {
          throw new NotFoundException("Bài viết không tồn tại");
        }
        return fetchedPost;
      },
      CACHE_TTL.POST,
    );

    // Increment view count (could be optimized with Redis)
    if (viewerId && viewerId !== post.authorId) {
      await this.postsRepository.incrementViewCount(id);
    }

    return post;
  }

  async findBySlug(authorId: string, slug: string, viewerId?: string) {
    const post = await this.postsRepository.findBySlugWithAuthor(
      authorId,
      slug,
    );
    if (!post) {
      throw new NotFoundException("Bài viết không tồn tại");
    }

    // Increment view count (could be optimized with Redis)
    if (viewerId && viewerId !== post.authorId) {
      await this.postsRepository.incrementViewCount(post.id);
    }

    return post;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdatePostDto,
    userRole?: Role,
  ) {
    const post = await this.postsRepository.findById(id);
    if (!post) {
      throw new NotFoundException("Bài viết không tồn tại");
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException("Bạn không có quyền chỉnh sửa bài viết này");
    }

    const updated = await this.postsRepository.update(id, {
      content: dto.content,
      images: dto.images ? JSON.stringify(dto.images) : undefined,
    });

    // Update hashtags if content changed
    const extractedHashtags = this.extractHashtags(dto.content || post.content);
    const allHashtags = [
      ...new Set([...(dto.hashtags || []), ...extractedHashtags]),
    ];
    if (dto.content || dto.hashtags) {
      await this.hashtagsService.updatePostHashtags(id, allHashtags);
    }

    // Invalidate caches using CacheInvalidationService
    await this.cacheInvalidationService.onPostUpdated();
    // Also invalidate the specific post cache
    await this.redisService.del(CACHE_KEYS.POST(id));

    const updatedPost = await this.postsRepository.findByIdWithAuthor(
      updated.id,
    );

    // Sync to blog for Admin/Super_Admin users
    if (userRole) {
      await this.syncPostToBlog(updatedPost, "update", userRole, allHashtags);
    }

    return updatedPost;
  }

  async delete(id: string, userId: string, userRole?: Role) {
    // Get post with author info for cache invalidation before deletion
    const postWithAuthor = await this.postsRepository.findByIdWithAuthor(id);
    if (!postWithAuthor) {
      throw new NotFoundException("Bài viết không tồn tại");
    }

    const isAdmin = userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
    if (postWithAuthor.authorId !== userId && !isAdmin) {
      throw new ForbiddenException("Bạn không có quyền xóa bài viết này");
    }

    // Archive blog post before deleting the source post (for Admin/Super_Admin)
    if (userRole) {
      await this.syncPostToBlog(postWithAuthor, "delete", userRole);
    }

    // Cleanup associated images (AC-046) - best effort, don't block post deletion
    await this.cleanupPostImages(postWithAuthor.images, userId);

    await this.postsRepository.delete(id);

    // Invalidate caches using CacheInvalidationService
    const authorUsername = postWithAuthor.author?.profile?.username || "";
    await this.cacheInvalidationService.onPostDeleted(id, authorUsername);

    this.logger.log(`Post ${id} deleted by user ${userId}`);
  }

  async getNewsfeed(page: number, limit: number) {
    const cacheKey = CACHE_KEYS.NEWSFEED(page, limit);

    // Get max AI post ratio from config (AC-083)
    const maxAiRatio = this.configService.get<number>(
      "newsfeed.maxAiPostRatio",
      0.25,
    );

    try {
      return await this.redisService.getOrSet(
        cacheKey,
        async () => {
          // Use AI-capped query to ensure AI posts don't exceed configured ratio (AC-081, AC-082, AC-084, AC-085)
          const { posts, total } =
            await this.postsRepository.findPublishedPostsWithAiCap({
              skip: (page - 1) * limit,
              take: limit,
              maxAiRatio,
            });
          return new PaginatedResult(posts, page, limit, total);
        },
        CACHE_TTL.NEWSFEED,
      );
    } catch (error) {
      // Log the error and fallback to direct DB query without caching
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Newsfeed cache error, falling back to DB: ${message}`,
        stack,
      );

      try {
        // Direct DB query as fallback
        const { posts, total } =
          await this.postsRepository.findPublishedPostsWithAiCap({
            skip: (page - 1) * limit,
            take: limit,
            maxAiRatio,
          });
        return new PaginatedResult(posts, page, limit, total);
      } catch (dbError) {
        const dbMessage =
          dbError instanceof Error ? dbError.message : String(dbError);
        const dbStack = dbError instanceof Error ? dbError.stack : undefined;
        this.logger.error(`Newsfeed DB fallback also failed: ${dbMessage}`, dbStack);
        // Graceful degradation: return empty feed rather than 500 error.
        // Error is already logged above for server-side monitoring.
        // Frontend should handle empty feed state with appropriate messaging.
        return new PaginatedResult([], page, limit, 0);
      }
    }
  }

  async getUserPosts(
    authorId: string,
    page: number,
    limit: number,
    status?: PostStatus,
    viewerId?: string,
  ) {
    const { posts, total } = await this.postsRepository.findByAuthorId(
      authorId,
      {
        skip: (page - 1) * limit,
        take: limit,
        status,
        viewerId,
      },
    );

    return new PaginatedResult(posts, page, limit, total);
  }

  async getDrafts(userId: string) {
    return this.postsRepository.findDraftsByAuthorId(userId);
  }

  async submitDraft(
    id: string,
    userId: string,
    userTier: Tier,
    userRole?: Role,
  ) {
    const post = await this.postsRepository.findById(id);
    if (!post) {
      throw new NotFoundException("Bài viết không tồn tại");
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException("Bạn không có quyền gửi bài viết này");
    }

    if (post.status !== PostStatus.DRAFT) {
      throw new ForbiddenException("Bài viết này không phải là bản nháp");
    }

    // Admin, Super_Admin, and Legend tier get auto-published
    const newStatus = this.determinePostStatus(false, userRole, userTier);
    const publishAt = newStatus === PostStatus.PUBLISHED ? new Date() : null;

    const updatedPost = await this.postsRepository.update(id, {
      status: newStatus,
      publishAt,
    });

    // Sync to blog for Admin/Super_Admin users
    if (userRole) {
      const postWithAuthor = await this.postsRepository.findByIdWithAuthor(id);
      const hashtags = await this.getHashtagNames(id);
      await this.syncPostToBlog(postWithAuthor, "update", userRole, hashtags);
    }

    return updatedPost;
  }

  private extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w\u00C0-\u024F]+/g;
    const matches = content.match(hashtagRegex) || [];
    return matches.map((tag) => tag.slice(1).toLowerCase()).slice(0, 30);
  }

  /**
   * Cleanup post images when a post is deleted (AC-046)
   * Best effort - doesn't block post deletion on failure
   */
  private async cleanupPostImages(
    imagesJson: string | null,
    userId: string,
  ): Promise<void> {
    if (!imagesJson) return;

    try {
      const imageUrls: string[] = JSON.parse(imagesJson);
      for (const url of imageUrls) {
        try {
          await this.uploadService.deleteOldProfileImage(url, userId);
        } catch (error) {
          this.logger.warn(
            `Failed to delete post image ${url}: ${error instanceof Error ? error.message : String(error)}`,
          );
        }
      }
    } catch {
      // JSON parse failed - images field is malformed, skip cleanup
      this.logger.warn("Failed to parse post images JSON during cleanup");
    }
  }

  async getTrendingPosts(timeRange: string, page: number, limit: number) {
    const cacheKey = `trending:posts:${timeRange}:${page}:${limit}`;

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const skip = (page - 1) * limit;
        const [posts, total] = await Promise.all([
          this.postsRepository.findTrendingPosts(timeRange, skip, limit),
          this.postsRepository.countTrendingPosts(timeRange),
        ]);
        return new PaginatedResult(posts, page, limit, total);
      },
      CACHE_TTL.TRENDING_POSTS,
    );
  }

  /**
   * Share/repost a post to user's profile (AC-059)
   * Creates a new post that references the original post
   * @param userId - The user sharing the post
   * @param originalPostId - The post being shared
   * @param content - Optional comment/caption for the share
   * @param userTier - User's tier for auto-approval
   * @param userRole - User's role for auto-approval
   */
  async sharePost(
    userId: string,
    originalPostId: string,
    content: string,
    userTier: Tier,
    userRole?: Role,
  ) {
    this.logger.log(`User ${userId} sharing post ${originalPostId}`);

    // Get the original post
    const originalPost = await this.postsRepository.findById(originalPostId);
    if (!originalPost) {
      throw new NotFoundException("Bài viết gốc không tồn tại");
    }

    // Check if original post is published
    if (originalPost.status !== PostStatus.PUBLISHED) {
      throw new ForbiddenException(
        "Không thể chia sẻ bài viết chưa được xuất bản",
      );
    }

    // Prevent sharing own post
    if (originalPost.authorId === userId) {
      throw new ForbiddenException("Không thể chia sẻ bài viết của chính mình");
    }

    // Check if user already shared this post (AC-060)
    const existingShare = await this.postsRepository.findShareByUserAndPost(
      userId,
      originalPostId,
    );
    if (existingShare) {
      this.logger.warn(`User ${userId} already shared post ${originalPostId}`);
      return this.postsRepository.findByIdWithAuthor(existingShare.id);
    }

    // Determine status based on role and tier
    const status = this.determinePostStatus(false, userRole, userTier);

    // Generate slug for the share
    const baseSlug = generateSlug(content || "shared");
    const slug = await generateUniqueSlug(baseSlug, async (s) =>
      this.postsRepository.slugExists(userId, s),
    );

    // Create the share post
    const sharePost = await this.postsRepository.create({
      content: content || "",
      slug,
      status,
      publishAt: status === PostStatus.PUBLISHED ? new Date() : null,
      author: { connect: { id: userId } },
      sharedPost: { connect: { id: originalPostId } },
    });

    // Increment share count on original post
    await this.postsRepository.incrementShareCount(originalPostId);

    // Extract and link hashtags from content
    if (content) {
      const extractedHashtags = this.extractHashtags(content);
      if (extractedHashtags.length > 0) {
        await this.hashtagsService.linkHashtagsToPost(
          sharePost.id,
          extractedHashtags,
        );
      }
    }

    // Invalidate caches
    const createdPost = await this.postsRepository.findByIdWithAuthor(
      sharePost.id,
    );
    if (createdPost?.author?.profile?.username) {
      await this.cacheInvalidationService.onPostCreated(
        createdPost.author.profile.username,
      );
    }

    this.logger.log(
      `Post ${originalPostId} shared as ${sharePost.id} by user ${userId}`,
    );
    return createdPost;
  }

  /**
   * Get popular posts by engagement score (T-113)
   * Engagement score formula: viewCount * 0.3 + likeCount * 0.4 + commentCount * 0.3
   * Uses raw SQL query for proper computed column ordering
   * Results are cached for 1 hour
   */
  async getPopularPosts(limit = 5) {
    const cacheKey = POPULAR_POSTS_CACHE_KEYS.LIST(limit);

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        // Get published posts ordered by real engagement score using raw SQL
        const posts = await this.postsRepository.findPopularPosts(limit);
        return posts;
      },
      POPULAR_POSTS_CACHE_TTL,
    );
  }

  // ==================== Post-to-Blog Sync Helper Methods ====================

  /**
   * Check if user role should trigger blog sync
   */
  private shouldSyncToBlog(userRole: Role): boolean {
    return userRole === Role.ADMIN || userRole === Role.SUPER_ADMIN;
  }

  /**
   * Generate blog title from post content
   */
  private generateBlogTitle(content: string): string {
    // Remove hashtags
    const cleaned = content.replace(/#[\w\u00C0-\u024F]+/g, "").trim();
    // Take first line or first 100 chars
    const firstLine = cleaned.split("\n")[0].trim();
    if (firstLine.length <= 100) return firstLine || "Bài viết từ cộng đồng";
    return firstLine.substring(0, 97) + "...";
  }

  /**
   * Generate blog excerpt from post content
   */
  private generateBlogExcerpt(content: string): string {
    // Strip hashtags and HTML/markdown
    const stripped = content
      .replace(/#[\w\u00C0-\u024F]+/g, "")
      .replace(/<[^>]*>/g, "")
      .replace(/[#*_~`]/g, "")
      .trim();
    if (stripped.length <= 300) return stripped;
    return stripped.substring(0, 297) + "...";
  }

  /**
   * Extract first image URL from post images JSON
   */
  private extractFirstImage(imagesJson: string | null): string | null {
    if (!imagesJson) return null;
    try {
      const images = JSON.parse(imagesJson);
      return Array.isArray(images) && images.length > 0 ? images[0] : null;
    } catch {
      return null;
    }
  }

  /**
   * Map PostStatus to BlogPostStatus
   */
  private mapPostStatusToBlogStatus(
    postStatus: PostStatus,
  ): BlogPostStatus | null {
    switch (postStatus) {
      case PostStatus.DRAFT:
        return BlogPostStatus.DRAFT;
      case PostStatus.PENDING:
        return BlogPostStatus.DRAFT;
      case PostStatus.PUBLISHED:
        return BlogPostStatus.PUBLISHED;
      case PostStatus.APPROVED:
        return BlogPostStatus.PUBLISHED;
      case PostStatus.REJECTED:
        return null; // Don't sync rejected posts
      default:
        return null;
    }
  }

  /**
   * Get hashtag names for a post
   */
  private async getHashtagNames(postId: string): Promise<string[]> {
    const postHashtags = await this.prisma.postHashtag.findMany({
      where: { postId },
      include: { hashtag: true },
    });
    return postHashtags.map((ph) => ph.hashtag.name);
  }

  /**
   * Determine post status based on draft flag, role, and tier
   */
  private determinePostStatus(
    isDraft: boolean,
    role: Role | undefined,
    tier: Tier,
  ): PostStatus {
    if (isDraft) return PostStatus.DRAFT;
    if (role === Role.ADMIN || role === Role.SUPER_ADMIN) {
      this.logger.log(
        `Admin/Super_Admin post auto-published (bypassing moderation)`,
      );
      return PostStatus.PUBLISHED;
    }
    if (tier === Tier.LEGEND) return PostStatus.PUBLISHED;
    return PostStatus.PENDING;
  }

  /**
   * Sync a post to blog (create/update/delete)
   * Only syncs for Admin/Super_Admin users
   */
  private async syncPostToBlog(
    post: {
      id: string;
      authorId?: string;
      content?: string;
      images?: string | null;
      status?: PostStatus;
      publishAt?: Date | null;
    } | null,
    action: "create" | "update" | "delete",
    userRole: Role,
    hashtags?: string[],
  ): Promise<void> {
    // Only sync for admin/super_admin
    if (!this.shouldSyncToBlog(userRole)) return;
    if (!post) return;

    try {
      if (action === "create") {
        if (!post.status || !post.authorId || !post.content) return;
        const blogStatus = this.mapPostStatusToBlogStatus(post.status);
        if (!blogStatus) return; // Don't sync rejected posts

        const categoryId = await this.blogService.getOrCreateDefaultCategory();
        const tags = hashtags || (await this.getHashtagNames(post.id));

        await this.blogService.createFromPost({
          sourcePostId: post.id,
          authorId: post.authorId,
          title: this.generateBlogTitle(post.content),
          content: post.content,
          excerpt: this.generateBlogExcerpt(post.content),
          featuredImage:
            this.extractFirstImage(post.images ?? null) || undefined,
          categoryId,
          tags,
          status: blogStatus,
          publishedAt: post.publishAt || undefined,
        });

        this.logger.log(`Blog post synced from post ${post.id}`);
      } else if (action === "update") {
        if (!post.content) return;
        const blogStatus = post.status
          ? this.mapPostStatusToBlogStatus(post.status)
          : undefined;
        const tags = hashtags || (await this.getHashtagNames(post.id));

        await this.blogService.updateFromPost(post.id, {
          title: this.generateBlogTitle(post.content),
          content: post.content,
          excerpt: this.generateBlogExcerpt(post.content),
          featuredImage:
            this.extractFirstImage(post.images ?? null) || undefined,
          tags,
          status: blogStatus || undefined,
          publishedAt: post.publishAt || undefined,
        });

        this.logger.log(`Blog post updated from post ${post.id}`);
      } else if (action === "delete") {
        await this.blogService.archiveBySourcePostId(post.id);
        this.logger.log(`Blog post archived from post ${post.id}`);
      }
    } catch (error) {
      // Log error but don't fail the original post operation
      const message = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to sync post ${post.id} to blog (action: ${action}): ${message}`,
        stack,
      );
    }
  }
}
