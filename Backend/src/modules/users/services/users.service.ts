import {
  Injectable,
  NotFoundException,
  Logger,
  UnauthorizedException,
} from "@nestjs/common";
import { ProfileVisibility } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { UsersRepository } from "../repositories/users.repository";
import {
  UpdateAccountSettingsDto,
  UpdatePrivacySettingsDto,
  UpdateNotificationSettingsDto,
  UserSettingsResponse,
  ProfileVisibilityDto,
} from "../dto/user-settings.dto";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private usersRepository: UsersRepository) {}

  private mapVisibilityToDto(
    visibility: ProfileVisibility,
  ): "public" | "friends" | "private" {
    const map: Record<ProfileVisibility, "public" | "friends" | "private"> = {
      [ProfileVisibility.PUBLIC]: "public",
      [ProfileVisibility.FRIENDS]: "friends",
      [ProfileVisibility.PRIVATE]: "private",
    };
    return map[visibility];
  }

  private mapDtoToVisibility(
    visibility: ProfileVisibilityDto,
  ): ProfileVisibility {
    const map: Record<ProfileVisibilityDto, ProfileVisibility> = {
      [ProfileVisibilityDto.PUBLIC]: ProfileVisibility.PUBLIC,
      [ProfileVisibilityDto.FRIENDS]: ProfileVisibility.FRIENDS,
      [ProfileVisibilityDto.PRIVATE]: ProfileVisibility.PRIVATE,
    };
    return map[visibility];
  }

  private formatSettingsResponse(settings: any): UserSettingsResponse {
    return {
      id: settings.id,
      userId: settings.userId,
      email: settings.user.email,
      displayName: settings.user.profile?.displayName || "",
      username: settings.user.profile?.username || "",
      bio: settings.user.profile?.bio || null,
      profileVisibility: this.mapVisibilityToDto(settings.profileVisibility),
      showActivityStatus: settings.showActivityStatus,
      emailNotifications: settings.emailNotifications,
      pushNotifications: settings.pushNotifications,
      notifyOnLike: settings.notifyOnLike,
      notifyOnComment: settings.notifyOnComment,
      notifyOnFollow: settings.notifyOnFollow,
      notifyOnMention: settings.notifyOnMention,
      twoFactorEnabled: settings.twoFactorEnabled,
      lastPasswordChange: settings.lastPasswordChange?.toISOString() || null,
    };
  }

  async getSettings(userId: string): Promise<UserSettingsResponse> {
    this.logger.log(`Getting settings for user ${userId}`);

    let settings = await this.usersRepository.findSettingsByUserId(userId);

    // If settings don't exist, create default settings
    if (!settings) {
      this.logger.log(`Creating default settings for user ${userId}`);
      settings = await this.usersRepository.createSettings(userId);
    }

    const response = this.formatSettingsResponse(settings);

    // Include deletion status if user has pending deletion
    const deletionStatus =
      await this.usersRepository.getUserDeletionStatus(userId);
    if (deletionStatus.isScheduledForDeletion) {
      let daysRemaining: number | null = null;
      if (deletionStatus.deletionScheduledFor) {
        const now = new Date();
        const diff =
          deletionStatus.deletionScheduledFor.getTime() - now.getTime();
        daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
      }

      response.deletionStatus = {
        isScheduledForDeletion: true,
        deletionRequestedAt:
          deletionStatus.deletionRequestedAt?.toISOString() || null,
        deletionScheduledFor:
          deletionStatus.deletionScheduledFor?.toISOString() || null,
        daysRemaining,
      };
    }

    return response;
  }

  async updateAccountSettings(
    userId: string,
    dto: UpdateAccountSettingsDto,
  ): Promise<UserSettingsResponse> {
    this.logger.log(`Updating account settings for user ${userId}`);

    // Update profile fields
    if (dto.displayName !== undefined || dto.bio !== undefined) {
      await this.usersRepository.updateProfile(userId, {
        displayName: dto.displayName,
        bio: dto.bio,
      });
    }

    // Update email if provided
    if (dto.email !== undefined) {
      await this.usersRepository.updateUser(userId, { email: dto.email });
    }

    return this.getSettings(userId);
  }

  async updatePrivacySettings(
    userId: string,
    dto: UpdatePrivacySettingsDto,
  ): Promise<UserSettingsResponse> {
    this.logger.log(`Updating privacy settings for user ${userId}`);

    const updateData: any = {};
    if (dto.profileVisibility !== undefined) {
      updateData.profileVisibility = this.mapDtoToVisibility(
        dto.profileVisibility,
      );
    }
    if (dto.showActivityStatus !== undefined) {
      updateData.showActivityStatus = dto.showActivityStatus;
    }

    await this.usersRepository.upsertSettings(userId, updateData);
    return this.getSettings(userId);
  }

  async updateNotificationSettings(
    userId: string,
    dto: UpdateNotificationSettingsDto,
  ): Promise<UserSettingsResponse> {
    this.logger.log(`Updating notification settings for user ${userId}`);

    await this.usersRepository.upsertSettings(userId, dto);
    return this.getSettings(userId);
  }

  async deleteAccount(
    userId: string,
    password: string,
  ): Promise<{ message: string; deletionScheduledFor: Date }> {
    this.logger.log(`Requesting account deletion for user ${userId}`);

    // Get user with password to verify
    const user = await this.usersRepository.findUserWithPassword(userId);
    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Mật khẩu không đúng");
    }

    // Soft delete - schedule for deletion in 14 days
    const { deletionScheduledFor } =
      await this.usersRepository.softDeleteUser(userId);

    return {
      message:
        "Tài khoản của bạn sẽ bị xóa vĩnh viễn sau 14 ngày. Bạn có thể hủy yêu cầu này bất cứ lúc nào.",
      deletionScheduledFor,
    };
  }

  async cancelAccountDeletion(userId: string): Promise<{ message: string }> {
    this.logger.log(`Cancelling account deletion for user ${userId}`);

    // Check if user has pending deletion
    const deletionStatus =
      await this.usersRepository.getUserDeletionStatus(userId);
    if (!deletionStatus.isScheduledForDeletion) {
      throw new NotFoundException(
        "Không có yêu cầu xóa tài khoản nào đang chờ xử lý",
      );
    }

    await this.usersRepository.cancelDeletion(userId);

    return {
      message: "Đã hủy yêu cầu xóa tài khoản",
    };
  }

  async getDeletionStatus(userId: string): Promise<{
    isScheduledForDeletion: boolean;
    deletionRequestedAt: string | null;
    deletionScheduledFor: string | null;
    daysRemaining: number | null;
  }> {
    const status = await this.usersRepository.getUserDeletionStatus(userId);

    let daysRemaining: number | null = null;
    if (status.isScheduledForDeletion && status.deletionScheduledFor) {
      const now = new Date();
      const diff = status.deletionScheduledFor.getTime() - now.getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      isScheduledForDeletion: status.isScheduledForDeletion,
      deletionRequestedAt: status.deletionRequestedAt?.toISOString() || null,
      deletionScheduledFor: status.deletionScheduledFor?.toISOString() || null,
      daysRemaining,
    };
  }
}
