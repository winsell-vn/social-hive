"use client"

import * as React from "react"
import { useInfiniteQuery } from "@tanstack/react-query"
import apiClient from "@/lib/api-client"
import { PostCard } from "@/features/posts/components/PostCard"
import { useReactToPost, useRemoveReaction, useUserReactions } from "@/features/posts/api/posts"
import { useAuth, useRequireAuth, LoginPromptModal } from "@/features/auth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { formatNumber } from "@/lib/utils"
import type { Post, PaginatedResponse, ReactionType } from "@/types/post"

interface HashtagData {
  hashtag: {
    id: string
    name: string
    postCount: number
    trendingScore: number
  }
  posts: PaginatedResponse<Post>
}

interface HashtagClientProps {
  name: string
  initialHashtag: {
    id: string
    name: string
    postCount: number
    trendingScore: number
  } | null
  initialPosts: Post[]
}

export function HashtagClient({ name, initialHashtag, initialPosts }: HashtagClientProps) {
  const { user, isAuthenticated } = useAuth()
  const { requireAuth, showLoginPrompt, dismissLoginPrompt } = useRequireAuth()
  const reactToPost = useReactToPost()
  const removeReaction = useRemoveReaction()

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['hashtags', name, 'posts'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await apiClient.get<{ data: HashtagData }>(`/hashtags/${name}/posts`, {
        params: { page: pageParam, limit: 10 },
      })
      return response.data.data
    },
    getNextPageParam: (lastPage) =>
      lastPage.posts.meta.hasNextPage ? lastPage.posts.meta.page + 1 : undefined,
    initialPageParam: 1,
    initialData: initialHashtag ? {
      pages: [{
        hashtag: initialHashtag,
        posts: {
          data: initialPosts,
          meta: {
            page: 1,
            limit: 10,
            total: initialHashtag.postCount,
            hasNextPage: initialPosts.length >= 10,
            hasPreviousPage: false,
            totalPages: Math.ceil(initialHashtag.postCount / 10),
          },
        },
      }],
      pageParams: [1],
    } : undefined,
  })

  const hashtag = data?.pages[0]?.hashtag || initialHashtag
  const allPosts = data?.pages.flatMap((page) => page.posts.data) ?? initialPosts
  const postIds = allPosts.map(p => p.id)

  // Fetch user reactions for all visible posts (only when authenticated)
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
    const post = allPosts.find(p => p.id === postId)
    if (post) {
      const username = post.author.profile?.username
      if (username) {
        window.location.href = `/profile/${username}/${postId}#comment-section`
      }
    }
  }

  if (isError && !initialHashtag) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-500">Hashtag không tồn tại</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading && !initialHashtag) {
    return (
      <>
        <Card className="mb-4">
          <CardContent className="p-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </CardContent>
        </Card>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="mb-4">
            <CardContent className="p-4">
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </>
    )
  }

  return (
    <>
      {/* Hashtag Header */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <h1 className="text-2xl font-semibold text-facebook-blue">
            #{hashtag?.name}
          </h1>
          <p className="text-gray-500">
            {formatNumber(hashtag?.postCount || 0)} bài viết
          </p>
        </CardContent>
      </Card>

      {/* Posts */}
      {allPosts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Chưa có bài viết nào với hashtag này</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {allPosts.map((post, index) => (
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

          {hasNextPage && (
            <div className="text-center py-4">
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

      {/* Login Prompt Modal */}
      <LoginPromptModal
        open={showLoginPrompt}
        onClose={dismissLoginPrompt}
        message="Bạn cần đăng nhập để tương tác với bài viết này."
      />
    </>
  )
}

