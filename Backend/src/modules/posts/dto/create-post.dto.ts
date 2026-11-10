import {
  IsString,
  IsOptional,
  IsArray,
  MaxLength,
  ArrayMaxSize,
  IsBoolean,
} from "class-validator";

export class CreatePostDto {
  @IsString()
  @MaxLength(50000) // Safety net for HTML content; real limit is 1000 words enforced by frontend
  content: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  hashtags?: string[];

  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;
}
