import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bull";

// Controllers
import { AiSeedingController } from "./controllers/ai-seeding.controller";

// Services
import { AiAgentService } from "./services/ai-agent.service";
import { AiProviderKeyService } from "./services/ai-provider-key.service";
import { AiProviderClientService } from "./services/ai-provider-client.service";
import { AiRateLimiterService } from "./services/ai-rate-limiter.service";
import { ContentGeneratorService } from "./services/content-generator.service";
import { ContentFilterService } from "./services/content-filter.service";
import { AiMemoryService } from "./services/ai-memory.service";
import { AiOrchestratorService } from "./services/ai-orchestrator.service";
import { AiActivityLogService } from "./services/ai-activity-log.service";

// Repositories
import { AiAgentRepository } from "./repositories/ai-agent.repository";
import { AiProviderKeyRepository } from "./repositories/ai-provider-key.repository";
import { AiActivityLogRepository } from "./repositories/ai-activity-log.repository";
import { AiMemoryRepository } from "./repositories/ai-memory.repository";
import { ContentHashRepository } from "./repositories/content-hash.repository";

// Processors
import { AiContentProcessor } from "./processors/ai-content.processor";

// Shared modules
import { PostsModule } from "../posts/posts.module";
import { CommentsModule } from "../comments/comments.module";
import { ReactionsModule } from "../reactions/reactions.module";

@Module({
  // Note: ScheduleModule.forRoot() is initialized in AppModule to avoid serialization warnings
  imports: [
    BullModule.registerQueue({
      name: "ai-content",
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
    PostsModule,
    CommentsModule,
    ReactionsModule,
  ],
  controllers: [AiSeedingController],
  providers: [
    // Services
    AiAgentService,
    AiProviderKeyService,
    AiProviderClientService,
    AiRateLimiterService,
    ContentGeneratorService,
    ContentFilterService,
    AiMemoryService,
    AiOrchestratorService,
    AiActivityLogService,
    // Repositories
    AiAgentRepository,
    AiProviderKeyRepository,
    AiActivityLogRepository,
    AiMemoryRepository,
    ContentHashRepository,
    // Processors
    AiContentProcessor,
  ],
  exports: [AiAgentService, AiProviderKeyService, AiActivityLogService],
})
export class AiSeedingModule {}
