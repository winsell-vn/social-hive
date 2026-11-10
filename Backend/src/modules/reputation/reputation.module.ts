import { Module, forwardRef } from "@nestjs/common";
import { ReputationController } from "./controllers/reputation.controller";
import { ReputationService } from "./services/reputation.service";
import { ReputationRepository } from "./repositories/reputation.repository";
import { PrismaModule } from "../../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [ReputationController],
  providers: [ReputationService, ReputationRepository],
  exports: [ReputationService],
})
export class ReputationModule {}
