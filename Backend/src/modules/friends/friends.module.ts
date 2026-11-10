import { Module, forwardRef } from "@nestjs/common";
import { FriendsController } from "./controllers/friends.controller";
import { FriendsService } from "./services/friends.service";
import { FriendsRepository } from "./repositories/friends.repository";
import { NotificationsModule } from "../notifications/notifications.module";
import { ProfilesModule } from "../profiles/profiles.module";
import { RedisModule } from "../../redis/redis.module";

@Module({
  imports: [
    forwardRef(() => NotificationsModule),
    forwardRef(() => ProfilesModule),
    RedisModule,
  ],
  controllers: [FriendsController],
  providers: [FriendsService, FriendsRepository],
  exports: [FriendsService, FriendsRepository],
})
export class FriendsModule {}
