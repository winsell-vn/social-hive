import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { SearchService } from "../services/search.service";
import { SearchQueryDto, SearchSuggestionsDto } from "../dto/search.dto";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { Public } from "../../../common/decorators/public.decorator";

@Controller("search")
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Get()
  async search(@Query() query: SearchQueryDto) {
    const trimmedQuery = query.q?.trim() || "";
    return this.searchService.search(
      trimmedQuery,
      query.type ?? "all",
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Get("trending")
  @Public()
  async getTrending(@Query("limit") limit?: number) {
    return this.searchService.getTrendingHashtags(limit || 10);
  }

  @Get("suggestions")
  async getSuggestions(@Query() query: SearchSuggestionsDto) {
    const trimmedQuery = query.q?.trim() || "";
    return this.searchService.getSuggestions(trimmedQuery, query.limit ?? 5);
  }
}
