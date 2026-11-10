import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Res,
  Logger,
  HttpStatus,
} from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { Response } from "express";
import { NotificationType } from "@prisma/client";
import { Public } from "../../../common/decorators/public.decorator";
import { ChatMessageDto } from "../dto/chat-message.dto";
import {
  ChatbotSessionService,
  ChatSession,
} from "../services/chatbot-session.service";
import { ChatbotRateLimiterService } from "../services/chatbot-rate-limiter.service";
import { ChatbotPromptService } from "../services/chatbot-prompt.service";
import { ChatbotProviderService } from "../services/chatbot-provider.service";
import { InputSanitizer } from "../utils/input-sanitizer";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { PrismaService } from "../../../prisma/prisma.service";

@Controller("chatbot")
export class ChatbotController {
  private readonly logger = new Logger(ChatbotController.name);

  constructor(
    private readonly sessionService: ChatbotSessionService,
    private readonly rateLimiterService: ChatbotRateLimiterService,
    private readonly promptService: ChatbotPromptService,
    private readonly providerService: ChatbotProviderService,
    private readonly notificationsService: NotificationsService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get chat history for a session
   * Used to restore chat messages after page refresh
   */
  @Get("history/:sessionId")
  @Public()
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getHistory(@Param("sessionId") sessionId: string): Promise<{
    messages: Array<{ role: string; content: string; timestamp: number }>;
  }> {
    // Validate sessionId format (should be UUID-like)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!sessionId || !uuidRegex.test(sessionId)) {
      return { messages: [] };
    }

    const session = await this.sessionService.getSession(sessionId);
    if (!session || !session.messages) {
      return { messages: [] };
    }

    // Filter out system messages — only return user and assistant messages
    const messages = session.messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
      }));

    return { messages };
  }

  @Post("chat")
  @Public()
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async chat(@Body() dto: ChatMessageDto, @Res() res: Response): Promise<void> {
    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    try {
      // 1. Sanitize input
      const sanitizedMessage = InputSanitizer.sanitize(dto.message);
      if (!sanitizedMessage) {
        this.sendSSEError(
          res,
          "INVALID_INPUT",
          "Tin nhắn không hợp lệ.",
          HttpStatus.BAD_REQUEST,
        );
        return;
      }

      // Log injection attempts (but don't block)
      if (InputSanitizer.detectInjection(sanitizedMessage)) {
        this.logger.warn(
          `Potential injection detected: session=${dto.sessionId}`,
        );
      }

      // 2. Check rate limit
      const rateLimit = await this.rateLimiterService.checkRateLimit(
        dto.sessionId,
      );
      if (!rateLimit.allowed) {
        this.sendSSEError(
          res,
          "RATE_LIMITED",
          "Bạn đang gửi tin nhắn quá nhanh. Vui lòng chờ một chút nhé!",
          HttpStatus.TOO_MANY_REQUESTS,
        );
        return;
      }

      // 3. Load or create session
      let session = await this.sessionService.getSession(dto.sessionId);
      if (!session) {
        session = await this.sessionService.createSession(
          dto.sessionId,
          dto.language || "vi",
        );
      }

      // 3.1 Check if session is already marked for handoff — block auto-reply
      if (session.needsHumanHandoff) {
        const handoffMessage =
          "Yêu cầu của quý khách đã được chuyển đến bộ phận kinh doanh. Chúng tôi sẽ liên hệ sớm nhất có thể.";
        res.write(
          `data: ${JSON.stringify({ type: "chunk", content: handoffMessage })}\n\n`,
        );
        res.write(
          `data: ${JSON.stringify({ type: "done", usage: { model: "handoff" } })}\n\n`,
        );
        res.end();
        return;
      }

      // Update language if provided
      if (dto.language && dto.language !== session.language) {
        await this.sessionService.updateLanguage(dto.sessionId, dto.language);
      }

      // 4. Build prompt with ALL pricing data (compact format)
      const systemPrompt = await this.promptService.buildSystemPrompt();
      const messages = this.promptService.buildMessages(
        systemPrompt,
        session.messages,
        sanitizedMessage,
      );

      // 5. Call Groq streaming API
      const providerResult = await this.providerService.streamChat(messages);

      if (!providerResult.stream) {
        const errorMessage =
          providerResult.error === "SERVICE_UNAVAILABLE"
            ? "Hệ thống đang bận. Vui lòng thử lại sau hoặc liên hệ hotline."
            : "Đã xảy ra lỗi. Vui lòng thử lại.";
        this.sendSSEError(
          res,
          providerResult.error || "SERVICE_UNAVAILABLE",
          errorMessage,
          HttpStatus.SERVICE_UNAVAILABLE,
        );
        return;
      }

      // 6. Save user message to session
      await this.sessionService.addMessage(dto.sessionId, {
        role: "user",
        content: sanitizedMessage,
        timestamp: Date.now(),
      });

      // 7. Stream Groq response to client
      let fullResponse = "";
      const reader = providerResult.stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim() !== "");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();

              if (data === "[DONE]") {
                // Stream complete
                res.write(
                  `data: ${JSON.stringify({ type: "done", usage: { model: providerResult.model } })}\n\n`,
                );
                continue;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  res.write(
                    `data: ${JSON.stringify({ type: "chunk", content })}\n\n`,
                  );
                }
              } catch {
                // Skip invalid JSON chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      // 8. Save assistant response to session and check for handoff
      if (fullResponse) {
        // Check for handoff tag in the full response (already stripped from streamed chunks by sanitizer)
        const isHandoff = fullResponse.includes("[HANDOFF]");

        // Clean the response for storage (remove handoff tag if present)
        const cleanResponse = fullResponse.replace(/\[HANDOFF\]/g, "").trim();

        await this.sessionService.addMessage(dto.sessionId, {
          role: "assistant",
          content: cleanResponse,
          timestamp: Date.now(),
        });

        // 9. Handle handoff if detected
        if (isHandoff) {
          await this.sessionService.markForHandoff(dto.sessionId);

          // Refresh session to get latest messages for notification
          const updatedSession = await this.sessionService.getSession(
            dto.sessionId,
          );
          if (updatedSession) {
            await this.notifyAdminsOfHandoff(dto.sessionId, updatedSession);
          }

          // Send handoff status to client
          res.write(
            `data: ${JSON.stringify({ type: "handoff", message: "Đã chuyển đến bộ phận kinh doanh" })}\n\n`,
          );
        }
      }

      res.end();
    } catch (error) {
      this.logger.error(`Chat error: ${error.message}`, error.stack);

      if (!res.headersSent) {
        res.setHeader("Content-Type", "text/event-stream");
      }

      this.sendSSEError(
        res,
        "INTERNAL_ERROR",
        "Đã xảy ra lỗi. Vui lòng thử lại.",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Notify all admin users about a chatbot handoff request
   */
  private async notifyAdminsOfHandoff(
    sessionId: string,
    session: ChatSession,
  ): Promise<void> {
    try {
      // Find admin users
      const admins = await this.prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      });

      if (admins.length === 0) {
        this.logger.warn(
          "No admin users found to notify about chatbot handoff",
        );
        return;
      }

      // Get last few messages for context (exclude system messages)
      const recentMessages = session.messages
        .filter((m) => m.role !== "system")
        .slice(-5)
        .map((m) => `${m.role === "user" ? "Khách" : "Bot"}: ${m.content}`)
        .join("\n");

      // Create notification for each admin
      for (const admin of admins) {
        await this.notificationsService.createViaQueue({
          userId: admin.id,
          type: NotificationType.CHATBOT_HANDOFF,
          title: "Khách hàng muốn mua dịch vụ",
          data: {
            sessionId,
            postContent: recentMessages, // Reuse postContent field for conversation context
          },
        });
      }

      this.logger.log(
        `Notified ${admins.length} admin(s) about chatbot handoff for session ${sessionId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify admins of handoff: ${error.message}`,
        error.stack,
      );
    }
  }

  private sendSSEError(
    res: Response,
    code: string,
    message: string,
    status: number,
  ): void {
    res.status(status);
    res.write(`data: ${JSON.stringify({ type: "error", code, message })}\n\n`);
    res.end();
  }
}
