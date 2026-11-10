"use client";

import { Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FriendCard } from "./FriendCard";
import { useFriends } from "../api/friends";

interface FriendsListProps {
  search?: string;
  enabled?: boolean;
}

export function FriendsList({ search, enabled = true }: FriendsListProps) {
  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useFriends(search, 20, { enabled });

  const friends = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">Chưa có bạn bè</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {search
            ? "Không tìm thấy bạn bè phù hợp"
            : "Hãy kết bạn với những người khác để bắt đầu"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {friends.map((friend) => (
        <FriendCard key={friend.id} friend={friend} />
      ))}

      {hasNextPage && (
        <div className="flex justify-center pt-4">
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

