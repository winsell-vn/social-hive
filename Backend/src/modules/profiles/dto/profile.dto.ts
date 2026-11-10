import {
  IsString,
  IsOptional,
  MaxLength,
  IsUrl,
  IsArray,
  ArrayMaxSize,
  IsBoolean,
  IsNumber,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/** Credential/certification DTO for profile (E-E-A-T signal) */
export class CredentialDto {
  @IsString({ message: "Tiêu đề chứng chỉ phải là chuỗi" })
  @MaxLength(100, { message: "Tiêu đề chứng chỉ tối đa 100 ký tự" })
  title: string;

  @IsOptional()
  @IsString({ message: "Mô tả chứng chỉ phải là chuỗi" })
  @MaxLength(500, { message: "Mô tả chứng chỉ tối đa 500 ký tự" })
  description?: string;

  @IsOptional()
  @IsString({ message: "Tổ chức cấp phải là chuỗi" })
  @MaxLength(100, { message: "Tổ chức cấp tối đa 100 ký tự" })
  issuedBy?: string;

  @IsOptional()
  @IsNumber({}, { message: "Năm cấp phải là số" })
  year?: number;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(50, { message: "Tên hiển thị tối đa 50 ký tự" })
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Tiểu sử tối đa 500 ký tự" })
  bio?: string;

  @IsOptional()
  @IsUrl({}, { message: "URL avatar không hợp lệ" })
  avatar?: string;

  @IsOptional()
  @IsUrl({}, { message: "URL ảnh bìa không hợp lệ" })
  coverPhoto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Địa điểm tối đa 100 ký tự" })
  location?: string;

  @IsOptional()
  @IsUrl({}, { message: "URL website không hợp lệ" })
  website?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Chức danh tối đa 100 ký tự" })
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "Tên công ty tối đa 100 ký tự" })
  company?: string;

  @IsOptional()
  @IsArray({ message: "Chuyên môn phải là một mảng" })
  @IsString({ each: true, message: "Mỗi chuyên môn phải là chuỗi" })
  @ArrayMaxSize(20, { message: "Tối đa 20 chuyên môn" })
  expertise?: string[];

  @IsOptional()
  @IsArray({ message: "Chứng chỉ phải là một mảng" })
  @ValidateNested({ each: true })
  @Type(() => CredentialDto)
  @ArrayMaxSize(20, { message: "Tối đa 20 chứng chỉ" })
  credentials?: CredentialDto[];
}
