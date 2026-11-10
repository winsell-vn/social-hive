import { IsOptional, IsString, IsEnum } from "class-validator";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { PostStatus } from "@prisma/client";

export class GetPostsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  authorId?: string;

  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}

export class GetUserPostsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;
}
