import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import { ReactionsService } from "../services/reactions.service";
import { CreateReactionDto, UpdateReactionDto } from "../dto/reaction.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../../auth/guards/roles.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../../../common/decorators/current-user.decorator";
import { ReactionType } from "@prisma/client";

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReactionsController {
  constructor(private reactionsService: ReactionsService) {}

  // Post reactions
  @Post("posts/:postId/reactions")
  async reactToPost(
    @Param("postId") postId: string,
    @Body() dto: UpdateReactionDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.reactionsService.reactToPost(
      user.id,
      postId,
      dto.reactionType || ReactionType.LIKE,
    );
  }

  @Delete("posts/:postId/reactions")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removePostReaction(
    @Param("postId") postId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.reactionsService.removePostReaction(user.id, postId);
  }

  @Get("posts/:postId/reactions")
  async getPostReactions(@Param("postId") postId: string) {
    return this.reactionsService.getPostReactions(postId);
  }

  @Get("posts/:postId/reactions/me")
  async getMyPostReaction(
    @Param("postId") postId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.reactionsService.getUserPostReaction(user.id, postId);
  }

  // Batch get user reactions for multiple posts
  @Post("reactions/batch")
  async getBatchReactions(
    @Body() body: { postIds: string[] },
    @CurrentUser() user: CurrentUserData,
  ) {
    if (
      !body.postIds ||
      !Array.isArray(body.postIds) ||
      body.postIds.length === 0
    ) {
      return {};
    }
    // Limit to 50 posts per request to prevent abuse
    const postIds = body.postIds.slice(0, 50);
    return this.reactionsService.getUserReactionsOnPosts(user.id, postIds);
  }

  // Comment reactions
  @Post("comments/:commentId/reactions")
  async reactToComment(
    @Param("commentId") commentId: string,
    @Body() dto: UpdateReactionDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.reactionsService.reactToComment(
      user.id,
      commentId,
      dto.reactionType || ReactionType.LIKE,
    );
  }

  @Delete("comments/:commentId/reactions")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCommentReaction(
    @Param("commentId") commentId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    await this.reactionsService.removeCommentReaction(user.id, commentId);
  }

  @Get("comments/:commentId/reactions")
  async getCommentReactions(@Param("commentId") commentId: string) {
    return this.reactionsService.getCommentReactions(commentId);
  }

  @Get("comments/:commentId/reactions/me")
  async getMyCommentReaction(
    @Param("commentId") commentId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.reactionsService.getUserCommentReaction(user.id, commentId);
  }
}
