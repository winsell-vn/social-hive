import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { ProfileVisibility, Prisma } from "@prisma/client";
import { ProfilesRepository } from "../repositories/profiles.repository";
import { UpdateProfileDto } from "../dto/profile.dto";
import { PaginatedResult } from "../../../common/dto/pagination.dto";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { FriendsRepository } from "../../friends/repositories/friends.repository";
import { RedisService } from "../../../redis/redis.service";
import { CACHE_KEYS, CACHE_TTL } from "../../../redis/cache-keys";
import { UploadService } from "../../upload/services/upload.service";

// Common search engine crawler User-Agent patterns for SEO
const CRAWLER_USER_AGENTS = [
  "googlebot",
  "bingbot",
  "slurp", // Yahoo
  "duckduckbot",
  "baiduspider",
  "yandexbot",
  "facebookexternalhit",
  "twitterbot",
  "linkedinbot",
  "applebot",
  "msnbot",
  "ia_archiver", // Alexa
  "semrushbot",
  "ahrefsbot",
  "dotbot",
  "rogerbot",
  "embedly",
  "quora link preview",
  "showyoubot",
  "outbrain",
  "pinterest",
  "slackbot",
  "vkshare",
  "w3c_validator",
  "redditbot",
  "discordbot",
  "whatsapp",
  "telegrambot",
];

interface FollowerData {
  follower: {
    id: string;
    email: string;
    profile: unknown;
  };
  createdAt: Date;
}

interface FollowingData {
  following: {
    id: string;
    email: string;
    profile: unknown;
  };
  createdAt: Date;
}

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);

  constructor(
    private profilesRepository: ProfilesRepository,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    @Inject(forwardRef(() => FriendsRepository))
    private friendsRepository: FriendsRepository,
    private redisService: RedisService,
    private uploadService: UploadService,
  ) {}

  /**
   * Check if the User-Agent is a search engine crawler
   * Allow crawlers to access profiles for SEO purposes
   */
  private isCrawler(userAgent: string | undefined): boolean {
    if (!userAgent) return false;
    const lowerUserAgent = userAgent.toLowerCase();
    return CRAWLER_USER_AGENTS.some((crawler) =>
      lowerUserAgent.includes(crawler),
    );
  }

  /**
   * Get profile with visibility check
   * @param username - The username to look up
   * @param requesterId - The ID of the user making the request (null if not authenticated)
   * @param userAgent - The User-Agent header for crawler detection
   */
  async getProfileWithVisibilityCheck(
    username: string,
    requesterId: string | null,
    userAgent: string | undefined,
  ) {
    // Get profile from cache or database
    const cacheKey = CACHE_KEYS.PROFILE(username);

    const profile = await this.redisService.getOrSet(
      cacheKey,
      () => this.profilesRepository.findByUsernameWithSettings(username),
      CACHE_TTL.PROFILE,
    );

    if (!profile) {
      throw new NotFoundException("Người dùng không tồn tại");
    }

    const profileOwnerId = profile.userId;
    const visibility =
      profile.user.settings?.profileVisibility ?? ProfileVisibility.PUBLIC;

    // Allow search engine crawlers for SEO
    if (this.isCrawler(userAgent)) {
      this.logger.debug(`Crawler access allowed for profile ${username}`);
      return this.sanitizeProfileResponse(profile);
    }

    // Check visibility settings (not cached - depends on requester)
    switch (visibility) {
      case ProfileVisibility.PUBLIC:
        return this.sanitizeProfileResponse(profile);

      case ProfileVisibility.FRIENDS:
        if (!requesterId) {
          throw new ForbiddenException(
            "Trang cá nhân này chỉ hiển thị với bạn bè",
          );
        }
        if (requesterId === profileOwnerId) {
          return this.sanitizeProfileResponse(profile);
        }
        // Friendship check is NOT cached (changes frequently)
        const friendshipStatus =
          await this.friendsRepository.getFriendshipStatus(
            requesterId,
            profileOwnerId,
          );
        if (friendshipStatus.status !== "FRIENDS") {
          throw new ForbiddenException(
            "Trang cá nhân này chỉ hiển thị với bạn bè",
          );
        }
        return this.sanitizeProfileResponse(profile);

      case ProfileVisibility.PRIVATE:
        if (!requesterId || requesterId !== profileOwnerId) {
          throw new ForbiddenException(
            "Trang cá nhân này đang ở chế độ riêng tư",
          );
        }
        return this.sanitizeProfileResponse(profile);

      default:
        return this.sanitizeProfileResponse(profile);
    }
  }

  /**
   * Remove sensitive data from profile response
   */
  private sanitizeProfileResponse(profile: any) {
    // Remove settings from response to not expose privacy settings
    const { user, ...profileData } = profile;
    const { settings, ...userData } = user;
    return {
      ...profileData,
      user: userData,
    };
  }

  async getProfile(username: string) {
    const profile = await this.profilesRepository.findByUsername(username);
    if (!profile) {
      throw new NotFoundException("Người dùng không tồn tại");
    }
    return profile;
  }

  async getMyProfile(userId: string) {
    const profile = await this.profilesRepository.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException("Hồ sơ không tồn tại");
    }
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    this.logger.log(`Updating profile for user ${userId}`);
    // Convert DTO to Prisma-compatible input (credentials is JSON field)
    const updateData: Prisma.ProfileUpdateInput = {
      ...dto,
      credentials: dto.credentials as Prisma.InputJsonValue | undefined,
    };
    const updatedProfile = await this.profilesRepository.update(userId, updateData);

    // Invalidate profile cache after update
    if (updatedProfile?.username) {
      const cacheKey = CACHE_KEYS.PROFILE(updatedProfile.username);
      await this.redisService.del(cacheKey);
      this.logger.debug(
        `Cache invalidated for profile ${updatedProfile.username}`,
      );
    }

    return updatedProfile;
  }

  async getFollowers(userId: string, page: number, limit: number) {
    const { followers, total } = await this.profilesRepository.getFollowers(
      userId,
      (page - 1) * limit,
      limit,
    );

    const data = (followers as FollowerData[]).map((f) => ({
      id: f.follower.id,
      email: f.follower.email,
      profile: f.follower.profile,
      followedAt: f.createdAt,
    }));

    return new PaginatedResult(data, page, limit, total);
  }

  async getFollowing(userId: string, page: number, limit: number) {
    const { following, total } = await this.profilesRepository.getFollowing(
      userId,
      (page - 1) * limit,
      limit,
    );

    const data = (following as FollowingData[]).map((f) => ({
      id: f.following.id,
      email: f.following.email,
      profile: f.following.profile,
      followedAt: f.createdAt,
    }));

    return new PaginatedResult(data, page, limit, total);
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new ForbiddenException("Không thể tự theo dõi chính mình");
    }

    const isAlreadyFollowing = await this.profilesRepository.isFollowing(
      followerId,
      followingId,
    );

    if (isAlreadyFollowing) {
      throw new ForbiddenException("Bạn đã theo dõi người này rồi");
    }

    await this.profilesRepository.follow(followerId, followingId);

    // Send notification to the followed user
    const followerProfile =
      await this.profilesRepository.findByUserId(followerId);
    if (followerProfile) {
      await this.notificationsService.notifyNewFollower(
        followingId,
        followerId,
        followerProfile.username,
        followerProfile.displayName || followerProfile.username,
        followerProfile.avatar,
      );
    }

    this.logger.log(`User ${followerId} followed user ${followingId}`);
    return { success: true };
  }

  async unfollow(followerId: string, followingId: string) {
    const isFollowing = await this.profilesRepository.isFollowing(
      followerId,
      followingId,
    );

    if (!isFollowing) {
      throw new ForbiddenException("Bạn chưa theo dõi người này");
    }

    await this.profilesRepository.unfollow(followerId, followingId);

    this.logger.log(`User ${followerId} unfollowed user ${followingId}`);
    return { success: true };
  }

  async checkFollowStatus(followerId: string, followingId: string) {
    const isFollowing = await this.profilesRepository.isFollowing(
      followerId,
      followingId,
    );
    return { isFollowing };
  }

  async updateAvatar(userId: string, file: Express.Multer.File) {
    this.logger.log(`Updating avatar for user ${userId}`);

    // 1. Get current profile to find old avatar URL
    const currentProfile = await this.profilesRepository.findByUserId(userId);
    const oldAvatarUrl = currentProfile?.avatar;

    // 2. Upload new avatar
    const result = await this.uploadService.uploadAvatar(file, userId);

    // 3. Update database
    const updatedProfile = await this.profilesRepository.update(userId, {
      avatar: result.url,
    });

    // 4. Delete old avatar (best effort - don't block on failure)
    if (oldAvatarUrl) {
      await this.uploadService.deleteOldProfileImage(oldAvatarUrl, userId);
    }

    // 5. Invalidate profile cache
    if (updatedProfile?.username) {
      const cacheKey = CACHE_KEYS.PROFILE(updatedProfile.username);
      await this.redisService.del(cacheKey);
      this.logger.debug(
        `Cache invalidated for profile ${updatedProfile.username} after avatar update`,
      );
    }

    return result;
  }

  async updateCover(userId: string, file: Express.Multer.File) {
    this.logger.log(`Updating cover photo for user ${userId}`);

    // 1. Get current profile to find old cover URL
    const currentProfile = await this.profilesRepository.findByUserId(userId);
    const oldCoverUrl = currentProfile?.coverPhoto;

    // 2. Upload new cover
    const result = await this.uploadService.uploadCover(file, userId);

    // 3. Update database
    const updatedProfile = await this.profilesRepository.update(userId, {
      coverPhoto: result.url,
    });

    // 4. Delete old cover (best effort - don't block on failure)
    if (oldCoverUrl) {
      await this.uploadService.deleteOldProfileImage(oldCoverUrl, userId);
    }

    // 5. Invalidate profile cache
    if (updatedProfile?.username) {
      const cacheKey = CACHE_KEYS.PROFILE(updatedProfile.username);
      await this.redisService.del(cacheKey);
      this.logger.debug(
        `Cache invalidated for profile ${updatedProfile.username} after cover update`,
      );
    }

    return result;
  }
}
