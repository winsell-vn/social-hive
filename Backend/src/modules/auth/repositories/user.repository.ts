import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, User } from "@prisma/client";

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByIdWithProfile(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async activateUser(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }

  // Email Verification
  async createEmailVerification(data: {
    email: string;
    token: string;
    expiresAt: Date;
  }) {
    return this.prisma.emailVerification.create({ data });
  }

  async findEmailVerification(token: string) {
    return this.prisma.emailVerification.findUnique({ where: { token } });
  }

  async findEmailVerificationByEmail(email: string) {
    return this.prisma.emailVerification.findFirst({
      where: { email, verifiedAt: null },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateEmailVerification(
    id: string,
    data: { token?: string; expiresAt?: Date },
  ) {
    return this.prisma.emailVerification.update({
      where: { id },
      data,
    });
  }

  async markEmailVerified(token: string) {
    return this.prisma.emailVerification.update({
      where: { token },
      data: { verifiedAt: new Date() },
    });
  }

  // Password Reset
  async createPasswordReset(data: {
    email: string;
    token: string;
    expiresAt: Date;
  }) {
    return this.prisma.passwordReset.create({ data });
  }

  async findPasswordReset(token: string) {
    return this.prisma.passwordReset.findUnique({ where: { token } });
  }

  async markPasswordResetUsed(token: string) {
    return this.prisma.passwordReset.update({
      where: { token },
      data: { usedAt: new Date() },
    });
  }

  async invalidatePasswordResets(email: string) {
    return this.prisma.passwordReset.updateMany({
      where: {
        email,
        usedAt: null,
      },
      data: {
        usedAt: new Date(), // Mark as used
      },
    });
  }

  // Profile
  async createProfile(data: {
    userId: string;
    username: string;
    displayName?: string | null;
  }) {
    return this.prisma.profile.create({
      data: {
        userId: data.userId,
        username: data.username,
        displayName: data.displayName || null,
      },
    });
  }
}
