import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AiProviderKey, Prisma } from "@prisma/client";

@Injectable()
export class AiProviderKeyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AiProviderKeyCreateInput): Promise<AiProviderKey> {
    return this.prisma.aiProviderKey.create({ data });
  }

  /**
   * Find API key by ID (excludes soft-deleted keys by default)
   */
  async findById(
    id: string,
    includeDeleted: boolean = false,
  ): Promise<AiProviderKey | null> {
    return this.prisma.aiProviderKey.findFirst({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });
  }

  /**
   * Find all API keys (excludes soft-deleted keys)
   */
  async findAll(): Promise<AiProviderKey[]> {
    return this.prisma.aiProviderKey.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find active API keys (excludes soft-deleted keys)
   */
  async findActive(): Promise<AiProviderKey[]> {
    return this.prisma.aiProviderKey.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Find all API keys with agent count (excludes soft-deleted keys)
   */
  async findWithAgentCount(): Promise<
    (AiProviderKey & { _count: { agents: number } })[]
  > {
    return this.prisma.aiProviderKey.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { agents: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(
    id: string,
    data: Prisma.AiProviderKeyUpdateInput,
  ): Promise<AiProviderKey> {
    return this.prisma.aiProviderKey.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete an API key by setting deletedAt timestamp
   */
  async softDelete(id: string): Promise<AiProviderKey> {
    return this.prisma.aiProviderKey.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  /**
   * Hard delete an API key (use with caution)
   */
  async delete(id: string): Promise<AiProviderKey> {
    return this.prisma.aiProviderKey.delete({ where: { id } });
  }

  async incrementUsage(id: string, tokens: number = 1): Promise<AiProviderKey> {
    return this.prisma.aiProviderKey.update({
      where: { id },
      data: {
        usageToday: { increment: tokens },
        usageTotal: { increment: tokens },
        lastUsedAt: new Date(),
      },
    });
  }

  async resetDailyUsage(): Promise<Prisma.BatchPayload> {
    return this.prisma.aiProviderKey.updateMany({
      where: { deletedAt: null },
      data: {
        usageToday: 0,
        lastResetAt: new Date(),
      },
    });
  }

  async countAgents(id: string): Promise<number> {
    return this.prisma.aiAgent.count({
      where: { apiKeyId: id },
    });
  }

  /**
   * Get all agent IDs using a specific API key
   */
  async getAgentIds(id: string): Promise<string[]> {
    const agents = await this.prisma.aiAgent.findMany({
      where: { apiKeyId: id },
      select: { id: true },
    });
    return agents.map((a) => a.id);
  }
}
