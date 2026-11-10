import { Injectable, Logger, InternalServerErrorException } from "@nestjs/common";
import { SearchRepository } from "../repositories/search.repository";
import { PaginatedResult } from "../../../common/dto/pagination.dto";
import { CACHE_KEYS, CACHE_TTL } from "../../../redis/cache-keys";
import { RedisService } from "../../../redis/redis.service";

export interface SearchResults {
  posts?: PaginatedResult<any>;
  users?: PaginatedResult<any>;
  hashtags?: PaginatedResult<any>;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private readonly searchRepository: SearchRepository,
    private readonly redisService: RedisService,
  ) {}

  async search(
    query: string,
    type: "all" | "posts" | "users" | "hashtags",
    page: number,
    limit: number,
  ): Promise<SearchResults> {
    this.logger.log(`Searching for "${query}" with type "${type}"`);

    // Handle empty or whitespace-only queries gracefully
    const trimmedQuery = query?.trim() || "";
    if (!trimmedQuery) {
      this.logger.warn("Empty search query received");
      return {
        posts: type === "all" || type === "posts" ? new PaginatedResult([], page, limit, 0) : undefined,
        users: type === "all" || type === "users" ? new PaginatedResult([], page, limit, 0) : undefined,
        hashtags: type === "all" || type === "hashtags" ? new PaginatedResult([], page, limit, 0) : undefined,
      };
    }

    try {
      const skip = (page - 1) * limit;
      const results: SearchResults = {};

      if (type === "all" || type === "posts") {
        const { posts, total } = await this.searchRepository.searchPosts(
          trimmedQuery,
          skip,
          limit,
        );
        results.posts = new PaginatedResult(posts, page, limit, total);
      }

      if (type === "all" || type === "users") {
        const { users, total } = await this.searchRepository.searchUsers(
          trimmedQuery,
          skip,
          limit,
        );
        results.users = new PaginatedResult(users, page, limit, total);
      }

      if (type === "all" || type === "hashtags") {
        const { hashtags, total } = await this.searchRepository.searchHashtags(
          trimmedQuery,
          skip,
          limit,
        );
        results.hashtags = new PaginatedResult(hashtags, page, limit, total);
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Search failed for query="${trimmedQuery}" type="${type}" error=${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new InternalServerErrorException("Không thể thực hiện tìm kiếm. Vui lòng thử lại.");
    }
  }

  async getTrendingHashtags(limit: number = 10) {
    this.logger.log(`Getting top ${limit} trending hashtags`);
    return this.searchRepository.getTrendingHashtags(limit);
  }

  async getSuggestions(query: string, limit: number = 5) {
    // Don't cache empty or very short queries
    if (!query || query.trim().length < 2) {
      this.logger.log(`Query too short, skipping cache: "${query}"`);
      return this.searchRepository.getSuggestions(query, limit);
    }

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = CACHE_KEYS.SEARCH_SUGGESTIONS(normalizedQuery, limit);

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        this.logger.log(`Getting suggestions for "${query}" from database`);
        return this.searchRepository.getSuggestions(query, limit);
      },
      CACHE_TTL.SEARCH_SUGGESTIONS,
    );
  }
}
