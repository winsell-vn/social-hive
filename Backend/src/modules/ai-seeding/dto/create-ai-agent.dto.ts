import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsUUID,
  ValidateNested,
  IsArray,
} from "class-validator";
import { Type } from "class-transformer";

export class ActivityWindowDto {
  @IsInt()
  @Min(0)
  @Max(23)
  startHour: number;

  @IsInt()
  @Min(0)
  @Max(23)
  endHour: number;

  @IsOptional()
  @IsString()
  timezone?: string;
}

export class PersonalityDto {
  @IsString()
  traits: string;

  @IsString()
  tone: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  interests?: string[];

  @IsOptional()
  @IsString()
  writingStyle?: string;
}

export class CreateAiAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsUUID()
  apiKeyId: string;

  @ValidateNested()
  @Type(() => PersonalityDto)
  personality: PersonalityDto;

  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ActivityWindowDto)
  activityWindow?: ActivityWindowDto;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  postFrequency?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  commentFrequency?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  reactionFrequency?: number;
}
