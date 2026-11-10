import { Module, forwardRef } from "@nestjs/common";
import { ProfilesController } from "./controllers/profiles.controller";
import { ProfilesService } from "./services/profiles.service";
import { ProfilesRepository } from "./repositories/profiles.repository";
import { NotificationsModule } from "../notifications/notifications.module";
import { FriendsModule } from "../friends/friends.module";
import { UploadModule } from "../upload/upload.module";

@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    forwardRef(() => FriendsModule),
    UploadModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService, ProfilesRepository],
  exports: [ProfilesService, ProfilesRepository],
})
export class ProfilesModule {}
