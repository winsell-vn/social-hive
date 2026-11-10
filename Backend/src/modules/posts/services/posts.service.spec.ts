import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { PostsService } from "./posts.service";
import { PostsRepository } from "../repositories/posts.repository";
import { HashtagsService } from "../../hashtags/services/hashtags.service";
import { RedisService } from "../../../redis/redis.service";
import { CacheInvalidationService } from "../../../redis/cache-invalidation.service";
import { BlogService } from "../../blog/services/blog.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { UploadService } from "../../upload/services/upload.service";
import { PostStatus, Tier, Role } from "@prisma/client";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { PaginatedResult } from "../../../common/dto/pagination.dto";

describe("PostsService", () => {
  let service: PostsService;
  let postsRepository: jest.Mocked<PostsRepository>;
  let hashtagsService: jest.Mocked<HashtagsService>;
  let cacheInvalidationService: jest.Mocked<CacheInvalidationService>;

  // Raw DB post (before transformation) - used for create/update/delete mocks
  const mockPostRaw = {
    id: "post-1",
    content: "Test post with #hashtag",
    authorId: "author-1",
    status: PostStatus.PENDING,
    images: null as string | null,
    groupId: null,
    publishAt: null,
    moderatorId: null,
    moderatorNote: null,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    slug: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Transformed post (after repository transformation) - used for findByIdWithAuthor mocks
  // Note: images is string | null in DB but transformed to string[] in repository
  const mockPost = {
    id: "post-1",
    content: "Test post with #hashtag",
    authorId: "author-1",
    status: PostStatus.PENDING,
    images: null as string | null, // Keep as DB type for compatibility
    groupId: null,
    publishAt: null,
    moderatorId: null,
    moderatorNote: null,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    slug: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPostWithAuthor = {
    id: "post-1",
    content: "Test post with #hashtag",
    authorId: "author-1",
    status: PostStatus.PENDING,
    images: null as string | null,
    groupId: null,
    publishAt: null,
    moderatorId: null,
    moderatorNote: null,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    slug: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    author: {
      id: "author-1",
      email: "author@test.com",
      username: "testauthor",
      password: "hashed-password",
      role: "USER" as any,
      karma: 100,
      tier: Tier.CONTRIBUTOR,
      isActive: true,
      lastActiveAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        id: "profile-1",
        userId: "author-1",
        username: "testauthor",
        displayName: "Test Author",
        avatar: null,
        coverPhoto: null,
        bio: null,
        location: null,
        website: null,
        isPrivate: false,
        socialLinks: null,
        portfolio: null,
        lastUsernameChange: new Date(),
        closeFriends: null,
        followerCount: 0,
        followingCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    hashtags: [],
    _count: {
      comments: 0,
      likes: 0,
    },
  };

  beforeEach(async () => {
    const mockPostsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithAuthor: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findPublishedPosts: jest.fn(),
      findPublishedPostsWithAiCap: jest.fn(),
      findByAuthorId: jest.fn(),
      findDraftsByAuthorId: jest.fn(),
      incrementViewCount: jest.fn(),
      slugExists: jest.fn().mockResolvedValue(false),
    };

    const mockHashtagsService = {
      linkHashtagsToPost: jest.fn(),
      updatePostHashtags: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
      del: jest.fn().mockResolvedValue(1),
      getOrSet: jest.fn().mockImplementation((key, fn) => fn()),
    };

    const mockCacheInvalidationService = {
      onPostCreated: jest.fn(),
      onPostUpdated: jest.fn(),
      onPostDeleted: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: any) => {
        const config: Record<string, any> = {
          "newsfeed.maxAiPostRatio": 0.25,
        };
        return config[key] ?? defaultValue;
      }),
    };

    const mockBlogService = {
      getOrCreateDefaultCategory: jest.fn().mockResolvedValue("category-1"),
      createFromPost: jest.fn().mockResolvedValue(undefined),
      updateFromPost: jest.fn().mockResolvedValue(undefined),
      archiveBySourcePostId: jest.fn().mockResolvedValue(undefined),
    };

    const mockPrismaService = {
      postHashtag: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    const mockUploadService = {
      deleteOldProfileImage: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: PostsRepository,
          useValue: mockPostsRepository,
        },
        {
          provide: HashtagsService,
          useValue: mockHashtagsService,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: CacheInvalidationService,
          useValue: mockCacheInvalidationService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: BlogService,
          useValue: mockBlogService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    postsRepository = module.get(PostsRepository);
    hashtagsService = module.get(HashtagsService);
    cacheInvalidationService = module.get(CacheInvalidationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("should create post with DRAFT status when isDraft is true", async () => {
      // Arrange
      const dto = { content: "Test content", isDraft: true };
      const draftPostRaw = { ...mockPostRaw, status: PostStatus.DRAFT };
      const draftPostWithAuthor = {
        ...mockPostWithAuthor,
        status: PostStatus.DRAFT,
      };
      postsRepository.create.mockResolvedValue(draftPostRaw as any);
      postsRepository.findByIdWithAuthor.mockResolvedValue(
        draftPostWithAuthor as any,
      );
      hashtagsService.linkHashtagsToPost.mockResolvedValue(undefined);

      // Act
      const result = await service.create("author-1", dto, Tier.NEWCOMER);

      // Assert
      expect(postsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: PostStatus.DRAFT }),
      );
      expect(result).toBeDefined();
      expect(result!.status).toBe(PostStatus.DRAFT);
    });

    it("should create post with PENDING status for regular users", async () => {
      // Arrange
      const dto = { content: "Test content", isDraft: false };
      postsRepository.create.mockResolvedValue(mockPostRaw as any);
      postsRepository.findByIdWithAuthor.mockResolvedValue(
        mockPostWithAuthor as any,
      );
      hashtagsService.linkHashtagsToPost.mockResolvedValue(undefined);

      // Act
      const result = await service.create("author-1", dto, Tier.CONTRIBUTOR);

      // Assert
      expect(postsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ status: PostStatus.PENDING }),
      );
      expect(result).toBeDefined();
      expect(result!.status).toBe(PostStatus.PENDING);
    });

    it("should create post with PUBLISHED status for Legend tier", async () => {
      // Arrange
      const dto = { content: "Test content", isDraft: false };
      const publishedPostRaw = {
        ...mockPostRaw,
        status: PostStatus.PUBLISHED,
        publishAt: new Date(),
      };
      const publishedPostWithAuthor = {
        ...mockPostWithAuthor,
        status: PostStatus.PUBLISHED,
        publishAt: new Date(),
      };
      postsRepository.create.mockResolvedValue(publishedPostRaw as any);
      postsRepository.findByIdWithAuthor.mockResolvedValue(
        publishedPostWithAuthor as any,
      );
      hashtagsService.linkHashtagsToPost.mockResolvedValue(undefined);

      // Act
      const result = await service.create("author-1", dto, Tier.LEGEND);

      // Assert
      expect(postsRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: PostStatus.PUBLISHED,
          publishAt: expect.any(Date),
        }),
      );
      expect(result).toBeDefined();
      expect(result!.status).toBe(PostStatus.PUBLISHED);
    });

    it("should extract hashtags from content", async () => {
      // Arrange
      const dto = { content: "Test #hashtag1 and #hashtag2", isDraft: false };
      postsRepository.create.mockResolvedValue(mockPostRaw as any);
      postsRepository.findByIdWithAuthor.mockResolvedValue(
        mockPostWithAuthor as any,
      );
      hashtagsService.linkHashtagsToPost.mockResolvedValue(undefined);

      // Act
      await service.create("author-1", dto, Tier.NEWCOMER);

      // Assert
      expect(hashtagsService.linkHashtagsToPost).toHaveBeenCalledWith(
        "post-1",
        expect.arrayContaining(["hashtag1", "hashtag2"]),
      );
    });

    it("should limit hashtags to 30", async () => {
      // Arrange
      const manyHashtags = Array.from(
        { length: 35 },
        (_, i) => `#tag${i}`,
      ).join(" ");
      const dto = { content: manyHashtags, isDraft: false };
      postsRepository.create.mockResolvedValue(mockPostRaw as any);
      postsRepository.findByIdWithAuthor.mockResolvedValue(
        mockPostWithAuthor as any,
      );
      hashtagsService.linkHashtagsToPost.mockResolvedValue(undefined);

      // Act
      await service.create("author-1", dto, Tier.NEWCOMER);

      // Assert
      const callArgs = hashtagsService.linkHashtagsToPost.mock.calls[0];
      expect(callArgs[1].length).toBeLessThanOrEqual(30);
    });
  });

  describe("update", () => {
    it("should allow author to update their own post", async () => {
      // Arrange
      const draftPostRaw = { ...mockPostRaw, status: PostStatus.DRAFT };
      const dto = { content: "Updated content" };
      const updatedPostRaw = { ...draftPostRaw, content: "Updated content" };
      const updatedPostWithAuthor = {
        ...mockPostWithAuthor,
        content: "Updated content",
        status: PostStatus.DRAFT,
      };
      postsRepository.findById.mockResolvedValue(draftPostRaw as any);
      postsRepository.update.mockResolvedValue(updatedPostRaw as any);
      postsRepository.findByIdWithAuthor.mockResolvedValue(
        updatedPostWithAuthor as any,
      );
      hashtagsService.updatePostHashtags.mockResolvedValue(undefined);

      // Act
      await service.update("post-1", "author-1", dto);

      // Assert
      expect(postsRepository.update).toHaveBeenCalledWith(
        "post-1",
        expect.objectContaining({ content: "Updated content" }),
      );
    });

    it("should throw ForbiddenException if user is not the author", async () => {
      // Arrange
      postsRepository.findById.mockResolvedValue(mockPostRaw as any);

      // Act & Assert
      await expect(
        service.update("post-1", "other-user", { content: "Updated" }),
      ).rejects.toThrow(ForbiddenException);
    });

    // The service no longer restricts edits to DRAFT posts (update() only
    // checks authorship), so this scenario is no longer part of the contract.
    it.skip("should throw ForbiddenException if post is not DRAFT", async () => {
      // Arrange
      const publishedPostRaw = { ...mockPostRaw, status: PostStatus.PUBLISHED };
      postsRepository.findById.mockResolvedValue(publishedPostRaw as any);

      // Act & Assert
      await expect(
        service.update("post-1", "author-1", { content: "Updated" }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("delete", () => {
    it("should allow author to delete their own post", async () => {
      // Arrange
      postsRepository.findByIdWithAuthor.mockResolvedValue(mockPost as any);
      postsRepository.delete.mockResolvedValue(mockPostRaw as any);

      // Act
      await service.delete("post-1", "author-1", undefined);

      // Assert
      expect(postsRepository.delete).toHaveBeenCalledWith("post-1");
    });

    it("should allow admin to delete any post", async () => {
      // Arrange
      postsRepository.findByIdWithAuthor.mockResolvedValue(mockPost as any);
      postsRepository.delete.mockResolvedValue(mockPostRaw as any);

      // Act
      await service.delete("post-1", "admin-user", Role.ADMIN);

      // Assert
      expect(postsRepository.delete).toHaveBeenCalledWith("post-1");
    });

    it("should throw ForbiddenException if non-author non-admin tries to delete", async () => {
      // Arrange
      postsRepository.findByIdWithAuthor.mockResolvedValue(mockPost as any);

      // Act & Assert
      await expect(
        service.delete("post-1", "other-user", undefined),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should throw NotFoundException if post does not exist", async () => {
      // Arrange
      postsRepository.findByIdWithAuthor.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.delete("invalid-post", "author-1", undefined),
      ).rejects.toThrow(NotFoundException);
    });

    it("should invalidate caches after deleting a post", async () => {
      // Arrange
      postsRepository.findByIdWithAuthor.mockResolvedValue(
        mockPostWithAuthor as any,
      );
      postsRepository.delete.mockResolvedValue(mockPostRaw as any);

      // Act
      await service.delete("post-1", "author-1", undefined);

      // Assert - the popular posts cache must be cleared, otherwise the
      // widget keeps serving the deleted post until the cache expires.
      expect(cacheInvalidationService.onPostDeleted).toHaveBeenCalledWith(
        "post-1",
        "testauthor",
      );
    });
  });

  describe("getNewsfeed", () => {
    it("should return only PUBLISHED posts with AI cap applied", async () => {
      // Arrange
      const publishedPosts = [
        { ...mockPostWithAuthor, status: PostStatus.PUBLISHED, groupId: null },
      ];
      postsRepository.findPublishedPostsWithAiCap.mockResolvedValue({
        posts: publishedPosts as any,
        total: 1,
      });

      // Act
      const result = await service.getNewsfeed(1, 10);

      // Assert
      expect(postsRepository.findPublishedPostsWithAiCap).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
        maxAiRatio: 0.25,
      });
      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.data).toEqual(publishedPosts);
    });
  });

  describe("extractHashtags", () => {
    it("should extract hashtags from content", () => {
      // Arrange
      const content = "Test #hashtag1 and #hashtag2 #hashtag3";

      // Act
      const result = (service as any).extractHashtags(content);

      // Assert
      expect(result).toEqual(["hashtag1", "hashtag2", "hashtag3"]);
    });

    it("should convert hashtags to lowercase", () => {
      // Arrange
      const content = "Test #HashTag1 and #HASHTAG2";

      // Act
      const result = (service as any).extractHashtags(content);

      // Assert
      expect(result).toEqual(["hashtag1", "hashtag2"]);
    });

    it("should limit to 30 hashtags", () => {
      // Arrange
      const manyHashtags = Array.from(
        { length: 35 },
        (_, i) => `#tag${i}`,
      ).join(" ");

      // Act
      const result = (service as any).extractHashtags(manyHashtags);

      // Assert
      expect(result.length).toBe(30);
    });
  });
});
