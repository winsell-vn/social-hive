"use client"

import * as React from "react"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatRelativeTime, getInitials } from "@/lib/utils"
import { getAvatarUrl } from "@/lib/image-url"
import type { Notification, NotificationType } from "../types/notification"
import {
  Heart,
  MessageCircle,
  UserPlus,
  UserCheck,
  CheckCircle,
  XCircle,
  AtSign,
  Award,
} from "lucide-react"

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead?: (id: string) => void
  onClick?: () => void
}

const notificationIcons: Record<NotificationType, React.ReactNode> = {
  POST_APPROVED: <CheckCircle className="h-4 w-4 text-green-500" />,
  POST_REJECTED: <XCircle className="h-4 w-4 text-red-500" />,
  POST_LIKED: <Heart className="h-4 w-4 text-red-500" />,
  POST_COMMENTED: <MessageCircle className="h-4 w-4 text-blue-500" />,
  COMMENT_REPLIED: <MessageCircle className="h-4 w-4 text-blue-500" />,
  NEW_FOLLOWER: <UserPlus className="h-4 w-4 text-purple-500" />,
  MENTION: <AtSign className="h-4 w-4 text-orange-500" />,
  KARMA_MILESTONE: <Award className="h-4 w-4 text-yellow-500" />,
  FRIEND_REQUEST_RECEIVED: <UserPlus className="h-4 w-4 text-purple-500" />,
  FRIEND_REQUEST_ACCEPTED: <UserCheck className="h-4 w-4 text-green-500" />,
}

function getNotificationLink(notification: Notification): string {
  const { type, data } = notification

  // Post-related notifications: use /profile/{postAuthorUsername}/{postId} for SEO-friendly URL
  if (data?.postId && data?.postAuthorUsername) {
    // For comments, add hash to scroll to comments section
    if (type === 'POST_COMMENTED' || type === 'COMMENT_REPLIED') {
      return `/profile/${data.postAuthorUsername}/${data.postId}#comment-section`
    }
    return `/profile/${data.postAuthorUsername}/${data.postId}`
  }

  // Fallback for posts without postAuthorUsername (legacy notifications)
  if (data?.postId) {
    if (type === 'POST_COMMENTED' || type === 'COMMENT_REPLIED') {
      return `/post/${data.postId}#comment-section`
    }
    return `/post/${data.postId}`
  }

  // User-related notifications: use actorUsername if available, fallback to actorId
  const actorIdentifier = data?.actorUsername || data?.actorId

  if (actorIdentifier && (type === 'NEW_FOLLOWER' || type === 'MENTION')) {
    return `/profile/${actorIdentifier}`
  }

  if (type === 'FRIEND_REQUEST_RECEIVED' || type === 'FRIEND_REQUEST_ACCEPTED') {
    return actorIdentifier ? `/profile/${actorIdentifier}` : '/friends'
  }

  // Karma milestone - go to own profile
  if (type === 'KARMA_MILESTONE') {
    return '/profile'
  }

  // Post-related notifications without postId - fallback to notifications page
  if (type === 'POST_LIKED' || type === 'POST_COMMENTED' || type === 'COMMENT_REPLIED' || type === 'POST_APPROVED' || type === 'POST_REJECTED') {
    return '/notifications'
  }

  // Default fallback - go to notifications page instead of '#'
  return '/notifications'
}

export function NotificationItem({
  notification,
  onMarkAsRead,
  onClick,
}: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id)
    }
    onClick?.()
  }

  const link = getNotificationLink(notification)
  const icon = notificationIcons[notification.type]

  return (
    <div>
      <Link
        href={link}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            handleClick();
          }
        }}
        className={`flex items-start gap-3 p-3 transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded ${
          !notification.isRead ? 'bg-rose-50 dark:bg-rose-950/30' : ''
        }`}
        role="article"
        aria-label={`${notification.title}${notification.data?.postContent ? ` - "${notification.data.postContent}"` : ''}`}
      >
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getAvatarUrl(notification.data?.actorAvatar)} alt={notification.data?.actorName || 'User'} />
            <AvatarFallback className="bg-rose-100 text-rose-600 dark:bg-rose-900 dark:text-rose-300">
              {getInitials(notification.data?.actorName || 'U')}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-1 -right-1 rounded-full bg-background p-0.5" aria-hidden="true">
            {icon}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
            {notification.title}
          </p>
          {notification.data?.postContent && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              &ldquo;{notification.data.postContent}&rdquo;
            </p>
          )}
          {notification.data?.commentContent && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              &ldquo;{notification.data.commentContent}&rdquo;
            </p>
          )}
          {notification.data?.reason && (
            <p className="mt-0.5 text-xs text-destructive">
              Lý do: {notification.data.reason}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>

        {!notification.isRead && (
          <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-rose-500" aria-label="Unread notification" />
        )}
      </Link>
    </div>
  )
}

