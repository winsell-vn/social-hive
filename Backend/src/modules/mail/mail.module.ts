import { Module } from "@nestjs/common";
import { MailService } from "./mail.service";
import { EmailSettingsService } from "./services/email-settings.service";

@Module({
  providers: [MailService, EmailSettingsService],
  exports: [MailService, EmailSettingsService],
})
export class MailModule {}
