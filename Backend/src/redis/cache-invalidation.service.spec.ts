import { Test, TestingModule } from "@nestjs/testing";
import { CacheInvalidationService } from "./cache-invalidation.service";
import { RedisService } from "./redis.service";
import { CACHE_PATTERNS } from "./cache-keys";

describe("CacheInvalidationService", () => {
  let service: CacheInvalidationService;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheInvalidationService,
        {
          provide: RedisService,
          useValue: {
            del: jest.fn().mockResolvedValue(1),
            delPattern: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    service = module.get<CacheInvalidationService>(CacheInvalidationService);
    redisService = module.get(RedisService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("popular posts cache", () => {
    // Regression test: the popular posts widget used to keep serving deleted
    // posts for up to POPULAR_POSTS_CACHE_TTL (1 hour) because the
    // "posts:popular:*" cache key was never invalidated.
    it("should invalidate the popular posts cache when a post is deleted", async () => {
      await service.onPostDeleted("post-1", "author");

      expect(redisService.delPattern).toHaveBeenCalledWith(
        CACHE_PATTERNS.ALL_POPULAR_POSTS,
      );
    });

    it("should invalidate the popular posts cache when a post is created", async () => {
      await service.onPostCreated("author");

      expect(redisService.delPattern).toHaveBeenCalledWith(
        CACHE_PATTERNS.ALL_POPULAR_POSTS,
      );
    });

    it("should invalidate the popular posts cache when a post is updated", async () => {
      await service.onPostUpdated();

      expect(redisService.delPattern).toHaveBeenCalledWith(
        CACHE_PATTERNS.ALL_POPULAR_POSTS,
      );
    });

    it("should invalidate the popular posts cache when a reaction changes", async () => {
      await service.onReactionChanged("post-1");

      expect(redisService.delPattern).toHaveBeenCalledWith(
        CACHE_PATTERNS.ALL_POPULAR_POSTS,
      );
    });

    it("should invalidate the popular posts cache on invalidateAll", async () => {
      await service.invalidateAll();

      expect(redisService.delPattern).toHaveBeenCalledWith(
        CACHE_PATTERNS.ALL_POPULAR_POSTS,
      );
    });
  });

  describe("cache key patterns", () => {
    it("should use a pattern that matches the popular posts cache keys", () => {
      // Keys are built as `posts:popular:<limit>`; the generic "post:*"
      // pattern must not be relied on to clear them.
      expect(CACHE_PATTERNS.ALL_POPULAR_POSTS).toBe("posts:popular:*");
      expect(CACHE_PATTERNS.ALL_POSTS).not.toMatch(
        CACHE_PATTERNS.ALL_POPULAR_POSTS,
      );
    });
  });
});
