import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { Breadcrumb } from '@/components/seo'
import type { BlogPost, BlogCategory, BlogListResponse } from '@/types/blog'
import { stripHtmlTags } from '@/lib/seo/reading-time'
import { transformImageUrl, getAvatarUrl } from '@/lib/image-url'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
const BASE_URL = 'https://chungtoixayweb.vn'

// Force dynamic rendering to avoid static generation errors when API is unavailable
export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<{ page?: string; category?: string; view?: string }>
}

/**
 * Dynamic metadata generation for SEO pagination support
 * - Page 1: Full metadata with indexing
 * - Page 2+ or View All: Modified title, noindex to avoid duplicate content
 */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const params = await searchParams
  const page = Number(params.page) || 1
  const categorySlug = params.category
  const isViewAll = params.view === 'all'

  const baseTitle = 'Blog - Kiến thức lập trình & thiết kế web | ChungToiXayWeb'
  const title = isViewAll
    ? `${baseTitle} - Tất cả bài viết`
    : page > 1
      ? `${baseTitle} - Trang ${page}`
      : baseTitle
  const baseDescription = 'Khám phá các bài viết chuyên sâu về lập trình web, thiết kế UI/UX, SEO và công nghệ mới nhất. Cập nhật kiến thức từ đội ngũ chuyên gia ChungToiXayWeb.'

  // Build canonical URL - View All pages should canonical to page 1
  const canonicalParams = new URLSearchParams()
  if (!isViewAll && page > 1) canonicalParams.set('page', String(page))
  if (categorySlug) canonicalParams.set('category', categorySlug)
  const canonicalQuery = canonicalParams.toString()
  const canonicalUrl = `${BASE_URL}/blog${canonicalQuery ? `?${canonicalQuery}` : ''}`

  const metadata: Metadata = {
    title,
    description: isViewAll
      ? `${baseDescription} - Xem tất cả bài viết`
      : page > 1
        ? `${baseDescription} - Trang ${page}`
        : baseDescription,
    keywords: ['blog lập trình', 'thiết kế web', 'hướng dẫn code', 'SEO', 'React', 'Next.js'],
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'vi': canonicalUrl,
        'x-default': canonicalUrl,
      },
    },
    openGraph: {
      title,
      description: baseDescription,
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

async function getBlogPosts(page = 1, limit = 12, categorySlug?: string): Promise<BlogListResponse | null> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (categorySlug) params.set('categorySlug', categorySlug)
  
  try {
    const res = await fetch(`${API_URL}/blog/posts?${params}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

async function getBlogCategories(): Promise<BlogCategory[] | null> {
  try {
    const res = await fetch(`${API_URL}/blog/categories`, { next: { revalidate: 3600 } })
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

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const categorySlug = params.category
  const isViewAll = params.view === 'all'

  // For View All, fetch up to 100 posts; otherwise use pagination
  const limit = isViewAll ? 100 : 12

  const [postsData, categories] = await Promise.all([
    getBlogPosts(isViewAll ? 1 : page, limit, categorySlug),
    getBlogCategories(),
  ])

  // Find selected category for breadcrumb
  const selectedCategory = categorySlug
    ? categories?.find(cat => cat.slug === categorySlug)
    : null

  // Determine pagination state for rel="next/prev" link tags (not for View All)
  const totalPages = postsData?.meta.totalPages || 1
  const hasNextPage = !isViewAll && page < totalPages
  const hasPrevPage = !isViewAll && page > 1

  // Build page URLs for SEO link tags
  const getPageUrl = (pageNum: number) => {
    const urlParams = new URLSearchParams()
    if (pageNum > 1) urlParams.set('page', String(pageNum))
    if (categorySlug) urlParams.set('category', categorySlug)
    const queryString = urlParams.toString()
    return `${BASE_URL}/blog${queryString ? `?${queryString}` : ''}`
  }

  // CollectionPage JSON-LD schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Blog - ChungToiXayWeb',
    description: 'Bài viết về lập trình web, thiết kế và công nghệ',
    url: `${BASE_URL}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'ChungToiXayWeb',
      url: BASE_URL,
    },
  }

  // Build breadcrumb items dynamically
  const breadcrumbItems: Array<{ label: string; href?: string; truncate?: boolean }> = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Blog', href: selectedCategory ? '/blog' : undefined },
  ]

  // Add category to breadcrumb if filtering by category
  if (selectedCategory) {
    breadcrumbItems.push({ label: selectedCategory.name })
  }

  return (
    <>
      {/* SEO Pagination link tags - hoisted to <head> by Next.js App Router */}
      {hasPrevPage && (
        <link key="pagination-prev" rel="prev" href={getPageUrl(page - 1)} />
      )}
      {hasNextPage && (
        <link key="pagination-next" rel="next" href={getPageUrl(page + 1)} />
      )}

      <script
        key="blog-collection-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />

      <h1 className="sr-only">Blog - Kiến thức lập trình và thiết kế web</h1>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb items={breadcrumbItems} />

        <div className="mt-6 flex flex-col lg:flex-row gap-8">
          {/* Category Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <h2 className="text-lg font-semibold mb-4">Danh mục</h2>
            <nav className="space-y-2">
              <Link
                href="/blog"
                className={`block px-3 py-2 rounded-md transition-colors ${
                  !categorySlug
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                Tất cả bài viết
              </Link>
              {categories?.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/blog?category=${cat.slug}`}
                  className={`block px-3 py-2 rounded-md transition-colors ${
                    categorySlug === cat.slug
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                >
                  {cat.name}
                  <span className="ml-2 text-xs opacity-70">({cat.postCount})</span>
                </Link>
              ))}
            </nav>
          </aside>

          {/* Posts Grid */}
          <main className="flex-1">
            {!postsData || postsData.data.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg">Chưa có bài viết nào</p>
              </div>
            ) : (
              <>
                {/* View All indicator */}
                {isViewAll && (
                  <div className="mb-6 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Hiển thị tất cả {postsData.data.length} bài viết
                    </p>
                    <Link
                      href={categorySlug ? `/blog?category=${categorySlug}` : '/blog'}
                      className="text-sm text-primary hover:underline"
                    >
                      ← Quay lại phân trang
                    </Link>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {postsData.data.map((post) => (
                    <BlogPostCard key={post.id} post={post} />
                  ))}
                </div>

                {/* Pagination - hide when viewing all */}
                {!isViewAll && postsData.meta.totalPages > 1 && (
                  <Pagination
                    currentPage={postsData.meta.page}
                    totalPages={postsData.meta.totalPages}
                    categorySlug={categorySlug}
                    totalItems={postsData.meta.total}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </>
  )
}

function BlogPostCard({ post }: { post: BlogPost }) {
  const postUrl = `/blog/${post.category.slug}/${post.slug}`
  const featuredImageUrl = transformImageUrl(post.featuredImage)
  const authorAvatarUrl = getAvatarUrl(post.author.avatar)

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
          <Link
            href={`/blog?category=${post.category.slug}`}
            className="text-primary hover:underline"
          >
            {post.category.name}
          </Link>
          <span>•</span>
          <span>{post.readingTime} phút đọc</span>
        </div>

        <Link href={postUrl}>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {stripHtmlTags(post.excerpt)}
          </p>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {authorAvatarUrl && (
            <Image
              src={authorAvatarUrl}
              alt={post.author.displayName || post.author.username}
              width={20}
              height={20}
              className="rounded-full"
            />
          )}
          <span>{post.author.displayName || post.author.username}</span>
          <span>•</span>
          <time dateTime={post.publishedAt || post.createdAt}>
            {formatDate(post.publishedAt || post.createdAt)}
          </time>
        </div>
      </div>
    </article>
  )
}

interface PaginationProps {
  currentPage: number
  totalPages: number
  categorySlug?: string
  totalItems?: number
}

function Pagination({ currentPage, totalPages, categorySlug, totalItems }: PaginationProps) {
  const getPageUrl = (page: number | 'all') => {
    const params = new URLSearchParams()
    if (page === 'all') {
      params.set('view', 'all')
    } else if (page > 1) {
      params.set('page', String(page))
    }
    if (categorySlug) params.set('category', categorySlug)
    const queryString = params.toString()
    return `/blog${queryString ? `?${queryString}` : ''}`
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

