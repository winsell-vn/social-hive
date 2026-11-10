import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, Post, PostStatus } from "@prisma/client";

// Helper to transform post images from JSON string to array
function transformPostImages<T extends { images?: string | null }>(
  post: T,
): T & { images: string[] } {
  if (!post) return post as T & { images: string[] };

  let images: string[] = [];
  if (post.images) {
    try {
      const parsed = JSON.parse(post.images);
      images = Array.isArray(parsed) ? parsed : [];
    } catch {
      images = [];
    }
  }

  return { ...post, images };
}

// Transform array of posts
function transformPostsImages<T extends { images?: string | null }>(
  posts: T[],
): (T & { images: string[] })[] {
  return posts.map(transformPostImages);
}

@Injectable()
export class PostsRepository {
  private readonly logger = new Logger(PostsRepository.name);

  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.PostCreateInput): Promise<Post> {
    return this.prisma.post.create({ data });
  }

  async findById(
    id: string,
    include?: Prisma.PostInclude,
  ): Promise<Post | null> {
    return this.prisma.post.findUnique({
      where: { id },
      include,
    });
  }

  async findByIdWithAuthor(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          include: { profile: true },
        },
        hashtags: {
          include: { hashtag: true },
        },
        sharedPost: {
          include: {
            author: { include: { profile: true } },
            hashtags: { include: { hashtag: true } },
          },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });
    return post ? transformPostImages(post) : null;
  }

  async findBySlugWithAuthor(authorId: string, slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { authorId, slug },
      include: {
        author: {
          include: { profile: true },
        },
        hashtags: {
          include: { hashtag: true },
        },
        _count: {
          select: { comments: true, likes: true },
        },
      },
    });
    return post ? transformPostImages(post) : null;
  }

  async slugExists(authorId: string, slug: string): Promise<boolean> {
    const post = await this.prisma.post.findFirst({
      where: { authorId, slug },
      select: { id: true },
    });
    return !!post;
  }

  async update(id: string, data: Prisma.PostUpdateInput): Promise<Post> {
    return this.prisma.post.update({ where: { id }, data });
  }

  async delete(id: string): Promise<Post> {
    return this.prisma.post.delete({ where: { id } });
  }

  async findByAuthorId(
    authorId: string,
    options: {
      skip: number;
      take: number;
      status?: PostStatus;
      viewerId?: string;
    },
  ) {
    const where: Prisma.PostWhereInput = { authorId };

    if (options.status) {
      // If specific status requested, use it
      where.status = options.status;
    } else {
      // Show PUBLISHED and PENDING posts to everyone (guests, crawlers, other users)
      // This allows SEO crawling and public visibility of all non-draft posts
      // The frontend controls badge visibility (only author sees "Đang chờ duyệt" badge)
      where.status = { in: [PostStatus.PUBLISHED, PostStatus.PENDING] };
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: "desc" },
        include: {
          author: { include: { profile: true } },
          hashtags: { include: { hashtag: true } },
          sharedPost: {
            include: {
              author: { include: { profile: true } },
              hashtags: { include: { hashtag: true } },
            },
          },
          _count: { select: { comments: true, likes: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return { posts: transformPostsImages(posts), total };
  }

  /**
   * Find published posts for newsfeed with smart priority ordering.
   * Priority order (highest to lowest):
   * 1. Admin posts (role = ADMIN or SUPER_ADMIN)
   * 2. Verified/high-tier user posts (tier >= EXPERT)
   * 3. Regular user posts (non-AI)
   * 4. AI-generated posts (isAiAgent = true) - shown as filler content
   *
   * Within each priority level, posts are ordered by createdAt DESC.
   *
   * @deprecated Use findPublishedPostsWithAiCap instead for AI post ratio control
   */
  async findPublishedPosts(options: { skip: number; take: number }) {
    // Delegate to the new method with default 25% AI ratio
    return this.findPublishedPostsWithAiCap({ ...options, maxAiRatio: 0.25 });
  }

  /**
   * Find published posts for newsfeed with AI post frequency control.
   * Implements a two-phase query to cap AI posts at a configured ratio.
   *
   * Phase 1: Fetch human posts (non-AI) with priority scoring
   * Phase 2: Fill remaining slots with AI posts up to maxAiRatio
   *
   * Priority order for human posts (highest to lowest):
   * 1. Admin posts (role = ADMIN or SUPER_ADMIN) - score 100
   * 2. Verified/high-tier user posts (tier >= EXPERT) - score 80
   * 3. Regular user posts - score 60
   *
   * AI posts are used as filler content (score 10) and capped at maxAiRatio.
   *
   * @param options.skip - Number of posts to skip (for pagination)
   * @param options.take - Number of posts to return per page
   * @param options.maxAiRatio - Maximum ratio of AI posts (0.0 to 1.0, default 0.25)
   */
  async findPublishedPostsWithAiCap(options: {
    skip: number;
    take: number;
    maxAiRatio: number;
  }) {
    const { skip, take, maxAiRatio } = options;

    // Calculate max AI posts allowed per page
    const maxAiPostsPerPage = Math.floor(take * maxAiRatio);
    const minHumanPostsPerPage = take - maxAiPostsPerPage;

    // Phase 1: Count total human and AI posts for pagination calculation
    // NOTE: Raw SQL uses camelCase column names (same as Prisma schema - no @map directives)
    const [totalHumanPosts, totalAiPosts] = await Promise.all([
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM \`post\` p
        INNER JOIN \`user\` u ON p.authorId = u.id
        WHERE p.status = 'PUBLISHED' AND u.isAiAgent = false
      `.then((result) => result[0]?.count != null ? Number(result[0].count.toString()) : 0),
      this.prisma.$queryRaw<[{ count: bigint }]>`
        SELECT COUNT(*) as count
        FROM \`post\` p
        INNER JOIN \`user\` u ON p.authorId = u.id
        WHERE p.status = 'PUBLISHED' AND u.isAiAgent = true
      `.then((result) => result[0]?.count != null ? Number(result[0].count.toString()) : 0),
    ]);

    this.logger.debug(`Newsfeed counts: human=${totalHumanPosts}, ai=${totalAiPosts}`);

    // Calculate effective total considering AI cap
    // Each page can have at most maxAiPostsPerPage AI posts
    // So effective AI posts = min(totalAiPosts, totalPages * maxAiPostsPerPage)
    const totalPagesIfOnlyHuman =
      Math.ceil(totalHumanPosts / minHumanPostsPerPage) || 1;
    const effectiveAiPosts = Math.min(
      totalAiPosts,
      totalPagesIfOnlyHuman * maxAiPostsPerPage,
    );
    const effectiveTotal = totalHumanPosts + effectiveAiPosts;

    // Phase 2: Fetch human posts with priority scoring
    // Calculate how many human posts to skip based on page
    const humanSkip = Math.floor(skip * (minHumanPostsPerPage / take));
    const humanTake = minHumanPostsPerPage + maxAiPostsPerPage; // Fetch extra in case we need to fill

    // NOTE: Raw SQL uses camelCase column names (same as Prisma schema - no @map directives)
    // Table names must be backtick-quoted because `user` is a MySQL reserved keyword
    const humanPostsRaw = await this.prisma.$queryRaw<any[]>`
      SELECT
        p.id,
        p.createdAt,
        u.isAiAgent,
        CASE
          WHEN u.role IN ('ADMIN', 'SUPER_ADMIN') THEN 100
          WHEN u.tier IN ('EXPERT', 'MASTER', 'LEGEND') THEN 80
          ELSE 60
        END as priority_score
      FROM \`post\` p
      INNER JOIN \`user\` u ON p.authorId = u.id
      WHERE p.status = 'PUBLISHED' AND u.isAiAgent = false
      ORDER BY priority_score DESC, p.createdAt DESC
      LIMIT ${humanTake}
      OFFSET ${humanSkip}
    `;

    // Convert BigInt values from raw SQL to Number for safe arithmetic operations
    // MySQL CASE expressions return bigint which cannot be used in JS arithmetic
    const humanPosts = humanPostsRaw.map((p) => ({
      ...p,
      priority_score: Number(p.priority_score),
    }));

    const aiNeeded = Math.min(take - Math.min(humanPosts.length, take), maxAiPostsPerPage);
    this.logger.debug(`Newsfeed: ${humanPosts.length} human posts fetched, ${aiNeeded} AI posts needed`);

    // Phase 3: Determine how many AI posts we need
    const humanPostsForPage = humanPosts.slice(0, take);
    const humanCount = humanPostsForPage.length;
    const remainingSlots = take - humanCount;
    const aiPostsNeeded = Math.min(remainingSlots, maxAiPostsPerPage);

    // Phase 4: Fetch AI posts if needed
    let aiPosts: any[] = [];
    if (aiPostsNeeded > 0) {
      // Calculate AI skip proportionally
      const aiSkip = Math.floor(skip * (maxAiPostsPerPage / take));

      // NOTE: Raw SQL uses camelCase column names (same as Prisma schema - no @map directives)
      const aiPostsRaw = await this.prisma.$queryRaw<any[]>`
        SELECT
          p.id,
          p.createdAt,
          u.isAiAgent,
          10 as priority_score
        FROM \`post\` p
        INNER JOIN \`user\` u ON p.authorId = u.id
        WHERE p.status = 'PUBLISHED' AND u.isAiAgent = true
        ORDER BY p.createdAt DESC
        LIMIT ${aiPostsNeeded}
        OFFSET ${aiSkip}
      `;

      // Convert BigInt values from raw SQL to Number
      aiPosts = aiPostsRaw.map((p) => ({
        ...p,
        priority_score: Number(p.priority_score),
      }));
    }

    // Phase 5: Combine and sort by priority_score DESC, createdAt DESC
    const combinedPosts = [...humanPostsForPage, ...aiPosts];
    combinedPosts.sort((a, b) => {
      if (b.priority_score !== a.priority_score) {
        return b.priority_score - a.priority_score;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Take only the required number of posts
    const finalPosts = combinedPosts.slice(0, take);

    if (finalPosts.length === 0) {
      return { posts: [], total: effectiveTotal };
    }

    // Phase 6: Fetch full post data with relations
    const postIds = finalPosts.map((p) => p.id);

    const fullPosts = await this.prisma.post.findMany({
      where: { id: { in: postIds } },
      include: {
        author: { include: { profile: true } },
        hashtags: { include: { hashtag: true } },
        sharedPost: {
          include: {
            author: { include: { profile: true } },
            hashtags: { include: { hashtag: true } },
          },
        },
        _count: { select: { comments: true, likes: true } },
      },
    });

    // Re-order fullPosts to match the priority order
    const postMap = new Map(fullPosts.map((p) => [p.id, p]));
    const orderedPosts = postIds
      .map((id) => postMap.get(id))
      .filter((p): p is NonNullable<typeof p> => p !== undefined);

    return { posts: transformPostsImages(orderedPosts), total: effectiveTotal };
  }

  async findDraftsByAuthorId(authorId: string) {
    const posts = await this.prisma.post.findMany({
      where: { authorId, status: PostStatus.DRAFT },
      orderBy: { updatedAt: "desc" },
    });
    return transformPostsImages(posts);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  async updateLikeCount(id: string, increment: number): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: { likeCount: { increment } },
    });
  }

  async updateCommentCount(id: string, increment: number): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: { commentCount: { increment } },
    });
  }

  async findPendingPosts(options: { skip: number; take: number }) {
    const where: Prisma.PostWhereInput = { status: PostStatus.PENDING };

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { createdAt: "asc" },
        include: {
          author: { include: { profile: true } },
        },
      }),
      this.prisma.post.count({ where }),
    ]);

    return { posts: transformPostsImages(posts), total };
  }

  private getTimeRangeDate(timeRange: string): Date {
    const now = new Date();
    switch (timeRange) {
      case "today":
        return new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours
      case "week":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days
      case "month":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // default to week
    }
  }

  async findTrendingPosts(timeRange: string, skip: number, take: number) {
    const startDate = this.getTimeRangeDate(timeRange);

    const where: Prisma.PostWhereInput = {
      status: PostStatus.PUBLISHED,
      publishAt: { gte: startDate },
    };

    const posts = await this.prisma.post.findMany({
      where,
      skip,
      take,
      orderBy: [
        { likeCount: "desc" },
        { commentCount: "desc" },
        { createdAt: "desc" },
      ],
      include: {
        author: { include: { profile: true } },
        hashtags: { include: { hashtag: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    return transformPostsImages(posts);
  }

  async countTrendingPosts(timeRange: string): Promise<number> {
    const startDate = this.getTimeRangeDate(timeRange);

    return this.prisma.post.count({
      where: {
        status: PostStatus.PUBLISHED,
        publishAt: { gte: startDate },
      },
    });
  }

  /**
   * Increment share count on a post (AC-059)
   */
  async incrementShareCount(id: string): Promise<void> {
    await this.prisma.post.update({
      where: { id },
      data: { shareCount: { increment: 1 } },
    });
  }

  /**
   * Find if user already shared a specific post (AC-060)
   * Used to prevent duplicate shares
   */
  async findShareByUserAndPost(
    userId: string,
    sharedPostId: string,
  ): Promise<Post | null> {
    return this.prisma.post.findFirst({
      where: {
        authorId: userId,
        sharedPostId: sharedPostId,
      },
    });
  }

  /**
   * Find popular posts by engagement (T-113)
   * Engagement score formula: viewCount * 0.3 + likeCount * 0.4 + commentCount * 0.3
   * Uses raw SQL for proper computed column ordering
   */
  async findPopularPosts(limit: number) {
    // Raw SQL query to calculate and order by engagement score
    // Column names are camelCase (same as Prisma schema - no @map directives)
    const posts = await this.prisma.$queryRaw<
      Array<{
        id: string;
        content: string;
        slug: string | null;
        viewCount: number;
        likeCount: number;
        commentCount: number;
        createdAt: Date;
        authorId: string;
        username: string | null;
        displayName: string | null;
        avatar: string | null;
      }>
    >`
      SELECT
        p.id,
        p.content,
        p.slug,
        p.viewCount,
        p.likeCount,
        p.commentCount,
        p.createdAt,
        p.authorId,
        pr.username,
        pr.displayName,
        pr.avatar
      FROM \`post\` p
      INNER JOIN \`user\` u ON p.authorId = u.id
      LEFT JOIN \`profile\` pr ON u.id = pr.userId
      WHERE p.status = 'PUBLISHED'
      ORDER BY (p.viewCount * 0.3 + p.likeCount * 0.4 + p.commentCount * 0.3) DESC
      LIMIT ${limit}
    `;

    // Transform raw results to match expected return type
    return posts.map((post) => ({
      id: post.id,
      // Truncate content for widget display (strip HTML, limit to 100 chars)
      content: post.content.replace(/<[^>]*>/g, "").substring(0, 100),
      slug: post.slug,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
      author: {
        id: post.authorId,
        profile: post.username
          ? {
              username: post.username,
              displayName: post.displayName,
              avatar: post.avatar,
            }
          : null,
      },
    }));
  }
}
