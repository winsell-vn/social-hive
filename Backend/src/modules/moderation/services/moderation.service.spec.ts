import { Test, TestingModule } from "@nestjs/testing";
import { ModerationService } from "./moderation.service";
import { PostsRepository } from "../../posts/repositories/posts.repository";
import { ReputationService } from "../../reputation/services/reputation.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { Queue } from "bull";
import { PostStatus, Tier } from "@prisma/client";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { PaginatedResult } from "../../../common/dto/pagination.dto";

describe("ModerationService", () => {
  let service: ModerationService;
  let postsRepository: jest.Mocked<PostsRepository>;
  let reputationService: jest.Mocked<ReputationService>;
  let notificationsService: jest.Mocked<NotificationsService>;
  let postPublishQueue: jest.Mocked<Queue>;

  // Raw DB post (before transformation) - used for findById, update, delete mocks
  const mockPostRaw = {
    id: "post-1",
    content: "Test post content",
    authorId: "author-1",
    status: PostStatus.PENDING,
    images: null as string | null,
    slug: null,
    moderatorId: null,
    moderatorNote: null,
    publishAt: null,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    groupId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Transformed post (after repository transformation) - used for findByIdWithAuthor, findPendingPosts mocks
  // Note: images is string | null in DB but transformed to string[] in repository
  const mockPost = {
    id: "post-1",
    content: "Test post content",
    authorId: "author-1",
    status: PostStatus.PENDING,
    images: null as string | null, // Keep as DB type for compatibility
    slug: null,
    moderatorId: null,
    moderatorNote: null,
    publishAt: null,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    groupId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPostWithAuthor = {
    id: "post-1",
    content: "Test post content",
    authorId: "author-1",
    status: PostStatus.PENDING,
    images: null as string | null,
    slug: null,
    moderatorId: null,
    moderatorNote: null,
    publishAt: null,
    viewCount: 0,
    likeCount: 0,
    commentCount: 0,
    groupId: null,
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
      findById: jest.fn(),
      findPendingPosts: jest.fn(),
      update: jest.fn(),
    };

    const mockReputationService = {
      onPostApproved: jest.fn(),
      onPostRejected: jest.fn(),
    };

    const mockNotificationsService = {
      notifyPostApproved: jest.fn(),
      notifyPostRejected: jest.fn(),
    };

    const mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModerationService,
        {
          provide: PostsRepository,
          useValue: mockPostsRepository,
        },
        {
          provide: ReputationService,
          useValue: mockReputationService,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: "BullQueue_post-publish",
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<ModerationService>(ModerationService);
    postsRepository = module.get(PostsRepository);
    reputationService = module.get(ReputationService);
    notificationsService = module.get(NotificationsService);
    postPublishQueue = module.get("BullQueue_post-publish");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getPendingPosts", () => {
    it("should return PENDING posts only", async () => {
      // Arrange
      const mockPosts = [mockPostWithAuthor];
      postsRepository.findPendingPosts.mockResolvedValue({
        posts: mockPosts as any,
        total: 1,
      });

      // Act
      const result = await service.getPendingPosts(1, 20);

      // Assert
      expect(postsRepository.findPendingPosts).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
      });
      expect(result).toBeInstanceOf(PaginatedResult);
      expect(result.data).toEqual(mockPosts);
      expect(result.meta.total).toBe(1);
    });

    it("should handle pagination correctly", async () => {
      // Arrange
      postsRepository.findPendingPosts.mockResolvedValue({
        posts: [],
        total: 0,
      });

      // Act
      await service.getPendingPosts(3, 10);

      // Assert
      expect(postsRepository.findPendingPosts).toHaveBeenCalledWith({
        skip: 20,
        take: 10,
      });
    });
  });

  describe("approvePost", () => {
    it("should approve post and schedule publish date (3-7 days)", async () => {
      // Arrange
      postsRepository.findById.mockResolvedValue(mockPostRaw as any);
      const updatedPostRaw = { ...mockPostRaw, status: PostStatus.APPROVED };
      postsRepository.update.mockResolvedValue(updatedPostRaw as any);
      reputationService.onPostApproved.mockResolvedValue({
        newKarma: 150,
        newTier: Tier.CONTRIBUTOR,
      });
      notificationsService.notifyPostApproved.mockResolvedValue(undefined);
      postPublishQueue.add.mockResolvedValue({} as any);

      // Act
      const result = await service.approvePost("post-1", "moderator-1");

      // Assert
      expect(postsRepository.findById).toHaveBeenCalledWith("post-1");
      expect(postsRepository.update).toHaveBeenCalled();

      const updateCall = postsRepository.update.mock.calls[0];
      const publishAt = updateCall[1].publishAt as Date;
      const daysDiff = Math.ceil(
        (publishAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      expect(daysDiff).toBeGreaterThanOrEqual(3);
      expect(daysDiff).toBeLessThanOrEqual(7);
      expect(updateCall[1].status).toBe(PostStatus.APPROVED);
      expect(updateCall[1].moderatorId).toBe("moderator-1");
    });

    it("should award karma when post is approved", async () => {
      // Arrange
      postsRepository.findById.mockResolvedValue(mockPostRaw as any);
      postsRepository.update.mockResolvedValue({
        ...mockPostRaw,
        status: PostStatus.APPROVED,
      } as any);
      reputationService.onPostApproved.mockResolvedValue({
        newKarma: 150,
        newTier: Tier.CONTRIBUTOR,
      });
      notificationsService.notifyPostApproved.mockResolvedValue(undefined);
      postPublishQueue.add.mockResolvedValue({} as any);

      // Act
      await service.approvePost("post-1", "moderator-1");

      // Assert
      expect(reputationService.onPostApproved).toHaveBeenCalledWith(
        "author-1",
        "post-1",
      );
    });

    it("should send notification when post is approved", async () => {
      // Arrange
      postsRepository.findById.mockResolvedValue(mockPostRaw as any);
      postsRepository.update.mockResolvedValue({
        ...mockPostRaw,
        status: PostStatus.APPROVED,
      } as any);
      reputationService.onPostApproved.mockResolvedValue({
        newKarma: 150,
        newTier: Tier.CONTRIBUTOR,
      });
      notificationsService.notifyPostApproved.mockResolvedValue(undefined);
      postPublishQueue.add.mockResolvedValue({} as any);

      // Act
      await service.approvePost("post-1", "moderator-1");

      // Assert
      expect(notificationsService.notifyPostApproved).toHaveBeenCalledWith(
        "author-1",
        "post-1",
        "Test post content",
      );
    });

    it("should add job to queue for scheduled publishing", async () => {
      // Arrange
      postsRepository.findById.mockResolvedValue(mockPostRaw as any);
      postsRepository.update.mockResolvedValue({
        ...mockPostRaw,
        status: PostStatus.APPROVED,
      } as any);
      reputationService.onPostApproved.mockResolvedValue({
        newKarma: 150,
        newTier: Tier.CONTRIBUTOR,
      });
      notificationsService.notifyPostApproved.mockResolvedValue(undefined);
      postPublishQueue.add.mockResolvedValue({} as any);

      // Act
      await service.approvePost("post-1", "moderator-1");

      // Assert
      expect(postPublishQueue.add).toHaveBeenCalledWith(
        "publish-post",
        { postId: "post-1" },
        expect.objectContaining({ delay: expect.any(Number) }),
      );
    });

    it("should throw NotFoundException if post not found", async () => {
      // Arrange
      postsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.approvePost("invalid-post", "moderator-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException if post is not PENDING", async () => {
      // Arrange
      const publishedPostRaw = { ...mockPostRaw, status: PostStatus.PUBLISHED };
      postsRepository.findById.mockResolvedValue(publishedPostRaw as any);

      // Act & Assert
      await expect(
        service.approvePost("post-1", "moderator-1"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("rejectPost", () => {
    it("should reject post and store reason", async () => {
      // Arrange
      postsRepository.findById.mockResolvedValue(mockPostRaw as any);
      const rejectedPostRaw = { ...mockPostRaw, status: PostStatus.REJECTED };
      postsRepository.update.mockResolvedValue(rejectedPostRaw as any);
      reputationService.onPostRejected.mockResolvedValue({
        newKarma: 80,
        newTier: Tier.NEWCOMER,
      });
      notificationsService.notifyPostRejected.mockResolvedValue(undefined);

      // Act
      const result = await service.rejectPost(
        "post-1",
        "moderator-1",
        "Spam content",
      );

      // Assert
      expect(postsRepository.findById).toHaveBeenCalledWith("post-1");
      expect(postsRepository.update).toHaveBeenCalledWith("post-1", {
        status: PostStatus.REJECTED,
      });
      expect(result.status).toBe(PostStatus.REJECTED);
    });

    it("should deduct karma when post is rejected", async () => {
      // Arrange
      postsRepository.findById.mockResolvedValue(mockPostRaw as any);
      postsRepository.update.mockResolvedValue({
        ...mockPostRaw,
        status: PostStatus.REJECTED,
      } as any);
      reputationService.onPostRejected.mockResolvedValue({
        newKarma: 80,
        newTier: Tier.NEWCOMER,
      });
      notificationsService.notifyPostRejected.mockResolvedValue(undefined);

      // Act
      await service.rejectPost("post-1", "moderator-1", "Spam content");

      // Assert
      expect(reputationService.onPostRejected).toHaveBeenCalledWith(
        "author-1",
        "post-1",
        "Spam content",
      );
    });

    it("should send notification when post is rejected", async () => {
      // Arrange
      postsRepository.findById.mockResolvedValue(mockPostRaw as any);
      postsRepository.update.mockResolvedValue({
        ...mockPostRaw,
        status: PostStatus.REJECTED,
      } as any);
      reputationService.onPostRejected.mockResolvedValue({
        newKarma: 80,
        newTier: Tier.NEWCOMER,
      });
      notificationsService.notifyPostRejected.mockResolvedValue(undefined);

      // Act
      await service.rejectPost("post-1", "moderator-1", "Spam content");

      // Assert
      expect(notificationsService.notifyPostRejected).toHaveBeenCalledWith(
        "author-1",
        "post-1",
        "Test post content",
        "Spam content",
      );
    });
  });
});
