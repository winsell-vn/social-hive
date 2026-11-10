import {
  Injectable,
  Logger,
  Optional,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RedisService } from "../../../redis/redis.service";
import { CHATBOT_CACHE_KEYS } from "../../../redis/cache-keys";
import { SettingsService } from "../../settings/services/settings.service";
import { AiProviderProtocol } from "@prisma/client";
import {
  AiProviderToolDefinition,
  DEFAULT_AI_BASE_URL,
  buildProviderRequestBody,
  buildProviderUrl,
  normalizeBaseUrl,
  parseProviderStreamEvent,
  providerEndpointPath,
  resolveProtocol,
} from "../../../common/utils/ai-provider.util";

export interface ChatbotStreamResult {
  stream: ReadableStream<Uint8Array> | null;
  model: string;
  error?: string;
}

/**
 * Custom error class for upstream AI provider errors with HTTP status code.
 */
class ProviderApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ProviderApiError";
  }
}

@Injectable()
export class ChatbotProviderService {
  private readonly logger = new Logger(ChatbotProviderService.name);
  private apiBaseUrl: string;
  private protocol: AiProviderProtocol;
  private apiKey: string;
  private primaryModel: string;
  private fallbackModel: string;
  private maxTokens: number;
  private temperature: number;
  private readonly circuitBreakerThreshold = 5;
  private readonly circuitBreakerResetMs = 60000; // 60 seconds

  // Tool calling graceful degradation - start optimistic, disable on 403/400
  private toolCallingEnabled = true;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    @Optional()
    @Inject(forwardRef(() => SettingsService))
    private readonly settingsService?: SettingsService,
  ) {
    // Load defaults from env vars
    this.apiKey =
      this.configService.get<string>("chatbot.aiProviderKey") ||
      this.configService.get<string>("CHATBOT_GROQ_API_KEY") ||
      this.configService.get<string>("AI_GROQ_API_KEY", "");
    this.apiBaseUrl = normalizeBaseUrl(
      this.configService.get<string>("chatbot.baseUrl") ||
        this.configService.get<string>("CHATBOT_BASE_URL") ||
        DEFAULT_AI_BASE_URL,
    );
    this.protocol = resolveProtocol(
      this.configService.get<string>("chatbot.protocol") ||
        this.configService.get<string>("CHATBOT_PROTOCOL"),
    );
    this.primaryModel =
      this.configService.get<string>("chatbot.primaryModel") ||
      this.configService.get<string>(
        "CHATBOT_PRIMARY_MODEL",
        "llama-3.3-70b-versatile",
      );
    this.fallbackModel =
      this.configService.get<string>("chatbot.fallbackModel") ||
      this.configService.get<string>(
        "CHATBOT_FALLBACK_MODEL",
        "llama-3.1-8b-instant",
      );
    this.maxTokens =
      this.configService.get<number>("chatbot.maxTokens") ||
      parseInt(this.configService.get<string>("CHATBOT_MAX_TOKENS", "200"), 10);
    this.temperature =
      this.configService.get<number>("chatbot.temperature") ||
      parseFloat(this.configService.get<string>("CHATBOT_TEMPERATURE", "0.7"));

    if (!this.apiKey) {
      this.logger.warn(
        "AI provider API key is not configured. Set CHATBOT_GROQ_API_KEY or AI_GROQ_API_KEY in .env",
      );
    }
  }

  /**
   * Load configuration from database, falling back to env vars
   */
  private async loadConfigFromDb(): Promise<void> {
    if (!this.settingsService) return;
    try {
      const settings = await this.settingsService.getByCategory("chatbot");
      if (settings["chatbot.apiKey"]) {
        this.apiKey = settings["chatbot.apiKey"];
        // Debug log: show masked API key
        const masked =
          this.apiKey.length > 12
            ? `${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 4)}`
            : "***";
        this.logger.debug(`Loaded API key from DB: ${masked}`);
      }
      if (settings["chatbot.baseUrl"]) {
        this.apiBaseUrl = normalizeBaseUrl(settings["chatbot.baseUrl"]);
      }
      if (settings["chatbot.protocol"]) {
        this.protocol = resolveProtocol(settings["chatbot.protocol"]);
      }
      if (settings["chatbot.primaryModel"]) {
        this.primaryModel = settings["chatbot.primaryModel"];
      }
      if (settings["chatbot.fallbackModel"]) {
        const dbFallback = settings["chatbot.fallbackModel"];
        // Safety: fallback must differ from primary, otherwise it's useless
        if (dbFallback !== this.primaryModel) {
          this.fallbackModel = dbFallback;
        } else {
          this.logger.warn(
            `DB fallback model "${dbFallback}" is same as primary model, using default: llama-3.1-8b-instant`,
          );
          this.fallbackModel = "llama-3.1-8b-instant";
        }
      }
      if (settings["chatbot.maxTokens"]) {
        this.maxTokens = parseInt(settings["chatbot.maxTokens"], 10);
      }
      if (settings["chatbot.temperature"]) {
        this.temperature = parseFloat(settings["chatbot.temperature"]);
      }

      // Final safety: ensure fallback differs from primary
      if (this.fallbackModel === this.primaryModel) {
        this.logger.warn(
          `Fallback model "${this.fallbackModel}" matches primary, resetting to default`,
        );
        this.fallbackModel = "llama-3.1-8b-instant";
      }
    } catch (error) {
      this.logger.warn(
        "Failed to load chatbot config from DB, using env defaults",
      );
    }
  }

  /**
   * Stream chat completion from the configured AI provider with fallback support
   */
  async streamChat(
    messages: Array<{ role: string; content: string }>,
  ): Promise<ChatbotStreamResult> {
    // Load config from DB (overrides env vars if set)
    await this.loadConfigFromDb();

    // Debug log: show which API key and models are being used
    const maskedKey =
      this.apiKey.length > 12
        ? `${this.apiKey.substring(0, 8)}...${this.apiKey.substring(this.apiKey.length - 4)}`
        : "***";
    this.logger.debug(
      `Using API key: ${maskedKey}, baseUrl: ${this.apiBaseUrl}, protocol: ${this.protocol}, primary: ${this.primaryModel}, fallback: ${this.fallbackModel}`,
    );

    // Check circuit breaker
    const isCircuitOpen = await this.isCircuitOpen();
    if (isCircuitOpen) {
      this.logger.warn(
        "Circuit breaker is OPEN — all AI provider requests blocked",
      );
      return { stream: null, model: "", error: "SERVICE_UNAVAILABLE" };
    }

    // Try primary model
    try {
      const result = await this.callProviderStream(this.primaryModel, messages);
      await this.resetCircuitBreaker();
      return result;
    } catch (error) {
      const isProviderError = error instanceof ProviderApiError;
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Primary model (${this.primaryModel}) failed: ${errorMessage}`,
      );

      // NEW: If tools are enabled and we got a 403/400, retry WITHOUT tools first
      // This handles provider plans that don't support tool calling
      if (
        this.toolCallingEnabled &&
        isProviderError &&
        (error.status === 403 || error.status === 400)
      ) {
        this.logger.log(
          `Retrying ${this.primaryModel} WITHOUT tool calling (got ${error.status})...`,
        );
        this.toolCallingEnabled = false;
        try {
          const result = await this.callProviderStream(
            this.primaryModel,
            messages,
          );
          await this.resetCircuitBreaker();
          this.logger.log(
            `Success without tools - tool calling disabled for this session`,
          );
          return result;
        } catch (retryError) {
          const retryErrorMessage =
            retryError instanceof Error
              ? retryError.message
              : String(retryError);
          this.logger.warn(
            `Retry without tools also failed: ${retryErrorMessage}, continuing to fallback model...`,
          );
          // Fall through to existing fallback logic
        }
      }

      // If rate limited (429) or access denied (403), try fallback model
      const shouldFallback =
        (isProviderError &&
          (error.status === 429 || error.status === 403)) ||
        errorMessage.includes("429") ||
        errorMessage.includes("403") ||
        errorMessage.includes("Access denied");
      if (shouldFallback) {
        this.logger.log(
          `Primary model failed (${isProviderError ? error.status : "unknown"}), falling back to ${this.fallbackModel}`,
        );
        // Ensure tools are disabled for fallback (smaller models may not support it)
        this.toolCallingEnabled = false;
        try {
          const result = await this.callProviderStream(
            this.fallbackModel,
            messages,
          );
          await this.resetCircuitBreaker();
          return result;
        } catch (fallbackError) {
          const fallbackErrorMessage =
            fallbackError instanceof Error
              ? fallbackError.message
              : String(fallbackError);
          this.logger.error(
            `Fallback model (${this.fallbackModel}) also failed: ${fallbackErrorMessage}`,
          );
          await this.recordFailure();
          return {
            stream: null,
            model: this.fallbackModel,
            error: "SERVICE_UNAVAILABLE",
          };
        }
      }

      await this.recordFailure();
      return {
        stream: null,
        model: this.primaryModel,
        error: errorMessage || "PROVIDER_ERROR",
      };
    }
  }

  /**
   * Call the configured AI provider with streaming enabled
   */
  private async callProviderStream(
    model: string,
    messages: Array<{ role: string; content: string }>,
  ): Promise<ChatbotStreamResult> {
    // Build request body for the configured protocol.
    // Tools are only added when tool calling is enabled (graceful degradation).
    const tools = this.toolCallingEnabled
      ? (this.getToolDefinitions() as unknown as AiProviderToolDefinition[])
      : undefined;

    const requestBody = buildProviderRequestBody(this.protocol, {
      model,
      messages,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      stream: true,
      tools,
      toolChoice: tools ? "auto" : undefined,
    });

    const response = await fetch(
      buildProviderUrl(this.apiBaseUrl, providerEndpointPath(this.protocol)),
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      const error = new ProviderApiError(
        `AI provider error: ${response.status} ${errorBody}`,
        response.status,
      );
      throw error;
    }

    this.logger.debug(
      `AI provider streaming started with model: ${model} (${this.protocol})`,
    );

    // Wrap the stream with sanitization and tool call handling
    const processedStream = this.createProcessedStream(response.body);

    return {
      stream: processedStream,
      model,
    };
  }

  /**
   * Get tool definitions for provider function calling
   */
  private getToolDefinitions() {
    return [
      {
        type: "function" as const,
        function: {
          name: "show_service",
          description:
            "Mở bảng giá dịch vụ cụ thể cho khách xem. Dùng khi khách hỏi về dịch vụ hoặc muốn xem bảng giá.",
          parameters: {
            type: "object",
            properties: {
              slug: {
                type: "string",
                enum: [
                  "ten-mien",
                  "hosting-server",
                  "chung-chi-ssl",
                  "thiet-ke-website",
                  "tinh-nang-bo-sung",
                  "seo",
                  "backlink-link-building",
                  "viet-bai-content-marketing",
                  "quang-cao-google-ads",
                  "quang-cao-facebook-ads",
                  "email-marketing",
                  "quan-ly-fanpage-mang-xa-hoi",
                  "zalo-mini-app",
                  "ung-dung-mobile",
                  "ung-dung-desktop",
                  "phat-trien-web-application-saas",
                  "api-tich-hop-he-thong",
                  "devops-ha-tang-cloud",
                  "kiem-thu-dam-bao-chat-luong-qa",
                  "phan-mem-crm-erp-hrm",
                  "tu-van-thue-lap-trinh-vien",
                  "thiet-ke-logo-nhan-dien-thuong-hieu",
                  "thiet-ke-ui-ux",
                  "chatbot-ai-bot",
                  "ai-machine-learning",
                  "tu-dong-hoa-rpa",
                  "bao-tri-ho-tro-ky-thuat",
                  "combo-tiet-kiem",
                ],
                description: "Slug của dịch vụ cần hiển thị",
              },
              tier: {
                type: "string",
                description:
                  "Tên gói cụ thể cần focus (optional). Phải dùng tên chính xác từ bảng giá.",
              },
            },
            required: ["slug"],
          },
        },
      },
      {
        type: "function" as const,
        function: {
          name: "navigate_step",
          description:
            "Chuyển trang wizard bảng giá đến bước cụ thể. Bước 1: chọn danh mục, Bước 2: chọn dịch vụ, Bước 3: xem bảng giá, Bước 4: gửi yêu cầu báo giá.",
          parameters: {
            type: "object",
            properties: {
              step: {
                type: "integer",
                minimum: 1,
                maximum: 4,
                description: "Số bước cần chuyển đến (1-4)",
              },
            },
            required: ["step"],
          },
        },
      },
    ];
  }

  /**
   * Sanitize content by removing markdown symbols that should never appear in plain text responses
   */
  private sanitizeContent(content: string): string {
    return content
      .replace(/\*\*/g, "") // Remove bold markers
      .replace(/\*/g, "") // Remove italic markers
      .replace(/^#{1,6}\s/gm, "") // Remove heading markers
      .replace(/^[-•]\s/gm, "") // Remove bullet points
      .replace(/`/g, "") // Remove code markers
      .replace(/→/g, "") // Remove arrows
      .replace(/\[HANDOFF\]/g, ""); // Remove handoff tag (processed by controller)
  }

  /**
   * Create a transform stream that processes SSE chunks:
   * - Sanitizes content (removes markdown)
   * - Handles tool calls and emits action events
   */
  private createProcessedStream(
    originalStream: ReadableStream<Uint8Array> | null,
  ): ReadableStream<Uint8Array> | null {
    if (!originalStream) return null;

    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    const sanitize = this.sanitizeContent.bind(this);
    const logger = this.logger;
    const protocol = this.protocol;

    return new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = originalStream.getReader();
        let buffer = "";

        // Track tool calls during streaming (keyed by tool call index / item id)
        const accumulatedToolCalls: Record<
          string,
          {
            id: string;
            function: { name: string; arguments: string };
          }
        > = {};

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.close();
              break;
            }

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE lines
            const lines = buffer.split("\n");
            buffer = lines.pop() || ""; // Keep incomplete line in buffer

            for (const line of lines) {
              const trimmed = line.trim();
              if (!trimmed || !trimmed.startsWith("data: ")) continue;
              if (trimmed === "data: [DONE]") continue;

              const jsonStr = trimmed.slice(6);
              try {
                const parsed = JSON.parse(jsonStr);
                const event = parseProviderStreamEvent(protocol, parsed);

                // Regular content - sanitize and forward
                if (event.contentDelta) {
                  const sanitized = sanitize(event.contentDelta);
                  controller.enqueue(
                    encoder.encode(
                      `data: ${JSON.stringify({ type: "chunk", content: sanitized })}\n\n`,
                    ),
                  );
                }

                // Tool calls - accumulate
                if (event.toolCallDeltas) {
                  for (const tc of event.toolCallDeltas) {
                    const key = String(tc.index ?? tc.id ?? "");
                    if (!accumulatedToolCalls[key]) {
                      accumulatedToolCalls[key] = {
                        id: tc.id || "",
                        function: { name: "", arguments: "" },
                      };
                    }
                    if (tc.id) accumulatedToolCalls[key].id = tc.id;
                    // Function name is sent once, not streamed - use assignment
                    if (tc.name) accumulatedToolCalls[key].function.name = tc.name;
                    // Arguments ARE streamed in chunks - use concatenation
                    if (tc.argumentsDelta)
                      accumulatedToolCalls[key].function.arguments +=
                        tc.argumentsDelta;
                  }
                }

                // When stream finishes, emit accumulated tool calls as action events
                if (
                  event.finishReason === "tool_calls" ||
                  event.finishReason === "stop"
                ) {
                  for (const tc of Object.values(accumulatedToolCalls)) {
                    if (tc?.function?.name && tc?.function?.arguments) {
                      try {
                        const args = JSON.parse(tc.function.arguments);
                        let actionType = "";
                        let actionParams: Record<string, string> = {};

                        if (tc.function.name === "show_service") {
                          actionType = "SHOW_SERVICE";
                          actionParams = { slug: args.slug };
                          if (args.tier) actionParams.tier = args.tier;
                        } else if (tc.function.name === "navigate_step") {
                          actionType = "NAVIGATE";
                          actionParams = { step: String(args.step) };
                        }

                        if (actionType) {
                          logger.debug(
                            `Emitting action: ${actionType} with params: ${JSON.stringify(actionParams)}`,
                          );
                          controller.enqueue(
                            encoder.encode(
                              `data: ${JSON.stringify({
                                type: "action",
                                actionType,
                                params: actionParams,
                              })}\n\n`,
                            ),
                          );
                        }
                      } catch {
                        // Invalid JSON in tool arguments, skip
                        logger.warn(
                          `Invalid tool call arguments: ${tc.function.arguments}`,
                        );
                      }
                    }
                  }
                }
              } catch {
                // Invalid JSON, skip this line
              }
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }

  /**
   * Check if circuit breaker is currently open
   */
  private async isCircuitOpen(): Promise<boolean> {
    const state = await this.redisService.get<string>(
      CHATBOT_CACHE_KEYS.CIRCUIT_STATE,
    );
    return state === "open";
  }

  /**
   * Record a failure and potentially open the circuit breaker
   */
  private async recordFailure(): Promise<void> {
    const key = CHATBOT_CACHE_KEYS.CIRCUIT_FAILURES;
    const failures = await this.redisService.get<string>(key);
    const count = failures ? parseInt(String(failures), 10) + 1 : 1;

    if (count >= this.circuitBreakerThreshold) {
      // Open circuit
      await this.redisService.set(
        CHATBOT_CACHE_KEYS.CIRCUIT_STATE,
        "open",
        this.circuitBreakerResetMs / 1000,
      );
      await this.redisService.del(key);
      this.logger.error(`Circuit breaker OPENED after ${count} failures`);
    } else {
      await this.redisService.set(
        key,
        count.toString(),
        this.circuitBreakerResetMs / 1000,
      );
    }
  }

  /**
   * Reset circuit breaker on successful request
   */
  private async resetCircuitBreaker(): Promise<void> {
    await this.redisService.del(CHATBOT_CACHE_KEYS.CIRCUIT_FAILURES);
    const state = await this.redisService.get<string>(
      CHATBOT_CACHE_KEYS.CIRCUIT_STATE,
    );
    if (state) {
      await this.redisService.del(CHATBOT_CACHE_KEYS.CIRCUIT_STATE);
      this.logger.log("Circuit breaker RESET to CLOSED");
      // Re-enable tool calling when circuit breaker resets (allows recovery)
      this.maybeReEnableTools();
    }
  }

  /**
   * Re-enable tool calling after circuit breaker resets.
   * This allows the system to try tools again after a recovery period.
   */
  private maybeReEnableTools(): void {
    if (!this.toolCallingEnabled) {
      this.toolCallingEnabled = true;
      this.logger.debug("Tool calling re-enabled after circuit breaker reset");
    }
  }

  /**
   * Check if the AI provider service is available
   */
  async isAvailable(): Promise<boolean> {
    return !(await this.isCircuitOpen());
  }
}
