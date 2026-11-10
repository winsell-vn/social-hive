import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { randomBytes, randomUUID } from "crypto";
import { UserRepository } from "../repositories/user.repository";
import { SessionService } from "./session.service";
import { TwoFactorService } from "./two-factor.service";
import { LoginAttemptService } from "./login-attempt.service";
import { PasswordBreachService } from "./password-breach.service";
import { MailService } from "../../mail/mail.service";
import { EmailSettingsService } from "../../mail/services/email-settings.service";
import { RegisterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { ChangePasswordDto } from "../dto/change-password.dto";
import { User } from "@prisma/client";
import { UsersRepository } from "../../users/repositories/users.repository";

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private userRepository: UserRepository,
    private usersRepository: UsersRepository,
    private sessionService: SessionService,
    private twoFactorService: TwoFactorService,
    private loginAttemptService: LoginAttemptService,
    private passwordBreachService: PasswordBreachService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
    private emailSettingsService: EmailSettingsService,
  ) {}

  async register(
    dto: RegisterDto,
  ): Promise<{
    userId: string;
    requiresEmailVerification: boolean;
    verificationEmailSent: boolean;
  }> {
    // Check if password has been found in data breaches (BEFORE email check)
    const isBreached = await this.passwordBreachService.isBreached(dto.password);
    if (isBreached) {
      throw new BadRequestException(
        "Mật khẩu này đã xuất hiện trong các vụ rò rỉ dữ liệu. Vui lòng chọn mật khẩu khác an toàn hơn.",
      );
    }

    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      // Don't reveal that email exists - return same response
      if (!existingUser.isActive) {
        // Re-send verification email for unverified accounts
        try {
          await this.resendVerificationEmail(dto.email);
        } catch {
          // Ignore errors - don't reveal anything
        }
      }
      // Return fake success with random UUID
      return {
        userId: randomUUID(),
        requiresEmailVerification: true,
        verificationEmailSent: false,
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create user
    const user = await this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
    });

    // Create user profile with username and displayName
    await this.userRepository.createProfile({
      userId: user.id,
      username: dto.username,
      displayName: dto.displayName || null,
    });

    // Email verification is optional and controlled by the admin panel.
    // When it is disabled the account is activated immediately and no email
    // is sent at all.
    const verificationRequired =
      await this.emailSettingsService.isVerificationRequired();

    if (!verificationRequired) {
      await this.userRepository.activateUser(user.id);
      this.logger.log(
        `Registered user ${user.id} - email verification disabled, account activated`,
      );

      return { userId: user.id, requiresEmailVerification: false, verificationEmailSent: false };
    }

    // Generate verification token
    const token = randomBytes(32).toString("hex");
    await this.userRepository.createEmailVerification({
      email: dto.email,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    // Send verification email. A mail provider failure must not break the
    // registration - the account stays inactive and the user can request a
    // new verification email later.
    let verificationEmailSent = true;
    try {
      await this.mailService.sendVerificationEmail(dto.email, token);
    } catch (error) {
      verificationEmailSent = false;
      this.logger.error(
        `Failed to send verification email to ${dto.email}: ${
          error instanceof Error ? error.message : error
        }`,
      );
    }

    return { userId: user.id, requiresEmailVerification: true, verificationEmailSent };
  }

  async verifyEmail(token: string): Promise<void> {
    const verification = await this.userRepository.findEmailVerification(token);

    if (!verification) {
      throw new BadRequestException("Token không hợp lệ");
    }

    if (verification.verifiedAt) {
      throw new BadRequestException("Email đã được xác thực");
    }

    if (verification.expiresAt < new Date()) {
      throw new BadRequestException("Token đã hết hạn");
    }

    // Find user and activate
    const user = await this.userRepository.findByEmail(verification.email);
    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    await this.userRepository.activateUser(user.id);
    await this.userRepository.markEmailVerified(token);
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return;
    }

    // If user is already active, no need to resend
    if (user.isActive) {
      throw new BadRequestException("Email đã được xác thực");
    }

    // Check if there's an existing unverified email verification record
    const existingVerification =
      await this.userRepository.findEmailVerificationByEmail(email);

    // Generate new verification token
    const token = randomBytes(32).toString("hex");

    if (existingVerification) {
      // Update existing verification record with new token
      await this.userRepository.updateEmailVerification(
        existingVerification.id,
        {
          token,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
      );
    } else {
      // Create new verification record
      await this.userRepository.createEmailVerification({
        email,
        token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });
    }

    // Send verification email
    try {
      await this.mailService.sendVerificationEmail(email, token);
    } catch (error) {
      this.logger.error(
        `Failed to send verification email to ${email}: ${
          error instanceof Error ? error.message : error
        }`,
      );
      throw new BadRequestException(
        "Không thể gửi email xác thực. Vui lòng liên hệ quản trị viên.",
      );
    }
  }

  async login(
    dto: LoginDto,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{
    user?: {
      id: string;
      email: string;
      role: string;
      tier: string;
      karma: number;
      profile: {
        username: string;
        displayName: string | null;
        avatar: string | null;
        bio: string | null;
      } | null;
    };
    accessToken?: string;
    refreshToken?: string;
    requires2FA?: boolean;
    tempToken?: string;
  }> {
    // Check if account is locked due to too many failed attempts
    if (await this.loginAttemptService.isLocked(dto.email)) {
      throw new UnauthorizedException(
        "Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.",
      );
    }

    // Find user
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      await this.loginAttemptService.recordFailedAttempt(dto.email);
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      await this.loginAttemptService.recordFailedAttempt(dto.email);
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    // Check if user is active - use same generic error to prevent enumeration
    if (!user.isActive) {
      // Silently resend verification email
      try {
        await this.resendVerificationEmail(user.email);
      } catch {
        // Ignore errors - don't reveal anything
      }
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }

    // Clear failed attempts on successful authentication
    await this.loginAttemptService.clearAttempts(dto.email);

    // Check if 2FA is enabled
    const userSettings = await this.usersRepository.getUserSettings(user.id);
    if (userSettings?.twoFactorEnabled && userSettings?.twoFactorSecret) {
      // Generate temporary token for 2FA verification
      // Include rememberMe in temp token for use after 2FA verification
      const tempToken = this.jwtService.sign(
        {
          sub: user.id,
          type: "2fa-pending",
          rememberMe: dto.rememberMe ?? false,
        },
        { expiresIn: "5m" }, // 5 minutes to complete 2FA
      );

      return {
        requires2FA: true,
        tempToken,
      };
    }

    try {
      // Fetch user with profile
      this.logger.debug(`Fetching profile for user ${user.id}`);
      const userWithProfile = await this.userRepository.findByIdWithProfile(
        user.id,
      );

      // Check if profile exists - this is required for login
      if (!userWithProfile?.profile) {
        this.logger.error(
          `User ${user.id} has no profile - this should not happen`,
        );
        throw new BadRequestException(
          "Hồ sơ người dùng không tồn tại. Vui lòng liên hệ hỗ trợ.",
        );
      }

      // Generate tokens
      this.logger.debug(`Generating tokens for user ${user.id}`);
      const accessToken = this.generateAccessToken(
        user,
        userWithProfile.profile.username,
      );
      const refreshToken = this.generateRefreshToken(user);

      // Calculate session expiry based on rememberMe
      const sessionExpiry = this.getSessionExpiry(dto.rememberMe ?? false);

      // Create session
      this.logger.debug(`Creating session for user ${user.id}`);
      await this.sessionService.createSession({
        userId: user.id,
        refreshToken,
        deviceInfo,
        ipAddress,
        expiresAt: sessionExpiry,
        rememberMe: dto.rememberMe ?? false,
      });

      // Update last active
      this.logger.debug(`Updating last active for user ${user.id}`);
      await this.userRepository.update(user.id, { lastActiveAt: new Date() });

      this.logger.debug(`Login successful for user ${user.id}`);
      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tier: user.tier,
          karma: user.karma,
          profile: {
            username: userWithProfile.profile.username,
            displayName: userWithProfile.profile.displayName,
            avatar: userWithProfile.profile.avatar,
            bio: userWithProfile.profile.bio,
          },
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Log unexpected errors with full details
      this.logger.error(
        `Login failed for user ${user.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async refreshTokens(
    refreshToken: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    let payload: { sub: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get("jwt.refreshSecret"),
      });
    } catch {
      throw new UnauthorizedException("Refresh token không hợp lệ");
    }

    // Find session
    const session = await this.sessionService.findByRefreshToken(refreshToken);
    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session đã hết hạn");
    }

    // Check absolute timeout (30 days from session creation)
    const absoluteMaxExpiryMs =
      this.configService.get<number>("session.absoluteMaxExpiryMs") ||
      30 * 24 * 60 * 60 * 1000;
    const absoluteExpiry = new Date(
      session.createdAt.getTime() + absoluteMaxExpiryMs,
    );
    if (new Date() > absoluteExpiry) {
      throw new UnauthorizedException(
        "Session đã hết hạn tuyệt đối. Vui lòng đăng nhập lại.",
      );
    }

    // Find user with profile
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException("Người dùng không tồn tại");
    }

    // Fetch profile for username
    const userWithProfile = await this.userRepository.findByIdWithProfile(
      user.id,
    );

    // Generate new tokens
    const newAccessToken = this.generateAccessToken(
      user,
      userWithProfile?.profile?.username,
    );
    const newRefreshToken = this.generateRefreshToken(user);

    // Calculate new session expiry based on rememberMe, but respect absolute timeout
    const newExpiry = this.getSessionExpiry(session.rememberMe);
    const finalExpiry = newExpiry > absoluteExpiry ? absoluteExpiry : newExpiry;

    // Update session with new refresh token and extended expiry
    await this.sessionService.updateSession(session.id, {
      refreshToken: newRefreshToken,
      lastActiveAt: new Date(),
      expiresAt: finalExpiry,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string): Promise<void> {
    await this.sessionService.deleteByRefreshToken(refreshToken);
  }

  async logoutAll(userId: string): Promise<void> {
    await this.sessionService.deleteAllByUserId(userId);
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    // Invalidate all existing unused password reset tokens for this email
    await this.userRepository.invalidatePasswordResets(email);

    // Generate reset token
    const token = randomBytes(32).toString("hex");
    await this.userRepository.createPasswordReset({
      email,
      token,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    });

    // Send reset email
    try {
      await this.mailService.sendPasswordResetEmail(email, token);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${email}: ${
          error instanceof Error ? error.message : error
        }`,
      );
      throw new BadRequestException(
        "Không thể gửi email đặt lại mật khẩu. Vui lòng liên hệ quản trị viên.",
      );
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Check if password has been found in data breaches
    const isBreached = await this.passwordBreachService.isBreached(newPassword);
    if (isBreached) {
      throw new BadRequestException(
        "Mật khẩu này đã xuất hiện trong các vụ rò rỉ dữ liệu. Vui lòng chọn mật khẩu khác an toàn hơn.",
      );
    }

    const reset = await this.userRepository.findPasswordReset(token);

    if (!reset) {
      throw new BadRequestException("Token không hợp lệ");
    }

    if (reset.usedAt) {
      throw new BadRequestException("Token đã được sử dụng");
    }

    if (reset.expiresAt < new Date()) {
      throw new BadRequestException("Token đã hết hạn");
    }

    // Find user
    const user = await this.userRepository.findByEmail(reset.email);
    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.updatePassword(user.id, hashedPassword);
    await this.userRepository.markPasswordResetUsed(token);

    // Invalidate all sessions
    await this.sessionService.deleteAllByUserId(user.id);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{
    message: string;
    accessToken: string;
    refreshToken: string;
  }> {
    // Get user with password
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException("Mật khẩu hiện tại không đúng");
    }

    // Check if new password has been found in data breaches
    const isBreached = await this.passwordBreachService.isBreached(
      dto.newPassword,
    );
    if (isBreached) {
      throw new BadRequestException(
        "Mật khẩu này đã xuất hiện trong các vụ rò rỉ dữ liệu. Vui lòng chọn mật khẩu khác an toàn hơn.",
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);

    // Update user password
    await this.userRepository.updatePassword(userId, hashedPassword);

    // Update lastPasswordChange in UserSettings
    await this.usersRepository.updateLastPasswordChange(userId);

    // Invalidate all sessions
    await this.sessionService.deleteAllByUserId(userId);

    // Fetch profile for username
    const userWithProfile =
      await this.userRepository.findByIdWithProfile(userId);

    // Generate new tokens for current session
    const accessToken = this.generateAccessToken(
      user,
      userWithProfile?.profile?.username,
    );
    const refreshToken = this.generateRefreshToken(user);

    // Create new session with default expiry (no rememberMe after password change)
    await this.sessionService.createSession({
      userId,
      refreshToken,
      deviceInfo,
      ipAddress,
      expiresAt: this.getSessionExpiry(false),
      rememberMe: false,
    });

    return {
      message: "Đổi mật khẩu thành công",
      accessToken,
      refreshToken,
    };
  }

  // ==================== Two-Factor Authentication ====================

  async enable2FA(
    userId: string,
    email: string,
  ): Promise<{
    secret: string;
    qrCode: string;
    backupCodes: string[];
  }> {
    // Check if 2FA is already enabled
    const userSettings = await this.usersRepository.getUserSettings(userId);
    if (userSettings?.twoFactorEnabled) {
      throw new BadRequestException("Xác thực 2 bước đã được bật");
    }

    // Generate secret and QR code
    const { secret, otpauthUrl } = this.twoFactorService.generateSecret(email);
    const qrCode = await this.twoFactorService.generateQRCode(otpauthUrl);

    // Generate backup codes
    const backupCodes = this.twoFactorService.generateBackupCodes();
    const hashedBackupCodes =
      await this.twoFactorService.hashBackupCodes(backupCodes);

    // Store secret temporarily (not enabled yet, will be enabled after verification)
    await this.usersRepository.update2FASettings(userId, {
      twoFactorSecret: secret,
      backupCodes: JSON.stringify(hashedBackupCodes),
      twoFactorEnabled: false, // Will be enabled after verification
    });

    return {
      secret,
      qrCode,
      backupCodes,
    };
  }

  async verify2FA(userId: string, code: string): Promise<{ message: string }> {
    const userSettings = await this.usersRepository.getUserSettings(userId);

    if (!userSettings?.twoFactorSecret) {
      throw new BadRequestException("Vui lòng bắt đầu quá trình bật 2FA trước");
    }

    if (userSettings.twoFactorEnabled) {
      throw new BadRequestException("Xác thực 2 bước đã được bật");
    }

    // Verify the TOTP code
    const isValid = await this.twoFactorService.verifyToken(
      userSettings.twoFactorSecret,
      code,
    );
    if (!isValid) {
      throw new BadRequestException("Mã xác thực không hợp lệ");
    }

    // Enable 2FA
    await this.usersRepository.update2FASettings(userId, {
      twoFactorEnabled: true,
    });

    return { message: "Đã bật xác thực 2 bước thành công" };
  }

  async disable2FA(
    userId: string,
    password: string,
  ): Promise<{ message: string }> {
    // Verify password
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Mật khẩu không đúng");
    }

    // Check if 2FA is enabled
    const userSettings = await this.usersRepository.getUserSettings(userId);
    if (!userSettings?.twoFactorEnabled) {
      throw new BadRequestException("Xác thực 2 bước chưa được bật");
    }

    // Disable 2FA and clear secret/backup codes
    await this.usersRepository.update2FASettings(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      backupCodes: null,
    });

    return { message: "Đã tắt xác thực 2 bước" };
  }

  async verifyLogin2FA(
    tempToken: string,
    code: string,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<{
    user: {
      id: string;
      email: string;
      role: string;
      tier: string;
      karma: number;
      profile: {
        username: string;
        displayName: string | null;
        avatar: string | null;
        bio: string | null;
      } | null;
    };
    accessToken: string;
    refreshToken: string;
  }> {
    // Verify temp token
    let payload: { sub: string; type: string; rememberMe?: boolean };
    try {
      payload = this.jwtService.verify(tempToken);
    } catch {
      throw new UnauthorizedException("Token không hợp lệ hoặc đã hết hạn");
    }

    if (payload.type !== "2fa-pending") {
      throw new UnauthorizedException("Token không hợp lệ");
    }

    const userId = payload.sub;
    const rememberMe = payload.rememberMe ?? false;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException("Không tìm thấy người dùng");
    }

    const userSettings = await this.usersRepository.getUserSettings(userId);
    if (!userSettings?.twoFactorEnabled || !userSettings?.twoFactorSecret) {
      throw new BadRequestException("Xác thực 2 bước chưa được bật");
    }

    // Check if it's a backup code or TOTP code
    let isValid = false;

    if (this.twoFactorService.isBackupCode(code)) {
      // Verify backup code
      const hashedCodes = userSettings.backupCodes
        ? (JSON.parse(userSettings.backupCodes) as string[])
        : [];

      const result = await this.twoFactorService.verifyBackupCode(
        code,
        hashedCodes,
      );
      isValid = result.valid;

      if (isValid) {
        // Update remaining backup codes
        await this.usersRepository.update2FASettings(userId, {
          backupCodes: JSON.stringify(result.remainingCodes),
        });
      }
    } else {
      // Verify TOTP code
      isValid = await this.twoFactorService.verifyToken(
        userSettings.twoFactorSecret,
        code,
      );
    }

    if (!isValid) {
      throw new BadRequestException("Mã xác thực không hợp lệ");
    }

    try {
      // Fetch user with profile
      this.logger.debug(`Fetching profile for 2FA user ${user.id}`);
      const userWithProfile = await this.userRepository.findByIdWithProfile(
        user.id,
      );

      // Check if profile exists - this is required for login
      if (!userWithProfile?.profile) {
        this.logger.error(
          `User ${user.id} has no profile - this should not happen`,
        );
        throw new BadRequestException(
          "Hồ sơ người dùng không tồn tại. Vui lòng liên hệ hỗ trợ.",
        );
      }

      // Generate tokens
      this.logger.debug(`Generating tokens for 2FA user ${user.id}`);
      const accessToken = this.generateAccessToken(
        user,
        userWithProfile.profile.username,
      );
      const refreshToken = this.generateRefreshToken(user);

      // Calculate session expiry based on rememberMe from temp token
      const sessionExpiry = this.getSessionExpiry(rememberMe);

      // Create session
      this.logger.debug(`Creating session for 2FA user ${user.id}`);
      await this.sessionService.createSession({
        userId: user.id,
        refreshToken,
        deviceInfo,
        ipAddress,
        expiresAt: sessionExpiry,
        rememberMe,
      });

      // Update last active
      this.logger.debug(`Updating last active for 2FA user ${user.id}`);
      await this.userRepository.update(user.id, { lastActiveAt: new Date() });

      this.logger.debug(`2FA login successful for user ${user.id}`);
      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          tier: user.tier,
          karma: user.karma,
          profile: {
            username: userWithProfile.profile.username,
            displayName: userWithProfile.profile.displayName,
            avatar: userWithProfile.profile.avatar,
            bio: userWithProfile.profile.bio,
          },
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      // Re-throw known exceptions
      if (error instanceof BadRequestException) {
        throw error;
      }
      // Log unexpected errors with full details
      this.logger.error(
        `2FA login failed for user ${user.id}: ${error instanceof Error ? error.message : "Unknown error"}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  /**
   * Calculate session expiry based on rememberMe flag
   */
  private getSessionExpiry(rememberMe: boolean): Date {
    const defaultExpiryMs =
      this.configService.get<number>("session.defaultExpiryMs") ||
      24 * 60 * 60 * 1000;
    const rememberMeExpiryMs =
      this.configService.get<number>("session.rememberMeExpiryMs") ||
      30 * 24 * 60 * 60 * 1000;

    const expiryMs = rememberMe ? rememberMeExpiryMs : defaultExpiryMs;
    return new Date(Date.now() + expiryMs);
  }

  private generateAccessToken(user: User, username?: string): string {
    return this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
      tier: user.tier,
      username, // Include username for WebSocket typing indicator
    });
  }

  private generateRefreshToken(user: User): string {
    return this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.configService.get("jwt.refreshSecret"),
        expiresIn: this.configService.get("jwt.refreshExpiresIn"),
      },
    );
  }
}
