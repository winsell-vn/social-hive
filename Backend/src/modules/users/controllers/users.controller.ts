import {
  Controller,
  Get,
  Patch,
  Delete,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { UsersService } from "../services/users.service";
import {
  UpdateAccountSettingsDto,
  UpdatePrivacySettingsDto,
  UpdateNotificationSettingsDto,
  DeleteAccountDto,
} from "../dto/user-settings.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../../../common/decorators/current-user.decorator";

@Controller("users")
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * GET /users/settings
   * Get current user's settings
   */
  @Get("settings")
  async getSettings(@CurrentUser() user: CurrentUserData) {
    return this.usersService.getSettings(user.id);
  }

  /**
   * PATCH /users/settings/account
   * Update account settings (displayName, bio, email)
   */
  @Patch("settings/account")
  async updateAccountSettings(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateAccountSettingsDto,
  ) {
    return this.usersService.updateAccountSettings(user.id, dto);
  }

  /**
   * PATCH /users/settings/privacy
   * Update privacy settings
   */
  @Patch("settings/privacy")
  async updatePrivacySettings(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdatePrivacySettingsDto,
  ) {
    return this.usersService.updatePrivacySettings(user.id, dto);
  }

  /**
   * PATCH /users/settings/notifications
   * Update notification settings
   */
  @Patch("settings/notifications")
  async updateNotificationSettings(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.usersService.updateNotificationSettings(user.id, dto);
  }

  /**
   * DELETE /users/account
   * Request account deletion (soft delete with 14-day grace period)
   */
  @Delete("account")
  @HttpCode(HttpStatus.OK)
  async deleteAccount(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: DeleteAccountDto,
  ) {
    return this.usersService.deleteAccount(user.id, dto.password);
  }

  /**
   * POST /users/account/cancel-deletion
   * Cancel pending account deletion
   */
  @Post("account/cancel-deletion")
  @HttpCode(HttpStatus.OK)
  async cancelDeletion(@CurrentUser() user: CurrentUserData) {
    return this.usersService.cancelAccountDeletion(user.id);
  }

  /**
   * GET /users/account/deletion-status
   * Get account deletion status
   */
  @Get("account/deletion-status")
  async getDeletionStatus(@CurrentUser() user: CurrentUserData) {
    return this.usersService.getDeletionStatus(user.id);
  }
}
