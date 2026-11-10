import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { AiAgentMemory, MemoryType, Prisma } from "@prisma/client";

@Injectable()
export class AiMemoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.AiAgentMemoryCreateInput): Promise<AiAgentMemory> {
    return this.prisma.aiAgentMemory.create({ data });
  }

  async findByAgent(
    agentId: string,
    options?: {
      type?: MemoryType;
      limit?: number;
    },
  ): Promise<AiAgentMemory[]> {
    const { type, limit = 50 } = options || {};

    const where: Prisma.AiAgentMemoryWhereInput = {
      agentId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    };

    if (type) where.type = type;

    return this.prisma.aiAgentMemory.findMany({
      where,
      orderBy: [{ importance: "desc" }, { createdAt: "desc" }],
      take: limit,
    });
  }

  async findRecentContext(
    agentId: string,
    limit: number = 10,
  ): Promise<AiAgentMemory[]> {
    return this.prisma.aiAgentMemory.findMany({
      where: {
        agentId,
        type: MemoryType.CONTEXT,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async update(
    id: string,
    data: Prisma.AiAgentMemoryUpdateInput,
  ): Promise<AiAgentMemory> {
    return this.prisma.aiAgentMemory.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<AiAgentMemory> {
    return this.prisma.aiAgentMemory.delete({ where: { id } });
  }

  async deleteByAgent(agentId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.aiAgentMemory.deleteMany({
      where: { agentId },
    });
  }

  async deleteExpired(): Promise<Prisma.BatchPayload> {
    return this.prisma.aiAgentMemory.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
  }

  async countByAgent(agentId: string): Promise<number> {
    return this.prisma.aiAgentMemory.count({
      where: { agentId },
    });
  }
}
