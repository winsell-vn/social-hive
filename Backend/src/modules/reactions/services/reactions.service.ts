import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { ReactionsRepository } from "../repositories/reactions.repository";
import { PostsRepository } from "../../posts/repositories/posts.repository";
import { ReactionType } from "@prisma/client";
import { ReputationService } from "../../reputation/services/reputation.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { ProfilesRepository } from "../../profiles/repositories/profiles.repository";
import { RedisService } from "../../../redis/redis.service";
import { CacheInvalidationService } from "../../../redis/cache-invalidation.service";
import { CACHE_KEYS, CACHE_TTL } from "../../../redis/cache-keys";

@Injectable()
export class ReactionsService {
  private readonly logger = new Logger(ReactionsService.name);

  constructor(
    private reactionsRepository: ReactionsRepository,
    private postsRepository: PostsRepository,
    private reputationService: ReputationService,
    private notificationsService: NotificationsService,
    private profilesRepository: ProfilesRepository,
    private readonly redisService: RedisService,
    private readonly cacheInvalidationService: CacheInvalidationService,
  ) {}

  async reactToPost(
    userId: string,
    postId: string,
    reactionType: ReactionType,
  ) {
    // Check if post exists
    const post = await this.postsRepository.findById(postId);
    if (!post) {
      throw new BadRequestException("Bài viết không tồn tại");
    }

    // Prevent self-liking
    if (post.authorId === userId) {
      throw new ForbiddenException("Không thể tự thích bài viết của mình");
    }

    // Check if already reacted
    const existingReaction = await this.reactionsRepository.findPostReaction(
      userId,
      postId,
    );

    if (existingReaction) {
      // Update reaction type if different
      if (existingReaction.reactionType !== reactionType) {
        return this.reactionsRepository.updateReaction(
          existingReaction.id,
          reactionType,
        );
      }
      return existingReaction;
    }

    // Create new reaction
    const reaction = await this.reactionsRepository.createPostReaction(
      userId,
      postId,
      reactionType,
    );

    // Update post like count
    await this.postsRepository.updateLikeCount(postId, 1);

    // Award karma to post author for receiving a like
    if (reactionType === ReactionType.LIKE) {
      await this.reputationService.onReceivedLike(
        post.authorId,
        postId,
        userId,
      );
    }

    // Send notification to post author
    const [actorProfile, postAuthorProfile] = await Promise.all([
      this.profilesRepository.findByUserId(userId),
      this.profilesRepository.findByUserId(post.authorId),
    ]);
    if (actorProfile) {
      await this.notificationsService.notifyPostLiked(
        post.authorId,
        userId,
        actorProfile.username,
        actorProfile.displayName || actorProfile.username,
        actorProfile.avatar,
        postId,
        reactionType,
        postAuthorProfile?.username ?? '',
      );
    }

    // Invalidate reaction counts cache
    await this.cacheInvalidationService.onReactionChanged(postId);

    this.logger.log(
      `User ${userId} reacted to post ${postId} with ${reactionType}`,
    );
    return reaction;
  }

  async removePostReaction(userId: string, postId: string) {
    const existingReaction = await this.reactionsRepository.findPostReaction(
      userId,
      postId,
    );

    if (!existingReaction) {
      throw new BadRequestException("Bạn chưa thích bài viết này");
    }

    await this.reactionsRepository.deleteReaction(existingReaction.id);
    await this.postsRepository.updateLikeCount(postId, -1);

    // Invalidate reaction counts cache
    await this.cacheInvalidationService.onReactionChanged(postId);

    this.logger.log(`User ${userId} removed reaction from post ${postId}`);
    return { success: true };
  }

  async reactToComment(
    userId: string,
    commentId: string,
    reactionType: ReactionType,
  ) {
    // Check if already reacted
    const existingReaction = await this.reactionsRepository.findCommentReaction(
      userId,
      commentId,
    );

    if (existingReaction) {
      if (existingReaction.reactionType !== reactionType) {
        return this.reactionsRepository.updateReaction(
          existingReaction.id,
          reactionType,
        );
      }
      return existingReaction;
    }

    // Create new reaction
    const reaction = await this.reactionsRepository.createCommentReaction(
      userId,
      commentId,
      reactionType,
    );

    this.logger.log(
      `User ${userId} reacted to comment ${commentId} with ${reactionType}`,
    );
    return reaction;
  }

  async removeCommentReaction(userId: string, commentId: string) {
    const existingReaction = await this.reactionsRepository.findCommentReaction(
      userId,
      commentId,
    );

    if (!existingReaction) {
      throw new BadRequestException("Bạn chưa thích bình luận này");
    }

    await this.reactionsRepository.deleteReaction(existingReaction.id);
    this.logger.log(
      `User ${userId} removed reaction from comment ${commentId}`,
    );
    return { success: true };
  }

  async getPostReactions(postId: string) {
    const cacheKey = CACHE_KEYS.POST_REACTION_COUNTS(postId);

    const [reactions, counts] = await Promise.all([
      this.reactionsRepository.getPostReactions(postId),
      this.redisService.getOrSet(
        cacheKey,
        () => this.reactionsRepository.getPostReactionCounts(postId),
        CACHE_TTL.REACTION_COUNTS,
      ),
    ]);

    return { reactions, counts };
  }

  async getCommentReactions(commentId: string) {
    const [reactions, counts] = await Promise.all([
      this.reactionsRepository.getCommentReactions(commentId),
      this.reactionsRepository.getCommentReactionCounts(commentId),
    ]);

    return { reactions, counts };
  }

  async getUserPostReaction(userId: string, postId: string) {
    return this.reactionsRepository.getUserReactionOnPost(userId, postId);
  }

  async getUserCommentReaction(userId: string, commentId: string) {
    return this.reactionsRepository.getUserReactionOnComment(userId, commentId);
  }

  async getUserReactionsOnPosts(userId: string, postIds: string[]) {
    const reactions = await this.reactionsRepository.getUserReactionsOnPosts(
      userId,
      postIds,
    );
    // Return as a map of postId -> reaction for easy lookup
    const reactionsMap: Record<
      string,
      { id: string; reactionType: string; userId: string; postId: string }
    > = {};
    for (const reaction of reactions) {
      if (reaction.postId) {
        reactionsMap[reaction.postId] = {
          id: reaction.id,
          reactionType: reaction.reactionType,
          userId: reaction.userId,
          postId: reaction.postId,
        };
      }
    }
    return reactionsMap;
  }
}
