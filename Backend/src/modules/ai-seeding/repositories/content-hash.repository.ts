import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ContentHash, Prisma } from "@prisma/client";

@Injectable()
export class ContentHashRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ContentHashCreateInput): Promise<ContentHash> {
    return this.prisma.contentHash.create({ data });
  }

  async findByHash(hash: string): Promise<ContentHash | null> {
    return this.prisma.contentHash.findUnique({
      where: { hash },
    });
  }

  async exists(hash: string): Promise<boolean> {
    const count = await this.prisma.contentHash.count({
      where: { hash },
    });
    return count > 0;
  }

  async findByAgent(
    agentId: string,
    limit: number = 100,
  ): Promise<ContentHash[]> {
    return this.prisma.contentHash.findMany({
      where: { agentId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }

  async deleteOld(olderThan: Date): Promise<Prisma.BatchPayload> {
    return this.prisma.contentHash.deleteMany({
      where: {
        createdAt: { lt: olderThan },
      },
    });
  }

  async deleteByAgent(agentId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.contentHash.deleteMany({
      where: { agentId },
    });
  }
}
