export interface PendingPost {
  id: string;
  content: string;
  images: string[];
  author: {
    id: string;
    username: string;
    displayName: string | null;
    avatar: string | null;
    tier: string;
    karma: number;
  };
  createdAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface UserManagement {
  id: string;
  email: string;
  profile: {
    username: string;
    displayName: string | null;
    avatar: string | null;
  } | null;
  role: 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  tier: string;
  karma: number;
  isVerified: boolean;
  isBanned: boolean;
  createdAt: string;
  postsCount: number;
  commentsCount: number;
}

export interface PlatformStats {
  totalUsers: number;
  totalPosts: number;
  totalComments: number;
  pendingPosts: number;
  activeUsers24h: number;
  newUsersToday: number;
  newPostsToday: number;
}

export interface ModerationAction {
  postId: string;
  action: 'APPROVE' | 'REJECT';
  reason?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

export interface UserFilters {
  search?: string;
  role?: 'GUEST' | 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  isBanned?: boolean;
}

