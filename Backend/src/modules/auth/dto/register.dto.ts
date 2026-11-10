import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
} from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "Email không hợp lệ" })
  email: string;

  @IsString()
  @MinLength(3, { message: "Tên người dùng phải có ít nhất 3 ký tự" })
  @MaxLength(30, { message: "Tên người dùng không được quá 30 ký tự" })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: "Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới",
  })
  username: string;

  @IsString()
  @IsOptional()
  @MaxLength(50, { message: "Tên hiển thị không được quá 50 ký tự" })
  displayName?: string;

  @IsString()
  @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số",
  })
  password: string;

  @IsString({ message: "Token CAPTCHA là bắt buộc" })
  turnstileToken: string;
}
