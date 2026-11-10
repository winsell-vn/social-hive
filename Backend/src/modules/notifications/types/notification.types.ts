import { NotificationType } from "@prisma/client";

export interface NotificationData {
  // Actor info (who triggered the notification)
  actorId?: string;
  actorUsername?: string;
  actorName?: string;
  actorAvatar?: string;

  // Target info (what the notification is about)
  postId?: string;
  postAuthorUsername?: string;
  postContent?: string;
  commentId?: string;
  commentContent?: string;
  groupId?: string;
  groupName?: string;
  conversationId?: string;

  // Chatbot handoff info
  sessionId?: string;

  // Additional context
  reactionType?: string;
  reason?: string;
  count?: number; // For batched notifications (e.g., "5 people liked your post")
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  data?: NotificationData;
}

export interface BatchedNotification {
  userId: string;
  type: NotificationType;
  targetId: string; // postId, commentId, etc.
  actorId: string;
  actorName: string;
  actorAvatar?: string;
}

export interface NotificationWithActor {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  data: NotificationData | null;
  isRead: boolean;
  createdAt: Date;
}

export const NOTIFICATION_TITLES: Record<NotificationType, string> = {
  POST_APPROVED: "Bài viết của bạn đã được duyệt",
  POST_REJECTED: "Bài viết của bạn đã bị từ chối",
  POST_LIKED: "đã thích bài viết của bạn",
  POST_COMMENTED: "đã bình luận bài viết của bạn",
  COMMENT_REPLIED: "đã trả lời bình luận của bạn",
  NEW_FOLLOWER: "đã theo dõi bạn",
  MENTION: "đã nhắc đến bạn",
  KARMA_MILESTONE: "Bạn đã đạt mốc karma mới",
  FRIEND_REQUEST_RECEIVED: "đã gửi cho bạn lời mời kết bạn",
  FRIEND_REQUEST_ACCEPTED: "đã chấp nhận lời mời kết bạn của bạn",
  CHATBOT_HANDOFF: "Khách hàng muốn mua dịch vụ",
};
