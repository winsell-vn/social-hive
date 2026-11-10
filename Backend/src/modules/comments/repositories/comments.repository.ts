import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, Comment } from "@prisma/client";

@Injectable()
export class CommentsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.CommentCreateInput): Promise<Comment> {
    return this.prisma.comment.create({ data });
  }

  async findById(id: string): Promise<Comment | null> {
    return this.prisma.comment.findUnique({ where: { id } });
  }

  async findByIdWithAuthor(id: string) {
    return this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: { include: { profile: true } },
        _count: { select: { likes: true, replies: true } },
      },
    });
  }

  async findByPostId(postId: string, skip: number, take: number) {
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId, parentId: null },
        skip,
        take,
        orderBy: { createdAt: "desc" },
        include: {
          author: { include: { profile: true } },
          _count: { select: { likes: true, replies: true } },
          replies: {
            take: 3,
            orderBy: { createdAt: "asc" },
            include: {
              author: { include: { profile: true } },
              _count: { select: { likes: true } },
            },
          },
        },
      }),
      this.prisma.comment.count({ where: { postId, parentId: null } }),
    ]);

    return { comments, total };
  }

  async findReplies(parentId: string, skip: number, take: number) {
    const [replies, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { parentId },
        skip,
        take,
        orderBy: { createdAt: "asc" },
        include: {
          author: { include: { profile: true } },
          _count: { select: { likes: true } },
        },
      }),
      this.prisma.comment.count({ where: { parentId } }),
    ]);

    return { replies, total };
  }

  async update(id: string, data: Prisma.CommentUpdateInput): Promise<Comment> {
    return this.prisma.comment.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.comment.delete({ where: { id } });
  }

  async countByPostId(postId: string): Promise<number> {
    return this.prisma.comment.count({ where: { postId } });
  }

  /**
   * Find a top-level comment by author and post (AC-055)
   * Used to check if user already has a top-level comment on a post
   * Only checks comments where parentId is null (top-level comments)
   */
  async findByAuthorAndPost(
    authorId: string,
    postId: string,
    parentId: string | null = null,
  ): Promise<Comment | null> {
    return this.prisma.comment.findFirst({
      where: {
        authorId,
        postId,
        parentId,
      },
    });
  }
}
