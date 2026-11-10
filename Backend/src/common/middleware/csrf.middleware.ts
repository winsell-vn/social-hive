import {
  Injectable,
  NestMiddleware,
  ForbiddenException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request, Response, NextFunction } from "express";
import { randomBytes, timingSafeEqual } from "crypto";

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly isProduction: boolean;
  private readonly cookieDomain: string | undefined;

  constructor(private configService: ConfigService) {
    this.isProduction = this.configService.get("app.nodeEnv") === "production";
    this.cookieDomain = this.configService.get("app.cookieDomain");
  }

  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
    const safeMethods = ["GET", "HEAD", "OPTIONS"];
    if (safeMethods.includes(req.method)) {
      // Set/refresh CSRF token cookie on safe requests
      this.setCsrfCookie(req, res);
      return next();
    }

    // Skip CSRF for public auth endpoints that have their own protection mechanisms:
    // - CAPTCHA-protected: login, register, forgot-password
    // - Token-protected: reset-password, verify-email, 2fa/verify-login (tempToken + TOTP)
    // - Cookie-protected: refresh (HttpOnly refresh token)
    // Note: Match both with and without /api prefix because reverse proxy (Nginx)
    // may strip the /api/ prefix from req.path. Using exact match (===) instead of
    // endsWith() to prevent bypass via routes like /admin/settings/auth/refresh
    const csrfExemptPaths = [
      "/api/auth/login",
      "/auth/login",
      "/api/auth/register",
      "/auth/register",
      "/api/auth/forgot-password",
      "/auth/forgot-password",
      "/api/auth/reset-password",
      "/auth/reset-password",
      "/api/auth/verify-email",
      "/auth/verify-email",
      "/api/auth/resend-verification-email",
      "/auth/resend-verification-email",
      "/api/auth/2fa/verify-login",
      "/auth/2fa/verify-login",
      "/api/auth/refresh",
      "/auth/refresh",
    ];

    // Use originalUrl for path matching (more reliable behind reverse proxy)
    // originalUrl preserves the full path even when middleware modifies req.path
    const requestPath = (req.originalUrl || req.url || req.path).split("?")[0];

    if (csrfExemptPaths.some((path) => requestPath === path)) {
      return next();
    }

    // For state-changing requests, validate CSRF token
    const cookieToken = req.cookies?.["csrf-token"];
    const headerToken = req.headers["x-csrf-token"] as string;

    if (!cookieToken || !headerToken) {
      throw new ForbiddenException("Invalid CSRF token");
    }

    // Use timing-safe comparison to prevent timing attacks
    const cookieBuffer = Buffer.from(cookieToken);
    const headerBuffer = Buffer.from(headerToken);
    if (
      cookieBuffer.length !== headerBuffer.length ||
      !timingSafeEqual(cookieBuffer, headerBuffer)
    ) {
      throw new ForbiddenException("Invalid CSRF token");
    }

    next();
  }

  private setCsrfCookie(req: Request, res: Response) {
    // Only set if not already present
    if (!req.cookies?.["csrf-token"]) {
      const token = randomBytes(32).toString("hex");
      const sameSite =
        this.configService.get<"strict" | "lax" | "none">("app.cookieSameSite") ||
        "lax";
      const secure = sameSite === "none" ? true : this.isProduction;

      res.cookie("csrf-token", token, {
        httpOnly: false, // Must be readable by JavaScript
        secure,
        sameSite,
        path: "/",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        ...(this.cookieDomain && { domain: this.cookieDomain }),
      });
    }
  }
}

