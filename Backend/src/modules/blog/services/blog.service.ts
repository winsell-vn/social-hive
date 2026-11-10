import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import { BLOG_CACHE_KEYS, BLOG_CACHE_TTL } from "../../../redis/cache-keys";
import { Prisma, BlogPostStatus, BlogPostType } from "@prisma/client";
import { CreateBlogPostDto } from "../dto/create-blog-post.dto";
import { UpdateBlogPostDto } from "../dto/update-blog-post.dto";
import { BlogQueryDto } from "../dto/blog-query.dto";
import { PaginatedResult } from "../../../common/dto/pagination.dto";
import {
  generateSlug,
  generateUniqueSlug,
} from "../../../common/utils/slug.util";

@Injectable()
export class BlogService {
  private readonly logger = new Logger(BlogService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Find all blog posts with pagination and filters
   */
  async findAll(query: BlogQueryDto) {
    const {
      page = 1,
      limit = 20,
      categorySlug,
      status,
      postType,
      authorId,
    } = query;
    const cacheKey = BLOG_CACHE_KEYS.LIST(page, limit, categorySlug);

    // For public queries, only show published posts
    const effectiveStatus = status || BlogPostStatus.PUBLISHED;

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const where: Prisma.BlogPostWhereInput = {
          status: effectiveStatus,
        };

        if (categorySlug) {
          where.category = { slug: categorySlug };
        }

        if (postType) {
          where.postType = postType;
        }

        if (authorId) {
          where.authorId = authorId;
        }

        const [posts, total] = await Promise.all([
          this.prisma.blogPost.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { publishedAt: "desc" },
            include: {
              category: {
                select: { id: true, name: true, slug: true },
              },
              author: {
                select: {
                  id: true,
                  profile: {
                    select: {
                      username: true,
                      displayName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          }),
          this.prisma.blogPost.count({ where }),
        ]);

        // Transform author data to flatten profile.username to author.username
        const transformedPosts = posts.map((post) => ({
          ...post,
          author: this.transformAuthorData(post.author, false),
        }));

        return new PaginatedResult(transformedPosts, page, limit, total);
      },
      BLOG_CACHE_TTL.LIST,
    );
  }

  /**
   * Find a single blog post by slug
   */
  async findBySlug(slug: string) {
    const cacheKey = BLOG_CACHE_KEYS.POST(slug);

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const post = await this.prisma.blogPost.findUnique({
          where: { slug },
          include: {
            category: true,
            author: {
              select: {
                id: true,
                profile: {
                  select: {
                    username: true,
                    displayName: true,
                    avatar: true,
                    bio: true,
                    jobTitle: true,
                    company: true,
                    expertise: true,
                    socialLinks: true,
                    isVerifiedExpert: true,
                  },
                },
              },
            },
          },
        });

        if (!post) {
          throw new NotFoundException("Bài viết không tồn tại");
        }

        // Transform author data to flatten profile fields to author level
        const transformedPost = {
          ...post,
          author: this.transformAuthorData(post.author, true),
        };

        return transformedPost;
      },
      BLOG_CACHE_TTL.POST,
    );
  }

  /**
   * Find posts by category slug
   */
  async findByCategory(categorySlug: string, page = 1, limit = 20) {
    const query = new BlogQueryDto();
    query.page = page;
    query.limit = limit;
    query.categorySlug = categorySlug;
    query.status = BlogPostStatus.PUBLISHED;
    return this.findAll(query);
  }

  /**
   * Get all categories with post counts
   */
  async getCategories() {
    const cacheKey = BLOG_CACHE_KEYS.CATEGORIES();

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        return this.prisma.blogCategory.findMany({
          orderBy: { displayOrder: "asc" },
          include: {
            parent: {
              select: { id: true, name: true, slug: true },
            },
            children: {
              select: { id: true, name: true, slug: true },
            },
          },
        });
      },
      BLOG_CACHE_TTL.CATEGORIES,
    );
  }

  /**
   * Create a new blog post
   */
  async create(authorId: string, dto: CreateBlogPostDto) {
    this.logger.log(`Creating blog post for author ${authorId}`);

    // Verify category exists
    const category = await this.prisma.blogCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new BadRequestException("Danh mục không tồn tại");
    }

    // Generate slug from title with retry for race conditions
    let post: any;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const baseSlug = generateSlug(dto.title);
        const slug = await generateUniqueSlug(baseSlug, async (s) => {
          const existing = await this.prisma.blogPost.findUnique({
            where: { slug: s },
          });
          return !!existing;
        });

        // Calculate reading time (approx 200 words per minute + 12 seconds per image)
        const wordCount = dto.content.split(/\s+/).length;
        const imageCount = (dto.content.match(/<img[^>]*>/gi) || []).length + (dto.featuredImage ? 1 : 0);
        const readingMinutes = Math.ceil(wordCount / 200);
        const imageMinutes = Math.ceil((imageCount * 12) / 60);
        const readingTime = readingMinutes + imageMinutes;

        // Prepare data
        const postData: Prisma.BlogPostCreateInput = {
          title: dto.title,
          slug,
          content: dto.content,
          excerpt: dto.excerpt,
          featuredImage: dto.featuredImage,
          category: { connect: { id: dto.categoryId } },
          author: { connect: { id: authorId } },
          postType: dto.postType || BlogPostType.ARTICLE,
          status: dto.status || BlogPostStatus.DRAFT,
          readingTime,
          metaTitle: dto.metaTitle || dto.title.substring(0, 70),
          metaDescription: dto.metaDescription || dto.excerpt?.substring(0, 160),
          tags:
            dto.tags && dto.tags.length > 0 ? JSON.stringify(dto.tags) : undefined,
          takeaways:
            dto.takeaways && dto.takeaways.length > 0 ? dto.takeaways : undefined,
          publishedAt:
            dto.status === BlogPostStatus.PUBLISHED ? new Date() : undefined,
        };

        post = await this.prisma.blogPost.create({
          data: postData,
          include: {
            category: true,
            author: {
              select: {
                id: true,
                profile: {
                  select: {
                    username: true,
                    displayName: true,
                    avatar: true,
                  },
                },
              },
            },
          },
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

    // Update category post count
    await this.prisma.blogCategory.update({
      where: { id: dto.categoryId },
      data: { postCount: { increment: 1 } },
    });

    // Invalidate list cache
    await this.invalidateListCache();

    this.logger.log(`Blog post ${post.id} created with slug: ${post.slug}`);

    // Transform author data before returning
    return {
      ...post,
      author: this.transformAuthorData(post.author, false),
    };
  }

  /**
   * Update a blog post
   */
  async update(id: string, dto: UpdateBlogPostDto) {
    this.logger.log(`Updating blog post ${id}`);

    const existingPost = await this.prisma.blogPost.findUnique({
      where: { id },
    });

    if (!existingPost) {
      throw new NotFoundException("Bài viết không tồn tại");
    }

    // If category is changing, verify new category exists
    if (dto.categoryId && dto.categoryId !== existingPost.categoryId) {
      const category = await this.prisma.blogCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new BadRequestException("Danh mục không tồn tại");
      }
    }

    const updateData: Prisma.BlogPostUpdateInput = {};

    // Copy allowed fields from dto
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.excerpt !== undefined) updateData.excerpt = dto.excerpt;
    if (dto.featuredImage !== undefined)
      updateData.featuredImage = dto.featuredImage;
    if (dto.postType !== undefined) updateData.postType = dto.postType;
    if (dto.metaTitle !== undefined) updateData.metaTitle = dto.metaTitle;
    if (dto.metaDescription !== undefined)
      updateData.metaDescription = dto.metaDescription;
    if (dto.categoryId !== undefined)
      updateData.category = { connect: { id: dto.categoryId } };

    // Handle tags
    if (dto.tags !== undefined) {
      updateData.tags = dto.tags.length > 0 ? JSON.stringify(dto.tags) : null;
    }

    // Handle takeaways - use Prisma.JsonNull for null values
    if (dto.takeaways !== undefined) {
      updateData.takeaways =
        dto.takeaways.length > 0 ? dto.takeaways : Prisma.JsonNull;
    }

    // Recalculate reading time if content changed (approx 200 words per minute + 12 seconds per image)
    if (dto.content) {
      updateData.content = dto.content;
      const wordCount = dto.content.split(/\s+/).length;
      const featuredImage = dto.featuredImage !== undefined ? dto.featuredImage : existingPost.featuredImage;
      const imageCount = (dto.content.match(/<img[^>]*>/gi) || []).length + (featuredImage ? 1 : 0);
      const readingMinutes = Math.ceil(wordCount / 200);
      const imageMinutes = Math.ceil((imageCount * 12) / 60);
      updateData.readingTime = readingMinutes + imageMinutes;
    }

    // Handle status change
    if (dto.status !== undefined) {
      updateData.status = dto.status;
      // Set publishedAt if status is changing to PUBLISHED
      if (
        dto.status === BlogPostStatus.PUBLISHED &&
        existingPost.status !== BlogPostStatus.PUBLISHED
      ) {
        updateData.publishedAt = new Date();
      }
    }

    const post = await this.prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        author: {
          select: {
            id: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Update category post counts if category changed
    if (dto.categoryId && dto.categoryId !== existingPost.categoryId) {
      await Promise.all([
        this.prisma.blogCategory.update({
          where: { id: existingPost.categoryId },
          data: { postCount: { decrement: 1 } },
        }),
        this.prisma.blogCategory.update({
          where: { id: dto.categoryId },
          data: { postCount: { increment: 1 } },
        }),
      ]);
    }

    // Invalidate caches
    await this.redisService.del(BLOG_CACHE_KEYS.POST(existingPost.slug));
    await this.invalidateListCache();

    this.logger.log(`Blog post ${id} updated`);
    return {
      ...post,
      author: this.transformAuthorData(post.author, false),
    };
  }

  /**
   * Delete (archive) a blog post
   */
  async delete(id: string) {
    this.logger.log(`Archiving blog post ${id}`);

    const post = await this.prisma.blogPost.findUnique({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException("Bài viết không tồn tại");
    }

    // Soft delete by setting status to ARCHIVED
    await this.prisma.blogPost.update({
      where: { id },
      data: { status: BlogPostStatus.ARCHIVED },
    });

    // Decrement category post count
    await this.prisma.blogCategory.update({
      where: { id: post.categoryId },
      data: { postCount: { decrement: 1 } },
    });

    // Invalidate caches
    await this.redisService.del(BLOG_CACHE_KEYS.POST(post.slug));
    await this.invalidateListCache();

    this.logger.log(`Blog post ${id} archived`);
  }

  /**
   * Increment view count for a blog post
   */
  async incrementViewCount(slug: string) {
    const post = await this.prisma.blogPost.findUnique({
      where: { slug },
    });

    if (!post) {
      throw new NotFoundException("Bài viết không tồn tại");
    }

    await this.prisma.blogPost.update({
      where: { slug },
      data: { viewCount: { increment: 1 } },
    });

    return { success: true };
  }

  /**
   * Invalidate blog list cache
   */
  async invalidateListCache() {
    await this.redisService.delPattern("blog:list:*");
    await this.redisService.del(BLOG_CACHE_KEYS.CATEGORIES());
  }

  /**
   * Get blog posts by topic/tag (T-111)
   * Returns paginated blog posts that contain the specified tag
   */
  async getPostsByTopic(topic: string, page = 1, limit = 12) {
    const cacheKey = BLOG_CACHE_KEYS.BY_TOPIC(topic, page, limit);

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        // Search for posts where tags JSON array contains the topic
        // Using Prisma's string_contains for JSON string search
        // Note: MySQL doesn't support case-insensitive mode, so we search as-is
        const where: Prisma.BlogPostWhereInput = {
          status: BlogPostStatus.PUBLISHED,
          tags: {
            contains: topic,
          },
        };

        const [posts, total] = await Promise.all([
          this.prisma.blogPost.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { publishedAt: "desc" },
            include: {
              category: {
                select: { id: true, name: true, slug: true },
              },
              author: {
                select: {
                  id: true,
                  profile: {
                    select: {
                      username: true,
                      displayName: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          }),
          this.prisma.blogPost.count({ where }),
        ]);

        // Transform author data to flatten profile.username to author.username
        const transformedPosts = posts.map((post) => ({
          ...post,
          author: this.transformAuthorData(post.author, false),
        }));

        return new PaginatedResult(transformedPosts, page, limit, total);
      },
      BLOG_CACHE_TTL.BY_TOPIC,
    );
  }

  // ==================== Post-to-Blog Sync Methods ====================

  /**
   * Find a blog post by its source post ID
   */
  async findBySourcePostId(sourcePostId: string) {
    return this.prisma.blogPost.findUnique({
      where: { sourcePostId },
    });
  }

  /**
   * Create a blog post from a social post (for Admin/Super_Admin sync)
   * Uses upsert pattern to handle race conditions safely
   */
  async createFromPost(data: {
    sourcePostId: string;
    authorId: string;
    title: string;
    content: string;
    excerpt?: string;
    featuredImage?: string;
    categoryId: string;
    tags?: string[];
    status: BlogPostStatus;
    publishedAt?: Date;
  }) {
    // Check if blog post already exists for this source post (race condition guard)
    const existing = await this.findBySourcePostId(data.sourcePostId);
    if (existing) {
      this.logger.debug(
        `Blog post already exists for source post ${data.sourcePostId}, skipping create`,
      );
      return existing;
    }

    this.logger.log(`Creating blog post from source post ${data.sourcePostId}`);

    // Generate unique slug from title with retry for race conditions
    let blogPost: any;
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const baseSlug = generateSlug(data.title);
        const slug = await generateUniqueSlug(baseSlug, async (s) => {
          const existing = await this.prisma.blogPost.findUnique({
            where: { slug: s },
          });
          return !!existing;
        });

        // Calculate reading time (approx 200 words per minute + 12 seconds per image)
        const wordCount = data.content.split(/\s+/).length;
        const imageCount = (data.content.match(/<img[^>]*>/gi) || []).length + (data.featuredImage ? 1 : 0);
        const readingMinutes = Math.ceil(wordCount / 200);
        const imageMinutes = Math.ceil((imageCount * 12) / 60);
        const readingTime = readingMinutes + imageMinutes;

        blogPost = await this.prisma.blogPost.create({
          data: {
            sourcePostId: data.sourcePostId,
            title: data.title,
            slug,
            content: data.content,
            excerpt: data.excerpt,
            featuredImage: data.featuredImage,
            categoryId: data.categoryId,
            authorId: data.authorId,
            status: data.status,
            postType: "ARTICLE",
            readingTime,
            tags:
              data.tags && data.tags.length > 0 ? JSON.stringify(data.tags) : null,
            metaTitle: data.title.substring(0, 70),
            metaDescription: data.excerpt?.substring(0, 160),
            publishedAt: data.publishedAt,
          },
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

    // Update category post count
    await this.prisma.blogCategory.update({
      where: { id: data.categoryId },
      data: { postCount: { increment: 1 } },
    });

    // Invalidate list cache
    await this.invalidateListCache();

    this.logger.log(
      `Blog post ${blogPost.id} created from source post ${data.sourcePostId}`,
    );
    return blogPost;
  }

  /**
   * Update a blog post from its source post
   */
  async updateFromPost(
    sourcePostId: string,
    data: {
      title?: string;
      content?: string;
      excerpt?: string;
      featuredImage?: string;
      tags?: string[];
      status?: BlogPostStatus;
      publishedAt?: Date;
    },
  ) {
    const existing = await this.findBySourcePostId(sourcePostId);
    if (!existing) return null;

    this.logger.log(
      `Updating blog post ${existing.id} from source post ${sourcePostId}`,
    );

    const updateData: Partial<{
      title: string;
      metaTitle: string;
      content: string;
      readingTime: number;
      excerpt: string;
      metaDescription: string;
      featuredImage: string | null;
      tags: string | null;
      status: BlogPostStatus;
      publishedAt: Date;
    }> = {};

    if (data.title) {
      updateData.title = data.title;
      updateData.metaTitle = data.title.substring(0, 70);
    }
    if (data.content) {
      updateData.content = data.content;
      const wordCount = data.content.split(/\s+/).length;
      const featuredImage = data.featuredImage !== undefined ? data.featuredImage : existing.featuredImage;
      const imageCount = (data.content.match(/<img[^>]*>/gi) || []).length + (featuredImage ? 1 : 0);
      const readingMinutes = Math.ceil(wordCount / 200);
      const imageMinutes = Math.ceil((imageCount * 12) / 60);
      updateData.readingTime = readingMinutes + imageMinutes;
    }
    if (data.excerpt) {
      updateData.excerpt = data.excerpt;
      updateData.metaDescription = data.excerpt.substring(0, 160);
    }
    if (data.featuredImage !== undefined) {
      updateData.featuredImage = data.featuredImage;
    }
    if (data.tags) {
      updateData.tags = data.tags.length > 0 ? JSON.stringify(data.tags) : null;
    }
    if (data.status) {
      updateData.status = data.status;
      if (data.status === BlogPostStatus.PUBLISHED && !existing.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }
    if (data.publishedAt) {
      updateData.publishedAt = data.publishedAt;
    }

    const updated = await this.prisma.blogPost.update({
      where: { id: existing.id },
      data: updateData,
    });

    // Invalidate caches
    await this.redisService.del(BLOG_CACHE_KEYS.POST(existing.slug));
    await this.invalidateListCache();

    this.logger.log(
      `Blog post ${existing.id} updated from source post ${sourcePostId}`,
    );
    return updated;
  }

  /**
   * Archive a blog post when its source post is deleted
   */
  async archiveBySourcePostId(sourcePostId: string) {
    const existing = await this.findBySourcePostId(sourcePostId);
    if (!existing) return;

    this.logger.log(
      `Archiving blog post ${existing.id} from source post ${sourcePostId}`,
    );

    await this.prisma.blogPost.update({
      where: { id: existing.id },
      data: { status: BlogPostStatus.ARCHIVED },
    });

    // Decrement category post count
    await this.prisma.blogCategory.update({
      where: { id: existing.categoryId },
      data: { postCount: { decrement: 1 } },
    });

    // Invalidate caches
    await this.redisService.del(BLOG_CACHE_KEYS.POST(existing.slug));
    await this.invalidateListCache();

    this.logger.log(`Blog post ${existing.id} archived`);
  }

  /**
   * Get or create the default category for synced posts
   * Uses upsert to handle race conditions safely
   */
  async getOrCreateDefaultCategory(): Promise<string> {
    const slug = "bai-viet-cong-dong";
    const category = await this.prisma.blogCategory.upsert({
      where: { slug },
      update: {}, // No update needed if exists
      create: {
        name: "Bài viết cộng đồng",
        slug,
        description: "Bài viết từ cộng đồng admin",
        displayOrder: 99,
        postCount: 0,
      },
    });

    return category.id;
  }

  /**
   * Transform author data to flatten profile fields to author level
   * @param author - Author object with nested profile
   * @param includeFullProfile - Whether to include full profile fields (bio, jobTitle, etc.)
   */
  private transformAuthorData(
    author: any,
    includeFullProfile: boolean = false,
  ) {
    const baseData = {
      id: author.id,
      username: author.profile?.username || "",
      displayName: author.profile?.displayName || null,
      avatar: author.profile?.avatar || null,
    };

    if (includeFullProfile) {
      return {
        ...baseData,
        bio: author.profile?.bio || null,
        jobTitle: author.profile?.jobTitle || null,
        company: author.profile?.company || null,
        expertise: author.profile?.expertise || null,
        socialLinks: author.profile?.socialLinks || null,
        isVerifiedExpert: author.profile?.isVerifiedExpert || false,
      };
    }

    return {
      ...baseData,
      bio: null,
    };
  }
}
