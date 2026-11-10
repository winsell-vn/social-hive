import { IsEnum, IsOptional, IsString } from "class-validator";
import { PostStatus } from "@prisma/client";

export class ModeratePostDto {
  @IsEnum(PostStatus)
  status: PostStatus;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class GetPendingPostsDto {
  @IsOptional()
  page?: number = 1;

  @IsOptional()
  limit?: number = 20;
}
