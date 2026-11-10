import { Injectable, Logger } from "@nestjs/common";
import { PricingService } from "../../pricing/services/pricing.service";
import {
  HUNG_DPS_SYSTEM_PROMPT,
  PRICING_CONTEXT_TEMPLATE,
} from "../prompts/hung-dps-persona";
import { ChatMessage } from "./chatbot-session.service";

@Injectable()
export class ChatbotPromptService {
  private readonly logger = new Logger(ChatbotPromptService.name);

  constructor(private readonly pricingService: PricingService) {}

  /**
   * Build the complete system prompt with persona and ALL pricing data
   * Uses compact format to include all services (~2-5KB total)
   */
  async buildSystemPrompt(): Promise<string> {
    const pricingData = await this.loadPricingData();
    const prompt = `${HUNG_DPS_SYSTEM_PROMPT}\n\n${PRICING_CONTEXT_TEMPLATE.replace("{pricingData}", pricingData)}`;
    this.logger.debug(
      `System prompt size: ${prompt.length} chars (~${Math.round(prompt.length / 4)} tokens)`,
    );
    return prompt;
  }

  /**
   * Build the full message array for the LLM call
   */
  buildMessages(
    systemPrompt: string,
    history: ChatMessage[],
    currentMessage: string,
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history (only user and assistant messages)
    for (const msg of history) {
      if (msg.role === "user" || msg.role === "assistant") {
        messages.push({ role: msg.role, content: msg.content });
      }
    }

    // Add current user message
    messages.push({ role: "user", content: currentMessage });

    return messages;
  }

  /**
   * Load and format ALL pricing data in compact format
   * Includes all services and tiers (~2-5KB total)
   */
  private async loadPricingData(): Promise<string> {
    try {
      const services = await this.pricingService.getPublicPricing();

      if (!services || services.length === 0) {
        return "Hiện tại chưa có dữ liệu dịch vụ. Vui lòng liên hệ hotline để được tư vấn.";
      }

      return this.formatAllPricingCompact(services);
    } catch (error) {
      this.logger.error("Failed to load pricing data", error);
      return "Không thể tải dữ liệu dịch vụ. Vui lòng liên hệ hotline.";
    }
  }

  /**
   * Format ALL pricing data in super compact format
   * Groups tiers under parent service, one line per tier
   * Example output:
   * THIẾT KẾ WEBSITE (slug: thiet-ke-website):
   *   Landing Page (1 trang): từ 2.000.000đ
   *   Website giới thiệu (5-10 trang): từ 4.000.000đ (phổ biến)
   */
  private formatAllPricingCompact(
    services: Array<{
      name: string;
      slug?: string;
      pricingTiers?: Array<{
        name: string;
        price: number | string | unknown;
        priceNote?: string | null;
        billingType?: string | null;
        isPopular?: boolean | null;
        isRecommended?: boolean | null;
      }>;
    }>,
  ): string {
    const lines: string[] = [];

    for (const service of services) {
      // Service header in CAPS with slug for AI to use in action tags
      const slugPart = service.slug ? ` (slug: ${service.slug})` : "";
      lines.push(service.name.toUpperCase() + slugPart + ":");

      if (service.pricingTiers && service.pricingTiers.length > 0) {
        // Sort tiers by price ascending
        const sortedTiers = [...service.pricingTiers].sort(
          (a, b) => (Number(a.price) || 0) - (Number(b.price) || 0),
        );

        for (const tier of sortedTiers) {
          let line = `  ${tier.name}: `;

          // Format price
          const priceNum = Number(tier.price);
          if (priceNum > 0) {
            const priceStr = this.formatPrice(priceNum);
            const billingCycle = this.formatBillingCycle(tier.billingType);

            // Add "từ" prefix if priceNote indicates it's a starting price
            const hasFromPrefix = tier.priceNote?.toLowerCase().includes("từ");
            line += hasFromPrefix
              ? `từ ${priceStr}${billingCycle}`
              : `${priceStr}${billingCycle}`;
          } else {
            line += "Liên hệ báo giá";
          }

          // Add tag if exists
          if (tier.isPopular) line += " (phổ biến)";
          else if (tier.isRecommended) line += " (khuyên dùng)";

          lines.push(line);
        }
      }

      lines.push(""); // Empty line between services
    }

    return lines.join("\n").trim();
  }

  /**
   * Format price in Vietnamese format with dots
   */
  private formatPrice(price: number): string {
    return price.toLocaleString("vi-VN") + "đ";
  }

  /**
   * Format billing cycle suffix
   */
  private formatBillingCycle(cycle: string | null | undefined): string {
    if (!cycle) return "";
    switch (cycle.toLowerCase()) {
      case "yearly":
        return "/năm";
      case "monthly":
        return "/tháng";
      case "one-time":
        return "";
      case "per_feature":
        return "/tính năng";
      default:
        return "";
    }
  }
}
