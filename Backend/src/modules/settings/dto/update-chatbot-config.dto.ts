import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Max,
} from "class-validator";
import { AiProviderProtocol } from "@prisma/client";

export class UpdateChatbotConfigDto {
  @IsOptional()
  @IsString()
  apiKey?: string;

  /**
   * Root of the OpenAI-compatible API, e.g. https://api.groq.com/openai/v1
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  baseUrl?: string;

  /**
   * Wire protocol used to talk to the provider
   */
  @IsOptional()
  @IsEnum(AiProviderProtocol)
  protocol?: AiProviderProtocol;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  primaryModel?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  fallbackModel?: string;

  @IsOptional()
  @IsNumber()
  @Min(128)
  @Max(2048)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;
}
