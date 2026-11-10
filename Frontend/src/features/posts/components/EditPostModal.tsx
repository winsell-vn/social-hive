"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { ImageIcon, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { EditorSkeleton } from "@/components/loading";
import { usePost, useUpdatePost } from "../api/posts";
import { uploadImage as uploadImageApi, waitForMediaReady } from "@/lib/upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const RichTextEditor = dynamic(
  () => import("@/components/editor/RichTextEditor"),
  { ssr: false, loading: () => <EditorSkeleton minHeight="min-h-[150px]" showToolbar={true} /> }
);

interface EditPostModalProps {
  postId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

function getTextContent(html: string): string {
  if (typeof window === "undefined") return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

function parseImages(images: string[] | string | null | undefined): string[] {
  if (!images) return [];
  if (Array.isArray(images)) return images;
  if (typeof images === "string") {
    try {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

export function EditPostModal({ postId, isOpen, onClose }: EditPostModalProps) {
  const { data: post, isLoading: isLoadingPost } = usePost(postId || "");
  const updatePost = useUpdatePost();

  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize form when post data loads
  useEffect(() => {
    if (post && isOpen && !initialized) {
      setContent(post.content || "");
      setImages(parseImages(post.images));
      setInitialized(true);
    }
  }, [post, isOpen, initialized]);

  // Reset when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInitialized(false);
      setContent("");
      setImages([]);
    }
  }, [isOpen]);

  const textContent = getTextContent(content);
  const characterCount = textContent.length;

  const uploadImage = async (file: File): Promise<string> => {
    const result = await uploadImageApi(file);
    if (result.status === "PROCESSING") {
      const finalStatus = await waitForMediaReady(result.id);
      if (finalStatus.status === "READY" && finalStatus.url) return finalStatus.url;
      throw new Error("Xử lý ảnh thất bại");
    }
    if (result.status === "READY" && result.url) return result.url;
    throw new Error("Upload thất bại");
  };

  const handlePasteImage = async (file: File): Promise<string> => {
    setIsUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setImages((prev) => [...prev, url].slice(0, 10));
      toast.success("Đã tải ảnh lên");
      return url;
    } catch {
      toast.error("Không thể tải ảnh lên");
      throw new Error("Upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map(uploadImage);
      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls].slice(0, 10));
      toast.success("Đã tải ảnh lên");
    } catch {
      toast.error("Không thể tải ảnh lên");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!postId || !textContent.trim()) {
      toast.error("Vui lòng nhập nội dung bài viết");
      return;
    }
    if (characterCount > 5000) {
      toast.error("Nội dung bài viết không được vượt quá 5000 ký tự");
      return;
    }
    try {
      await updatePost.mutateAsync({
        id: postId,
        data: { content: content.trim(), images: images.length > 0 ? images : [] },
      });
      toast.success("Đã cập nhật bài viết");
      onClose();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      const message = axiosError?.response?.data?.message || "Không thể cập nhật bài viết";
      toast.error(message);
    }
  };

  const canSubmit = textContent.trim().length > 0 && !updatePost.isPending && characterCount <= 5000;
  const isLoading = isLoadingPost || !initialized;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa bài viết</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8">
            <EditorSkeleton minHeight="min-h-[150px]" showToolbar={true} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl border bg-card overflow-hidden">
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Nội dung bài viết..."
                showToolbar={true}
                minHeight="min-h-[150px]"
                onPasteImage={handlePasteImage}
                insertPastedImage={false}
              />

              {images.length > 0 && (
                <div className="p-3 border-t">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {images.map((image, index) => (
                      <div key={index} className="relative aspect-square group">
                        <Image
                          src={image}
                          alt={`Ảnh ${index + 1}`}
                          fill
                          className="rounded-lg object-cover"
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="absolute right-1 top-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 hover:text-white"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-3 flex items-center justify-between border-t bg-muted/30">
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleImageUpload}
                      disabled={images.length >= 10 || isUploadingImage}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={images.length >= 10 || isUploadingImage}
                      asChild
                    >
                      <span>
                        {isUploadingImage ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ImageIcon className="mr-2 h-4 w-4" />
                        )}
                        Ảnh ({images.length}/10)
                      </span>
                    </Button>
                  </label>
                </div>
                <span className={cn(
                  "text-sm",
                  characterCount > 5000 ? "text-red-600 font-bold" :
                  characterCount > 4500 ? "text-amber-600" : "text-muted-foreground"
                )}>
                  {characterCount}/5000
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={updatePost.isPending}>
                Hủy
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
                {updatePost.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Lưu thay đổi
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
