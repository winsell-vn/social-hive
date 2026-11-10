import { Processor, Process } from "@nestjs/bull";
import { Logger } from "@nestjs/common";
import { Job } from "bull";

export interface EmailJob {
  to: string;
  subject: string;
  template: string;
  context: Record<string, unknown>;
}

@Processor("email")
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  @Process("send")
  async handleSend(job: Job<EmailJob>) {
    this.logger.log(`Processing email job ${job.id} to ${job.data.to}`);

    // Email sending will be implemented in MailService
    // This processor just handles the queue

    return { success: true, jobId: job.id };
  }

  @Process("verification")
  async handleVerification(job: Job<{ email: string; token: string }>) {
    this.logger.log(`Processing verification email for ${job.data.email}`);
    return { success: true };
  }

  @Process("password-reset")
  async handlePasswordReset(job: Job<{ email: string; token: string }>) {
    this.logger.log(`Processing password reset email for ${job.data.email}`);
    return { success: true };
  }
}
