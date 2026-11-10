import Link from "next/link"
import Image from "next/image"
import { api } from "@/lib/api"
import { transformImageUrl } from "@/lib/image-url"
import type { Post } from "@/types/post"

interface RelatedPostsProps {
  postId: string
}

/**
 * Fetch related posts from the API.
 * Handles the triple-nested response structure defensively.
 */
async function getRelatedPosts(postId: string): Promise<Post[]> {
  try {
    const response = await api<{ data: Post[] | { data: Post[] } }>(
      `/posts/${postId}/related?limit=6`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    )
    
    // Handle triple-nesting defensively (learned pattern)
    const rawData = response.data
    if (Array.isArray(rawData)) {
      return rawData
    }
    if (rawData && typeof rawData === 'object' && 'data' in rawData) {
      return Array.isArray(rawData.data) ? rawData.data : []
    }
    return []
  } catch {
    // Graceful fallback - don't break the page if related posts fail
    return []
  }
}

/**
 * Helper to get first image from post images
 */
function getFirstImage(images: string[] | string | null | undefined): string | null {
  if (!images) return null
  if (Array.isArray(images) && images.length > 0) return images[0]
  if (typeof images === 'string') {
    try {
      const parsed = JSON.parse(images)
      return Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null
    } catch {
      return null
    }
  }
  return null
}

/**
 * Helper to strip HTML tags and truncate text
 */
function getPlainText(content: string, maxLength: number = 100): string {
  const plain = content.replace(/<[^>]*>/g, '').trim()
  if (plain.length <= maxLength) return plain
  return plain.substring(0, maxLength).trim() + '...'
}

/**
 * RelatedPosts - Server Component for SEO
 * Displays 3-6 related posts based on shared hashtags, same author, and recency.
 * Renders server-side for crawlability (AC-010).
 */
export async function RelatedPosts({ postId }: RelatedPostsProps) {
  const posts = await getRelatedPosts(postId)

  // Don't render section if no related posts
  if (posts.length === 0) return null

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-lg font-semibold mb-4">Bài viết liên quan</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {posts.map((post) => {
          const authorUsername = post.author.profile?.username || post.author.id
          const authorDisplayName = post.author.profile?.displayName || 'Người dùng'
          const postUrl = `/profile/${authorUsername}/${post.slug || post.id}`
          const firstImage = getFirstImage(post.images)

          return (
            <Link
              key={post.id}
              href={postUrl}
              className="group block p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              {/* Post thumbnail if available */}
              {firstImage && (
                <div className="relative aspect-video rounded-md overflow-hidden mb-2 bg-muted">
                  <Image
                    src={transformImageUrl(firstImage) || firstImage}
                    alt={`Bài viết của ${authorDisplayName}`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 300px"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <p className="text-sm text-foreground line-clamp-2 group-hover:text-primary">
                {getPlainText(post.content)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {authorDisplayName} · {new Date(post.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

