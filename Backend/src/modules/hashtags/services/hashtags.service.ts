import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { HashtagsRepository } from "../repositories/hashtags.repository";
import { PaginatedResult } from "../../../common/dto/pagination.dto";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisService } from "../../../redis/redis.service";

// Trending algorithm constants
const TRENDING_WINDOW_DAYS = 7;
const RECENCY_WEIGHTS = [1.0, 0.9, 0.75, 0.6, 0.45, 0.3, 0.15]; // Day 0-6 weights

// Cache TTL in seconds (5 minutes)
const TRENDING_CACHE_TTL = 300;

// Time range to days mapping
const TIME_RANGE_DAYS: Record<string, number> = {
  today: 1,
  week: 7,
  month: 30,
};

@Injectable()
export class HashtagsService {
  private readonly logger = new Logger(HashtagsService.name);

  constructor(
    private hashtagsRepository: HashtagsRepository,
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async linkHashtagsToPost(postId: string, hashtags: string[]): Promise<void> {
    this.logger.log(`Linking ${hashtags.length} hashtags to post ${postId}`);

    for (const tagName of hashtags) {
      const hashtag = await this.hashtagsRepository.findOrCreate(tagName);
      try {
        await this.hashtagsRepository.linkToPost(postId, hashtag.id);
        await this.hashtagsRepository.incrementPostCount(hashtag.id);
      } catch (error) {
        // Ignore duplicate link errors
        this.logger.warn(`Hashtag ${tagName} already linked to post ${postId}`);
      }
    }
  }

  async updatePostHashtags(
    postId: string,
    newHashtags: string[],
  ): Promise<void> {
    // Get current hashtags
    const currentLinks = await this.hashtagsRepository.getPostHashtags(postId);
    const currentTags = currentLinks.map(
      (link: { hashtag: { name: string } }) => link.hashtag.name,
    );

    // Find tags to add and remove
    const tagsToAdd = newHashtags.filter(
      (tag) => !currentTags.includes(tag.toLowerCase()),
    );
    const tagsToRemove = currentLinks.filter(
      (link: { hashtag: { name: string }; hashtagId: string }) =>
        !newHashtags.map((t) => t.toLowerCase()).includes(link.hashtag.name),
    );

    // Remove old tags
    for (const link of tagsToRemove) {
      await this.hashtagsRepository.unlinkFromPost(postId, link.hashtagId);
      await this.hashtagsRepository.decrementPostCount(link.hashtagId);
    }

    // Add new tags
    await this.linkHashtagsToPost(postId, tagsToAdd);
  }

  async getTrending(limit: number = 10, timeRange: string = "week") {
    // Build cache key
    const cacheKey = `trending:hashtags:${timeRange}:${limit}`;

    // Check Redis cache first
    const cached = await this.redisService.get<unknown[]>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for trending hashtags: ${cacheKey}`);
      return cached;
    }

    this.logger.debug(`Cache miss for trending hashtags: ${cacheKey}`);

    // Calculate date range based on timeRange parameter
    const days = TIME_RANGE_DAYS[timeRange] || TIME_RANGE_DAYS.week;
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - days);

    // Query database with time range filter
    const result = await this.prisma.hashtag.findMany({
      where: {
        trendingScore: { gt: 0 },
        posts: {
          some: {
            post: {
              createdAt: { gte: windowStart },
              status: "PUBLISHED",
            },
          },
        },
      },
      orderBy: { trendingScore: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        postCount: true,
        trendingScore: true,
      },
    });

    // Cache result with 5-minute TTL
    await this.redisService.set(cacheKey, result, TRENDING_CACHE_TTL);

    return result;
  }

  async getHashtagWithPosts(name: string, page: number, limit: number) {
    const result = await this.hashtagsRepository.findByNameWithPosts(
      name,
      (page - 1) * limit,
      limit,
    );

    if (!result) {
      throw new NotFoundException("Hashtag không tồn tại");
    }

    return {
      hashtag: result.hashtag,
      posts: new PaginatedResult(result.posts, page, limit, result.total),
    };
  }

  async findByName(name: string) {
    const hashtag = await this.hashtagsRepository.findByName(name);
    if (!hashtag) {
      throw new NotFoundException("Hashtag không tồn tại");
    }
    return hashtag;
  }

  /**
   * Calculate trending score based on recency-weighted algorithm
   * Called by a scheduled job
   */
  async calculateTrendingScores(): Promise<void> {
    this.logger.log("Calculating trending scores for hashtags");

    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() - TRENDING_WINDOW_DAYS);

    // Get all hashtags with posts in the last 7 days
    const hashtags = await this.prisma.hashtag.findMany({
      where: {
        posts: {
          some: {
            post: {
              createdAt: { gte: windowStart },
              status: "PUBLISHED",
            },
          },
        },
      },
      include: {
        posts: {
          where: {
            post: {
              createdAt: { gte: windowStart },
              status: "PUBLISHED",
            },
          },
          include: {
            post: {
              select: {
                createdAt: true,
                likeCount: true,
                commentCount: true,
              },
            },
          },
        },
      },
    });

    for (const hashtag of hashtags) {
      let trendingScore = 0;

      for (const postHashtag of hashtag.posts) {
        const post = postHashtag.post;
        const postDate = new Date(post.createdAt);
        const daysDiff = Math.floor(
          (now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Get recency weight (more recent = higher weight)
        const recencyWeight = RECENCY_WEIGHTS[Math.min(daysDiff, 6)] || 0.1;

        // Calculate engagement score for this post
        const engagementScore =
          1 + post.likeCount * 0.5 + post.commentCount * 1.0;

        // Add weighted score
        trendingScore += engagementScore * recencyWeight;
      }

      // Update trending score in database
      await this.hashtagsRepository.updateTrendingScore(
        hashtag.id,
        Math.round(trendingScore * 100) / 100,
      );
    }

    // Reset scores for hashtags with no recent activity
    await this.prisma.hashtag.updateMany({
      where: {
        posts: {
          none: {
            post: {
              createdAt: { gte: windowStart },
              status: "PUBLISHED",
            },
          },
        },
      },
      data: { trendingScore: 0 },
    });

    this.logger.log(
      `Trending scores calculated for ${hashtags.length} hashtags`,
    );
  }

  /**
   * Get top trending hashtags
   * @param limit Number of hashtags to return (default: 10)
   */
  async getTopTrending(limit: number = 10) {
    return this.prisma.hashtag.findMany({
      where: { trendingScore: { gt: 0 } },
      orderBy: { trendingScore: "desc" },
      take: limit,
      select: {
        id: true,
        name: true,
        postCount: true,
        trendingScore: true,
      },
    });
  }

  /**
   * Get trending hashtags with sample posts
   * Uses optimized batch query to avoid N+1 problem
   * @param timeRange Time range for trending (day, week, month)
   * @param limit Number of hashtags to return
   * @param samplePostsCount Number of sample posts per hashtag
   */
  async getTrendingWithSamplePosts(
    timeRange: string,
    limit: number,
    samplePostsCount: number = 3,
  ) {
    // Build cache key
    const cacheKey = `trending:hashtags:withPosts:${timeRange}:${limit}`;

    // Check Redis cache first
    const cached = await this.redisService.get<unknown[]>(cacheKey);
    if (cached) {
      this.logger.debug(
        `Cache hit for trending hashtags with posts: ${cacheKey}`,
      );
      return cached;
    }

    this.logger.debug(
      `Cache miss for trending hashtags with posts: ${cacheKey}`,
    );

    // Get trending hashtags (reuse existing logic)
    const trendingHashtags = await this.getTrending(limit, timeRange);

    if (trendingHashtags.length === 0) {
      await this.redisService.set(cacheKey, [], TRENDING_CACHE_TTL);
      return [];
    }

    // Extract hashtag IDs for batch query
    const hashtagIds = trendingHashtags.map((h: { id: string }) => h.id);

    // Batch fetch posts for all hashtags to avoid N+1
    // Get posts that have any of the trending hashtags
    const postsWithHashtags = await this.prisma.postHashtag.findMany({
      where: {
        hashtagId: { in: hashtagIds },
        post: {
          status: "PUBLISHED",
        },
      },
      include: {
        post: {
          select: {
            id: true,
            content: true,
            createdAt: true,
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
        },
      },
      orderBy: {
        post: {
          createdAt: "desc",
        },
      },
    });

    // Group posts by hashtag ID and limit to samplePostsCount per hashtag
    const postsByHashtagId = new Map<
      string,
      (typeof postsWithHashtags)[number][]
    >();
    for (const postHashtag of postsWithHashtags) {
      const hashtagId = postHashtag.hashtagId;
      if (!postsByHashtagId.has(hashtagId)) {
        postsByHashtagId.set(hashtagId, []);
      }
      const posts = postsByHashtagId.get(hashtagId)!;
      if (posts.length < samplePostsCount) {
        posts.push(postHashtag);
      }
    }

    // Build result with sample posts for each hashtag
    const result = trendingHashtags.map(
      (hashtag: {
        id: string;
        name: string;
        postCount: number;
        trendingScore: number;
      }) => {
        const hashtagPosts = postsByHashtagId.get(hashtag.id) || [];
        const samplePosts = hashtagPosts.map((ph) => ({
          id: ph.post.id,
          content:
            ph.post.content.length > 100
              ? ph.post.content.substring(0, 100) + "..."
              : ph.post.content,
          author: {
            id: ph.post.author.id,
            username: ph.post.author.profile?.username || null,
            displayName: ph.post.author.profile?.displayName || null,
            avatar: ph.post.author.profile?.avatar || null,
          },
        }));

        return {
          ...hashtag,
          samplePosts,
        };
      },
    );

    // Cache result with 5-minute TTL
    await this.redisService.set(cacheKey, result, TRENDING_CACHE_TTL);

    return result;
  }
}
