import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { FriendRequestStatus } from "@prisma/client";

@Injectable()
export class FriendsRepository {
  constructor(private prisma: PrismaService) {}

  async createRequest(senderId: string, receiverId: string) {
    return this.prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: FriendRequestStatus.PENDING,
      },
      include: {
        sender: {
          include: { profile: true },
        },
        receiver: {
          include: { profile: true },
        },
      },
    });
  }

  async findRequestById(id: string) {
    return this.prisma.friendRequest.findUnique({
      where: { id },
      include: {
        sender: {
          include: { profile: true },
        },
        receiver: {
          include: { profile: true },
        },
      },
    });
  }

  async findRequestBetweenUsers(userId1: string, userId2: string) {
    return this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
    });
  }

  async updateRequestStatus(id: string, status: FriendRequestStatus) {
    return this.prisma.friendRequest.update({
      where: { id },
      data: { status },
      include: {
        sender: {
          include: { profile: true },
        },
        receiver: {
          include: { profile: true },
        },
      },
    });
  }

  async deleteRequest(id: string) {
    return this.prisma.friendRequest.delete({
      where: { id },
    });
  }

  async getFriends(
    userId: string,
    skip: number,
    take: number,
    search?: string,
  ) {
    // Build search condition for profile filtering
    const profileSearchCondition = search
      ? {
          profile: {
            OR: [
              { username: { contains: search, mode: "insensitive" as const } },
              {
                displayName: { contains: search, mode: "insensitive" as const },
              },
            ],
          },
        }
      : undefined;

    // Build where condition with search filter at database level
    const whereCondition = {
      OR: [
        {
          senderId: userId,
          status: FriendRequestStatus.ACCEPTED,
          ...(profileSearchCondition
            ? { receiver: profileSearchCondition }
            : {}),
        },
        {
          receiverId: userId,
          status: FriendRequestStatus.ACCEPTED,
          ...(profileSearchCondition ? { sender: profileSearchCondition } : {}),
        },
      ],
    };

    const [requests, total] = await Promise.all([
      this.prisma.friendRequest.findMany({
        where: whereCondition,
        skip,
        take,
        include: {
          sender: {
            include: { profile: true },
          },
          receiver: {
            include: { profile: true },
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.friendRequest.count({ where: whereCondition }),
    ]);

    // Transform to get the friend (the other user)
    const friendsBasic = requests.map((request) => {
      const friend =
        request.senderId === userId ? request.receiver : request.sender;
      return {
        id: friend.id,
        username: friend.profile?.username || "",
        displayName: friend.profile?.displayName || null,
        avatar: friend.profile?.avatar || null,
      };
    });

    // Get friend IDs for batch query
    const friendIds = friendsBasic.map((friend) => friend.id);

    // Batch get mutual friends counts (2 queries instead of N*2)
    const mutualCounts = await this.batchGetMutualFriendsCounts(
      userId,
      friendIds,
    );

    // Merge results
    const friends = friendsBasic.map((friend) => ({
      ...friend,
      mutualFriendsCount: mutualCounts.get(friend.id) || 0,
    }));

    return { friends, total };
  }

  async getPendingRequests(userId: string, type: "incoming" | "outgoing") {
    const whereCondition =
      type === "incoming"
        ? { receiverId: userId, status: FriendRequestStatus.PENDING }
        : { senderId: userId, status: FriendRequestStatus.PENDING };

    return this.prisma.friendRequest.findMany({
      where: whereCondition,
      include: {
        sender: {
          include: { profile: true },
        },
        receiver: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getSuggestions(userId: string, limit: number) {
    // Get user's friends
    const friendRequests = await this.prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: FriendRequestStatus.ACCEPTED },
          { receiverId: userId, status: FriendRequestStatus.ACCEPTED },
        ],
      },
      select: { senderId: true, receiverId: true },
    });

    // Use Set for O(1) lookups instead of Array.includes() which is O(n)
    const friendIdsSet = new Set(
      friendRequests.map((r) =>
        r.senderId === userId ? r.receiverId : r.senderId,
      ),
    );

    if (friendIdsSet.size === 0) {
      // No friends, return random users
      return this.prisma.user.findMany({
        where: {
          id: { not: userId },
          isActive: true,
        },
        include: { profile: true },
        take: limit,
      });
    }

    // Convert to array for Prisma's `in` clause
    const friendIdsArray = Array.from(friendIdsSet);

    // Get friends of friends
    const friendsOfFriends = await this.prisma.friendRequest.findMany({
      where: {
        OR: [
          {
            senderId: { in: friendIdsArray },
            status: FriendRequestStatus.ACCEPTED,
          },
          {
            receiverId: { in: friendIdsArray },
            status: FriendRequestStatus.ACCEPTED,
          },
        ],
      },
      select: { senderId: true, receiverId: true },
    });

    // Count mutual friends using Set for O(1) lookups
    const mutualCounts = new Map<string, number>();
    for (const r of friendsOfFriends) {
      const potentialFriendId = friendIdsSet.has(r.senderId)
        ? r.receiverId
        : r.senderId;
      // Exclude self and existing friends using Set.has() for O(1) lookup
      if (
        potentialFriendId !== userId &&
        !friendIdsSet.has(potentialFriendId)
      ) {
        mutualCounts.set(
          potentialFriendId,
          (mutualCounts.get(potentialFriendId) || 0) + 1,
        );
      }
    }

    // Get pending requests to exclude
    const pendingRequests = await this.prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: FriendRequestStatus.PENDING },
          { receiverId: userId, status: FriendRequestStatus.PENDING },
        ],
      },
      select: { senderId: true, receiverId: true },
    });

    // Use Set for O(1) lookups when filtering suggestions
    const pendingUserIdsSet = new Set(
      pendingRequests.map((r) =>
        r.senderId === userId ? r.receiverId : r.senderId,
      ),
    );

    // Filter out pending users using Set.has() for O(1) lookup
    const suggestionIds = Array.from(mutualCounts.entries())
      .filter(([id]) => !pendingUserIdsSet.has(id))
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([id]) => id);

    if (suggestionIds.length === 0) {
      return [];
    }

    const users = await this.prisma.user.findMany({
      where: { id: { in: suggestionIds } },
      include: { profile: true },
    });

    return users.map((user) => ({
      ...user,
      mutualFriendsCount: mutualCounts.get(user.id) || 0,
    }));
  }

  async getFriendshipStatus(userId: string, targetId: string) {
    const request = await this.prisma.friendRequest.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetId },
          { senderId: targetId, receiverId: userId },
        ],
      },
    });

    if (!request) {
      return { status: "NONE" as const };
    }

    if (request.status === FriendRequestStatus.ACCEPTED) {
      return { status: "FRIENDS" as const, requestId: request.id };
    }

    if (request.status === FriendRequestStatus.PENDING) {
      if (request.senderId === userId) {
        return { status: "PENDING_SENT" as const, requestId: request.id };
      }
      return { status: "PENDING_RECEIVED" as const, requestId: request.id };
    }

    return { status: "NONE" as const };
  }

  async countFriends(userId: string): Promise<number> {
    return this.prisma.friendRequest.count({
      where: {
        OR: [
          { senderId: userId, status: FriendRequestStatus.ACCEPTED },
          { receiverId: userId, status: FriendRequestStatus.ACCEPTED },
        ],
      },
    });
  }

  async countPendingRequests(
    userId: string,
    type: "incoming" | "outgoing",
  ): Promise<number> {
    const whereCondition =
      type === "incoming"
        ? { receiverId: userId, status: FriendRequestStatus.PENDING }
        : { senderId: userId, status: FriendRequestStatus.PENDING };

    return this.prisma.friendRequest.count({ where: whereCondition });
  }

  async getMutualFriendsCount(
    userId: string,
    targetId: string,
  ): Promise<number> {
    // Get user's friends
    const userFriends = await this.prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: FriendRequestStatus.ACCEPTED },
          { receiverId: userId, status: FriendRequestStatus.ACCEPTED },
        ],
      },
      select: { senderId: true, receiverId: true },
    });

    const userFriendIds = new Set(
      userFriends.map((r) =>
        r.senderId === userId ? r.receiverId : r.senderId,
      ),
    );

    // Get target's friends
    const targetFriends = await this.prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: targetId, status: FriendRequestStatus.ACCEPTED },
          { receiverId: targetId, status: FriendRequestStatus.ACCEPTED },
        ],
      },
      select: { senderId: true, receiverId: true },
    });

    const targetFriendIds = targetFriends.map((r) =>
      r.senderId === targetId ? r.receiverId : r.senderId,
    );

    // Count mutual
    return targetFriendIds.filter((id) => userFriendIds.has(id)).length;
  }

  /**
   * Batch get mutual friends count for multiple users.
   * Reduces N+1 queries to just 2 queries total.
   *
   * @param userId - The current user's ID
   * @param friendIds - Array of friend IDs to get mutual counts for
   * @returns Map of friendId -> mutualFriendsCount
   */
  async batchGetMutualFriendsCounts(
    userId: string,
    friendIds: string[],
  ): Promise<Map<string, number>> {
    if (friendIds.length === 0) {
      return new Map();
    }

    // Query 1: Get user's friends ONCE
    const userFriends = await this.prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: userId, status: FriendRequestStatus.ACCEPTED },
          { receiverId: userId, status: FriendRequestStatus.ACCEPTED },
        ],
      },
      select: { senderId: true, receiverId: true },
    });

    const userFriendIds = new Set(
      userFriends.map((r) =>
        r.senderId === userId ? r.receiverId : r.senderId,
      ),
    );

    // Query 2: Get ALL target friends' friends in ONE query
    const targetFriends = await this.prisma.friendRequest.findMany({
      where: {
        OR: [
          { senderId: { in: friendIds }, status: FriendRequestStatus.ACCEPTED },
          {
            receiverId: { in: friendIds },
            status: FriendRequestStatus.ACCEPTED,
          },
        ],
      },
      select: { senderId: true, receiverId: true },
    });

    // Calculate intersections in memory
    const mutualCounts = new Map<string, number>();

    for (const friendId of friendIds) {
      // Filter to get this friend's friends
      const friendsFriends = targetFriends
        .filter((r) => r.senderId === friendId || r.receiverId === friendId)
        .map((r) => (r.senderId === friendId ? r.receiverId : r.senderId));

      // Count mutual friends (intersection with user's friends)
      const mutualCount = friendsFriends.filter((id) =>
        userFriendIds.has(id),
      ).length;
      mutualCounts.set(friendId, mutualCount);
    }

    return mutualCounts;
  }
}
