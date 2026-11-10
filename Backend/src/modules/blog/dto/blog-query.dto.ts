import { IsOptional, IsString, IsEnum, IsUUID } from "class-validator";
import { BlogPostStatus, BlogPostType } from "@prisma/client";
import { PaginationDto } from "../../../common/dto/pagination.dto";

export class BlogQueryDto extends PaginationDto {
  @IsOptional()
  @IsString()
  categorySlug?: string;

  @IsOptional()
  @IsEnum(BlogPostStatus)
  status?: BlogPostStatus;

  @IsOptional()
  @IsEnum(BlogPostType)
  postType?: BlogPostType;

  @IsOptional()
  @IsUUID()
  authorId?: string;
}
