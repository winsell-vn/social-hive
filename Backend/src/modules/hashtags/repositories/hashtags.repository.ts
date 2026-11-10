import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, Hashtag } from "@prisma/client";

@Injectable()
export class HashtagsRepository {
  constructor(private prisma: PrismaService) {}

  async findByName(name: string): Promise<Hashtag | null> {
    return this.prisma.hashtag.findUnique({
      where: { name: name.toLowerCase() },
    });
  }

  async findById(id: string): Promise<Hashtag | null> {
    return this.prisma.hashtag.findUnique({ where: { id } });
  }

  async create(name: string): Promise<Hashtag> {
    return this.prisma.hashtag.create({
      data: { name: name.toLowerCase() },
    });
  }

  async findOrCreate(name: string): Promise<Hashtag> {
    const normalizedName = name.toLowerCase();
    const existing = await this.findByName(normalizedName);
    if (existing) return existing;
    return this.create(normalizedName);
  }

  async incrementPostCount(id: string): Promise<void> {
    await this.prisma.hashtag.update({
      where: { id },
      data: { postCount: { increment: 1 } },
    });
  }

  async decrementPostCount(id: string): Promise<void> {
    await this.prisma.hashtag.update({
      where: { id },
      data: { postCount: { decrement: 1 } },
    });
  }

  async linkToPost(postId: string, hashtagId: string): Promise<void> {
    await this.prisma.postHashtag.create({
      data: { postId, hashtagId },
    });
  }

  async unlinkFromPost(postId: string, hashtagId: string): Promise<void> {
    await this.prisma.postHashtag.delete({
      where: { postId_hashtagId: { postId, hashtagId } },
    });
  }

  async getPostHashtags(postId: string) {
    return this.prisma.postHashtag.findMany({
      where: { postId },
      include: { hashtag: true },
    });
  }

  async deletePostHashtags(postId: string): Promise<void> {
    await this.prisma.postHashtag.deleteMany({ where: { postId } });
  }

  async findTrending(limit: number = 10) {
    return this.prisma.hashtag.findMany({
      orderBy: { trendingScore: "desc" },
      take: limit,
    });
  }

  async findByNameWithPosts(name: string, skip: number, take: number) {
    const hashtag = await this.prisma.hashtag.findUnique({
      where: { name: name.toLowerCase() },
    });

    if (!hashtag) return null;

    const posts = await this.prisma.post.findMany({
      where: {
        hashtags: { some: { hashtagId: hashtag.id } },
        status: "PUBLISHED",
      },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      include: {
        author: { include: { profile: true } },
        hashtags: { include: { hashtag: true } },
        _count: { select: { comments: true, likes: true } },
      },
    });

    const total = await this.prisma.postHashtag.count({
      where: { hashtagId: hashtag.id },
    });

    return { hashtag, posts, total };
  }

  async updateTrendingScore(id: string, score: number): Promise<void> {
    await this.prisma.hashtag.update({
      where: { id },
      data: { trendingScore: score },
    });
  }
}
