import { Test, TestingModule } from "@nestjs/testing";
import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { ReactionsService } from "./reactions.service";
import { ReactionsRepository } from "../repositories/reactions.repository";
import { PostsRepository } from "../../posts/repositories/posts.repository";
import { ReputationService } from "../../reputation/services/reputation.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { ProfilesRepository } from "../../profiles/repositories/profiles.repository";
import { RedisService } from "../../../redis/redis.service";
import { CacheInvalidationService } from "../../../redis/cache-invalidation.service";
import { ReactionType } from "@prisma/client";

describe("ReactionsService", () => {
  let service: ReactionsService;
  let reactionsRepository: jest.Mocked<ReactionsRepository>;
  let postsRepository: jest.Mocked<PostsRepository>;

  const mockPost = {
    id: "post-1",
    authorId: "author-1",
    content: "Test post",
    status: "PUBLISHED",
  };

  const mockReaction = {
    id: "reaction-1",
    userId: "user-1",
    postId: "post-1",
    commentId: null,
    reactionType: ReactionType.LIKE,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockReactionsRepository = {
      findPostReaction: jest.fn(),
      findCommentReaction: jest.fn(),
      createPostReaction: jest.fn(),
      createCommentReaction: jest.fn(),
      updateReaction: jest.fn(),
      deleteReaction: jest.fn(),
      getPostReactions: jest.fn(),
      getPostReactionCounts: jest.fn(),
      getCommentReactions: jest.fn(),
      getCommentReactionCounts: jest.fn(),
    };

    const mockPostsRepository = {
      findById: jest.fn(),
      updateLikeCount: jest.fn(),
    };

    const mockReputationService = {
      onPostLiked: jest.fn(),
      onPostUnliked: jest.fn(),
      onReceivedLike: jest.fn(),
    };

    const mockNotificationsService = {
      notifyPostLiked: jest.fn(),
    };

    const mockProfilesRepository = {
      findByUserId: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue("OK"),
      del: jest.fn().mockResolvedValue(1),
      getOrSet: jest.fn().mockImplementation((key, fn) => fn()),
    };

    const mockCacheInvalidationService = {
      onReactionChanged: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReactionsService,
        {
          provide: ReactionsRepository,
          useValue: mockReactionsRepository,
        },
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
          provide: ProfilesRepository,
          useValue: mockProfilesRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: CacheInvalidationService,
          useValue: mockCacheInvalidationService,
        },
      ],
    }).compile();

    service = module.get<ReactionsService>(ReactionsService);
    reactionsRepository = module.get(ReactionsRepository);
    postsRepository = module.get(PostsRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("reactToPost", () => {
    it("should add a reaction to a post successfully", async () => {
      // Arrange
      const userId = "user-1";
      const postId = "post-1";
      const reactionType = ReactionType.LIKE;

      postsRepository.findById.mockResolvedValue(mockPost as any);
      reactionsRepository.findPostReaction.mockResolvedValue(null);
      reactionsRepository.createPostReaction.mockResolvedValue(
        mockReaction as any,
      );
      postsRepository.updateLikeCount.mockResolvedValue(undefined);

      // Act
      const result = await service.reactToPost(userId, postId, reactionType);

      // Assert
      expect(postsRepository.findById).toHaveBeenCalledWith(postId);
      expect(reactionsRepository.findPostReaction).toHaveBeenCalledWith(
        userId,
        postId,
      );
      expect(reactionsRepository.createPostReaction).toHaveBeenCalledWith(
        userId,
        postId,
        reactionType,
      );
      expect(postsRepository.updateLikeCount).toHaveBeenCalledWith(postId, 1);
      expect(result).toEqual(mockReaction);
    });

    it("should throw BadRequestException when post does not exist", async () => {
      // Arrange
      const userId = "user-1";
      const postId = "non-existent";
      const reactionType = ReactionType.LIKE;

      postsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.reactToPost(userId, postId, reactionType),
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw ForbiddenException when user tries to react to own post", async () => {
      // Arrange
      const userId = "author-1";
      const postId = "post-1";
      const reactionType = ReactionType.LIKE;

      postsRepository.findById.mockResolvedValue(mockPost as any);

      // Act & Assert
      await expect(
        service.reactToPost(userId, postId, reactionType),
      ).rejects.toThrow(ForbiddenException);
    });

    it("should change reaction type if already reacted", async () => {
      // Arrange
      const userId = "user-1";
      const postId = "post-1";
      const newReactionType = ReactionType.LOVE;
      const existingReaction = {
        ...mockReaction,
        reactionType: ReactionType.LIKE,
      };
      const updatedReaction = {
        ...mockReaction,
        reactionType: newReactionType,
      };

      postsRepository.findById.mockResolvedValue(mockPost as any);
      reactionsRepository.findPostReaction.mockResolvedValue(
        existingReaction as any,
      );
      reactionsRepository.updateReaction.mockResolvedValue(
        updatedReaction as any,
      );

      // Act
      const result = await service.reactToPost(userId, postId, newReactionType);

      // Assert
      expect(reactionsRepository.updateReaction).toHaveBeenCalledWith(
        existingReaction.id,
        newReactionType,
      );
      expect(result).toEqual(updatedReaction);
    });

    it("should return existing reaction if same type", async () => {
      // Arrange
      const userId = "user-1";
      const postId = "post-1";
      const reactionType = ReactionType.LIKE;

      postsRepository.findById.mockResolvedValue(mockPost as any);
      reactionsRepository.findPostReaction.mockResolvedValue(
        mockReaction as any,
      );

      // Act
      const result = await service.reactToPost(userId, postId, reactionType);

      // Assert
      expect(reactionsRepository.updateReaction).not.toHaveBeenCalled();
      expect(result).toEqual(mockReaction);
    });
  });

  describe("removePostReaction", () => {
    it("should remove a reaction from a post successfully", async () => {
      // Arrange
      const userId = "user-1";
      const postId = "post-1";

      reactionsRepository.findPostReaction.mockResolvedValue(
        mockReaction as any,
      );
      reactionsRepository.deleteReaction.mockResolvedValue(undefined);
      postsRepository.updateLikeCount.mockResolvedValue(undefined);

      // Act
      const result = await service.removePostReaction(userId, postId);

      // Assert
      expect(reactionsRepository.findPostReaction).toHaveBeenCalledWith(
        userId,
        postId,
      );
      expect(reactionsRepository.deleteReaction).toHaveBeenCalledWith(
        mockReaction.id,
      );
      expect(postsRepository.updateLikeCount).toHaveBeenCalledWith(postId, -1);
      expect(result).toEqual({ success: true });
    });

    it("should throw BadRequestException when reaction does not exist", async () => {
      // Arrange
      const userId = "user-1";
      const postId = "post-1";

      reactionsRepository.findPostReaction.mockResolvedValue(null);

      // Act & Assert
      await expect(service.removePostReaction(userId, postId)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe("reactToComment", () => {
    it("should add a reaction to a comment successfully", async () => {
      // Arrange
      const userId = "user-1";
      const commentId = "comment-1";
      const reactionType = ReactionType.LIKE;
      const commentReaction = { ...mockReaction, postId: null, commentId };

      reactionsRepository.findCommentReaction.mockResolvedValue(null);
      reactionsRepository.createCommentReaction.mockResolvedValue(
        commentReaction as any,
      );

      // Act
      const result = await service.reactToComment(
        userId,
        commentId,
        reactionType,
      );

      // Assert
      expect(reactionsRepository.findCommentReaction).toHaveBeenCalledWith(
        userId,
        commentId,
      );
      expect(reactionsRepository.createCommentReaction).toHaveBeenCalledWith(
        userId,
        commentId,
        reactionType,
      );
      expect(result).toEqual(commentReaction);
    });

    it("should change reaction type on comment if already reacted", async () => {
      // Arrange
      const userId = "user-1";
      const commentId = "comment-1";
      const newReactionType = ReactionType.LOVE;
      const existingReaction = {
        ...mockReaction,
        postId: null,
        commentId,
        reactionType: ReactionType.LIKE,
      };
      const updatedReaction = {
        ...existingReaction,
        reactionType: newReactionType,
      };

      reactionsRepository.findCommentReaction.mockResolvedValue(
        existingReaction as any,
      );
      reactionsRepository.updateReaction.mockResolvedValue(
        updatedReaction as any,
      );

      // Act
      const result = await service.reactToComment(
        userId,
        commentId,
        newReactionType,
      );

      // Assert
      expect(reactionsRepository.updateReaction).toHaveBeenCalledWith(
        existingReaction.id,
        newReactionType,
      );
      expect(result).toEqual(updatedReaction);
    });
  });

  describe("removeCommentReaction", () => {
    it("should remove a reaction from a comment successfully", async () => {
      // Arrange
      const userId = "user-1";
      const commentId = "comment-1";
      const commentReaction = { ...mockReaction, postId: null, commentId };

      reactionsRepository.findCommentReaction.mockResolvedValue(
        commentReaction as any,
      );
      reactionsRepository.deleteReaction.mockResolvedValue(undefined);

      // Act
      const result = await service.removeCommentReaction(userId, commentId);

      // Assert
      expect(reactionsRepository.findCommentReaction).toHaveBeenCalledWith(
        userId,
        commentId,
      );
      expect(reactionsRepository.deleteReaction).toHaveBeenCalledWith(
        commentReaction.id,
      );
      expect(result).toEqual({ success: true });
    });

    it("should throw BadRequestException when comment reaction does not exist", async () => {
      // Arrange
      const userId = "user-1";
      const commentId = "comment-1";

      reactionsRepository.findCommentReaction.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.removeCommentReaction(userId, commentId),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("getPostReactions", () => {
    it("should get post reactions with counts", async () => {
      // Arrange
      const postId = "post-1";
      const reactions = [mockReaction];
      const counts = { LIKE: 5, LOVE: 2 };

      reactionsRepository.getPostReactions.mockResolvedValue(reactions as any);
      reactionsRepository.getPostReactionCounts.mockResolvedValue(
        counts as any,
      );

      // Act
      const result = await service.getPostReactions(postId);

      // Assert
      expect(reactionsRepository.getPostReactions).toHaveBeenCalledWith(postId);
      expect(reactionsRepository.getPostReactionCounts).toHaveBeenCalledWith(
        postId,
      );
      expect(result).toEqual({ reactions, counts });
    });
  });
});
