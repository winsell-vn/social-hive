import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { Prisma, Profile } from "@prisma/client";
import { RedisService } from "../../../redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "../../../redis/cache-keys";

@Injectable()
export class ProfilesRepository {
  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  async findByUserId(userId: string) {
    return this.prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        },
      },
    });
  }

  async findByUsername(username: string) {
    return this.prisma.profile.findUnique({
      where: { username },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            _count: {
              select: {
                posts: { where: { status: "PUBLISHED" } },
                followers: true,
                following: true,
              },
            },
          },
        },
      },
    });
  }

  /**
   * Find profile by username with user settings for visibility check
   */
  async findByUsernameWithSettings(username: string) {
    return this.prisma.profile.findUnique({
      where: { username },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            settings: {
              select: {
                profileVisibility: true,
              },
            },
            _count: {
              select: {
                posts: { where: { status: "PUBLISHED" } },
                followers: true,
                following: true,
              },
            },
          },
        },
      },
    });
  }

  async update(
    userId: string,
    data: Prisma.ProfileUpdateInput,
  ): Promise<Profile> {
    return this.prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async getFollowers(userId: string, skip: number, take: number) {
    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take,
        include: {
          follower: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return { followers, total };
  }

  async getFollowing(userId: string, skip: number, take: number) {
    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take,
        include: {
          following: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return { following, total };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return !!follow;
  }

  async follow(followerId: string, followingId: string) {
    return this.prisma.follow.create({
      data: { followerId, followingId },
    });
  }

  async unfollow(followerId: string, followingId: string) {
    return this.prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
  }

  async getFollowerCount(userId: string): Promise<number> {
    // For backward compatibility, keep this method but consider using getProfileCounts
    return this.prisma.follow.count({ where: { followingId: userId } });
  }

  async getFollowingCount(userId: string): Promise<number> {
    // For backward compatibility, keep this method but consider using getProfileCounts
    return this.prisma.follow.count({ where: { followerId: userId } });
  }

  /**
   * Get profile counts (posts, followers, following) with caching.
   * @param username - Profile username
   * @returns Object with counts
   */
  async getProfileCounts(username: string): Promise<{
    postsCount: number;
    followersCount: number;
    followingCount: number;
  }> {
    const cacheKey = CACHE_KEYS.PROFILE_COUNTS(username);

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const profile = await this.prisma.profile.findUnique({
          where: { username },
          select: {
            user: {
              select: {
                _count: {
                  select: {
                    posts: { where: { status: "PUBLISHED" } },
                    followers: true,
                    following: true,
                  },
                },
              },
            },
          },
        });

        if (!profile) {
          return { postsCount: 0, followersCount: 0, followingCount: 0 };
        }

        return {
          postsCount: profile.user._count.posts,
          followersCount: profile.user._count.followers,
          followingCount: profile.user._count.following,
        };
      },
      CACHE_TTL.PROFILE_COUNTS,
    );
  }

  /**
   * Invalidate profile counts cache for a user.
   * Should be called after follow/unfollow operations.
   * @param username - Profile username to invalidate
   */
  async invalidateProfileCountsCache(username: string): Promise<void> {
    const cacheKey = CACHE_KEYS.PROFILE_COUNTS(username);
    await this.redisService.del(cacheKey);
  }
}
