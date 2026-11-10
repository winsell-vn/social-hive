import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsUUID,
} from "class-validator";

export class CreateServiceDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @IsOptional()
  @IsUUID()
  categoryId?: string;
}
