import { Processor, Process } from "@nestjs/bull";
import { Job } from "bull";
import { Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { PostStatus } from "@prisma/client";

export interface PostPublishJob {
  postId: string;
}

@Processor("post-publish")
export class PostPublishProcessor {
  private readonly logger = new Logger(PostPublishProcessor.name);

  constructor(private prisma: PrismaService) {}

  @Process("publish-post")
  async handlePublishPost(job: Job<PostPublishJob>) {
    this.logger.log(`Publishing post ${job.data.postId}`);

    const post = await this.prisma.post.findUnique({
      where: { id: job.data.postId },
    });

    if (!post) {
      this.logger.warn(`Post ${job.data.postId} not found, skipping publish`);
      return { success: false, reason: "Post not found" };
    }

    // Only publish if still in APPROVED status
    if (post.status !== PostStatus.APPROVED) {
      this.logger.warn(
        `Post ${job.data.postId} is not in APPROVED status (current: ${post.status}), skipping publish`,
      );
      return { success: false, reason: "Post not in APPROVED status" };
    }

    await this.prisma.post.update({
      where: { id: job.data.postId },
      data: { status: PostStatus.PUBLISHED },
    });

    this.logger.log(`Post ${job.data.postId} published successfully`);
    return { success: true };
  }
}
