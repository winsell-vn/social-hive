"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getInitials } from "@/lib/utils";
import { getAvatarUrl } from "@/lib/image-url";
import {
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useCancelFriendRequest,
} from "../api/friends";
import { toast } from "sonner";
import type { FriendRequest } from "../types/friend";

interface FriendRequestCardProps {
  request: FriendRequest;
  type: "incoming" | "outgoing";
}

export function FriendRequestCard({ request, type }: FriendRequestCardProps) {
  const acceptMutation = useAcceptFriendRequest();
  const rejectMutation = useRejectFriendRequest();
  const cancelMutation = useCancelFriendRequest();

  const user = type === "incoming" ? request.sender : request.receiver;
  const profile = user.profile;
  const displayName = profile?.displayName || profile?.username || "Người dùng";
  const username = profile?.username || "";
  const avatar = profile?.avatar;

  const handleAccept = async () => {
    try {
      await acceptMutation.mutateAsync(request.id);
      toast.success("Đã chấp nhận lời mời kết bạn");
    } catch {
      toast.error("Không thể chấp nhận lời mời");
    }
  };

  const handleReject = async () => {
    try {
      await rejectMutation.mutateAsync(request.id);
      toast.success("Đã từ chối lời mời kết bạn");
    } catch {
      toast.error("Không thể từ chối lời mời");
    }
  };

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync(request.id);
      toast.success("Đã hủy lời mời kết bạn");
    } catch {
      toast.error("Không thể hủy lời mời");
    }
  };

  const isLoading =
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    cancelMutation.isPending;

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
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {type === "incoming" ? (
          <>
            <Button
              onClick={handleAccept}
              disabled={isLoading}
              size="sm"
            >
              {acceptMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Chấp nhận"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleReject}
              disabled={isLoading}
              size="sm"
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Từ chối"
              )}
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
            size="sm"
          >
            {cancelMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <X className="h-4 w-4 mr-1" />
                Hủy
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

