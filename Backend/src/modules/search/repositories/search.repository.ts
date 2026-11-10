import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, PostStatus } from "@prisma/client";

@Injectable()
export class SearchRepository {
  private readonly logger = new Logger(SearchRepository.name);

  constructor(private prisma: PrismaService) {}

  async searchPosts(query: string, skip: number, take: number) {
    // Use LIKE-based search (contains) instead of FULLTEXT search
    // FULLTEXT search has issues with Vietnamese diacritics and short words
    // Note: MySQL's default collation (utf8mb4_unicode_ci) is case-insensitive
    // TODO: LIKE '%query%' performs full table scans — O(n) complexity.
    // Consider migrating to a dedicated search engine (Meilisearch, Elasticsearch)
    // for better performance at scale while maintaining Vietnamese diacritics support.
    // Current approach is acceptable for < 100k posts.
    const where: Prisma.PostWhereInput = {
      status: PostStatus.PUBLISHED,
      content: {
        contains: query,
      },
    };

    try {
      const [posts, total] = await Promise.all([
        this.prisma.post.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: "desc" },
          include: {
            author: { include: { profile: true } },
            hashtags: { include: { hashtag: true } },
            _count: { select: { comments: true, likes: true } },
          },
        }),
        this.prisma.post.count({ where }),
      ]);

      return { posts, total };
    } catch (error) {
      this.logger.error(
        `Failed to search posts for query "${query}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async searchUsers(query: string, skip: number, take: number) {
    const whereCondition = {
      OR: [
        { username: { contains: query, mode: "insensitive" as const } },
        { displayName: { contains: query, mode: "insensitive" as const } },
        { bio: { contains: query, mode: "insensitive" as const } },
      ],
    };

    try {
      const [users, total] = await Promise.all([
        this.prisma.profile.findMany({
          where: whereCondition,
          skip,
          take,
          include: {
            user: {
              select: { id: true, karma: true, tier: true, role: true },
            },
          },
          orderBy: { followerCount: "desc" },
        }),
        this.prisma.profile.count({
          where: whereCondition,
        }),
      ]);

      return { users, total };
    } catch (error) {
      this.logger.error(
        `Failed to search users for query "${query}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async searchHashtags(query: string, skip: number, take: number) {
    const normalizedQuery = query.toLowerCase();

    try {
      const [hashtags, total] = await Promise.all([
        this.prisma.hashtag.findMany({
          where: {
            name: { contains: normalizedQuery },
          },
          skip,
          take,
          orderBy: { postCount: "desc" },
        }),
        this.prisma.hashtag.count({
          where: {
            name: { contains: normalizedQuery },
          },
        }),
      ]);

      return { hashtags, total };
    } catch (error) {
      this.logger.error(
        `Failed to search hashtags for query "${query}": ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  async getTrendingHashtags(limit: number) {
    return this.prisma.hashtag.findMany({
      orderBy: { trendingScore: "desc" },
      take: limit,
    });
  }

  async getSuggestions(query: string, limit: number) {
    const [hashtags, users] = await Promise.all([
      this.prisma.hashtag.findMany({
        where: { name: { startsWith: query.toLowerCase() } },
        take: limit,
        orderBy: { postCount: "desc" },
      }),
      this.prisma.profile.findMany({
        where: {
          OR: [
            { username: { startsWith: query } },
            { displayName: { startsWith: query } },
          ],
        },
        take: limit,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatar: true,
        },
      }),
    ]);

    return { hashtags, users };
  }
}
