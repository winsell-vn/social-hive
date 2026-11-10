import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { AiActionType } from "@prisma/client";

export class TriggerActionDto {
  @IsEnum(AiActionType)
  actionType: AiActionType;

  @IsOptional()
  @IsUUID()
  targetPostId?: string;

  @IsOptional()
  @IsUUID()
  targetCommentId?: string;

  @IsOptional()
  @IsString()
  customPrompt?: string;
}
