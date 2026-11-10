import { Test, TestingModule } from "@nestjs/testing";
import { NotificationsService } from "./notifications.service";
import { NotificationsRepository } from "../repositories/notifications.repository";
import { NotificationType } from "@prisma/client";
import { getQueueToken } from "@nestjs/bull";
import { RedisService } from "../../../redis/redis.service";
import { CacheInvalidationService } from "../../../redis/cache-invalidation.service";

describe("NotificationsService", () => {
  let service: NotificationsService;
  let notificationsRepository: jest.Mocked<NotificationsRepository>;
  let notificationQueue: any;
  let redisService: jest.Mocked<RedisService>;

  const mockNotification = {
    id: "notification-1",
    userId: "user-1",
    type: NotificationType.POST_LIKED,
    title: "User2 liked your post",
    data: JSON.stringify({
      actorId: "user-2",
      postId: "post-1",
    }),
    isRead: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    const mockNotificationsRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUserId: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      getUnreadCount: jest.fn(),
      delete: jest.fn(),
    };

    const mockQueue = {
      add: jest.fn(),
    };

    const mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      getOrSet: jest.fn(),
    };

    const mockCacheInvalidationService = {
      invalidateUserNotifications: jest.fn(),
      invalidateNotification: jest.fn(),
      onNotificationCreated: jest.fn(),
      onNotificationRead: jest.fn(),
      onAllNotificationsRead: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: NotificationsRepository,
          useValue: mockNotificationsRepository,
        },
        {
          provide: getQueueToken("notification"),
          useValue: mockQueue,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: CacheInvalidationService,
          useValue: mockCacheInvalidationService,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    notificationsRepository = module.get(NotificationsRepository);
    notificationQueue = module.get(getQueueToken("notification"));
    redisService = module.get(RedisService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it("should create a notification successfully", async () => {
      // Arrange
      const data = {
        userId: "user-1",
        type: NotificationType.POST_LIKED,
        title: "User2 liked your post",
        data: {
          actorId: "user-2",
          postId: "post-1",
        },
      };

      notificationsRepository.create.mockResolvedValue(mockNotification as any);

      // Act
      const result = await service.create(data);

      // Assert
      expect(notificationsRepository.create).toHaveBeenCalled();
      expect(result).toEqual(mockNotification);
    });
  });

  describe("getNotifications", () => {
    it("should get paginated notifications", async () => {
      // Arrange
      const userId = "user-1";
      const page = 1;
      const limit = 20;
      const notifications = [mockNotification];

      notificationsRepository.findByUserId.mockResolvedValue({
        notifications,
        total: 1,
      });

      // Act
      const result = await service.getNotifications(userId, page, limit);

      // Assert
      expect(notificationsRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        {
          skip: 0,
          take: limit,
          unreadOnly: undefined,
          type: undefined,
        },
      );
      expect(result.data).toEqual(notifications);
      expect(result.meta.total).toBe(1);
    });

    it("should filter by notification type", async () => {
      // Arrange
      const userId = "user-1";
      const page = 1;
      const limit = 20;
      const type = NotificationType.POST_LIKED;
      const notifications = [mockNotification];

      notificationsRepository.findByUserId.mockResolvedValue({
        notifications,
        total: 1,
      });

      // Act
      const result = await service.getNotifications(
        userId,
        page,
        limit,
        undefined,
        type,
      );

      // Assert
      expect(notificationsRepository.findByUserId).toHaveBeenCalledWith(
        userId,
        {
          skip: 0,
          take: limit,
          unreadOnly: undefined,
          type,
        },
      );
      expect(result.data).toEqual(notifications);
    });
  });

  describe("markAsRead", () => {
    it("should mark a notification as read", async () => {
      // Arrange
      const userId = "user-1";
      const notificationId = "notification-1";
      const readNotification = { ...mockNotification, isRead: true };

      notificationsRepository.findById.mockResolvedValue(
        mockNotification as any,
      );
      notificationsRepository.markAsRead.mockResolvedValue(
        readNotification as any,
      );

      // Act
      const result = await service.markAsRead(notificationId, userId);

      // Assert
      expect(notificationsRepository.findById).toHaveBeenCalledWith(
        notificationId,
      );
      expect(notificationsRepository.markAsRead).toHaveBeenCalledWith(
        notificationId,
      );
      expect(result).toBeDefined();
      if (result) {
        expect(result.isRead).toBe(true);
      }
    });
  });

  describe("markAllAsRead", () => {
    it("should mark all notifications as read", async () => {
      // Arrange
      const userId = "user-1";

      notificationsRepository.markAllAsRead.mockResolvedValue({ count: 5 });

      // Act
      const result = await service.markAllAsRead(userId);

      // Assert
      expect(notificationsRepository.markAllAsRead).toHaveBeenCalledWith(
        userId,
      );
      expect(result).toEqual({ count: 5 });
    });
  });

  describe("getUnreadCount", () => {
    it("should get unread notification count from cache", async () => {
      // Arrange
      const userId = "user-1";

      // Mock getOrSet to simulate cache behavior - it calls the factory function
      redisService.getOrSet.mockImplementation(async (key, factory) => {
        return factory();
      });
      notificationsRepository.getUnreadCount.mockResolvedValue(5);

      // Act
      const result = await service.getUnreadCount(userId);

      // Assert
      expect(redisService.getOrSet).toHaveBeenCalledWith(
        `notifications:unread:${userId}`,
        expect.any(Function),
        30, // CACHE_TTL.NOTIFICATION_UNREAD
      );
      expect(result).toBe(5);
    });

    it("should return cached unread count on cache hit", async () => {
      // Arrange
      const userId = "user-1";

      // Mock getOrSet to return cached value without calling factory
      redisService.getOrSet.mockResolvedValue(10);

      // Act
      const result = await service.getUnreadCount(userId);

      // Assert
      expect(redisService.getOrSet).toHaveBeenCalled();
      expect(result).toBe(10);
    });
  });

  describe("delete", () => {
    it("should delete a notification successfully", async () => {
      // Arrange
      const userId = "user-1";
      const notificationId = "notification-1";

      notificationsRepository.findById.mockResolvedValue(
        mockNotification as any,
      );
      notificationsRepository.delete.mockResolvedValue(mockNotification as any);

      // Act
      const result = await service.delete(notificationId, userId);

      // Assert
      expect(notificationsRepository.findById).toHaveBeenCalledWith(
        notificationId,
      );
      expect(notificationsRepository.delete).toHaveBeenCalledWith(
        notificationId,
      );
      expect(result).toEqual({ success: true });
    });
  });
});
