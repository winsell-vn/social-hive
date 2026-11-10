"use client"

import * as React from "react"
import Link from "next/link"
import { usePost, useReactToPost, useRemoveReaction, useUserReactions } from "@/features/posts/api/posts"
import { useAuth } from "@/features/auth/hooks/useAuth"
import { useRequireAuth, LoginPromptModal } from "@/features/auth"
import { PostCard } from "@/features/posts/components/PostCard"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowLeft } from "lucide-react"
import type { Post, ReactionType } from "@/types/post"

interface PostPageClientProps {
  initialPost: Post
  postId: string
}

export function PostPageClient({ initialPost, postId }: PostPageClientProps) {
  const { user, isAuthenticated } = useAuth()
  const { requireAuth, showLoginPrompt, dismissLoginPrompt } = useRequireAuth()
  const { data: post, isLoading, isError } = usePost(postId)
  const reactToPost = useReactToPost()
  const removeReaction = useRemoveReaction()

  // Use server-fetched data as initial, then client data when available
  const displayPost = post || initialPost

  // Fetch user reaction for this post (only when authenticated)
  const { data: userReactions } = useUserReactions(displayPost ? [displayPost.id] : [], isAuthenticated)
  const userReaction = displayPost ? userReactions?.[displayPost.id] || null : null

  // Check if current user is the post author
  const isOwnPost = isAuthenticated && user?.id === displayPost?.author?.id

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
    // Scroll to comments section (placeholder for now)
    console.log("Comment on post:", postId)
  }

  if (isError && !displayPost) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500">Bài viết không tồn tại hoặc đã bị xóa</p>
            <Link href="/">
              <Button variant="link" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay về trang chủ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading && !displayPost) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardHeader className="p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!displayPost) return null

  // Don't show pending posts to non-authors
  if (displayPost.status === "PENDING" && !isOwnPost) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Bài viết này đang chờ duyệt</p>
            <Link href="/">
              <Button variant="link" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay về trang chủ
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Back navigation */}
      <div className="mb-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Quay lại
          </Button>
        </Link>
      </div>

      {/* Post content */}
      <PostCard
        post={displayPost}
        userReaction={userReaction}
        showPendingBadge={isOwnPost}
        onReact={handleReact}
        onRemoveReaction={handleRemoveReaction}
        onComment={handleComment}
        currentUserId={user?.id}
      />

      {/* Comments section placeholder */}
      <Card className="mt-4">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Bình luận ({displayPost._count?.comments || displayPost.commentCount || 0})
          </h3>
          <p className="text-muted-foreground text-center py-4">
            Tính năng bình luận đang được phát triển...
          </p>
        </CardContent>
      </Card>

      {/* Login Prompt Modal */}
      <LoginPromptModal
        open={showLoginPrompt}
        onClose={dismissLoginPrompt}
        message="Bạn cần đăng nhập để tương tác với bài viết này."
      />
    </div>
  )
}

