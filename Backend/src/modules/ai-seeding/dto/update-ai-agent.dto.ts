import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { AiAgentStatus } from "@prisma/client";
import { ActivityWindowDto, PersonalityDto } from "./create-ai-agent.dto";

export class UpdateAiAgentDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(AiAgentStatus)
  status?: AiAgentStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => PersonalityDto)
  personality?: PersonalityDto;

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
