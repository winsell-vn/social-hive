import { Test, TestingModule } from "@nestjs/testing";
import { ReputationService } from "./reputation.service";
import { ReputationRepository } from "../repositories/reputation.repository";
import { Tier } from "@prisma/client";
import { NotFoundException } from "@nestjs/common";
import {
  KarmaActionType,
  KARMA_ACTIONS,
  KARMA_LIMITS,
  LIKE_MILESTONES,
} from "../constants/karma-actions";

describe("ReputationService", () => {
  let service: ReputationService;
  let repository: jest.Mocked<ReputationRepository>;

  const mockUser = {
    id: "user-1",
    email: "user@test.com",
    password: "hashedPassword",
    role: "USER" as any,
    karma: 100,
    tier: Tier.CONTRIBUTOR,
    isActive: true,
    isAiAgent: false,
    lastActiveAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    deletionRequestedAt: null,
    deletionScheduledFor: null,
  };

  beforeEach(async () => {
    const mockRepository = {
      getUserById: jest.fn(),
      createTransaction: jest.fn(),
      setUserKarma: jest.fn(),
      getTodayLikeKarma: jest.fn(),
      getPostLikeCount: jest.fn(),
      hasReceivedMilestoneBonus: jest.fn(),
      getTodayLoginKarma: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReputationService,
        {
          provide: ReputationRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ReputationService>(ReputationService);
    repository = module.get(ReputationRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("calculateTier", () => {
    it("should return NEWCOMER for karma 0-99", () => {
      expect(service.calculateTier(0)).toBe(Tier.NEWCOMER);
      expect(service.calculateTier(50)).toBe(Tier.NEWCOMER);
      expect(service.calculateTier(99)).toBe(Tier.NEWCOMER);
    });

    it("should return CONTRIBUTOR for karma 100-499", () => {
      expect(service.calculateTier(100)).toBe(Tier.CONTRIBUTOR);
      expect(service.calculateTier(250)).toBe(Tier.CONTRIBUTOR);
      expect(service.calculateTier(499)).toBe(Tier.CONTRIBUTOR);
    });

    it("should return EXPERT for karma 500-1999", () => {
      expect(service.calculateTier(500)).toBe(Tier.EXPERT);
      expect(service.calculateTier(1000)).toBe(Tier.EXPERT);
      expect(service.calculateTier(1999)).toBe(Tier.EXPERT);
    });

    it("should return MASTER for karma 2000-4999", () => {
      expect(service.calculateTier(2000)).toBe(Tier.MASTER);
      expect(service.calculateTier(3000)).toBe(Tier.MASTER);
      expect(service.calculateTier(4999)).toBe(Tier.MASTER);
    });

    it("should return LEGEND for karma 5000+", () => {
      expect(service.calculateTier(5000)).toBe(Tier.LEGEND);
      expect(service.calculateTier(10000)).toBe(Tier.LEGEND);
      expect(service.calculateTier(999999)).toBe(Tier.LEGEND);
    });
  });

  describe("awardKarma", () => {
    it("should award karma successfully and log transaction", async () => {
      // Arrange
      const updatedUser = { ...mockUser, karma: 150, tier: Tier.CONTRIBUTOR };
      repository.getUserById.mockResolvedValue(mockUser);
      repository.createTransaction.mockResolvedValue({} as any);
      repository.setUserKarma.mockResolvedValue(updatedUser);

      // Act
      const result = await service.awardKarma(
        "user-1",
        KarmaActionType.POST_APPROVED,
        50,
      );

      // Assert
      expect(repository.getUserById).toHaveBeenCalledWith("user-1");
      expect(repository.createTransaction).toHaveBeenCalledWith(
        "user-1",
        KarmaActionType.POST_APPROVED,
        50,
        undefined,
      );
      expect(repository.setUserKarma).toHaveBeenCalledWith(
        "user-1",
        150,
        Tier.CONTRIBUTOR,
      );
      expect(result).toEqual({ newKarma: 150, newTier: Tier.CONTRIBUTOR });
    });

    it("should throw NotFoundException if user not found", async () => {
      // Arrange
      repository.getUserById.mockResolvedValue(null);

      // Act & Assert
      await expect(
        service.awardKarma("invalid-user", KarmaActionType.POST_APPROVED, 50),
      ).rejects.toThrow(NotFoundException);
    });

    it("should floor karma at 0 when deducting points", async () => {
      // Arrange
      const userWithLowKarma = { ...mockUser, karma: 10 };
      const updatedUser = { ...userWithLowKarma, karma: 0 };
      repository.getUserById.mockResolvedValue(userWithLowKarma);
      repository.createTransaction.mockResolvedValue({} as any);
      repository.setUserKarma.mockResolvedValue(updatedUser);

      // Act
      const result = await service.awardKarma(
        "user-1",
        KarmaActionType.POST_REJECTED,
        -20,
      );

      // Assert
      expect(repository.setUserKarma).toHaveBeenCalledWith(
        "user-1",
        0,
        Tier.NEWCOMER,
      );
      expect(result.newKarma).toBe(0);
    });

    it("should update tier when karma crosses threshold", async () => {
      // Arrange
      const userNearThreshold = {
        ...mockUser,
        karma: 490,
        tier: Tier.CONTRIBUTOR,
      };
      const updatedUser = {
        ...userNearThreshold,
        karma: 540,
        tier: Tier.EXPERT,
      };
      repository.getUserById.mockResolvedValue(userNearThreshold);
      repository.createTransaction.mockResolvedValue({} as any);
      repository.setUserKarma.mockResolvedValue(updatedUser);

      // Act
      const result = await service.awardKarma(
        "user-1",
        KarmaActionType.POST_APPROVED,
        50,
      );

      // Assert
      expect(result.newKarma).toBe(540);
      expect(result.newTier).toBe(Tier.EXPERT);
      expect(repository.setUserKarma).toHaveBeenCalledWith(
        "user-1",
        540,
        Tier.EXPERT,
      );
    });
  });

  describe("onPostApproved", () => {
    it("should award +50 karma when post is approved", async () => {
      // Arrange
      const updatedUser = { ...mockUser, karma: 150 };
      repository.getUserById.mockResolvedValue(mockUser);
      repository.createTransaction.mockResolvedValue({} as any);
      repository.setUserKarma.mockResolvedValue(updatedUser);

      // Act
      const result = await service.onPostApproved("user-1", "post-1");

      // Assert
      expect(repository.createTransaction).toHaveBeenCalledWith(
        "user-1",
        KarmaActionType.POST_APPROVED,
        KARMA_ACTIONS.POST_APPROVED,
        { postId: "post-1" },
      );
      expect(result.newKarma).toBe(150);
    });
  });

  describe("onPostRejected", () => {
    it("should deduct -20 karma when post is rejected", async () => {
      // Arrange
      const updatedUser = { ...mockUser, karma: 80 };
      repository.getUserById.mockResolvedValue(mockUser);
      repository.createTransaction.mockResolvedValue({} as any);
      repository.setUserKarma.mockResolvedValue(updatedUser);

      // Act
      const result = await service.onPostRejected(
        "user-1",
        "post-1",
        "Spam content",
      );

      // Assert
      expect(repository.createTransaction).toHaveBeenCalledWith(
        "user-1",
        KarmaActionType.POST_REJECTED,
        KARMA_ACTIONS.POST_REJECTED,
        { postId: "post-1", reason: "Spam content" },
      );
      expect(result.newKarma).toBe(80);
    });
  });

  describe("onReceivedLike", () => {
    it("should award +1 karma when receiving a like", async () => {
      // Arrange
      repository.getTodayLikeKarma.mockResolvedValue(10);
      repository.getUserById.mockResolvedValue(mockUser);
      repository.createTransaction.mockResolvedValue({} as any);
      const updatedUser = { ...mockUser, karma: 101 };
      repository.setUserKarma.mockResolvedValue(updatedUser);
      repository.getPostLikeCount.mockResolvedValue(5);

      // Act
      await service.onReceivedLike("user-1", "post-1", "liker-1");

      // Assert
      expect(repository.getTodayLikeKarma).toHaveBeenCalledWith("user-1");
      expect(repository.createTransaction).toHaveBeenCalledWith(
        "user-1",
        KarmaActionType.RECEIVED_LIKE,
        KARMA_ACTIONS.RECEIVED_LIKE,
        { postId: "post-1", likerId: "liker-1" },
      );
    });

    it("should not award karma if daily cap reached", async () => {
      // Arrange
      repository.getTodayLikeKarma.mockResolvedValue(
        KARMA_LIMITS.MAX_DAILY_LIKE_KARMA,
      );

      // Act
      const result = await service.onReceivedLike(
        "user-1",
        "post-1",
        "liker-1",
      );

      // Assert
      expect(result).toBeNull();
      expect(repository.createTransaction).not.toHaveBeenCalled();
    });
  });

  describe("checkLikeMilestones", () => {
    it("should award +5 karma at 10 likes milestone", async () => {
      // Arrange
      repository.getPostLikeCount.mockResolvedValue(10);
      repository.hasReceivedMilestoneBonus.mockResolvedValue(false);
      repository.getUserById.mockResolvedValue(mockUser);
      repository.createTransaction.mockResolvedValue({} as any);
      const updatedUser = { ...mockUser, karma: 105 };
      repository.setUserKarma.mockResolvedValue(updatedUser);

      // Act
      await service.checkLikeMilestones("user-1", "post-1");

      // Assert
      expect(repository.createTransaction).toHaveBeenCalledWith(
        "user-1",
        KarmaActionType.LIKE_MILESTONE,
        LIKE_MILESTONES[0].bonus,
        { postId: "post-1", milestone: 10, likeCount: 10 },
      );
    });
  });
});
