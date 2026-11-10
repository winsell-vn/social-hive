"use client";

import * as React from "react";
import { useState } from "react";
import { Share2, Link2, Facebook, Twitter, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/use-mounted";
import { useSharePost } from "../api/posts";

interface ShareMenuProps {
  postId: string;
  postUrl: string;
  postTitle?: string;
  className?: string;
}

export function ShareMenu({ postId, postUrl, postTitle = "", className }: ShareMenuProps) {
  // Prevent hydration mismatch: Radix UI generates random IDs that differ between SSR and client
  const mounted = useMounted();
  const [isSharing, setIsSharing] = useState(false);

  const sharePostMutation = useSharePost();

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      toast.success("Đã sao chép liên kết!");
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = postUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Đã sao chép liên kết!");
    }
  };

  const handleShareToProfile = async () => {
    if (isSharing) return;

    setIsSharing(true);
    try {
      await sharePostMutation.mutateAsync({ postId });
      toast.success("Đã chia sẻ bài viết về trang cá nhân!");
    } catch (error: any) {
      const status = error.response?.status;
      const message = error.response?.data?.message || "";

      if (status === 400 && (message.includes("own post") || message.includes("chính mình"))) {
        toast.error("Bạn không thể chia sẻ bài viết của chính mình");
      } else if (status === 404) {
        toast.error("Bài viết không tồn tại hoặc đã bị xóa");
      } else if (status === 409) {
        toast.error("Bạn đã chia sẻ bài viết này rồi");
      } else if (status === 401) {
        toast.error("Vui lòng đăng nhập để chia sẻ bài viết");
      } else {
        toast.error("Có lỗi xảy ra khi chia sẻ. Vui lòng thử lại.");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleShareTwitter = () => {
    const text = postTitle || "Xem bài viết này";
    const url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  // Return placeholder button during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button
        variant="ghost"
        className={cn(
          "flex-1 h-11 gap-2 text-muted-foreground hover:text-foreground",
          className
        )}
      >
        <Share2 className="h-4 w-4" />
        <span className="text-sm">Chia sẻ</span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "flex-1 h-11 gap-2 text-muted-foreground hover:text-foreground",
            className
          )}
        >
          <Share2 className="h-4 w-4" />
          <span className="text-sm">Chia sẻ</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-56">
        <DropdownMenuItem onClick={handleCopyLink} className="gap-2 cursor-pointer">
          <Link2 className="h-4 w-4" />
          <span>Sao chép liên kết</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleShareToProfile}
          className="gap-2 cursor-pointer"
          disabled={isSharing}
        >
          <UserCircle className="h-4 w-4" />
          <span>{isSharing ? "Đang chia sẻ..." : "Chia sẻ về trang cá nhân"}</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleShareFacebook} className="gap-2 cursor-pointer">
          <Facebook className="h-4 w-4" />
          <span>Chia sẻ lên Facebook</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShareTwitter} className="gap-2 cursor-pointer">
          <Twitter className="h-4 w-4" />
          <span>Chia sẻ lên Twitter</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

