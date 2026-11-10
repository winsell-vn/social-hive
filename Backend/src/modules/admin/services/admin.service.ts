import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { ModerationService } from "../../moderation/services/moderation.service";
import { RedisService } from "../../../redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "../../../redis/cache-keys";
import { GetUsersDto } from "../dto/get-users.dto";
import { UpdateUserDto } from "../dto/update-user.dto";
import { AdminAnalyticsDto } from "../dto/admin-analytics.dto";
import { PaginatedResult } from "../../../common/dto/pagination.dto";
import { PostStatus, Role } from "@prisma/client";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private prisma: PrismaService,
    private moderationService: ModerationService,
    private readonly redisService: RedisService,
  ) {}

  async getAnalytics(): Promise<AdminAnalyticsDto> {
    this.logger.log("Fetching platform analytics");

    const cacheKey = CACHE_KEYS.ADMIN_ANALYTICS();

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const now = new Date();
        const startOfToday = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        );
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        const [
          totalUsers,
          totalPosts,
          totalComments,
          pendingPosts,
          activeUsers24h,
          newUsersToday,
          newPostsToday,
        ] = await Promise.all([
          this.prisma.user.count(),
          this.prisma.post.count({ where: { status: PostStatus.PUBLISHED } }),
          this.prisma.comment.count(),
          this.prisma.post.count({ where: { status: PostStatus.PENDING } }),
          this.prisma.session.count({
            where: { lastActiveAt: { gte: last24Hours } },
          }),
          this.prisma.user.count({
            where: { createdAt: { gte: startOfToday } },
          }),
          this.prisma.post.count({
            where: {
              createdAt: { gte: startOfToday },
              status: PostStatus.PUBLISHED,
            },
          }),
        ]);

        return {
          totalUsers,
          totalPosts,
          totalComments,
          pendingPosts,
          activeUsers24h,
          newUsersToday,
          newPostsToday,
        };
      },
      CACHE_TTL.ADMIN_ANALYTICS,
    );
  }

  async getUsers(dto: GetUsersDto) {
    this.logger.log(`Fetching users with filters: ${JSON.stringify(dto)}`);

    const { page = 1, limit = 20, search, role, isBanned } = dto;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: "insensitive" } },
        { profile: { username: { contains: search, mode: "insensitive" } } },
        { profile: { displayName: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (role) {
      where.role = role;
    }

    // Map isBanned to isActive (isBanned=true means isActive=false)
    if (isBanned !== undefined) {
      where.isActive = !isBanned;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          profile: {
            select: {
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          _count: {
            select: {
              posts: true,
              comments: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    const items = users.map((user) => ({
      id: user.id,
      email: user.email,
      profile: user.profile,
      role: user.role,
      tier: user.tier,
      karma: user.karma,
      isVerified: user.isActive, // Map isActive to isVerified for frontend compatibility
      isBanned: !user.isActive, // Map !isActive to isBanned for frontend compatibility
      createdAt: user.createdAt.toISOString(),
      postsCount: user._count.posts,
      commentsCount: user._count.comments,
    }));

    return new PaginatedResult(items, page, limit, total);
  }

  async updateUser(userId: string, dto: UpdateUserDto, adminId: string) {
    this.logger.log(
      `Admin ${adminId} updating user ${userId}: ${JSON.stringify(dto)}`,
    );

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException("Người dùng không tồn tại");
    }

    // Prevent changing SUPER_ADMIN role unless you are SUPER_ADMIN
    if (
      user.role === Role.SUPER_ADMIN &&
      dto.role &&
      dto.role !== Role.SUPER_ADMIN
    ) {
      const admin = await this.prisma.user.findUnique({
        where: { id: adminId },
      });
      if (admin?.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException(
          "Chỉ SUPER_ADMIN mới có thể thay đổi vai trò của SUPER_ADMIN khác",
        );
      }
    }

    // Map isBanned to isActive for database update
    const updateData: any = {};
    if (dto.role !== undefined) {
      updateData.role = dto.role;
    }
    if (dto.isBanned !== undefined) {
      updateData.isActive = !dto.isBanned;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        profile: {
          select: {
            username: true,
            displayName: true,
            avatar: true,
          },
        },
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
      tier: updatedUser.tier,
      karma: updatedUser.karma,
      isVerified: updatedUser.isActive,
      isBanned: !updatedUser.isActive,
      createdAt: updatedUser.createdAt.toISOString(),
      profile: updatedUser.profile,
    };
  }
}
