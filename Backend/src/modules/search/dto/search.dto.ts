import { IsOptional, IsString, IsIn, IsInt, Min, Max } from "class-validator";
import { Type } from "class-transformer";

export class SearchQueryDto {
  @IsString()
  q: string;

  @IsOptional()
  @IsIn(["all", "posts", "users", "hashtags"])
  type?: "all" | "posts" | "users" | "hashtags" = "all";

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

export class SearchSuggestionsDto {
  @IsString()
  q: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number = 5;
}
