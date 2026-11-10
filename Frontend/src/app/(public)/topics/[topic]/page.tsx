import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Breadcrumb } from '@/components/seo'
import type { BlogPost } from '@/types/blog'
import type { Post } from '@/types/post'
import { transformImageUrl, getAvatarUrl } from '@/lib/image-url'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
const BASE_URL = 'https://chungtoixayweb.vn'

interface TopicPageProps {
  params: Promise<{ topic: string }>
  searchParams: Promise<{ page?: string; view?: string }>
}

// Topic metadata mapping
const TOPIC_META: Record<string, { title: string; description: string; hashtag: string }> = {
  'web-design': {
    title: 'Thiết kế Web',
    description: 'Khám phá các bài viết về thiết kế website, UI/UX, và xu hướng thiết kế web hiện đại',
    hashtag: 'thietkewebsite',
  },
  'mobile-app': {
    title: 'Ứng dụng di động',
    description: 'Tìm hiểu về phát triển ứng dụng di động, React Native, Flutter và các công nghệ mobile',
    hashtag: 'mobile',
  },
  'zalo-mini-app': {
    title: 'Zalo Mini App',
    description: 'Hướng dẫn phát triển Zalo Mini App, tích hợp API và tối ưu trải nghiệm người dùng',
    hashtag: 'zalominiapp',
  },
  'seo': {
    title: 'SEO',
    description: 'Tối ưu hóa công cụ tìm kiếm, chiến lược SEO và cách tăng thứ hạng website',
    hashtag: 'seo',
  },
  'ui-ux': {
    title: 'UI/UX',
    description: 'Thiết kế giao diện và trải nghiệm người dùng, nguyên tắc thiết kế và case study',
    hashtag: 'uiux',
  },
  'e-commerce': {
    title: 'Thương mại điện tử',
    description: 'Xây dựng website thương mại điện tử, tối ưu chuyển đổi và quản lý bán hàng online',
    hashtag: 'ecommerce',
  },
}

// Related topics mapping
const RELATED_TOPICS: Record<string, string[]> = {
  'web-design': ['ui-ux', 'seo', 'e-commerce'],
  'mobile-app': ['ui-ux', 'zalo-mini-app'],
  'zalo-mini-app': ['mobile-app', 'web-design'],
  'seo': ['web-design', 'e-commerce'],
  'ui-ux': ['web-design', 'mobile-app'],
  'e-commerce': ['web-design', 'seo'],
}

/**
 * Dynamic metadata generation for SEO pagination support
 * - Page 1: Full metadata with indexing
 * - Page 2+ or View All: Modified title, noindex to avoid duplicate content
 */
export async function generateMetadata({ params, searchParams }: TopicPageProps): Promise<Metadata> {
  const { topic } = await params
  const { page: pageParam, view } = await searchParams
  const page = Number(pageParam) || 1
  const isViewAll = view === 'all'
  const topicMeta = TOPIC_META[topic]
  const topicTitle = topicMeta?.title || decodeURIComponent(topic)
  const description = topicMeta?.description || `Khám phá các bài viết về ${decodeURIComponent(topic)}`

  const baseTitle = `${topicTitle} - Bài viết theo chủ đề | ChungToiXayWeb`
  const title = isViewAll
    ? `${baseTitle} - Tất cả bài viết`
    : page > 1
      ? `${baseTitle} - Trang ${page}`
      : baseTitle

  // Build canonical URL - View All pages should canonical to page 1
  const canonicalUrl = `${BASE_URL}/topics/${topic}`

  const metadata: Metadata = {
    title,
    description: isViewAll
      ? `${description}. Tổng hợp nội dung chất lượng từ blog và cộng đồng ChungToiXayWeb. - Xem tất cả`
      : page > 1
        ? `${description}. Tổng hợp nội dung chất lượng từ blog và cộng đồng ChungToiXayWeb. - Trang ${page}`
        : `${description}. Tổng hợp nội dung chất lượng từ blog và cộng đồng ChungToiXayWeb.`,
    keywords: [topicTitle, 'bài viết', 'chủ đề', 'ChungToiXayWeb', topicMeta?.hashtag || ''],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: `${description}. Tổng hợp nội dung chất lượng từ blog và cộng đồng.`,
      type: 'website',
      locale: 'vi_VN',
      url: canonicalUrl,
    },
  }

  // Page 2+ and View All should not be indexed (duplicate content risk)
  if (page > 1 || isViewAll) {
    metadata.robots = { index: false, follow: true }
  }

  return metadata
}

interface BlogPostsResponse {
  data: BlogPost[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

interface UserPostsResponse {
  hashtag: {
    id: string
    name: string
    postCount: number
  }
  posts: {
    data: Post[]
    meta: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNextPage: boolean
      hasPreviousPage: boolean
    }
  }
}

async function getPostsByTopic(topic: string, page = 1, limit = 12): Promise<BlogPostsResponse | null> {
  try {
    const res = await fetch(
      `${API_URL}/blog/posts/by-topic/${encodeURIComponent(topic)}?page=${page}&limit=${limit}`,
      { next: { revalidate: 300 } } // 5 minutes cache
    )
    if (!res.ok) return null
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

async function getUserPostsByHashtag(hashtag: string, page = 1, limit = 6): Promise<UserPostsResponse | null> {
  try {
    const res = await fetch(
      `${API_URL}/hashtags/${encodeURIComponent(hashtag)}/posts?page=${page}&limit=${limit}`,
      { next: { revalidate: 300 } } // 5 minutes cache
    )
    if (!res.ok) return null
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function TopicPage({ params, searchParams }: TopicPageProps) {
  const { topic } = await params
  const { page: pageParam, view } = await searchParams
  const topicMeta = TOPIC_META[topic]
  const topicTitle = topicMeta?.title || decodeURIComponent(topic)
  const page = Number(pageParam) || 1
  const isViewAll = view === 'all'

  // For View All, fetch up to 100 posts; otherwise use pagination
  const limit = isViewAll ? 100 : 12

  // Fetch both blog posts and user posts in parallel
  const [blogPostsData, userPostsData] = await Promise.all([
    getPostsByTopic(topic, isViewAll ? 1 : page, limit),
    topicMeta?.hashtag ? getUserPostsByHashtag(topicMeta.hashtag, 1, 6) : null,
  ])

  const relatedTopics = RELATED_TOPICS[topic] || []

  // Determine pagination state for rel="next/prev" link tags (not for View All)
  const totalPages = blogPostsData?.meta.totalPages || 1
  const hasNextPage = !isViewAll && page < totalPages
  const hasPrevPage = !isViewAll && page > 1

  // Build page URLs for SEO link tags
  const getPageUrl = (pageNum: number) => {
    if (pageNum === 1) return `${BASE_URL}/topics/${topic}`
    return `${BASE_URL}/topics/${topic}?page=${pageNum}`
  }

  // CollectionPage JSON-LD schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${topicTitle} - Bài viết theo chủ đề`,
    description: topicMeta?.description || `Tổng hợp bài viết về ${topicTitle}`,
    url: `${BASE_URL}/topics/${topic}`,
    publisher: {
      '@type': 'Organization',
      name: 'ChungToiXayWeb',
      url: BASE_URL,
    },
    ...(blogPostsData?.data && blogPostsData.data.length > 0 && {
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: blogPostsData.meta.total,
        itemListElement: blogPostsData.data.map((post, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `${BASE_URL}/blog/${post.category?.slug || 'uncategorized'}/${post.slug}`,
          name: post.title,
        })),
      },
    }),
  }

  const totalBlogPosts = blogPostsData?.meta.total || 0
  const totalUserPosts = userPostsData?.posts.meta.total || 0
  const totalPosts = totalBlogPosts + totalUserPosts

  return (
    <>
      {/* SEO Pagination link tags - hoisted to <head> by Next.js App Router */}
      {hasPrevPage && (
        <link key="topic-pagination-prev" rel="prev" href={getPageUrl(page - 1)} />
      )}
      {hasNextPage && (
        <link key="topic-pagination-next" rel="next" href={getPageUrl(page + 1)} />
      )}

      <script
        key="topic-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Chủ đề', href: '/topics' },
            { label: topicTitle },
          ]}
        />

        <header className="mt-6 mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Chủ đề: {topicTitle}
          </h1>
          {topicMeta?.description && (
            <p className="text-muted-foreground mb-2">
              {topicMeta.description}
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            {totalPosts > 0
              ? `${totalPosts} bài viết (${totalBlogPosts} blog, ${totalUserPosts} cộng đồng)`
              : `Các bài viết về ${topicTitle}`}
          </p>
        </header>

        {/* Blog Posts Section */}
        {blogPostsData && blogPostsData.data.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Bài viết từ Blog
              </h2>
              {/* View All indicator with back link */}
              {isViewAll && (
                <Link
                  href={`/topics/${topic}`}
                  className="text-sm text-primary hover:underline"
                >
                  ← Quay lại phân trang
                </Link>
              )}
            </div>

            {/* View All indicator */}
            {isViewAll && (
              <p className="text-sm text-muted-foreground mb-4">
                Hiển thị tất cả {blogPostsData.data.length} bài viết
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {blogPostsData.data.map((post) => (
                <TopicPostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination - hide when viewing all */}
            {!isViewAll && blogPostsData.meta.totalPages > 1 && (
              <Pagination
                currentPage={blogPostsData.meta.page}
                totalPages={blogPostsData.meta.totalPages}
                topic={topic}
                totalItems={blogPostsData.meta.total}
              />
            )}
          </section>
        )}

        {/* User Posts Section */}
        {userPostsData && userPostsData.posts.data.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-foreground">
                Bài viết từ Cộng đồng
              </h2>
              {topicMeta?.hashtag && (
                <Link
                  href={`/hashtag/${topicMeta.hashtag}`}
                  className="text-sm text-primary hover:underline"
                >
                  Xem tất cả →
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {userPostsData.posts.data.map((post) => (
                <UserPostCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {(!blogPostsData || blogPostsData.data.length === 0) &&
          (!userPostsData || userPostsData.posts.data.length === 0) && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                Chưa có bài viết nào về chủ đề này
              </p>
              <Link
                href="/blog"
                className="mt-4 inline-block text-primary hover:underline"
              >
                Xem tất cả bài viết
              </Link>
            </div>
          )}

        {/* Related Topics */}
        {relatedTopics.length > 0 && (
          <section className="mt-12 p-6 rounded-lg border border-border bg-card">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Chủ đề liên quan
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedTopics.map((relatedTopic) => {
                const relatedMeta = TOPIC_META[relatedTopic]
                return (
                  <Link
                    key={relatedTopic}
                    href={`/topics/${relatedTopic}`}
                    className="px-4 py-2 rounded-md bg-secondary hover:bg-secondary/80 text-foreground transition-colors"
                  >
                    {relatedMeta?.title || relatedTopic}
                  </Link>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </>
  )
}

function TopicPostCard({ post }: { post: BlogPost }) {
  const postUrl = `/blog/${post.category?.slug || 'uncategorized'}/${post.slug}`
  const featuredImageUrl = transformImageUrl(post.featuredImage)
  const authorAvatarUrl = getAvatarUrl(post.author?.avatar)

  return (
    <article className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={postUrl}>
        {featuredImageUrl ? (
          <div className="relative aspect-video">
            <Image
              src={featuredImageUrl}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="aspect-video bg-muted flex items-center justify-center">
            <span className="text-muted-foreground">Không có ảnh</span>
          </div>
        )}
      </Link>

      <div className="p-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {post.category && (
            <>
              <Link
                href={`/blog?category=${post.category.slug}`}
                className="text-primary hover:underline"
              >
                {post.category.name}
              </Link>
              <span>•</span>
            </>
          )}
          <span>{post.readingTime} phút đọc</span>
        </div>

        <Link href={postUrl}>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {authorAvatarUrl && (
            <Image
              src={authorAvatarUrl}
              alt={post.author?.displayName || post.author?.username || 'Người dùng'}
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
          <span>{post.author?.displayName || post.author?.username || 'Ẩn danh'}</span>
          <span>•</span>
          <time dateTime={post.publishedAt || post.createdAt}>
            {formatDate(post.publishedAt || post.createdAt)}
          </time>
        </div>
      </div>
    </article>
  )
}

function UserPostCard({ post }: { post: Post }) {
  const authorUsername = post.author?.profile?.username || 'unknown'
  const postUrl = `/profile/${authorUsername}/${post.slug || post.id}`
  const title = extractTitle(post.content)
  const excerpt = extractExcerpt(post.content)
  const images = post.images || []
  const hasImage = images.length > 0
  const firstImageUrl = hasImage ? transformImageUrl(images[0]) : null
  const authorAvatarUrl = getAvatarUrl(post.author?.profile?.avatar)

  return (
    <article className="group bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
      <Link href={postUrl}>
        {firstImageUrl ? (
          <div className="relative aspect-video">
            <Image
              src={firstImageUrl}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Bài viết cộng đồng</span>
          </div>
        )}
      </Link>

      <div className="p-4">
        <Link href={postUrl}>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {title}
          </h3>
        </Link>

        {excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {excerpt}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {authorAvatarUrl && (
            <Image
              src={authorAvatarUrl}
              alt={post.author?.profile?.displayName || post.author?.profile?.username || 'User'}
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
          <span>{post.author?.profile?.displayName || post.author?.profile?.username || 'Ẩn danh'}</span>
          <span>•</span>
          <time dateTime={post.createdAt}>
            {formatDate(post.createdAt)}
          </time>
        </div>
      </div>
    </article>
  )
}

// Helper functions
function extractTitle(content: string): string {
  const stripped = content.replace(/<[^>]*>/g, '').replace(/#\w+/g, '').trim()
  return stripped.substring(0, 100) || 'Bài viết'
}

function extractExcerpt(content: string): string {
  const stripped = content.replace(/<[^>]*>/g, '').replace(/#\w+/g, '').trim()
  return stripped.substring(0, 150)
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  topic: string
  totalItems?: number
}

function Pagination({ currentPage, totalPages, topic, totalItems }: PaginationProps) {
  const getPageUrl = (page: number | 'all') => {
    if (page === 'all') return `/topics/${topic}?view=all`
    if (page === 1) return `/topics/${topic}`
    return `/topics/${topic}?page=${page}`
  }

  const pages: (number | string)[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  // Show "View All" only when total items is reasonable (≤100) to avoid performance issues
  const showViewAll = totalItems && totalItems <= 100 && totalPages > 1

  return (
    <nav className="flex flex-col items-center gap-4 mt-8" aria-label="Phân trang">
      <div className="flex justify-center gap-2">
        {currentPage > 1 && (
          <Link
            href={getPageUrl(currentPage - 1)}
            className="px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
          >
            Trước
          </Link>
        )}

        {pages.map((page, idx) =>
          typeof page === 'number' ? (
            <Link
              key={idx}
              href={getPageUrl(page)}
              className={`px-3 py-2 rounded-md transition-colors ${
                page === currentPage
                  ? 'bg-primary text-primary-foreground'
                  : 'border border-border hover:bg-accent'
              }`}
            >
              {page}
            </Link>
          ) : (
            <span key={idx} className="px-3 py-2">
              {page}
            </span>
          )
        )}

        {currentPage < totalPages && (
          <Link
            href={getPageUrl(currentPage + 1)}
            className="px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
          >
            Sau
          </Link>
        )}
      </div>

      {/* View All option for SEO - allows crawlers to see all content on one page */}
      {showViewAll && (
        <Link
          href={getPageUrl('all')}
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Xem tất cả ({totalItems} bài viết)
        </Link>
      )}
    </nav>
  )
}

