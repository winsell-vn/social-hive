import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Resend } from "resend";
import { EmailSettingsService } from "./services/email-settings.service";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(
    private configService: ConfigService,
    private readonly emailSettings: EmailSettingsService,
  ) {}

  /**
   * Build the Resend transport from the effective configuration.
   * The API key and the sender address can be overridden by an admin through
   * the admin panel, otherwise the env values are used.
   */
  private async getTransport(): Promise<{
    resend: Resend;
    from: string;
  } | null> {
    const config = await this.emailSettings.getConfig();

    if (!config.apiKey) {
      return null;
    }

    return {
      resend: new Resend(config.apiKey),
      from: config.from,
    };
  }

  async sendVerificationEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get("app.frontendUrl");
    const verifyUrl = `${frontendUrl}/verify-email?token=${token}`;

    const transport = await this.getTransport();
    if (!transport) {
      throw new Error(
        "Email provider chưa được cấu hình (thiếu RESEND_API_KEY)",
      );
    }

    try {
      const { data, error } = await transport.resend.emails.send({
        from: transport.from,
        to: email,
        subject: "Xác thực email - ChungToiXayWeb",
        html: `
          <h1>Chào mừng bạn đến với ChungToiXayWeb!</h1>
          <p>Vui lòng click vào link bên dưới để xác thực email của bạn:</p>
          <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#1877F2;color:white;text-decoration:none;border-radius:6px;">
            Xác thực email
          </a>
          <p>Link này sẽ hết hạn sau 24 giờ.</p>
          <p>Nếu bạn không đăng ký tài khoản, vui lòng bỏ qua email này.</p>
        `,
      });

      if (error) {
        this.logger.error(
          `Failed to send verification email to ${email}: ${error.message}`,
        );
        throw new Error(`Failed to send verification email: ${error.message}`);
      }

      this.logger.log(`Verification email sent to ${email} (id: ${data?.id})`);
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${email}`, err);
      throw err;
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<void> {
    const frontendUrl = this.configService.get("app.frontendUrl");
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    const transport = await this.getTransport();
    if (!transport) {
      throw new Error(
        "Email provider chưa được cấu hình (thiếu RESEND_API_KEY)",
      );
    }

    try {
      const { data, error } = await transport.resend.emails.send({
        from: transport.from,
        to: email,
        subject: "Đặt lại mật khẩu - ChungToiXayWeb",
        html: `
          <h1>Đặt lại mật khẩu</h1>
          <p>Bạn đã yêu cầu đặt lại mật khẩu. Click vào link bên dưới:</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#1877F2;color:white;text-decoration:none;border-radius:6px;">
            Đặt lại mật khẩu
          </a>
          <p>Link này sẽ hết hạn sau 1 giờ.</p>
          <p>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        `,
      });

      if (error) {
        this.logger.error(
          `Failed to send password reset email to ${email}: ${error.message}`,
        );
        throw new Error(
          `Failed to send password reset email: ${error.message}`,
        );
      }

      this.logger.log(
        `Password reset email sent to ${email} (id: ${data?.id})`,
      );
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${email}`, err);
      throw err;
    }
  }

  /**
   * Send a plain test email - used by the admin panel to validate the
   * Resend configuration.
   */
  async sendTestEmail(to: string): Promise<{ id?: string; error?: string }> {
    const transport = await this.getTransport();
    if (!transport) {
      throw new Error(
        "Email provider chưa được cấu hình (thiếu RESEND_API_KEY)",
      );
    }

    const { data, error } = await transport.resend.emails.send({
      from: transport.from,
      to,
      subject: "Kiểm tra cấu hình Email - ChungToiXayWeb",
      html: `
        <h1>Cấu hình email đang hoạt động</h1>
        <p>Email này được gửi từ <strong>${transport.from}</strong> để kiểm tra cấu hình Resend.</p>
        <p>Thời điểm gửi: ${new Date().toISOString()}</p>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { id: data?.id };
  }
}
