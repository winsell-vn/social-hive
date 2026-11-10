import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { RedisModule } from "../../redis/redis.module";
import { PricingModule } from "../pricing/pricing.module";
import { SettingsModule } from "../settings/settings.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { PrismaModule } from "../../prisma/prisma.module";
import { ChatbotController } from "./controllers/chatbot.controller";
import { ChatbotSessionService } from "./services/chatbot-session.service";
import { ChatbotRateLimiterService } from "./services/chatbot-rate-limiter.service";
import { ChatbotPromptService } from "./services/chatbot-prompt.service";
import { ChatbotProviderService } from "./services/chatbot-provider.service";

@Module({
  imports: [
    RedisModule,
    ConfigModule,
    PricingModule,
    SettingsModule,
    NotificationsModule,
    PrismaModule,
  ],
  controllers: [ChatbotController],
  providers: [
    ChatbotSessionService,
    ChatbotRateLimiterService,
    ChatbotPromptService,
    ChatbotProviderService,
  ],
})
export class ChatbotModule {}
