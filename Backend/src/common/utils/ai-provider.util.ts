/**
 * Shared helpers for talking to OpenAI-compatible AI providers.
 *
 * A provider is described by three things:
 *  - baseUrl  : root of the OpenAI-compatible API (e.g. https://api.groq.com/openai/v1)
 *  - modelId  : model identifier understood by that endpoint
 *  - protocol : wire format used for the request/response body
 *
 * Two protocols are supported:
 *  - OPENAI_CHAT_COMPLETION -> POST {baseUrl}/chat/completions, body { model, messages }
 *  - OPENAI_RESPONSE        -> POST {baseUrl}/responses,      body { model, input, instructions }
 *
 * The helpers here are pure functions so both the AI seeding pipeline and the
 * chatbot can share the exact same request/response semantics.
 */

import { AiProviderProtocol } from "@prisma/client";

export const DEFAULT_AI_BASE_URL = "https://api.groq.com/openai/v1";
export const DEFAULT_AI_MODEL_ID = "llama-3.1-8b-instant";

export interface AiProviderMessage {
  role: string;
  content: string;
}

export interface AiProviderToolDefinition {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
}

export interface AiProviderRequestOptions {
  model: string;
  messages: AiProviderMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
  tools?: AiProviderToolDefinition[];
  toolChoice?: string;
}

export interface AiProviderUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AiProviderNormalizedResponse {
  id: string;
  model: string;
  content: string;
  finishReason: string;
  usage: AiProviderUsage;
}

export interface AiProviderToolCallDelta {
  /** Call identifier (chat completions) or output item id (responses API) */
  id?: string;
  /** Position of the tool call inside the choice (chat completions only) */
  index?: number;
  name?: string;
  argumentsDelta?: string;
}

export interface AiProviderStreamEvent {
  contentDelta?: string;
  toolCallDeltas?: AiProviderToolCallDelta[];
  finishReason?: string;
}

/**
 * Normalize a user supplied base URL:
 *  - trims whitespace
 *  - adds https:// when the scheme is missing
 *  - removes trailing slashes
 */
export function normalizeBaseUrl(raw?: string | null): string {
  const trimmed = (raw || "").trim();
  if (!trimmed) return DEFAULT_AI_BASE_URL;

  const withScheme = /^https?:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;

  return withScheme.replace(/\/+$/, "");
}

/**
 * Check that a base URL is usable (http/https and a parsable host).
 */
export function isValidBaseUrl(raw?: string | null): boolean {
  if (!raw || !raw.trim()) return false;

  try {
    const url = new URL(normalizeBaseUrl(raw));
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.hostname.length > 0
    );
  } catch {
    return false;
  }
}

/**
 * Build a full endpoint URL from a base URL and a path.
 */
export function buildProviderUrl(baseUrl: string, path: string): string {
  const base = normalizeBaseUrl(baseUrl);
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Resolve a protocol coming from the database or from an API payload.
 */
export function resolveProtocol(
  value?: string | null,
): AiProviderProtocol {
  if (!value) return AiProviderProtocol.OPENAI_CHAT_COMPLETION;

  const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, "_");

  switch (normalized) {
    case "OPENAI_RESPONSE":
    case "RESPONSES":
    case "RESPONSE":
      return AiProviderProtocol.OPENAI_RESPONSE;
    case "OPENAI_CHAT_COMPLETION":
    case "CHAT_COMPLETION":
    case "CHAT_COMPLETIONS":
    default:
      return AiProviderProtocol.OPENAI_CHAT_COMPLETION;
  }
}

/**
 * Endpoint path for the given protocol.
 */
export function providerEndpointPath(protocol: AiProviderProtocol): string {
  return protocol === AiProviderProtocol.OPENAI_RESPONSE
    ? "/responses"
    : "/chat/completions";
}

/**
 * Convert a chat-completion style tool definition into the flat shape used by
 * the OpenAI Responses API.
 */
function toResponsesTool(tool: AiProviderToolDefinition) {
  return {
    type: "function" as const,
    name: tool.function.name,
    ...(tool.function.description ? { description: tool.function.description } : {}),
    ...(tool.function.parameters ? { parameters: tool.function.parameters } : {}),
  };
}

/**
 * Build the request body for the selected protocol.
 */
export function buildProviderRequestBody(
  protocol: AiProviderProtocol,
  options: AiProviderRequestOptions,
): Record<string, unknown> {
  const {
    model,
    messages,
    temperature,
    maxTokens,
    topP,
    stream,
    tools,
    toolChoice,
  } = options;

  if (protocol === AiProviderProtocol.OPENAI_RESPONSE) {
    const systemMessages = messages.filter((m) => m.role === "system");
    const conversation = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));

    const body: Record<string, unknown> = {
      model,
      input: conversation,
    };

    if (systemMessages.length > 0) {
      body.instructions = systemMessages
        .map((m) => m.content)
        .join("\n\n");
    }
    if (temperature !== undefined) body.temperature = temperature;
    if (maxTokens !== undefined) body.max_output_tokens = maxTokens;
    if (topP !== undefined) body.top_p = topP;
    if (stream !== undefined) body.stream = stream;
    if (tools && tools.length > 0) {
      body.tools = tools.map(toResponsesTool);
      body.tool_choice = toolChoice || "auto";
    }

    return body;
  }

  const body: Record<string, unknown> = {
    model,
    messages,
  };
  if (temperature !== undefined) body.temperature = temperature;
  if (maxTokens !== undefined) body.max_tokens = maxTokens;
  if (topP !== undefined) body.top_p = topP;
  if (stream !== undefined) body.stream = stream;
  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = toolChoice || "auto";
  }

  return body;
}

/**
 * Extract the assistant text from a chat-completion response.
 */
function extractChatCompletionText(json: any): string {
  const choice = json?.choices?.[0];
  return choice?.message?.content || "";
}

/**
 * Extract the assistant text from an OpenAI Responses payload.
 */
function extractResponsesText(json: any): string {
  if (typeof json?.output_text === "string" && json.output_text) {
    return json.output_text;
  }

  const output = json?.output;
  if (!Array.isArray(output)) return "";

  const parts: string[] = [];
  for (const item of output) {
    if (item?.type && item.type !== "message") continue;
    const content = item?.content;
    if (!Array.isArray(content)) continue;

    for (const chunk of content) {
      if (chunk?.type === "output_text" && typeof chunk.text === "string") {
        parts.push(chunk.text);
      } else if (chunk?.type === "text" && typeof chunk.text === "string") {
        parts.push(chunk.text);
      }
    }
  }

  return parts.join("");
}

/**
 * Normalize a provider response into a single shape regardless of protocol.
 */
export function parseProviderResponse(
  protocol: AiProviderProtocol,
  json: any,
): AiProviderNormalizedResponse {
  if (protocol === AiProviderProtocol.OPENAI_RESPONSE) {
    const usage = json?.usage || {};
    const promptTokens = usage.input_tokens ?? usage.prompt_tokens ?? 0;
    const completionTokens = usage.output_tokens ?? usage.completion_tokens ?? 0;

    return {
      id: json?.id || "",
      model: json?.model || "",
      content: extractResponsesText(json),
      finishReason: json?.status === "incomplete" ? "length" : "stop",
      usage: {
        promptTokens,
        completionTokens,
        totalTokens: usage.total_tokens ?? promptTokens + completionTokens,
      },
    };
  }

  const usage = json?.usage || {};
  return {
    id: json?.id || "",
    model: json?.model || "",
    content: extractChatCompletionText(json),
    finishReason: json?.choices?.[0]?.finish_reason || "stop",
    usage: {
      promptTokens: usage.prompt_tokens ?? 0,
      completionTokens: usage.completion_tokens ?? 0,
      totalTokens: usage.total_tokens ?? 0,
    },
  };
}

/**
 * Normalize a single streamed SSE payload into a common event shape.
 */
export function parseProviderStreamEvent(
  protocol: AiProviderProtocol,
  json: any,
): AiProviderStreamEvent {
  if (protocol === AiProviderProtocol.OPENAI_RESPONSE) {
    const type = json?.type;

    switch (type) {
      case "response.output_text.delta":
        return { contentDelta: json?.delta || "" };
      case "response.function_call_arguments.delta":
        return {
          toolCallDeltas: [
            {
              id: json?.item_id || json?.id || "",
              argumentsDelta: json?.delta || "",
            },
          ],
        };
      case "response.output_item.added": {
        const item = json?.item;
        if (item?.type !== "function_call") return {};
        return {
          toolCallDeltas: [
            {
              // `item.id` is the output item id - it is the same id referenced
              // by response.function_call_arguments.delta
              id: item.id || item.call_id || "",
              name: item.name || undefined,
            },
          ],
        };
      }
      case "response.completed":
        return { finishReason: "stop" };
      case "response.incomplete":
        return { finishReason: "length" };
      default:
        return {};
    }
  }

  const choice = json?.choices?.[0];
  if (!choice) return {};

  const event: AiProviderStreamEvent = {};

  if (choice.delta?.content) {
    event.contentDelta = choice.delta.content;
  }

  if (Array.isArray(choice.delta?.tool_calls) && choice.delta.tool_calls.length) {
    event.toolCallDeltas = choice.delta.tool_calls.map((tc: any) => ({
      id: tc.id || undefined,
      index: tc.index ?? undefined,
      name: tc.function?.name || undefined,
      argumentsDelta: tc.function?.arguments || undefined,
    }));
  }

  if (choice.finish_reason) {
    event.finishReason = choice.finish_reason;
  }

  return event;
}
