import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { AiProviderProtocol } from "@prisma/client";

export class UpdateAiProviderKeyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  /**
   * Root of the OpenAI-compatible API, e.g. https://api.groq.com/openai/v1
   */
  @IsOptional()
  @IsString()
  baseUrl?: string;

  /**
   * Model identifier understood by the provider, e.g. llama-3.1-8b-instant
   */
  @IsOptional()
  @IsString()
  modelId?: string;

  /**
   * Wire protocol used to talk to the provider
   */
  @IsOptional()
  @IsEnum(AiProviderProtocol)
  protocol?: AiProviderProtocol;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  maxAgents?: number;
}
