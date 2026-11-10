import { Injectable, Logger } from "@nestjs/common";
import { AiActivityLogRepository } from "../repositories/ai-activity-log.repository";
import {
  AiActionType,
  ContentFilterResult,
  AiActivityLog,
} from "@prisma/client";
import { AiActivityQueryDto } from "../dto/ai-activity-query.dto";

export interface CreateActivityLogInput {
  agentId: string;
  actionType: AiActionType;
  targetId?: string;
  targetType?: string;
  content?: string;
  tokensUsed?: number;
  filterResult?: ContentFilterResult;
  success?: boolean;
  errorMessage?: string;
}

export interface ActivityStats {
  totalActions: number;
  successfulActions: number;
  failedActions: number;
  successRate: number;
  totalTokens: number;
  byActionType: Record<string, number>;
  byFilterResult: Record<string, number>;
}

export interface PaginatedActivityLogs {
  logs: AiActivityLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class AiActivityLogService {
  private readonly logger = new Logger(AiActivityLogService.name);

  constructor(
    private readonly activityLogRepository: AiActivityLogRepository,
  ) {}

  /**
   * Log an AI agent activity
   */
  async log(input: CreateActivityLogInput): Promise<AiActivityLog> {
    const log = await this.activityLogRepository.create({
      agent: { connect: { id: input.agentId } },
      actionType: input.actionType,
      targetId: input.targetId,
      targetType: input.targetType,
      content: input.content,
      tokensUsed: input.tokensUsed || 0,
      filterResult: input.filterResult || ContentFilterResult.PASSED,
      success: input.success ?? true,
      errorMessage: input.errorMessage,
    });

    this.logger.debug(
      `Logged activity: agent=${input.agentId}, action=${input.actionType}, success=${input.success ?? true}`,
    );

    return log;
  }

  /**
   * Log a successful action
   */
  async logSuccess(
    agentId: string,
    actionType: AiActionType,
    options: {
      targetId?: string;
      targetType?: string;
      content?: string;
      tokensUsed?: number;
    } = {},
  ): Promise<AiActivityLog> {
    return this.log({
      agentId,
      actionType,
      ...options,
      success: true,
      filterResult: ContentFilterResult.PASSED,
    });
  }

  /**
   * Log a failed action
   */
  async logFailure(
    agentId: string,
    actionType: AiActionType,
    errorMessage: string,
    options: {
      targetId?: string;
      targetType?: string;
      content?: string;
      tokensUsed?: number;
      filterResult?: ContentFilterResult;
    } = {},
  ): Promise<AiActivityLog> {
    return this.log({
      agentId,
      actionType,
      ...options,
      success: false,
      // Truncate error message to max 500 chars to save DB space
      errorMessage: errorMessage?.substring(0, 500),
      filterResult: options.filterResult || ContentFilterResult.PASSED,
    });
  }

  /**
   * Log a filtered (blocked) action
   */
  async logFiltered(
    agentId: string,
    actionType: AiActionType,
    filterResult: ContentFilterResult,
    options: {
      targetId?: string;
      targetType?: string;
      content?: string;
      tokensUsed?: number;
    } = {},
  ): Promise<AiActivityLog> {
    return this.log({
      agentId,
      actionType,
      ...options,
      success: false,
      filterResult,
      errorMessage: `Content blocked by filter: ${filterResult}`,
    });
  }

  /**
   * Query activity logs with filters and pagination
   */
  async findMany(query: AiActivityQueryDto): Promise<PaginatedActivityLogs> {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const { logs, total } = await this.activityLogRepository.findMany({
      agentId: query.agentId,
      actionType: query.actionType,
      filterResult: query.filterResult,
      success: query.success,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      page,
      limit,
    });

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get activity statistics
   */
  async getStats(options?: {
    agentId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ActivityStats> {
    const stats = await this.activityLogRepository.getStats(options);

    return {
      ...stats,
      successRate:
        stats.totalActions > 0
          ? Math.round((stats.successfulActions / stats.totalActions) * 100)
          : 0,
    };
  }

  /**
   * Get stats for today
   */
  async getTodayStats(agentId?: string): Promise<ActivityStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.getStats({
      agentId,
      startDate: today,
    });
  }

  /**
   * Get stats for the last N days
   */
  async getRecentStats(
    days: number = 7,
    agentId?: string,
  ): Promise<ActivityStats> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    return this.getStats({
      agentId,
      startDate,
    });
  }

  /**
   * Clean up old logs (retention policy)
   */
  async cleanupOldLogs(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.activityLogRepository.deleteOldLogs(cutoffDate);

    this.logger.log(
      `Cleaned up ${result.count} activity logs older than ${retentionDays} days`,
    );

    return result.count;
  }

  /**
   * Get hourly activity data for the last 24 hours (AC-042)
   */
  async getHourlyActivity(): Promise<
    Array<{ hour: string; posts: number; comments: number; reactions: number }>
  > {
    return this.activityLogRepository.getHourlyActivity();
  }

  /**
   * Export activity logs to CSV format
   */
  async exportToCsv(query: AiActivityQueryDto): Promise<string> {
    const logs = await this.activityLogRepository.findAllForExport({
      agentId: query.agentId,
      actionType: query.actionType,
      filterResult: query.filterResult,
      success: query.success,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
    });

    // CSV header
    const headers = [
      "timestamp",
      "agent",
      "type",
      "status",
      "content",
      "tokens",
    ];
    const rows: string[] = [headers.join(",")];

    // CSV rows
    for (const log of logs) {
      const agentName = (log as any).agent?.name || "Unknown";
      const status = log.success ? "SUCCESS" : "FAILED";
      // Escape content for CSV (handle commas, quotes, newlines)
      const escapedContent = log.content
        ? `"${log.content.replace(/"/g, '""').replace(/\n/g, " ")}"`
        : "";

      rows.push(
        [
          log.createdAt.toISOString(),
          `"${agentName}"`,
          log.actionType,
          status,
          escapedContent,
          log.tokensUsed.toString(),
        ].join(","),
      );
    }

    return rows.join("\n");
  }
}
