"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageSquare, MoreHorizontal, Bookmark, Pencil, Trash2, Flag, EyeOff, Repeat2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShareMenu } from "./ShareMenu";
import { formatRelativeTime, formatNumber, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { processUGCLinks } from "@/lib/seo";
import { generatePostImageAlt, generateAvatarAlt } from "@/lib/seo/alt-text";
import { getAvatarUrl, transformImageUrl } from "@/lib/image-url";
import { useMounted } from "@/hooks/use-mounted";
import type { Post, ReactionType, UserReaction } from "@/types/post";

/** Maximum character length before truncation */
const TRUNCATE_CHAR_LIMIT = 300;

/**
 * Strip HTML tags and get plain text content
 */
function getPlainTextLength(html: string): number {
  if (!html) return 0;
  // Remove HTML tags and decode entities
  const text = html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
  return text.length;
}

interface PostCardProps {
  post: Post;
  userReaction?: UserReaction | null;
  onReact?: (postId: string, reactionType: ReactionType) => void;
  onRemoveReaction?: (postId: string) => void;
  onComment?: (postId: string) => void;
  onEdit?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  /** Show pending badge only when true AND post.status is PENDING.
   * This should only be true when the current user is the post author. */
  showPendingBadge?: boolean;
  /** Current user ID to determine if this is own post */
  currentUserId?: string;
  /** Position in the feed for LCP optimization.
   * First post (index=0) gets priority loading, others get lazy loading. */
  index?: number;
  /** Whether to truncate long content and show "Xem thêm" link.
   * Default: false (show full content). Set to true in feed/list views. */
  truncateContent?: boolean;
}

export function PostCard({
  post,
  userReaction,
  onReact,
  onRemoveReaction,
  onComment,
  onEdit,
  onDelete,
  showPendingBadge = false,
  currentUserId,
  index,
  truncateContent = false,
}: PostCardProps) {
  // LCP optimization: first post (index=0) gets priority loading
  const isFirstPost = index === 0;
  const imageLoading = isFirstPost ? "eager" : "lazy";
  const imageFetchPriority = isFirstPost ? "high" : undefined;
  // Prevent hydration mismatch for dropdown menus
  const mounted = useMounted();

  // Track liked state locally for optimistic updates
  const [isLikedLocal, setIsLikedLocal] = useState(!!userReaction);
  const [likeCountLocal, setLikeCountLocal] = useState(post.likeCount ?? 0);

  useEffect(() => {
    setIsLikedLocal(!!userReaction);
  }, [userReaction]);

  useEffect(() => {
    setLikeCountLocal(post.likeCount ?? 0);
  }, [post.likeCount]);

  // Check if current user is the post author
  const isOwnPost = currentUserId && post.author?.id === currentUserId;

  // Generate SEO-friendly post URL
  const getPostUrl = React.useCallback(() => {
    const username = post.author.profile?.username;
    // Use slug if available, fallback to id
    const postIdentifier = post.slug || post.id;
    return `/profile/${username}/${postIdentifier}`;
  }, [post.author.profile?.username, post.slug, post.id]);

  // Check if content should be truncated (only when truncateContent is enabled and content is long)
  const shouldTruncate = truncateContent && post.content && getPlainTextLength(post.content) > TRUNCATE_CHAR_LIMIT;

  // Parse images - can be string (JSON) or array
  const images = React.useMemo(() => {
    if (!post.images) return [];
    if (Array.isArray(post.images)) return post.images;
    if (typeof post.images === 'string') {
      try {
        const parsed = JSON.parse(post.images);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [post.images]);

  // Parse shared post images
  const sharedPostImages = React.useMemo(() => {
    if (!post.sharedPost?.images) return [];
    if (Array.isArray(post.sharedPost.images)) return post.sharedPost.images;
    if (typeof post.sharedPost.images === 'string') {
      try {
        const parsed = JSON.parse(post.sharedPost.images);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [post.sharedPost?.images]);

  // Check if this is a shared post
  const isSharedPost = !!post.sharedPostId;

  // Get the original post URL for shared posts
  const getOriginalPostUrl = React.useCallback(() => {
    if (!post.sharedPost) return "#";
    const username = post.sharedPost.author?.profile?.username;
    const postIdentifier = post.sharedPost.slug || post.sharedPost.id;
    return `/profile/${username}/${postIdentifier}`;
  }, [post.sharedPost]);

  // Simple like toggle with optimistic update
  const handleLikeClick = () => {
    if (isLikedLocal) {
      // Optimistic update - unlike
      setIsLikedLocal(false);
      setLikeCountLocal(prev => Math.max(0, prev - 1));
      onRemoveReaction?.(post.id);
    } else {
      // Optimistic update - like
      setIsLikedLocal(true);
      setLikeCountLocal(prev => prev + 1);
      onReact?.(post.id, "LIKE");
    }
  };

  // Post options handlers
  const handleEdit = () => {
    if (onEdit) {
      onEdit(post.id);
    } else {
      toast.info("Tính năng chỉnh sửa đang phát triển");
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(post.id);
    } else {
      toast.info("Tính năng xóa đang phát triển");
    }
  };

  const handleReport = () => {
    toast.info("Tính năng báo cáo đang phát triển");
  };

  const handleHide = () => {
    toast.info("Tính năng ẩn bài viết đang phát triển");
  };

  return (
    <Card className="border-border bg-card">
      {/* Pending Status Badge - Only shown to the post author */}
      {showPendingBadge && post.status === 'PENDING' && (
        <div className="px-4 pt-3 pb-0">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-500">
            ⏳ Đang chờ duyệt
          </span>
        </div>
      )}

      {/* Header */}
      <CardHeader className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <Link href={`/profile/${post.author.profile?.username}`} className="shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={getAvatarUrl(post.author.profile?.avatar)}
                alt={generateAvatarAlt(post.author.profile?.displayName || post.author.profile?.username || "Người dùng")}
              />
              <AvatarFallback>
                {getInitials(post.author.profile?.displayName || post.author.profile?.username || "U")}
              </AvatarFallback>
            </Avatar>
          </Link>
          <div className="flex-1 min-w-0">
            <Link
              href={`/profile/${post.author.profile?.username}`}
              className="font-medium text-foreground hover:underline"
            >
              {post.author.profile?.displayName}
            </Link>
            <p className="text-xs text-muted-foreground">
              @{post.author.profile?.username} · {formatRelativeTime(post.createdAt)}
            </p>
          </div>
          {/* Post Options Menu (3-dot button) */}
          {mounted ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {isOwnPost ? (
                  <>
                    <DropdownMenuItem onClick={handleEdit} className="gap-2 cursor-pointer">
                      <Pencil className="h-4 w-4" />
                      <span>Chỉnh sửa</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Xóa bài viết</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <>
                    <DropdownMenuItem onClick={handleReport} className="gap-2 cursor-pointer">
                      <Flag className="h-4 w-4" />
                      <span>Báo cáo</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleHide} className="gap-2 cursor-pointer">
                      <EyeOff className="h-4 w-4" />
                      <span>Ẩn bài viết</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="px-4 pb-3">
        {/* Share caption (content of the sharing post) */}
        {post.content && (
          <>
            <div
              className={cn(
                "text-sm text-foreground leading-relaxed prose prose-sm max-w-none prose-a:text-rose-600 prose-a:underline hover:prose-a:text-rose-700",
                shouldTruncate && "line-clamp-5"
              )}
              dangerouslySetInnerHTML={{
                __html: processUGCLinks(post.content, { trusted: false }),
              }}
            />
            {shouldTruncate && (
              <Link
                href={getPostUrl()}
                className="inline-block mt-1 text-sm font-medium text-rose-600 hover:text-rose-700 dark:text-rose-500 dark:hover:text-rose-400"
              >
                Xem thêm
              </Link>
            )}
          </>
        )}

        {/* Hashtags of the sharing post */}
        {post.hashtags && post.hashtags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {post.hashtags.map((ph) => (
              <Link
                key={ph.hashtag.id}
                href={`/hashtag/${ph.hashtag.name}`}
                className="text-accent hover:underline text-sm"
              >
                #{ph.hashtag.name}
              </Link>
            ))}
          </div>
        )}

        {/* Shared Post Content */}
        {isSharedPost && (
          <div className="mt-3 border border-border rounded-lg overflow-hidden bg-muted/30">
            {post.sharedPost ? (
              <>
                {/* Shared post header */}
                <div className="p-3 flex items-center gap-2">
                  <Repeat2 className="h-4 w-4 text-muted-foreground" />
                  <Link
                    href={`/profile/${post.sharedPost.author?.profile?.username}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    Chia sẻ từ <span className="font-medium text-foreground">@{post.sharedPost.author?.profile?.username}</span>
                  </Link>
                </div>

                {/* Original post content */}
                <Link href={getOriginalPostUrl()} className="block">
                  <div className="px-3 pb-3">
                    {/* Original author info */}
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={getAvatarUrl(post.sharedPost.author?.profile?.avatar)}
                          alt={generateAvatarAlt(post.sharedPost.author?.profile?.displayName || post.sharedPost.author?.profile?.username || "Người dùng")}
                        />
                        <AvatarFallback className="text-xs">
                          {getInitials(post.sharedPost.author?.profile?.displayName || post.sharedPost.author?.profile?.username || "U")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground">
                          {post.sharedPost.author?.profile?.displayName}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatRelativeTime(post.sharedPost.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Original post text */}
                    <div
                      className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none prose-a:text-rose-600 prose-a:underline hover:prose-a:text-rose-700"
                      dangerouslySetInnerHTML={{
                        __html: processUGCLinks(post.sharedPost.content, { trusted: false }),
                      }}
                    />

                    {/* Original post hashtags */}
                    {post.sharedPost.hashtags && post.sharedPost.hashtags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {post.sharedPost.hashtags.map((ph) => (
                          <span
                            key={ph.hashtag.id}
                            className="text-accent text-sm"
                          >
                            #{ph.hashtag.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Original post images */}
                    {sharedPostImages.length > 0 && (
                      <div
                        className={cn(
                          "mt-3 grid gap-0.5 overflow-hidden rounded-md",
                          sharedPostImages.length === 1 && "grid-cols-1",
                          sharedPostImages.length === 2 && "grid-cols-2",
                          sharedPostImages.length >= 3 && "grid-cols-2",
                        )}
                      >
                        {sharedPostImages.slice(0, 4).map((image, imgIndex) => (
                          <div
                            key={imgIndex}
                            className={cn(
                              "relative aspect-square overflow-hidden bg-secondary",
                              sharedPostImages.length === 3 && imgIndex === 0 && "row-span-2",
                            )}
                          >
                            <Image
                              src={transformImageUrl(image) || image}
                              alt={generatePostImageAlt({
                                index: imgIndex + 1,
                                authorName: post.sharedPost?.author?.profile?.displayName || "Người dùng",
                                postTitle: post.sharedPost?.content?.replace(/<[^>]*>/g, '').substring(0, 50),
                              })}
                              fill
                              className="object-cover"
                              sizes="(max-width: 672px) 100vw, 672px"
                              priority={isFirstPost && imgIndex === 0}
                              loading={isFirstPost && imgIndex === 0 ? undefined : "lazy"}
                            />
                            {imgIndex === 3 && sharedPostImages.length > 4 && (
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white text-xl font-bold">
                                  +{sharedPostImages.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              </>
            ) : (
              /* Original post was deleted */
              <div className="p-4 text-center text-muted-foreground">
                <p className="text-sm">Bài viết gốc đã bị xóa hoặc không còn tồn tại</p>
              </div>
            )}
          </div>
        )}

        {/* Images of the sharing post (only show if not a shared post) */}
        {!isSharedPost && images.length > 0 && (
          <div
            className={cn(
              "mt-3 grid gap-0.5 overflow-hidden",
              images.length === 1 && "grid-cols-1",
              images.length === 2 && "grid-cols-2",
              images.length >= 3 && "grid-cols-2",
            )}
          >
            {images.slice(0, 4).map((image, imgIndex) => (
              <div
                key={imgIndex}
                className={cn(
                  "relative aspect-square overflow-hidden bg-secondary",
                  images.length === 3 && imgIndex === 0 && "row-span-2",
                )}
              >
                <Image
                  src={transformImageUrl(image) || image}
                  alt={generatePostImageAlt({
                    index: imgIndex + 1,
                    authorName: post.author.profile?.displayName || "Người dùng",
                    postTitle: post.content?.replace(/<[^>]*>/g, '').substring(0, 50),
                  })}
                  fill
                  className="object-cover"
                  sizes="(max-width: 672px) 100vw, 672px"
                  priority={isFirstPost && imgIndex === 0}
                  loading={isFirstPost && imgIndex === 0 ? undefined : "lazy"}
                />
                {imgIndex === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      +{images.length - 4}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Stats */}
      <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatNumber(likeCountLocal)} likes</span>
        <div className="flex gap-3">
          <span>
            {formatNumber(post._count?.comments ?? post.commentCount ?? 0)} comments
          </span>
          <span>{formatNumber(post.shareCount ?? 0)} shares</span>
        </div>
      </div>

      {/* Actions */}
      <CardFooter className="p-0 border-t border-border">
        <div className="flex w-full">
          {/* Like Button - Simple toggle with visual feedback */}
          <Button
            variant="ghost"
            className={cn(
              "flex-1 h-11 gap-2 text-muted-foreground hover:text-foreground",
              isLikedLocal && "text-red-500 hover:text-red-600",
            )}
            onClick={handleLikeClick}
          >
            <Heart className={cn("h-4 w-4", isLikedLocal && "fill-current")} />
            <span className="text-sm">{isLikedLocal ? "Đã thích" : "Thích"}</span>
          </Button>

          {/* Comment Button */}
          <Button
            variant="ghost"
            className="flex-1 h-11 gap-2 text-muted-foreground hover:text-foreground"
            onClick={() => onComment?.(post.id)}
          >
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm">Bình luận</span>
          </Button>

          {/* Share Button - share the original post if this is a shared post */}
          <ShareMenu
            postId={isSharedPost && post.sharedPost ? post.sharedPost.id : post.id}
            postUrl={typeof window !== "undefined" ? `${window.location.origin}${getPostUrl()}` : ""}
            postTitle={post.content?.slice(0, 100) || post.sharedPost?.content?.slice(0, 100) || ""}
          />
        </div>
      </CardFooter>
    </Card>
  );
}
