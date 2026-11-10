import { Injectable } from "@nestjs/common";
import { createHash } from "crypto";
import { PrismaService } from "../../../prisma/prisma.service";
import { Session, Prisma } from "@prisma/client";

/**
 * BREAKING CHANGE (2026-02-27): Refresh tokens are now hashed (SHA-256) before storage.
 * Existing sessions with unhashed tokens will NOT match and users will be logged out.
 * This is intentional for security hardening. No migration needed - users simply re-login.
 *
 * If rollback is needed, remove hashToken() calls and deploy, then users can login again.
 */
@Injectable()
export class SessionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Hash a token using SHA-256 for secure storage
   * Refresh tokens are hashed before storing in the database
   */
  private hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
  }

  async createSession(data: {
    userId: string;
    refreshToken: string;
    deviceInfo?: string;
    ipAddress?: string;
    expiresAt: Date;
    rememberMe?: boolean;
  }): Promise<Session> {
    return this.prisma.session.create({
      data: {
        userId: data.userId,
        refreshToken: this.hashToken(data.refreshToken), // Hash before storing
        deviceInfo: data.deviceInfo,
        ipAddress: data.ipAddress,
        expiresAt: data.expiresAt,
        rememberMe: data.rememberMe ?? false,
      },
    });
  }

  async findByRefreshToken(refreshToken: string): Promise<Session | null> {
    return this.prisma.session.findUnique({
      where: { refreshToken: this.hashToken(refreshToken) },
    });
  }

  async findByUserId(userId: string): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: { userId },
      orderBy: { lastActiveAt: "desc" },
    });
  }

  async updateSession(
    id: string,
    data: Prisma.SessionUpdateInput,
  ): Promise<Session> {
    // Hash refresh token if it's being updated
    const updateData = { ...data };
    if (typeof updateData.refreshToken === "string") {
      updateData.refreshToken = this.hashToken(updateData.refreshToken);
    }
    return this.prisma.session.update({ where: { id }, data: updateData });
  }

  async deleteByRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.session.deleteMany({
      where: { refreshToken: this.hashToken(refreshToken) },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.session.delete({ where: { id } });
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }

  async deleteAllExceptCurrent(
    userId: string,
    currentSessionId: string,
  ): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSessionId },
      },
    });
    return result.count;
  }

  async findById(id: string): Promise<Session | null> {
    return this.prisma.session.findUnique({ where: { id } });
  }

  async cleanExpiredSessions(): Promise<number> {
    const result = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
