import { Module, forwardRef } from "@nestjs/common";
import { NotificationsController } from "./controllers/notifications.controller";
import { NotificationsService } from "./services/notifications.service";
import { NotificationBatchService } from "./services/notification-batch.service";
import { NotificationsRepository } from "./repositories/notifications.repository";
import { QueueModule } from "../../queue/queue.module";
import { ProfilesModule } from "../profiles/profiles.module";

@Module({
  // Note: ScheduleModule.forRoot() is initialized in AppModule to avoid serialization warnings
  imports: [QueueModule, forwardRef(() => ProfilesModule)],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationBatchService,
    NotificationsRepository,
  ],
  exports: [NotificationsService, NotificationBatchService],
})
export class NotificationsModule {}
