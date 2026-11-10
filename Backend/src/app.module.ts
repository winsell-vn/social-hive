import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { MulterModule } from "@nestjs/platform-express";
import { ScheduleModule } from "@nestjs/schedule";
import { HashPathFallbackMiddleware } from "./common/middleware/hash-path-fallback.middleware";
import { CsrfMiddleware } from "./common/middleware/csrf.middleware";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { QueueModule } from "./queue/queue.module";
import { HealthModule } from "./health/health.module";
import { AuthModule } from "./modules/auth/auth.module";
import { PostsModule } from "./modules/posts/posts.module";
import { HashtagsModule } from "./modules/hashtags/hashtags.module";
import { ReactionsModule } from "./modules/reactions/reactions.module";
import { CommentsModule } from "./modules/comments/comments.module";
import { ModerationModule } from "./modules/moderation/moderation.module";
import { ProfilesModule } from "./modules/profiles/profiles.module";
import { UploadModule } from "./modules/upload/upload.module";
import { ReputationModule } from "./modules/reputation/reputation.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SearchModule } from "./modules/search/search.module";
import { SeoModule } from "./modules/seo/seo.module";
import { FriendsModule } from "./modules/friends/friends.module";
import { UsersModule } from "./modules/users/users.module";
import { AdminModule } from "./modules/admin/admin.module";
import { AiSeedingModule } from "./modules/ai-seeding/ai-seeding.module";
import { AdsModule } from "./modules/ads/ads.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { ChatbotModule } from "./modules/chatbot/chatbot.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { BlogModule } from "./modules/blog/blog.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";
import { CacheDebugInterceptor } from "./common/interceptors/cache-debug.interceptor";
import configuration from "./config/configuration";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: ".env",
    }),
    // ScheduleModule must be initialized once at root level to avoid serialization warnings
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
    PrismaModule,
    RedisModule,
    QueueModule,
    HealthModule,
    AuthModule,
    PostsModule,
    HashtagsModule,
    ReactionsModule,
    CommentsModule,
    ModerationModule,
    ProfilesModule,
    UploadModule,
    ReputationModule,
    NotificationsModule,
    SearchModule,
    SeoModule,
    FriendsModule,
    UsersModule,
    AdminModule,
    AiSeedingModule,
    AdsModule,
    PricingModule,
    ChatbotModule,
    SettingsModule,
    BlogModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: CacheDebugInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply CSRF middleware for all routes (must be after cookie-parser in main.ts)
    // Express 5 / path-to-regexp 8 requires named wildcards.
    consumer.apply(CsrfMiddleware).forRoutes("{*splat}");

    // Apply hash-path fallback middleware for /uploads/* routes
    // This handles legacy flat paths by redirecting to hash-based paths
    consumer.apply(HashPathFallbackMiddleware).forRoutes("/uploads/{*splat}");
  }
}
