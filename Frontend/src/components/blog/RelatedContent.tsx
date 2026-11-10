import Link from "next/link"
import Image from "next/image"
import { api } from "@/lib/api"
import { transformImageUrl } from "@/lib/image-url"
import type { BlogPost } from "@/types/blog"
import type { Post } from "@/types/post"

interface RelatedBlogPostsProps {
  /** Hashtags from UGC post to match against blog tags */
  hashtags: string[]
  /** Current post ID to exclude from results */
  excludePostId?: string
}

interface RelatedUGCPostsProps {
  /** Tags from blog post to match against UGC hashtags */
  tags: string[]
  /** Current blog post ID to exclude */
  excludeBlogId?: string
}

/**
 * Fetch blog posts by topic/tag for cross-linking from UGC posts
 */
async function getRelatedBlogPosts(hashtags: string[], limit = 4): Promise<BlogPost[]> {
  if (!hashtags.length) return []
  
  try {
    // Try first hashtag as topic
    const topic = hashtags[0].replace(/^#/, '')
    const response = await api<{ data: { data: BlogPost[] } }>(
      `/blog/posts/by-topic/${encodeURIComponent(topic)}?limit=${limit}`,
      { next: { revalidate: 300 } }
    )
    return response.data?.data || []
  } catch {
    return []
  }
}

/**
 * Fetch UGC posts by hashtag for cross-linking from blog posts
 */
async function getRelatedUGCPosts(tags: string[], limit = 4): Promise<Post[]> {
  if (!tags.length) return []
  
  try {
    // Try first tag as hashtag
    const hashtag = tags[0].replace(/^#/, '')
    const response = await api<{ data: { posts: { data: Post[] } } }>(
      `/hashtags/${encodeURIComponent(hashtag)}/posts?limit=${limit}`,
      { next: { revalidate: 300 } }
    )
    return response.data?.posts?.data || []
  } catch {
    return []
  }
}

function truncateText(text: string, maxLength: number): string {
  const plain = text.replace(/<[^>]*>/g, '').trim()
  if (plain.length <= maxLength) return plain
  return plain.substring(0, maxLength).trim() + '...'
}

/**
 * Shows related blog posts on UGC post detail pages
 * Server Component for SEO
 */
export async function RelatedBlogPosts({ hashtags }: RelatedBlogPostsProps) {
  const posts = await getRelatedBlogPosts(hashtags)
  
  if (posts.length === 0) return null

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-lg font-semibold mb-4">Bài viết từ Blog</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {posts.slice(0, 4).map((post) => (
          <Link
            key={post.id}
            href={`/blog/${post.category.slug}/${post.slug}`}
            className="group block p-3 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            {post.featuredImage && (
              <div className="relative aspect-video rounded-md overflow-hidden mb-2 bg-muted">
                <Image
                  src={transformImageUrl(post.featuredImage) || post.featuredImage}
                  alt={post.title}
                  fill
                  sizes="(max-width: 640px) 100vw, 300px"
                  className="object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary">
              {post.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {post.readingTime} phút đọc · {post.viewCount.toLocaleString('vi-VN')} lượt xem
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}

/**
 * Shows related UGC posts on blog post detail pages
 * Server Component for SEO
 */
export async function RelatedUGCPosts({ tags }: RelatedUGCPostsProps) {
  const posts = await getRelatedUGCPosts(tags)
  
  if (posts.length === 0) return null

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-lg font-semibold mb-4">Bài viết từ Cộng đồng</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {posts.slice(0, 4).map((post) => {
          const authorUsername = post.author.profile?.username || post.author.id
          const authorName = post.author.profile?.displayName || 'Người dùng'
          const postUrl = `/profile/${authorUsername}/${post.slug || post.id}`
          const firstImage = Array.isArray(post.images) && post.images.length > 0 ? post.images[0] : null

          return (
            <Link
              key={post.id}
              href={postUrl}
              className="group block p-3 rounded-lg border border-border hover:bg-accent transition-colors"
            >
              {firstImage && (
                <div className="relative aspect-video rounded-md overflow-hidden mb-2 bg-muted">
                  <Image
                    src={transformImageUrl(firstImage) || firstImage}
                    alt={`Bài viết của ${authorName}`}
                    fill
                    sizes="(max-width: 640px) 100vw, 300px"
                    className="object-cover"
                    loading="lazy"
                  />
                </div>
              )}
              <p className="text-sm text-foreground line-clamp-2 group-hover:text-primary">
                {truncateText(post.content, 100)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {authorName} · {new Date(post.createdAt).toLocaleDateString('vi-VN')}
              </p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

