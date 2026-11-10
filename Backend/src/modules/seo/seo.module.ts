import { Module } from "@nestjs/common";
import { SitemapController } from "./controllers/sitemap.controller";
import { SitemapService } from "./services/sitemap.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [SitemapController],
  providers: [SitemapService],
  exports: [SitemapService],
})
export class SeoModule {}
