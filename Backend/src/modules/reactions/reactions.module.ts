import { Module } from "@nestjs/common";
import { ReactionsController } from "./controllers/reactions.controller";
import { ReactionsService } from "./services/reactions.service";
import { ReactionsRepository } from "./repositories/reactions.repository";
import { PostsModule } from "../posts/posts.module";
import { ReputationModule } from "../reputation/reputation.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ProfilesModule } from "../profiles/profiles.module";

@Module({
  imports: [PostsModule, ReputationModule, NotificationsModule, ProfilesModule],
  controllers: [ReactionsController],
  providers: [ReactionsService, ReactionsRepository],
  exports: [ReactionsService, ReactionsRepository],
})
export class ReactionsModule {}
