import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bull";
import { Queue } from "bull";
import { AiAgentService } from "./ai-agent.service";
import { AiRateLimiterService } from "./ai-rate-limiter.service";
import { AiProviderKeyService } from "./ai-provider-key.service";
import { AiActivityLogService } from "./ai-activity-log.service";
import { AiMemoryService } from "./ai-memory.service";
import { AiProviderClientService } from "./ai-provider-client.service";
import { PrismaService } from "../../../prisma/prisma.service";
import { AiAgent, AiActionType, AiAgentStatus } from "@prisma/client";
import { AiContentJobData } from "../processors/ai-content.processor";

@Injectable()
export class AiOrchestratorService implements OnModuleInit {
  private readonly logger = new Logger(AiOrchestratorService.name);
  private isRunning = false;

  constructor(
    @InjectQueue("ai-content")
    private readonly contentQueue: Queue<AiContentJobData>,
    private readonly aiAgentService: AiAgentService,
    private readonly rateLimiter: AiRateLimiterService,
    private readonly aiProviderKeyService: AiProviderKeyService,
    private readonly activityLogService: AiActivityLogService,
    private readonly memoryService: AiMemoryService,
    private readonly prisma: PrismaService,
    private readonly providerClient: AiProviderClientService,
  ) {}

  async onModuleInit() {
    this.logger.log("AI Orchestrator initialized");
  }

  /**
   * Main scheduling loop - runs every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async scheduleAgentActions(): Promise<void> {
    if (this.isRunning) {
      this.logger.debug("Scheduler already running, skipping...");
      return;
    }

    // Check if Groq API is available before scheduling any jobs
    const isApiAvailable = await this.providerClient.isAvailable();
    if (!isApiAvailable) {
      this.logger.warn(
        "Groq API circuit breaker is OPEN - skipping scheduling cycle",
      );
      return;
    }

    this.isRunning = true;
    this.logger.debug("Running AI agent scheduler...");

    try {
      const activeAgents = await this.aiAgentService.findActive();

      for (const agent of activeAgents) {
        await this.scheduleActionsForAgent(agent);
      }
    } catch (error) {
      this.logger.error(`Scheduler error: ${error.message}`, error.stack);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Schedule actions for a single agent
   */
  private async scheduleActionsForAgent(agent: AiAgent): Promise<void> {
    // Check if agent is within activity window
    const activityWindow = this.aiAgentService.getActivityWindow(agent);
    if (!this.rateLimiter.isWithinActivityWindow(activityWindow)) {
      this.logger.debug(`Agent ${agent.id} outside activity window, skipping`);
      return;
    }

    // Get agent's rate limit status
    const usage = await this.rateLimiter.getAgentUsage(agent.id);

    // Schedule posts if under limit
    if (
      usage.POST.used < agent.postFrequency &&
      usage.POST.used < usage.POST.limit
    ) {
      const shouldPost = this.shouldTakeAction(
        agent.postFrequency,
        usage.POST.used,
      );
      if (shouldPost) {
        await this.queueAction(agent.id, AiActionType.POST);
      }
    }

    // Schedule comments if under limit
    if (
      usage.COMMENT.used < agent.commentFrequency &&
      usage.COMMENT.used < usage.COMMENT.limit
    ) {
      const shouldComment = this.shouldTakeAction(
        agent.commentFrequency,
        usage.COMMENT.used,
      );
      if (shouldComment) {
        await this.queueCommentAction(agent);
      }
    }

    // Schedule reactions if under limit
    if (
      usage.REACTION.used < agent.reactionFrequency &&
      usage.REACTION.used < usage.REACTION.limit
    ) {
      const shouldReact = this.shouldTakeAction(
        agent.reactionFrequency,
        usage.REACTION.used,
      );
      if (shouldReact) {
        await this.queueReactionAction(agent);
      }
    }

    // Schedule shares if under limit (AC-059)
    // Share frequency is typically lower than other actions (1-2 per day)
    const shareFrequency = Math.max(1, Math.floor(agent.postFrequency / 3)); // ~1/3 of post frequency
    if (
      usage.SHARE &&
      usage.SHARE.used < shareFrequency &&
      usage.SHARE.used < usage.SHARE.limit
    ) {
      const shouldShare = this.shouldTakeAction(
        shareFrequency,
        usage.SHARE.used,
      );
      if (shouldShare) {
        await this.queueShareAction(agent);
      }
    }

    // Schedule replies if under limit (AC-071 to AC-075)
    // Reply frequency uses rate limiter default (30/day) since AiAgent doesn't have replyFrequency field
    const replyFrequency = usage.REPLY?.limit || 30;
    if (usage.REPLY && usage.REPLY.used < replyFrequency) {
      const shouldReply = this.shouldTakeAction(
        replyFrequency,
        usage.REPLY.used,
      );
      if (shouldReply) {
        await this.queueReplyAction(agent);
      }
    }
  }

  /**
   * Queue a content generation action
   */
  async queueAction(
    agentId: string,
    actionType: AiActionType,
    options: {
      targetId?: string;
      targetType?: "post" | "comment";
      customPrompt?: string;
      priority?: number;
      delay?: number;
      /** Enriched context for comment generation (AC-058) */
      postContent?: string;
      postAuthor?: string;
      authorBio?: string;
      hashtags?: string[];
      hasImages?: boolean;
      imageCount?: number;
    } = {},
  ): Promise<string> {
    const jobData: AiContentJobData = {
      agentId,
      actionType,
      targetId: options.targetId,
      targetType: options.targetType,
      customPrompt: options.customPrompt,
      priority: options.priority || 5,
      // Enriched context (AC-058)
      postContent: options.postContent,
      postAuthor: options.postAuthor,
      authorBio: options.authorBio,
      hashtags: options.hashtags,
      hasImages: options.hasImages,
      imageCount: options.imageCount,
    };

    // Calculate natural delay
    const delay =
      options.delay ?? this.rateLimiter.calculateNaturalDelay(30000, 50);

    const job = await this.contentQueue.add(
      this.getJobName(actionType),
      jobData,
      {
        delay,
        priority: options.priority || 5,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
      },
    );

    this.logger.debug(
      `Queued ${actionType} action for agent ${agentId}, job ${job.id}`,
    );

    return job.id.toString();
  }

  /**
   * Queue a comment action with a random target post and enriched context (AC-058)
   */
  private async queueCommentAction(agent: AiAgent): Promise<void> {
    // Find a recent post to comment on (not by AI agents, not already commented)
    const targetPost = await this.findPostToComment(agent.id);

    if (targetPost) {
      await this.queueAction(agent.id, AiActionType.COMMENT, {
        targetId: targetPost.id,
        targetType: "post",
        // Pass enriched context for better comment generation (AC-058)
        postContent: targetPost.content,
        postAuthor: targetPost.authorName,
        authorBio: targetPost.authorBio,
        hashtags: targetPost.hashtags,
        hasImages: targetPost.hasImages,
        imageCount: targetPost.imageCount,
      });
    }
  }

  /**
   * Queue a reaction action with a random target post
   */
  private async queueReactionAction(agent: AiAgent): Promise<void> {
    // Find a recent post to react to (not by AI agents, not already reacted)
    const targetPost = await this.findPostToReact(agent.id);

    if (targetPost) {
      await this.queueAction(agent.id, AiActionType.REACTION, {
        targetId: targetPost.id,
        targetType: "post",
      });
    }
  }

  /**
   * Queue a share action with a random target post (AC-059)
   * AI agent shares interesting posts to their profile with a personal caption
   */
  private async queueShareAction(agent: AiAgent): Promise<void> {
    // Find a recent post to share (not by AI agents, not already shared by this agent)
    const targetPost = await this.findPostToShare(agent.id);

    if (targetPost) {
      await this.queueAction(agent.id, AiActionType.SHARE, {
        targetId: targetPost.id,
        targetType: "post",
        // Pass enriched context for better share caption generation
        postContent: targetPost.content,
        postAuthor: targetPost.authorName,
        authorBio: targetPost.authorBio,
        hashtags: targetPost.hashtags,
        hasImages: targetPost.hasImages,
        imageCount: targetPost.imageCount,
      });
    }
  }

  /**
   * Queue a reply action to a comment on the agent's post (AC-071 to AC-075)
   * AI agent replies to comments from non-AI users on their own posts
   */
  private async queueReplyAction(agent: AiAgent): Promise<void> {
    // Find a comment to reply to on this agent's posts
    const targetComment = await this.findCommentToReply(agent.id);

    if (targetComment) {
      await this.queueAction(agent.id, AiActionType.REPLY, {
        targetId: targetComment.id,
        targetType: "comment",
        // Pass enriched context for better reply generation
        postContent: targetComment.postContent,
        postAuthor: targetComment.commentAuthor,
        authorBio: targetComment.authorBio,
      });
    }
  }

  /**
   * Find a comment to reply to on the agent's own posts (AC-071 to AC-075)
   * - Only targets comments on THIS agent's posts (AC-071)
   * - Only targets comments from NON-AI users to prevent AI loops (AC-072)
   * - Only targets TOP-LEVEL comments from last 48 hours (AC-073)
   * - Excludes comments already replied to by this agent (AC-073)
   * - Randomly selects from up to 10 eligible comments (AC-075)
   */
  private async findCommentToReply(agentId: string): Promise<{
    id: string;
    content: string;
    postContent: string;
    commentAuthor: string;
    authorBio?: string;
  } | null> {
    // Get the agent's user ID
    const agent = await this.aiAgentService.findById(agentId);

    // Calculate 48 hours ago for time filter (AC-073)
    const fortyEightHoursAgo = new Date();
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

    // Find comments on this agent's posts that meet all criteria
    const comments = await this.prisma.comment.findMany({
      where: {
        // Only comments on posts authored by this agent (AC-071)
        post: {
          authorId: agent.userId,
          status: "PUBLISHED",
        },
        // Only top-level comments (parentId = null)
        parentId: null,
        // Only comments from non-AI users (AC-072)
        author: {
          isAiAgent: false,
        },
        // Only comments from last 48 hours (AC-073)
        createdAt: {
          gte: fortyEightHoursAgo,
        },
        // Exclude comments already replied to by this agent (AC-073)
        replies: {
          none: {
            authorId: agent.userId,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10, // Take up to 10 eligible comments (AC-075)
      select: {
        id: true,
        content: true,
        post: {
          select: {
            content: true,
          },
        },
        author: {
          select: {
            profile: {
              select: {
                displayName: true,
                username: true,
                bio: true,
              },
            },
          },
        },
      },
    });

    if (comments.length === 0) return null;

    // Randomly select one comment from the eligible list (AC-075)
    const comment = comments[Math.floor(Math.random() * comments.length)];

    // Get comment author info
    const commentAuthor =
      comment.author.profile?.displayName ||
      comment.author.profile?.username ||
      "someone";
    const authorBio = comment.author.profile?.bio || undefined;

    return {
      id: comment.id,
      content: comment.content,
      postContent: comment.post.content,
      commentAuthor,
      authorBio,
    };
  }

  /**
   * Post data with enriched context for AI comment generation (AC-058)
   */
  private async findPostToComment(agentId: string): Promise<{
    id: string;
    content: string;
    authorName: string;
    authorBio?: string;
    hashtags: string[];
    hasImages: boolean;
    imageCount: number;
  } | null> {
    // Get the agent's user ID
    const agent = await this.aiAgentService.findById(agentId);

    // Find posts not by AI agents, not already commented by this agent
    const posts = await this.prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        author: {
          aiAgent: null, // Not an AI agent
        },
        comments: {
          none: {
            authorId: agent.userId, // Not already commented by this agent
            parentId: null, // Only check top-level comments
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        content: true,
        images: true,
        author: {
          select: {
            profile: {
              select: {
                displayName: true,
                username: true,
                bio: true,
              },
            },
          },
        },
      },
    });

    if (posts.length === 0) return null;

    // Select a random post from the list
    const post = posts[Math.floor(Math.random() * posts.length)];

    // Extract hashtags from content (AC-058)
    const hashtagRegex = /#[\w\u00C0-\u024F]+/g;
    const hashtags = post.content.match(hashtagRegex) || [];

    // Get author info
    const authorName =
      post.author.profile?.displayName ||
      post.author.profile?.username ||
      "someone";
    const authorBio = post.author.profile?.bio || undefined;

    // Check for images
    const images = post.images as string[] | null;
    const hasImages = images !== null && images.length > 0;
    const imageCount = hasImages ? images.length : 0;

    return {
      id: post.id,
      content: post.content,
      authorName,
      authorBio,
      hashtags,
      hasImages,
      imageCount,
    };
  }

  /**
   * Find a post to react to
   */
  private async findPostToReact(
    agentId: string,
  ): Promise<{ id: string } | null> {
    // Get the agent's user ID
    const agent = await this.aiAgentService.findById(agentId);

    // Find posts not by AI agents, not already reacted by this agent
    const posts = await this.prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        author: {
          aiAgent: null, // Not an AI agent
        },
        likes: {
          none: {
            userId: agent.userId, // Not already reacted by this agent
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true },
    });

    if (posts.length === 0) return null;

    // Return a random post from the list
    return posts[Math.floor(Math.random() * posts.length)];
  }

  /**
   * Find a post to share (AC-059)
   * Returns posts that are interesting/engaging and not already shared by this agent
   */
  private async findPostToShare(agentId: string): Promise<{
    id: string;
    content: string;
    authorName: string;
    authorBio?: string;
    hashtags: string[];
    hasImages: boolean;
    imageCount: number;
  } | null> {
    // Get the agent's user ID
    const agent = await this.aiAgentService.findById(agentId);

    // Find posts not by AI agents, not already shared by this agent
    // Prefer posts with higher engagement (likes, comments)
    const posts = await this.prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        sharedPostId: null, // Not a share itself (don't share shares)
        author: {
          aiAgent: null, // Not an AI agent
        },
        // Not already shared by this agent
        shares: {
          none: {
            authorId: agent.userId,
          },
        },
        // Prefer posts with some engagement
        OR: [{ likeCount: { gte: 2 } }, { commentCount: { gte: 1 } }],
      },
      orderBy: [
        { likeCount: "desc" },
        { commentCount: "desc" },
        { createdAt: "desc" },
      ],
      take: 15,
      select: {
        id: true,
        content: true,
        images: true,
        author: {
          select: {
            profile: {
              select: {
                displayName: true,
                username: true,
                bio: true,
              },
            },
          },
        },
      },
    });

    if (posts.length === 0) return null;

    // Select a random post from the top engaging posts
    const post = posts[Math.floor(Math.random() * posts.length)];

    // Extract hashtags from content
    const hashtagRegex = /#[\w\u00C0-\u024F]+/g;
    const hashtags = post.content.match(hashtagRegex) || [];

    // Get author info
    const authorName =
      post.author.profile?.displayName ||
      post.author.profile?.username ||
      "someone";
    const authorBio = post.author.profile?.bio || undefined;

    // Check for images
    const images = post.images as string[] | null;
    const hasImages = images !== null && images.length > 0;
    const imageCount = hasImages ? images.length : 0;

    return {
      id: post.id,
      content: post.content,
      authorName,
      authorBio,
      hashtags,
      hasImages,
      imageCount,
    };
  }

  /**
   * Determine if an action should be taken based on frequency and current usage
   */
  private shouldTakeAction(
    dailyFrequency: number,
    currentUsage: number,
  ): boolean {
    // Calculate probability based on remaining actions and time of day
    const remainingActions = dailyFrequency - currentUsage;
    if (remainingActions <= 0) return false;

    // Get hours remaining in the day
    const now = new Date();
    const hoursRemaining = 24 - now.getHours();

    // Calculate probability (higher if behind schedule)
    const expectedUsage = dailyFrequency * (now.getHours() / 24);
    const behindSchedule = currentUsage < expectedUsage;

    // Base probability: 20% per 5-minute interval
    let probability = 0.2;

    // Increase probability if behind schedule
    if (behindSchedule) {
      probability = 0.4;
    }

    // Decrease probability if ahead of schedule
    if (currentUsage > expectedUsage) {
      probability = 0.1;
    }

    // Increase probability if running low on time
    if (hoursRemaining < 6 && remainingActions > 0) {
      probability = Math.min(0.6, probability + 0.2);
    }

    return Math.random() < probability;
  }

  /**
   * Get job name for action type
   */
  private getJobName(actionType: AiActionType): string {
    const jobNames: Record<AiActionType, string> = {
      POST: "generate-post",
      COMMENT: "generate-comment",
      REPLY: "generate-reply",
      REACTION: "generate-reaction",
      SHARE: "generate-share",
    };
    return jobNames[actionType];
  }

  /**
   * Manually trigger an action for an agent (admin use)
   */
  async triggerAction(
    agentId: string,
    actionType: AiActionType,
    options: {
      targetId?: string;
      customPrompt?: string;
    } = {},
  ): Promise<string> {
    // Verify agent exists and is active
    const agent = await this.aiAgentService.findById(agentId);

    if (agent.status !== AiAgentStatus.ACTIVE) {
      throw new Error(`Agent ${agentId} is not active`);
    }

    // Queue with no delay for manual triggers
    return this.queueAction(agentId, actionType, {
      ...options,
      delay: 0,
      priority: 1, // High priority for manual triggers
    });
  }

  /**
   * Reset daily usage counters (runs at midnight)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async resetDailyCounters(): Promise<void> {
    this.logger.log("Resetting daily usage counters...");
    await this.aiProviderKeyService.resetDailyUsage();
  }

  /**
   * Clean up expired memories (runs daily at 3 AM)
   */
  @Cron("0 3 * * *")
  async cleanupMemories(): Promise<void> {
    this.logger.log("Cleaning up expired memories...");
    await this.memoryService.cleanupExpired();
  }

  /**
   * Clean up old activity logs (runs daily at 4 AM)
   * Changed from weekly to daily to prevent log table bloat during API failures
   */
  @Cron(CronExpression.EVERY_DAY_AT_4AM)
  async cleanupActivityLogs(): Promise<void> {
    this.logger.log("Cleaning up old activity logs...");
    await this.activityLogService.cleanupOldLogs(30); // Keep 30 days
  }

  /**
   * Get queue status
   */
  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.contentQueue.getWaitingCount(),
      this.contentQueue.getActiveCount(),
      this.contentQueue.getCompletedCount(),
      this.contentQueue.getFailedCount(),
      this.contentQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  /**
   * Pause all AI agent activities
   */
  async pauseAll(): Promise<void> {
    await this.contentQueue.pause();
    this.logger.warn("AI content queue paused");
  }

  /**
   * Resume all AI agent activities
   */
  async resumeAll(): Promise<void> {
    await this.contentQueue.resume();
    this.logger.log("AI content queue resumed");
  }

  /**
   * Get all pending jobs in the queue
   */
  async getPendingJobs(): Promise<AiContentJobData[]> {
    const jobs = await this.contentQueue.getJobs(["waiting", "delayed"]);
    return jobs.map((job) => job.data);
  }

  /**
   * Clear all pending jobs from the queue
   */
  async clearQueue(): Promise<void> {
    await this.contentQueue.empty();
    this.logger.warn("AI content queue cleared");
  }
}
