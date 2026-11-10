import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsDateString,
  IsBoolean,
} from "class-validator";
import { Type, Transform } from "class-transformer";
import { AiActionType, ContentFilterResult } from "@prisma/client";

export class AiActivityQueryDto {
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @IsOptional()
  @IsEnum(AiActionType)
  actionType?: AiActionType;

  @IsOptional()
  @IsEnum(ContentFilterResult)
  filterResult?: ContentFilterResult;

  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  success?: boolean;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
