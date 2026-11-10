import { Injectable, Logger } from "@nestjs/common";
import { AiProviderClientService } from "./ai-provider-client.service";
import { AiProviderKeyService } from "./ai-provider-key.service";
import { AiMemoryService } from "./ai-memory.service";
import { ContentFilterService } from "./content-filter.service";
import { AiRateLimiterService } from "./ai-rate-limiter.service";
import { AiAgent, ReactionType } from "@prisma/client";
import {
  buildPostSystemPrompt,
  buildPostUserPrompt,
  buildCommentSystemPrompt,
  buildCommentUserPrompt,
  buildReplySystemPrompt,
  buildReplyUserPrompt,
  buildReactionPrompt,
  buildShareSystemPrompt,
  buildShareUserPrompt,
  getRandomTopic,
  getRandomTopicExcluding,
} from "../prompts";

export interface GeneratedContent {
  content: string;
  tokensUsed: number;
  filtered: boolean;
  filterReason?: string;
}

export interface GeneratedReaction {
  reactionType: ReactionType;
  tokensUsed: number;
}

@Injectable()
export class ContentGeneratorService {
  private readonly logger = new Logger(ContentGeneratorService.name);

  constructor(
    private readonly providerClient: AiProviderClientService,
    private readonly aiProviderKeyService: AiProviderKeyService,
    private readonly memoryService: AiMemoryService,
    private readonly contentFilter: ContentFilterService,
    private readonly rateLimiter: AiRateLimiterService,
  ) {}

  /**
   * Generate a post for an AI agent (AC-076, AC-077, AC-078, AC-080)
   * Implements topic diversity by excluding recently used topics
   */
  async generatePost(
    agent: AiAgent,
    options: {
      topic?: string;
      mood?: string;
      customPrompt?: string;
    } = {},
  ): Promise<GeneratedContent> {
    const personality = this.parsePersonality(agent);

    // AC-076: Get recent topics to exclude from selection
    const recentTopics = await this.memoryService.getRecentTopics(agent.id);

    // AC-077: Select topic from diverse pool, excluding recent ones
    const selectedTopic =
      options.topic || getRandomTopicExcluding(recentTopics);

    // Get agent context from memory
    const contextPrompt = await this.memoryService.buildContextPrompt(agent.id);

    // Build prompts
    const systemPrompt =
      options.customPrompt ||
      buildPostSystemPrompt({
        personality,
        emojiUsage: "moderate",
        hashtagUsage: "moderate",
        maxLength: 500,
      });

    // AC-078: Pass excluded topics to prompt for LLM awareness
    const userPrompt = buildPostUserPrompt({
      topic: selectedTopic,
      mood: options.mood,
      context: contextPrompt || undefined,
      excludedTopics: recentTopics.length > 0 ? recentTopics : undefined,
    });

    // Generate content
    const result = await this.generateWithApiKey(
      agent,
      systemPrompt,
      userPrompt,
    );

    // Filter content (includes similarity check via AC-079)
    const filterResult = await this.contentFilter.filterContent(
      result.content,
      agent.id,
    );

    if (!filterResult.passed) {
      return {
        content: result.content,
        tokensUsed: result.tokensUsed,
        filtered: true,
        filterReason: filterResult.reason,
      };
    }

    // Record in memory
    await this.memoryService.recordPost(agent.id, result.content);

    // AC-080: Record topic in Redis with 7-day TTL after successful generation
    await this.memoryService.recordTopic(agent.id, selectedTopic);

    return {
      content: this.cleanContent(result.content),
      tokensUsed: result.tokensUsed,
      filtered: false,
    };
  }

  /**
   * Generate a comment for an AI agent with enriched context (AC-058)
   */
  async generateComment(
    agent: AiAgent,
    postContent: string,
    postAuthor: string,
    options: {
      commentType?: "supportive" | "curious" | "insightful" | "humorous";
      customPrompt?: string;
      /** Author bio for better context understanding (AC-058) */
      authorBio?: string;
      /** Hashtags from the post (AC-058) */
      hashtags?: string[];
      /** Whether the post has images (AC-058) */
      hasImages?: boolean;
      /** Number of images in the post (AC-058) */
      imageCount?: number;
    } = {},
  ): Promise<GeneratedContent> {
    const personality = this.parsePersonality(agent);

    // Build prompts
    const systemPrompt =
      options.customPrompt ||
      buildCommentSystemPrompt({
        personality,
        emojiUsage: "minimal",
        maxLength: 200,
      });

    // Build user prompt with enriched context (AC-058)
    const userPrompt = buildCommentUserPrompt({
      postContent,
      postAuthor,
      authorBio: options.authorBio,
      hashtags: options.hashtags,
      hasImages: options.hasImages,
      imageCount: options.imageCount,
      commentType: options.commentType || this.getRandomCommentType(),
    });

    // Generate content
    const result = await this.generateWithApiKey(
      agent,
      systemPrompt,
      userPrompt,
    );

    // Filter content
    const filterResult = await this.contentFilter.filterContent(
      result.content,
      agent.id,
    );

    if (!filterResult.passed) {
      return {
        content: result.content,
        tokensUsed: result.tokensUsed,
        filtered: true,
        filterReason: filterResult.reason,
      };
    }

    // Record in memory
    await this.memoryService.recordComment(
      agent.id,
      postContent,
      result.content,
    );

    return {
      content: this.cleanContent(result.content),
      tokensUsed: result.tokensUsed,
      filtered: false,
    };
  }

  /**
   * Generate a reply to a comment
   */
  async generateReply(
    agent: AiAgent,
    originalPost: string,
    commentContent: string,
    commentAuthor: string,
    options: {
      customPrompt?: string;
    } = {},
  ): Promise<GeneratedContent> {
    const personality = this.parsePersonality(agent);

    // Build prompts
    const systemPrompt =
      options.customPrompt ||
      buildReplySystemPrompt({
        personality,
        emojiUsage: "minimal",
        maxLength: 150,
      });

    const userPrompt = buildReplyUserPrompt({
      originalPost,
      commentContent,
      commentAuthor,
    });

    // Generate content
    const result = await this.generateWithApiKey(
      agent,
      systemPrompt,
      userPrompt,
    );

    // Filter content
    const filterResult = await this.contentFilter.filterContent(
      result.content,
      agent.id,
    );

    if (!filterResult.passed) {
      return {
        content: result.content,
        tokensUsed: result.tokensUsed,
        filtered: true,
        filterReason: filterResult.reason,
      };
    }

    return {
      content: this.cleanContent(result.content),
      tokensUsed: result.tokensUsed,
      filtered: false,
    };
  }

  /**
   * Determine reaction type for a post
   */
  async determineReaction(
    agent: AiAgent,
    postContent: string,
  ): Promise<GeneratedReaction> {
    const prompt = buildReactionPrompt(postContent);

    // Generate reaction decision
    const result = await this.generateWithApiKey(
      agent,
      "You are analyzing social media content to determine the most appropriate reaction.",
      prompt,
    );

    // Parse reaction type
    const reactionType = this.parseReactionType(result.content);

    // Record in memory
    await this.memoryService.recordReaction(
      agent.id,
      postContent,
      reactionType,
    );

    return {
      reactionType,
      tokensUsed: result.tokensUsed,
    };
  }

  /**
   * Generate content using the agent's API key
   */
  private async generateWithApiKey(
    agent: AiAgent,
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{ content: string; tokensUsed: number }> {
    // Get decrypted API key together with the provider endpoint configuration
    const providerConfig = await this.aiProviderKeyService.getProviderConfig(
      agent.apiKeyId,
    );

    // Check rate limit
    const rateLimit = await this.rateLimiter.checkProviderRateLimit(agent.apiKeyId);
    if (!rateLimit.allowed) {
      throw new Error(
        `Rate limit exceeded. Retry after ${rateLimit.retryAfter} seconds`,
      );
    }

    // Generate content
    const result = await this.providerClient.generateContent(
      providerConfig.apiKey,
      systemPrompt,
      userPrompt,
      {
        baseUrl: providerConfig.baseUrl,
        modelId: providerConfig.modelId,
        protocol: providerConfig.protocol,
        temperature: 0.8,
        maxTokens: 512,
      },
    );

    // Record usage
    await this.aiProviderKeyService.recordUsage(agent.apiKeyId, result.tokensUsed);

    return result;
  }

  /**
   * Parse personality from agent JSON
   */
  private parsePersonality(agent: AiAgent): {
    traits: string;
    tone: string;
    interests?: string[];
    writingStyle?: string;
  } {
    try {
      return JSON.parse(agent.personality);
    } catch {
      return { traits: "friendly, helpful", tone: "casual and warm" };
    }
  }

  /**
   * Parse reaction type from LLM response
   */
  private parseReactionType(response: string): ReactionType {
    const normalized = response.trim().toUpperCase();

    const validReactions: ReactionType[] = [
      ReactionType.LIKE,
      ReactionType.LOVE,
      ReactionType.HAHA,
      ReactionType.WOW,
      ReactionType.SAD,
      ReactionType.ANGRY,
    ];

    for (const reaction of validReactions) {
      if (normalized.includes(reaction)) {
        return reaction;
      }
    }

    // Default to LIKE if parsing fails
    return ReactionType.LIKE;
  }

  /**
   * Get random comment type based on distribution
   */
  private getRandomCommentType():
    | "supportive"
    | "curious"
    | "insightful"
    | "humorous" {
    const types: ("supportive" | "curious" | "insightful" | "humorous")[] = [
      "supportive",
      "supportive",
      "supportive", // 30%
      "curious",
      "curious", // 20%
      "insightful",
      "insightful",
      "insightful", // 30%
      "humorous",
      "humorous", // 20%
    ];
    return types[Math.floor(Math.random() * types.length)];
  }

  /**
   * Clean generated content (remove quotes, trim, etc.)
   */
  private cleanContent(content: string): string {
    let cleaned = content.trim();

    // Remove surrounding quotes if present
    if (
      (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
      (cleaned.startsWith("'") && cleaned.endsWith("'"))
    ) {
      cleaned = cleaned.slice(1, -1);
    }

    // Remove common LLM artifacts
    cleaned = cleaned.replace(/^(Here's|Here is|Sure,|Okay,|Alright,)\s*/i, "");

    return cleaned.trim();
  }

  /**
   * Generate a share caption for an AI agent (AC-059)
   * Creates a personal comment/caption when sharing a post
   */
  async generateShareCaption(
    agent: AiAgent,
    postContent: string,
    postAuthor: string,
    options: {
      customPrompt?: string;
      authorBio?: string;
      hashtags?: string[];
    } = {},
  ): Promise<GeneratedContent> {
    const personality = this.parsePersonality(agent);

    // Build prompts
    const systemPrompt =
      options.customPrompt ||
      buildShareSystemPrompt({
        personality,
        emojiUsage: "minimal",
        maxLength: 150,
      });

    const userPrompt = buildShareUserPrompt({
      postContent,
      postAuthor,
      authorBio: options.authorBio,
      hashtags: options.hashtags,
    });

    // Generate content
    const result = await this.generateWithApiKey(
      agent,
      systemPrompt,
      userPrompt,
    );

    // Filter content
    const filterResult = await this.contentFilter.filterContent(
      result.content,
      agent.id,
    );

    if (!filterResult.passed) {
      return {
        content: result.content,
        tokensUsed: result.tokensUsed,
        filtered: true,
        filterReason: filterResult.reason,
      };
    }

    return {
      content: this.cleanContent(result.content),
      tokensUsed: result.tokensUsed,
      filtered: false,
    };
  }
}
