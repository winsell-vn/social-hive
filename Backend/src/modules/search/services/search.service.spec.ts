import { Test, TestingModule } from "@nestjs/testing";
import { SearchService } from "./search.service";
import { SearchRepository } from "../repositories/search.repository";
import { RedisService } from "../../../redis/redis.service";
import { PostStatus } from "@prisma/client";

describe("SearchService", () => {
  let service: SearchService;
  let searchRepository: jest.Mocked<SearchRepository>;

  const mockPost = {
    id: "post-1",
    authorId: "user-1",
    content: "Test post about #technology",
    status: PostStatus.PUBLISHED,
    createdAt: new Date(),
    updatedAt: new Date(),
    images: null,
    moderatorId: null,
    moderatorNote: null,
    publishAt: null,
    scheduledFor: null,
    visibility: "PUBLIC" as any,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    sharedPostId: null,
    groupId: null,
    slug: null,
    author: {
      id: "user-1",
      email: "test@example.com",
      username: "testuser",
      password: "hashed",
      role: "USER" as any,
      karma: 100,
      tier: "CONTRIBUTOR" as any,
      isActive: true,
      isAiAgent: false,
      lastActiveAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      deletionRequestedAt: null,
      deletionScheduledFor: null,
      profile: {
        id: "profile-1",
        userId: "user-1",
        username: "testuser",
        displayName: "Test User",
        avatar: null,
        coverPhoto: null,
        bio: "Software developer",
        location: null,
        website: null,
        isPrivate: false,
        socialLinks: null,
        portfolio: null,
        lastUsernameChange: new Date(),
        closeFriends: null,
        followerCount: 0,
        followingCount: 0,
        jobTitle: null,
        company: null,
        expertise: null,
        credentials: null,
        isVerifiedExpert: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    hashtags: [],
    _count: { reactions: 0, comments: 0, likes: 0 },
  };

  const mockUser = {
    id: "profile-1",
    userId: "user-1",
    username: "testuser",
    displayName: "Test User",
    avatar: null,
    coverPhoto: null,
    bio: "Software developer",
    location: null,
    website: null,
    isPrivate: false,
    socialLinks: null,
    portfolio: null,
    lastUsernameChange: new Date(),
    closeFriends: null,
    followerCount: 0,
    followingCount: 0,
    jobTitle: null,
    company: null,
    expertise: null,
    credentials: null,
    isVerifiedExpert: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {
      id: "user-1",
      email: "testuser@example.com",
      role: "USER" as any,
      karma: 0,
      tier: "NEWCOMER" as any,
      isAiAgent: false,
    },
  };

  const mockHashtag = {
    id: "hashtag-1",
    name: "technology",
    postCount: 100,
    trendingScore: 85,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockSearchRepository = {
      searchPosts: jest.fn(),
      searchUsers: jest.fn(),
      searchHashtags: jest.fn(),
      getSuggestions: jest.fn(),
      getTrendingHashtags: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
      del: jest.fn().mockResolvedValue(1),
      getOrSet: jest.fn().mockImplementation((key, fn) => fn()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: SearchRepository,
          useValue: mockSearchRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    searchRepository = module.get(SearchRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("search", () => {
    it("should perform search for all types", async () => {
      // Arrange
      const query = "test";
      const type = "all" as const;
      const page = 1;
      const limit = 10;
      const posts = [mockPost];
      const users = [mockUser];
      const hashtags = [mockHashtag];

      searchRepository.searchPosts.mockResolvedValue({ posts, total: 1 });
      searchRepository.searchUsers.mockResolvedValue({ users, total: 1 });
      searchRepository.searchHashtags.mockResolvedValue({ hashtags, total: 1 });

      // Act
      const result = await service.search(query, type, page, limit);

      // Assert
      expect(searchRepository.searchPosts).toHaveBeenCalledWith(
        query,
        0,
        limit,
      );
      expect(searchRepository.searchUsers).toHaveBeenCalledWith(
        query,
        0,
        limit,
      );
      expect(searchRepository.searchHashtags).toHaveBeenCalledWith(
        query,
        0,
        limit,
      );
      expect(result.posts).toBeDefined();
      expect(result.users).toBeDefined();
      expect(result.hashtags).toBeDefined();
    });

    it("should search posts only", async () => {
      // Arrange
      const query = "technology";
      const type = "posts";
      const page = 1;
      const limit = 10;
      const posts = [mockPost];

      searchRepository.searchPosts.mockResolvedValue({ posts, total: 1 });

      // Act
      const result = await service.search(query, type, page, limit);

      // Assert
      expect(searchRepository.searchPosts).toHaveBeenCalledWith(
        query,
        0,
        limit,
      );
      expect(result.posts).toBeDefined();
      expect(result.users).toBeUndefined();
      expect(result.hashtags).toBeUndefined();
    });

    it("should search users only", async () => {
      // Arrange
      const query = "testuser";
      const type = "users";
      const page = 1;
      const limit = 10;
      const users = [mockUser];

      searchRepository.searchUsers.mockResolvedValue({ users, total: 1 });

      // Act
      const result = await service.search(query, type, page, limit);

      // Assert
      expect(searchRepository.searchUsers).toHaveBeenCalledWith(
        query,
        0,
        limit,
      );
      expect(result.users).toBeDefined();
      expect(result.posts).toBeUndefined();
    });

    it("should search hashtags only", async () => {
      // Arrange
      const query = "technology";
      const type = "hashtags";
      const page = 1;
      const limit = 10;
      const hashtags = [mockHashtag];

      searchRepository.searchHashtags.mockResolvedValue({ hashtags, total: 1 });

      // Act
      const result = await service.search(query, type, page, limit);

      // Assert
      expect(searchRepository.searchHashtags).toHaveBeenCalledWith(
        query,
        0,
        limit,
      );
      expect(result.hashtags).toBeDefined();
      expect(result.posts).toBeUndefined();
    });
  });

  describe("getSuggestions", () => {
    it("should get autocomplete suggestions", async () => {
      // Arrange
      const query = "te";
      const suggestions = {
        users: [
          {
            id: "profile-1",
            username: "testuser",
            displayName: "Test User",
            avatar: null,
          },
        ],
        hashtags: [
          {
            name: "technology",
            id: "hashtag-1",
            createdAt: new Date(),
            postCount: 100,
            trendingScore: 85,
          },
        ],
        groups: [
          {
            id: "group-1",
            name: "Tech Enthusiasts",
            description: "A group for technology lovers",
            memberCount: 50,
          },
        ],
      };

      searchRepository.getSuggestions.mockResolvedValue(suggestions as any);

      // Act
      const result = await service.getSuggestions(query);

      // Assert
      expect(searchRepository.getSuggestions).toHaveBeenCalledWith(query, 5);
      expect(result).toEqual(suggestions);
    });
  });

  describe("getTrendingHashtags", () => {
    it("should get trending hashtags", async () => {
      // Arrange
      const limit = 10;
      const hashtags = [mockHashtag];

      searchRepository.getTrendingHashtags.mockResolvedValue(hashtags as any);

      // Act
      const result = await service.getTrendingHashtags(limit);

      // Assert
      expect(searchRepository.getTrendingHashtags).toHaveBeenCalledWith(limit);
      expect(result).toEqual(hashtags);
    });

    it("should use default limit of 10", async () => {
      // Arrange
      const hashtags = [mockHashtag];

      searchRepository.getTrendingHashtags.mockResolvedValue(hashtags as any);

      // Act
      const result = await service.getTrendingHashtags();

      // Assert
      expect(searchRepository.getTrendingHashtags).toHaveBeenCalledWith(10);
      expect(result).toEqual(hashtags);
    });
  });
});
