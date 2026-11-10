import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { AiAgentRepository } from "../repositories/ai-agent.repository";
import { AiProviderKeyService } from "./ai-provider-key.service";
import { AiMemoryService } from "./ai-memory.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { CreateAiAgentDto } from "../dto/create-ai-agent.dto";
import { UpdateAiAgentDto } from "../dto/update-ai-agent.dto";
import { AiAgent, AiAgentStatus, Role, Tier, MemoryType } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";

export interface AiAgentWithProfile extends AiAgent {
  user: {
    id: string;
    email: string;
    profile: {
      username: string;
      displayName: string | null;
      avatar: string | null;
    } | null;
  };
  apiKey: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private readonly aiAgentRepository: AiAgentRepository,
    private readonly aiProviderKeyService: AiProviderKeyService,
    private readonly memoryService: AiMemoryService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new AI agent with associated user account
   */
  async create(dto: CreateAiAgentDto): Promise<AiAgentWithProfile> {
    // Check if API key can accept more agents
    const canAdd = await this.aiProviderKeyService.canAddAgent(dto.apiKeyId);
    if (!canAdd) {
      throw new BadRequestException(
        "API key has reached maximum agent limit or is inactive",
      );
    }

    // Check if username is available
    const existingProfile = await this.prisma.profile.findUnique({
      where: { username: dto.username },
    });
    if (existingProfile) {
      throw new BadRequestException(
        `Username "${dto.username}" is already taken`,
      );
    }

    // Generate a unique email for the AI agent (AC-007: format ai-{uuid}@system.local)
    const agentEmail = `ai-${randomUUID()}@system.local`;

    // Generate a random password (not used for login, but required by schema)
    const randomPassword = await bcrypt.hash(Math.random().toString(36), 10);

    // Build personality JSON
    const personalityJson = JSON.stringify(dto.personality);

    // Build activity window JSON
    const activityWindowJson = dto.activityWindow
      ? JSON.stringify(dto.activityWindow)
      : null;

    // Build default system prompt if not provided
    const systemPrompt =
      dto.systemPrompt || this.buildDefaultSystemPrompt(dto.personality);

    // Create user and agent in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Create user account for the agent (AC-005: set isAiAgent=true)
      const user = await tx.user.create({
        data: {
          email: agentEmail,
          password: randomPassword,
          role: Role.USER,
          tier: Tier.LEGEND, // AI agents get LEGEND tier for auto-approval
          isActive: true,
          isAiAgent: true, // AC-005: Flag to identify AI agent users
          profile: {
            create: {
              username: dto.username,
              displayName: dto.name,
              bio: `AI Agent - ${dto.personality.traits}`,
            },
          },
        },
        include: {
          profile: true,
        },
      });

      // Create AI agent
      const agent = await tx.aiAgent.create({
        data: {
          userId: user.id,
          apiKeyId: dto.apiKeyId,
          name: dto.name,
          personality: personalityJson,
          systemPrompt,
          activityWindow: activityWindowJson,
          postFrequency: dto.postFrequency || 3,
          commentFrequency: dto.commentFrequency || 10,
          reactionFrequency: dto.reactionFrequency || 20,
          status: AiAgentStatus.ACTIVE,
        },
        include: {
          user: {
            include: { profile: true },
          },
          apiKey: {
            select: { id: true, name: true, isActive: true },
          },
        },
      });

      return agent;
    });

    // AC-008: Initialize empty memory context for personality consistency
    await this.memoryService.addMemory(result.id, {
      type: MemoryType.CONTEXT,
      content: "Agent initialized. Ready to engage with the community.",
      importance: 1,
    });

    this.logger.log(`Created AI agent: ${result.id} (${dto.name})`);

    return result as AiAgentWithProfile;
  }

  /**
   * Get all AI agents with pagination
   */
  async findAll(options?: {
    status?: AiAgentStatus;
    apiKeyId?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    agents: AiAgentWithProfile[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const page = options?.page || 1;
    const limit = options?.limit || 20;

    const { agents, total } = await this.aiAgentRepository.findAll(options);

    return {
      agents: agents as AiAgentWithProfile[],
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get a single AI agent by ID
   */
  async findById(id: string): Promise<AiAgentWithProfile> {
    const agent = await this.aiAgentRepository.findById(id);

    if (!agent) {
      throw new NotFoundException(`AI agent not found: ${id}`);
    }

    return agent as AiAgentWithProfile;
  }

  /**
   * Get AI agent by user ID
   */
  async findByUserId(userId: string): Promise<AiAgentWithProfile | null> {
    const agent = await this.aiAgentRepository.findByUserId(userId);
    return agent as AiAgentWithProfile | null;
  }

  /**
   * Update an AI agent
   */
  async update(id: string, dto: UpdateAiAgentDto): Promise<AiAgentWithProfile> {
    const existing = await this.aiAgentRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`AI agent not found: ${id}`);
    }

    const updateData: any = {};

    if (dto.name !== undefined) {
      updateData.name = dto.name;
      // Also update profile display name
      await this.prisma.profile.update({
        where: { userId: existing.userId },
        data: { displayName: dto.name },
      });
    }

    if (dto.status !== undefined) {
      updateData.status = dto.status;
    }

    if (dto.personality !== undefined) {
      updateData.personality = JSON.stringify(dto.personality);
    }

    if (dto.systemPrompt !== undefined) {
      updateData.systemPrompt = dto.systemPrompt;
    }

    if (dto.activityWindow !== undefined) {
      updateData.activityWindow = JSON.stringify(dto.activityWindow);
    }

    if (dto.postFrequency !== undefined) {
      updateData.postFrequency = dto.postFrequency;
    }

    if (dto.commentFrequency !== undefined) {
      updateData.commentFrequency = dto.commentFrequency;
    }

    if (dto.reactionFrequency !== undefined) {
      updateData.reactionFrequency = dto.reactionFrequency;
    }

    const updated = await this.aiAgentRepository.update(id, updateData);

    this.logger.log(`Updated AI agent: ${id}`);

    return updated as AiAgentWithProfile;
  }

  /**
   * Delete an AI agent and associated user
   */
  async delete(id: string): Promise<void> {
    const agent = await this.aiAgentRepository.findById(id);

    if (!agent) {
      throw new NotFoundException(`AI agent not found: ${id}`);
    }

    // Delete in transaction (cascade will handle agent deletion)
    await this.prisma.$transaction(async (tx) => {
      // Delete agent memories
      await tx.aiAgentMemory.deleteMany({
        where: { agentId: id },
      });

      // Delete activity logs
      await tx.aiActivityLog.deleteMany({
        where: { agentId: id },
      });

      // Delete content hashes
      await tx.contentHash.deleteMany({
        where: { agentId: id },
      });

      // Delete the agent (this will cascade from user deletion)
      await tx.aiAgent.delete({
        where: { id },
      });

      // Delete the user account
      await tx.user.delete({
        where: { id: agent.userId },
      });
    });

    this.logger.log(`Deleted AI agent: ${id}`);
  }

  /**
   * Get all active agents
   */
  async findActive(): Promise<AiAgentWithProfile[]> {
    const agents = await this.aiAgentRepository.findActive();
    return agents as AiAgentWithProfile[];
  }

  /**
   * Pause an agent
   */
  async pause(id: string): Promise<AiAgentWithProfile> {
    return this.update(id, { status: AiAgentStatus.PAUSED });
  }

  /**
   * Resume an agent
   */
  async resume(id: string): Promise<AiAgentWithProfile> {
    return this.update(id, { status: AiAgentStatus.ACTIVE });
  }

  /**
   * Disable an agent
   */
  async disable(id: string): Promise<AiAgentWithProfile> {
    return this.update(id, { status: AiAgentStatus.DISABLED });
  }

  /**
   * Bulk update agent status
   */
  async bulkUpdateStatus(
    ids: string[],
    status: AiAgentStatus,
  ): Promise<number> {
    const result = await this.aiAgentRepository.bulkUpdateStatus(ids, status);
    this.logger.log(`Bulk updated ${result.count} agents to status: ${status}`);
    return result.count;
  }

  /**
   * Update agent stats after an action
   */
  async incrementStats(
    id: string,
    action: "post" | "comment" | "reaction",
  ): Promise<void> {
    const stats: {
      totalPosts?: number;
      totalComments?: number;
      totalReactions?: number;
    } = {};

    switch (action) {
      case "post":
        stats.totalPosts = 1;
        break;
      case "comment":
        stats.totalComments = 1;
        break;
      case "reaction":
        stats.totalReactions = 1;
        break;
    }

    await this.aiAgentRepository.updateStats(id, stats);
  }

  /**
   * Get parsed personality from agent
   */
  getPersonality(agent: AiAgent): {
    traits: string;
    tone: string;
    interests?: string[];
    writingStyle?: string;
  } {
    try {
      return JSON.parse(agent.personality);
    } catch {
      return { traits: "friendly", tone: "casual" };
    }
  }

  /**
   * Get parsed activity window from agent
   */
  getActivityWindow(agent: AiAgent): {
    startHour: number;
    endHour: number;
    timezone?: string;
  } | null {
    if (!agent.activityWindow) return null;

    try {
      return JSON.parse(agent.activityWindow);
    } catch {
      return null;
    }
  }

  /**
   * Build default system prompt from personality
   */
  private buildDefaultSystemPrompt(personality: {
    traits: string;
    tone: string;
    interests?: string[];
    writingStyle?: string;
  }): string {
    const parts = [
      `You are a social media user with the following personality traits: ${personality.traits}.`,
      `Your communication tone is ${personality.tone}.`,
    ];

    if (personality.interests && personality.interests.length > 0) {
      parts.push(
        `Your interests include: ${personality.interests.join(", ")}.`,
      );
    }

    if (personality.writingStyle) {
      parts.push(`Writing style: ${personality.writingStyle}`);
    }

    parts.push(
      "Write authentic, engaging content that reflects your personality.",
      "Keep responses natural and human-like.",
      "Do not mention that you are an AI or bot.",
    );

    return parts.join("\n");
  }
}
