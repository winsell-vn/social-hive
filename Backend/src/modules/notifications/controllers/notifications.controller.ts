import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import { NotificationsService } from "../services/notifications.service";
import { GetNotificationsDto } from "../dto/notification.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";

interface CurrentUserData {
  id: string;
  email: string;
  role: string;
}

@Controller("notifications")
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: CurrentUserData,
    @Query() query: GetNotificationsDto,
  ) {
    return this.notificationsService.getNotifications(
      user.id,
      query.page ?? 1,
      query.limit ?? 20,
      query.unreadOnly,
      query.type,
    );
  }

  @Get("unread-count")
  async getUnreadCount(@CurrentUser() user: CurrentUserData) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(":id/read")
  async markAsRead(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const notification = await this.notificationsService.markAsRead(
      id,
      user.id,
    );
    if (!notification) {
      throw new NotFoundException("Thông báo không tồn tại");
    }
    return notification;
  }

  @Patch("read-all")
  async markAllAsRead(@CurrentUser() user: CurrentUserData) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Delete(":id")
  async delete(@Param("id") id: string, @CurrentUser() user: CurrentUserData) {
    const result = await this.notificationsService.delete(id, user.id);
    if (!result) {
      throw new NotFoundException("Thông báo không tồn tại");
    }
    return result;
  }
}
