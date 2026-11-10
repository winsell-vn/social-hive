"use client";

import * as React from "react";
import { UserPlus, UserMinus, UserCheck, Clock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useFriendshipStatus,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useCancelFriendRequest,
  useUnfriend,
} from "../api/friends";
import { toast } from "sonner";

interface FriendButtonProps {
  userId: string;
  size?: "default" | "sm" | "lg" | "icon";
}

export function FriendButton({ userId, size = "default" }: FriendButtonProps) {
  const { data: status, isLoading: isLoadingStatus } = useFriendshipStatus(userId);
  const sendRequest = useSendFriendRequest();
  const acceptRequest = useAcceptFriendRequest();
  const cancelRequest = useCancelFriendRequest();
  const unfriend = useUnfriend();

  const isLoading =
    isLoadingStatus ||
    sendRequest.isPending ||
    acceptRequest.isPending ||
    cancelRequest.isPending ||
    unfriend.isPending;

  const handleSendRequest = async () => {
    try {
      await sendRequest.mutateAsync(userId);
      toast.success("Đã gửi lời mời kết bạn");
    } catch {
      toast.error("Không thể gửi lời mời kết bạn");
    }
  };

  const handleAcceptRequest = async () => {
    if (!status?.requestId) return;
    try {
      await acceptRequest.mutateAsync(status.requestId);
      toast.success("Đã chấp nhận lời mời kết bạn");
    } catch {
      toast.error("Không thể chấp nhận lời mời");
    }
  };

  const handleCancelRequest = async () => {
    if (!status?.requestId) return;
    try {
      await cancelRequest.mutateAsync(status.requestId);
      toast.success("Đã hủy lời mời kết bạn");
    } catch {
      toast.error("Không thể hủy lời mời");
    }
  };

  const handleUnfriend = async () => {
    try {
      await unfriend.mutateAsync(userId);
      toast.success("Đã hủy kết bạn");
    } catch {
      toast.error("Không thể hủy kết bạn");
    }
  };

  if (isLoadingStatus) {
    return (
      <Button variant="outline" size={size} disabled>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }

  // No relationship - show add friend button
  if (!status || status.status === "NONE") {
    return (
      <Button
        variant="secondary"
        size={size}
        onClick={handleSendRequest}
        disabled={isLoading}
      >
        {sendRequest.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <UserPlus className="h-4 w-4 mr-2" />
            Kết bạn
          </>
        )}
      </Button>
    );
  }

  // Pending sent - show cancel option
  if (status.status === "PENDING_SENT") {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={handleCancelRequest}
        disabled={isLoading}
      >
        {cancelRequest.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Clock className="h-4 w-4 mr-2" />
            Đã gửi lời mời
          </>
        )}
      </Button>
    );
  }

  // Pending received - show accept button
  if (status.status === "PENDING_RECEIVED") {
    return (
      <Button
        variant="default"
        size={size}
        onClick={handleAcceptRequest}
        disabled={isLoading}
      >
        {acceptRequest.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <UserCheck className="h-4 w-4 mr-2" />
            Chấp nhận
          </>
        )}
      </Button>
    );
  }

  // Already friends - show dropdown with unfriend option
  if (status.status === "FRIENDS") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size={size} disabled={isLoading}>
            {unfriend.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-2" />
                Bạn bè
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={handleUnfriend}
            className="text-destructive focus:text-destructive"
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Hủy kết bạn
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return null;
}

