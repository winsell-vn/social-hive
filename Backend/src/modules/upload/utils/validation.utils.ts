import { BadRequestException } from "@nestjs/common";
import { MediaType } from "@prisma/client";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Magic bytes for image formats
const MAGIC_BYTES: Record<string, number[][]> = {
  "image/jpeg": [[0xff, 0xd8, 0xff]],
  "image/png": [[0x89, 0x50, 0x4e, 0x47]],
  "image/gif": [[0x47, 0x49, 0x46, 0x38]],
  "image/webp": [[0x52, 0x49, 0x46, 0x46]], // RIFF header (bytes 0-3), also need WEBP at bytes 8-11
};

// WebP requires additional validation: RIFF at 0-3 and WEBP at 8-11
const WEBP_SIGNATURE = [0x57, 0x45, 0x42, 0x50]; // "WEBP" at offset 8

/**
 * Validate file MIME type against allowed types
 */
export function validateMimeType(
  mimeType: string,
  allowedTypes: string[] = ALLOWED_MIME_TYPES,
): void {
  if (!allowedTypes.includes(mimeType)) {
    throw new BadRequestException(
      `Định dạng file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(", ")}`,
    );
  }
}

/**
 * Validate file size against maximum
 */
export function validateFileSize(
  size: number,
  maxSize: number = MAX_FILE_SIZE,
): void {
  if (size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    throw new BadRequestException(`Kích thước file tối đa là ${maxMB}MB`);
  }
}

/**
 * Validate file magic bytes to prevent MIME type spoofing
 */
export function validateMagicBytes(
  buffer: Buffer,
  declaredMimeType: string,
): void {
  const signatures = MAGIC_BYTES[declaredMimeType];
  if (!signatures) return; // Skip validation for unknown types

  const isValid = signatures.some((signature) =>
    signature.every((byte, index) => buffer[index] === byte),
  );

  if (!isValid) {
    throw new BadRequestException(
      "File không hợp lệ. Nội dung file không khớp với định dạng khai báo.",
    );
  }

  // Additional validation for WebP: check "WEBP" at bytes 8-11
  if (declaredMimeType === "image/webp") {
    const hasWebpSignature = WEBP_SIGNATURE.every(
      (byte, index) => buffer[8 + index] === byte,
    );
    if (!hasWebpSignature) {
      throw new BadRequestException(
        "File không hợp lệ. Nội dung file không khớp với định dạng khai báo.",
      );
    }
  }
}

/**
 * Validate a complete file upload
 */
export function validateUploadFile(
  file: Express.Multer.File,
  options?: {
    allowedTypes?: string[];
    maxSize?: number;
    validateContent?: boolean;
  },
): void {
  const { allowedTypes, maxSize, validateContent = true } = options || {};

  validateMimeType(file.mimetype, allowedTypes);
  validateFileSize(file.size, maxSize);

  if (validateContent && file.buffer) {
    validateMagicBytes(file.buffer, file.mimetype);
  }
}

/**
 * Get file extension from MIME type
 * Shared utility used by upload.service.ts and image-processing.processor.ts
 */
export function getOriginalExtension(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return mimeToExt[mimeType] || "bin";
}

/**
 * Get storage folder based on media type
 * Shared utility used by upload.service.ts and image-processing.processor.ts
 */
export function getFolder(type: MediaType): string {
  switch (type) {
    case MediaType.AVATAR:
      return "avatars";
    case MediaType.COVER:
      return "covers";
    case MediaType.POST_IMAGE:
      return "posts";
    case MediaType.BLOG_IMAGE:
      return "blog";
    case MediaType.AD_IMAGE:
      return "ads";
    default:
      return "misc";
  }
}
