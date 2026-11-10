export type NotificationType =
  | 'POST_APPROVED'
  | 'POST_REJECTED'
  | 'POST_LIKED'
  | 'POST_COMMENTED'
  | 'COMMENT_REPLIED'
  | 'NEW_FOLLOWER'
  | 'MENTION'
  | 'KARMA_MILESTONE'
  | 'FRIEND_REQUEST_RECEIVED'
  | 'FRIEND_REQUEST_ACCEPTED'

export interface NotificationData {
  actorId?: string
  actorUsername?: string
  actorName?: string
  actorAvatar?: string
  postId?: string
  postAuthorUsername?: string
  postContent?: string
  commentId?: string
  commentContent?: string
  reactionType?: string
  reason?: string
  count?: number
}

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  data: NotificationData | null
  isRead: boolean
  createdAt: string
}

export interface NotificationPaginatedResponse {
  data: Notification[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface UnreadCountResponse {
  count: number
}

