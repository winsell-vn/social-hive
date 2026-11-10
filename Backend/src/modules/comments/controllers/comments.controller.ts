import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { CommentsService } from "../services/comments.service";
import { CreateCommentDto, UpdateCommentDto } from "../dto/comment.dto";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../../../common/decorators/current-user.decorator";
import { Public } from "../../../common/decorators/public.decorator";
import { Role } from "@prisma/client";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post("posts/:postId/comments")
  async create(
    @Param("postId") postId: string,
    @Body() dto: CreateCommentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.commentsService.create(user.id, postId, dto);
  }

  @Get("posts/:postId/comments")
  @Public()
  async getPostComments(
    @Param("postId") postId: string,
    @Query() query: PaginationDto,
  ) {
    return this.commentsService.getPostComments(
      postId,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get("comments/:commentId/replies")
  @Public()
  async getReplies(
    @Param("commentId") commentId: string,
    @Query() query: PaginationDto,
  ) {
    return this.commentsService.getReplies(
      commentId,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Patch("comments/:id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateCommentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.commentsService.update(id, user.id, dto);
  }

  @Delete("comments/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param("id") id: string, @CurrentUser() user: CurrentUserData) {
    const isAdmin = user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN;
    await this.commentsService.delete(id, user.id, isAdmin);
  }
}
