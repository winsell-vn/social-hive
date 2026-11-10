import { IsString, IsNotEmpty, Length } from "class-validator";

export class Enable2FAResponseDto {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export class Verify2FADto {
  @IsString()
  @Length(6, 6, { message: "Mã xác thực phải có 6 chữ số" })
  code: string;
}

export class Disable2FADto {
  @IsString()
  @IsNotEmpty({ message: "Vui lòng nhập mật khẩu" })
  password: string;
}

export class Login2FADto {
  @IsString()
  @IsNotEmpty({ message: "Vui lòng nhập mã xác thực" })
  code: string; // Can be TOTP code (6 digits) or backup code (8 chars)

  @IsString()
  @IsNotEmpty({ message: "Token tạm thời không hợp lệ" })
  tempToken: string;
}
