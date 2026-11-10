import { IsEmail, IsString, IsOptional, IsBoolean } from "class-validator";

export class LoginDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;

  @IsString({ message: "Token CAPTCHA là bắt buộc" })
  turnstileToken: string;
}
