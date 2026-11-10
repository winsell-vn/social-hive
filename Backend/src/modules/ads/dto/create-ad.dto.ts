import {
  IsString,
  IsOptional,
  IsUrl,
  IsBoolean,
  IsEnum,
  IsInt,
  MaxLength,
  Min,
  Matches,
} from "class-validator";
import { AdPlacement } from "@prisma/client";

export class CreateAdDto {
  @IsString()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @Matches(/^(https?:\/\/.+|\/uploads\/.+)$/i, {
    message: 'imageUrl must be a valid URL or a relative path starting with /uploads/',
  })
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  ctaText?: string;

  @IsUrl()
  ctaLink: string;

  @IsOptional()
  @IsEnum(AdPlacement)
  placement?: AdPlacement;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;
}
