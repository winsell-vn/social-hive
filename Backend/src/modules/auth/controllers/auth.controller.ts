import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Delete,
  Param,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response } from "express";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { randomBytes } from "crypto";
import { AuthService } from "../services/auth.service";
import { SessionService } from "../services/session.service";
import { TwoFactorService } from "../services/two-factor.service";
import { TurnstileService } from "../services/turnstile.service";
import { RegisterDto } from "../dto/register.dto";
import { LoginDto } from "../dto/login.dto";
import { VerifyEmailDto } from "../dto/verify-email.dto";
import { ForgotPasswordDto } from "../dto/forgot-password.dto";
import { ResetPasswordDto } from "../dto/reset-password.dto";
import { RefreshTokenDto } from "../dto/refresh-token.dto";
import { ChangePasswordDto } from "../dto/change-password.dto";
import {
  Verify2FADto,
  Disable2FADto,
  Login2FADto,
} from "../dto/two-factor.dto";
import { JwtAuthGuard } from "../guards/jwt-auth.guard";
import {
  CurrentUser,
  CurrentUserData,
} from "../../../common/decorators/current-user.decorator";
import { Public } from "../../../common/decorators/public.decorator";

/**
 * Parse JWT expiry string (e.g., '15m', '7d', '1h', '30s') to milliseconds.
 * Fallback to defaultMs if parsing fails.
 */
function parseExpiryToMs(expiry: string, defaultMs: number): number {
  if (!expiry || typeof expiry !== "string") {
    return defaultMs;
  }

  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    return defaultMs;
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case "s":
      return value * 1000;
    case "m":
      return value * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "d":
      return value * 24 * 60 * 60 * 1000;
    default:
      return defaultMs;
  }
}

@Controller("auth")
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly cookieDomain: string | undefined;

  constructor(
    private authService: AuthService,
    private sessionService: SessionService,
    private twoFactorService: TwoFactorService,
    private turnstileService: TurnstileService,
    private configService: ConfigService,
  ) {
    this.cookieDomain = this.configService.get<string>("app.cookieDomain");
  }

  /**
   * Set HttpOnly cookies for access and refresh tokens
   */
  private setAuthCookies(
    res: Response,
    accessToken: string,
    refreshToken: string,
  ): void {
    const isProduction = this.configService.get("app.nodeEnv") === "production";
    const sameSite = this.configService.get<"strict" | "lax" | "none">(
      "app.cookieSameSite",
    ) || "lax";

    // When sameSite is "none", secure must be true (browser requirement)
    const secure = sameSite === "none" ? true : isProduction;

    // Parse JWT expiry config to milliseconds
    const accessTokenMaxAge = parseExpiryToMs(
      this.configService.get("jwt.expiresIn") || "15m",
      15 * 60 * 1000, // Default: 15 minutes
    );
    const refreshTokenMaxAge = parseExpiryToMs(
      this.configService.get("jwt.refreshExpiresIn") || "7d",
      7 * 24 * 60 * 60 * 1000, // Default: 7 days
    );

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: accessTokenMaxAge,
      path: "/",
      ...(this.cookieDomain && { domain: this.cookieDomain }),
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure,
      sameSite,
      maxAge: refreshTokenMaxAge,
      path: "/api/auth", // Only sent to auth endpoints
      ...(this.cookieDomain && { domain: this.cookieDomain }),
    });
  }

  /**
   * Clear auth cookies on logout
   */
  private clearAuthCookies(res: Response): void {
    const isProduction = this.configService.get("app.nodeEnv") === "production";
    const sameSite = this.configService.get<"strict" | "lax" | "none">(
      "app.cookieSameSite",
    ) || "lax";
    const secure = sameSite === "none" ? true : isProduction;

    res.clearCookie("accessToken", {
      httpOnly: true,
      secure,
      sameSite,
      path: "/",
      ...(this.cookieDomain && { domain: this.cookieDomain }),
    });
    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure,
      sameSite,
      path: "/api/auth",
      ...(this.cookieDomain && { domain: this.cookieDomain }),
    });
  }

  @Post("register")
  @Public()
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 per hour per IP
  async register(@Body() dto: RegisterDto, @Req() req: Request) {
    const isValid = await this.turnstileService.verifyToken(
      dto.turnstileToken,
      req.ip,
    );
    if (!isValid) {
      throw new BadRequestException("Xác minh CAPTCHA thất bại");
    }

    const result = await this.authService.register(dto);
    return {
      message: result.requiresEmailVerification
        ? result.verificationEmailSent
          ? "Đăng ký thành công. Vui lòng kiểm tra email để xác thực tài khoản."
          : "Đăng ký thành công. Hiện chưa thể gửi email xác thực, vui lòng yêu cầu gửi lại email."
        : "Đăng ký thành công. Tài khoản đã được kích hoạt, bạn có thể đăng nhập ngay.",
      ...result,
    };
  }

  @Post("verify-email")
  @Public()
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    await this.authService.verifyEmail(dto.token);
    return { message: "Email đã được xác thực thành công." };
  }

  @Post("resend-verification-email")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 per hour
  async resendVerificationEmail(@Body() dto: { email: string }) {
    await this.authService.resendVerificationEmail(dto.email);
    return {
      message: "Email xác thực đã được gửi. Vui lòng kiểm tra hộp thư của bạn.",
    };
  }

  @Post("login")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 per minute per IP
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const isValid = await this.turnstileService.verifyToken(
      dto.turnstileToken,
      req.ip,
    );
    if (!isValid) {
      throw new BadRequestException("Xác minh CAPTCHA thất bại");
    }

    const deviceInfo = req.headers["user-agent"];
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await this.authService.login(dto, deviceInfo, ipAddress);

    // Set HttpOnly cookies if tokens are returned (not 2FA pending)
    if (result.accessToken && result.refreshToken) {
      this.setAuthCookies(res, result.accessToken, result.refreshToken);
      // Strip tokens from response body - they're in HttpOnly cookies
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { accessToken, refreshToken, ...safeResult } = result;
      return safeResult;
    }

    // 2FA pending case - tempToken must still be returned in body
    return result;
  }

  @Post("refresh")
  @Public()
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Try to get refresh token from cookie first, then fall back to body
    const refreshToken = req.cookies?.refreshToken || dto.refreshToken;

    if (!refreshToken) {
      throw new BadRequestException("Refresh token không được cung cấp");
    }

    const result = await this.authService.refreshTokens(refreshToken);

    // Set new HttpOnly cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    // Don't return tokens in body - they're in HttpOnly cookies
    return { message: "Token refreshed successfully" };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Try to get refresh token from cookie first, then fall back to body
    const refreshToken = req.cookies?.refreshToken || dto.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    // Clear auth cookies
    this.clearAuthCookies(res);

    return { message: "Đăng xuất thành công." };
  }

  @Post("logout-all")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logoutAll(
    @CurrentUser() user: CurrentUserData,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.authService.logoutAll(user.id);

    // Clear auth cookies
    this.clearAuthCookies(res);

    return { message: "Đã đăng xuất khỏi tất cả thiết bị." };
  }

  @Post("forgot-password")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 3600000 } }) // 3 per hour per IP
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() req: Request) {
    const isValid = await this.turnstileService.verifyToken(
      dto.turnstileToken,
      req.ip,
    );
    if (!isValid) {
      throw new BadRequestException("Xác minh CAPTCHA thất bại");
    }

    await this.authService.forgotPassword(dto.email);
    return {
      message: "Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu.",
    };
  }

  @Post("reset-password")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600000 } }) // 5 per hour per IP
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: "Mật khẩu đã được đặt lại thành công." };
  }

  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 per 15 minutes
  async changePassword(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ChangePasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceInfo = req.headers["user-agent"];
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await this.authService.changePassword(
      user.id,
      dto,
      deviceInfo,
      ipAddress,
    );

    // Set new HttpOnly cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    // Strip tokens from response body - they're in HttpOnly cookies
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken, refreshToken, ...safeResult } = result;
    return safeResult;
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: CurrentUserData) {
    return user;
  }

  @Get("sessions")
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser() user: CurrentUserData, @Req() req: Request) {
    // Get refresh token from cookie first, then fall back to header (backward compat)
    const refreshToken =
      req.cookies?.refreshToken ||
      (req.headers["x-refresh-token"] as string | undefined);

    const sessions = await this.sessionService.findByUserId(user.id);

    // Find current session by matching refresh token
    let currentSessionId: string | null = null;
    if (refreshToken) {
      const currentSession =
        await this.sessionService.findByRefreshToken(refreshToken);
      if (currentSession && currentSession.userId === user.id) {
        currentSessionId = currentSession.id;
      }
    }

    return {
      data: sessions.map((s) => ({
        id: s.id,
        deviceInfo: s.deviceInfo,
        ipAddress: s.ipAddress,
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
        isCurrent: s.id === currentSessionId,
      })),
      currentSessionId,
    };
  }

  @Delete("sessions/:id")
  @UseGuards(JwtAuthGuard)
  async revokeSession(
    @Param("id") id: string,
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
  ) {
    // Get refresh token from cookie first, then fall back to header (backward compat)
    const refreshToken =
      req.cookies?.refreshToken ||
      (req.headers["x-refresh-token"] as string | undefined);

    // Find current session
    let currentSessionId: string | null = null;
    if (refreshToken) {
      const currentSession =
        await this.sessionService.findByRefreshToken(refreshToken);
      if (currentSession && currentSession.userId === user.id) {
        currentSessionId = currentSession.id;
      }
    }

    // Cannot revoke current session
    if (currentSessionId && id === currentSessionId) {
      throw new BadRequestException(
        "Không thể xóa phiên hiện tại. Vui lòng sử dụng chức năng đăng xuất.",
      );
    }

    // Verify session belongs to user
    const session = await this.sessionService.findById(id);

    if (!session) {
      throw new NotFoundException("Phiên không tồn tại");
    }

    if (session.userId !== user.id) {
      throw new NotFoundException("Phiên không tồn tại");
    }

    await this.sessionService.deleteById(id);
    return { message: "Đã đăng xuất thiết bị" };
  }

  @Delete("sessions")
  @UseGuards(JwtAuthGuard)
  async revokeAllOtherSessions(
    @CurrentUser() user: CurrentUserData,
    @Req() req: Request,
  ) {
    // Get refresh token from cookie first, then fall back to header (backward compat)
    const refreshToken =
      req.cookies?.refreshToken ||
      (req.headers["x-refresh-token"] as string | undefined);

    // Find current session
    let currentSessionId: string | null = null;
    if (refreshToken) {
      const currentSession =
        await this.sessionService.findByRefreshToken(refreshToken);
      if (currentSession && currentSession.userId === user.id) {
        currentSessionId = currentSession.id;
      }
    }

    if (!currentSessionId) {
      // If no current session ID found, delete all sessions
      await this.sessionService.deleteAllByUserId(user.id);
      return { message: "Đã đăng xuất tất cả thiết bị", revokedCount: 0 };
    }

    const revokedCount = await this.sessionService.deleteAllExceptCurrent(
      user.id,
      currentSessionId,
    );

    return {
      message: "Đã đăng xuất tất cả thiết bị khác",
      revokedCount,
    };
  }

  // ==================== Two-Factor Authentication ====================

  @Post("2fa/enable")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 per 15 minutes
  async enable2FA(@CurrentUser() user: CurrentUserData) {
    return this.authService.enable2FA(user.id, user.email);
  }

  @Post("2fa/verify")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 per 15 minutes
  async verify2FA(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: Verify2FADto,
  ) {
    return this.authService.verify2FA(user.id, dto.code);
  }

  @Post("2fa/disable")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 per 15 minutes
  async disable2FA(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: Disable2FADto,
  ) {
    return this.authService.disable2FA(user.id, dto.password);
  }

  @Post("2fa/verify-login")
  @Public()
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 per 15 minutes
  async verifyLogin2FA(
    @Body() dto: Login2FADto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const deviceInfo = req.headers["user-agent"];
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await this.authService.verifyLogin2FA(
      dto.tempToken,
      dto.code,
      deviceInfo,
      ipAddress,
    );

    // Set HttpOnly cookies
    this.setAuthCookies(res, result.accessToken, result.refreshToken);

    // Strip tokens from response body - they're in HttpOnly cookies
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { accessToken, refreshToken, ...safeResult } = result;
    return safeResult;
  }

  // ==================== CSRF Token ====================

  @Get("csrf-token")
  @Public()
  @HttpCode(HttpStatus.OK)
  async getCsrfToken(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token = randomBytes(32).toString("hex");
    const isProduction = this.configService.get("app.nodeEnv") === "production";
    const sameSite =
      this.configService.get<"strict" | "lax" | "none">("app.cookieSameSite") ||
      "lax";
    const secure = sameSite === "none" ? true : isProduction;

    res.cookie("csrf-token", token, {
      httpOnly: false,
      secure,
      sameSite,
      path: "/",
      maxAge: 24 * 60 * 60 * 1000,
      ...(this.cookieDomain && { domain: this.cookieDomain }),
    });

    return { csrfToken: token };
  }
}
