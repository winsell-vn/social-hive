import { IsEnum, IsOptional, IsString } from "class-validator";
import { ReactionType } from "@prisma/client";

export class CreateReactionDto {
  @IsOptional()
  @IsString()
  postId?: string;

  @IsOptional()
  @IsString()
  commentId?: string;

  @IsOptional()
  @IsEnum(ReactionType)
  reactionType?: ReactionType = ReactionType.LIKE;
}

export class UpdateReactionDto {
  @IsEnum(ReactionType)
  reactionType: ReactionType;
}
