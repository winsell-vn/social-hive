"use client";

import * as React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationDropdown } from "./NotificationDropdown";
import { useUnreadCount } from "../api/notifications";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const { isAuthenticated } = useAuth();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.count ?? 0;

  // Don't render notification bell for unauthenticated users
  if (!isAuthenticated) {
    return null;
  }

  return (
    <NotificationDropdown
      trigger={
        <Button
          variant="ghost"
          size="icon"
          className={`relative h-9 w-9 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${className}`}
          aria-label={
            unreadCount > 0
              ? `Notifications (${unreadCount} unread)`
              : "Notifications"
          }
          aria-haspopup="true"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white"
              aria-label={`${unreadCount} unread notifications`}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      }
    />
  );
}
