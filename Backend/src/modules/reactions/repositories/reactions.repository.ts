import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Like, ReactionType } from "@prisma/client";

@Injectable()
export class ReactionsRepository {
  constructor(private prisma: PrismaService) {}

  async findPostReaction(userId: string, postId: string): Promise<Like | null> {
    return this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
  }

  async findCommentReaction(
    userId: string,
    commentId: string,
  ): Promise<Like | null> {
    return this.prisma.like.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
  }

  async createPostReaction(
    userId: string,
    postId: string,
    reactionType: ReactionType,
  ): Promise<Like> {
    return this.prisma.like.create({
      data: { userId, postId, reactionType },
    });
  }

  async createCommentReaction(
    userId: string,
    commentId: string,
    reactionType: ReactionType,
  ): Promise<Like> {
    return this.prisma.like.create({
      data: { userId, commentId, reactionType },
    });
  }

  async updateReaction(id: string, reactionType: ReactionType): Promise<Like> {
    return this.prisma.like.update({
      where: { id },
      data: { reactionType },
    });
  }

  async deleteReaction(id: string): Promise<void> {
    await this.prisma.like.delete({ where: { id } });
  }

  async getPostReactions(postId: string) {
    return this.prisma.like.findMany({
      where: { postId },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });
  }

  async getCommentReactions(commentId: string) {
    return this.prisma.like.findMany({
      where: { commentId },
      include: {
        user: {
          include: { profile: true },
        },
      },
    });
  }

  async getPostReactionCounts(postId: string) {
    const reactions = await this.prisma.like.groupBy({
      by: ["reactionType"],
      where: { postId },
      _count: { reactionType: true },
    });

    return reactions.reduce(
      (acc, r) => {
        acc[r.reactionType] = r._count.reactionType;
        return acc;
      },
      {} as Record<ReactionType, number>,
    );
  }

  async getCommentReactionCounts(commentId: string) {
    const reactions = await this.prisma.like.groupBy({
      by: ["reactionType"],
      where: { commentId },
      _count: { reactionType: true },
    });

    return reactions.reduce(
      (acc, r) => {
        acc[r.reactionType] = r._count.reactionType;
        return acc;
      },
      {} as Record<ReactionType, number>,
    );
  }

  async getUserReactionOnPost(userId: string, postId: string) {
    return this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
  }

  async getUserReactionOnComment(userId: string, commentId: string) {
    return this.prisma.like.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
  }

  async getUserReactionsOnPosts(userId: string, postIds: string[]) {
    return this.prisma.like.findMany({
      where: {
        userId,
        postId: { in: postIds },
      },
    });
  }
}
