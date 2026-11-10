'use client';

import { Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { NotificationItem } from '@/features/notifications';
import {
  useNotifications,
  useMarkAllAsRead,
  useDeleteNotification,
  useMarkAsRead,
} from '@/features/notifications';
import { NotificationListSkeleton } from '@/components/loading';
import { NoNotifications, NoConnection } from '@/components/empty';
import { FadeIn, StaggerContainer } from '@/components/animations';

function NotificationsPageContent() {
  const { data, isLoading, error } = useNotifications();
  const markAllAsRead = useMarkAllAsRead();
  const markAsRead = useMarkAsRead();
  const deleteNotification = useDeleteNotification();

  // Flatten all pages into a single array of notifications
  const notifications = data?.pages.flatMap((page) => page.data) || [];
  const hasUnread = notifications.some((n) => !n.isRead);

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Thông báo</h1>
        </div>
        <NotificationListSkeleton count={5} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Thông báo</h1>
        </div>
        <NoConnection onRetry={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Thông báo</h1>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
          >
            <Check className="mr-2 h-4 w-4" />
            Đánh dấu tất cả đã đọc
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <FadeIn>
          <NoNotifications className="rounded-lg border bg-card" />
        </FadeIn>
      ) : (
        <StaggerContainer staggerDelay={0.05} className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="group relative rounded-lg border bg-card transition-colors hover:bg-accent/50 hover:text-accent-foreground"
            >
              <NotificationItem
                notification={notification}
                onMarkAsRead={() => handleMarkAsRead(notification.id)}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => handleDelete(notification.id)}
                aria-label="Xóa thông báo"
              >
                <Trash2 className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
        </StaggerContainer>
      )}
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <ProtectedRoute>
      <NotificationsPageContent />
    </ProtectedRoute>
  );
}

