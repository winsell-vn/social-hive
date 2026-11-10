import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from "@nestjs/common";
import { Response } from "express";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role, AiAgentStatus, AiActionType } from "@prisma/client";
import { AiProviderKeyService } from "../services/ai-provider-key.service";
import { AiAgentService } from "../services/ai-agent.service";
import { AiOrchestratorService } from "../services/ai-orchestrator.service";
import { AiActivityLogService } from "../services/ai-activity-log.service";
import { CreateAiProviderKeyDto } from "../dto/create-ai-provider-key.dto";
import { UpdateAiProviderKeyDto } from "../dto/update-ai-provider-key.dto";
import { CreateAiAgentDto } from "../dto/create-ai-agent.dto";
import { UpdateAiAgentDto } from "../dto/update-ai-agent.dto";
import { AiActivityQueryDto } from "../dto/ai-activity-query.dto";
import { BulkStatusDto } from "../dto/bulk-status.dto";

@Controller("admin/ai-seeding")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AiSeedingController {
  constructor(
    private readonly aiProviderKeyService: AiProviderKeyService,
    private readonly aiAgentService: AiAgentService,
    private readonly orchestratorService: AiOrchestratorService,
    private readonly activityLogService: AiActivityLogService,
  ) {}

  // ==================== API Keys ====================

  @Get("api-keys")
  async getApiKeys() {
    return this.aiProviderKeyService.findAll();
  }

  @Get("api-keys/:id")
  async getApiKey(@Param("id") id: string) {
    return this.aiProviderKeyService.findById(id);
  }

  @Post("api-keys")
  async createApiKey(@Body() dto: CreateAiProviderKeyDto) {
    return this.aiProviderKeyService.create(dto);
  }

  @Put("api-keys/:id")
  async updateApiKey(
    @Param("id") id: string,
    @Body() dto: UpdateAiProviderKeyDto,
  ) {
    return this.aiProviderKeyService.update(id, dto);
  }

  @Delete("api-keys/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteApiKey(@Param("id") id: string) {
    await this.aiProviderKeyService.delete(id);
  }

  @Post("api-keys/:id/test")
  async testApiKey(@Param("id") id: string) {
    const isValid = await this.aiProviderKeyService.testKey(id);
    return { valid: isValid };
  }

  // ==================== Agents ====================

  @Get("agents")
  async getAgents(
    @Query("status") status?: AiAgentStatus,
    @Query("apiKeyId") apiKeyId?: string,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.aiAgentService.findAll({
      status,
      apiKeyId,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get("agents/:id")
  async getAgent(@Param("id") id: string) {
    return this.aiAgentService.findById(id);
  }

  @Post("agents")
  async createAgent(@Body() dto: CreateAiAgentDto) {
    return this.aiAgentService.create(dto);
  }

  @Put("agents/:id")
  async updateAgent(@Param("id") id: string, @Body() dto: UpdateAiAgentDto) {
    return this.aiAgentService.update(id, dto);
  }

  @Delete("agents/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAgent(@Param("id") id: string) {
    await this.aiAgentService.delete(id);
  }

  @Post("agents/:id/pause")
  async pauseAgent(@Param("id") id: string) {
    return this.aiAgentService.pause(id);
  }

  @Post("agents/:id/resume")
  async resumeAgent(@Param("id") id: string) {
    return this.aiAgentService.resume(id);
  }

  @Post("agents/:id/disable")
  async disableAgent(@Param("id") id: string) {
    return this.aiAgentService.disable(id);
  }

  @Post("agents/bulk-status")
  async bulkUpdateStatus(@Body() dto: BulkStatusDto) {
    const count = await this.aiAgentService.bulkUpdateStatus(
      dto.agentIds,
      dto.status,
    );
    return { updated: count };
  }

  // ==================== Actions ====================

  @Post("agents/:id/trigger")
  async triggerAction(
    @Param("id") id: string,
    @Body()
    body: {
      actionType: AiActionType;
      targetId?: string;
      customPrompt?: string;
    },
  ) {
    const jobId = await this.orchestratorService.triggerAction(
      id,
      body.actionType,
      {
        targetId: body.targetId,
        customPrompt: body.customPrompt,
      },
    );
    return { jobId };
  }

  // ==================== Queue Management ====================

  @Get("queue/status")
  async getQueueStatus() {
    return this.orchestratorService.getQueueStatus();
  }

  @Post("queue/pause")
  @HttpCode(HttpStatus.NO_CONTENT)
  async pauseQueue() {
    await this.orchestratorService.pauseAll();
  }

  @Post("queue/resume")
  @HttpCode(HttpStatus.NO_CONTENT)
  async resumeQueue() {
    await this.orchestratorService.resumeAll();
  }

  // ==================== Activity Logs ====================

  @Get("activity")
  async getActivityLogs(@Query() query: AiActivityQueryDto) {
    return this.activityLogService.findMany(query);
  }

  @Get("activity/stats")
  async getActivityStats(
    @Query("agentId") agentId?: string,
    @Query("days") days?: number,
  ) {
    if (days) {
      return this.activityLogService.getRecentStats(Number(days), agentId);
    }
    return this.activityLogService.getTodayStats(agentId);
  }

  /**
   * Get hourly activity data for the last 24 hours (AC-042)
   */
  @Get("activity/chart")
  async getHourlyActivity() {
    const data = await this.activityLogService.getHourlyActivity();
    return { data };
  }

  /**
   * Export activity logs as CSV
   */
  @Get("activity/export")
  async exportActivityLogs(
    @Query() query: AiActivityQueryDto,
    @Res() res: Response,
  ) {
    const csv = await this.activityLogService.exportToCsv(query);
    const filename = `ai-activity-logs-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }

  // ==================== Dashboard ====================

  @Get("dashboard")
  async getDashboard() {
    const [apiKeys, agents, queueStatus, todayStats] = await Promise.all([
      this.aiProviderKeyService.findAll(),
      this.aiAgentService.findAll({ limit: 100 }),
      this.orchestratorService.getQueueStatus(),
      this.activityLogService.getTodayStats(),
    ]);

    return {
      apiKeys: {
        total: apiKeys.length,
        active: apiKeys.filter((k) => k.isActive).length,
      },
      agents: {
        total: agents.total,
        active: agents.agents.filter((a) => a.status === AiAgentStatus.ACTIVE)
          .length,
        paused: agents.agents.filter((a) => a.status === AiAgentStatus.PAUSED)
          .length,
        disabled: agents.agents.filter(
          (a) => a.status === AiAgentStatus.DISABLED,
        ).length,
      },
      queue: queueStatus,
      activity: todayStats,
    };
  }
}
