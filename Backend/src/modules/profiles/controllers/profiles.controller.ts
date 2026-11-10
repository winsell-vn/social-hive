import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Headers,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ProfilesService } from "../services/profiles.service";
import { UpdateProfileDto } from "../dto/profile.dto";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../../../common/decorators/current-user.decorator";
import { Public } from "../../../common/decorators/public.decorator";

@Controller("profiles")
@UseGuards(JwtAuthGuard)
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Get("me")
  async getMyProfile(@CurrentUser() user: CurrentUserData) {
    return this.profilesService.getMyProfile(user.id);
  }

  @Patch("me")
  async updateMyProfile(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.profilesService.updateProfile(user.id, dto);
  }

  @Post("me/avatar")
  @UseInterceptors(FileInterceptor("avatar"))
  async uploadAvatar(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.profilesService.updateAvatar(user.id, file);
  }

  @Post("me/cover")
  @UseInterceptors(FileInterceptor("cover"))
  async uploadCover(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.profilesService.updateCover(user.id, file);
  }

  // Follow-related routes must be defined BEFORE the catch-all :username route
  @Post(":userId/follow")
  async follow(
    @Param("userId") userId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.profilesService.follow(user.id, userId);
  }

  @Delete(":userId/follow")
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(
    @Param("userId") userId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.profilesService.unfollow(user.id, userId);
  }

  @Get(":userId/follow/status")
  async checkFollowStatus(
    @Param("userId") userId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.profilesService.checkFollowStatus(user.id, userId);
  }

  @Get(":username")
  @Public()
  async getProfile(
    @Param("username") username: string,
    @CurrentUser() user: CurrentUserData | undefined,
    @Headers("user-agent") userAgent: string,
  ) {
    return this.profilesService.getProfileWithVisibilityCheck(
      username,
      user?.id ?? null,
      userAgent,
    );
  }

  @Get(":username/followers")
  @Public()
  async getFollowers(
    @Param("username") username: string,
    @Query() query: PaginationDto,
  ) {
    const profile = await this.profilesService.getProfile(username);
    return this.profilesService.getFollowers(
      profile.userId,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get(":username/following")
  @Public()
  async getFollowing(
    @Param("username") username: string,
    @Query() query: PaginationDto,
  ) {
    const profile = await this.profilesService.getProfile(username);
    return this.profilesService.getFollowing(
      profile.userId,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }
}
