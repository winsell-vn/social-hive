import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from "@nestjs/common";
import { CommentsRepository } from "../repositories/comments.repository";
import { PostsRepository } from "../../posts/repositories/posts.repository";
import { CreateCommentDto, UpdateCommentDto } from "../dto/comment.dto";
import { PaginatedResult } from "../../../common/dto/pagination.dto";
import { ReputationService } from "../../reputation/services/reputation.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { ProfilesRepository } from "../../profiles/repositories/profiles.repository";

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private commentsRepository: CommentsRepository,
    private postsRepository: PostsRepository,
    private reputationService: ReputationService,
    private notificationsService: NotificationsService,
    private profilesRepository: ProfilesRepository,
  ) {}

  async create(authorId: string, postId: string, dto: CreateCommentDto) {
    this.logger.log(`Creating comment on post ${postId} by user ${authorId}`);

    // Verify post exists
    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new NotFoundException("Bài viết không tồn tại");
    }

    // If replying to a comment, verify parent exists
    let parentComment: { id: string; authorId: string } | null = null;
    if (dto.parentId) {
      const parent = await this.commentsRepository.findById(dto.parentId);
      if (!parent) {
        throw new NotFoundException("Bình luận gốc không tồn tại");
      }
      // Ensure parent is on the same post
      if (parent.postId !== postId) {
        throw new ForbiddenException("Bình luận không thuộc bài viết này");
      }
      parentComment = parent;
    } else {
      // For top-level comments only: check if user already commented on this post
      // This prevents duplicate top-level comments (AC-055)
      // Note: Replies (parentId != null) are allowed freely (AC-056)
      const existingComment = await this.commentsRepository.findByAuthorAndPost(
        authorId,
        postId,
      );
      if (existingComment) {
        this.logger.warn(
          `User ${authorId} already has a top-level comment on post ${postId}`,
        );
        // Return existing comment instead of throwing error (graceful handling)
        return this.commentsRepository.findByIdWithAuthor(existingComment.id);
      }
    }

    try {
      const comment = await this.commentsRepository.create({
        content: dto.content,
        author: { connect: { id: authorId } },
        post: { connect: { id: postId } },
        parent: dto.parentId ? { connect: { id: dto.parentId } } : undefined,
      });

      // Update post comment count
      await this.postsRepository.updateCommentCount(postId, 1);

      // Award karma to post author for receiving a comment
      await this.reputationService.onCommentReceived(
        post.authorId,
        postId,
        comment.id,
        authorId,
      );

      // Send notifications
      const [actorProfile, postAuthorProfile] = await Promise.all([
        this.profilesRepository.findByUserId(authorId),
        this.profilesRepository.findByUserId(post.authorId),
      ]);
      if (actorProfile) {
        const actorUsername = actorProfile.username;
        const actorName = actorProfile.displayName || actorProfile.username;
        const actorAvatar = actorProfile.avatar;
        const postAuthorUsername = postAuthorProfile?.username ?? '';

        // If this is a reply, notify the parent comment author
        if (parentComment && parentComment.authorId !== authorId) {
          await this.notificationsService.notifyCommentReplied(
            parentComment.authorId,
            authorId,
            actorUsername,
            actorName,
            actorAvatar,
            postId,
            comment.id,
            dto.content,
            postAuthorUsername,
          );
        }

        // Notify post author about the comment (if not replying to themselves)
        if (
          post.authorId !== authorId &&
          (!parentComment || parentComment.authorId !== post.authorId)
        ) {
          await this.notificationsService.notifyPostCommented(
            post.authorId,
            authorId,
            actorUsername,
            actorName,
            actorAvatar,
            postId,
            comment.id,
            dto.content,
            postAuthorUsername,
          );
        }
      }

      this.logger.log(`Comment ${comment.id} created`);
      return this.commentsRepository.findByIdWithAuthor(comment.id);
    } catch (error) {
      // Handle unique constraint violation (Prisma error code P2002)
      if (error.code === "P2002") {
        this.logger.warn(
          `Duplicate comment attempt by ${authorId} on post ${postId}`,
        );
        // Find and return existing comment instead of throwing error
        const existing = await this.commentsRepository.findByAuthorAndPost(
          authorId,
          postId,
          dto.parentId || null,
        );
        if (existing) {
          return this.commentsRepository.findByIdWithAuthor(existing.id);
        }
      }
      throw error;
    }
  }

  async getPostComments(postId: string, page: number, limit: number) {
    const { comments, total } = await this.commentsRepository.findByPostId(
      postId,
      (page - 1) * limit,
      limit,
    );

    return new PaginatedResult(comments, page, limit, total);
  }

  async getReplies(commentId: string, page: number, limit: number) {
    const { replies, total } = await this.commentsRepository.findReplies(
      commentId,
      (page - 1) * limit,
      limit,
    );

    return new PaginatedResult(replies, page, limit, total);
  }

  async update(id: string, userId: string, dto: UpdateCommentDto) {
    const comment = await this.commentsRepository.findById(id);
    if (!comment) {
      throw new NotFoundException("Bình luận không tồn tại");
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException(
        "Bạn không có quyền chỉnh sửa bình luận này",
      );
    }

    await this.commentsRepository.update(id, { content: dto.content });
    return this.commentsRepository.findByIdWithAuthor(id);
  }

  async delete(id: string, userId: string, isAdmin = false) {
    const comment = await this.commentsRepository.findById(id);
    if (!comment) {
      throw new NotFoundException("Bình luận không tồn tại");
    }

    if (comment.authorId !== userId && !isAdmin) {
      throw new ForbiddenException("Bạn không có quyền xóa bình luận này");
    }

    await this.commentsRepository.delete(id);
    await this.postsRepository.updateCommentCount(comment.postId, -1);

    this.logger.log(`Comment ${id} deleted by user ${userId}`);
    return { success: true };
  }
}
