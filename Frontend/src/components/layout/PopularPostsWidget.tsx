"use client";

import Link from "next/link";
import { TrendingUp, Eye, Heart, MessageCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { usePopularPosts } from "@/features/posts/api/posts";
import { generateAvatarAlt } from "@/lib/seo/alt-text";
import { getAvatarUrl } from "@/lib/image-url";

// Helper function to get initials from name
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Format number for display (e.g., 1200 -> 1.2K)
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  }
  return num.toString();
}

export function PopularPostsWidget() {
  const { data: posts, isLoading, error } = usePopularPosts(5);

  if (error) {
    return null; // Silently fail - widget is not critical
  }

  return (
    <div className="mt-6 pt-6 border-t border-border">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-semibold">Bài viết nổi bật</h3>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && posts && posts.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Chưa có bài viết nổi bật
        </p>
      )}

      {!isLoading && posts && posts.length > 0 && (
        <div className="space-y-3">
          {posts.map((post) => {
            const authorName =
              post.author?.profile?.displayName ||
              post.author?.profile?.username ||
              "Người dùng";
            const username = post.author?.profile?.username;
            const initials = getInitials(authorName);
            const postUrl = username && post.slug 
              ? `/${username}/${post.slug}` 
              : `/posts/${post.id}`;

            return (
              <Link
                key={post.id}
                href={postUrl}
                className="flex gap-3 p-2 -mx-2 rounded-lg hover:bg-secondary transition-colors group"
              >
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage
                    src={getAvatarUrl(post.author?.profile?.avatar)}
                    alt={generateAvatarAlt(authorName)}
                  />
                  <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {post.content}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {formatNumber(post.viewCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      {formatNumber(post.likeCount)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {formatNumber(post.commentCount)}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default PopularPostsWidget;

