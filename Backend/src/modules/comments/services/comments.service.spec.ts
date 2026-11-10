import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { CommentsService } from "./comments.service";
import { CommentsRepository } from "../repositories/comments.repository";
import { PostsRepository } from "../../posts/repositories/posts.repository";
import { ReputationService } from "../../reputation/services/reputation.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { ProfilesRepository } from "../../profiles/repositories/profiles.repository";
import { CreateCommentDto, UpdateCommentDto } from "../dto/comment.dto";

describe("CommentsService", () => {
  let service: CommentsService;
  let commentsRepository: jest.Mocked<CommentsRepository>;
  let postsRepository: jest.Mocked<PostsRepository>;

  const mockComment = {
    id: "comment-1",
    postId: "post-1",
    authorId: "user-1",
    content: "Test comment",
    parentId: null,
    likeCount: 0,
    depth: 0,
    editedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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
        jobTitle: null,
        company: null,
        expertise: null,
        credentials: null,
        isVerifiedExpert: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    _count: { likes: 0 },
  };

  const mockPost = {
    id: "post-1",
    authorId: "user-1",
    content: "Test post",
    status: "PUBLISHED",
  };

  beforeEach(async () => {
    const mockCommentsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByIdWithAuthor: jest.fn(),
      findByPostId: jest.fn(),
      findReplies: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByAuthorAndPost: jest.fn(),
    };

    const mockPostsRepository = {
      findById: jest.fn(),
      updateCommentCount: jest.fn(),
    };

    const mockReputationService = {
      onCommentCreated: jest.fn(),
      onCommentReceived: jest.fn(),
    };

    const mockNotificationsService = {
      notifyComment: jest.fn(),
    };

    const mockProfilesRepository = {
      findByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: CommentsRepository,
          useValue: mockCommentsRepository,
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
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
    commentsRepository = module.get(CommentsRepository);
    postsRepository = module.get(PostsRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a comment successfully", async () => {
      // Arrange
      const authorId = "user-1";
      const postId = "post-1";
      const dto: CreateCommentDto = { content: "Test comment" };
      const commentWithAuthor = { ...mockComment, author: { id: authorId } };

      postsRepository.findById.mockResolvedValue(mockPost as any);
      commentsRepository.create.mockResolvedValue(mockComment as any);
      commentsRepository.findByIdWithAuthor.mockResolvedValue(
        commentWithAuthor as any,
      );
      postsRepository.updateCommentCount.mockResolvedValue(undefined);

      // Act
      const result = await service.create(authorId, postId, dto);

      // Assert
      expect(postsRepository.findById).toHaveBeenCalledWith(postId);
      expect(commentsRepository.create).toHaveBeenCalledWith({
        content: dto.content,
        author: { connect: { id: authorId } },
        post: { connect: { id: postId } },
        parent: undefined,
      });
      expect(postsRepository.updateCommentCount).toHaveBeenCalledWith(
        postId,
        1,
      );
      expect(result).toEqual(commentWithAuthor);
    });

    it("should throw NotFoundException when post does not exist", async () => {
      // Arrange
      const authorId = "user-1";
      const postId = "non-existent-post";
      const dto: CreateCommentDto = { content: "Test comment" };

      postsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(authorId, postId, dto)).rejects.toThrow(
        NotFoundException,
      );
      expect(postsRepository.findById).toHaveBeenCalledWith(postId);
    });

    it("should create a reply to a parent comment", async () => {
      // Arrange
      const authorId = "user-1";
      const postId = "post-1";
      const parentId = "parent-comment-1";
      const dto: CreateCommentDto = { content: "Reply comment", parentId };
      const parentComment = { ...mockComment, id: parentId, postId };
      const replyComment = { ...mockComment, id: "reply-1", parentId };

      postsRepository.findById.mockResolvedValue(mockPost as any);
      commentsRepository.findById.mockResolvedValue(parentComment as any);
      commentsRepository.create.mockResolvedValue(replyComment as any);
      commentsRepository.findByIdWithAuthor.mockResolvedValue(
        replyComment as any,
      );
      postsRepository.updateCommentCount.mockResolvedValue(undefined);

      // Act
      const result = await service.create(authorId, postId, dto);

      // Assert
      expect(commentsRepository.findById).toHaveBeenCalledWith(parentId);
      expect(commentsRepository.create).toHaveBeenCalledWith({
        content: dto.content,
        author: { connect: { id: authorId } },
        post: { connect: { id: postId } },
        parent: { connect: { id: parentId } },
      });
      expect(result).toEqual(replyComment);
    });

    it("should throw NotFoundException when parent comment does not exist", async () => {
      // Arrange
      const authorId = "user-1";
      const postId = "post-1";
      const dto: CreateCommentDto = {
        content: "Reply",
        parentId: "non-existent-parent",
      };

      postsRepository.findById.mockResolvedValue(mockPost as any);
      commentsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.create(authorId, postId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("getReplies", () => {
    it("should get replies for a comment", async () => {
      // Arrange
      const commentId = "comment-1";
      const page = 1;
      const limit = 10;
      const replies = [
        { ...mockComment, id: "reply-1", parentId: commentId },
        { ...mockComment, id: "reply-2", parentId: commentId },
      ];

      commentsRepository.findReplies.mockResolvedValue({ replies, total: 2 });

      // Act
      const result = await service.getReplies(commentId, page, limit);

      // Assert
      expect(commentsRepository.findReplies).toHaveBeenCalledWith(
        commentId,
        0,
        limit,
      );
      expect(result.data).toEqual(replies);
      expect(result.meta.total).toBe(2);
    });
  });

  describe("update", () => {
    it("should update a comment successfully", async () => {
      // Arrange
      const commentId = "comment-1";
      const userId = "user-1";
      const dto: UpdateCommentDto = { content: "Updated content" };
      const updatedComment = { ...mockComment, content: dto.content };

      commentsRepository.findById.mockResolvedValue(mockComment as any);
      commentsRepository.update.mockResolvedValue(updatedComment as any);
      commentsRepository.findByIdWithAuthor.mockResolvedValue(
        updatedComment as any,
      );

      // Act
      const result = await service.update(commentId, userId, dto);

      // Assert
      expect(commentsRepository.findById).toHaveBeenCalledWith(commentId);
      expect(commentsRepository.update).toHaveBeenCalledWith(commentId, {
        content: dto.content,
      });
      expect(result).toEqual(updatedComment);
    });

    it("should throw NotFoundException when comment does not exist", async () => {
      // Arrange
      const commentId = "non-existent";
      const userId = "user-1";
      const dto: UpdateCommentDto = { content: "Updated" };

      commentsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.update(commentId, userId, dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ForbiddenException when user is not the author", async () => {
      // Arrange
      const commentId = "comment-1";
      const userId = "user-2";
      const dto: UpdateCommentDto = { content: "Updated" };

      commentsRepository.findById.mockResolvedValue(mockComment as any);

      // Act & Assert
      await expect(service.update(commentId, userId, dto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("delete", () => {
    it("should delete a comment successfully by author", async () => {
      // Arrange
      const commentId = "comment-1";
      const userId = "user-1";
      const isAdmin = false;

      commentsRepository.findById.mockResolvedValue(mockComment as any);
      commentsRepository.delete.mockResolvedValue(undefined);
      postsRepository.updateCommentCount.mockResolvedValue(undefined);

      // Act
      const result = await service.delete(commentId, userId, isAdmin);

      // Assert
      expect(commentsRepository.findById).toHaveBeenCalledWith(commentId);
      expect(commentsRepository.delete).toHaveBeenCalledWith(commentId);
      expect(postsRepository.updateCommentCount).toHaveBeenCalledWith(
        mockComment.postId,
        -1,
      );
      expect(result).toEqual({ success: true });
    });

    it("should delete a comment successfully by admin", async () => {
      // Arrange
      const commentId = "comment-1";
      const userId = "admin-user";
      const isAdmin = true;

      commentsRepository.findById.mockResolvedValue(mockComment as any);
      commentsRepository.delete.mockResolvedValue(undefined);
      postsRepository.updateCommentCount.mockResolvedValue(undefined);

      // Act
      const result = await service.delete(commentId, userId, isAdmin);

      // Assert
      expect(commentsRepository.delete).toHaveBeenCalledWith(commentId);
      expect(result).toEqual({ success: true });
    });

    it("should throw NotFoundException when comment does not exist", async () => {
      // Arrange
      const commentId = "non-existent";
      const userId = "user-1";
      const isAdmin = false;

      commentsRepository.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete(commentId, userId, isAdmin)).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should throw ForbiddenException when user is not author or admin", async () => {
      // Arrange
      const commentId = "comment-1";
      const userId = "user-2";
      const isAdmin = false;

      commentsRepository.findById.mockResolvedValue(mockComment as any);

      // Act & Assert
      await expect(service.delete(commentId, userId, isAdmin)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
