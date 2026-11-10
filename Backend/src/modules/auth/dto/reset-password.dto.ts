import { IsString, MinLength, MaxLength, Matches } from "class-validator";

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8, { message: "Mật khẩu phải có ít nhất 8 ký tự" })
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số",
  })
  password: string;
}
