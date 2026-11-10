import { IsOptional, IsEnum, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export enum TimeRange {
  TODAY = "today",
  WEEK = "week",
  MONTH = "month",
}

export class GetTrendingPostsDto {
  @IsOptional()
  @IsEnum(TimeRange)
  timeRange?: TimeRange = TimeRange.WEEK;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
