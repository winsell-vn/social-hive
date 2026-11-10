import {
  IsString,
  IsUUID,
  IsOptional,
  IsIn,
  MinLength,
  MaxLength,
} from "class-validator";

export class ChatMessageDto {
  @IsUUID()
  sessionId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;

  @IsOptional()
  @IsIn(["vi", "en"])
  language?: "vi" | "en";
}
