import { IsOptional, IsBoolean, IsEnum } from "class-validator";
import { Role } from "@prisma/client";

export class UpdateUserDto {
  @IsOptional()
  @IsBoolean()
  isBanned?: boolean;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
