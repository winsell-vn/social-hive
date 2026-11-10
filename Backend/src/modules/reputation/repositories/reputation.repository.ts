import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, Tier } from "@prisma/client";
import { KarmaActionType } from "../constants/karma-actions";

@Injectable()
export class ReputationRepository {
  constructor(private prisma: PrismaService) {}

  async createTransaction(
    userId: string,
    action: KarmaActionType,
    points: number,
    metadata?: Record<string, unknown>,
  ) {
    return this.prisma.reputationTransaction.create({
      data: {
        userId,
        action,
        points,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
  }

  async getUserTransactions(
    userId: string,
    skip: number,
    take: number,
    action?: KarmaActionType,
  ) {
    const where: Prisma.ReputationTransactionWhereInput = { userId };
    if (action) {
      where.action = action;
    }

    const [transactions, total] = await Promise.all([
      this.prisma.reputationTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.reputationTransaction.count({ where }),
    ]);

    return { transactions, total };
  }

  async updateUserKarma(userId: string, karmaChange: number, newTier?: Tier) {
    const updateData: Prisma.UserUpdateInput = {
      karma: { increment: karmaChange },
      lastActiveAt: new Date(),
    };

    if (newTier) {
      updateData.tier = newTier;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
    });
  }

  async setUserKarma(userId: string, karma: number, tier: Tier) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { karma, tier, lastActiveAt: new Date() },
    });
  }

  async getUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        karma: true,
        tier: true,
        lastActiveAt: true,
      },
    });
  }

  async getTodayLikeKarma(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await this.prisma.reputationTransaction.aggregate({
      where: {
        userId,
        action: KarmaActionType.RECEIVED_LIKE,
        createdAt: { gte: startOfDay },
      },
      _sum: { points: true },
    });

    return result._sum.points || 0;
  }

  async getTodayLoginKarma(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await this.prisma.reputationTransaction.count({
      where: {
        userId,
        action: KarmaActionType.DAILY_LOGIN,
        createdAt: { gte: startOfDay },
      },
    });

    return result;
  }

  async getInactiveUsers(inactiveDays: number) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - inactiveDays);

    return this.prisma.user.findMany({
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
  }

  async getPostLikeCount(postId: string): Promise<number> {
    return this.prisma.like.count({
      where: { postId },
    });
  }

  async hasReceivedMilestoneBonus(
    userId: string,
    postId: string,
    milestone: number,
  ): Promise<boolean> {
    // Since metadata is stored as a JSON string, we need to fetch and parse it
    const transactions = await this.prisma.reputationTransaction.findMany({
      where: {
        userId,
        action: KarmaActionType.LIKE_MILESTONE,
      },
    });

    for (const transaction of transactions) {
      if (!transaction.metadata) continue;

      try {
        const metadata = JSON.parse(transaction.metadata) as Record<
          string,
          unknown
        >;
        if (metadata.postId === postId) {
          const existingMilestone = metadata.milestone as number | undefined;
          if (
            existingMilestone !== undefined &&
            existingMilestone >= milestone
          ) {
            return true;
          }
        }
      } catch {
        // Invalid JSON, skip this transaction
        continue;
      }
    }

    return false;
  }
}
