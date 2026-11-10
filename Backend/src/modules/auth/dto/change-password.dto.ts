import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";

@ValidatorConstraint({ name: "MatchPassword", async: false })
export class MatchPasswordConstraint implements ValidatorConstraintInterface {
  validate(confirmPassword: string, args: ValidationArguments) {
    const object = args.object as ChangePasswordDto;
    return confirmPassword === object.newPassword;
  }

  defaultMessage() {
    return "Mật khẩu xác nhận không khớp";
  }
}

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: "Vui lòng nhập mật khẩu hiện tại" })
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: "Mật khẩu mới phải có ít nhất 8 ký tự" })
  @MaxLength(100)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: "Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số",
  })
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: "Vui lòng xác nhận mật khẩu mới" })
  @Validate(MatchPasswordConstraint)
  confirmPassword: string;
}
