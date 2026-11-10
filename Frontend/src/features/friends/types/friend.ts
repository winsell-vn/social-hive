export type FriendRequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    profile: {
      username: string;
      displayName: string | null;
      avatar: string | null;
    } | null;
  };
  receiver: {
    id: string;
    profile: {
      username: string;
      displayName: string | null;
      avatar: string | null;
    } | null;
  };
}

export interface Friend {
  id: string;
  username: string;
  displayName: string | null;
  avatar: string | null;
  mutualFriendsCount: number;
}

export interface FriendshipStatus {
  status: 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'FRIENDS';
  requestId?: string;
}

export interface FriendCounts {
  friends: number;
  pendingReceived: number;
  pendingSent: number;
}

export interface FriendSuggestion {
  id: string;
  profile: {
    username: string;
    displayName: string | null;
    avatar: string | null;
  } | null;
  mutualFriendsCount: number;
}

export interface PendingRequestsResponse {
  incoming: FriendRequest[];
  outgoing: FriendRequest[];
}

export interface FriendsPaginatedResponse {
  data: Friend[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

