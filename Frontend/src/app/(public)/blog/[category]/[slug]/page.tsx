import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumb, ArticleSchema, HowToSchema } from '@/components/seo'
import { TableOfContents } from '@/components/seo/TableOfContents'
import { RelatedUGCPosts } from '@/components/blog/RelatedContent'
import { AuthorCard } from '@/features/blog/components/AuthorCard'
import { BlogViewTracker } from '@/features/blog/components/BlogViewTracker'
import { KeyTakeaways } from '@/features/blog/components/KeyTakeaways'
import { ReadingProgressBar } from '@/features/blog/components/ReadingProgressBar'
import { ScrollToTop } from '@/features/blog/components/ScrollToTop'
import { SocialShareButtons } from '@/features/blog/components/SocialShareButtons'
import { transformImageUrl, getAvatarUrl } from '@/lib/image-url'
import type { BlogPost, TocItem } from '@/types/blog'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api'
const BASE_URL = 'https://chungtoixayweb.vn'

// ISR: Revalidate every hour
export const revalidate = 3600

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const res = await fetch(`${API_URL}/blog/posts/${slug}`, { next: { revalidate: 3600 } })
    if (!res.ok) return null
    const json = await res.json()
    return json.data
  } catch {
    return null
  }
}

interface PageProps {
  params: Promise<{ category: string; slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    return {
      title: 'Bài viết không tồn tại',
    }
  }

  const title = post.metaTitle || post.title
  const description = post.metaDescription || post.excerpt || `Đọc bài viết ${post.title} trên ChungToiXayWeb`

  const postUrl = `${BASE_URL}/blog/${post.category.slug}/${post.slug}`

  return {
    title: `${title} | ChungToiXayWeb`,
    description,
    keywords: post.tags,
    alternates: {
      canonical: postUrl,
      languages: {
        'vi': postUrl,
        'x-default': postUrl,
      },
    },
    openGraph: {
      title,
      description,
      type: 'article',
      locale: 'vi_VN',
      url: postUrl,
      images: post.featuredImage ? [{ url: post.featuredImage }] : undefined,
      publishedTime: post.publishedAt || undefined,
      modifiedTime: post.updatedAt,
      authors: [post.author.displayName || post.author.username],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.featuredImage ? [post.featuredImage] : undefined,
    },
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

function formatISODate(dateString: string | null): string {
  if (!dateString) return new Date().toISOString()
  return new Date(dateString).toISOString()
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params
  const post = await getBlogPost(slug)

  if (!post) {
    notFound()
  }

  const postUrl = `${BASE_URL}/blog/${post.category.slug}/${post.slug}`
  const authorUrl = `${BASE_URL}/profile/${post.author.username}`

  // Calculate word count from content (strip HTML)
  const wordCount = post.content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length

  // Generate HowTo steps from tableOfContents for TUTORIAL posts
  const howToSteps = post.postType === 'TUTORIAL' && post.tableOfContents && post.tableOfContents.length > 0
    ? post.tableOfContents.map((item: TocItem) => ({
        name: item.text,
        text: item.text,
        url: `${postUrl}#${item.id}`,
      }))
    : null

  // Calculate total time for HowTo schema (reading time in ISO 8601 format)
  const totalTimeISO = post.readingTime > 0 ? `PT${post.readingTime}M` : undefined

  return (
    <>
      <ArticleSchema
        title={post.title}
        description={post.excerpt || post.metaDescription || ''}
        image={post.featuredImage}
        datePublished={formatISODate(post.publishedAt)}
        dateModified={formatISODate(post.updatedAt)}
        authorName={post.author.displayName || post.author.username}
        authorUrl={authorUrl}
        authorImage={post.author.avatar}
        authorBio={post.author.bio}
        authorJobTitle={post.author.jobTitle}
        authorCompany={post.author.company}
        authorExpertise={post.author.expertise}
        authorSocialLinks={post.author.socialLinks}
        wordCount={wordCount}
        category={post.category.name}
        url={postUrl}
      />

      {/* HowTo Schema for TUTORIAL posts */}
      {post.postType === 'TUTORIAL' && howToSteps && howToSteps.length > 0 && (
        <HowToSchema
          name={post.title}
          description={post.excerpt || post.metaDescription || `Hướng dẫn ${post.title}`}
          totalTime={totalTimeISO}
          steps={howToSteps}
        />
      )}

      {/* Reading Progress Bar */}
      <ReadingProgressBar />

      <div className="max-w-7xl mx-auto px-4 py-6">
        <Breadcrumb
          items={[
            { label: 'Trang chủ', href: '/' },
            { label: 'Blog', href: '/blog' },
            { label: post.category.name, href: `/blog?category=${post.category.slug}` },
            { label: post.title, truncate: true },
          ]}
        />

        <div className="mt-6 flex flex-col lg:flex-row gap-8">
          {/* Main Content */}
          <article className="flex-1 min-w-0">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Link
                  href={`/blog?category=${post.category.slug}`}
                  className="text-primary hover:underline"
                >
                  {post.category.name}
                </Link>
                <span>•</span>
                <span>{post.readingTime} phút đọc</span>
                <span>•</span>
                <span>{post.viewCount.toLocaleString('vi-VN')} lượt xem</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {post.title}
              </h1>

              {post.excerpt && (
                <p className="text-lg text-muted-foreground mb-6">
                  {post.excerpt}
                </p>
              )}

              <div className="flex items-center gap-3">
                {post.author.avatar && (
                  <Image
                    src={getAvatarUrl(post.author.avatar) || ''}
                    alt={post.author.displayName || post.author.username}
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
                <div>
                  <Link href={authorUrl} className="font-medium hover:text-primary">
                    {post.author.displayName || post.author.username}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    <time dateTime={post.publishedAt || post.createdAt}>
                      {formatDate(post.publishedAt || post.createdAt)}
                    </time>
                  </p>
                </div>
              </div>

              {/* Social Share Buttons */}
              <SocialShareButtons url={postUrl} title={post.title} className="mt-4" />
            </header>

            {/* Featured Image */}
            {post.featuredImage && (
              <div className="relative aspect-video mb-8 rounded-lg overflow-hidden">
                <Image
                  src={transformImageUrl(post.featuredImage) || ''}
                  alt={post.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 800px"
                />
              </div>
            )}

            {/* Key Takeaways */}
            {post.takeaways && post.takeaways.length > 0 && (
              <KeyTakeaways takeaways={post.takeaways} />
            )}

            {/* Article Content */}
            <div
              className="prose prose-neutral dark:prose-invert max-w-none
                prose-headings:scroll-mt-24
                prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-lg"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-accent text-accent-foreground text-sm rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Author Section */}
            <div className="mt-8 pt-6 border-t border-border">
              <AuthorCard author={post.author} />
            </div>

            {/* Related UGC Posts from Community */}
            {post.tags && post.tags.length > 0 && (
              <RelatedUGCPosts tags={post.tags} />
            )}
          </article>

          {/* Sidebar with Table of Contents */}
          {post.tableOfContents && post.tableOfContents.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <TableOfContents items={post.tableOfContents} />
            </aside>
          )}
        </div>
      </div>

      {/* Scroll to Top Button */}
      <ScrollToTop />

      {/* Client-side view tracking */}
      <BlogViewTracker slug={post.slug} />
    </>
  )
}
