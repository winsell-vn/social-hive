import { Injectable, Logger } from "@nestjs/common";
import { RedisService } from "../../../redis/redis.service";
import {
  CHATBOT_CACHE_KEYS,
  CHATBOT_SESSION_TTL,
} from "../../../redis/cache-keys";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

export interface ChatSession {
  sessionId: string;
  messages: ChatMessage[];
  createdAt: number;
  language: "vi" | "en";
  needsHumanHandoff?: boolean;
}

@Injectable()
export class ChatbotSessionService {
  private readonly logger = new Logger(ChatbotSessionService.name);
  private readonly MAX_MESSAGES = 10;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Get an existing session by ID
   */
  async getSession(sessionId: string): Promise<ChatSession | null> {
    return this.redisService.get<ChatSession>(
      CHATBOT_CACHE_KEYS.SESSION(sessionId),
    );
  }

  /**
   * Create a new chat session
   */
  async createSession(
    sessionId: string,
    language: "vi" | "en" = "vi",
  ): Promise<ChatSession> {
    const session: ChatSession = {
      sessionId,
      messages: [],
      createdAt: Date.now(),
      language,
    };
    await this.redisService.set(
      CHATBOT_CACHE_KEYS.SESSION(sessionId),
      session,
      CHATBOT_SESSION_TTL,
    );
    this.logger.debug(`Created new session: ${sessionId}`);
    return session;
  }

  /**
   * Add a message to the session with sliding window (keeps last MAX_MESSAGES)
   */
  async addMessage(
    sessionId: string,
    message: ChatMessage,
  ): Promise<ChatSession> {
    let session = await this.getSession(sessionId);
    if (!session) {
      session = await this.createSession(sessionId);
    }

    session.messages.push(message);

    // Sliding window: keep only last MAX_MESSAGES
    if (session.messages.length > this.MAX_MESSAGES) {
      session.messages = session.messages.slice(-this.MAX_MESSAGES);
    }

    // Refresh TTL on each message
    await this.redisService.set(
      CHATBOT_CACHE_KEYS.SESSION(sessionId),
      session,
      CHATBOT_SESSION_TTL,
    );
    this.logger.debug(
      `Added message to session ${sessionId}, total: ${session.messages.length}`,
    );
    return session;
  }

  /**
   * Update the preferred language for a session
   */
  async updateLanguage(
    sessionId: string,
    language: "vi" | "en",
  ): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.language = language;
      await this.redisService.set(
        CHATBOT_CACHE_KEYS.SESSION(sessionId),
        session,
        CHATBOT_SESSION_TTL,
      );
      this.logger.debug(
        `Updated language for session ${sessionId} to ${language}`,
      );
    }
  }

  /**
   * Delete a session
   */
  async deleteSession(sessionId: string): Promise<void> {
    await this.redisService.del(CHATBOT_CACHE_KEYS.SESSION(sessionId));
    this.logger.debug(`Deleted session: ${sessionId}`);
  }

  /**
   * Get or create a session (convenience method)
   */
  async getOrCreateSession(
    sessionId: string,
    language: "vi" | "en" = "vi",
  ): Promise<ChatSession> {
    const existing = await this.getSession(sessionId);
    if (existing) {
      return existing;
    }
    return this.createSession(sessionId, language);
  }

  /**
   * Mark a session as needing human handoff
   */
  async markForHandoff(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);
    if (session) {
      session.needsHumanHandoff = true;
      await this.redisService.set(
        CHATBOT_CACHE_KEYS.SESSION(sessionId),
        session,
        CHATBOT_SESSION_TTL,
      );
      this.logger.log(`Session ${sessionId} marked for human handoff`);
    }
  }
}
