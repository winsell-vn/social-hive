"use client"

import * as React from "react"
import { useTrendingPosts } from "../api/trending"
import { PostCard } from "@/features/posts/components/PostCard"
import { PostSkeleton } from "@/components/loading/PostSkeleton"
import { useReactToPost, useRemoveReaction, useUserReactions } from "@/features/posts/api/posts"
import { useAuth, useRequireAuth, LoginPromptModal } from "@/features/auth"
import { cn } from "@/lib/utils"
import type { TimeRange } from "../types/trending"
import type { ReactionType } from "@/types/post"

interface TrendingPostsListProps {
  timeRange: TimeRange
}

export function TrendingPostsList({ timeRange }: TrendingPostsListProps) {
  const { user, isAuthenticated } = useAuth()
  const { requireAuth, showLoginPrompt, dismissLoginPrompt } = useRequireAuth()
  const reactToPost = useReactToPost()
  const removeReaction = useRemoveReaction()

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useTrendingPosts(timeRange)

  // Ref for the load more trigger element
  const loadMoreRef = React.useRef<HTMLDivElement>(null)

  // Intersection Observer for infinite scroll
  React.useEffect(() => {
    const target = loadMoreRef.current
    if (!target) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Flatten pages data
  const posts = React.useMemo(() => {
    if (!data?.pages) return []
    return data.pages.flatMap((page) => page.data)
  }, [data?.pages])

  // Fetch user reactions for all visible posts (only when authenticated)
  const postIds = posts.map(p => p.id)
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
    const post = posts.find(p => p.id === postId)
    if (post) {
      const username = post.author.profile?.username
      if (username) {
        window.location.href = `/profile/${username}/${postId}#comment-section`
      }
    }
  }

  // Initial loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <PostSkeleton key={index} showImage={index === 0} />
        ))}
      </div>
    )
  }

  // Empty state
  if (!posts || posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium">Chưa có bài viết thịnh hành</p>
          <p className="text-sm mt-1">
            Hãy quay lại sau để khám phá nội dung mới
          </p>
        </div>
      </div>
    )
  }

  // Data state with posts
  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          userReaction={userReactions?.[post.id] || null}
          onReact={handleReact}
          onRemoveReaction={handleRemoveReaction}
          onComment={handleComment}
          currentUserId={user?.id}
          truncateContent
        />
      ))}

      {/* Load more trigger element */}
      <div ref={loadMoreRef} className="py-4" />

      {/* Loading more state */}
      <div
        className={cn(
          "space-y-4 transition-all duration-300 ease-in-out",
          isFetchingNextPage
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-2 h-0 overflow-hidden"
        )}
      >
        {Array.from({ length: 2 }).map((_, index) => (
          <PostSkeleton key={`loading-more-${index}`} showImage={false} />
        ))}
      </div>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        open={showLoginPrompt}
        onClose={dismissLoginPrompt}
        message="Bạn cần đăng nhập để tương tác với bài viết này."
      />
    </div>
  )
}

