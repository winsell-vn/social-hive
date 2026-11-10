"use client"

import * as React from "react"
import dynamic from "next/dynamic"
import { useRouter } from "next/navigation"
import { Heart, MessageSquare } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ShareMenu } from "@/features/posts/components/ShareMenu"
import { usePost, useReactToPost, useRemoveReaction, useUserReactions } from "@/features/posts/api/posts"
import { usePostComments, useCreateComment, useDeleteComment } from "@/features/comments/api/comments"
import { useAuth, useRequireAuth, LoginPromptModal } from "@/features/auth"
import { formatNumber, cn } from "@/lib/utils"
import type { Post, ReactionType } from "@/types/post"
import type { CreateCommentInput } from "@/types/comment"

// Lazy load CommentSection for faster initial render
const CommentSection = dynamic(
  () => import("@/features/comments/components/CommentSection").then(mod => ({ default: mod.CommentSection })),
  {
    loading: () => (
      <CardContent className="p-4">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="flex gap-3 mb-6">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-20 flex-1 rounded-lg" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-3 mb-4">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </CardContent>
    ),
    ssr: false, // Comments are interactive, no need for SSR
  }
)

interface PostDetailClientProps {
  initialPost: Post | null
  postId: string
  username: string
}

/**
 * Client component for post detail page interactivity.
 * The post content is server-rendered in page.tsx for SEO.
 * This component handles: stats, like/comment/share buttons, and comments section.
 */
export function PostDetailClient({ initialPost, postId, username }: PostDetailClientProps) {
  const router = useRouter()
  const { user, hydrated } = useAuth()
  const { requireAuth, isAuthenticated, showLoginPrompt, dismissLoginPrompt } = useRequireAuth()
  const { data: post } = usePost(postId)
  const reactToPost = useReactToPost()
  const removeReaction = useRemoveReaction()

  // Comments API hooks
  const { data: commentsData, hasNextPage, fetchNextPage } = usePostComments(postId)
  const createComment = useCreateComment()
  const deleteComment = useDeleteComment()

  // Ref for comment textarea to enable auto-focus
  const commentInputRef = React.useRef<HTMLTextAreaElement>(null)

  // Use server-fetched data as initial, then client data when available
  const displayPost = post || initialPost

  // Fetch user reaction for this post (only when authenticated)
  const { data: userReactions } = useUserReactions(displayPost ? [displayPost.id] : [], isAuthenticated)
  const userReaction = displayPost ? userReactions?.[displayPost.id] || null : null

  // Track liked state locally for optimistic updates
  const [isLikedLocal, setIsLikedLocal] = React.useState(!!userReaction)
  const [likeCountLocal, setLikeCountLocal] = React.useState(displayPost?.likeCount ?? 0)

  // Sync with server data
  React.useEffect(() => {
    setIsLikedLocal(!!userReaction)
  }, [userReaction])

  React.useEffect(() => {
    if (displayPost) {
      setLikeCountLocal(displayPost.likeCount ?? 0)
    }
  }, [displayPost?.likeCount])

  // Flatten paginated comments data
  const comments = commentsData?.pages.flatMap(page => page.data) ?? []

  // Prepare user data for CommentSection
  const currentUser = user ? {
    displayName: user.profile?.displayName || user.profile?.username || "Người dùng",
    avatar: user.profile?.avatar || null,
  } : undefined

  // Auto-focus comment input when URL has #comment-section hash
  React.useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#comment-section') {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        commentInputRef.current?.focus()
        // Also scroll to comment section
        const commentSection = document.getElementById("comment-section")
        commentSection?.scrollIntoView({ behavior: "smooth" })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [])

  // Simple like toggle with optimistic update
  const handleLikeClick = () => {
    if (!displayPost) return

    if (isLikedLocal) {
      requireAuth(() => {
        // Optimistic update - unlike (only after auth confirmed)
        setIsLikedLocal(false)
        setLikeCountLocal(prev => Math.max(0, prev - 1))
        removeReaction.mutate(displayPost.id, {
          onError: () => {
            // Rollback on failure
            setIsLikedLocal(true)
            setLikeCountLocal(prev => prev + 1)
          }
        })
      })
    } else {
      requireAuth(() => {
        // Optimistic update - like (only after auth confirmed)
        setIsLikedLocal(true)
        setLikeCountLocal(prev => prev + 1)
        reactToPost.mutate({ postId: displayPost.id, reactionType: "LIKE" }, {
          onError: () => {
            // Rollback on failure
            setIsLikedLocal(false)
            setLikeCountLocal(prev => Math.max(0, prev - 1))
          }
        })
      })
    }
  }

  const handleComment = () => {
    // Scroll to comment section and focus input
    const commentSection = document.getElementById("comment-section")
    commentSection?.scrollIntoView({ behavior: "smooth" })
    // Focus the comment input after scrolling
    setTimeout(() => {
      commentInputRef.current?.focus()
    }, 300)
  }

  const handleAddComment = (postId: string, data: CreateCommentInput) => {
    requireAuth(() => {
      createComment.mutate({ postId, data })
    })
  }

  const handleDeleteComment = (commentId: string) => {
    requireAuth(() => {
      deleteComment.mutate(commentId)
    })
  }

  // Generate SEO-friendly post URL for share
  const getPostUrl = React.useCallback(() => {
    if (!displayPost) return ""
    const authorUsername = displayPost.author.profile?.username
    const postIdentifier = displayPost.slug || displayPost.id
    return `/profile/${authorUsername}/${postIdentifier}`
  }, [displayPost])

  // If no post data at all (shouldn't happen with SSR), show minimal error
  if (!displayPost) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">Bài viết không tồn tại hoặc đã bị xóa</p>
            <Button variant="outline" onClick={() => router.back()}>
              Quay lại
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Determine if we should show the user as logged in for comment section
  const showUserAsLoggedIn = hydrated ? currentUser : undefined
  const isAuthLoading = !hydrated

  // Check if this is a shared post (for share menu)
  const isSharedPost = !!displayPost.sharedPostId
  const sharePostId = isSharedPost && displayPost.sharedPost ? displayPost.sharedPost.id : displayPost.id

  return (
    <div className="max-w-2xl mx-auto px-4">
      {/* Interactive elements: Stats + Action buttons (content is server-rendered above) */}
      <Card className="border-border bg-card mb-4 rounded-t-none">
        {/* Stats */}
        <div className="px-4 py-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatNumber(likeCountLocal)} likes</span>
          <div className="flex gap-3">
            <span>
              {formatNumber(displayPost._count?.comments ?? displayPost.commentCount ?? 0)} comments
            </span>
            <span>{formatNumber(displayPost.shareCount ?? 0)} shares</span>
          </div>
        </div>

        {/* Actions */}
        <CardFooter className="p-0 border-t border-border">
          <div className="flex w-full">
            {/* Like Button */}
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
              onClick={handleComment}
            >
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">Bình luận</span>
            </Button>

            {/* Share Button */}
            <ShareMenu
              postId={sharePostId}
              postUrl={typeof window !== "undefined" ? `${window.location.origin}${getPostUrl()}` : ""}
              postTitle={displayPost.content?.slice(0, 100) || displayPost.sharedPost?.content?.slice(0, 100) || ""}
            />
          </div>
        </CardFooter>
      </Card>

      {/* Comments Section */}
      <Card id="comment-section">
        <CommentSection
          postId={postId}
          comments={comments}
          onAddComment={handleAddComment}
          onDeleteComment={handleDeleteComment}
          currentUserId={user?.id}
          user={showUserAsLoggedIn}
          hasMore={hasNextPage}
          onLoadMore={() => fetchNextPage()}
          isAuthenticated={isAuthenticated}
          commentInputRef={commentInputRef}
          isAuthLoading={isAuthLoading}
        />
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

