import { IsOptional, IsInt, Min, Max, IsString, IsEnum } from "class-validator";
import { Type } from "class-transformer";
import { KarmaActionType } from "../constants/karma-actions";

export class GetKarmaHistoryDto {
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

  @IsOptional()
  @IsEnum(KarmaActionType)
  action?: KarmaActionType;
}

export class AdjustKarmaDto {
  @IsInt()
  points: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export interface KarmaTransactionResponse {
  id: string;
  action: string;
  points: number;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface UserReputationResponse {
  karma: number;
  tier: string;
  tierInfo: {
    icon: string;
    label: string;
    multiplier: number;
    minKarma: number;
    maxKarma: number;
    progress: number; // Percentage to next tier
  };
  todayLikeKarma: number;
  maxDailyLikeKarma: number;
}

export interface TierDefinition {
  tier: string;
  icon: string;
  label: string;
  minKarma: number;
  maxKarma: number;
  multiplier: number;
  privileges: string[];
}

export interface TiersResponse {
  tiers: TierDefinition[];
}
