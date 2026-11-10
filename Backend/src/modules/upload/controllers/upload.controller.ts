import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from "@nestjs/common";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { UploadService } from "../services/upload.service";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../../../common/decorators/current-user.decorator";
import { validateUploadFile } from "../utils/validation.utils";

@Controller("upload")
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Post("image")
  @UseInterceptors(FileInterceptor("file"))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.uploadService.uploadImage(file, user.id, undefined, user.role);
  }

  @Post("images")
  @UseInterceptors(FilesInterceptor("files", 5))
  async uploadImages(
    @UploadedFiles()
    files: Express.Multer.File[],
    @CurrentUser() user: CurrentUserData,
  ) {
    // Validate each file since ParseFilePipe doesn't support arrays
    for (const file of files) {
      validateUploadFile(file);
    }
    return this.uploadService.uploadMultipleImages(
      files,
      user.id,
      undefined,
      user.role,
    );
  }

  @Get("status/:mediaId")
  async getMediaStatus(@Param("mediaId") mediaId: string) {
    return this.uploadService.getMediaStatus(mediaId);
  }

  @Delete(":mediaId")
  async deleteMedia(
    @Param("mediaId") mediaId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.uploadService.deleteMedia(mediaId, user.id);
    return { success: true, message: "Media đã được xóa" };
  }

  @Post("avatar")
  @UseInterceptors(FileInterceptor("file"))
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.uploadService.uploadAvatar(file, user.id, user.role);
  }

  @Post("cover")
  @UseInterceptors(FileInterceptor("file"))
  async uploadCover(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.uploadService.uploadCover(file, user.id, user.role);
  }
}
