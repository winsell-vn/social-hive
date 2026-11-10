import { Processor, Process } from "@nestjs/bull";
import { Job } from "bull";
import { Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { Tier } from "@prisma/client";
import {
  KARMA_DECAY,
  TIER_THRESHOLDS,
  KarmaActionType,
} from "../../modules/reputation/constants/karma-actions";

export interface KarmaDecayJob {
  triggeredAt: Date;
}

@Processor("karma-decay")
export class KarmaDecayProcessor {
  private readonly logger = new Logger(KarmaDecayProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process("process-decay")
  async handleKarmaDecay(job: Job<KarmaDecayJob>) {
    this.logger.log(`Processing karma decay job ${job.id}`);

    const cutoffDate = new Date();
    cutoffDate.setDate(
      cutoffDate.getDate() - KARMA_DECAY.INACTIVE_DAYS_THRESHOLD,
    );

    // Find inactive users with karma > 0
    const inactiveUsers = await this.prisma.user.findMany({
      where: {
        lastActiveAt: { lt: cutoffDate },
        karma: { gt: 0 },
      },
      select: {
        id: true,
        karma: true,
        tier: true,
        lastActiveAt: true,
      },
    });

    this.logger.log(
      `Found ${inactiveUsers.length} inactive users for karma decay`,
    );

    let processedCount = 0;
    let totalDecayed = 0;

    for (const user of inactiveUsers) {
      try {
        // Calculate decay amount (5% of current karma as per spec)
        const decayAmount = Math.max(
          1,
          Math.floor(user.karma * KARMA_DECAY.DECAY_PERCENTAGE),
        );
        const newKarma = Math.max(0, user.karma - decayAmount);
        const newTier = this.calculateTier(newKarma);

        // Update user karma
        await this.prisma.user.update({
          where: { id: user.id },
          data: { karma: newKarma, tier: newTier },
        });

        // Log transaction
        await this.prisma.reputationTransaction.create({
          data: {
            userId: user.id,
            action: KarmaActionType.KARMA_DECAY,
            points: -decayAmount,
            metadata: JSON.stringify({
              previousKarma: user.karma,
              newKarma,
              inactiveDays: Math.floor(
                (Date.now() - user.lastActiveAt.getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            }),
          },
        });

        processedCount++;
        totalDecayed += decayAmount;

        this.logger.debug(
          `Decayed ${decayAmount} karma from user ${user.id}. New karma: ${newKarma}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to process decay for user ${user.id}:`,
          error,
        );
      }
    }

    this.logger.log(
      `Karma decay complete. Processed ${processedCount} users, total karma decayed: ${totalDecayed}`,
    );

    return {
      success: true,
      processedUsers: processedCount,
      totalDecayed,
    };
  }

  private calculateTier(karma: number): Tier {
    if (karma >= TIER_THRESHOLDS.LEGEND.min) return Tier.LEGEND;
    if (karma >= TIER_THRESHOLDS.MASTER.min) return Tier.MASTER;
    if (karma >= TIER_THRESHOLDS.EXPERT.min) return Tier.EXPERT;
    if (karma >= TIER_THRESHOLDS.CONTRIBUTOR.min) return Tier.CONTRIBUTOR;
    return Tier.NEWCOMER;
  }
}
