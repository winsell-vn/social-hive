"use client";

import * as React from "react";
import Link from "next/link";
import { UserPlus, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/image-url";
import { useSendFriendRequest } from "../api/friends";
import { toast } from "sonner";
import type { FriendSuggestion } from "../types/friend";

interface FriendSuggestionCardProps {
  suggestion: FriendSuggestion;
}

export function FriendSuggestionCard({ suggestion }: FriendSuggestionCardProps) {
  const sendRequestMutation = useSendFriendRequest();
  const [requestSent, setRequestSent] = React.useState(false);

  const profile = suggestion.profile;
  const displayName = profile?.displayName || profile?.username || "Người dùng";
  const username = profile?.username || "";
  const avatar = profile?.avatar;

  const handleAddFriend = async () => {
    try {
      await sendRequestMutation.mutateAsync(suggestion.id);
      setRequestSent(true);
      toast.success("Đã gửi lời mời kết bạn");
    } catch {
      toast.error("Không thể gửi lời mời kết bạn");
    }
  };

  return (
    <div className="flex items-center gap-3 rounded-lg p-3 hover:bg-secondary/50 transition-colors">
      <Link href={`/profile/${username}`} className="flex-shrink-0">
        <Avatar className="h-12 w-12">
          <AvatarImage src={getAvatarUrl(avatar)} alt={displayName} />
          <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
        </Avatar>
      </Link>

      <div className="flex-1 min-w-0">
        <Link href={`/profile/${username}`} className="hover:underline">
          <p className="font-medium truncate">{displayName}</p>
        </Link>
        <p className="text-sm text-muted-foreground truncate">@{username}</p>
        {suggestion.mutualFriendsCount > 0 && (
          <p className="text-xs text-muted-foreground">
            {suggestion.mutualFriendsCount} bạn chung
          </p>
        )}
      </div>

      <div className="flex-shrink-0">
        <Button
          variant="secondary"
          onClick={handleAddFriend}
          disabled={sendRequestMutation.isPending || requestSent}
          size="sm"
        >
          {sendRequestMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : requestSent ? (
            "Đã gửi"
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-1" />
              Kết bạn
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

