import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "../../../redis/cache-keys";
import { PostStatus } from "@prisma/client";

// Scoring weights for related posts algorithm
const WEIGHTS = {
  SHARED_HASHTAG: 3, // Per shared hashtag
  SAME_AUTHOR: 2, // Same author bonus
  RECENCY: 1, // Based on publish date (normalized 0-1)
};

@Injectable()
export class RelatedPostsService {
  private readonly logger = new Logger(RelatedPostsService.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  /**
   * Get related posts for a given post based on:
   * 1. Shared hashtags (weight: 3x per hashtag)
   * 2. Same author (weight: 2x)
   * 3. Recency (weight: 1x, normalized)
   *
   * @param postId - The post ID to find related posts for
   * @param limit - Maximum number of related posts to return (default: 6)
   * @returns Array of related posts with author info
   */
  async getRelatedPosts(postId: string, limit: number = 6) {
    const cacheKey = CACHE_KEYS.RELATED_POSTS(postId);

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        this.logger.debug(`Computing related posts for ${postId}`);

        // 1. Get the current post with its hashtags
        const currentPost = await this.prisma.post.findUnique({
          where: { id: postId },
          include: {
            hashtags: { select: { hashtagId: true } },
          },
        });

        if (!currentPost) {
          return [];
        }

        const hashtagIds = currentPost.hashtags.map((h) => h.hashtagId);
        const authorId = currentPost.authorId;

        // 2. Find candidate posts (shared hashtags OR same author, exclude current, only PUBLISHED)
        const candidatePosts = await this.prisma.post.findMany({
          where: {
            id: { not: postId },
            status: PostStatus.PUBLISHED,
            OR: [
              // Posts with shared hashtags
              ...(hashtagIds.length > 0
                ? [{ hashtags: { some: { hashtagId: { in: hashtagIds } } } }]
                : []),
              // Posts by same author
              { authorId: authorId },
            ],
          },
          include: {
            author: { include: { profile: true } },
            hashtags: { select: { hashtagId: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 50, // Get more candidates for scoring
        });

        if (candidatePosts.length === 0) {
          return [];
        }

        // 3. Calculate scores for each candidate
        const now = Date.now();
        const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

        const scoredPosts = candidatePosts.map((post) => {
          let score = 0;

          // Shared hashtags score
          const postHashtagIds = post.hashtags.map((h) => h.hashtagId);
          const sharedCount = hashtagIds.filter((id) =>
            postHashtagIds.includes(id),
          ).length;
          score += sharedCount * WEIGHTS.SHARED_HASHTAG;

          // Same author score
          if (post.authorId === authorId) {
            score += WEIGHTS.SAME_AUTHOR;
          }

          // Recency score (0-1, newer = higher)
          const postAge = now - new Date(post.createdAt).getTime();
          const recencyScore = Math.max(0, 1 - postAge / maxAge);
          score += recencyScore * WEIGHTS.RECENCY;

          return { post, score };
        });

        // 4. Sort by score DESC and take top N
        scoredPosts.sort((a, b) => b.score - a.score);
        const topPosts = scoredPosts.slice(0, limit);

        // 5. Transform images from JSON string to array
        return topPosts.map(({ post }) => {
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
        });
      },
      CACHE_TTL.RELATED_POSTS,
    );
  }
}
