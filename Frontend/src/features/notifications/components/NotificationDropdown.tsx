"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCheck } from "lucide-react";
import { NotificationItem } from "./NotificationItem";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
} from "../api/notifications";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { NotificationListSkeleton } from "@/components/loading";
import { NoNotifications } from "@/components/empty";
import type { Notification } from "../types/notification";

interface NotificationDropdownProps {
  trigger: React.ReactNode;
  onClose?: () => void;
}

export function NotificationDropdown({
  trigger,
  onClose,
}: NotificationDropdownProps) {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = React.useState(false);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications(undefined, 10);

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications: Notification[] = React.useMemo(() => {
    if (!data?.pages) return [];
    return data.pages.flatMap((page) => page.data);
  }, [data]);

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  const handleItemClick = () => {
    setOpen(false);
    onClose?.();
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      onClose?.();
    }
  };

  // Don't render dropdown for unauthenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>{trigger}</DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        collisionPadding={16}
        className="w-80 p-0 max-h-[calc(100vh-100px)] overflow-hidden"
        role="menu"
        aria-label="Notifications menu"
      >
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold">Thông báo</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleMarkAllAsRead();
              }
            }}
            disabled={markAllAsRead.isPending}
            className="text-xs focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            aria-label="Mark all notifications as read"
          >
            <CheckCheck className="h-4 w-4 mr-1" aria-hidden="true" />
            Đánh dấu đã đọc
          </Button>
        </div>

        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <NotificationListSkeleton count={5} />
          ) : notifications.length === 0 ? (
            <NoNotifications className="py-8" />
          ) : (
            <div className="divide-y" role="presentation">
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onClick={handleItemClick}
                />
              ))}

              {hasNextPage && (
                <div className="p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                    onClick={() => fetchNextPage()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fetchNextPage();
                      }
                    }}
                    disabled={isFetchingNextPage}
                    aria-label="Load more notifications"
                  >
                    {isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-2">
          <Link
            href="/notifications"
            className="block text-center text-sm text-blue-600 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-2 py-1"
            onClick={handleItemClick}
            role="menuitem"
            aria-label="View all notifications"
          >
            Xem tất cả thông báo
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
