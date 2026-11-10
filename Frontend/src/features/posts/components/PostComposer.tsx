"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImageIcon, X, Loader2, Clock, Keyboard, CheckCircle2, Maximize2, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { EditorSkeleton } from "@/components/loading";
import { getInitials, cn } from "@/lib/utils";
import { generateAvatarAlt } from "@/lib/seo/alt-text";
import { getAvatarUrl } from "@/lib/image-url";
import { uploadImage as uploadImageApi, waitForMediaReady } from "@/lib/upload";
import {
  getTextContent,
  countWords,
  getWordCountColor,
  shouldPulseWordCount,
  isWithinWordLimit,
  POST_WORD_LIMIT,
} from "@/lib/utils/word-count";
import { toast } from "sonner";
import type { CreatePostInput } from "@/types/post";

// Dynamic import RichTextEditor with SSR disabled
const RichTextEditor = dynamic(
  () => import("@/components/editor/RichTextEditor"),
  {
    ssr: false,
    loading: () => <EditorSkeleton minHeight="min-h-[150px]" showToolbar={true} />
  }
);

interface PostComposerProps {
  user: {
    displayName: string;
    avatar: string | null;
  };
  onSubmit: (data: CreatePostInput) => Promise<void>;
  isLoading?: boolean;
}

// Draft auto-save utilities
const DRAFT_KEY_PREFIX = "post-draft-home-";
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface DraftData {
  content: string;
  images: string[];
  timestamp: number;
}

function getDraftKey(userId: string): string {
  return `${DRAFT_KEY_PREFIX}${userId}`;
}

function saveDraft(userId: string, content: string, images: string[]) {
  if (typeof window === "undefined") return;
  const draft: DraftData = {
    content,
    images,
    timestamp: Date.now(),
  };
  localStorage.setItem(getDraftKey(userId), JSON.stringify(draft));
}

function loadDraft(userId: string): DraftData | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(getDraftKey(userId));
    if (!stored) return null;

    const draft: DraftData = JSON.parse(stored);
    const age = Date.now() - draft.timestamp;

    if (age > DRAFT_EXPIRY_MS) {
      clearDraft(userId);
      return null;
    }

    return draft;
  } catch {
    return null;
  }
}

function clearDraft(userId: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getDraftKey(userId));
}

export function PostComposer({ user, onSubmit, isLoading }: PostComposerProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Memoize text content extraction
  const textContent = useMemo(() => getTextContent(content), [content]);
  const wordCount = useMemo(() => countWords(textContent), [textContent]);

  // Generate user ID for draft storage
  const userId = user.displayName || "guest";

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft(userId);
    if (draft && (draft.content || draft.images.length > 0)) {
      setShowDraftBanner(true);
    }
  }, [userId]);

  // Auto-save draft (debounced)
  useEffect(() => {
    if (!content && images.length === 0) return;
    if (!isExpanded) return; // Only save when expanded

    const timeoutId = setTimeout(() => {
      saveDraft(userId, content, images);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [content, images, userId, isExpanded]);

  // Restore draft
  const restoreDraft = useCallback(() => {
    const draft = loadDraft(userId);
    if (draft) {
      setContent(draft.content);
      setImages(draft.images);
      setShowDraftBanner(false);
      setIsExpanded(true);
      toast.success("Đã khôi phục bản nháp");
    }
  }, [userId]);

  // Dismiss draft
  const dismissDraft = useCallback(() => {
    clearDraft(userId);
    setShowDraftBanner(false);
  }, [userId]);

  const handleSubmit = async () => {
    if (!textContent.trim()) {
      toast.error("Vui lòng nhập nội dung bài viết");
      return;
    }

    if (!isWithinWordLimit(wordCount)) {
      toast.error(`Nội dung bài viết không được vượt quá ${POST_WORD_LIMIT} từ`);
      return;
    }

    try {
      await onSubmit({
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
      });

      // Clear draft on successful post
      clearDraft(userId);

      // Show success animation
      setShowSuccessAnimation(true);
      toast.success("Đã đăng bài viết");

      // Reset form
      setTimeout(() => {
        setContent("");
        setImages([]);
        setIsExpanded(false);
        setShowSuccessAnimation(false);
      }, 1000);
    } catch (error) {
      toast.error("Không thể đăng bài viết");
    }
  };

  // Handle Enter key submission
  const handleEnterSubmit = useCallback(() => {
    if (textContent.trim().length > 0 && !isLoading && isWithinWordLimit(wordCount)) {
      handleSubmit();
      return true;
    }
    return false;
  }, [textContent, isLoading, wordCount, handleSubmit]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "/") {
        e.preventDefault();
        setShowKeyboardShortcuts((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isExpanded]);

  // Upload image to server
  const uploadImage = async (file: File): Promise<string> => {
    const result = await uploadImageApi(file);

    if (result.status === "PROCESSING") {
      const finalStatus = await waitForMediaReady(result.id);
      if (finalStatus.status === "READY" && finalStatus.url) {
        return finalStatus.url;
      }
      throw new Error("Xử lý ảnh thất bại");
    }

    if (result.status === "READY" && result.url) {
      return result.url;
    }

    throw new Error("Upload thất bại");
  };

  // Handle image paste
  const handlePasteImage = async (file: File): Promise<string> => {
    setIsUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setImages((prev) => [...prev, url].slice(0, 10));
      toast.success("Đã tải ảnh lên");
      return url;
    } catch (error) {
      toast.error("Không thể tải ảnh lên");
      throw error;
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle image upload from button
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map(uploadImage);
      const uploadedUrls = await Promise.all(uploadPromises);
      setImages((prev) => [...prev, ...uploadedUrls].slice(0, 10));
      toast.success("Đã tải ảnh lên");
    } catch (error) {
      toast.error("Không thể tải ảnh lên");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit = textContent.trim().length > 0 && !isLoading && isWithinWordLimit(wordCount);

  // Word count color and pulse states
  const wordCountColor = getWordCountColor(wordCount);
  const shouldPulse = shouldPulseWordCount(wordCount);

  return (
    <>
      <Card className="mb-6">
        <CardContent className="p-4">
          {/* Draft Recovery Banner */}
          {showDraftBanner && !isExpanded && (
            <div className="mb-4 p-3 rounded-xl border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-100">
                    Bạn có bản nháp chưa hoàn thành
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={restoreDraft}
                  className="h-7 text-xs border-amber-600 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                >
                  Khôi phục
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={dismissDraft}
                  className="h-7 text-xs text-amber-700 dark:text-amber-300"
                >
                  Bỏ qua
                </Button>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Avatar className="h-10 w-10 flex-shrink-0">
              <AvatarImage
                src={getAvatarUrl(user.avatar)}
                alt={generateAvatarAlt(user.displayName || "Người dùng")}
              />
              <AvatarFallback>{getInitials(user.displayName || null)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              {!isExpanded ? (
                <button
                  onClick={() => setIsExpanded(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setIsExpanded(true);
                    }
                  }}
                  className="w-full rounded-full bg-muted px-4 py-2.5 text-left text-muted-foreground hover:bg-muted/80 transition-all duration-200 hover:shadow-sm min-h-[44px]"
                  aria-label="Tạo bài viết mới"
                >
                  Bạn đang nghĩ gì?
                </button>
              ) : (
                <div className="space-y-3">
                  {/* Success Animation Overlay */}
                  {showSuccessAnimation && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
                      <div className="bg-white dark:bg-card rounded-2xl p-8 shadow-2xl animate-in zoom-in duration-300">
                        <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500 mx-auto mb-4 animate-in zoom-in duration-500" />
                        <p className="text-lg font-semibold text-center">Đã đăng bài viết!</p>
                      </div>
                    </div>
                  )}

                  {/* Go to full compose page link - Enhanced visibility */}
                  <div className="mb-2">
                    <button
                      type="button"
                      onClick={() => router.push('/compose')}
                      className="group flex items-center justify-between gap-2 w-full px-3 py-2 rounded-lg bg-primary/5 border border-primary/20 hover:border-primary/40 hover:bg-primary/10 transition-all duration-200 cursor-pointer"
                      aria-label="Chuyển sang trình soạn thảo đầy đủ"
                    >
                      <div className="flex items-center gap-2">
                        <Maximize2 className="h-4 w-4 flex-shrink-0 text-primary" />
                        <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors duration-200">
                          <span className="hidden sm:inline">Cần thêm tính năng? Dùng trình soạn thảo đầy đủ</span>
                          <span className="sm:hidden">Trình soạn thảo đầy đủ</span>
                        </span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-primary/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0" />
                    </button>
                  </div>

                  {/* Rich Text Editor */}
                  <div className="rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
                    <RichTextEditor
                      content={content}
                      onChange={setContent}
                      placeholder="Bạn đang nghĩ gì?"
                      showToolbar={true}
                      minHeight="min-h-[150px]"
                      onPasteImage={handlePasteImage}
                      insertPastedImage={false}
                      onEnterSubmit={handleEnterSubmit}
                    />

                    {/* Image Preview - Responsive Grid */}
                    {images.length > 0 && (
                      <div className="p-3 border-t">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {images.map((image, index) => (
                            <div
                              key={index}
                              className="relative aspect-square group animate-in fade-in zoom-in duration-300"
                            >
                              <Image
                                src={image}
                                alt={`Ảnh đính kèm ${index + 1}`}
                                fill
                                className="rounded-lg object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200 rounded-lg" />
                              <Button
                                type="button"
                                variant="secondary"
                                size="icon"
                                className="absolute right-1 top-1 h-8 w-8 min-h-[44px] min-w-[44px] sm:h-7 sm:w-7 sm:min-h-0 sm:min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 hover:text-white active:scale-95"
                                onClick={() => removeImage(index)}
                              >
                                <X className="h-4 w-4 sm:h-3 sm:w-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions Bar - Responsive */}
                    <div className="p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 border-t bg-muted/30">
                      <div className="flex items-center gap-2 flex-wrap">
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
                            className="min-h-[44px] min-w-[44px] hover:bg-primary/10 active:scale-95 transition-transform duration-150"
                            asChild
                          >
                            <span>
                              {isUploadingImage ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <ImageIcon className="mr-2 h-4 w-4" />
                              )}
                              <span className="hidden sm:inline">Ảnh ({images.length}/10)</span>
                              <span className="sm:hidden">({images.length}/10)</span>
                            </span>
                          </Button>
                        </label>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowKeyboardShortcuts(true)}
                          className="min-h-[44px] min-w-[44px] hover:bg-primary/10 active:scale-95 transition-transform duration-150"
                          title="Phím tắt (Ctrl+/)"
                        >
                          <Keyboard className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Word Count */}
                        <div
                          className={cn(
                            "text-xs sm:text-sm transition-colors duration-200 flex-shrink-0",
                            wordCountColor,
                            shouldPulse && "animate-pulse"
                          )}
                          role="status"
                          aria-live="polite"
                          aria-atomic="true"
                          title={`${wordCount} từ / ${POST_WORD_LIMIT} từ tối đa`}
                        >
                          {wordCount}/{POST_WORD_LIMIT}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsExpanded(false);
                            setContent("");
                            setImages([]);
                          }}
                          className="min-h-[44px] flex-1 sm:flex-none hover:bg-muted active:scale-98 transition-transform duration-150"
                        >
                          Hủy
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSubmit}
                          disabled={!canSubmit}
                          className="min-h-[44px] flex-1 sm:flex-none hover:scale-105 active:scale-95 transition-transform duration-150"
                        >
                          {isLoading && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          )}
                          Đăng
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Modal - Mobile Friendly */}
      {showKeyboardShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200 p-4"
          onClick={() => setShowKeyboardShortcuts(false)}
        >
          <div
            className="bg-white dark:bg-card rounded-2xl p-4 sm:p-6 shadow-2xl max-w-md w-full animate-in zoom-in duration-200 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2">
                <Keyboard className="h-4 w-4 sm:h-5 sm:w-5" />
                Phím tắt
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowKeyboardShortcuts(false)}
                className="h-10 w-10 min-h-[44px] min-w-[44px] sm:h-8 sm:w-8 sm:min-h-0 sm:min-w-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between py-2 border-b gap-4">
                <span className="text-xs sm:text-sm">Đăng bài</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border whitespace-nowrap">Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b gap-4">
                <span className="text-xs sm:text-sm">Xuống dòng</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border whitespace-nowrap">Shift + Enter</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b gap-4">
                <span className="text-xs sm:text-sm">In đậm</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border whitespace-nowrap">Ctrl + B</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b gap-4">
                <span className="text-xs sm:text-sm">In nghiêng</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border whitespace-nowrap">Ctrl + I</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b gap-4">
                <span className="text-xs sm:text-sm">Gạch chân</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border whitespace-nowrap">Ctrl + U</kbd>
              </div>
              <div className="flex items-center justify-between py-2 border-b gap-4">
                <span className="text-xs sm:text-sm">Hiện phím tắt</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted rounded border whitespace-nowrap">Ctrl + /</kbd>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-4 text-center">
              Nhấn ESC hoặc click bên ngoài để đóng
            </p>
          </div>
        </div>
      )}
    </>
  );
}
