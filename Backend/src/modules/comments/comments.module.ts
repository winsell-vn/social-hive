import { Module } from "@nestjs/common";
import { CommentsController } from "./controllers/comments.controller";
import { CommentsService } from "./services/comments.service";
import { CommentsRepository } from "./repositories/comments.repository";
import { PostsModule } from "../posts/posts.module";
import { ReputationModule } from "../reputation/reputation.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { ProfilesModule } from "../profiles/profiles.module";

@Module({
  imports: [PostsModule, ReputationModule, NotificationsModule, ProfilesModule],
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository],
  exports: [CommentsService, CommentsRepository],
})
export class CommentsModule {}
