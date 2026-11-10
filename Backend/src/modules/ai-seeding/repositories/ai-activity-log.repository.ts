import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import {
  AiActivityLog,
  AiActionType,
  ContentFilterResult,
  Prisma,
} from "@prisma/client";

@Injectable()
export class AiActivityLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AiActivityLogCreateInput): Promise<AiActivityLog> {
    return this.prisma.aiActivityLog.create({ data });
  }

  async findMany(options: {
    agentId?: string;
    actionType?: AiActionType;
    filterResult?: ContentFilterResult;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }): Promise<{ logs: AiActivityLog[]; total: number }> {
    const {
      agentId,
      actionType,
      filterResult,
      success,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = options;

    const where: Prisma.AiActivityLogWhereInput = {};

    if (agentId) where.agentId = agentId;
    if (actionType) where.actionType = actionType;
    if (filterResult) where.filterResult = filterResult;
    if (success !== undefined) where.success = success;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [logs, total] = await Promise.all([
      this.prisma.aiActivityLog.findMany({
        where,
        include: {
          agent: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.aiActivityLog.count({ where }),
    ]);

    return { logs, total };
  }

  async getStats(options?: {
    agentId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalActions: number;
    successfulActions: number;
    failedActions: number;
    totalTokens: number;
    byActionType: Record<AiActionType, number>;
    byFilterResult: Record<ContentFilterResult, number>;
  }> {
    const { agentId, startDate, endDate } = options || {};

    const where: Prisma.AiActivityLogWhereInput = {};
    if (agentId) where.agentId = agentId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [
      totalActions,
      successfulActions,
      tokenSum,
      actionTypeCounts,
      filterResultCounts,
    ] = await Promise.all([
      this.prisma.aiActivityLog.count({ where }),
      this.prisma.aiActivityLog.count({ where: { ...where, success: true } }),
      this.prisma.aiActivityLog.aggregate({
        where,
        _sum: { tokensUsed: true },
      }),
      this.prisma.aiActivityLog.groupBy({
        by: ["actionType"],
        where,
        _count: true,
      }),
      this.prisma.aiActivityLog.groupBy({
        by: ["filterResult"],
        where,
        _count: true,
      }),
    ]);

    const byActionType = {} as Record<AiActionType, number>;
    actionTypeCounts.forEach((item) => {
      byActionType[item.actionType] = item._count;
    });

    const byFilterResult = {} as Record<ContentFilterResult, number>;
    filterResultCounts.forEach((item) => {
      byFilterResult[item.filterResult] = item._count;
    });

    return {
      totalActions,
      successfulActions,
      failedActions: totalActions - successfulActions,
      totalTokens: tokenSum._sum.tokensUsed || 0,
      byActionType,
      byFilterResult,
    };
  }

  async deleteOldLogs(olderThan: Date): Promise<Prisma.BatchPayload> {
    return this.prisma.aiActivityLog.deleteMany({
      where: {
        createdAt: { lt: olderThan },
      },
    });
  }

  /**
   * Get hourly activity data for the last 24 hours (AC-042)
   */
  async getHourlyActivity(): Promise<
    Array<{ hour: string; posts: number; comments: number; reactions: number }>
  > {
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    // Get all activity logs from the last 24 hours
    const logs = await this.prisma.aiActivityLog.findMany({
      where: {
        createdAt: { gte: twentyFourHoursAgo },
        success: true,
      },
      select: {
        actionType: true,
        createdAt: true,
      },
    });

    // Group by hour
    const hourlyData = new Map<
      string,
      { posts: number; comments: number; reactions: number }
    >();

    // Initialize all 24 hours
    for (let i = 0; i < 24; i++) {
      const hourDate = new Date();
      hourDate.setHours(hourDate.getHours() - (23 - i));
      hourDate.setMinutes(0, 0, 0);
      const hourKey = hourDate.toISOString().slice(0, 13) + ":00:00.000Z";
      hourlyData.set(hourKey, { posts: 0, comments: 0, reactions: 0 });
    }

    // Count activities per hour
    for (const log of logs) {
      const hourKey = log.createdAt.toISOString().slice(0, 13) + ":00:00.000Z";
      const hourStats = hourlyData.get(hourKey);
      if (hourStats) {
        switch (log.actionType) {
          case "POST":
            hourStats.posts++;
            break;
          case "COMMENT":
          case "REPLY":
            hourStats.comments++;
            break;
          case "REACTION":
            hourStats.reactions++;
            break;
        }
      }
    }

    // Convert to array sorted by hour
    return Array.from(hourlyData.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hour, stats]) => ({
        hour,
        ...stats,
      }));
  }

  /**
   * Get all activity logs for export (no pagination)
   */
  async findAllForExport(options: {
    agentId?: string;
    actionType?: AiActionType;
    filterResult?: ContentFilterResult;
    success?: boolean;
    startDate?: Date;
    endDate?: Date;
  }): Promise<AiActivityLog[]> {
    const { agentId, actionType, filterResult, success, startDate, endDate } =
      options;

    const where: Prisma.AiActivityLogWhereInput = {};

    if (agentId) where.agentId = agentId;
    if (actionType) where.actionType = actionType;
    if (filterResult) where.filterResult = filterResult;
    if (success !== undefined) where.success = success;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    return this.prisma.aiActivityLog.findMany({
      where,
      include: {
        agent: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
