import {
  Processor,
  Process,
  OnQueueActive,
  OnQueueFailed,
  OnQueueCompleted,
} from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";
import { AiActionType, ContentFilterResult, Tier } from "@prisma/client";
import { ContentGeneratorService } from "../services/content-generator.service";
import { AiAgentService } from "../services/ai-agent.service";
import { AiActivityLogService } from "../services/ai-activity-log.service";
import { PostsService } from "../../posts/services/posts.service";
import { CommentsService } from "../../comments/services/comments.service";
import { ReactionsService } from "../../reactions/services/reactions.service";
import { PrismaService } from "../../../prisma/prisma.service";

/**
 * Job data for AI content generation jobs
 */
export interface AiContentJobData {
  /** The AI agent ID that will perform the action */
  agentId: string;
  /** Type of action to perform */
  actionType: AiActionType;
  /** Target ID - Post ID for comments/reactions, Comment ID for replies */
  targetId?: string;
  /** Target type - 'post' or 'comment' */
  targetType?: "post" | "comment";
  /** Optional custom prompt override */
  customPrompt?: string;
  /** Job priority (1-10, lower = higher priority) */
  priority?: number;
  /** Enriched context for comment generation (AC-058) */
  postContent?: string;
  postAuthor?: string;
  authorBio?: string;
  hashtags?: string[];
  hasImages?: boolean;
  imageCount?: number;
}

/**
 * Result returned from AI content generation jobs
 */
export interface AiContentJobResult {
  /** Whether the job completed successfully */
  success: boolean;
  /** ID of created content (post, comment, reaction, etc.) */
  contentId?: string;
  /** Number of tokens used for generation */
  tokensUsed?: number;
  /** Error message if job failed */
  error?: string;
  /** Whether content was filtered */
  filtered?: boolean;
  /** Reason for filtering */
  filterReason?: string;
}

/**
 * Processor for AI content generation queue jobs.
 * Handles async content generation for AI agents via BullMQ.
 *
 * Job types:
 * - generate-post: Create a new post
 * - generate-comment: Comment on a post
 * - generate-reply: Reply to a comment
 * - generate-reaction: React to a post
 * - generate-message: Reply to a message (future implementation)
 */
@Processor("ai-content")
export class AiContentProcessor {
  private readonly logger = new Logger(AiContentProcessor.name);

  // Typing delay configuration (AC-030)
  private readonly TYPING_BASE_DELAY_MS = 2000; // 2 seconds thinking time
  private readonly TYPING_MS_PER_CHAR = 50; // ~20 WPM typing speed
  private readonly TYPING_RANDOMIZATION_FACTOR = 0.2; // ±20% variation

  constructor(
    private readonly contentGenerator: ContentGeneratorService,
    private readonly aiAgentService: AiAgentService,
    private readonly activityLogService: AiActivityLogService,
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
    private readonly reactionsService: ReactionsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Calculate typing delay based on content length (AC-030)
   * Formula: delay = baseDelay + (contentLength * msPerChar) with ±20% randomization
   */
  private calculateTypingDelay(contentLength: number): number {
    const baseDelay =
      this.TYPING_BASE_DELAY_MS + contentLength * this.TYPING_MS_PER_CHAR;

    // Add randomization factor (±20%) for natural variation
    const randomFactor =
      1 + (Math.random() * 2 - 1) * this.TYPING_RANDOMIZATION_FACTOR;
    const delay = Math.round(baseDelay * randomFactor);

    return delay;
  }

  /**
   * Simulate typing delay before posting content (AC-030)
   */
  private async simulateTypingDelay(content: string): Promise<void> {
    const delay = this.calculateTypingDelay(content.length);
    this.logger.debug(
      `Simulating typing delay: ${delay}ms for ${content.length} characters`,
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Queue event handler for active jobs
   * Logs when a job starts processing
   */
  @OnQueueActive()
  onActive(job: Job<AiContentJobData>): void {
    this.logger.debug(
      `Processing job ${job.id}: ${job.data.actionType} for agent ${job.data.agentId}`,
    );
  }

  /**
   * Queue event handler for completed jobs
   * Logs successful job completion with metrics
   */
  @OnQueueCompleted()
  onCompleted(job: Job<AiContentJobData>, result: AiContentJobResult): void {
    this.logger.debug(
      `Job ${job.id} completed: ${result.success ? "success" : "failed"}` +
        (result.tokensUsed ? `, tokens: ${result.tokensUsed}` : ""),
    );
  }

  /**
   * Queue event handler for failed jobs
   * Logs job failures with error details
   */
  @OnQueueFailed()
  onFailed(job: Job<AiContentJobData>, error: Error): void {
    this.logger.error(
      `Job ${job.id} failed for agent ${job.data.agentId}: ${error.message}`,
      error.stack,
    );
  }

  /**
   * Handle post generation jobs
   * Creates a new post for the specified AI agent
   */
  @Process("generate-post")
  async handleGeneratePost(
    job: Job<AiContentJobData>,
  ): Promise<AiContentJobResult> {
    const { agentId, customPrompt } = job.data;

    try {
      // Get agent details
      const agent = await this.aiAgentService.findById(agentId);

      // Generate content via Groq API
      const generated = await this.contentGenerator.generatePost(agent, {
        customPrompt,
      });

      // Check if content was filtered
      if (generated.filtered) {
        await this.activityLogService.logFiltered(
          agentId,
          AiActionType.POST,
          this.mapFilterReasonToResult(generated.filterReason),
          { tokensUsed: generated.tokensUsed },
        );

        return {
          success: false,
          filtered: true,
          filterReason: generated.filterReason,
          tokensUsed: generated.tokensUsed,
        };
      }

      // Simulate typing delay before posting (AC-030)
      await this.simulateTypingDelay(generated.content);

      // Create the post via PostsService
      // AI agents have LEGEND tier for auto-approval
      const post = await this.postsService.create(
        agent.userId,
        { content: generated.content },
        Tier.LEGEND,
      );

      if (!post) {
        throw new Error("Failed to create post");
      }

      // Update agent stats
      await this.aiAgentService.incrementStats(agentId, "post");

      // Log success
      await this.activityLogService.logSuccess(agentId, AiActionType.POST, {
        targetId: post.id,
        targetType: "post",
        content: generated.content.substring(0, 200),
        tokensUsed: generated.tokensUsed,
      });

      return {
        success: true,
        contentId: post.id,
        tokensUsed: generated.tokensUsed,
      };
    } catch (error) {
      // Log failure
      await this.activityLogService.logFailure(
        agentId,
        AiActionType.POST,
        error.message,
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle comment generation jobs
   * Creates a comment on a target post for the specified AI agent
   * Uses enriched context from job data for better comment generation (AC-058)
   */
  @Process("generate-comment")
  async handleGenerateComment(
    job: Job<AiContentJobData>,
  ): Promise<AiContentJobResult> {
    const {
      agentId,
      targetId,
      customPrompt,
      // Enriched context from orchestrator (AC-058)
      postContent: jobPostContent,
      postAuthor: jobPostAuthor,
      authorBio,
      hashtags,
      hasImages,
      imageCount,
    } = job.data;

    if (!targetId) {
      return { success: false, error: "No target post ID provided" };
    }

    try {
      // Get agent details
      const agent = await this.aiAgentService.findById(agentId);

      // Check if agent already has a top-level comment on this post (AC-055)
      // This prevents duplicate comments even in race conditions
      const existingComment = await this.prisma.comment.findFirst({
        where: {
          postId: targetId,
          authorId: agent.userId,
          parentId: null, // Only check top-level comments
        },
      });

      if (existingComment) {
        this.logger.debug(
          `Agent ${agentId} already commented on post ${targetId}, skipping`,
        );

        // Log the skipped action (AC-057)
        await this.activityLogService.logFiltered(
          agentId,
          AiActionType.COMMENT,
          ContentFilterResult.BLOCKED_DUPLICATE,
          { targetId },
        );

        return {
          success: false,
          filtered: true,
          filterReason: "Agent already has a top-level comment on this post",
        };
      }

      // Use enriched context from job data if available, otherwise fetch from DB (AC-058)
      let postContent = jobPostContent;
      let postAuthor = jobPostAuthor;

      if (!postContent) {
        // Fallback: Get target post with author info from database
        const post = await this.prisma.post.findUnique({
          where: { id: targetId },
          include: {
            author: {
              include: { profile: true },
            },
          },
        });

        if (!post) {
          return { success: false, error: "Target post not found" };
        }

        postContent = post.content;
        postAuthor =
          post.author.profile?.displayName ||
          post.author.profile?.username ||
          "someone";
      }

      // Generate comment via Groq API with enriched context (AC-058)
      const generated = await this.contentGenerator.generateComment(
        agent,
        postContent,
        postAuthor || "someone",
        {
          customPrompt,
          authorBio,
          hashtags,
          hasImages,
          imageCount,
        },
      );

      // Check if content was filtered
      if (generated.filtered) {
        await this.activityLogService.logFiltered(
          agentId,
          AiActionType.COMMENT,
          this.mapFilterReasonToResult(generated.filterReason),
          { targetId, tokensUsed: generated.tokensUsed },
        );

        return {
          success: false,
          filtered: true,
          filterReason: generated.filterReason,
          tokensUsed: generated.tokensUsed,
        };
      }

      // Simulate typing delay before posting comment (AC-030)
      await this.simulateTypingDelay(generated.content);

      // Create the comment via CommentsService
      const comment = await this.commentsService.create(
        agent.userId,
        targetId,
        {
          content: generated.content,
        },
      );

      if (!comment) {
        throw new Error("Failed to create comment");
      }

      // Update agent stats
      await this.aiAgentService.incrementStats(agentId, "comment");

      // Log success
      await this.activityLogService.logSuccess(agentId, AiActionType.COMMENT, {
        targetId: comment.id,
        targetType: "comment",
        content: generated.content.substring(0, 200),
        tokensUsed: generated.tokensUsed,
      });

      return {
        success: true,
        contentId: comment.id,
        tokensUsed: generated.tokensUsed,
      };
    } catch (error) {
      // Log failure
      await this.activityLogService.logFailure(
        agentId,
        AiActionType.COMMENT,
        error.message,
        { targetId },
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle reply generation jobs
   * Creates a reply to a target comment for the specified AI agent
   */
  @Process("generate-reply")
  async handleGenerateReply(
    job: Job<AiContentJobData>,
  ): Promise<AiContentJobResult> {
    const { agentId, targetId, customPrompt } = job.data;

    if (!targetId) {
      return { success: false, error: "No target comment ID provided" };
    }

    try {
      // Get agent details
      const agent = await this.aiAgentService.findById(agentId);

      // Get target comment with post and author info
      const comment = await this.prisma.comment.findUnique({
        where: { id: targetId },
        include: {
          post: true,
          author: {
            include: { profile: true },
          },
        },
      });

      if (!comment) {
        return { success: false, error: "Target comment not found" };
      }

      // Get comment author name for context
      const commentAuthor =
        comment.author.profile?.displayName ||
        comment.author.profile?.username ||
        "someone";

      // Generate reply via Groq API
      const generated = await this.contentGenerator.generateReply(
        agent,
        comment.post.content,
        comment.content,
        commentAuthor,
        { customPrompt },
      );

      // Check if content was filtered
      if (generated.filtered) {
        await this.activityLogService.logFiltered(
          agentId,
          AiActionType.REPLY,
          this.mapFilterReasonToResult(generated.filterReason),
          { targetId, tokensUsed: generated.tokensUsed },
        );

        return {
          success: false,
          filtered: true,
          filterReason: generated.filterReason,
          tokensUsed: generated.tokensUsed,
        };
      }

      // Simulate typing delay before posting reply (AC-030)
      await this.simulateTypingDelay(generated.content);

      // Create the reply as a comment with parentId
      const reply = await this.commentsService.create(
        agent.userId,
        comment.postId,
        {
          content: generated.content,
          parentId: targetId,
        },
      );

      if (!reply) {
        throw new Error("Failed to create reply");
      }

      // Update agent stats (replies count as comments)
      await this.aiAgentService.incrementStats(agentId, "comment");

      // Log success
      await this.activityLogService.logSuccess(agentId, AiActionType.REPLY, {
        targetId: reply.id,
        targetType: "comment",
        content: generated.content.substring(0, 200),
        tokensUsed: generated.tokensUsed,
      });

      return {
        success: true,
        contentId: reply.id,
        tokensUsed: generated.tokensUsed,
      };
    } catch (error) {
      // Log failure
      await this.activityLogService.logFailure(
        agentId,
        AiActionType.REPLY,
        error.message,
        { targetId },
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle reaction generation jobs
   * Adds a reaction to a target post for the specified AI agent
   */
  @Process("generate-reaction")
  async handleGenerateReaction(
    job: Job<AiContentJobData>,
  ): Promise<AiContentJobResult> {
    const { agentId, targetId } = job.data;

    if (!targetId) {
      return { success: false, error: "No target post ID provided" };
    }

    try {
      // Get agent details
      const agent = await this.aiAgentService.findById(agentId);

      // Get target post
      const post = await this.prisma.post.findUnique({
        where: { id: targetId },
      });

      if (!post) {
        return { success: false, error: "Target post not found" };
      }

      // Check if agent is the post author (prevent self-reaction)
      if (post.authorId === agent.userId) {
        return { success: false, error: "Cannot react to own post" };
      }

      // Determine reaction type based on personality and content
      const reactionResult = await this.contentGenerator.determineReaction(
        agent,
        post.content,
      );

      // Create the reaction via ReactionsService
      const reaction = await this.reactionsService.reactToPost(
        agent.userId,
        targetId,
        reactionResult.reactionType,
      );

      // Update agent stats
      await this.aiAgentService.incrementStats(agentId, "reaction");

      // Log success
      await this.activityLogService.logSuccess(agentId, AiActionType.REACTION, {
        targetId: reaction.id,
        targetType: "reaction",
        content: reactionResult.reactionType,
        tokensUsed: reactionResult.tokensUsed,
      });

      return {
        success: true,
        contentId: reaction.id,
        tokensUsed: reactionResult.tokensUsed,
      };
    } catch (error) {
      // Log failure
      await this.activityLogService.logFailure(
        agentId,
        AiActionType.REACTION,
        error.message,
        { targetId },
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle message generation jobs
   * Creates a message reply for the specified AI agent
   * Note: Full implementation planned for future phase
   */
  @Process("generate-message")
  async handleGenerateMessage(
    job: Job<AiContentJobData>,
  ): Promise<AiContentJobResult> {
    const { agentId } = job.data;

    // Message handling will be implemented in a future phase
    this.logger.warn(
      `Message generation not yet implemented for agent ${agentId}`,
    );

    return {
      success: false,
      error: "Message generation not yet implemented",
    };
  }

  /**
   * Handle share generation jobs (AC-059)
   * Shares a post to the AI agent's profile with a personal caption
   */
  @Process("generate-share")
  async handleGenerateShare(
    job: Job<AiContentJobData>,
  ): Promise<AiContentJobResult> {
    const {
      agentId,
      targetId,
      customPrompt,
      // Enriched context from orchestrator
      postContent: jobPostContent,
      postAuthor: jobPostAuthor,
      authorBio,
      hashtags,
    } = job.data;

    if (!targetId) {
      return { success: false, error: "No target post ID provided" };
    }

    try {
      // Get agent details
      const agent = await this.aiAgentService.findById(agentId);

      // Use enriched context from job data if available, otherwise fetch from DB
      let postContent = jobPostContent;
      let postAuthor = jobPostAuthor;

      if (!postContent) {
        // Fallback: Get target post with author info from database
        const post = await this.prisma.post.findUnique({
          where: { id: targetId },
          include: {
            author: {
              include: { profile: true },
            },
          },
        });

        if (!post) {
          return { success: false, error: "Target post not found" };
        }

        // Check if post is published
        if (post.status !== "PUBLISHED") {
          return { success: false, error: "Cannot share unpublished post" };
        }

        // Check if it's the agent's own post
        if (post.authorId === agent.userId) {
          return { success: false, error: "Cannot share own post" };
        }

        postContent = post.content;
        postAuthor =
          post.author.profile?.displayName ||
          post.author.profile?.username ||
          "someone";
      }

      // Generate share caption via Groq API
      const generated = await this.contentGenerator.generateShareCaption(
        agent,
        postContent,
        postAuthor || "someone",
        {
          customPrompt,
          authorBio,
          hashtags,
        },
      );

      // Check if content was filtered
      if (generated.filtered) {
        await this.activityLogService.logFiltered(
          agentId,
          AiActionType.SHARE,
          this.mapFilterReasonToResult(generated.filterReason),
          { targetId, tokensUsed: generated.tokensUsed },
        );

        return {
          success: false,
          filtered: true,
          filterReason: generated.filterReason,
          tokensUsed: generated.tokensUsed,
        };
      }

      // Simulate typing delay before sharing (AC-030)
      await this.simulateTypingDelay(generated.content);

      // Create the share via PostsService
      // AI agents have LEGEND tier for auto-approval
      const sharePost = await this.postsService.sharePost(
        agent.userId,
        targetId,
        generated.content,
        Tier.LEGEND,
      );

      if (!sharePost) {
        throw new Error("Failed to create share post");
      }

      // Update agent stats (shares count as posts)
      await this.aiAgentService.incrementStats(agentId, "post");

      // Log success
      await this.activityLogService.logSuccess(agentId, AiActionType.SHARE, {
        targetId: sharePost.id,
        targetType: "post",
        content: generated.content.substring(0, 200),
        tokensUsed: generated.tokensUsed,
      });

      return {
        success: true,
        contentId: sharePost.id,
        tokensUsed: generated.tokensUsed,
      };
    } catch (error) {
      // Log failure
      await this.activityLogService.logFailure(
        agentId,
        AiActionType.SHARE,
        error.message,
        { targetId },
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Map filter reason string to ContentFilterResult enum
   */
  private mapFilterReasonToResult(reason?: string): ContentFilterResult {
    if (!reason) return ContentFilterResult.BLOCKED_QUALITY;

    const lowerReason = reason.toLowerCase();

    if (
      lowerReason.includes("profanity") ||
      lowerReason.includes("offensive")
    ) {
      return ContentFilterResult.BLOCKED_PROFANITY;
    }
    if (lowerReason.includes("duplicate")) {
      return ContentFilterResult.BLOCKED_DUPLICATE;
    }
    if (lowerReason.includes("spam")) {
      return ContentFilterResult.BLOCKED_SPAM;
    }

    return ContentFilterResult.BLOCKED_QUALITY;
  }
}
