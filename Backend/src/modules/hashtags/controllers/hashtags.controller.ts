import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { HashtagsService } from "../services/hashtags.service";
import { PaginationDto } from "../../../common/dto/pagination.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Public } from "../../../common/decorators/public.decorator";

@Controller("hashtags")
@UseGuards(JwtAuthGuard)
export class HashtagsController {
  constructor(private hashtagsService: HashtagsService) {}

  @Get("trending")
  @Public()
  async getTrending(
    @Query("limit") limit?: number,
    @Query("timeRange") timeRange: "today" | "week" | "month" = "week",
    @Query("includeSamplePosts", { transform: (value) => value === "true" })
    includeSamplePosts: boolean = false,
  ) {
    if (includeSamplePosts) {
      return this.hashtagsService.getTrendingWithSamplePosts(
        timeRange,
        limit || 10,
      );
    }
    return this.hashtagsService.getTrending(limit || 10, timeRange);
  }

  @Get(":name")
  @Public()
  async getHashtag(@Param("name") name: string) {
    return this.hashtagsService.findByName(name);
  }

  @Get(":name/posts")
  @Public()
  async getHashtagPosts(
    @Param("name") name: string,
    @Query() query: PaginationDto,
  ) {
    return this.hashtagsService.getHashtagWithPosts(
      name,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }
}
