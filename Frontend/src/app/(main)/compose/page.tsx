'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { ImageIcon, X, Loader2, Clock, Keyboard, CheckCircle2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { EditorSkeleton } from '@/components/loading';
import { useCreatePost, useUserPostsWithStatus } from '@/features/posts';
import { useAuth } from '@/features/auth';
import { uploadImage as uploadImageApi, waitForMediaReady } from '@/lib/upload';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { transformImageUrl } from '@/lib/image-url';
import {
  getTextContent,
  countWords,
  getWordCountColor,
  shouldPulseWordCount,
  isWithinWordLimit,
  POST_WORD_LIMIT,
} from '@/lib/utils/word-count';
import type { Post } from '@/types/post';

// Dynamic import RichTextEditor with SSR disabled (TipTap doesn't support SSR)
const RichTextEditor = dynamic(
  () => import('@/components/editor/RichTextEditor'),
  {
    ssr: false,
    loading: () => <EditorSkeleton minHeight="min-h-[300px]" showToolbar={true} />
  }
);

// Draft auto-save utilities
const DRAFT_KEY_PREFIX = 'post-draft-';
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface DraftData {
  content: string;
  images: string[];
  timestamp: number;
}

function getDraftKey(userId: string | undefined): string {
  return `${DRAFT_KEY_PREFIX}${userId || 'guest'}`;
}

function saveDraft(userId: string | undefined, content: string, images: string[]) {
  if (typeof window === 'undefined') return;
  const draft: DraftData = {
    content,
    images,
    timestamp: Date.now(),
  };
  localStorage.setItem(getDraftKey(userId), JSON.stringify(draft));
}

function loadDraft(userId: string | undefined): DraftData | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(getDraftKey(userId));
    if (!stored) return null;

    const draft: DraftData = JSON.parse(stored);
    const age = Date.now() - draft.timestamp;

    // Expire drafts older than 24 hours
    if (age > DRAFT_EXPIRY_MS) {
      clearDraft(userId);
      return null;
    }

    return draft;
  } catch {
    return null;
  }
}

function clearDraft(userId: string | undefined) {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(getDraftKey(userId));
}

export default function ComposePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showDraftBanner, setShowDraftBanner] = useState(false);
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const createPost = useCreatePost();

  // Fetch user's pending posts
  const username = user?.profile?.username || '';
  const {
    data: pendingPostsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useUserPostsWithStatus(username, 'PENDING', 10);

  const pendingPosts = pendingPostsData?.pages.flatMap(page => page.data) || [];

  // Memoize text content extraction to avoid unnecessary recalculations
  const textContent = useMemo(() => getTextContent(content), [content]);
  const wordCount = useMemo(() => countWords(textContent), [textContent]);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft(user?.id);
    if (draft && (draft.content || draft.images.length > 0)) {
      setShowDraftBanner(true);
    }
  }, [user?.id]);

  // Auto-save draft (debounced)
  useEffect(() => {
    if (!content && images.length === 0) return;

    const timeoutId = setTimeout(() => {
      saveDraft(user?.id, content, images);
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [content, images, user?.id]);

  // Restore draft
  const restoreDraft = useCallback(() => {
    const draft = loadDraft(user?.id);
    if (draft) {
      setContent(draft.content);
      setImages(draft.images);
      setShowDraftBanner(false);
      toast.success('Đã khôi phục bản nháp');
    }
  }, [user?.id]);

  // Dismiss draft
  const dismissDraft = useCallback(() => {
    clearDraft(user?.id);
    setShowDraftBanner(false);
  }, [user?.id]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!textContent.trim()) {
      toast.error('Vui lòng nhập nội dung bài viết');
      return;
    }

    if (!isWithinWordLimit(wordCount)) {
      toast.error(`Nội dung bài viết không được vượt quá ${POST_WORD_LIMIT} từ`);
      return;
    }

    try {
      await createPost.mutateAsync({
        content: content.trim(),
        images: images.length > 0 ? images : undefined,
      });

      // Clear draft on successful post
      clearDraft(user?.id);

      // Show success animation
      setShowSuccessAnimation(true);
      toast.success('Đã đăng bài viết');

      // Wait for animation then redirect
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (error) {
      toast.error('Không thể đăng bài viết');
    }
  };

  // Handle Enter key submission
  const handleEnterSubmit = useCallback(() => {
    if (textContent.trim().length > 0 && !createPost.isPending && isWithinWordLimit(wordCount)) {
      handleSubmit();
      return true; // Prevent default
    }
    return false;
  }, [textContent, createPost.isPending, wordCount, handleSubmit]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+/ or Cmd+/ to show shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault();
        setShowKeyboardShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Upload image to server using new upload API
  const uploadImage = async (file: File): Promise<string> => {
    const result = await uploadImageApi(file);

    // If async processing, poll for completion
    if (result.status === 'PROCESSING') {
      const finalStatus = await waitForMediaReady(result.id);
      if (finalStatus.status === 'READY' && finalStatus.url) {
        return finalStatus.url;
      }
      throw new Error('Xử lý ảnh thất bại');
    }

    // Sync processing completed
    if (result.status === 'READY' && result.url) {
      return result.url;
    }

    throw new Error('Upload thất bại');
  };

  // Handle image upload (paste or toolbar)
  const handlePasteImage = async (file: File): Promise<string> => {
    setIsUploadingImage(true);
    try {
      const url = await uploadImage(file);
      setImages(prev => [...prev, url].slice(0, 10));
      toast.success('Đã tải ảnh lên');
      return url;
    } catch (error) {
      toast.error('Không thể tải ảnh lên');
      throw error;
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
      setImages(prev => [...prev, ...uploadedUrls].slice(0, 10));
      toast.success('Đã tải ảnh lên');
    } catch (error) {
      toast.error('Không thể tải ảnh lên');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const canSubmit = textContent.trim().length > 0 && !createPost.isPending && isWithinWordLimit(wordCount);

  // Word count color and pulse states
  const wordCountColor = getWordCountColor(wordCount);
  const shouldPulse = shouldPulseWordCount(wordCount);

  // Truncate content for preview
  const truncateContent = (html: string, maxLength: number = 100) => {
    const text = getTextContent(html);
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="mx-auto max-w-3xl pb-24 md:pb-0 px-4 sm:px-0">
      <h1 className="mb-6 text-xl sm:text-2xl font-bold">Tạo bài viết mới</h1>

      {/* Draft Recovery Banner */}
      {showDraftBanner && (
        <div className="mb-4 p-3 sm:p-4 rounded-xl border border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-100">
                Bạn có bản nháp chưa hoàn thành
              </p>
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Khôi phục để tiếp tục viết
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={restoreDraft}
              className="flex-1 sm:flex-none min-h-[44px] border-amber-600 text-amber-900 dark:text-amber-100 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              Khôi phục
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={dismissDraft}
              className="flex-1 sm:flex-none min-h-[44px] text-amber-700 dark:text-amber-300"
            >
              Bỏ qua
            </Button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 relative">
        {/* Success Animation Overlay */}
        {showSuccessAnimation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-card rounded-2xl p-8 shadow-2xl animate-in zoom-in duration-300">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-500 mx-auto mb-4 animate-in zoom-in duration-500" />
              <p className="text-lg font-semibold text-center">Đã đăng bài viết!</p>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
          {/* Rich Text Editor */}
          <RichTextEditor
            content={content}
            onChange={setContent}
            placeholder="Bạn đang nghĩ gì?"
            showToolbar={true}
            minHeight="min-h-[300px]"
            onPasteImage={handlePasteImage}
            insertPastedImage={false}
            onEnterSubmit={handleEnterSubmit}
          />

          {/* Image Preview - Responsive Grid */}
          {images.length > 0 && (
            <div className="p-3 sm:p-4 border-t">
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
                      className="absolute right-1 top-1 sm:right-2 sm:top-2 h-8 w-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600 hover:text-white active:scale-95"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions Bar - Desktop */}
          <div className="hidden md:flex p-4 items-center justify-between border-t bg-muted/30">
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
                    Thêm ảnh ({images.length}/10)
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

            <div className="flex items-center gap-3">
              {/* Word Count with ARIA live region */}
              <div
                className={cn(
                  'text-sm transition-colors duration-200',
                  wordCountColor,
                  shouldPulse && 'animate-pulse'
                )}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                title={`${wordCount} từ / ${POST_WORD_LIMIT} từ tối đa`}
              >
                {wordCount}/{POST_WORD_LIMIT} từ
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="min-h-[44px] hover:bg-muted active:scale-98 transition-transform duration-150"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="min-h-[44px] hover:scale-105 active:scale-95 transition-transform duration-150"
              >
                {createPost.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Đăng bài
              </Button>
            </div>
          </div>

          {/* Actions Bar - Mobile (Sticky) */}
          <div className="md:hidden p-3 border-t bg-muted/30">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="cursor-pointer flex-1">
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
                  className="w-full min-h-[44px] hover:bg-primary/10 active:scale-95 transition-transform duration-150"
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

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyboardShortcuts(true)}
                className="min-h-[44px] min-w-[44px] hover:bg-primary/10 active:scale-95 transition-transform duration-150"
                title="Phím tắt"
              >
                <Keyboard className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <div
                className={cn(
                  'text-xs transition-colors duration-200 flex-shrink-0',
                  wordCountColor,
                  shouldPulse && 'animate-pulse'
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
                onClick={() => router.back()}
                className="flex-1 min-h-[44px] hover:bg-muted active:scale-98 transition-transform duration-150"
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit}
                className="flex-1 min-h-[44px] hover:scale-105 active:scale-95 transition-transform duration-150"
              >
                {createPost.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Đăng
              </Button>
            </div>
          </div>
        </div>
      </form>

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

      {/* Pending Posts Section */}
      {username && pendingPosts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Bài viết đang chờ duyệt ({pendingPosts.length})
          </h2>

          <div className="space-y-3">
            {pendingPosts.map((post: Post) => (
              <div
                key={post.id}
                className="p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground line-clamp-2">
                      {truncateContent(post.content, 150)}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(post.createdAt), {
                          addSuffix: true,
                          locale: vi
                        })}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        ⏳ Đang chờ duyệt
                      </span>
                    </div>
                  </div>
                  {post.images && post.images.length > 0 && (
                    <div className="flex-shrink-0 w-16 h-16 relative rounded-lg overflow-hidden">
                      <Image
                        src={transformImageUrl(post.images[0]) || post.images[0]}
                        alt="Ảnh bài viết"
                        fill
                        className="object-cover"
                      />
                      {post.images.length > 1 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-xs font-medium">
                            +{post.images.length - 1}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {hasNextPage && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="hover:scale-105 active:scale-95 transition-transform duration-150"
              >
                {isFetchingNextPage ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Xem thêm
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Empty state for pending posts */}
      {username && pendingPosts.length === 0 && (
        <div className="mt-8 p-6 rounded-xl border bg-card text-center">
          <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-muted-foreground">Không có bài viết đang chờ duyệt</p>
        </div>
      )}
    </div>
  );
}

