"use client"

import * as React from "react"
import { useState } from "react"
import { useProfile, useFollow, useUnfollow, useFollowStatus } from "@/features/profiles/api/profiles"
import { useUserPosts, useUserReactions } from "@/features/posts/api/posts"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { useRequireAuth, LoginPromptModal } from "@/features/auth"
import { ProfileSidebar } from "@/features/profiles/components/ProfileSidebar"
import { PostCardCompact } from "@/features/posts/components/PostCardCompact"
import { EditPostModal } from "@/features/posts/components/EditPostModal"
import { DeletePostDialog } from "@/features/posts/components/DeletePostDialog"
import { ProfileFriendsList } from "@/features/friends"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Link as LinkIcon, Calendar, Lock, Users, Building2, Briefcase } from "lucide-react"
import { useMounted } from "@/hooks/use-mounted"
import type { UserProfile } from "@/types/profile"
import type { AxiosError } from "axios"

// Helper to ensure URL has protocol
function normalizeUrl(url: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  return `https://${url}`
}

interface ProfilePageClientProps {
  initialProfile: UserProfile | null
  username: string
}

// Extract error message from API response
function getErrorMessage(error: unknown): string | null {
  const axiosError = error as AxiosError<{ message?: string }>
  if (axiosError?.response?.status === 403) {
    return axiosError.response.data?.message || 'Trang cá nhân này đang ở chế độ riêng tư'
  }
  return null
}

export function ProfilePageClient({ initialProfile, username }: ProfilePageClientProps) {
  const { user, isAuthenticated } = useAuth()
  const { showLoginPrompt, dismissLoginPrompt } = useRequireAuth()
  const { data: profile, isLoading: profileLoading, isError, error } = useProfile(username)
  const { data: posts, fetchNextPage, hasNextPage, isFetchingNextPage } = useUserPosts(username)

  // Track if component has mounted to avoid hydration mismatch with Radix UI Tabs
  const mounted = useMounted()

  // Edit/Delete modal state
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)

  // Use server-fetched data as initial, then client data when available
  const displayProfile = profile || initialProfile

  // Check if this is a privacy error (403)
  const privacyErrorMessage = getErrorMessage(error)
  const isPrivacyError = !!privacyErrorMessage

  // Only fetch follow status if user is authenticated
  const { data: followStatus } = useFollowStatus(
    isAuthenticated && displayProfile?.user.id ? displayProfile.user.id : ""
  )

  const follow = useFollow()
  const unfollow = useUnfollow()

  const isOwnProfile = displayProfile?.username === user?.profile?.username

  const handleFollow = () => {
    if (displayProfile) {
      follow.mutate(displayProfile.user.id)
    }
  }

  const handleUnfollow = () => {
    if (displayProfile) {
      unfollow.mutate(displayProfile.user.id)
    }
  }

  const allPosts = posts?.pages.flatMap((page) => page.data) ?? []
  const postIds = allPosts.map(p => p.id)

  // Fetch user reactions for all visible posts (only when authenticated)
  const { data: userReactions } = useUserReactions(postIds, isAuthenticated)

  // Handle privacy error (403 Forbidden)
  if (isPrivacyError) {
    const isFriendsOnly = privacyErrorMessage.includes('bạn bè')
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex justify-center mb-4">
              {isFriendsOnly ? (
                <Users className="h-16 w-16 text-muted-foreground" />
              ) : (
                <Lock className="h-16 w-16 text-muted-foreground" />
              )}
            </div>
            <h2 className="text-xl font-semibold mb-2">Trang cá nhân bị hạn chế</h2>
            <p className="text-muted-foreground">{privacyErrorMessage}</p>
            {!isAuthenticated && (
              <p className="text-sm text-muted-foreground mt-4">
                <a href="/login" className="text-primary hover:underline">Đăng nhập</a> để xem nội dung này
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isError && !displayProfile) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500">Người dùng không tồn tại</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (profileLoading && !displayProfile) {
    return (
      <div className="w-full">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Skeleton */}
          <aside className="w-full lg:w-[280px] lg:shrink-0 space-y-4">
            <Skeleton className="w-36 h-36 rounded-full mx-auto lg:mx-0" />
            <Skeleton className="h-7 w-48 mx-auto lg:mx-0" />
            <Skeleton className="h-5 w-32 mx-auto lg:mx-0" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="flex justify-center lg:justify-start gap-4">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
            </div>
          </aside>
          {/* Content Skeleton */}
          <main className="flex-1 min-w-0">
            <Skeleton className="h-10 w-full mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full rounded-lg" />
              ))}
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!displayProfile) return null

  return (
    <div className="w-full">
      {/* Two-column GitHub-inspired layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Sidebar - Profile Info (sticky on desktop) */}
        <aside className="w-full lg:w-[280px] lg:shrink-0 lg:sticky lg:top-20 lg:self-start">
          <ProfileSidebar
            profile={displayProfile}
            isOwnProfile={isOwnProfile}
            isFollowing={followStatus?.isFollowing}
            onFollow={handleFollow}
            onUnfollow={handleUnfollow}
          />
        </aside>

        {/* Right Main Content - Tabs */}
        <main className="flex-1 min-w-0">
          {/* Render skeleton before mount to avoid Radix UI hydration mismatch */}
          {!mounted ? (
            <div className="w-full">
              {/* Tabs skeleton */}
              <div className="w-full flex justify-start bg-card border-b border-border h-auto p-0 gap-1">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-24" />
              </div>
              {/* Content skeleton */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-[4/3] w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : (
            <Tabs defaultValue="posts" className="w-full">
              <TabsList className="w-full justify-start bg-card border-b border-border rounded-none h-auto p-0">
                <TabsTrigger
                  value="posts"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Bài viết
                </TabsTrigger>
                <TabsTrigger
                  value="about"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Giới thiệu
                </TabsTrigger>
                <TabsTrigger
                  value="friends"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Bạn bè
                </TabsTrigger>
                <TabsTrigger
                  value="photos"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
                >
                  Ảnh
                </TabsTrigger>
              </TabsList>

              <TabsContent value="posts" className="mt-4">
                {allPosts.length === 0 ? (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-muted-foreground">Chưa có bài viết nào</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {allPosts.map((post, index) => (
                        <PostCardCompact
                          key={post.id}
                          post={post}
                          index={index}
                          userReaction={userReactions?.[post.id]?.reactionType || null}
                          showPendingBadge={isOwnProfile}
                          currentUserId={user?.id}
                          onEdit={isOwnProfile ? (postId) => setEditingPostId(postId) : undefined}
                          onDelete={isOwnProfile ? (postId) => setDeletingPostId(postId) : undefined}
                        />
                      ))}
                    </div>

                    {hasNextPage && (
                      <div className="text-center py-4 mt-4">
                        <Button
                          variant="outline"
                          onClick={() => fetchNextPage()}
                          disabled={isFetchingNextPage}
                        >
                          {isFetchingNextPage ? "Đang tải..." : "Xem thêm"}
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="about" className="mt-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Giới thiệu</h3>
                  {displayProfile.bio && <p className="text-muted-foreground mb-4">{displayProfile.bio}</p>}

                  {/* Professional Info */}
                  {(displayProfile.jobTitle || displayProfile.company) && (
                    <div className="mb-4 space-y-2">
                      {displayProfile.jobTitle && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="h-4 w-4" />
                          <span>{displayProfile.jobTitle}</span>
                        </div>
                      )}
                      {displayProfile.company && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="h-4 w-4" />
                          <span>Làm việc tại {displayProfile.company}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {displayProfile.location && (
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <MapPin className="h-4 w-4" />
                      <span>Sống tại {displayProfile.location}</span>
                    </div>
                  )}
                  {displayProfile.website && (
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <LinkIcon className="h-4 w-4" />
                      <a href={normalizeUrl(displayProfile.website)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {displayProfile.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Tham gia {new Date(displayProfile.user.createdAt).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}</span>
                  </div>

                  {/* Expertise/Skills */}
                  {displayProfile.expertise && displayProfile.expertise.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Chuyên môn</h4>
                      <div className="flex flex-wrap gap-2">
                        {displayProfile.expertise.map((skill, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 text-sm font-medium rounded-full bg-secondary text-secondary-foreground border border-border"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="friends" className="mt-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Bạn bè</h3>
                  <ProfileFriendsList userId={displayProfile.user.id} />
                </Card>
              </TabsContent>

              <TabsContent value="photos" className="mt-4">
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">Ảnh</h3>
                  <p className="text-muted-foreground">Tính năng đang được phát triển...</p>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        open={showLoginPrompt}
        onClose={dismissLoginPrompt}
        message="Bạn cần đăng nhập để tương tác với bài viết này."
      />

      {/* Edit Post Modal */}
      <EditPostModal
        postId={editingPostId}
        isOpen={!!editingPostId}
        onClose={() => setEditingPostId(null)}
      />

      {/* Delete Post Dialog */}
      <DeletePostDialog
        postId={deletingPostId}
        isOpen={!!deletingPostId}
        onClose={() => setDeletingPostId(null)}
      />
    </div>
  )
}

