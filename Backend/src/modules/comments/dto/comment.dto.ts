import { IsString, IsOptional, MaxLength, MinLength } from "class-validator";

export class CreateCommentDto {
  @IsString()
  @MinLength(1, { message: "Nội dung bình luận không được để trống" })
  @MaxLength(2000, { message: "Nội dung bình luận tối đa 2000 ký tự" })
  content: string;

  @IsOptional()
  @IsString()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsString()
  @MinLength(1, { message: "Nội dung bình luận không được để trống" })
  @MaxLength(2000, { message: "Nội dung bình luận tối đa 2000 ký tự" })
  content: string;
}
