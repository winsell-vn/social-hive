import { IsString, IsNotEmpty, IsOptional, IsBoolean } from "class-validator";

export class UpdateEmailConfigDto {
  /**
   * Resend API key. Leave empty to keep the current value.
   */
  @IsOptional()
  @IsString()
  apiKey?: string;

  /**
   * Sender address, e.g. noreply@chungtoixayweb.vn
   */
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  from?: string;

  /**
   * When disabled, registrations are activated immediately and no email is sent.
   */
  @IsOptional()
  @IsBoolean()
  verificationRequired?: boolean;
}
