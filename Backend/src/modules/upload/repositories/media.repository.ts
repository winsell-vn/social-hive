import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, Media, MediaStatus, MediaType } from "@prisma/client";

@Injectable()
export class MediaRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.MediaCreateInput): Promise<Media> {
    return this.prisma.media.create({ data });
  }

  async findById(id: string): Promise<Media | null> {
    return this.prisma.media.findUnique({ where: { id } });
  }

  async findMany(args: Prisma.MediaFindManyArgs): Promise<Media[]> {
    return this.prisma.media.findMany(args);
  }

  async findByUrl(url: string): Promise<Media | null> {
    return this.prisma.media.findFirst({ where: { publicUrl: url } });
  }

  async findByUserId(userId: string, type?: MediaType): Promise<Media[]> {
    return this.prisma.media.findMany({
      where: { userId, ...(type && { type }) },
      orderBy: { createdAt: "desc" },
    });
  }

  async update(id: string, data: Prisma.MediaUpdateInput): Promise<Media> {
    return this.prisma.media.update({ where: { id }, data });
  }

  async updateStatus(
    id: string,
    status: MediaStatus,
    errorMessage?: string,
  ): Promise<Media> {
    return this.prisma.media.update({
      where: { id },
      data: { status, ...(errorMessage && { errorMessage }) },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.media.delete({ where: { id } });
  }

  async countByUserToday(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.prisma.media.count({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
    });
  }

  async sumSizeByUserToday(userId: string): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const result = await this.prisma.media.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfDay },
      },
      _sum: { size: true },
    });

    return result._sum.size || 0;
  }
}
