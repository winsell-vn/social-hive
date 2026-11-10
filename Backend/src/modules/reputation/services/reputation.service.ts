import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Tier } from "@prisma/client";
import { ReputationRepository } from "../repositories/reputation.repository";
import {
  KARMA_ACTIONS,
  TIER_THRESHOLDS,
  KARMA_LIMITS,
  LIKE_MILESTONES,
  KarmaActionType,
} from "../constants/karma-actions";
import {
  UserReputationResponse,
  TiersResponse,
  TierDefinition,
} from "../dto/reputation.dto";
import { PaginatedResult } from "../../../common/dto/pagination.dto";

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(private reputationRepository: ReputationRepository) {}

  /**
   * Calculate tier based on karma points
   */
  calculateTier(karma: number): Tier {
    if (karma >= TIER_THRESHOLDS.LEGEND.min) return Tier.LEGEND;
    if (karma >= TIER_THRESHOLDS.MASTER.min) return Tier.MASTER;
    if (karma >= TIER_THRESHOLDS.EXPERT.min) return Tier.EXPERT;
    if (karma >= TIER_THRESHOLDS.CONTRIBUTOR.min) return Tier.CONTRIBUTOR;
    return Tier.NEWCOMER;
  }

  /**
   * Award karma to a user with transaction logging
   */
  async awardKarma(
    userId: string,
    action: KarmaActionType,
    points: number,
    metadata?: Record<string, unknown>,
  ): Promise<{ newKarma: number; newTier: Tier }> {
    const user = await this.reputationRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Calculate new karma (floor at 0)
    const newKarma = Math.max(0, user.karma + points);
    const newTier = this.calculateTier(newKarma);

    // Log transaction
    await this.reputationRepository.createTransaction(
      userId,
      action,
      points,
      metadata,
    );

    // Update user karma and tier
    await this.reputationRepository.setUserKarma(userId, newKarma, newTier);

    this.logger.log(
      `Awarded ${points} karma to user ${userId} for ${action}. New karma: ${newKarma}, tier: ${newTier}`,
    );

    return { newKarma, newTier };
  }

  /**
   * Award karma for post approval
   */
  async onPostApproved(userId: string, postId: string) {
    return this.awardKarma(
      userId,
      KarmaActionType.POST_APPROVED,
      KARMA_ACTIONS.POST_APPROVED,
      {
        postId,
      },
    );
  }

  /**
   * Deduct karma for post rejection
   */
  async onPostRejected(userId: string, postId: string, reason?: string) {
    return this.awardKarma(
      userId,
      KarmaActionType.POST_REJECTED,
      KARMA_ACTIONS.POST_REJECTED,
      {
        postId,
        reason,
      },
    );
  }

  /**
   * Award karma when user receives a like on their post
   */
  async onReceivedLike(postAuthorId: string, postId: string, likerId: string) {
    // Check daily limit
    const todayLikeKarma =
      await this.reputationRepository.getTodayLikeKarma(postAuthorId);
    if (todayLikeKarma >= KARMA_LIMITS.MAX_DAILY_LIKE_KARMA) {
      this.logger.log(
        `User ${postAuthorId} has reached daily like karma limit`,
      );
      return null;
    }

    // Award base like karma
    await this.awardKarma(
      postAuthorId,
      KarmaActionType.RECEIVED_LIKE,
      KARMA_ACTIONS.RECEIVED_LIKE,
      {
        postId,
        likerId,
      },
    );

    // Check for milestone bonuses
    await this.checkLikeMilestones(postAuthorId, postId);
  }

  /**
   * Check and award like milestone bonuses
   */
  async checkLikeMilestones(postAuthorId: string, postId: string) {
    const likeCount = await this.reputationRepository.getPostLikeCount(postId);

    for (const milestone of LIKE_MILESTONES) {
      if (likeCount >= milestone.threshold) {
        const hasBonus =
          await this.reputationRepository.hasReceivedMilestoneBonus(
            postAuthorId,
            postId,
            milestone.threshold,
          );

        if (!hasBonus) {
          await this.awardKarma(
            postAuthorId,
            KarmaActionType.LIKE_MILESTONE,
            milestone.bonus,
            { postId, milestone: milestone.threshold, likeCount },
          );
          this.logger.log(
            `Awarded ${milestone.bonus} milestone bonus to user ${postAuthorId} for ${milestone.threshold} likes on post ${postId}`,
          );
        }
      }
    }
  }

  /**
   * Award karma when user receives a comment on their post
   */
  async onCommentReceived(
    postAuthorId: string,
    postId: string,
    commentId: string,
    commenterId: string,
  ) {
    // Don't award karma for self-comments
    if (postAuthorId === commenterId) {
      return null;
    }

    return this.awardKarma(
      postAuthorId,
      KarmaActionType.COMMENT_RECEIVED,
      KARMA_ACTIONS.COMMENT_RECEIVED,
      { postId, commentId, commenterId },
    );
  }

  /**
   * Award daily login karma
   */
  async onDailyLogin(userId: string) {
    const todayLoginCount =
      await this.reputationRepository.getTodayLoginKarma(userId);
    if (todayLoginCount >= KARMA_LIMITS.MAX_DAILY_LOGIN_KARMA) {
      return null;
    }

    return this.awardKarma(
      userId,
      KarmaActionType.DAILY_LOGIN,
      KARMA_ACTIONS.DAILY_LOGIN,
      {},
    );
  }

  /**
   * Deduct karma for spam deletion
   */
  async onSpamDeleted(userId: string, postId: string) {
    return this.awardKarma(
      userId,
      KarmaActionType.SPAM_DELETED,
      KARMA_ACTIONS.SPAM_DELETED,
      {
        postId,
      },
    );
  }

  /**
   * Get user's current reputation info
   */
  async getUserReputation(userId: string): Promise<UserReputationResponse> {
    const user = await this.reputationRepository.getUserById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    const tierConfig = TIER_THRESHOLDS[user.tier];
    const todayLikeKarma =
      await this.reputationRepository.getTodayLikeKarma(userId);

    // Calculate progress to next tier
    let progress = 100;
    if (user.tier !== Tier.LEGEND) {
      const currentMin = tierConfig.min;
      const currentMax = tierConfig.max;
      progress = Math.min(
        100,
        Math.round(
          ((user.karma - currentMin) / (currentMax - currentMin + 1)) * 100,
        ),
      );
    }

    return {
      karma: user.karma,
      tier: user.tier,
      tierInfo: {
        icon: tierConfig.icon,
        label: tierConfig.label,
        multiplier: tierConfig.multiplier,
        minKarma: tierConfig.min,
        maxKarma: tierConfig.max === Infinity ? -1 : tierConfig.max,
        progress,
      },
      todayLikeKarma,
      maxDailyLikeKarma: KARMA_LIMITS.MAX_DAILY_LIKE_KARMA,
    };
  }

  /**
   * Get user's karma transaction history
   */
  async getKarmaHistory(
    userId: string,
    page: number,
    limit: number,
    action?: KarmaActionType,
  ) {
    const { transactions, total } =
      await this.reputationRepository.getUserTransactions(
        userId,
        (page - 1) * limit,
        limit,
        action,
      );

    return new PaginatedResult(transactions, page, limit, total);
  }

  /**
   * Get all tier definitions
   */
  getTierDefinitions(): TiersResponse {
    const tiers: TierDefinition[] = [
      {
        tier: "NEWCOMER",
        icon: TIER_THRESHOLDS.NEWCOMER.icon,
        label: TIER_THRESHOLDS.NEWCOMER.label,
        minKarma: TIER_THRESHOLDS.NEWCOMER.min,
        maxKarma: TIER_THRESHOLDS.NEWCOMER.max,
        multiplier: TIER_THRESHOLDS.NEWCOMER.multiplier,
        privileges: ["Basic posting", "Commenting"],
      },
      {
        tier: "CONTRIBUTOR",
        icon: TIER_THRESHOLDS.CONTRIBUTOR.icon,
        label: TIER_THRESHOLDS.CONTRIBUTOR.label,
        minKarma: TIER_THRESHOLDS.CONTRIBUTOR.min,
        maxKarma: TIER_THRESHOLDS.CONTRIBUTOR.max,
        multiplier: TIER_THRESHOLDS.CONTRIBUTOR.multiplier,
        privileges: ["Basic posting", "Commenting", "Extended profile"],
      },
      {
        tier: "EXPERT",
        icon: TIER_THRESHOLDS.EXPERT.icon,
        label: TIER_THRESHOLDS.EXPERT.label,
        minKarma: TIER_THRESHOLDS.EXPERT.min,
        maxKarma: TIER_THRESHOLDS.EXPERT.max,
        multiplier: TIER_THRESHOLDS.EXPERT.multiplier,
        privileges: [
          "Basic posting",
          "Commenting",
          "Extended profile",
          "Priority support",
        ],
      },
      {
        tier: "MASTER",
        icon: TIER_THRESHOLDS.MASTER.icon,
        label: TIER_THRESHOLDS.MASTER.label,
        minKarma: TIER_THRESHOLDS.MASTER.min,
        maxKarma: TIER_THRESHOLDS.MASTER.max,
        multiplier: TIER_THRESHOLDS.MASTER.multiplier,
        privileges: [
          "Basic posting",
          "Commenting",
          "Extended profile",
          "Priority support",
          "Beta features",
        ],
      },
      {
        tier: "LEGEND",
        icon: TIER_THRESHOLDS.LEGEND.icon,
        label: TIER_THRESHOLDS.LEGEND.label,
        minKarma: TIER_THRESHOLDS.LEGEND.min,
        maxKarma: -1, // Infinity
        multiplier: TIER_THRESHOLDS.LEGEND.multiplier,
        privileges: [
          "Auto-approval",
          "All features",
          "VIP badge",
          "Direct support",
        ],
      },
    ];

    return { tiers };
  }

  /**
   * Admin: Adjust user karma manually
   */
  async adjustKarma(userId: string, points: number, reason?: string) {
    return this.awardKarma(userId, KarmaActionType.ADMIN_ADJUSTMENT, points, {
      reason,
    });
  }
}
