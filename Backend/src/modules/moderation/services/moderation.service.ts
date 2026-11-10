import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { PostsRepository } from "../../posts/repositories/posts.repository";
import { ModeratePostDto } from "../dto/moderation.dto";
import { PostStatus, Prisma } from "@prisma/client";
import { PaginatedResult } from "../../../common/dto/pagination.dto";
import { ReputationService } from "../../reputation/services/reputation.service";
import { NotificationsService } from "../../notifications/services/notifications.service";

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private postsRepository: PostsRepository,
    @InjectQueue("post-publish") private postPublishQueue: Queue,
    private reputationService: ReputationService,
    private notificationsService: NotificationsService,
  ) {}

  async getPendingPosts(page: number, limit: number) {
    const { posts, total } = await this.postsRepository.findPendingPosts({
      skip: (page - 1) * limit,
      take: limit,
    });

    return new PaginatedResult(posts, page, limit, total);
  }

  async moderatePost(
    postId: string,
    moderatorId: string,
    dto: ModeratePostDto,
  ) {
    this.logger.log(`Moderating post ${postId} by moderator ${moderatorId}`);

    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new NotFoundException("Bài viết không tồn tại");
    }

    if (post.status !== PostStatus.PENDING) {
      throw new ForbiddenException("Bài viết này không ở trạng thái chờ duyệt");
    }

    const updateData: Prisma.PostUpdateInput = {
      status: dto.status,
    };

    if (dto.status === PostStatus.PUBLISHED) {
      updateData.publishAt = new Date();
    }

    if (dto.status === PostStatus.REJECTED && dto.reason) {
      // Store rejection reason - could be in a separate table or as metadata
      this.logger.log(`Post ${postId} rejected. Reason: ${dto.reason}`);

      // Award negative karma for rejection
      await this.reputationService.onPostRejected(
        post.authorId,
        postId,
        dto.reason,
      );

      // Send notification to post author
      await this.notificationsService.notifyPostRejected(
        post.authorId,
        postId,
        post.content,
        dto.reason,
      );
    }

    const updatedPost = await this.postsRepository.update(postId, updateData);

    this.logger.log(`Post ${postId} moderated to status ${dto.status}`);
    return updatedPost;
  }

  async approvePost(postId: string, moderatorId: string) {
    this.logger.log(`Approving post ${postId} by moderator ${moderatorId}`);

    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new NotFoundException("Bài viết không tồn tại");
    }

    if (post.status !== PostStatus.PENDING) {
      throw new ForbiddenException("Bài viết này không ở trạng thái chờ duyệt");
    }

    // Calculate random delay between 3-7 days (per spec US-04)
    const minDays = 3;
    const maxDays = 7;
    const randomDays =
      Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
    const publishAt = new Date();
    publishAt.setDate(publishAt.getDate() + randomDays);

    const updatedPost = await this.postsRepository.update(postId, {
      status: PostStatus.APPROVED,
      publishAt: publishAt,
      moderatorId: moderatorId,
    });

    // Add job to queue for scheduled publishing
    const delayMs = publishAt.getTime() - Date.now();
    await this.postPublishQueue.add(
      "publish-post",
      { postId: updatedPost.id },
      { delay: delayMs },
    );

    // Award karma for post approval
    await this.reputationService.onPostApproved(post.authorId, postId);

    // Send notification to post author
    await this.notificationsService.notifyPostApproved(
      post.authorId,
      postId,
      post.content,
    );

    this.logger.log(
      `Post ${postId} approved. Scheduled for publication in ${randomDays} days at ${publishAt.toISOString()}`,
    );

    return updatedPost;
  }

  async rejectPost(postId: string, moderatorId: string, reason?: string) {
    return this.moderatePost(postId, moderatorId, {
      status: PostStatus.REJECTED,
      reason,
    });
  }

  async getModerationStats() {
    // This would be expanded with more detailed stats
    const pendingCount = await this.postsRepository.findPendingPosts({
      skip: 0,
      take: 1,
    });
    return {
      pendingCount: pendingCount.total,
    };
  }
}
