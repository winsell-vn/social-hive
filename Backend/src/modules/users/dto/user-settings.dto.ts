import {
  IsEnum,
  IsBoolean,
  IsString,
  IsOptional,
  IsNotEmpty,
  IsEmail,
  MaxLength,
} from "class-validator";

export enum ProfileVisibilityDto {
  PUBLIC = "public",
  FRIENDS = "friends",
  PRIVATE = "private",
}

export class UpdateAccountSettingsDto {
  @IsOptional()
  @IsString()
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Tiểu sử không được quá 500 ký tự" })
  bio?: string;

  @IsOptional()
  @IsEmail({}, { message: "Email không hợp lệ" })
  email?: string;
}

export class UpdatePrivacySettingsDto {
  @IsOptional()
  @IsEnum(ProfileVisibilityDto)
  profileVisibility?: ProfileVisibilityDto;

  @IsOptional()
  @IsBoolean()
  showActivityStatus?: boolean;
}

export class UpdateNotificationSettingsDto {
  @IsOptional()
  @IsBoolean()
  emailNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  pushNotifications?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnLike?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnComment?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnFollow?: boolean;

  @IsOptional()
  @IsBoolean()
  notifyOnMention?: boolean;
}

export interface UserSettingsResponse {
  id: string;
  userId: string;
  // Account settings (from User + Profile)
  email: string;
  displayName: string;
  username: string;
  bio: string | null;
  // Privacy settings
  profileVisibility: "public" | "friends" | "private";
  showActivityStatus: boolean;
  // Notification settings
  emailNotifications: boolean;
  pushNotifications: boolean;
  notifyOnLike: boolean;
  notifyOnComment: boolean;
  notifyOnFollow: boolean;
  notifyOnMention: boolean;
  // Security
  twoFactorEnabled: boolean;
  lastPasswordChange: string | null;
  // Deletion status
  deletionStatus?: {
    isScheduledForDeletion: boolean;
    deletionRequestedAt: string | null;
    deletionScheduledFor: string | null;
    daysRemaining: number | null;
  };
}

export class DeleteAccountDto {
  @IsString()
  @IsNotEmpty({ message: "Vui lòng nhập mật khẩu" })
  password: string;
}

export interface DeleteAccountResponse {
  message: string;
  deletionScheduledFor: Date;
}

export interface CancelDeletionResponse {
  message: string;
}

export interface DeletionStatusResponse {
  isScheduledForDeletion: boolean;
  deletionRequestedAt: string | null;
  deletionScheduledFor: string | null;
  daysRemaining: number | null;
}
