"use client"

import * as React from "react"
import { useState } from "react"
import { useNewsfeed, useCreatePost, useReactToPost, useRemoveReaction, useUserReactions } from "@/features/posts/api/posts"
import { PostCard } from "@/features/posts/components/PostCard"
import { PostComposer } from "@/features/posts/components/PostComposer"
import { PostComposerPrompt } from "@/features/posts/components/PostComposerPrompt"
import { EditPostModal } from "@/features/posts/components/EditPostModal"
import { DeletePostDialog } from "@/features/posts/components/DeletePostDialog"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth, useRequireAuth, LoginPromptModal } from "@/features/auth"
import { PostSkeletonList, PostSkeleton } from "@/components/loading"
import { NoPosts } from "@/components/empty"
import { FadeIn, StaggerContainer } from "@/components/animations"
import { cn } from "@/lib/utils"
import { usePublicAds, PromotedPostCard } from "@/features/ads"
import type { ReactionType, CreatePostInput } from "@/types/post"
import type { Ad } from "@/types/ad"
import type { Post } from "@/types/post"

interface NewsfeedClientProps {
  /** Server-side fetched posts for initial render (SSR) */
  initialPosts?: Post[]
  /** Current page number from URL ?page=N parameter (for SEO pagination) */
  currentPage?: number
}

// Helper function to interleave ads into posts
// Logic: Insert first ad after post index 1 (2nd post), then every 4 posts after that
// If fewer than 2 posts, append ads at the end
// Note: 0-posts case is handled in render logic before this function is called
function interleaveAdsWithPosts(posts: Post[], feedAds: Ad[]): (Post | Ad)[] {
  if (!feedAds.length) return posts;

  const result: (Post | Ad)[] = [];
  let adIndex = 0;
  const FIRST_AD_AFTER = 2; // Insert first ad after 2nd post (index 1)
  const AD_INTERVAL = 4; // Then insert ad every 4 posts after that

  posts.forEach((post, index) => {
    result.push(post);
    const postNumber = index + 1; // 1-based position

    // Insert first ad after 2nd post, then every 4 posts after that
    // Positions: 2, 6, 10, 14... (postNumber === 2 || (postNumber > 2 && (postNumber - 2) % 4 === 0))
    const shouldInsertAd =
      postNumber === FIRST_AD_AFTER ||
      (postNumber > FIRST_AD_AFTER && (postNumber - FIRST_AD_AFTER) % AD_INTERVAL === 0);

    if (shouldInsertAd && adIndex < feedAds.length) {
      result.push(feedAds[adIndex]);
      adIndex++;
      // Cycle through ads if we have more slots than ads
      if (adIndex >= feedAds.length) {
        adIndex = 0;
      }
    }
  });

  // If we have posts but haven't inserted any ad yet (fewer than 2 posts), append ad at end
  if (posts.length > 0 && posts.length < FIRST_AD_AFTER && adIndex === 0) {
    result.push(feedAds[0]);
  }

  return result;
}

// Type guard to check if item is an Ad
function isAd(item: Post | Ad): item is Ad {
  return 'ctaLink' in item && 'ctaText' in item;
}

function NewsfeedContent({ initialPosts = [], currentPage = 1 }: NewsfeedClientProps) {
  const { user, isAuthenticated } = useAuth()
  const { requireAuth, showLoginPrompt, dismissLoginPrompt } = useRequireAuth()

  // Edit/Delete modal state
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)

  // Note: useNewsfeed starts from page 1 for infinite scroll
  // The currentPage prop is used for SSR initial data from ?page=N URL
  // Infinite scroll will continue from where the user scrolls, independent of URL page
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useNewsfeed()

  // Fetch active ads for feed
  // Defensive: ensure feedAds is always an array even if hook returns unexpected data
  const { data: rawFeedAds } = usePublicAds('FEED')
  const feedAds = Array.isArray(rawFeedAds) ? rawFeedAds : []

  const createPost = useCreatePost()
  const reactToPost = useReactToPost()
  const removeReaction = useRemoveReaction()

  // Ref for the load more trigger element (infinite scroll)
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
      { threshold: 0.1, rootMargin: '200px' }
    )

    observer.observe(target)

    return () => {
      observer.disconnect()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  // Use client-side data if available, otherwise use SSR initial posts
  // Deduplicate posts by ID to handle pagination overlap during infinite scroll
  const clientPosts = data?.pages.flatMap((page) => page.data) ?? []
  const seenIds = new Set<string>()
  const deduplicatedPosts = (clientPosts.length > 0 ? clientPosts : initialPosts).filter((post) => {
    if (seenIds.has(post.id)) return false
    seenIds.add(post.id)
    return true
  })
  const posts = deduplicatedPosts
  const postIds = posts.map(p => p.id)

  // Fetch user reactions for all visible posts (only when authenticated)
  const { data: userReactions } = useUserReactions(postIds, isAuthenticated)

  const handleCreatePost = async (postData: CreatePostInput) => {
    await createPost.mutateAsync(postData)
  }

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

  const handleEdit = (postId: string) => {
    setEditingPostId(postId)
  }

  const handleDelete = (postId: string) => {
    setDeletingPostId(postId)
  }

  const currentUser = user ? {
    id: user.id,
    displayName: user.profile?.displayName || user.profile?.username || "Người dùng",
    avatar: user.profile?.avatar || null,
    tier: user.tier,
  } : null

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500">Có lỗi xảy ra khi tải bài viết</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Thử lại
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading only if no initial posts and client is loading
  const showLoading = isLoading && initialPosts.length === 0

  return (
    <div className="max-w-2xl mx-auto p-4">
      {/* Post Composer - show prompt for guests, full composer for logged in users */}
      {currentUser ? (
        <PostComposer
          user={currentUser}
          onSubmit={handleCreatePost}
          isLoading={createPost.isPending}
        />
      ) : (
        <PostComposerPrompt />
      )}

      {/* Posts Feed */}
      {showLoading ? (
        <PostSkeletonList count={3} />
      ) : (
        <>
          {posts.length === 0 && feedAds.length === 0 ? (
            <FadeIn>
              <NoPosts
                isOwnProfile={false}
                onCreatePost={() => {
                  const composer = document.querySelector('[data-composer]');
                  if (composer instanceof HTMLElement) {
                    composer.focus();
                  }
                }}
              />
            </FadeIn>
          ) : (
            <StaggerContainer staggerDelay={0.1} className="space-y-4">
              {posts.length === 0 && feedAds.length > 0 ? (
                // No posts but have ads - show ads then NoPosts message
                <>
                  {feedAds.slice(0, 1).map((ad, index) => (
                    <PromotedPostCard
                      key={`ad-${ad.id}-${index}`}
                      ad={ad}
                    />
                  ))}
                  <NoPosts
                    isOwnProfile={false}
                    onCreatePost={() => {
                      const composer = document.querySelector('[data-composer]');
                      if (composer instanceof HTMLElement) {
                        composer.focus();
                      }
                    }}
                  />
                </>
              ) : (
                // Normal case: posts with interleaved ads
                interleaveAdsWithPosts(posts, feedAds).map((item, index) => {
                  if (isAd(item)) {
                    return (
                      <PromotedPostCard
                        key={`ad-${item.id}-${index}`}
                        ad={item}
                      />
                    );
                  }
                  return (
                    <PostCard
                      key={item.id}
                      post={item}
                      index={index}
                      userReaction={userReactions?.[item.id] || null}
                      onReact={handleReact}
                      onRemoveReaction={handleRemoveReaction}
                      onComment={handleComment}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      currentUserId={user?.id}
                      truncateContent
                    />
                  );
                })
              )}
            </StaggerContainer>
          )}

          {/* Infinite scroll trigger element */}
          <div ref={loadMoreRef} className="py-4" />

          {/* Loading more state - smooth transition */}
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

          {/* End of feed message */}
          {!hasNextPage && posts.length > 0 && (
            <div className="text-center py-6 text-muted-foreground">
              <p className="text-sm">Bạn đã xem hết bài viết</p>
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

export function NewsfeedClient({ initialPosts, currentPage = 1 }: NewsfeedClientProps) {
  const { hydrated } = useAuth()

  // Show loading state while hydrating
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1877F2] mx-auto mb-4" />
          <p className="text-[#a6a6a6]">Đang tải...</p>
        </div>
      </div>
    )
  }

  // Show PUBLIC newsfeed for ALL users (both authenticated and unauthenticated)
  // Login is only required for interactions (like, comment, share, post)
  return <NewsfeedContent initialPosts={initialPosts} currentPage={currentPage} />
}

