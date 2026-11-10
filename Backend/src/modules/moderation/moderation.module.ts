import { Module } from "@nestjs/common";
import { ModerationController } from "./controllers/moderation.controller";
import { ModerationService } from "./services/moderation.service";
import { PostsModule } from "../posts/posts.module";
import { QueueModule } from "../../queue/queue.module";
import { ReputationModule } from "../reputation/reputation.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [PostsModule, QueueModule, ReputationModule, NotificationsModule],
  controllers: [ModerationController],
  providers: [ModerationService],
  exports: [ModerationService],
})
export class ModerationModule {}
