import { Controller, Get, Patch, Post, Body, UseGuards, BadRequestException } from "@nestjs/common";
import { SettingsService } from "../services/settings.service";
import { UpdateChatbotConfigDto } from "../dto/update-chatbot-config.dto";
import { UpdateEmailConfigDto } from "../dto/update-email-config.dto";
import { MailService } from "../../mail/mail.service";
import { EmailSettingsService } from "../../mail/services/email-settings.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { Role, AiProviderProtocol } from "@prisma/client";
import {
  DEFAULT_AI_BASE_URL,
  buildProviderRequestBody,
  buildProviderUrl,
  isValidBaseUrl,
  normalizeBaseUrl,
  providerEndpointPath,
  resolveProtocol,
} from "../../../common/utils/ai-provider.util";

@Controller("admin/settings")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
    private readonly mailService: MailService,
    private readonly emailSettingsService: EmailSettingsService,
  ) {}

  /**
   * Get chatbot configuration
   * GET /api/admin/settings/chatbot
   */
  @Get("chatbot")
  async getChatbotConfig() {
    const settings = await this.settingsService.getByCategory("chatbot");
    return {
      apiKey: settings["chatbot.apiKey"]
        ? this.maskApiKey(settings["chatbot.apiKey"])
        : "",
      baseUrl:
        settings["chatbot.baseUrl"] ||
        process.env.CHATBOT_BASE_URL ||
        DEFAULT_AI_BASE_URL,
      protocol: resolveProtocol(
        settings["chatbot.protocol"] || process.env.CHATBOT_PROTOCOL,
      ),
      primaryModel:
        settings["chatbot.primaryModel"] ||
        process.env.CHATBOT_PRIMARY_MODEL ||
        "llama-3.3-70b-versatile",
      fallbackModel:
        settings["chatbot.fallbackModel"] ||
        process.env.CHATBOT_FALLBACK_MODEL ||
        "llama-3.1-8b-instant",
      maxTokens: parseInt(
        settings["chatbot.maxTokens"] ||
          process.env.CHATBOT_MAX_TOKENS ||
          "512",
        10,
      ),
      temperature: parseFloat(
        settings["chatbot.temperature"] ||
          process.env.CHATBOT_TEMPERATURE ||
          "0.7",
      ),
      hasApiKey: !!settings["chatbot.apiKey"],
    };
  }

  /**
   * Update chatbot configuration
   * PATCH /api/admin/settings/chatbot
   */
  @Patch("chatbot")
  async updateChatbotConfig(@Body() dto: UpdateChatbotConfigDto) {
    const settings: Array<{ key: string; value: string; category: string }> =
      [];

    if (dto.apiKey !== undefined) {
      settings.push({
        key: "chatbot.apiKey",
        value: dto.apiKey,
        category: "chatbot",
      });
    }
    if (dto.baseUrl !== undefined) {
      if (!isValidBaseUrl(dto.baseUrl)) {
        throw new BadRequestException(
          `Base URL không hợp lệ: "${dto.baseUrl}". Ví dụ hợp lệ: https://api.groq.com/openai/v1`,
        );
      }
      settings.push({
        key: "chatbot.baseUrl",
        value: normalizeBaseUrl(dto.baseUrl),
        category: "chatbot",
      });
    }
    if (dto.protocol !== undefined) {
      settings.push({
        key: "chatbot.protocol",
        value: resolveProtocol(dto.protocol),
        category: "chatbot",
      });
    }
    if (dto.primaryModel !== undefined) {
      settings.push({
        key: "chatbot.primaryModel",
        value: dto.primaryModel,
        category: "chatbot",
      });
    }
    if (dto.fallbackModel !== undefined) {
      settings.push({
        key: "chatbot.fallbackModel",
        value: dto.fallbackModel,
        category: "chatbot",
      });
    }
    if (dto.maxTokens !== undefined) {
      settings.push({
        key: "chatbot.maxTokens",
        value: String(dto.maxTokens),
        category: "chatbot",
      });
    }
    if (dto.temperature !== undefined) {
      settings.push({
        key: "chatbot.temperature",
        value: String(dto.temperature),
        category: "chatbot",
      });
    }

    await this.settingsService.setMany(settings);
    return { message: "Đã lưu cấu hình thành công" };
  }

  /**
   * Test the AI provider connection with an actual completion request
   * POST /api/admin/settings/chatbot/test
   */
  @Post("chatbot/test")
  async testConnection(
    @Body()
    body: {
      apiKey?: string;
      model?: string;
      baseUrl?: string;
      protocol?: AiProviderProtocol | string;
    },
  ) {
    const stored = await this.settingsService.getByCategory("chatbot");
    const apiKey = body.apiKey || stored["chatbot.apiKey"];
    const baseUrl = normalizeBaseUrl(
      body.baseUrl ||
        stored["chatbot.baseUrl"] ||
        process.env.CHATBOT_BASE_URL ||
        DEFAULT_AI_BASE_URL,
    );
    const protocol = resolveProtocol(
      body.protocol || stored["chatbot.protocol"] || process.env.CHATBOT_PROTOCOL,
    );
    const testModel =
      body.model || stored["chatbot.primaryModel"] || "llama-3.3-70b-versatile";

    if (!apiKey) {
      return {
        success: false,
        message: "Chưa cấu hình API key cho chatbot.",
        details: { step: "key_validation" },
      };
    }

    if (!isValidBaseUrl(baseUrl)) {
      return {
        success: false,
        message: `Base URL không hợp lệ: "${baseUrl}"`,
        details: { step: "key_validation" },
      };
    }

    try {
      // Step 1: Quick key validation via /models
      const modelsResponse = await fetch(buildProviderUrl(baseUrl, "/models"), {
        headers: { Authorization: `Bearer ${apiKey}` },
      });

      if (!modelsResponse.ok && modelsResponse.status !== 404) {
        const error = await modelsResponse.json().catch(() => ({}));
        return {
          success: false,
          message: `API key không hợp lệ: ${error?.error?.message || modelsResponse.status}`,
          details: { step: "key_validation", status: modelsResponse.status },
        };
      }

      // Step 2: Actually test a completion (this is what the chatbot uses)
      const requestBody = buildProviderRequestBody(protocol, {
        model: testModel,
        messages: [{ role: "user", content: "Hi" }],
        maxTokens: 5,
        temperature: 0,
      });

      const chatResponse = await fetch(
        buildProviderUrl(baseUrl, providerEndpointPath(protocol)),
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        },
      );

      if (chatResponse.ok) {
        return {
          success: true,
          message: `Kết nối thành công! Model ${testModel} hoạt động bình thường.`,
          details: { step: "chat_test", model: testModel, protocol },
        };
      }

      const chatError = await chatResponse.json().catch(() => ({}));
      const errorMsg =
        chatError?.error?.message || `HTTP ${chatResponse.status}`;

      // Provide specific guidance based on error
      let guidance = "";
      if (chatResponse.status === 403) {
        guidance =
          " Có thể do IP bị chặn, tài khoản bị hạn chế, hoặc cần nâng cấp gói dịch vụ.";
      } else if (chatResponse.status === 429) {
        guidance = " Đã vượt giới hạn rate limit. Vui lòng thử lại sau.";
      } else if (chatResponse.status === 401) {
        guidance = " API key không hợp lệ hoặc đã hết hạn.";
      } else if (chatResponse.status === 404) {
        guidance = " Endpoint không tồn tại - kiểm tra lại BASE URL và PROTOCOL.";
      }

      return {
        success: false,
        message: `API key hợp lệ nhưng không thể gọi model: ${errorMsg}.${guidance}`,
        details: {
          step: "chat_test",
          status: chatResponse.status,
          model: testModel,
          protocol,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Không thể kết nối đến AI provider: ${error instanceof Error ? error.message : "Unknown error"}`,
        details: { step: "connection" },
      };
    }
  }

  /**
   * Get email configuration
   * GET /api/admin/settings/email
   */
  @Get("email")
  async getEmailConfig() {
    const config = await this.emailSettingsService.getConfig();

    return {
      apiKey: config.apiKey ? this.maskApiKey(config.apiKey) : "",
      from: config.from,
      verificationRequired: config.verificationRequired,
      hasApiKey: config.configured,
      source: config.source,
    };
  }

  /**
   * Update email configuration
   * PATCH /api/admin/settings/email
   */
  @Patch("email")
  async updateEmailConfig(@Body() dto: UpdateEmailConfigDto) {
    await this.emailSettingsService.updateConfig(dto);
    return { message: "Đã lưu cấu hình email thành công" };
  }

  /**
   * Send a test email to verify the Resend configuration
   * POST /api/admin/settings/email/test
   */
  @Post("email/test")
  async testEmail(@Body() body: { to: string }) {
    const to = (body?.to || "").trim();

    if (!to || !to.includes("@")) {
      return {
        success: false,
        message: "Email nhận không hợp lệ.",
      };
    }

    try {
      const result = await this.mailService.sendTestEmail(to);
      return {
        success: true,
        message: `Đã gửi email kiểm tra tới ${to}.`,
        details: { id: result.id },
      };
    } catch (error) {
      return {
        success: false,
        message: `Không thể gửi email: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  private maskApiKey(key: string): string {
    if (key.length <= 8) return "••••••••";
    return "••••••••" + key.slice(-4);
  }
}
