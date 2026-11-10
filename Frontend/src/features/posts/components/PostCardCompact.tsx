"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, MessageSquare, Calendar, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatRelativeTime, formatNumber, cn } from "@/lib/utils";
import { transformImageUrl } from "@/lib/image-url";
import { useMounted } from "@/hooks/use-mounted";
import type { Post, ReactionType } from "@/types/post";

interface PostCardCompactProps {
  post: Post;
  index: number;
  userReaction?: ReactionType | null;
  showPendingBadge?: boolean;
  /** Current user ID to determine if this is own post */
  currentUserId?: string;
  /** Callback when edit is clicked */
  onEdit?: (postId: string) => void;
  /** Callback when delete is clicked */
  onDelete?: (postId: string) => void;
}

// Extract title from post content (first line or heading)
function extractTitle(content: string): string {
  if (!content) return "Bài viết";
  
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  
  // Try to find first heading pattern (# ...)
  const headingMatch = text.match(/^#\s*(.+?)(?:\n|$)/);
  if (headingMatch) return headingMatch[1].slice(0, 80);
  
  // Get first line or first 80 chars
  const firstLine = text.split(/[\n\r]/)[0];
  return firstLine.length > 80 ? firstLine.slice(0, 77) + "..." : firstLine;
}

// Extract excerpt from content (skip title)
function extractExcerpt(content: string): string {
  if (!content) return "";
  
  const text = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const title = extractTitle(content);
  
  // Remove title from beginning if present
  let excerpt = text.startsWith(title) ? text.slice(title.length).trim() : text;
  
  // Remove leading punctuation
  excerpt = excerpt.replace(/^[#\-*•:]+\s*/, "");
  
  return excerpt.length > 120 ? excerpt.slice(0, 117) + "..." : excerpt;
}

// Generate gradient based on post id for posts without images
function getGradientFromId(id: string): string {
  const gradients = [
    "from-blue-500 to-purple-600",
    "from-green-400 to-cyan-500",
    "from-orange-400 to-pink-500",
    "from-indigo-500 to-blue-600",
    "from-rose-400 to-orange-500",
    "from-teal-400 to-emerald-500",
    "from-violet-500 to-purple-600",
    "from-amber-400 to-orange-500",
  ];
  
  // Simple hash from id
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  
  return gradients[Math.abs(hash) % gradients.length];
}

// Parse images from post
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

export function PostCardCompact({
  post,
  index,
  userReaction,
  showPendingBadge = false,
  currentUserId,
  onEdit,
  onDelete,
}: PostCardCompactProps) {
  // Prevent hydration mismatch for dropdown menus
  const mounted = useMounted();

  const images = parseImages(post.images);
  const hasImage = images.length > 0;
  const title = extractTitle(post.content);
  const excerpt = extractExcerpt(post.content);
  const authorUsername = post.author?.profile?.username || 'unknown';
  const postUrl = `/profile/${authorUsername}/${post.slug || post.id}`;
  const isLiked = !!userReaction;
  const firstImageUrl = hasImage ? transformImageUrl(images[0]) : null;

  // Check if current user is the post author
  const isOwnPost = currentUserId && post.author?.id === currentUserId;

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onEdit?.(post.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete?.(post.id);
  };

  return (
    <Link href={postUrl} className="block group">
      <Card className="overflow-hidden border-border bg-card transition-all duration-200 hover:border-primary/50 hover:shadow-md h-full">
        {/* Cover Image */}
        <div className="relative aspect-video overflow-hidden bg-secondary">
          {firstImageUrl ? (
            <Image
              src={firstImageUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              loading={index < 6 ? "eager" : "lazy"}
            />
          ) : (
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br opacity-80",
              getGradientFromId(post.id)
            )} />
          )}

          {/* Pending Badge */}
          {showPendingBadge && post.status === "PENDING" && (
            <div className="absolute top-2 left-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                ⏳ Chờ duyệt
              </span>
            </div>
          )}

          {/* 3-dot menu for own posts */}
          {mounted && isOwnPost && (onEdit || onDelete) && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-7 w-7 bg-white/90 dark:bg-gray-900/90 hover:bg-white dark:hover:bg-gray-900"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  {onEdit && (
                    <DropdownMenuItem onClick={handleEdit} className="gap-2 cursor-pointer">
                      <Pencil className="h-4 w-4" />
                      <span>Chỉnh sửa</span>
                    </DropdownMenuItem>
                  )}
                  {onEdit && onDelete && <DropdownMenuSeparator />}
                  {onDelete && (
                    <DropdownMenuItem
                      onClick={handleDelete}
                      className="gap-2 cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span>Xóa</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
        
        {/* Content */}
        <CardContent className="p-3">
          {/* Title */}
          <h3 className="font-medium text-foreground line-clamp-2 mb-1 text-sm leading-snug">
            {title}
          </h3>
          
          {/* Excerpt */}
          {excerpt && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {excerpt}
            </p>
          )}
          
          {/* Stats Row */}
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t border-border">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{formatRelativeTime(post.createdAt)}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn("flex items-center gap-1", isLiked && "text-red-500")}>
                <Heart className={cn("h-3 w-3", isLiked && "fill-current")} />
                {formatNumber(post.likeCount ?? 0)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {formatNumber(post._count?.comments ?? post.commentCount ?? 0)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

