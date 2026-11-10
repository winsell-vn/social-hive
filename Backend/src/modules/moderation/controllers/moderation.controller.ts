import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ModerationService } from "../services/moderation.service";
import { ModeratePostDto, GetPendingPostsDto } from "../dto/moderation.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import {
  CurrentUser,
  CurrentUserData,
} from "../../../common/decorators/current-user.decorator";
import { Role } from "@prisma/client";

@Controller("moderation")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
export class ModerationController {
  constructor(private moderationService: ModerationService) {}

  @Get("posts/pending")
  async getPendingPosts(@Query() query: GetPendingPostsDto) {
    return this.moderationService.getPendingPosts(
      query.page || 1,
      query.limit || 20,
    );
  }

  @Post("posts/:postId")
  async moderatePost(
    @Param("postId") postId: string,
    @Body() dto: ModeratePostDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.moderationService.moderatePost(postId, user.id, dto);
  }

  @Post("posts/:postId/approve")
  async approvePost(
    @Param("postId") postId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.moderationService.approvePost(postId, user.id);
  }

  @Post("posts/:postId/reject")
  async rejectPost(
    @Param("postId") postId: string,
    @Body("reason") reason: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.moderationService.rejectPost(postId, user.id, reason);
  }

  @Get("stats")
  async getModerationStats() {
    return this.moderationService.getModerationStats();
  }
}
