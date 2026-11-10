"use client";

import * as React from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useDeletePost } from "../api/posts";
import { toast } from "sonner";

interface DeletePostDialogProps {
  postId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeletePostDialog({ postId, isOpen, onClose }: DeletePostDialogProps) {
  const deletePost = useDeletePost();

  const handleDelete = async () => {
    if (!postId) return;

    try {
      await deletePost.mutateAsync(postId);
      toast.success("Đã xóa bài viết");
      onClose();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError?.response?.data?.message || "Không thể xóa bài viết";
      toast.error(message);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Xóa bài viết
          </DialogTitle>
          <DialogDescription>
            Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={deletePost.isPending}
          >
            Hủy
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deletePost.isPending}
          >
            {deletePost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xóa bài viết
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
