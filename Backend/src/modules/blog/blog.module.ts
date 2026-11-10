import { Module } from "@nestjs/common";
import { BlogController } from "./controllers/blog.controller";
import { BlogService } from "./services/blog.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
