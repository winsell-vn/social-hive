import { MediaStatus, MediaType } from "@prisma/client";

export class UploadResponseDto {
  id: string;
  url: string | null;
  status: MediaStatus;
  type: MediaType;
}

export class MediaStatusResponseDto {
  status: MediaStatus;
  url: string | null;
}

export class DeleteMediaResponseDto {
  success: boolean;
  message: string;
}
