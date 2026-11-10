import { Module } from "@nestjs/common";
import { PricingController } from "./controllers/pricing.controller";
import { QuoteController } from "./controllers/quote.controller";
import { PricingService } from "./services/pricing.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { RedisModule } from "../../redis/redis.module";

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [PricingController, QuoteController],
  providers: [PricingService],
  exports: [PricingService],
})
export class PricingModule {}
