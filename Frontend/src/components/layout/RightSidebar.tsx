"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Search, X, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useFriends } from "@/features/friends/api/friends";
import { generateAvatarAlt } from "@/lib/seo/alt-text";
import { getAvatarUrl } from "@/lib/image-url";
import { PopularPostsWidget } from "./PopularPostsWidget";
import { usePublicAds, SidebarAdCard } from "@/features/ads";

// Helper function to get initials from name
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function RightSidebar() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Fetch friends data
  const { data, isLoading } = useFriends(searchQuery || undefined, 50);
  const friends = useMemo(
    () => data?.pages?.flatMap((page) => page.data) ?? [],
    [data]
  );

  // Fetch sidebar ads
  const { data: rawSidebarAds } = usePublicAds('SIDEBAR');
  const sidebarAds = Array.isArray(rawSidebarAds) ? rawSidebarAds : [];

  // Handle view profile
  const handleViewProfile = (friendId: string) => {
    router.push(`/profile/${friendId}`);
  };

  // Show skeleton while hydrating
  if (!hydrated) {
    return (
      <aside className="hidden w-80 shrink-0 border-l border-border bg-background xl:block z-20">
        <div className="sticky top-14 z-30 flex h-[calc(100vh-3.5rem)] flex-col overflow-y-auto p-4">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  }

  // Show empty sidebar with login prompt for unauthenticated users
  if (!isAuthenticated) {
    return (
      <aside className="hidden w-80 shrink-0 border-l border-border bg-background xl:block z-20">
        <div className="sticky top-14 z-30 flex h-[calc(100vh-3.5rem)] flex-col overflow-y-auto p-4">
          <div className="mb-3">
            <h2 className="text-sm font-semibold">Người liên hệ</h2>
          </div>
          <p className="text-sm text-muted-foreground text-center py-4">
            Đăng nhập để xem danh sách bạn bè
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="hidden w-80 shrink-0 border-l border-border bg-background xl:block z-20">
      <div className="sticky top-14 z-30 flex h-[calc(100vh-3.5rem)] flex-col overflow-y-auto p-4">
        {/* Sponsored Ads Section */}
        {sidebarAds.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-muted-foreground">
                Được tài trợ
              </span>
            </div>
            <SidebarAdCard ad={sidebarAds[0]} className="w-full max-w-none" />
          </div>
        )}

        {/* Contacts Section */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            {showSearch ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  placeholder="Tìm kiếm bạn bè..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 text-sm flex-1"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery("");
                  }}
                  aria-label="Đóng tìm kiếm"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-sm font-semibold">Người liên hệ</h2>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShowSearch(true)}
                    aria-label="Tìm kiếm bạn bè"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Tùy chọn"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push("/friends")}>
                        Xem tất cả bạn bè
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setShowSearch(true)}>
                        Tìm kiếm
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && friends.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {searchQuery ? "Không tìm thấy bạn bè" : "Chưa có bạn bè nào"}
            </p>
          )}

          {/* Contacts List */}
          {!isLoading && friends.length > 0 && (
            <div className="space-y-1">
              {friends.map((friend) => {
                const name = friend.displayName || friend.username;
                const initials = getInitials(name);

                return (
                  <div
                    key={friend.id}
                    className="flex items-center gap-2 rounded-lg p-2 hover:bg-secondary transition-colors group cursor-pointer"
                    onClick={() => handleViewProfile(friend.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        handleViewProfile(friend.id);
                      }
                    }}
                  >
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={getAvatarUrl(friend.avatar)} alt={generateAvatarAlt(name)} />
                        <AvatarFallback className="text-xs">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">
                      {name}
                    </span>
                    {/* Action button - visible on hover */}
                    <div className="hidden gap-1 group-hover:flex flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewProfile(friend.id);
                        }}
                        aria-label={`Xem trang cá nhân ${name}`}
                      >
                        <User className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Popular Posts Widget (T-112) */}
        <PopularPostsWidget />
      </div>
    </aside>
  );
}
