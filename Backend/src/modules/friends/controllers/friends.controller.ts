import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { FriendsService } from "../services/friends.service";
import { GetFriendsDto } from "../dto/friend-request.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../../../common/decorators/current-user.decorator";

@Controller("friends")
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post("request/:userId")
  async sendRequest(
    @Param("userId") userId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.friendsService.sendRequest(user.id, userId);
  }

  @Post("accept/:requestId")
  async acceptRequest(
    @Param("requestId") requestId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.friendsService.acceptRequest(user.id, requestId);
  }

  @Post("reject/:requestId")
  async rejectRequest(
    @Param("requestId") requestId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.friendsService.rejectRequest(user.id, requestId);
  }

  @Delete("cancel/:requestId")
  @HttpCode(HttpStatus.OK)
  async cancelRequest(
    @Param("requestId") requestId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.friendsService.cancelRequest(user.id, requestId);
  }

  @Delete(":userId")
  @HttpCode(HttpStatus.OK)
  async unfriend(
    @Param("userId") userId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.friendsService.unfriend(user.id, userId);
  }

  @Get()
  async getFriends(
    @Query() dto: GetFriendsDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.friendsService.getFriends(user.id, dto);
  }

  @Get("requests")
  async getPendingRequests(@CurrentUser() user: CurrentUserData) {
    return this.friendsService.getPendingRequests(user.id);
  }

  @Get("suggestions")
  async getSuggestions(@CurrentUser() user: CurrentUserData) {
    return this.friendsService.getSuggestions(user.id);
  }

  @Get("user/:userId")
  async getUserFriends(
    @Param("userId") userId: string,
    @Query("page") page: number = 1,
    @Query("limit") limit: number = 10,
    @Query("search") search?: string,
  ) {
    const dto = new GetFriendsDto();
    dto.page = page;
    dto.limit = limit;
    dto.search = search;
    return this.friendsService.getFriends(userId, dto);
  }

  @Get("status/:userId")
  async getFriendshipStatus(
    @Param("userId") userId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.friendsService.getFriendshipStatus(user.id, userId);
  }

  @Get("count")
  async getCounts(@CurrentUser() user: CurrentUserData) {
    return this.friendsService.getCounts(user.id);
  }
}
