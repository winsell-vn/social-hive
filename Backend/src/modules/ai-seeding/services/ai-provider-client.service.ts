import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../../redis/redis.service";
import { AI_CACHE_KEYS, AI_CACHE_TTL } from "../../../redis/cache-keys";
import { AiProviderProtocol } from "@prisma/client";
import {
  AiProviderMessage,
  AiProviderNormalizedResponse,
  DEFAULT_AI_BASE_URL,
  DEFAULT_AI_MODEL_ID,
  buildProviderRequestBody,
  buildProviderUrl,
  parseProviderResponse,
  providerEndpointPath,
  resolveProtocol,
} from "../../../common/utils/ai-provider.util";

export interface AiProviderCompletionOptions {
  baseUrl?: string;
  modelId?: string;
  protocol?: AiProviderProtocol | string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface CircuitBreakerState {
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failures: number;
  lastFailure: number | null;
  nextRetry: number | null;
  consecutiveOpens: number;
}

/**
 * Client for any OpenAI-compatible AI provider.
 *
 * The endpoint (baseUrl), the model and the wire protocol are supplied per
 * call so a single deployment can talk to Groq, OpenAI, OpenRouter or a
 * self-hosted vLLM/Ollama server.
 */
@Injectable()
export class AiProviderClientService {
  private readonly logger = new Logger(AiProviderClientService.name);
  private readonly defaultModel: string;
  private readonly defaultBaseUrl: string;

  // Circuit breaker settings
  private readonly failureThreshold = 5;
  private readonly baseResetTimeout = 60000; // 1 minute base
  private readonly maxResetTimeout = 3600000; // 1 hour max
  private readonly halfOpenRequests = 3;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.defaultModel =
      this.configService.get<string>("AI_DEFAULT_MODEL") ||
      this.configService.get<string>("GROQ_DEFAULT_MODEL") ||
      DEFAULT_AI_MODEL_ID;
    this.defaultBaseUrl =
      this.configService.get<string>("AI_BASE_URL") ||
      this.configService.get<string>("GROQ_BASE_URL") ||
      DEFAULT_AI_BASE_URL;
  }

  /**
   * Generate content using an OpenAI-compatible provider
   */
  async generateCompletion(
    apiKey: string,
    messages: AiProviderMessage[],
    options: AiProviderCompletionOptions = {},
  ): Promise<AiProviderNormalizedResponse> {
    // Check circuit breaker
    const circuitState = await this.getCircuitState();
    if (circuitState.state === "OPEN") {
      throw new Error(
        "Circuit breaker is OPEN - AI provider temporarily unavailable",
      );
    }

    const baseUrl = options.baseUrl || this.defaultBaseUrl;
    const model = options.modelId || this.defaultModel;
    const protocol = resolveProtocol(options.protocol);

    const {
      temperature = 0.8,
      maxTokens = 1024,
      topP = 0.9,
      stream = false,
    } = options;

    try {
      const body = buildProviderRequestBody(protocol, {
        model,
        messages,
        temperature,
        maxTokens,
        topP,
        stream,
      });

      const response = await fetch(
        buildProviderUrl(baseUrl, providerEndpointPath(protocol)),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text();

        // Handle rate limiting
        if (response.status === 429) {
          this.logger.warn(`AI provider rate limit hit (${baseUrl})`);
          await this.recordFailure();
          throw new Error(`AI provider rate limit exceeded: ${errorBody}`);
        }

        // Handle other errors
        if (response.status >= 500) {
          await this.recordFailure();
        }

        throw new Error(
          `AI provider error (${response.status}) from ${baseUrl}: ${errorBody}`,
        );
      }

      const data = await response.json();

      // Reset circuit breaker on success
      await this.recordSuccess();

      const parsed = parseProviderResponse(protocol, data);

      this.logger.debug(
        `AI provider call successful (${baseUrl}). Tokens used: ${parsed.usage.totalTokens}`,
      );

      return parsed;
    } catch (error) {
      this.logger.error(
        `AI provider call failed (${baseUrl}): ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  /**
   * Simple content generation helper
   */
  async generateContent(
    apiKey: string,
    systemPrompt: string,
    userPrompt: string,
    options: AiProviderCompletionOptions = {},
  ): Promise<{ content: string; tokensUsed: number }> {
    const messages: AiProviderMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    const response = await this.generateCompletion(apiKey, messages, options);

    return {
      content: response.content,
      tokensUsed: response.usage.totalTokens,
    };
  }

  /**
   * Get current circuit breaker state (with caching)
   * Uses getOrSet pattern to avoid cache misses on initial state
   */
  async getCircuitState(): Promise<CircuitBreakerState> {
    const defaultState: CircuitBreakerState = {
      state: "CLOSED",
      failures: 0,
      lastFailure: null,
      nextRetry: null,
      consecutiveOpens: 0,
    };

    // Use getOrSet to cache the default state if not exists
    const state = await this.redisService.getOrSet<CircuitBreakerState>(
      AI_CACHE_KEYS.AI_PROVIDER_CIRCUIT_STATE,
      async () => defaultState,
      AI_CACHE_TTL.CIRCUIT_STATE,
    );

    // Check if we should transition from OPEN to HALF_OPEN
    if (
      state.state === "OPEN" &&
      state.nextRetry &&
      Date.now() >= state.nextRetry
    ) {
      state.state = "HALF_OPEN";
      await this.saveCircuitState(state);
    }

    return state;
  }

  /**
   * Record a successful API call
   */
  private async recordSuccess(): Promise<void> {
    const state = await this.getCircuitState();

    if (state.state === "HALF_OPEN") {
      // Reset to closed after successful call in half-open state
      // Also reset consecutiveOpens counter on successful recovery
      await this.saveCircuitState({
        state: "CLOSED",
        failures: 0,
        lastFailure: null,
        nextRetry: null,
        consecutiveOpens: 0,
      });
      this.logger.log("Circuit breaker CLOSED after successful HALF_OPEN test");
    } else if (state.failures > 0) {
      // Decrement failure count on success
      state.failures = Math.max(0, state.failures - 1);
      await this.saveCircuitState(state);
    }
  }

  /**
   * Record a failed API call
   */
  private async recordFailure(): Promise<void> {
    const state = await this.getCircuitState();
    state.failures += 1;
    state.lastFailure = Date.now();

    if (state.failures >= this.failureThreshold) {
      // Increment consecutiveOpens when transitioning to OPEN
      state.consecutiveOpens = (state.consecutiveOpens || 0) + 1;
      state.state = "OPEN";
      // Exponential backoff: 60s, 120s, 240s, 480s, ... up to 1 hour max
      const resetTimeout = Math.min(
        this.baseResetTimeout * Math.pow(2, state.consecutiveOpens - 1),
        this.maxResetTimeout,
      );
      state.nextRetry = Date.now() + resetTimeout;
      this.logger.warn(
        `Circuit breaker OPENED after ${state.failures} failures (cycle ${state.consecutiveOpens}). Next retry in ${resetTimeout / 1000}s at ${new Date(state.nextRetry).toISOString()}`,
      );
    }

    await this.saveCircuitState(state);
  }

  /**
   * Save circuit breaker state to Redis
   * Note: RedisService.set() handles JSON serialization automatically
   */
  private async saveCircuitState(state: CircuitBreakerState): Promise<void> {
    await this.redisService.set(
      AI_CACHE_KEYS.AI_PROVIDER_CIRCUIT_STATE,
      state,
      AI_CACHE_TTL.CIRCUIT_STATE,
    );
  }

  /**
   * Manually reset circuit breaker (for admin use)
   */
  async resetCircuitBreaker(): Promise<void> {
    await this.saveCircuitState({
      state: "CLOSED",
      failures: 0,
      lastFailure: null,
      nextRetry: null,
      consecutiveOpens: 0,
    });
    this.logger.log("Circuit breaker manually reset");
  }

  /**
   * Check if API is available
   */
  async isAvailable(): Promise<boolean> {
    const state = await this.getCircuitState();
    return state.state !== "OPEN";
  }

  /**
   * Estimate tokens for a text (rough estimation)
   * Rule of thumb: 1 token ≈ 4 characters for English
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}
