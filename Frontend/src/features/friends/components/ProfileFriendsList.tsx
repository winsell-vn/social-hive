"use client";

import Link from "next/link";
import { Users, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials } from "@/lib/utils";
import { generateAvatarAlt } from "@/lib/seo/alt-text";
import { getAvatarUrl } from "@/lib/image-url";
import { useUserFriends } from "../api/friends";

interface ProfileFriendsListProps {
  userId: string;
}

export function ProfileFriendsList({ userId }: ProfileFriendsListProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useUserFriends(userId);

  const friends = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center p-4 rounded-lg border">
            <Skeleton className="h-16 w-16 rounded-full mb-2" />
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Chưa có bạn bè nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {friends.map((friend) => (
          <Link
            key={friend.id}
            href={`/profile/${friend.username}`}
            className="flex flex-col items-center p-4 rounded-lg border hover:bg-secondary/50 transition-colors"
          >
            <div className="relative mb-2">
              <Avatar className="h-16 w-16">
                <AvatarImage
                  src={getAvatarUrl(friend.avatar)}
                  alt={generateAvatarAlt(friend.displayName || friend.username || "Người dùng")}
                />
                <AvatarFallback>
                  {getInitials(friend.displayName || friend.username)}
                </AvatarFallback>
              </Avatar>
            </div>
            <p className="font-medium text-sm truncate max-w-full">
              {friend.displayName || friend.username}
            </p>
            <p className="text-xs text-muted-foreground truncate max-w-full">
              @{friend.username}
            </p>
            {friend.mutualFriendsCount > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {friend.mutualFriendsCount} bạn chung
              </p>
            )}
          </Link>
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Đang tải...
              </>
            ) : (
              "Xem thêm"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

