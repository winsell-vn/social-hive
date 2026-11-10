import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AiAgent, AiAgentStatus, Prisma } from "@prisma/client";

@Injectable()
export class AiAgentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AiAgentCreateInput): Promise<AiAgent> {
    return this.prisma.aiAgent.create({
      data,
      include: {
        user: {
          include: { profile: true },
        },
        apiKey: true,
      },
    });
  }

  async findById(id: string): Promise<AiAgent | null> {
    return this.prisma.aiAgent.findUnique({
      where: { id },
      include: {
        user: {
          include: { profile: true },
        },
        apiKey: true,
      },
    });
  }

  async findByUserId(userId: string): Promise<AiAgent | null> {
    return this.prisma.aiAgent.findUnique({
      where: { userId },
      include: {
        user: {
          include: { profile: true },
        },
        apiKey: true,
      },
    });
  }

  async findAll(options?: {
    status?: AiAgentStatus;
    apiKeyId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ agents: AiAgent[]; total: number }> {
    const { status, apiKeyId, page = 1, limit = 20 } = options || {};

    const where: Prisma.AiAgentWhereInput = {};
    if (status) where.status = status;
    if (apiKeyId) where.apiKeyId = apiKeyId;

    const [agents, total] = await Promise.all([
      this.prisma.aiAgent.findMany({
        where,
        include: {
          user: {
            include: { profile: true },
          },
          apiKey: {
            select: { id: true, name: true, isActive: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.aiAgent.count({ where }),
    ]);

    return { agents, total };
  }

  async findActive(): Promise<AiAgent[]> {
    return this.prisma.aiAgent.findMany({
      where: {
        status: AiAgentStatus.ACTIVE,
        apiKey: { isActive: true },
      },
      include: {
        user: {
          include: { profile: true },
        },
        apiKey: true,
      },
    });
  }

  async update(id: string, data: Prisma.AiAgentUpdateInput): Promise<AiAgent> {
    return this.prisma.aiAgent.update({
      where: { id },
      data,
      include: {
        user: {
          include: { profile: true },
        },
        apiKey: true,
      },
    });
  }

  async updateStatus(id: string, status: AiAgentStatus): Promise<AiAgent> {
    return this.prisma.aiAgent.update({
      where: { id },
      data: { status },
    });
  }

  async updateStats(
    id: string,
    stats: {
      totalPosts?: number;
      totalComments?: number;
      totalReactions?: number;
    },
  ): Promise<AiAgent> {
    const data: Prisma.AiAgentUpdateInput = {
      lastActiveAt: new Date(),
    };

    if (stats.totalPosts !== undefined) {
      data.totalPosts = { increment: stats.totalPosts };
    }
    if (stats.totalComments !== undefined) {
      data.totalComments = { increment: stats.totalComments };
    }
    if (stats.totalReactions !== undefined) {
      data.totalReactions = { increment: stats.totalReactions };
    }

    return this.prisma.aiAgent.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<AiAgent> {
    return this.prisma.aiAgent.delete({ where: { id } });
  }

  async countByApiKey(apiKeyId: string): Promise<number> {
    return this.prisma.aiAgent.count({
      where: { apiKeyId },
    });
  }

  async bulkUpdateStatus(
    ids: string[],
    status: AiAgentStatus,
  ): Promise<Prisma.BatchPayload> {
    return this.prisma.aiAgent.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  }
}
