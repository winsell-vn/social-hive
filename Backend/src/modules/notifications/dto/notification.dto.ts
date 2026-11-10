import { IsOptional, IsBoolean, IsString, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { NotificationType } from "@prisma/client";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class GetNotificationsDto extends PaginationDto {
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  unreadOnly?: boolean;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}

export class MarkAsReadDto {
  @IsOptional()
  @IsBoolean()
  isRead?: boolean = true;
}

export class CreateNotificationDto {
  @IsString()
  userId: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsString()
  title: string;

  @IsOptional()
  data?: Record<string, unknown>;
}

export class NotificationResponseDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  data: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: Date;
}

export class UnreadCountResponseDto {
  count: number;
}
