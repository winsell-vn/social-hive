"use client"

import * as React from "react"
import Link from "next/link"
import { Hash, Users, FileText, User, ChevronRight, SearchX } from "lucide-react";
import { useSearch } from "../api/search"
import type { SearchType, SearchUser, SearchHashtag, SearchGroup } from "../types/search"
import { PostCard } from "@/features/posts/components/PostCard"
import { useReactToPost, useRemoveReaction, useUserReactions } from "@/features/posts/api/posts"
import { useAuth, useRequireAuth, LoginPromptModal } from "@/features/auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatNumber } from "@/lib/utils"
import { generateAvatarAlt } from "@/lib/seo/alt-text"
import { getAvatarUrl } from "@/lib/image-url"
import { FadeIn } from "@/components/animations"
import type { Post, ReactionType } from "@/types/post"

interface SearchResultsProps {
  query: string
  initialType?: SearchType
}

export function SearchResults({ query, initialType = "all" }: SearchResultsProps) {
  const [activeTab, setActiveTab] = React.useState<SearchType>(initialType)
  const { user, isAuthenticated } = useAuth()
  const { requireAuth, showLoginPrompt, dismissLoginPrompt } = useRequireAuth()
  const reactToPost = useReactToPost()
  const removeReaction = useRemoveReaction()
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useSearch(
    query,
    activeTab
  )

  const allResults = React.useMemo(() => {
    if (!data?.pages) return { posts: [], users: [], hashtags: [], groups: [] }

    return data.pages.reduce(
      (acc, page) => ({
        posts: [...acc.posts, ...(page.posts?.data || [])],
        users: [...acc.users, ...(page.users?.data || [])],
        hashtags: [...acc.hashtags, ...(page.hashtags?.data || [])],
        groups: [...acc.groups, ...(page.groups?.data || [])],
      }),
      { posts: [] as Post[], users: [] as SearchUser[], hashtags: [] as SearchHashtag[], groups: [] as SearchGroup[] }
    )
  }, [data])

  // Fetch user reactions for all visible posts (only when authenticated)
  const postIds = allResults.posts.map(p => p.id)
  const { data: userReactions } = useUserReactions(postIds, isAuthenticated)

  const handleReact = (postId: string, reactionType: ReactionType) => {
    requireAuth(() => {
      reactToPost.mutate({ postId, reactionType })
    })
  }

  const handleRemoveReaction = (postId: string) => {
    requireAuth(() => {
      removeReaction.mutate(postId)
    })
  }

  const handleComment = (postId: string) => {
    // Find the post to get the author's username for the URL
    const post = allResults.posts.find(p => p.id === postId)
    if (post) {
      const username = post.author.profile?.username
      if (username) {
        window.location.href = `/profile/${username}/${postId}#comment-section`
      }
    }
  }

  if (!query || query.length < 2) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nhập ít nhất 2 ký tự để tìm kiếm
      </div>
    )
  }

  // Calculate total results for display
  const totalResults = allResults.posts.length + allResults.users.length +
    allResults.hashtags.length + allResults.groups.length

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SearchType)}>
      {/* Result count */}
      {totalResults > 0 && (
        <p className="text-sm text-muted-foreground mb-3">
          {totalResults} kết quả
        </p>
      )}

      {/* Responsive Tab Navigation */}
      <div className="sticky top-14 z-10 bg-background/95 backdrop-blur -mx-4 px-4 border-b border-border">
        {/* Gradient indicators for scroll */}
        <div className="relative">
          <TabsList className={cn(
            "w-full justify-start h-auto p-0 bg-transparent rounded-none",
            "overflow-x-auto snap-x snap-mandatory scrollbar-hide",
            "flex gap-0"
          )}>
            <TabsTrigger
              value="all"
              className={cn(
                "snap-start flex-shrink-0 h-11 min-w-[80px] px-4",
                "rounded-none border-b-2 border-transparent -mb-px",
                "data-[state=active]:border-primary data-[state=active]:text-foreground",
                "text-muted-foreground hover:text-foreground transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
              )}
            >
              Tất cả
            </TabsTrigger>
            <TabsTrigger
              value="posts"
              className={cn(
                "snap-start flex-shrink-0 h-11 min-w-[100px] px-4",
                "rounded-none border-b-2 border-transparent -mb-px",
                "data-[state=active]:border-primary data-[state=active]:text-foreground",
                "text-muted-foreground hover:text-foreground transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
              )}
            >
              <FileText className="h-4 w-4 mr-1.5" /> Bài viết
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className={cn(
                "snap-start flex-shrink-0 h-11 min-w-[120px] px-4",
                "rounded-none border-b-2 border-transparent -mb-px",
                "data-[state=active]:border-primary data-[state=active]:text-foreground",
                "text-muted-foreground hover:text-foreground transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
              )}
            >
              <User className="h-4 w-4 mr-1.5" /> Người dùng
            </TabsTrigger>
            <TabsTrigger
              value="hashtags"
              className={cn(
                "snap-start flex-shrink-0 h-11 min-w-[100px] px-4",
                "rounded-none border-b-2 border-transparent -mb-px",
                "data-[state=active]:border-primary data-[state=active]:text-foreground",
                "text-muted-foreground hover:text-foreground transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
              )}
            >
              <Hash className="h-4 w-4 mr-1.5" /> Hashtags
            </TabsTrigger>
            <TabsTrigger
              value="groups"
              className={cn(
                "snap-start flex-shrink-0 h-11 min-w-[80px] px-4",
                "rounded-none border-b-2 border-transparent -mb-px",
                "data-[state=active]:border-primary data-[state=active]:text-foreground",
                "text-muted-foreground hover:text-foreground transition-colors",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0"
              )}
            >
              <Users className="h-4 w-4 mr-1.5" /> Nhóm
            </TabsTrigger>
          </TabsList>
        </div>
      </div>

      {isLoading ? (
        <SearchResultsSkeleton />
      ) : (
        <>
          <TabsContent value="all" className="space-y-4 mt-4">
            {allResults.posts.length > 0 && (
              <ResultSection title="Bài viết" icon={<FileText className="h-4 w-4" />}>
                {allResults.posts.slice(0, 3).map((post, index) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={index}
                    userReaction={userReactions?.[post.id] || null}
                    onReact={handleReact}
                    onRemoveReaction={handleRemoveReaction}
                    onComment={handleComment}
                    currentUserId={user?.id}
                    truncateContent
                  />
                ))}
                {allResults.posts.length > 3 && (
                  <Button variant="ghost" onClick={() => setActiveTab("posts")} className="w-full mt-2">
                    Xem thêm {allResults.posts.length - 3} bài viết
                  </Button>
                )}
              </ResultSection>
            )}
            {allResults.users.length > 0 && (
              <ResultSection title="Người dùng" icon={<User className="h-4 w-4" />}>
                <div className="space-y-2">
                  {allResults.users.slice(0, 5).map((user) => (
                    <UserResultCard key={user.id} user={user} />
                  ))}
                </div>
              </ResultSection>
            )}
            {allResults.hashtags.length > 0 && (
              <ResultSection title="Hashtags" icon={<Hash className="h-4 w-4" />}>
                <div className="flex flex-wrap gap-2">
                  {allResults.hashtags.slice(0, 10).map((hashtag) => (
                    <HashtagBadge key={hashtag.id} hashtag={hashtag} />
                  ))}
                </div>
              </ResultSection>
            )}
            {allResults.groups.length > 0 && (
              <ResultSection title="Nhóm" icon={<Users className="h-4 w-4" />}>
                <div className="space-y-2">
                  {allResults.groups.slice(0, 5).map((group) => (
                    <GroupResultCard key={group.id} group={group} />
                  ))}
                </div>
              </ResultSection>
            )}
            {allResults.posts.length === 0 && allResults.users.length === 0 &&
             allResults.hashtags.length === 0 && allResults.groups.length === 0 && (
              <NoResults query={query} />
            )}
          </TabsContent>

          <TabsContent value="posts" className="space-y-4 mt-4">
            {allResults.posts.length > 0 ? (
              allResults.posts.map((post, index) => (
                <PostCard
                  key={post.id}
                  post={post}
                  index={index}
                  userReaction={userReactions?.[post.id] || null}
                  onReact={handleReact}
                  onRemoveReaction={handleRemoveReaction}
                  onComment={handleComment}
                  currentUserId={user?.id}
                  truncateContent
                />
              ))
            ) : (
              <NoResults query={query} type="bài viết" />
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-2 mt-4">
            {allResults.users.length > 0 ? (
              allResults.users.map((user) => <UserResultCard key={user.id} user={user} />)
            ) : (
              <NoResults query={query} type="người dùng" />
            )}
          </TabsContent>

          <TabsContent value="hashtags" className="mt-4">
            {allResults.hashtags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {allResults.hashtags.map((hashtag) => (
                  <HashtagBadge key={hashtag.id} hashtag={hashtag} size="lg" />
                ))}
              </div>
            ) : (
              <NoResults query={query} type="hashtag" />
            )}
          </TabsContent>

          <TabsContent value="groups" className="space-y-2 mt-4">
            {allResults.groups.length > 0 ? (
              allResults.groups.map((group) => <GroupResultCard key={group.id} group={group} />)
            ) : (
              <NoResults query={query} type="nhóm" />
            )}
          </TabsContent>

          {hasNextPage && (
            <div className="flex justify-center pt-6">
              <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} variant="outline" className="min-w-[120px]">
                {isFetchingNextPage ? "Đang tải..." : "Tải thêm"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Login Prompt Modal */}
      <LoginPromptModal
        open={showLoginPrompt}
        onClose={dismissLoginPrompt}
        message="Bạn cần đăng nhập để tương tác với bài viết này."
      />
    </Tabs>
  )
}

// Helper Components
function ResultSection({
  title,
  icon,
  children
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="rounded-lg border border-border bg-card">
      <CardContent className="p-4">
        <h3 className="font-semibold text-base mb-3 flex items-center gap-2 text-foreground">
          {icon} {title}
        </h3>
        {children}
      </CardContent>
    </Card>
  )
}

function UserResultCard({ user }: { user: SearchUser }) {
  return (
    <Link href={`/profile/${user.username}`}>
      <div className={cn(
        "rounded-lg border border-border bg-card p-4",
        "hover:border-accent transition-colors duration-200 cursor-pointer",
        "flex items-center gap-3"
      )}>
        <Avatar className="h-12 w-12 flex-shrink-0">
          <AvatarImage
            src={getAvatarUrl(user.avatar)}
            alt={generateAvatarAlt(user.displayName || user.username || "Người dùng")}
          />
          <AvatarFallback>
            <User className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-foreground">
            {user.displayName || user.username}
          </div>
          <div className="text-sm text-muted-foreground">@{user.username}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {formatNumber(user.followerCount)} người theo dõi
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>
    </Link>
  )
}

function HashtagBadge({
  hashtag,
  size = "default"
}: {
  hashtag: SearchHashtag
  size?: "default" | "lg"
}) {
  return (
    <Link href={`/hashtag/${hashtag.name}`}>
      <Badge
        variant="secondary"
        className={cn(
          "hover:bg-accent cursor-pointer transition-colors duration-200",
          size === "lg" ? "text-base px-4 py-2" : ""
        )}
      >
        #{hashtag.name}
        <span className="ml-1 text-muted-foreground">({formatNumber(hashtag.postCount)})</span>
      </Badge>
    </Link>
  )
}

function GroupResultCard({ group }: { group: SearchGroup }) {
  return (
    <Link href={`/groups/${group.id}`}>
      <div className={cn(
        "rounded-lg border border-border bg-card p-4",
        "hover:border-accent transition-colors duration-200 cursor-pointer",
        "flex items-center gap-3"
      )}>
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
          {group.coverPhoto ? (
            <img src={group.coverPhoto} alt={group.name} className="w-full h-full object-cover" />
          ) : (
            <Users className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate text-foreground">{group.name}</div>
          {group.description && (
            <div className="text-sm text-muted-foreground truncate">{group.description}</div>
          )}
          <div className="text-xs text-muted-foreground mt-0.5">
            {formatNumber(group.memberCount)} thành viên
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      </div>
    </Link>
  )
}

function NoResults({ query, type }: { query: string; type?: string }) {
  return (
    <FadeIn>
      <div className="py-12 text-center">
        <SearchX className="h-16 w-16 mx-auto text-muted-foreground opacity-50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Không tìm thấy kết quả</h3>
        <p className="text-sm text-muted-foreground">
          {type
            ? `Không tìm thấy ${type} nào cho "${query}"`
            : `Không tìm thấy kết quả cho "${query}". Thử tìm kiếm với từ khóa khác.`
          }
        </p>
      </div>
    </FadeIn>
  )
}

function SearchResultsSkeleton() {
  return (
    <div className="space-y-4 mt-4">
      {/* Skeleton cards */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1">
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-5 w-5" />
          </div>
        </div>
      ))}
    </div>
  )
}

