"use client";

import * as React from "react";
import Link from "next/link";
import { MoreHorizontal, UserX, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, getInitials } from "@/lib/utils";
import { generateAvatarAlt } from "@/lib/seo/alt-text";
import { getAvatarUrl } from "@/lib/image-url";
import { useUnfriend } from "../api/friends";
import { toast } from "sonner";
import type { Friend } from "../types/friend";

interface FriendCardProps {
  friend: Friend;
  isOnline?: boolean;
}

export function FriendCard({ friend, isOnline = false }: FriendCardProps) {
  const unfriendMutation = useUnfriend();

  const handleUnfriend = async () => {
    try {
      await unfriendMutation.mutateAsync(friend.id);
      toast.success("Đã hủy kết bạn");
    } catch {
      toast.error("Không thể hủy kết bạn");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg p-3 hover:bg-secondary/50 transition-colors">
      <Link href={`/profile/${friend.username}`} className="flex-shrink-0 relative">
        <Avatar className="h-12 w-12">
          <AvatarImage
            src={getAvatarUrl(friend.avatar)}
            alt={generateAvatarAlt(friend.displayName || friend.username || "Người dùng")}
          />
          <AvatarFallback>
            {getInitials(friend.displayName || friend.username)}
          </AvatarFallback>
        </Avatar>
        {/* Online Status Indicator */}
        <div
          className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
            isOnline ? "bg-green-500" : "bg-gray-400"
          )}
          aria-label={isOnline ? "Đang hoạt động" : "Ngoại tuyến"}
        />
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/profile/${friend.username}`} className="hover:underline">
          <p className="font-medium truncate">
            {friend.displayName || friend.username}
          </p>
        </Link>
        <p className="text-sm text-muted-foreground truncate">
          @{friend.username}
        </p>
        {friend.mutualFriendsCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {friend.mutualFriendsCount} bạn chung
          </p>
        )}
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Tùy chọn</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleUnfriend}
              disabled={unfriendMutation.isPending}
              className="text-destructive focus:text-destructive"
            >
              {unfriendMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <UserX className="h-4 w-4 mr-2" />
              )}
              Hủy kết bạn
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

