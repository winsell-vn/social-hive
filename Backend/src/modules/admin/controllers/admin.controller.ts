import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminService } from "../services/admin.service";
import { ModerationService } from "../../moderation/services/moderation.service";
import { GetUsersDto } from "../dto/get-users.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import {
  CurrentUser,
  CurrentUserData,
} from "../../../common/decorators/current-user.decorator";
import { Role } from "@prisma/client";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private moderationService: ModerationService,
  ) {}

  @Get("analytics")
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get("users")
  async getUsers(@Query() query: GetUsersDto) {
    return this.adminService.getUsers(query);
  }

  @Patch("users/:userId")
  async updateUser(
    @Param("userId") userId: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() admin: CurrentUserData,
  ) {
    return this.adminService.updateUser(userId, dto, admin.id);
  }

  @Get("moderation/queue")
  async getModerationQueue(
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.moderationService.getPendingPosts(page || 1, limit || 20);
  }

  @Post("moderation/:postId/approve")
  async approvePost(
    @Param("postId") postId: string,
    @CurrentUser() admin: CurrentUserData,
  ) {
    return this.moderationService.approvePost(postId, admin.id);
  }

  @Post("moderation/:postId/reject")
  async rejectPost(
    @Param("postId") postId: string,
    @Body("reason") reason: string,
    @CurrentUser() admin: CurrentUserData,
  ) {
    return this.moderationService.rejectPost(postId, admin.id, reason);
  }
}
