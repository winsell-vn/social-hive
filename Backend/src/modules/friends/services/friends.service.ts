import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  Logger,
  Inject,
  forwardRef,
} from "@nestjs/common";
import { FriendRequestStatus } from "@prisma/client";
import { FriendsRepository } from "../repositories/friends.repository";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { ProfilesRepository } from "../../profiles/repositories/profiles.repository";
import { PaginatedResult } from "../../../common/dto/pagination.dto";
import {
  GetFriendsDto,
  FriendshipStatusResponse,
  FriendCountsResponse,
} from "../dto/friend-request.dto";
import { RedisService } from "../../../redis/redis.service";
import { CacheInvalidationService } from "../../../redis/cache-invalidation.service";
import { CACHE_KEYS, CACHE_TTL } from "../../../redis/cache-keys";

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(
    private friendsRepository: FriendsRepository,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
    private profilesRepository: ProfilesRepository,
    private readonly redisService: RedisService,
    private readonly cacheInvalidationService: CacheInvalidationService,
  ) {}

  async sendRequest(senderId: string, receiverId: string) {
    // Validate not sending to self
    if (senderId === receiverId) {
      throw new BadRequestException(
        "Không thể gửi lời mời kết bạn cho chính mình",
      );
    }

    // Check if receiver exists
    const receiverProfile =
      await this.profilesRepository.findByUserId(receiverId);
    if (!receiverProfile) {
      throw new NotFoundException("Người dùng không tồn tại");
    }

    // Check existing relationship
    const existingRequest =
      await this.friendsRepository.findRequestBetweenUsers(
        senderId,
        receiverId,
      );
    if (existingRequest) {
      if (existingRequest.status === FriendRequestStatus.ACCEPTED) {
        throw new BadRequestException("Đã là bạn bè với người này");
      }
      if (existingRequest.status === FriendRequestStatus.PENDING) {
        throw new BadRequestException("Đã có lời mời kết bạn đang chờ xử lý");
      }
    }

    const request = await this.friendsRepository.createRequest(
      senderId,
      receiverId,
    );

    // Send notification
    const senderProfile = await this.profilesRepository.findByUserId(senderId);
    if (senderProfile) {
      await this.notificationsService.notifyFriendRequest(
        receiverId,
        senderId,
        senderProfile.username,
        senderProfile.displayName || senderProfile.username,
        senderProfile.avatar,
      );
    }

    this.logger.log(`User ${senderId} sent friend request to ${receiverId}`);

    // Invalidate cache
    await this.cacheInvalidationService.onFriendRequestSent(
      senderId,
      receiverId,
    );

    return request;
  }

  async acceptRequest(userId: string, requestId: string) {
    const request = await this.friendsRepository.findRequestById(requestId);
    if (!request) {
      throw new NotFoundException("Lời mời kết bạn không tồn tại");
    }

    if (request.receiverId !== userId) {
      throw new ForbiddenException("Không có quyền chấp nhận lời mời này");
    }

    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException("Lời mời kết bạn không còn hiệu lực");
    }

    const updatedRequest = await this.friendsRepository.updateRequestStatus(
      requestId,
      FriendRequestStatus.ACCEPTED,
    );

    // Send notification to sender
    const accepterProfile = await this.profilesRepository.findByUserId(userId);
    if (accepterProfile) {
      await this.notificationsService.notifyFriendRequestAccepted(
        request.senderId,
        userId,
        accepterProfile.username,
        accepterProfile.displayName || accepterProfile.username,
        accepterProfile.avatar,
      );
    }

    this.logger.log(`User ${userId} accepted friend request ${requestId}`);

    // Invalidate cache
    await this.cacheInvalidationService.onFriendRequestAccepted(
      userId,
      request.senderId,
    );

    return updatedRequest;
  }

  async rejectRequest(userId: string, requestId: string) {
    const request = await this.friendsRepository.findRequestById(requestId);
    if (!request) {
      throw new NotFoundException("Lời mời kết bạn không tồn tại");
    }

    if (request.receiverId !== userId) {
      throw new ForbiddenException("Không có quyền từ chối lời mời này");
    }

    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException("Lời mời kết bạn không còn hiệu lực");
    }

    const updatedRequest = await this.friendsRepository.updateRequestStatus(
      requestId,
      FriendRequestStatus.REJECTED,
    );

    this.logger.log(`User ${userId} rejected friend request ${requestId}`);

    // Invalidate cache (same as sent - clears pending requests)
    await this.cacheInvalidationService.onFriendRequestSent(
      request.senderId,
      userId,
    );

    return updatedRequest;
  }

  async cancelRequest(userId: string, requestId: string) {
    const request = await this.friendsRepository.findRequestById(requestId);
    if (!request) {
      throw new NotFoundException("Lời mời kết bạn không tồn tại");
    }

    if (request.senderId !== userId) {
      throw new ForbiddenException("Không có quyền hủy lời mời này");
    }

    if (request.status !== FriendRequestStatus.PENDING) {
      throw new BadRequestException("Lời mời kết bạn không còn hiệu lực");
    }

    await this.friendsRepository.deleteRequest(requestId);

    this.logger.log(`User ${userId} cancelled friend request ${requestId}`);

    // Invalidate cache (same as sent - clears pending requests)
    await this.cacheInvalidationService.onFriendRequestSent(
      userId,
      request.receiverId,
    );

    return { success: true };
  }

  async unfriend(userId: string, friendId: string) {
    const request = await this.friendsRepository.findRequestBetweenUsers(
      userId,
      friendId,
    );
    if (!request || request.status !== FriendRequestStatus.ACCEPTED) {
      throw new BadRequestException("Không phải bạn bè với người này");
    }

    await this.friendsRepository.deleteRequest(request.id);

    this.logger.log(`User ${userId} unfriended ${friendId}`);

    // Invalidate cache
    await this.cacheInvalidationService.onFriendRemoved(userId, friendId);

    return { success: true };
  }

  async getFriends(userId: string, dto: GetFriendsDto) {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 20;
    const search = dto.search;

    const cacheKey = CACHE_KEYS.FRIENDS_LIST(userId, page, limit, search);

    return this.redisService.getOrSet(
      cacheKey,
      async () => {
        const { friends, total } = await this.friendsRepository.getFriends(
          userId,
          (page - 1) * limit,
          limit,
          search,
        );
        return new PaginatedResult(friends, page, limit, total);
      },
      CACHE_TTL.FRIENDS_LIST,
    );
  }

  async getPendingRequests(userId: string) {
    const [incoming, outgoing] = await Promise.all([
      this.friendsRepository.getPendingRequests(userId, "incoming"),
      this.friendsRepository.getPendingRequests(userId, "outgoing"),
    ]);

    return { incoming, outgoing };
  }

  async getSuggestions(userId: string, limit = 20) {
    const cacheKey = CACHE_KEYS.FRIEND_SUGGESTIONS(userId);

    return this.redisService.getOrSet(
      cacheKey,
      () => this.friendsRepository.getSuggestions(userId, limit),
      CACHE_TTL.FRIEND_SUGGESTIONS,
    );
  }

  async getFriendshipStatus(
    userId: string,
    targetId: string,
  ): Promise<FriendshipStatusResponse> {
    return this.friendsRepository.getFriendshipStatus(userId, targetId);
  }

  async getCounts(userId: string): Promise<FriendCountsResponse> {
    const [friends, pendingReceived, pendingSent] = await Promise.all([
      this.friendsRepository.countFriends(userId),
      this.countPendingRequests(userId, "incoming"),
      this.countPendingRequests(userId, "outgoing"),
    ]);

    return { friends, pendingReceived, pendingSent };
  }

  /**
   * Get pending friend request count with caching
   * @param userId - User ID
   * @param type - 'incoming' or 'outgoing'
   * @returns Cached or computed count
   */
  private async countPendingRequests(
    userId: string,
    type: "incoming" | "outgoing",
  ): Promise<number> {
    const cacheKey = CACHE_KEYS.PENDING_REQUESTS_COUNT(userId, type);

    return this.redisService.getOrSet(
      cacheKey,
      () => this.friendsRepository.countPendingRequests(userId, type),
      CACHE_TTL.PENDING_REQUESTS,
    );
  }
}
