import { Module } from "@nestjs/common";
import { AdsController } from "./controllers/ads.controller";
import { AdsService } from "./services/ads.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [AdsController],
  providers: [AdsService],
  exports: [AdsService],
})
export class AdsModule {}
