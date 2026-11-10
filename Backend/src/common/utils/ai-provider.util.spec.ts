import { AiProviderProtocol } from "@prisma/client";
import {
  DEFAULT_AI_BASE_URL,
  buildProviderRequestBody,
  buildProviderUrl,
  isValidBaseUrl,
  normalizeBaseUrl,
  parseProviderResponse,
  parseProviderStreamEvent,
  providerEndpointPath,
  resolveProtocol,
} from "./ai-provider.util";

describe("ai-provider.util", () => {
  describe("normalizeBaseUrl", () => {
    it("keeps a valid base url untouched", () => {
      expect(normalizeBaseUrl("https://api.groq.com/openai/v1")).toBe(
        "https://api.groq.com/openai/v1",
      );
    });

    it("removes trailing slashes", () => {
      expect(normalizeBaseUrl("https://api.groq.com/openai/v1///")).toBe(
        "https://api.groq.com/openai/v1",
      );
    });

    it("adds the https scheme when missing", () => {
      expect(normalizeBaseUrl("api.openai.com/v1")).toBe(
        "https://api.openai.com/v1",
      );
    });

    it("falls back to the default when empty", () => {
      expect(normalizeBaseUrl("")).toBe(DEFAULT_AI_BASE_URL);
      expect(normalizeBaseUrl(null)).toBe(DEFAULT_AI_BASE_URL);
    });
  });

  describe("isValidBaseUrl", () => {
    it("accepts http and https urls", () => {
      expect(isValidBaseUrl("https://api.groq.com/openai/v1")).toBe(true);
      expect(isValidBaseUrl("http://localhost:11434/v1")).toBe(true);
    });

    it("rejects empty values", () => {
      expect(isValidBaseUrl("")).toBe(false);
      expect(isValidBaseUrl("   ")).toBe(false);
    });
  });

  describe("resolveProtocol", () => {
    it("defaults to chat completion", () => {
      expect(resolveProtocol(undefined)).toBe(
        AiProviderProtocol.OPENAI_CHAT_COMPLETION,
      );
      expect(resolveProtocol("OPENAI_CHAT_COMPLETION")).toBe(
        AiProviderProtocol.OPENAI_CHAT_COMPLETION,
      );
    });

    it("accepts the responses protocol in different shapes", () => {
      expect(resolveProtocol("OPENAI_RESPONSE")).toBe(
        AiProviderProtocol.OPENAI_RESPONSE,
      );
      expect(resolveProtocol("responses")).toBe(
        AiProviderProtocol.OPENAI_RESPONSE,
      );
      expect(resolveProtocol("openai-response")).toBe(
        AiProviderProtocol.OPENAI_RESPONSE,
      );
    });
  });

  describe("buildProviderUrl", () => {
    it("joins the base url and the path", () => {
      expect(
        buildProviderUrl("https://api.groq.com/openai/v1", "/chat/completions"),
      ).toBe("https://api.groq.com/openai/v1/chat/completions");
    });
  });

  describe("providerEndpointPath", () => {
    it("maps the protocol to its endpoint", () => {
      expect(providerEndpointPath(AiProviderProtocol.OPENAI_CHAT_COMPLETION)).toBe(
        "/chat/completions",
      );
      expect(providerEndpointPath(AiProviderProtocol.OPENAI_RESPONSE)).toBe(
        "/responses",
      );
    });
  });

  describe("buildProviderRequestBody", () => {
    const messages = [
      { role: "system", content: "You are helpful" },
      { role: "user", content: "Hello" },
    ];

    it("builds a chat completion body", () => {
      const body = buildProviderRequestBody(
        AiProviderProtocol.OPENAI_CHAT_COMPLETION,
        {
          model: "llama-3.1-8b-instant",
          messages,
          temperature: 0.7,
          maxTokens: 100,
        },
      );

      expect(body).toEqual({
        model: "llama-3.1-8b-instant",
        messages,
        temperature: 0.7,
        max_tokens: 100,
      });
    });

    it("builds a responses body with instructions and input", () => {
      const body = buildProviderRequestBody(
        AiProviderProtocol.OPENAI_RESPONSE,
        {
          model: "gpt-4o-mini",
          messages,
          temperature: 0.7,
          maxTokens: 100,
        },
      );

      expect(body).toEqual({
        model: "gpt-4o-mini",
        input: [{ role: "user", content: "Hello" }],
        instructions: "You are helpful",
        temperature: 0.7,
        max_output_tokens: 100,
      });
    });

    it("converts tool definitions to the flat responses shape", () => {
      const tools = [
        {
          type: "function" as const,
          function: {
            name: "show_service",
            description: "show a service",
            parameters: { type: "object" },
          },
        },
      ];

      const chatBody = buildProviderRequestBody(
        AiProviderProtocol.OPENAI_CHAT_COMPLETION,
        { model: "m", messages, tools },
      );
      expect(chatBody.tools).toEqual(tools);
      expect(chatBody.tool_choice).toBe("auto");

      const responsesBody = buildProviderRequestBody(
        AiProviderProtocol.OPENAI_RESPONSE,
        { model: "m", messages, tools },
      );
      expect(responsesBody.tools).toEqual([
        {
          type: "function",
          name: "show_service",
          description: "show a service",
          parameters: { type: "object" },
        },
      ]);
    });
  });

  describe("parseProviderResponse", () => {
    it("parses a chat completion response", () => {
      const parsed = parseProviderResponse(
        AiProviderProtocol.OPENAI_CHAT_COMPLETION,
        {
          id: "chatcmpl-1",
          model: "llama-3.1-8b-instant",
          choices: [
            {
              message: { role: "assistant", content: "Xin chào" },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
          },
        },
      );

      expect(parsed.content).toBe("Xin chào");
      expect(parsed.finishReason).toBe("stop");
      expect(parsed.usage.totalTokens).toBe(15);
    });

    it("parses a responses payload", () => {
      const parsed = parseProviderResponse(
        AiProviderProtocol.OPENAI_RESPONSE,
        {
          id: "resp_1",
          model: "gpt-4o-mini",
          status: "completed",
          output: [
            {
              type: "message",
              role: "assistant",
              content: [{ type: "output_text", text: "Xin chào" }],
            },
          ],
          usage: {
            input_tokens: 12,
            output_tokens: 4,
            total_tokens: 16,
          },
        },
      );

      expect(parsed.content).toBe("Xin chào");
      expect(parsed.finishReason).toBe("stop");
      expect(parsed.usage.promptTokens).toBe(12);
      expect(parsed.usage.completionTokens).toBe(4);
      expect(parsed.usage.totalTokens).toBe(16);
    });
  });

  describe("parseProviderStreamEvent", () => {
    it("parses a chat completion delta", () => {
      const event = parseProviderStreamEvent(
        AiProviderProtocol.OPENAI_CHAT_COMPLETION,
        {
          choices: [
            {
              delta: { content: "abc" },
              finish_reason: null,
            },
          ],
        },
      );

      expect(event.contentDelta).toBe("abc");
    });

    it("parses chat completion tool call deltas", () => {
      const event = parseProviderStreamEvent(
        AiProviderProtocol.OPENAI_CHAT_COMPLETION,
        {
          choices: [
            {
              delta: {
                tool_calls: [
                  {
                    index: 0,
                    id: "call_1",
                    function: { name: "show_service", arguments: '{"slug"' },
                  },
                ],
              },
            },
          ],
        },
      );

      expect(event.toolCallDeltas).toEqual([
        {
          id: "call_1",
          index: 0,
          name: "show_service",
          argumentsDelta: '{"slug"',
        },
      ]);
    });

    it("parses a responses output text delta", () => {
      const event = parseProviderStreamEvent(
        AiProviderProtocol.OPENAI_RESPONSE,
        { type: "response.output_text.delta", delta: "xy" },
      );

      expect(event.contentDelta).toBe("xy");
    });

    it("parses a responses function call delta", () => {
      const event = parseProviderStreamEvent(
        AiProviderProtocol.OPENAI_RESPONSE,
        {
          type: "response.function_call_arguments.delta",
          item_id: "fc_1",
          delta: '{"slug":"seo"}',
        },
      );

      expect(event.toolCallDeltas).toEqual([
        { id: "fc_1", argumentsDelta: '{"slug":"seo"}' },
      ]);
    });

    it("parses the responses output item added event", () => {
      const event = parseProviderStreamEvent(
        AiProviderProtocol.OPENAI_RESPONSE,
        {
          type: "response.output_item.added",
          item: { id: "fc_1", type: "function_call", name: "show_service" },
        },
      );

      expect(event.toolCallDeltas).toEqual([
        { id: "fc_1", name: "show_service" },
      ]);
    });

    it("marks the responses stream as finished", () => {
      const event = parseProviderStreamEvent(
        AiProviderProtocol.OPENAI_RESPONSE,
        { type: "response.completed" },
      );

      expect(event.finishReason).toBe("stop");
    });
  });
});
