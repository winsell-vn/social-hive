import { Injectable, Logger } from "@nestjs/common";
import { AiMemoryRepository } from "../repositories/ai-memory.repository";
import { RedisService } from "../../../redis/redis.service";
import { AI_CACHE_KEYS, AI_CACHE_TTL } from "../../../redis/cache-keys";
import { AiAgentMemory, MemoryType } from "@prisma/client";

export interface MemoryEntry {
  type: MemoryType;
  content: string;
  importance?: number;
  expiresAt?: Date;
}

export interface ContextMemory {
  recentPosts: string[];
  recentComments: string[];
  recentInteractions: string[];
  preferences: string[];
}

@Injectable()
export class AiMemoryService {
  private readonly logger = new Logger(AiMemoryService.name);

  // Memory limits per agent
  private readonly MAX_MEMORIES_PER_AGENT = 100;
  private readonly MAX_CONTEXT_ITEMS = 10;
  // Maximum recent topics to track per agent (AC-076)
  private readonly MAX_RECENT_TOPICS = 5;

  constructor(
    private readonly memoryRepository: AiMemoryRepository,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Add a memory entry for an agent
   */
  async addMemory(agentId: string, entry: MemoryEntry): Promise<AiAgentMemory> {
    // Check memory limit
    const count = await this.memoryRepository.countByAgent(agentId);

    if (count >= this.MAX_MEMORIES_PER_AGENT) {
      // Remove oldest low-importance memories
      await this.pruneMemories(agentId);
    }

    const memory = await this.memoryRepository.create({
      agent: { connect: { id: agentId } },
      type: entry.type,
      content: entry.content,
      importance: entry.importance || 5,
      expiresAt: entry.expiresAt,
    });

    this.logger.debug(`Added memory for agent ${agentId}: ${entry.type}`);

    return memory;
  }

  /**
   * Record that the agent created a post
   */
  async recordPost(agentId: string, postContent: string): Promise<void> {
    await this.addMemory(agentId, {
      type: MemoryType.CONTEXT,
      content: `I posted: "${this.truncate(postContent, 200)}"`,
      importance: 7,
      expiresAt: this.getExpiryDate(7), // 7 days
    });
  }

  /**
   * Record that the agent commented on a post
   */
  async recordComment(
    agentId: string,
    postContent: string,
    commentContent: string,
  ): Promise<void> {
    await this.addMemory(agentId, {
      type: MemoryType.INTERACTION,
      content: `I commented "${this.truncate(commentContent, 100)}" on a post about: "${this.truncate(postContent, 100)}"`,
      importance: 5,
      expiresAt: this.getExpiryDate(3), // 3 days
    });
  }

  /**
   * Record that the agent reacted to a post
   */
  async recordReaction(
    agentId: string,
    postContent: string,
    reactionType: string,
  ): Promise<void> {
    await this.addMemory(agentId, {
      type: MemoryType.INTERACTION,
      content: `I reacted with ${reactionType} to: "${this.truncate(postContent, 100)}"`,
      importance: 3,
      expiresAt: this.getExpiryDate(1), // 1 day
    });
  }

  /**
   * Record a preference or learned behavior
   */
  async recordPreference(agentId: string, preference: string): Promise<void> {
    await this.addMemory(agentId, {
      type: MemoryType.PREFERENCE,
      content: preference,
      importance: 8,
      expiresAt: this.getExpiryDate(30), // 30 days
    });
  }

  /**
   * Record feedback (positive or negative)
   */
  async recordFeedback(
    agentId: string,
    feedback: string,
    isPositive: boolean,
  ): Promise<void> {
    await this.addMemory(agentId, {
      type: MemoryType.FEEDBACK,
      content: `${isPositive ? "Positive" : "Negative"} feedback: ${feedback}`,
      importance: isPositive ? 6 : 9, // Negative feedback is more important to remember
      expiresAt: this.getExpiryDate(14), // 14 days
    });
  }

  /**
   * Get context for content generation
   */
  async getContext(agentId: string): Promise<ContextMemory> {
    const memories = await this.memoryRepository.findByAgent(agentId, {
      limit: 50,
    });

    const context: ContextMemory = {
      recentPosts: [],
      recentComments: [],
      recentInteractions: [],
      preferences: [],
    };

    for (const memory of memories) {
      switch (memory.type) {
        case MemoryType.CONTEXT:
          if (memory.content.startsWith("I posted:")) {
            context.recentPosts.push(memory.content);
          }
          break;
        case MemoryType.INTERACTION:
          if (memory.content.startsWith("I commented")) {
            context.recentComments.push(memory.content);
          } else {
            context.recentInteractions.push(memory.content);
          }
          break;
        case MemoryType.PREFERENCE:
          context.preferences.push(memory.content);
          break;
      }
    }

    // Limit each category
    context.recentPosts = context.recentPosts.slice(0, this.MAX_CONTEXT_ITEMS);
    context.recentComments = context.recentComments.slice(
      0,
      this.MAX_CONTEXT_ITEMS,
    );
    context.recentInteractions = context.recentInteractions.slice(
      0,
      this.MAX_CONTEXT_ITEMS,
    );
    context.preferences = context.preferences.slice(0, this.MAX_CONTEXT_ITEMS);

    return context;
  }

  /**
   * Build context string for prompts
   */
  async buildContextPrompt(agentId: string): Promise<string> {
    const context = await this.getContext(agentId);
    const parts: string[] = [];

    if (context.recentPosts.length > 0) {
      parts.push("## Recent posts you made:");
      context.recentPosts.forEach((post, i) => {
        parts.push(`${i + 1}. ${post}`);
      });
    }

    if (context.preferences.length > 0) {
      parts.push("\n## Your preferences:");
      context.preferences.forEach((pref) => {
        parts.push(`- ${pref}`);
      });
    }

    if (context.recentInteractions.length > 0) {
      parts.push("\n## Recent interactions:");
      context.recentInteractions.slice(0, 5).forEach((interaction) => {
        parts.push(`- ${interaction}`);
      });
    }

    if (parts.length === 0) {
      return "";
    }

    return parts.join("\n");
  }

  /**
   * Get all memories for an agent
   */
  async getMemories(
    agentId: string,
    type?: MemoryType,
  ): Promise<AiAgentMemory[]> {
    return this.memoryRepository.findByAgent(agentId, { type });
  }

  /**
   * Clear all memories for an agent
   */
  async clearMemories(agentId: string): Promise<void> {
    await this.memoryRepository.deleteByAgent(agentId);
    this.logger.log(`Cleared all memories for agent ${agentId}`);
  }

  /**
   * Clean up expired memories (called by scheduler)
   */
  async cleanupExpired(): Promise<number> {
    const result = await this.memoryRepository.deleteExpired();
    this.logger.log(`Cleaned up ${result.count} expired memories`);
    return result.count;
  }

  /**
   * Prune old low-importance memories when limit is reached
   */
  private async pruneMemories(agentId: string): Promise<void> {
    const memories = await this.memoryRepository.findByAgent(agentId, {
      limit: this.MAX_MEMORIES_PER_AGENT,
    });

    // Sort by importance (ascending) and age (oldest first)
    const sortedMemories = memories.sort((a, b) => {
      if (a.importance !== b.importance) {
        return a.importance - b.importance;
      }
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    // Delete the least important 20%
    const toDelete = sortedMemories.slice(0, Math.ceil(memories.length * 0.2));

    for (const memory of toDelete) {
      await this.memoryRepository.delete(memory.id);
    }

    this.logger.debug(
      `Pruned ${toDelete.length} memories for agent ${agentId}`,
    );
  }

  /**
   * Truncate text to a maximum length
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + "...";
  }

  /**
   * Get expiry date from now
   */
  private getExpiryDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  /**
   * Record a topic used by an agent (AC-080)
   * Stores topic in Redis LIST with LPUSH, trims to max 5 items, sets 7-day TTL
   * @param agentId - The agent's ID
   * @param topic - The topic that was used for post generation
   */
  async recordTopic(agentId: string, topic: string): Promise<void> {
    const key = AI_CACHE_KEYS.AGENT_RECENT_TOPICS(agentId);
    const client = this.redisService.getClient();

    try {
      // LPUSH to add topic at the beginning of the list
      await client.lpush(key, topic);
      // LTRIM to keep only the last MAX_RECENT_TOPICS items
      await client.ltrim(key, 0, this.MAX_RECENT_TOPICS - 1);
      // Set/refresh TTL to 7 days (AC-080)
      await client.expire(key, AI_CACHE_TTL.RECENT_TOPICS);

      this.logger.debug(`Recorded topic for agent ${agentId}: ${topic}`);
    } catch (error) {
      this.logger.error(
        `Failed to record topic for agent ${agentId}: ${error.message}`,
      );
      // Don't throw - topic recording failure shouldn't block post generation
    }
  }

  /**
   * Get recent topics used by an agent (AC-076)
   * Returns the last 5 topics from Redis LIST
   * @param agentId - The agent's ID
   * @returns Array of recent topics (up to 5)
   */
  async getRecentTopics(agentId: string): Promise<string[]> {
    const key = AI_CACHE_KEYS.AGENT_RECENT_TOPICS(agentId);
    const client = this.redisService.getClient();

    try {
      // LRANGE 0 4 gets the first 5 elements (indices 0-4)
      const topics = await client.lrange(key, 0, this.MAX_RECENT_TOPICS - 1);
      this.logger.debug(
        `Retrieved ${topics.length} recent topics for agent ${agentId}`,
      );
      return topics;
    } catch (error) {
      this.logger.error(
        `Failed to get recent topics for agent ${agentId}: ${error.message}`,
      );
      // Return empty array on error - don't block post generation
      return [];
    }
  }
}
