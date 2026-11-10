import { Module } from "@nestjs/common";
import { SettingsService } from "./services/settings.service";
import { SettingsController } from "./controllers/settings.controller";
import { PrismaModule } from "../../prisma/prisma.module";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
