import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { ProfilesService } from "./profiles.service";
import { ProfilesRepository } from "../repositories/profiles.repository";
import { UpdateProfileDto } from "../dto/profile.dto";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { FriendsRepository } from "../../friends/repositories/friends.repository";
import { RedisService } from "../../../redis/redis.service";
import { UploadService } from "../../upload/services/upload.service";

describe("ProfilesService", () => {
  let service: ProfilesService;
  let profilesRepository: jest.Mocked<ProfilesRepository>;

  const mockProfile = {
    id: "profile-1",
    userId: "user-1",
    username: "testuser",
    displayName: "Test User",
    avatar: null,
    coverPhoto: null,
    bio: "Test bio",
    location: null,
    website: null,
    socialLinks: null,
    portfolio: null,
    isPrivate: false,
    lastUsernameChange: null,
    closeFriends: null,
    followerCount: 10,
    followingCount: 5,
    jobTitle: null,
    company: null,
    expertise: null,
    credentials: null,
    isVerifiedExpert: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockProfilesRepository = {
      findByUsername: jest.fn(),
      findByUserId: jest.fn(),
      findByUsernameWithSettings: jest.fn(),
      update: jest.fn(),
      follow: jest.fn(),
      unfollow: jest.fn(),
      isFollowing: jest.fn(),
      getFollowers: jest.fn(),
      getFollowing: jest.fn(),
    };

    const mockNotificationsService = {
      create: jest.fn(),
      createViaQueue: jest.fn(),
      notifyNewFollower: jest.fn(),
    };

    const mockFriendsRepository = {
      getFriendshipStatus: jest.fn(),
    };

    const mockRedisService = {
      getOrSet: jest.fn().mockImplementation((_key, factory) => factory()),
      del: jest.fn().mockResolvedValue(undefined),
    };

    const mockUploadService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfilesService,
        {
          provide: ProfilesRepository,
          useValue: mockProfilesRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
        {
          provide: FriendsRepository,
          useValue: mockFriendsRepository,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    service = module.get<ProfilesService>(ProfilesService);
    profilesRepository = module.get(ProfilesRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getProfile", () => {
    it("should get a profile by username", async () => {
      // Arrange
      const username = "testuser";
      profilesRepository.findByUsername.mockResolvedValue(mockProfile as any);

      // Act
      const result = await service.getProfile(username);

      // Assert
      expect(profilesRepository.findByUsername).toHaveBeenCalledWith(username);
      expect(result).toEqual(mockProfile);
    });

    it("should throw NotFoundException when profile does not exist", async () => {
      // Arrange
      const username = "nonexistent";
      profilesRepository.findByUsername.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getProfile(username)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateProfile", () => {
    it("should update profile successfully", async () => {
      // Arrange
      const userId = "user-1";
      const dto: UpdateProfileDto = {
        displayName: "Updated Name",
        bio: "Updated bio",
      };
      const updatedProfile = { ...mockProfile, ...dto };

      profilesRepository.update.mockResolvedValue(updatedProfile as any);

      // Act
      const result = await service.updateProfile(userId, dto);

      // Assert
      expect(profilesRepository.update).toHaveBeenCalledWith(userId, dto);
      expect(result).toEqual(updatedProfile);
    });

    it("should update profile with bio max 500 characters", async () => {
      // Arrange
      const userId = "user-1";
      const longBio = "a".repeat(500);
      const dto: UpdateProfileDto = { bio: longBio };
      const updatedProfile = { ...mockProfile, bio: longBio };

      profilesRepository.update.mockResolvedValue(updatedProfile as any);

      // Act
      const result = await service.updateProfile(userId, dto);

      // Assert
      expect(profilesRepository.update).toHaveBeenCalledWith(userId, dto);
      expect(result.bio).toHaveLength(500);
    });
  });

  describe("follow", () => {
    it("should follow a user successfully", async () => {
      // Arrange
      const followerId = "user-1";
      const followingId = "user-2";
      const mockFollow = {
        id: "follow-1",
        followerId,
        followingId,
        createdAt: new Date(),
      };

      profilesRepository.isFollowing.mockResolvedValue(false);
      profilesRepository.follow.mockResolvedValue(mockFollow);

      // Act
      const result = await service.follow(followerId, followingId);

      // Assert
      expect(profilesRepository.isFollowing).toHaveBeenCalledWith(
        followerId,
        followingId,
      );
      expect(profilesRepository.follow).toHaveBeenCalledWith(
        followerId,
        followingId,
      );
      expect(result).toEqual({ success: true });
    });

    it("should throw ForbiddenException when trying to follow self", async () => {
      // Arrange
      const userId = "user-1";

      // Act & Assert
      await expect(service.follow(userId, userId)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("should throw ForbiddenException when already following", async () => {
      // Arrange
      const followerId = "user-1";
      const followingId = "user-2";

      profilesRepository.isFollowing.mockResolvedValue(true);

      // Act & Assert
      await expect(service.follow(followerId, followingId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("unfollow", () => {
    it("should unfollow a user successfully", async () => {
      // Arrange
      const followerId = "user-1";
      const followingId = "user-2";
      const mockUnfollow = {
        id: "follow-1",
        followerId,
        followingId,
        createdAt: new Date(),
      };

      profilesRepository.isFollowing.mockResolvedValue(true);
      profilesRepository.unfollow.mockResolvedValue(mockUnfollow);

      // Act
      const result = await service.unfollow(followerId, followingId);

      // Assert
      expect(profilesRepository.isFollowing).toHaveBeenCalledWith(
        followerId,
        followingId,
      );
      expect(profilesRepository.unfollow).toHaveBeenCalledWith(
        followerId,
        followingId,
      );
      expect(result).toEqual({ success: true });
    });

    it("should throw ForbiddenException when not following", async () => {
      // Arrange
      const followerId = "user-1";
      const followingId = "user-2";

      profilesRepository.isFollowing.mockResolvedValue(false);

      // Act & Assert
      await expect(service.unfollow(followerId, followingId)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe("getFollowers", () => {
    it("should get paginated followers", async () => {
      // Arrange
      const userId = "user-1";
      const page = 1;
      const limit = 10;
      const followers = [
        {
          id: "follow-1",
          followerId: "user-2",
          followingId: userId,
          createdAt: new Date(),
          follower: {
            id: "user-2",
            createdAt: new Date(),
            updatedAt: new Date(),
            email: "user2@test.com",
            password: "hashedPassword",
            role: "USER" as any,
            karma: 0,
            tier: "NEWCOMER" as any,
            isActive: true,
            isAiAgent: false,
            lastActiveAt: new Date(),
            deletionRequestedAt: null,
            deletionScheduledFor: null,
            profile: {
              id: "profile-2",
              userId: "user-2",
              username: "user2",
              displayName: "User 2",
              avatar: null,
              coverPhoto: null,
              bio: null,
              location: null,
              website: null,
              socialLinks: null,
              portfolio: null,
              isPrivate: false,
              lastUsernameChange: null,
              closeFriends: null,
              followerCount: 0,
              followingCount: 0,
              jobTitle: null,
              company: null,
              expertise: null,
              credentials: null,
              isVerifiedExpert: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
        {
          id: "follow-2",
          followerId: "user-3",
          followingId: userId,
          createdAt: new Date(),
          follower: {
            id: "user-3",
            createdAt: new Date(),
            updatedAt: new Date(),
            email: "user3@test.com",
            password: "hashedPassword",
            role: "USER" as any,
            karma: 0,
            tier: "NEWCOMER" as any,
            isActive: true,
            isAiAgent: false,
            lastActiveAt: new Date(),
            deletionRequestedAt: null,
            deletionScheduledFor: null,
            profile: {
              id: "profile-3",
              userId: "user-3",
              username: "user3",
              displayName: "User 3",
              avatar: null,
              coverPhoto: null,
              bio: null,
              location: null,
              website: null,
              socialLinks: null,
              portfolio: null,
              isPrivate: false,
              lastUsernameChange: null,
              closeFriends: null,
              followerCount: 0,
              followingCount: 0,
              jobTitle: null,
              company: null,
              expertise: null,
              credentials: null,
              isVerifiedExpert: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
      ];

      profilesRepository.getFollowers.mockResolvedValue({
        followers,
        total: 2,
      });

      // Act
      const result = await service.getFollowers(userId, page, limit);

      // Assert
      expect(profilesRepository.getFollowers).toHaveBeenCalledWith(
        userId,
        0,
        limit,
      );
      expect(result.data).toEqual([
        {
          id: "user-2",
          email: "user2@test.com",
          profile: followers[0].follower.profile,
          followedAt: followers[0].createdAt,
        },
        {
          id: "user-3",
          email: "user3@test.com",
          profile: followers[1].follower.profile,
          followedAt: followers[1].createdAt,
        },
      ]);
      expect(result.meta.total).toBe(2);
    });
  });

  describe("getFollowing", () => {
    it("should get paginated following", async () => {
      // Arrange
      const userId = "user-1";
      const page = 1;
      const limit = 10;
      const following = [
        {
          id: "follow-3",
          followerId: userId,
          followingId: "user-2",
          createdAt: new Date(),
          following: {
            id: "user-2",
            createdAt: new Date(),
            updatedAt: new Date(),
            email: "user2@test.com",
            password: "hashedPassword",
            role: "USER" as any,
            karma: 0,
            tier: "NEWCOMER" as any,
            isActive: true,
            isAiAgent: false,
            lastActiveAt: new Date(),
            deletionRequestedAt: null,
            deletionScheduledFor: null,
            profile: {
              id: "profile-2",
              userId: "user-2",
              username: "user2",
              displayName: "User 2",
              avatar: null,
              coverPhoto: null,
              bio: null,
              location: null,
              website: null,
              socialLinks: null,
              portfolio: null,
              isPrivate: false,
              lastUsernameChange: null,
              closeFriends: null,
              followerCount: 0,
              followingCount: 0,
              jobTitle: null,
              company: null,
              expertise: null,
              credentials: null,
              isVerifiedExpert: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
        {
          id: "follow-4",
          followerId: userId,
          followingId: "user-3",
          createdAt: new Date(),
          following: {
            id: "user-3",
            createdAt: new Date(),
            updatedAt: new Date(),
            email: "user3@test.com",
            password: "hashedPassword",
            role: "USER" as any,
            karma: 0,
            tier: "NEWCOMER" as any,
            isActive: true,
            isAiAgent: false,
            lastActiveAt: new Date(),
            deletionRequestedAt: null,
            deletionScheduledFor: null,
            profile: {
              id: "profile-3",
              userId: "user-3",
              username: "user3",
              displayName: "User 3",
              avatar: null,
              coverPhoto: null,
              bio: null,
              location: null,
              website: null,
              socialLinks: null,
              portfolio: null,
              isPrivate: false,
              lastUsernameChange: null,
              closeFriends: null,
              followerCount: 0,
              followingCount: 0,
              jobTitle: null,
              company: null,
              expertise: null,
              credentials: null,
              isVerifiedExpert: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          },
        },
      ];

      profilesRepository.getFollowing.mockResolvedValue({
        following,
        total: 2,
      });

      // Act
      const result = await service.getFollowing(userId, page, limit);

      // Assert
      expect(profilesRepository.getFollowing).toHaveBeenCalledWith(
        userId,
        0,
        limit,
      );
      expect(result.data).toEqual([
        {
          id: "user-2",
          email: "user2@test.com",
          profile: following[0].following.profile,
          followedAt: following[0].createdAt,
        },
        {
          id: "user-3",
          email: "user3@test.com",
          profile: following[1].following.profile,
          followedAt: following[1].createdAt,
        },
      ]);
      expect(result.meta.total).toBe(2);
    });
  });

  describe("checkFollowStatus", () => {
    it("should return true when following", async () => {
      // Arrange
      const followerId = "user-1";
      const followingId = "user-2";

      profilesRepository.isFollowing.mockResolvedValue(true);

      // Act
      const result = await service.checkFollowStatus(followerId, followingId);

      // Assert
      expect(profilesRepository.isFollowing).toHaveBeenCalledWith(
        followerId,
        followingId,
      );
      expect(result).toEqual({ isFollowing: true });
    });

    it("should return false when not following", async () => {
      // Arrange
      const followerId = "user-1";
      const followingId = "user-2";

      profilesRepository.isFollowing.mockResolvedValue(false);

      // Act
      const result = await service.checkFollowStatus(followerId, followingId);

      // Assert
      expect(result).toEqual({ isFollowing: false });
    });
  });
});
