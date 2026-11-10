import { Module } from "@nestjs/common";
import { AdminController } from "./controllers/admin.controller";
import { AdminService } from "./services/admin.service";
import { PrismaModule } from "../../prisma/prisma.module";
import { ModerationModule } from "../moderation/moderation.module";

@Module({
  imports: [PrismaModule, ModerationModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
