import { IsEmail, IsString } from "class-validator";

export class ForgotPasswordDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  email: string;

  @IsString({ message: "Token CAPTCHA là bắt buộc" })
  turnstileToken: string;
}
