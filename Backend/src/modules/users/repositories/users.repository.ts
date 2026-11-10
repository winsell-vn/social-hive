import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class UsersRepository {
  constructor(private prisma: PrismaService) {}

  async findSettingsByUserId(userId: string) {
    return this.prisma.userSettings.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                bio: true,
              },
            },
          },
        },
      },
    });
  }

  async createSettings(userId: string) {
    return this.prisma.userSettings.create({
      data: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                bio: true,
              },
            },
          },
        },
      },
    });
  }

  async updateSettings(userId: string, data: Prisma.UserSettingsUpdateInput) {
    return this.prisma.userSettings.update({
      where: { userId },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                bio: true,
              },
            },
          },
        },
      },
    });
  }

  async upsertSettings(userId: string, data: Prisma.UserSettingsUpdateInput) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        user: { connect: { id: userId } },
        ...(data as Omit<Prisma.UserSettingsCreateInput, "user">),
      },
      update: data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                username: true,
                displayName: true,
                bio: true,
              },
            },
          },
        },
      },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
      },
    });
  }

  async updateProfile(userId: string, data: Prisma.ProfileUpdateInput) {
    return this.prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async updateUser(userId: string, data: Prisma.UserUpdateInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
    });
  }

  async deleteUser(userId: string) {
    return this.prisma.user.delete({
      where: { id: userId },
    });
  }

  async updateLastPasswordChange(userId: string) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        user: { connect: { id: userId } },
        lastPasswordChange: new Date(),
      },
      update: {
        lastPasswordChange: new Date(),
      },
    });
  }

  async findUserWithPassword(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });
  }

  async getUserSettings(userId: string) {
    return this.prisma.userSettings.findUnique({
      where: { userId },
      select: {
        twoFactorEnabled: true,
        twoFactorSecret: true,
        backupCodes: true,
        lastPasswordChange: true,
      },
    });
  }

  async update2FASettings(
    userId: string,
    data: {
      twoFactorEnabled?: boolean;
      twoFactorSecret?: string | null;
      backupCodes?: string | null;
    },
  ) {
    return this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        user: { connect: { id: userId } },
        ...data,
      },
      update: data,
    });
  }

  /**
   * Soft delete user - set deletion scheduled for 14 days from now
   */
  async softDeleteUser(
    userId: string,
  ): Promise<{ deletionScheduledFor: Date }> {
    const now = new Date();
    const deletionScheduledFor = new Date(
      now.getTime() + 14 * 24 * 60 * 60 * 1000,
    ); // 14 days

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: now,
        deletionScheduledFor: deletionScheduledFor,
      },
    });

    return { deletionScheduledFor };
  }

  /**
   * Cancel pending deletion - clear deletion fields
   */
  async cancelDeletion(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        deletionRequestedAt: null,
        deletionScheduledFor: null,
      },
    });
  }

  /**
   * Get user deletion status
   */
  async getUserDeletionStatus(userId: string): Promise<{
    isScheduledForDeletion: boolean;
    deletionRequestedAt: Date | null;
    deletionScheduledFor: Date | null;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        deletionRequestedAt: true,
        deletionScheduledFor: true,
      },
    });

    if (!user) {
      return {
        isScheduledForDeletion: false,
        deletionRequestedAt: null,
        deletionScheduledFor: null,
      };
    }

    return {
      isScheduledForDeletion:
        user.deletionScheduledFor !== null &&
        user.deletionScheduledFor > new Date(),
      deletionRequestedAt: user.deletionRequestedAt,
      deletionScheduledFor: user.deletionScheduledFor,
    };
  }
}
