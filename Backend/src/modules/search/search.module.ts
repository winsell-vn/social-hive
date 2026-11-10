import { Module } from "@nestjs/common";
import { SearchController } from "./controllers/search.controller";
import { SearchService } from "./services/search.service";
import { SearchRepository } from "./repositories/search.repository";

@Module({
  controllers: [SearchController],
  providers: [SearchService, SearchRepository],
  exports: [SearchService],
})
export class SearchModule {}
